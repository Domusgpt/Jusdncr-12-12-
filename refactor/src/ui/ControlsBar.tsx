import React from 'react';

interface ControlsBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({ isPlaying, onTogglePlay }) => {
  return (
    <div>
      <button type="button" onClick={onTogglePlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
};
