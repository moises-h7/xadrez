# Especificação Técnica do Backend e Banco de Dados - Web Chess

Esta especificação detalha a arquitetura de dados, a modelagem das entidades para persistência (local-first e nuvem) e os formatos de arquivo para exportação de partidas no site de xadrez.

---

## 1. Estratégia de Persistência: Arquitetura Local-First

Para maximizar a performance, segurança e viabilidade financeira (custo zero de servidor), a aplicação adota uma estratégia **Local-First**.
*   **Persistência Principal:** O banco de dados do navegador **IndexedDB** será utilizado por meio da biblioteca `Dexie.js` (um wrapper elegante, com tipagem TypeScript segura e consultas fáceis).
*   **Armazenamento de Imagens:** Fotos de perfil e do oponente local serão convertidas em Base64 compactado (WebP, Max 100KB) e armazenadas diretamente na tabela de perfis do IndexedDB.
*   **Sincronização com Nuvem (Opcional):** Um servidor REST simplificado em Node.js (Fastify + SQLite/PostgreSQL) poderá sincronizar o banco IndexedDB local para persistência multiplataforma caso o usuário realize login.

---

## 2. Esquema do Banco de Dados (IndexedDB / Relacional)

A modelagem de dados a seguir descreve a estrutura relacional mapeada no IndexedDB e utilizável em um banco remoto.

### 2.1. Entidade: `Profiles` (Perfis do Jogador e Oponente Local)
Armazena as configurações de identidade dos jogadores.

```typescript
interface Profile {
  id: 'main' | 'local_opponent'; // 'main' = Jogador, 'local_opponent' = Oponente 1v1 local
  name: string;                  // Nome exibido
  avatarBase64: string | null;  // Foto convertida para Base64 (WebP compactado)
  updatedAt: number;             // Timestamp Epoch milissegundos
}
```

### 2.2. Entidade: `GameHistory` (Histórico de Partidas)
Armazena os dados brutos de cada jogo concluído para geração de estatísticas e replays.

```typescript
interface GameHistory {
  id: string;                     // UUID gerado no início da partida
  date: number;                   // Timestamp Epoch da data do jogo
  opponentType: 'engine' | 'local';
  opponentName: string;           // Nome da dificuldade do robô (ex: "Robô Nível 3") ou nome do oponente local
  engineDifficulty: number | null;// 1 a 5 (se opponentType for 'engine')
  timeControl: string;            // 'sem tempo' | '30m' | '10m' | '5m' | '3m' | '1m'
  playerColor: 'w' | 'b';         // Cor usada pelo jogador principal (no 1v1 local, cor do Jogador 1)
  result: 'win' | 'loss' | 'draw';// Resultado do ponto de vista do jogador principal
  endedBy: 'checkmate' | 'timeout' | 'resigned' | 'draw_agreement' | 'draw_rule';
  drawReason: 'stalemate' | 'insufficient_material' | 'threefold_repetition' | '50_moves' | null;
  durationSeconds: number;        // Tempo total físico decorrido da partida
  totalMoves: number;             // Total de lances efetuados
  pgn: string;                    // PGN contendo anotações de cronômetro por lance
}
```

### 2.3. Entidade: `Settings` (Preferências de Tela e Som)
```typescript
interface Settings {
  id: 'current';
  boardTheme: string;
  pieceTheme: string;
  autoRotateLocal: boolean;
}
```

---

## 3. Formato PGN Estendido para Replay Automático

Para viabilizar a funcionalidade de **Replay Automático**, onde cada lance deve ser reproduzido com a mesma velocidade e tempo gasto real, o histórico de partidas armazenará o tempo restante de jogo por meio de comentários de relógio no PGN (notação oficial suportada por Lichess e Chess.com).

### Formato de Comentário `%clk`
A cada lance registrado na notação PGN, adiciona-se o tempo restante no formato `{[%clk H:MM:SS]}`.

*Exemplo de PGN gerado:*
```pgn
[Event "Partida Casual VS Engine"]
[Site "Localhost"]
[Date "2026.07.01"]
[Round "1"]
[White "Você"]
[Black "Stockfish Nível 3"]
[Result "1-0"]
[TimeControl "600"]
[UTCDate "2026.07.01"]
[UTCTime "19:50:00"]

1. e4 {[%clk 0:09:58]} e5 {[%clk 0:09:59]} 2. Nf3 {[%clk 0:09:55]} Nc6 {[%clk 0:09:57]} 3. Bb5 {[%clk 0:09:50]} a6 {[%clk 0:09:56]} 4. Ba4 {[%clk 0:09:47]} Nf6 {[%clk 0:09:52]} 5. O-O {[%clk 0:09:42]} Be7 {[%clk 0:09:49]} 6. Re1 {[%clk 0:09:40]} b5 {[%clk 0:09:46]} 7. Bb3 {[%clk 0:09:37]} d6 {[%clk 0:09:41]} 8. c3 {[%clk 0:09:32]} O-O {[%clk 0:09:38]} 9. h3 {[%clk 0:09:28]} Nb8 {[%clk 0:09:35]} 10. d4 {[%clk 0:09:20]} 1-0
```

#### Extração do Tempo no Replay:
O interpretador de replay no frontend deve processar os comentários usando expressões regulares para extrair o tempo de relógio de cada lance e calcular a diferença temporal entre lances consecutivos do mesmo jogador.
*   *Regex de captura:* `/\{\[%clk\s(\d+):(\d+):(\d+)\]\}/`

---

## 4. Algoritmos de Cálculo de Estatísticas

As estatísticas deverão ser computadas sob demanda lendo o histórico de partidas IndexedDB filtrado.

### 4.1. Filtros Aplicados
*   `type`: `VS Engine` (filtra `opponentType === 'engine'`), `1v1 Local` (`opponentType === 'local'`) ou `Ambos` (sem filtro de tipo).
*   `dateRange`: `[startDate, endDate]` baseado no timestamp `date`.

### 4.2. Fórmulas de Cálculo
Considerando $V = \text{Vitórias}$, $D = \text{Derrotas}$ e $E = \text{Empates}$:
*   **Total de Partidas ($T$):** $T = V + D + E$
*   **Média de Lances por Partida:** $\frac{\sum \text{totalMoves}}{T}$
*   **Percentual de Vitórias (Cálculo 1 - Padrão):**
    $$Pct_1(V) = \frac{V}{T} \times 100\%$$
*   **Percentual de Vitórias (Cálculo 2 - Exclui Empates):**
    $$Pct_2(V) = \frac{V}{V + D} \times 100\% \quad (\text{se } V+D > 0)$$

---

## 5. API de Sincronização na Nuvem (Opcional)

Se um backend opcional for conectado, os seguintes endpoints REST em formato JSON serão expostos:

### 5.1. `POST /api/auth/login`
*   **Payload:** `{ email, password }`
*   **Resposta:** `{ token, user: { name, email } }`

### 5.2. `POST /api/sync`
*   Sincronização bidirecional simplificada baseada no timestamp da última modificação.
*   **Headers:** `Authorization: Bearer <token>`
*   **Payload:**
    ```json
    {
      "lastSyncTimestamp": 17829392819,
      "localGames": [ ... ],
      "profile": { "name": "...", "avatarBase64": "..." }
    }
    ```
*   **Resposta:**
    ```json
    {
      "status": "success",
      "newGamesFromCloud": [ ... ],
      "updatedAt": 17829399999
    }
    ```

### 5.3. Segurança e Boas Práticas
*   **Sanitização de PGN:** Qualquer dado de PGN enviado para a nuvem deve ser higienizado contra injeções de script (evitar XSS em renderizadores web).
*   **Rate Limiting:** Máximo de 60 requisições por minuto por IP para rotas de sincronização.
*   **Armazenamento no Servidor:** As senhas devem ser hashadas com `argon2id` ou `bcrypt`. O histórico PGN deve ser salvo em formato TEXT padrão no banco de dados relacional.
