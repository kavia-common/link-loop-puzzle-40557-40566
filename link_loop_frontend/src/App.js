import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { applyThemeToDocument } from './theme';
import { useGameState } from './hooks/useGameState';
import { useTimer } from './hooks/useTimer';
import Grid from './components/Grid';
import TopBar from './components/TopBar';
import CompletionModal from './components/CompletionModal';
import { formatSeconds } from './utils/gameUtils';
import { getBestTimeMs, setBestTimeMs } from './utils/bestTime';

// PUBLIC_INTERFACE
function App() {
  /** Main Link Loop application component. Renders the grid, top bar, and completion modal. */
  useEffect(() => {
    applyThemeToDocument();
  }, []);

  const [size] = useState(5); // can be configurable in future
  // Use an initial seed, but the hook randomizes on Start/Restart for variety
  const game = useGameState({ size, seed: 1337 });
  const { seconds, pause, resume, reset: resetTimer } = useTimer(false);

  // Track best time and previous best for completion modal
  const [bestTimeMs, setBestMsState] = useState(() => getBestTimeMs());
  const [prevBestMs, setPrevBestMs] = useState(() => getBestTimeMs());
  const [currentMs, setCurrentMs] = useState(null);
  const [isNewBest, setIsNewBest] = useState(false);

  // Pause timer when game completes and compute/update best time state
  useEffect(() => {
    if (game.completed) {
      pause();

      // Derive the current run time in ms
      const nowMs = Math.max(0, Math.round(seconds * 1000));
      setCurrentMs(nowMs);

      // Read previous best BEFORE any updates
      const stored = getBestTimeMs();
      setPrevBestMs(stored);

      // Compare and update flags/state, writing to storage only after prev is captured
      if (stored == null || nowMs < stored) {
        setIsNewBest(true);
        // Persist new best, but keep prevBestMs as the old value in state
        setBestTimeMs(nowMs);
        setBestMsState(nowMs);
      } else {
        setIsNewBest(false);
        // Keep best state as stored value for display/reference
        setBestMsState(stored);
      }
    } else {
      // clear "new best" flag when leaving completion state
      setIsNewBest(false);
      setCurrentMs(null);
    }
  }, [game.completed, pause, seconds]);

  // Reset button should fully reset to pre-game state, not auto-start
  const onReset = () => {
    // Return to pre-game state while keeping the grid visible and non-interactive
    game.actions.resetAll();
    pause();
    resetTimer();
    // Do not touch best/prevBest here
  };

  const onStart = () => {
    game.actions.startGame();
    resetTimer();
    resume();
  };

  const onRestart = () => {
    game.actions.restartGame();
    resetTimer();
    resume();
  };

  const onPlayAgain = () => {
    onRestart();
  };

  const onCloseModal = () => {
    // Close should perform full reset and not auto-start
    game.actions.resetAll();
    pause();
    resetTimer();
    // Do not alter prev/best on close
  };

  const movesCount = useMemo(() => Math.max(0, game.history.length - 1), [game.history.length]);

  return (
    <div className="App app-shell">
      <TopBar
        seconds={seconds}
        onReset={onReset}
        movesCount={movesCount}
        started={game.started}
        completed={game.completed}
        onStart={onStart}
        onRestart={onRestart}
      />
      <main className="main">
        <section className="board-card" aria-describedby="rules">
          <Grid
            grid={game.grid}
            path={game.path}
            containerRef={game.containerRef}
            handlers={game.handlers}
            invalidAt={game.invalidAt}
            started={game.started}
          />
          <div className="rules" id="rules">
            <p>Connect numbers in ascending order with one continuous path that visits every cell exactly once. Vertical, horizontal, and mixed turns are all valid.</p>
            {!game.completed && game.validation.reason && game.started && (
              <p className="validation">{game.validation.reason}</p>
            )}
            {game.completed && (
              <p className="success">Completed in {formatSeconds(seconds)}.</p>
            )}
          </div>
        </section>
      </main>
      <CompletionModal
        open={game.completed}
        // Provide both the current run time and the previous best (old value)
        currentTimeMs={currentMs}
        prevBestOldMs={prevBestMs}
        isNewBest={isNewBest}
        onClose={onCloseModal}
        onPlayAgain={onPlayAgain}
      />
    </div>
  );
}

export default App;
