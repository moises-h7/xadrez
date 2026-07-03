# Xadrez

Plataforma web de xadrez em React + TypeScript.

## App principal

O frontend ativo é **`xadrez-web/`** — SPA com tabuleiro, engine Stockfish (Web Worker), histórico local, temas e modos de jogo.

## Demo (GitHub Pages)

https://moises-h7.github.io/xadrez/

> Login e sincronização na nuvem exigem o backend (`server.js`). No Pages, o jogo local e contra a engine funcionam normalmente.

## Desenvolvimento local

```bash
cd xadrez-web
npm install
npm run dev          # só frontend (porta 5173)
npm run ambos        # frontend + API (Linux/macOS)
```

## chess-web/

Protótipo anterior alinhado à spec com `chess-api.com`. Mantido apenas como referência; não é publicado no Pages.
