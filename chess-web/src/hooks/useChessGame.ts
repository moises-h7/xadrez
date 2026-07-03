import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { db } from '../services/db';
import { playSound } from '../utils/audio';

export function useChessGame() {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);
  const hasSavedGame = useRef(false);

  const makeMove = useCallback((move: string | { from: string; to: string; promotion?: string }) => {
    try {
      let parsedMove = move;
      if (typeof move === 'string' && (move.length === 4 || move.length === 5)) {
        parsedMove = {
          from: move.substring(0, 2),
          to: move.substring(2, 4),
          promotion: move.length === 5 ? move[4] : 'q' // default to q if not specified by UI but valid shape
        };
      }

      const result = game.move(parsedMove);
      if (result) {
        setFen(game.fen());
        setTurn(game.turn());
        setLastMove({ from: result.from, to: result.to });
        
        if (game.isCheck()) {
          playSound('check');
        } else if (result.captured) {
          playSound('capture');
        } else {
          playSound('move');
        }
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [game]);

  const undo = () => {
    game.undo();
    hasSavedGame.current = false;
    setFen(game.fen());
    setTurn(game.turn());
    setLastMove(null);
  };

  const reset = () => {
    game.reset();
    hasSavedGame.current = false;
    setFen(game.fen());
    setTurn(game.turn());
    setLastMove(null);
  };

  useEffect(() => {
    if (game.isGameOver() && !hasSavedGame.current) {
      const pgn = game.pgn();
      if (pgn.length > 0) {
        hasSavedGame.current = true;
        const result = game.isDraw() ? 'draw' : (game.turn() === 'b' ? 'win' : 'loss');
        const endedBy = game.isCheckmate() ? 'checkmate' : (game.isDraw() ? 'draw_rule' : 'resigned');
        
        db.gameHistory.add({
          id: crypto.randomUUID(),
          date: Date.now(),
          opponentType: 'engine', 
          opponentName: 'Bot',
          engineDifficulty: 1,
          timeControl: 'sem tempo',
          playerColor: 'w',
          result,
          endedBy,
          durationSeconds: 0,
          totalMoves: game.history().length,
          pgn: pgn
        }).catch(err => console.error("Falha IndexedDB", err));
      }
    }
  }, [fen, game]);

  return { fen, turn, makeMove, undo, reset, isGameOver: game.isGameOver(), lastMove };
}
