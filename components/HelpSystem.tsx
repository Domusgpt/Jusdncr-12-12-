/**
 * HelpSystem - Interactive help overlays for all app pages
 *
 * Provides guided tours and tooltips explaining each UI section
 * Triggered by help button on each page
 */

import React, { useState, useCallback } from 'react';
import { X, HelpCircle, ChevronRight, ChevronLeft, Image, Music, Palette, Sliders, Play, Disc3, Layers, Zap, Download } from 'lucide-react';

// Help content for each page/section
interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

interface HelpPage {
  id: string;
  title: string;
  subtitle: string;
  sections: HelpSection[];
}

const HELP_PAGES: HelpPage[] = [
  {
    id: 'step1',
    title: 'STEP 1: ASSETS',
    subtitle: 'Upload your source materials',
    sections: [
      {
        id: 'image-upload',
        title: 'Source Identity',
        description: 'Upload an image of a character, person, or object. This becomes the "dancer" that will be animated. Supports JPG, PNG, and WEBP formats. For best results, use a clear image with the subject centered.',
        icon: <Image size={20} />,
        position: 'top-left'
      },
      {
        id: 'audio-upload',
        title: 'Audio Stream',
        description: 'Optional: Upload a music track (MP3, WAV, AAC) for beat-synced animation. The AI will analyze the rhythm and sync movements to the beat. Skip this to use live microphone input or synthetic beats.',
        icon: <Music size={20} />,
        position: 'top-right'
      },
      {
        id: 'import-rig',
        title: 'Import Rig',
        description: 'Load a previously saved animation rig (.json file). This includes all generated frames and settings, letting you continue work or remix existing projects.',
        icon: <Layers size={20} />,
        position: 'bottom-left'
      }
    ]
  },
  {
    id: 'step2',
    title: 'STEP 2: DIRECTOR',
    subtitle: 'Configure your animation style',
    sections: [
      {
        id: 'style-grid',
        title: 'Style Selection',
        description: 'Choose a visual style for your animation. Each style applies unique aesthetics like "Cyberpunk Neon" or "Watercolor Dreams". Browse categories: Cinematic, Anime/2D, Digital/Glitch, Artistic, Abstract.',
        icon: <Palette size={20} />,
        position: 'top-left'
      },
      {
        id: 'quality-toggle',
        title: 'Quality Mode',
        description: 'TURBO: Fast generation (5 frames). QUALITY: Better detail (8 frames). SUPER: Premium mode with 15 frames + lip sync capability. Higher quality = more credits.',
        icon: <Zap size={20} />,
        position: 'top-right'
      },
      {
        id: 'studio-controls',
        title: 'Studio Controls',
        description: 'Advanced settings: Motion Presets (dance styles), Custom Prompts, Duration, Energy level, Style Morphing (blend two styles), and Audio Reactivity.',
        icon: <Sliders size={20} />,
        position: 'center'
      },
      {
        id: 'surprise-me',
        title: 'Surprise Me',
        description: 'Randomly select a style and settings. Enable "Morph Mode" to also randomly blend two styles together with varying intensity.',
        icon: <Zap size={20} />,
        position: 'top-right'
      }
    ]
  },
  {
    id: 'step4',
    title: 'STEP 4: PREVIEW',
    subtitle: 'Control your live animation',
    sections: [
      {
        id: 'status-bar',
        title: 'Status Bar (Top)',
        description: 'Play/pause, microphone toggle for live audio, BPM display, beat counter, camera toggle, and menu access. Controls your audio source and playback.',
        icon: <Play size={20} />,
        position: 'top-left'
      },
      {
        id: 'fx-rail',
        title: 'FX Rail (Left Edge)',
        description: '9 real-time effects: RGB Split, Strobe, Ghost, Invert, B&W, Scanlines, Glitch, Shake, Zoom. Long-press to assign effects to X or Y axis for touch control.',
        icon: <Zap size={20} />,
        position: 'center'
      },
      {
        id: 'animation-zone',
        title: 'Animation Zone (Center)',
        description: 'Touch the LEFT half to control PATTERN mode (15 choreography patterns). Touch the RIGHT half for KINETIC mode (6 physics-based patterns). Your touch position acts like a joystick to select patterns.',
        icon: <Layers size={20} />,
        position: 'center'
      },
      {
        id: 'engine-strip',
        title: 'Engine Strip (Bottom)',
        description: 'Pattern buttons show all available choreography patterns. LEG/LAB toggles physics mode. PAT/KIN switches engine mode. MIX opens the 4-deck mixer for layering multiple rigs.',
        icon: <Disc3 size={20} />,
        position: 'bottom-left'
      },
      {
        id: 'export-html',
        title: 'HTML Export',
        description: 'Download a standalone .HTML file that plays your animation offline in any browser. Perfect for sharing or embedding. The player includes all frames and the visualizer.',
        icon: <Download size={20} />,
        position: 'top-right'
      }
    ]
  }
];

interface HelpOverlayProps {
  pageId: 'step1' | 'step2' | 'step4';
  isOpen: boolean;
  onClose: () => void;
}

export const HelpOverlay: React.FC<HelpOverlayProps> = ({ pageId, isOpen, onClose }) => {
  const [currentSection, setCurrentSection] = useState(0);

  const page = HELP_PAGES.find(p => p.id === pageId);
  if (!page || !isOpen) return null;

  const section = page.sections[currentSection];
  const isFirst = currentSection === 0;
  const isLast = currentSection === page.sections.length - 1;

  const next = () => {
    if (!isLast) setCurrentSection(s => s + 1);
    else onClose();
  };

  const prev = () => {
    if (!isFirst) setCurrentSection(s => s - 1);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* Main card */}
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-3xl max-w-lg w-full p-8 shadow-2xl">
        {/* Page header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white tracking-widest">{page.title}</h2>
          <p className="text-gray-400 text-sm mt-1">{page.subtitle}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {page.sections.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSection(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentSection
                  ? 'bg-brand-500 scale-125'
                  : 'bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Section content */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-brand-500/20 rounded-xl text-brand-300">
              {section.icon}
            </div>
            <h3 className="text-xl font-bold text-white">{section.title}</h3>
          </div>
          <p className="text-gray-300 leading-relaxed">{section.description}</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={prev}
            disabled={isFirst}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              isFirst
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-white bg-white/10 hover:bg-white/20'
            }`}
          >
            <ChevronLeft size={18} /> Back
          </button>

          <span className="text-gray-500 text-sm font-mono">
            {currentSection + 1} / {page.sections.length}
          </span>

          <button
            onClick={next}
            className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold bg-brand-500 hover:bg-brand-400 text-white transition-all"
          >
            {isLast ? 'Done' : 'Next'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Help button component to trigger overlay
interface HelpButtonProps {
  onClick: () => void;
  className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20
               border border-white/20 rounded-xl text-white/80 hover:text-white
               transition-all font-bold ${className}`}
  >
    <HelpCircle size={18} />
    <span className="text-sm">HELP</span>
  </button>
);

export default HelpOverlay;
