import React, { useState } from 'react';
import { Bot, Users, Play } from 'lucide-react';
import { ConfiguracaoJogo } from '../tipos';

interface PropriedadesSeletor {
  aoIniciarJogo: (config: ConfiguracaoJogo) => void;
}

export default function SeletorModo({ aoIniciarJogo }: PropriedadesSeletor) {
  const [modo, setModo] = useState<'robo' | 'local'>('robo');
  
  // Configurações do Robô
  const [dificuldadeRobo, setDificuldadeRobo] = useState<number>(3);
  const [corJogador, setCorJogador] = useState<'w' | 'b' | 'random'>('random');
  const [tempoLimite, setTempoLimite] = useState<number>(10); // minutos (10 default)

  // Configurações Local 1v1
  const [rotacaoAutomatica, setRotacaoAutomatica] = useState<boolean>(false);
  const [corJogador1, setCorJogador1] = useState<'w' | 'b' | 'random'>('w');

  const iniciar = () => {
    const config: ConfiguracaoJogo = {
      modo,
      dificuldadeRobo,
      corJogador,
      tempoLimiteMinutos: tempoLimite,
      rotacaoAutomatica,
      corJogador1,
      corJogador2: corJogador1 === 'w' ? 'b' : corJogador1 === 'b' ? 'w' : 'random'
    };
    aoIniciarJogo(config);
  };

  const opcoesTempo = [
    { rotulo: 'Sem tempo', valor: 0 },
    { rotulo: '30 min', valor: 30 },
    { rotulo: '10 min', valor: 10 },
    { rotulo: '5 min', valor: 5 },
    { rotulo: '3 min', valor: 3 },
    { rotulo: '1 min', valor: 1 },
  ];

  return (
    <div className="cartao-vidro" style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Configurar Partida</h2>

      {/* Seleção do Modo de Jogo */}
      <div className="grade-modos">
        <div
          onClick={() => setModo('robo')}
          className={`modo-opcao ${modo === 'robo' ? 'ativo' : ''}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Bot size={22} className={modo === 'robo' ? 'text-primary' : ''} />
            <strong>Contra o Robô</strong>
          </div>
          <p style={{ fontSize: '0.85rem' }}>Desafie a inteligência artificial do Stockfish localmente.</p>
        </div>

        <div
          onClick={() => setModo('local')}
          className={`modo-opcao ${modo === 'local' ? 'ativo' : ''}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Users size={22} className={modo === 'local' ? 'text-primary' : ''} />
            <strong>1v1 Local</strong>
          </div>
          <p style={{ fontSize: '0.85rem' }}>Jogue com um amigo compartilhando a mesma tela.</p>
        </div>
      </div>

      {/* Opções específicas para Modo Robô */}
      {modo === 'robo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="campo-etiqueta">Nível de Dificuldade</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((lvl) => {
                const rotulos = ['Muito Fácil', 'Fácil', 'Médio', 'Difícil', 'Muito Difícil'];
                return (
                  <button
                    key={lvl}
                    onClick={() => setDificuldadeRobo(lvl)}
                    className={`botao botao-secundario`}
                    style={{
                      flexGrow: 1,
                      background: dificuldadeRobo === lvl ? 'var(--cor-primaria)' : 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      border: '1px solid var(--cor-borda)',
                      padding: '0.5rem'
                    }}
                    title={rotulos[lvl - 1]}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '0.4rem', color: 'var(--cor-primaria)' }}>
              Nível {dificuldadeRobo}: {['Muito Fácil', 'Fácil', 'Médio', 'Difícil', 'Muito Difícil'][dificuldadeRobo - 1]}
            </p>
          </div>

          <div>
            <label className="campo-etiqueta">Sua Cor</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setCorJogador('w')}
                className="botao botao-secundario"
                style={{ flexGrow: 1, background: corJogador === 'w' ? 'var(--cor-primaria)' : 'rgba(255,255,255,0.03)', color: '#fff' }}
              >
                Brancas
              </button>
              <button
                onClick={() => setCorJogador('random')}
                className="botao botao-secundario"
                style={{ flexGrow: 1, background: corJogador === 'random' ? 'var(--cor-primaria)' : 'rgba(255,255,255,0.03)', color: '#fff' }}
              >
                Aleatório
              </button>
              <button
                onClick={() => setCorJogador('b')}
                className="botao botao-secundario"
                style={{ flexGrow: 1, background: corJogador === 'b' ? 'var(--cor-primaria)' : 'rgba(255,255,255,0.03)', color: '#fff' }}
              >
                Pretas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Opções específicas para Modo Local */}
      {modo === 'local' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>Rotação Automática</strong>
              <p style={{ fontSize: '0.8rem' }}>Girar o tabuleiro a cada lance para o jogador da vez.</p>
            </div>
            <input
              type="checkbox"
              checked={rotacaoAutomatica}
              onChange={(e) => setRotacaoAutomatica(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div>
            <label className="campo-etiqueta">Cor Jogador 1</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setCorJogador1('w')}
                className="botao"
                style={{ flexGrow: 1, background: corJogador1 === 'w' ? 'var(--cor-primaria)' : 'rgba(255,255,255,0.03)', color: '#fff' }}
              >
                Brancas
              </button>
              <button
                onClick={() => setCorJogador1('random')}
                className="botao"
                style={{ flexGrow: 1, background: corJogador1 === 'random' ? 'var(--cor-primaria)' : 'rgba(255,255,255,0.03)', color: '#fff' }}
              >
                Aleatório
              </button>
              <button
                onClick={() => setCorJogador1('b')}
                className="botao"
                style={{ flexGrow: 1, background: corJogador1 === 'b' ? 'var(--cor-primaria)' : 'rgba(255,255,255,0.03)', color: '#fff' }}
              >
                Pretas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controle de Tempo */}
      <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
        <label className="campo-etiqueta">Controle de Tempo</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {opcoesTempo.map((t) => (
            <button
              key={t.valor}
              onClick={() => setTempoLimite(t.valor)}
              className="botao"
              style={{
                background: tempoLimite === t.valor ? 'var(--cor-primaria)' : 'rgba(255,255,255,0.03)',
                color: '#fff',
                fontSize: '0.85rem',
                padding: '0.5rem'
              }}
            >
              {t.rotulo}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={iniciar}
        className="botao botao-primario"
        style={{ width: '100%', padding: '0.9rem' }}
      >
        <Play size={18} fill="#fff" />
        <span>Começar Partida</span>
      </button>
    </div>
  );
}
