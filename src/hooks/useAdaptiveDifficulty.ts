import { useState, useCallback } from 'react';
import { DifficultyState } from '../types/game';
import { DEFAULT_DIFFICULTY, onCorrect, onWrong } from '../utils/difficultyEngine';

export function useAdaptiveDifficulty(initialLevel = 1) {
  const [difficulty, setDifficulty] = useState<DifficultyState>(() => {
    if (initialLevel <= 1) return { ...DEFAULT_DIFFICULTY };
    let state = { ...DEFAULT_DIFFICULTY };
    for (let i = 1; i < initialLevel; i++) {
      state = onCorrect({ ...state, consecutiveCorrect: 2 });
    }
    return state;
  });

  const [peakLevel, setPeakLevel] = useState(initialLevel);

  const recordCorrect = useCallback(() => {
    setDifficulty((prev) => {
      const next = onCorrect(prev);
      if (next.level > peakLevel) setPeakLevel(next.level);
      return next;
    });
  }, [peakLevel]);

  const recordWrong = useCallback(() => {
    setDifficulty((prev) => onWrong(prev));
  }, []);

  const reset = useCallback(() => {
    setDifficulty({ ...DEFAULT_DIFFICULTY });
    setPeakLevel(1);
  }, []);

  return { difficulty, peakLevel, recordCorrect, recordWrong, reset };
}
