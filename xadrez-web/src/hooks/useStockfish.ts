import { useEffect, useRef, useCallback } from 'react';

interface PropriedadesStockfish {
  aoReceberLance: (de: string, para: string, promocao?: string) => void;
}

export function useStockfish({ aoReceberLance }: PropriedadesStockfish) {
  const workerRef = useRef<Worker | null>(null);
  // Ref estável para o callback — evita recriar o worker a cada render
  const callbackRef = useRef(aoReceberLance);
  callbackRef.current = aoReceberLance;

  // Inicializa o Web Worker uma única vez
  useEffect(() => {
    // Worker clássico servido de public/ — compatível com todos os browsers e GitHub Pages
    // import.meta.env.BASE_URL garante o path correto tanto em dev quanto no Pages
    const workerUrl = `${import.meta.env.BASE_URL}stockfish.worker.js`;
    const trabalhador = new Worker(workerUrl);

    trabalhador.onmessage = (evento: MessageEvent) => {
      const linha = evento.data;
      if (typeof linha === 'string' && linha.startsWith('bestmove')) {
        const partes = linha.split(' ');
        const melhorLance = partes[1]; // Ex: "e2e4" ou "e7e8q"
        if (melhorLance && melhorLance !== '(none)') {
          const de = melhorLance.slice(0, 2);
          const para = melhorLance.slice(2, 4);
          const promocao = melhorLance.length > 4 ? melhorLance.charAt(4) : undefined;
          callbackRef.current(de, para, promocao);
        }
      }
    };

    trabalhador.onerror = (e) => {
      console.error('[Stockfish] Erro no worker:', e.message);
    };

    // Inicializa o protocolo UCI
    trabalhador.postMessage('uci');
    trabalhador.postMessage('isready');

    workerRef.current = trabalhador;

    return () => {
      trabalhador.postMessage('quit');
      trabalhador.terminate();
    };
  }, []); // sem deps — worker vive enquanto o componente viver

  const calcularMelhorLance = useCallback((fen: string, dificuldade: number) => {
    const trabalhador = workerRef.current;
    if (!trabalhador) return;

    // Cancela busca anterior
    trabalhador.postMessage('stop');

    // Mapeamento de dificuldade → parâmetros UCI
    const NIVEIS: Record<number, { skill: number; depth: number; movetime: number }> = {
      1: { skill: 0,  depth: 1,  movetime: 100  }, // Muito Fácil
      2: { skill: 5,  depth: 3,  movetime: 300  }, // Fácil
      3: { skill: 10, depth: 8,  movetime: 800  }, // Médio
      4: { skill: 15, depth: 14, movetime: 1500 }, // Difícil
      5: { skill: 20, depth: 20, movetime: 3000 }, // Muito Difícil
    };

    const nivel = NIVEIS[dificuldade] ?? NIVEIS[3];

    trabalhador.postMessage(`setoption name Skill Level value ${nivel.skill}`);
    trabalhador.postMessage(`position fen ${fen}`);
    trabalhador.postMessage(`go depth ${nivel.depth} movetime ${nivel.movetime}`);
  }, []);

  return { calcularMelhorLance };
}
