# Xadrez

Plataforma web de xadrez — React + TypeScript + Stockfish.

**Demo:** https://moises-h7.github.io/xadrez/

## Funcionalidades

- Jogar contra humano local ou contra a engine (Stockfish via Web Worker)
- Relógio com controle de tempo configurável
- Histórico de partidas (localStorage)
- Personalização de tema do tabuleiro
- Visualizador de partidas com replay de lances

## Desenvolvimento local

```bash
cd xadrez-web
npm install
npm run dev   # http://localhost:5173
```

## Deploy

O GitHub Actions builda e publica automaticamente em cada push para `main`.
