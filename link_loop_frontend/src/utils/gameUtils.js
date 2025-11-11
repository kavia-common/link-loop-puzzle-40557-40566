//
// Core utilities for Link Loop game
//

/**
 * Generate a square grid of size n where digits 1..9 (or fewer if grid too small)
 * are placed along a single deterministic serpentine Hamiltonian path.
 * The serpentine path covers every cell exactly once without crossings.
 * Numbers are placed at evenly spaced indices along this path in ascending order.
 */
// PUBLIC_INTERFACE
export function generateGrid(size = 5, seed = 42) {
  /** Generate a grid with digits along a serpentine Hamiltonian path. Seed retained for forward compat, unused here. */
  const grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
  const path = buildSerpentinePath(size); // array of {row,col}
  const total = path.length;
  const maxDigit = Math.min(9, total);
  if (maxDigit <= 0) return grid;

  // Evenly space digits including placing 1 at index 0 and maxDigit at the end proportionally.
  // Compute indices as round(i * (total-1) / (maxDigit-1)) for i in [0..maxDigit-1]
  const indices = [];
  for (let i = 0; i < maxDigit; i++) {
    const idx =
      maxDigit === 1 ? 0 : Math.round((i * (total - 1)) / (maxDigit - 1));
    indices.push(idx);
  }
  // Ensure indices are strictly increasing and within bounds
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] <= indices[i - 1]) indices[i] = indices[i - 1] + 1;
    if (indices[i] > total - 1) indices[i] = total - 1;
  }

  for (let d = 1; d <= maxDigit; d++) {
    const { row, col } = path[indices[d - 1]];
    grid[row][col] = d;
  }
  return grid;
}

/**
 * Build a deterministic serpentine Hamiltonian path for an N x N grid.
 * Starts at (0,0), moves left-to-right on even rows and right-to-left on odd rows.
 */
// PUBLIC_INTERFACE
export function buildSerpentinePath(size) {
  /** Return array of {row,col} covering every cell exactly once in a serpentine order. */
  const path = [];
  for (let r = 0; r < size; r++) {
    if (r % 2 === 0) {
      for (let c = 0; c < size; c++) path.push({ row: r, col: c });
    } else {
      for (let c = size - 1; c >= 0; c--) path.push({ row: r, col: c });
    }
  }
  return path;
}

/**
 * Whether two cells are cardinal neighbors.
 */
// PUBLIC_INTERFACE
export function isAdjacent(a, b) {
  /** Return true if cells a and b are adjacent (Manhattan distance 1). */
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

/**
 * Compute the next required digit based on digits encountered along the current path.
 * Treats digits that appear as a strict ascending sequence starting from 1.
 */
// PUBLIC_INTERFACE
export function nextRequiredDigitFromPath(grid, path) {
  /** Returns the next number required when moving forward to a new cell. */
  let maxSeen = 0;
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    const v = grid[p.row][p.col];
    if (typeof v === 'number') {
      if (v === maxSeen + 1) {
        maxSeen = v;
      } else if (v > maxSeen + 1) {
        break;
      }
    }
  }
  // Detect max digit on grid
  const size = grid.length;
  let maxDigit = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (typeof grid[r][c] === 'number') maxDigit = Math.max(maxDigit, grid[r][c]);
  }
  return Math.min(maxSeen + 1, Math.max(1, maxDigit));
}

/**
 * Build the SVG path data from a list of points (cell centers) using straight segments.
 */
export function buildSvgPathFromPoints(points) {
  if (!points || points.length === 0) return '';
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;
  rest.forEach((p) => {
    d += ` L ${p.x} ${p.y}`;
  });
  return d;
}

/**
 * Convert a grid coordinate to an SVG coordinate (center of cell).
 */
export function gridCoordToSvgPoint(row, col, cellSize, padding = 0) {
  const x = padding + col * cellSize + cellSize / 2;
  const y = padding + row * cellSize + cellSize / 2;
  return { x, y };
}

/**
 * Validate that the final continuous path visits each cell once and connects digits in ascending order.
 * This validation is for completed paths only; interaction-level backtracking is handled elsewhere.
 * The path is an array of {row, col}. Grid contains digits or null.
 */
export function validatePath(grid, path) {
  const size = grid.length;
  if (path.length !== size * size) return { ok: false, reason: 'Path must visit every cell once' };

  // Ensure all unique cells
  const seen = new Set(path.map((p) => `${p.row},${p.col}`));
  if (seen.size !== path.length) return { ok: false, reason: 'Path visits a cell more than once' };

  // Ensure neighbors (4-directional)
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    const isNeighbor = (dr + dc === 1);
    if (!isNeighbor) return { ok: false, reason: 'Non-adjacent cells in path' };
  }

  // Ensure ascending digits order
  const digitsInGrid = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (grid[r][c]) digitsInGrid.push(grid[r][c]);
  }
  const maxDigit = Math.max(...digitsInGrid, 0);
  const positions = {};
  path.forEach((p, idx) => {
    const val = grid[p.row][p.col];
    if (val != null) positions[val] = idx;
  });

  for (let d = 1; d < maxDigit; d++) {
    if (!(d in positions) || !((d + 1) in positions)) {
      return { ok: false, reason: 'Missing numbered cells in path' };
    }
    if (positions[d] > positions[d + 1]) {
      return { ok: false, reason: 'Digits are not in ascending order along the path' };
    }
  }

  return { ok: true, reason: 'Valid path' };
}

/**
 * Simple time formatter mm:ss
 */
export function formatSeconds(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Fisher-Yates shuffle with injected RNG function
 */
function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Deterministic PRNG
 */
function mulberry32(a) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
