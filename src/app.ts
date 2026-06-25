import type { CellState, GameState } from './cage/types';
import { fetchBank, resetGameState, startNewGame } from './cage/puzzle';
import { clearSavedGame, loadSavedGame, saveGame } from './cage/storage';
import { getViolatedCells, isComplete } from './cage/validator';
import { bindBoardInteractions, createBoard, renderBoard } from './ui/board';
import {
  bindControlHandlers,
  createNumpad,
  getSelectedDifficulty,
  setDifficulty,
  setNotesButton,
  setUndoEnabled,
  showWinBanner,
  updateDifficultyLabel,
  updateMistakes,
  updatePuzzleId,
} from './ui/controls';
import { closeHelp, openHelp } from './ui/help';

class CageLogicApp {
  private state: GameState | null = null;
  private board = createBoard(document.getElementById('board')!);
  private loading = false;
  private previousGrid: CellState[][] | null = null;
  private lastSize = 0;

  async init(): Promise<void> {
    fetchBank('warmup').catch(() => {});

    bindBoardInteractions(this.board, (r, c) => this.handleTap(r, c));

    bindControlHandlers({
      onNewGame: () => void this.newGame(),
      onReset: () => this.handleReset(),
      onUndo: () => this.handleUndo(),
      onHelp: () => openHelp(),
      onNotesToggle: () => this.handleNotesToggle(),
      onDifficultyChange: () => void this.newGame(),
      onNumpad: (n) => this.handleNumpad(n),
      onErase: () => this.handleErase(),
    });

    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    const saved = loadSavedGame();
    if (saved && !saved.won && saved.grid && saved.cages) {
      this.state = saved;
      setDifficulty(saved.difficulty);
      setNotesButton(saved.noteMode);
      this.refresh();
    } else {
      await this.newGame();
    }

    if (!localStorage.getItem('cage-logic-has-seen-help')) {
      openHelp();
      localStorage.setItem('cage-logic-has-seen-help', '1');
    }
  }

  private async newGame(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    clearSavedGame();
    this.previousGrid = null;
    closeHelp();

    try {
      const difficulty = getSelectedDifficulty();
      this.state = await startNewGame(difficulty);
      this.refresh();
    } catch (err) {
      console.error(err);
      alert('Could not load a puzzle. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  private handleReset(): void {
    if (!this.state) return;
    resetGameState(this.state);
    this.previousGrid = null;
    this.refresh();
  }

  private stashUndo(): void {
    if (!this.state || this.state.won) return;
    this.previousGrid = this.state.grid.map((row) =>
      row.map((cell) => ({ value: cell.value, notes: [...cell.notes] })),
    );
  }

  private handleTap(r: number, c: number): void {
    if (!this.state || this.state.won) return;
    this.state.activeCell = { r, c };
    this.refresh();
  }

  private handleNotesToggle(): void {
    if (!this.state) return;
    this.state.noteMode = !this.state.noteMode;
    setNotesButton(this.state.noteMode);
    this.refresh();
  }

  private handleNumpad(n: number): void {
    if (!this.state || this.state.won || !this.state.activeCell) return;
    const { r, c } = this.state.activeCell;
    if (this.isGiven(r, c)) return;

    this.stashUndo();
    const cell = this.state.grid[r][c];
    if (this.state.noteMode) {
      const idx = cell.notes.indexOf(n);
      if (idx !== -1) {
        cell.notes.splice(idx, 1);
      } else {
        cell.notes.push(n);
        cell.notes.sort((a, b) => a - b);
      }
    } else {
      cell.value = cell.value === n ? null : n;
      cell.notes = [];
    }
    this.refresh();
  }

  private handleErase(): void {
    if (!this.state || this.state.won || !this.state.activeCell) return;
    const { r, c } = this.state.activeCell;
    if (this.isGiven(r, c)) return;
    this.stashUndo();
    this.state.grid[r][c].value = null;
    this.state.grid[r][c].notes = [];
    this.refresh();
  }

  private handleUndo(): void {
    if (!this.state || !this.previousGrid) return;
    this.state.grid = this.previousGrid;
    this.previousGrid = null;
    this.refresh();
  }

  private isGiven(row: number, col: number): boolean {
    return this.state?.cages.some(
      (cage) => cage.cells.length === 1 && cage.cells[0].r === row && cage.cells[0].c === col,
    ) ?? false;
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (document.querySelector('#help-dialog')) {
      if (e.key === 'Escape') closeHelp();
      return;
    }

    if (!this.state || this.state.won) return;

    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      this.handleUndo();
      return;
    }

    // Toggle notes with N key
    if (e.key === 'n' || e.key === 'N') {
      this.handleNotesToggle();
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      this.handleErase();
      return;
    }

    const num = parseInt(e.key, 10);
    if (!Number.isNaN(num) && num >= 1 && num <= this.state.size) {
      this.handleNumpad(num);
      return;
    }

    if (!this.state.activeCell) return;
    let { r, c } = this.state.activeCell;
    switch (e.key) {
      case 'ArrowUp':
        r = Math.max(0, r - 1);
        break;
      case 'ArrowDown':
        r = Math.min(this.state.size - 1, r + 1);
        break;
      case 'ArrowLeft':
        c = Math.max(0, c - 1);
        break;
      case 'ArrowRight':
        c = Math.min(this.state.size - 1, c + 1);
        break;
      default:
        return;
    }
    this.state.activeCell = { r, c };
    this.refresh();
  }

  private computeMistakes(): number {
    if (!this.state) return 0;
    return getViolatedCells(this.state).size;
  }

  private refresh(): void {
    if (!this.state) return;

    renderBoard(this.board, this.state);

    if (this.state.size !== this.lastSize) {
      this.lastSize = this.state.size;
      createNumpad(this.state.size, (n) => this.handleNumpad(n), () => this.handleErase());
    }

    const mistakes = this.computeMistakes();
    this.state.mistakes = mistakes;
    updateMistakes(mistakes);
    updatePuzzleId(this.state.puzzleId);
    setUndoEnabled(this.previousGrid !== null);
    updateDifficultyLabel(
      this.state.difficulty.charAt(0).toUpperCase() + this.state.difficulty.slice(1),
    );

    if (!this.state.won && isComplete(this.state)) {
      this.state.won = true;
      showWinBanner(true);
      clearSavedGame();
      renderBoard(this.board, this.state);
    } else if (!this.state.won) {
      showWinBanner(false);
      saveGame(this.state);
    }
  }
}

export async function bootstrap(): Promise<void> {
  const app = new CageLogicApp();
  await app.init();
}
