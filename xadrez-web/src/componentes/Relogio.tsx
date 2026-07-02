import React from 'react';

interface PropriedadesRelogio {
  tempoRestante: number; // milissegundos
  ativo: boolean;
  semLimite: boolean;
}

export default function Relogio({ tempoRestante, ativo, semLimite }: PropriedadesRelogio) {
  const formatarTempo = (milisegundos: number) => {
    if (milisegundos <= 0) return '00:00';
    const totalSegundos = Math.floor(milisegundos / 1000);
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;

    const strMin = minutos.toString().padStart(2, '0');
    const strSeg = segundos.toString().padStart(2, '0');

    // Se o tempo for menor que 20 segundos, mostra também décimos de segundo
    if (milisegundos < 20000) {
      const decimos = Math.floor((milisegundos % 1000) / 100);
      return `${strMin}:${strSeg}.${decimos}`;
    }

    return `${strMin}:${strSeg}`;
  };

  if (semLimite) {
    return (
      <div
        className="jogador-relogio"
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '2.2rem',
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.04em'
        }}
      >
        ∞
      </div>
    );
  }

  // Alerta quando resta menos de 15 segundos (conforme design guide)
  const tempoCritico = ativo && tempoRestante > 0 && tempoRestante < 15000;
  const tempoAlerta = ativo && tempoRestante > 0 && tempoRestante < 30000 && !tempoCritico;

  const classeRelogio = [
    'jogador-relogio',
    ativo && !tempoCritico ? 'ativo' : '',
    tempoAlerta ? 'alerta' : '',
    tempoCritico ? 'critico' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classeRelogio}
      aria-label="Relógio de jogo"
      style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        fontSize: '1.75rem',
        letterSpacing: '0.04em',
        minWidth: '100px'
      }}
    >
      {formatarTempo(tempoRestante)}
    </div>
  );
}
