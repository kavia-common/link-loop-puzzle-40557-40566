//
//
// Core utilities for Link Loop game
//

/**
 * Generate a square grid of size n where digits 1..9 (or fewer if grid too small)
 * are placed along a single randomized Hamiltonian path, at randomized spaced positions.
 * The path covers every cell exactly once without crossings.
 * Numbers are placed at spaced indices along this path in ascending order,
 * but the specific spacing is randomized using the provided seed (or crypto).
 */
 // PUBLIC_INTERFACE
export function generateGrid(size = 5, seed = 42) {
  /** Generate a grid with digits along a randomized Hamiltonian path. Uses seed to randomize path and digit positions.
   * Requirements:
   * - Always place digits 1..9 (or fewer if grid too small) along the canonical path.
   * - Ensure that digit 9 is placed on the last node of the canonical path.
   */
  const grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
  // Build a randomized Hamiltonian path to avoid horizontal bias
  const path = buildRandomHamiltonianPath(size, seed);
  const total = path.length;
  const maxDigit = Math.min(9, total);
  if (maxDigit <= 0) return grid;

  // Choose spaced indices along the path for digits 1..maxDigit-1 (reserve last index for 9).
  // Strategy:
  // 1) Compute base even-spaced indices across [0, total-2] (exclude last so 9 can be at total-1).
  // 2) Add small random jitter per index and clamp to [0, total-2].
  // 3) Sort and force strictly increasing to maintain order.
  const rng = createRng(seed);
  const lastIndex = total - 1;
  const digitCountBeforeLast = Math.max(0, maxDigit - 1);

  const base = [];
  for (let i = 0; i < digitCountBeforeLast; i++) {
    const denom = Math.max(1, digitCountBeforeLast - 1);
    const idx = digitCountBeforeLast === 1
      ? 0
      : Math.round((i * (total - 2)) / denom); // ensure within [0, total-2]
    base.push(idx);
  }

  // Apply jitter up to ±floor(total/(maxDigit*3)) while keeping within [0, total-2]
  const jitterMax = Math.max(1, Math.floor(total / (maxDigit * 3)));
  const jittered = base.map((idx, i) => {
    // keep first (1) near start by reducing jitter; rest can vary more
    const scale = (i === 0) ? 0.4 : 1.0;
    const j = Math.floor((rng() * 2 - 1) * jitterMax * scale);
    return Math.min(total - 2, Math.max(0, idx + j));
  });

  // Sort and strictly increase, fixing collisions
  jittered.sort((a, b) => a - b);
  for (let i = 1; i < jittered.length; i++) {
    if (jittered[i] <= jittered[i - 1]) jittered[i] = jittered[i - 1] + 1;
    if (jittered[i] > total - 2) jittered[i] = total - 2;
  }
  // Walk backwards to spread if needed
  for (let i = jittered.length - 2; i >= 0; i--) {
    if (jittered[i] >= jittered[i + 1]) jittered[i] = Math.max(0, jittered[i + 1] - 1);
  }

  // Place digits 1..(maxDigit-1) at jittered indices and 9 (or maxDigit) at the last node
  for (let d = 1; d <= maxDigit; d++) {
    const indexOnPath = (d === maxDigit) ? lastIndex : jittered[d - 1];
    const { row, col } = path[indexOnPath];
    grid[row][col] = d;
  }
  return grid;
}

/**
 * Build a randomized Hamiltonian path for an N x N grid using DFS with randomized neighbor order.
 * This produces vertical, horizontal, and mixed-direction trails while covering each cell exactly once.
 * The generator is seeded and includes periodic orientation bias toggles to avoid long straight runs.
 * Serpentine fallback and any row-wise iteration patterns have been removed to ensure diversity.
 */
// PUBLIC_INTERFACE
export function buildRandomHamiltonianPath(size, seed) {
  /** Return array of {row,col} covering every cell exactly once using randomized DFS with shuffled neighbors and bias toggles. */
  const rng = createRng(seed);
  const total = size * size;

  // Cardinal directions
  const DIRS = [
    { name: 'U', dr: -1, dc: 0 },
    { name: 'D', dr: 1, dc: 0 },
    { name: 'L', dr: 0, dc: -1 },
    { name: 'R', dr: 0, dc: 1 },
  ];

  // Random start for variety
  const start = { row: Math.floor(rng() * size), col: Math.floor(rng() * size) };
  const visited = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  const path = [];

  const inBounds = (r, c) => r >= 0 && r < size && c >= 0 && c < size;

  // Orientation bias toggles: occasionally prefer vertical or horizontal to introduce turns.
  // Bias state flips stochastically as depth increases to avoid degeneracy.
  function orientationBias(depth) {
    // Every k steps, flip a coin to toggle preference
    const k = 3 + Math.floor(rng() * 3); // 3..5
    const phase = depth % k === 0 ? (rng() < 0.5 ? 'H' : 'V') : null;
    return phase; // 'H' prefer horizontal, 'V' prefer vertical, null neutral
  }

  function shuffledNeighbors(r, c, depth) {
    const bias = orientationBias(depth);
    const arr = DIRS.slice();

    // Primary shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    // Apply soft bias by stable-sorting groups after shuffle
    if (bias === 'H') {
      // prioritize L/R slightly by grouping
      arr.sort((a, b) => {
        const ah = (a.name === 'L' || a.name === 'R') ? 0 : 1;
        const bh = (b.name === 'L' || b.name === 'R') ? 0 : 1;
        return ah - bh;
      });
    } else if (bias === 'V') {
      // prioritize U/D slightly
      arr.sort((a, b) => {
        const av = (a.name === 'U' || a.name === 'D') ? 0 : 1;
        const bv = (b.name === 'U' || b.name === 'D') ? 0 : 1;
        return av - bv;
      });
    }

    // Warnsdorff-like heuristic: prefer neighbors with few onward options (lower degree)
    arr.sort((a, b) => {
      const degA = unvisitedDegree(r + a.dr, c + a.dc);
      const degB = unvisitedDegree(r + b.dr, c + b.dc);
      return degA - degB;
    });

    return arr;
  }

  function unvisitedDegree(r, c) {
    if (!inBounds(r, c) || visited[r][c]) return Number.POSITIVE_INFINITY;
    let cnt = 0;
    for (const d of DIRS) {
      const nr = r + d.dr, nc = c + d.dc;
      if (inBounds(nr, nc) && !visited[nr][nc]) cnt++;
    }
    return cnt;
  }

  function dfs(r, c, depth) {
    visited[r][c] = true;
    path.push({ row: r, col: c });

    if (depth === total) return true;

    const neighbors = shuffledNeighbors(r, c, depth);

    // Occasionally reverse a pair to induce a turn even if degree ties
    if (rng() < 0.15) {
      const i = Math.floor(rng() * neighbors.length);
      const j = Math.floor(rng() * neighbors.length);
      [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
    }

    for (const d of neighbors) {
      const nr = r + d.dr;
      const nc = c + d.dc;
      if (!inBounds(nr, nc) || visited[nr][nc]) continue;

      if (dfs(nr, nc, depth + 1)) return true;
    }

    // backtrack
    visited[r][c] = false;
    path.pop();
    return false;
  }

  // Try multiple randomized attempts to ensure success without using serpentine fallback.
  const maxAttempts = 12;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Clear visited and path for each attempt
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) visited[r][c] = false;
    path.length = 0;

    // Optionally vary start slightly across attempts
    const s =
      attempt === 0
        ? start
        : { row: Math.floor(rng() * size), col: Math.floor(rng() * size) };

    if (dfs(s.row, s.col, 1) && path.length === total) {
      return path.slice();
    }
  }

  // As a final measure (extremely rare for small N), construct a randomized zig-zag with column flips to keep turns.
  // This is NOT a simple row-wise serpentine; it alternates by columns and flips sub-segments to avoid long horizontals.
  const alt = [];
  const cols = Array.from({ length: size }, (_, x) => x);
  // shuffle columns to avoid consistent horizontal patterns
  for (let i = cols.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cols[i], cols[j]] = [cols[j], cols[i]];
  }
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    const rOrder = i % 2 === 0 ? [...Array(size).keys()] : [...Array(size).keys()].reverse();
    for (const r of rOrder) {
      alt.push({ row: r, col: c });
    }
  }
  return alt;
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
 * Mixed orientations (vertical/horizontal turns) are accepted; only 4-neighbor adjacency is required.
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

  // Collect digits in grid and determine max digit present
  const digitsInGrid = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (grid[r][c]) digitsInGrid.push(grid[r][c]);
  }
  const maxDigit = Math.max(...digitsInGrid, 0);

  // Ensure ascending digits order along the path
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

  // Require that the final cell in the path is the max digit (i.e., 9 when present)
  const last = path[path.length - 1];
  const lastVal = grid[last.row][last.col];
  if (lastVal !== maxDigit) {
    return { ok: false, reason: `Path must end on ${maxDigit}` };
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
 * Format seconds as mm:ss.SSS (with milliseconds)
 */
// PUBLIC_INTERFACE
export function formatSecondsMs(seconds) {
  /** Returns a string like 02:15.237 given seconds as floating value. */
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const m = Math.floor(totalMs / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

/**
 * Get a high-entropy random seed using crypto if available, else Math.random fallback.
 */
// PUBLIC_INTERFACE
export function randomSeed() {
  /** Returns a 32-bit unsigned integer seed using crypto if available. */
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] >>> 0;
  } else {
    return Math.floor(Math.random() * 0xFFFFFFFF) >>> 0;
  }
}

/**
 * Create RNG from a seed. If seed is undefined, use crypto/Math for non-deterministic RNG.
 */
function createRng(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return mulberry32(seed >>> 0);
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return () => {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return (buf[0] >>> 0) / 4294967296;
    };
  }
  return Math.random;
}

/* (removed) shuffleInPlace utility; shuffling is performed locally within the path builder using the seeded RNG to ensure encapsulated randomness. */

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
