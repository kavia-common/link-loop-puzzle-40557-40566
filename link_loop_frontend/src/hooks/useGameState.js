import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateGrid, validatePath } from '../utils/gameUtils';

/**
 * Hook encapsulating the Link Loop game state and interactions.
 */
export function useGameState({ size = 5, seed = 42 } = {}) {
  const [grid, setGrid] = useState(() => generateGrid(size, seed));
  const [path, setPath] = useState([]); // [{row, col}]
  const [history, setHistory] = useState([]); // stack of path snapshots
  const [isDrawing, setIsDrawing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [validation, setValidation] = useState({ ok: false, reason: '' });

  const gridSize = grid.length;

  const isInside = useCallback((row, col) => {
    return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
  }, [gridSize]);

  const cellKey = (row, col) => `${row},${col}`;

  const pathSet = useMemo(() => new Set(path.map(p => cellKey(p.row, p.col))), [path]);

  const addToHistory = useCallback((p) => {
    setHistory((prev) => [...prev, p]);
  }, []);

  const startPathAt = useCallback((row, col) => {
    if (!isInside(row, col)) return;
    const next = [{ row, col }];
    addToHistory(next);
    setPath(next);
    setIsDrawing(true);
  }, [isInside, addToHistory]);

  const extendPathTo = useCallback((row, col) => {
    if (!isInside(row, col)) return;
    if (!isDrawing) return;
    const last = path[path.length - 1];
    if (last && (last.row === row && last.col === col)) return;
    const dr = Math.abs(last.row - row);
    const dc = Math.abs(last.col - col);
    if (dr + dc !== 1) return; // only cardinal moves
    if (pathSet.has(cellKey(row, col))) return; // no revisits
    const next = [...path, { row, col }];
    addToHistory(next);
    setPath(next);
  }, [isInside, isDrawing, path, pathSet, addToHistory]);

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
    const cellSize = rect.width / gridSize;
    const row = Math.floor(y / cellSize);
    const col = Math.floor(x / cellSize);
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
