# Especificação Técnica do Frontend - Web Chess

Esta especificação define a arquitetura, gerenciamento de estado e integrações da interface do usuário (UI/UX) para o site de xadrez, utilizando React, Vite, TypeScript, Zustand, `chess.js` e `react-chessboard`.

---

## 1. Estrutura de Páginas e Navegação (Roteador Client-side)

A aplicação será uma SPA (Single Page Application).

### 1.1. Tela Inicial ("Jogar")
*   **Modos de Jogo:**
    *   **Contra a Engine:** Configuração de nível, cor e tempo. (Os movimentos do robô vêm da API `chess-api.com`).
    *   **1v1 Local (Pass-and-Play):** Dois jogadores no mesmo dispositivo, com rotação automática 2D do tabuleiro habilitada.
*   **Painéis de Jogo:** Tabuleiro principal, barra de avaliação da Engine, cronômetros.

### 1.2. Aba "Aprender"
Apresenta um dicionário interativo do xadrez com explicações e mini-tabuleiros para ilustrar os movimentos das peças e regras especiais (Roque, En Passant, Promoção).

### 1.3. Aba "Perfil e Histórico"
*   Edição de Nome do Jogador e Nome do Oponente Local.
*   Lista de partidas anteriores recuperadas do IndexedDB.
*   **Visualizador de Partida:** Ao clicar no histórico, o tabuleiro é carregado e pode-se navegar nos lances usando botões (`<` e `>`). *Nota: A reprodução baseada em cronômetro original foi removida em prol de uma navegação simples por lances.*

### 1.4. Aba "Personalizar"
Seleção dos temas visuais do tabuleiro.

---

## 2. Gerenciamento de Estado (Zustand Stores)

Utilizaremos stores para facilitar o fluxo de dados no React.

### 2.1. `gameStore`
Controla o estado do jogo ativo e a instância do `chess.js`:
```typescript
interface GameState {
  fen: string;
  gameStatus: 'idle' | 'playing' | 'checkmate' | 'draw' | 'resigned';
  // Lógica central para fazer o movimento e acionar a API se estiver no modo vs Engine
  makeMove: (from: string, to: string, promotion?: string) => boolean; 
  undo: () => void;
  resetGame: () => void;
}
```

---

## 3. Integração Inteligente com API (chess-api.com)

A grande premissa deste projeto é focar a performance na nuvem através do `chess-api.com`, livrando o navegador do usuário de compilar pesados motores WebAssembly.

### Fluxo de Análise e Jogo
1.  **Modo de Análise Ativa:** A qualquer momento da partida, o usuário clica em "Analisar". O Frontend dispara um `POST` com a string `FEN` atual para a API. A barra de avaliação é atualizada com a vantagem e uma seta sugere o `bestmove`.
2.  **Modo VS Engine (Robô):** Quando o usuário faz um lance (Brancas), a UI atualiza o `chess.js`. O Frontend então envia o novo `FEN` para a `chess-api.com`. Assim que a API responde com o `bestmove`, a aplicação o executa imediatamente como se fosse a jogada das Pretas.
3.  **Estados Híbridos:** A UI deve gerenciar estados de `isLoading` de forma fluida durante essas requisições para evitar ações duplicadas pelo usuário.

---

## 4. Controle de Tempo (Relógio)

Para manter a simplicidade arquitetural, os cronômetros (quando ativados no início da partida) serão baseados em `setInterval` clássicos associados a uma store de Zustand. Se o tempo esgotar, o `gameStatus` vai para `timeout` e o perdedor é declarado.
