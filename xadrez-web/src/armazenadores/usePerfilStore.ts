import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Partida, PerfilUsuario } from '../tipos';

interface EstadoPerfil {
  perfilGeral: PerfilUsuario;
  oponenteLocal: PerfilUsuario;
  historicoPartidas: Partida[];
  
  // Estado de Autenticação e Nuvem
  token: string | null;
  usuarioLogado: { nome: string; email: string } | null;
  ultimoSyncTimestamp: number;
  sincronizando: boolean;
  erroAutenticacao: string | null;
  erroSincronizacao: string | null;

  // Ações
  definirPerfilGeral: (nome: string, fotoBase64: string | null) => void;
  definirOponenteLocal: (nome: string, fotoBase64: string | null) => void;
  adicionarPartida: (partida: Partida) => void;
  fazerLogin: (email: string, senha: string) => Promise<boolean>;
  deslogar: () => void;
  sincronizarComNuvem: () => Promise<boolean>;
}

export const usePerfilStore = create<EstadoPerfil>()(
  persist(
    (set, get) => ({
      perfilGeral: {
        nome: 'Jogador Local',
        fotoBase64: null,
      },
      oponenteLocal: {
        nome: 'Oponente Local',
        fotoBase64: null,
      },
      historicoPartidas: [],
      token: null,
      usuarioLogado: null,
      ultimoSyncTimestamp: 0,
      sincronizando: false,
      erroAutenticacao: null,
      erroSincronizacao: null,

      definirPerfilGeral: (nome, fotoBase64) => set((estado) => ({
        perfilGeral: { nome, fotoBase64 }
      })),

      definirOponenteLocal: (nome, fotoBase64) => set((estado) => ({
        oponenteLocal: { nome, fotoBase64 }
      })),

      adicionarPartida: (partida) => set((estado) => ({
        historicoPartidas: [partida, ...estado.historicoPartidas]
      })),

      fazerLogin: async (email, senha) => {
        set({ sincronizando: true, erroAutenticacao: null });
        try {
          const resposta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: senha })
          });

          if (!resposta.ok) {
            const erro = await resposta.json();
            throw new Error(erro.message || 'Credenciais inválidas ou erro no login.');
          }

          const dados = await resposta.json();
          
          set({
            token: dados.token,
            usuarioLogado: {
              nome: dados.user.name,
              email: dados.user.email
            },
            sincronizando: false
          });

          // Executa a primeira sincronização logo após o login
          await get().sincronizarComNuvem();
          return true;
        } catch (erro: any) {
          set({ erroAutenticacao: erro.message || 'Erro de conexão.', sincronizando: false });
          return false;
        }
      },

      deslogar: () => set({
        token: null,
        usuarioLogado: null,
        ultimoSyncTimestamp: 0,
        erroAutenticacao: null,
        erroSincronizacao: null
      }),

      sincronizarComNuvem: async () => {
        const { token, ultimoSyncTimestamp, historicoPartidas, perfilGeral } = get();
        if (!token) return false;

        set({ sincronizando: true, erroSincronizacao: null });

        try {
          // Mapeia o histórico local para o formato camelCase do backend Fastify
          const partidasLocaisMapeadas = historicoPartidas.map(p => ({
            id: p.id,
            date: p.data,
            opponentType: p.tipoOponente,
            opponentName: p.nomeOponente,
            engineDifficulty: p.dificuldadeEngine,
            timeControl: p.controleTempo,
            playerColor: p.corJogador,
            result: p.resultado,
            endedBy: p.finalizadoPor,
            drawReason: p.motivoEmpate,
            durationSeconds: p.duracaoSegundos,
            totalMoves: p.totalLances,
            pgn: p.pgn
          }));

          const resposta = await fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              lastSyncTimestamp: ultimoSyncTimestamp,
              localGames: partidasLocaisMapeadas,
              profile: {
                name: perfilGeral.nome,
                avatarBase64: perfilGeral.fotoBase64
              }
            })
          });

          if (!resposta.ok) {
            const erro = await resposta.json();
            throw new Error(erro.message || 'Erro ao sincronizar com a nuvem.');
          }

          const dados = await resposta.json();

          if (dados.status === 'success') {
            // Mapeia novas partidas recebidas da nuvem para o formato do estado em Português
            const novasPartidasMapeadas: Partida[] = (dados.newGamesFromCloud || []).map((j: any) => ({
              id: j.id,
              data: j.date,
              tipoOponente: j.opponentType,
              nomeOponente: j.opponentName,
              dificuldadeEngine: j.engineDifficulty,
              controleTempo: j.timeControl,
              corJogador: j.playerColor,
              resultado: j.result,
              finalizadoPor: j.endedBy,
              motivoEmpate: j.drawReason,
              duracaoSegundos: j.durationSeconds,
              totalLances: j.totalMoves,
              pgn: j.pgn,
              historicoLances: [] // O PGN pode ser carregado sob demanda se necessário
            }));

            // Combina partidas locais e da nuvem sem duplicar IDs
            const mapaDeIds = new Set(historicoPartidas.map(p => p.id));
            const partidasFiltradasNuvem = novasPartidasMapeadas.filter(p => !mapaDeIds.has(p.id));

            set({
              historicoPartidas: [...partidasFiltradasNuvem, ...historicoPartidas],
              ultimoSyncTimestamp: dados.updatedAt,
              sincronizando: false
            });
            return true;
          }

          throw new Error('Retorno inconsistente do servidor.');
        } catch (erro: any) {
          set({ erroSincronizacao: erro.message || 'Erro de conexão na sincronização.', sincronizando: false });
          return false;
        }
      }
    }),
    {
      name: 'xadrez-perfil',
      partialize: (estado) => ({
        perfilGeral: estado.perfilGeral,
        oponenteLocal: estado.oponenteLocal,
        historicoPartidas: estado.historicoPartidas,
        token: estado.token,
        usuarioLogado: estado.usuarioLogado,
        ultimoSyncTimestamp: estado.ultimoSyncTimestamp,
      })
    }
  )
);
