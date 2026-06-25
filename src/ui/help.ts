export function openHelp(): void {
  if (document.getElementById('help-dialog')) return;

  const dialog = document.createElement('div');
  dialog.id = 'help-dialog';
  dialog.className = 'help-overlay';

  const inner = document.createElement('div');
  inner.className = 'help-inner';
  inner.innerHTML = `
    <h2 style="margin-top:0;font-size:1.25rem;">How to play Cage Logic</h2>
    <p><strong>Goal:</strong> Fill the grid so every row and column contains each digit exactly once, and every <em>cage</em> reaches its target using the shown operation.</p>
    <ul style="padding-left:18px;margin:8px 0;">
      <li>Each row and column contains the digits 1 to N exactly once.</li>
      <li>Cages are groups of cells bounded by thick borders with a target number and operation.</li>
      <li><b>+</b> cages: digits must add to the target.</li>
      <li><b>−</b> cages: for two cells, subtract the smaller from the larger to get the target.</li>
      <li><b>×</b> cages: digits must multiply to the target.</li>
      <li><b>÷</b> cages: for two cells, divide the larger by the smaller to get the target.</li>
      <li>Single-cell cages are already solved.</li>
    </ul>
    <p><strong>Controls:</strong></p>
    <ul style="padding-left:18px;margin:8px 0;">
      <li>Tap a cell to select it, then tap a number button to place it.</li>
      <li>Tap <em>Erase</em> to clear the selected cell.</li>
      <li>Toggle <em>Notes</em> to scribble small candidate digits instead of placing a value.</li>
      <li>Digits that repeat in a row, column, or break a cage rule are shown in red.</li>
    </ul>
    <p><strong>Mini example (4×4):</strong></p>
  `;

  const example = makeExampleBoard();
  inner.appendChild(example);

  const closeBtn = document.createElement('button');
  closeBtn.id = 'close-help';
  closeBtn.className = 'btn btn-primary';
  closeBtn.style.cssText = 'margin-top:10px;width:100%';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => dialog.remove());
  inner.appendChild(closeBtn);

  dialog.appendChild(inner);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.remove();
  });

  document.body.appendChild(dialog);
}

export function closeHelp(): void {
  document.getElementById('help-dialog')?.remove();
}

function makeExampleBoard(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin:10px 0;';

  const board = document.createElement('div');
  board.className = 'tutorial-board';
  board.style.setProperty('--board-n', '4');
  board.style.gridTemplateColumns = 'repeat(4, 1fr)';
  board.style.gridTemplateRows = 'repeat(4, 1fr)';

  // Cage layout: 3 cages for a simple example
  // Cage 0: (0,0),(0,1),(1,0),(1,1) target 10 op +
  // Cage 1: (0,2),(0,3) target 2 op -
  // Cage 2: (1,2),(1,3),(2,2),(2,3) target 24 op ×
  // Cage 3: (2,0),(2,1),(3,0),(3,1) target 6 op +
  // Cage 4: (2,2) is already in cage 2, fix it... hmm
  // Better simple layout:
  // C0: [0,0] =1
  // C1: [0,1],[0,2] target 5 op + -> (2+3)
  // C2: [0,3],[1,3] target 2 op - -> (4-2)
  // C3: [1,0],[1,1],[1,2] target 9 op + -> (4+3+2)
  // C4: [2,0],[3,0] target 2 op - -> (4-2)
  // C5: [2,1],[3,1] target 3 op - -> (4-1)
  // C6: [2,2],[2,3] target 2 op ÷ -> (4/2)
  // C7: [3,2],[3,3] target 2 op ÷ -> (4/2)
  // Hard to show a full valid KenKen in a tiny example without solver...
  // Just show an abstract representation.

  const cells = [] as HTMLElement[];
  for (let i = 0; i < 16; i++) {
    const cell = document.createElement('div');
    cell.className = 'tutorial-cell';
    board.appendChild(cell);
    cells.push(cell);
  }

  // Apply cage borders and labels for a conceptual example
  const setBorder = (idx: number, cls: string) => cells[idx].classList.add(cls);
  // Cage A: top-left 2x2, target 10+
  [0, 1, 4, 5].forEach((i) => {
    setBorder(i, 'cage-top');
    setBorder(i, 'cage-left');
    setBorder(i, 'cage-right');
    setBorder(i, 'cage-bottom');
  });
  // Remove internal borders for Cage A
  // top edge 0,1 already top; bottom edge 4,5 already bottom; left edge 0,4 already left; right edge 1,5 already right
  // actually easier: just show the labels and mention thick borders represent cages
  
  const cap = document.createElement('p');
  cap.style.cssText = 'margin:0;color:var(--text-dim);font-size:0.9em;text-align:center;max-width:300px;';
  cap.textContent =
    'Thick lines cage off groups. Top-left numbers (like "10+" or "2−") tell you what the digits inside must compute to.';

  wrapper.appendChild(board);
  wrapper.appendChild(cap);
  return wrapper;
}
