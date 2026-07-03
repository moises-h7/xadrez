import React from 'react';

interface GameOverOverlayProps {
  title?: string;
  description?: string;
  onReset: () => void;
}

export default function GameOverOverlay({ title = "Fim de Jogo", description, onReset }: GameOverOverlayProps) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      borderRadius: '4px'
    }}>
      <h2 style={{ color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0, fontSize: '32px' }}>
        {title}
      </h2>
      {description && (
        <p style={{ color: '#DDD', fontSize: '18px', marginTop: '10px' }}>
          {description}
        </p>
      )}
      <button 
        onClick={onReset}
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          backgroundColor: '#4F28D9',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(79, 40, 217, 0.4)'
        }}
      >
        Jogar Novamente
      </button>
    </div>
  );
}
