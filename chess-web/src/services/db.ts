import Dexie, { type EntityTable } from 'dexie';

export interface GameHistory {
  id: string;
  date: number;
  opponentType: 'engine' | 'local';
  opponentName: string;
  engineDifficulty: number | null;
  timeControl: string;
  playerColor: 'w' | 'b';
  result: 'win' | 'loss' | 'draw';
  endedBy: 'checkmate' | 'timeout' | 'resigned' | 'draw_agreement' | 'draw_rule';
  durationSeconds: number;
  totalMoves: number;
  pgn: string;
}

const db = new Dexie('WebChessDB') as Dexie & {
  gameHistory: EntityTable<GameHistory, 'id'>;
};

db.version(1).stores({
  gameHistory: 'id, date, opponentType'
});

export { db };
