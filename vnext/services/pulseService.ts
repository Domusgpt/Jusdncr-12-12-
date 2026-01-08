import { buildPulseFrame, PulseFrame, PulseMode } from '../engine/pulseEngine';

export const getPulseProfile = (mode: PulseMode): PulseFrame => {
  const intensity = mode === 'performance' ? 0.88 : 0.52;
  return buildPulseFrame(mode, intensity);
};
