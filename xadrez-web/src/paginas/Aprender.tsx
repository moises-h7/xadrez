import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import TabuleiroJogo from '../componentes/TabuleiroJogo';
import { useConfiguracaoStore } from '../armazenadores/useConfiguracaoStore';
import { Book, RotateCcw } from 'lucide-react';

interface ItemDicionario {
  id: string;
  nome: string;
  categoria: 'pecas' | 'especiais';
  valor?: string;
  descricao: string;
  fenInicial: string;
  detalhes: string;
}

const ITENS_DICIONARIO: ItemDicionario[] = [
  {
    id: 'peao',
    nome: 'Peão',
    categoria: 'pecas',
    valor: '1 Ponto',
    descricao: 'A peça mais numerosa do xadrez. Move-se uma casa para a frente (ou duas no primeiro lance) e captura na diagonal.',
    fenInicial: '8/8/8/8/4P3/8/8/8 w - - 0 1',
    detalhes: 'O peão é a alma do xadrez. Embora seja a peça de menor valor individual, sua estrutura define os planos de ataque e defesa. Mova o peão na tela para praticar.'
  },
  {
    id: 'bispo',
    nome: 'Bispo',
    categoria: 'pecas',
    valor: '3 Pontos',
    descricao: 'Move-se em diagonal quantas casas quiser. Cada jogador começa com dois bispos (um de casas claras e outro de escuras).',
    fenInicial: '8/8/8/4B3/8/8/8/8 w - - 0 1',
    detalhes: 'O bispo é uma peça de longo alcance. Ele nunca pode mudar a cor das casas em que se move. Tente mover o bispo pelas diagonais do mini-tabuleiro.'
  },
  {
    id: 'cavalo',
    nome: 'Cavalo',
    categoria: 'pecas',
    valor: '3 Pontos',
    descricao: 'Move-se em formato de "L" (duas casas em uma direção e uma na perpendicular) e pode pular sobre outras peças.',
    fenInicial: '8/8/8/4N3/8/8/8/8 w - - 0 1',
    detalhes: 'O cavalo é a única peça capaz de saltar sobre outras. Ele é altamente tático em posições fechadas devido aos seus movimentos imprevisíveis.'
  },
  {
    id: 'torre',
    nome: 'Torre',
    categoria: 'pecas',
    valor: '5 Pontos',
    descricao: 'Move-se em linha reta horizontal ou verticalmente por qualquer número de casas livres.',
    fenInicial: '8/8/8/4R3/8/8/8/8 w - - 0 1',
    detalhes: 'As torres são peças maiores e muito poderosas na fase final do jogo. Elas funcionam melhor em colunas abertas onde não há peões bloqueando seu caminho.'
  },
  {
    id: 'dama',
    nome: 'Dama',
    categoria: 'pecas',
    valor: '9 Pontos',
    descricao: 'A peça mais poderosa. Combina os movimentos da torre e do bispo, movendo-se em reta e diagonal.',
    fenInicial: '8/8/8/4Q3/8/8/8/8 w - - 0 1',
    detalhes: 'A dama é a arma mais destrutiva do jogo. Perder a dama sem compensação geralmente custa a partida. Pratique seus movimentos combinados no tabuleiro.'
  },
  {
    id: 'rei',
    nome: 'Rei',
    categoria: 'pecas',
    valor: 'Vital',
    descricao: 'A peça mais importante. Move-se apenas uma casa em qualquer direção. O objetivo do jogo é dar xeque-mate no rei adversário.',
    fenInicial: '8/8/8/4K3/8/8/8/8 w - - 0 1',
    detalhes: 'O rei não tem um valor de pontuação porque sua captura encerra o jogo. Se o seu rei estiver sob ataque direto e não puder escapar, é xeque-mate.'
  },
  {
    id: 'roque',
    nome: 'Roque',
    categoria: 'especiais',
    descricao: 'Um movimento simultâneo do Rei e da Torre para proteção e desenvolvimento.',
    fenInicial: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
    detalhes: 'Para rocar, nem o rei nem a torre podem ter se movido, o caminho entre eles deve estar livre e o rei não pode estar em xeque ou passar por casas atacadas. Mova o rei branco duas casas para a direita (e1 para g1) ou esquerda (e1 para c1) para ver o roque acontecer!'
  },
  {
    id: 'enpassant',
    nome: 'Captura En Passant',
    categoria: 'especiais',
    descricao: 'Captura especial de peão que ocorre imediatamente após o adversário avançar duas casas.',
    fenInicial: 'rnbqkbnr/pppppp1p/8/8/5Pp1/8/PPPPP1PP/RNBQKBNR b KQkq f3 0 2',
    detalhes: 'Se um peão avançar duas casas no seu primeiro lance e passar ao lado de um peão adversário, este pode capturá-lo "ao passar", movendo-se para a casa que o peão ultrapassou. Como pretas, capture o peão branco movendo de g4 para f3!'
  },
  {
    id: 'promocao',
    nome: 'Promoção de Peão',
    categoria: 'especiais',
    descricao: 'Quando um peão alcança a oitava fileira, ele deve ser promovido a outra peça (geralmente a Dama).',
    fenInicial: '8/3P4/8/8/8/8/8/8 w - - 0 1',
    detalhes: 'A promoção de peão transforma o peão mais simples em uma peça poderosa. Mova o peão branco de d7 para d8 no tabuleiro para promovê-lo a Dama!'
  },
  {
    id: 'empate',
    nome: 'Regras de Empate',
    categoria: 'especiais',
    descricao: 'Partidas terminam empatadas em caso de Afogamento, Repetição, Insuficiência ou Lei dos 50 lances.',
    fenInicial: 'k7/8/1Q6/8/8/8/8/7K w - - 0 1',
    detalhes: 'O Afogamento (Stalemate) ocorre quando o jogador da vez não tem lances legais e seu rei não está em xeque. Tente mover a Dama branca de b6 para c7 - como o Rei preto não poderá se mover nem está em xeque, o jogo terminará empatado instantaneamente!'
  }
];

export default function Aprender() {
  const { temaTabuleiro, temaPecas } = useConfiguracaoStore();
  const [itemSelecionado, setItemSelecionado] = useState<ItemDicionario>(ITENS_DICIONARIO[0]);
  
  // Estado local do mini-jogo de xadrez para demonstração
  const [jogoLocal, setJogoLocal] = useState<Chess>(new Chess(itemSelecionado.fenInicial));
  const [fenLocal, setFenLocal] = useState<string>(itemSelecionado.fenInicial);

  // Reinicia o mini-tabuleiro ao trocar o item selecionado
  useEffect(() => {
    const novoJogo = new Chess(itemSelecionado.fenInicial);
    setJogoLocal(novoJogo);
    setFenLocal(novoJogo.fen());
  }, [itemSelecionado]);

  const resetarPosicao = () => {
    const novoJogo = new Chess(itemSelecionado.fenInicial);
    setJogoLocal(novoJogo);
    setFenLocal(novoJogo.fen());
  };

  const aoFazerLanceLocal = (de: string, para: string, promocao?: string) => {
    try {
      // Para demonstração de roque ou promoção, permitimos escolher peças
      const lance = jogoLocal.move({
        from: de,
        to: para,
        promotion: promocao || 'q'
      });

      if (lance) {
        setFenLocal(jogoLocal.fen());
        return true;
      }
    } catch (e) {
      console.warn('Lance de instrução inválido');
    }
    return false;
  };

  return (
    <div className="layout-aprender">
      {/* Menu Lateral de Seleção */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h4 style={{ color: 'var(--cor-texto-mutado)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Peças de Xadrez</h4>
          <div className="lista-itens-aprender">
            {ITENS_DICIONARIO.filter(i => i.categoria === 'pecas').map((item) => (
              <button
                key={item.id}
                onClick={() => setItemSelecionado(item)}
                className={`item-aprender-botao ${itemSelecionado.id === item.id ? 'ativo' : ''}`}
              >
                {item.nome}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ color: 'var(--cor-texto-mutado)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Regras Especiais</h4>
          <div className="lista-itens-aprender">
            {ITENS_DICIONARIO.filter(i => i.categoria === 'especiais').map((item) => (
              <button
                key={item.id}
                onClick={() => setItemSelecionado(item)}
                className={`item-aprender-botao ${itemSelecionado.id === item.id ? 'ativo' : ''}`}
              >
                {item.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Área de Visualização e Prática */}
      <div className="cartao-vidro layout-jogo">
        {/* Tabuleiro Demonstrativo */}
        <div className="area-tabuleiro">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Book size={18} className="text-primary" />
              <span>Espaço de Treino</span>
            </h3>
            <button onClick={resetarPosicao} className="botao botao-secundario" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>
              <RotateCcw size={12} />
              <span>Resetar</span>
            </button>
          </div>
          <TabuleiroJogo
            fen={fenLocal}
            aoFazerLance={aoFazerLanceLocal}
            temaTabuleiro={temaTabuleiro}
            temaPecas={temaPecas}
            orientacao={itemSelecionado.id === 'enpassant' ? 'black' : 'white'}
          />
        </div>

        {/* Detalhes Teóricos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{itemSelecionado.nome}</h2>
            {itemSelecionado.valor && (
              <span style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'var(--cor-primaria)', color: '#fff', fontWeight: 600 }}>
                Valor: {itemSelecionado.valor}
              </span>
            )}
          </div>
          
          <p style={{ fontSize: '1.05rem', color: '#fff', lineHeight: '1.6' }}>
            {itemSelecionado.descricao}
          </p>
          
          <div style={{ borderLeft: '3px solid var(--cor-primaria)', paddingLeft: '1rem', marginTop: '0.5rem' }}>
            <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--cor-texto-mutado)' }}>Instruções e Prática</strong>
            <p style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>
              {itemSelecionado.detalhes}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
