import { describe, expect, it } from 'vitest';

import { generatePlayerHTML } from '../../services/playerExport';
import { HolographicParams } from '../../components/Visualizer/HolographicVisualizer';
import { GeneratedFrame } from '../../types';

describe('generatePlayerHTML', () => {
  it('replaces template placeholders with injected data', () => {
    const frames: GeneratedFrame[] = [
      {
        url: 'https://example.com/frame.png',
        pose: 'POSE_01',
        energy: 'low',
      },
    ];
    const params: HolographicParams = {
      hue: 120,
      saturation: 0.75,
    };

    const html = generatePlayerHTML(frames, params, 'CHARACTER');

    expect(html).toContain('MODE: <span id="subjectDisplay">CHARACTER</span>');
    expect(html).toContain('"pose":"POSE_01"');
    expect(html).toContain('"hue":120');
    expect(html).toContain('attribute vec2 a_position');
    expect(html).not.toContain('{{FRAMES_JSON}}');
    expect(html).not.toContain('{{STYLES}}');
    expect(html).not.toContain('{{RUNTIME}}');
  });
});
