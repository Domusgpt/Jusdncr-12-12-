/**
 * StatusBar - Top persistent bar with transport controls
 *
 * Contains: Play, Mic, Upload, Stream Link, BPM, Beat indicator, Cam, More menu
 * 48px height, semi-transparent, always visible
 */

import React, { useState } from 'react';
import {
  Play, Pause, Mic, MicOff, Camera, Upload,
  MoreHorizontal, Eye, Sparkles, Download, Video, X, Link2
} from 'lucide-react';

interface StatusBarProps {
  // Transport
  isPlaying: boolean;
  hasAudio: boolean;
  onPlayToggle: () => void;
  onUploadAudio: () => void;
  onLinkAudio: () => void;

  // Mic
  isMicActive: boolean;
  onMicToggle: () => void;

  // Camera
  isCamActive: boolean;
  onCamToggle: () => void;

  // Display
  bpm: number;
  beatCounter: number;

  // More menu actions
  isFrameDeckOpen: boolean;
  onFrameDeckToggle: () => void;
  onGenerateMore: () => void;
  onSaveProject: () => void;
  onStartRecording: () => void;
  isRecording: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isPlaying,
  hasAudio,
  onPlayToggle,
  onUploadAudio,
  isMicActive,
  onMicToggle,
  isCamActive,
  onCamToggle,
  bpm,
  beatCounter,
  isFrameDeckOpen,
  onFrameDeckToggle,
  onGenerateMore,
  onSaveProject,
  onStartRecording,
  isRecording,
  onLinkAudio
}) => {
  const [showMore, setShowMore] = useState(false);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 pt-safe">
      {/* MORE menu dropdown */}
      {showMore && (
        <div className="absolute top-full right-3 mt-2
                       bg-black/90 backdrop-blur-xl rounded-xl border border-white/15
                       p-2 shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200
                       min-w-[200px]">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { onFrameDeckToggle(); setShowMore(false); }}
              className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg
                         transition-all active:scale-95
                         ${isFrameDeckOpen
                           ? 'bg-white/20 border border-white/40 text-white'
                           : 'bg-white/5 border border-white/10 text-white/60'
                         }`}
            >
              <Eye size={18} />
              <span className="text-[9px] font-bold">FRAMES</span>
            </button>

            <button
              onClick={() => { onGenerateMore(); setShowMore(false); }}
              className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg
                        bg-brand-500/20 border border-brand-500/50 text-brand-300
                        transition-all active:scale-95"
            >
              <Sparkles size={18} />
              <span className="text-[9px] font-bold">NEW</span>
            </button>

            <button
              onClick={() => { onSaveProject(); setShowMore(false); }}
              className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg
                        bg-white/5 border border-white/10 text-white/60
                        hover:text-white transition-all active:scale-95"
            >
              <Download size={18} />
              <span className="text-[9px] font-bold">SAVE</span>
            </button>

            <button
              onClick={() => { onStartRecording(); setShowMore(false); }}
              className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg
                         transition-all active:scale-95 col-span-2
                         ${isRecording
                           ? 'bg-red-500/30 border border-red-500 text-red-400 animate-pulse'
                           : 'bg-white/5 border border-white/10 text-white/60'
                         }`}
            >
              <Video size={18} />
              <span className="text-[9px] font-bold">{isRecording ? 'STOP REC' : 'RECORD'}</span>
            </button>

            <button
              onClick={() => setShowMore(false)}
              className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg
                        bg-white/5 border border-white/10 text-white/40
                        hover:text-white transition-all active:scale-95"
            >
              <X size={18} />
              <span className="text-[9px] font-bold">CLOSE</span>
            </button>
          </div>
        </div>
      )}

      {/* Main bar */}
      <div className="mx-2 mt-2 bg-black/60 backdrop-blur-xl rounded-xl
                     border border-white/10 shadow-lg">
        <div className="flex items-center justify-between px-2 py-1.5 gap-1">

          {/* Left: Transport controls */}
          <div className="flex items-center gap-1 relative">
            {/* Play/Pause */}
            {hasAudio ? (
              <button
                onClick={onPlayToggle}
                className={`w-10 h-10 rounded-lg flex items-center justify-center
                           transition-all active:scale-95 touch-manipulation
                           ${isPlaying
                             ? 'bg-brand-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                             : 'bg-white/10 text-white border border-white/20'
                           }`}
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </button>
            ) : (
              <button
                onClick={onUploadAudio}
                className="w-10 h-10 rounded-lg flex items-center justify-center
                          bg-brand-500/20 border border-dashed border-brand-500/50 text-brand-400
                          active:scale-95 touch-manipulation"
              >
                <Upload size={18} />
              </button>
            )}

            <button
              onClick={onLinkAudio}
              className="w-9 h-9 rounded-lg flex items-center justify-center
                        bg-white/5 border border-white/10 text-white/60
                        hover:text-white hover:border-brand-400/50 active:scale-95 touch-manipulation"
              title="Streaming URL"
            >
              <Link2 size={16} />
            </button>

            {/* Mic */}
            <button
              onClick={onMicToggle}
              className={`w-9 h-9 rounded-lg flex items-center justify-center
                         transition-all active:scale-95 touch-manipulation
                         ${isMicActive
                           ? 'bg-red-500/30 border border-red-500 text-red-400'
                           : 'bg-white/5 border border-white/10 text-white/50'
                         }`}
            >
              {isMicActive ? <Mic size={16} /> : <MicOff size={16} />}
            </button>

          </div>

          {/* Center: BPM + Beat indicator */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {bpm > 0 ? `${Math.round(bpm)}` : '---'}
            </span>
            <span className="text-[10px] text-white/30">BPM</span>

            {/* Beat bars */}
            <div className="flex gap-1 ml-2">
              {[0, 4, 8, 12].map((threshold, i) => (
                <div
                  key={i}
                  className={`w-6 h-1.5 rounded-full transition-all duration-75
                             ${beatCounter >= threshold
                               ? i === 3 ? 'bg-cyan-400 shadow-[0_0_6px_rgba(0,255,255,0.6)]'
                                 : i === 2 ? 'bg-pink-400 shadow-[0_0_6px_rgba(236,72,153,0.6)]'
                                 : 'bg-brand-500 shadow-[0_0_6px_rgba(139,92,246,0.6)]'
                               : 'bg-white/10'
                             }`}
                />
              ))}
            </div>
          </div>

          {/* Right: Cam + More */}
          <div className="flex items-center gap-1">
            {/* Recording indicator */}
            {isRecording && (
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1" />
            )}

            {/* Cam */}
            <button
              onClick={onCamToggle}
              className={`w-9 h-9 rounded-lg flex items-center justify-center
                         transition-all active:scale-95 touch-manipulation
                         ${isCamActive
                           ? 'bg-blue-500/30 border border-blue-500 text-blue-400'
                           : 'bg-white/5 border border-white/10 text-white/50'
                         }`}
            >
              <Camera size={16} />
            </button>

            {/* More */}
            <button
              onClick={() => setShowMore(!showMore)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center
                         transition-all active:scale-95 touch-manipulation
                         ${showMore
                           ? 'bg-white/20 border border-white/40 text-white'
                           : 'bg-white/5 border border-white/10 text-white/50'
                         }`}
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
