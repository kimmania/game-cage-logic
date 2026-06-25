# Cage Logic

A KenKen-style logic puzzle built as a PWA for iPad and mobile.

## Rules

- Fill the grid so every row and column contains each digit exactly once.
- Cages (thick-bordered groups) must reach their target number using the given operation (+, −, ×, ÷).
- Single-cell cages are already solved.

## Controls

- **Tap** a cell to select it, then tap a number to place it.
- **Notes** toggle lets you scribble small candidate digits.
- **Erase** clears the selected cell.
- Use arrow keys or tap to navigate.

## Difficulties

| Difficulty | Grid | Max Cage | Operations | Puzzles |
|------------|------|----------|------------|---------|
| Warm-up    | 4×4  | 2        | +, −        | 5       |
| Easy       | 5×5  | 2        | +, −, ×     | 50      |
| Medium     | 6×6  | 3        | All         | 300     |
| Hard       | 7×7  | 3        | All         | 250     |
| Expert     | 8×8  | 4        | All         | 250     |

## Development

```bash
npm install
npm run dev
npm run build
npm run generate-puzzles
```

## Deploy

GitHub Actions automatically deploys the `dist/` folder to GitHub Pages on every push to `main`. Ensure Pages is enabled in repo settings → Build and deployment → GitHub Actions.
