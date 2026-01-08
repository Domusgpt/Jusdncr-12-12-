import { PulseFrame } from '../engine/pulseEngine';

interface PulseCardProps {
  frame: PulseFrame;
}

export const PulseCard = ({ frame }: PulseCardProps) => (
  <section className="vnext-card">
    <div className="vnext-pill">Pulse Engine</div>
    <h2>{frame.focus}</h2>
    <p>{frame.description}</p>
    <div className="vnext-metric">{frame.bpm} BPM</div>
    <p>Intensity: {Math.round(frame.intensity * 100)}%</p>
  </section>
);
