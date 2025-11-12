import React, { useEffect, useMemo, useRef } from 'react';
import { buildSvgPathFromPoints, gridCoordToSvgPoint } from '../utils/gameUtils';

const PathSVG = ({ path, cellSize, padding = 0, size, color = 'var(--c-primary)' }) => {
  const pathRef = useRef(null);

  const points = useMemo(() => {
    return path.map(({ row, col }) => gridCoordToSvgPoint(row, col, cellSize, padding));
  }, [path, cellSize, padding]);

  const d = useMemo(() => buildSvgPathFromPoints(points), [points]);

  useEffect(() => {
    // Animate stroke-dashoffset to draw path
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    // allow layout then animate
    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 300ms ease';
      el.style.strokeDashoffset = '0';
    });
  }, [d]);

  const strokeWidth = Math.max(3, cellSize * 0.15);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${padding * 2 + size * cellSize} ${padding * 2 + size * cellSize}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Subtle shadow for path to improve visibility over light tiles */}
      <defs>
        <filter id="pathShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="rgba(0,0,0,0.18)" />
        </filter>
      </defs>
      <path
        ref={pathRef}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#pathShadow)"
      />
    </svg>
  );
};

export default PathSVG;
