import type { GameState } from './types';
import { STORAGE_KEY } from './types';

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function loadSavedGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed.grid || !parsed.cages || !parsed.solution || !parsed.puzzleId) {
      return null;
    }
    if ((parsed.version ?? 1) !== 1) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSavedGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}
