/**
 * UnifiedMixerPanel - Complete Control Center
 *
 * A single, tab-based panel that consolidates all controls:
 * - DECKS: 4-channel deck management, BPM, triggers
 * - ENGINE: Physics mode (LEGACY/LABAN), Engine mode (PATTERN/KINETIC), patterns
 * - FX: All visual effects, filters, intensity paddle
 *
 * Design philosophy:
 * - Mobile-first, touch-optimized (min 44px touch targets)
 * - Bottom sheet on mobile, positioned panel on desktop
 * - All functionality in one place, no scattered controls
 * - Clean, organized tabs like the playerExport.ts HTML version
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Layers, Disc, Zap, Sparkles, Brain, Grid3X3,
  ChevronDown, ChevronUp, Image, X,
  Contrast, ScanLine, Wand2, ZoomIn, Ghost, Circle, Move
} from 'lucide-react';
import type {
  EngineMode, SequenceMode, PatternType, MixMode, MixerTelemetry, EffectsState
} from '../engine/GolemMixer';
import type { GeneratedFrame } from '../types';

// =============================================================================
// TYPES
// =============================================================================

interface DeckState {
  id: number;
  name: string;
  isActive: boolean;
  mixMode: MixMode;
  opacity: number;
  frameCount: number;
  rigName?: string;
  frames?: GeneratedFrame[];
}

export interface FXState {
  rgbSplit: boolean;
  strobe: boolean;
  ghost: boolean;
  invert: boolean;
  bw: boolean;
  scanlines: boolean;
  glitch: boolean;
  shake: boolean;
  zoom: boolean;
}

interface UnifiedMixerPanelProps {
  // Visibility
  isOpen: boolean;
  onClose: () => void;

  // Deck state
  decks: DeckState[];
  onDeckModeChange: (deckId: number, mode: MixMode) => void;
  onDeckOpacityChange: (deckId: number, opacity: number) => void;
  onLoadDeck: (deckId: number) => void;

  // Physics mode (how frames move)
  physicsMode: 'LEGACY' | 'LABAN';
  onPhysicsModeChange: (mode: 'LEGACY' | 'LABAN') => void;

  // Engine mode (which frame selected)
  engineMode: EngineMode;
  onEngineModeChange: (mode: EngineMode) => void;

  // Pattern (when in PATTERN mode)
  activePattern: PatternType;
  onPatternChange: (pattern: PatternType) => void;

  // Sequence mode (when in KINETIC mode)
  sequenceMode: SequenceMode;
  onSequenceModeChange: (mode: SequenceMode) => void;

  // BPM
  bpm: number;
  autoBPM: boolean;
  onBPMChange: (bpm: number) => void;
  onAutoBPMChange: (auto: boolean) => void;

  // Triggers
  onTriggerStutter: (active: boolean) => void;
  onTriggerReverse: (active: boolean) => void;
  onTriggerGlitch: (active: boolean) => void;
  onTriggerBurst: (active: boolean) => void;

  // FX state
  userEffects: FXState;
  onToggleEffect: (effect: keyof FXState) => void;
  onResetEffects: () => void;

  // Intensity (pressure paddle replacement)
  intensity: number;
  onIntensityChange: (intensity: number) => void;

  // Mixer effects
  mixerEffects: EffectsState;
  onMixerEffectChange: <K extends keyof EffectsState>(key: K, value: EffectsState[K]) => void;

  // Telemetry
  telemetry: MixerTelemetry | null;

  // Laban effort (when physics = LABAN)
  labanEffort?: { weight: number; space: number; time: number; flow: number };
}

// =============================================================================
// CONFIGURATION
// =============================================================================

type TabId = 'decks' | 'engine' | 'fx';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'decks', label: 'DECKS', icon: Layers },
  { id: 'engine', label: 'ENGINE', icon: Zap },
  { id: 'fx', label: 'FX', icon: Sparkles }
];

const PATTERNS: { id: PatternType; label: string; desc: string }[] = [
  { id: 'PING_PONG', label: 'PING', desc: 'Left-right alternating' },
  { id: 'BUILD_DROP', label: 'DROP', desc: 'Intensity to release' },
  { id: 'STUTTER', label: 'STUT', desc: 'Rapid cuts' },
  { id: 'VOGUE', label: 'VOGUE', desc: 'High-freq poses' },
  { id: 'FLOW', label: 'FLOW', desc: 'Smooth transitions' },
  { id: 'CHAOS', label: 'CHAOS', desc: 'Random everything' },
  { id: 'ABAB', label: 'ABAB', desc: 'Standard alternate' },
  { id: 'AABB', label: 'AABB', desc: 'Paired frames' },
  { id: 'ABAC', label: 'ABAC', desc: 'Third for breaks' },
  { id: 'SNARE_ROLL', label: 'SNARE', desc: 'Repeat on snares' },
  { id: 'GROOVE', label: 'GROOVE', desc: 'Mid-energy flow' },
  { id: 'EMOTE', label: 'EMOTE', desc: 'Closeup focus' },
  { id: 'FOOTWORK', label: 'FOOT', desc: 'Lower body' },
  { id: 'IMPACT', label: 'IMPACT', desc: 'High energy hits' },
  { id: 'MINIMAL', label: 'MIN', desc: 'Just beats' }
];

const SEQUENCE_MODES: { id: SequenceMode; label: string; color: string }[] = [
  { id: 'GROOVE', label: 'GROOVE', color: 'bg-green-500 border-green-400' },
  { id: 'EMOTE', label: 'EMOTE', color: 'bg-purple-500 border-purple-400' },
  { id: 'IMPACT', label: 'IMPACT', color: 'bg-red-500 border-red-400' },
  { id: 'FOOTWORK', label: 'FOOTWORK', color: 'bg-blue-500 border-blue-400' }
];

const FX_CONFIG: { id: keyof FXState; icon: React.ElementType; label: string }[] = [
  { id: 'rgbSplit', icon: Sparkles, label: 'RGB' },
  { id: 'strobe', icon: Zap, label: 'STROBE' },
  { id: 'ghost', icon: Ghost, label: 'GHOST' },
  { id: 'invert', icon: Contrast, label: 'INVERT' },
  { id: 'bw', icon: Circle, label: 'B&W' },
  { id: 'scanlines', icon: ScanLine, label: 'SCAN' },
  { id: 'glitch', icon: Wand2, label: 'GLITCH' },
  { id: 'shake', icon: Move, label: 'SHAKE' },
  { id: 'zoom', icon: ZoomIn, label: 'ZOOM' }
];

const MIX_MODES: { id: MixMode; label: string }[] = [
  { id: 'sequencer', label: 'SEQ' },
  { id: 'layer', label: 'LAY' },
  { id: 'off', label: 'OFF' }
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const UnifiedMixerPanel: React.FC<UnifiedMixerPanelProps> = (props) => {
  const {
    isOpen,
    onClose,
    decks,
    onDeckModeChange,
    onDeckOpacityChange,
    onLoadDeck,
    physicsMode,
    onPhysicsModeChange,
    engineMode,
    onEngineModeChange,
    activePattern,
    onPatternChange,
    sequenceMode,
    onSequenceModeChange,
    bpm,
    autoBPM,
    onBPMChange,
    onAutoBPMChange,
    onTriggerStutter,
    onTriggerReverse,
    onTriggerGlitch,
    onTriggerBurst,
    userEffects,
    onToggleEffect,
    onResetEffects,
    intensity,
    onIntensityChange,
    mixerEffects,
    onMixerEffectChange,
    telemetry,
    labanEffort
  } = props;

  const [activeTab, setActiveTab] = useState<TabId>('engine');
  const [expandedDeck, setExpandedDeck] = useState<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [dragStartY, setDragStartY] = useState(0);

  // Swipe down to close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - dragStartY;
    if (deltaY > 80) onClose();
  }, [dragStartY, onClose]);

  if (!isOpen) return null;

  const activeEffectCount = Object.values(userEffects).filter(Boolean).length;

  return (
    <div
      ref={drawerRef}
      className="fixed bottom-0 left-0 right-0 z-50
                 bg-black/95 backdrop-blur-xl
                 border-t border-white/15 rounded-t-3xl font-rajdhani text-white
                 shadow-2xl shadow-black/50 overflow-hidden
                 max-h-[75vh] sm:max-h-[70vh]
                 animate-in slide-in-from-bottom duration-300"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drawer Handle */}
      <div className="flex flex-col items-center pt-2 pb-1">
        <div className="w-12 h-1.5 bg-white/30 rounded-full" />
      </div>

      {/* Header with Tab Navigation */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        {/* Tab Buttons */}
        <div className="flex gap-1 flex-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5
                           transition-all min-h-[44px]
                           ${activeTab === tab.id
                             ? 'bg-brand-500/40 border border-brand-400 text-white'
                             : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/70'
                           }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* BPM Display + Close */}
        <div className="flex items-center gap-2 ml-3">
          {telemetry && (
            <div className="px-3 py-1 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
              <span className="text-lg font-bold text-cyan-400">{telemetry.bpm}</span>
              <span className="text-xs text-cyan-400/60 ml-1">BPM</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-3 overflow-y-auto max-h-[calc(75vh-120px)] sm:max-h-[calc(70vh-100px)] custom-scrollbar">

        {/* ===== DECKS TAB ===== */}
        {activeTab === 'decks' && (
          <div className="space-y-4">
            {/* 4-Channel Deck Grid */}
            <div>
              <div className="text-xs text-white/40 mb-2 tracking-wider">4-CHANNEL DECK SYSTEM</div>
              <div className="grid grid-cols-4 gap-2">
                {decks.map((deck) => {
                  const isActive = deck.mixMode !== 'off';
                  return (
                    <div
                      key={deck.id}
                      onClick={() => setExpandedDeck(expandedDeck === deck.id ? null : deck.id)}
                      className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-center
                                 ${isActive
                                   ? 'bg-cyan-500/10 border-cyan-500/50'
                                   : 'bg-white/5 border-white/10'
                                 }`}
                    >
                      <div className="text-xs text-white/50 mb-1">CH {deck.id + 1}</div>
                      <select
                        value={deck.mixMode}
                        onChange={(e) => { e.stopPropagation(); onDeckModeChange(deck.id, e.target.value as MixMode); }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-black/40 border border-white/10 text-white text-xs rounded p-1.5 min-h-[32px]"
                      >
                        {MIX_MODES.map((m) => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                      <div className={`w-2 h-2 rounded-full mx-auto mt-2 transition-all
                                      ${isActive ? 'bg-green-400 shadow-[0_0_8px_rgba(0,255,136,0.5)]' : 'bg-white/20'}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expanded Deck Details */}
            {expandedDeck !== null && (
              <DeckDetails
                deck={decks[expandedDeck]}
                onOpacityChange={(opacity) => onDeckOpacityChange(expandedDeck, opacity)}
                onLoad={() => onLoadDeck(expandedDeck)}
                onClose={() => setExpandedDeck(null)}
              />
            )}

            {/* BPM Control */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40 tracking-wider">BPM</span>
                <button
                  onClick={() => onAutoBPMChange(!autoBPM)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all min-h-[32px]
                             ${autoBPM
                               ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                               : 'bg-white/5 text-white/40 border border-white/10'
                             }`}
                >
                  {autoBPM ? 'AUTO' : 'MANUAL'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={bpm}
                  onChange={(e) => onBPMChange(parseInt(e.target.value))}
                  disabled={autoBPM}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-white/10 disabled:opacity-50"
                />
                <span className="text-2xl font-bold text-cyan-400 w-16 text-right">{bpm}</span>
              </div>

              {/* Bar Counter */}
              {telemetry && (
                <div className="flex gap-1 mt-3">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-sm transition-all
                                 ${i < telemetry.barCounter
                                   ? i % 4 === 0 ? 'bg-cyan-400' : 'bg-brand-500'
                                   : 'bg-white/10'
                                 }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Trigger Pads */}
            <div>
              <div className="text-xs text-white/40 mb-2 tracking-wider">TRIGGER PADS (hold)</div>
              <div className="grid grid-cols-4 gap-2">
                <TriggerPad label="STUTTER" shortcut="Q" color="yellow" onPress={() => onTriggerStutter(true)} onRelease={() => onTriggerStutter(false)} />
                <TriggerPad label="REVERSE" shortcut="W" color="blue" onPress={() => onTriggerReverse(true)} onRelease={() => onTriggerReverse(false)} />
                <TriggerPad label="GLITCH" shortcut="E" color="red" onPress={() => onTriggerGlitch(true)} onRelease={() => onTriggerGlitch(false)} />
                <TriggerPad label="BURST" shortcut="R" color="green" onPress={() => onTriggerBurst(true)} onRelease={() => onTriggerBurst(false)} />
              </div>
            </div>
          </div>
        )}

        {/* ===== ENGINE TAB ===== */}
        {activeTab === 'engine' && (
          <div className="space-y-4">
            {/* Physics Style Toggle */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="text-xs text-white/40 mb-2 tracking-wider">PHYSICS STYLE (how frames move)</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onPhysicsModeChange('LEGACY')}
                  className={`py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2
                             transition-all border-2 min-h-[48px]
                             ${physicsMode === 'LEGACY'
                               ? 'bg-orange-500/30 border-orange-400 text-orange-300 shadow-[0_0_15px_rgba(255,150,0,0.3)]'
                               : 'bg-white/5 border-white/10 text-white/50 hover:border-orange-500/50'
                             }`}
                >
                  <Zap className="w-5 h-5" />
                  LEGACY
                </button>
                <button
                  onClick={() => onPhysicsModeChange('LABAN')}
                  className={`py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2
                             transition-all border-2 min-h-[48px]
                             ${physicsMode === 'LABAN'
                               ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                               : 'bg-white/5 border-white/10 text-white/50 hover:border-cyan-500/50'
                             }`}
                >
                  <Brain className="w-5 h-5" />
                  LABAN
                </button>
              </div>

              {/* Laban Effort Display */}
              {physicsMode === 'LABAN' && labanEffort && (
                <div className="mt-3 p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <div className="text-white/40">WEIGHT</div>
                      <div className="text-cyan-400 font-bold">{labanEffort.weight.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-white/40">SPACE</div>
                      <div className="text-cyan-400 font-bold">{labanEffort.space.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-white/40">TIME</div>
                      <div className="text-cyan-400 font-bold">{labanEffort.time.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-white/40">FLOW</div>
                      <div className="text-cyan-400 font-bold">{labanEffort.flow.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Engine Mode Toggle */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="text-xs text-white/40 mb-2 tracking-wider">ENGINE MODE (which frame selected)</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onEngineModeChange('PATTERN')}
                  className={`py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2
                             transition-all border-2 min-h-[48px]
                             ${engineMode === 'PATTERN'
                               ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                               : 'bg-white/5 border-white/10 text-white/50 hover:border-cyan-500/50'
                             }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                  PATTERN
                </button>
                <button
                  onClick={() => onEngineModeChange('KINETIC')}
                  className={`py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2
                             transition-all border-2 min-h-[48px]
                             ${engineMode === 'KINETIC'
                               ? 'bg-purple-500/30 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                               : 'bg-white/5 border-white/10 text-white/50 hover:border-purple-500/50'
                             }`}
                >
                  <Brain className="w-5 h-5" />
                  KINETIC
                </button>
              </div>
            </div>

            {/* KINETIC: Sequence Mode */}
            {engineMode === 'KINETIC' && (
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-white/40 mb-2 tracking-wider">SEQUENCE MODE</div>
                <div className="grid grid-cols-4 gap-2">
                  {SEQUENCE_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => onSequenceModeChange(mode.id)}
                      className={`py-2.5 rounded-lg text-[10px] font-bold transition-all border min-h-[44px]
                                 ${sequenceMode === mode.id
                                   ? `${mode.color} text-white shadow-lg`
                                   : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                                 }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PATTERN: Pattern Grid */}
            {engineMode === 'PATTERN' && (
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-white/40 mb-2 tracking-wider">PATTERNS [1-0]</div>
                <div className="grid grid-cols-5 gap-1.5">
                  {PATTERNS.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => onPatternChange(p.id)}
                      title={p.desc}
                      className={`py-2.5 px-1 rounded-lg text-[9px] font-bold transition-all border min-h-[40px]
                                 ${activePattern === p.id
                                   ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                                   : 'bg-white/5 border-white/10 text-white/50 hover:border-cyan-500/50'
                                 }`}
                    >
                      {p.label}
                      {idx < 10 && <span className="block text-[7px] text-white/30 mt-0.5">[{(idx + 1) % 10}]</span>}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-center text-white/40 mt-2">
                  {PATTERNS.find((p) => p.id === activePattern)?.desc}
                </div>
              </div>
            )}

            {/* Intensity Slider */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40 tracking-wider">INTENSITY</span>
                <span className="text-sm font-bold text-brand-400">{Math.round(intensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={intensity}
                onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-brand-500/30 via-purple-500/30 to-red-500/30"
              />
              <div className="flex justify-between text-[9px] text-white/30 mt-1">
                <span>CHILL</span>
                <span>HYPE</span>
              </div>
            </div>
          </div>
        )}

        {/* ===== FX TAB ===== */}
        {activeTab === 'fx' && (
          <div className="space-y-4">
            {/* FX Toggles Grid */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40 tracking-wider">FX TOGGLES</span>
                {activeEffectCount > 0 && (
                  <button
                    onClick={onResetEffects}
                    className="text-[10px] px-2 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                  >
                    RESET ALL
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {FX_CONFIG.map(({ id, icon: Icon, label }) => {
                  const isActive = userEffects[id];
                  return (
                    <button
                      key={id}
                      onClick={() => onToggleEffect(id)}
                      className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1
                                 transition-all border-2 min-h-[60px]
                                 ${isActive
                                   ? 'bg-brand-500/30 border-brand-400 text-white shadow-lg'
                                   : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                                 }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-bold tracking-wider">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FX Sliders */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="text-xs text-white/40 mb-3 tracking-wider">FX INTENSITY</div>
              <div className="space-y-3">
                <FXSlider
                  label="RGB Split"
                  value={mixerEffects.rgbSplit}
                  onChange={(v) => onMixerEffectChange('rgbSplit', v)}
                  color="pink"
                />
                <FXSlider
                  label="Flash"
                  value={mixerEffects.flash}
                  onChange={(v) => onMixerEffectChange('flash', v)}
                  color="yellow"
                />
                <FXSlider
                  label="Glitch"
                  value={mixerEffects.glitch}
                  onChange={(v) => onMixerEffectChange('glitch', v)}
                  color="red"
                />
                <FXSlider
                  label="Scanlines"
                  value={mixerEffects.scanlines}
                  onChange={(v) => onMixerEffectChange('scanlines', v)}
                  color="green"
                />
              </div>
            </div>

            {/* Filter Sliders */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="text-xs text-white/40 mb-3 tracking-wider">FILTERS</div>
              <div className="space-y-3">
                <FXSlider
                  label="Hue Shift"
                  value={mixerEffects.hueShift / 360}
                  onChange={(v) => onMixerEffectChange('hueShift', v * 360)}
                  color="purple"
                  showValue={`${Math.round(mixerEffects.hueShift)}°`}
                />
                <FXSlider
                  label="Aberration"
                  value={mixerEffects.aberration}
                  onChange={(v) => onMixerEffectChange('aberration', v)}
                  color="cyan"
                  showValue={`${Math.round(mixerEffects.aberration * 100)}%`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Deck expanded details panel */
const DeckDetails: React.FC<{
  deck: DeckState;
  onOpacityChange: (opacity: number) => void;
  onLoad: () => void;
  onClose: () => void;
}> = ({ deck, onOpacityChange, onLoad, onClose }) => {
  const isActive = deck.mixMode !== 'off';

  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/10 animate-in slide-in-from-top-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold
                          ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/30'}`}>
            {deck.id + 1}
          </div>
          <span className="font-bold">{deck.rigName || `DECK ${deck.id + 1}`}</span>
          {deck.frameCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-400 rounded-full">
              {deck.frameCount} frames
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1 text-white/40 hover:text-white min-w-[32px] min-h-[32px] flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Opacity slider */}
      {isActive && (
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-white/40 w-16">OPACITY</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={deck.opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-white/10"
          />
          <span className="text-xs text-cyan-400 w-10 text-right">
            {Math.round(deck.opacity * 100)}%
          </span>
        </div>
      )}

      {/* Frame thumbnails or load button */}
      {deck.frames && deck.frames.length > 0 ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {deck.frames.slice(0, 8).map((frame, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-14 h-14 rounded-lg border border-white/10
                           bg-black/30 overflow-hidden hover:border-cyan-500/50 transition-all"
              >
                <img src={frame.url} alt={frame.pose} className="w-full h-full object-contain" />
              </div>
            ))}
            {deck.frames.length > 8 && (
              <div className="flex-shrink-0 w-14 h-14 rounded-lg border border-white/10
                             bg-white/5 flex items-center justify-center text-white/40 text-xs font-bold">
                +{deck.frames.length - 8}
              </div>
            )}
          </div>
          <button
            onClick={onLoad}
            className="w-full mt-2 py-2 rounded-lg bg-white/5 border border-white/10
                       text-white/60 hover:text-white hover:bg-white/10 transition-all
                       text-xs font-bold flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Layers className="w-4 h-4" />
            REPLACE RIG
          </button>
        </>
      ) : (
        <button
          onClick={onLoad}
          className="w-full py-4 rounded-lg border-2 border-dashed border-white/20
                     text-white/40 hover:border-cyan-500/50 hover:text-cyan-400
                     transition-all flex items-center justify-center gap-2 min-h-[60px]"
        >
          <Image className="w-5 h-5" />
          <span className="text-sm font-bold">LOAD RIG FILE</span>
        </button>
      )}
    </div>
  );
};

/** Trigger pad (hold to activate) */
const TriggerPad: React.FC<{
  label: string;
  shortcut: string;
  color: string;
  onPress: () => void;
  onRelease: () => void;
}> = ({ label, shortcut, color, onPress, onRelease }) => {
  const [isPressed, setIsPressed] = useState(false);

  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-500 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]',
    blue: 'bg-blue-500 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]',
    red: 'bg-red-500 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]',
    green: 'bg-green-500 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]'
  };

  const handleStart = () => {
    setIsPressed(true);
    onPress();
  };

  const handleEnd = () => {
    setIsPressed(false);
    onRelease();
  };

  return (
    <button
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={() => { if (isPressed) handleEnd(); }}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      className={`py-3 rounded-lg text-center font-bold transition-all border-2 select-none min-h-[52px]
                 ${isPressed
                   ? `${colorMap[color]} text-white scale-95`
                   : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'
                 }`}
    >
      <div className="text-[10px]">{label}</div>
      <div className="text-[8px] text-white/30 mt-0.5">[{shortcut}]</div>
    </button>
  );
};

/** FX slider component */
const FXSlider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
  showValue?: string;
}> = ({ label, value, onChange, color, showValue }) => {
  const colorMap: Record<string, string> = {
    pink: 'from-pink-500/30 to-pink-500/60',
    yellow: 'from-yellow-500/30 to-yellow-500/60',
    red: 'from-red-500/30 to-red-500/60',
    cyan: 'from-cyan-500/30 to-cyan-500/60',
    purple: 'from-purple-500/30 to-purple-500/60',
    green: 'from-green-500/30 to-green-500/60',
    white: 'from-white/20 to-white/40'
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/50 w-20 truncate">{label}</span>
      <div className="flex-1 relative">
        <div className="absolute inset-0 h-2 rounded-full bg-white/10 top-1/2 -translate-y-1/2" />
        <div
          className={`absolute left-0 h-2 rounded-full bg-gradient-to-r ${colorMap[color]} top-1/2 -translate-y-1/2`}
          style={{ width: `${value * 100}%` }}
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="relative w-full h-6 appearance-none cursor-pointer bg-transparent z-10"
        />
      </div>
      <span className="text-xs text-white/40 w-12 text-right">
        {showValue || `${Math.round(value * 100)}%`}
      </span>
    </div>
  );
};

export default UnifiedMixerPanel;
