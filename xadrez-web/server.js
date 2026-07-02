const fastify = require('fastify')({ logger: true });
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bancoDeDados = require('./database');

const CHAVE_SECRETA_JWT = process.env.JWT_SECRET || 'super-secret-chess-key-12345';

// 1. Habilita o CORS sem pacotes adicionais
fastify.addHook('onSend', (requisicao, resposta, payload, concluido) => {
  resposta.header('Access-Control-Allow-Origin', '*');
  resposta.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  resposta.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  concluido();
});

fastify.options('/*', async (requisicao, resposta) => {
  return '';
});

// 2. Limitador de Frequência Simples em Memória (Máximo 60 requisições por minuto por IP)
const limitesDeFrequencia = new Map();
setInterval(() => {
  const agora = Date.now();
  for (const [ip, dadosLimite] of limitesDeFrequencia.entries()) {
    if (agora - dadosLimite.inicioJanela > 60000) {
      limitesDeFrequencia.delete(ip);
    }
  }
}, 60000);

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
    resposta.status(429).send({ error: 'Too Many Requests', message: 'Limite de requisições excedido. Máximo de 60 por minuto.' });
    return;
  }
  concluido();
}

// 3. Sanitizador de PGN para evitar XSS
function sanitizarPgn(pgn) {
  if (typeof pgn !== 'string') return '';
  return pgn
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// 4. Middleware de Autenticação
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

// 5. Rotas
// POST /api/auth/login
fastify.post('/api/auth/login', async (requisicao, resposta) => {
  const { email, password } = requisicao.body || {};
  if (!email || !password) {
    resposta.status(400).send({ error: 'Bad Request', message: 'Email e senha são obrigatórios' });
    return;
  }

  try {
    let usuario = await bancoDeDados.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!usuario) {
      // Cadastro automático no login caso o usuário não exista
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
    return {
      token,
      user: {
        name: usuario.name,
        email: usuario.email
      }
    };
  } catch (erro) {
    fastify.log.error(erro);
    resposta.status(500).send({ error: 'Internal Server Error', message: 'Erro no servidor' });
  }
});

// POST /api/sync
fastify.post('/api/sync', { preHandler: [limitarRequisicoes, autenticar] }, async (requisicao, resposta) => {
  const idUsuario = requisicao.usuarioLogado.id;
  const { lastSyncTimestamp = 0, localGames = [], profile } = requisicao.body || {};

  try {
    const agora = Date.now();

    // Sincroniza o Perfil
    if (profile && typeof profile.name === 'string') {
      const usuario = await bancoDeDados.get('SELECT * FROM users WHERE id = ?', [idUsuario]);
      if (usuario && usuario.updated_at < lastSyncTimestamp) {
        await bancoDeDados.run(
          'UPDATE users SET name = ?, avatar_base64 = ?, updated_at = ? WHERE id = ?',
          [profile.name, profile.avatarBase64 || null, agora, idUsuario]
        );
      }
    }

    // Sincroniza as Partidas
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

    // Busca novas partidas do banco remoto posteriores ao lastSyncTimestamp
    // Ignora as partidas que o cliente acabou de enviar para evitar redundância
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
  } catch (erro) {
    fastify.log.error(erro);
    resposta.status(500).send({ error: 'Internal Server Error', message: 'Erro na sincronização' });
  }
});

// Inicia o Servidor
async function iniciar() {
  try {
    await bancoDeDados.init();
    const porta = process.env.PORT || 3000;
    await fastify.listen(porta, '0.0.0.0');
    console.log(`Servidor rodando em http://localhost:${porta}`);
  } catch (erro) {
    fastify.log.error(erro);
    process.exit(1);
  }
}

iniciar();
