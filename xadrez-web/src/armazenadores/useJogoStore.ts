import { create } from 'zustand';
import { Chess } from 'chess.js';
import { ConfiguracaoJogo, LanceHistorico } from '../tipos';

interface EstadoJogo {
  jogo: Chess;
  fen: string;
  pgn: string;
  historicoLances: LanceHistorico[];
  tempoBrancas: number; // em milissegundos
  tempoPretas: number;  // em milissegundos
  corAtiva: 'w' | 'b';
  statusJogo: 'ocioso' | 'jogando' | 'empate' | 'xeque_mate' | 'tempo_esgotado' | 'desistencia';
  vencedor: 'w' | 'b' | null;
  motivoEmpate: 'afogamento' | 'material_insuficiente' | 'tripla_repeticao' | '50_movimentos' | 'acordo' | null;
  configuracao: ConfiguracaoJogo | null;
  inicioTurnoTimestamp: number | null;
  pausado: boolean;

  // Ações
  configurarJogo: (config: ConfiguracaoJogo) => void;
  fazerLance: (de: string, para: string, promocao?: string) => boolean;
  atualizarRelogios: () => void;
  desistir: (cor: 'w' | 'b') => void;
  proporEmpate: () => void;
  alternarPausa: () => void;
  encerrarPorTempo: () => void;
  reiniciarJogo: () => void;
}

export const useJogoStore = create<EstadoJogo>((set, get) => {
  const jogoPadrao = new Chess();

  return {
    jogo: jogoPadrao,
    fen: jogoPadrao.fen(),
    pgn: '',
    historicoLances: [],
    tempoBrancas: 0,
    tempoPretas: 0,
    corAtiva: 'w',
    statusJogo: 'ocioso',
    vencedor: null,
    motivoEmpate: null,
    configuracao: null,
    inicioTurnoTimestamp: null,
    pausado: false,

    configurarJogo: (config) => {
      const novoJogo = new Chess();
      
      // Define a cor de forma randômica se aplicável
      let corJogadorAtribuida = config.corJogador;
      if (config.modo === 'robo' && config.corJogador === 'random') {
        corJogadorAtribuida = Math.random() < 0.5 ? 'w' : 'b';
      }

      // Calcula os tempos iniciais (milisegundos)
      const tempoInicial = config.tempoLimiteMinutos * 60 * 1000;

      set({
        jogo: novoJogo,
        fen: novoJogo.fen(),
        pgn: '',
        historicoLances: [],
        tempoBrancas: tempoInicial,
        tempoPretas: tempoInicial,
        corAtiva: 'w',
        statusJogo: 'jogando',
        vencedor: null,
        motivoEmpate: null,
        configuracao: {
          ...config,
          corJogador: corJogadorAtribuida // atualiza cor caso randomizada
        },
        inicioTurnoTimestamp: Date.now(),
        pausado: false,
      });
    },

    fazerLance: (de, para, promocao) => {
      const { jogo, statusJogo, pausado, inicioTurnoTimestamp, tempoBrancas, tempoPretas, corAtiva, configuracao, historicoLances } = get();

      if (statusJogo !== 'jogando' || pausado) return false;

      try {
        const corLance = jogo.turn();

        // Tenta realizar o movimento
        const lanceEfetuado = jogo.move({
          from: de,
          to: para,
          promotion: promocao
        });

        if (lanceEfetuado) {
          const agora = Date.now();
          const tempoDecorrido = inicioTurnoTimestamp ? agora - inicioTurnoTimestamp : 0;

          // Deduz o tempo gasto do relógio do jogador atual
          let novoTempoBrancas = tempoBrancas;
          let novoTempoPretas = tempoPretas;

          if (configuracao && configuracao.tempoLimiteMinutos > 0) {
            if (corAtiva === 'w') {
              novoTempoBrancas = Math.max(0, tempoBrancas - tempoDecorrido);
            } else {
              novoTempoPretas = Math.max(0, tempoPretas - tempoDecorrido);
            }
          }

          // Verifica finais de jogo
          let statusAtual = 'jogando' as any;
          let vencedorAtual = null as any;
          let motivoEmpateAtual = null as any;

          if (jogo.isCheckmate()) {
            statusAtual = 'xeque_mate';
            vencedorAtual = corLance; // Quem jogou deu xeque-mate
          } else if (jogo.isDraw()) {
            statusAtual = 'empate';
            if (jogo.isStalemate()) {
              motivoEmpateAtual = 'afogamento';
            } else if (jogo.isInsufficientMaterial()) {
              motivoEmpateAtual = 'material_insuficiente';
            } else if (jogo.isThreefoldRepetition()) {
              motivoEmpateAtual = 'tripla_repeticao';
            } else {
              motivoEmpateAtual = '50_movimentos';
            }
          }

          const novoLance: LanceHistorico = {
            san: lanceEfetuado.san,
            fenDepois: jogo.fen(),
            tempoRestanteBrancas: novoTempoBrancas,
            tempoRestantePretas: novoTempoPretas,
            timestamp: agora
          };

          set({
            fen: jogo.fen(),
            pgn: jogo.pgn(),
            historicoLances: [...historicoLances, novoLance],
            tempoBrancas: novoTempoBrancas,
            tempoPretas: novoTempoPretas,
            corAtiva: jogo.turn(),
            statusJogo: statusAtual,
            vencedor: vencedorAtual,
            motivoEmpate: motivoEmpateAtual,
            inicioTurnoTimestamp: agora
          });

          return true;
        }
      } catch (erro) {
        console.warn('Lance inválido detectado:', erro);
        return false;
      }

      return false;
    },

    atualizarRelogios: () => {
      const { statusJogo, pausado, configuracao, corAtiva, inicioTurnoTimestamp, tempoBrancas, tempoPretas, encerrarPorTempo } = get();

      if (statusJogo !== 'jogando' || pausado || !configuracao || configuracao.tempoLimiteMinutos === 0 || !inicioTurnoTimestamp) {
        return;
      }

      const agora = Date.now();
      const tempoDecorrido = agora - inicioTurnoTimestamp;

      if (corAtiva === 'w') {
        const tempoRestante = tempoBrancas - tempoDecorrido;
        if (tempoRestante <= 0) {
          set({ tempoBrancas: 0 });
          encerrarPorTempo();
        } else {
          set({ tempoBrancas: tempoRestante, inicioTurnoTimestamp: agora });
        }
      } else {
        const tempoRestante = tempoPretas - tempoDecorrido;
        if (tempoRestante <= 0) {
          set({ tempoPretas: 0 });
          encerrarPorTempo();
        } else {
          set({ tempoPretas: tempoRestante, inicioTurnoTimestamp: agora });
        }
      }
    },

    desistir: (cor) => {
      const { statusJogo } = get();
      if (statusJogo !== 'jogando') return;

      set({
        statusJogo: 'desistencia',
        vencedor: cor === 'w' ? 'b' : 'w'
      });
    },

    proporEmpate: () => {
      const { statusJogo } = get();
      if (statusJogo !== 'jogando') return;

      set({
        statusJogo: 'empate',
        motivoEmpate: 'acordo'
      });
    },

    alternarPausa: () => {
      const { statusJogo, pausado, corAtiva, inicioTurnoTimestamp, tempoBrancas, tempoPretas } = get();
      if (statusJogo !== 'jogando') return;

      const agora = Date.now();
      if (!pausado) {
        // Pausando: Deduz o tempo acumulado no turno
        const tempoDecorrido = inicioTurnoTimestamp ? agora - inicioTurnoTimestamp : 0;
        if (corAtiva === 'w') {
          set({
            tempoBrancas: Math.max(0, tempoBrancas - tempoDecorrido),
            pausado: true,
            inicioTurnoTimestamp: null
          });
        } else {
          set({
            tempoPretas: Math.max(0, tempoPretas - tempoDecorrido),
            pausado: true,
            inicioTurnoTimestamp: null
          });
        }
      } else {
        // Retomando a partida
        set({
          pausado: false,
          inicioTurnoTimestamp: agora
        });
      }
    },

    encerrarPorTempo: () => {
      const { corAtiva } = get();
      set({
        statusJogo: 'tempo_esgotado',
        vencedor: corAtiva === 'w' ? 'b' : 'w'
      });
    },

    reiniciarJogo: () => {
      set({
        jogo: new Chess(),
        fen: new Chess().fen(),
        pgn: '',
        historicoLances: [],
        tempoBrancas: 0,
        tempoPretas: 0,
        corAtiva: 'w',
        statusJogo: 'ocioso',
        vencedor: null,
        motivoEmpate: null,
        configuracao: null,
        inicioTurnoTimestamp: null,
        pausado: false
      });
    }
  };
});
