import React, { useState, useRef } from 'react';
import { usePerfilStore } from '../armazenadores/usePerfilStore';
import { Partida } from '../tipos';
import ModalVisualizador from '../componentes/ModalVisualizador';
import { User, Users, BarChart2, History, LogIn, LogOut, RefreshCw, Download, ExternalLink, Copy, Pencil, Check, X } from 'lucide-react';

// Avatar SVG de silhueta geométrica padrão (hsl(240, 5%, 26%) conforme design guide)
function AvatarPadrao({ tamanho = 80, inicial = '?' }: { tamanho?: number; inicial?: string }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 80 80"
      style={{ borderRadius: '50%', flexShrink: 0 }}
    >
      <circle cx="40" cy="40" r="40" fill="hsl(240, 5%, 26%)" />
      <circle cx="40" cy="30" r="12" fill="hsl(240, 5%, 45%)" />
      <ellipse cx="40" cy="65" rx="20" ry="16" fill="hsl(240, 5%, 45%)" />
      <text
        x="40"
        y="34"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="14"
        fontWeight="600"
        fill="hsl(0, 0%, 98%)"
        fontFamily="Outfit, sans-serif"
      >
        {inicial}
      </text>
    </svg>
  );
}

// Campo de nome com edição inline por ícone de lápis
function CampoNomeInline({
  valor,
  aoSalvar
}: {
  valor: string;
  aoSalvar: (novoNome: string) => void;
}) {
  const [editando, definirEditando] = useState(false);
  const [rascunho, definirRascunho] = useState(valor);
  const inputRef = useRef<HTMLInputElement>(null);

  const iniciarEdicao = () => {
    definirRascunho(valor);
    definirEditando(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const confirmar = () => {
    if (rascunho.trim()) {
      aoSalvar(rascunho.trim());
    }
    definirEditando(false);
  };

  const cancelar = () => {
    definirRascunho(valor);
    definirEditando(false);
  };

  if (editando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          ref={inputRef}
          type="text"
          value={rascunho}
          onChange={(e) => definirRascunho(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmar();
            if (e.key === 'Escape') cancelar();
          }}
          className="campo-texto"
          style={{ maxWidth: '220px', padding: '0.35rem 0.65rem', fontSize: '1rem' }}
        />
        <button
          type="button"
          onClick={confirmar}
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: 'hsl(142, 72%, 55%)',
            borderRadius: '8px',
            padding: '0.3rem 0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label="Confirmar nome"
        >
          <Check size={14} />
        </button>
        <button
          type="button"
          onClick={cancelar}
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: 'hsl(0, 84%, 65%)',
            borderRadius: '8px',
            padding: '0.3rem 0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label="Cancelar edição"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{
        fontFamily: 'var(--fonte-principal)',
        fontSize: '1.1rem',
        fontWeight: 500,
        color: 'var(--cor-texto)'
      }}>
        {valor}
      </span>
      <button
        type="button"
        onClick={iniciarEdicao}
        title="Editar nome"
        style={{
          background: 'transparent',
          border: '1px solid transparent',
          color: 'var(--cor-texto-mutado)',
          cursor: 'pointer',
          padding: '0.25rem',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--cor-borda)';
          e.currentTarget.style.color = 'var(--cor-texto)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.color = 'var(--cor-texto-mutado)';
        }}
        aria-label="Editar nome"
      >
        <Pencil size={13} />
      </button>
    </div>
  );
}

export default function Perfil() {
  const {
    perfilGeral,
    oponenteLocal,
    historicoPartidas,
    token,
    usuarioLogado,
    sincronizando,
    erroAutenticacao,
    erroSincronizacao,
    definirPerfilGeral,
    definirOponenteLocal,
    fazerLogin,
    deslogar,
    sincronizarComNuvem
  } = usePerfilStore();

  const [subAba, definirSubAba] = useState<'perfil' | 'oponente' | 'estatisticas' | 'historico' | 'nuvem'>('perfil');
  const [partidaSelecionada, definirPartidaSelecionada] = useState<Partida | null>(null);

  // Estados dos Formulários de Edição
  const [fotoUsuario, definirFotoUsuario] = useState<string | null>(perfilGeral.fotoBase64);
  const [fotoOponente, definirFotoOponente] = useState<string | null>(oponenteLocal.fotoBase64);

  // Formulário de Login
  const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState('');
  const [mensagemSucesso, definirMensagemSucesso] = useState<string | null>(null);

  // Filtros de Estatísticas
  const [filtroTipo, definirFiltroTipo] = useState<'tudo' | 'engine' | 'local'>('tudo');
  const [filtroPeriodo, definirFiltroPeriodo] = useState<'todos' | '7dias' | 'mes'>('todos');

  const notificarSucesso = (mensagem: string) => {
    definirMensagemSucesso(mensagem);
    setTimeout(() => definirMensagemSucesso(null), 3000);
  };

  // Conversão de arquivo para Base64
  const tratarUploadFoto = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'usuario' | 'oponente') => {
    const arquivo = e.target.files?.[0];
    if (arquivo) {
      const leitor = new FileReader();
      leitor.onloadend = () => {
        const resultadoBase64 = leitor.result as string;
        if (tipo === 'usuario') {
          definirFotoUsuario(resultadoBase64);
          definirPerfilGeral(perfilGeral.nome, resultadoBase64);
          notificarSucesso('Foto de perfil atualizada!');
        } else {
          definirFotoOponente(resultadoBase64);
          definirOponenteLocal(oponenteLocal.nome, resultadoBase64);
          notificarSucesso('Foto do oponente atualizada!');
        }
      };
      leitor.readAsDataURL(arquivo);
    }
  };

  const tratarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const sucesso = await fazerLogin(email, senha);
    if (sucesso) {
      notificarSucesso('Login e Sincronização realizados com sucesso!');
      definirEmail('');
      definirSenha('');
    }
  };

  // Cálculo das Estatísticas
  const partidasFiltradas = historicoPartidas.filter((partida) => {
    if (filtroTipo === 'engine' && partida.tipoOponente !== 'engine') return false;
    if (filtroTipo === 'local' && partida.tipoOponente !== 'local') return false;
    const limiteTempo = Date.now() - (filtroPeriodo === '7dias' ? 7 : 30) * 24 * 60 * 60 * 1000;
    if (filtroPeriodo === '7dias' && partida.data < limiteTempo) return false;
    if (filtroPeriodo === 'mes' && partida.data < limiteTempo) return false;
    return true;
  });

  const vitorias = partidasFiltradas.filter(p => p.resultado === 'win').length;
  const derrotas = partidasFiltradas.filter(p => p.resultado === 'loss').length;
  const empates = partidasFiltradas.filter(p => p.resultado === 'draw').length;
  const total = partidasFiltradas.length;

  const mediaLances = total > 0
    ? Math.round(partidasFiltradas.reduce((soma, p) => soma + p.totalLances, 0) / total)
    : 0;

  const percentualC1 = total > 0 ? ((vitorias / total) * 100).toFixed(1) : '0';
  const percentualC2 = (vitorias + derrotas) > 0 ? ((vitorias / (vitorias + derrotas)) * 100).toFixed(1) : '0';

  const exportarJSON = () => {
    const dadosExportar = { jogador: perfilGeral.nome, totalPartidas: total, vitorias, derrotas, empates, partidas: partidasFiltradas };
    const stringJson = JSON.stringify(dadosExportar, null, 2);
    const blob = new Blob([stringJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estatisticas_xadrez_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copiarEstatisticasClipboard = () => {
    const texto = `Estatísticas Xadrez - ${perfilGeral.nome}\nVitórias: ${vitorias}\nDerrotas: ${derrotas}\nEmpates: ${empates}\nTotal Jogos: ${total}\nMédia de Lances: ${mediaLances}\nAproveitamento Total: ${percentualC1}%`;
    navigator.clipboard.writeText(texto);
    notificarSucesso('Estatísticas copiadas para a área de transferência!');
  };

  const estilosSubAba = (ativa: boolean): React.CSSProperties => ({
    background: ativa ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
    border: `1px solid ${ativa ? 'rgba(139,92,246,0.3)' : 'var(--cor-borda)'}`,
    color: ativa ? '#fff' : 'var(--cor-texto-mutado)',
    padding: '0.65rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'var(--fonte-principal)',
    fontWeight: 500,
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  });

  return (
    <div className="layout-aprender">
      {/* Menu Lateral de Sub-Abas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <button onClick={() => definirSubAba('perfil')} style={estilosSubAba(subAba === 'perfil')}>
          <User size={16} />
          <span>Perfil Geral</span>
        </button>
        <button onClick={() => definirSubAba('oponente')} style={estilosSubAba(subAba === 'oponente')}>
          <Users size={16} />
          <span>Oponente Local</span>
        </button>
        <button onClick={() => definirSubAba('estatisticas')} style={estilosSubAba(subAba === 'estatisticas')}>
          <BarChart2 size={16} />
          <span>Estatísticas</span>
        </button>
        <button onClick={() => definirSubAba('historico')} style={estilosSubAba(subAba === 'historico')}>
          <History size={16} />
          <span>Histórico</span>
        </button>
        <button
          onClick={() => definirSubAba('nuvem')}
          style={{
            ...estilosSubAba(subAba === 'nuvem'),
            borderColor: token ? 'hsla(142, 72%, 40%, 0.4)' : (subAba === 'nuvem' ? 'rgba(139,92,246,0.3)' : 'var(--cor-borda)')
          }}
        >
          <LogIn size={16} />
          <span>{token ? '✓ Sincronizado' : 'Nuvem e Login'}</span>
        </button>
      </div>

      {/* Painel Principal de Sub-Aba */}
      <div className="cartao-vidro">
        {mensagemSucesso && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid hsla(142, 72%, 40%, 0.35)',
            color: 'hsl(142, 72%, 55%)',
            padding: '0.75rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            fontSize: '0.88rem',
            textAlign: 'center',
            fontFamily: 'var(--fonte-apoio)'
          }}>
            {mensagemSucesso}
          </div>
        )}

        {/* 1. Sub-aba Perfil Geral */}
        {subAba === 'perfil' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '420px' }}>
            <div>
              <h2>Perfil Geral</h2>
              <p>Personalize suas informações exibidas durante as partidas.</p>
            </div>

            {/* Avatar + Edição de nome inline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <label htmlFor="upload-foto-usuario" style={{ cursor: 'pointer', position: 'relative' }}>
                {fotoUsuario ? (
                  <img
                    src={fotoUsuario}
                    alt="Foto Perfil"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      border: '2px solid var(--cor-primaria)',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <AvatarPadrao tamanho={80} inicial={perfilGeral.nome.charAt(0).toUpperCase()} />
                )}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: 'var(--cor-primaria)',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--cor-fundo)'
                }}>
                  <Pencil size={10} color="#fff" />
                </div>
              </label>
              <input
                id="upload-foto-usuario"
                type="file"
                accept="image/*"
                onChange={(e) => tratarUploadFoto(e, 'usuario')}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span className="campo-etiqueta">Nome do Jogador</span>
                <CampoNomeInline
                  valor={perfilGeral.nome}
                  aoSalvar={(novoNome) => {
                    definirPerfilGeral(novoNome, fotoUsuario);
                    notificarSucesso('Nome atualizado!');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Sub-aba Oponente Local */}
        {subAba === 'oponente' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '420px' }}>
            <div>
              <h2>Oponente Local</h2>
              <p>Configure as informações de exibição do oponente no modo 1v1 Local.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <label htmlFor="upload-foto-oponente" style={{ cursor: 'pointer', position: 'relative' }}>
                {fotoOponente ? (
                  <img
                    src={fotoOponente}
                    alt="Foto Oponente"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      border: '2px solid var(--cor-borda)',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <AvatarPadrao tamanho={80} inicial={oponenteLocal.nome.charAt(0).toUpperCase()} />
                )}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: 'hsl(240, 5%, 35%)',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--cor-fundo)'
                }}>
                  <Pencil size={10} color="#fff" />
                </div>
              </label>
              <input
                id="upload-foto-oponente"
                type="file"
                accept="image/*"
                onChange={(e) => tratarUploadFoto(e, 'oponente')}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span className="campo-etiqueta">Nome do Oponente</span>
                <CampoNomeInline
                  valor={oponenteLocal.nome}
                  aoSalvar={(novoNome) => {
                    definirOponenteLocal(novoNome, fotoOponente);
                    notificarSucesso('Nome do oponente atualizado!');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Sub-aba Estatísticas */}
        {subAba === 'estatisticas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h2>Estatísticas Gerais</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={filtroTipo}
                  onChange={(e) => definirFiltroTipo(e.target.value as any)}
                  className="campo-texto"
                  style={{ width: '130px', fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                >
                  <option value="tudo">Todos Modos</option>
                  <option value="engine">VS Robô</option>
                  <option value="local">1v1 Local</option>
                </select>
                <select
                  value={filtroPeriodo}
                  onChange={(e) => definirFiltroPeriodo(e.target.value as any)}
                  className="campo-texto"
                  style={{ width: '140px', fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                >
                  <option value="todos">Todo período</option>
                  <option value="7dias">Últimos 7 dias</option>
                  <option value="mes">Último mês</option>
                </select>
              </div>
            </div>

            {/* Cartões de Métricas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
              {[
                { rotulo: 'Vitórias', valor: vitorias, cor: 'hsl(142, 72%, 55%)', fundo: 'rgba(16,185,129,0.06)' },
                { rotulo: 'Derrotas', valor: derrotas, cor: 'hsl(0, 84%, 65%)', fundo: 'rgba(239,68,68,0.06)' },
                { rotulo: 'Empates', valor: empates, cor: 'hsl(240, 5%, 65%)', fundo: 'rgba(255,255,255,0.02)' },
                { rotulo: 'Partidas', valor: total, cor: 'var(--cor-primaria)', fundo: 'rgba(139,92,246,0.06)' }
              ].map(({ rotulo, valor, cor, fundo }) => (
                <div
                  key={rotulo}
                  className="cartao-vidro"
                  style={{ padding: '1rem', textAlign: 'center', background: fundo }}
                >
                  <span className="campo-etiqueta">{rotulo}</span>
                  <strong style={{ display: 'block', fontSize: '2rem', color: cor, fontFamily: 'var(--fonte-principal)' }}>
                    {valor}
                  </strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="cartao-vidro" style={{ padding: '1rem' }}>
                <span className="campo-etiqueta">Aproveitamento (C1)</span>
                <strong style={{ fontSize: '1.25rem', color: '#fff', display: 'block' }}>{percentualC1}%</strong>
                <p style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>Vitórias / total de jogos.</p>
              </div>
              <div className="cartao-vidro" style={{ padding: '1rem' }}>
                <span className="campo-etiqueta">V/D (C2)</span>
                <strong style={{ fontSize: '1.25rem', color: '#fff', display: 'block' }}>{percentualC2}%</strong>
                <p style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>Exclui empates do cálculo.</p>
              </div>
              <div className="cartao-vidro" style={{ padding: '1rem', gridColumn: 'span 2' }}>
                <span className="campo-etiqueta">Média de Lances por Jogo</span>
                <strong style={{ fontSize: '1.25rem', color: '#fff', display: 'block' }}>{mediaLances} lances</strong>
                <p style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>Média de jogadas até o final da partida.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={exportarJSON} className="botao botao-secundario" style={{ fontSize: '0.85rem' }}>
                <Download size={15} /><span>Exportar JSON</span>
              </button>
              <button onClick={copiarEstatisticasClipboard} className="botao botao-secundario" style={{ fontSize: '0.85rem' }}>
                <Copy size={15} /><span>Copiar</span>
              </button>
              <button onClick={() => window.open('https://lichess.org/paste', '_blank')} className="botao botao-primario" style={{ fontSize: '0.85rem' }}>
                <ExternalLink size={15} /><span>Análise Lichess</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Sub-aba Histórico de Partidas */}
        {subAba === 'historico' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h2>Histórico de Partidas</h2>
              <p>Lista de partidas anteriores registradas localmente.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '450px', overflowY: 'auto', paddingRight: '0.4rem' }}>
              {historicoPartidas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--cor-texto-mutado)', fontFamily: 'var(--fonte-apoio)' }}>
                  Nenhuma partida jogada ainda. Comece a jogar para ver seu histórico aqui!
                </div>
              ) : (
                historicoPartidas.map((partida) => {
                  const dataFormatada = new Date(partida.data).toLocaleDateString('pt-BR');
                  const resultadoLegenda = partida.resultado === 'win' ? 'Vitória' : partida.resultado === 'loss' ? 'Derrota' : 'Empate';
                  const corResultado = partida.resultado === 'win'
                    ? 'hsl(142, 72%, 55%)'
                    : partida.resultado === 'loss'
                    ? 'hsl(0, 84%, 65%)'
                    : 'var(--cor-texto-mutado)';
                  return (
                    <div
                      key={partida.id}
                      onClick={() => definirPartidaSelecionada(partida)}
                      className="cartao-vidro"
                      style={{
                        padding: '0.9rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.95rem', fontFamily: 'var(--fonte-principal)' }}>
                          vs {partida.nomeOponente}
                        </strong>
                        <p style={{ fontSize: '0.78rem', marginTop: '0.1rem', fontFamily: 'var(--fonte-apoio)' }}>
                          {dataFormatada} · {partida.controleTempo} · {partida.totalLances} lances
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: corResultado }}>
                          {resultadoLegenda}
                        </span>
                        <ExternalLink size={13} style={{ color: 'var(--cor-texto-mutado)' }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 5. Sub-aba Nuvem e Login */}
        {subAba === 'nuvem' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '450px' }}>
            <h2>Sincronização em Nuvem</h2>

            {usuarioLogado ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="cartao-vidro" style={{ border: '1px solid hsla(142, 72%, 40%, 0.35)', background: 'rgba(16,185,129,0.04)' }}>
                  <h4 style={{ color: 'hsl(142, 72%, 55%)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontFamily: 'var(--fonte-principal)' }}>
                    <RefreshCw size={16} />
                    <span>Conectado à Nuvem</span>
                  </h4>
                  <p style={{ color: '#fff', fontSize: '0.95rem' }}><strong>Nome:</strong> {usuarioLogado.nome}</p>
                  <p style={{ color: 'var(--cor-texto-mutado)', fontSize: '0.85rem' }}><strong>Email:</strong> {usuarioLogado.email}</p>
                </div>

                {erroSincronizacao && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid hsla(0,84%,60%,0.3)', color: 'hsl(0,84%,65%)', padding: '0.65rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {erroSincronizacao}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => sincronizarComNuvem()} className="botao botao-primario" style={{ flexGrow: 1 }} disabled={sincronizando}>
                    <RefreshCw size={16} />
                    <span>{sincronizando ? 'Sincronizando…' : 'Sincronizar Agora'}</span>
                  </button>
                  <button onClick={deslogar} className="botao botao-perigo">
                    <LogOut size={16} />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={tratarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p>Entre com seu e-mail para habilitar a sincronização de estatísticas e partidas.</p>
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--cor-borda)',
                  fontSize: '0.8rem',
                  color: 'var(--cor-texto-mutado)',
                  fontFamily: 'var(--fonte-apoio)'
                }}>
                  💡 O cadastro é automático. Digite qualquer e-mail/senha válidos para registrar-se ou use admin@example.com / password123.
                </div>

                {erroAutenticacao && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid hsla(0,84%,60%,0.3)', color: 'hsl(0,84%,65%)', padding: '0.65rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {erroAutenticacao}
                  </div>
                )}

                <div>
                  <label className="campo-etiqueta">E-mail</label>
                  <input
                    type="email"
                    required
                    className="campo-texto"
                    value={email}
                    onChange={(e) => definirEmail(e.target.value)}
                    placeholder="exemplo@xadrez.com"
                  />
                </div>
                <div>
                  <label className="campo-etiqueta">Senha</label>
                  <input
                    type="password"
                    required
                    className="campo-texto"
                    value={senha}
                    onChange={(e) => definirSenha(e.target.value)}
                    placeholder="Sua senha"
                  />
                </div>

                <button type="submit" className="botao botao-primario" style={{ width: '100%' }} disabled={sincronizando}>
                  <LogIn size={16} />
                  <span>{sincronizando ? 'Conectando…' : 'Entrar / Cadastrar'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Visualizador Individual de Histórico */}
      {partidaSelecionada && (
        <ModalVisualizador
          partida={partidaSelecionada}
          aoFechar={() => definirPartidaSelecionada(null)}
        />
      )}
    </div>
  );
}
