
import { GeneratedFrame, SubjectCategory } from "../types";
import { VERTEX_SHADER, FRAGMENT_SHADER, HolographicParams } from "../components/Visualizer/HolographicVisualizer";

/**
 * Generates standalone HTML player with unified choreography system
 * Features: LEGACY/LABAN physics, PATTERN/KINETIC engines, keyboard shortcuts
 */
export const generatePlayerHTML = (
    frames: GeneratedFrame[],
    hologramParams: HolographicParams,
    subjectCategory: SubjectCategory
): string => {
    
    // Embed the data directly into the HTML
    const framesJSON = JSON.stringify(frames);
    const paramsJSON = JSON.stringify(hologramParams);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>jusDNCE // Standalone Player</title>
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700;900&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; background: #050505; overflow: hidden; font-family: 'Rajdhani', sans-serif; user-select: none; color: #fff; }
        canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        #bgCanvas { z-index: 1; }
        #charCanvas { z-index: 2; pointer-events: none; }

        /* ============ STATUS BAR - TOP ============ */
        #statusBar {
            position: fixed; top: 0; left: 0; right: 0; z-index: 50;
            padding: max(8px, env(safe-area-inset-top)) 8px 8px 8px;
        }
        #statusBar .bar-inner {
            background: rgba(0,0,0,0.6); backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
            display: flex; align-items: center; justify-content: space-between;
            padding: 6px 8px; gap: 4px;
        }
        #statusBar .left, #statusBar .center, #statusBar .right {
            display: flex; align-items: center; gap: 4px;
        }
        #statusBar .center { flex: 1; justify-content: center; }
        .status-btn {
            width: 40px; height: 40px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.1); color: #ccc; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.15s; -webkit-tap-highlight-color: transparent;
        }
        .status-btn:active { transform: scale(0.95); }
        .status-btn.active { background: #8b5cf6; border-color: #a78bfa; color: white; box-shadow: 0 0 15px rgba(139,92,246,0.4); }
        .status-btn.mic-active { background: #ef4444; border-color: #f87171; color: white; animation: pulse-red 1s infinite; }
        .status-btn.synth-active { background: linear-gradient(135deg, #00ff88, #00ccff); border-color: #00ff88; color: #000; }
        @keyframes pulse-red { 0%, 100% { box-shadow: 0 0 10px rgba(239,68,68,0.5); } 50% { box-shadow: 0 0 20px rgba(239,68,68,0.8); } }
        .status-btn svg { width: 20px; height: 20px; }
        .bpm-display { display: flex; align-items: center; gap: 8px; }
        .bpm-value { font-size: 16px; font-weight: 900; color: #0ff; font-family: monospace; min-width: 40px; }
        .bpm-label { font-size: 9px; color: rgba(255,255,255,0.4); }
        .beat-bars { display: flex; gap: 2px; }
        .beat-bar { width: 20px; height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; transition: all 0.1s; }
        .beat-bar.active { background: #8b5cf6; box-shadow: 0 0 6px rgba(139,92,246,0.6); }
        .beat-bar.downbeat { background: #0ff; box-shadow: 0 0 6px rgba(0,255,255,0.6); }

        /* ============ FX RAIL - LEFT ============ */
        #fxRail {
            position: fixed; left: 0; top: 50%; transform: translateY(-50%); z-index: 55;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1); border-left: none;
            border-radius: 0 12px 12px 0;
            padding: 8px 6px; display: flex; flex-direction: column; gap: 4px;
        }
        #fxRail.collapsed { padding: 8px 2px; }
        #fxRail.collapsed .fx-btn { width: 8px; padding: 0; }
        .fx-btn {
            width: 44px; height: 36px; border-radius: 8px;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.5); cursor: pointer;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            transition: all 0.15s; font-size: 7px; font-weight: 700; gap: 2px;
        }
        .fx-btn:active { transform: scale(0.95); }
        .fx-btn.active { background: linear-gradient(135deg, #8b5cf6, #ec4899); border-color: #a78bfa; color: white; }
        .fx-btn svg { width: 14px; height: 14px; }
        .fx-axis { position: absolute; right: 2px; top: 2px; display: flex; flex-direction: column; gap: 1px; }
        .fx-axis-dot { width: 4px; height: 4px; border-radius: 50%; }
        .fx-axis-dot.x { background: #0ff; box-shadow: 0 0 4px #0ff; }
        .fx-axis-dot.y { background: #f0f; box-shadow: 0 0 4px #f0f; }
        .fx-intensity { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); }
        .fx-intensity-bar { height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-bottom: 4px; overflow: hidden; }
        .fx-intensity-fill { height: 100%; transition: width 0.1s; }
        .fx-intensity-fill.x { background: #0ff; }
        .fx-intensity-fill.y { background: #f0f; }
        .fx-intensity-label { font-size: 6px; color: rgba(255,255,255,0.4); text-align: center; }

        /* ============ BEZEL DRAWERS - SMART EDGE PANELS ============ */
        .bezel {
            position: fixed; top: 50%; transform: translateY(-50%); z-index: 55;
            display: flex; flex-direction: column; align-items: center;
            padding: 8px 2px; gap: 6px;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(12px);
            transition: all 0.25s ease;
        }
        .bezel-left { left: 0; border-radius: 0 8px 8px 0; border-right: 1px solid rgba(255,255,255,0.1); }
        .bezel-right { right: 0; border-radius: 8px 0 0 8px; border-left: 1px solid rgba(255,255,255,0.1); }

        /* Collapsed state - just status dots */
        .bezel .status-dot {
            width: 8px; height: 8px; border-radius: 50%;
            background: rgba(255,255,255,0.2); transition: all 0.15s;
            cursor: pointer;
        }
        .bezel .status-dot.active { background: #0ff; box-shadow: 0 0 6px #0ff; }
        .bezel .status-dot.active-y { background: #f0f; box-shadow: 0 0 6px #f0f; }
        .bezel .status-dot.active-fx { background: #8b5cf6; box-shadow: 0 0 6px #8b5cf6; }

        .bezel .status-label {
            font-size: 7px; font-weight: 700; color: rgba(255,255,255,0.5);
            writing-mode: vertical-rl; text-orientation: mixed;
            letter-spacing: 1px;
        }
        .bezel .bezel-divider {
            width: 12px; height: 1px; background: rgba(255,255,255,0.15); margin: 4px 0;
        }

        /* Expanded state - full controls */
        .bezel.expanded { padding: 8px 6px; }
        .bezel-left.expanded { width: 70px; }
        .bezel-right.expanded { width: 80px; }

        .bezel .drawer-content { display: none; flex-direction: column; gap: 4px; width: 100%; }
        .bezel.expanded .drawer-content { display: flex; }
        .bezel.expanded .status-dot { display: none; }
        .bezel.expanded .status-label { display: none; }

        .bezel .bezel-btn {
            width: 100%; padding: 6px 4px; border-radius: 6px;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.6); cursor: pointer;
            font-size: 8px; font-weight: 700; text-align: center;
            transition: all 0.15s;
        }
        .bezel .bezel-btn:active { transform: scale(0.95); }
        .bezel .bezel-btn.active { background: #8b5cf6; border-color: #a78bfa; color: white; }
        .bezel .bezel-btn.cyan.active { background: #0ff; color: #000; }

        .bezel .bezel-slider {
            width: 100%; height: 4px; -webkit-appearance: none;
            background: rgba(255,255,255,0.15); border-radius: 2px; margin: 4px 0;
        }
        .bezel .bezel-slider::-webkit-slider-thumb {
            -webkit-appearance: none; width: 12px; height: 12px;
            border-radius: 50%; background: #8b5cf6; cursor: pointer;
        }

        /* Mini intensity bars for collapsed state */
        .bezel .mini-bars {
            display: flex; flex-direction: column; gap: 2px; width: 12px;
        }
        .bezel .mini-bar {
            height: 2px; background: rgba(255,255,255,0.1); border-radius: 1px; overflow: hidden;
        }
        .bezel .mini-bar-fill { height: 100%; transition: width 0.1s; }
        .bezel .mini-bar-fill.x { background: #0ff; }
        .bezel .mini-bar-fill.y { background: #f0f; }
        .bezel.expanded .mini-bars { display: none; }

        /* Hide original fxRail when bezels active - we replace it */
        #fxRail { display: none; }

        /* Responsive: on very small screens, bezels auto-collapse */
        @media (max-width: 360px) {
            .bezel { padding: 6px 2px; }
            .bezel.expanded { width: 60px !important; padding: 6px 4px; }
            .bezel .bezel-btn { font-size: 7px; padding: 5px 3px; }
        }

        /* ============ ENGINE STRIP - BOTTOM ============ */
        #engineStrip {
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
            padding: 8px 8px max(8px, env(safe-area-inset-bottom)) 8px;
            background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 70%, transparent 100%);
        }
        #engineStrip .strip-inner {
            display: flex; flex-direction: column; gap: 8px; align-items: center;
        }
        .pattern-row {
            display: flex; gap: 4px; overflow-x: auto; max-width: 100%;
            padding: 4px 0; -webkit-overflow-scrolling: touch;
            scrollbar-width: none; -ms-overflow-style: none;
        }
        .pattern-row::-webkit-scrollbar { display: none; }
        .pattern-btn {
            flex-shrink: 0; padding: 8px 12px; border-radius: 8px;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.6); cursor: pointer; font-size: 9px; font-weight: 700;
            transition: all 0.15s; white-space: nowrap;
        }
        .pattern-btn:active { transform: scale(0.95); }
        .pattern-btn.active { background: #8b5cf6; border-color: #a78bfa; color: white; }
        .controls-row {
            display: flex; gap: 8px; align-items: center; justify-content: center;
            flex-wrap: wrap; width: 100%;
        }
        .mode-toggle {
            display: flex; gap: 2px; background: rgba(0,0,0,0.4); border-radius: 8px; padding: 2px;
        }
        .mode-btn {
            padding: 8px 12px; border-radius: 6px; border: none;
            background: transparent; color: rgba(255,255,255,0.5);
            cursor: pointer; font-size: 10px; font-weight: 700; transition: all 0.15s;
        }
        .mode-btn.active { background: #8b5cf6; color: white; }
        .mode-btn.cyan.active { background: #0ff; color: #000; }
        .intensity-slider {
            width: 120px; height: 6px; -webkit-appearance: none; background: rgba(255,255,255,0.1);
            border-radius: 3px; outline: none;
        }
        .intensity-slider::-webkit-slider-thumb {
            -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
            background: #8b5cf6; border: 2px solid white; cursor: pointer;
        }
        .mixer-toggle {
            padding: 10px 16px; border-radius: 10px;
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
            color: #ccc; cursor: pointer; font-size: 11px; font-weight: 700;
            display: flex; align-items: center; gap: 6px; transition: all 0.15s;
        }
        .mixer-toggle.active { background: #8b5cf6; border-color: #a78bfa; color: white; }
        .mixer-toggle svg { width: 18px; height: 18px; }

        /* ============ MIXER DRAWER ============ */
        #mixerDrawer {
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
            background: rgba(10,10,15,0.98); backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255,255,255,0.15);
            border-radius: 20px 20px 0 0;
            transform: translateY(100%); transition: transform 0.3s ease;
            max-height: 70vh; overflow-y: auto;
        }
        #mixerDrawer.open { transform: translateY(0); }
        .drawer-handle {
            width: 40px; height: 4px; background: rgba(255,255,255,0.3);
            border-radius: 2px; margin: 12px auto;
        }
        .drawer-content { padding: 0 16px 16px 16px; }
        .drawer-tabs { display: flex; gap: 4px; margin-bottom: 16px; }
        .drawer-tab {
            flex: 1; padding: 10px; border-radius: 8px;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.5); cursor: pointer; font-size: 11px; font-weight: 700;
            text-align: center; transition: all 0.15s;
        }
        .drawer-tab.active { background: #8b5cf6; border-color: #a78bfa; color: white; }

        /* ============ LEGACY UI STYLES - Hidden (new UI above) ============ */
        #ui {
            display: none !important; /* Hidden - replaced by StatusBar, FXRail, EngineStrip */
        }
        #ui.hidden { opacity: 0; pointer-events: none; transform: translateY(100%); }
        .ui-row {
            display: flex; gap: 6px; align-items: center; justify-content: center;
            flex-wrap: wrap; max-width: 100%;
        }
        button, a.active {
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
            color: #ccc; padding: 10px 14px; border-radius: 12px;
            cursor: pointer; font-weight: 700; font-size: 11px; font-family: 'Rajdhani', sans-serif;
            letter-spacing: 0.5px; text-transform: uppercase;
            transition: all 0.15s; display: flex; align-items: center; gap: 6px;
            min-width: 44px; min-height: 44px; justify-content: center;
            -webkit-tap-highlight-color: transparent;
        }
        button:active, a.active:active { transform: scale(0.95); }
        button.active, a.active { background: #8b5cf6; border-color: #a78bfa; color: white; box-shadow: 0 0 15px rgba(139,92,246,0.4); }
        button.cyan { background: rgba(0,255,255,0.15); border-color: rgba(0,255,255,0.4); color: #0ff; }
        button.cyan.active { background: #0ff; color: #000; }
        button.orange { background: rgba(255,150,0,0.15); border-color: rgba(255,150,0,0.4); color: #f90; }
        button.red { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #fca5a5; }
        button.red.active { background: #ef4444; color: white; border-color: #ef4444; }
        .btn-icon { width: 44px; padding: 10px; }
        .btn-icon svg { width: 20px; height: 20px; }
        .btn-label { display: none; }
        @media (min-width: 480px) { .btn-label { display: inline; } button { padding: 10px 16px; } }
        .separator { width: 1px; height: 20px; background: rgba(255,255,255,0.1); display: none; }
        @media (min-width: 480px) { .separator { display: block; } }

        /* Tap to show UI hint */
        #tapHint {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.7); padding: 16px 24px; border-radius: 12px;
            font-size: 14px; color: rgba(255,255,255,0.6); pointer-events: none;
            opacity: 0; transition: opacity 0.3s; z-index: 80;
        }
        #tapHint.visible { opacity: 1; }

        /* Loader */
        #loader {
            position: absolute; inset: 0; background: #000; z-index: 200;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            transition: opacity 0.5s; pointer-events: none;
        }
        .spinner {
            width: 50px; height: 50px; border: 3px solid rgba(139,92,246,0.3); border-top-color: #8b5cf6;
            border-radius: 50%; animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite; margin-bottom: 20px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Drag Overlay */
        #dropOverlay {
            position: absolute; inset: 0; z-index: 300; background: rgba(139, 92, 246, 0.9);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            backdrop-filter: blur(10px); opacity: 0; pointer-events: none; transition: opacity 0.2s;
        }
        body.drag-active #dropOverlay { opacity: 1; }
        .drop-title { font-size: 3em; color: white; font-weight: 900; letter-spacing: 4px; margin-bottom: 10px; }

        /* Mic Permission Modal */
        #micModal {
            position: fixed; inset: 0; z-index: 500;
            background: rgba(0,0,0,0.9); backdrop-filter: blur(10px);
            display: none; align-items: center; justify-content: center;
        }
        #micModal.visible { display: flex; }
        .mic-modal-content {
            background: rgba(20,20,25,0.98); border: 1px solid rgba(255,255,255,0.2);
            border-radius: 20px; padding: 24px; max-width: 360px; text-align: center;
        }
        .mic-modal-content h3 { color: #0ff; font-size: 18px; margin: 0 0 12px 0; }
        .mic-modal-content p { color: rgba(255,255,255,0.7); font-size: 13px; margin: 0 0 20px 0; line-height: 1.5; }
        .mic-modal-content .icon { width: 60px; height: 60px; margin: 0 auto 16px; background: rgba(239,68,68,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .mic-modal-content .icon svg { width: 30px; height: 30px; color: #ef4444; }
        .mic-modal-btns { display: flex; gap: 12px; }
        .mic-modal-btn {
            flex: 1; padding: 14px; border-radius: 12px; border: none;
            font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s;
        }
        .mic-modal-btn.primary { background: #ef4444; color: white; }
        .mic-modal-btn.primary:hover { background: #dc2626; }
        .mic-modal-btn.secondary { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); }
        .mic-modal-btn.synth { background: linear-gradient(135deg, #00ff88, #00ccff); color: #000; }

        /* Help overlay */
        #helpOverlay {
            position: fixed; inset: 0; z-index: 400;
            background: rgba(0,0,0,0.95); backdrop-filter: blur(10px);
            display: none; align-items: center; justify-content: center;
        }
        #helpOverlay.visible { display: flex; }
        .help-content {
            background: rgba(20,20,25,0.98); border: 1px solid rgba(255,255,255,0.2);
            border-radius: 20px; padding: 24px; max-width: 400px; width: calc(100% - 32px);
        }
        .help-content h3 { color: #0ff; margin: 0 0 16px 0; }
        .hotkey-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px; }
        .hotkey-row .key { background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 10px; }
        .hotkey-row .desc { color: rgba(255,255,255,0.6); }
        /* Sequence Mode Indicators */
        .seq-modes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 8px; }
        .seq-mode {
            padding: 6px 4px; font-size: 9px; font-weight: 600;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.5); border-radius: 6px; text-align: center;
            cursor: pointer; transition: all 0.15s;
        }
        .seq-mode:hover { background: rgba(139,92,246,0.15); }
        .seq-mode.active {
            background: rgba(0,255,136,0.2); border-color: #00ff88; color: #00ff88;
            box-shadow: 0 0 8px rgba(0,255,136,0.3);
        }
        /* Pattern Grid */
        .pattern-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
        .pattern-btn {
            padding: 6px 4px; font-size: 9px; border-radius: 6px;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.15s;
        }
        .pattern-btn:hover { background: rgba(139,92,246,0.2); border-color: rgba(139,92,246,0.5); }
        .pattern-btn.active { background: #8b5cf6; border-color: #a78bfa; color: white; }
        /* BPM Display */
        .bpm-display {
            display: flex; align-items: center; gap: 12px; padding: 8px;
            background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 8px;
        }
        .bpm-value { font-size: 24px; font-weight: 900; color: #00ffff; min-width: 60px; }
        .bpm-label { font-size: 10px; color: rgba(255,255,255,0.5); }
        .bar-counter {
            display: flex; gap: 2px; flex: 1;
        }
        .bar-beat {
            width: 8px; height: 16px; background: rgba(255,255,255,0.1);
            border-radius: 2px; transition: all 0.1s;
        }
        .bar-beat.active { background: #a78bfa; }
        .bar-beat.downbeat { background: #00ffff; }
        /* Trigger Pads */
        .trigger-pads { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .trigger-pad {
            padding: 12px 4px; font-size: 10px; font-weight: 700;
            background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.7); cursor: pointer; border-radius: 8px;
            transition: all 0.1s; text-align: center; user-select: none;
        }
        .trigger-pad:hover { background: rgba(139,92,246,0.2); }
        .trigger-pad:active, .trigger-pad.active {
            background: #ef4444; border-color: #f87171; color: white;
            transform: scale(0.95); box-shadow: 0 0 12px rgba(239,68,68,0.5);
        }
        /* FX Grid */
        .fx-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .fx-slider-container { text-align: center; }
        .fx-slider {
            width: 100%; height: 60px; -webkit-appearance: slider-vertical;
            writing-mode: vertical-lr; direction: rtl;
            background: transparent;
        }
        .fx-label { font-size: 9px; color: rgba(255,255,255,0.5); margin-top: 4px; }
        .fx-toggles { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
        .fx-toggle {
            padding: 6px 10px; font-size: 9px; font-weight: 600;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.6); cursor: pointer; border-radius: 6px;
            transition: all 0.15s;
        }
        .fx-toggle:hover { background: rgba(139,92,246,0.2); }
        .fx-toggle.active { background: #8b5cf6; border-color: #a78bfa; color: white; }

        /* INTERACTIVE ENHANCEMENTS */
        /* Keyboard hints */
        .key-hint {
            font-size: 8px; color: rgba(255,255,255,0.3); font-weight: 600;
            display: block; margin-top: 2px;
        }
        /* Audio-reactive glow on mixer panel */
        #mixerPanel.pulse { box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 60px rgba(139,92,246,0.3); }
        /* Beat flash on BPM display */
        .bpm-value.beat { text-shadow: 0 0 20px #00ffff, 0 0 40px #00ffff; }
        /* Trigger pad ripple effect */
        .trigger-pad.ripple::after {
            content: ''; position: absolute; inset: 0; border-radius: 8px;
            background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
            animation: ripple 0.3s ease-out; pointer-events: none;
        }
        @keyframes ripple {
            from { transform: scale(0); opacity: 1; }
            to { transform: scale(2); opacity: 0; }
        }
        .trigger-pad { position: relative; overflow: hidden; }
        /* Pattern shuffle button */
        .shuffle-btn {
            padding: 4px 10px; font-size: 9px; font-weight: 600;
            background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3);
            color: #00ff88; cursor: pointer; border-radius: 6px; margin-left: auto;
            transition: all 0.15s;
        }
        .shuffle-btn:hover { background: rgba(0,255,136,0.2); }
        .shuffle-btn.active { background: #00ff88; color: black; animation: pulse 0.5s infinite alternate; }
        @keyframes pulse { from { opacity: 0.7; } to { opacity: 1; } }
        /* Help overlay - Responsive */
        #helpOverlay {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 500; background: rgba(10,10,15,0.98); backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.2); border-radius: 16px;
            padding: 16px 20px; width: calc(100% - 32px); max-width: 360px; display: none;
        }
        #helpOverlay h3 { color: #00ffff; margin: 0 0 12px 0; font-size: 14px; }
        #helpOverlay .hotkey-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px; gap: 8px; }
        #helpOverlay .key { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 10px; white-space: nowrap; }
        #helpOverlay .desc { color: rgba(255,255,255,0.6); text-align: right; }

        /* Gesture gate for autoplay/mic policies */
        #gestureGate {
            position: fixed; inset: 0; z-index: 600; display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.92); backdrop-filter: blur(12px);
        }
        #gestureGate .inner {
            background: rgba(20,20,25,0.96); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; max-width: 420px;
            text-align: center; display: flex; flex-direction: column; gap: 12px;
        }
        #gestureGate button { padding: 12px 16px; border-radius: 12px; border: none; background: linear-gradient(135deg,#8b5cf6,#14b8a6); color: white; font-weight: 800; cursor: pointer; }
        #gestureGate .muted { font-size: 12px; color: rgba(255,255,255,0.6); }

        /* Layout presets */
        body.preset-overlay { width: 320px; height: 240px; border-radius: 16px; overflow: hidden; }
        body.preset-overlay #statusBar { transform: scale(0.9); transform-origin: top center; }
        body.preset-widget { width: 640px; height: 480px; }
        body.preset-background { pointer-events: none; }

        /* Input adapter pill */
        #adapterTray { position: fixed; right: 12px; top: 70px; z-index: 120; display: flex; gap: 6px; flex-wrap: wrap; max-width: 320px; }
        .adapter-pill { background: rgba(255,255,255,0.08); color: #e4e4e7; border: 1px solid rgba(255,255,255,0.15); padding: 8px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .adapter-pill .dot { width: 10px; height: 10px; border-radius: 50%; background: #8b5cf6; box-shadow: 0 0 6px rgba(139,92,246,0.6); }
        .adapter-pill.active { background: linear-gradient(135deg, #8b5cf6, #14b8a6); border-color: rgba(255,255,255,0.25); color: #fff; }
    </style>
</head>
<body>

    <canvas id="bgCanvas"></canvas>
    <canvas id="charCanvas"></canvas>

    <div id="gestureGate">
        <div class="inner">
            <div style="font-weight:900; font-size:18px; color:#0ff;">Tap to arm audio + mic</div>
            <div class="muted">Browsers block autoplay until you interact. We'll resume the audio context, ask for mic permission, and fall back to synthetic beats if blocked.</div>
            <button id="gestureStart">START SESSION</button>
            <div class="muted">If you're embedding this player, forward a <code>postMessage</code> with <strong>{ type: 'jusdnce:start' }</strong> after a user tap.</div>
        </div>
    </div>
    
    <div id="loader">
        <div class="spinner"></div>
        <div style="color: #888; font-size: 14px; letter-spacing: 4px; font-weight: 700;">INITIALIZING NEURAL RIG...</div>
    </div>
    
    <div id="dropOverlay">
        <div class="drop-title">DROP FILE</div>
        <div style="font-size: 1.2em; color: rgba(255,255,255,0.8); letter-spacing: 2px;">IMPORT .JUSDNCE RIG OR AUDIO FILE</div>
    </div>
    
    <div id="info">
        <a href="https://jusdnce.com" target="_blank" class="brand" style="text-decoration:none; cursor:pointer;">jusDNCE</a>
        MODE: <span id="subjectDisplay">${subjectCategory}</span><br>
        <span id="fps">0 FPS</span> // <span id="poseDisplay">INIT</span>
    </div>

    <div id="deck"></div>

    <!-- ============ STATUS BAR - TOP ============ -->
    <div id="statusBar">
        <div class="bar-inner">
            <div class="left">
                <button id="btnPlay2" class="status-btn" title="Play/Pause">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </button>
                <button id="btnMic2" class="status-btn" title="Microphone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
                </button>
                <button id="btnUpload2" class="status-btn" title="Upload Audio">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </button>
            </div>
            <div class="center">
                <div class="bpm-display">
                    <span class="bpm-value" id="bpmValue2">120</span>
                    <span class="bpm-label">BPM</span>
                </div>
                <div class="beat-bars">
                    <div class="beat-bar downbeat" data-beat="0"></div>
                    <div class="beat-bar" data-beat="1"></div>
                    <div class="beat-bar" data-beat="2"></div>
                    <div class="beat-bar" data-beat="3"></div>
                </div>
            </div>
            <div class="right">
                <button id="btnCam2" class="status-btn active" title="Camera Motion">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </button>
                <button id="btnMore" class="status-btn" title="More Options">
                    <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                </button>
            </div>
        </div>
    </div>

    <div id="adapterTray">
        <div class="adapter-pill" data-adapter="file"><span class="dot"></span>File / MP4</div>
        <div class="adapter-pill" data-adapter="system"><span class="dot"></span>System Audio</div>
        <div class="adapter-pill" data-adapter="spotify"><span class="dot"></span>Spotify SDK</div>
        <div class="adapter-pill" data-adapter="apple"><span class="dot"></span>Apple Music</div>
        <div class="adapter-pill" data-adapter="pandora"><span class="dot"></span>Pandora</div>
        <div class="adapter-pill" data-adapter="youtube"><span class="dot"></span>YouTube / MediaSession</div>
        <div class="adapter-pill" data-adapter="background"><span class="dot"></span>Reactive BG</div>
    </div>

    <input id="fileAdapter" type="file" accept="audio/*,video/mp4,video/webm" style="display:none" />

    <!-- ============ FX RAIL - LEFT ============ -->
    <div id="fxRail">
        <button class="fx-btn" data-fx="rgbSplit" title="RGB Split">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><circle cx="8" cy="12" r="3" fill="#f00" opacity="0.7"/><circle cx="12" cy="8" r="3" fill="#0f0" opacity="0.7"/><circle cx="16" cy="12" r="3" fill="#00f" opacity="0.7"/></svg>
            <span>RGB</span>
        </button>
        <button class="fx-btn" data-fx="glitch" title="Glitch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M4 4h16M4 12h10M4 20h16"/></svg>
            <span>GLCH</span>
        </button>
        <button class="fx-btn" data-fx="pixelate" title="Pixelate">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/></svg>
            <span>PXLT</span>
        </button>
        <button class="fx-btn" data-fx="bloom" title="Bloom">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/></svg>
            <span>BLOOM</span>
        </button>
        <button class="fx-btn" data-fx="invert" title="Invert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20" fill="currentColor"/></svg>
            <span>INVT</span>
        </button>
        <button class="fx-btn" data-fx="vhs" title="VHS">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/></svg>
            <span>VHS</span>
        </button>
        <button class="fx-btn" data-fx="scan" title="Scanlines">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="width:14px;height:14px"><line x1="0" y1="4" x2="24" y2="4"/><line x1="0" y1="8" x2="24" y2="8"/><line x1="0" y1="12" x2="24" y2="12"/><line x1="0" y1="16" x2="24" y2="16"/><line x1="0" y1="20" x2="24" y2="20"/></svg>
            <span>SCAN</span>
        </button>
        <button class="fx-btn" data-fx="mirror" title="Mirror">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M12 3v18M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg>
            <span>MIRR</span>
        </button>
        <button class="fx-btn" data-fx="kaleid" title="Kaleidoscope">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="8.5" x2="22" y2="15.5"/><line x1="22" y1="8.5" x2="2" y2="15.5"/></svg>
            <span>KALD</span>
        </button>
        <div class="fx-intensity">
            <div class="fx-intensity-bar"><div class="fx-intensity-fill x" id="fxIntensityX" style="width:0%"></div></div>
            <div class="fx-intensity-bar"><div class="fx-intensity-fill y" id="fxIntensityY" style="width:0%"></div></div>
            <div class="fx-intensity-label">MOUSE XY</div>
        </div>
    </div>

    <!-- ============ ENGINE STRIP - BOTTOM ============ -->
    <div id="engineStrip">
        <div class="strip-inner">
            <div class="pattern-row" id="patternRow">
                <!-- Patterns will be populated by JS -->
            </div>
            <div class="controls-row">
                <div class="mode-toggle" id="physicsToggle2">
                    <button class="mode-btn cyan active" data-physics="LEGACY">LEGACY</button>
                    <button class="mode-btn cyan" data-physics="LABAN">LABAN</button>
                </div>
                <div class="mode-toggle" id="engineToggle2">
                    <button class="mode-btn active" data-mode="PATTERN">PATTERN</button>
                    <button class="mode-btn" data-mode="KINETIC">KINETIC</button>
                </div>
                <input type="range" class="intensity-slider" id="intensitySlider" min="0" max="100" value="50" title="Intensity">
                <button class="mixer-toggle" id="btnMixer2" title="Open Mixer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="20" cy="14" r="2"/></svg>
                    <span>MIXER</span>
                </button>
            </div>
        </div>
    </div>

    <!-- ============ MIXER DRAWER ============ -->
    <div id="mixerDrawer">
        <div class="drawer-handle"></div>
        <div class="drawer-content">
            <div class="drawer-tabs">
                <button class="drawer-tab active" data-tab="decks">DECKS</button>
                <button class="drawer-tab" data-tab="engine">ENGINE</button>
                <button class="drawer-tab" data-tab="fx">FX</button>
            </div>
            <div id="drawerDecks" class="drawer-tab-content">
                <div class="mixer-section">
                    <div class="mixer-section-title">4-CHANNEL DECK SYSTEM</div>
                    <div class="deck-grid" id="drawerDeckGrid">
                        <!-- Deck channels populated by JS -->
                    </div>
                </div>
            </div>
            <div id="drawerEngine" class="drawer-tab-content" style="display:none;">
                <div class="mixer-section">
                    <div class="mixer-section-title">LABAN EFFORT</div>
                    <div id="labanEffortGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
                        <div class="effort-item"><div class="effort-label">WEIGHT</div><div class="effort-value" id="effortWeight2">0.5</div></div>
                        <div class="effort-item"><div class="effort-label">SPACE</div><div class="effort-value" id="effortSpace2">0.5</div></div>
                        <div class="effort-item"><div class="effort-label">TIME</div><div class="effort-value" id="effortTime2">0.5</div></div>
                        <div class="effort-item"><div class="effort-label">FLOW</div><div class="effort-value" id="effortFlow2">0.5</div></div>
                    </div>
                </div>
            </div>
            <div id="drawerFx" class="drawer-tab-content" style="display:none;">
                <div class="mixer-section">
                    <div class="mixer-section-title">TRIGGER PADS</div>
                    <div class="trigger-pads">
                        <button class="trigger-pad" data-trigger="stutter">[Q] STUTTER</button>
                        <button class="trigger-pad" data-trigger="reverse">[W] REVERSE</button>
                        <button class="trigger-pad" data-trigger="glitch">[E] GLITCH</button>
                        <button class="trigger-pad" data-trigger="burst">[R] BURST</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ============ LEFT BEZEL DRAWER (FX) ============ -->
    <div id="bezelLeft" class="bezel bezel-left">
        <!-- Collapsed state: status dots -->
        <div class="status-dot" data-fx="rgbSplit" title="RGB Split"></div>
        <div class="status-dot" data-fx="glitch" title="Glitch"></div>
        <div class="status-dot" data-fx="pixelate" title="Pixelate"></div>
        <div class="status-dot" data-fx="bloom" title="Bloom"></div>
        <div class="status-dot" data-fx="invert" title="Invert"></div>
        <div class="status-dot" data-fx="vhs" title="VHS"></div>
        <div class="status-dot" data-fx="scan" title="Scanlines"></div>
        <div class="status-dot" data-fx="mirror" title="Mirror"></div>
        <div class="status-dot" data-fx="kaleid" title="Kaleidoscope"></div>
        <div class="bezel-divider"></div>
        <div class="mini-bars">
            <div class="mini-bar"><div class="mini-bar-fill x" id="bezelBarX" style="width:0%"></div></div>
            <div class="mini-bar"><div class="mini-bar-fill y" id="bezelBarY" style="width:0%"></div></div>
        </div>

        <!-- Expanded state: full buttons -->
        <div class="drawer-content">
            <button class="bezel-btn" data-fx="rgbSplit">RGB</button>
            <button class="bezel-btn" data-fx="glitch">GLCH</button>
            <button class="bezel-btn" data-fx="pixelate">PXLT</button>
            <button class="bezel-btn" data-fx="bloom">BLOOM</button>
            <button class="bezel-btn" data-fx="invert">INVT</button>
            <button class="bezel-btn" data-fx="vhs">VHS</button>
            <button class="bezel-btn" data-fx="scan">SCAN</button>
            <button class="bezel-btn" data-fx="mirror">MIRR</button>
            <button class="bezel-btn" data-fx="kaleid">KALD</button>
            <div class="bezel-divider"></div>
            <div style="font-size:7px;color:rgba(255,255,255,0.4);text-align:center;">MOUSE XY</div>
            <input type="range" class="bezel-slider" id="bezelFxIntensity" min="0" max="100" value="50" title="FX Intensity">
        </div>
    </div>

    <!-- ============ RIGHT BEZEL DRAWER (MODE) ============ -->
    <div id="bezelRight" class="bezel bezel-right">
        <!-- Collapsed state: mode indicators -->
        <div class="status-label" id="bezelPhysicsLabel">L</div>
        <div class="bezel-divider"></div>
        <div class="status-label" id="bezelEngineLabel">P</div>
        <div class="bezel-divider"></div>
        <div class="status-label" id="bezelIntLabel" style="font-size:8px;">50</div>
        <div class="bezel-divider"></div>
        <div class="status-dot active-fx" id="bezelMixDot" title="Mixer"></div>

        <!-- Expanded state: full controls -->
        <div class="drawer-content">
            <button class="bezel-btn cyan active" id="bezelLegacy" data-physics="LEGACY">LEG</button>
            <button class="bezel-btn cyan" id="bezelLaban" data-physics="LABAN">LAB</button>
            <div class="bezel-divider"></div>
            <button class="bezel-btn active" id="bezelPattern" data-mode="PATTERN">PAT</button>
            <button class="bezel-btn" id="bezelKinetic" data-mode="KINETIC">KIN</button>
            <div class="bezel-divider"></div>
            <div style="font-size:7px;color:rgba(255,255,255,0.4);text-align:center;">INT</div>
            <input type="range" class="bezel-slider" id="bezelIntSlider" min="0" max="100" value="50">
            <div class="bezel-divider"></div>
            <button class="bezel-btn active-fx" id="bezelMixBtn">MIX</button>
        </div>
    </div>

    <!-- GOLEM MIXER PANEL -->
    <div id="mixerPanel">
        <h3>GOLEM MIXER</h3>

        <!-- Tab Navigation -->
        <div class="mixer-tabs">
            <button class="mixer-tab active" data-tab="decks">DECKS</button>
            <button class="mixer-tab" data-tab="engine">ENGINE</button>
            <button class="mixer-tab" data-tab="fx">FX</button>
        </div>

        <!-- DECKS TAB -->
        <div id="tabDecks" class="tab-content">
            <div class="mixer-section">
                <div class="mixer-section-title">4-CHANNEL DECK SYSTEM</div>
                <div class="deck-grid">
                    <div class="deck-channel active" data-deck="1">
                        <div class="deck-label">CH 1</div>
                        <select class="deck-mode-select" data-deck="1">
                            <option value="sequencer">SEQ</option>
                            <option value="layer">LAYER</option>
                            <option value="off">OFF</option>
                        </select>
                        <div class="deck-indicator active"></div>
                    </div>
                    <div class="deck-channel" data-deck="2">
                        <div class="deck-label">CH 2</div>
                        <select class="deck-mode-select" data-deck="2">
                            <option value="sequencer">SEQ</option>
                            <option value="layer">LAYER</option>
                            <option value="off" selected>OFF</option>
                        </select>
                        <div class="deck-indicator"></div>
                    </div>
                    <div class="deck-channel" data-deck="3">
                        <div class="deck-label">CH 3</div>
                        <select class="deck-mode-select" data-deck="3">
                            <option value="sequencer">SEQ</option>
                            <option value="layer">LAYER</option>
                            <option value="off" selected>OFF</option>
                        </select>
                        <div class="deck-indicator"></div>
                    </div>
                    <div class="deck-channel" data-deck="4">
                        <div class="deck-label">CH 4</div>
                        <select class="deck-mode-select" data-deck="4">
                            <option value="sequencer">SEQ</option>
                            <option value="layer">LAYER</option>
                            <option value="off" selected>OFF</option>
                        </select>
                        <div class="deck-indicator"></div>
                    </div>
                </div>
            </div>

            <div class="mixer-section">
                <div class="mixer-section-title">BPM / BAR</div>
                <div class="bpm-display">
                    <div>
                        <div class="bpm-value" id="bpmValue">120</div>
                        <div class="bpm-label">BPM</div>
                    </div>
                    <div class="bar-counter" id="barCounter">
                        <div class="bar-beat downbeat"></div>
                        <div class="bar-beat"></div>
                        <div class="bar-beat"></div>
                        <div class="bar-beat"></div>
                        <div class="bar-beat"></div>
                        <div class="bar-beat"></div>
                        <div class="bar-beat"></div>
                        <div class="bar-beat"></div>
                        <div class="bar-beat"></div>
                        <div class="bar-beat"></div>
                        <div class="bar-beat"></div>
                        <div class="bar-beat"></div>
                        <div class="bar-beat"></div>
                        <div class="bar-beat"></div>
                        <div class="bar-beat"></div>
                        <div class="bar-beat"></div>
                    </div>
                </div>
            </div>

            <div class="mixer-section">
                <div class="mixer-section-title">TRIGGER PADS (hold to activate)</div>
                <div class="trigger-pads">
                    <button class="trigger-pad" data-trigger="stutter" data-key="q">STUTTER<span class="key-hint">[Q]</span></button>
                    <button class="trigger-pad" data-trigger="reverse" data-key="w">REVERSE<span class="key-hint">[W]</span></button>
                    <button class="trigger-pad" data-trigger="glitch" data-key="e">GLITCH<span class="key-hint">[E]</span></button>
                    <button class="trigger-pad" data-trigger="burst" data-key="r">BURST<span class="key-hint">[R]</span></button>
                </div>
            </div>
        </div>

        <!-- ENGINE TAB -->
        <div id="tabEngine" class="tab-content" style="display:none;">
            <div class="mixer-section">
                <div class="mixer-section-title">PHYSICS STYLE (how frames move)</div>
                <div class="engine-toggle" id="physicsToggle">
                    <button class="physics-btn active" data-physics="LEGACY">LEGACY</button>
                    <button class="physics-btn" data-physics="LABAN">LABAN</button>
                </div>
                <div class="mixer-section-title" style="margin-top:8px;">ENGINE MODE (which frame selected)</div>
                <div class="engine-toggle" id="engineToggle">
                    <button class="engine-btn active" data-mode="PATTERN">PATTERN</button>
                    <button class="engine-btn" data-mode="KINETIC">KINETIC</button>
                </div>
                <!-- LABAN Effort Display (shows when LABAN active) -->
                <div id="labanDisplay" style="display:none; margin-top:8px; padding:8px; background:rgba(0,255,255,0.1); border-radius:6px; border:1px solid rgba(0,255,255,0.2);">
                    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:4px; font-size:9px;">
                        <div style="text-align:center;">
                            <div style="color:rgba(255,255,255,0.5);">WEIGHT</div>
                            <div id="effortWeight" style="color:#00ffff; font-weight:700;">0.5</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="color:rgba(255,255,255,0.5);">SPACE</div>
                            <div id="effortSpace" style="color:#00ffff; font-weight:700;">0.5</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="color:rgba(255,255,255,0.5);">TIME</div>
                            <div id="effortTime" style="color:#00ffff; font-weight:700;">0.5</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="color:rgba(255,255,255,0.5);">FLOW</div>
                            <div id="effortFlow" style="color:#00ffff; font-weight:700;">0.5</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mixer-section">
                <div class="mixer-section-title">SEQUENCE MODE</div>
                <div class="seq-modes" id="seqModes">
                    <button class="seq-mode active" data-seq="GROOVE">GROOVE</button>
                    <button class="seq-mode" data-seq="EMOTE">EMOTE</button>
                    <button class="seq-mode" data-seq="IMPACT">IMPACT</button>
                    <button class="seq-mode" data-seq="FOOTWORK">FOOTWRK</button>
                </div>
            </div>

            <div class="mixer-section">
                <div style="display:flex; align-items:center; margin-bottom:8px;">
                    <div class="mixer-section-title" style="margin:0;">PATTERNS [1-0]</div>
                    <button id="shuffleBtn" class="shuffle-btn">SHUFFLE</button>
                </div>
                <div class="pattern-grid" id="patternGrid">
                    <button class="pattern-btn active" data-pattern="PING_PONG" data-key="1">PING</button>
                    <button class="pattern-btn" data-pattern="BUILD_DROP" data-key="2">DROP</button>
                    <button class="pattern-btn" data-pattern="STUTTER" data-key="3">STUT</button>
                    <button class="pattern-btn" data-pattern="VOGUE" data-key="4">VOGUE</button>
                    <button class="pattern-btn" data-pattern="FLOW" data-key="5">FLOW</button>
                    <button class="pattern-btn" data-pattern="CHAOS" data-key="6">CHAOS</button>
                    <button class="pattern-btn" data-pattern="ABAB" data-key="7">ABAB</button>
                    <button class="pattern-btn" data-pattern="AABB" data-key="8">AABB</button>
                    <button class="pattern-btn" data-pattern="ABAC" data-key="9">ABAC</button>
                    <button class="pattern-btn" data-pattern="SNARE_ROLL" data-key="0">SNARE</button>
                    <button class="pattern-btn" data-pattern="GROOVE">GROOVE</button>
                    <button class="pattern-btn" data-pattern="EMOTE">EMOTE</button>
                    <button class="pattern-btn" data-pattern="FOOTWORK">FOOT</button>
                    <button class="pattern-btn" data-pattern="IMPACT">IMPACT</button>
                    <button class="pattern-btn" data-pattern="MINIMAL">MIN</button>
                </div>
            </div>

            <div class="mixer-section">
                <div class="mixer-section-title">INTENSITY</div>
                <div class="mixer-slider-row">
                    <span class="mixer-slider-label">Energy</span>
                    <input type="range" id="energySlider" class="mixer-slider" min="0" max="100" value="50">
                </div>
                <div class="mixer-slider-row">
                    <span class="mixer-slider-label">Stutter</span>
                    <input type="range" id="stutterSlider" class="mixer-slider" min="0" max="100" value="30">
                </div>
            </div>
        </div>

        <!-- FX TAB -->
        <div id="tabFx" class="tab-content" style="display:none;">
            <div class="mixer-section">
                <div class="mixer-section-title">FX SLIDERS</div>
                <div class="fx-grid">
                    <div class="fx-slider-container">
                        <input type="range" class="fx-slider" id="fxRgb" min="0" max="100" value="0">
                        <div class="fx-label">RGB</div>
                    </div>
                    <div class="fx-slider-container">
                        <input type="range" class="fx-slider" id="fxFlash" min="0" max="100" value="0">
                        <div class="fx-label">FLASH</div>
                    </div>
                    <div class="fx-slider-container">
                        <input type="range" class="fx-slider" id="fxGlitch" min="0" max="100" value="0">
                        <div class="fx-label">GLITCH</div>
                    </div>
                    <div class="fx-slider-container">
                        <input type="range" class="fx-slider" id="fxZoom" min="0" max="100" value="0">
                        <div class="fx-label">ZOOM</div>
                    </div>
                </div>
            </div>

            <div class="mixer-section">
                <div class="mixer-section-title">FX TOGGLES</div>
                <div class="fx-toggles">
                    <button class="fx-toggle" data-fx="invert">INVERT</button>
                    <button class="fx-toggle" data-fx="grayscale">B+W</button>
                    <button class="fx-toggle" data-fx="mirror">MIRROR</button>
                    <button class="fx-toggle" data-fx="strobe">STROBE</button>
                    <button class="fx-toggle" data-fx="pixelate">PIXEL</button>
                    <button class="fx-toggle" data-fx="scanlines">SCAN</button>
                </div>
            </div>

            <div class="mixer-section">
                <div class="mixer-section-title">FILTER</div>
                <div class="mixer-slider-row">
                    <span class="mixer-slider-label">Hue</span>
                    <input type="range" id="fxHue" class="mixer-slider" min="0" max="360" value="0">
                </div>
                <div class="mixer-slider-row">
                    <span class="mixer-slider-label">Saturation</span>
                    <input type="range" id="fxSaturation" class="mixer-slider" min="0" max="200" value="100">
                </div>
                <div class="mixer-slider-row">
                    <span class="mixer-slider-label">Contrast</span>
                    <input type="range" id="fxContrast" class="mixer-slider" min="50" max="150" value="100">
                </div>
            </div>
        </div>
    </div>

    <!-- Help Overlay -->
    <div id="helpOverlay">
        <h3>KEYBOARD SHORTCUTS</h3>
        <div class="hotkey-row"><span class="key">SPACE</span><span class="desc">Play/Pause audio</span></div>
        <div class="hotkey-row"><span class="key">M</span><span class="desc">Toggle mixer panel</span></div>
        <div class="hotkey-row"><span class="key">D</span><span class="desc">Toggle frame deck</span></div>
        <div class="hotkey-row"><span class="key">C</span><span class="desc">Toggle dynamic camera</span></div>
        <div class="hotkey-row"><span class="key">Q W E R</span><span class="desc">Trigger pads (hold)</span></div>
        <div class="hotkey-row"><span class="key">1-0</span><span class="desc">Select patterns 1-10</span></div>
        <div class="hotkey-row"><span class="key">L</span><span class="desc">Toggle LEGACY/LABAN</span></div>
        <div class="hotkey-row"><span class="key">K</span><span class="desc">Toggle PATTERN/KINETIC</span></div>
        <div class="hotkey-row"><span class="key">S</span><span class="desc">Toggle pattern shuffle</span></div>
        <div class="hotkey-row"><span class="key">?</span><span class="desc">Show/hide this help</span></div>
        <div style="margin-top:16px; text-align:center; color:rgba(255,255,255,0.4); font-size:10px;">Press ? to close</div>
    </div>

    <div id="tapHint">TAP TO SHOW CONTROLS</div>

    <div id="ui">
        <!-- Row 1: Main controls -->
        <div class="ui-row">
            <button id="btnPlay" class="btn-icon" title="Play/Pause">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button id="btnMic" class="btn-icon red" title="Microphone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
            </button>
            <div class="separator"></div>
            <button id="btnCam" class="active" title="Camera Motion">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span class="btn-label">CAM</span>
            </button>
            <button id="btnFx" title="Effects">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/></svg>
                <span class="btn-label">FX</span>
            </button>
            <button id="btnMixer" title="Mixer Panel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="20" cy="14" r="2"/></svg>
                <span class="btn-label">MIXER</span>
            </button>
            <button id="btnDeck" title="Frame Deck">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <span class="btn-label">DECK</span>
            </button>
        </div>

        <!-- Row 2: Mode toggles + Load -->
        <div class="ui-row">
            <button id="btnPhysics" class="cyan" title="Physics: LEGACY/LABAN">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4l3-2"/></svg>
                <span id="physicsLabel">LEGACY</span>
            </button>
            <button id="btnEngine" class="orange" title="Engine: PATTERN/KINETIC">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <span id="engineLabel">PATTERN</span>
            </button>
            <div class="separator"></div>
            <button id="btnLoadRig" title="Load Rig File">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span class="btn-label">RIG</span>
            </button>
            <button id="btnLoadAudio" title="Load Audio">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                <span class="btn-label">AUDIO</span>
            </button>
            <button id="btnHelp" class="btn-icon" title="Help">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </button>
            <div class="separator"></div>
            <a href="https://jusdnce.com" target="_blank" id="btnGetMore" class="active" title="Create More Rigs" style="text-decoration:none;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M12 5v14M5 12h14"/></svg>
                <span class="btn-label">GET MORE</span>
            </a>
        </div>

        <!-- Progression indicator -->
        <div class="ui-row" style="gap:4px; opacity:0.5;">
            <span style="font-size:9px; letter-spacing:2px; color:#888;">PROGRESSION</span>
            <div id="progressBars" style="display:flex; gap:3px;">
                <div class="prog-bar" style="width:32px;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;"></div>
                <div class="prog-bar" style="width:32px;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;"></div>
                <div class="prog-bar" style="width:32px;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;"></div>
                <div class="prog-bar" style="width:32px;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;"></div>
            </div>
        </div>
    </div>

    <input type="file" id="rigInput" style="display:none" accept=".jusdnce,.json">
    <input type="file" id="audioInput" style="display:none" accept="audio/*">

    <script>
        // --- 1. DATA INJECTION ---
        let FRAMES = ${framesJSON};
        let PARAMS = ${paramsJSON};
        let SUBJECT = "${subjectCategory}";
        
        // --- 2. SHADER SOURCE ---
        const VERTEX = \`${VERTEX_SHADER}\`;
        const FRAGMENT = \`${FRAGMENT_SHADER}\`;

        // --- 3. QUANTUM VISUALIZER ENGINE ---
        class Visualizer {
            constructor(canvas) {
                this.canvas = canvas;
                this.gl = canvas.getContext('webgl', { alpha: false, preserveDrawingBuffer: true });
                if(!this.gl) this.gl = canvas.getContext('experimental-webgl');
                this.startTime = Date.now();
                this.mouse = {x:0, y:0};
                this.init();
            }
            init() {
                const vs = this.createShader(this.gl.VERTEX_SHADER, VERTEX);
                const fs = this.createShader(this.gl.FRAGMENT_SHADER, FRAGMENT);
                this.program = this.gl.createProgram();
                this.gl.attachShader(this.program, vs);
                this.gl.attachShader(this.program, fs);
                this.gl.linkProgram(this.program);
                this.gl.useProgram(this.program);
                
                const buffer = this.gl.createBuffer();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), this.gl.STATIC_DRAW);
                const loc = this.gl.getAttribLocation(this.program, 'a_position');
                this.gl.enableVertexAttribArray(loc);
                this.gl.vertexAttribPointer(loc, 2, this.gl.FLOAT, false, 0, 0);
                
                this.locs = {
                    res: this.gl.getUniformLocation(this.program, 'u_resolution'),
                    time: this.gl.getUniformLocation(this.program, 'u_time'),
                    mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
                    bass: this.gl.getUniformLocation(this.program, 'u_audioBass'),
                    mid: this.gl.getUniformLocation(this.program, 'u_audioMid'),
                    high: this.gl.getUniformLocation(this.program, 'u_audioHigh'),
                    col: this.gl.getUniformLocation(this.program, 'u_color'),
                    den: this.gl.getUniformLocation(this.program, 'u_density'),
                    spd: this.gl.getUniformLocation(this.program, 'u_speed'),
                    int: this.gl.getUniformLocation(this.program, 'u_intensity'),
                    chs: this.gl.getUniformLocation(this.program, 'u_chaos'),
                    mph: this.gl.getUniformLocation(this.program, 'u_morph'),
                    camZ: this.gl.getUniformLocation(this.program, 'u_cameraZ'),
                    camRot: this.gl.getUniformLocation(this.program, 'u_cameraRot'),
                };
            }
            createShader(type, src) {
                const s = this.gl.createShader(type);
                this.gl.shaderSource(s, src);
                this.gl.compileShader(s);
                return s;
            }
            render(audio, camZ, rot) {
                const w = window.innerWidth;
                const h = window.innerHeight;
                if(this.canvas.width!==w || this.canvas.height!==h) {
                    this.canvas.width=w; this.canvas.height=h;
                    this.gl.viewport(0,0,w,h);
                }
                
                // HSL to RGB conversion embedded
                const hVal = (PARAMS.hue || 200) / 360;
                const sVal = PARAMS.saturation || 0.8;
                const lVal = 0.6;
                const q = lVal < 0.5 ? lVal * (1 + sVal) : lVal + sVal - lVal * sVal;
                const p = 2 * lVal - q;
                const hue2rgb = (p, q, t) => {
                    if(t < 0) t += 1; if(t > 1) t -= 1;
                    if(t < 1/6) return p + (q - p) * 6 * t;
                    if(t < 1/2) return q;
                    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                }
                const r = hue2rgb(p, q, hVal + 1/3);
                const g = hue2rgb(p, q, hVal);
                const b = hue2rgb(p, q, hVal - 1/3);

                this.gl.uniform2f(this.locs.res, w, h);
                this.gl.uniform1f(this.locs.time, (Date.now()-this.startTime)/1000);
                this.gl.uniform2f(this.locs.mouse, this.mouse.x, this.mouse.y);
                this.gl.uniform1f(this.locs.bass, audio.bass);
                this.gl.uniform1f(this.locs.mid, audio.mid);
                this.gl.uniform1f(this.locs.high, audio.high);
                this.gl.uniform3f(this.locs.col, r, g, b);
                this.gl.uniform1f(this.locs.den, PARAMS.density || 2.0);
                this.gl.uniform1f(this.locs.spd, PARAMS.speed || 0.1);
                this.gl.uniform1f(this.locs.int, PARAMS.intensity || 0.6);
                this.gl.uniform1f(this.locs.chs, PARAMS.chaos || 0.5);
                this.gl.uniform1f(this.locs.mph, PARAMS.morph || 0.0);
                this.gl.uniform1f(this.locs.camZ, camZ);
                this.gl.uniform3f(this.locs.camRot, rot.x, rot.y, rot.z);
                this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            }
        }

        // --- 4. ENGINE STATE ---
        const bgC = document.getElementById('bgCanvas');
        const charC = document.getElementById('charCanvas');
        const ctx = charC.getContext('2d');
        const loader = document.getElementById('loader');
        const deck = document.getElementById('deck');
        
        const viz = new Visualizer(bgC);
        
        let IMAGES = {};
        let FRAMES_BY_ENERGY = { low:[], mid:[], high:[] };
        let CLOSEUPS = [];
        let ALL_FRAMES = [];
        
        const STATE = {
            masterRot: {x:0, y:0, z:0},
            masterVel: {x:0, y:0, z:0},
            camZoom: 1.15,
            camPanX: 0,
            charSquash: 1.0,
            charSkew: 0.0,
            charTilt: 0.0,
            charBounceY: 0.0,
            targetTilt: 0.0,
            sourcePose: 'base',
            targetPose: 'base',
            transitionProgress: 1.0,
            transitionSpeed: 10.0,
            transitionMode: 'CUT',
            direction: 'center',
            lastBeat: 0,
            beatCount: 0,
            closeupLockTime: 0,
            flashIntensity: 0.0,
            dynamicCam: true,
            filterMode: 'NORMAL', // NORMAL, INVERT, BW
            // Golem Mixer state
            physicsStyle: 'LEGACY', // LEGACY or LABAN (how frames move)
            engineMode: 'PATTERN', // PATTERN or KINETIC (which frame selected)
            pattern: 'PING_PONG',
            sequenceMode: 'GROOVE', // GROOVE, EMOTE, IMPACT, FOOTWORK
            energyMultiplier: 1.0,
            stutterChance: 0.3,
            // LABAN effort state (calculated from audio)
            labanEffort: { weight: 0.5, space: 0.5, time: 0.5, flow: 0.5 },
            // 4-channel deck modes
            deckModes: ['sequencer', 'off', 'off', 'off'],
            activeDeck: 0,
            // BPM tracking
            bpm: 120,
            beatInBar: 0,
            barCount: 0,
            lastBeatTime: 0,
            beatIntervals: [],
            // Trigger states
            triggers: { stutter: false, reverse: false, glitch: false, burst: false },
            // Interactive mode state
            shuffleMode: false,
            shuffleInterval: null,
            helpVisible: false,
            // FX state
            fx: {
                rgb: 0, flash: 0, glitch: 0, zoom: 0,
                invert: false, grayscale: false, mirror: false, strobe: false,
                pixelate: false, scanlines: false,
                hue: 0, saturation: 100, contrast: 100
            },
            // Synthetic beat mode (fallback when no audio/mic)
            syntheticBeat: false,
            synthBPM: 120,
            synthPhase: 0
        };

        // --- 5. INITIALIZATION LOGIC ---
        function loadRig(newFrames, newParams, newSubject) {
            loader.style.opacity = 1;
            document.body.appendChild(loader);
            
            if(newFrames) FRAMES = newFrames;
            if(newParams) PARAMS = newParams;
            if(newSubject) SUBJECT = newSubject;
            
            document.getElementById('subjectDisplay').innerText = SUBJECT;
            
            IMAGES = {};
            FRAMES_BY_ENERGY = { low:[], mid:[], high:[] };
            CLOSEUPS = [];
            ALL_FRAMES = [];
            deck.innerHTML = '';
            
            // Replicate Step4Preview Virtual Frame Logic
            let processedFrames = [];
            FRAMES.forEach(f => {
                processedFrames.push(f);
                ALL_FRAMES.push(f);
                // Create Frame Thumbnail in Deck
                const thumb = document.createElement('div');
                thumb.className = 'frame-thumb';
                thumb.onclick = () => triggerTransition(f.pose, 'CUT');
                thumb.innerHTML = \`<img src="\${f.url}"> <div class="badge">\${f.energy.toUpperCase()}</div>\`;
                deck.appendChild(thumb);

                // Create Virtuals logic
                if(f.energy === 'high' && f.type === 'body') {
                    processedFrames.push({ ...f, pose: f.pose+'_vzoom', isVirtual: true, virtualZoom: 1.6, virtualOffsetY: 0.2 });
                }
                if(f.energy === 'mid' && f.type === 'body') {
                    processedFrames.push({ ...f, pose: f.pose+'_vmid', isVirtual: true, virtualZoom: 1.25, virtualOffsetY: 0.1 });
                }
            });
            
            processedFrames.forEach(f => {
                const data = { ...f };
                if(f.type === 'closeup') CLOSEUPS.push(data);
                else {
                    if(!FRAMES_BY_ENERGY[f.energy]) FRAMES_BY_ENERGY[f.energy] = [];
                    FRAMES_BY_ENERGY[f.energy].push(data);
                }
            });
            
            // Fallbacks
            if(FRAMES_BY_ENERGY.low.length===0) FRAMES_BY_ENERGY.low = FRAMES_BY_ENERGY.mid.length > 0 ? [...FRAMES_BY_ENERGY.mid] : [...FRAMES_BY_ENERGY.high];
            if(FRAMES_BY_ENERGY.mid.length===0) FRAMES_BY_ENERGY.mid = [...FRAMES_BY_ENERGY.low];
            if(FRAMES_BY_ENERGY.high.length===0) FRAMES_BY_ENERGY.high = [...FRAMES_BY_ENERGY.mid];
            
            // Preload Images
            let loaded = 0;
            const total = processedFrames.length;
            if(total === 0) { hideLoader(); return; }
            
            processedFrames.forEach(f => {
                if(IMAGES[f.pose]) { 
                    loaded++; 
                    if(loaded===total) hideLoader();
                    return; 
                }
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = f.url;
                const onDone = () => { loaded++; if(loaded === total) hideLoader(); };
                img.onload = onDone;
                img.onerror = onDone;
                IMAGES[f.pose] = img;
            });
            
            STATE.targetPose = processedFrames[0]?.pose || 'base';
            STATE.sourcePose = STATE.targetPose;
        }
        
        function hideLoader() {
            loader.style.opacity = 0;
            setTimeout(() => { if(loader.parentNode) loader.parentNode.removeChild(loader); }, 500);
        }

        // --- 6. AUDIO SYSTEM ---
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        let sourceNode = null;
        let micStream = null;
        let audioEl = new Audio();
        audioEl.crossOrigin = "anonymous";
        audioEl.loop = true;

        const PlayerBridge = {
            onLevel: null,
            onBeat: null,
            postToHost(payload) {
                try { if (window.parent && window.parent !== window) window.parent.postMessage(payload, '*'); } catch (e) { console.warn('postMessage failed', e); }
            },
            start: () => resolveGesture && resolveGesture(),
            pause: () => audioEl.pause(),
            setLayoutPreset: (preset) => setLayoutPreset && setLayoutPreset(preset),
            selectAdapter: (adapter) => activateAdapter && activateAdapter(adapter),
            load: (url) => loadExternalUrl && loadExternalUrl(url)
        };
        window.JusdncePlayer = PlayerBridge;

        const gestureGate = document.getElementById('gestureGate');
        const gestureStart = document.getElementById('gestureStart');
        const adapterTray = document.getElementById('adapterTray');
        const fileAdapterInput = document.getElementById('fileAdapter');
        let gestureResolved = false;

        function resolveGesture() {
            if (gestureResolved) return;
            gestureResolved = true;
            gestureGate.style.display = 'none';
            audioCtx.resume();
            PlayerBridge.postToHost({ type: 'jusdnce:armed' });
        }

        gestureStart.onclick = () => resolveGesture();

        function setLayoutPreset(preset) {
            document.body.classList.remove('preset-overlay', 'preset-widget', 'preset-background');
            if (preset) document.body.classList.add('preset-' + preset);
            document.body.style.pointerEvents = preset === 'background' ? 'none' : 'auto';
            PlayerBridge.postToHost({ type: 'jusdnce:layout', preset });
        }

        function setMediaStream(stream, label = 'mic') {
            if (sourceNode) sourceNode.disconnect();
            sourceNode = audioCtx.createMediaStreamSource(stream);
            sourceNode.connect(analyser);
            sourceNode.connect(audioCtx.destination);
            micStream = stream;
            STATE.syntheticBeat = false;
            audioEl.pause();
            PlayerBridge.postToHost({ type: 'jusdnce:input', input: label });
        }

        async function requestMicrophone() {
            resolveGesture();
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Microphone is unavailable in this browser. Falling back to synthetic beat mode.');
                STATE.syntheticBeat = true;
                return null;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true } });
                setMediaStream(stream, 'mic');
                return stream;
            } catch (e) {
                console.warn('Microphone request failed', e);
                alert('Microphone permission was blocked. Enable the mic or use an adapter.');
                STATE.syntheticBeat = true;
                return null;
            }
        }

        async function captureSystemAudio() {
            resolveGesture();
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length === 0) throw new Error('No system audio track available');
                const audioOnly = new MediaStream(audioTracks);
                stream.getVideoTracks().forEach(t => t.stop());
                setMediaStream(audioOnly, 'system');
            } catch (e) {
                console.warn('System audio capture failed', e);
                alert('System audio capture is blocked or unsupported. Try file upload or mic.');
            }
        }

        function loadExternalUrl(url) {
            resolveGesture();
            connectAudioElement();
            audioEl.src = url;
            audioEl.play();
            STATE.syntheticBeat = false;
            PlayerBridge.postToHost({ type: 'jusdnce:input', input: 'media', url });
        }

        function hookExternalSdk(adapter) {
            const shim = { type: adapter, status: 'listening' };
            PlayerBridge.postToHost({ type: 'jusdnce:adapter', adapter, shim });
            const mediaSession = navigator.mediaSession;
            if (mediaSession && mediaSession.metadata) {
                mediaSession.setActionHandler?.('play', () => resolveGesture());
            }
        }

        function activateAdapter(adapter) {
            document.querySelectorAll('.adapter-pill').forEach(pill => pill.classList.toggle('active', pill.dataset.adapter === adapter));
            if (adapter === 'file') fileAdapterInput.click();
            else if (adapter === 'system') captureSystemAudio();
            else if (adapter === 'background') setLayoutPreset('background');
            else hookExternalSdk(adapter);
        }

        fileAdapterInput.onchange = () => {
            const file = fileAdapterInput.files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            loadExternalUrl(url);
        };

        adapterTray.querySelectorAll('.adapter-pill').forEach(pill => pill.addEventListener('click', () => activateAdapter(pill.dataset.adapter)));

        window.addEventListener('message', (event) => {
            const data = event.data;
            if (!data || typeof data !== 'object') return;
            if (data.type === 'jusdnce:start') resolveGesture();
            if (data.type === 'jusdnce:layout') setLayoutPreset(data.preset);
            if (data.type === 'jusdnce:adapter') activateAdapter(data.adapter);
            if (data.type === 'jusdnce:load' && data.url) loadExternalUrl(data.url);
            if (data.type === 'jusdnce:mic') requestMicrophone();
        });

        function connectAudioElement() {
            if(!sourceNode) {
                sourceNode = audioCtx.createMediaElementSource(audioEl);
                sourceNode.connect(analyser);
                sourceNode.connect(audioCtx.destination);
            }
        }

        // --- 7. MAIN LOOP (PHYSICS & RENDER) ---
        let lastTime = Date.now();
        
        function triggerTransition(newPose, mode) {
            if (newPose === STATE.targetPose) return;
            STATE.sourcePose = STATE.targetPose;
            STATE.targetPose = newPose;
            STATE.transitionProgress = 0.0;
            STATE.transitionMode = mode;
            
            let speed = 20.0;
            if (mode === 'CUT') speed = 1000.0;
            else if (mode === 'MORPH') speed = 5.0;
            else if (mode === 'SLIDE') speed = 8.0;
            else if (mode === 'ZOOM_IN') speed = 6.0;
            else if (mode === 'SMOOTH') speed = 1.5;
            
            STATE.transitionSpeed = speed;
        }

        // ENERGY HISTORY FOR TREND
        const energyHistory = new Array(30).fill(0);

        function loop() {
            requestAnimationFrame(loop);
            const now = Date.now();
            const dt = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;
            const w = window.innerWidth;
            const h = window.innerHeight;
            
            // Audio Data - with synthetic fallback
            let bass, mid, high, energy;

            if (STATE.syntheticBeat) {
                // Synthetic beat generation - creates rhythmic patterns without audio
                const beatInterval = 60000 / STATE.synthBPM; // ms per beat
                STATE.synthPhase = (now % beatInterval) / beatInterval; // 0-1 phase
                const beatPhase = STATE.synthPhase;

                // Kick on beats 1 and 3 (0, 0.5 in a 2-beat cycle)
                const kickPhase = (now % (beatInterval * 2)) / (beatInterval * 2);
                const isKick = kickPhase < 0.05 || (kickPhase > 0.5 && kickPhase < 0.55);
                // Snare on beats 2 and 4
                const isSnare = (kickPhase > 0.25 && kickPhase < 0.3) || (kickPhase > 0.75 && kickPhase < 0.8);
                // Hi-hat on every 8th
                const hhPhase = (now % (beatInterval / 2)) / (beatInterval / 2);
                const isHiHat = hhPhase < 0.1;

                // Generate smooth audio-like values
                bass = isKick ? 0.9 - beatPhase * 0.5 : Math.max(0, 0.2 - beatPhase * 0.2);
                mid = isSnare ? 0.7 - beatPhase * 0.3 : 0.15 + Math.sin(now * 0.003) * 0.1;
                high = isHiHat ? 0.5 : 0.1 + Math.sin(now * 0.007) * 0.05;
                energy = bass * 0.5 + mid * 0.3 + high * 0.2;
            } else {
                const freq = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(freq);

                bass = freq.slice(0,5).reduce((a,b)=>a+b,0)/(5*255);
                mid = freq.slice(5,30).reduce((a,b)=>a+b,0)/(25*255);
                high = freq.slice(30,100).reduce((a,b)=>a+b,0)/(70*255);
                energy = (bass * 0.5 + mid * 0.3 + high * 0.2);
            }

            PlayerBridge.onLevel?.({ bass, mid, high, energy });
            PlayerBridge.postToHost({ type: 'jusdnce:levels', payload: { bass, mid, high, energy, t: now } });

            // Update BPM detection (function defined in mixer handlers)
            if (typeof updateBPM === 'function') updateBPM(bass, now);

            // Trend Analysis
            energyHistory.shift();
            energyHistory.push(energy);
            const avgEnergy = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;
            const energyTrend = energy - avgEnergy;

            // Physics Update (Spring Solver)
            // LABAN mode: Calculate effort factors from audio
            if (STATE.physicsStyle === 'LABAN') {
                // Weight: bass = strong, low bass = light
                STATE.labanEffort.weight = bass;
                // Space: high freq = direct, low = indirect
                STATE.labanEffort.space = high;
                // Time: energy volatility = sudden, stable = sustained
                const energyVariance = Math.abs(energyTrend);
                STATE.labanEffort.time = Math.min(1, energyVariance * 5);
                // Flow: mid stability = bound, variable = free
                STATE.labanEffort.flow = 1 - mid;
            }

            if(STATE.dynamicCam) {
                let stiffness = 140;
                let damping = 8;
                let rotScale = 1.0;
                let squashMod = 1.0;
                let bounceMod = 1.0;

                // Apply LABAN effort modifiers
                if (STATE.physicsStyle === 'LABAN') {
                    const e = STATE.labanEffort;
                    rotScale = 0.5 + e.space * 1.5;     // Direct space = more rotation
                    squashMod = 0.5 + e.weight * 1.0;  // Strong weight = more squash
                    bounceMod = 0.5 + e.time * 1.5;    // Sudden time = more bounce
                    // Bound flow = sharper transitions (higher stiffness)
                    stiffness = 100 + e.flow * 80;
                    damping = 5 + (1 - e.flow) * 6;
                }

                const tRotX = bass * 35.0 * rotScale;
                const tRotY = mid * 25.0 * Math.sin(now * 0.005) * rotScale;
                const tRotZ = high * 15.0 * rotScale;

                STATE.masterVel.x += ((tRotX - STATE.masterRot.x) * stiffness - STATE.masterVel.x * damping) * dt;
                STATE.masterRot.x += STATE.masterVel.x * dt;

                STATE.masterVel.y += ((tRotY - STATE.masterRot.y) * stiffness*0.5 - STATE.masterVel.y * damping*0.8) * dt;
                STATE.masterRot.y += STATE.masterVel.y * dt;

                STATE.masterVel.z += ((tRotZ - STATE.masterRot.z) * stiffness - STATE.masterVel.z * damping) * dt;
                STATE.masterRot.z += STATE.masterVel.z * dt;

                // Apply LABAN squash/bounce modifiers
                if (STATE.physicsStyle === 'LABAN') {
                    STATE.charSquash = 1 - (STATE.labanEffort.weight * 0.3 * squashMod);
                    STATE.charBounceY = -STATE.labanEffort.time * 60 * bounceMod * bass;
                }
            } else {
                STATE.masterRot = {x:0, y:0, z:0};
            }
            
            // Transition Update
            if(STATE.transitionProgress < 1.0) {
                STATE.transitionProgress += STATE.transitionSpeed * dt;
                if(STATE.transitionProgress > 1.0) STATE.transitionProgress = 1.0;
            }
            
            // The Brain (Choreography)
            const isCloseupLocked = now < STATE.closeupLockTime;
            const isStuttering = (mid > 0.6 || high > 0.6) && !isCloseupLocked;

            // Trigger Pad: Stutter (force stutter when held)
            const stutterActive = STATE.triggers.stutter || isStuttering;

            // Stutter Logic - Modified by mixer settings and trigger pads
            const stutterThreshold = STATE.stutterChance * 0.3;
            if ((stutterActive && Math.random() < stutterThreshold) || STATE.triggers.stutter) {
                if (Math.random() < 0.35 || STATE.pattern === 'STUTTER' || STATE.triggers.stutter) {
                     // Reverse
                     const swap = STATE.targetPose;
                     triggerTransition(STATE.sourcePose, 'CUT');
                     STATE.sourcePose = swap;
                     STATE.charSkew = (Math.random() - 0.5) * 2.0;
                     STATE.masterRot.z += (Math.random() - 0.5) * 10;
                }
            }

            // Trigger Pad: Reverse (swap poses when held)
            if (STATE.triggers.reverse && Math.random() < 0.15) {
                const swap = STATE.targetPose;
                triggerTransition(STATE.sourcePose, 'CUT');
                STATE.sourcePose = swap;
            }

            // Strobe effect
            if (STATE.fx.strobe && now % 100 < 50) {
                STATE.flashIntensity = 0.9;
            }

            // Rhythm Logic
            if(bass > 0.5 && (now - STATE.lastBeat) > 300) {
                STATE.lastBeat = now;
                STATE.beatCount = (STATE.beatCount + 1) % 16;
                const beat = STATE.beatCount;

                let phase = 'WARMUP';
                if(beat >= 4 && beat < 8) phase = 'SWING_LEFT';
                else if(beat >= 8 && beat < 12) phase = 'SWING_RIGHT';
                else if(beat >= 12) phase = 'DROP';

                PlayerBridge.onBeat?.({ beat, phase, time: now });
                PlayerBridge.postToHost({ type: 'jusdnce:beat', payload: { beat, phase, time: now } });

                // Chaos Mode triggers FX
                if (phase === 'DROP' && Math.random() > 0.7) STATE.filterMode = Math.random() > 0.5 ? 'INVERT' : 'BW';
                else STATE.filterMode = 'NORMAL';
                
                STATE.camZoom = 1.15 + (bass * 0.35);
                STATE.charSquash = 0.85;
                STATE.charBounceY = -50 * bass;
                STATE.flashIntensity = 0.8;
                
                if(phase === 'SWING_LEFT') { STATE.targetTilt = -8; STATE.direction = 'left'; }
                else if(phase === 'SWING_RIGHT') { STATE.targetTilt = 8; STATE.direction = 'right'; }
                else { STATE.targetTilt = 0; STATE.direction = 'center'; }
                
                // Pool selection based on mixer pattern
                let pool = [];
                const pattern = STATE.pattern;

                if(isCloseupLocked) pool = CLOSEUPS;
                else if(pattern === 'EMOTE' && CLOSEUPS.length > 0) pool = CLOSEUPS;
                else if(pattern === 'CHAOS') pool = [...FRAMES_BY_ENERGY.low, ...FRAMES_BY_ENERGY.mid, ...FRAMES_BY_ENERGY.high];
                else if(pattern === 'MINIMAL') pool = FRAMES_BY_ENERGY.low;
                else if(pattern === 'IMPACT' || pattern === 'BUILD_DROP') pool = FRAMES_BY_ENERGY.high;
                else if(pattern === 'GROOVE' || pattern === 'FLOW') pool = FRAMES_BY_ENERGY.mid;
                else if(pattern === 'FOOTWORK') pool = FRAMES_BY_ENERGY.mid.filter(f => f.direction === 'left' || f.direction === 'right');
                else {
                    // Original logic for PING_PONG, ABAB, AABB, etc.
                    if (energyTrend > 0.1 * STATE.energyMultiplier && FRAMES_BY_ENERGY.high.length > 0) pool = FRAMES_BY_ENERGY.high;
                    else {
                        if(phase === 'WARMUP') pool = FRAMES_BY_ENERGY.low;
                        else if(phase === 'SWING_LEFT') pool = FRAMES_BY_ENERGY.mid.filter(f=>f.direction==='left');
                        else if(phase === 'SWING_RIGHT') pool = FRAMES_BY_ENERGY.mid.filter(f=>f.direction==='right');
                        else if(phase === 'DROP') pool = FRAMES_BY_ENERGY.high;
                    }
                }
                
                if(pool.length === 0) pool = FRAMES_BY_ENERGY.mid;
                if(pool.length === 0) pool = FRAMES_BY_ENERGY.low;
                
                if(pool.length > 0) {
                    const next = pool[Math.floor(Math.random()*pool.length)];
                    let mode = 'CUT';
                    
                    if(isCloseupLocked || next.type === 'closeup') mode = 'ZOOM_IN';
                    else if(phase.includes('SWING')) {
                         if(high > 0.4) mode = 'SMOOTH';
                         else mode = 'SLIDE';
                    } else if (energyTrend < -0.1) {
                        mode = 'SMOOTH';
                    }
                    
                    triggerTransition(next.pose, mode);
                }
            } else if (bass < 0.3 && mid < 0.3 && Math.random() < 0.02) {
                 // Ambient drift
                 const pool = FRAMES_BY_ENERGY.low;
                 if(pool.length > 0) {
                     const next = pool[Math.floor(Math.random()*pool.length)];
                     triggerTransition(next.pose, 'SMOOTH');
                 }
                 STATE.targetTilt = 0;
            }
            
            // Vocal Gate
            if(!isCloseupLocked && high > 0.6 && mid > 0.4 && bass < 0.5) {
                if(CLOSEUPS.length > 0 && Math.random() < 0.5) {
                    const next = CLOSEUPS[Math.floor(Math.random()*CLOSEUPS.length)];
                    triggerTransition(next.pose, 'ZOOM_IN');
                    STATE.closeupLockTime = now + 2500;
                }
            }
            
            // Decay
            STATE.charSquash += (1.0 - STATE.charSquash) * (12 * dt);
            STATE.charSkew += (0.0 - STATE.charSkew) * (10 * dt);
            STATE.charTilt += (STATE.targetTilt - STATE.charTilt) * (6 * dt);
            STATE.charBounceY += (0 - STATE.charBounceY) * (10 * dt);
            STATE.flashIntensity *= Math.exp(-15 * dt);
            STATE.camZoom += (1.15 - STATE.camZoom) * (1 - Math.exp(-5 * dt));
            
            let targetPanX = 0;
            if(STATE.direction === 'left') targetPanX = 30;
            else if(STATE.direction === 'right') targetPanX = -30;
            STATE.camPanX += (targetPanX - STATE.camPanX) * (4 * dt);

            // Render
            const rx = STATE.dynamicCam ? STATE.masterRot.x : 0;
            const ry = STATE.dynamicCam ? STATE.masterRot.y : 0;
            const rz = STATE.dynamicCam ? STATE.masterRot.z : 0;
            viz.render({bass,mid,high}, 0, {x: rx*0.3, y: ry*0.3, z: rz*0.2});
            
            if(charC.width !== w || charC.height !== h) { charC.width=w; charC.height=h; }
            const cx = w/2; const cy = h/2;
            ctx.clearRect(0,0,w,h);

            // Build filter string from FX state
            let filters = [];
            if(STATE.fx.invert) filters.push('invert(1)');
            if(STATE.fx.grayscale) filters.push('grayscale(1)');
            if(STATE.fx.hue !== 0) filters.push(\`hue-rotate(\${STATE.fx.hue}deg)\`);
            if(STATE.fx.saturation !== 100) filters.push(\`saturate(\${STATE.fx.saturation}%)\`);
            if(STATE.fx.contrast !== 100) filters.push(\`contrast(\${STATE.fx.contrast}%)\`);
            // Legacy filter mode support
            if(STATE.filterMode === 'INVERT' && !STATE.fx.invert) filters.push('invert(1)');
            if(STATE.filterMode === 'BW' && !STATE.fx.grayscale) filters.push('grayscale(1)');
            ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';

            // Flash from FX or trigger
            const flashAmount = Math.max(STATE.flashIntensity, STATE.fx.flash, STATE.triggers.burst ? 0.8 : 0);
            if(flashAmount > 0.01) {
                ctx.fillStyle = \`rgba(255,255,255,\${flashAmount})\`;
                ctx.fillRect(0,0,w,h);
            }

            // Glitch effect from FX
            if(STATE.fx.glitch > 0 || STATE.triggers.glitch) {
                const glitchAmount = Math.max(STATE.fx.glitch, STATE.triggers.glitch ? 0.8 : 0);
                if(Math.random() < glitchAmount * 0.3) {
                    const sliceH = Math.random() * h * 0.1;
                    const sliceY = Math.random() * h;
                    const offset = (Math.random() - 0.5) * w * glitchAmount * 0.1;
                    ctx.drawImage(charC, 0, sliceY, w, sliceH, offset, sliceY, w, sliceH);
                }
            }

            const drawLayer = (pose, opacity, blur, skew, extraScale) => {
                const frame = [...FRAMES_BY_ENERGY.low, ...FRAMES_BY_ENERGY.mid, ...FRAMES_BY_ENERGY.high, ...CLOSEUPS].find(f => f.pose === pose);
                const img = IMAGES[pose];
                if(!img || !img.complete) return;
                
                const aspect = img.width / img.height;
                let dw = w * 1.0; let dh = dw / aspect;
                if(dh > h) { dh = h; dw = dh*aspect; }
                
                let zoom = STATE.camZoom;
                let vOffset = 0;
                if(frame && frame.isVirtual) { zoom *= frame.virtualZoom || 1; vOffset = frame.virtualOffsetY || 0; }
                
                ctx.save();
                ctx.translate(cx + STATE.camPanX, cy + STATE.charBounceY);
                
                const radX = (rx * Math.PI) / 180;
                const radY = (ry * Math.PI) / 180;
                const scaleX = Math.cos(radY); const scaleY = Math.cos(radX);
                const tiltZ = (rz * 0.8) * (Math.PI/180);
                
                ctx.rotate(tiltZ + (STATE.charTilt * Math.PI/180));
                ctx.scale(Math.abs(scaleX), Math.abs(scaleY));
                ctx.scale(1/STATE.charSquash, STATE.charSquash);
                if(skew) ctx.transform(1,0,skew,1,0,0);
                if(STATE.charSkew !== 0) ctx.transform(1,0,STATE.charSkew * 0.2,1,0,0);
                
                const finalZoom = zoom * (extraScale || 1.0);
                ctx.scale(finalZoom, finalZoom);
                ctx.translate(0, vOffset * dh);
                
                if(blur > 0) ctx.filter = (ctx.filter === 'none' ? '' : ctx.filter) + \` blur(\${blur}px)\`;
                
                ctx.globalAlpha = opacity;
                ctx.drawImage(img, -dw/2, -dh/2, dw, dh);
                ctx.restore();
            };
            
            const prog = STATE.transitionProgress;
            if(prog >= 1.0 || STATE.transitionMode === 'CUT') {
                drawLayer(STATE.targetPose, 1.0, 0, 0, 1.0);
            } else {
                const easeT = prog * prog * (3 - 2 * prog);
                if(STATE.transitionMode === 'ZOOM_IN') {
                    const zf = 1.0 + (easeT * 0.5);
                    drawLayer(STATE.sourcePose, 1.0-easeT, easeT*10, 0, zf);
                    drawLayer(STATE.targetPose, easeT, 0, 0, 1.0);
                } else if(STATE.transitionMode === 'SLIDE') {
                    const dir = STATE.targetPose.includes('right') ? -1 : 1;
                    drawLayer(STATE.sourcePose, 1.0-easeT, 0, w*0.0002*easeT*dir, 1.0);
                    drawLayer(STATE.targetPose, easeT, 0, w*0.0002*(1.0-easeT)*-dir, 1.0);
                } else {
                    drawLayer(STATE.sourcePose, 1.0-easeT, 0, 0, 1.0);
                    drawLayer(STATE.targetPose, easeT, 0, 0, 1.0);
                }
            }
            
            document.getElementById('fps').innerText = Math.round(1/dt) + ' FPS';
            document.getElementById('poseDisplay').innerText = STATE.targetPose.toUpperCase();

            // Update LABAN effort display (if visible)
            if (STATE.physicsStyle === 'LABAN') {
                const e = STATE.labanEffort;
                const weightEl = document.getElementById('effortWeight');
                const spaceEl = document.getElementById('effortSpace');
                const timeEl = document.getElementById('effortTime');
                const flowEl = document.getElementById('effortFlow');
                if (weightEl) weightEl.innerText = e.weight.toFixed(2);
                if (spaceEl) spaceEl.innerText = e.space.toFixed(2);
                if (timeEl) timeEl.innerText = e.time.toFixed(2);
                if (flowEl) flowEl.innerText = e.flow.toFixed(2);
            }
        }

        loadRig();
        loop();

        // --- 8. UI HANDLERS ---
        const btnMic = document.getElementById('btnMic');
        const btnPlay = document.getElementById('btnPlay');
        const btnCam = document.getElementById('btnCam');
        const btnDeck = document.getElementById('btnDeck');
        const fileInput = document.getElementById('fileInput');

        btnMic.onclick = async () => {
            if (STATE.syntheticBeat) {
                STATE.syntheticBeat = false;
                btnMic.classList.remove('active');
                btnMic.style.background = '';
                btnMic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>';
                return;
            }

            if(micStream) {
                micStream.getTracks().forEach(t=>t.stop()); micStream=null;
                btnMic.classList.remove('active');
                btnMic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>';
                if(sourceNode) { sourceNode.disconnect(); sourceNode=null; }
                return;
            }

            const stream = await requestMicrophone();
            if (stream) {
                btnMic.classList.add('active');
                btnMic.style.background = '';
                btnMic.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="color:#ef4444"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="2"/></svg>';
            } else {
                STATE.syntheticBeat = true;
                btnMic.classList.add('active');
                btnMic.style.background = 'linear-gradient(135deg, #00ff88, #00ccff)';
                btnMic.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="color:#000"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
            }
        };
        btnPlay.onclick = () => {
            audioCtx.resume();
            if(audioEl.paused) {
                connectAudioElement();
                audioEl.play();
                btnPlay.classList.add('active');
                btnPlay.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                if(micStream) btnMic.click(); // turn off mic
                resetUITimeout();
            } else {
                audioEl.pause();
                btnPlay.classList.remove('active');
                btnPlay.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
            }
        };
        
        btnCam.onclick = () => { STATE.dynamicCam = !STATE.dynamicCam; btnCam.classList.toggle('active'); };
        
        btnDeck.onclick = () => {
            deck.classList.toggle('visible');
            btnDeck.classList.toggle('active');
        };

        // --- GOLEM MIXER HANDLERS ---
        const btnMixer = document.getElementById('btnMixer');
        const mixerPanel = document.getElementById('mixerPanel');
        const patternGrid = document.getElementById('patternGrid');
        const energySlider = document.getElementById('energySlider');
        const stutterSlider = document.getElementById('stutterSlider');

        btnMixer.onclick = () => {
            mixerPanel.classList.toggle('visible');
            btnMixer.classList.toggle('active');
        };

        // Tab Navigation
        document.querySelectorAll('.mixer-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.mixer-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                tab.classList.add('active');
                const tabId = 'tab' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
                document.getElementById(tabId).style.display = 'block';
            };
        });

        // Deck Mode Selects
        document.querySelectorAll('.deck-mode-select').forEach(select => {
            select.onchange = (e) => {
                const deckId = parseInt(e.target.dataset.deck) - 1;
                STATE.deckModes[deckId] = e.target.value;
                updateDeckIndicators();
            };
        });

        function updateDeckIndicators() {
            document.querySelectorAll('.deck-channel').forEach((ch, i) => {
                const indicator = ch.querySelector('.deck-indicator');
                const isActive = STATE.deckModes[i] !== 'off';
                indicator.classList.toggle('active', isActive);
                ch.classList.toggle('active', i === STATE.activeDeck && isActive);
            });
        }

        // Physics Style Toggle (LEGACY vs LABAN)
        const labanDisplay = document.getElementById('labanDisplay');
        document.querySelectorAll('.physics-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.physics-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                STATE.physicsStyle = btn.dataset.physics;
                // Show/hide LABAN effort display
                if (labanDisplay) {
                    labanDisplay.style.display = btn.dataset.physics === 'LABAN' ? 'block' : 'none';
                }
            };
        });

        // Engine Mode Toggle (PATTERN vs KINETIC)
        document.querySelectorAll('.engine-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.engine-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                STATE.engineMode = btn.dataset.mode;
            };
        });

        // Sequence Mode
        document.querySelectorAll('.seq-mode').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.seq-mode').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                STATE.sequenceMode = btn.dataset.seq;
            };
        });

        // Pattern Grid
        patternGrid.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.onclick = () => {
                patternGrid.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                STATE.pattern = btn.dataset.pattern;
            };
        });

        // Intensity Sliders
        energySlider.oninput = (e) => {
            STATE.energyMultiplier = e.target.value / 50;
        };

        stutterSlider.oninput = (e) => {
            STATE.stutterChance = e.target.value / 100;
        };

        // Trigger Pads (mousedown/mouseup for hold behavior)
        document.querySelectorAll('.trigger-pad').forEach(pad => {
            const trigger = pad.dataset.trigger;
            pad.onmousedown = () => { STATE.triggers[trigger] = true; pad.classList.add('active'); };
            pad.onmouseup = () => { STATE.triggers[trigger] = false; pad.classList.remove('active'); };
            pad.onmouseleave = () => { STATE.triggers[trigger] = false; pad.classList.remove('active'); };
            // Touch support
            pad.ontouchstart = (e) => { e.preventDefault(); STATE.triggers[trigger] = true; pad.classList.add('active'); };
            pad.ontouchend = () => { STATE.triggers[trigger] = false; pad.classList.remove('active'); };
        });

        // FX Sliders
        ['Rgb', 'Flash', 'Glitch', 'Zoom'].forEach(fx => {
            const slider = document.getElementById('fx' + fx);
            if (slider) {
                slider.oninput = (e) => {
                    STATE.fx[fx.toLowerCase()] = e.target.value / 100;
                };
            }
        });

        // FX Toggles
        document.querySelectorAll('.fx-toggle').forEach(toggle => {
            toggle.onclick = () => {
                const fx = toggle.dataset.fx;
                STATE.fx[fx] = !STATE.fx[fx];
                toggle.classList.toggle('active', STATE.fx[fx]);
            };
        });

        // Filter Sliders
        ['Hue', 'Saturation', 'Contrast'].forEach(filter => {
            const slider = document.getElementById('fx' + filter);
            if (slider) {
                slider.oninput = (e) => {
                    STATE.fx[filter.toLowerCase()] = parseFloat(e.target.value);
                };
            }
        });

        // BPM Detection (simple onset detection)
        function updateBPM(bass, now) {
            if (bass > 0.5 && (now - STATE.lastBeatTime) > 200) {
                const interval = now - STATE.lastBeatTime;
                STATE.lastBeatTime = now;

                if (interval < 2000 && interval > 200) {
                    STATE.beatIntervals.push(interval);
                    if (STATE.beatIntervals.length > 8) STATE.beatIntervals.shift();

                    if (STATE.beatIntervals.length >= 4) {
                        const avgInterval = STATE.beatIntervals.reduce((a,b) => a+b, 0) / STATE.beatIntervals.length;
                        STATE.bpm = Math.round(60000 / avgInterval);
                        STATE.bpm = Math.max(60, Math.min(200, STATE.bpm));
                        document.getElementById('bpmValue').innerText = STATE.bpm;
                    }
                }

                // Update bar counter
                STATE.beatInBar = (STATE.beatInBar + 1) % 16;
                if (STATE.beatInBar === 0) STATE.barCount++;

                // Update progression bars
                if (typeof updateProgressionBars === 'function') {
                    updateProgressionBars(STATE.beatInBar);
                }

                const beats = document.querySelectorAll('.bar-beat');
                beats.forEach((b, i) => {
                    b.classList.remove('active', 'downbeat');
                    if (i === STATE.beatInBar) {
                        b.classList.add(i % 4 === 0 ? 'downbeat' : 'active');
                    }
                });

                // Auto-update sequence mode based on energy
                if (STATE.engineMode === 'KINETIC') {
                    const avgEnergy = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;
                    let newSeqMode = STATE.sequenceMode;
                    if (avgEnergy > 0.6) newSeqMode = 'IMPACT';
                    else if (avgEnergy > 0.4) newSeqMode = 'GROOVE';
                    else if (avgEnergy > 0.2) newSeqMode = 'FOOTWORK';
                    else newSeqMode = 'EMOTE';

                    if (newSeqMode !== STATE.sequenceMode) {
                        STATE.sequenceMode = newSeqMode;
                        document.querySelectorAll('.seq-mode').forEach(b => {
                            b.classList.toggle('active', b.dataset.seq === newSeqMode);
                        });
                    }
                }
            }
        }

        // --- 9. FILE HANDLING ---
        const rigInput = document.getElementById('rigInput');
        const audioInput = document.getElementById('audioInput');
        const btnLoadRig = document.getElementById('btnLoadRig');
        const btnLoadAudio = document.getElementById('btnLoadAudio');
        const btnFx = document.getElementById('btnFx');
        const btnPhysics = document.getElementById('btnPhysics');
        const btnEngine = document.getElementById('btnEngine');
        const physicsLabel = document.getElementById('physicsLabel');
        const engineLabel = document.getElementById('engineLabel');
        const tapHint = document.getElementById('tapHint');
        const progressBars = document.querySelectorAll('.prog-bar');

        // Load buttons
        btnLoadRig.onclick = () => rigInput.click();
        btnLoadAudio.onclick = () => audioInput.click();

        rigInput.onchange = (e) => {
            const file = e.target.files[0];
            if(file) handleRigFile(file);
        };

        audioInput.onchange = (e) => {
            const file = e.target.files[0];
            if(file) handleAudioFile(file);
        };

        function handleRigFile(file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const proj = JSON.parse(ev.target.result);
                    if(proj.frames) loadRig(proj.frames, proj.hologramParams, proj.subjectCategory);
                } catch(e) { alert("Invalid Rig File"); }
            };
            reader.readAsText(file);
        }

        function handleAudioFile(file) {
            const url = URL.createObjectURL(file);
            audioEl.src = url;
            audioEl.play();
            connectAudioElement();
            btnPlay.classList.add('active');
            btnPlay.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        }

        // Drag and drop (still works but secondary)
        document.body.addEventListener('dragover', e => { e.preventDefault(); document.body.classList.add('drag-active'); });
        document.body.addEventListener('dragleave', e => { e.preventDefault(); document.body.classList.remove('drag-active'); });
        document.body.addEventListener('drop', e => {
            e.preventDefault(); document.body.classList.remove('drag-active');
            const file = e.dataTransfer.files[0];
            if(!file) return;
            if(file.name.toLowerCase().endsWith('.jusdnce') || file.type.includes('json')) {
                handleRigFile(file);
            } else if(file.type.startsWith('audio/')) {
                handleAudioFile(file);
            }
        });

        // FX button - toggle mixer to FX tab
        btnFx.onclick = () => {
            mixerPanel.classList.add('visible');
            btnMixer.classList.add('active');
            btnFx.classList.toggle('active');
            // Switch to FX tab
            document.querySelectorAll('.mixer-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            document.querySelector('[data-tab="fx"]').classList.add('active');
            document.getElementById('tabFx').style.display = 'block';
        };

        // Physics toggle (LEGACY/LABAN)
        btnPhysics.onclick = () => {
            STATE.physicsStyle = STATE.physicsStyle === 'LEGACY' ? 'LABAN' : 'LEGACY';
            physicsLabel.innerText = STATE.physicsStyle;
            btnPhysics.classList.toggle('active', STATE.physicsStyle === 'LABAN');
            // Update mixer panel buttons
            document.querySelectorAll('.physics-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.physics === STATE.physicsStyle);
            });
            const labanDisplay = document.getElementById('labanDisplay');
            if (labanDisplay) labanDisplay.style.display = STATE.physicsStyle === 'LABAN' ? 'block' : 'none';
        };

        // Engine toggle (PATTERN/KINETIC)
        btnEngine.onclick = () => {
            STATE.engineMode = STATE.engineMode === 'PATTERN' ? 'KINETIC' : 'PATTERN';
            engineLabel.innerText = STATE.engineMode;
            btnEngine.classList.toggle('active', STATE.engineMode === 'KINETIC');
            // Update mixer panel buttons
            document.querySelectorAll('.engine-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.mode === STATE.engineMode);
            });
        };

        // --- AUTO-HIDE UI ---
        let uiTimeout;
        let uiVisible = true;

        function showUI() {
            ui.classList.remove('hidden');
            uiVisible = true;
            tapHint.classList.remove('visible');
            resetUITimeout();
        }

        function hideUI() {
            ui.classList.add('hidden');
            uiVisible = false;
        }

        function resetUITimeout() {
            clearTimeout(uiTimeout);
            uiTimeout = setTimeout(() => {
                // Only auto-hide if playing and not interacting with mixer
                if (!audioEl.paused || micStream) {
                    hideUI();
                    tapHint.classList.add('visible');
                    setTimeout(() => tapHint.classList.remove('visible'), 2000);
                }
            }, 5000);
        }

        // Tap anywhere to show/hide UI
        document.body.addEventListener('click', (e) => {
            // Don't toggle if clicking on UI elements
            if (e.target.closest('#ui') || e.target.closest('#mixerPanel') || e.target.closest('#deck')) {
                resetUITimeout();
                return;
            }
            if (uiVisible) {
                hideUI();
            } else {
                showUI();
            }
        });

        // Keep UI visible when interacting
        ui.addEventListener('click', (e) => {
            e.stopPropagation();
            resetUITimeout();
        });
        mixerPanel.addEventListener('click', (e) => {
            e.stopPropagation();
            resetUITimeout();
        });

        // Update progression bars in animation loop
        function updateProgressionBars(beat) {
            const phase = Math.floor(beat / 4);
            progressBars.forEach((bar, i) => {
                if (i < phase) {
                    bar.style.background = i === 0 ? '#8b5cf6' : i === 1 ? '#8b5cf6' : i === 2 ? '#ec4899' : '#00ffff';
                } else if (i === phase) {
                    const progress = (beat % 4) / 4;
                    const color = i === 0 ? '#8b5cf6' : i === 1 ? '#8b5cf6' : i === 2 ? '#ec4899' : '#00ffff';
                    bar.style.background = \`linear-gradient(to right, \${color} \${progress*100}%, rgba(255,255,255,0.15) \${progress*100}%)\`;
                } else {
                    bar.style.background = 'rgba(255,255,255,0.15)';
                }
            });
        }

        // --- 10. INTERACTIVE FEATURES ---
        const helpOverlay = document.getElementById('helpOverlay');
        const btnHelp = document.getElementById('btnHelp');
        const shuffleBtn = document.getElementById('shuffleBtn');
        const PATTERNS = ['PING_PONG','BUILD_DROP','STUTTER','VOGUE','FLOW','CHAOS','ABAB','AABB','ABAC','SNARE_ROLL','GROOVE','EMOTE','FOOTWORK','IMPACT','MINIMAL'];

        // Help button and overlay
        function toggleHelp() {
            STATE.helpVisible = !STATE.helpVisible;
            helpOverlay.style.display = STATE.helpVisible ? 'block' : 'none';
        }
        btnHelp.onclick = toggleHelp;

        // Shuffle mode
        function toggleShuffle() {
            STATE.shuffleMode = !STATE.shuffleMode;
            shuffleBtn.classList.toggle('active', STATE.shuffleMode);
            if (STATE.shuffleMode) {
                STATE.shuffleInterval = setInterval(() => {
                    const newPattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
                    STATE.pattern = newPattern;
                    patternGrid.querySelectorAll('.pattern-btn').forEach(b => {
                        b.classList.toggle('active', b.dataset.pattern === newPattern);
                    });
                }, 4000);
            } else if (STATE.shuffleInterval) {
                clearInterval(STATE.shuffleInterval);
                STATE.shuffleInterval = null;
            }
        }
        shuffleBtn.onclick = toggleShuffle;

        // Keyboard shortcuts
        const triggerKeyMap = { q: 'stutter', w: 'reverse', e: 'glitch', r: 'burst' };
        const patternKeyMap = { '1': 'PING_PONG', '2': 'BUILD_DROP', '3': 'STUTTER', '4': 'VOGUE', '5': 'FLOW',
                                '6': 'CHAOS', '7': 'ABAB', '8': 'AABB', '9': 'ABAC', '0': 'SNARE_ROLL' };

        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();

            // Don't capture if typing in input
            if (e.target.tagName === 'INPUT') return;

            // Trigger pads (hold)
            if (triggerKeyMap[key] && !e.repeat) {
                const trigger = triggerKeyMap[key];
                STATE.triggers[trigger] = true;
                document.querySelector(\`[data-trigger="\${trigger}"]\`)?.classList.add('active', 'ripple');
            }

            // Pattern selection
            if (patternKeyMap[key]) {
                STATE.pattern = patternKeyMap[key];
                patternGrid.querySelectorAll('.pattern-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.pattern === patternKeyMap[key]);
                });
            }

            // Space = play/pause
            if (key === ' ') {
                e.preventDefault();
                btnPlay.click();
            }

            // M = toggle mixer
            if (key === 'm') {
                btnMixer.click();
            }

            // D = toggle deck
            if (key === 'd') {
                btnDeck.click();
            }

            // C = toggle camera
            if (key === 'c') {
                btnCam.click();
            }

            // L = toggle LEGACY/LABAN
            if (key === 'l') {
                STATE.physicsStyle = STATE.physicsStyle === 'LEGACY' ? 'LABAN' : 'LEGACY';
                document.querySelectorAll('.physics-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.physics === STATE.physicsStyle);
                });
                if (labanDisplay) {
                    labanDisplay.style.display = STATE.physicsStyle === 'LABAN' ? 'block' : 'none';
                }
            }

            // K = toggle PATTERN/KINETIC
            if (key === 'k') {
                STATE.engineMode = STATE.engineMode === 'PATTERN' ? 'KINETIC' : 'PATTERN';
                document.querySelectorAll('.engine-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.mode === STATE.engineMode);
                });
            }

            // S = toggle shuffle
            if (key === 's') {
                toggleShuffle();
            }

            // ? = toggle help
            if (key === '?' || (e.shiftKey && key === '/')) {
                toggleHelp();
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            // Release trigger pads
            if (triggerKeyMap[key]) {
                const trigger = triggerKeyMap[key];
                STATE.triggers[trigger] = false;
                const pad = document.querySelector(\`[data-trigger="\${trigger}"]\`);
                if (pad) {
                    pad.classList.remove('active');
                    setTimeout(() => pad.classList.remove('ripple'), 300);
                }
            }
        });

        // Beat flash on BPM value
        const bpmValueEl = document.getElementById('bpmValue');
        setInterval(() => {
            if (bpmValueEl && STATE.bpm > 0) {
                const beatInterval = 60000 / STATE.bpm;
                const timeSinceBeat = Date.now() - STATE.lastBeatTime;
                if (timeSinceBeat < 100) {
                    bpmValueEl.classList.add('beat');
                    mixerPanel.classList.add('pulse');
                } else {
                    bpmValueEl.classList.remove('beat');
                    mixerPanel.classList.remove('pulse');
                }
            }
        }, 50);

        // ============ NEW UI HANDLERS (StatusBar, FXRail, EngineStrip, MixerDrawer) ============

        // --- STATUS BAR HANDLERS ---
        const btnPlay2 = document.getElementById('btnPlay2');
        const btnMic2 = document.getElementById('btnMic2');
        const btnUpload2 = document.getElementById('btnUpload2');
        const btnCam2 = document.getElementById('btnCam2');
        const btnMore = document.getElementById('btnMore');
        const bpmValue2 = document.getElementById('bpmValue2');
        const beatBars = document.querySelectorAll('.beat-bar');

        // Play button (syncs with btnPlay)
        btnPlay2.onclick = () => {
            audioCtx.resume();
            if(audioEl.paused) {
                connectAudioElement();
                audioEl.play();
                btnPlay2.classList.add('active');
                btnPlay2.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                if(micStream) btnMic2.click();
            } else {
                audioEl.pause();
                btnPlay2.classList.remove('active');
                btnPlay2.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
            }
        };

        // Mic button (syncs with btnMic) - with secure context detection
        btnMic2.onclick = async () => {
            // If already streaming, stop it
            if (micStream) {
                micStream.getTracks().forEach(t => t.stop());
                micStream = null;
                STATE.syntheticBeat = false;
                btnMic2.classList.remove('mic-active', 'synth-active');
                return;
            }

            // If synthetic beat is active, toggle it off
            if (STATE.syntheticBeat) {
                STATE.syntheticBeat = false;
                btnMic2.classList.remove('synth-active');
                return;
            }

            // Check for secure context
            const canUseMic = window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

            if (!canUseMic) {
                // Not secure context - explain and offer synthetic
                const useSynthetic = confirm(
                    "🎤 Microphone requires HTTPS\\n\\n" +
                    "This file is running locally (file:// or content://).\\n" +
                    "Browsers only allow microphone access on HTTPS sites.\\n\\n" +
                    "OPTIONS:\\n" +
                    "• Upload an audio file instead\\n" +
                    "• Use SYNTHETIC BEAT mode (tap OK)\\n" +
                    "• Host this HTML on a web server with HTTPS"
                );
                if (useSynthetic) {
                    STATE.syntheticBeat = true;
                    btnMic2.classList.add('synth-active');
                }
                return;
            }

            // Try to get microphone access
            audioCtx.resume();
            try {
                micStream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
                });
                const src = audioCtx.createMediaStreamSource(micStream);
                src.connect(analyser);
                audioEl.pause();
                btnPlay2.classList.remove('active');
                btnPlay2.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
                btnMic2.classList.add('mic-active');
                STATE.syntheticBeat = false;
            } catch(e) {
                let errorMsg = "Microphone access failed.";
                if (e.name === 'NotAllowedError') errorMsg = "Microphone permission denied.\\n\\nCheck your browser settings.";
                else if (e.name === 'NotFoundError') errorMsg = "No microphone found.";

                const useSynthetic = confirm(errorMsg + "\\n\\nUse SYNTHETIC BEAT mode instead?");
                if (useSynthetic) {
                    STATE.syntheticBeat = true;
                    btnMic2.classList.add('synth-active');
                }
            }
        };

        // Upload audio button
        btnUpload2.onclick = () => audioInput.click();

        // Camera toggle (syncs with btnCam)
        btnCam2.onclick = () => {
            STATE.dynamicCam = !STATE.dynamicCam;
            btnCam2.classList.toggle('active');
        };

        // More options (could show a dropdown menu)
        btnMore.onclick = () => {
            toggleHelp();
        };

        // --- FX RAIL HANDLERS ---
        const fxRail = document.getElementById('fxRail');
        const fxIntensityX = document.getElementById('fxIntensityX');
        const fxIntensityY = document.getElementById('fxIntensityY');

        // FX toggle buttons
        document.querySelectorAll('#fxRail .fx-btn').forEach(btn => {
            btn.onclick = () => {
                const fx = btn.dataset.fx;
                if (fx) {
                    STATE.fx[fx] = !STATE.fx[fx];
                    btn.classList.toggle('active', STATE.fx[fx]);
                }
            };
        });

        // Update FX intensity from mouse position
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            if (fxIntensityX) fxIntensityX.style.width = (x * 100) + '%';
            if (fxIntensityY) fxIntensityY.style.width = (y * 100) + '%';
        });

        // --- ENGINE STRIP HANDLERS ---
        const patternRow = document.getElementById('patternRow');
        const intensitySlider = document.getElementById('intensitySlider');
        const btnMixer2 = document.getElementById('btnMixer2');
        const mixerDrawer = document.getElementById('mixerDrawer');

        // Populate pattern buttons
        const STRIP_PATTERNS = ['PING_PONG','BUILD_DROP','STUTTER','VOGUE','FLOW','CHAOS','ABAB','AABB','ABAC','SNARE_ROLL','GROOVE','EMOTE','FOOTWORK','IMPACT','MINIMAL'];
        STRIP_PATTERNS.forEach((pat, i) => {
            const btn = document.createElement('button');
            btn.className = 'pattern-btn' + (i === 0 ? ' active' : '');
            btn.dataset.pattern = pat;
            btn.textContent = pat.replace('_', ' ').substring(0, 6);
            btn.onclick = () => {
                STATE.pattern = pat;
                patternRow.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Sync with mixer panel pattern grid
                patternGrid.querySelectorAll('.pattern-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.pattern === pat);
                });
            };
            patternRow.appendChild(btn);
        });

        // Physics toggle (LEGACY/LABAN)
        document.querySelectorAll('#physicsToggle2 .mode-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('#physicsToggle2 .mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                STATE.physicsStyle = btn.dataset.physics;
                // Sync with mixer panel physics toggle
                document.querySelectorAll('.physics-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.physics === STATE.physicsStyle);
                });
                const labanDisplay = document.getElementById('labanDisplay');
                if (labanDisplay) labanDisplay.style.display = STATE.physicsStyle === 'LABAN' ? 'block' : 'none';
            };
        });

        // Engine toggle (PATTERN/KINETIC)
        document.querySelectorAll('#engineToggle2 .mode-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('#engineToggle2 .mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                STATE.engineMode = btn.dataset.mode;
                // Sync with mixer panel engine toggle
                document.querySelectorAll('.engine-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.mode === STATE.engineMode);
                });
            };
        });

        // Intensity slider
        intensitySlider.oninput = (e) => {
            STATE.energyMultiplier = e.target.value / 50;
            energySlider.value = e.target.value;
        };

        // --- MIXER DRAWER HANDLERS ---
        btnMixer2.onclick = () => {
            mixerDrawer.classList.toggle('open');
            btnMixer2.classList.toggle('active');
        };

        // Drawer tab navigation
        document.querySelectorAll('.drawer-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.drawer-tab-content').forEach(c => c.style.display = 'none');
                tab.classList.add('active');
                const contentId = 'drawer' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
                const content = document.getElementById(contentId);
                if (content) content.style.display = 'block';
            };
        });

        // Swipe to close drawer
        let drawerTouchStartY = 0;
        mixerDrawer.addEventListener('touchstart', (e) => {
            drawerTouchStartY = e.touches[0].clientY;
        });
        mixerDrawer.addEventListener('touchmove', (e) => {
            const deltaY = e.touches[0].clientY - drawerTouchStartY;
            if (deltaY > 50) {
                mixerDrawer.classList.remove('open');
                btnMixer2.classList.remove('active');
            }
        });

        // Update beat bars on beat
        function updateBeatBars(beatIndex) {
            beatBars.forEach((bar, i) => {
                bar.classList.remove('active', 'downbeat');
                if (i === beatIndex % 4) {
                    bar.classList.add(i === 0 ? 'downbeat' : 'active');
                }
            });
            // Also update BPM value
            if (bpmValue2) bpmValue2.textContent = STATE.bpm;
        }

        // Override updateBPM to also update new UI
        const originalUpdateBPM = updateBPM;
        updateBPM = function(bass, now) {
            originalUpdateBPM(bass, now);
            updateBeatBars(STATE.beatInBar);
        };

        // Prevent clicks on new UI from toggling visibility
        [document.getElementById('statusBar'), document.getElementById('fxRail'),
         document.getElementById('engineStrip'), document.getElementById('mixerDrawer')].forEach(el => {
            if (el) {
                el.addEventListener('click', (e) => e.stopPropagation());
                el.addEventListener('touchstart', (e) => e.stopPropagation());
            }
        });

        // ============ BEZEL DRAWER HANDLERS ============
        const bezelLeft = document.getElementById('bezelLeft');
        const bezelRight = document.getElementById('bezelRight');
        const bezelBarX = document.getElementById('bezelBarX');
        const bezelBarY = document.getElementById('bezelBarY');
        const bezelPhysicsLabel = document.getElementById('bezelPhysicsLabel');
        const bezelEngineLabel = document.getElementById('bezelEngineLabel');
        const bezelIntLabel = document.getElementById('bezelIntLabel');
        const bezelIntSlider = document.getElementById('bezelIntSlider');

        // Toggle bezel expansion on tap
        function toggleBezel(bezel, otherBezel) {
            if (bezel.classList.contains('expanded')) {
                bezel.classList.remove('expanded');
            } else {
                bezel.classList.add('expanded');
                if (otherBezel) otherBezel.classList.remove('expanded');
            }
        }

        // Left bezel (FX) - tap to expand
        bezelLeft.addEventListener('click', (e) => {
            if (!e.target.classList.contains('bezel-btn') && !e.target.classList.contains('bezel-slider')) {
                toggleBezel(bezelLeft, bezelRight);
            }
            e.stopPropagation();
        });

        // Right bezel (Mode) - tap to expand
        bezelRight.addEventListener('click', (e) => {
            if (!e.target.classList.contains('bezel-btn') && !e.target.classList.contains('bezel-slider')) {
                toggleBezel(bezelRight, bezelLeft);
            }
            e.stopPropagation();
        });

        // Click outside bezels to collapse
        document.body.addEventListener('click', () => {
            bezelLeft.classList.remove('expanded');
            bezelRight.classList.remove('expanded');
        });

        // FX status dots - direct toggle
        bezelLeft.querySelectorAll('.status-dot[data-fx]').forEach(dot => {
            dot.onclick = (e) => {
                e.stopPropagation();
                const fx = dot.dataset.fx;
                STATE.fx[fx] = !STATE.fx[fx];
                dot.classList.toggle('active-fx', STATE.fx[fx]);
                // Sync with bezel buttons
                bezelLeft.querySelector(\`.bezel-btn[data-fx="\${fx}"]\`)?.classList.toggle('active', STATE.fx[fx]);
            };
        });

        // FX bezel buttons
        bezelLeft.querySelectorAll('.bezel-btn[data-fx]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const fx = btn.dataset.fx;
                STATE.fx[fx] = !STATE.fx[fx];
                btn.classList.toggle('active', STATE.fx[fx]);
                // Sync with status dots
                bezelLeft.querySelector(\`.status-dot[data-fx="\${fx}"]\`)?.classList.toggle('active-fx', STATE.fx[fx]);
            };
        });

        // Right bezel - Physics buttons
        document.getElementById('bezelLegacy').onclick = (e) => {
            e.stopPropagation();
            STATE.physicsStyle = 'LEGACY';
            document.getElementById('bezelLegacy').classList.add('active');
            document.getElementById('bezelLaban').classList.remove('active');
            bezelPhysicsLabel.textContent = 'L';
            // Sync with other toggles
            document.querySelectorAll('.physics-btn, #physicsToggle2 .mode-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.physics === 'LEGACY');
            });
        };
        document.getElementById('bezelLaban').onclick = (e) => {
            e.stopPropagation();
            STATE.physicsStyle = 'LABAN';
            document.getElementById('bezelLaban').classList.add('active');
            document.getElementById('bezelLegacy').classList.remove('active');
            bezelPhysicsLabel.textContent = 'B';
            document.querySelectorAll('.physics-btn, #physicsToggle2 .mode-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.physics === 'LABAN');
            });
        };

        // Right bezel - Engine buttons
        document.getElementById('bezelPattern').onclick = (e) => {
            e.stopPropagation();
            STATE.engineMode = 'PATTERN';
            document.getElementById('bezelPattern').classList.add('active');
            document.getElementById('bezelKinetic').classList.remove('active');
            bezelEngineLabel.textContent = 'P';
            document.querySelectorAll('.engine-btn, #engineToggle2 .mode-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.mode === 'PATTERN');
            });
        };
        document.getElementById('bezelKinetic').onclick = (e) => {
            e.stopPropagation();
            STATE.engineMode = 'KINETIC';
            document.getElementById('bezelKinetic').classList.add('active');
            document.getElementById('bezelPattern').classList.remove('active');
            bezelEngineLabel.textContent = 'K';
            document.querySelectorAll('.engine-btn, #engineToggle2 .mode-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.mode === 'KINETIC');
            });
        };

        // Bezel intensity slider
        bezelIntSlider.oninput = (e) => {
            const val = e.target.value;
            STATE.energyMultiplier = val / 50;
            bezelIntLabel.textContent = val;
            intensitySlider.value = val;
            energySlider.value = val;
        };

        // Bezel mix button - open mixer drawer
        document.getElementById('bezelMixBtn').onclick = (e) => {
            e.stopPropagation();
            mixerDrawer.classList.toggle('open');
            btnMixer2.classList.toggle('active');
            bezelRight.classList.remove('expanded');
        };

        // Mix dot also opens mixer
        document.getElementById('bezelMixDot').onclick = (e) => {
            e.stopPropagation();
            mixerDrawer.classList.toggle('open');
            btnMixer2.classList.toggle('active');
        };

        // Update bezel mini-bars from mouse
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            if (bezelBarX) bezelBarX.style.width = (x * 100) + '%';
            if (bezelBarY) bezelBarY.style.width = (y * 100) + '%';
        });

        // Prevent bezels from toggling body click
        bezelLeft.addEventListener('touchstart', (e) => e.stopPropagation());
        bezelRight.addEventListener('touchstart', (e) => e.stopPropagation());

        // Add bezels to visibility prevention list
        [bezelLeft, bezelRight].forEach(el => {
            if (el) {
                el.addEventListener('click', (e) => e.stopPropagation());
            }
        });
    </script>
</body>
</html>`;
};
