
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Video, Settings, Mic, MicOff, Maximize2, Minimize2, Upload, X, Loader2, Sliders, Package, Music, ChevronDown, ChevronUp, Activity, Download, FileVideo, Radio, Star, Camera, Volume2, VolumeX, Sparkles, CircleDot, Monitor, Smartphone, Square, Eye, Zap, Brain, Layers, Ghost, Contrast, ScanLine, Move3D, Wand2, Music2 } from 'lucide-react';
import { AppState, EnergyLevel, MoveDirection, FrameType, GeneratedFrame } from '../types';
import { QuantumVisualizer } from './Visualizer/HolographicVisualizer';
import { generatePlayerHTML } from '../services/playerExport';
import { STYLE_PRESETS } from '../constants';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { useEnhancedChoreography, ChoreographyState } from '../hooks/useEnhancedChoreography';
import { LabanEffort, DanceStyle } from '../engine/LabanEffortSystem';

interface Step4Props {
  state: AppState;
  onGenerateMore: () => void;
  onSpendCredit: (amount: number) => boolean;
  onUploadAudio: (file: File) => void;
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

export const Step4Preview: React.FC<Step4Props> = ({ state, onGenerateMore, onSpendCredit, onUploadAudio, onSaveProject }) => {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const charCanvasRef = useRef<HTMLCanvasElement>(null); 
  const containerRef = useRef<HTMLDivElement>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);
  
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
  const [showDeck, setShowDeck] = useState(false); // Neural Deck Visibility
  const [showEffects, setShowEffects] = useState(false); // Effects Panel Visibility
  const [exportRatio, setExportRatio] = useState<AspectRatio>('9:16');
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
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

  // Helper to trigger a Smart Transition
  const triggerTransition = (newPose: string, mode: InterpMode, speedMultiplier: number = 1.0) => {
      if (newPose === targetPoseRef.current) return;
      
      sourcePoseRef.current = targetPoseRef.current;
      targetPoseRef.current = newPose;
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
    if (choreoState && useEnhancedModeRef.current && choreoState.shouldTransition) {
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

    // Only use legacy groove engine if enhanced mode didn't trigger a transition
    const useEnhancedTransition = choreoState && useEnhancedModeRef.current && choreoState.shouldTransition;

    // Increased cooldown from 300ms to 400ms - more deliberate timing
    if (!useEnhancedTransition && !scratchModeRef.current && (now - lastBeatTimeRef.current) > 400) {
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

        const drawLayer = (pose: string, opacity: number, blurAmount: number, skewOffset: number, extraScale: number = 1.0) => {
            const frame = [...framesByEnergy.low, ...framesByEnergy.mid, ...framesByEnergy.high, ...closeupFrames].find(f => f.pose === pose);
            const img = poseImagesRef.current[pose];
            
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
            drawLayer(targetPoseRef.current, 1.0, 0, 0);
        } else {
            const easeT = progress * progress * (3 - 2 * progress); 
            
            if (mode === 'ZOOM_IN') {
                 const zoomFactor = 1.0 + (easeT * 0.5); 
                 drawLayer(sourcePoseRef.current, 1.0 - easeT, easeT * 10, 0, zoomFactor);
                 drawLayer(targetPoseRef.current, easeT, 0, 0);
            } else if (mode === 'SLIDE') {
                const dirMultiplier = targetPoseRef.current.includes('right') ? -1 : 1;
                drawLayer(sourcePoseRef.current, 1.0 - easeT, 0, easeT * 0.5 * dirMultiplier);
                drawLayer(targetPoseRef.current, easeT, 0, (1.0 - easeT) * -0.5 * dirMultiplier);
            } else if (mode === 'SMOOTH' || mode === 'MORPH') {
                drawLayer(sourcePoseRef.current, 1.0 - easeT, 0, 0);
                drawLayer(targetPoseRef.current, easeT, 0, 0); 
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
      if(!hologramRef.current) return;
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
  };

  const startRecording = () => {
      if (!recordCanvasRef.current) return;
      
      let w = 1080;
      let h = 1920;
      
      const resMult = exportRes === '4K' ? 2 : (exportRes === '720p' ? 0.66 : 1);
      const baseDim = 1080 * resMult;
      
      if (exportRatio === '9:16') { w = baseDim; h = baseDim * (16/9); }
      else if (exportRatio === '16:9') { w = baseDim * (16/9); h = baseDim; }
      else if (exportRatio === '1:1') { w = baseDim; h = baseDim; }
      
      recordCanvasRef.current.width = Math.floor(w);
      recordCanvasRef.current.height = Math.floor(h);

      const stream = recordCanvasRef.current.captureStream(60);
      
      // Use audioDest from hook
      if (audioDestRef.current) {
          const audioTracks = audioDestRef.current.stream.getAudioTracks();
          if (audioTracks.length > 0) {
              stream.addTrack(audioTracks[0]);
          }
      }

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000 });
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `jusdnce_${exportRatio.replace(':','x')}_${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      };
      
      recorder.start();
      setIsRecording(true);
      setShowExportMenu(false); 
      
      const startTime = Date.now();
      const interval = setInterval(() => {
          setRecordingTime(Date.now() - startTime);
      }, 100);
      (mediaRecorderRef.current as any).timerInterval = interval;
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
                      <button onClick={startRecording} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-[1.02]"><CircleDot size={20} /> START RECORDING</button>
                  </div>
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

      {/* EFFECTS PANEL */}
      {showEffects && (
        <div className="absolute top-20 right-6 z-50 animate-slide-in-right pointer-events-auto">
          <div className="bg-black/90 backdrop-blur-xl border border-brand-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(139,92,246,0.3)] w-64">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white tracking-widest flex items-center gap-2">
                <Wand2 size={14} className="text-brand-400" /> EFFECTS
              </h3>
              <button onClick={() => setShowEffects(false)} className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'rgbSplit', label: 'RGB', icon: Layers },
                { key: 'strobe', label: 'STROBE', icon: Zap },
                { key: 'ghost', label: 'GHOST', icon: Ghost },
                { key: 'invert', label: 'INVERT', icon: Contrast },
                { key: 'bw', label: 'B&W', icon: CircleDot },
                { key: 'scanlines', label: 'SCAN', icon: ScanLine },
                { key: 'glitch', label: 'GLITCH', icon: Activity },
                { key: 'zoom', label: 'ZOOM', icon: Move3D },
                { key: 'shake', label: 'SHAKE', icon: Radio }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => toggleEffect(key as keyof typeof userEffects)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    userEffects[key as keyof typeof userEffects]
                      ? 'bg-brand-500/30 border-brand-500 text-brand-300'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-[9px] font-bold">{label}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setUserEffects({
                  rgbSplit: false, strobe: false, ghost: false,
                  invert: false, bw: false, scanlines: false,
                  glitch: false, shake: false, zoom: false
                })}
                className="w-full py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                RESET ALL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEURAL DECK / FRAME INSPECTOR */}
      {showDeck && (
         <div className="absolute bottom-24 left-0 right-0 z-40 p-4 animate-slide-in-right">
             <div className="bg-black/80 backdrop-blur-lg border-t border-white/10 p-4 overflow-x-auto">
                 <div className="flex gap-4">
                     {allProcessedFrames.map((f, i) => (
                         <div 
                            key={i} 
                            className="relative flex-shrink-0 w-24 h-24 bg-white/5 rounded-lg border border-white/10 hover:border-brand-500 hover:bg-brand-500/20 cursor-pointer group transition-all"
                            onMouseEnter={() => setHoveredFrame(f)}
                            onMouseLeave={() => setHoveredFrame(null)}
                            onClick={() => triggerTransition(f.pose, 'CUT')}
                         >
                             <img src={f.url} className="w-full h-full object-contain p-1" />
                             <div className="absolute top-0 right-0 bg-black/60 text-[10px] px-1 rounded-bl text-white font-mono">{f.energy.toUpperCase()}</div>
                         </div>
                     ))}
                 </div>
             </div>
         </div>
      )}
      
      {/* TOOLTIP FOR HOVERED FRAME */}
      {hoveredFrame && (
          <div className="absolute bottom-52 left-1/2 -translate-x-1/2 z-50 bg-brand-900/90 border border-brand-500/50 p-4 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.5)] backdrop-blur-xl animate-fade-in flex items-center gap-4">
               <img src={hoveredFrame.url} className="w-16 h-16 object-contain bg-black/50 rounded-lg" />
               <div>
                   <div className="text-xs font-bold text-brand-300 tracking-widest uppercase">FRAME DATA</div>
                   <div className="text-white font-mono text-sm">POSE: {hoveredFrame.pose}</div>
                   <div className="text-white font-mono text-sm">ENERGY: {hoveredFrame.energy}</div>
                   <div className="text-white font-mono text-sm">TYPE: {hoveredFrame.type}</div>
               </div>
          </div>
      )}

      <div className="absolute inset-0 pointer-events-none z-30 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <div className="bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-lg pointer-events-auto">
                 <div className="flex items-center gap-2 mb-1"><Activity size={14} className="text-brand-400" /><span className="text-[10px] font-bold text-gray-300 tracking-widest">NEURAL STATUS</span></div>
                 <div className="font-mono text-xs text-brand-300">
                   FPS: {brainState.fps} | BPM: {brainState.bpm}<br/>
                   MODE: <span className={choreoMode === 'LABAN' ? 'text-purple-400' : 'text-orange-400'}>{choreoMode}</span><br/>
                   {choreoMode === 'LABAN' && <>EFFORT: {brainState.effort}<br/></>}
                   STYLE: {brainState.danceStyle} | {brainState.phraseSection}
                 </div>
             </div>
             <div className="flex gap-2 pointer-events-auto items-center">
                 {isRecording && <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 px-3 py-1.5 rounded-full animate-pulse"><div className="w-2 h-2 bg-red-500 rounded-full" /><span className="text-red-300 font-mono text-xs">{(recordingTime / 1000).toFixed(1)}s</span></div>}
                 <button onClick={() => isRecording ? stopRecording() : setShowExportMenu(true)} className={`glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2 ${isRecording ? 'bg-red-500/50 border-red-500' : ''}`}><CircleDot size={18} className={isRecording ? 'text-white' : 'text-red-400'} /><span className="text-xs font-bold">{isRecording ? 'STOP REC' : 'REC VIDEO'}</span></button>
                 <button className="glass-button p-2 rounded-lg text-white" onClick={handleExportWidget} title="Download Standalone Widget"><Download size={20} /></button>
             </div>
          </div>

          <div className="flex flex-col items-center gap-4 pointer-events-auto w-full max-w-2xl mx-auto">
              <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl">
                   {state.audioPreviewUrl ? (
                       <button onClick={() => { setIsPlaying(!isPlaying); if(isMicActive) toggleMic(); }} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-brand-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]' : 'bg-white/10 text-white hover:bg-white/20'}`}>{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}</button>
                   ) : <div className="px-4 text-[10px] text-gray-400 font-mono">NO TRACK LOADED</div>}
                   <div className="h-8 w-[1px] bg-white/10" />
                   <button onClick={() => trackInputRef.current?.click()} className="px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-all border border-transparent text-gray-400 hover:text-white hover:bg-white/10"><Music2 size={16} /> CHANGE TRACK</button>
                   <div className="h-8 w-[1px] bg-white/10" />
                   <button onClick={toggleMic} className={`px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-all border ${isMicActive ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'border-transparent text-gray-400 hover:text-white'}`}>{isMicActive ? <Mic size={16} /> : <MicOff size={16} />} LIVE INPUT</button>
                   <div className="h-8 w-[1px] bg-white/10" />
                   <button onClick={() => setShowEffects(!showEffects)} className={`px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-all border ${showEffects ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'border-transparent text-gray-400 hover:text-white'}`}><Wand2 size={16} /> FX</button>
                   <div className="h-8 w-[1px] bg-white/10" />
                   <button onClick={() => setSuperCamActive(!superCamActive)} className={`px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-all border ${superCamActive ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}><Camera size={16} /> CAM</button>
                   <div className="h-8 w-[1px] bg-white/10" />
                   <button onClick={() => setShowDeck(!showDeck)} className={`px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-all border ${showDeck ? 'bg-white/20 border-white/30 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}><Eye size={16} /> DECK</button>
                   <div className="h-8 w-[1px] bg-white/10" />
                   <button onClick={toggleChoreoMode} className={`px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-all border ${choreoMode === 'LABAN' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-orange-500/20 border-orange-500 text-orange-400'}`}>
                     {choreoMode === 'LABAN' ? <Brain size={16} /> : <Zap size={16} />}
                     {choreoMode}
                   </button>
              </div>
              <div className="flex gap-3">
                  <button onClick={onGenerateMore} className="glass-button px-6 py-2 rounded-full text-xs font-bold text-white flex items-center gap-2 hover:bg-white/20"><Package size={14} /> NEW VARIATIONS</button>
                  <button onClick={onSaveProject} className="glass-button px-6 py-2 rounded-full text-xs font-bold text-white flex items-center gap-2 hover:bg-white/20"><Download size={14} /> SAVE RIG</button>
              </div>
          </div>
      </div>
      
    </div>
  );
};
