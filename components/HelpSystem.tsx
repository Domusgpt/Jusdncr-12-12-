/**
 * HelpSystem - Interactive help overlays for all app pages
 *
 * Provides guided tours and tooltips explaining each UI section
 * Triggered by help button on each page
 */

import React, { useState, useCallback, useEffect } from 'react';
import { X, HelpCircle, ChevronRight, ChevronLeft, Image, Music, Palette, Sliders, Play, Disc3, Layers, Zap, Download, Bug as BugIcon } from 'lucide-react';
import { submitBugReport, BugImpact } from '../services/bugReporter';
import { STEP1_HELP_IMAGE } from './helpImages';

// Help content for each page/section
interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  imageSrc?: string;
  imageAlt?: string;
  hotspots?: Array<{
    id: string;
    label: string;
    detail: string;
    x: number;
    y: number;
  }>;
  actions?: Array<{
    title: string;
    detail: string;
  }>;
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
        description: 'Upload an image of a character, person, or object. This becomes the “dancer” that will be animated. Supports JPG, PNG, and WEBP formats. For best results, use a clear image with the subject centered.',
        icon: <Image size={20} />,
        position: 'top-left',
        imageSrc: STEP1_HELP_IMAGE,
        imageAlt: 'Step 1 assets screen showing image and audio panels',
        hotspots: [
          {
            id: 'image-panel',
            label: 'Source Identity panel',
            detail: 'Click the large card to upload or replace your source image.',
            x: 24,
            y: 32
          }
        ],
        actions: [
          {
            title: 'Click the image panel',
            detail: 'Pick a clear, centered subject photo to drive the animation.'
          }
        ]
      },
      {
        id: 'audio-upload',
        title: 'Audio Stream',
        description: 'Optional: Upload a music track (MP3, WAV, AAC) or paste a streaming link. The AI analyzes rhythm and syncs movement to the beat.',
        icon: <Music size={20} />,
        position: 'top-right',
        imageSrc: STEP1_HELP_IMAGE,
        imageAlt: 'Step 1 assets screen with streaming link entry',
        hotspots: [
          {
            id: 'audio-panel',
            label: 'Audio panel',
            detail: 'Use Upload to add a file or Streaming URL to paste a link.',
            x: 70,
            y: 32
          }
        ],
        actions: [
          {
            title: 'Streaming URL',
            detail: 'Paste a compatible HTTPS link to play in preview and export.'
          }
        ]
      },
      {
        id: 'import-rig',
        title: 'Import Golem (DKG)',
        description: 'Import a Deterministic Kinetic Golem (DKG) file. These contain generated frames, timing, and settings so you can remix or export without re-running generation. Legacy .rig and .jusdnce files are supported and can be converted to .dkg.',
        icon: <Layers size={20} />,
        position: 'bottom-left',
        imageSrc: STEP1_HELP_IMAGE,
        imageAlt: 'Step 1 assets screen with Import Golem button',
        hotspots: [
          {
            id: 'import-button',
            label: 'Import Golem (DKG)',
            detail: 'Click to load a .dkg, .rig, or .jusdnce file from your device.',
            x: 12,
            y: 12
          }
        ],
        actions: [
          {
            title: 'Import Golem (DKG)',
            detail: 'Select your saved Golem file to restore frames and settings instantly.'
          }
        ]
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
        description: 'Pattern buttons show all available choreography patterns. LEG/LAB toggles physics mode. PAT/KIN switches engine mode. MIX opens the 4-deck mixer for layering multiple golems.',
        icon: <Disc3 size={20} />,
        position: 'bottom-left'
      },
      {
        id: 'export-html',
        title: 'DKG/HTML Export',
        description: 'Download a standalone .HTML player plus a .dkg golem file for offline playback in any browser. Perfect for sharing or embedding with the player that includes all frames and the visualizer.',
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
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [bugEmail, setBugEmail] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugImpact, setBugImpact] = useState<BugImpact>('minor');
  const [isSubmittingBug, setIsSubmittingBug] = useState(false);
  const [bugMessage, setBugMessage] = useState<string | null>(null);

  const page = HELP_PAGES.find(p => p.id === pageId);
  if (!page || !isOpen) return null;

  const section = page.sections[currentSection];
  const isFirst = currentSection === 0;
  const isLast = currentSection === page.sections.length - 1;
  const activeHotspot = section.hotspots?.find(h => h.id === activeHotspotId) ?? section.hotspots?.[0];

  useEffect(() => {
    setActiveHotspotId(section.hotspots?.[0]?.id ?? null);
  }, [section.id]);

  const next = () => {
    if (!isLast) setCurrentSection(s => s + 1);
    else onClose();
  };

  const prev = () => {
    if (!isFirst) setCurrentSection(s => s - 1);
  };

  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugDescription.trim()) {
      setBugMessage('Please add a short description so we can reproduce the issue.');
      return;
    }

    setIsSubmittingBug(true);
    setBugMessage(null);
    try {
      await submitBugReport({
        email: bugEmail || 'anonymous@jusdnce.app',
        description: bugDescription.trim(),
        impact: bugImpact,
        page: pageId
      });
      setBugMessage('Thanks! Your report was saved locally and will sync once support is wired.');
      setBugDescription('');
    } catch (err) {
      console.error('bug submission failed', err);
      setBugMessage('Could not save the report. Please try again or reach out via support.');
    } finally {
      setIsSubmittingBug(false);
    }
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
          <p className="text-gray-300 leading-relaxed mb-2">{section.description}</p>
          <p className="text-gray-500 text-xs">Position: {section.position || 'center'}</p>

          {section.imageSrc && (
            <div className="mt-4">
              <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <img
                  src={section.imageSrc}
                  alt={section.imageAlt || section.title}
                  className="w-full h-auto object-cover"
                />
                {section.hotspots?.map((hotspot, index) => (
                  <button
                    key={hotspot.id}
                    type="button"
                    onClick={() => setActiveHotspotId(hotspot.id)}
                    className={`absolute flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all
                      ${activeHotspotId === hotspot.id ? 'bg-brand-500 text-white' : 'bg-white/20 text-white/80 hover:bg-brand-400/80'}
                    `}
                    style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, transform: 'translate(-50%, -50%)' }}
                    title={hotspot.label}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              {activeHotspot && (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3">
                  <p className="text-xs text-brand-300 font-mono tracking-widest">{activeHotspot.label}</p>
                  <p className="text-sm text-gray-200">{activeHotspot.detail}</p>
                </div>
              )}
            </div>
          )}

          {section.actions && section.actions.length > 0 && (
            <div className="mt-4 grid gap-2">
              {section.actions.map((action, index) => (
                <div key={action.title} className="flex gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-brand-500/30 text-brand-200 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm text-white font-semibold">{action.title}</p>
                    <p className="text-xs text-gray-300">{action.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bug reporting */}
        <form
          onSubmit={handleBugSubmit}
          className="bg-white/5 border border-brand-500/30 rounded-2xl p-6 mb-8 shadow-inner"
        >
          <div className="flex items-center gap-2 mb-4">
            <BugIcon size={18} className="text-brand-300" />
            <div>
              <p className="text-white font-bold text-sm uppercase tracking-widest">Report a Bug</p>
              <p className="text-gray-400 text-xs">Saved locally now; syncing to support soon.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <label className="text-xs text-gray-300 uppercase tracking-wide">
              Contact (optional)
              <input
                value={bugEmail}
                onChange={(e) => setBugEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 text-white text-sm px-3 py-2 focus:border-brand-400 focus:outline-none"
              />
            </label>
            <label className="text-xs text-gray-300 uppercase tracking-wide">
              Impact
              <select
                value={bugImpact}
                onChange={(e) => setBugImpact(e.target.value as BugImpact)}
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 text-white text-sm px-3 py-2 focus:border-brand-400 focus:outline-none"
              >
                <option value="minor">Minor glitch</option>
                <option value="major">Major issue</option>
                <option value="blocker">Blocks work</option>
              </select>
            </label>
          </div>
          <label className="text-xs text-gray-300 uppercase tracking-wide block mb-3">
            What happened?
            <textarea
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              rows={3}
              placeholder="Steps to reproduce, expected vs. actual behavior"
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 text-white text-sm px-3 py-2 focus:border-brand-400 focus:outline-none"
            />
          </label>
          {bugMessage && <p className="text-xs text-brand-300 mb-3">{bugMessage}</p>}
          <button
            type="submit"
            disabled={isSubmittingBug}
            className="w-full py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold tracking-wide disabled:opacity-50"
          >
            {isSubmittingBug ? 'Sending...' : 'Send Bug Report'}
          </button>
        </form>

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
