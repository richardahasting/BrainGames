import { useState, useCallback, useRef } from 'react';
import { GamePhase, GameState, TrialResult, GameConfig, DifficultyState } from '../types/game';
import { calculateSessionResult } from '../utils/statsCalculator';
import { recordSession } from '../utils/storageManager';
import { playCorrect, playWrong, playLevelUp } from '../utils/audio';

export function useGameState(config: GameConfig) {
  const [state, setState] = useState<GameState>({
    phase: 'instructions',
    trialIndex: 0,
    trials: [],
    isPractice: false,
    showingStimulus: false,
    awaitingResponse: false,
    feedbackType: null,
  });

  const sessionStart = useRef(Date.now());
  const trialStart = useRef(Date.now());
  const prevLevel = useRef(1);

  const startPractice = useCallback(() => {
    sessionStart.current = Date.now();
    setState({
      phase: 'practice',
      trialIndex: 0,
      trials: [],
      isPractice: true,
      showingStimulus: false,
      awaitingResponse: false,
      feedbackType: null,
    });
  }, []);

  const startPlaying = useCallback(() => {
    sessionStart.current = Date.now();
    setState({
      phase: 'playing',
      trialIndex: 0,
      trials: [],
      isPractice: false,
      showingStimulus: false,
      awaitingResponse: false,
      feedbackType: null,
    });
  }, []);

  const skipToPlay = useCallback(() => {
    startPlaying();
  }, [startPlaying]);

  const beginTrial = useCallback(() => {
    trialStart.current = Date.now();
    setState((prev) => ({ ...prev, showingStimulus: true, awaitingResponse: false, feedbackType: null }));
  }, []);

  const showResponse = useCallback(() => {
    setState((prev) => ({ ...prev, showingStimulus: false, awaitingResponse: true }));
  }, []);

  const recordTrial = useCallback(
    (correct: boolean, difficulty: DifficultyState) => {
      const reactionTimeMs = Date.now() - trialStart.current;
      const result: TrialResult = { correct, reactionTimeMs, difficulty, timestamp: Date.now() };

      if (correct) playCorrect();
      else playWrong();

      // Check for level up sound
      if (difficulty.level > prevLevel.current) {
        setTimeout(() => playLevelUp(), 200);
      }
      prevLevel.current = difficulty.level;

      setState((prev) => {
        const trials = prev.isPractice ? prev.trials : [...prev.trials, result];
        const maxTrials = prev.isPractice ? config.practiceTrialCount : config.trialCount;
        const nextIndex = prev.trialIndex + 1;
        const done = nextIndex >= maxTrials;

        if (done && prev.isPractice) {
          return { ...prev, phase: 'playing', trialIndex: 0, trials: [], isPractice: false, feedbackType: correct ? 'correct' : 'wrong', showingStimulus: false, awaitingResponse: false };
        }

        if (done && !prev.isPractice) {
          const durationSeconds = Math.round((Date.now() - sessionStart.current) / 1000);
          const sessionResult = calculateSessionResult(config.id, trials, durationSeconds);
          recordSession(sessionResult);
          return { ...prev, phase: 'results', trials, trialIndex: nextIndex, feedbackType: correct ? 'correct' : 'wrong', showingStimulus: false, awaitingResponse: false };
        }

        return {
          ...prev,
          trials,
          trialIndex: nextIndex,
          feedbackType: correct ? 'correct' : 'wrong',
          showingStimulus: false,
          awaitingResponse: false,
        };
      });
    },
    [config]
  );

  const restart = useCallback(() => {
    prevLevel.current = 1;
    setState({
      phase: 'instructions',
      trialIndex: 0,
      trials: [],
      isPractice: false,
      showingStimulus: false,
      awaitingResponse: false,
      feedbackType: null,
    });
  }, []);

  return {
    state,
    startPractice,
    startPlaying,
    skipToPlay,
    beginTrial,
    showResponse,
    recordTrial,
    restart,
  };
}
