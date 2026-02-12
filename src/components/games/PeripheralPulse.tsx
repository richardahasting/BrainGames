import { useEffect, useRef, useState, useCallback } from 'react';
import { GAME_CONFIGS } from '../../types/game';
import { useAdaptiveDifficulty } from '../../hooks/useAdaptiveDifficulty';
import { useGameState } from '../../hooks/useGameState';
import GameShell from '../GameShell';

const config = GAME_CONFIGS['peripheral-pulse'];
const DIRECTIONS = 8;
const COLORS = ['#16c79a', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#ec4899'];

interface TrialSetup {
  targetSlot: number;
  targetColor: string;
  distractorSlots: number[];
  requireColorId: boolean;
}

interface Props {
  onBack: () => void;
}

export default function PeripheralPulse({ onBack }: Props) {
  const { difficulty, recordCorrect, recordWrong, reset: resetDifficulty } = useAdaptiveDifficulty();
  const { state, startPractice, startPlaying, skipToPlay, beginTrial, showResponse, recordTrial, restart } = useGameState(config);

  const [trial, setTrial] = useState<TrialSetup | null>(null);
  const [step, setStep] = useState<'waiting' | 'fixation' | 'stimulus' | 'response' | 'color-response'>('waiting');
  const [fixationClicked, setFixationClicked] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const setupTrial = useCallback(() => {
    const targetSlot = Math.floor(Math.random() * DIRECTIONS);
    const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const availableSlots = Array.from({ length: DIRECTIONS }, (_, i) => i).filter((i) => i !== targetSlot);
    const distractorCount = Math.min(difficulty.distractorCount, availableSlots.length);
    const distractorSlots = [...availableSlots].sort(() => Math.random() - 0.5).slice(0, distractorCount);
    const requireColorId = difficulty.level >= 5;

    setTrial({ targetSlot, targetColor, distractorSlots, requireColorId });
    setFixationClicked(false);
    setStep('waiting');
  }, [difficulty.distractorCount, difficulty.level]);

  // Trial flow
  useEffect(() => {
    if ((state.phase === 'playing' || state.phase === 'practice') && step === 'waiting') {
      const delay = state.feedbackType ? 800 : 400;
      timeoutRef.current = window.setTimeout(() => {
        setupTrial();
        setStep('fixation');
      }, delay);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [state.phase, state.trialIndex, step, setupTrial, state.feedbackType]);

  // After fixation click, show stimulus
  useEffect(() => {
    if (step === 'fixation' && fixationClicked) {
      beginTrial();
      setStep('stimulus');
    }
  }, [step, fixationClicked, beginTrial]);

  // Hide stimulus after display time
  useEffect(() => {
    if (step === 'stimulus') {
      timeoutRef.current = window.setTimeout(() => {
        showResponse();
        setStep('response');
      }, difficulty.displayTimeMs);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [step, difficulty.displayTimeMs, showResponse]);

  const handleSlotClick = (slot: number) => {
    if (step !== 'response' || !trial) return;
    const correct = slot === trial.targetSlot;
    if (trial.requireColorId) {
      // Need color ID too — for now just check location
    }
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

  const radius = 100 + difficulty.targetDistance * 160;
  const positions = Array.from({ length: DIRECTIONS }, (_, i) => {
    const angle = (i / DIRECTIONS) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });

  const instructions = (
    <div className="space-y-4">
      <p>Focus on the center crosshair. Click it when prompted to prove fixation.</p>
      <p>A colored dot will flash briefly in the periphery. Click where it appeared.</p>
      <ul className="list-disc list-inside text-muted space-y-1">
        <li>Dots start near center and move outward as you improve</li>
        <li>Flash duration decreases with each level</li>
        <li>Distractor flashes will appear at higher levels</li>
      </ul>
      <p className="text-amber text-sm">This trains your Useful Field of View (UFOV)!</p>
    </div>
  );

  return (
    <GameShell config={config} state={state} difficulty={difficulty}
      onStartPractice={startPractice} onSkipToPlay={skipToPlay}
      onRestart={handleRestart} onBackToDashboard={onBack} instructions={instructions}>
      <div className="flex flex-col items-center gap-4 select-none">
        <div className="relative" style={{ width: radius * 2 + 80, height: radius * 2 + 80 }}>
          {/* Center fixation target */}
          <button
            onClick={() => { if (step === 'fixation') setFixationClicked(true); }}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              step === 'fixation'
                ? 'bg-amber/20 ring-2 ring-amber cursor-pointer animate-pulse'
                : 'bg-navy-lighter'
            }`}
          >
            <span className="text-muted text-2xl">+</span>
          </button>

          {/* Peripheral slots */}
          {positions.map((pos, slot) => {
            const isTarget = trial?.targetSlot === slot;
            const isDistractor = trial?.distractorSlots.includes(slot) ?? false;
            const showDot = step === 'stimulus' && (isTarget || isDistractor);
            const isClickable = step === 'response';

            return (
              <button
                key={slot}
                onClick={() => handleSlotClick(slot)}
                disabled={!isClickable}
                className={`absolute w-12 h-12 rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all ${
                  isClickable
                    ? 'bg-navy-lighter hover:bg-navy-light hover:ring-2 hover:ring-teal cursor-pointer'
                    : showDot
                    ? ''
                    : 'bg-navy-light/20'
                }`}
                style={{ left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)` }}
              >
                {showDot && isTarget && (
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: trial!.targetColor }} />
                )}
                {showDot && isDistractor && (
                  <div className="w-6 h-6 rounded-full bg-muted/40" />
                )}
                {isClickable && !showDot && <span className="text-muted/30 text-xs">{slot + 1}</span>}
              </button>
            );
          })}
        </div>
        {step === 'fixation' && !fixationClicked && (
          <p className="text-amber text-sm animate-pulse">Click the center + to begin</p>
        )}
        {step === 'response' && (
          <p className="text-muted text-sm">Click where the dot appeared</p>
        )}
      </div>
    </GameShell>
  );
}
