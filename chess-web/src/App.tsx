import React from 'react';
import { useChessGame } from './hooks/useChessGame';
import { useEngineApi } from './hooks/useEngineApi';
import Board from './components/Board/Board';
import AnalysisPanel from './components/Analysis/AnalysisPanel';
import Controls from './components/Controls/Controls';

export default function App() {
  const { fen, makeMove, undo, reset } = useChessGame();
  const { analysis, fetchAnalysis, isLoading, error } = useEngineApi();

  return (
    <div>
      <Board fen={fen} onMove={makeMove} />
      <Controls undo={undo} reset={reset} analyze={() => fetchAnalysis(fen)} isLoading={isLoading} />
      <AnalysisPanel analysis={analysis} error={error} />
    </div>
  );
}
