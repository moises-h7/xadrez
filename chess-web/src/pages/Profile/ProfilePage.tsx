import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';

export default function ProfilePage() {
  const games = useLiveQuery(() => db.gameHistory.orderBy('date').reverse().toArray());

  return (
    <div style={{ color: 'white', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Perfil e Histórico</h1>
      {!games ? (
        <p style={{ color: '#aaa' }}>Carregando histórico...</p>
      ) : games.length === 0 ? (
        <p style={{ color: '#aaa' }}>Nenhuma partida concluída ainda.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          {games.map(g => (
            <div key={g.id} style={{ padding: '15px', backgroundColor: '#141417', borderRadius: '8px', borderLeft: `4px solid ${g.result === 'win' ? '#4ade80' : g.result === 'loss' ? '#f87171' : '#94a3b8'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '18px' }}>VS {g.opponentName} ({g.opponentType})</strong>
                <span style={{ color: '#aaa' }}>{new Date(g.date).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', gap: '15px', color: '#888', fontSize: '14px' }}>
                <span>Resultado: <b style={{ color: 'white' }}>{g.result.toUpperCase()}</b></span>
                <span>Fim por: <b style={{ color: 'white' }}>{g.endedBy}</b></span>
                <span>Lances: <b style={{ color: 'white' }}>{g.totalMoves}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
