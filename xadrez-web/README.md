# ♟️ Xadrez Web

Aplicação web de xadrez com autenticação de usuários, sincronização de histórico de partidas e suporte a partidas contra a engine (Stockfish via Web Worker).

---

## 🎯 Objetivo da Aplicação

Oferecer uma plataforma de xadrez diretamente no navegador, onde o jogador pode:

- Jogar partidas locais contra outro jogador ou contra a engine Stockfish
- Criar conta e fazer login para salvar o histórico de partidas
- Sincronizar partidas jogadas offline com o servidor ao reconectar
- Consultar o histórico de partidas com detalhes (resultado, duração, PGN, etc.)

---

## 🏗️ Arquitetura Resumida

```
xadrez-web/
├── server.js          # API REST (Fastify) — autenticação JWT e sincronização
├── database.js        # Banco de dados simples em JSON (database.json)
├── src/
│   ├── App.tsx                  # Roteamento entre páginas
│   ├── tipos.ts                 # Tipos TypeScript globais
│   ├── armazenadores/           # Estado global (Zustand)
│   ├── componentes/             # Componentes reutilizáveis (tabuleiro, modais, etc.)
│   ├── paginas/                 # Telas da aplicação (Jogo, Login, Histórico)
│   ├── hooks/                   # Custom hooks
│   └── trabalhadores/           # Web Worker do Stockfish (engine de xadrez)
├── Dockerfile
└── docker-compose.yml
```

**Stack:** React 18 + TypeScript + Vite (frontend) · Fastify 3 (backend) · JWT + bcryptjs (auth) · JSON file (banco de dados) · chess.js + react-chessboard (lógica e UI do tabuleiro) · Zustand (estado global)

---

## ⚠️ Pontos Importantes

- **Banco de dados em arquivo JSON** — os dados são gravados em `database.json` na raiz do projeto. Não é um banco relacional. Em produção real, substituir por SQLite ou PostgreSQL.
- **JWT com chave hardcoded de fallback** — se a variável de ambiente `JWT_SECRET` não for definida, o servidor usa `'super-secret-chess-key-12345'`. **Sempre defina `JWT_SECRET` em produção.**
- **Usuário padrão criado automaticamente** na primeira inicialização do servidor:
  - Email: `admin@example.com`
  - Senha: `password123`
  - Troque a senha ou remova esse usuário antes de expor a aplicação publicamente.
- **Rate limiting em memória** — o limitador de 60 req/min por IP é reiniciado ao reiniciar o servidor. Não persiste entre instâncias.
- **CORS aberto (`*`)** — adequado para desenvolvimento. Em produção, restrinja à origem do frontend.
- **Dois servidores rodando separados:** o backend (porta `3000`) e o frontend Vite (porta `5173`). O script `npm run ambos` sobe os dois juntos, mas sem gerenciamento de processo (ex.: se o `node server.js` cair, o Vite continua rodando sem aviso).
- **Web Worker do Stockfish** — a engine roda em um worker separado para não travar a UI. Certifique-se de que os arquivos do Stockfish estão acessíveis em `public/`.

---

## 🖥️ Como Rodar Localmente (sem Docker)

### Pré-requisitos

- [Node.js 20+](https://nodejs.org/)
- npm (já vem com o Node)

### Passo a passo

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd xadrez-web

# 2. Instale as dependências
npm install

# 3. (Opcional, mas recomendado) Defina um segredo JWT seguro
export JWT_SECRET="sua-chave-secreta-aqui"

# 4. Suba o backend e o frontend juntos
npm run ambos
```

Acesse no navegador:
- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000

> Para rodar separadamente:
> ```bash
> # Terminal 1 — backend
> npm run start
>
> # Terminal 2 — frontend
> npm run dev
> ```

---

## 🐳 Como Rodar com Docker

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Passo a passo

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd xadrez-web

# 2. Suba os contêineres
docker compose up --build
```

Acesse:
- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000

Para parar:
```bash
docker compose down
```

> **Nota:** O volume `.:/app:z` monta o diretório local dentro do contêiner com hot-reload ativado (`CHOKIDAR_USEPOLLING=true`). O `database.json` gerado pelo servidor ficará na sua pasta local.

---

## 🌐 Rodando em Outro Sistema Operacional

A aplicação foi desenvolvida no **Pop!\_OS (Linux)**, mas funciona em qualquer SO que suporte Node.js ou Docker.

### Windows

**Opção recomendada: Docker** (evita problemas de compatibilidade de paths e scripts shell).

Se preferir rodar sem Docker:

1. Instale o [Node.js 20+](https://nodejs.org/) para Windows
2. Use o **PowerShell** ou o **Terminal** (não o CMD antigo)
3. No `package.json`, o script `"ambos"` usa `&` (operador de background do bash). No Windows, **ele não funcionará**. Rode os dois servidores em terminais separados:
   ```powershell
   # Terminal 1
   node server.js

   # Terminal 2
   npm run dev
   ```
4. Para definir a variável de ambiente no PowerShell:
   ```powershell
   $env:JWT_SECRET = "sua-chave-secreta-aqui"
   node server.js
   ```

### macOS

Funciona normalmente. Instale o Node via [nvm](https://github.com/nvm-sh/nvm) ou [Homebrew](https://brew.sh/):

```bash
brew install node@20
```

O script `npm run ambos` funciona normalmente no macOS (usa bash).

### Linux (qualquer distro)

Sem diferenças. Instale o Node via `nvm` ou pelo gerenciador de pacotes da sua distro.

---

## 🚀 Como Rodar Após Clonar o Repositório

```bash
# 1. Entre na pasta do projeto
cd xadrez-web

# 2. Instale as dependências (necessário apenas na primeira vez ou após mudanças no package.json)
npm install

# 3. Suba a aplicação completa
npm run ambos
```

Ou via Docker (sem precisar instalar Node):

```bash
docker compose up --build
```

**Login padrão (criado automaticamente no primeiro start):**
| Campo | Valor |
|-------|-------|
| Email | `admin@example.com` |
| Senha | `password123` |

---

## 🔑 Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `JWT_SECRET` | `super-secret-chess-key-12345` | Segredo para assinar tokens JWT. **Mude em produção.** |
| `PORT` | `3000` | Porta do servidor backend |

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run start` | Inicia apenas o servidor backend |
| `npm run dev` | Inicia apenas o frontend Vite (hot-reload) |
| `npm run ambos` | Inicia backend e frontend juntos (Linux/macOS) |
| `npm run build` | Gera o build de produção do frontend |
| `npm run preview` | Pré-visualiza o build de produção |
