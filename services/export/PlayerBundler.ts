import fs from 'fs';
import path from 'path';

import { HolographicParams } from '../../components/Visualizer/HolographicVisualizer';
import { GeneratedFrame, SubjectCategory } from '../../types';

type PlayerBundleOptions = {
  frames: GeneratedFrame[];
  hologramParams: HolographicParams;
  subjectCategory: SubjectCategory;
  vertexShader: string;
  fragmentShader: string;
};

const TEMPLATE_DIR = path.resolve(__dirname, '../../templates/player');

const readTemplate = (filename: string): string =>
  fs.readFileSync(path.join(TEMPLATE_DIR, filename), 'utf8');

const applyReplacements = (
  template: string,
  replacements: Record<string, string>
): string => {
  let output = template;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.replaceAll(`{{${key}}}`, value);
  }
  return output;
};

export const bundlePlayerTemplate = ({
  frames,
  hologramParams,
  subjectCategory,
  vertexShader,
  fragmentShader,
}: PlayerBundleOptions): string => {
  const htmlTemplate = readTemplate('index.html');
  const stylesTemplate = readTemplate('styles.css');
  const runtimeTemplate = readTemplate('runtime.js');

  const runtime = applyReplacements(runtimeTemplate, {
    FRAMES_JSON: JSON.stringify(frames),
    PARAMS_JSON: JSON.stringify(hologramParams),
    SUBJECT_CATEGORY_JSON: JSON.stringify(subjectCategory),
    VERTEX_SHADER_JSON: JSON.stringify(vertexShader),
    FRAGMENT_SHADER_JSON: JSON.stringify(fragmentShader),
  });

  return applyReplacements(htmlTemplate, {
    STYLES: stylesTemplate,
    RUNTIME: runtime,
    SUBJECT_CATEGORY: subjectCategory,
  });
};
