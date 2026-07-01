import React from 'react';
import styles from './AnalysisPanel.module.css';

export default function AnalysisPanel() {
  return (
    <div className={styles.panel}>
      <h3>Análise (chess-api.com)</h3>
      {/* Stub: O dev irá mostrar aqui a melhor jogada (best move), a avaliação e a continuação calculada pela engine */}
      <div className={styles.content}>
        <p>Aguardando integração com a API...</p>
      </div>
    </div>
  );
}
