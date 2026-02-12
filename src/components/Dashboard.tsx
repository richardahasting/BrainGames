import { useState, useEffect } from 'react';
import { GameId, GAME_CONFIGS, UserData } from '../types/game';
import { loadUserData, getBrainSpeedScore } from '../utils/storageManager';
import { formatMinutes } from '../utils/statsCalculator';
import { isMuted, setMuted } from '../utils/audio';
import BoosterReminder from './BoosterReminder';
import ProgressTracker from './ProgressTracker';

interface Props {
  onSelectGame: (gameId: GameId) => void;
}

export default function Dashboard({ onSelectGame }: Props) {
  const [userData, setUserData] = useState<UserData>(loadUserData);
  const [muted, setMutedState] = useState(isMuted());
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    setUserData(loadUserData());
  }, []);

  const brainScore = getBrainSpeedScore(userData);
  const totalSessions = Object.values(userData.games).reduce((sum, g) => sum + g.sessionsCompleted, 0);
  const gameIds = Object.keys(GAME_CONFIGS) as GameId[];

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-navy-lighter">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">BrainGames</h1>
            <p className="text-muted text-sm mt-0.5">Speed-of-Processing Training</p>
          </div>
          <button
            onClick={toggleMute}
            className="text-muted hover:text-warm-white text-xl transition-colors p-2"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-navy-light rounded-xl p-4 text-center">
            <div className="text-3xl font-mono font-bold text-teal">{brainScore}</div>
            <div className="text-muted text-xs uppercase tracking-wider mt-1">Brain Speed</div>
          </div>
          <div className="bg-navy-light rounded-xl p-4 text-center">
            <div className="text-3xl font-mono font-bold text-amber">
              {userData.dailyStreak}
            </div>
            <div className="text-muted text-xs uppercase tracking-wider mt-1">Day Streak</div>
          </div>
          <div className="bg-navy-light rounded-xl p-4 text-center">
            <div className="text-3xl font-mono font-bold text-warm-white">{totalSessions}</div>
            <div className="text-muted text-xs uppercase tracking-wider mt-1">Sessions</div>
          </div>
          <div className="bg-navy-light rounded-xl p-4 text-center">
            <div className="text-3xl font-mono font-bold text-warm-white">
              {formatMinutes(userData.totalTrainingMinutes)}
            </div>
            <div className="text-muted text-xs uppercase tracking-wider mt-1">Total Time</div>
          </div>
        </div>

        {/* Weekly goal */}
        <div className="bg-navy-light rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">Weekly Goal: 3–4 sessions</span>
            <span className="text-sm font-mono text-teal">
              {Math.min(totalSessions, 4)}/4 this week
            </span>
          </div>
          <div className="w-full bg-navy-lighter rounded-full h-2">
            <div
              className="bg-teal h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (Math.min(totalSessions, 4) / 4) * 100)}%` }}
            />
          </div>
        </div>

        {/* Booster reminder */}
        <BoosterReminder userData={userData} />

        {/* Game grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Training Games</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameIds.map((id) => {
              const cfg = GAME_CONFIGS[id];
              const stats = userData.games[id];
              const borderColor = cfg.color === 'teal' ? 'hover:border-teal/40' : 'hover:border-amber/40';

              return (
                <button
                  key={id}
                  onClick={() => onSelectGame(id)}
                  className={`bg-navy-light rounded-xl p-5 text-left transition-all border border-transparent ${borderColor} hover:bg-navy-lighter group`}
                >
                  <div className="text-3xl mb-3">{cfg.icon}</div>
                  <h3 className="font-semibold text-base mb-1">{cfg.name}</h3>
                  <p className="text-muted text-sm leading-relaxed mb-3">{cfg.description}</p>
                  {stats.sessionsCompleted > 0 ? (
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span>
                        Level{' '}
                        <span className="text-teal font-mono">{stats.highestLevel}</span>
                      </span>
                      <span>·</span>
                      <span>{stats.sessionsCompleted} sessions</span>
                    </div>
                  ) : (
                    <span className="text-xs text-amber">New</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress toggle */}
        {totalSessions > 0 && (
          <div>
            <button
              onClick={() => setShowProgress(!showProgress)}
              className="text-sm text-muted hover:text-warm-white transition-colors"
            >
              {showProgress ? '▾ Hide Progress Details' : '▸ Show Progress Details'}
            </button>
            {showProgress && (
              <div className="mt-4">
                <ProgressTracker userData={userData} />
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <footer className="border-t border-navy-lighter pt-6 pb-8">
          <p className="text-muted/60 text-xs leading-relaxed max-w-2xl">
            BrainGames is inspired by the ACTIVE trial research (Alzheimer's &amp; Dementia:
            Translational Research &amp; Clinical Interventions, Feb 2026) which found that
            speed-of-processing training reduced dementia risk by 25% over 20 years. This application
            is not a medical device and is not a substitute for professional medical advice or the
            clinically validated BrainHQ platform used in the actual research trials.
          </p>
        </footer>
      </main>
    </div>
  );
}
