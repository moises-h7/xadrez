# Especificação Técnica do Banco de Dados Local - Web Chess

Esta especificação detalha a arquitetura de dados e a modelagem das entidades para persistência (puramente local) no site de xadrez.

---

## 1. Estratégia de Persistência: Arquitetura Local-First

Para maximizar a performance e garantir custo zero de servidor, a aplicação adota uma estratégia **Client-Side/Local-First**.
*   **Persistência Principal:** O banco de dados do navegador **IndexedDB** será utilizado por meio da biblioteca `Dexie.js` (um wrapper elegante, com tipagem TypeScript segura e consultas fáceis).
*   **Sem Backend Customizado:** Não haverá sincronização em nuvem nesta versão MVP. Todo o histórico pertence ao dispositivo do usuário.

---

## 2. Esquema do Banco de Dados (IndexedDB)

A modelagem de dados a seguir descreve a estrutura relacional mapeada no IndexedDB.

### 2.1. Entidade: `Profiles` (Perfis do Jogador e Oponente Local)
Armazena as configurações de identidade dos jogadores.

```typescript
interface Profile {
  id: 'main' | 'local_opponent'; // 'main' = Jogador, 'local_opponent' = Oponente 1v1 local
  name: string;                  // Nome exibido
  avatarUrl: string | null;      // URL para avatar público ou identificador de ícone genérico (sem Base64 pesado)
  updatedAt: number;             // Timestamp Epoch milissegundos
}
```

### 2.2. Entidade: `GameHistory` (Histórico de Partidas)
Armazena os dados brutos de cada jogo concluído para geração de estatísticas.

```typescript
interface GameHistory {
  id: string;                     // UUID gerado no início da partida
  date: number;                   // Timestamp Epoch da data do jogo
  opponentType: 'engine' | 'local';
  opponentName: string;           // Nome do oponente local ou da dificuldade
  engineDifficulty: number | null;// 1 a 5 (se opponentType for 'engine')
  timeControl: string;            // 'sem tempo' | '30m' | '10m' | '5m' | '3m' | '1m'
  playerColor: 'w' | 'b';         // Cor usada pelo jogador principal
  result: 'win' | 'loss' | 'draw';// Resultado do ponto de vista do jogador principal
  endedBy: 'checkmate' | 'timeout' | 'resigned' | 'draw_agreement' | 'draw_rule';
  durationSeconds: number;        // Tempo total físico decorrido da partida
  totalMoves: number;             // Total de lances efetuados
  pgn: string;                    // PGN bruto da partida, gerado pelo chess.js
}
```

### 2.3. Entidade: `Settings` (Preferências Visuais)
```typescript
interface Settings {
  id: 'current';
  boardTheme: string;
  pieceTheme: string;
  autoRotateLocal: boolean;
}
```

---

## 3. Gestão de Histórico PGN

Diferente de sistemas complexos, **não** usaremos expressões regulares manuais para controlar o tempo dos lances dentro do PGN. 
O controle do relógio (tempo restante) será puramente gerenciado em memória pelo estado da aplicação (React/Zustand) durante a partida. O IndexedDB apenas guardará a string final (PGN) entregue pelo método `chess.pgn()` quando a partida for encerrada, o que é o suficiente para visualização do histórico.

---

## 4. Algoritmos de Cálculo de Estatísticas

As estatísticas deverão ser computadas sob demanda lendo o histórico de partidas IndexedDB filtrado.

### 4.1. Filtros Aplicados
*   `type`: `VS Engine`, `1v1 Local` ou `Ambos`.
*   `dateRange`: `[startDate, endDate]` baseado no timestamp `date`.

### 4.2. Fórmulas de Cálculo
Considerando $V = \text{Vitórias}$, $D = \text{Derrotas}$ e $E = \text{Empates}$:
*   **Total de Partidas ($T$):** $T = V + D + E$
*   **Média de Lances por Partida:** $\frac{\sum \text{totalMoves}}{T}$
*   **Percentual de Vitórias (Cálculo Padrão):** $Pct_1(V) = \frac{V}{T} \times 100\%$
