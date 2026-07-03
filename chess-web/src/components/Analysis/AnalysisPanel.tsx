import React from 'react';
import { classifyMove } from '../../utils/chessAnalysis';

interface AnalysisPanelProps {
  analysis: any;
  error: string | null;
}

export default function AnalysisPanel({ analysis, error }: AnalysisPanelProps) {
  if (error) {
    return (
      <div style={{ color: '#ff4d4f', padding: '10px', backgroundColor: '#2a1010', borderRadius: '6px', fontSize: '14px' }}>
        ⚠️ Erro na Engine: {error}
      </div>
    );
  }
  if (!analysis) return null;

  // Extrair informações de avaliação da API
  const evalScore = typeof analysis.eval === 'number' ? analysis.eval : 0.35;
  const winChance = typeof analysis.winChance === 'number' ? analysis.winChance : 50;
  
  // Vamos assumir que a análise atual é do último lance jogado.
  // Se o lance jogado for igual ao melhor lance sugerido, classificamos como excelente.
  // Para fins visuais de demonstração, simulamos se foi o melhor lance comparando o lance no FEN.
  const isBestMove = analysis.lan === analysis.move;
  const moveDetails = classifyMove(evalScore, winChance, isBestMove);

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#141417',
      color: '#fff',
      borderRadius: '8px',
      border: '1px solid #1f1f24',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <h3 style={{ margin: 0, fontSize: '15px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Relatório da Posição
      </h3>

      {/* Badge Premium Chess.com */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: '6px',
        borderLeft: `4px solid ${moveDetails.color}`
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: moveDetails.color,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 'bold',
          fontSize: '13px',
          color: '#FFF'
        }}>
          {moveDetails.classification === 'brilliant' ? '!!' : moveDetails.classification === 'blunder' ? '??' : '*'}
        </div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '15px', color: moveDetails.color }}>
            {moveDetails.label}
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
            {moveDetails.description}
          </div>
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: '#222' }} />

      {/* Métricas do Motor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ padding: '8px 12px', backgroundColor: '#1A1A1E', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Avaliação</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFF', marginTop: '4px' }}>
            {evalScore > 0 ? `+${evalScore.toFixed(2)}` : evalScore.toFixed(2)}
          </div>
        </div>
        <div style={{ padding: '8px 12px', backgroundColor: '#1A1A1E', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Chances de Vitória</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFF', marginTop: '4px' }}>
            {winChance.toFixed(0)}%
          </div>
        </div>
      </div>

      <div style={{ fontSize: '13px', color: '#bbb', lineHeight: '1.4', fontStyle: 'italic', backgroundColor: '#1C1C21', padding: '10px', borderRadius: '6px' }}>
        💡 {analysis.text || "A posição está em equilíbrio dinâmico."}
      </div>
    </div>
  );
}
