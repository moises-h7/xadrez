import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';

export function useChessGame() {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());

  const makeMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
    try {
      const result = game.move(move);
      if (result) {
        setFen(game.fen());
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [game]);

  const undo = () => {
    game.undo();
    setFen(game.fen());
  };

  const reset = () => {
    game.reset();
    setFen(game.fen());
  };

  return { fen, makeMove, undo, reset, isGameOver: game.isGameOver() };
}
