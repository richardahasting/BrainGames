import { useEffect, useRef, useState, useCallback } from 'react';
import { GAME_CONFIGS } from '../../types/game';
import { useAdaptiveDifficulty } from '../../hooks/useAdaptiveDifficulty';
import { useGameState } from '../../hooks/useGameState';
import GameShell from '../GameShell';

const config = GAME_CONFIGS['divided-focus'];

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isTarget: boolean;
}

interface CenterPrompt {
  symbol: string;
  timestamp: number;
}

interface Props {
  onBack: () => void;
}

const ARENA_W = 560;
const ARENA_H = 400;
const BALL_R = 16;

export default function DividedFocus({ onBack }: Props) {
  const { difficulty, recordCorrect, recordWrong, reset: resetDifficulty } = useAdaptiveDifficulty();
  const { state, startPractice, startPlaying, skipToPlay, beginTrial, showResponse, recordTrial, restart } = useGameState(config);

  const [step, setStep] = useState<'waiting' | 'highlight' | 'tracking' | 'selecting'>('waiting');
  const [balls, setBalls] = useState<Ball[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [targetCount, setTargetCount] = useState(2);
  const [centerPrompt, setCenterPrompt] = useState<CenterPrompt | null>(null);
  const [centerHits, setCenterHits] = useState(0);
  const [centerMisses, setCenterMisses] = useState(0);
  const animRef = useRef<number | null>(null);
  const ballsRef = useRef<Ball[]>([]);
  const timeoutRef = useRef<number | null>(null);
  const promptIntervalRef = useRef<number | null>(null);

  const getTotalBalls = useCallback(() => {
    if (difficulty.level <= 2) return 6;
    if (difficulty.level <= 5) return 8;
    if (difficulty.level <= 8) return 12;
    return 16;
  }, [difficulty.level]);

  const getTargetCount = useCallback(() => {
    if (difficulty.level <= 3) return 2;
    if (difficulty.level <= 6) return 3;
    if (difficulty.level <= 9) return 4;
    return 5;
  }, [difficulty.level]);

  const getSpeed = useCallback(() => {
    return 0.8 + difficulty.level * 0.15;
  }, [difficulty.level]);

  const setupTrial = useCallback(() => {
    const total = getTotalBalls();
    const targets = getTargetCount();
    setTargetCount(targets);

    const newBalls: Ball[] = [];
    const speed = getSpeed();
    for (let i = 0; i < total; i++) {
      const angle = Math.random() * Math.PI * 2;
      newBalls.push({
        id: i,
        x: 60 + Math.random() * (ARENA_W - 120),
        y: 60 + Math.random() * (ARENA_H - 120),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        isTarget: i < targets,
      });
    }
    setBalls(newBalls);
    ballsRef.current = newBalls;
    setSelectedIds(new Set());
    setCenterHits(0);
    setCenterMisses(0);
    setCenterPrompt(null);
    setStep('waiting');
  }, [getTotalBalls, getTargetCount, getSpeed]);

  // Trial flow
  useEffect(() => {
    if ((state.phase === 'playing' || state.phase === 'practice') && step === 'waiting') {
      const delay = state.feedbackType ? 800 : 400;
      timeoutRef.current = window.setTimeout(() => {
        setupTrial();
        beginTrial();
        setStep('highlight');
      }, delay);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [state.phase, state.trialIndex, step, setupTrial, beginTrial, state.feedbackType]);

  // Highlight phase: show targets for 2 seconds, then start tracking
  useEffect(() => {
    if (step === 'highlight') {
      timeoutRef.current = window.setTimeout(() => {
        setStep('tracking');
      }, 2000);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [step]);

  // Tracking phase: animate balls, end after duration
  useEffect(() => {
    if (step !== 'tracking') return;

    const trackDuration = 5000 + difficulty.level * 500; // 5-15 seconds

    // Animation loop
    const animate = () => {
      ballsRef.current = ballsRef.current.map((b) => {
        let { x, y, vx, vy } = b;
        x += vx;
        y += vy;
        if (x < BALL_R || x > ARENA_W - BALL_R) vx = -vx;
        if (y < BALL_R || y > ARENA_H - BALL_R) vy = -vy;
        x = Math.max(BALL_R, Math.min(ARENA_W - BALL_R, x));
        y = Math.max(BALL_R, Math.min(ARENA_H - BALL_R, y));
        return { ...b, x, y, vx, vy };
      });
      setBalls([...ballsRef.current]);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    // Center prompts
    const promptInterval = Math.max(1500, 3000 - difficulty.level * 150);
    promptIntervalRef.current = window.setInterval(() => {
      setCenterPrompt({ symbol: '⚡', timestamp: Date.now() });
      // Auto-expire after 1s
      setTimeout(() => {
        setCenterPrompt((p) => {
          if (p && Date.now() - p.timestamp > 900) {
            setCenterMisses((m) => m + 1);
            return null;
          }
          return p;
        });
      }, 1000);
    }, promptInterval);

    // End tracking
    timeoutRef.current = window.setTimeout(() => {
      showResponse();
      setStep('selecting');
    }, trackDuration);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (promptIntervalRef.current) clearInterval(promptIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [step, difficulty.level, showResponse]);

  const handleCenterClick = () => {
    if (centerPrompt) {
      setCenterHits((h) => h + 1);
      setCenterPrompt(null);
    }
  };

  const handleBallClick = (id: number) => {
    if (step !== 'selecting') return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < targetCount) next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (step !== 'selecting') return;
    const targetIds = new Set(balls.filter((b) => b.isTarget).map((b) => b.id));
    let correctCount = 0;
    selectedIds.forEach((id) => { if (targetIds.has(id)) correctCount++; });
    const correct = correctCount === targetCount && selectedIds.size === targetCount;
    if (correct) recordCorrect();
    else recordWrong();
    recordTrial(correct, difficulty);
    setStep('waiting');
  };

  const handleRestart = () => {
    resetDifficulty();
    restart();
    setStep('waiting');
    setBalls([]);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (promptIntervalRef.current) clearInterval(promptIntervalRef.current);
  };

  const instructions = (
    <div className="space-y-4">
      <p>Several dots move around the screen. Some are highlighted as targets at the start.</p>
      <p>Track the targets as all dots become identical and move around. When they stop, click the original targets.</p>
      <ul className="list-disc list-inside text-muted space-y-1">
        <li>Click the ⚡ in the center when it appears (divided attention!)</li>
        <li>More dots and targets at higher levels</li>
        <li>Movement speed increases as you improve</li>
      </ul>
    </div>
  );

  return (
    <GameShell config={config} state={state} difficulty={difficulty}
      onStartPractice={startPractice} onSkipToPlay={skipToPlay}
      onRestart={handleRestart} onBackToDashboard={onBack} instructions={instructions}>
      <div className="flex flex-col items-center gap-4 select-none">
        {/* Arena */}
        <div
          className="relative bg-navy-light rounded-2xl border border-navy-lighter overflow-hidden"
          style={{ width: ARENA_W, height: ARENA_H }}
        >
          {/* Center prompt */}
          {step === 'tracking' && (
            <button
              onClick={handleCenterClick}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={{ opacity: centerPrompt ? 1 : 0.15 }}
            >
              {centerPrompt ? (
                <span className="text-amber text-2xl animate-pulse">{centerPrompt.symbol}</span>
              ) : (
                <span className="text-muted text-xl">+</span>
              )}
            </button>
          )}

          {/* Balls */}
          {balls.map((ball) => {
            const isHighlighted = step === 'highlight' && ball.isTarget;
            const isSelecting = step === 'selecting';
            const isSelected = selectedIds.has(ball.id);

            return (
              <button
                key={ball.id}
                onClick={() => handleBallClick(ball.id)}
                disabled={step !== 'selecting'}
                className={`absolute rounded-full transition-colors ${
                  isHighlighted
                    ? 'bg-teal ring-2 ring-teal/50'
                    : isSelected
                    ? 'bg-amber ring-2 ring-amber/50'
                    : isSelecting
                    ? 'bg-muted hover:bg-warm-white cursor-pointer'
                    : 'bg-muted/80'
                }`}
                style={{
                  width: BALL_R * 2,
                  height: BALL_R * 2,
                  left: ball.x - BALL_R,
                  top: ball.y - BALL_R,
                }}
              />
            );
          })}
        </div>

        {/* Status */}
        {step === 'highlight' && (
          <p className="text-teal text-sm font-medium">Remember the highlighted targets!</p>
        )}
        {step === 'tracking' && (
          <div className="flex items-center gap-6 text-sm">
            <span className="text-muted">Track the targets...</span>
            <span className="text-teal">⚡ hits: {centerHits}</span>
          </div>
        )}
        {step === 'selecting' && (
          <div className="flex items-center gap-4">
            <p className="text-muted text-sm">
              Select {targetCount} targets ({selectedIds.size}/{targetCount})
            </p>
            <button
              onClick={handleSubmit}
              disabled={selectedIds.size !== targetCount}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                selectedIds.size === targetCount
                  ? 'bg-teal text-navy hover:bg-teal-dim'
                  : 'bg-navy-lighter text-muted cursor-not-allowed'
              }`}
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
