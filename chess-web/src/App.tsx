import React from 'react';
import Board from './components/Board/Board';
import AnalysisPanel from './components/Analysis/AnalysisPanel';
import Controls from './components/Controls/Controls';

function App() {
  return (
    <div className="app-container">
      <header>
        <h1>Chess Visionary</h1>
      </header>
      <main className="chess-layout">
        <div className="board-section">
          {/* Stub: O Tabuleiro principal vai renderizar aqui */}
          <Board />
          {/* Stub: Controles de voltar, resetar, etc. */}
          <Controls />
        </div>
        <div className="analysis-section">
          {/* Stub: Painel que exibirá as melhores jogadas vindo da API */}
          <AnalysisPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
