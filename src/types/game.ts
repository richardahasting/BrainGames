export type GameId = 'double-decision' | 'peripheral-pulse' | 'flash-match' | 'pattern-surge' | 'divided-focus';

export interface GameConfig {
  id: GameId;
  name: string;
  description: string;
  icon: string;
  color: string;
  trialCount: number;
  practiceTrialCount: number;
}

export interface DifficultyState {
  level: number;
  displayTimeMs: number;
  distractorCount: number;
  targetDistance: number;
  similarityLevel: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
}

export interface TrialResult {
  correct: boolean;
  reactionTimeMs: number;
  difficulty: DifficultyState;
  timestamp: number;
}

export interface SessionResult {
  gameId: GameId;
  date: string;
  trials: TrialResult[];
  accuracy: number;
  averageReactionMs: number;
  bestReactionMs: number;
  finalLevel: number;
  durationSeconds: number;
}

export interface GameStats {
  sessionsCompleted: number;
  bestScore: number;
  recentScores: number[];
  highestLevel: number;
  totalTrials: number;
  accuracyHistory: number[];
}

export interface BoosterStatus {
  initialComplete: boolean;
  initialSessionCount: number;
  booster1Complete: boolean;
  booster2Complete: boolean;
  booster1DueDate: string | null;
  booster2DueDate: string | null;
}

export interface UserData {
  firstUseDate: string;
  totalTrainingMinutes: number;
  dailyStreak: number;
  lastPlayDate: string;
  games: Record<GameId, GameStats>;
  boosterStatus: BoosterStatus;
}

export type GamePhase = 'instructions' | 'practice' | 'playing' | 'results';

export interface GameState {
  phase: GamePhase;
  trialIndex: number;
  trials: TrialResult[];
  isPractice: boolean;
  showingStimulus: boolean;
  awaitingResponse: boolean;
  feedbackType: 'correct' | 'wrong' | null;
}

export const GAME_CONFIGS: Record<GameId, GameConfig> = {
  'double-decision': {
    id: 'double-decision',
    name: 'Double Decision',
    description: 'Identify center objects and peripheral targets under time pressure',
    icon: '⚡',
    color: 'teal',
    trialCount: 25,
    practiceTrialCount: 4,
  },
  'peripheral-pulse': {
    id: 'peripheral-pulse',
    name: 'Peripheral Pulse',
    description: 'Expand your useful field of view by tracking peripheral flashes',
    icon: '◎',
    color: 'amber',
    trialCount: 25,
    practiceTrialCount: 4,
  },
  'flash-match': {
    id: 'flash-match',
    name: 'Flash Match',
    description: 'Memorize briefly-shown card grids and find the matching card',
    icon: '⬡',
    color: 'teal',
    trialCount: 20,
    practiceTrialCount: 3,
  },
  'pattern-surge': {
    id: 'pattern-surge',
    name: 'Pattern Surge',
    description: 'Spot target symbols in rapid-fire sequences',
    icon: '△',
    color: 'amber',
    trialCount: 25,
    practiceTrialCount: 4,
  },
  'divided-focus': {
    id: 'divided-focus',
    name: 'Divided Focus',
    description: 'Track moving targets while responding to center-screen prompts',
    icon: '◈',
    color: 'teal',
    trialCount: 15,
    practiceTrialCount: 3,
  },
};

export const DEFAULT_GAME_STATS: GameStats = {
  sessionsCompleted: 0,
  bestScore: 0,
  recentScores: [],
  highestLevel: 1,
  totalTrials: 0,
  accuracyHistory: [],
};

export const DEFAULT_USER_DATA: UserData = {
  firstUseDate: new Date().toISOString().split('T')[0],
  totalTrainingMinutes: 0,
  dailyStreak: 0,
  lastPlayDate: '',
  games: {
    'double-decision': { ...DEFAULT_GAME_STATS },
    'peripheral-pulse': { ...DEFAULT_GAME_STATS },
    'flash-match': { ...DEFAULT_GAME_STATS },
    'pattern-surge': { ...DEFAULT_GAME_STATS },
    'divided-focus': { ...DEFAULT_GAME_STATS },
  },
  boosterStatus: {
    initialComplete: false,
    initialSessionCount: 0,
    booster1Complete: false,
    booster2Complete: false,
    booster1DueDate: null,
    booster2DueDate: null,
  },
};
