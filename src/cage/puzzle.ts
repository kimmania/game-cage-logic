import type { Difficulty, GameState, Puzzle } from './types';
import { RECENT_KEY } from './types';

const banks: Partial<Record<Difficulty, Puzzle[]>> = {};

export async function fetchBank(difficulty: Difficulty): Promise<Puzzle[]> {
  if (banks[difficulty]) return banks[difficulty]!;
  const res = await fetch(
    `${import.meta.env.BASE_URL}puzzles/${difficulty}.json?v=${__BUILD_HASH__}`);
  if (!res.ok) throw new Error(`Failed to load puzzle bank for ${difficulty}`);
  const data = (await res.json()) as Puzzle[];
  banks[difficulty] = data;
  return data;
}

export function getRecentPuzzles(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) as string[] : [];
  } catch {
    return [];
  }
}

export function addRecentPuzzle(id: string): void {
  const recent = getRecentPuzzles();
  recent.unshift(id);
  if (recent.length > 20) recent.pop();
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}

export async function startNewGame(difficulty: Difficulty): Promise<GameState> {
  const bank = await fetchBank(difficulty);
  const recent = getRecentPuzzles();
  let puzzle = bank.find((p) => !recent.includes(p.id));
  if (!puzzle && bank.length > 0) puzzle = bank[Math.floor(Math.random() * bank.length)];
  if (!puzzle) throw new Error('No puzzles available');
  addRecentPuzzle(puzzle.id);
  return buildGameState(puzzle, difficulty);
}

export function buildGameState(puzzle: Puzzle, difficulty: Difficulty): GameState {
  const size = puzzle.size;
  const grid: GameState['grid'] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      const isCellGiven = puzzle.cages.some(
        (cage) => cage.cells.length === 1 && cage.cells[0].r === r && cage.cells[0].c === c
      );
      return {
        value: isCellGiven ? puzzle.solution[r][c] : null,
        notes: [],
      };
    })
  );
  return {
    size,
    grid,
    cages: puzzle.cages,
    solution: puzzle.solution,
    puzzleId: puzzle.id,
    difficulty,
    mistakes: 0,
    won: false,
    activeCell: null,
    noteMode: false,
  };
}

export function resetGameState(state: GameState): void {
  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      const given = state.cages.some(
        (cage) => cage.cells.length === 1 && cage.cells[0].r === r && cage.cells[0].c === c
      );
      state.grid[r][c].value = given ? state.solution[r][c] : null;
      state.grid[r][c].notes = [];
    }
  }
  state.activeCell = null;
  state.mistakes = 0;
  state.won = false;
}
