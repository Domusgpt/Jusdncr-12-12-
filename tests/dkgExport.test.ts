import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildAtlasLayout, buildDkgZip, buildManifest, createDkgMeta } from '../services/export/dkgExport';
import { GeneratedFrame } from '../types';

describe('dkg export helpers', () => {
  const frames: GeneratedFrame[] = [
    { url: 'frame-a.png', pose: 'pose-a', energy: 'low', type: 'body', role: 'base', direction: 'center' },
    { url: 'frame-b.png', pose: 'pose-b', energy: 'high', type: 'closeup', role: 'alt', direction: 'left' }
  ];

  it('builds manifest with atlas layout metadata', () => {
    const layout = buildAtlasLayout(frames, [
      { width: 640, height: 480 },
      { width: 640, height: 480 }
    ]);
    const manifest = buildManifest(frames, layout, 'CHARACTER');

    expect(manifest.frameCount).toBe(2);
    expect(manifest.atlas.columns).toBe(2);
    expect(manifest.atlas.rows).toBe(1);
    expect(manifest.frames[0].pose).toBe('pose-a');
    expect(manifest.frames[1].direction).toBe('left');
  });

  it('packages meta, manifest, and atlas into a zip', async () => {
    const layout = buildAtlasLayout(frames, [
      { width: 256, height: 256 },
      { width: 256, height: 256 }
    ]);
    const manifest = buildManifest(frames, layout, 'CHARACTER');
    const meta = createDkgMeta('CHARACTER');
    const atlasBlob = new Blob(['atlas']);

    const zipBlob = await buildDkgZip(atlasBlob, manifest, meta);
    const zip = await JSZip.loadAsync(zipBlob);

    expect(zip.file('meta.json')).toBeTruthy();
    expect(zip.file('manifest.json')).toBeTruthy();
    expect(zip.file('atlas.webp')).toBeTruthy();
  });
});
