/**
 * Player Template Builder
 * Combines templates into a single HTML string for export
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get template directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read template files
function getTemplate(name: string): string {
    return readFileSync(join(__dirname, name), 'utf-8');
}

// Cache templates
let cachedStyles: string | null = null;
let cachedHtml: string | null = null;
let cachedRuntime: string | null = null;

function getStyles(): string {
    if (!cachedStyles) {
        cachedStyles = getTemplate('styles.css');
    }
    return cachedStyles;
}

function getHtml(): string {
    if (!cachedHtml) {
        cachedHtml = getTemplate('index.html');
    }
    return cachedHtml;
}

function getRuntime(): string {
    if (!cachedRuntime) {
        cachedRuntime = getTemplate('runtime.js');
    }
    return cachedRuntime;
}

export interface BuildOptions {
    frames: Array<{
        url: string;
        pose: string;
        energy?: string;
        type?: string;
        direction?: string;
        role?: string;
        isVirtual?: boolean;
        virtualZoom?: number;
        virtualOffsetY?: number;
    }>;
    hologramParams: {
        baseHue: number;
        noiseDensity?: number;
        animSpeed?: number;
        [key: string]: unknown;
    };
    subjectCategory: 'CHARACTER' | 'TEXT' | 'SYMBOL';
}

/**
 * Build the player HTML from templates
 */
export function buildPlayerHTML(options: BuildOptions): string {
    const { frames, hologramParams, subjectCategory } = options;

    let html = getHtml();

    // Replace placeholders
    html = html.replace('{{STYLES}}', getStyles());
    html = html.replace('{{RUNTIME}}', getRuntime());
    html = html.replace('{{FRAME_DATA}}', JSON.stringify(frames));
    html = html.replace('{{HOLOGRAM_PARAMS}}', JSON.stringify(hologramParams));
    html = html.replace("'{{SUBJECT_CATEGORY}}'", `'${subjectCategory}'`);

    return html;
}

/**
 * Build with inline styles and runtime (for browser use)
 */
export function buildPlayerHTMLInline(
    frames: BuildOptions['frames'],
    hologramParams: BuildOptions['hologramParams'],
    subjectCategory: BuildOptions['subjectCategory'],
    styles: string,
    runtime: string
): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>jusDNCE // Standalone Player</title>
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700;900&display=swap" rel="stylesheet">
    <style>${styles}</style>
</head>
<body>
    <canvas id="bgCanvas"></canvas>
    <canvas id="charCanvas"></canvas>

    <!-- TOUCH ZONE CONTROLLER -->
    <div id="touchZone">
        <div class="zone-half left"></div>
        <div class="zone-divider"></div>
        <div class="zone-half right"></div>
        <div class="zone-label left">PATTERN</div>
        <div class="zone-label right">KINETIC</div>
    </div>
    <div id="patternJoystick">
        <div class="joystick-ring" style="width:140px;height:140px;">
            <div class="joystick-knob"></div>
        </div>
    </div>
    <div class="pattern-indicator"></div>

    <!-- GESTURE GATE -->
    <div id="gestureGate">
        <div class="inner">
            <div style="font-size:24px;font-weight:900;">🎵 jusDNCE</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.7);">Tap to arm audio + mic permissions</div>
            <button id="gestureStart">START</button>
            <div class="muted">Audio will react to your music or microphone</div>
        </div>
    </div>

    <!-- ADAPTER TRAY -->
    <div id="adapterTray">
        <div class="adapter-pill active" data-adapter="file"><span class="dot"></span>File / MP4</div>
        <div class="adapter-pill" data-adapter="mic"><span class="dot"></span>Microphone</div>
        <div class="adapter-pill" data-adapter="system"><span class="dot"></span>System Audio</div>
    </div>
    <input type="file" id="fileAdapter" accept="audio/*,video/*" style="display:none">

    <!-- LEFT BEZEL - FX Controls -->
    <div class="bezel bezel-left" id="bezelLeft">
        <div class="status-dot" id="fxDotX"></div>
        <div class="status-dot" id="fxDotY"></div>
        <div class="status-label">FX</div>
        <div class="bezel-divider"></div>
        <div class="mini-bars">
            <div class="mini-bar"><div class="mini-bar-fill x" id="fxBarX" style="width:0%"></div></div>
            <div class="mini-bar"><div class="mini-bar-fill y" id="fxBarY" style="width:0%"></div></div>
        </div>
        <div class="drawer-content">
            <button class="bezel-btn cyan" data-fx="flash">FLASH</button>
            <button class="bezel-btn" data-fx="glitch">GLITCH</button>
            <button class="bezel-btn" data-fx="invert">INVERT</button>
            <button class="bezel-btn" data-fx="bw">B&W</button>
            <input type="range" class="bezel-slider" id="fxIntensityX" min="0" max="100" value="50">
            <input type="range" class="bezel-slider" id="fxIntensityY" min="0" max="100" value="50">
        </div>
    </div>

    <!-- RIGHT BEZEL - Engine Mode -->
    <div class="bezel bezel-right" id="bezelRight">
        <div class="status-dot active-fx" id="modeDot"></div>
        <div class="status-label">MODE</div>
        <div class="bezel-divider"></div>
        <div class="drawer-content">
            <button class="bezel-btn active" id="bezelPattern" data-mode="PATTERN">PATTERN</button>
            <button class="bezel-btn" id="bezelKinetic" data-mode="KINETIC">KINETIC</button>
            <div class="bezel-divider"></div>
            <button class="bezel-btn" data-trigger="burst">BURST</button>
            <button class="bezel-btn" data-trigger="freeze">FREEZE</button>
        </div>
    </div>

    <!-- STREAMING ROW -->
    <div id="streamRow">
        <input id="streamInput" class="stream-input" placeholder="Paste streaming link...">
        <button id="btnPasteStream" class="stream-btn">PASTE</button>
        <button id="btnLinkStream" class="stream-btn">LINK</button>
    </div>

    <!-- STATUS BAR -->
    <div id="statusBar">
        <div class="bar-inner">
            <div class="left">
                <button class="status-btn" id="btnMic" title="Microphone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                </button>
                <button class="status-btn" id="btnPlay" title="Play/Pause">
                    <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                </button>
            </div>
            <div class="center">
                <div class="bpm-display">
                    <span class="bpm-value" id="bpmValue">---</span>
                    <span class="bpm-label">BPM</span>
                </div>
                <div class="beat-bars">
                    <div class="beat-bar" id="beat0"></div>
                    <div class="beat-bar" id="beat1"></div>
                    <div class="beat-bar" id="beat2"></div>
                    <div class="beat-bar" id="beat3"></div>
                </div>
            </div>
            <div class="right">
                <button class="status-btn" id="btnCam" title="Camera Mode">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </button>
                <button class="status-btn" id="btnHelp" title="Help">?</button>
            </div>
        </div>
    </div>

    <!-- ENGINE STRIP -->
    <div id="engineStrip">
        <div class="strip-inner">
            <div class="engine-row">
                <button class="engine-btn active" data-mode="PATTERN">PATTERN</button>
                <button class="engine-btn" data-mode="KINETIC">KINETIC</button>
                <span style="font-size:10px;color:rgba(255,255,255,0.4);margin-left:8px;">
                    <span id="poseDisplay">IDLE</span> | <span id="fps">-- FPS</span>
                </span>
            </div>
            <div class="pattern-row" id="patternGrid"></div>
        </div>
    </div>

    <!-- HELP OVERLAY -->
    <div id="helpOverlay">
        <div class="help-content">
            <h3>Touch Controls</h3>
            <div class="hotkey-row"><span class="key">Left Half</span><span class="desc">PATTERN mode + joystick</span></div>
            <div class="hotkey-row"><span class="key">Right Half</span><span class="desc">KINETIC mode + joystick</span></div>
            <div class="hotkey-row"><span class="key">Drag</span><span class="desc">Select pattern from dial</span></div>
            <h3>Keyboard</h3>
            <div class="hotkey-row"><span class="key">Space</span><span class="desc">Play/Pause</span></div>
            <div class="hotkey-row"><span class="key">M</span><span class="desc">Toggle mic</span></div>
            <div class="hotkey-row"><span class="key">1-9</span><span class="desc">Select pattern</span></div>
            <div class="hotkey-row"><span class="key">P/K</span><span class="desc">Pattern/Kinetic mode</span></div>
            <div class="hotkey-row"><span class="key">F</span><span class="desc">Flash trigger</span></div>
            <div class="hotkey-row"><span class="key">G</span><span class="desc">Glitch trigger</span></div>
            <div class="hotkey-row"><span class="key">?</span><span class="desc">Toggle help</span></div>
            <button style="width:100%;margin-top:12px;padding:10px;border-radius:8px;border:none;background:#8b5cf6;color:white;font-weight:700;cursor:pointer;" onclick="document.getElementById('helpOverlay').style.display='none'">CLOSE</button>
        </div>
    </div>

    <script>
        const FRAME_DATA = ${JSON.stringify(frames)};
        const HOLOGRAM_PARAMS = ${JSON.stringify(hologramParams)};
        const SUBJECT_CATEGORY = '${subjectCategory}';
    </script>
    <script>${runtime}</script>
</body>
</html>`;

    return html;
}

export default { buildPlayerHTML, buildPlayerHTMLInline };
