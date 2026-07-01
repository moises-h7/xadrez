import { useState } from 'react';
import { getAnalysisFromFen } from '../services/api';

export function useEngineApi() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchAnalysis = async (fen: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnalysisFromFen(fen);
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };
  
  return { analysis, fetchAnalysis, isLoading, error };
}
