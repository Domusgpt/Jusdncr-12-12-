import React, { useMemo, useState } from 'react';
import { Step4Coordinator } from '../core/Step4Coordinator';
import { AudioEngine } from '../services/audioEngine';
import { EngineAdapter } from '../services/engineAdapter';
import { ExportService } from '../services/exportService';
import { ControlsBar } from './ControlsBar';
import { EngineSurface } from './EngineSurface';
import { ExportPanel } from './ExportPanel';

export const Step4Shell: React.FC = () => {
  const coordinator = useMemo(() => {
    return new Step4Coordinator({
      audioEngine: new AudioEngine(),
      engineAdapter: new EngineAdapter(),
      exportService: new ExportService()
    });
  }, []);
  const [state, setState] = useState(coordinator.state);

  const updateState = () => setState({ ...coordinator.state });

  return (
    <div>
      <ControlsBar
        isPlaying={state.isPlaying}
        onTogglePlay={() => {
          coordinator.togglePlayback();
          updateState();
        }}
      />
      <EngineSurface
        mode={state.engineMode}
        onModeChange={(mode) => {
          coordinator.setEngineMode(mode);
          updateState();
        }}
      />
      <ExportPanel
        onExport={(format) => coordinator.requestExport({ format })}
      />
    </div>
  );
};
