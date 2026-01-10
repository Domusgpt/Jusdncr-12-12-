import React from 'react';
import type { EngineMode } from '../core/Step4Coordinator';

interface EngineSurfaceProps {
  mode: EngineMode;
  onModeChange: (mode: EngineMode) => void;
}

export const EngineSurface: React.FC<EngineSurfaceProps> = ({ mode, onModeChange }) => {
  return (
    <div>
      <button type="button" onClick={() => onModeChange('pattern')}>
        Pattern
      </button>
      <button type="button" onClick={() => onModeChange('kinetic')}>
        Kinetic
      </button>
      <div>Mode: {mode}</div>
    </div>
  );
};
