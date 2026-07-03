/* Worker clássico (não-module) — carrega Stockfish via importScripts */

// O caminho é relativo à raiz do site (public/)
importScripts('/stockfish.js');

// STOCKFISH() é a factory exposta pelo script acima
// @ts-ignore
const motor = typeof STOCKFISH === 'function' ? STOCKFISH() : null;

if (motor) {
  // Repassa saídas do motor para a thread principal
  motor.onmessage = (msg) => {
    const texto = typeof msg === 'string' ? msg : msg?.data;
    if (texto) self.postMessage(texto);
  };

  // Recebe comandos da thread principal e os passa ao motor
  self.onmessage = (evento) => {
    motor.postMessage(evento.data);
  };
} else {
  console.error('[Stockfish Worker] STOCKFISH() não encontrado.');
}
