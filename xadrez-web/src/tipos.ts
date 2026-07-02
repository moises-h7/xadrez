export interface LanceHistorico {
  san: string;
  fenDepois: string;
  tempoRestanteBrancas: number; // em milissegundos
  tempoRestantePretas: number;  // em milissegundos
  timestamp: number;            // Epoch timestamp do lance
}

export interface ConfiguracaoJogo {
  modo: 'robo' | 'local';
  dificuldadeRobo: number;       // 1 a 5
  corJogador: 'w' | 'b' | 'random';
  tempoLimiteMinutos: number;    // 0 para sem tempo, ou 30, 10, 5, 3, 1
  rotacaoAutomatica: boolean;
  corJogador1: 'w' | 'b' | 'random';
  corJogador2: 'w' | 'b' | 'random';
}

export interface Partida {
  id: string;
  data: number;                 // Epoch timestamp do jogo
  tipoOponente: 'engine' | 'local';
  nomeOponente: string;
  dificuldadeEngine: number | null;
  controleTempo: string;
  corJogador: 'w' | 'b';
  resultado: 'win' | 'loss' | 'draw';
  finalizadoPor: 'checkmate' | 'draw_agreement' | 'draw_stalemate' | 'draw_insufficient' | 'draw_repetition' | 'draw_50moves' | 'timeout' | 'resigned';
  motivoEmpate: string | null;
  duracaoSegundos: number;
  totalLances: number;
  pgn: string;
  historicoLances: LanceHistorico[]; // Para reproduzir com ritmo original
}

export interface PerfilUsuario {
  nome: string;
  fotoBase64: string | null;
}
