import { ReactNode } from 'react';
import { GameConfig, GameState, DifficultyState, TrialResult } from '../types/game';
import { formatMs } from '../utils/statsCalculator';

interface Props {
  config: GameConfig;
  state: GameState;
  difficulty: DifficultyState;
  onStartPractice: () => void;
  onSkipToPlay: () => void;
  onRestart: () => void;
  onBackToDashboard: () => void;
  instructions: ReactNode;
  children: ReactNode;
}

export default function GameShell({
  config,
  state,
  difficulty,
  onStartPractice,
  onSkipToPlay,
  onRestart,
  onBackToDashboard,
  instructions,
  children,
}: Props) {
  if (state.phase === 'instructions') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-xl w-full">
          <button
            onClick={onBackToDashboard}
            className="text-muted hover:text-warm-white mb-8 flex items-center gap-2 text-sm transition-colors"
          >
            ← Back to Dashboard
          </button>
          <div className="text-5xl mb-4">{config.icon}</div>
          <h1 className="text-3xl font-semibold mb-2">{config.name}</h1>
          <p className="text-muted text-lg mb-8">{config.description}</p>
          <div className="bg-navy-light rounded-xl p-6 mb-8 text-base leading-relaxed">
            {instructions}
          </div>
          <div className="flex gap-4">
            <button
              onClick={onStartPractice}
              className="px-6 py-3 bg-navy-lighter rounded-lg text-warm-white hover:bg-navy-light transition-colors text-base"
            >
              Practice First
            </button>
            <button
              onClick={onSkipToPlay}
              className="px-6 py-3 bg-teal rounded-lg text-navy font-semibold hover:bg-teal-dim transition-colors text-base"
            >
              Start Training
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.phase === 'results') {
    return <ResultsScreen state={state} config={config} onRestart={onRestart} onBackToDashboard={onBackToDashboard} />;
  }

  // Playing or Practice phase
  const maxTrials = state.isPractice ? config.practiceTrialCount : config.trialCount;
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-navy-light/50 border-b border-navy-lighter">
        <button
          onClick={onBackToDashboard}
          className="text-muted hover:text-warm-white text-sm transition-colors"
        >
          ✕ Quit
        </button>
        <div className="flex items-center gap-6 text-sm">
          {state.isPractice && (
            <span className="text-amber font-medium">Practice</span>
          )}
          <span className="text-muted">
            Trial{' '}
            <span className="text-warm-white font-mono">
              {state.trialIndex + 1}/{maxTrials}
            </span>
          </span>
          <span className="text-muted">
            Level{' '}
            <span className="text-teal font-mono">{difficulty.level}</span>
          </span>
          <span className="text-muted">
            Speed{' '}
            <span className="text-amber font-mono">{difficulty.displayTimeMs}ms</span>
          </span>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center relative">
        {state.feedbackType && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-medium z-50 transition-opacity ${
              state.feedbackType === 'correct'
                ? 'bg-correct/20 text-correct'
                : 'bg-wrong/20 text-wrong'
            }`}
          >
            {state.feedbackType === 'correct' ? '✓ Correct' : '✗ Incorrect'}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function ResultsScreen({
  state,
  config,
  onRestart,
  onBackToDashboard,
}: {
  state: GameState;
  config: GameConfig;
  onRestart: () => void;
  onBackToDashboard: () => void;
}) {
  const trials = state.trials;
  const correct = trials.filter((t: TrialResult) => t.correct).length;
  const accuracy = trials.length > 0 ? Math.round((correct / trials.length) * 100) : 0;
  const reactionTimes = trials.filter((t: TrialResult) => t.correct).map((t: TrialResult) => t.reactionTimeMs);
  const avgReaction = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a: number, b: number) => a + b, 0) / reactionTimes.length)
    : 0;
  const bestReaction = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;
  const finalLevel = trials.length > 0 ? trials[trials.length - 1].difficulty.level : 1;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-5xl mb-4">{config.icon}</div>
        <h2 className="text-2xl font-semibold mb-1">Session Complete</h2>
        <p className="text-muted mb-8">{config.name}</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard label="Accuracy" value={`${accuracy}%`} color="teal" />
          <StatCard label="Final Level" value={String(finalLevel)} color="amber" />
          <StatCard label="Avg Speed" value={formatMs(avgReaction)} color="teal" />
          <StatCard label="Best Speed" value={formatMs(bestReaction)} color="amber" />
          <StatCard label="Correct" value={`${correct}/${trials.length}`} color="teal" />
        </div>

        <div className="flex gap-4">
          <button
            onClick={onRestart}
            className="flex-1 px-6 py-3 bg-teal rounded-lg text-navy font-semibold hover:bg-teal-dim transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onBackToDashboard}
            className="flex-1 px-6 py-3 bg-navy-lighter rounded-lg text-warm-white hover:bg-navy-light transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClass = color === 'teal' ? 'text-teal' : 'text-amber';
  return (
    <div className="bg-navy-light rounded-xl p-4">
      <div className="text-muted text-xs uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-mono text-2xl font-semibold ${colorClass}`}>{value}</div>
    </div>
  );
}
