//
// Core utilities for Link Loop game
//

/**
 * Generate a square grid of size n with numbers placed 1..maxDigit scattered.
 * For simplicity, this generator will place digits at pseudo-random locations but always include 1..9.
 * In a production scenario, a proper puzzle generator/validator would be used.
 */
export function generateGrid(size = 5, seed = 42) {
  const rng = mulberry32(seed);
  const grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
  // Place digits 1..9 on random distinct cells (if grid too small, clamp)
  const maxDigit = Math.min(9, size * size);
  const allCells = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) allCells.push([r, c]);
  shuffleInPlace(allCells, rng);
  for (let d = 1; d <= maxDigit; d++) {
    const [r, c] = allCells[d - 1];
    grid[r][c] = d;
  }
  return grid;
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
 * Validate that the continuous path visits each cell once and connects digits in ascending order.
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
