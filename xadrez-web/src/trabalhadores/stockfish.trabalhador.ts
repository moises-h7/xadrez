/* eslint-disable no-restricted-globals */
// Importa o script do Stockfish de uma CDN estável
try {
  self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
} catch (erro) {
  console.error('Erro ao importar o script do Stockfish no worker:', erro);
}

// Inicializa a instância do motor
// @ts-ignore
const motorXadrez = typeof STOCKFISH === 'function' ? STOCKFISH() : null;

if (motorXadrez) {
  // Canaliza as saídas do Stockfish para a thread principal
  motorXadrez.onmessage = (mensagem: any) => {
    if (typeof mensagem === 'string') {
      self.postMessage(mensagem);
    } else if (mensagem && typeof mensagem.data === 'string') {
      self.postMessage(mensagem.data);
    } else if (mensagem && mensagem.data) {
      self.postMessage(mensagem.data.toString());
    }
  };

  // Escuta os comandos enviados pela thread principal
  self.onmessage = (evento: MessageEvent) => {
    motorXadrez.postMessage(evento.data);
  };
} else {
  console.error('Função global STOCKFISH não pôde ser encontrada no Worker.');
}
