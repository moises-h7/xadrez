import React from 'react';
import { Chessboard } from 'react-chessboard';

interface BoardProps {
  fen: string;
  onMove: (move: { from: string; to: string; promotion?: string }) => boolean;
}

export default function Board({ fen, onMove }: BoardProps) {
  function onDrop(sourceSquare: string, targetSquare: string) {
    return onMove({ from: sourceSquare, to: targetSquare, promotion: 'q' });
  }

  return (
    <div style={{ width: '400px' }}>
      <Chessboard position={fen} onPieceDrop={onDrop} />
    </div>
  );
}
