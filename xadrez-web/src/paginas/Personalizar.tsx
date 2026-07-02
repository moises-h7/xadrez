import React from 'react';
import { useConfiguracaoStore, TemaTabuleiro, TemaPecas } from '../armazenadores/useConfiguracaoStore';
import { Palette, Layers, RefreshCw, Check } from 'lucide-react';

export default function Personalizar() {
  const {
    temaTabuleiro,
    temaPecas,
    rotacaoAutomaticaLocal,
    definirTemaTabuleiro,
    definirTemaPecas,
    definirRotacaoAutomaticaLocal
  } = useConfiguracaoStore();

  // Temas do tabuleiro com paleta HSL alinhada ao design guide
  const temasTabuleiro: { id: TemaTabuleiro; nome: string; descricao: string; claro: string; escuro: string }[] = [
    {
      id: 'moderno-gelo',
      nome: 'Modern Ice',
      descricao: 'Visual premium com tons frios de azul e cinza claro.',
      claro: 'hsl(210, 20%, 94%)',
      escuro: 'hsl(217, 30%, 45%)'
    },
    {
      id: 'madeira-classico',
      nome: 'Classic Wood',
      descricao: 'Aparência aconchegante de tabuleiro de madeira tradicional.',
      claro: 'hsl(35, 35%, 85%)',
      escuro: 'hsl(28, 45%, 40%)'
    },
    {
      id: 'cyberpunk',
      nome: 'Cyberpunk Neon',
      descricao: 'Visual futurista com violeta escuro e brilho neon roxo.',
      claro: 'hsl(320, 20%, 15%)',
      escuro: 'hsl(320, 90%, 8%)'
    },
    {
      id: 'minimalista',
      nome: 'Minimalist Monochromatic',
      descricao: 'Alto contraste com grafite fosco e cinza claro puro.',
      claro: 'hsl(0, 0%, 90%)',
      escuro: 'hsl(0, 0%, 25%)'
    }
  ];

  const temasPecas: { id: TemaPecas; nome: string; descricao: string }[] = [
    {
      id: 'neo-classico',
      nome: 'Neo-Classic',
      descricao: 'Design vetorial clássico com linhas finas e elegantes.'
    },
    {
      id: 'geometrico',
      nome: 'Geometric Art',
      descricao: 'Formas geométricas abstratas — círculos, quadrados e triângulos.'
    },
    {
      id: 'silhueta',
      nome: 'Silhouette',
      descricao: 'Silhuetas planas com cores sólidas e máximo contraste.'
    }
  ];

  const estiloCartaoTema = (selecionado: boolean): React.CSSProperties => ({
    padding: '0.85rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    background: selecionado ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.015)',
    border: `1px solid ${selecionado ? 'hsla(263, 70%, 50%, 0.4)' : 'var(--cor-borda)'}`,
    borderRadius: '10px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '680px', margin: '0 auto' }}>
      <div>
        <h2>Personalizar Interface</h2>
        <p>Configure a estética do tabuleiro, das peças e o comportamento visual do sistema.</p>
      </div>

      {/* 1. Escolha do Tema do Tabuleiro */}
      <div className="cartao-vidro" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Palette size={18} style={{ color: 'var(--cor-primaria)' }} />
          <span>Tema do Tabuleiro</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {temasTabuleiro.map((tema) => (
            <div
              key={tema.id}
              onClick={() => definirTemaTabuleiro(tema.id)}
              style={estiloCartaoTema(temaTabuleiro === tema.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Mini pré-visualização do tabuleiro (2x2 casas) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  width: '36px',
                  height: '36px',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)',
                  flexShrink: 0
                }}>
                  <div style={{ backgroundColor: tema.claro }} />
                  <div style={{ backgroundColor: tema.escuro }} />
                  <div style={{ backgroundColor: tema.escuro }} />
                  <div style={{ backgroundColor: tema.claro }} />
                </div>

                <div>
                  <strong style={{ fontFamily: 'var(--fonte-principal)', fontSize: '0.95rem' }}>{tema.nome}</strong>
                  <p style={{ fontSize: '0.78rem', marginTop: '0.1rem', fontFamily: 'var(--fonte-apoio)' }}>{tema.descricao}</p>
                </div>
              </div>

              {temaTabuleiro === tema.id && (
                <div style={{
                  background: 'var(--cor-primaria)',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Check size={13} color="#fff" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Escolha do Tema das Peças */}
      <div className="cartao-vidro" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} style={{ color: 'var(--cor-primaria)' }} />
          <span>Tema das Peças</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {temasPecas.map((tema) => (
            <div
              key={tema.id}
              onClick={() => definirTemaPecas(tema.id)}
              style={estiloCartaoTema(temaPecas === tema.id)}
            >
              <div>
                <strong style={{ fontFamily: 'var(--fonte-principal)', fontSize: '0.95rem' }}>{tema.nome}</strong>
                <p style={{ fontSize: '0.78rem', marginTop: '0.1rem', fontFamily: 'var(--fonte-apoio)' }}>{tema.descricao}</p>
              </div>

              {temaPecas === tema.id && (
                <div style={{
                  background: 'var(--cor-primaria)',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Check size={13} color="#fff" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Preferências de Mecânica Visual */}
      <div
        className="cartao-vidro"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          cursor: 'pointer'
        }}
        onClick={() => definirRotacaoAutomaticaLocal(!rotacaoAutomaticaLocal)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <RefreshCw size={18} style={{ color: 'var(--cor-primaria)', flexShrink: 0 }} />
          <div>
            <strong style={{ fontFamily: 'var(--fonte-principal)', fontSize: '0.95rem' }}>Girar Tabuleiro no 1v1 Local</strong>
            <p style={{ fontSize: '0.78rem', marginTop: '0.1rem', fontFamily: 'var(--fonte-apoio)' }}>
              Girar o tabuleiro automaticamente para o jogador da vez.
            </p>
          </div>
        </div>

        {/* Toggle visual personalizado */}
        <div
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            background: rotacaoAutomaticaLocal ? 'var(--cor-primaria)' : 'rgba(255,255,255,0.1)',
            border: `1px solid ${rotacaoAutomaticaLocal ? 'var(--cor-primaria)' : 'var(--cor-borda)'}`,
            position: 'relative',
            transition: 'all 0.25s ease',
            flexShrink: 0
          }}
        >
          <div style={{
            position: 'absolute',
            top: '3px',
            left: rotacaoAutomaticaLocal ? '22px' : '3px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }} />
        </div>
      </div>
    </div>
  );
}
