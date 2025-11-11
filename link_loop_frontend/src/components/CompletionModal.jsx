import React from 'react';
import { formatSeconds } from '../utils/gameUtils';

// PUBLIC_INTERFACE
export default function CompletionModal({ open, seconds, onClose, onPlayAgain, onSubmitScore, enableLeaderboard }) {
  /** Shown when puzzle is completed successfully */
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Puzzle completed">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Congratulations!</h2>
        </div>
        <div className="modal-body">
          <p>You completed the Link Loop.</p>
          <p>Time: <strong>{formatSeconds(seconds)}</strong></p>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onPlayAgain}>Play Again</button>
          {enableLeaderboard && (
            <button className="btn secondary" onClick={onSubmitScore}>Submit Score</button>
          )}
          <button className="btn danger" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
