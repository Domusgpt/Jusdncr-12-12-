export type PulseMode = 'ambient' | 'performance';

export interface PulseFrame {
  bpm: number;
  intensity: number;
  focus: string;
  description: string;
}

const focusMap: Record<PulseMode, string> = {
  ambient: 'Warm-up flow',
  performance: 'Stage-ready impact',
};

export const buildPulseFrame = (mode: PulseMode, intensity: number): PulseFrame => {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));
  const baseBpm = mode === 'performance' ? 118 : 92;
  const bpm = Math.round(baseBpm + clampedIntensity * 24);

  return {
    bpm,
    intensity: Number(clampedIntensity.toFixed(2)),
    focus: focusMap[mode],
    description:
      mode === 'performance'
        ? 'Sharper transitions with higher kinetic peaks.'
        : 'Longer arcs and elastic grooves for rehearsal sessions.',
  };
};
