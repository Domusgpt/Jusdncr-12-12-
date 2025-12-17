/**
 * SONG ANALYZER
 *
 * Pre-analyzes entire audio files to extract:
 * - Beat positions and strengths
 * - BPM and time signature
 * - Song sections (intro, verse, chorus, drop, etc.)
 * - Repeated patterns for signature moves
 * - Energy profile over time
 *
 * This enables intentional choreography instead of reactive guessing.
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type SectionType = 'intro' | 'verse' | 'prechorus' | 'chorus' | 'bridge' | 'breakdown' | 'drop' | 'outro';

export interface BeatMarker {
  time: number;          // ms from start
  index: number;         // Beat number
  strength: number;      // 0-1 intensity
  isDownbeat: boolean;   // First beat of bar
  frequency: 'bass' | 'mid' | 'high';  // Dominant frequency at this beat
}

export interface SongSection {
  type: SectionType;
  startTime: number;     // ms
  endTime: number;       // ms
  startBeat: number;     // Beat index
  endBeat: number;
  energy: number;        // Average energy 0-1
  isRepeat: boolean;     // True if repeats earlier content
  repeatOf?: number;     // Index of first occurrence
}

export interface RepeatedPattern {
  id: string;
  occurrences: { startTime: number; endTime: number }[];
  duration: number;      // ms
  beatCount: number;
  energy: number;        // Average energy of pattern
}

export interface EnergyPoint {
  time: number;          // ms
  beatIndex: number;
  energy: number;        // 0-1
  bass: number;
  mid: number;
  high: number;
}

export interface DropMarker {
  time: number;
  beatIndex: number;
  intensity: number;     // How strong the drop is
  buildupStart: number;  // When buildup began
}

export interface BuildupMarker {
  startTime: number;
  endTime: number;
  startBeat: number;
  endBeat: number;
  targetDropIndex: number;
}

export interface SongMap {
  // Timing & Rhythm
  bpm: number;
  timeSignature: [number, number];
  duration: number;                    // Total duration in ms
  beats: BeatMarker[];
  downbeats: number[];                 // First beat of each bar (ms)

  // Structural Sections
  sections: SongSection[];

  // Repeated Patterns
  patterns: RepeatedPattern[];

  // Energy Curve
  energyProfile: EnergyPoint[];

  // Key Moments
  drops: DropMarker[];
  buildups: BuildupMarker[];

  // Analysis metadata
  analyzedAt: number;
  analysisVersion: string;
}

// =============================================================================
// SONG ANALYZER
// =============================================================================

export class SongAnalyzer {
  private audioContext: OfflineAudioContext | null = null;
  private sampleRate: number = 44100;

  /**
   * Analyze entire song and return complete SongMap
   */
  async analyzeSong(audioBuffer: AudioBuffer): Promise<SongMap> {
    console.time('[SongAnalyzer] Full analysis');

    this.sampleRate = audioBuffer.sampleRate;
    const durationMs = (audioBuffer.length / audioBuffer.sampleRate) * 1000;

    // Run analyses in parallel where possible
    const [
      { beats, bpm },
      energyProfile,
    ] = await Promise.all([
      this.detectBeatsAndBPM(audioBuffer),
      this.computeEnergyProfile(audioBuffer),
    ]);

    // These depend on previous results
    const sections = this.detectSections(energyProfile, beats, bpm);
    const patterns = this.findRepeatedPatterns(energyProfile, beats, bpm);
    const { drops, buildups } = this.findDropsAndBuildups(energyProfile, sections);

    const songMap: SongMap = {
      bpm,
      timeSignature: [4, 4], // Assume 4/4 for now
      duration: durationMs,
      beats,
      downbeats: beats.filter(b => b.isDownbeat).map(b => b.time),
      sections,
      patterns,
      energyProfile,
      drops,
      buildups,
      analyzedAt: Date.now(),
      analysisVersion: '1.0.0'
    };

    console.timeEnd('[SongAnalyzer] Full analysis');
    console.log(`[SongAnalyzer] Found ${beats.length} beats, ${sections.length} sections, ${patterns.length} patterns, ${drops.length} drops`);

    return songMap;
  }

  /**
   * Detect beats and estimate BPM using onset detection
   */
  private async detectBeatsAndBPM(buffer: AudioBuffer): Promise<{ beats: BeatMarker[]; bpm: number }> {
    // Get audio data (mono)
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;

    // Window size for analysis (roughly 23ms at 44.1kHz)
    const windowSize = 1024;
    const hopSize = 512;

    // Compute onset envelope (spectral flux)
    const onsets: { time: number; strength: number; frequency: 'bass' | 'mid' | 'high' }[] = [];
    let prevSpectrum: Float32Array | null = null;

    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      const window = channelData.slice(i, i + windowSize);
      const spectrum = this.computeSpectrum(window);

      if (prevSpectrum) {
        // Compute spectral flux (positive changes only)
        let bassFlux = 0, midFlux = 0, highFlux = 0;

        for (let j = 0; j < spectrum.length; j++) {
          const diff = Math.max(0, spectrum[j] - prevSpectrum[j]);
          if (j < spectrum.length * 0.1) bassFlux += diff;
          else if (j < spectrum.length * 0.4) midFlux += diff;
          else highFlux += diff;
        }

        const totalFlux = bassFlux + midFlux + highFlux;

        if (totalFlux > 0.1) { // Threshold for onset
          const time = (i / sampleRate) * 1000;
          const frequency = bassFlux > midFlux && bassFlux > highFlux ? 'bass' :
            midFlux > highFlux ? 'mid' : 'high';

          onsets.push({
            time,
            strength: Math.min(1, totalFlux),
            frequency
          });
        }
      }

      prevSpectrum = spectrum;
    }

    // Estimate BPM using onset intervals
    const bpm = this.estimateBPM(onsets);
    const beatInterval = 60000 / bpm;

    // Quantize onsets to beat grid
    const beats: BeatMarker[] = [];
    const durationMs = (buffer.length / sampleRate) * 1000;

    for (let beatIndex = 0; beatIndex * beatInterval < durationMs; beatIndex++) {
      const expectedTime = beatIndex * beatInterval;

      // Find nearest onset within tolerance
      const tolerance = beatInterval * 0.25;
      const nearestOnset = onsets.find(o =>
        Math.abs(o.time - expectedTime) < tolerance
      );

      beats.push({
        time: expectedTime,
        index: beatIndex,
        strength: nearestOnset ? nearestOnset.strength : 0.3,
        isDownbeat: beatIndex % 4 === 0, // Assuming 4/4
        frequency: nearestOnset?.frequency || 'bass'
      });
    }

    return { beats, bpm };
  }

  /**
   * Simple FFT-like spectrum computation
   */
  private computeSpectrum(samples: Float32Array): Float32Array {
    // Simplified DFT for onset detection (not full FFT)
    const N = samples.length;
    const spectrum = new Float32Array(N / 2);

    for (let k = 0; k < N / 2; k++) {
      let real = 0, imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += samples[n] * Math.cos(angle);
        imag += samples[n] * Math.sin(angle);
      }
      spectrum[k] = Math.sqrt(real * real + imag * imag) / N;
    }

    return spectrum;
  }

  /**
   * Estimate BPM from onset intervals
   */
  private estimateBPM(onsets: { time: number; strength: number }[]): number {
    if (onsets.length < 4) return 120; // Default

    // Compute intervals between strong onsets
    const intervals: number[] = [];
    const strongOnsets = onsets.filter(o => o.strength > 0.3);

    for (let i = 1; i < strongOnsets.length; i++) {
      const interval = strongOnsets[i].time - strongOnsets[i - 1].time;
      if (interval > 200 && interval < 2000) { // Valid beat range
        intervals.push(interval);
      }
    }

    if (intervals.length < 2) return 120;

    // Find most common interval (histogram approach)
    const histogram = new Map<number, number>();
    const binSize = 20; // ms

    for (const interval of intervals) {
      const bin = Math.round(interval / binSize) * binSize;
      histogram.set(bin, (histogram.get(bin) || 0) + 1);
    }

    // Find peak
    let maxCount = 0;
    let peakInterval = 500; // Default to 120 BPM

    for (const [interval, count] of histogram) {
      if (count > maxCount) {
        maxCount = count;
        peakInterval = interval;
      }
    }

    // Convert to BPM
    let bpm = Math.round(60000 / peakInterval);

    // Normalize to reasonable range (60-180)
    while (bpm < 60) bpm *= 2;
    while (bpm > 180) bpm /= 2;

    return bpm;
  }

  /**
   * Compute energy profile at each beat
   */
  private async computeEnergyProfile(buffer: AudioBuffer): Promise<EnergyPoint[]> {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const profile: EnergyPoint[] = [];

    // Analyze every 50ms
    const windowMs = 50;
    const windowSamples = Math.floor(sampleRate * windowMs / 1000);

    for (let i = 0; i < channelData.length - windowSamples; i += windowSamples) {
      const window = channelData.slice(i, i + windowSamples);
      const spectrum = this.computeSpectrum(window);

      // Compute band energies
      const bassEnd = Math.floor(spectrum.length * 0.1);
      const midEnd = Math.floor(spectrum.length * 0.4);

      let bass = 0, mid = 0, high = 0;
      for (let j = 0; j < bassEnd; j++) bass += spectrum[j];
      for (let j = bassEnd; j < midEnd; j++) mid += spectrum[j];
      for (let j = midEnd; j < spectrum.length; j++) high += spectrum[j];

      bass /= bassEnd;
      mid /= (midEnd - bassEnd);
      high /= (spectrum.length - midEnd);

      // Normalize
      const maxVal = Math.max(bass, mid, high, 0.001);
      bass = Math.min(1, bass / maxVal);
      mid = Math.min(1, mid / maxVal);
      high = Math.min(1, high / maxVal);

      const energy = bass * 0.5 + mid * 0.3 + high * 0.2;
      const time = (i / sampleRate) * 1000;
      const beatIndex = Math.floor(time / 500); // Approximate

      profile.push({ time, beatIndex, energy, bass, mid, high });
    }

    return profile;
  }

  /**
   * Detect song sections based on energy changes
   */
  private detectSections(
    energyProfile: EnergyPoint[],
    beats: BeatMarker[],
    bpm: number
  ): SongSection[] {
    const sections: SongSection[] = [];
    const beatInterval = 60000 / bpm;

    if (energyProfile.length < 10) return sections;

    // Smooth energy for section detection
    const smoothedEnergy = this.smoothArray(energyProfile.map(e => e.energy), 20);

    // Detect section boundaries via novelty (large energy changes)
    const boundaries: number[] = [0];
    const minSectionLength = 8 * beatInterval; // Minimum 8 beats

    for (let i = 20; i < smoothedEnergy.length - 20; i++) {
      const localAvgBefore = smoothedEnergy.slice(i - 20, i).reduce((a, b) => a + b, 0) / 20;
      const localAvgAfter = smoothedEnergy.slice(i, i + 20).reduce((a, b) => a + b, 0) / 20;
      const change = Math.abs(localAvgAfter - localAvgBefore);

      if (change > 0.15) { // Significant change
        const time = energyProfile[i].time;
        const lastBoundary = boundaries[boundaries.length - 1];

        if (time - lastBoundary > minSectionLength) {
          boundaries.push(time);
        }
      }
    }

    // Add end boundary
    const lastTime = energyProfile[energyProfile.length - 1].time;
    if (lastTime - boundaries[boundaries.length - 1] > minSectionLength) {
      boundaries.push(lastTime);
    }

    // Classify each section
    for (let i = 0; i < boundaries.length - 1; i++) {
      const startTime = boundaries[i];
      const endTime = boundaries[i + 1];

      // Calculate section energy
      const sectionPoints = energyProfile.filter(e =>
        e.time >= startTime && e.time < endTime
      );
      const avgEnergy = sectionPoints.reduce((sum, e) => sum + e.energy, 0) / sectionPoints.length;

      // Classify based on position and energy
      const type = this.classifySectionType(
        avgEnergy,
        i,
        boundaries.length - 1,
        startTime,
        lastTime
      );

      const startBeat = Math.floor(startTime / beatInterval);
      const endBeat = Math.floor(endTime / beatInterval);

      // Check if this section is similar to a previous one
      let isRepeat = false;
      let repeatOf: number | undefined;

      for (let j = 0; j < sections.length; j++) {
        if (Math.abs(sections[j].energy - avgEnergy) < 0.1 &&
          sections[j].type === type) {
          isRepeat = true;
          repeatOf = j;
          break;
        }
      }

      sections.push({
        type,
        startTime,
        endTime,
        startBeat,
        endBeat,
        energy: avgEnergy,
        isRepeat,
        repeatOf
      });
    }

    return sections;
  }

  private classifySectionType(
    energy: number,
    index: number,
    totalSections: number,
    startTime: number,
    totalDuration: number
  ): SectionType {
    const relativePosition = startTime / totalDuration;

    // Position-based classification
    if (relativePosition < 0.08) return 'intro';
    if (relativePosition > 0.92) return 'outro';

    // Energy-based classification
    if (energy > 0.8) return 'drop';
    if (energy > 0.65) return 'chorus';
    if (energy < 0.25) return 'breakdown';
    if (energy < 0.4) return 'verse';

    // Default to verse if uncertain
    return 'verse';
  }

  /**
   * Find repeated patterns (for signature moves)
   */
  private findRepeatedPatterns(
    energyProfile: EnergyPoint[],
    beats: BeatMarker[],
    bpm: number
  ): RepeatedPattern[] {
    const patterns: RepeatedPattern[] = [];
    const beatInterval = 60000 / bpm;

    // Window size: 4 beats (1 bar in 4/4)
    const windowBeats = 4;
    const windowMs = windowBeats * beatInterval;
    const hopMs = beatInterval; // Check every beat

    // Create fingerprints for each window
    const fingerprints: { time: number; signature: number[] }[] = [];

    for (let t = 0; t < energyProfile[energyProfile.length - 1].time - windowMs; t += hopMs) {
      const windowPoints = energyProfile.filter(e =>
        e.time >= t && e.time < t + windowMs
      );

      if (windowPoints.length < 4) continue;

      // Create simple fingerprint (energy curve shape)
      const signature = windowPoints.map(p => Math.round(p.energy * 10));
      fingerprints.push({ time: t, signature });
    }

    // Find similar fingerprints
    const usedTimes = new Set<number>();

    for (let i = 0; i < fingerprints.length; i++) {
      if (usedTimes.has(fingerprints[i].time)) continue;

      const matches: { startTime: number; endTime: number }[] = [];

      for (let j = i + windowBeats; j < fingerprints.length; j++) {
        if (usedTimes.has(fingerprints[j].time)) continue;

        const similarity = this.computeSimilarity(
          fingerprints[i].signature,
          fingerprints[j].signature
        );

        if (similarity > 0.8) { // 80% similar
          matches.push({
            startTime: fingerprints[j].time,
            endTime: fingerprints[j].time + windowMs
          });
          usedTimes.add(fingerprints[j].time);
        }
      }

      if (matches.length >= 1) { // At least 2 occurrences total
        const firstOccurrence = {
          startTime: fingerprints[i].time,
          endTime: fingerprints[i].time + windowMs
        };

        const avgEnergy = energyProfile
          .filter(e => e.time >= firstOccurrence.startTime && e.time < firstOccurrence.endTime)
          .reduce((sum, e) => sum + e.energy, 0) / windowBeats;

        patterns.push({
          id: `pattern_${patterns.length}`,
          occurrences: [firstOccurrence, ...matches],
          duration: windowMs,
          beatCount: windowBeats,
          energy: avgEnergy
        });

        usedTimes.add(fingerprints[i].time);
      }
    }

    return patterns;
  }

  private computeSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let matches = 0;
    for (let i = 0; i < a.length; i++) {
      if (Math.abs(a[i] - b[i]) <= 1) matches++;
    }

    return matches / a.length;
  }

  /**
   * Find drops and buildups
   */
  private findDropsAndBuildups(
    energyProfile: EnergyPoint[],
    sections: SongSection[]
  ): { drops: DropMarker[]; buildups: BuildupMarker[] } {
    const drops: DropMarker[] = [];
    const buildups: BuildupMarker[] = [];

    // Find drops (sudden high energy after lower energy)
    const smoothedEnergy = this.smoothArray(energyProfile.map(e => e.energy), 10);

    for (let i = 20; i < smoothedEnergy.length; i++) {
      const prevAvg = smoothedEnergy.slice(i - 20, i - 5).reduce((a, b) => a + b, 0) / 15;
      const current = smoothedEnergy[i];

      // Large sudden increase = drop
      if (current - prevAvg > 0.3 && current > 0.7) {
        const dropTime = energyProfile[i].time;
        const beatIndex = energyProfile[i].beatIndex;

        // Check if we already have a drop nearby
        const nearby = drops.find(d => Math.abs(d.time - dropTime) < 2000);
        if (nearby) continue;

        // Find buildup start (where energy started rising)
        let buildupStart = dropTime - 2000;
        for (let j = i - 1; j >= 0 && j > i - 40; j--) {
          if (smoothedEnergy[j] < 0.4) {
            buildupStart = energyProfile[j].time;
            break;
          }
        }

        drops.push({
          time: dropTime,
          beatIndex,
          intensity: current,
          buildupStart
        });

        // Create corresponding buildup
        const buildupSection = sections.find(s =>
          s.startTime <= buildupStart && s.endTime >= buildupStart
        );

        if (buildupSection) {
          buildups.push({
            startTime: buildupStart,
            endTime: dropTime,
            startBeat: Math.floor(buildupStart / (60000 / 120)), // Approximate
            endBeat: beatIndex,
            targetDropIndex: drops.length - 1
          });
        }
      }
    }

    return { drops, buildups };
  }

  private smoothArray(arr: number[], windowSize: number): number[] {
    const result: number[] = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < arr.length; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(arr.length, i + halfWindow + 1);
      const window = arr.slice(start, end);
      result.push(window.reduce((a, b) => a + b, 0) / window.length);
    }

    return result;
  }
}

// =============================================================================
// UTILITY: Get section at specific time
// =============================================================================

export function getSectionAtTime(songMap: SongMap, timeMs: number): SongSection | null {
  return songMap.sections.find(s =>
    timeMs >= s.startTime && timeMs < s.endTime
  ) || null;
}

export function getBeatAtTime(songMap: SongMap, timeMs: number): BeatMarker | null {
  const beatInterval = 60000 / songMap.bpm;
  const beatIndex = Math.floor(timeMs / beatInterval);
  return songMap.beats[beatIndex] || null;
}

export function getPatternAtTime(songMap: SongMap, timeMs: number): RepeatedPattern | null {
  for (const pattern of songMap.patterns) {
    for (const occurrence of pattern.occurrences) {
      if (timeMs >= occurrence.startTime && timeMs < occurrence.endTime) {
        return pattern;
      }
    }
  }
  return null;
}

export function isInBuildup(songMap: SongMap, timeMs: number): BuildupMarker | null {
  return songMap.buildups.find(b =>
    timeMs >= b.startTime && timeMs < b.endTime
  ) || null;
}
