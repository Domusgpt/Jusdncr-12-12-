import { FRAGMENT_SHADER, HolographicParams, VERTEX_SHADER } from "../components/Visualizer/HolographicVisualizer";
import { GeneratedFrame, SubjectCategory } from "../types";
import { bundlePlayerTemplate } from "./export/PlayerBundler";

/**
 * Generates standalone HTML player with unified choreography system
 * Features: LEGACY/LABAN physics, PATTERN/KINETIC engines, keyboard shortcuts
 */
export const generatePlayerHTML = (
  frames: GeneratedFrame[],
  hologramParams: HolographicParams,
  subjectCategory: SubjectCategory
): string =>
  bundlePlayerTemplate({
    frames,
    hologramParams,
    subjectCategory,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  });
