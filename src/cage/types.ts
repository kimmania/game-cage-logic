export type Difficulty = 'warmup' | 'easy' | 'medium' | 'hard' | 'expert';

export type Op = '+' | '-' | '×' | '÷' | '=';

export interface Cage {
  cells: { r: number; c: number }[];
  target: number;
  op: Op;
}

export interface Puzzle {
  id: string;
  size: number;
  cages: Cage[];
  solution: number[][];
}

export interface CellState {
  value: number | null;
  notes: number[];
}

export interface GameState {
  size: number;
  grid: CellState[][];
  cages: Cage[];
  solution: number[][];
  puzzleId: string;
  difficulty: Difficulty;
  mistakes: number;
  won: boolean;
  activeCell: { r: number; c: number } | null;
  noteMode: boolean;
}

export const DIFFICULTIES: Difficulty[] = [
  'warmup',
  'easy',
  'medium',
  'hard',
  'expert',
];

export const DIFFICULTY_COUNTS: Record<Difficulty, number> = {
  warmup: 5,
  easy: 50,
  medium: 300,
  hard: 250,
  expert: 250,
};

export const STORAGE_KEY = 'cage-logic-save';
export const RECENT_KEY = 'cage-logic-recent';
