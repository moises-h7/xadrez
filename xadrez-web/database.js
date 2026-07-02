const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const caminhoBanco = path.join(__dirname, 'database.json');

let dados = {
  users: [],
  games: []
};

// Lê os dados do arquivo JSON
function lerBanco() {
  try {
    if (fs.existsSync(caminhoBanco)) {
      const conteudo = fs.readFileSync(caminhoBanco, 'utf8');
      dados = JSON.parse(conteudo);
    }
  } catch (erro) {
    console.error('Erro ao ler o arquivo do banco, reiniciando dados:', erro);
  }
}

// Grava os dados no arquivo JSON
function escreverBanco() {
  try {
    fs.writeFileSync(caminhoBanco, JSON.stringify(dados, null, 2), 'utf8');
  } catch (erro) {
    console.error('Erro ao gravar no arquivo do banco:', erro);
  }
}

// Inicializa as tabelas e o usuário administrador padrão
async function inicializar() {
  lerBanco();
  if (!dados.users) dados.users = [];
  if (!dados.games) dados.games = [];

  // Cria o usuário administrador padrão
  const emailPadrao = 'admin@example.com';
  const existente = dados.users.find(u => u.email === emailPadrao);
  if (!existente) {
    const hashDaSenha = await bcrypt.hash('password123', 10);
    dados.users.push({
      id: 1,
      email: emailPadrao,
      password_hash: hashDaSenha,
      name: 'Chess Master',
      avatar_base64: null,
      updated_at: Date.now()
    });
    escreverBanco();
    console.log('Usuário padrão semeado: admin@example.com / password123');
  }
}

// Obtém um único registro
async function obter(consulta, parametros = []) {
  lerBanco();
  if (consulta.includes('SELECT * FROM users WHERE email = ?')) {
    return dados.users.find(u => u.email === parametros[0]) || null;
  }
  if (consulta.includes('SELECT * FROM users WHERE id = ?')) {
    return dados.users.find(u => u.id === parametros[0]) || null;
  }
  if (consulta.includes('SELECT id FROM games WHERE id = ? AND user_id = ?')) {
    return dados.games.find(j => j.id === parametros[0] && j.user_id === parametros[1]) || null;
  }
  if (consulta.includes('SELECT * FROM games WHERE id = ?')) {
    return dados.games.find(j => j.id === parametros[0]) || null;
  }
  return null;
}

// Executa uma inserção ou atualização
async function executar(consulta, parametros = []) {
  lerBanco();
  if (consulta.includes('INSERT INTO users')) {
    const [email, hashDaSenha, nome, dataAtualizacao] = parametros;
    const proximoId = dados.users.length > 0 ? Math.max(...dados.users.map(u => u.id)) + 1 : 1;
    dados.users.push({
      id: proximoId,
      email,
      password_hash: hashDaSenha,
      name: nome,
      avatar_base64: null,
      updated_at: dataAtualizacao
    });
    escreverBanco();
    return { lastID: proximoId };
  }
  if (consulta.includes('UPDATE users SET name = ?')) {
    const [nome, avatarBase64, dataAtualizacao, idUsuario] = parametros;
    const usuario = dados.users.find(u => u.id === idUsuario);
    if (usuario) {
      usuario.name = nome;
      usuario.avatar_base64 = avatarBase64;
      usuario.updated_at = dataAtualizacao;
      escreverBanco();
    }
    return {};
  }
  if (consulta.includes('INSERT INTO games')) {
    const [
      id, idUsuario, dataJogo, tipoOponente, nomeOponente, dificuldadeRobot,
      controleTempo, corJogador, resultado, finalizadoPor, motivoEmpate,
      duracaoSegundos, totalLances, pgn, dataAtualizacao
    ] = parametros;
    dados.games.push({
      id,
      user_id: idUsuario,
      date: dataJogo,
      opponent_type: tipoOponente,
      opponent_name: nomeOponente,
      engine_difficulty: dificuldadeRobot,
      time_control: controleTempo,
      player_color: corJogador,
      result: resultado,
      ended_by: finalizadoPor,
      draw_reason: motivoEmpate,
      duration_seconds: duracaoSegundos,
      total_moves: totalLances,
      pgn,
      updated_at: dataAtualizacao
    });
    escreverBanco();
    return {};
  }
  return {};
}

// Obtém múltiplos registros
async function obterTodos(consulta, parametros = []) {
  lerBanco();
  if (consulta.includes('SELECT * FROM games WHERE user_id = ? AND updated_at > ?')) {
    const [idUsuario, timestampUltimaSincronizacao, ...idsExcluidos] = parametros;
    let jogos = dados.games.filter(j => j.user_id === idUsuario && j.updated_at > timestampUltimaSincronizacao);
    if (idsExcluidos.length > 0) {
      jogos = jogos.filter(j => !idsExcluidos.includes(j.id));
    }
    return jogos;
  }
  return [];
}

module.exports = {
  db: {
    close: () => {}
  },
  init: inicializar,
  run: executar,
  get: obter,
  all: obterTodos
};
