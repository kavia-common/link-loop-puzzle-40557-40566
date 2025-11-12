import React from 'react';
import ReactDOM from 'react-dom';
import { formatSeconds } from '../utils/gameUtils';

/**
 * Ensure there is a single overlay root in the document for portals.
 * This avoids nesting inside any stacking contexts from the app layout.
 */
function getOrCreateOverlayRoot() {
  const id = 'modal-root';
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
  }
  return el;
}

// PUBLIC_INTERFACE
export default function CompletionModal({ open, seconds, onClose, onPlayAgain, onSubmitScore, enableLeaderboard }) {
  /** Shown when puzzle is completed successfully, rendered via a portal above all content. */
  if (!open) return null;

  const modal = (
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

  // Render at document.body overlay root to avoid parent stacking contexts
  const overlayRoot = getOrCreateOverlayRoot();
  return ReactDOM.createPortal(modal, overlayRoot);
}
