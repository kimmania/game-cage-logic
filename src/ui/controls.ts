import type { Difficulty } from '../cage/types';

export function bindControlHandlers(options: {
  onNewGame: () => void;
  onReset: () => void;
  onUndo: () => void;
  onHelp: () => void;
  onNotesToggle: () => void;
  onDifficultyChange: () => void;
  onNumpad: (n: number) => void;
  onErase: () => void;
}): void {
  document.getElementById('new-game')?.addEventListener('click', options.onNewGame);
  document.getElementById('reset')?.addEventListener('click', options.onReset);
  document.getElementById('undo')?.addEventListener('click', options.onUndo);
  document.getElementById('help')?.addEventListener('click', options.onHelp);
  document.getElementById('notes-toggle')?.addEventListener('click', options.onNotesToggle);
  document.getElementById('difficulty')?.addEventListener('change', options.onDifficultyChange);
}

export function createNumpad(size: number, onNumpad: (n: number) => void, onErase: () => void): void {
  const container = document.getElementById('numpad');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= size; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'num-btn';
    btn.textContent = String(i);
    btn.addEventListener('click', () => onNumpad(i));
    container.appendChild(btn);
  }
  const erase = document.createElement('button');
  erase.type = 'button';
  erase.className = 'num-btn erase';
  erase.textContent = 'Erase';
  erase.addEventListener('click', () => onErase());
  container.appendChild(erase);
}

export function getSelectedDifficulty(): Difficulty {
  const el = document.getElementById('difficulty') as HTMLSelectElement | null;
  return (el?.value ?? 'warmup') as Difficulty;
}

export function setDifficulty(value: Difficulty): void {
  const el = document.getElementById('difficulty') as HTMLSelectElement | null;
  if (el) el.value = value;
}

export function updateDifficultyLabel(label: string): void {
  const el = document.getElementById('difficulty-label');
  if (el) el.textContent = label;
}

export function updateMistakes(count: number): void {
  const el = document.getElementById('mistakes');
  if (el) {
    el.textContent = `Mistakes: ${count}`;
    el.setAttribute('data-count', String(count));
  }
}

export function showWinBanner(show: boolean): void {
  const el = document.getElementById('win-banner');
  if (el) el.classList.toggle('hidden', !show);
}

export function updatePuzzleId(id: string): void {
  const el = document.getElementById('puzzle-id');
  if (el) el.textContent = id;
}

export function setUndoEnabled(enabled: boolean): void {
  const el = document.getElementById('undo') as HTMLButtonElement | null;
  if (el) el.disabled = !enabled;
}

export function setNotesButton(noteMode: boolean): void {
  const el = document.getElementById('notes-toggle') as HTMLButtonElement | null;
  if (!el) return;
  el.textContent = noteMode ? 'Notes: On' : 'Notes: Off';
  el.classList.toggle('on', noteMode);
}
