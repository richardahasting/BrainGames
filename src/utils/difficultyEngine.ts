import { DifficultyState } from '../types/game';

export const DEFAULT_DIFFICULTY: DifficultyState = {
  level: 1,
  displayTimeMs: 500,
  distractorCount: 0,
  targetDistance: 0.3,
  similarityLevel: 0,
  consecutiveCorrect: 0,
  consecutiveWrong: 0,
};

/** After a correct answer: potentially increase difficulty */
export function onCorrect(state: DifficultyState): DifficultyState {
  const consCorrect = state.consecutiveCorrect + 1;
  if (consCorrect < 3) {
    return { ...state, consecutiveCorrect: consCorrect, consecutiveWrong: 0 };
  }

  // Level up
  const newLevel = Math.min(state.level + 1, 20);
  return {
    level: newLevel,
    displayTimeMs: Math.max(16, Math.round(state.displayTimeMs * 0.87)),
    distractorCount: Math.min(8, state.distractorCount + (newLevel % 2 === 0 ? 1 : 0)),
    targetDistance: Math.min(1, state.targetDistance + 0.05),
    similarityLevel: Math.min(1, state.similarityLevel + 0.05),
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
  };
}

/** After a wrong answer: potentially decrease difficulty */
export function onWrong(state: DifficultyState): DifficultyState {
  const consWrong = state.consecutiveWrong + 1;
  if (consWrong < 2) {
    return { ...state, consecutiveWrong: consWrong, consecutiveCorrect: 0 };
  }

  // Level down
  const newLevel = Math.max(1, state.level - 1);
  return {
    level: newLevel,
    displayTimeMs: Math.min(500, Math.round(state.displayTimeMs * 1.2)),
    distractorCount: Math.max(0, state.distractorCount - 1),
    targetDistance: Math.max(0.2, state.targetDistance - 0.05),
    similarityLevel: Math.max(0, state.similarityLevel - 0.05),
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
  };
}

/** Create initial difficulty for a specific starting level */
export function difficultyForLevel(level: number): DifficultyState {
  let state = { ...DEFAULT_DIFFICULTY };
  for (let i = 1; i < level; i++) {
    state = onCorrect({ ...state, consecutiveCorrect: 2 });
  }
  return state;
}
