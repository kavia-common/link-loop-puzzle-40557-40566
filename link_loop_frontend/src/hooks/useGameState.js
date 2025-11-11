import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateGrid, validatePath } from '../utils/gameUtils';

/**
 * Hook encapsulating the Link Loop game state and interactions.
 * Adds strict next-number progression blocking and invalid-move visual feedback.
 */
export function useGameState({ size = 5, seed = 42 } = {}) {
  const [grid, setGrid] = useState(() => generateGrid(size, seed));
  const [path, setPath] = useState([]); // [{row, col}]
  const [history, setHistory] = useState([]); // stack of path snapshots
  const [isDrawing, setIsDrawing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [validation, setValidation] = useState({ ok: false, reason: '' });
  const [invalidAt, setInvalidAt] = useState(null); // {row, col} for visual feedback

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
  const nextRequiredDigit = useMemo(() => {
    // Collect digits encountered along current path in order
    let maxSeen = 0;
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      const v = grid[p.row][p.col];
      if (typeof v === 'number') {
        if (v === maxSeen + 1) {
          maxSeen = v;
        } else if (v > maxSeen + 1) {
          // Path already jumped ahead (shouldn't happen with blocking)
          break;
        }
      }
    }
    // Find max digit present on the grid
    let maxDigit = 0;
    for (let r = 0; r < gridSize; r++) for (let c = 0; c < gridSize; c++) {
      if (typeof grid[r][c] === 'number') maxDigit = Math.max(maxDigit, grid[r][c]);
    }
    const next = Math.min(maxSeen + 1, Math.max(1, maxDigit));
    return next;
  }, [grid, gridSize, path]);

  const startPathAt = useCallback((row, col) => {
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
  }, [addToHistory, grid, gridSize, isInside]);

  const extendPathTo = useCallback((row, col) => {
    if (!isInside(row, col)) return;
    if (!isDrawing) return;
    setInvalidAt(null);
    const last = path[path.length - 1];
    if (last && (last.row === row && last.col === col)) return;

    const dr = Math.abs(last.row - row);
    const dc = Math.abs(last.col - col);
    if (dr + dc !== 1) return; // only cardinal moves
    if (pathSet.has(cellKey(row, col))) return; // no revisits

    // Strict next-number progression: if the target cell is a number, it must equal nextRequiredDigit
    const val = grid[row][col];
    if (typeof val === 'number') {
      // Determine next required digit from current path
      let maxSeen = 0;
      for (let i = 0; i < path.length; i++) {
        const p = path[i];
        const pv = grid[p.row][p.col];
        if (typeof pv === 'number') {
          if (pv === maxSeen + 1) maxSeen = pv;
        }
      }
      const mustBe = maxSeen + 1;
      if (val !== mustBe) {
        setInvalidAt({ row, col });
        setValidation({ ok: false, reason: `You must go to ${mustBe} next` });
        return; // block extension
      }
    }

    const next = [...path, { row, col }];
    addToHistory(next);
    setPath(next);
  }, [addToHistory, grid, isDrawing, isInside, path, pathSet]);

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
    const p = getCellFromEvent(e.clientX, e.clientY);
    if (p) startPathAt(p.row, p.col);
  }, [getCellFromEvent, startPathAt]);

  const onPointerMove = useCallback((e) => {
    if (!isDrawing) return;
    const p = getCellFromEvent(e.clientX, e.clientY);
    if (p) extendPathTo(p.row, p.col);
  }, [extendPathTo, getCellFromEvent, isDrawing]);

  const onPointerUp = useCallback(() => {
    if (isDrawing) endPath();
  }, [endPath, isDrawing]);

  // Touch events mapping
  const onTouchStart = useCallback((e) => {
    const t = e.touches[0];
    if (!t) return;
    const p = getCellFromEvent(t.clientX, t.clientY);
    if (p) startPathAt(p.row, p.col);
  }, [getCellFromEvent, startPathAt]);

  const onTouchMove = useCallback((e) => {
    const t = e.touches[0];
    if (!t) return;
    const p = getCellFromEvent(t.clientX, t.clientY);
    if (p) extendPathTo(p.row, p.col);
  }, [extendPathTo, getCellFromEvent]);

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
    actions: {
      startPathAt,
      extendPathTo,
      endPath,
      undo,
      reset
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
