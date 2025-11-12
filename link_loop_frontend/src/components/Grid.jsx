import React, { useMemo } from 'react';
import PathSVG from './PathSVG';

const Grid = ({
  grid,
  path,
  containerRef,
  handlers,
  invalidAt,
  started = true
}) => {
  const size = grid.length;

  // Responsive cell size via CSS, but compute base for SVG viewBox
  const cellSize = 100; // arbitrary for viewBox; element scales via CSS
  const padding = 0;

  const numberedCells = useMemo(() => {
    const cells = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      const v = grid[r][c];
      if (v != null) cells.push({ r, c, v });
    }
    return cells;
  }, [grid, size]);

  // Only attach interaction handlers when started
  const interactiveProps = started
    ? {
        onPointerDown: handlers.onPointerDown,
        onPointerMove: handlers.onPointerMove,
        onPointerUp: handlers.onPointerUp,
        onTouchStart: handlers.onTouchStart,
        onTouchMove: handlers.onTouchMove,
        onTouchEnd: handlers.onTouchEnd,
        onTouchCancel: handlers.onTouchCancel,
        onPointerCancel: handlers.onPointerCancel,
        onPointerLeave: handlers.onPointerLeave
      }
    : {};

  return (
    <div
      className={`grid-container`}
      ref={containerRef}
      {...interactiveProps}
      role="application"
      aria-label="Link Loop grid"
      aria-disabled={!started}
      style={{
        // Block pointer events when not started; keep visuals visible
        pointerEvents: started ? 'auto' : 'none',
        opacity: started ? 1 : 0.6
      }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`
        }}
      >
        {Array.from({ length: size * size }, (_, i) => {
          const r = Math.floor(i / size);
          const c = i % size;
          const val = grid[r][c];
          const isInvalid = invalidAt && invalidAt.row === r && invalidAt.col === c;
          /* Possible future state hooks for selected/active cells; no logic change now */
          const classes = [
            'cell',
            val ? 'has-number' : '',
            isInvalid ? 'invalid' : ''
          ].filter(Boolean).join(' ');
          return (
            <div key={`${r}-${c}`} className={classes}>
              {val ? <span className="digit">{val}</span> : null}
            </div>
          );
        })}
      </div>
      {/* Path overlay remains visible to show any pre-existing path/history */}
      <div className="path-overlay" aria-hidden="true">
        <PathSVG path={path} cellSize={cellSize} size={size} padding={padding} />
      </div>
    </div>
  );
};

export default Grid;
