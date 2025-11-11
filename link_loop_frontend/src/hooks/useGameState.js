import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateGrid, validatePath, isAdjacent, nextRequiredDigitFromPath } from '../utils/gameUtils';

/**
 * Hook encapsulating the Link Loop game state and interactions.
 * Adds strict next-number progression blocking, backtracking, and invalid-move visual feedback.
 */
// PUBLIC_INTERFACE
export function useGameState({ size = 5, seed = 42 } = {}) {
  /** Core game state: grid, path, interaction handlers, and validation */
  const [grid, setGrid] = useState(() => generateGrid(size, seed));
  const [path, setPath] = useState([]); // [{row, col}]
  const [history, setHistory] = useState([]); // stack of path snapshots
  const [isDrawing, setIsDrawing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [validation, setValidation] = useState({ ok: false, reason: '' });
  const [invalidAt, setInvalidAt] = useState(null); // {row, col} for visual feedback
  const [started, setStarted] = useState(false); // Start button gating

  const gridSize = grid.length;

  const isInside = useCallback(
    (row, col) => row >= 0 && row < gridSize && col >= 0 && col < gridSize,
    [gridSize]
  );

  const cellKey = (row, col) => `${row},${col}`;

  const pathSet = useMemo(() => new Set(path.map(p => cellKey(p.row, p.col))), [path]);

  const addToHistory = useCallback((p) => {
    setHistory((prev) => [...prev, p]);
  }, []);

  // Determine next required digit based on digits seen in path
  const nextRequiredDigit = useMemo(() => nextRequiredDigitFromPath(grid, path), [grid, path]);

  const startPathAt = useCallback((row, col) => {
    if (!started) return;
    if (!isInside(row, col)) return;
    setInvalidAt(null);
    const val = grid[row][col];
    // Must start on '1' if it exists in the grid
    let hasOne = false;
    for (let r = 0; r < gridSize; r++) for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === 1) { hasOne = true; break; }
    }
    if (hasOne && val !== 1) {
      setInvalidAt({ row, col });
      setIsDrawing(false);
      setValidation({ ok: false, reason: 'Start on 1 to begin the sequence' });
      return;
    }
    const next = [{ row, col }];
    addToHistory(next);
    setPath(next);
    setIsDrawing(true);
  }, [addToHistory, grid, gridSize, isInside, started]);

  const extendPathTo = useCallback((row, col) => {
    if (!started) return;
    if (!isInside(row, col)) return;
    if (!isDrawing) return;
    setInvalidAt(null);
    const last = path[path.length - 1];
    if (last && (last.row === row && last.col === col)) return;

    // Must be adjacent
    if (!isAdjacent(last, { row, col })) return;

    // If moving to the previous cell in the path, treat as backtrack: pop last cell
    if (path.length >= 2) {
      const prev = path[path.length - 2];
      if (prev.row === row && prev.col === col) {
        const nextPath = path.slice(0, -1);
        addToHistory(nextPath);
        setPath(nextPath);
        return;
      }
    }

    // Prevent revisiting any other previously visited cell
    if (pathSet.has(cellKey(row, col))) {
      setInvalidAt({ row, col });
      setValidation({ ok: false, reason: 'Cannot revisit a non-adjacent previous segment' });
      return;
    }

    // Enforce ascending number constraint only when moving forward to a new cell
    const val = grid[row][col];
    if (typeof val === 'number') {
      const mustBe = nextRequiredDigitFromPath(grid, path);
      if (val !== mustBe) {
        setInvalidAt({ row, col });
        setValidation({ ok: false, reason: `You must go to ${mustBe} next` });
        return;
      }
    }

    const next = [...path, { row, col }];
    addToHistory(next);
    setPath(next);
  }, [addToHistory, grid, isDrawing, isInside, path, pathSet, started]);

  const endPath = useCallback(() => {
    setIsDrawing(false);
    // If finished path equals all cells, validate
    if (path.length === gridSize * gridSize) {
      const res = validatePath(grid, path);
      setValidation(res);
      setCompleted(res.ok);
    }
  }, [grid, gridSize, path]);

  const undo = useCallback(() => {
    setInvalidAt(null);
    if (history.length <= 1) {
      setPath([]);
      setHistory([]);
      setCompleted(false);
      setValidation({ ok: false, reason: '' });
      return;
    }
    const nextHist = history.slice(0, -1);
    const nextPath = nextHist[nextHist.length - 1] || [];
    setHistory(nextHist);
    setPath(nextPath);
    setCompleted(false);
    setValidation({ ok: false, reason: '' });
  }, [history]);

  const reset = useCallback(() => {
    setInvalidAt(null);
    setPath([]);
    setHistory([]);
    setCompleted(false);
    setValidation({ ok: false, reason: '' });
  }, []);

  const startGame = useCallback(() => {
    setStarted(true);
  }, []);

  const restartGame = useCallback(() => {
    // Reset path but keep numbers/grid
    setInvalidAt(null);
    setPath([]);
    setHistory([]);
    setCompleted(false);
    setValidation({ ok: false, reason: '' });
    setStarted(true);
  }, []);

  // Pointer/touch handling helpers
  const containerRef = useRef(null);

  const getCellFromEvent = useCallback((clientX, clientY) => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const cellSizePx = rect.width / gridSize;
    const row = Math.floor(y / cellSizePx);
    const col = Math.floor(x / cellSizePx);
    if (!isInside(row, col)) return null;
    return { row, col };
  }, [gridSize, isInside]);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    if (!started) return;
    const p = getCellFromEvent(e.clientX, e.clientY);
    if (p) startPathAt(p.row, p.col);
  }, [getCellFromEvent, startPathAt, started]);

  const onPointerMove = useCallback((e) => {
    if (!started || !isDrawing) return;
    const p = getCellFromEvent(e.clientX, e.clientY);
    if (p) extendPathTo(p.row, p.col);
  }, [extendPathTo, getCellFromEvent, isDrawing, started]);

  const onPointerUp = useCallback(() => {
    if (isDrawing) endPath();
  }, [endPath, isDrawing]);

  // Touch events mapping
  const onTouchStart = useCallback((e) => {
    if (!started) return;
    const t = e.touches[0];
    if (!t) return;
    const p = getCellFromEvent(t.clientX, t.clientY);
    if (p) startPathAt(p.row, p.col);
  }, [getCellFromEvent, startPathAt, started]);

  const onTouchMove = useCallback((e) => {
    if (!started) return;
    const t = e.touches[0];
    if (!t) return;
    const p = getCellFromEvent(t.clientX, t.clientY);
    if (p) extendPathTo(p.row, p.col);
  }, [extendPathTo, getCellFromEvent, started]);

  const onTouchEnd = useCallback(() => {
    if (isDrawing) endPath();
  }, [endPath, isDrawing]);

  // Resize safety: end drawing if window loses focus to avoid stuck state
  useEffect(() => {
    const handleBlur = () => setIsDrawing(false);
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  return {
    grid,
    path,
    history,
    completed,
    validation,
    invalidAt,
    containerRef,
    started,
    actions: {
      startPathAt,
      extendPathTo,
      endPath,
      undo,
      reset,
      startGame,
      restartGame,
      setGrid, // expose in case of future size changes
    },
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onTouchStart,
      onTouchMove,
      onTouchEnd
    }
  };
}
