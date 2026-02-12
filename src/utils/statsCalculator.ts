import { TrialResult, SessionResult, GameId } from '../types/game';

export function calculateSessionResult(
  gameId: GameId,
  trials: TrialResult[],
  durationSeconds: number
): SessionResult {
  const correctTrials = trials.filter((t) => t.correct);
  const accuracy = trials.length > 0 ? correctTrials.length / trials.length : 0;

  const reactionTimes = correctTrials.map((t) => t.reactionTimeMs).filter((t) => t > 0);
  const averageReactionMs =
    reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;
  const bestReactionMs =
    reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;

  const finalLevel = trials.length > 0 ? trials[trials.length - 1].difficulty.level : 1;

  return {
    gameId,
    date: new Date().toISOString().split('T')[0],
    trials,
    accuracy: Math.round(accuracy * 100),
    averageReactionMs,
    bestReactionMs,
    finalLevel,
    durationSeconds,
  };
}

export function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
