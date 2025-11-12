import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { applyThemeToDocument } from './theme';
import { useGameState } from './hooks/useGameState';
import { useTimer } from './hooks/useTimer';
import Grid from './components/Grid';
import TopBar from './components/TopBar';
import CompletionModal from './components/CompletionModal';
import { formatSeconds } from './utils/gameUtils';
import { leaderboardEnabled, submitScore } from './services/leaderboard';

// PUBLIC_INTERFACE
function App() {
  /** Main Link Loop application component. Renders the grid, top bar, and completion modal. */
  useEffect(() => {
    applyThemeToDocument();
  }, []);

  const [size] = useState(5); // can be configurable in future
  // Use an initial seed, but the hook randomizes on Start/Restart for variety
  const game = useGameState({ size, seed: 1337 });
  const { seconds, pause, resume, reset: resetTimer, running } = useTimer(false);

  // Start/pause timer depending on state transitions
  useEffect(() => {
    if (game.completed) {
      pause();
    }
  }, [game.completed, pause]);

  const onUndo = () => {
    game.actions.undo();
  };

  const onReset = () => {
    game.actions.reset();
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const enableLeaderboard = leaderboardEnabled();

  const onSubmitScore = async () => {
    if (!enableLeaderboard || isSubmitting) return;
    const name = window.prompt('Enter your name for the leaderboard:') || '';
    if (!name.trim()) return;
    try {
      setIsSubmitting(true);
      await submitScore({ name: name.trim(), seconds: Math.floor(seconds) });
      alert('Score submitted!');
    } catch (e) {
      console.error(e);
      alert('Unable to submit score.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const movesCount = useMemo(() => Math.max(0, game.history.length - 1), [game.history.length]);

  return (
    <div className="App app-shell">
      <TopBar
        seconds={seconds}
        onUndo={onUndo}
        onReset={onReset}
        movesCount={movesCount}
        showLeaderboard={enableLeaderboard}
        onLeaderboardClick={() => window.alert('Leaderboard UI not implemented; backend integration is optional.')}
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
          />
          <div className="rules" id="rules">
            <p>Connect numbers in ascending order with one continuous path that visits every cell exactly once. Vertical, horizontal, and mixed turns are all valid.</p>
            {!game.completed && game.validation.reason && (
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
        seconds={seconds}
        onClose={() => {}}
        onPlayAgain={onPlayAgain}
        onSubmitScore={onSubmitScore}
        enableLeaderboard={enableLeaderboard}
      />
    </div>
  );
}

export default App;
