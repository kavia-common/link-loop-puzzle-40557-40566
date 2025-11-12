import React from 'react';
import { formatSeconds } from '../utils/gameUtils';

// PUBLIC_INTERFACE
export default function TopBar({
  seconds,
  onReset,
  movesCount,
  started,
  completed,
  onStart,
  onRestart
}) {
  /** Displays timer, move counter, and actions */
  return (
    <div className="topbar">
      <div className="left">
        <span className="app-title">Link Loop</span>
      </div>
      <div className="center">
        <div className="timer" aria-live="polite">
          ⏱ <strong>{formatSeconds(seconds)}</strong>
        </div>
        <div className="moves">
          Moves: <strong>{movesCount}</strong>
        </div>
      </div>
      <div className="right">
        {!started && !completed && (
          <button className="btn" onClick={onStart} aria-label="Start game">
            Start
          </button>
        )}
        {(started || completed) && (
          <>
            <button className="btn danger" onClick={onReset} aria-label="Reset to pre-game">
              Reset
            </button>
            <button className="btn" onClick={onRestart} aria-label="Restart game">
              Restart
            </button>
          </>
        )}
      </div>
    </div>
  );
}
