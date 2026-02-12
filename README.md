# BrainGames

Browser-based brain training game suite inspired by the ACTIVE trial research, which found that speed-of-processing training reduced dementia risk by 25% over 20 years.

## Games

- **Double Decision** — Identify center objects and peripheral targets (based directly on the ACTIVE trial)
- **Peripheral Pulse** — Expand useful field of view by tracking peripheral flashes
- **Flash Match** — Memorize briefly-shown card grids
- **Pattern Surge** — Spot targets in rapid-fire symbol sequences
- **Divided Focus** — Track moving targets while responding to center prompts

## Tech Stack

React + TypeScript + Vite + Tailwind CSS. No backend — all data stored in localStorage.

## Development

```bash
npm install
npm run dev       # Dev server on localhost:5173
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

## Disclaimer

This is not a medical device. Inspired by ACTIVE trial research but not a substitute for professional medical advice or the clinically validated BrainHQ platform.
