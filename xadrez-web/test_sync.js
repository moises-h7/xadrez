const assert = require('assert');
const bancoDeDados = require('./database');
const jwt = require('jsonwebtoken');

// Criação da instância direta do Fastify para testes com fastify.inject
const fastify = require('fastify')({ logger: false });
const bcrypt = require('bcryptjs');

const CHAVE_SECRETA_JWT = 'super-secret-chess-key-12345';

// Habilita o CORS nos testes
fastify.addHook('onSend', (requisicao, resposta, payload, concluido) => {
  resposta.header('Access-Control-Allow-Origin', '*');
  resposta.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  resposta.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  concluido();
});

fastify.options('/*', async () => '');

const limitesDeFrequencia = new Map();
function limitarRequisicoes(requisicao, resposta, concluido) {
  const ip = requisicao.ip;
  const agora = Date.now();
  let dadosLimite = limitesDeFrequencia.get(ip);
  if (!dadosLimite || (agora - dadosLimite.inicioJanela > 60000)) {
    dadosLimite = { contador: 1, inicioJanela: agora };
    limitesDeFrequencia.set(ip, dadosLimite);
  } else {
    dadosLimite.contador++;
  }
  if (dadosLimite.contador > 60) {
    resposta.status(429).send({ error: 'Too Many Requests', message: 'Limite de requisições excedido' });
    return;
  }
  concluido();
}

function sanitizarPgn(pgn) {
  if (typeof pgn !== 'string') return '';
  return pgn
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

async function autenticar(requisicao, resposta) {
  try {
    const cabecalhoAutorizacao = requisicao.headers.authorization;
    if (!cabecalhoAutorizacao || !cabecalhoAutorizacao.startsWith('Bearer ')) {
      resposta.status(401).send({ error: 'Unauthorized', message: 'Token não fornecido' });
      return;
    }
    const token = cabecalhoAutorizacao.split(' ')[1];
    const decodificado = jwt.verify(token, CHAVE_SECRETA_JWT);
    requisicao.usuarioLogado = decodificado;
  } catch (erro) {
    resposta.status(401).send({ error: 'Unauthorized', message: 'Token inválido ou expirado' });
  }
}

// Rotas
fastify.post('/api/auth/login', async (requisicao, resposta) => {
  const { email, password } = requisicao.body || {};
  if (!email || !password) {
    resposta.status(400).send({ error: 'Bad Request', message: 'Email e senha são obrigatórios' });
    return;
  }
  let usuario = await bancoDeDados.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!usuario) {
    const hashDaSenha = await bcrypt.hash(password, 10);
    const nomeUsuario = email.split('@')[0];
    await bancoDeDados.run(
      'INSERT INTO users (email, password_hash, name, updated_at) VALUES (?, ?, ?, ?)',
      [email, hashDaSenha, nomeUsuario, Date.now()]
    );
    usuario = await bancoDeDados.get('SELECT * FROM users WHERE email = ?', [email]);
  } else {
    const senhaCorreta = await bcrypt.compare(password, usuario.password_hash);
    if (!senhaCorreta) {
      resposta.status(401).send({ error: 'Unauthorized', message: 'Senha incorreta' });
      return;
    }
  }
  const token = jwt.sign({ id: usuario.id, email: usuario.email }, CHAVE_SECRETA_JWT, { expiresIn: '7d' });
  return { token, user: { name: usuario.name, email: usuario.email } };
});

fastify.post('/api/sync', { preHandler: [limitarRequisicoes, autenticar] }, async (requisicao, resposta) => {
  const idUsuario = requisicao.usuarioLogado.id;
  const { lastSyncTimestamp = 0, localGames = [], profile } = requisicao.body || {};
  const agora = Date.now();

  if (profile && typeof profile.name === 'string') {
    const usuario = await bancoDeDados.get('SELECT * FROM users WHERE id = ?', [idUsuario]);
    if (usuario && usuario.updated_at < lastSyncTimestamp) {
      await bancoDeDados.run(
        'UPDATE users SET name = ?, avatar_base64 = ?, updated_at = ? WHERE id = ?',
        [profile.name, profile.avatarBase64 || null, agora, idUsuario]
      );
    }
  }

  const idsJogosLocais = [];
  for (const jogo of localGames) {
    if (!jogo.id) continue;
    idsJogosLocais.push(jogo.id);
    const jogoExistente = await bancoDeDados.get('SELECT id FROM games WHERE id = ? AND user_id = ?', [jogo.id, idUsuario]);
    if (!jogoExistente) {
      const pgnSanitizado = sanitizarPgn(jogo.pgn);
      await bancoDeDados.run(
        `INSERT INTO games (
          id, user_id, date, opponent_type, opponent_name, engine_difficulty,
          time_control, player_color, result, ended_by, draw_reason,
          duration_seconds, total_moves, pgn, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          jogo.id,
          idUsuario,
          jogo.date || agora,
          jogo.opponentType || 'local',
          jogo.opponentName || 'Oponente',
          jogo.engineDifficulty !== undefined ? jogo.engineDifficulty : null,
          jogo.timeControl || 'sem tempo',
          jogo.playerColor || 'w',
          jogo.result || 'draw',
          jogo.endedBy || 'draw_agreement',
          jogo.drawReason || null,
          jogo.durationSeconds || 0,
          jogo.totalMoves || 0,
          pgnSanitizado,
          agora
        ]
      );
    }
  }

  let consultaNovosJogos = 'SELECT * FROM games WHERE user_id = ? AND updated_at > ?';
  const parametros = [idUsuario, lastSyncTimestamp];
  if (idsJogosLocais.length > 0) {
    const marcadores = idsJogosLocais.map(() => '?').join(',');
    consultaNovosJogos += ` AND id NOT IN (${marcadores})`;
    parametros.push(...idsJogosLocais);
  }

  const jogosDoBanco = await bancoDeDados.all(consultaNovosJogos, parametros);
  const novosJogosDaNuvem = jogosDoBanco.map(j => ({
    id: j.id,
    date: j.date,
    opponentType: j.opponent_type,
    opponentName: j.opponent_name,
    engineDifficulty: j.engine_difficulty,
    timeControl: j.time_control,
    playerColor: j.player_color,
    result: j.result,
    endedBy: j.ended_by,
    drawReason: j.draw_reason,
    durationSeconds: j.duration_seconds,
    totalMoves: j.total_moves,
    pgn: j.pgn
  }));

  return {
    status: 'success',
    newGamesFromCloud: novosJogosDaNuvem,
    updatedAt: agora
  };
});

async function executarTestes() {
  console.log('Inicializando banco de dados de teste...');
  await bancoDeDados.init();

  // Teste 1: Login de Usuário Semeado
  console.log('Testando Teste 1: Login do usuário semeado...');
  const respostaLogin = await fastify.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      email: 'admin@example.com',
      password: 'password123'
    }
  });

  assert.strictEqual(respostaLogin.statusCode, 200, 'Código de status do login deve ser 200');
  const dadosLogin = JSON.parse(respostaLogin.body);
  assert.ok(dadosLogin.token, 'A resposta deve conter um token JWT');
  assert.strictEqual(dadosLogin.user.email, 'admin@example.com', 'O email do usuário na resposta deve coincidir');
  console.log('Teste 1 Aprovado: Login efetuado com sucesso!');

  const token = dadosLogin.token;

  // Teste 2: Auto-cadastro no Login
  console.log('Testando Teste 2: Auto-cadastro no login...');
  const emailNovo = `usuario_${Date.now()}@example.com`;
  const respostaCadastro = await fastify.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      email: emailNovo,
      password: 'novasenha123'
    }
  });

  assert.strictEqual(respostaCadastro.statusCode, 200, 'Código de status do auto-cadastro deve ser 200');
  const dadosCadastro = JSON.parse(respostaCadastro.body);
  assert.ok(dadosCadastro.token, 'A resposta deve conter um token JWT para o usuário cadastrado automaticamente');
  assert.strictEqual(dadosCadastro.user.email, emailNovo, 'O email deve coincidir com o do novo cadastro');
  console.log('Teste 2 Aprovado: Auto-cadastro efetuado com sucesso!');

  // Teste 3: Sincronização de jogos locais
  console.log('Testando Teste 3: Sincronização de jogos locais...');
  const idJogo = `jogo_${Date.now()}`;
  const respostaSincronizacao = await fastify.inject({
    method: 'POST',
    url: '/api/sync',
    headers: {
      Authorization: `Bearer ${token}`
    },
    payload: {
      lastSyncTimestamp: 0,
      localGames: [
        {
          id: idJogo,
          date: Date.now(),
          opponentType: 'engine',
          opponentName: 'Stockfish Nível 4',
          engineDifficulty: 4,
          timeControl: '10m',
          playerColor: 'w',
          result: 'win',
          endedBy: 'checkmate',
          drawReason: null,
          durationSeconds: 300,
          totalMoves: 15,
          pgn: '1. e4 e5 <script>alert("XSS")</script>' // Contém tag maliciosa para testar sanitização
        }
      ]
    }
  });

  assert.strictEqual(respostaSincronizacao.statusCode, 200, 'Código de status da sincronização deve ser 200');
  const dadosSincronizacao = JSON.parse(respostaSincronizacao.body);
  assert.strictEqual(dadosSincronizacao.status, 'success', 'O campo de status deve ser success');
  console.log('Teste 3 Aprovado: Requisição de sincronização com sucesso!');

  // Teste 4: Verificar se o jogo foi salvo e o PGN sanitizado
  console.log('Testando Teste 4: Verificando inserção no banco e sanitização de PGN...');
  const jogoSalvo = await bancoDeDados.get('SELECT * FROM games WHERE id = ?', [idJogo]);
  assert.ok(jogoSalvo, 'O jogo deve estar salvo no banco de dados');
  assert.strictEqual(jogoSalvo.opponent_name, 'Stockfish Nível 4', 'O nome do oponente deve coincidir');
  assert.ok(!jogoSalvo.pgn.includes('<script>'), 'O PGN deve ser higienizado contra XSS');
  assert.ok(jogoSalvo.pgn.includes('&lt;script&gt;'), 'Os caracteres HTML do PGN devem estar escapados');
  console.log('Teste 4 Aprovado: Jogo salvo e sanitizado com sucesso!');

  // Teste 5: Limitador de Frequência (Rate Limiting)
  console.log('Testando Teste 5: Limitador de Frequência (limite de 60 requisições por minuto)...');
  // Simulando 60 requisições para estourar o limite na 61ª
  for (let i = 0; i < 60; i++) {
    await fastify.inject({
      method: 'POST',
      url: '/api/sync',
      headers: {
        Authorization: `Bearer ${token}`
      },
      payload: { lastSyncTimestamp: Date.now(), localGames: [] }
    });
  }

  const respostaLimiteExcedido = await fastify.inject({
    method: 'POST',
    url: '/api/sync',
    headers: {
      Authorization: `Bearer ${token}`
    },
    payload: { lastSyncTimestamp: Date.now(), localGames: [] }
  });

  assert.strictEqual(respostaLimiteExcedido.statusCode, 429, 'A 61ª requisição deve retornar status 429');
  console.log('Teste 5 Aprovado: Limitador de frequência funcionando!');

  console.log('Todos os testes passaram com sucesso!');
  bancoDeDados.db.close();
}

executarTestes().catch(erro => {
  console.error('Falha nos testes:', erro);
  process.exit(1);
});
