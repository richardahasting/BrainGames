import { useState, useEffect } from 'react';
import { GameId } from './types/game';
import { useAuth } from './hooks/useAuth';
import Dashboard from './components/Dashboard';
import DoubleDecision from './components/games/DoubleDecision';
import PeripheralPulse from './components/games/PeripheralPulse';
import FlashMatch from './components/games/FlashMatch';
import PatternSurge from './components/games/PatternSurge';
import DividedFocus from './components/games/DividedFocus';

function App() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const auth = useAuth();

  // Handle magic link verification: /auth/verify?token=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const path = window.location.pathname;
    if (path === '/auth/verify' && token) {
      auth.verify(token).then(() => {
        window.history.replaceState({}, '', '/');
      });
    }
  }, []);

  const handleBack = () => setActiveGame(null);

  if (activeGame === 'double-decision') return <DoubleDecision onBack={handleBack} />;
  if (activeGame === 'peripheral-pulse') return <PeripheralPulse onBack={handleBack} />;
  if (activeGame === 'flash-match') return <FlashMatch onBack={handleBack} />;
  if (activeGame === 'pattern-surge') return <PatternSurge onBack={handleBack} />;
  if (activeGame === 'divided-focus') return <DividedFocus onBack={handleBack} />;

  return <Dashboard onSelectGame={setActiveGame} auth={auth} />;
}

export default App;
