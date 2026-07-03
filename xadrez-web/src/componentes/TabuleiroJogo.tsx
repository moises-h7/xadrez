import React from 'react';
import { Chessboard } from 'react-chessboard';
import { TemaTabuleiro, TemaPecas } from '../armazenadores/useConfiguracaoStore';

interface PropriedadesTabuleiro {
  fen: string;
  aoFazerLance?: (de: string, para: string, promocao?: string) => boolean;
  orientacao?: 'white' | 'black';
  interativo?: boolean;
  temaTabuleiro: TemaTabuleiro;
  temaPecas: TemaPecas;
  casasDestacadas?: Record<string, React.CSSProperties>; // Highlights externos (xeque, lances, hints)
  rotacionado?: boolean; // Controla a rotação 3D do tabuleiro
}

// Paleta HSL alinhada ao design guide - moderno, premium e escuro
const OBTER_ESTILOS_CASAS = (tema: TemaTabuleiro): {
  estiloTabuleiro: React.CSSProperties;
  casaEscura: React.CSSProperties;
  casaClara: React.CSSProperties;
  classeTabuleiro?: string;
} => {
  switch (tema) {
    case 'moderno-gelo':
      return {
        estiloTabuleiro: { borderRadius: '8px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)' },
        casaEscura: { backgroundColor: 'hsl(217, 30%, 45%)' },
        casaClara: { backgroundColor: 'hsl(210, 20%, 94%)' }
      };
    case 'madeira-classico':
      return {
        estiloTabuleiro: { borderRadius: '8px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)' },
        casaEscura: { backgroundColor: 'hsl(28, 45%, 40%)' },
        casaClara: { backgroundColor: 'hsl(35, 35%, 85%)' }
      };
    case 'cyberpunk':
      return {
        estiloTabuleiro: {
          borderRadius: '8px',
          boxShadow: '0 0 35px hsla(263, 70%, 50%, 0.35), 0 8px 24px rgba(0,0,0,0.5)',
          border: '1px solid hsla(263, 70%, 50%, 0.4)'
        },
        casaEscura: { backgroundColor: 'hsl(320, 90%, 8%)' },
        casaClara: { backgroundColor: 'hsl(320, 20%, 15%)' }
      };
    case 'minimalista':
      return {
        estiloTabuleiro: { borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' },
        casaEscura: { backgroundColor: 'hsl(0, 0%, 25%)' },
        casaClara: { backgroundColor: 'hsl(0, 0%, 90%)' }
      };
  }
};

// SVG geométrico limpo sem use de require()
const renderizarPecaGeometrica = (cor: 'w' | 'b', tipo: string, largura: number) => {
  const corPreenchimento = cor === 'w' ? 'hsl(0, 0%, 96%)' : 'hsl(240, 10%, 8%)';
  const corBorda = cor === 'w' ? 'hsl(263, 70%, 60%)' : 'hsl(217, 91%, 60%)';

  switch (tipo) {
    case 'P': // Peão: Círculo + Traço base
      return (
        <svg width={largura} height={largura} viewBox="0 0 100 100" style={{ display: 'block' }}>
          <circle cx="50" cy="48" r="20" fill={corPreenchimento} stroke={corBorda} strokeWidth="5" />
          <rect x="32" y="72" width="36" height="8" rx="4" fill={corPreenchimento} stroke={corBorda} strokeWidth="5" />
        </svg>
      );
    case 'R': // Torre: Quadrado com merlões
      return (
        <svg width={largura} height={largura} viewBox="0 0 100 100" style={{ display: 'block' }}>
          <rect x="28" y="38" width="44" height="38" rx="3" fill={corPreenchimento} stroke={corBorda} strokeWidth="5" />
          <rect x="28" y="28" width="10" height="14" rx="2" fill={corPreenchimento} stroke={corBorda} strokeWidth="5" />
          <rect x="45" y="28" width="10" height="14" rx="2" fill={corPreenchimento} stroke={corBorda} strokeWidth="5" />
          <rect x="62" y="28" width="10" height="14" rx="2" fill={corPreenchimento} stroke={corBorda} strokeWidth="5" />
          <rect x="22" y="76" width="56" height="6" rx="3" fill={corPreenchimento} stroke={corBorda} strokeWidth="5" />
        </svg>
      );
    case 'N': // Cavalo: Triângulo com detalhe
      return (
        <svg width={largura} height={largura} viewBox="0 0 100 100" style={{ display: 'block' }}>
          <polygon points="50,18 24,78 76,78" fill={corPreenchimento} stroke={corBorda} strokeWidth="5" strokeLinejoin="round" />
          <circle cx="50" cy="50" r="7" fill={corBorda} />
        </svg>
      );
    case 'B': // Bispo: Gota alongada com ponto
      return (
        <svg width={largura} height={largura} viewBox="0 0 100 100" style={{ display: 'block' }}>
          <path d="M50 18 C28 50 32 76 50 76 C68 76 72 50 50 18 Z" fill={corPreenchimento} stroke={corBorda} strokeWidth="5" strokeLinejoin="round" />
          <circle cx="50" cy="50" r="5" fill={corBorda} />
          <rect x="30" y="80" width="40" height="6" rx="3" fill={corPreenchimento} stroke={corBorda} strokeWidth="5" />
        </svg>
      );
    case 'Q': // Rainha: Estrela pentagonal
      return (
        <svg width={largura} height={largura} viewBox="0 0 100 100" style={{ display: 'block' }}>
          <polygon points="50,12 63,44 96,44 70,64 80,96 50,76 20,96 30,64 4,44 37,44" fill={corPreenchimento} stroke={corBorda} strokeWidth="5" strokeLinejoin="round" />
        </svg>
      );
    case 'K': // Rei: Círculo com cruz
      return (
        <svg width={largura} height={largura} viewBox="0 0 100 100" style={{ display: 'block' }}>
          <circle cx="50" cy="58" r="28" fill={corPreenchimento} stroke={corBorda} strokeWidth="5" />
          <path d="M50 14 L50 36 M38 25 L62 25" stroke={corBorda} strokeWidth="6" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
};

// Peças de silhueta: formas sólidas monocromáticas (sem require)
const renderizarPecaSilhueta = (cor: 'w' | 'b', tipo: string, largura: number) => {
  const corSolida = cor === 'w' ? '#ffffff' : '#111111';
  const corContorno = cor === 'w' ? '#555' : '#aaa';

  switch (tipo) {
    case 'P':
      return (
        <svg width={largura} height={largura} viewBox="0 0 100 100" style={{ display: 'block' }}>
          <circle cx="50" cy="48" r="22" fill={corSolida} stroke={corContorno} strokeWidth="3" />
          <rect x="30" y="70" width="40" height="10" rx="5" fill={corSolida} stroke={corContorno} strokeWidth="3" />
        </svg>
      );
    case 'R':
      return (
        <svg width={largura} height={largura} viewBox="0 0 100 100" style={{ display: 'block' }}>
          <rect x="26" y="36" width="48" height="40" rx="3" fill={corSolida} stroke={corContorno} strokeWidth="3" />
          <rect x="26" y="26" width="12" height="14" rx="2" fill={corSolida} stroke={corContorno} strokeWidth="3" />
          <rect x="44" y="26" width="12" height="14" rx="2" fill={corSolida} stroke={corContorno} strokeWidth="3" />
          <rect x="62" y="26" width="12" height="14" rx="2" fill={corSolida} stroke={corContorno} strokeWidth="3" />
          <rect x="20" y="76" width="60" height="8" rx="4" fill={corSolida} stroke={corContorno} strokeWidth="3" />
        </svg>
      );
    case 'N':
      return (
        <svg width={largura} height={largura} viewBox="0 0 100 100" style={{ display: 'block' }}>
          <polygon points="50,18 22,80 78,80" fill={corSolida} stroke={corContorno} strokeWidth="3" strokeLinejoin="round" />
        </svg>
      );
    case 'B':
      return (
        <svg width={largura} height={largura} viewBox="0 0 100 100" style={{ display: 'block' }}>
          <path d="M50 18 C26 52 30 78 50 78 C70 78 74 52 50 18 Z" fill={corSolida} stroke={corContorno} strokeWidth="3" />
          <rect x="28" y="80" width="44" height="7" rx="3" fill={corSolida} stroke={corContorno} strokeWidth="3" />
        </svg>
      );
    case 'Q':
      return (
        <svg width={largura} height={largura} viewBox="0 0 100 100" style={{ display: 'block' }}>
          <polygon points="50,12 63,44 96,44 70,64 80,96 50,76 20,96 30,64 4,44 37,44" fill={corSolida} stroke={corContorno} strokeWidth="3" strokeLinejoin="round" />
        </svg>
      );
    case 'K':
      return (
        <svg width={largura} height={largura} viewBox="0 0 100 100" style={{ display: 'block' }}>
          <circle cx="50" cy="58" r="30" fill={corSolida} stroke={corContorno} strokeWidth="3" />
          <path d="M50 12 L50 36 M38 24 L62 24" stroke={corSolida.includes('111') ? '#ddd' : '#333'} strokeWidth="7" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
};

export default function TabuleiroJogo({
  fen,
  aoFazerLance,
  orientacao = 'white',
  interativo = true,
  temaTabuleiro,
  temaPecas,
  casasDestacadas = {},
  rotacionado = false
}: PropriedadesTabuleiro) {
  const { estiloTabuleiro, casaEscura, casaClara } = OBTER_ESTILOS_CASAS(temaTabuleiro);

  const aoArrastarPeca = (de: string, para: string) => {
    if (!interativo || !aoFazerLance) return false;
    const promocaoAuto = (para.endsWith('8') || para.endsWith('1')) ? 'q' : undefined;
    return aoFazerLance(de, para, promocaoAuto);
  };

  const pecasCustomizadas: Record<string, any> = {};
  const tipos = ['P', 'R', 'N', 'B', 'Q', 'K'] as const;

  if (temaPecas === 'geometrico') {
    tipos.forEach((tipo) => {
      pecasCustomizadas[`w${tipo}`] = ({ squareWidth }: { squareWidth: number }) =>
        renderizarPecaGeometrica('w', tipo, squareWidth);
      pecasCustomizadas[`b${tipo}`] = ({ squareWidth }: { squareWidth: number }) =>
        renderizarPecaGeometrica('b', tipo, squareWidth);
    });
  } else if (temaPecas === 'silhueta') {
    tipos.forEach((tipo) => {
      pecasCustomizadas[`w${tipo}`] = ({ squareWidth }: { squareWidth: number }) =>
        renderizarPecaSilhueta('w', tipo, squareWidth);
      pecasCustomizadas[`b${tipo}`] = ({ squareWidth }: { squareWidth: number }) =>
        renderizarPecaSilhueta('b', tipo, squareWidth);
    });
  }

  const classesContainer = [
    'tabuleiro-container-central',
    rotacionado ? 'tabuleiro-rotacionado' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={classesContainer}>
      <Chessboard
        position={fen}
        onPieceDrop={aoArrastarPeca}
        boardOrientation={orientacao}
        arePiecesDraggable={interativo}
        customBoardStyle={estiloTabuleiro as Record<string, string | number>}
        customDarkSquareStyle={casaEscura as Record<string, string>}
        customLightSquareStyle={casaClara as Record<string, string>}
        customSquareStyles={casasDestacadas}
        customPieces={Object.keys(pecasCustomizadas).length > 0 ? pecasCustomizadas : undefined}
      />
    </div>
  );
}
