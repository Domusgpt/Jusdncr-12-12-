/**
 * AudioSourceSelector - Expandable audio source picker
 *
 * Combines best practices from Firebase (adapter pills) with improved UX:
 * - Collapsed: Shows current source with dropdown indicator
 * - Expanded: Shows all 4 source options as radio pills
 * - Stream URL input appears when Stream is selected
 *
 * Sources: FILE | MIC | STREAM | SYSTEM
 */

import React, { useState, useRef } from 'react';
import {
  Music, Mic, MicOff, Radio, Monitor, ChevronDown, ChevronUp,
  Link2, Upload, X, Check, Loader2
} from 'lucide-react';

export type AudioSourceType = 'file' | 'mic' | 'stream' | 'system';

interface AudioSourceSelectorProps {
  // Current state
  activeSource: AudioSourceType;
  isPlaying: boolean;
  isMicActive: boolean;
  hasAudioFile: boolean;
  streamUrl?: string;

  // Actions
  onSourceChange: (source: AudioSourceType) => void;
  onFileUpload: () => void;
  onMicToggle: () => void;
  onStreamSubmit: (url: string) => void;
  onSystemAudio: () => void;
  onPlayToggle: () => void;

  // Optional
  disabled?: boolean;
  compact?: boolean;
}

type SourceColor = 'brand' | 'red' | 'cyan' | 'pink';

interface SourceConfig {
  icon: typeof Music;
  label: string;
  description: string;
  color: SourceColor;
}

const SOURCE_CONFIG: Record<AudioSourceType, SourceConfig> = {
  file: {
    icon: Music,
    label: 'FILE',
    description: 'Upload audio',
    color: 'brand',
  },
  mic: {
    icon: Mic,
    label: 'MIC',
    description: 'Live input',
    color: 'red',
  },
  stream: {
    icon: Radio,
    label: 'STREAM',
    description: 'URL',
    color: 'cyan',
  },
  system: {
    icon: Monitor,
    label: 'SYSTEM',
    description: 'Capture',
    color: 'pink',
  },
};

export const AudioSourceSelector: React.FC<AudioSourceSelectorProps> = ({
  activeSource,
  isPlaying,
  isMicActive,
  hasAudioFile,
  streamUrl = '',
  onSourceChange,
  onFileUpload,
  onMicToggle,
  onStreamSubmit,
  onSystemAudio,
  onPlayToggle,
  disabled = false,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localStreamUrl, setLocalStreamUrl] = useState(streamUrl);
  const [isLinking, setIsLinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSourceSelect = (source: AudioSourceType) => {
    onSourceChange(source);

    // Trigger source-specific actions
    switch (source) {
      case 'file':
        onFileUpload();
        break;
      case 'mic':
        if (!isMicActive) onMicToggle();
        break;
      case 'system':
        onSystemAudio();
        break;
      case 'stream':
        // Focus URL input
        setTimeout(() => inputRef.current?.focus(), 100);
        break;
    }

    // Keep expanded if stream selected (need to enter URL)
    if (source !== 'stream') {
      setIsExpanded(false);
    }
  };

  const handleStreamSubmit = () => {
    const trimmed = localStreamUrl.trim();
    if (!trimmed) return;

    setIsLinking(true);
    onStreamSubmit(trimmed);

    // Simulate link completion
    setTimeout(() => {
      setIsLinking(false);
      setIsExpanded(false);
    }, 500);
  };

  const ActiveIcon = SOURCE_CONFIG[activeSource].icon;
  const activeConfig = SOURCE_CONFIG[activeSource];

  // Determine if source is "hot" (active/playing)
  const isSourceHot = (source: AudioSourceType): boolean => {
    if (source === 'mic') return isMicActive;
    if (source === 'file') return hasAudioFile && isPlaying;
    if (source === 'stream') return !!streamUrl && isPlaying;
    return false;
  };

  return (
    <div className={`relative ${compact ? '' : 'w-full max-w-xs'}`}>
      {/* Collapsed View - Current Source Button */}
      <button
        onClick={() => !disabled && setIsExpanded(!isExpanded)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-xl
          bg-black/40 backdrop-blur-xl border
          transition-all duration-200 touch-manipulation
          ${isExpanded
            ? 'border-white/30 bg-black/60'
            : 'border-white/10 hover:border-white/20'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}
        `}
      >
        {/* Active indicator dot */}
        <div className={`
          w-2 h-2 rounded-full
          ${isSourceHot(activeSource)
            ? activeConfig.color === 'brand'
              ? 'bg-brand-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]'
              : activeConfig.color === 'red'
              ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse'
              : activeConfig.color === 'cyan'
              ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
              : 'bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]'
            : 'bg-white/30'
          }
        `} />

        {/* Icon */}
        <ActiveIcon size={16} className={`
          ${activeConfig.color === 'brand' ? 'text-brand-400' : ''}
          ${activeConfig.color === 'red' ? 'text-red-400' : ''}
          ${activeConfig.color === 'cyan' ? 'text-cyan-400' : ''}
          ${activeConfig.color === 'pink' ? 'text-pink-400' : ''}
        `} />

        {/* Label */}
        <span className="text-xs font-bold text-white/80 tracking-wider">
          {activeConfig.label}
        </span>

        {/* Dropdown indicator */}
        {isExpanded ? (
          <ChevronUp size={14} className="text-white/40 ml-auto" />
        ) : (
          <ChevronDown size={14} className="text-white/40 ml-auto" />
        )}
      </button>

      {/* Expanded View - All Sources */}
      {isExpanded && (
        <div className="
          absolute top-full left-0 right-0 mt-2 z-50
          bg-black/90 backdrop-blur-xl rounded-xl
          border border-white/15 shadow-2xl
          animate-in slide-in-from-top-2 fade-in duration-200
          overflow-hidden
        ">
          {/* Source Pills */}
          <div className="grid grid-cols-4 gap-1 p-2">
            {(Object.entries(SOURCE_CONFIG) as [AudioSourceType, SourceConfig][]).map(([source, config]) => {
              const Icon = config.icon;
              const isActive = activeSource === source;
              const isHot = isSourceHot(source);

              return (
                <button
                  key={source}
                  onClick={() => handleSourceSelect(source)}
                  className={`
                    flex flex-col items-center gap-1 p-2.5 rounded-lg
                    transition-all duration-150 touch-manipulation active:scale-95
                    ${isActive
                      ? config.color === 'brand'
                        ? 'bg-brand-500/30 border border-brand-500/60'
                        : config.color === 'red'
                        ? 'bg-red-500/30 border border-red-500/60'
                        : config.color === 'cyan'
                        ? 'bg-cyan-500/30 border border-cyan-500/60'
                        : 'bg-pink-500/30 border border-pink-500/60'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }
                  `}
                >
                  {/* Radio dot */}
                  <div className={`
                    w-3 h-3 rounded-full border-2 flex items-center justify-center
                    ${isActive
                      ? config.color === 'brand'
                        ? 'border-brand-400'
                        : config.color === 'red'
                        ? 'border-red-400'
                        : config.color === 'cyan'
                        ? 'border-cyan-400'
                        : 'border-pink-400'
                      : 'border-white/30'
                    }
                  `}>
                    {isActive && (
                      <div className={`
                        w-1.5 h-1.5 rounded-full
                        ${config.color === 'brand' ? 'bg-brand-400' : ''}
                        ${config.color === 'red' ? 'bg-red-400' : ''}
                        ${config.color === 'cyan' ? 'bg-cyan-400' : ''}
                        ${config.color === 'pink' ? 'bg-pink-400' : ''}
                        ${isHot ? 'animate-pulse' : ''}
                      `} />
                    )}
                  </div>

                  {/* Icon */}
                  <Icon size={18} className={`
                    ${isActive
                      ? config.color === 'brand'
                        ? 'text-brand-400'
                        : config.color === 'red'
                        ? 'text-red-400'
                        : config.color === 'cyan'
                        ? 'text-cyan-400'
                        : 'text-pink-400'
                      : 'text-white/50'
                    }
                  `} />

                  {/* Label */}
                  <span className={`
                    text-[9px] font-bold tracking-wider
                    ${isActive ? 'text-white' : 'text-white/50'}
                  `}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Stream URL Input (shown when stream selected) */}
          {activeSource === 'stream' && (
            <div className="px-2 pb-2 border-t border-white/10 pt-2">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="url"
                  value={localStreamUrl}
                  onChange={(e) => setLocalStreamUrl(e.target.value)}
                  placeholder="https://..."
                  className="
                    flex-1 px-3 py-2 rounded-lg
                    bg-white/5 border border-white/10
                    text-white text-sm placeholder-white/30
                    focus:outline-none focus:border-cyan-400/50
                  "
                  onKeyDown={(e) => e.key === 'Enter' && handleStreamSubmit()}
                />
                <button
                  onClick={handleStreamSubmit}
                  disabled={!localStreamUrl.trim() || isLinking}
                  className="
                    px-3 py-2 rounded-lg
                    bg-cyan-500/20 border border-cyan-500/50
                    text-cyan-400 font-bold text-xs
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-cyan-500/30 active:scale-95
                    transition-all touch-manipulation
                  "
                >
                  {isLinking ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={() => setIsExpanded(false)}
            className="
              absolute top-2 right-2 p-1 rounded-full
              bg-white/5 text-white/40 hover:text-white
              transition-colors
            "
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioSourceSelector;
