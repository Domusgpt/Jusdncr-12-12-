
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Activity, Download, CircleDot, Monitor, Smartphone, Square, X, FileVideo, Copy, RefreshCw, QrCode, Link2, Clipboard } from 'lucide-react';
import { AppState, EnergyLevel, MoveDirection, FrameType, GeneratedFrame } from '../types';
import { QuantumVisualizer } from './Visualizer/HolographicVisualizer';
import { generatePlayerHTML } from '../services/playerExport';
import { createQrForTarget, QRTarget } from '../services/qrCodes';
import { STYLE_PRESETS } from '../constants';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { useEnhancedChoreography, ChoreographyState } from '../hooks/useEnhancedChoreography';
import { LabanEffort, DanceStyle } from '../engine/LabanEffortSystem';
import { FXState } from './UnifiedMixerPanel';
import { TelemetryService } from '../services/telemetry/TelemetryService';
// New UI Components
import { StatusBar } from './StatusBar';
import { FXRail, FXAxisMapping, FXKey } from './FXRail';
import { EngineStrip } from './EngineStrip';
import { MixerDrawer } from './MixerDrawer';
import { AnimationZoneController } from './AnimationZoneController';
import {
  GolemMixer, createGolemMixer,
  EngineMode, SequenceMode, PatternType, MixMode, EffectsState, MixerTelemetry
} from '../engine/GolemMixer';

interface Step4Props {
  state: AppState;
  onGenerateMore: () => void;
  onSpendCredit: (amount: number) => boolean;
  onUploadAudio: (file: File | null) => void;
  onSetAudioLink: (url: string) => void;
  onSaveProject: () => void;
}

type AspectRatio = '9:16' | '1:1' | '16:9';
type Resolution = '720p' | '1080p' | '4K';

type RhythmPhase = 'AMBIENT' | 'WARMUP' | 'SWING_LEFT' | 'SWING_RIGHT' | 'DROP' | 'CHAOS';

// Interpolation Modes
type InterpMode = 'CUT' | 'SLIDE' | 'MORPH' | 'SMOOTH' | 'ZOOM_IN';
type FXMode = 'NORMAL' | 'INVERT' | 'BW' | 'STROBE' | 'GHOST';

interface FrameData {
    url: string;
    pose: string;
    energy: EnergyLevel;
    direction?: MoveDirection;
    isVirtual?: boolean;
    virtualZoom?: number; 
    virtualOffsetY?: number;
    type?: FrameType;
}

export const Step4Preview: React.FC<Step4Props> = ({ state, onGenerateMore, onSpendCredit, onUploadAudio, onSetAudioLink, onSaveProject }) => {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const charCanvasRef = useRef<HTMLCanvasElement>(null); 
  const containerRef = useRef<HTMLDivElement>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const exportStartRef = useRef<number | null>(null);
  
  // -- Audio Hook --
  const {
    audioDestRef,
    isMicActive,
    connectFileAudio,
    connectMicAudio,
    disconnectMic,
    getFrequencyData,
    analyserRef
  } = useAudioAnalyzer();

  // -- Enhanced Choreography Hook --
  const {
    processAudio,
    updateFramePools,
    selectFrame,
    getBPM,
    getBeatCount,
    reset: resetChoreography
  } = useEnhancedChoreography();

  // Enhanced choreography state
  const choreographyStateRef = useRef<ChoreographyState | null>(null);
  const useEnhancedModeRef = useRef<boolean>(true); // Toggle for enhanced vs legacy mode
  const [choreoMode, setChoreoMode] = useState<'LABAN' | 'LEGACY'>('LABAN');

  // Sync state with ref
  const toggleChoreoMode = () => {
    const newMode = choreoMode === 'LABAN' ? 'LEGACY' : 'LABAN';
    setChoreoMode(newMode);
    useEnhancedModeRef.current = newMode === 'LABAN';
  };

  const [isRecording, setIsRecording] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [qrTarget, setQrTarget] = useState<QRTarget>('preview');
  const [shareLink, setShareLink] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrIsLoading, setQrIsLoading] = useState(false);
  const [qrStatus, setQrStatus] = useState<string | null>(null);

  // New UI panel states
  const [isMixerDrawerOpen, setIsMixerDrawerOpen] = useState(false);
  const [showStreamLinkInput, setShowStreamLinkInput] = useState(false);
  const [streamLink, setStreamLink] = useState(state.audioSourceType === 'url' ? state.audioPreviewUrl || '' : '');
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const [isLinkLoading, setIsLinkLoading] = useState(false);

  // FX X/Y axis mapping state
  const [fxAxisMapping, setFxAxisMapping] = useState<FXAxisMapping>({
    x: ['rgbSplit', 'shake'],
    y: ['glitch', 'zoom']
  });
  const [fxIntensity, setFxIntensity] = useState({ x: 0, y: 0 });

  const [exportRatio, setExportRatio] = useState<AspectRatio>('9:16');

  // GolemMixer Engine Instance
  const golemMixerRef = useRef<GolemMixer | null>(null);

  // Initialize GolemMixer
  useEffect(() => {
    if (!golemMixerRef.current) {
      golemMixerRef.current = createGolemMixer();
    }
  }, []);

  // GolemMixer UI State
  const [golemState, setGolemState] = useState({
    engineMode: 'KINETIC' as EngineMode,
    activePattern: 'PING_PONG' as PatternType,
    sequenceMode: 'GROOVE' as SequenceMode,
    bpm: 120,
    autoBPM: true,
    effects: {
      rgbSplit: 0,
      flash: 0,
      glitch: 0,
      scanlines: 0,
      hueShift: 0,
      aberration: 0,
      invert: false,
      grayscale: false,
      mirror: false,
      strobe: false
    } as EffectsState,
    decks: [
      { id: 0, name: 'Deck 1', isActive: true, mixMode: 'sequencer' as MixMode, opacity: 1, frameCount: 0, rigName: undefined as string | undefined, frames: [] as GeneratedFrame[] },
      { id: 1, name: 'Deck 2', isActive: false, mixMode: 'off' as MixMode, opacity: 1, frameCount: 0, rigName: undefined as string | undefined, frames: [] as GeneratedFrame[] },
      { id: 2, name: 'Deck 3', isActive: false, mixMode: 'off' as MixMode, opacity: 1, frameCount: 0, rigName: undefined as string | undefined, frames: [] as GeneratedFrame[] },
      { id: 3, name: 'Deck 4', isActive: false, mixMode: 'off' as MixMode, opacity: 1, frameCount: 0, rigName: undefined as string | undefined, frames: [] as GeneratedFrame[] }
    ],
    telemetry: null as MixerTelemetry | null
  });

  // Deck file input refs for loading rigs
  const deckInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);
  const [exportRes, setExportRes] = useState<Resolution>('1080p');

  // User-controlled effects state
  const [userEffects, setUserEffects] = useState({
    rgbSplit: false,
    strobe: false,
    ghost: false,
    invert: false,
    bw: false,
    scanlines: false,
    glitch: false,
    shake: false,
    zoom: false
  });
  const userEffectsRef = useRef(userEffects);

  // Keep userEffects ref in sync
  useEffect(() => {
    userEffectsRef.current = userEffects;
  }, [userEffects]);

  // Toggle an effect
  const toggleEffect = (effect: keyof typeof userEffects) => {
    setUserEffects(prev => ({ ...prev, [effect]: !prev[effect] }));
  };

  // Reset all user effects
  const resetUserEffects = () => {
    setUserEffects({
      rgbSplit: false, strobe: false, ghost: false,
      invert: false, bw: false, scanlines: false,
      glitch: false, shake: false, zoom: false
    });
  };

  const refreshQr = useCallback(async (target: QRTarget) => {
    setQrIsLoading(true);
    setQrError(null);
    setQrStatus(null);
    try {
      const { link, dataUrl } = await createQrForTarget(target, {
        userId: state.user?.uid,
        projectId: state.user?.uid ? `${state.user.uid}-deck` : undefined,
        campaign: target === 'paywall' ? 'upgrade' : 'preview'
      });
      setShareLink(link);
      setQrDataUrl(dataUrl);
      setQrStatus('QR ready to scan');
    } catch (err) {
      console.error('Failed generating QR', err);
      setQrError('Could not generate QR. Try again.');
    } finally {
      setQrIsLoading(false);
    }
  }, [state.user]);

  const copyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setQrStatus('Link copied to clipboard');
    } catch (err) {
      console.error('copy failed', err);
      setQrError('Copy failed.');
    }
  };

  useEffect(() => {
    if (showExportMenu) {
      refreshQr(qrTarget);
    }
  }, [showExportMenu, qrTarget, refreshQr]);

  // Handle FX intensity from touch position
  const handleFXIntensityChange = useCallback((intensity: { x: number; y: number }) => {
    setFxIntensity(intensity);

    // Apply X-axis mapped effects
    fxAxisMapping.x.forEach(fx => {
      if (userEffects[fx]) {
        if (fx === 'rgbSplit') rgbSplitRef.current = intensity.x * 0.8;
        if (fx === 'shake') charBounceYRef.current = (Math.random() - 0.5) * intensity.x * 30;
        if (fx === 'zoom') camZoomRef.current = BASE_ZOOM + intensity.x * 0.3;
        if (fx === 'glitch') charSkewRef.current = (Math.random() - 0.5) * intensity.x;
      }
    });

    // Apply Y-axis mapped effects
    fxAxisMapping.y.forEach(fx => {
      if (userEffects[fx]) {
        if (fx === 'rgbSplit') rgbSplitRef.current = Math.max(rgbSplitRef.current, intensity.y * 0.8);
        if (fx === 'shake') charBounceYRef.current = Math.max(charBounceYRef.current, (Math.random() - 0.5) * intensity.y * 30);
        if (fx === 'zoom') camZoomRef.current = Math.max(camZoomRef.current, BASE_ZOOM + intensity.y * 0.3);
        if (fx === 'glitch') charSkewRef.current = Math.max(charSkewRef.current, (Math.random() - 0.5) * intensity.y);
        if (fx === 'strobe') flashIntensityRef.current = intensity.y * 0.5;
      }
    });

    // Reset effects when no touch
    if (intensity.x === 0 && intensity.y === 0) {
      rgbSplitRef.current = 0;
      charBounceYRef.current = 0;
      charSkewRef.current = 0;
      camZoomRef.current = BASE_ZOOM;
      flashIntensityRef.current = 0;
    }
  }, [fxAxisMapping, userEffects]);

  // Intensity state (replaces PressurePaddle)
  const [intensity, setIntensity] = useState(0);
  const intensityRef = useRef(0);

  // Keep intensity ref in sync
  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  // File input ref for track change
  const trackInputRef = useRef<HTMLInputElement>(null);
  const handleTrackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadAudio(file);
      setIsPlaying(false);
      // Reset audio element
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
    }
  };

  const handleStreamLinkSubmit = () => {
    const trimmed = streamLink.trim();
    if (!trimmed) return;
    setIsLinkLoading(true);
    onSetAudioLink(trimmed);
    setIsPlaying(true);
    setShowStreamLinkInput(false);
    setStreamStatus('Stream linked for playback');
    setTimeout(() => setStreamStatus(null), 2500);
    setIsLinkLoading(false);
  };

  const handlePasteStreamLink = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setStreamLink(text);
        setStreamStatus('Pasted from clipboard');
        setTimeout(() => setStreamStatus(null), 2000);
      }
    } catch (e) {
        console.error('Clipboard read failed', e);
        setStreamStatus('Clipboard blocked by browser');
    }
  };

  useEffect(() => {
    if (state.audioSourceType === 'url' && state.audioPreviewUrl) {
      setStreamLink(state.audioPreviewUrl);
    }
  }, [state.audioPreviewUrl, state.audioSourceType]);


  // === GOLEM MIXER HANDLERS ===
  const handleDeckModeChange = (deckId: number, mode: MixMode) => {
    if (golemMixerRef.current) {
      golemMixerRef.current.setDeckMode(deckId, mode);
      setGolemState(s => ({
        ...s,
        decks: s.decks.map(d => d.id === deckId ? { ...d, mixMode: mode, isActive: mode !== 'off' } : d)
      }));
    }
  };

  const handleDeckOpacityChange = (deckId: number, opacity: number) => {
    if (golemMixerRef.current) {
      golemMixerRef.current.setDeckOpacity(deckId, opacity);
      setGolemState(s => ({
        ...s,
        decks: s.decks.map(d => d.id === deckId ? { ...d, opacity } : d)
      }));
    }
  };

  const handleLoadDeck = (deckId: number) => {
    // Trigger file input for this deck
    deckInputRefs.current[deckId]?.click();
  };

  const handleDeckFileChange = async (deckId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !golemMixerRef.current) return;

    try {
      const text = await file.text();
      const project = JSON.parse(text);
      if (project.frames && Array.isArray(project.frames)) {
        console.log(`[DECK ${deckId}] Loading ${project.frames.length} frames from ${file.name}`);

        // Load frames into GolemMixer - this also sets mode to 'sequencer'
        golemMixerRef.current.loadDeck(deckId, project.frames, project.subjectCategory || 'CHARACTER');

        // Preload ALL images into poseImagesRef with deck-prefixed keys
        // Key format: "${deckId}_${pose}" for deck-specific frames
        // Also store by pose name alone for compatibility
        const newImages: Record<string, HTMLImageElement> = {};
        let loadedCount = 0;
        const totalFrames = project.frames.length;

        project.frames.forEach((frame: GeneratedFrame) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            loadedCount++;
            if (loadedCount === totalFrames) {
              console.log(`[DECK ${deckId}] All ${totalFrames} images loaded`);
            }
          };
          img.onerror = () => {
            console.warn(`[DECK ${deckId}] Failed to load: ${frame.pose}`);
            loadedCount++;
          };
          img.src = frame.url;
          // Store with deck-prefixed key (primary)
          newImages[`${deckId}_${frame.pose}`] = img;
          // Also store by pose name alone (fallback)
          newImages[frame.pose] = img;
        });

        // Merge new images into poseImagesRef
        poseImagesRef.current = { ...poseImagesRef.current, ...newImages };
        console.log(`[DECK ${deckId}] poseImagesRef now has ${Object.keys(poseImagesRef.current).length} keys`);

        // Update state - FORCE mode to sequencer
        setGolemState(s => ({
          ...s,
          decks: s.decks.map(d => d.id === deckId ? {
            ...d,
            isActive: true,
            mixMode: 'sequencer', // Force sequencer mode when loading
            frameCount: project.frames.length,
            rigName: file.name.replace('.json', ''),
            frames: project.frames
          } : d)
        }));

        // Also ensure GolemMixer has the deck in sequencer mode
        golemMixerRef.current.setDeckMode(deckId, 'sequencer');
        console.log(`[DECK ${deckId}] Mode set to SEQUENCER`);
      }
    } catch (err) {
      console.error('Failed to load rig:', err);
    }
  };

  const handleEngineModeChange = (mode: EngineMode) => {
    if (golemMixerRef.current) {
      golemMixerRef.current.setEngineMode(mode);
      setGolemState(s => ({ ...s, engineMode: mode }));
    }
  };

  const handlePatternChange = (pattern: PatternType) => {
    if (golemMixerRef.current) {
      golemMixerRef.current.setPattern(pattern);
      setGolemState(s => ({ ...s, activePattern: pattern }));
    }
  };

  const handleSequenceModeChange = (mode: SequenceMode) => {
    if (golemMixerRef.current) {
      golemMixerRef.current.setSequenceMode(mode);
      setGolemState(s => ({ ...s, sequenceMode: mode }));
    }
  };

  const handleBPMChange = (bpm: number) => {
    if (golemMixerRef.current) {
      golemMixerRef.current.setBPM(bpm);
      setGolemState(s => ({ ...s, bpm }));
    }
  };

  const handleAutoBPMChange = (auto: boolean) => {
    if (golemMixerRef.current) {
      golemMixerRef.current.setAutoBPM(auto);
      setGolemState(s => ({ ...s, autoBPM: auto }));
    }
  };

  const handleEffectChange = <K extends keyof EffectsState>(key: K, value: EffectsState[K]) => {
    if (golemMixerRef.current) {
      golemMixerRef.current.setEffect(key, value);
      setGolemState(s => ({ ...s, effects: { ...s.effects, [key]: value } }));
    }
  };

  // Load current frames into deck 0 when frames change
  useEffect(() => {
    if (golemMixerRef.current && state.generatedFrames.length > 0) {
      golemMixerRef.current.loadDeck(0, state.generatedFrames, state.subjectCategory);
      setGolemState(s => ({
        ...s,
        decks: s.decks.map(d => d.id === 0 ? {
          ...d,
          isActive: true,
          mixMode: 'sequencer',
          frameCount: state.generatedFrames.length,
          rigName: 'Current Golem',
          frames: state.generatedFrames // Include frames for thumbnails
        } : d)
      }));
    }
  }, [state.generatedFrames, state.subjectCategory]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaRecorderFormatRef = useRef<{ mimeType: string; ext: string }>({ mimeType: 'video/webm;codecs=vp9', ext: 'webm' });
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordCanvasRef = useRef<HTMLCanvasElement>(null); 
  const [recordingTime, setRecordingTime] = useState(0);

  const hologramRef = useRef<QuantumVisualizer | null>(null);
  
  const requestRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0); 
  const lastBeatTimeRef = useRef<number>(0);
  const lastStutterTimeRef = useRef<number>(0);
  
  const [brainState, setBrainState] = useState({
    activePoseName: 'BASE',
    fps: 0,
    effort: 'GLIDE' as LabanEffort,
    danceStyle: 'HOUSE' as DanceStyle,
    bpm: 120,
    phraseSection: 'INTRO' as string
  });
  const [hoveredFrame, setHoveredFrame] = useState<FrameData | null>(null); // For Tooltip

  // --- INTERPOLATION STATE ---
  const sourcePoseRef = useRef<string>('base');
  const targetPoseRef = useRef<string>('base');
  const sourceDeckIdRef = useRef<number>(0);
  const targetDeckIdRef = useRef<number>(0);
  const transitionProgressRef = useRef<number>(1.0);
  const transitionSpeedRef = useRef<number>(10.0);
  const transitionModeRef = useRef<InterpMode>('CUT');

  // --- DYNAMIC CHOREOGRAPHY STATE ---
  const energyHistoryRef = useRef<number[]>(new Array(30).fill(0));
  const beatCounterRef = useRef<number>(0); 
  const closeupLockTimeRef = useRef<number>(0); 
  const currentDirectionRef = useRef<MoveDirection>('center');

  const BASE_ZOOM = 1.15;
  const camZoomRef = useRef<number>(BASE_ZOOM);
  const camPanXRef = useRef<number>(0); 
  
  // Physics
  const charSquashRef = useRef<number>(1.0); 
  const charSkewRef = useRef<number>(0.0);   
  const charTiltRef = useRef<number>(0.0);   
  const targetTiltRef = useRef<number>(0.0); 
  const charBounceYRef = useRef<number>(0.0); 

  const masterRotXRef = useRef<number>(0); 
  const masterVelXRef = useRef<number>(0); 
  const masterRotYRef = useRef<number>(0); 
  const masterVelYRef = useRef<number>(0); 
  const masterRotZRef = useRef<number>(0); 
  const masterVelZRef = useRef<number>(0); 
  
  // FX
  const ghostAmountRef = useRef<number>(0); 
  const echoTrailRef = useRef<number>(0); 
  const fluidStutterRef = useRef<number>(0); 
  const scratchModeRef = useRef<boolean>(false);
  const rgbSplitRef = useRef<number>(0); 
  const flashIntensityRef = useRef<number>(0); 
  const activeFXModeRef = useRef<FXMode>('NORMAL'); 
  
  const [framesByEnergy, setFramesByEnergy] = useState<Record<EnergyLevel, FrameData[]>>({ low: [], mid: [], high: [] });
  const [closeupFrames, setCloseupFrames] = useState<FrameData[]>([]); 
  const [allProcessedFrames, setAllProcessedFrames] = useState<FrameData[]>([]); // For Deck
  const [frameCount, setFrameCount] = useState(0);

  const poseImagesRef = useRef<Record<string, HTMLImageElement>>({}); 
  const [imagesReady, setImagesReady] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [superCamActive, setSuperCamActive] = useState(true);

  useEffect(() => {
    const audioEl = audioElementRef.current;
    if (!audioEl) return;

    if (!state.audioPreviewUrl) {
      audioEl.pause();
      audioEl.removeAttribute('src');
      audioEl.load();
      return;
    }

    let statusTimer: number | null = null;
    const handleReady = () => {
      setStreamStatus('Stream ready');
      statusTimer = window.setTimeout(() => setStreamStatus(null), 2000);
      if (isPlaying) {
        audioEl.play().catch(() => setStreamStatus('Playback blocked; press play to start'));
      }
    };

    const handleError = () => {
      setStreamStatus('Stream blocked or unsupported. Use HTTPS MP3/AAC links.');
      TelemetryService.trackAudioStreamError({
        sourceType: state.audioSourceType ?? 'unknown',
        url: state.audioPreviewUrl ?? 'unknown',
        code: audioEl.error?.code ?? null
      });
    };

    audioEl.crossOrigin = 'anonymous';
    audioEl.src = state.audioPreviewUrl;
    audioEl.addEventListener('canplay', handleReady);
    audioEl.addEventListener('error', handleError);
    audioEl.load();

    if (isPlaying) {
      audioEl.play().catch(() => setStreamStatus('Playback blocked; press play to start'));
    }

    return () => {
      audioEl.removeEventListener('canplay', handleReady);
      audioEl.removeEventListener('error', handleError);
      if (statusTimer) window.clearTimeout(statusTimer);
    };
  }, [state.audioPreviewUrl, isPlaying]);

  // 1. Initialize Hologram
  useEffect(() => {
    if (bgCanvasRef.current && !hologramRef.current) {
        try {
            hologramRef.current = new QuantumVisualizer(bgCanvasRef.current);
            const style = STYLE_PRESETS.find(s => s.id === state.selectedStyleId);
            if(style && style.hologramParams) {
                hologramRef.current.params = {...style.hologramParams};
            }
        } catch (e) { console.error("Failed to init hologram:", e); }
    }
    if (containerRef.current && hologramRef.current) {
        const resizeObserver = new ResizeObserver(() => {
            if (hologramRef.current) hologramRef.current.resize();
            if (charCanvasRef.current && containerRef.current) {
                charCanvasRef.current.width = containerRef.current.clientWidth;
                charCanvasRef.current.height = containerRef.current.clientHeight;
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }
  }, [state.selectedStyleId]);

  // Sort Frames and Create VIRTUAL STITCHES
  useEffect(() => {
    const sorted: Record<EnergyLevel, FrameData[]> = { low: [], mid: [], high: [] };
    const closeups: FrameData[] = [];
    const allProcessed: FrameData[] = [];

    const framesToLoad = state.generatedFrames.length > 0 
      ? state.generatedFrames 
      : (state.imagePreviewUrl ? [{ url: state.imagePreviewUrl, pose: 'base', energy: 'low' as EnergyLevel, type: 'body' as FrameType, direction: 'center' as MoveDirection }] : []);

    setFrameCount(framesToLoad.length);

    framesToLoad.forEach(f => {
        const frameData: FrameData = { url: f.url, pose: f.pose, energy: f.energy, direction: f.direction, type: f.type };
        allProcessed.push(frameData);

        if (f.type === 'closeup') closeups.push(frameData);
        else {
            if (sorted[f.energy]) sorted[f.energy].push(frameData);
            
            // --- VIRTUAL CAMERA STITCHING ---
            if (f.energy === 'high' && f.type === 'body') {
                const vFrame = {
                    url: f.url,
                    pose: f.pose + '_vzoom',
                    energy: 'high' as EnergyLevel,
                    direction: f.direction,
                    isVirtual: true,
                    virtualZoom: 1.6,
                    virtualOffsetY: 0.2,
                    type: f.type
                };
                closeups.push(vFrame);
                // We don't push virtual to allProcessed for deck visibility to keep deck clean, 
                // or we could if we want to show zoom options. Let's keep deck clean.
            }
            if (f.energy === 'mid' && f.type === 'body') {
                const vFrame = {
                    url: f.url,
                    pose: f.pose + '_vmid',
                    energy: 'mid' as EnergyLevel,
                    direction: f.direction,
                    isVirtual: true,
                    virtualZoom: 1.25,
                    virtualOffsetY: 0.1, 
                    type: f.type
                };
                sorted.mid.push(vFrame);
            }
        }
    });
    
    if (sorted.low.length === 0 && framesToLoad.length > 0 && framesToLoad[0].type === 'body') {
        sorted.low.push({ url: framesToLoad[0].url, pose: framesToLoad[0].pose, energy: 'low', direction: 'center', type: 'body' });
    }
    if (sorted.mid.length === 0) sorted.mid = [...sorted.low]; 
    if (sorted.high.length === 0) sorted.high = [...sorted.mid];

    setFramesByEnergy(sorted);
    setCloseupFrames(closeups);
    setAllProcessedFrames(allProcessed);

    let loadedCount = 0;
    const images: Record<string, HTMLImageElement> = {};
    const totalToLoad = framesToLoad.length;
    if (totalToLoad === 0) { setImagesReady(true); return; }
    
    framesToLoad.forEach(frame => {
       if(poseImagesRef.current[frame.pose]) {
           images[frame.pose] = poseImagesRef.current[frame.pose];
           loadedCount++;
           if(loadedCount >= totalToLoad) setImagesReady(true);
           return;
       }
       const img = new Image();
       img.crossOrigin = "anonymous"; 
       img.src = frame.url;
       
       const markLoaded = () => {
           loadedCount++;
           if (loadedCount >= totalToLoad) setImagesReady(true);
       }
       
       img.onload = markLoaded;
       img.onerror = () => { 
           console.warn(`Failed to load frame: ${frame.pose}`); 
           markLoaded();
       };
       
       images[frame.pose] = img;
       if (frame.energy === 'high' && frame.type === 'body') images[frame.pose + '_vzoom'] = img; 
       if (frame.energy === 'mid' && frame.type === 'body') images[frame.pose + '_vmid'] = img;
    });
    poseImagesRef.current = { ...poseImagesRef.current, ...images };

    // Update enhanced choreography frame pools
    const framesForPools: GeneratedFrame[] = framesToLoad.map(f => ({
      url: f.url,
      pose: f.pose,
      energy: f.energy,
      direction: f.direction || 'center',
      type: f.type || 'body'
    }));
    updateFramePools(framesForPools);
  }, [state.generatedFrames, state.imagePreviewUrl, updateFramePools]);

  const toggleMic = () => {
      if (isMicActive) {
          disconnectMic();
      } else {
          setIsPlaying(false);
          if (audioElementRef.current) audioElementRef.current.pause();
          connectMicAudio();
      }
  };

  // Helper to trigger a Smart Transition with deck tracking
  const triggerTransition = (newPose: string, mode: InterpMode, speedMultiplier: number = 1.0, deckId: number = 0) => {
      if (newPose === targetPoseRef.current && deckId === targetDeckIdRef.current) return;

      sourcePoseRef.current = targetPoseRef.current;
      sourceDeckIdRef.current = targetDeckIdRef.current;
      targetPoseRef.current = newPose;
      targetDeckIdRef.current = deckId;
      transitionProgressRef.current = 0.0;
      transitionModeRef.current = mode;
      
      let speed = 20.0;
      if (mode === 'CUT') speed = 1000.0; // Instant
      else if (mode === 'MORPH') speed = 5.0; // Fast crossfade
      else if (mode === 'ZOOM_IN') speed = 6.0; // Rapid Zoom
      else if (mode === 'SLIDE') speed = 8.0; // Fluid
      else if (mode === 'SMOOTH') speed = 1.5; // Slow interpolation (Ambient)
      
      transitionSpeedRef.current = speed * speedMultiplier;
  };

  // 3. Animation Loop
  const loop = useCallback((time: number) => {
    if (!lastFrameTimeRef.current) lastFrameTimeRef.current = time;
    const deltaTime = Math.min((time - lastFrameTimeRef.current) / 1000, 0.1); 
    lastFrameTimeRef.current = time;

    requestRef.current = requestAnimationFrame(loop);

    // --- TRANSITION UPDATE ---
    if (transitionProgressRef.current < 1.0) {
        transitionProgressRef.current += transitionSpeedRef.current * deltaTime;
        if (transitionProgressRef.current > 1.0) transitionProgressRef.current = 1.0;
    }

    // Get Audio Data - use enhanced mode if available
    let bass = 0, mid = 0, high = 0, energy = 0;
    let choreoState: ChoreographyState | null = null;

    if (useEnhancedModeRef.current && analyserRef.current) {
        // Get raw frequency data for enhanced analyzer
        const bufferLength = analyserRef.current.frequencyBinCount;
        const frequencyData = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(frequencyData);

        // Process with enhanced choreography system
        choreoState = processAudio(frequencyData, time);
        choreographyStateRef.current = choreoState;

        bass = choreoState.audio.bass;
        mid = choreoState.audio.mid;
        high = choreoState.audio.high;
        energy = choreoState.audio.energy;
    } else {
        // Legacy mode
        const audioData = getFrequencyData();
        bass = audioData.bass;
        mid = audioData.mid;
        high = audioData.high;
        energy = audioData.energy;
    }
    
    // --- DYNAMIC CHOREOGRAPHY ANALYSIS ---
    energyHistoryRef.current.shift();
    energyHistoryRef.current.push(energy);
    const avgEnergy = energyHistoryRef.current.reduce((a, b) => a + b, 0) / energyHistoryRef.current.length;
    const energyTrend = energy - avgEnergy;

    // --- PHYSICS (Enhanced with Laban modifiers) ---
    let stiffness = 140;
    let damping = 8;
    let maxRotation = 35;
    let bounceIntensity = 1.0;

    // Apply Laban-based physics modifiers when in enhanced mode
    if (choreoState && useEnhancedModeRef.current) {
        const physics = choreoState.physics;
        stiffness = physics.stiffness;
        damping = physics.damping;
        maxRotation = physics.maxRotation;
        bounceIntensity = physics.bounceIntensity;
    }

    const targetRotX = bass * maxRotation * bounceIntensity;
    const targetRotY = mid * (maxRotation * 0.7) * Math.sin(time * 0.005);
    const targetRotZ = high * (maxRotation * 0.4); 

    // Spring Solver
    masterVelXRef.current += ((targetRotX - masterRotXRef.current) * stiffness - (masterVelXRef.current * damping)) * deltaTime;
    masterRotXRef.current += masterVelXRef.current * deltaTime;

    masterVelYRef.current += ((targetRotY - masterRotYRef.current) * (stiffness * 0.5) - (masterVelYRef.current * (damping * 0.8))) * deltaTime;
    masterRotYRef.current += masterVelYRef.current * deltaTime;

    masterVelZRef.current += ((targetRotZ - masterRotZRef.current) * stiffness - (masterVelZRef.current * damping)) * deltaTime;
    masterRotZRef.current += masterVelZRef.current * deltaTime;

    if (hologramRef.current) {
        hologramRef.current.updateAudio({ bass, mid, high, energy });
        const rx = superCamActive ? masterRotXRef.current * 0.3 : 0;
        const ry = superCamActive ? masterRotYRef.current * 0.3 : 0;
        const rz = superCamActive ? masterRotZRef.current * 0.2 : 0;
        hologramRef.current.render(0, { x: rx, y: ry, z: rz }); 
    }

    const now = Date.now();
    const isCloseupLocked = now < closeupLockTimeRef.current;

    // --- STUTTER & SCRATCH ENGINE (Tuned: less aggressive) ---
    // Only stutter on VERY high energy moments, not constant mid/high
    const isStuttering = (mid > 0.8 && high > 0.7 && bass > 0.5) && !isCloseupLocked;

    // Increased cooldown from 50ms to 200ms - less frantic
    if (isStuttering && (now - lastStutterTimeRef.current) > 200) {
        lastStutterTimeRef.current = now;

        // Reduced probability from 0.35 to 0.2
        if (Math.random() < 0.2) {
             const swap = targetPoseRef.current;
             triggerTransition(sourcePoseRef.current, 'CUT');
             sourcePoseRef.current = swap;

             charSkewRef.current = (Math.random() - 0.5) * 1.0; // Reduced from 2.0
             fluidStutterRef.current = 0.5; // Reduced from 1.0
             scratchModeRef.current = true;
             rgbSplitRef.current = 0.4; // Reduced from 1.0
             masterRotZRef.current += (Math.random() - 0.5) * 5; // Reduced from 10
        } else {
             const pool = [...framesByEnergy.high];
             if(pool.length > 0) {
                 const next = pool[Math.floor(Math.random() * pool.length)].pose;
                 triggerTransition(next, 'SLIDE', 1.0); // Changed from CUT to SLIDE
             }
             scratchModeRef.current = false;
        }
    }

    // --- ENHANCED CHOREOGRAPHY MODE ---
    // Use motion grammar and Laban effort for frame selection when enabled
    // NOTE: This is now a fallback if GolemMixer doesn't handle the transition

    // --- GOLEM MIXER ENGINE ---
    // Call GolemMixer.update() to get frame selection from KINETIC or PATTERN mode
    let golemMixerHandled = false;
    if (golemMixerRef.current && golemState.engineMode) {
        const audioData = {
            bass,
            mid,
            high,
            energy,
            timestamp: now
        };

        const mixerOutput = golemMixerRef.current.update(audioData);

        // Update telemetry
        const telemetry = golemMixerRef.current.getTelemetry();
        if (telemetry.bpm !== golemState.bpm || telemetry.barCounter !== (golemState.telemetry?.barCounter ?? -1)) {
            setGolemState(s => ({ ...s, bpm: telemetry.bpm, telemetry }));
        }

        // Use GolemMixer's frame selection if it actively selected a frame this cycle
        // didSelectFrame is true when a beat was detected and triggerFrame was called
        // This allows fallback choreography to run when GolemMixer is idle (no beat)
        if (mixerOutput.didSelectFrame && mixerOutput.frame) {
            golemMixerHandled = true;

            const frameDeckId = mixerOutput.frame.deckId ?? mixerOutput.deckId ?? 0;

            // Only trigger visual transition if pose or deck changed
            // But always apply physics/effects for beat feedback
            if (mixerOutput.frame.pose !== targetPoseRef.current || frameDeckId !== targetDeckIdRef.current) {
                triggerTransition(mixerOutput.frame.pose, mixerOutput.transitionMode as InterpMode, 1.0, frameDeckId);
            }

            // Apply GolemMixer physics (always apply for beat feedback)
            charSquashRef.current = mixerOutput.physics.squash;
            charBounceYRef.current = mixerOutput.physics.bounce * bass * -30;
            targetTiltRef.current = mixerOutput.physics.tilt;
            camZoomRef.current = BASE_ZOOM + (mixerOutput.physics.zoom * 0.3);

            // Apply GolemMixer effects
            if (mixerOutput.effects.flash > 0) flashIntensityRef.current = mixerOutput.effects.flash;
            if (mixerOutput.effects.rgbSplit > 0) rgbSplitRef.current = mixerOutput.effects.rgbSplit;
            if (mixerOutput.effects.glitch > 0.5) charSkewRef.current = (Math.random() - 0.5) * mixerOutput.effects.glitch;

            // Update beat counter from GolemMixer
            beatCounterRef.current = telemetry.barCounter;
        }
    }

    // Only use Laban/enhanced choreography if GolemMixer didn't handle it
    if (!golemMixerHandled && choreoState && useEnhancedModeRef.current && choreoState.shouldTransition) {
        const currentPose = targetPoseRef.current;
        const selection = selectFrame(choreoState, currentPose);

        if (selection.frame && selection.frame.pose !== currentPose) {
            // Use the transition mode from the motion grammar
            const mode = selection.transitionMode;

            // Apply physics boost from current move
            if (choreoState.currentMove) {
                const boost = choreoState.currentMove.physicsBoost;
                if (boost > 0) {
                    charSquashRef.current = 1.0 - (boost * 0.15);
                    charBounceYRef.current = -30 * boost * bass;
                    flashIntensityRef.current = boost * 0.2;
                }
            }

            // Trigger transition with Laban-determined mode
            triggerTransition(selection.frame.pose, mode as InterpMode);

            // Update direction based on selection
            currentDirectionRef.current = selection.direction;
            if (selection.direction === 'left') targetTiltRef.current = -6;
            else if (selection.direction === 'right') targetTiltRef.current = 6;
            else targetTiltRef.current = 0;

            // Update beat counter from enhanced system
            beatCounterRef.current = getBeatCount() % 32;
        }
    }

    // --- MAIN GROOVE ENGINE (Beat-focused, legacy fallback) ---
    const beatThreshold = 0.55; // Slightly higher threshold for cleaner beat detection

    // Only use legacy groove engine if neither GolemMixer nor enhanced mode triggered a transition
    const useEnhancedTransition = choreoState && useEnhancedModeRef.current && choreoState.shouldTransition;

    // Increased cooldown from 300ms to 400ms - more deliberate timing
    if (!golemMixerHandled && !useEnhancedTransition && !scratchModeRef.current && (now - lastBeatTimeRef.current) > 400) {
        if (bass > beatThreshold) {
            lastBeatTimeRef.current = now;
            beatCounterRef.current = (beatCounterRef.current + 1) % 16;

            const beat = beatCounterRef.current;
            let phase: RhythmPhase = 'WARMUP';
            if (beat >= 4 && beat < 8) phase = 'SWING_LEFT';
            else if (beat >= 8 && beat < 12) phase = 'SWING_RIGHT';
            else if (beat === 12 || beat === 13) phase = 'DROP';
            else if (beat >= 14) phase = 'CHAOS';

            // Reduced FX mode frequency - only on DROP, not CHAOS
            if (phase === 'DROP') {
                const rand = Math.random();
                if (rand > 0.85) activeFXModeRef.current = 'INVERT'; // Was 0.7
                else if (rand > 0.7) activeFXModeRef.current = 'BW'; // Was 0.4
                else activeFXModeRef.current = 'NORMAL';
            } else {
                activeFXModeRef.current = 'NORMAL';
            }

            camZoomRef.current = BASE_ZOOM + (bass * 0.25); // Reduced from 0.35
            charSquashRef.current = 0.9; // Less squash (was 0.85)
            charBounceYRef.current = -35 * bass; // Reduced from -50
            flashIntensityRef.current = 0.3; // Much lower (was 0.8)

            if (phase === 'SWING_LEFT') { targetTiltRef.current = -6; currentDirectionRef.current = 'left'; } // Reduced from -8
            else if (phase === 'SWING_RIGHT') { targetTiltRef.current = 6; currentDirectionRef.current = 'right'; } // Reduced from 8
            else if (phase === 'CHAOS') targetTiltRef.current = (Math.random() - 0.5) * 15; // Reduced from 25
            else { targetTiltRef.current = 0; currentDirectionRef.current = 'center'; }

            let pool: FrameData[] = [];

            if (isCloseupLocked) {
                pool = closeupFrames;
            } else {
                if (energyTrend > 0.15 && framesByEnergy.high.length > 0) { // Raised threshold
                    pool = framesByEnergy.high;
                } else {
                    if (phase === 'WARMUP') pool = framesByEnergy.low;
                    else if (phase === 'SWING_LEFT') {
                        const leftFrames = framesByEnergy.mid.filter(f => f.direction === 'left');
                        pool = leftFrames.length > 0 ? leftFrames : framesByEnergy.mid;
                    } else if (phase === 'SWING_RIGHT') {
                        const rightFrames = framesByEnergy.mid.filter(f => f.direction === 'right');
                        pool = rightFrames.length > 0 ? rightFrames : framesByEnergy.mid;
                    } else if (phase === 'DROP') pool = framesByEnergy.high;
                    else if (phase === 'CHAOS') pool = framesByEnergy.high;
                }
            }

            if (pool.length === 0) pool = framesByEnergy.mid;
            if (pool.length === 0) pool = framesByEnergy.low;

            if (pool.length > 0) {
                let nextFrame = pool[Math.floor(Math.random() * pool.length)];
                let attempts = 0;
                while (nextFrame.pose === targetPoseRef.current && attempts < 3 && phase !== 'CHAOS') {
                    nextFrame = pool[Math.floor(Math.random() * pool.length)];
                    attempts++;
                }

                // Default to smoother transitions, only CUT on DROP
                let mode: InterpMode = 'SMOOTH'; // Changed default from CUT

                if (isCloseupLocked || nextFrame.type === 'closeup') {
                    mode = 'ZOOM_IN';
                } else if (phase === 'SWING_LEFT' || phase === 'SWING_RIGHT') {
                    mode = 'SLIDE';
                } else if (phase === 'DROP') {
                    mode = 'CUT'; // Only hard cuts on DROP
                } else if (phase === 'CHAOS') {
                    mode = Math.random() > 0.5 ? 'CUT' : 'MORPH'; // Mix on CHAOS
                } else if (energyTrend < -0.1) {
                    mode = 'SMOOTH';
                }

                triggerTransition(nextFrame.pose, mode);
            }
        }
        else if (bass < 0.25 && mid < 0.25) { // Lowered thresholds for ambient
             if (Math.random() < 0.015) { // Reduced from 0.02
                 const pool = framesByEnergy.low;
                 if (pool.length > 0) {
                     const next = pool[Math.floor(Math.random() * pool.length)];
                     triggerTransition(next.pose, 'SMOOTH');
                 }
                 targetTiltRef.current = 0;
                 currentDirectionRef.current = 'center';
             }
        }
    }

    // Closeup trigger - reduced sensitivity
    if (!isCloseupLocked && high > 0.7 && mid > 0.5 && bass < 0.4) { // Raised thresholds
        if (closeupFrames.length > 0 && Math.random() < 0.3) { // Reduced from 0.5
            const next = closeupFrames[Math.floor(Math.random() * closeupFrames.length)].pose;
            triggerTransition(next, 'ZOOM_IN', 1.0);
            closeupLockTimeRef.current = now + 3000; // Longer lock (was 2500)
        }
    }

    // Physics Decay
    charSquashRef.current += (1.0 - charSquashRef.current) * (12 * deltaTime);
    charSkewRef.current += (0.0 - charSkewRef.current) * (10 * deltaTime);
    fluidStutterRef.current *= Math.exp(-8 * deltaTime); 
    charTiltRef.current += (targetTiltRef.current - charTiltRef.current) * (6 * deltaTime);
    charBounceYRef.current += (0 - charBounceYRef.current) * (10 * deltaTime); 
    
    rgbSplitRef.current *= Math.exp(-10 * deltaTime); 
    flashIntensityRef.current *= Math.exp(-15 * deltaTime); 

    const decay = 1 - Math.exp(-5 * deltaTime);
    camZoomRef.current += (BASE_ZOOM - camZoomRef.current) * decay;
    ghostAmountRef.current *= Math.exp(-8 * deltaTime); 
    echoTrailRef.current *= Math.exp(-4 * deltaTime);
    
    let targetPanX = 0;
    if (currentDirectionRef.current === 'left') targetPanX = 30;
    else if (currentDirectionRef.current === 'right') targetPanX = -30;
    camPanXRef.current += (targetPanX - camPanXRef.current) * (4 * deltaTime);

    const rotX = superCamActive ? masterRotXRef.current : 0;
    const rotY = superCamActive ? masterRotYRef.current : 0;
    const rotZ = superCamActive ? masterRotZRef.current : 0;
    
    const renderCharacterCanvas = (ctx: CanvasRenderingContext2D, w: number, h: number, fitMode: 'contain' | 'cover' = 'contain') => {
        const cx = w/2;
        const cy = h/2;
        ctx.clearRect(0, 0, w, h);

        // Apply user-controlled effects first
        const ue = userEffectsRef.current;

        // Build filter string
        let filterStr = '';
        if (ue.invert || activeFXModeRef.current === 'INVERT') filterStr += 'invert(1) ';
        if (ue.bw || activeFXModeRef.current === 'BW') filterStr += 'grayscale(1) ';
        ctx.filter = filterStr.trim() || 'none';

        // Apply user RGB split
        if (ue.rgbSplit) rgbSplitRef.current = Math.max(rgbSplitRef.current, 0.5);

        // Apply user zoom pulse
        if (ue.zoom) camZoomRef.current = BASE_ZOOM + 0.3 * Math.sin(time * 0.008);

        // Apply user shake
        if (ue.shake) {
            masterRotZRef.current += (Math.random() - 0.5) * 3;
            camPanXRef.current += (Math.random() - 0.5) * 10;
        }

        // Apply user glitch
        if (ue.glitch && Math.random() < 0.1) {
            charSkewRef.current = (Math.random() - 0.5) * 1.5;
            rgbSplitRef.current = Math.random() * 0.8;
        }

        const drawLayer = (pose: string, deckId: number, opacity: number, blurAmount: number, skewOffset: number, extraScale: number = 1.0) => {
            const frame = [...framesByEnergy.low, ...framesByEnergy.mid, ...framesByEnergy.high, ...closeupFrames].find(f => f.pose === pose);
            // Try deck-prefixed key first, then fall back to just pose name
            const img = poseImagesRef.current[`${deckId}_${pose}`] || poseImagesRef.current[pose];

            if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return;
            
            const aspect = img.width / img.height;
            let dw = w;
            let dh = w / aspect;
            
            if (fitMode === 'contain') {
                dw = w * 1.0; 
                dh = dw / aspect;
                if (dh > h * 1.0) { dh = h * 1.0; dw = dh * aspect; } 
            } else {
                if (dh < h) { dh = h; dw = dh * aspect; }
            }
            
            const renderFrame = (image: HTMLImageElement, zoom: number, alpha: number, composite: GlobalCompositeOperation = 'source-over', offsetY: number = 0, colorChannel: 'all'|'r'|'b' = 'all') => {
                ctx.save();
                ctx.translate(cx + camPanXRef.current, cy + charBounceYRef.current); 
                
                if (colorChannel === 'r') ctx.translate(-10 * rgbSplitRef.current, 0);
                if (colorChannel === 'b') ctx.translate(10 * rgbSplitRef.current, 0);

                const radX = (rotX * Math.PI) / 180;
                const radY = (rotY * Math.PI) / 180;
                const scaleX = Math.cos(radY); 
                const scaleY = Math.cos(radX); 
                
                const tiltZ = (rotZ * 0.8) * (Math.PI/180);
                ctx.rotate(tiltZ + (charTiltRef.current * Math.PI / 180));
                ctx.scale(Math.abs(scaleX), Math.abs(scaleY));
                ctx.scale(1/charSquashRef.current, charSquashRef.current); 
                
                if (skewOffset !== 0) ctx.transform(1, 0, skewOffset, 1, 0, 0);
                if (charSkewRef.current !== 0) ctx.transform(1, 0, charSkewRef.current * 0.2, 1, 0, 0);

                ctx.scale(zoom * extraScale, zoom * extraScale);
                ctx.translate(0, offsetY * dh); 
                
                if (blurAmount > 0) {
                     const currentFilter = ctx.filter === 'none' ? '' : ctx.filter;
                     ctx.filter = `${currentFilter} blur(${blurAmount}px)`;
                }

                ctx.globalAlpha = alpha;
                ctx.globalCompositeOperation = composite;
                
                if (colorChannel !== 'all') {
                     ctx.globalAlpha = alpha * 0.7;
                     if(colorChannel === 'r') ctx.filter = 'hue-rotate(90deg)'; 
                     if(colorChannel === 'b') ctx.filter = 'hue-rotate(-90deg)';
                }

                try {
                    ctx.drawImage(image, -dw/2, -dh/2, dw, dh);
                } catch (e) {}
                ctx.restore();
            };

            let effectiveZoom = camZoomRef.current;
            let effectiveOffsetY = 0;
            
            if (frame && frame.isVirtual && frame.virtualZoom) {
                effectiveZoom *= frame.virtualZoom;
                effectiveOffsetY = frame.virtualOffsetY || 0;
            }
            
            if (rgbSplitRef.current > 0.1) {
                renderFrame(img, effectiveZoom, opacity * 0.8, 'screen', effectiveOffsetY, 'r');
                renderFrame(img, effectiveZoom, opacity * 0.8, 'screen', effectiveOffsetY, 'b');
                renderFrame(img, effectiveZoom, opacity, 'multiply', effectiveOffsetY, 'all'); 
            } else {
                renderFrame(img, effectiveZoom, opacity, 'source-over', effectiveOffsetY);
            }
        };

        const progress = transitionProgressRef.current;
        const mode = transitionModeRef.current;

        if (progress >= 1.0 || mode === 'CUT') {
            drawLayer(targetPoseRef.current, targetDeckIdRef.current, 1.0, 0, 0);
        } else {
            const easeT = progress * progress * (3 - 2 * progress);

            if (mode === 'ZOOM_IN') {
                 const zoomFactor = 1.0 + (easeT * 0.5);
                 drawLayer(sourcePoseRef.current, sourceDeckIdRef.current, 1.0 - easeT, easeT * 10, 0, zoomFactor);
                 drawLayer(targetPoseRef.current, targetDeckIdRef.current, easeT, 0, 0);
            } else if (mode === 'SLIDE') {
                const dirMultiplier = targetPoseRef.current.includes('right') ? -1 : 1;
                drawLayer(sourcePoseRef.current, sourceDeckIdRef.current, 1.0 - easeT, 0, easeT * 0.5 * dirMultiplier);
                drawLayer(targetPoseRef.current, targetDeckIdRef.current, easeT, 0, (1.0 - easeT) * -0.5 * dirMultiplier);
            } else if (mode === 'SMOOTH' || mode === 'MORPH') {
                drawLayer(sourcePoseRef.current, sourceDeckIdRef.current, 1.0 - easeT, 0, 0);
                drawLayer(targetPoseRef.current, targetDeckIdRef.current, easeT, 0, 0);
            }
        }
            
        // Scanlines effect (audio-reactive OR user-controlled)
        if (mid > 0.4 || ue.scanlines) {
            ctx.save();
            const scanIntensity = ue.scanlines ? 0.4 : mid * 0.3;
            ctx.fillStyle = `rgba(0,0,0, ${scanIntensity})`;
            for(let y=0; y<h; y+=6) {
                 ctx.fillRect(0, y, w, 2);
            }
            ctx.restore();
        }

        // Strobe effect (audio-reactive OR user-controlled)
        const strobeActive = ue.strobe && Math.sin(time * 0.05) > 0.7;
        if (flashIntensityRef.current > 0.01 || strobeActive) {
            const flashAmount = strobeActive ? 0.5 : flashIntensityRef.current;
            ctx.fillStyle = `rgba(255,255,255, ${flashAmount})`;
            ctx.fillRect(0,0,w,h);
        }

        // Ghost/trail effect (user-controlled)
        if (ue.ghost) {
            ctx.globalAlpha = 0.15;
            ctx.globalCompositeOperation = 'lighter';
        }
    };

    if (charCanvasRef.current && imagesReady) {
        const ctx = charCanvasRef.current.getContext('2d');
        if (ctx) renderCharacterCanvas(ctx, charCanvasRef.current.width, charCanvasRef.current.height);
    }
    
    // Recording Renderer
    if (isRecording && recordCanvasRef.current && bgCanvasRef.current) {
        const ctx = recordCanvasRef.current.getContext('2d');
        if (ctx) {
            const w = recordCanvasRef.current.width;
            const h = recordCanvasRef.current.height;
            const bgAspect = bgCanvasRef.current.width / bgCanvasRef.current.height;
            let bgW = w;
            let bgH = w / bgAspect;
            if (bgH < h) { bgH = h; bgW = bgH * bgAspect; }
            
            ctx.drawImage(bgCanvasRef.current, (w-bgW)/2, (h-bgH)/2, bgW, bgH);
            renderCharacterCanvas(ctx, w, h, 'contain');
        }
    }
    
    setBrainState({
        activePoseName: targetPoseRef.current,
        fps: Math.round(1/deltaTime),
        effort: choreoState?.movementQualities.effort || 'GLIDE',
        danceStyle: choreoState?.movementQualities.danceStyle || 'HOUSE',
        bpm: choreoState?.audio.bpm || 120,
        phraseSection: choreoState?.audio.phrase.phraseSection || 'INTRO'
    });

  }, [imagesReady, superCamActive, framesByEnergy, closeupFrames, isRecording, getFrequencyData, processAudio, selectFrame, getBeatCount, analyserRef]);


  useEffect(() => {
    if (imagesReady) {
        requestRef.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [loop, imagesReady]);

  // Audio Playback Handling
  useEffect(() => {
      if(audioElementRef.current && isPlaying) {
          connectFileAudio(audioElementRef.current);
          audioElementRef.current.play();
      } else if(audioElementRef.current) {
          audioElementRef.current.pause();
      }
  }, [isPlaying, connectFileAudio]);


  const handleExportWidget = () => {
      if(!hologramRef.current) {
          TelemetryService.trackExportResult({ type: 'html', success: false, error: 'missing_hologram' });
          return;
      }
      try {
          // We need to pass virtual frames logic or processed frames to the player
          // For simplicity in the player, we'll pass the processed list that Step4 uses
          // We will re-construct the virtual frames in the player script for size efficiency, but passing raw logic
          const html = generatePlayerHTML(state.generatedFrames, hologramRef.current.params, state.subjectCategory);
          const blob = new Blob([html], {type: 'text/html'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `jusdnce_rig_${Date.now()}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          TelemetryService.trackExportResult({ type: 'html', success: true, frameCount: state.generatedFrames.length });
      } catch (error) {
          TelemetryService.trackExportResult({
              type: 'html',
              success: false,
              error: error instanceof Error ? error.message : 'unknown_error'
          });
      }
  };

  const startRecording = () => {
      if (!recordCanvasRef.current) {
          TelemetryService.trackExportResult({ type: 'video', success: false, error: 'missing_record_canvas' });
          return;
      }

      let w = 1080;
      let h = 1920;
      
      const resMult = exportRes === '4K' ? 2 : (exportRes === '720p' ? 0.66 : 1);
      const baseDim = 1080 * resMult;
      
      if (exportRatio === '9:16') { w = baseDim; h = baseDim * (16/9); }
      else if (exportRatio === '16:9') { w = baseDim * (16/9); h = baseDim; }
      else if (exportRatio === '1:1') { w = baseDim; h = baseDim; }

      recordCanvasRef.current.width = Math.floor(w);
      recordCanvasRef.current.height = Math.floor(h);

      try {
          const stream = recordCanvasRef.current.captureStream(60);

          const recordingFormats = [
            { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
            { mimeType: 'video/webm;codecs=vp9,opus', ext: 'webm' },
            { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' }
          ];

          const selectedFormat = recordingFormats.find(fmt =>
            typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(fmt.mimeType)
          ) || recordingFormats[1];

          mediaRecorderFormatRef.current = selectedFormat;

          // Use audioDest from hook
          if (audioDestRef.current) {
              const audioTracks = audioDestRef.current.stream.getAudioTracks();
              if (audioTracks.length > 0) {
                  stream.addTrack(audioTracks[0]);
              }
          }

          const recorder = new MediaRecorder(stream, {
            mimeType: selectedFormat.mimeType,
            videoBitsPerSecond: 6000000
          });
          mediaRecorderRef.current = recorder;
          recordedChunksRef.current = [];

          recorder.ondataavailable = (e) => {
              if (e.data.size > 0) recordedChunksRef.current.push(e.data);
          };

          recorder.onerror = (event) => {
              TelemetryService.trackExportResult({
                  type: 'video',
                  success: false,
                  error: event.error?.message || 'media_recorder_error'
              });
          };

          recorder.onstop = () => {
              const { mimeType, ext } = mediaRecorderFormatRef.current;
              const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `jusdnce_${exportRatio.replace(':','x')}_${Date.now()}.${ext}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              TelemetryService.trackExportResult({
                  type: 'video',
                  success: true,
                  durationMs: exportStartRef.current ? Date.now() - exportStartRef.current : null,
                  format: ext
              });
          };

          exportStartRef.current = Date.now();
          recorder.start();
          setIsRecording(true);
          setShowExportMenu(false); 

          const startTime = Date.now();
          const interval = setInterval(() => {
              setRecordingTime(Date.now() - startTime);
          }, 100);
          (mediaRecorderRef.current as any).timerInterval = interval;
      } catch (error) {
          TelemetryService.trackExportResult({
              type: 'video',
              success: false,
              error: error instanceof Error ? error.message : 'recording_setup_failed'
          });
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          clearInterval((mediaRecorderRef.current as any).timerInterval);
          setIsRecording(false);
          setRecordingTime(0);
      }
  };


  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black/90">
      
      <canvas ref={recordCanvasRef} className="hidden pointer-events-none fixed -top-[9999px]" />

      <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center perspective-1000">
           <canvas 
              ref={bgCanvasRef} 
              className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-75 ease-linear will-change-transform" 
           />
           <canvas 
              ref={charCanvasRef} 
              className="absolute inset-0 w-full h-full object-contain z-10 transition-transform duration-75 ease-linear will-change-transform" 
           />
      </div>

      {showExportMenu && (
          <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in p-6">
              <div className="bg-dark-surface border border-brand-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-zoom-out relative">
                  <button onClick={() => setShowExportMenu(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><FileVideo className="text-brand-400" /> EXPORT SETTINGS</h3>
                  <div className="space-y-6">
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Aspect Ratio</label>
                          <div className="grid grid-cols-3 gap-3">
                              {[{ id: '9:16', icon: Smartphone, label: 'Story' }, { id: '1:1', icon: Square, label: 'Post' }, { id: '16:9', icon: Monitor, label: 'Cinema' }].map((opt) => (
                                  <button key={opt.id} onClick={() => setExportRatio(opt.id as AspectRatio)} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${exportRatio === opt.id ? 'bg-brand-600 border-brand-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                                      <opt.icon size={20} /> <span className="text-xs font-bold">{opt.label}</span>
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Resolution</label>
                          <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                              {['720p', '1080p', '4K'].map((res) => (
                                  <button key={res} onClick={() => setExportRes(res as Resolution)} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${exportRes === res ? 'bg-brand-500 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>{res}</button>
                              ))}
                          </div>
                      </div>
                      <div className="border border-white/10 bg-black/30 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                                  <QrCode size={16} />
                                  <span>Share or Upgrade via QR</span>
                              </div>
                              <div className="flex gap-2 text-xs">
                                  {(['preview', 'paywall'] as QRTarget[]).map((target) => (
                                      <button
                                          key={target}
                                          onClick={() => setQrTarget(target)}
                                          className={`px-3 py-1 rounded-lg border transition-all ${qrTarget === target ? 'border-brand-400 bg-brand-500/20 text-white' : 'border-white/10 text-gray-400 hover:border-white/30'}`}
                                      >
                                          {target === 'preview' ? 'Preview' : 'Upgrade'}
                                      </button>
                                  ))}
                                  <button
                                      onClick={() => refreshQr(qrTarget)}
                                      className="px-2 py-1 rounded-lg border border-white/10 text-gray-300 hover:border-brand-400 hover:text-white"
                                      title="Refresh QR"
                                  >
                                      <RefreshCw size={14} />
                                  </button>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <div className="w-32 h-32 bg-black/40 border border-white/10 rounded-xl flex items-center justify-center">
                                  {qrIsLoading && <Loader2 className="animate-spin text-brand-400" size={24} />}
                                  {!qrIsLoading && qrDataUrl && <img src={qrDataUrl} alt="Share QR" className="w-full h-full object-contain" />}
                                  {!qrIsLoading && qrError && (
                                      <span className="text-xs text-red-300 text-center px-2">{qrError}</span>
                                  )}
                              </div>
                              <div className="flex-1 space-y-2">
                                  <p className="text-xs text-gray-400">Scan to view the preview or upgrade flow on another device.</p>
                                  <div className="flex gap-2">
                                      <input
                                          value={shareLink}
                                          readOnly
                                          className="flex-1 text-xs bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                                      />
                                      <button
                                          onClick={copyShareLink}
                                          type="button"
                                          className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/10 hover:border-brand-400"
                                      >
                                          <Copy size={14} />
                                      </button>
                                  </div>
                                  {(qrStatus || qrError) && (
                                      <p className={`text-xs ${qrError ? 'text-red-300' : 'text-brand-300'}`}>{qrError || qrStatus}</p>
                                  )}
                              </div>
                          </div>
                      </div>
                      <button onClick={startRecording} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-[1.02]"><CircleDot size={20} /> START RECORDING</button>
                  </div>
              </div>
          </div>
      )}

      {showStreamLinkInput && (
        <div className="absolute top-16 left-2 z-[55] max-w-md w-[90%] md:w-[420px]">
          <div className="bg-black/85 border border-white/10 rounded-2xl shadow-2xl p-4 backdrop-blur-xl animate-in slide-in-from-left-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-gray-400 font-mono tracking-widest">STREAM LINK</p>
                <h4 className="text-lg font-bold text-white flex items-center gap-2"><Link2 size={16} className="text-green-300" /> Paste music/stream URL</h4>
              </div>
              <button onClick={() => setShowStreamLinkInput(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none"
                placeholder="https://example.com/stream.mp3"
                value={streamLink}
                onChange={(e) => setStreamLink(e.target.value)}
              />
              <button
                onClick={handlePasteStreamLink}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white hover:border-brand-400"
                title="Paste from clipboard"
              >
                <Clipboard size={16} />
              </button>
              <button
                onClick={handleStreamLinkSubmit}
                disabled={!streamLink.trim() || isLinkLoading}
                className={`px-4 py-2 rounded-lg font-bold text-xs tracking-widest ${(!streamLink.trim() || isLinkLoading) ? 'bg-green-600/40 text-white/60' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg'}`}
              >
                {isLinkLoading ? 'LINKING...' : 'LINK'}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">HTTPS streams work best. Links must permit CORS-enabled playback.</p>
            {streamStatus && <p className="text-xs text-brand-300 mt-1">{streamStatus}</p>}
          </div>
        </div>
      )}

      {!imagesReady && !state.isGenerating && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 backdrop-blur-md">
             <Loader2 size={48} className="text-brand-500 animate-spin mb-4" />
             <p className="text-white font-mono tracking-widest animate-pulse">NEURAL RIG INITIALIZING...</p>
             <p className="text-gray-500 text-xs mt-2">Loading {frameCount} frames</p>
         </div>
      )}
      
      {state.isGenerating && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in slide-in-from-top-4 fade-in">
             <div className="bg-black/80 border border-brand-500/50 px-6 py-3 rounded-full flex items-center gap-4 shadow-[0_0_30px_rgba(139,92,246,0.3)] backdrop-blur-md">
                  <div className="relative w-5 h-5">
                      <div className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-xs font-bold text-white tracking-widest">EXPANDING REALITY</span>
                      <span className="text-[10px] text-brand-300 font-mono">Generating variations...</span>
                  </div>
             </div>
          </div>
      )}

      {state.audioPreviewUrl && (
          <audio ref={audioElementRef} src={state.audioPreviewUrl} loop crossOrigin="anonymous" onEnded={() => setIsPlaying(false)} />
      )}

      {/* Hidden file input for track change */}
      <input
        ref={trackInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleTrackChange}
      />

      {/* ============ NEW UI COMPONENTS ============ */}

      {/* STATUS BAR - Top (Play, Mic, BPM, Beat, Cam, More) */}
      <StatusBar
        isPlaying={isPlaying}
        hasAudio={!!state.audioPreviewUrl}
        onPlayToggle={() => { setIsPlaying(!isPlaying); if(isMicActive) toggleMic(); }}
        onUploadAudio={() => trackInputRef.current?.click()}
        onLinkAudio={() => setShowStreamLinkInput(true)}
        isMicActive={isMicActive}
        onMicToggle={toggleMic}
        isCamActive={superCamActive}
        onCamToggle={() => setSuperCamActive(!superCamActive)}
        bpm={golemState.telemetry?.bpm ?? 120}
        beatCounter={beatCounterRef.current}
        isFrameDeckOpen={false}
        onFrameDeckToggle={() => {}}
        onGenerateMore={onGenerateMore}
        onSaveProject={onSaveProject}
        onStartRecording={() => isRecording ? stopRecording() : setShowExportMenu(true)}
        isRecording={isRecording}
      />

      {/* FX RAIL - Left edge (9 toggles with X/Y axis mapping) */}
      <FXRail
        effects={userEffects}
        onToggleEffect={(effect) => toggleEffect(effect as keyof typeof userEffects)}
        onResetAll={resetUserEffects}
        axisMapping={fxAxisMapping}
        onAxisMappingChange={setFxAxisMapping}
        fxIntensity={fxIntensity}
      />

      {/* ANIMATION ZONE CONTROLLER - Touch overlay */}
      <AnimationZoneController
        onEngineModeChange={handleEngineModeChange}
        engineMode={golemState.engineMode}
        onPatternChange={handlePatternChange}
        currentPattern={golemState.activePattern}
        decks={golemState.decks.map(d => ({
          id: d.id,
          mixMode: d.mixMode,
          isActive: d.mixMode !== 'off'
        }))}
        onDeckToggle={(deckId) => {
          const deck = golemState.decks[deckId];
          if (deck) {
            const newMode: MixMode = deck.mixMode === 'off' ? 'sequencer' : 'off';
            handleDeckModeChange(deckId, newMode);
          }
        }}
        onDeckModeChange={handleDeckModeChange}
        onFXIntensityChange={handleFXIntensityChange}
      />

      {/* ENGINE STRIP - Bottom (Physics, Patterns, Intensity, Mixer toggle) */}
      <EngineStrip
        physicsMode={choreoMode}
        onPhysicsModeChange={(mode) => {
          setChoreoMode(mode);
          useEnhancedModeRef.current = mode === 'LABAN';
        }}
        engineMode={golemState.engineMode}
        onEngineModeChange={handleEngineModeChange}
        currentPattern={golemState.activePattern}
        onPatternChange={handlePatternChange}
        intensity={intensity}
        onIntensityChange={(val) => {
          setIntensity(val);
          rgbSplitRef.current = Math.max(rgbSplitRef.current, val * 0.008);
          flashIntensityRef.current = val * 0.003;
        }}
        isMixerOpen={isMixerDrawerOpen}
        onMixerToggle={() => setIsMixerDrawerOpen(!isMixerDrawerOpen)}
        activeDeckCount={golemState.decks.filter(d => d.mixMode !== 'off').length}
      />

      {/* MIXER DRAWER - Bottom sheet (4 decks) */}
      <MixerDrawer
        isOpen={isMixerDrawerOpen}
        onClose={() => setIsMixerDrawerOpen(false)}
        decks={golemState.decks.map((d, i) => ({
          id: d.id,
          frames: d.frames || [],
          rigName: d.rigName,
          mixMode: d.mixMode,
          opacity: d.opacity,
          isActive: d.mixMode !== 'off',
          currentFrameIndex: golemMixerRef.current?.getDeckFrameIndex(i) ?? 0
        }))}
        onLoadDeck={handleLoadDeck}
        onDeckModeChange={handleDeckModeChange}
        onDeckOpacityChange={handleDeckOpacityChange}
        onClearDeck={(id) => {
          if (golemMixerRef.current) {
            golemMixerRef.current.loadDeck(id, [], state.subjectCategory);
            setGolemState(s => ({
              ...s,
              decks: s.decks.map(d => d.id === id ? { ...d, frames: [], frameCount: 0, rigName: undefined } : d)
            }));
          }
        }}
        onSelectFrame={(deckId, frameIndex) => {
          golemMixerRef.current?.setDeckFrameIndex(deckId, frameIndex);
        }}
      />

      {/* Hidden file inputs for deck rig loading */}
      {[0, 1, 2, 3].map(deckId => (
        <input
          key={deckId}
          ref={el => { deckInputRefs.current[deckId] = el; }}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => handleDeckFileChange(deckId, e)}
        />
      ))}

      {/* Status info moved to ENGINE panel - no longer overlaying animation */}

      {/* RECORDING INDICATOR + HTML EXPORT - Below StatusBar */}
      <div className="absolute top-16 right-2 z-30 pointer-events-auto flex flex-col gap-2 items-end">
        {state.audioPreviewUrl && (
          <button
            onClick={() => setShowStreamLinkInput(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-xs text-white hover:border-brand-400"
          >
            <Link2 size={14} className="text-green-300" />
            <span className="font-bold tracking-widest">{state.audioSourceType === 'url' ? 'STREAM LINK' : 'AUDIO FILE'}</span>
          </button>
        )}
        {isRecording && (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 px-3 py-1.5 rounded-full animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-red-300 font-mono text-xs">{(recordingTime / 1000).toFixed(1)}s</span>
          </div>
        )}
        {/* HTML PLAYER DOWNLOAD - More visible */}
        <button
          onClick={handleExportWidget}
          className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-md
                     border border-cyan-500/30 px-3 py-2 rounded-xl
                     text-white/80 hover:text-white hover:border-cyan-400/50
                     transition-all flex items-center gap-2 shadow-lg"
          title="Download Standalone HTML Player"
        >
          <Download size={16} />
          <span className="text-[10px] font-bold tracking-wider">.HTML</span>
        </button>
      </div>

      {/* ControlDock replaced by StatusBar (top) + EngineStrip (bottom) */}
      
    </div>
  );
};
