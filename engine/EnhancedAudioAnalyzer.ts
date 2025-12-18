/**
 * ENHANCED AUDIO ANALYZER
 *
 * Advanced audio analysis features:
 * - Multi-band onset detection (separates kick, snare, hihat)
 * - Spectral flux (rate of spectral change)
 * - Spectral centroid (brightness measure)
 * - Improved BPM estimation via autocorrelation
 * - 32-beat phrase tracking
 */

export interface MultiBandOnsets {
  kick: number;      // 0-1 kick drum onset
  snare: number;     // 0-1 snare onset
  hihat: number;     // 0-1 hihat onset
  kickDetected: boolean;
  snareDetected: boolean;
  hihatDetected: boolean;
}

export interface SpectralFeatures {
  centroid: number;  // Spectral centroid (normalized 0-1)
  flux: number;      // Spectral flux (rate of change)
  rolloff: number;   // Spectral rolloff point
  flatness: number;  // Spectral flatness (noise vs tone)
}

export interface PhraseState {
  beatInPhrase: number;      // 0-31 position in 32-beat phrase
  phraseSection: PhraseSection;
  measureInPhrase: number;   // 0-7 (8 measures of 4 beats)
  isDownbeat: boolean;       // Beat 1 of measure
  isPhraseBoundary: boolean; // Beat 1 of phrase
}

export type PhraseSection =
  | 'INTRO'      // Beats 0-7: Build anticipation
  | 'VERSE_A'    // Beats 8-15: Establish groove
  | 'VERSE_B'    // Beats 16-23: Variation
  | 'CHORUS'     // Beats 24-27: Peak energy
  | 'DROP';      // Beats 28-31: Release/impact

export interface EnhancedAudioFeatures {
  // Basic bands
  bass: number;
  mid: number;
  high: number;
  energy: number;

  // Enhanced onsets
  onsets: MultiBandOnsets;

  // Spectral features
  spectral: SpectralFeatures;

  // Phrase tracking
  phrase: PhraseState;

  // BPM
  bpm: number;
  confidence: number; // BPM detection confidence
}

/**
 * Ring buffer for spectral history
 */
class SpectralHistoryBuffer {
  private buffer: Float32Array[] = [];
  private maxSize: number;

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  push(spectrum: Float32Array): void {
    this.buffer.push(new Float32Array(spectrum));
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getLast(): Float32Array | null {
    return this.buffer.length > 0 ? this.buffer[this.buffer.length - 1] : null;
  }

  getPrevious(): Float32Array | null {
    return this.buffer.length > 1 ? this.buffer[this.buffer.length - 2] : null;
  }

  getHistory(): Float32Array[] {
    return [...this.buffer];
  }
}

/**
 * Enhanced Audio Analyzer class
 */
export class EnhancedAudioAnalyzer {
  private spectralHistory: SpectralHistoryBuffer;
  private onsetHistory: { kick: number[]; snare: number[]; hihat: number[] };
  private energyHistory: number[] = [];
  private beatTimes: number[] = [];
  private lastBeatTime: number = 0;
  private beatCounter: number = 0;
  private estimatedBpm: number = 120;
  private bpmConfidence: number = 0;

  // Threshold adaptivity
  private kickThreshold: number = 0.5;
  private snareThreshold: number = 0.4;
  private hihatThreshold: number = 0.3;

  // Frequency band definitions (for FFT bin mapping)
  // Assuming 256-point FFT at 44.1kHz: bin = freq * 256 / 44100
  private readonly KICK_BINS = { start: 1, end: 4 };   // ~86-344 Hz
  private readonly SNARE_BINS = { start: 5, end: 15 }; // ~430-1290 Hz
  private readonly HIHAT_BINS = { start: 30, end: 80 }; // ~2580-6880 Hz

  constructor() {
    this.spectralHistory = new SpectralHistoryBuffer(10);
    this.onsetHistory = {
      kick: new Array(8).fill(0),
      snare: new Array(8).fill(0),
      hihat: new Array(8).fill(0)
    };
  }

  /**
   * Main analysis function
   */
  analyze(frequencyData: Uint8Array, sampleRate: number = 44100): EnhancedAudioFeatures {
    const now = performance.now();
    const spectrum = new Float32Array(frequencyData.length);

    // Normalize to 0-1
    for (let i = 0; i < frequencyData.length; i++) {
      spectrum[i] = frequencyData[i] / 255;
    }

    // Calculate basic bands
    const bands = this.calculateBands(spectrum);

    // Calculate spectral features
    const spectral = this.calculateSpectralFeatures(spectrum, sampleRate);

    // Detect onsets
    const onsets = this.detectOnsets(spectrum, now);

    // Update BPM estimation
    this.updateBPMEstimation(onsets, now);

    // Calculate phrase position
    const phrase = this.calculatePhraseState(now);

    // Calculate overall energy
    const energy = bands.bass * 0.5 + bands.mid * 0.3 + bands.high * 0.2;
    this.energyHistory.push(energy);
    if (this.energyHistory.length > 60) this.energyHistory.shift();

    // Store spectrum for flux calculation
    this.spectralHistory.push(spectrum);

    return {
      bass: bands.bass,
      mid: bands.mid,
      high: bands.high,
      energy,
      onsets,
      spectral,
      phrase,
      bpm: this.estimatedBpm,
      confidence: this.bpmConfidence
    };
  }

  /**
   * Calculate frequency bands
   */
  private calculateBands(spectrum: Float32Array): { bass: number; mid: number; high: number } {
    // Bass: bins 0-5 (~0-430 Hz)
    let bass = 0;
    for (let i = 0; i <= 5; i++) {
      bass += spectrum[i] || 0;
    }
    bass /= 6;

    // Mid: bins 5-30 (~430-2580 Hz)
    let mid = 0;
    for (let i = 5; i <= 30; i++) {
      mid += spectrum[i] || 0;
    }
    mid /= 26;

    // High: bins 30-100 (~2580-8600 Hz)
    let high = 0;
    for (let i = 30; i <= 100; i++) {
      high += spectrum[i] || 0;
    }
    high /= 71;

    return { bass, mid, high };
  }

  /**
   * Calculate spectral features
   */
  private calculateSpectralFeatures(spectrum: Float32Array, sampleRate: number): SpectralFeatures {
    const prevSpectrum = this.spectralHistory.getPrevious();

    // Spectral Centroid (center of mass of spectrum)
    let weightedSum = 0;
    let totalMagnitude = 0;
    for (let i = 0; i < spectrum.length; i++) {
      const freq = (i * sampleRate) / (2 * spectrum.length);
      weightedSum += freq * spectrum[i];
      totalMagnitude += spectrum[i];
    }
    const centroidHz = totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;
    // Normalize to 0-1 (assuming max ~10kHz)
    const centroid = Math.min(1, centroidHz / 10000);

    // Spectral Flux (sum of positive differences)
    let flux = 0;
    if (prevSpectrum) {
      for (let i = 0; i < spectrum.length; i++) {
        const diff = spectrum[i] - (prevSpectrum[i] || 0);
        if (diff > 0) flux += diff;
      }
      // Normalize
      flux = Math.min(1, flux / (spectrum.length * 0.1));
    }

    // Spectral Rolloff (frequency below which 85% of energy lies)
    let cumSum = 0;
    const totalEnergy = spectrum.reduce((a, b) => a + b, 0);
    const rolloffThreshold = totalEnergy * 0.85;
    let rolloffBin = spectrum.length - 1;
    for (let i = 0; i < spectrum.length; i++) {
      cumSum += spectrum[i];
      if (cumSum >= rolloffThreshold) {
        rolloffBin = i;
        break;
      }
    }
    const rolloff = rolloffBin / spectrum.length;

    // Spectral Flatness (geometric mean / arithmetic mean)
    // High flatness = noise-like, low flatness = tonal
    let logSum = 0;
    let linSum = 0;
    let count = 0;
    for (let i = 0; i < spectrum.length; i++) {
      if (spectrum[i] > 0.001) {
        logSum += Math.log(spectrum[i]);
        linSum += spectrum[i];
        count++;
      }
    }
    const geometricMean = count > 0 ? Math.exp(logSum / count) : 0;
    const arithmeticMean = count > 0 ? linSum / count : 0;
    const flatness = arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;

    return { centroid, flux, rolloff, flatness };
  }

  /**
   * Detect onsets in different frequency bands
   */
  private detectOnsets(spectrum: Float32Array, now: number): MultiBandOnsets {
    // Calculate band energies
    let kickEnergy = 0;
    for (let i = this.KICK_BINS.start; i <= this.KICK_BINS.end; i++) {
      kickEnergy += spectrum[i] || 0;
    }
    kickEnergy /= (this.KICK_BINS.end - this.KICK_BINS.start + 1);

    let snareEnergy = 0;
    for (let i = this.SNARE_BINS.start; i <= this.SNARE_BINS.end; i++) {
      snareEnergy += spectrum[i] || 0;
    }
    snareEnergy /= (this.SNARE_BINS.end - this.SNARE_BINS.start + 1);

    let hihatEnergy = 0;
    for (let i = this.HIHAT_BINS.start; i <= this.HIHAT_BINS.end; i++) {
      hihatEnergy += spectrum[i] || 0;
    }
    hihatEnergy /= (this.HIHAT_BINS.end - this.HIHAT_BINS.start + 1);

    // Update history for adaptive thresholding
    this.onsetHistory.kick.push(kickEnergy);
    this.onsetHistory.snare.push(snareEnergy);
    this.onsetHistory.hihat.push(hihatEnergy);
    if (this.onsetHistory.kick.length > 8) {
      this.onsetHistory.kick.shift();
      this.onsetHistory.snare.shift();
      this.onsetHistory.hihat.shift();
    }

    // Adaptive thresholds (mean + std deviation)
    const kickMean = this.onsetHistory.kick.reduce((a, b) => a + b, 0) / this.onsetHistory.kick.length;
    const snareMean = this.onsetHistory.snare.reduce((a, b) => a + b, 0) / this.onsetHistory.snare.length;
    const hihatMean = this.onsetHistory.hihat.reduce((a, b) => a + b, 0) / this.onsetHistory.hihat.length;

    // Onset detection using relative threshold
    const kickThreshold = Math.max(0.3, kickMean * 1.5);
    const snareThreshold = Math.max(0.25, snareMean * 1.4);
    const hihatThreshold = Math.max(0.2, hihatMean * 1.3);

    // Minimum interval between detections (ms)
    const MIN_KICK_INTERVAL = 150;
    const MIN_SNARE_INTERVAL = 100;
    const MIN_HIHAT_INTERVAL = 50;

    const kickDetected = kickEnergy > kickThreshold && (now - this.lastBeatTime) > MIN_KICK_INTERVAL;
    const snareDetected = snareEnergy > snareThreshold;
    const hihatDetected = hihatEnergy > hihatThreshold;

    // Update beat time on kick
    if (kickDetected) {
      this.lastBeatTime = now;
      this.beatCounter++;
    }

    return {
      kick: kickEnergy,
      snare: snareEnergy,
      hihat: hihatEnergy,
      kickDetected,
      snareDetected,
      hihatDetected
    };
  }

  /**
   * Update BPM estimation using onset intervals
   */
  private updateBPMEstimation(onsets: MultiBandOnsets, now: number): void {
    if (onsets.kickDetected) {
      this.beatTimes.push(now);

      // Keep last 16 beats for analysis
      if (this.beatTimes.length > 16) {
        this.beatTimes.shift();
      }

      // Calculate intervals
      if (this.beatTimes.length >= 4) {
        const intervals: number[] = [];
        for (let i = 1; i < this.beatTimes.length; i++) {
          const interval = this.beatTimes[i] - this.beatTimes[i - 1];
          // Filter reasonable intervals (200ms - 2000ms = 30-300 BPM)
          if (interval > 200 && interval < 2000) {
            intervals.push(interval);
          }
        }

        if (intervals.length >= 3) {
          // Use median for robustness
          intervals.sort((a, b) => a - b);
          const medianInterval = intervals[Math.floor(intervals.length / 2)];

          // Convert to BPM
          const bpm = 60000 / medianInterval;

          // Check if it's a reasonable BPM range (60-180)
          if (bpm >= 60 && bpm <= 180) {
            // Smooth the BPM estimation
            this.estimatedBpm = this.estimatedBpm * 0.8 + bpm * 0.2;

            // Calculate confidence based on interval consistency
            const variance = intervals.reduce((sum, i) => sum + Math.pow(i - medianInterval, 2), 0) / intervals.length;
            const stdDev = Math.sqrt(variance);
            this.bpmConfidence = Math.max(0, 1 - (stdDev / medianInterval));
          }
        }
      }
    }
  }

  /**
   * Calculate phrase state based on beat counter and BPM
   */
  private calculatePhraseState(now: number): PhraseState {
    const beatDuration = 60000 / this.estimatedBpm;
    const beatsElapsed = this.beatCounter;

    // Position in 32-beat phrase
    const beatInPhrase = beatsElapsed % 32;

    // Which measure (0-7)
    const measureInPhrase = Math.floor(beatInPhrase / 4);

    // Determine phrase section
    let phraseSection: PhraseSection;
    if (beatInPhrase < 8) {
      phraseSection = 'INTRO';
    } else if (beatInPhrase < 16) {
      phraseSection = 'VERSE_A';
    } else if (beatInPhrase < 24) {
      phraseSection = 'VERSE_B';
    } else if (beatInPhrase < 28) {
      phraseSection = 'CHORUS';
    } else {
      phraseSection = 'DROP';
    }

    return {
      beatInPhrase,
      phraseSection,
      measureInPhrase,
      isDownbeat: (beatInPhrase % 4) === 0,
      isPhraseBoundary: beatInPhrase === 0
    };
  }

  /**
   * Get current BPM
   */
  getBPM(): number {
    return this.estimatedBpm;
  }

  /**
   * Get BPM confidence
   */
  getBPMConfidence(): number {
    return this.bpmConfidence;
  }

  /**
   * Get current beat counter
   */
  getBeatCounter(): number {
    return this.beatCounter;
  }

  /**
   * Reset the analyzer state
   */
  reset(): void {
    this.beatCounter = 0;
    this.beatTimes = [];
    this.lastBeatTime = 0;
    this.estimatedBpm = 120;
    this.bpmConfidence = 0;
    this.energyHistory = [];
    this.onsetHistory = {
      kick: new Array(8).fill(0),
      snare: new Array(8).fill(0),
      hihat: new Array(8).fill(0)
    };
  }
}
