import React from 'react';

interface ControlsProps {
  undo: () => void;
  reset: () => void;
  analyze: () => void;
  isLoading: boolean;
}

export default function Controls({ undo, reset, analyze, isLoading }: ControlsProps) {
  return (
    <div>
      <button onClick={undo} disabled={isLoading}>Undo</button>
      <button onClick={reset} disabled={isLoading}>Reset</button>
      <button onClick={analyze} disabled={isLoading}>{isLoading ? 'Analisando...' : 'Analisar'}</button>
    </div>
  );
}
