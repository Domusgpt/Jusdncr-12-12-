import React from 'react';

interface ExportPanelProps {
  onExport: (format: 'mp4' | 'webm' | 'html' | 'dkg') => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ onExport }) => {
  return (
    <div>
      <button type="button" onClick={() => onExport('mp4')}>MP4</button>
      <button type="button" onClick={() => onExport('html')}>HTML</button>
    </div>
  );
};
