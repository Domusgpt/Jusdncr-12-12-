
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
        body { margin: 0; background: #050505; overflow: hidden; font-family: 'Rajdhani', sans-serif; user-select: none; color: #fff; }
        canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        #bgCanvas { z-index: 1; }
        #charCanvas { z-index: 2; pointer-events: none; }
        
        /* UI OVERLAY */
        #ui {
            position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 100;
            display: flex; gap: 12px; align-items: center;
            background: rgba(10,10,12,0.8); backdrop-filter: blur(16px);
            padding: 12px 24px; border-radius: 24px; 
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            transition: opacity 0.3s, transform 0.3s;
        }
        
        button {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: #ccc; padding: 10px 20px; border-radius: 14px;
            cursor: pointer; font-weight: 700; font-size: 13px; font-family: 'Rajdhani', sans-serif;
            letter-spacing: 1px; text-transform: uppercase;
            transition: all 0.2s; display: flex; align-items: center; gap: 8px;
        }
        button:hover { background: rgba(255,255,255,0.15); color: white; transform: translateY(-2px); border-color: rgba(255,255,255,0.3); }
        button.active { background: #8b5cf6; border-color: #a78bfa; color: white; box-shadow: 0 0 20px rgba(139,92,246,0.4); }
        button.red { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #fca5a5; }
        button.red.active { background: #ef4444; color: white; border-color: #ef4444; box-shadow: 0 0 20px rgba(239,68,68,0.4); }
        
        .separator { width: 1px; height: 24px; background: rgba(255,255,255,0.1); margin: 0 4px; }

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
        
        /* Info Corner */
        #info {
            position: absolute; top: 30px; left: 30px; z-index: 50;
            color: rgba(255,255,255,0.4); font-size: 12px; pointer-events: none;
            line-height: 1.5; font-weight: 600;
        }
        .brand {
            font-size: 24px; color: white; font-weight: 900; letter-spacing: -1px; margin-bottom: 4px; display: block;
            text-shadow: 0 0 20px rgba(139,92,246,0.5);
        }

        /* NEURAL DECK (Frame Swapping) */
        #deck {
            position: absolute; bottom: 100px; left: 0; right: 0;
            height: 100px; padding: 0 20px;
            display: flex; gap: 10px; overflow-x: auto;
            align-items: center; justify-content: center;
            z-index: 90; opacity: 0; pointer-events: none; transition: opacity 0.3s;
            mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        #deck.visible { opacity: 1; pointer-events: auto; }
        .frame-thumb {
            width: 60px; height: 60px; border-radius: 8px;
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1);
            cursor: pointer; flex-shrink: 0; transition: all 0.2s;
            overflow: hidden; position: relative;
        }
        .frame-thumb img { width: 100%; height: 100%; object-fit: contain; }
        .frame-thumb:hover { transform: scale(1.1); border-color: #a78bfa; background: rgba(139,92,246,0.2); }
        .frame-thumb .badge {
            position: absolute; bottom: 0; right: 0; background: rgba(0,0,0,0.7);
            color: white; font-size: 8px; padding: 2px 4px; border-top-left-radius: 4px;
        }

        /* GOLEM MIXER PANEL */
        #mixerPanel {
            position: absolute; bottom: 100px; right: 20px; z-index: 100;
            width: 380px; background: rgba(10,10,15,0.95); backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;
            padding: 16px; font-family: 'Rajdhani', sans-serif;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.1);
            display: none; max-height: 80vh; overflow-y: auto;
        }
        #mixerPanel.visible { display: block; }
        #mixerPanel h3 {
            margin: 0 0 12px 0; font-size: 14px; font-weight: 700;
            background: linear-gradient(90deg, #00ffff, #a78bfa);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            letter-spacing: 2px;
        }
        .mixer-tabs { display: flex; gap: 4px; margin-bottom: 12px; }
        .mixer-tab {
            flex: 1; padding: 8px 4px; font-size: 11px; font-weight: 700;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.6); cursor: pointer; border-radius: 8px;
            transition: all 0.15s; text-align: center;
        }
        .mixer-tab:hover { background: rgba(139,92,246,0.2); }
        .mixer-tab.active { background: #8b5cf6; border-color: #a78bfa; color: white; }
        .mixer-section { background: rgba(255,255,255,0.03); border-radius: 10px; padding: 10px; margin-bottom: 10px; }
        .mixer-section-title { font-size: 10px; color: rgba(255,255,255,0.5); margin-bottom: 8px; letter-spacing: 1px; }
        .mixer-row { display: flex; gap: 8px; margin-bottom: 8px; }
        .mixer-select {
            flex: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
            color: white; padding: 8px; border-radius: 8px; font-size: 11px;
            font-family: 'Rajdhani', sans-serif; cursor: pointer;
        }
        .mixer-select:focus { border-color: #a78bfa; outline: none; }
        .mixer-slider-row { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
        .mixer-slider-label { font-size: 10px; color: rgba(255,255,255,0.6); width: 60px; }
        .mixer-slider {
            flex: 1; -webkit-appearance: none; height: 6px; border-radius: 3px;
            background: linear-gradient(90deg, rgba(0,255,255,0.3), rgba(168,85,247,0.3));
        }
        .mixer-slider::-webkit-slider-thumb {
            -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
            background: #a78bfa; cursor: pointer; border: 2px solid white;
        }
        /* 4-Channel Deck Grid */
        .deck-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px; }
        .deck-channel {
            background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px; padding: 8px; text-align: center;
        }
        .deck-channel.active { border-color: #a78bfa; background: rgba(139,92,246,0.1); }
        .deck-label { font-size: 10px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
        .deck-mode-select {
            width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
            color: white; padding: 4px; border-radius: 4px; font-size: 9px;
            font-family: 'Rajdhani', sans-serif; cursor: pointer;
        }
        .deck-indicator {
            width: 8px; height: 8px; border-radius: 50%; margin: 4px auto 0;
            background: rgba(255,255,255,0.2); transition: all 0.2s;
        }
        .deck-indicator.active { background: #00ff88; box-shadow: 0 0 8px #00ff88; }
        /* Engine Mode Toggle */
        .engine-toggle { display: flex; gap: 4px; margin-bottom: 8px; }
        .engine-btn, .physics-btn {
            flex: 1; padding: 8px 4px; font-size: 10px; font-weight: 700;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.6); cursor: pointer; border-radius: 6px;
            transition: all 0.15s; text-align: center;
        }
        .engine-btn:hover, .physics-btn:hover { background: rgba(139,92,246,0.2); }
        .engine-btn.active { background: #8b5cf6; border-color: #a78bfa; color: white; }
        .physics-btn.active { background: #00ffff; border-color: #00ffff; color: black; }
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
        /* Help overlay */
        #helpOverlay {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 500; background: rgba(10,10,15,0.98); backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.2); border-radius: 16px;
            padding: 24px 32px; min-width: 360px; display: none;
        }
        #helpOverlay h3 { color: #00ffff; margin: 0 0 16px 0; font-size: 16px; }
        #helpOverlay .hotkey-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        #helpOverlay .key { background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-family: monospace; }
        #helpOverlay .desc { color: rgba(255,255,255,0.6); }
    </style>
</head>
<body>

    <canvas id="bgCanvas"></canvas>
    <canvas id="charCanvas"></canvas>
    
    <div id="loader">
        <div class="spinner"></div>
        <div style="color: #888; font-size: 14px; letter-spacing: 4px; font-weight: 700;">INITIALIZING NEURAL RIG...</div>
    </div>
    
    <div id="dropOverlay">
        <div class="drop-title">DROP FILE</div>
        <div style="font-size: 1.2em; color: rgba(255,255,255,0.8); letter-spacing: 2px;">IMPORT .JUSDNCE RIG OR AUDIO FILE</div>
    </div>
    
    <div id="info">
        <span class="brand">jusDNCE</span>
        MODE: <span id="subjectDisplay">${subjectCategory}</span><br>
        <span id="fps">0 FPS</span> // <span id="poseDisplay">INIT</span>
    </div>

    <div id="deck"></div>

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

    <div id="ui">
        <button id="btnPlay">PLAY</button>
        <button id="btnMic">MIC</button>
        <div class="separator"></div>
        <button id="btnCam" class="active">CAM</button>
        <button id="btnMixer">MIXER</button>
        <button id="btnDeck">DECK</button>
        <div class="separator"></div>
        <button id="btnLoad" onclick="document.getElementById('fileInput').click()">LOAD</button>
        <button id="btnHelp">?</button>
        <input type="file" id="fileInput" style="display:none" accept=".jusdnce,audio/*">
    </div>

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
            }
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
            
            // Audio Data
            const freq = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(freq);
            
            const bass = freq.slice(0,5).reduce((a,b)=>a+b,0)/(5*255);
            const mid = freq.slice(5,30).reduce((a,b)=>a+b,0)/(25*255);
            const high = freq.slice(30,100).reduce((a,b)=>a+b,0)/(70*255);
            const energy = (bass * 0.5 + mid * 0.3 + high * 0.2);

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
            // Check for secure context (HTTPS required for mic)
            if (!window.isSecureContext) {
                alert("Mic input requires HTTPS!\\n\\nTo use microphone input:\\n1. Host this file on a web server with HTTPS\\n2. Or open via localhost\\n3. Or use file:// with browser flags (not recommended)");
                return;
            }

            // Check for getUserMedia support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Your browser doesn't support microphone input.\\n\\nTry using Chrome, Firefox, or Edge.");
                return;
            }

            audioCtx.resume();
            if(micStream) {
                micStream.getTracks().forEach(t=>t.stop()); micStream=null;
                btnMic.classList.remove('red', 'active');
                btnMic.innerHTML = '🎙️ MIC INPUT';
                if(sourceNode) { sourceNode.disconnect(); sourceNode=null; }
            } else {
                try {
                    micStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: false,
                            noiseSuppression: false,
                            autoGainControl: false
                        }
                    });
                    const micNode = audioCtx.createMediaStreamSource(micStream);
                    if(sourceNode) sourceNode.disconnect();
                    sourceNode = micNode;
                    sourceNode.connect(analyser);
                    if(audioEl) audioEl.pause();
                    btnMic.classList.add('red', 'active');
                    btnMic.innerHTML = 'LIVE';
                } catch(e) {
                    console.error("Mic error:", e);
                    if (e.name === 'NotAllowedError') {
                        alert("Microphone access denied.\\n\\nPlease allow microphone access in your browser settings.");
                    } else if (e.name === 'NotFoundError') {
                        alert("No microphone found.\\n\\nPlease connect a microphone and try again.");
                    } else {
                        alert("Could not access microphone: " + e.message);
                    }
                }
            }
        };
        
        btnPlay.onclick = () => {
            audioCtx.resume();
            if(audioEl.paused) { 
                connectAudioElement(); 
                audioEl.play(); 
                btnPlay.classList.add('active'); 
                if(micStream) btnMic.click(); // turn off mic
            } else { 
                audioEl.pause(); 
                btnPlay.classList.remove('active'); 
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

        // --- 9. DRAG AND DROP ---
        document.body.addEventListener('dragover', e => { e.preventDefault(); document.body.classList.add('drag-active'); });
        document.body.addEventListener('dragleave', e => { e.preventDefault(); document.body.classList.remove('drag-active'); });
        document.body.addEventListener('drop', e => {
            e.preventDefault(); document.body.classList.remove('drag-active');
            const file = e.dataTransfer.files[0];
            handleFile(file);
        });
        
        fileInput.onchange = (e) => handleFile(e.target.files[0]);
        
        function handleFile(file) {
            if(!file) return;
            if(file.name.toLowerCase().endsWith('.jusdnce') || file.type.includes('json')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const proj = JSON.parse(ev.target.result);
                        if(proj.frames) loadRig(proj.frames, proj.hologramParams, proj.subjectCategory);
                    } catch(e) { alert("Invalid Rig File"); }
                };
                reader.readAsText(file);
            } else if(file.type.startsWith('audio/')) {
                const url = URL.createObjectURL(file);
                audioEl.src = url;
                audioEl.play();
                connectAudioElement();
                btnPlay.classList.add('active');
            }
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
    </script>
</body>
</html>`;
};
