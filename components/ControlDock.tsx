/**
 * ControlDock - Persistent bottom control bar
 *
 * Primary controls always within thumb reach.
 * Hierarchy: PLAY (biggest) > other controls (uniform)
 */

import React, { useState } from 'react';
import {
  Play, Pause, Mic, MicOff, Disc3, Camera,
  MoreHorizontal, Music2, Brain, Zap, Eye,
  Sparkles, Download, Video, X, Upload
} from 'lucide-react';

interface ControlDockProps {
  // Audio state
  isPlaying: boolean;
  hasAudio: boolean;
  onPlayToggle: () => void;
  onUploadAudio: () => void;

  // Mic state
  isMicActive: boolean;
  onMicToggle: () => void;

  // Mixer
  isMixerOpen: boolean;
  onMixerToggle: () => void;
  activeDeckCount?: number;

  // Camera
  isCamActive: boolean;
  onCamToggle: () => void;

  // Choreo mode
  choreoMode: 'LABAN' | 'LEGACY';
  onChoreoModeToggle: () => void;

  // Frame deck
  isFrameDeckOpen: boolean;
  onFrameDeckToggle: () => void;

  // Actions
  onGenerateMore: () => void;
  onSaveProject: () => void;
  onStartRecording: () => void;
  isRecording: boolean;

  // Beat state
  beatCounter: number;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  isPlaying,
  hasAudio,
  onPlayToggle,
  onUploadAudio,
  isMicActive,
  onMicToggle,
  isMixerOpen,
  onMixerToggle,
  activeDeckCount = 1,
  isCamActive,
  onCamToggle,
  choreoMode,
  onChoreoModeToggle,
  isFrameDeckOpen,
  onFrameDeckToggle,
  onGenerateMore,
  onSaveProject,
  onStartRecording,
  isRecording,
  beatCounter
}) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* MORE menu - floating above dock */}
      {showMore && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3
                       bg-black/80 backdrop-blur-xl rounded-2xl border border-white/15
                       p-3 shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="grid grid-cols-3 gap-2">
            {/* LABAN/LEGACY toggle */}
            <button
              onClick={() => { onChoreoModeToggle(); setShowMore(false); }}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl
                         transition-all active:scale-95 min-w-[72px]
                         ${choreoMode === 'LABAN'
                           ? 'bg-purple-500/30 border border-purple-500 text-purple-300'
                           : 'bg-orange-500/30 border border-orange-500 text-orange-300'
                         }`}
            >
              {choreoMode === 'LABAN' ? <Brain size={20} /> : <Zap size={20} />}
              <span className="text-[10px] font-bold">{choreoMode}</span>
            </button>

            {/* Frames */}
            <button
              onClick={() => { onFrameDeckToggle(); setShowMore(false); }}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl
                         transition-all active:scale-95
                         ${isFrameDeckOpen
                           ? 'bg-white/20 border border-white/40 text-white'
                           : 'bg-white/5 border border-white/10 text-white/60'
                         }`}
            >
              <Eye size={20} />
              <span className="text-[10px] font-bold">FRAMES</span>
            </button>

            {/* Generate New */}
            <button
              onClick={() => { onGenerateMore(); setShowMore(false); }}
              className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl
                        bg-brand-500/20 border border-brand-500/50 text-brand-300
                        transition-all active:scale-95"
            >
              <Sparkles size={20} />
              <span className="text-[10px] font-bold">NEW</span>
            </button>

            {/* Save */}
            <button
              onClick={() => { onSaveProject(); setShowMore(false); }}
              className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl
                        bg-white/5 border border-white/10 text-white/60
                        hover:text-white transition-all active:scale-95"
            >
              <Download size={20} />
              <span className="text-[10px] font-bold">SAVE</span>
            </button>

            {/* Record */}
            <button
              onClick={() => { onStartRecording(); setShowMore(false); }}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl
                         transition-all active:scale-95
                         ${isRecording
                           ? 'bg-red-500/30 border border-red-500 text-red-400 animate-pulse'
                           : 'bg-white/5 border border-white/10 text-white/60'
                         }`}
            >
              <Video size={20} />
              <span className="text-[10px] font-bold">{isRecording ? 'STOP' : 'REC'}</span>
            </button>

            {/* Close */}
            <button
              onClick={() => setShowMore(false)}
              className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl
                        bg-white/5 border border-white/10 text-white/40
                        hover:text-white transition-all active:scale-95"
            >
              <X size={20} />
              <span className="text-[10px] font-bold">CLOSE</span>
            </button>
          </div>
        </div>
      )}

      {/* Main dock */}
      <div className="mx-3 mb-3 bg-black/70 backdrop-blur-xl rounded-2xl
                     border border-white/10 shadow-2xl overflow-hidden">
        {/* Controls row */}
        <div className="flex items-center justify-center gap-3 p-3">
          {/* PLAY button - largest, most prominent */}
          {hasAudio ? (
            <button
              onClick={onPlayToggle}
              className={`w-16 h-16 rounded-full flex items-center justify-center
                         transition-all active:scale-95 touch-manipulation flex-shrink-0
                         ${isPlaying
                           ? 'bg-brand-500 text-white shadow-[0_0_30px_rgba(139,92,246,0.5)]'
                           : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                         }`}
            >
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
          ) : (
            <button
              onClick={onUploadAudio}
              className="w-16 h-16 rounded-full flex items-center justify-center
                        bg-brand-500/20 border-2 border-dashed border-brand-500/50 text-brand-400
                        active:scale-95 touch-manipulation"
            >
              <Music2 size={24} />
            </button>
          )}

          {/* TRACK - always visible for uploading/changing audio */}
          <button
            onClick={onUploadAudio}
            className={`w-12 h-12 rounded-xl flex items-center justify-center
                       transition-all active:scale-95 touch-manipulation border
                       ${hasAudio
                         ? 'bg-green-500/20 border-green-500/50 text-green-400'
                         : 'bg-brand-500/20 border-brand-500/50 text-brand-400'
                       }`}
          >
            <Upload size={20} />
          </button>

          {/* MIC */}
          <button
            onClick={onMicToggle}
            className={`w-12 h-12 rounded-xl flex items-center justify-center
                       transition-all active:scale-95 touch-manipulation border
                       ${isMicActive
                         ? 'bg-red-500/30 border-red-500 text-red-400'
                         : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                       }`}
          >
            {isMicActive ? <Mic size={22} /> : <MicOff size={22} />}
          </button>

          {/* MIXER */}
          <button
            onClick={onMixerToggle}
            className={`w-12 h-12 rounded-xl flex items-center justify-center relative
                       transition-all active:scale-95 touch-manipulation border
                       ${isMixerOpen
                         ? 'bg-cyan-500/30 border-cyan-500 text-cyan-400'
                         : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                       }`}
          >
            <Disc3 size={22} />
            {activeDeckCount > 1 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full
                             text-[9px] font-bold text-white flex items-center justify-center">
                {activeDeckCount}
              </span>
            )}
          </button>

          {/* CAM */}
          <button
            onClick={onCamToggle}
            className={`w-12 h-12 rounded-xl flex items-center justify-center
                       transition-all active:scale-95 touch-manipulation border
                       ${isCamActive
                         ? 'bg-blue-500/30 border-blue-500 text-blue-400'
                         : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                       }`}
          >
            <Camera size={22} />
          </button>

          {/* MORE */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center
                       transition-all active:scale-95 touch-manipulation border
                       ${showMore
                         ? 'bg-white/20 border-white/40 text-white'
                         : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                       }`}
          >
            <MoreHorizontal size={22} />
          </button>
        </div>

        {/* Beat indicator */}
        <div className="flex justify-center gap-2 pb-3 px-4">
          {[0, 4, 8, 12].map((threshold, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 max-w-12 rounded-full transition-all duration-100
                         ${beatCounter >= threshold
                           ? i === 3 ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.5)]'
                             : i === 2 ? 'bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                             : 'bg-brand-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                           : 'bg-white/10'
                         }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ControlDock;
