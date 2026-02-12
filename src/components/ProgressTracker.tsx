import { UserData, GameId, GAME_CONFIGS } from '../types/game';

interface Props {
  userData: UserData;
}

export default function ProgressTracker({ userData }: Props) {
  const gameIds = Object.keys(GAME_CONFIGS) as GameId[];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Progress by Game</h2>
      <div className="space-y-3">
        {gameIds.map((id) => {
          const stats = userData.games[id];
          const config = GAME_CONFIGS[id];
          if (stats.sessionsCompleted === 0) return null;

          const recentAccuracy =
            stats.accuracyHistory.length > 0
              ? Math.round(
                  stats.accuracyHistory.reduce((a, b) => a + b, 0) / stats.accuracyHistory.length
                )
              : 0;

          return (
            <div key={id} className="bg-navy-light rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-sm font-medium">{config.name}</span>
                </div>
                <span className="text-muted text-xs">{stats.sessionsCompleted} sessions</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-teal font-mono text-sm font-semibold">Lv {stats.highestLevel}</div>
                  <div className="text-muted text-xs">Peak Level</div>
                </div>
                <div>
                  <div className="text-amber font-mono text-sm font-semibold">{recentAccuracy}%</div>
                  <div className="text-muted text-xs">Avg Accuracy</div>
                </div>
                <div>
                  <div className="text-warm-white font-mono text-sm font-semibold">{stats.totalTrials}</div>
                  <div className="text-muted text-xs">Total Trials</div>
                </div>
              </div>
              {/* Mini sparkline of recent accuracy */}
              {stats.accuracyHistory.length > 1 && (
                <div className="flex items-end gap-0.5 mt-3 h-8">
                  {stats.accuracyHistory.map((acc, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-teal/30 rounded-sm min-w-[3px]"
                      style={{ height: `${Math.max(10, acc)}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
