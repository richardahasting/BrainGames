import { useEffect, useRef, useState, useCallback } from 'react';
import { GAME_CONFIGS } from '../../types/game';
import { useAdaptiveDifficulty } from '../../hooks/useAdaptiveDifficulty';
import { useGameState } from '../../hooks/useGameState';
import GameShell from '../GameShell';

const config = GAME_CONFIGS['flash-match'];

const SYMBOLS = ['♠', '♥', '♦', '♣', '★', '◆', '▲', '●', '■', '⬟', '☀', '♪', '⚡', '✿', '❖', '⬡',
  '◇', '△', '○', '□', '⭐', '♫', '⚙', '✦', '❤'];

interface TrialSetup {
  gridSize: number;
  cards: string[];
  targetIndex: number;
  targetSymbol: string;
}

interface Props {
  onBack: () => void;
}

export default function FlashMatch({ onBack }: Props) {
  const { difficulty, recordCorrect, recordWrong, reset: resetDifficulty } = useAdaptiveDifficulty();
  const { state, startPractice, startPlaying, skipToPlay, beginTrial, showResponse, recordTrial, restart } = useGameState(config);

  const [trial, setTrial] = useState<TrialSetup | null>(null);
  const [step, setStep] = useState<'waiting' | 'showing' | 'hidden' | 'response'>('waiting');
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const getGridSize = useCallback(() => {
    if (difficulty.level <= 3) return 3;
    if (difficulty.level <= 7) return 4;
    return 5;
  }, [difficulty.level]);

  const setupTrial = useCallback(() => {
    const gridSize = getGridSize();
    const totalCards = gridSize * gridSize;
    const shuffled = [...SYMBOLS].sort(() => Math.random() - 0.5).slice(0, totalCards);
    const targetIndex = Math.floor(Math.random() * totalCards);
    setTrial({ gridSize, cards: shuffled, targetIndex, targetSymbol: shuffled[targetIndex] });
    setCardsRevealed(false);
    setStep('waiting');
  }, [getGridSize]);

  // Trial flow
  useEffect(() => {
    if ((state.phase === 'playing' || state.phase === 'practice') && step === 'waiting') {
      const delay = state.feedbackType ? 800 : 400;
      timeoutRef.current = window.setTimeout(() => {
        setupTrial();
        beginTrial();
        setCardsRevealed(true);
        setStep('showing');
      }, delay);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [state.phase, state.trialIndex, step, setupTrial, beginTrial, state.feedbackType]);

  // Hide cards after display time
  useEffect(() => {
    if (step === 'showing') {
      timeoutRef.current = window.setTimeout(() => {
        setCardsRevealed(false);
        showResponse();
        setStep('response');
      }, difficulty.displayTimeMs + 200); // Slightly longer for grid scanning
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [step, difficulty.displayTimeMs, showResponse]);

  const handleCardClick = (index: number) => {
    if (step !== 'response' || !trial) return;
    const correct = index === trial.targetIndex;
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
      <p>A grid of cards will briefly flash face-up showing different symbols.</p>
      <p>After the grid flips face-down, find the card matching the target symbol shown above.</p>
      <ul className="list-disc list-inside text-muted space-y-1">
        <li>Grid grows from 3×3 to 5×5 as you improve</li>
        <li>Flash duration decreases with each level</li>
        <li>Symbols become more similar at higher levels</li>
      </ul>
    </div>
  );

  const gridSize = trial?.gridSize ?? 3;
  const cardSize = gridSize <= 3 ? 'w-20 h-20 text-3xl' : gridSize <= 4 ? 'w-16 h-16 text-2xl' : 'w-14 h-14 text-xl';

  return (
    <GameShell config={config} state={state} difficulty={difficulty}
      onStartPractice={startPractice} onSkipToPlay={skipToPlay}
      onRestart={handleRestart} onBackToDashboard={onBack} instructions={instructions}>
      <div className="flex flex-col items-center gap-6 select-none">
        {/* Target symbol */}
        {(step === 'response' || step === 'hidden') && trial && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-muted text-sm">Find this symbol:</span>
            <div className="w-16 h-16 bg-amber/20 rounded-xl flex items-center justify-center text-3xl text-amber border-2 border-amber/40">
              {trial.targetSymbol}
            </div>
          </div>
        )}

        {/* Card grid */}
        {trial && (
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
          >
            {trial.cards.map((symbol, i) => (
              <button
                key={i}
                onClick={() => handleCardClick(i)}
                disabled={step !== 'response'}
                className={`${cardSize} rounded-lg flex items-center justify-center transition-all ${
                  cardsRevealed
                    ? 'bg-navy-lighter text-warm-white'
                    : step === 'response'
                    ? 'bg-navy-lighter hover:bg-navy-light hover:ring-2 hover:ring-teal cursor-pointer text-navy-lighter'
                    : 'bg-navy-light/50 text-navy-light/50'
                }`}
              >
                {cardsRevealed ? symbol : step === 'response' ? '?' : ''}
              </button>
            ))}
          </div>
        )}

        {step === 'showing' && (
          <p className="text-amber text-sm animate-pulse">Memorize the positions!</p>
        )}
        {step === 'response' && (
          <p className="text-muted text-sm">Click the card that matches the target</p>
        )}
        {step === 'waiting' && !trial && (
          <div className="text-muted text-lg">Get ready...</div>
        )}
      </div>
    </GameShell>
  );
}
