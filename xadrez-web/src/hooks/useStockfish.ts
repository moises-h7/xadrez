import { useEffect, useRef, useCallback } from 'react';

interface PropriedadesStockfish {
  aoReceberLance: (de: string, para: string, promocao?: string) => void;
}

export function useStockfish({ aoReceberLance }: PropriedadesStockfish) {
  const workerRef = useRef<Worker | null>(null);

  // Inicializa o Web Worker
  useEffect(() => {
    // Carrega o worker usando o padrão do Vite para workers URL
    const urlWorker = new URL('../trabalhadores/stockfish.trabalhador.ts', import.meta.url);
    const trabalhador = new Worker(urlWorker, { type: 'module' });

    trabalhador.onmessage = (evento: MessageEvent) => {
      const linha = evento.data;
      if (typeof linha === 'string' && linha.startsWith('bestmove')) {
        const partes = linha.split(' ');
        const melhorLance = partes[1]; // Ex: "e2e4" ou "e7e8q"
        if (melhorLance && melhorLance !== '(none)') {
          const de = melhorLance.slice(0, 2);
          const para = melhorLance.slice(2, 4);
          const promocao = melhorLance.length > 4 ? melhorLance.charAt(4) : undefined;
          
          aoReceberLance(de, para, promocao);
        }
      }
    };

    // Inicializa o motor com o protocolo UCI
    trabalhador.postMessage('uci');
    trabalhador.postMessage('isready');

    workerRef.current = trabalhador;

    return () => {
      trabalhador.terminate();
    };
  }, [aoReceberLance]);

  // Envia os comandos correspondentes à dificuldade
  const calcularMelhorLance = useCallback((fen: string, dificuldade: number) => {
    const trabalhador = workerRef.current;
    if (!trabalhador) return;

    // Cancela buscas anteriores em andamento
    trabalhador.postMessage('stop');

    // Mapeamento de dificuldade conforme a especificação
    let nivelHabilidade = 10;
    let profundidade = 8;
    let tempoCalculo = 800;

    switch (dificuldade) {
      case 1: // Muito Fácil
        nivelHabilidade = 0;
        profundidade = 1;
        tempoCalculo = 100;
        break;
      case 2: // Fácil
        nivelHabilidade = 5;
        profundidade = 3;
        tempoCalculo = 300;
        break;
      case 3: // Médio
        nivelHabilidade = 10;
        profundidade = 8;
        tempoCalculo = 800;
        break;
      case 4: // Difícil
        nivelHabilidade = 15;
        profundidade = 14;
        tempoCalculo = 1500;
        break;
      case 5: // Muito Difícil
        nivelHabilidade = 20;
        profundidade = 20;
        tempoCalculo = 3000;
        break;
    }

    // Configura a dificuldade no motor
    trabalhador.postMessage(`setoption name Skill Level value ${nivelHabilidade}`);
    trabalhador.postMessage(`position fen ${fen}`);
    trabalhador.postMessage(`go depth ${profundidade} movetime ${tempoCalculo}`);
  }, []);

  return { calcularMelhorLance };
}
