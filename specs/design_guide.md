# Guia de Design, UX e Experiência Visual - Web Chess

Este documento estabelece as diretrizes visuais, de usabilidade (UX) e design de interface (UI) para o site de xadrez, visando proporcionar uma experiência de alta fidelidade, fluida e confortável. Inspirado nas estéticas modernas de produtos premium como Vercel, Linear e Apple.

---

## 1. Princípios de Design e Direção Estética

A interface deve ser **limpa, escura e focada**, removendo qualquer ruído visual para que o jogador concentre-se na partida.
*   **Minimalismo Funcional:** Cada botão, borda e espaçamento possui um propósito claro. Espaço em branco é utilizado ativamente para agrupar informações logicamente.
*   **Glassmorphism Moderado:** Utilização de fundos translúcidos com desfoque de fundo (`backdrop-filter: blur()`) e bordas extremamente finas e sutis para sobreposições e painéis.
*   **Foco Cognitivo:** O tabuleiro é o elemento mais importante e deve ocupar a área central, com contraste balanceado.

---

## 2. Paleta de Cores (Sistema HSL)

A paleta de cores utiliza a escala HSL para garantir harmonia visual e facilidade de manutenção de temas.

### Cores Base da Interface
*   **Background (Fundo Principal):** `hsl(240, 10%, 4%)` (Preto profundo quase neutro)
*   **Surface (Painéis e Cards):** `hsl(240, 10%, 9%)` (Cinza escuro para profundidade)
*   **Border (Bordas Finas):** `hsla(240, 5%, 84%, 0.08)` (Borda branca com 8% de opacidade)
*   **Accent/Primary:** `hsl(263, 70%, 50%)` (Roxo elétrico premium)
*   **Text Primary:** `hsl(0, 0%, 98%)`
*   **Text Secondary:** `hsl(240, 5%, 65%)`

### Sinalizações de Jogo
*   **Último Lance (Highlight):** `hsla(45, 100%, 50%, 0.2)`
*   **Xeque (Check):** `hsla(0, 100%, 50%, 0.25)`

---

## 3. Tipografia

A tipografia deve ser limpa e altamente legível.
*   **Títulos e Cabeçalhos:** Font Family `Outfit` (Google Fonts). Design geométrico moderno.
*   **Corpo de Texto e Dados:** Font Family `Inter` (Google Fonts). Excelente legibilidade.

---

## 4. Estrutura do Layout e Grid (Responsivo)

O design adapta-se dinamicamente conforme a tela do dispositivo.

### Desktop (Largura >= 1024px)
*   **Estrutura:** Layout em duas colunas principais. Tabuleiro ao centro/esquerda, painéis de controle, histórico de lances e menu à direita.

### Mobile (Largura < 1024px)
*   **Estrutura:** Layout vertical de coluna única. Tabuleiro responsivo (95vw).

---

## 5. Temas do Tabuleiro (Foco MVP)

O usuário poderá alternar os temas na aba **"Personalizar"**. Para não sobrecarregar o desenvolvimento inicial, manteremos duas opções principais:

1.  **Modern Ice (Padrão):**
    *   Casas Claras: `hsl(210, 20%, 94%)`
    *   Casas Escuras: `hsl(217, 30%, 45%)`
2.  **Cyberpunk / Synthwave:**
    *   Casas Claras: `hsl(320, 20%, 15%)`
    *   Casas Escuras: `hsl(320, 90%, 8%)`

---

## 6. Microinterações e Animações Funcionais

As animações devem ser sutis, rápidas e discretas (duração entre `150ms` e `300ms`):
*   **Movimentação de Peças:** Transição suave da coordenada inicial à final.
*   **Giro de Tabuleiro (1v1 Local):** O tabuleiro realiza um "flip" 2D (inversão simples do eixo) instantâneo ou usando a transição nativa do `react-chessboard`. *Nota: A rotação 3D foi descartada por quebrar a área de clique interativa.*
*   **Alerta de Tempo Critico:** Quando o relógio do jogador está abaixo de 15 segundos, o cronômetro ganha um pulso vermelho.
*   **Feedback de API (Loading):** Transições suaves e *loaders* elegantes que indicam que a `chess-api.com` está analisando a jogada, sem bloquear a interface de forma rústica.
