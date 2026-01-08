import { useMemo, useState } from 'react';
import { ModeToggle } from './components/ModeToggle';
import { PulseCard } from './components/PulseCard';
import { RoadmapCard } from './components/RoadmapCard';
import { PulseMode } from './engine/pulseEngine';
import { getPulseProfile } from './services/pulseService';

const App = () => {
  const [mode, setMode] = useState<PulseMode>('ambient');

  const pulseFrame = useMemo(() => getPulseProfile(mode), [mode]);

  return (
    <div className="vnext-shell">
      <header className="vnext-header">
        <div className="vnext-pill">jusDNCE · vNext</div>
        <h1>Parallel exploration space</h1>
        <p>
          This sandbox isolates new choreography engine experiments and service layers
          without coupling to the current production UI.
        </p>
        <ModeToggle value={mode} onChange={setMode} />
      </header>

      <main className="vnext-grid">
        <PulseCard frame={pulseFrame} />
        <RoadmapCard />
      </main>
    </div>
  );
};

export default App;
