import React, { useState } from 'react';
import BarraNavegacao from './componentes/BarraNavegacao';
import Jogar from './paginas/Jogar';
import Aprender from './paginas/Aprender';
import Perfil from './paginas/Perfil';
import Personalizar from './paginas/Personalizar';
import { usePerfilStore } from './armazenadores/usePerfilStore';
import { Cloud, CloudOff } from 'lucide-react';

export default function App() {
  const [abaAtiva, definirAbaAtiva] = useState<string>('jogar');
  const { usuarioLogado } = usePerfilStore();

  const renderizarConteudoAba = () => {
    switch (abaAtiva) {
      case 'jogar':
        return <Jogar />;
      case 'aprender':
        return <Aprender />;
      case 'perfil':
        return <Perfil />;
      case 'personalizar':
        return <Personalizar />;
      default:
        return <Jogar />;
    }
  };

  return (
    <div className="app-container">
      {/* Cabeçalho Superior da SPA */}
      <header className="cabecalho-app">
        <div>
          <h1>Xadrez</h1>
          <p style={{ fontSize: '0.85rem' }}>Web Chess Experience</p>
        </div>

        {/* Menu de Abas */}
        <BarraNavegacao abaAtiva={abaAtiva} definirAbaAtiva={definirAbaAtiva} />

        {/* Status de Sincronização em Nuvem no Topo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {usuarioLogado ? (
            <div
              title={`Logado como ${usuarioLogado.nome}. Sincronização ativada.`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                color: 'var(--cor-sucesso)',
                background: 'rgba(16, 185, 129, 0.08)',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}
            >
              <Cloud size={14} />
              <span>Conectado</span>
            </div>
          ) : (
            <div
              title="Apenas jogando localmente. Entre no Perfil para sincronizar na nuvem."
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                color: 'var(--cor-texto-mutado)',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--cor-borda)'
              }}
            >
              <CloudOff size={14} />
              <span>Local</span>
            </div>
          )}
        </div>
      </header>

      {/* Renderização Dinâmica da Aba Selecionada */}
      <main style={{ minHeight: '60vh', marginTop: '0.5rem' }}>
        {renderizarConteudoAba()}
      </main>

      {/* Rodapé Premium */}
      <footer style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--cor-borda)', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem' }}>
          &copy; {new Date().getFullYear()} Web Chess. Feito com amor em React e TypeScript.
        </p>
      </footer>
    </div>
  );
}
