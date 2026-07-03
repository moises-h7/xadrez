import React, { useEffect, useRef, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useChessGame } from '../../hooks/useChessGame';
import { useEngineApi } from '../../hooks/useEngineApi';
import Board from '../../components/Board/Board';
import Controls from '../../components/Controls/Controls';
import AnalysisPanel from '../../components/Analysis/AnalysisPanel';
import GameOverOverlay from '../../components/GameOver/GameOverOverlay';

export default function PlayPage() {
  const { gameMode, setGameMode, timeControl, setTimeControl } = useUIStore();
  const { fen, turn, makeMove, undo, reset: resetGame, isGameOver, lastMove } = useChessGame();
  const { analysis, fetchAnalysis, isLoading, error } = useEngineApi();
  const isBotThinking = useRef(false);

  // Estados dos relógios
  const [whiteTime, setWhiteTime] = useState<number | null>(null);
  const [blackTime, setBlackTime] = useState<number | null>(null);
  const [timeWinner, setTimeWinner] = useState<'w' | 'b' | null>(null);
  const [hasStartedClocks, setHasStartedClocks] = useState(false);

  // Iniciar relógios assim que o tempo for escolhido
  useEffect(() => {
    if (timeControl !== null) {
      setWhiteTime(timeControl);
      setBlackTime(timeControl);
      setTimeWinner(null);
      setHasStartedClocks(true);
    } else {
      setWhiteTime(null);
      setBlackTime(null);
      setTimeWinner(null);
      setHasStartedClocks(false);
    }
  }, [timeControl]);

  // Efeito do relógio decrementando a cada segundo
  useEffect(() => {
    if (!hasStartedClocks || isGameOver || timeWinner) return;

    const interval = setInterval(() => {
      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev !== null && prev <= 1) {
            setTimeWinner('b');
            clearInterval(interval);
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      } else {
        setBlackTime((prev) => {
          if (prev !== null && prev <= 1) {
            setTimeWinner('w');
            clearInterval(interval);
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [turn, hasStartedClocks, isGameOver, timeWinner]);

  // Robô jogando (De Pretas)
  useEffect(() => {
    if (gameMode === 'engine' && turn === 'b' && !isGameOver && !timeWinner && !isBotThinking.current) {
      const playBotMove = async () => {
        isBotThinking.current = true;
        const data = await fetchAnalysis(fen);
        // CORREÇÃO: a API retorna o lance em 'data.move', não em 'data.bestmove'
        if (data && data.move) {
          makeMove(data.move);
        }
        isBotThinking.current = false;
      };
      
      const timer = setTimeout(playBotMove, 400);
      return () => clearTimeout(timer);
    }
  }, [fen, gameMode, isGameOver, timeWinner, fetchAnalysis, makeMove, turn]);

  const handleReset = () => {
    resetGame();
    if (timeControl !== null) {
      setWhiteTime(timeControl);
      setBlackTime(timeControl);
    }
    setTimeWinner(null);
  };

  const handleGoBack = () => {
    setGameMode(null);
    setTimeControl(null);
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '∞';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. Menu de seleção de Modo
  if (!gameMode) {
    return (
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '100px' }}>
        <button 
          onClick={() => setGameMode('local')} 
          style={{ padding: '40px', fontSize: '24px', backgroundColor: '#1F1F24', color: 'white', border: '1px solid #333', borderRadius: '12px', cursor: 'pointer' }}
        >
          🤝 1v1 Local
        </button>
        <button 
          onClick={() => setGameMode('engine')} 
          style={{ padding: '40px', fontSize: '24px', backgroundColor: '#4F28D9', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}
        >
          🤖 Jogar VS Robô
        </button>
      </div>
    );
  }

  // 2. Menu de seleção de Controle de Tempo
  if (timeControl === null && !hasStartedClocks) {
    const timeOptions = [
      { label: 'Sem tempo', value: null },
      { label: '1 min (Bullet)', value: 60 },
      { label: '3 min (Blitz)', value: 180 },
      { label: '5 min (Blitz)', value: 300 },
      { label: '10 min (Rápida)', value: 600 },
      { label: '30 min (Clássica)', value: 1800 }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', marginTop: '80px' }}>
        <h2 style={{ color: 'white', fontFamily: 'Outfit, sans-serif' }}>Escolha o Tempo de Jogo</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '400px', width: '100%' }}>
          {timeOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setTimeControl(opt.value)}
              style={{
                padding: '20px',
                fontSize: '18px',
                backgroundColor: '#1E1E24',
                color: 'white',
                border: '1px solid #333',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2E2E38')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1E1E24')}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button 
          onClick={handleGoBack}
          style={{ marginTop: '10px', background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          ← Mudar de modo
        </button>
      </div>
    );
  }

  // Orientação do tabuleiro: se for local, inverte com o turno. Se for bot, o jogador joga sempre de brancas.
  const boardOrientation = gameMode === 'local' ? (turn === 'w' ? 'white' : 'black') : 'white';
  
  // Setas e Análise: só ativa se a partida acabar (isGameOver ou tempo zerado)
  const isMatchEnded = isGameOver || !!timeWinner;
  const bestMoveArrow = isMatchEnded ? analysis?.bestmove : null;

  // Título e mensagem de fim de jogo
  let gameOverTitle = '';
  let gameOverDesc = '';
  if (isGameOver) {
    gameOverTitle = 'Xeque-Mate!';
    gameOverDesc = turn === 'w' ? 'Vitória das Pretas.' : 'Vitória das Brancas.';
  } else if (timeWinner) {
    gameOverTitle = 'Fim do Tempo!';
    gameOverDesc = timeWinner === 'w' ? 'Vitória das Brancas por tempo.' : 'Vitória das Pretas por tempo.';
  }

  return (
    <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Relógio do Oponente (Pretas) */}
        {timeControl !== null && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: turn === 'b' ? '#2e2e38' : '#141417',
            borderRadius: '6px',
            color: turn === 'b' ? '#FFF' : '#888',
            border: turn === 'b' ? '1px solid #4F28D9' : '1px solid transparent',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}>
            <span>👤 Robô / Oponente</span>
            <span>⏱️ {formatTime(blackTime)}</span>
          </div>
        )}

        {/* Tabuleiro */}
        <div style={{ position: 'relative' }}>
          <Board 
            fen={fen} 
            onMove={makeMove} 
            orientation={boardOrientation} 
            lastMove={lastMove}
            bestMoveArrow={bestMoveArrow}
            gameMode={gameMode}
            turn={turn}
          />
          {isMatchEnded && (
            <GameOverOverlay 
              title={gameOverTitle} 
              description={gameOverDesc} 
              onReset={handleReset} 
            />
          )}
        </div>

        {/* Nosso Relógio (Brancas) */}
        {timeControl !== null && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: turn === 'w' ? '#2e2e38' : '#141417',
            borderRadius: '6px',
            color: turn === 'w' ? '#FFF' : '#888',
            border: turn === 'w' ? '1px solid #4F28D9' : '1px solid transparent',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}>
            <span>👤 Você</span>
            <span>⏱️ {formatTime(whiteTime)}</span>
          </div>
        )}

      </div>

      {/* Painel Lateral */}
      <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button 
          onClick={handleGoBack}
          style={{ padding: '10px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          ← Voltar ao Menu
        </button>
        
        {/* Controles normais da partida */}
        <Controls 
          undo={undo} 
          reset={handleReset} 
          analyze={() => fetchAnalysis(fen)} 
          isLoading={isLoading} 
        />
        
        {/* Só mostra a análise se a partida terminar */}
        {isMatchEnded ? (
          <AnalysisPanel analysis={analysis} error={error} />
        ) : (
          <div style={{ padding: '16px', backgroundColor: '#141417', border: '1px solid #1f1f24', borderRadius: '8px', color: '#555', textAlign: 'center' }}>
            🔒 A análise da partida estará disponível após o término do jogo.
          </div>
        )}
      </div>
    </div>
  );
}
