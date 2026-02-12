import { useEffect, useRef, useState, useCallback } from 'react';
import { GAME_CONFIGS } from '../../types/game';
import { useAdaptiveDifficulty } from '../../hooks/useAdaptiveDifficulty';
import { useGameState } from '../../hooks/useGameState';
import GameShell from '../GameShell';

const config = GAME_CONFIGS['pattern-surge'];

const ALL_SYMBOLS = ['◆', '▲', '●', '■', '★', '⬡', '◇', '△', '○', '□', '⭐', '✦', '❖', '⬟', '♦', '♠'];

interface TrialSetup {
  target: string;
  sequence: string[];
  targetPresent: boolean;
  displayTimePerItem: number;
}

interface Props {
  onBack: () => void;
}

export default function PatternSurge({ onBack }: Props) {
  const { difficulty, recordCorrect, recordWrong, reset: resetDifficulty } = useAdaptiveDifficulty();
  const { state, startPractice, startPlaying, skipToPlay, beginTrial, showResponse, recordTrial, restart } = useGameState(config);

  const [trial, setTrial] = useState<TrialSetup | null>(null);
  const [step, setStep] = useState<'waiting' | 'showing-target' | 'sequence' | 'response'>('waiting');
  const [currentSeqIndex, setCurrentSeqIndex] = useState(-1);
  const timeoutRef = useRef<number | null>(null);

  const getSequenceLength = useCallback(() => {
    if (difficulty.level <= 2) return 3;
    if (difficulty.level <= 4) return 5;
    if (difficulty.level <= 7) return 8;
    return Math.min(12, 8 + Math.floor((difficulty.level - 7) / 2));
  }, [difficulty.level]);

  const setupTrial = useCallback(() => {
    const seqLen = getSequenceLength();
    const targetPresent = Math.random() < 0.6; // 60% chance target is present
    const target = ALL_SYMBOLS[Math.floor(Math.random() * 8)]; // Pick from first 8 for target

    // Build sequence
    const nonTargetSymbols = ALL_SYMBOLS.filter((s) => s !== target);
    const sequence: string[] = [];
    for (let i = 0; i < seqLen; i++) {
      sequence.push(nonTargetSymbols[Math.floor(Math.random() * nonTargetSymbols.length)]);
    }

    if (targetPresent) {
      const insertPos = Math.floor(Math.random() * seqLen);
      sequence[insertPos] = target;
    }

    const displayTimePerItem = Math.max(80, difficulty.displayTimeMs);

    setTrial({ target, sequence, targetPresent, displayTimePerItem });
    setCurrentSeqIndex(-1);
    setStep('waiting');
  }, [getSequenceLength, difficulty.displayTimeMs]);

  // Trial flow
  useEffect(() => {
    if ((state.phase === 'playing' || state.phase === 'practice') && step === 'waiting') {
      const delay = state.feedbackType ? 800 : 400;
      timeoutRef.current = window.setTimeout(() => {
        setupTrial();
        beginTrial();
        setStep('showing-target');
      }, delay);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [state.phase, state.trialIndex, step, setupTrial, beginTrial, state.feedbackType]);

  // Show target for 1 second, then start sequence
  useEffect(() => {
    if (step === 'showing-target') {
      timeoutRef.current = window.setTimeout(() => {
        setCurrentSeqIndex(0);
        setStep('sequence');
      }, 1000);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [step]);

  // Advance sequence
  useEffect(() => {
    if (step === 'sequence' && trial && currentSeqIndex >= 0) {
      if (currentSeqIndex >= trial.sequence.length) {
        showResponse();
        setStep('response');
        return;
      }
      timeoutRef.current = window.setTimeout(() => {
        setCurrentSeqIndex((i) => i + 1);
      }, trial.displayTimePerItem);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [step, currentSeqIndex, trial, showResponse]);

  const handleResponse = (sawIt: boolean) => {
    if (step !== 'response' || !trial) return;
    const correct = sawIt === trial.targetPresent;
    if (correct) recordCorrect();
    else recordWrong();
    recordTrial(correct, difficulty);
    setStep('waiting');
  };

  const handleRestart = () => {
    resetDifficulty();
    restart();
    setStep('waiting');
    setTrial(null);
  };

  const instructions = (
    <div className="space-y-4">
      <p>A target symbol is shown first. Then a rapid sequence of symbols flashes on screen.</p>
      <p>After the sequence, indicate whether the target appeared in it.</p>
      <ul className="list-disc list-inside text-muted space-y-1">
        <li>Sequences get longer as you improve (3 → 12 symbols)</li>
        <li>Display speed increases with each level</li>
        <li>Symbols become more visually similar at higher levels</li>
      </ul>
    </div>
  );

  return (
    <GameShell config={config} state={state} difficulty={difficulty}
      onStartPractice={startPractice} onSkipToPlay={skipToPlay}
      onRestart={handleRestart} onBackToDashboard={onBack} instructions={instructions}>
      <div className="flex flex-col items-center gap-8 select-none">
        {/* Target reference */}
        {trial && step !== 'waiting' && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-muted text-xs uppercase tracking-wider">Target</span>
            <div className="w-16 h-16 bg-amber/20 rounded-xl flex items-center justify-center text-4xl text-amber border border-amber/30">
              {trial.target}
            </div>
          </div>
        )}

        {/* Sequence display */}
        <div className="w-32 h-32 rounded-2xl bg-navy-lighter flex items-center justify-center">
          {step === 'showing-target' && trial && (
            <span className="text-5xl text-amber animate-pulse">{trial.target}</span>
          )}
          {step === 'sequence' && trial && currentSeqIndex < trial.sequence.length && (
            <span className="text-5xl text-warm-white">{trial.sequence[currentSeqIndex]}</span>
          )}
          {step === 'response' && (
            <span className="text-muted text-xl">?</span>
          )}
          {step === 'waiting' && (
            <span className="text-muted text-lg">...</span>
          )}
        </div>

        {/* Sequence progress indicator */}
        {step === 'sequence' && trial && (
          <div className="flex gap-1">
            {trial.sequence.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < currentSeqIndex ? 'bg-teal' : i === currentSeqIndex ? 'bg-amber' : 'bg-navy-lighter'
                }`}
              />
            ))}
          </div>
        )}

        {/* Response buttons */}
        {step === 'response' && (
          <div className="flex gap-4">
            <button
              onClick={() => handleResponse(true)}
              className="px-8 py-4 bg-teal/20 rounded-xl text-teal text-lg font-semibold hover:bg-teal/30 transition-colors border border-teal/30"
            >
              Yes, I saw it
            </button>
            <button
              onClick={() => handleResponse(false)}
              className="px-8 py-4 bg-navy-lighter rounded-xl text-warm-white text-lg font-semibold hover:bg-navy-light transition-colors border border-navy-lighter"
            >
              No, not there
            </button>
          </div>
        )}

        {step === 'showing-target' && (
          <p className="text-amber text-sm">Remember this symbol...</p>
        )}
        {step === 'sequence' && (
          <p className="text-muted text-sm">Watch carefully...</p>
        )}
      </div>
    </GameShell>
  );
}
