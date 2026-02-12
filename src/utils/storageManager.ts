import { UserData, DEFAULT_USER_DATA, GameId, SessionResult, GameStats } from '../types/game';

const STORAGE_KEY = 'braingames_user_data';

export function loadUserData(): UserData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_USER_DATA, firstUseDate: today() };
    const data = JSON.parse(raw) as UserData;
    // Ensure all game keys exist (forward-compat if we add games)
    for (const id of Object.keys(DEFAULT_USER_DATA.games) as GameId[]) {
      if (!data.games[id]) {
        data.games[id] = { ...DEFAULT_USER_DATA.games[id] };
      }
    }
    return data;
  } catch {
    return { ...DEFAULT_USER_DATA, firstUseDate: today() };
  }
}

export function saveUserData(data: UserData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function recordSession(session: SessionResult): UserData {
  const data = loadUserData();
  const stats = data.games[session.gameId];

  stats.sessionsCompleted += 1;
  stats.totalTrials += session.trials.length;
  stats.highestLevel = Math.max(stats.highestLevel, session.finalLevel);

  // Score = inverse of average reaction time (lower ms = higher score)
  const score = Math.round(1000 - session.averageReactionMs);
  stats.bestScore = Math.max(stats.bestScore, score);
  stats.recentScores = [...stats.recentScores, score].slice(-20);
  stats.accuracyHistory = [...stats.accuracyHistory, session.accuracy].slice(-20);

  // Update streak
  const todayStr = today();
  if (data.lastPlayDate && data.lastPlayDate !== todayStr) {
    const lastDate = new Date(data.lastPlayDate);
    const todayDate = new Date(todayStr);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);
    data.dailyStreak = diffDays === 1 ? data.dailyStreak + 1 : 1;
  } else if (!data.lastPlayDate) {
    data.dailyStreak = 1;
  }

  data.lastPlayDate = todayStr;
  data.totalTrainingMinutes += Math.round(session.durationSeconds / 60);

  // Booster tracking
  const totalSessions = Object.values(data.games).reduce((sum, g) => sum + g.sessionsCompleted, 0);
  if (totalSessions >= 10 && !data.boosterStatus.initialComplete) {
    data.boosterStatus.initialComplete = true;
    // Set booster due dates from first use
    const first = new Date(data.firstUseDate);
    const b1 = new Date(first);
    b1.setMonth(b1.getMonth() + 11);
    data.boosterStatus.booster1DueDate = b1.toISOString().split('T')[0];
    const b2 = new Date(first);
    b2.setMonth(b2.getMonth() + 35);
    data.boosterStatus.booster2DueDate = b2.toISOString().split('T')[0];
  }
  data.boosterStatus.initialSessionCount = totalSessions;

  saveUserData(data);
  return data;
}

export function getBrainSpeedScore(data: UserData): number {
  const gameIds = Object.keys(data.games) as GameId[];
  const scores = gameIds
    .map((id) => {
      const recent = data.games[id].recentScores;
      if (recent.length === 0) return null;
      return recent.reduce((a, b) => a + b, 0) / recent.length;
    })
    .filter((s): s is number => s !== null);

  if (scores.length === 0) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.max(0, Math.min(100, Math.round(avg / 10)));
}

export function getWeeklySessionCount(data: UserData): number {
  // Approximate: count sessions completed this week based on last play date
  // For a more accurate count we'd need session timestamps, but this gives a baseline
  if (!data.lastPlayDate) return 0;
  const lastPlay = new Date(data.lastPlayDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - lastPlay.getTime()) / 86400000);
  if (diffDays > 7) return 0;
  // Return total sessions as rough proxy (localStorage doesn't track per-day granularity)
  return Math.min(
    Object.values(data.games).reduce((sum, g) => sum + g.sessionsCompleted, 0),
    7
  );
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function getGameStats(gameId: GameId): GameStats {
  return loadUserData().games[gameId];
}
