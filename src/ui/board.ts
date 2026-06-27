import type { GameState } from '../cage/types';
import { getViolatedCells } from '../cage/validator';
import { isGiven } from '../cage/puzzle';

interface BoardElements {
  container: HTMLElement;
  cells: HTMLElement[][];
}

export function createBoard(container: HTMLElement): BoardElements {
  return { container, cells: [] };
}

function getCageMap(state: GameState): number[][] {
  const map: number[][] = Array.from({ length: state.size }, () =>
    Array(state.size).fill(-1)
  );
  for (let i = 0; i < state.cages.length; i++) {
    for (const { r, c } of state.cages[i].cells) {
      map[r][c] = i;
    }
  }
  return map;
}

function ensureSize(board: BoardElements, size: number): void {
  if (board.cells.length === size && board.cells[0]?.length === size) return;
  board.container.innerHTML = '';
  board.container.style.setProperty('--board-n', String(size));
  board.container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  board.container.style.gridTemplateRows = `repeat(${size}, 1fr)`;

  const cells: HTMLElement[][] = [];
  for (let r = 0; r < size; r++) {
    cells[r] = [];
    for (let c = 0; c < size; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = String(r);
      cell.dataset.col = String(c);
      cell.setAttribute('role', 'gridcell');
      board.container.appendChild(cell);
      cells[r][c] = cell;
    }
  }
  board.cells = cells;
}

export function renderBoard(board: BoardElements, state: GameState): void {
  ensureSize(board, state.size);
  const noteCols = state.size <= 4 ? 2 : 3;
  const noteRows = Math.ceil(state.size / noteCols);
  board.container.style.setProperty('--note-cols', String(noteCols));
  board.container.style.setProperty('--note-rows', String(noteRows));
  const cageMap = getCageMap(state);
  const violated = getViolatedCells(state);

  // Determine cage labels
  const labelMap = new Map<number, string>();
  for (let i = 0; i < state.cages.length; i++) {
    const cage = state.cages[i];
    const label = cage.op === '=' ? String(cage.target) : `${cage.target}${cage.op}`;
    labelMap.set(i, label);
  }

  // Top-left cell per cage
  const labelCell = new Map<number, { r: number; c: number }>();
  for (let i = 0; i < state.cages.length; i++) {
    let best = state.cages[i].cells[0];
    for (const cell of state.cages[i].cells) {
      if (cell.r < best.r || (cell.r === best.r && cell.c < best.c)) {
        best = cell;
      }
    }
    labelCell.set(i, best);
  }

  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      const cell = board.cells[r][c];
      const st = state.grid[r][c];
      const cageIdx = cageMap[r][c];
      const isCellGiven = isGiven(state, r, c);

      // Reset classes
      cell.className = 'cell';
      if (isCellGiven) cell.classList.add('given');
      if (state.activeCell?.r === r && state.activeCell?.c === c) {
        cell.classList.add('selected');
      }
      if (violated.has(`${r},${c}`)) {
        cell.classList.add('error');
      }

      // Cage borders
      if (r === 0 || cageMap[r - 1][c] !== cageIdx) cell.classList.add('cage-top');
      if (r === state.size - 1 || cageMap[r + 1][c] !== cageIdx) cell.classList.add('cage-bottom');
      if (c === 0 || cageMap[r][c - 1] !== cageIdx) cell.classList.add('cage-left');
      if (c === state.size - 1 || cageMap[r][c + 1] !== cageIdx) cell.classList.add('cage-right');

      // Content
      cell.textContent = '';

      // Cage label on top-left cell of cage
      const labelPos = labelCell.get(cageIdx);
      if (labelPos?.r === r && labelPos?.c === c) {
        const labelSpan = document.createElement('span');
        labelSpan.className = 'cage-label';
        labelSpan.textContent = labelMap.get(cageIdx) ?? '';
        cell.appendChild(labelSpan);
      }

      if (st.value !== null) {
        const valEl = document.createElement('span');
        valEl.className = 'cell-value';
        valEl.textContent = String(st.value);
        cell.appendChild(valEl);
      } else if (st.notes.length > 0) {
        const notesEl = document.createElement('div');
        notesEl.className = 'notes';
        for (let n = 1; n <= state.size; n++) {
          const noteSpan = document.createElement('span');
          noteSpan.className = 'note';
          noteSpan.textContent = st.notes.includes(n) ? String(n) : '';
          notesEl.appendChild(noteSpan);
        }
        cell.appendChild(notesEl);
      }
    }
  }
}

export function bindBoardInteractions(
  board: BoardElements,
  onTap: (row: number, col: number) => void,
): void {
  board.container.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.cell') as HTMLElement | null;
    if (!target) return;
    const row = parseInt(target.dataset.row ?? '', 10);
    const col = parseInt(target.dataset.col ?? '', 10);
    if (!Number.isNaN(row) && !Number.isNaN(col)) {
      onTap(row, col);
    }
  });
}
