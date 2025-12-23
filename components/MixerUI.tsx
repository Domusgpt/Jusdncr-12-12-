/**
 * MixerUI - VJ-style live control panel for the mixer
 */

import React, { useState } from 'react';
import type { EngineType, PatternType, EffectsRackState } from '../engine/LiveMixer';

interface MixerUIProps {
  // Deck A
  deckAEngine: EngineType;
  deckAPattern: PatternType;
  onDeckAEngineChange: (engine: EngineType) => void;
  onDeckAPatternChange: (pattern: PatternType) => void;

  // Deck B
  deckBEngine: EngineType;
  deckBPattern: PatternType;
  onDeckBEngineChange: (engine: EngineType) => void;
  onDeckBPatternChange: (pattern: PatternType) => void;

  // Crossfader
  crossfader: number;
  onCrossfaderChange: (value: number) => void;

  // Effects
  effects: EffectsRackState;
  onEffectChange: (effect: keyof EffectsRackState, value: number | boolean) => void;

  // Available options
  availableEngines: EngineType[];
  availablePatterns: PatternType[];

  // Visibility
  isOpen: boolean;
  onToggle: () => void;
}

const ENGINE_LABELS: Record<EngineType, string> = {
  REACTIVE: '⚡ Reactive',
  KINETIC: '🎯 Kinetic',
  CHAOS: '🌀 Chaos',
  MINIMAL: '◻️ Minimal',
  FLOW: '🌊 Flow'
};

const PATTERN_LABELS: Record<PatternType, string> = {
  PING_PONG: '↔️ Ping-Pong',
  BUILD_DROP: '📈 Build-Drop',
  STUTTER: '⚡ Stutter',
  VOGUE: '💃 Vogue',
  FLOW: '🌊 Flow',
  CHAOS: '🎲 Chaos',
  MINIMAL: '⬜ Minimal'
};

export const MixerUI: React.FC<MixerUIProps> = ({
  deckAEngine,
  deckAPattern,
  onDeckAEngineChange,
  onDeckAPatternChange,
  deckBEngine,
  deckBPattern,
  onDeckBEngineChange,
  onDeckBPatternChange,
  crossfader,
  onCrossfaderChange,
  effects,
  onEffectChange,
  availableEngines,
  availablePatterns,
  isOpen,
  onToggle
}) => {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-black/60 backdrop-blur-xl
                   border border-white/20 rounded-lg text-white font-rajdhani
                   hover:border-brand-500/50 transition-all"
      >
        🎛️ MIXER
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[380px] bg-black/80 backdrop-blur-xl
                    border border-white/20 rounded-xl p-4 font-rajdhani text-white
                    shadow-2xl shadow-brand-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-500
                       bg-clip-text text-transparent">
          LIVE MIXER
        </h2>
        <button
          onClick={onToggle}
          className="text-white/60 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Decks Row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Deck A */}
        <div className="bg-white/5 rounded-lg p-3 border border-cyan-500/30">
          <div className="text-xs text-cyan-400 mb-2 font-semibold">DECK A</div>

          <label className="block text-xs text-white/60 mb-1">Engine</label>
          <select
            value={deckAEngine}
            onChange={(e) => onDeckAEngineChange(e.target.value as EngineType)}
            className="w-full bg-black/40 border border-white/20 rounded px-2 py-1
                       text-sm mb-2 focus:border-cyan-500 outline-none"
          >
            {availableEngines.map(e => (
              <option key={e} value={e}>{ENGINE_LABELS[e] || e}</option>
            ))}
          </select>

          <label className="block text-xs text-white/60 mb-1">Pattern</label>
          <select
            value={deckAPattern}
            onChange={(e) => onDeckAPatternChange(e.target.value as PatternType)}
            className="w-full bg-black/40 border border-white/20 rounded px-2 py-1
                       text-sm focus:border-cyan-500 outline-none"
          >
            {availablePatterns.map(p => (
              <option key={p} value={p}>{PATTERN_LABELS[p] || p}</option>
            ))}
          </select>
        </div>

        {/* Deck B */}
        <div className="bg-white/5 rounded-lg p-3 border border-purple-500/30">
          <div className="text-xs text-purple-400 mb-2 font-semibold">DECK B</div>

          <label className="block text-xs text-white/60 mb-1">Engine</label>
          <select
            value={deckBEngine}
            onChange={(e) => onDeckBEngineChange(e.target.value as EngineType)}
            className="w-full bg-black/40 border border-white/20 rounded px-2 py-1
                       text-sm mb-2 focus:border-purple-500 outline-none"
          >
            {availableEngines.map(e => (
              <option key={e} value={e}>{ENGINE_LABELS[e] || e}</option>
            ))}
          </select>

          <label className="block text-xs text-white/60 mb-1">Pattern</label>
          <select
            value={deckBPattern}
            onChange={(e) => onDeckBPatternChange(e.target.value as PatternType)}
            className="w-full bg-black/40 border border-white/20 rounded px-2 py-1
                       text-sm focus:border-purple-500 outline-none"
          >
            {availablePatterns.map(p => (
              <option key={p} value={p}>{PATTERN_LABELS[p] || p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Crossfader */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/60 mb-1">
          <span className="text-cyan-400">A</span>
          <span>CROSSFADER</span>
          <span className="text-purple-400">B</span>
        </div>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={crossfader}
          onChange={(e) => onCrossfaderChange(parseFloat(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer
                     bg-gradient-to-r from-cyan-500/30 via-white/20 to-purple-500/30"
          style={{
            background: `linear-gradient(to right,
              rgba(0,255,255,0.5) 0%,
              rgba(255,255,255,0.2) 50%,
              rgba(168,85,247,0.5) 100%)`
          }}
        />
      </div>

      {/* Effects Grid */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <EffectSlider
          label="RGB"
          value={effects.rgbSplit}
          onChange={(v) => onEffectChange('rgbSplit', v)}
          color="red"
        />
        <EffectSlider
          label="FLASH"
          value={effects.flash}
          onChange={(v) => onEffectChange('flash', v)}
          color="yellow"
        />
        <EffectSlider
          label="GLITCH"
          value={effects.glitch}
          onChange={(v) => onEffectChange('glitch', v)}
          color="green"
        />
        <EffectSlider
          label="ZOOM"
          value={effects.zoomPulse}
          onChange={(v) => onEffectChange('zoomPulse', v)}
          color="blue"
        />
      </div>

      {/* Toggle Effects */}
      <div className="flex gap-2 flex-wrap">
        <EffectToggle
          label="INVERT"
          active={effects.invert}
          onChange={(v) => onEffectChange('invert', v)}
        />
        <EffectToggle
          label="B&W"
          active={effects.grayscale}
          onChange={(v) => onEffectChange('grayscale', v)}
        />
        <EffectToggle
          label="MIRROR"
          active={effects.mirror}
          onChange={(v) => onEffectChange('mirror', v)}
        />
        <EffectToggle
          label="STROBE"
          active={effects.strobe}
          onChange={(v) => onEffectChange('strobe', v)}
        />
      </div>
    </div>
  );
};

// Effect Slider Component
const EffectSlider: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}> = ({ label, value, onChange, color }) => {
  const colorMap: Record<string, string> = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500'
  };

  return (
    <div className="flex flex-col items-center">
      <div className="h-16 w-3 bg-white/10 rounded-full relative overflow-hidden">
        <div
          className={`absolute bottom-0 w-full rounded-full transition-all ${colorMap[color]}`}
          style={{ height: `${value * 100}%` }}
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
        />
      </div>
      <span className="text-[10px] text-white/60 mt-1">{label}</span>
    </div>
  );
};

// Effect Toggle Button
const EffectToggle: React.FC<{
  label: string;
  active: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, active, onChange }) => (
  <button
    onClick={() => onChange(!active)}
    className={`px-3 py-1 rounded text-xs font-semibold transition-all
                ${active
                  ? 'bg-brand-500 text-white border-brand-400'
                  : 'bg-white/5 text-white/60 border-white/10'
                } border`}
  >
    {label}
  </button>
);

export default MixerUI;
