import React from 'react';
import ReactDOM from 'react-dom';
import { formatSecondsMs } from '../utils/gameUtils';

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
export default function CompletionModal({ open, currentTimeMs, prevBestOldMs, isNewBest, onClose, onPlayAgain }) {
  /** Shown when puzzle is completed successfully, rendered via a portal above all content. */
  if (!open) return null;

  // Guard and format values consistently
  const currentLabel = (typeof currentTimeMs === 'number' && currentTimeMs >= 0)
    ? formatSecondsMs(currentTimeMs / 1000)
    : '—';

  const previousLabel = (typeof prevBestOldMs === 'number' && prevBestOldMs > 0)
    ? formatSecondsMs(prevBestOldMs / 1000)
    : '—';

  const modal = (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Puzzle completed">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Congratulations!</h2>
        </div>
        <div className="modal-body">
          <p>You completed the Link Loop.</p>

          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Current Time</span>
              <strong>{currentLabel}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--c-muted)' }}>
              <span>Previous Best</span>
              <strong>{previousLabel}</strong>
            </div>
          </div>

          {isNewBest && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                background: 'linear-gradient(90deg, rgba(245,158,11,0.12), rgba(37,99,235,0.08))',
                border: '1px solid var(--c-grid)',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 700,
                color: 'var(--c-secondary)'
              }}
              aria-live="polite"
            >
              🏅 New best time unlocked!
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onPlayAgain}>Play Again</button>
          <button className="btn danger" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );

  // Render at document.body overlay root to avoid parent stacking contexts
  const overlayRoot = getOrCreateOverlayRoot();
  return ReactDOM.createPortal(modal, overlayRoot);
}
