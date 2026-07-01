import React from 'react';
import styles from './Controls.module.css';

export default function Controls() {
  return (
    <div className={styles.controlsContainer}>
      {/* Stub: Botões para desfazer lance, resetar jogo e forçar análise */}
      <button className={styles.btn}>Desfazer</button>
      <button className={styles.btn}>Resetar</button>
      <button className={`${styles.btn} ${styles.primary}`}>Analisar FEN</button>
    </div>
  );
}
