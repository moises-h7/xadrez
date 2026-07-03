import React from 'react';
import { Chessboard } from 'react-chessboard';

interface BoardProps {
  fen: string;
  onMove: (move: { from: string; to: string; promotion?: string }) => boolean;
  orientation?: 'white' | 'black';
  lastMove?: { from: string; to: string } | null;
  bestMoveArrow?: string | null;
  gameMode?: string | null;
  turn?: 'w' | 'b';
}

export default function Board({ fen, onMove, orientation = 'white', lastMove, bestMoveArrow, gameMode, turn }: BoardProps) {
  function onDrop(sourceSquare: string, targetSquare: string, piece: string) {
    // Validação de cor do lance
    const pieceColor = piece ? piece[0] : null;
    if (pieceColor) {
      if (gameMode === 'engine' && pieceColor === 'b') {
        return false; // Humano não move as pretas contra a engine
      }
      if (gameMode === 'local' && pieceColor !== turn) {
        return false; // Não move peças fora do seu turno no local 1v1
      }
    }

    const isPromotion = piece && piece.length >= 2 && piece[1] === 'P' && (targetSquare[1] === '8' || targetSquare[1] === '1');
    return onMove({ from: sourceSquare, to: targetSquare, promotion: isPromotion ? 'q' : undefined });
  }

  // Calculate highlights for last move
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    customSquareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
  }

  // Parse best move arrow (e.g. "e2e4" -> ["e2", "e4", "green"])
  const customArrows: any[] = [];
  if (bestMoveArrow && bestMoveArrow.length >= 4) {
    const from = bestMoveArrow.substring(0, 2);
    const to = bestMoveArrow.substring(2, 4);
    customArrows.push([from, to, 'rgba(0, 255, 0, 0.6)']);
  }

  return (
    <div style={{ width: '480px', position: 'relative' }}>
      <Chessboard 
        position={fen} 
        onPieceDrop={onDrop}
        boardOrientation={orientation}
        animationDuration={200}
        customSquareStyles={Object.keys(customSquareStyles).length > 0 ? customSquareStyles : undefined}
        customArrows={customArrows.length > 0 ? customArrows : undefined}
        showPromotionDialog={true}
      />
    </div>
  );
}
