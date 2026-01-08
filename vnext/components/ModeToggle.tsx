import { PulseMode } from '../engine/pulseEngine';

interface ModeToggleProps {
  value: PulseMode;
  onChange: (mode: PulseMode) => void;
}

const modes: PulseMode[] = ['ambient', 'performance'];

const labels: Record<PulseMode, string> = {
  ambient: 'Ambient Lab',
  performance: 'Performance Lab',
};

export const ModeToggle = ({ value, onChange }: ModeToggleProps) => (
  <div className="mode-toggle" role="group" aria-label="Pulse modes">
    {modes.map((mode) => (
      <button
        key={mode}
        type="button"
        aria-pressed={value === mode}
        onClick={() => onChange(mode)}
      >
        {labels[mode]}
      </button>
    ))}
  </div>
);
