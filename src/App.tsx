import { useState } from 'react';
import { GameId } from './types/game';
import Dashboard from './components/Dashboard';
import DoubleDecision from './components/games/DoubleDecision';
import PeripheralPulse from './components/games/PeripheralPulse';
import FlashMatch from './components/games/FlashMatch';
import PatternSurge from './components/games/PatternSurge';
import DividedFocus from './components/games/DividedFocus';

function App() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  const handleBack = () => setActiveGame(null);

  if (activeGame === 'double-decision') return <DoubleDecision onBack={handleBack} />;
  if (activeGame === 'peripheral-pulse') return <PeripheralPulse onBack={handleBack} />;
  if (activeGame === 'flash-match') return <FlashMatch onBack={handleBack} />;
  if (activeGame === 'pattern-surge') return <PatternSurge onBack={handleBack} />;
  if (activeGame === 'divided-focus') return <DividedFocus onBack={handleBack} />;

  return <Dashboard onSelectGame={setActiveGame} />;
}

export default App;
