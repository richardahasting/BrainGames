import { useState, useEffect } from 'react';
import { GameId, GAME_CONFIGS, UserData } from '../types/game';
import { loadUserData, getBrainSpeedScore } from '../utils/storageManager';
import { formatMinutes } from '../utils/statsCalculator';
import { isMuted, setMuted } from '../utils/audio';
import { AuthHandle } from '../hooks/useAuth';
import BoosterReminder from './BoosterReminder';
import ProgressTracker from './ProgressTracker';
import AuthButton from './AuthButton';

interface Props {
  onSelectGame: (gameId: GameId) => void;
  auth: AuthHandle;
}

export default function Dashboard({ onSelectGame, auth }: Props) {
  const [userData, setUserData] = useState<UserData>(loadUserData);
  const [muted, setMutedState] = useState(isMuted());
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    setUserData(loadUserData());
  }, [auth.authState]);

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
          <div className="flex items-center gap-3">
            <AuthButton auth={auth} />
            <button
              onClick={toggleMute}
              className="text-muted hover:text-warm-white text-xl transition-colors p-2"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
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

        {/* Research summary */}
        <div className="border-t border-navy-lighter pt-6">
          <h2 className="text-lg font-semibold mb-4">The Science Behind BrainGames</h2>
          <div className="text-muted text-sm leading-relaxed space-y-3 max-w-3xl">
            <p>
              In February 2026, researchers published the longest follow-up of a cognitive training
              trial ever conducted. The NIH-funded ACTIVE study (Advanced Cognitive Training for
              Independent and Vital Elderly) enrolled nearly 3,000 adults ages 65 and older beginning
              in 1998 and tracked their outcomes for two full decades through Medicare claims data.
            </p>
            <p>
              Participants were randomly assigned to one of four groups: memory training, reasoning
              training, visual speed-of-processing training, or a no-training control. Each training
              group completed up to ten 60–75 minute sessions over five to six weeks. Half of each
              group also received booster sessions at 11 and 35 months after initial training.
            </p>
            <p>
              The results were striking. Of the three training types, only speed-of-processing
              training showed a significant protective effect — and only when combined with booster
              sessions. Participants who completed both the initial speed training and the booster
              sessions had a <span className="text-teal font-semibold">25% lower rate of dementia
              diagnosis</span> over 20 years compared to the control group. Memory training and
              reasoning training showed no measurable benefit.
            </p>
            <p>
              Speed-of-processing training works by challenging the brain to identify objects at the
              center of the screen while simultaneously detecting targets in the periphery, all under
              increasing time pressure. The difficulty adapts to each person's performance, pushing
              the threshold of how quickly the brain can accurately take in and respond to visual
              information. Researchers believe this engages automatic, unconscious processing rather
              than deliberate thinking, potentially strengthening neural pathways that degrade in
              early dementia.
            </p>
            <p>
              "It's really the first clear documentation in a randomized controlled trial that at
              least some form of cognitive training can lower dementia risk," noted Dr. Thomas
              Wisniewski of NYU Langone Health. NIH Director Jay Bhattacharya called it evidence
              that "simple brain training, done for just weeks, may help people stay mentally healthy
              for years longer."
            </p>
            <p>
              BrainGames implements this same adaptive speed-of-processing approach: short sessions,
              escalating difficulty, and a booster schedule modeled directly on the ACTIVE protocol.
            </p>
            <div className="flex flex-col gap-1 pt-2 text-xs">
              <span className="text-muted/60 uppercase tracking-wider font-semibold mb-1">Further Reading</span>
              <a href="https://www.nih.gov/news-events/news-releases/cognitive-speed-training-over-weeks-may-delay-diagnosis-dementia-over-decades" target="_blank" rel="noopener noreferrer" className="text-teal hover:text-teal-dim transition-colors">NIH: Cognitive Speed Training Over Weeks May Delay Dementia Over Decades</a>
              <a href="https://www.nbcnews.com/health/aging/brain-training-game-protect-dementia-research-decades-alzheimers-rcna257790" target="_blank" rel="noopener noreferrer" className="text-teal hover:text-teal-dim transition-colors">NBC News: Brain Training Game May Protect Against Dementia for 20 Years</a>
              <a href="https://www.hopkinsmedicine.org/news/newsroom/news-releases/2026/02/cognitive-speed-training-linked-to-lower-dementia-incidence-up-to-20-years-later" target="_blank" rel="noopener noreferrer" className="text-teal hover:text-teal-dim transition-colors">Johns Hopkins Medicine: Cognitive Speed Training Linked to Lower Dementia Incidence</a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <footer className="border-t border-navy-lighter pt-6 pb-8">
          <p className="text-muted/60 text-xs leading-relaxed max-w-2xl">
            BrainGames is not a medical device and is not a substitute for professional medical
            advice or the clinically validated BrainHQ platform used in the actual ACTIVE research
            trials.
          </p>
        </footer>
      </main>
    </div>
  );
}
