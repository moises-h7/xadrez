import { useState, useCallback } from 'react';
import { getAnalysisFromFen } from '../services/api';

export function useEngineApi() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchAnalysis = useCallback(async (fen: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnalysisFromFen(fen);
      setAnalysis(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return { analysis, fetchAnalysis, isLoading, error };
}
