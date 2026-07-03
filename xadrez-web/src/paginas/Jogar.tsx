import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, Flag, HelpCircle, RotateCcw, RotateCw, Bot } from 'lucide-react';
import { useJogoStore } from '../armazenadores/useJogoStore';
import { usePerfilStore } from '../armazenadores/usePerfilStore';
import { useConfiguracaoStore } from '../armazenadores/useConfiguracaoStore';
import { useStockfish } from '../hooks/useStockfish';
import { Partida } from '../tipos';
import { Chess } from 'chess.js';
import TabuleiroJogo from '../componentes/TabuleiroJogo';
import SeletorModo from '../componentes/SeletorModo';
import Relogio from '../componentes/Relogio';

export default function Jogar() {
  const {
    fen,
    pgn,
    historicoLances,
    tempoBrancas,
    tempoPretas,
    corAtiva,
    statusJogo,
    vencedor,
    motivoEmpate,
    configuracao,
    pausado,
    configurarJogo,
    fazerLance,
    atualizarRelogios,
    desistir,
    proporEmpate,
    alternarPausa,
    reiniciarJogo
  } = useJogoStore();

  const { perfilGeral, oponenteLocal, adicionarPartida, token, sincronizarComNuvem } = usePerfilStore();
  const { temaTabuleiro, temaPecas, rotacaoAutomaticaLocal, definirRotacaoAutomaticaLocal } = useConfiguracaoStore();

  // Estado local de seleção de peças para dicas visuais
  const [casaSelecionada, definirCasaSelecionada] = useState<string | null>(null);
  const [casasDestacadas, definirCasasDestacadas] = useState<Record<string, React.CSSProperties>>({});

  // Callback estável para o Stockfish — useCallback evita recriar o worker a cada render
  const aoReceberLanceStockfish = useCallback((de: string, para: string, promocao?: string) => {
    fazerLance(de, para, promocao);
  }, [fazerLance]);

  // Inicializa a IA do Stockfish
  const { calcularMelhorLance } = useStockfish({
    aoReceberLance: aoReceberLanceStockfish
  });

  // Loop para atualizar os relógios (~10fps é suficiente para exibir mm:ss)
  useEffect(() => {
    if (statusJogo !== 'jogando' || pausado || !configuracao || configuracao.tempoLimiteMinutos === 0) return;

    const intervalo = setInterval(atualizarRelogios, 100);
    return () => clearInterval(intervalo);
  }, [statusJogo, pausado, configuracao, atualizarRelogios]);

  // Limpa a peça selecionada quando o turno muda (evita peça "presa" entre turnos no modo local)
  useEffect(() => {
    definirCasaSelecionada(null);
  }, [corAtiva]);

  // Dispara o lance da IA quando for o turno do Stockfish
  const corRobo = configuracao?.corJogador === 'w' ? 'b' : 'w';
  const vezDoRobo = configuracao?.modo === 'robo' && corAtiva === corRobo && statusJogo === 'jogando' && !pausado;

  useEffect(() => {
    if (vezDoRobo) {
      const delayInteligente = setTimeout(() => {
        calcularMelhorLance(fen, configuracao!.dificuldadeRobo);
      }, 500);
      return () => clearTimeout(delayInteligente);
    }
  }, [vezDoRobo, fen, configuracao, calcularMelhorLance]);

  // Salva a partida automaticamente no histórico local quando concluída
  const statusAnterior = useRef(statusJogo);
  useEffect(() => {
    if (statusAnterior.current === 'jogando' && statusJogo !== 'jogando' && statusJogo !== 'ocioso') {
      const idPartida = `${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;

      let resultado: 'win' | 'loss' | 'draw' = 'draw';
      if (vencedor) {
        if (configuracao?.modo === 'robo') {
          resultado = vencedor === configuracao.corJogador ? 'win' : 'loss';
        } else {
          resultado = vencedor === 'w' ? 'win' : 'loss';
        }
      }

      const dataInicio = historicoLances[0]?.timestamp || Date.now();
      const duracaoSegundos = Math.floor((Date.now() - dataInicio) / 1000);

      const novaPartida: Partida = {
        id: idPartida,
        data: Date.now(),
        tipoOponente: configuracao?.modo === 'robo' ? 'engine' : 'local',
        nomeOponente: configuracao?.modo === 'robo' ? `Stockfish Nível ${configuracao.dificuldadeRobo}` : oponenteLocal.nome,
        dificuldadeEngine: configuracao?.modo === 'robo' ? configuracao.dificuldadeRobo : null,
        controleTempo: configuracao?.tempoLimiteMinutos ? `${configuracao.tempoLimiteMinutos}m` : 'sem tempo',
        corJogador: configuracao?.corJogador === 'b' ? 'b' : 'w',
        resultado,
        finalizadoPor: statusJogo === 'xeque_mate' ? 'checkmate' :
          statusJogo === 'tempo_esgotado' ? 'timeout' :
            statusJogo === 'desistencia' ? 'resigned' : 'draw_agreement',
        motivoEmpate: motivoEmpate as any,
        duracaoSegundos: Math.max(1, duracaoSegundos),
        totalLances: historicoLances.length,
        pgn: pgn || '1. e4',
        historicoLances: historicoLances
      };

      adicionarPartida(novaPartida);

      if (token) sincronizarComNuvem();
    }
    statusAnterior.current = statusJogo;
  }, [statusJogo, vencedor, motivoEmpate, configuracao, historicoLances, pgn, oponenteLocal.nome, adicionarPartida, token, sincronizarComNuvem]);

  // Atualiza os highlights visuais do tabuleiro
  useEffect(() => {
    const destaques: Record<string, React.CSSProperties> = {};
    const jogoAtual = new Chess(fen);

    // Destaque do último lance (amarelo translúcido) via PGN
    if (pgn) {
      try {
        const jogoTemp = new Chess();
        jogoTemp.loadPgn(pgn);
        const todosLances = jogoTemp.history({ verbose: true });
        const ultimoDetalhado = todosLances[todosLances.length - 1];
        if (ultimoDetalhado) {
          destaques[ultimoDetalhado.from] = { backgroundColor: 'hsla(45, 100%, 50%, 0.2)' };
          destaques[ultimoDetalhado.to] = { backgroundColor: 'hsla(45, 100%, 50%, 0.3)' };
        }
      } catch (_) { }
    }

    // Destaque da casa selecionada e movimentos possíveis
    if (casaSelecionada) {
      destaques[casaSelecionada] = {
        backgroundColor: 'hsla(263, 70%, 50%, 0.3)',
        borderRadius: '4px'
      };

      const movimentosPossiveis = jogoAtual.moves({ square: casaSelecionada as any, verbose: true });
      movimentosPossiveis.forEach((mov: any) => {
        const temPeca = jogoAtual.get(mov.to as any);
        if (temPeca) {
          // Captura: anel vermelho semitransparente
          destaques[mov.to] = {
            background: 'radial-gradient(circle, transparent 52%, hsla(0, 100%, 50%, 0.18) 53%)'
          };
        } else {
          // Movimento livre: círculo cinza no centro
          destaques[mov.to] = {
            background: 'radial-gradient(circle, hsla(0, 0%, 100%, 0.15) 25%, transparent 26%)'
          };
        }
      });
    }

    // Destaque do Rei em xeque (vermelho pulsante via className)
    if (jogoAtual.inCheck()) {
      const corEmXeque = jogoAtual.turn();
      const pecas = jogoAtual.board();
      for (const fileira of pecas) {
        for (const casa of fileira) {
          if (casa && casa.type === 'k' && casa.color === corEmXeque) {
            destaques[casa.square] = {
              backgroundColor: 'hsla(0, 100%, 50%, 0.25)',
              animation: 'xeque-pulso 0.5s ease-in-out infinite'
            };
          }
        }
      }
    }

    definirCasasDestacadas(destaques);
  }, [fen, casaSelecionada, pgn]);

  // Handler de clique nas casas do tabuleiro
  const aoClicarCasa = (casa: string) => {
    if (statusJogo !== 'jogando' || pausado) return;
    if (configuracao?.modo === 'robo' && corAtiva !== configuracao.corJogador) return;

    const jogoAtual = new Chess(fen);
    const pecaNaCasa = jogoAtual.get(casa as any);

    if (casaSelecionada) {
      if (casaSelecionada === casa) {
        // Deseleciona
        definirCasaSelecionada(null);
        return;
      }
      // Tenta fazer o lance
      const promocaoAuto = (casa.endsWith('8') || casa.endsWith('1')) ? 'q' : undefined;
      const lanceFoi = fazerLance(casaSelecionada, casa, promocaoAuto);
      if (lanceFoi) {
        definirCasaSelecionada(null);
        return;
      }
    }

    // Seleciona a peça se for da cor certa
    if (pecaNaCasa && pecaNaCasa.color === corAtiva) {
      definirCasaSelecionada(casa);
    } else {
      definirCasaSelecionada(null);
    }
  };

  // Handler de peça arrastada (limpa seleção)
  const aoArrastarLance = (de: string, para: string) => {
    definirCasaSelecionada(null);
    const promocaoAuto = (para.endsWith('8') || para.endsWith('1')) ? 'q' : undefined;
    return fazerLance(de, para, promocaoAuto);
  };

  // Define orientação do tabuleiro (usa boardOrientation nativo, sem CSS transform)
  let orientacaoTabuleiro: 'white' | 'black' = 'white';

  if (configuracao) {
    if (configuracao.modo === 'robo') {
      orientacaoTabuleiro = configuracao.corJogador === 'b' ? 'black' : 'white';
    } else {
      // 1v1 Local: gira via boardOrientation se rotação ativada
      if (configuracao.rotacaoAutomatica && rotacaoAutomaticaLocal) {
        orientacaoTabuleiro = corAtiva === 'b' ? 'black' : 'white';
      } else {
        orientacaoTabuleiro = configuracao.corJogador1 === 'b' ? 'black' : 'white';
      }
    }
  }

  // Agrupa os lances em pares para a tabela lateral
  const formatarLancesLateral = () => {
    const pares = [];
    for (let i = 0; i < historicoLances.length; i += 2) {
      pares.push({
        numero: Math.floor(i / 2) + 1,
        brancas: historicoLances[i]?.san || '',
        pretas: historicoLances[i + 1]?.san || ''
      });
    }
    return pares;
  };

  if (statusJogo === 'ocioso' || !configuracao) {
    return <SeletorModo aoIniciarJogo={configurarJogo} />;
  }

  // Metadados visuais de nomes e avatares
  const infoBrancas = {
    nome: configuracao.modo === 'robo'
      ? (configuracao.corJogador === 'w' ? perfilGeral.nome : `Stockfish Nível ${configuracao.dificuldadeRobo}`)
      : (configuracao.corJogador1 === 'w' ? perfilGeral.nome : oponenteLocal.nome),
    foto: configuracao.modo === 'robo'
      ? (configuracao.corJogador === 'w' ? perfilGeral.fotoBase64 : null)
      : (configuracao.corJogador1 === 'w' ? perfilGeral.fotoBase64 : oponenteLocal.fotoBase64),
    tipo: configuracao.modo === 'robo' && configuracao.corJogador !== 'w' ? 'ia' : 'humano'
  };

  const infoPretas = {
    nome: configuracao.modo === 'robo'
      ? (configuracao.corJogador === 'b' ? perfilGeral.nome : `Stockfish Nível ${configuracao.dificuldadeRobo}`)
      : (configuracao.corJogador1 === 'b' ? perfilGeral.nome : oponenteLocal.nome),
    foto: configuracao.modo === 'robo'
      ? (configuracao.corJogador === 'b' ? perfilGeral.fotoBase64 : null)
      : (configuracao.corJogador1 === 'b' ? perfilGeral.fotoBase64 : oponenteLocal.fotoBase64),
    tipo: configuracao.modo === 'robo' && configuracao.corJogador !== 'b' ? 'ia' : 'humano'
  };

  const oponenteInfo = orientacaoTabuleiro === 'white' ? infoPretas : infoBrancas;
  const jogadorInfo = orientacaoTabuleiro === 'white' ? infoBrancas : infoPretas;

  const oponenteTempo = orientacaoTabuleiro === 'white' ? tempoPretas : tempoBrancas;
  const jogadorTempo = orientacaoTabuleiro === 'white' ? tempoBrancas : tempoPretas;

  const oponenteCorAtiva = orientacaoTabuleiro === 'white' ? 'b' : 'w';
  const jogadorCorAtiva = orientacaoTabuleiro === 'white' ? 'w' : 'b';

  return (
    <div
      className="layout-jogo"
      style={{
        gridTemplateColumns: undefined // Controlado pelo CSS
      }}
    >
      {/* Coluna Central do Tabuleiro (7 colunas no desktop) */}
      <div
        className="area-tabuleiro"
        style={{ gridColumn: '1 / span 7' }}
      >
        {/* Painel do Oponente (Superior) */}
        <div className="painel-jogador">
          <div className="jogador-info">
            {oponenteInfo.foto ? (
              <img src={oponenteInfo.foto} alt={oponenteInfo.nome} className="jogador-avatar" />
            ) : (
              <div
                className="jogador-avatar"
                style={{
                  background: oponenteInfo.tipo === 'ia' ? 'var(--cor-secundaria)' : 'var(--cor-primaria)'
                }}
              >
                {oponenteInfo.tipo === 'ia' ? <Bot size={16} /> : oponenteInfo.nome.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="jogador-nome">{oponenteInfo.nome}</span>
            {vezDoRobo && oponenteCorAtiva === corAtiva && (
              <span style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--cor-texto-mutado)',
                fontFamily: 'var(--fonte-apoio)',
                animation: 'pulso 1.5s ease-in-out infinite'
              }}>
                Pensando…
              </span>
            )}
          </div>
          <Relogio
            tempoRestante={oponenteTempo}
            ativo={corAtiva === oponenteCorAtiva && statusJogo === 'jogando' && !pausado}
            semLimite={configuracao.tempoLimiteMinutos === 0}
          />
        </div>

        {/* Tabuleiro com overlay de fim de jogo */}
        <div style={{ position: 'relative' }}>
          <TabuleiroJogo
            fen={fen}
            aoFazerLance={aoArrastarLance}
            orientacao={orientacaoTabuleiro}
            interativo={statusJogo === 'jogando' && !pausado && (configuracao.modo !== 'robo' || corAtiva === configuracao.corJogador)}
            temaTabuleiro={temaTabuleiro}
            temaPecas={temaPecas}
            casasDestacadas={casasDestacadas}
          />

          {/* Overlay de Partida Encerrada */}
          {statusJogo !== 'jogando' && (() => {
            const nomeVencedor = vencedor
              ? (vencedor === 'w' ? infoBrancas.nome : infoPretas.nome)
              : null;
            const nomePerdedor = vencedor
              ? (vencedor === 'w' ? infoPretas.nome : infoBrancas.nome)
              : null;
            return (
              <div className="overlay-fim-jogo">
                <h2 style={{ fontSize: '2rem', fontFamily: 'var(--fonte-principal)' }}>Fim de Jogo</h2>
                <div style={{
                  margin: '0.5rem 0',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: vencedor ? 'hsl(142, 72%, 55%)' : 'var(--cor-texto-mutado)',
                  fontFamily: 'var(--fonte-apoio)'
                }}>
                  {statusJogo === 'xeque_mate' && `${nomeVencedor} ganhou por xeque-mate!`}
                  {statusJogo === 'tempo_esgotado' && `${nomeVencedor} ganhou por tempo esgotado!`}
                  {statusJogo === 'desistencia' && `${nomePerdedor} desistiu — ${nomeVencedor} venceu!`}
                  {statusJogo === 'empate' && `Empate por ${
                    motivoEmpate === 'afogamento' ? 'Afogamento (Stalemate)' :
                    motivoEmpate === 'material_insuficiente' ? 'Material Insuficiente' :
                    motivoEmpate === 'tripla_repeticao' ? 'Tríplice Repetição' :
                    motivoEmpate === '50_movimentos' ? 'Regra dos 50 movimentos' : 'Acordo Mútuo'
                  }`}
                </div>
                <button onClick={reiniciarJogo} className="botao botao-primario" style={{ marginTop: '1rem' }}>
                  <RotateCcw size={16} />
                  <span>Nova Partida</span>
                </button>
              </div>
            );
          })()}
        </div>

        {/* Painel do Jogador (Inferior) */}
        <div className="painel-jogador">
          <div className="jogador-info">
            {jogadorInfo.foto ? (
              <img src={jogadorInfo.foto} alt={jogadorInfo.nome} className="jogador-avatar" />
            ) : (
              <div className="jogador-avatar">
                {jogadorInfo.nome.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="jogador-nome">{jogadorInfo.nome}</span>
          </div>
          <Relogio
            tempoRestante={jogadorTempo}
            ativo={corAtiva === jogadorCorAtiva && statusJogo === 'jogando' && !pausado}
            semLimite={configuracao.tempoLimiteMinutos === 0}
          />
        </div>
      </div>

      {/* Painel de Controle Lateral (5 colunas no desktop) */}
      <div
        className="cartao-vidro painel-controle"
        style={{ gridColumn: '8 / span 5', justifyContent: 'space-between' }}
      >
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.25rem', fontFamily: 'var(--fonte-principal)' }}>Painel da Partida</h3>
            <p style={{ fontSize: '0.78rem', fontFamily: 'var(--fonte-apoio)' }}>
              {configuracao.modo === 'robo'
                ? `VS IA · Nível ${configuracao.dificuldadeRobo}`
                : '1v1 Local'}{' '}
              {configuracao.tempoLimiteMinutos > 0 ? `· ${configuracao.tempoLimiteMinutos} min` : '· Sem tempo'}
            </p>
          </div>

          {/* Histórico de Movimentos */}
          <div className="lista-lances">
            <div className="lista-lances-grid">
              {formatarLancesLateral().map((par) => (
                <React.Fragment key={par.numero}>
                  <div className="lance-numero">{par.numero}.</div>
                  <div className="lance-texto">{par.brancas}</div>
                  <div className="lance-texto">{par.pretas}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Botões de Ações Ativas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.5rem' }}>
          {statusJogo === 'jogando' && (
            <>
              {configuracao.modo === 'local' && (
                <>
                  <button onClick={alternarPausa} className={`botao ${pausado ? 'botao-sucesso' : 'botao-secundario'}`}>
                    {pausado ? <Play size={16} /> : <Pause size={16} />}
                    <span>{pausado ? 'Retomar Jogo' : 'Pausar Jogo'}</span>
                  </button>
                  <button
                    onClick={() => definirRotacaoAutomaticaLocal(!rotacaoAutomaticaLocal)}
                    className={`botao ${rotacaoAutomaticaLocal ? 'botao-sucesso' : 'botao-secundario'}`}
                  >
                    <RotateCw size={16} />
                    <span>{rotacaoAutomaticaLocal ? 'Rotação: Ativada' : 'Rotação: Desativada'}</span>
                  </button>
                </>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={proporEmpate} className="botao botao-secundario" style={{ flexGrow: 1 }} disabled={pausado}>
                  <HelpCircle size={16} />
                  <span>Propor Empate</span>
                </button>
                <button onClick={() => desistir(corAtiva)} className="botao botao-perigo" style={{ flexGrow: 1 }} disabled={pausado}>
                  <Flag size={16} />
                  <span>Desistir</span>
                </button>
              </div>
            </>
          )}

          {statusJogo !== 'jogando' && (
            <button onClick={reiniciarJogo} className="botao botao-secundario" style={{ width: '100%' }}>
              <RotateCcw size={16} />
              <span>Sair da Partida</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
