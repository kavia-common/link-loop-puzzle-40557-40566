import React from 'react';
import { formatSeconds } from '../utils/gameUtils';

// PUBLIC_INTERFACE
export default function TopBar({
  seconds,
  onUndo,
  onReset,
  movesCount,
  showLeaderboard,
  onLeaderboardClick
}) {
  /** Displays timer, move counter, and actions */
  return (
    <div className="topbar">
      <div className="left">
        <span className="app-title">Link Loop</span>
      </div>
      <div className="center">
        <div className="timer" aria-live="polite">
          ⏱ {formatSeconds(seconds)}
        </div>
        <div className="moves">
          Moves: <strong>{movesCount}</strong>
        </div>
      </div>
      <div className="right">
        <button className="btn secondary" onClick={onUndo} aria-label="Undo last move">
          Undo
        </button>
        <button className="btn danger" onClick={onReset} aria-label="Reset path">
          Reset
        </button>
        {showLeaderboard && (
          <button className="btn" onClick={onLeaderboardClick} aria-label="Open leaderboard">
            Leaderboard
          </button>
        )}
      </div>
    </div>
  );
}
