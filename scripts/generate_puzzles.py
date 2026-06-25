#!/usr/bin/env python3
import json
import random
import os
import signal

random.seed(42)

# -----------------------------------------------------------
# 1. Latin square generation
# -----------------------------------------------------------
def generate_latin_square(n):
    grid = [[0]*n for _ in range(n)]

    def ok(r, c, val):
        for i in range(n):
            if grid[r][i] == val or grid[i][c] == val:
                return False
        return True

    def backtrack(r, c):
        if r == n:
            return True
        nr, nc = (r, c+1) if c+1 < n else (r+1, 0)
        vals = list(range(1, n+1))
        random.shuffle(vals)
        for v in vals:
            if ok(r, c, v):
                grid[r][c] = v
                if backtrack(nr, nc):
                    return True
                grid[r][c] = 0
        return False

    if not backtrack(0, 0):
        raise RuntimeError("Failed to generate Latin square")
    return grid

# -----------------------------------------------------------
# 2. Cage partition (connected cells, exact singleton control)
# -----------------------------------------------------------
def partition_cages(n, max_size, singleton_range):
    num_singletons = random.randint(singleton_range[0], singleton_range[1])
    all_cells = [(r, c) for r in range(n) for c in range(n)]
    random.shuffle(all_cells)

    cages = []
    for r, c in all_cells[:num_singletons]:
        cages.append([{'r': r, 'c': c}])

    unassigned = set(all_cells[num_singletons:])

    def nbrs(cell, pool):
        r, c = cell
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r+dr, c+dc
            if (nr, nc) in pool:
                yield (nr, nc)

    while unassigned:
        start = random.choice(list(unassigned))
        max_possible = min(max_size, len(unassigned))
        # Pick a size ≥2 if we can; otherwise fall back to singleton
        if max_possible >= 2:
            size = random.randint(2, max_possible)
        else:
            size = 1

        cage = [start]
        unassigned.remove(start)
        frontier = list(nbrs(start, unassigned))
        while len(cage) < size and frontier:
            cell = random.choice(frontier)
            cage.append(cell)
            unassigned.remove(cell)
            for nb in nbrs(cell, unassigned):
                if nb not in frontier:
                    frontier.append(nb)
            frontier.remove(cell)
        cages.append([{'r': r, 'c': c} for r, c in cage])

    return cages

# -----------------------------------------------------------
# 3. Operation assignment
# -----------------------------------------------------------
def assign_ops(cages, grid, n, allowed_ops, difficulty):
    result = []
    for cage in cages:
        cells = [(cell['r'], cell['c']) for cell in cage]
        vals = [grid[r][c] for r, c in cells]
        k = len(vals)
        if k == 1:
            result.append({'cells': cage, 'target': vals[0], 'op': '='})
            continue

        candidates = []
        if '+' in allowed_ops:
            candidates.append(('+', sum(vals)))
        if '×' in allowed_ops:
            p = 1
            for v in vals:
                p *= v
            candidates.append(('×', p))
        if k == 2:
            a, b = vals
            if '-' in allowed_ops and a != b:
                candidates.append(('-', abs(a - b)))
            if '÷' in allowed_ops and max(a, b) % min(a, b) == 0:
                q = max(a, b) // min(a, b)
                if q > 1:
                    candidates.append(('÷', q))

        if not candidates:
            result.append({'cells': cage, 'target': sum(vals), 'op': '+'})
            continue

        if difficulty in ('warmup', 'easy'):
            plus = next((c for c in candidates if c[0] == '+'), None)
            op, target = plus if plus else candidates[0]
        else:
            if difficulty in ('hard', 'expert') and k == 2:
                div = next((c for c in candidates if c[0] == '÷'), None)
                sub = next((c for c in candidates if c[0] == '-'), None)
                if div and random.random() < 0.35:
                    op, target = div
                elif sub and random.random() < 0.45:
                    op, target = sub
                else:
                    op, target = random.choice(candidates)
            else:
                op, target = random.choice(candidates)

        result.append({'cells': cage, 'target': target, 'op': op})
    return result

# -----------------------------------------------------------
# 4. Backtracking solver with cage pruning
# -----------------------------------------------------------
def solve_puzzle(n, cages, limit=2, timeout_secs=3):
    cage_map = [[-1]*n for _ in range(n)]
    for i, cage in enumerate(cages):
        for cell in cage['cells']:
            cage_map[cell['r']][cell['c']] = i

    cage_cells = [c['cells'] for c in cages]
    cage_targets = [c['target'] for c in cages]
    cage_ops = [c['op'] for c in cages]
    grid = [[0]*n for _ in range(n)]
    count = [0]

    def alarm_handler(signum, frame):
        raise TimeoutError()

    old_handler = signal.signal(signal.SIGALRM, alarm_handler)
    signal.alarm(timeout_secs)

    try:
        def cage_possible(ci):
            cells = cage_cells[ci]
            op = cage_ops[ci]
            target = cage_targets[ci]
            filled = []
            empty = 0
            for cell in cells:
                v = grid[cell['r']][cell['c']]
                if v:
                    filled.append(v)
                else:
                    empty += 1

            if op == '=':
                return filled[0] == target if filled else True

            if op == '+':
                s = sum(filled)
                if empty == 0:
                    return s == target
                return s + empty <= target <= s + empty * n

            if op == '×':
                p = 1
                for v in filled:
                    p *= v
                if empty == 0:
                    return p == target
                if p > target or target % p != 0:
                    return False
                q = target // p
                if q < 1 or q > n**empty:
                    return False
                # quick factorisation check (ascending order)
                def can_factor(x, k, lo=1):
                    if k == 1:
                        return lo <= x <= n
                    for d in range(lo, n+1):
                        if x % d == 0 and can_factor(x//d, k-1, d):
                            return True
                    return False
                return can_factor(q, empty)

            if op == '-':
                if len(cells) != 2:
                    return False
                a = grid[cells[0]['r']][cells[0]['c']]
                b = grid[cells[1]['r']][cells[1]['c']]
                if a and b:
                    return abs(a - b) == target
                for known in (a, b):
                    if known:
                        return (known + target <= n) or (known - target >= 1)
                return True

            if op == '÷':
                if len(cells) != 2:
                    return False
                a = grid[cells[0]['r']][cells[0]['c']]
                b = grid[cells[1]['r']][cells[1]['c']]
                if a and b:
                    return max(a, b) // min(a, b) == target and max(a, b) % min(a, b) == 0
                for known in (a, b):
                    if known:
                        return (known * target <= n) or (known % target == 0 and known // target >= 1)
                return True

            return True

        def get_candidates(r, c):
            row_used = {grid[r][j] for j in range(n)}
            col_used = {grid[i][c] for i in range(n)}
            ci = cage_map[r][c]
            opts = []
            for v in range(1, n+1):
                if v in row_used or v in col_used:
                    continue
                grid[r][c] = v
                ok = cage_possible(ci)
                grid[r][c] = 0
                if ok:
                    opts.append(v)
            return opts

        def backtrack():
            if count[0] >= limit:
                return
            best = None
            best_opts = None
            for r in range(n):
                for c in range(n):
                    if grid[r][c] == 0:
                        opts = get_candidates(r, c)
                        if not opts:
                            return
                        if best is None or len(opts) < len(best_opts):
                            best = (r, c)
                            best_opts = opts
                            if len(best_opts) == 1:
                                break
                if best and len(best_opts) == 1:
                    break
            if best is None:
                count[0] += 1
                return
            r, c = best
            for v in best_opts:
                grid[r][c] = v
                backtrack()
                grid[r][c] = 0
                if count[0] >= limit:
                    return

        backtrack()
    except TimeoutError:
        count[0] = limit  # treat as multiple to discard
    finally:
        signal.alarm(0)
        signal.signal(signal.SIGALRM, old_handler)

    return count[0]

# -----------------------------------------------------------
# 5. Difficulty specs
# -----------------------------------------------------------
DIFFICULTIES = {
    'warmup': {'n': 4, 'max_cage': 2, 'ops': ['+', '-'],       'singletons': (2, 2)},
    'easy':   {'n': 5, 'max_cage': 2, 'ops': ['+', '-', '×'], 'singletons': (1, 1)},
    'medium': {'n': 6, 'max_cage': 3, 'ops': ['+', '-', '×', '÷'], 'singletons': (0, 1)},
    'hard':   {'n': 7, 'max_cage': 3, 'ops': ['+', '-', '×', '÷'], 'singletons': (0, 0)},
    'expert': {'n': 8, 'max_cage': 4, 'ops': ['+', '-', '×', '÷'], 'singletons': (0, 0)},
}

COUNTS = {
    'warmup': 5,
    'easy': 50,
    'medium': 300,
    'hard': 250,
    'expert': 250,
}

OUT_DIR = 'public/puzzles'

# -----------------------------------------------------------
# 6. Generator loop
# -----------------------------------------------------------
def generate_puzzle(difficulty):
    spec = DIFFICULTIES[difficulty]
    n = spec['n']
    max_cage = spec['max_cage']
    allowed_ops = spec['ops']
    singleton_range = spec['singletons']
    tag = {
        'warmup': 'w', 'easy': 'e', 'medium': 'm',
        'hard': 'h', 'expert': 'x'
    }[difficulty]

    for attempt in range(300):
        latin = generate_latin_square(n)
        cages = partition_cages(n, max_cage, singleton_range)
        cage_objs = assign_ops(cages, latin, n, allowed_ops, difficulty)
        sol_count = solve_puzzle(n, cage_objs, limit=2, timeout_secs=3)
        if sol_count == 1:
            return {
                'id': f'{tag}-{attempt}-{random.randint(1000,9999)}',
                'size': n,
                'cages': cage_objs,
                'solution': latin,
            }
    raise RuntimeError(f"Failed to generate {difficulty} puzzle after 300 attempts")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for diff, count in COUNTS.items():
        puzzles = []
        print(f"Generating {count} puzzles for {diff}...")
        for i in range(count):
            try:
                p = generate_puzzle(diff)
                puzzles.append(p)
            except RuntimeError as e:
                print(f"  ERROR at {i+1}/{count}: {e}")
                break
            if (i+1) % 10 == 0 or i+1 == count:
                print(f"  ...{i+1}/{count}")
        out_path = os.path.join(OUT_DIR, f'{diff}.json')
        with open(out_path, 'w') as f:
            json.dump(puzzles, f)
        print(f"Saved {out_path} ({len(puzzles)} puzzles)")


if __name__ == '__main__':
    main()
