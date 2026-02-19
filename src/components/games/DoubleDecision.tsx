import { useEffect, useRef, useState, useCallback } from 'react';
import { GAME_CONFIGS } from '../../types/game';
import { useAdaptiveDifficulty } from '../../hooks/useAdaptiveDifficulty';
import { useGameState } from '../../hooks/useGameState';
import GameShell from '../GameShell';

const config = GAME_CONFIGS['double-decision'];

// Visual stimuli: shapes drawn on canvas for crisp rendering at any size
const SHAPES = [
  { name: 'car', draw: drawCar },
  { name: 'truck', draw: drawTruck },
  { name: 'bus', draw: drawBus },
  { name: 'van', draw: drawVan },
];

const PERIPHERAL_TARGET = '★';
const DISTRACTOR_SYMBOLS = ['◆', '●', '▲', '■', '✦', '✧', '⬟', '⬠'];

// 8 radial positions (clock face)
function getRadialPositions(distance: number, centerX: number, centerY: number, count: number) {
  const positions: { x: number; y: number; angle: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    positions.push({
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
      angle,
    });
  }
  return positions;
}

interface TrialSetup {
  referenceIndices: [number, number];
  correctCenterIndex: number;
  peripheralSlot: number;
  distractorSlots: number[];
}

interface Props {
  onBack: () => void;
}

export default function DoubleDecision({ onBack }: Props) {
  const { difficulty, peakLevel, recordCorrect, recordWrong, reset: resetDifficulty } = useAdaptiveDifficulty();
  const {
    state,
    startPractice,
    startPlaying,
    skipToPlay,
    beginTrial,
    showResponse,
    recordTrial,
    restart,
  } = useGameState(config);

  const [trial, setTrial] = useState<TrialSetup | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<number | null>(null);
  const [selectedPeripheral, setSelectedPeripheral] = useState<number | null>(null);
  const [step, setStep] = useState<'waiting' | 'ready' | 'stimulus' | 'center-response' | 'peripheral-response'>('waiting');
  const timeoutRef = useRef<number | null>(null);

  const setupTrial = useCallback(() => {
    const totalSlots = 8;
    // Pick 2 reference shapes (the "which one did you see?" pair)
    const allIndices = SHAPES.map((_, i) => i);
    const shuffled = [...allIndices].sort(() => Math.random() - 0.5);
    const referenceIndices: [number, number] = [shuffled[0], shuffled[1]];
    const correctCenterIndex = Math.random() < 0.5 ? 0 : 1;

    // Pick peripheral target slot
    const peripheralSlot = Math.floor(Math.random() * totalSlots);

    // Pick distractor slots (not the target slot)
    const availableSlots = Array.from({ length: totalSlots }, (_, i) => i).filter((i) => i !== peripheralSlot);
    const distractorCount = Math.min(difficulty.distractorCount, availableSlots.length);
    const distractorSlots = [...availableSlots].sort(() => Math.random() - 0.5).slice(0, distractorCount);

    setTrial({ referenceIndices, correctCenterIndex, peripheralSlot, distractorSlots });
    setSelectedCenter(null);
    setSelectedPeripheral(null);
    setStep('waiting');
  }, [difficulty.distractorCount]);

  // After a trial completes, show the "+" ready button (brief delay to let feedback render)
  useEffect(() => {
    if ((state.phase === 'playing' || state.phase === 'practice') && step === 'waiting') {
      const delay = state.feedbackType ? 600 : 0;
      timeoutRef.current = window.setTimeout(() => {
        setStep('ready');
      }, delay);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state.phase, state.trialIndex, step, state.feedbackType]);

  // Called when player clicks "+" to start the next trial
  const handleReady = useCallback(() => {
    setupTrial();
    beginTrial();
    setStep('stimulus');
  }, [setupTrial, beginTrial]);

  // Hide stimulus after display time
  useEffect(() => {
    if (step === 'stimulus') {
      timeoutRef.current = window.setTimeout(() => {
        showResponse();
        // At level 1-2, skip peripheral (center only)
        setStep(difficulty.level <= 1 ? 'center-response' : 'center-response');
      }, difficulty.displayTimeMs);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [step, difficulty.displayTimeMs, difficulty.level, showResponse]);

  const handleCenterChoice = (choiceIndex: number) => {
    if (step !== 'center-response' || !trial) return;
    setSelectedCenter(choiceIndex);
    const centerCorrect = choiceIndex === trial.correctCenterIndex;

    if (difficulty.level <= 1) {
      // Level 1: center only, no peripheral
      if (centerCorrect) recordCorrect();
      else recordWrong();
      recordTrial(centerCorrect, difficulty);
      setStep('waiting');
    } else {
      // Need peripheral response too
      setStep(centerCorrect ? 'peripheral-response' : 'peripheral-response');
    }
  };

  const handlePeripheralChoice = (slot: number) => {
    if (step !== 'peripheral-response' || !trial) return;
    setSelectedPeripheral(slot);
    const centerCorrect = selectedCenter === trial.correctCenterIndex;
    const peripheralCorrect = slot === trial.peripheralSlot;
    const bothCorrect = centerCorrect && peripheralCorrect;

    if (bothCorrect) recordCorrect();
    else recordWrong();
    recordTrial(bothCorrect, difficulty);
    setStep('waiting');
  };

  const handleRestart = () => {
    resetDifficulty();
    restart();
    setStep('waiting');
    setTrial(null);
  };

  const gameInstructions = (
    <div className="space-y-4">
      <p>Two reference shapes are shown at the top. A brief flash will display:</p>
      <ul className="list-disc list-inside space-y-1 text-muted">
        <li>One of the two shapes at screen center</li>
        <li>A star (★) somewhere in the periphery</li>
      </ul>
      <p>After the flash, identify:</p>
      <ol className="list-decimal list-inside space-y-1 text-muted">
        <li>Which center shape was shown</li>
        <li>Where the peripheral star appeared</li>
      </ol>
      <p className="text-amber text-sm">
        Display time adapts to your performance — it gets faster as you improve!
      </p>
    </div>
  );

  return (
    <GameShell
      config={config}
      state={state}
      difficulty={difficulty}
      onStartPractice={startPractice}
      onSkipToPlay={skipToPlay}
      onRestart={handleRestart}
      onBackToDashboard={onBack}
      instructions={gameInstructions}
    >
      <GameArea
        trial={trial}
        step={step}
        difficulty={difficulty}
        selectedCenter={selectedCenter}
        selectedPeripheral={selectedPeripheral}
        onCenterChoice={handleCenterChoice}
        onPeripheralChoice={handlePeripheralChoice}
        onReady={handleReady}
      />
    </GameShell>
  );
}

function GameArea({
  trial,
  step,
  difficulty,
  selectedCenter,
  selectedPeripheral,
  onCenterChoice,
  onPeripheralChoice,
  onReady,
}: {
  trial: TrialSetup | null;
  step: string;
  difficulty: { level: number; distractorCount: number; targetDistance: number; displayTimeMs: number };
  selectedCenter: number | null;
  selectedPeripheral: number | null;
  onCenterChoice: (i: number) => void;
  onPeripheralChoice: (slot: number) => void;
  onReady: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (step === 'ready') {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onReady}
          className="w-20 h-20 rounded-xl flex items-center justify-center bg-navy-lighter hover:bg-navy-light hover:ring-2 hover:ring-teal cursor-pointer transition-all"
          title="Click to begin next trial"
        >
          <span className="text-teal text-4xl font-light">+</span>
        </button>
        <p className="text-muted text-sm">Click + when ready</p>
      </div>
    );
  }

  if (!trial) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-muted text-lg">Get ready...</div>
      </div>
    );
  }

  const showStimulus = step === 'stimulus';
  const showCenterResponse = step === 'center-response';
  const showPeripheralResponse = step === 'peripheral-response';

  // Calculate peripheral positions
  const radius = 120 + difficulty.targetDistance * 140; // 120px to 260px from center
  const positions = getRadialPositions(radius, 0, 0, 8);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-8 select-none">
      {/* Reference shapes (always visible during gameplay) */}
      {(showCenterResponse || showPeripheralResponse) && (
        <div className="flex gap-8">
          <p className="text-muted text-sm absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
            Which shape was shown?
          </p>
          {trial.referenceIndices.map((shapeIdx, i) => (
            <button
              key={i}
              onClick={() => onCenterChoice(i)}
              disabled={!showCenterResponse}
              className={`w-24 h-24 rounded-xl flex items-center justify-center transition-all ${
                showCenterResponse
                  ? 'bg-navy-lighter hover:bg-navy-light hover:ring-2 hover:ring-teal cursor-pointer'
                  : selectedCenter === i
                  ? 'bg-teal/20 ring-2 ring-teal'
                  : 'bg-navy-lighter opacity-50'
              }`}
            >
              <ShapeRenderer shapeIndex={shapeIdx} size={56} />
            </button>
          ))}
        </div>
      )}

      {/* Central stimulus area + peripheral ring */}
      <div className="relative" style={{ width: radius * 2 + 80, height: radius * 2 + 80 }}>
        {/* Center stimulus or fixation */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center rounded-xl"
        >
          {showStimulus ? (
            <ShapeRenderer shapeIndex={trial.referenceIndices[trial.correctCenterIndex]} size={64} />
          ) : (
            <span className="text-muted text-2xl">+</span>
          )}
        </div>

        {/* Peripheral positions */}
        {positions.map((pos, slot) => {
          const isTarget = slot === trial.peripheralSlot;
          const isDistractor = trial.distractorSlots.includes(slot);
          const showThis = showStimulus && (isTarget || isDistractor) && difficulty.level > 1;
          const isClickable = showPeripheralResponse;

          return (
            <button
              key={slot}
              onClick={() => onPeripheralChoice(slot)}
              disabled={!isClickable}
              className={`absolute w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all -translate-x-1/2 -translate-y-1/2 ${
                isClickable
                  ? 'bg-navy-lighter hover:bg-navy-light hover:ring-2 hover:ring-amber cursor-pointer'
                  : showThis
                  ? 'bg-navy-lighter'
                  : selectedPeripheral === slot
                  ? 'bg-amber/20 ring-2 ring-amber'
                  : 'bg-navy-light/30'
              }`}
              style={{
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y}px)`,
              }}
            >
              {showThis && isTarget && <span className="text-amber text-xl">{PERIPHERAL_TARGET}</span>}
              {showThis && isDistractor && (
                <span className="text-muted text-lg">
                  {DISTRACTOR_SYMBOLS[slot % DISTRACTOR_SYMBOLS.length]}
                </span>
              )}
              {isClickable && <span className="text-muted/50 text-xs">{slot + 1}</span>}
            </button>
          );
        })}
      </div>

      {/* Response prompt */}
      {showPeripheralResponse && (
        <p className="text-muted text-sm animate-pulse">Click where the star (★) appeared</p>
      )}
    </div>
  );
}

// Simple SVG shape renderer
function ShapeRenderer({ shapeIndex, size }: { shapeIndex: number; size: number }) {
  const shape = SHAPES[shapeIndex % SHAPES.length];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      {shape.draw()}
    </svg>
  );
}

// Vehicle-like shapes (simple geometric representations)
function drawCar() {
  return (
    <g>
      <rect x="8" y="24" width="48" height="20" rx="4" fill="#16c79a" />
      <rect x="16" y="14" width="28" height="14" rx="3" fill="#0f8c6d" />
      <circle cx="18" cy="46" r="5" fill="#1a1a2e" />
      <circle cx="46" cy="46" r="5" fill="#1a1a2e" />
      <rect x="18" y="18" width="10" height="8" rx="1" fill="#1a1a2e" opacity="0.4" />
      <rect x="32" y="18" width="10" height="8" rx="1" fill="#1a1a2e" opacity="0.4" />
    </g>
  );
}

function drawTruck() {
  return (
    <g>
      <rect x="4" y="18" width="36" height="26" rx="3" fill="#f59e0b" />
      <rect x="40" y="24" width="20" height="20" rx="3" fill="#d97706" />
      <rect x="44" y="28" width="12" height="10" rx="1" fill="#1a1a2e" opacity="0.4" />
      <circle cx="16" cy="46" r="5" fill="#1a1a2e" />
      <circle cx="50" cy="46" r="5" fill="#1a1a2e" />
    </g>
  );
}

function drawBus() {
  return (
    <g>
      <rect x="6" y="14" width="52" height="30" rx="4" fill="#ef4444" />
      <rect x="10" y="18" width="8" height="10" rx="1" fill="#fafaf9" opacity="0.7" />
      <rect x="22" y="18" width="8" height="10" rx="1" fill="#fafaf9" opacity="0.7" />
      <rect x="34" y="18" width="8" height="10" rx="1" fill="#fafaf9" opacity="0.7" />
      <rect x="46" y="18" width="8" height="10" rx="1" fill="#fafaf9" opacity="0.7" />
      <circle cx="16" cy="46" r="5" fill="#1a1a2e" />
      <circle cx="48" cy="46" r="5" fill="#1a1a2e" />
    </g>
  );
}

function drawVan() {
  return (
    <g>
      <rect x="8" y="20" width="48" height="24" rx="4" fill="#8b5cf6" />
      <path d="M8 28 Q8 16 24 16 L40 16 Q48 16 48 20 L48 28 Z" fill="#7c3aed" />
      <rect x="12" y="18" width="12" height="8" rx="2" fill="#1a1a2e" opacity="0.4" />
      <rect x="30" y="18" width="14" height="8" rx="2" fill="#1a1a2e" opacity="0.4" />
      <circle cx="18" cy="46" r="5" fill="#1a1a2e" />
      <circle cx="46" cy="46" r="5" fill="#1a1a2e" />
    </g>
  );
}
