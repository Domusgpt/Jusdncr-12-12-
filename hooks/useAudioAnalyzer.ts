
import { useRef, useState, useCallback, useEffect } from 'react';
import { AudioLookaheadBuffer, LookaheadResult } from '../engine/KineticEngine';

export interface AudioAnalysisResult {
    bass: number;
    mid: number;
    high: number;
    energy: number;
}

export interface EnhancedAudioAnalysis extends AudioAnalysisResult {
    lookahead: LookaheadResult;
    rawBass: number;      // Unsmoothed bass for impact detection
    rawMid: number;       // Unsmoothed mid
    rawHigh: number;      // Unsmoothed high
    peakBass: number;     // Recent peak value
    peakMid: number;
    peakHigh: number;
    beatDetected: boolean; // True if a beat was just detected
    bpm: number;          // Estimated BPM
}

export const useAudioAnalyzer = () => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
    const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);

    // Lookahead buffer for predictive analysis
    const lookaheadBufferRef = useRef<AudioLookaheadBuffer | null>(null);

    // Peak tracking for beat detection
    const peakBassRef = useRef<number>(0);
    const peakMidRef = useRef<number>(0);
    const peakHighRef = useRef<number>(0);

    // Beat detection state
    const lastBeatTimeRef = useRef<number>(0);
    const beatIntervalsRef = useRef<number[]>([]);
    const estimatedBpmRef = useRef<number>(120);

    // Previous values for change detection
    const prevBassRef = useRef<number>(0);

    const [isMicActive, setIsMicActive] = useState(false);

    const initAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContextClass();

            analyserRef.current = audioCtxRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = 0.8;

            audioDestRef.current = audioCtxRef.current.createMediaStreamDestination();

            // Initialize lookahead buffer (200ms lookahead at 60fps)
            lookaheadBufferRef.current = new AudioLookaheadBuffer(200, 60);
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    const connectFileAudio = useCallback((audioElement: HTMLAudioElement) => {
        const ctx = initAudio();
        if (analyserRef.current && audioDestRef.current) {
            try {
                // Prevent double connection
                if (!sourceNodeRef.current || sourceNodeRef.current instanceof MediaStreamAudioSourceNode) {
                    if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
                    
                    const src = ctx.createMediaElementSource(audioElement);
                    src.connect(analyserRef.current);
                    src.connect(ctx.destination);
                    src.connect(audioDestRef.current);
                    sourceNodeRef.current = src;
                }
            } catch (e) {
                // Often fails if element is already connected, safe to ignore in React strict mode re-renders
                // console.warn("Audio connection warning:", e);
            }
        }
    }, [initAudio]);

    const connectMicAudio = useCallback(async () => {
        const ctx = initAudio();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = stream;
            
            if (analyserRef.current && audioDestRef.current) {
                if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
                
                const src = ctx.createMediaStreamSource(stream);
                src.connect(analyserRef.current);
                // Do NOT connect mic to ctx.destination to avoid feedback loop
                src.connect(audioDestRef.current);
                sourceNodeRef.current = src;
            }
            setIsMicActive(true);
        } catch (e) {
            console.error("Mic access denied", e);
            alert("Microphone access denied. Check permissions.");
        }
    }, [initAudio]);

    const disconnectMic = useCallback(() => {
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(t => t.stop());
            micStreamRef.current = null;
        }
        setIsMicActive(false);
    }, []);

    /**
     * Basic frequency data extraction (legacy compatible)
     */
    const getFrequencyData = useCallback((): AudioAnalysisResult => {
        if (!analyserRef.current) return { bass: 0, mid: 0, high: 0, energy: 0 };

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Simple frequency banding
        const bassRange = dataArray.slice(0, 5);
        const midRange = dataArray.slice(5, 30);
        const highRange = dataArray.slice(30, 100);

        const bass = bassRange.reduce((a, b) => a + b, 0) / (bassRange.length * 255);
        const mid = midRange.reduce((a, b) => a + b, 0) / (midRange.length * 255);
        const high = highRange.reduce((a, b) => a + b, 0) / (highRange.length * 255);
        const energy = (bass * 0.5 + mid * 0.3 + high * 0.2);

        return { bass, mid, high, energy };
    }, []);

    /**
     * Enhanced frequency analysis with lookahead and beat detection
     * Use this for the Kinetic Engine integration
     */
    const getEnhancedFrequencyData = useCallback((): EnhancedAudioAnalysis => {
        const now = performance.now();

        if (!analyserRef.current) {
            return {
                bass: 0, mid: 0, high: 0, energy: 0,
                rawBass: 0, rawMid: 0, rawHigh: 0,
                peakBass: 0, peakMid: 0, peakHigh: 0,
                beatDetected: false,
                bpm: 120,
                lookahead: {
                    predictedEnergy: 0,
                    predictedBass: 0,
                    predictedMid: 0,
                    predictedHigh: 0,
                    impactIn: -1,
                    trend: 'stable'
                }
            };
        }

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Raw (unsmoothed) frequency banding
        const bassRange = dataArray.slice(0, 5);
        const midRange = dataArray.slice(5, 30);
        const highRange = dataArray.slice(30, 100);

        const rawBass = bassRange.reduce((a, b) => a + b, 0) / (bassRange.length * 255);
        const rawMid = midRange.reduce((a, b) => a + b, 0) / (midRange.length * 255);
        const rawHigh = highRange.reduce((a, b) => a + b, 0) / (highRange.length * 255);

        // Smoothed values (apply exponential smoothing)
        const smoothFactor = 0.3;
        const bass = prevBassRef.current * (1 - smoothFactor) + rawBass * smoothFactor;
        const mid = rawMid; // Mid doesn't need as much smoothing
        const high = rawHigh;
        const energy = (bass * 0.5 + mid * 0.3 + high * 0.2);

        // Update previous values
        prevBassRef.current = bass;

        // Update peak values (decay over time)
        const peakDecay = 0.95;
        peakBassRef.current = Math.max(rawBass, peakBassRef.current * peakDecay);
        peakMidRef.current = Math.max(rawMid, peakMidRef.current * peakDecay);
        peakHighRef.current = Math.max(rawHigh, peakHighRef.current * peakDecay);

        // Beat detection (onset detection via bass threshold)
        const beatThreshold = 0.5;
        const minBeatInterval = 200; // Minimum ms between beats
        const beatDetected = rawBass > beatThreshold &&
                             rawBass > peakBassRef.current * 0.8 &&
                             (now - lastBeatTimeRef.current) > minBeatInterval;

        if (beatDetected) {
            // Record beat interval for BPM estimation
            const interval = now - lastBeatTimeRef.current;
            if (interval > 0 && interval < 2000) {
                beatIntervalsRef.current.push(interval);
                if (beatIntervalsRef.current.length > 8) {
                    beatIntervalsRef.current.shift();
                }

                // Estimate BPM from average interval
                if (beatIntervalsRef.current.length >= 4) {
                    const avgInterval = beatIntervalsRef.current.reduce((a, b) => a + b, 0) /
                                        beatIntervalsRef.current.length;
                    estimatedBpmRef.current = Math.round(60000 / avgInterval);

                    // Clamp to reasonable BPM range
                    estimatedBpmRef.current = Math.max(60, Math.min(200, estimatedBpmRef.current));
                }
            }
            lastBeatTimeRef.current = now;
        }

        // Push to lookahead buffer
        const audioData = { bass, mid, high, energy };
        if (lookaheadBufferRef.current) {
            lookaheadBufferRef.current.push(audioData);
        }

        // Get lookahead prediction
        const lookahead = lookaheadBufferRef.current
            ? lookaheadBufferRef.current.analyzeFuture(200)
            : {
                predictedEnergy: energy,
                predictedBass: bass,
                predictedMid: mid,
                predictedHigh: high,
                impactIn: -1,
                trend: 'stable' as const
              };

        return {
            bass,
            mid,
            high,
            energy,
            rawBass,
            rawMid,
            rawHigh,
            peakBass: peakBassRef.current,
            peakMid: peakMidRef.current,
            peakHigh: peakHighRef.current,
            beatDetected,
            bpm: estimatedBpmRef.current,
            lookahead
        };
    }, []);

    /**
     * Get the lookahead buffer for direct access
     */
    const getLookaheadBuffer = useCallback(() => {
        return lookaheadBufferRef.current;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (micStreamRef.current) {
                micStreamRef.current.getTracks().forEach(t => t.stop());
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
            }
        };
    }, []);

    return {
        audioCtxRef,
        analyserRef,
        audioDestRef, // Exposed for recording
        isMicActive,
        initAudio,
        connectFileAudio,
        connectMicAudio,
        disconnectMic,
        getFrequencyData,
        // New enhanced analysis methods for Kinetic Core
        getEnhancedFrequencyData,
        getLookaheadBuffer
    };
};
