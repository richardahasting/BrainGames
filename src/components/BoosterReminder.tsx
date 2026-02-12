import { UserData } from '../types/game';

interface Props {
  userData: UserData;
}

export default function BoosterReminder({ userData }: Props) {
  const { boosterStatus, firstUseDate } = userData;
  const today = new Date().toISOString().split('T')[0];
  const totalSessions = Object.values(userData.games).reduce((sum, g) => sum + g.sessionsCompleted, 0);

  // Initial training phase
  if (!boosterStatus.initialComplete) {
    const remaining = 10 - totalSessions;
    if (remaining > 0) {
      return (
        <div className="bg-teal/10 border border-teal/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">🧠</span>
            <div>
              <h3 className="font-semibold text-teal text-sm">Initial Training</h3>
              <p className="text-muted text-sm mt-1">
                Complete {remaining} more session{remaining !== 1 ? 's' : ''} to finish your initial training block.
                The ACTIVE study used 10 sessions over 5–6 weeks.
              </p>
              <div className="mt-2 w-full bg-navy-lighter rounded-full h-2">
                <div
                  className="bg-teal h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (totalSessions / 10) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Booster 1 check
  if (boosterStatus.booster1DueDate && !boosterStatus.booster1Complete) {
    if (today >= boosterStatus.booster1DueDate) {
      return (
        <div className="bg-amber/10 border border-amber/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="font-semibold text-amber text-sm">Booster Session Due!</h3>
              <p className="text-muted text-sm mt-1">
                It's been ~11 months since you started. Complete 4 booster sessions
                to maintain your cognitive gains. Participants who skipped boosters saw no benefit.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // Booster 2 check
  if (boosterStatus.booster2DueDate && !boosterStatus.booster2Complete && boosterStatus.booster1Complete) {
    if (today >= boosterStatus.booster2DueDate) {
      return (
        <div className="bg-amber/10 border border-amber/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="font-semibold text-amber text-sm">Booster 2 Due!</h3>
              <p className="text-muted text-sm mt-1">
                Time for your second booster block (~35 months). Complete 4 sessions
                to reinforce long-term benefits.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // All done or not yet due
  if (boosterStatus.initialComplete) {
    return (
      <div className="bg-navy-lighter/50 border border-navy-lighter rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">✓</span>
          <div>
            <h3 className="font-semibold text-teal text-sm">On Track</h3>
            <p className="text-muted text-sm mt-1">
              Initial training complete. Keep training 3–4 times per week for best results.
              {boosterStatus.booster1DueDate && !boosterStatus.booster1Complete && (
                <> Next booster due: {new Date(boosterStatus.booster1DueDate).toLocaleDateString()}</>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
