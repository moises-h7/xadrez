import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Partida, LanceHistorico } from '../tipos';
import { Chess } from 'chess.js';
import TabuleiroJogo from './TabuleiroJogo';
import { useConfiguracaoStore } from '../armazenadores/useConfiguracaoStore';

interface PropriedadesVisualizador {
  partida: Partida;
  aoFechar: () => void;
}

export default function ModalVisualizador({ partida, aoFechar }: PropriedadesVisualizador) {
  const { temaTabuleiro, temaPecas } = useConfiguracaoStore();
  
  // Lista unificada de lances para navegação
  const [lances, setLances] = useState<Omit<LanceHistorico, 'timestamp'>[]>([]);
  const [indiceAtual, setIndiceAtual] = useState<number>(-1); // -1 é a posição inicial do jogo
  const [reproduzindo, setReproduzindo] = useState<boolean>(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const indiceRef = useRef<number>(-1);
  indiceRef.current = indiceAtual;

  // Reconstrói o histórico a partir do PGN se a partida veio da nuvem sem histórico detalhado
  useEffect(() => {
    try {
      if (partida.historicoLances && partida.historicoLances.length > 0) {
        setLances(partida.historicoLances);
      } else {
        const chessTemp = new Chess();
        chessTemp.loadPgn(partida.pgn);
        const historicoNativo = chessTemp.history({ verbose: true });
        
        const chessReplay = new Chess();
        const lancesRecriados = historicoNativo.map((lance) => {
          chessReplay.move({ from: lance.from, to: lance.to, promotion: lance.promotion });
          return {
            san: lance.san,
            fenDepois: chessReplay.fen(),
            tempoRestanteBrancas: 0,
            tempoRestantePretas: 0
          };
        });
        setLances(lancesRecriados);
      }
    } catch (e) {
      console.error('Erro ao reconstruir histórico PGN:', e);
    }
  }, [partida]);

  // Navegação manual por teclado (setas esquerda e direita)
  useEffect(() => {
    const escutarTeclado = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        pararReplay();
        avancarLance();
      } else if (e.key === 'ArrowLeft') {
        pararReplay();
        voltarLance();
      } else if (e.key === 'Escape') {
        aoFechar();
      }
    };
    window.addEventListener('keydown', escutarTeclado);
    return () => {
      window.removeEventListener('keydown', escutarTeclado);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lances]);

  const obterFenAtual = () => {
    if (indiceAtual === -1) {
      // Retorna FEN inicial
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
    return lances[indiceAtual]?.fenDepois;
  };

  const voltarLance = () => {
    setIndiceAtual((antigo) => Math.max(-1, antigo - 1));
  };

  const avancarLance = () => {
    setIndiceAtual((antigo) => Math.min(lances.length - 1, antigo + 1));
  };

  const irParaLance = (index: number) => {
    pararReplay();
    setIndiceAtual(index);
  };

  const pararReplay = () => {
    setReproduzindo(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const iniciarReplay = () => {
    if (indiceAtual >= lances.length - 1) {
      // Se estiver no fim, reinicia para o começo
      setIndiceAtual(-1);
    }
    setReproduzindo(true);
  };

  // Efeito para rodar o Replay Automático com ritmo original
  useEffect(() => {
    if (!reproduzindo) return;

    const proximoPasso = () => {
      const proximoIndice = indiceRef.current + 1;
      if (proximoIndice >= lances.length) {
        pararReplay();
        return;
      }

      // Calcula o delay físico real
      let delay = 1000; // 1 segundo padrão
      
      const tempoLimiteMs = partida.dificuldadeEngine !== null ? 10 * 60 * 1000 : 0; // fallback se sem controle de tempo

      if (partida.historicoLances && partida.historicoLances.length > 0 && partida.controleTempo !== 'sem tempo') {
        const lanceAtual = lances[proximoIndice];
        const quemJogou = proximoIndice % 2 === 0 ? 'w' : 'b';

        // Encontra o lance anterior do mesmo jogador
        let tempoAnterior = 0;
        
        // Se for o primeiro lance do jogador, o tempo anterior é o tempo total da partida
        if (proximoIndice < 2) {
          // Extrai minutos do controle de tempo, ex: "10m"
          const minutos = parseInt(partida.controleTempo) || 10;
          tempoAnterior = minutos * 60 * 1000;
        } else {
          const lanceAnteriorJogador = lances[proximoIndice - 2];
          tempoAnterior = quemJogou === 'w' ? lanceAnteriorJogador.tempoRestanteBrancas : lanceAnteriorJogador.tempoRestantePretas;
        }

        const tempoAtual = quemJogou === 'w' ? lanceAtual.tempoRestanteBrancas : lanceAtual.tempoRestantePretas;
        
        if (tempoAnterior > 0 && tempoAtual > 0) {
          delay = Math.max(200, tempoAnterior - tempoAtual); // mínimo de 200ms para legibilidade
        }
      }

      timerRef.current = setTimeout(() => {
        setIndiceAtual(proximoIndice);
        proximoPasso();
      }, delay);
    };

    proximoPasso();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reproduzindo, lances]);

  // Formatação de lista de lances em pares (brancas/pretas)
  const formatarRodadas = () => {
    const rodadas = [];
    for (let i = 0; i < lances.length; i += 2) {
      rodadas.push({
        numero: Math.floor(i / 2) + 1,
        brancas: lances[i],
        pretas: lances[i + 1]
      });
    }
    return rodadas;
  };

  return (
    <div className="modal-overlay">
      <div className="cartao-vidro modal-conteudo">
        {/* Cabeçalho do Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3>Partida vs {partida.nomeOponente}</h3>
            <p style={{ fontSize: '0.8rem' }}>
              Data: {new Date(partida.data).toLocaleDateString()} | Resultado: {
                partida.resultado === 'win' ? 'Vitória' : partida.resultado === 'loss' ? 'Derrota' : 'Empate'
              } ({partida.finalizadoPor})
            </p>
          </div>
          <button onClick={aoFechar} className="botao botao-secundario" style={{ padding: '0.4rem' }} aria-label="Fechar modal">
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Visualizador */}
        <div className="layout-jogo">
          {/* Tabuleiro */}
          <div className="area-tabuleiro">
            <TabuleiroJogo
              fen={obterFenAtual()}
              interativo={false}
              orientacao={partida.corJogador === 'b' ? 'black' : 'white'}
              temaTabuleiro={temaTabuleiro}
              temaPecas={temaPecas}
            />

            {/* Controles de Navegação */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
              <button onClick={() => irParaLance(-1)} className="botao botao-secundario" title="Início">
                <RotateCcw size={16} />
              </button>
              <button onClick={voltarLance} className="botao botao-secundario" disabled={indiceAtual === -1} title="Voltar">
                <ChevronLeft size={18} />
              </button>

              {reproduzindo ? (
                <button onClick={pararReplay} className="botao botao-perigo" style={{ minWidth: '130px' }}>
                  <Pause size={16} />
                  <span>Pausar</span>
                </button>
              ) : (
                <button onClick={iniciarReplay} className="botao botao-sucesso" style={{ minWidth: '130px' }} disabled={lances.length === 0}>
                  <Play size={16} />
                  <span>Auto Replay</span>
                </button>
              )}

              <button onClick={avancarLance} className="botao botao-secundario" disabled={indiceAtual === lances.length - 1} title="Avançar">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Histórico e Detalhes PGN */}
          <div className="painel-controle" style={{ maxHeight: '450px' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Lances do Jogo</h4>
            <div className="lista-lances" style={{ maxHeight: '350px' }}>
              <div className="lista-lances-grid">
                {formatarRodadas().map((rodada) => (
                  <React.Fragment key={rodada.numero}>
                    <div className="lance-numero">{rodada.numero}.</div>
                    <div
                      onClick={() => irParaLance((rodada.numero - 1) * 2)}
                      className={`lance-texto ${indiceAtual === (rodada.numero - 1) * 2 ? 'ativo' : ''}`}
                    >
                      {rodada.brancas.san}
                    </div>
                    {rodada.pretas ? (
                      <div
                        onClick={() => irParaLance((rodada.numero - 1) * 2 + 1)}
                        className={`lance-texto ${indiceAtual === (rodada.numero - 1) * 2 + 1 ? 'ativo' : ''}`}
                      >
                        {rodada.pretas.san}
                      </div>
                    ) : (
                      <div></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Dica */}
            <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: 'auto' }}>
              Dica: Use as setas ← e → do teclado para navegar entre os lances.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
