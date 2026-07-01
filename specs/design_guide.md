# Guia de Design, UX e Experiência Visual - Web Chess

Este documento estabelece as diretrizes visuais, de usabilidade (UX) e design de interface (UI) para o site de xadrez, visando proporcionar uma experiência de alta fidelidade, fluida e confortável para o cérebro humano. Inspirado nas estéticas modernas de produtos premium como Vercel, Linear e Apple.

---

## 1. Princípios de Design e Direção Estética

A interface deve ser **limpa, escura e focada**, removendo qualquer ruído visual para que o jogador concentre-se na partida.
*   **Minimalismo Funcional:** Cada botão, borda e espaçamento possui um propósito claro. Espaço em branco é utilizado ativamente para agrupar informações logicamente.
*   **Glassmorphism Moderado:** Utilização de fundos translúcidos com desfoque de fundo (`backdrop-filter: blur()`) e bordas extremamente finas e sutis para sobreposições e painéis.
*   **Foco Cognitivo:** O tabuleiro é o elemento mais importante e deve ocupar a área central/esquerda da tela, com contraste balanceado para evitar fadiga ocular durante longas sessões.

---

## 2. Paleta de Cores (Sistema HSL)

A paleta de cores utiliza a escala HSL para garantir harmonia visual e facilidade de manutenção de temas.

### Cores Base da Interface
*   **Background (Fundo Principal):** `hsl(240, 10%, 4%)` (Preto profundo quase neutro)
*   **Surface (Painéis e Cards):** `hsl(240, 10%, 9%)` (Cinza escuro para profundidade)
*   **Surface-Hover:** `hsl(240, 6%, 15%)`
*   **Border (Bordas Finas):** `hsla(240, 5%, 84%, 0.08)` (Borda branca com 8% de opacidade)
*   **Accent/Primary:** `hsl(263, 70%, 50%)` (Roxo elétrico premium para elementos principais de foco)
*   **Text Primary (Texto Forte):** `hsl(0, 0%, 98%)`
*   **Text Secondary (Texto de Apoio):** `hsl(240, 5%, 65%)`

### Sinalizações de Jogo
*   **Último Lance (Highlight):** `hsla(45, 100%, 50%, 0.2)` (Amarelo suave translúcido nas casas de origem e destino)
*   **Xeque (Check):** `hsla(0, 100%, 50%, 0.25)` (Vermelho rubi suave na casa do Rei sob ataque)
*   **Movimento Possível (Hint):** `hsla(0, 0%, 100%, 0.15)` (Círculo cinza claro semi-transparente no centro da casa vazia)
*   **Captura Possível:** `hsla(0, 100%, 50%, 0.15)` (Anel vermelho sutil nas bordas da casa onde há peça a ser capturada)

---

## 3. Tipografia

A tipografia deve ser limpa e altamente legível.
*   **Títulos e Cabeçalhos:** Font Family `Outfit` (Google Fonts). Design geométrico moderno, ideal para números de relógios, nomes de jogadores e títulos de painéis.
*   **Corpo de Texto e Dados:** Font Family `Inter` (Google Fonts). Excelente legibilidade em tamanhos pequenos para o histórico de lances e estatísticas.
*   **Escala Tipográfica:**
    *   Relógio de Tempo: `3.5rem` (Outfit, Peso: 600, Monoespaçado para números)
    *   Títulos de Seção: `1.5rem` (Outfit, Peso: 500)
    *   Nomes de Jogadores: `1.125rem` (Outfit, Peso: 500)
    *   Texto Geral / Lances: `0.875rem` (Inter, Peso: 400)
    *   Legendas / Rótulos secundários: `0.75rem` (Inter, Peso: 500, Espaçamento de letras levemente ampliado)

---

## 4. Estrutura do Layout e Grid (Responsivo)

O design adapta-se dinamicamente conforme a tela do dispositivo.

### Desktop (Largura >= 1024px)
*   **Estrutura:** Layout em duas colunas principais utilizando Grid de 12 colunas.
    *   **Coluna do Tabuleiro (7 colunas):** Tabuleiro centralizado com tamanho dinâmico (máximo `80vh` de altura). O tabuleiro de xadrez é acompanhado pelos painéis de dados dos jogadores (cima e baixo), contendo nome, foto e relógio.
    *   **Coluna de Painel de Controle (5 colunas):** Painel lateral unificado contendo o menu de abas principal (Jogar, Aprender, Histórico, Perfil, Personalizar) e as interações ativas do jogo (Histórico de lances PGN, botões de resignação/empate, seleção de tempo).

### Mobile (Largura < 1024px)
*   **Estrutura:** Layout vertical de coluna única.
    *   **Ordem:** Painel superior do adversário -> Tabuleiro -> Painel inferior do jogador -> Painel de Controles expandível por baixo ou via deslizamento lateral (drawer).
    *   **Adaptação:** O tamanho do tabuleiro se ajusta dinamicamente a `95vw` da largura da tela.

---

## 5. Temas do Tabuleiro e Peças

O usuário poderá alternar os temas na aba **"Personalizar"**.

### Temas do Tabuleiro (Cores das Casas Claras e Escuras)
1.  **Modern Ice (Padrão):**
    *   Casas Claras: `hsl(210, 20%, 94%)` (Branco gelo)
    *   Casas Escuras: `hsl(217, 30%, 45%)` (Azul ardósia escuro)
2.  **Classic Wood (Madeira Tradicional):**
    *   Casas Claras: `hsl(35, 35%, 85%)` (Bordo claro)
    *   Casas Escuras: `hsl(28, 45%, 40%)` (Nogueira quente)
3.  **Cyberpunk / Synthwave:**
    *   Casas Claras: `hsl(320, 20%, 15%)` (Roxo muito escuro)
    *   Casas Escuras: `hsl(320, 90%, 8%)` (Preto arroxeado)
    *   Glow nas bordas das casas: Violeta/Neon.
4.  **Minimalist Monochromatic:**
    *   Casas Claras: `hsl(0, 0%, 90%)` (Cinza claro suave)
    *   Casas Escuras: `hsl(0, 0%, 25%)` (Grafite escuro fosco)

### Temas das Peças
*   **Neo-Classic (Padrão):** Design vetorial clássico com linhas finas e sombreamento sutil em preto e branco.
*   **Silhouette (Minimalista):** Silhuetas de peças sem detalhes internos, apenas contorno limpo e preenchimento plano.
*   **Futuristic Geometric:** Formas geométricas abstratas de visual futurista.

---

## 6. Microinterações e Animações

As animações devem ser sutis, rápidas e discretas (duração entre `150ms` e `300ms`, curva de transição `cubic-bezier(0.4, 0, 0.2, 1)`):
*   **Movimentação de Peças:** Transição linear-suave da coordenada X/Y inicial à final ao arrastar ou executar lances automáticos.
*   **Rotação do Tabuleiro (1v1 Local):** Rotação 3D suave do tabuleiro de 180° no eixo Z quando o turno muda. O processo leva exatamente `300ms` e rotaciona também as peças para que permaneçam legíveis ao jogador atual.
*   **Pulso de Xeque:** Quando o Rei é colocado em xeque, a casa pisca suavemente em vermelho duas vezes.
*   **Alerta de Tempo Critico:** Quando o relógio do jogador está abaixo de 15 segundos, a borda do cronômetro ganha um pulso vermelho suave e os números ganham uma leve vibração ao mudar de segundo.
*   **Hover nos Menus:** Efeito de "slide-in" de um background sutil ou barra inferior roxa sob a aba ativa.

---

## 7. Oponente Local e Customização de Perfis

Na aba de customização e perfil:
*   **Avatar Padrão:** Ilustração minimalista de silhueta geométrica em escala de cinzas `hsl(240, 5%, 26%)`.
*   **Inputs de Customização:** Campos de formulário com bordas finas que acendem em roxo (`accent`) ao focar, com transição suave.
*   **Formato de Edição de Nome:** Botão de edição inline com ícone de lápis discreto que se transforma em input de texto ao ser clicado.
