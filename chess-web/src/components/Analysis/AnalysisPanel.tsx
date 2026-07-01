import React from 'react';

interface AnalysisPanelProps {
  analysis: any;
  error: string | null;
}

export default function AnalysisPanel({ analysis, error }: AnalysisPanelProps) {
  return (
    <div>
      <h3>Análise</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <pre>{JSON.stringify(analysis, null, 2)}</pre>
    </div>
  );
}
