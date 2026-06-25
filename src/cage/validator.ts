import type { GameState } from './types';

function cageFilledValues(state: GameState, cageIdx: number): number[] {
  const vals: number[] = [];
  for (const { r, c } of state.cages[cageIdx].cells) {
    const v = state.grid[r][c].value;
    if (v !== null) vals.push(v);
  }
  return vals;
}

export function getViolatedCells(state: GameState): Set<string> {
  const violated = new Set<string>();
  const { size, grid, cages } = state;

  // Row and column uniqueness
  for (let r = 0; r < size; r++) {
    const seen = new Map<number, number>();
    for (let c = 0; c < size; c++) {
      const v = grid[r][c].value;
      if (v !== null) {
        const prev = seen.get(v);
        if (prev !== undefined) {
          violated.add(`${r},${c}`);
          violated.add(`${r},${prev}`);
        } else {
          seen.set(v, c);
        }
      }
    }
  }
  for (let c = 0; c < size; c++) {
    const seen = new Map<number, number>();
    for (let r = 0; r < size; r++) {
      const v = grid[r][c].value;
      if (v !== null) {
        const prev = seen.get(v);
        if (prev !== undefined) {
          violated.add(`${r},${c}`);
          violated.add(`${prev},${c}`);
        } else {
          seen.set(v, r);
        }
      }
    }
  }

  // Cage arithmetic
  for (let i = 0; i < cages.length; i++) {
    const cage = cages[i];
    const vals = cageFilledValues(state, i);
    const allFilled = vals.length === cage.cells.length;

    if (cage.op === '=') {
      for (const { r, c } of cage.cells) {
        const v = grid[r][c].value;
        if (v !== null && v !== cage.target) {
          violated.add(`${r},${c}`);
        }
      }
      continue;
    }

    if (allFilled) {
      let ok = false;
      if (cage.op === '+') {
        const sum = vals.reduce((a, b) => a + b, 0);
        ok = sum === cage.target;
      } else if (cage.op === '×') {
        const prod = vals.reduce((a, b) => a * b, 1);
        ok = prod === cage.target;
      } else if (cage.op === '-' && vals.length === 2) {
        ok = Math.abs(vals[0] - vals[1]) === cage.target;
      } else if (cage.op === '÷' && vals.length === 2) {
        const [a, b] = vals;
        ok = (a > b ? a / b : b / a) === cage.target;
      }
      if (!ok) {
        for (const { r, c } of cage.cells) {
          violated.add(`${r},${c}`);
        }
      }
    } else {
      // Partial cage impossibility checks
      const remaining = cage.cells.length - vals.length;
      if (cage.op === '+') {
        const sum = vals.reduce((a, b) => a + b, 0);
        // Minimum sum from remaining cells is 1 each = remaining
        if (sum + remaining > cage.target) {
          // impossible to reach target
          const currentExceeds = sum > cage.target;
          // If already over, mark
          if (currentExceeds) {
            for (const { r, c } of cage.cells) {
              if (grid[r][c].value !== null) violated.add(`${r},${c}`);
            }
          }
        }
        // Also check if we can ever reach target with max possible remaining
        const maxRemaining = remaining * size;
        if (sum + maxRemaining < cage.target) {
          // impossible to reach target even with max values
          for (const { r, c } of cage.cells) {
            if (grid[r][c].value !== null) violated.add(`${r},${c}`);
          }
        }
      } else if (cage.op === '×') {
        const prod = vals.reduce((a, b) => a * b, 1);
        if (prod > cage.target) {
          for (const { r, c } of cage.cells) {
            if (grid[r][c].value !== null) violated.add(`${r},${c}`);
          }
        }
        // Additional check: can remaining cells multiply to target/prod?
        // For simplicity skip partial product impossibility due to divisibility
      } else if (cage.op === '-' && vals.length === 2) {
        // both won't be filled until allFilled branch catches it
      } else if (cage.op === '÷' && vals.length === 2) {
        // partial checks are tricky; skip for simplicity
      }
    }
  }

  return violated;
}

export function isComplete(state: GameState): boolean {
  const { size, grid } = state;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c].value === null) return false;
    }
  }
  return getViolatedCells(state).size === 0;
}

export function isGiven(state: GameState, r: number, c: number): boolean {
  for (const cage of state.cages) {
    if (cage.cells.length === 1 && cage.cells[0].r === r && cage.cells[0].c === c) {
      return true;
    }
  }
  return false;
}
