import React from 'react';
import styles from './Board.module.css';

export default function Board() {
  return (
    <div className={styles.boardContainer}>
      {/* Stub: O react-chessboard será instanciado aqui. 
          O dev deverá conectá-lo ao estado do chess.js (através de props ou do hook useChessGame) */}
      <h2>Tabuleiro</h2>
      <div className={styles.placeholder}>[react-chessboard aqui]</div>
    </div>
  );
}
