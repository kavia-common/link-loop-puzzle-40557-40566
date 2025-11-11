import React, { useMemo } from 'react';
import PathSVG from './PathSVG';

const Grid = ({
  grid,
  path,
  containerRef,
  handlers,
  invalidAt
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

  return (
    <div
      className={`grid-container`}
      ref={containerRef}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onTouchStart={handlers.onTouchStart}
      onTouchMove={handlers.onTouchMove}
      onTouchEnd={handlers.onTouchEnd}
      role="application"
      aria-label="Link Loop grid"
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
          return (
            <div
              key={`${r}-${c}`}
              className={`cell ${val ? 'has-number' : ''} ${isInvalid ? 'invalid' : ''}`}
            >
              {val ? <span className="digit">{val}</span> : null}
            </div>
          );
        })}
      </div>
      {/* Path overlay */}
      <div className="path-overlay" aria-hidden="true">
        <PathSVG path={path} cellSize={cellSize} size={size} padding={padding} />
      </div>
    </div>
  );
};

export default Grid;
