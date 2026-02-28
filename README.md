# BrainGames

Browser-based brain training game suite inspired by the ACTIVE trial research, which found that speed-of-processing training reduced dementia risk by 25% over 20 years.

**Live**: [braingames.hastingtx.org](https://braingames.hastingtx.org)

## Games

- **Double Decision** — Identify center objects and peripheral targets (based directly on the ACTIVE trial)
- **Peripheral Pulse** — Expand useful field of view by tracking peripheral flashes
- **Flash Match** — Memorize briefly-shown card grids
- **Pattern Surge** — Spot targets in rapid-fire symbol sequences
- **Divided Focus** — Track moving targets while responding to center prompts

## Features

- **Adaptive difficulty** — Games automatically adjust difficulty based on performance
- **Progress tracking** — Session history and performance trends stored per user
- **Dashboard** — Overview of all games with session stats and streaks
- **Passwordless auth** — Login via email link, no password required
- **Booster reminders** — Prompts to keep up with regular training sessions

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Auth | Passwordless email login |
| Storage | localStorage (client-side) + backend API for progress |
| Backend API | Proxied through hastingtx.org Flask app (`/api/braingames/`) |

## Development

```bash
npm install
npm run dev       # Dev server on localhost:5173
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

## Deployment

```bash
npm run build
# Copy dist/ to server — served as static files by Nginx
```

The backend API routes (`/api/braingames/`) are handled by the main `hastingtx/music` Flask application.

## Project Structure

```
BrainGames/
├── src/
│   ├── App.tsx                    # Root component and routing
│   ├── components/
│   │   ├── Dashboard.tsx          # Game selection and stats overview
│   │   ├── GameShell.tsx          # Wrapper for all games
│   │   ├── ProgressTracker.tsx    # Session history and trends
│   │   ├── AuthButton.tsx         # Passwordless login UI
│   │   ├── BoosterReminder.tsx    # Training reminder prompts
│   │   └── games/                 # Individual game components
│   ├── hooks/
│   │   ├── useAdaptiveDifficulty.ts  # Difficulty scaling logic
│   │   ├── useAuth.ts                # Auth state management
│   │   ├── useGameState.ts           # Per-game state
│   │   └── useSessionTracking.ts     # Session recording
│   ├── types/                     # TypeScript type definitions
│   └── utils/                     # Shared utilities
├── dist/                          # Production build output
├── index.html
├── package.json
└── vite.config.ts
```

## Disclaimer

This is not a medical device. Inspired by ACTIVE trial research but not a substitute for professional medical advice or the clinically validated BrainHQ platform.
