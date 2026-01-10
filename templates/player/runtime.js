/**
 * jusDNCE Player Runtime
 * Combined from Firebase (touch zones, joystick) and Paywall (streaming, bezels)
 */

// === PATTERNS & CONSTANTS ===
const PATTERNS = ['PING_PONG','BUILD_DROP','STUTTER','VOGUE','FLOW','CHAOS','ABAB','AABB','ABAC','SNARE_ROLL','GROOVE','EMOTE','FOOTWORK','IMPACT','MINIMAL'];
const KINETIC_PATTERNS = ['PING_PONG', 'FLOW', 'STUTTER', 'CHAOS', 'VOGUE', 'BUILD_DROP'];

// === STATE ===
const STATE = {
    // Engine
    engineMode: 'PATTERN',
    pattern: 'PING_PONG',
    physicsStyle: 'LEGACY',

    // Audio
    syntheticBeat: true,
    lastBeat: 0,
    bpm: 120,
    beatCounter: 0,

    // Animation
    targetPose: 'idle',
    sourcePose: 'idle',
    transitionProgress: 1.0,
    transitionMode: 'CUT',
    transitionSpeed: 8,

    // Physics
    masterRot: { x: 0, y: 0, z: 0 },
    charSquash: 1.0,
    charSkew: 0,
    charTilt: 0,
    targetTilt: 0,
    charBounceY: 0,
    camZoom: 1.15,
    camPanX: 0,
    direction: 'center',

    // Effects
    flashIntensity: 0,
    filterMode: 'NORMAL',
    dynamicCam: true,
    closeupLockTime: 0,
    helpVisible: false,

    // FX axis values
    fx: {
        x: 0.5,
        y: 0.5,
        flash: 0,
        glitch: 0,
        invert: false,
        grayscale: false,
        hue: 0,
        saturation: 100,
        contrast: 100
    },

    // Triggers
    triggers: {
        burst: false,
        freeze: false,
        glitch: false
    },

    // Laban effort (for LABAN physics mode)
    labanEffort: { weight: 0.5, space: 0.5, time: 0.5, flow: 0.5 },

    // Energy multiplier
    energyMultiplier: 1.0
};

// === AUDIO SETUP ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0.75;
const freqData = new Uint8Array(analyser.frequencyBinCount);
const audioEl = document.createElement('audio');
audioEl.crossOrigin = 'anonymous';
let sourceNode = null;
let micStream = null;

function connectAudioElement() {
    if (sourceNode) return;
    sourceNode = audioCtx.createMediaElementSource(audioEl);
    sourceNode.connect(analyser);
    sourceNode.connect(audioCtx.destination);
}

// === FRAME MANAGEMENT ===
const IMAGES = {};
const FRAMES_BY_ENERGY = { low: [], mid: [], high: [] };
let CLOSEUPS = [];
let ALL_FRAMES = [];

function loadRig() {
    const frames = FRAME_DATA;
    ALL_FRAMES = frames;
    frames.forEach(f => {
        const img = new Image();
        img.src = f.url;
        IMAGES[f.pose] = img;

        const energy = f.energy || 'mid';
        FRAMES_BY_ENERGY[energy] = FRAMES_BY_ENERGY[energy] || [];
        FRAMES_BY_ENERGY[energy].push(f);

        if (f.type === 'closeup') CLOSEUPS.push(f);
    });

    // Set initial pose
    if (frames.length > 0) {
        STATE.targetPose = frames[0].pose;
        STATE.sourcePose = frames[0].pose;
    }
}

// === BPM DETECTION ===
const bpmHistory = [];
const beatTimes = [];
const BEAT_THRESHOLD = 0.35;

function detectBeat(bass, now) {
    const avg = bpmHistory.length > 0 ? bpmHistory.reduce((a, b) => a + b, 0) / bpmHistory.length : 0;
    const threshold = Math.max(BEAT_THRESHOLD, avg * 1.3);

    bpmHistory.push(bass);
    if (bpmHistory.length > 30) bpmHistory.shift();

    if (bass > threshold && now - STATE.lastBeat > 250) {
        STATE.lastBeat = now;
        beatTimes.push(now);
        if (beatTimes.length > 16) beatTimes.shift();

        // Calculate BPM
        if (beatTimes.length >= 4) {
            const intervals = [];
            for (let i = 1; i < beatTimes.length; i++) {
                intervals.push(beatTimes[i] - beatTimes[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            if (avgInterval > 250 && avgInterval < 1500) {
                STATE.bpm = Math.round(60000 / avgInterval);
            }
        }

        STATE.beatCounter = (STATE.beatCounter + 1) % 4;
        return true;
    }
    return false;
}

// === PHASE DETECTION ===
function getPhase(beatCounter, bass, high) {
    if (beatCounter < 4) {
        if (beatCounter % 2 === 0) return 'SWING_LEFT';
        return 'SWING_RIGHT';
    }
    if (bass > 0.7) return 'DROP';
    if (high > 0.5) return 'BUILDUP';
    return 'WARMUP';
}

// === TRANSITION ===
function triggerTransition(pose, mode = 'CUT') {
    if (pose === STATE.targetPose) return;
    STATE.sourcePose = STATE.targetPose;
    STATE.targetPose = pose;
    STATE.transitionProgress = 0;
    STATE.transitionMode = mode;
    STATE.transitionSpeed = mode === 'CUT' ? 100 : mode === 'ZOOM_IN' ? 6 : 8;
}

// === VISUALIZER ===
class HolographicVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!this.gl) {
            console.warn('WebGL not supported, using fallback');
            return;
        }
        this.initShaders();
        this.initBuffers();
        this.params = HOLOGRAM_PARAMS;
    }

    initShaders() {
        const gl = this.gl;
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, `
            attribute vec2 a_position;
            varying vec2 v_uv;
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `);
        gl.compileShader(vs);

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, `
            precision mediump float;
            varying vec2 v_uv;
            uniform float u_time;
            uniform vec3 u_audio;
            uniform vec3 u_hue;
            uniform float u_density;
            uniform float u_speed;

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }

            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(
                    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
                    f.y
                );
            }

            void main() {
                vec2 uv = v_uv * 2.0 - 1.0;
                float t = u_time * u_speed;

                float n = 0.0;
                float amp = 0.5;
                vec2 p = uv * u_density;
                for (int i = 0; i < 4; i++) {
                    n += noise(p + t * 0.3) * amp;
                    p *= 2.0;
                    amp *= 0.5;
                }

                float bass = u_audio.x;
                float mid = u_audio.y;
                float high = u_audio.z;

                vec3 col = u_hue;
                col += vec3(0.0, 0.3, 0.5) * bass;
                col += vec3(0.3, 0.0, 0.3) * mid;
                col += vec3(0.5, 0.5, 0.0) * high;

                col *= n * 0.8 + 0.2;
                col *= 0.5 + 0.5 * sin(t * 0.5 + uv.x * 3.0);

                gl_FragColor = vec4(col * 0.4, 1.0);
            }
        `);
        gl.compileShader(fs);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);
        gl.useProgram(this.program);

        this.u_time = gl.getUniformLocation(this.program, 'u_time');
        this.u_audio = gl.getUniformLocation(this.program, 'u_audio');
        this.u_hue = gl.getUniformLocation(this.program, 'u_hue');
        this.u_density = gl.getUniformLocation(this.program, 'u_density');
        this.u_speed = gl.getUniformLocation(this.program, 'u_speed');
    }

    initBuffers() {
        const gl = this.gl;
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        const a_position = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(a_position);
        gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
    }

    render(audio, time, rot) {
        const gl = this.gl;
        if (!gl) return;

        const w = window.innerWidth;
        const h = window.innerHeight;
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
            gl.viewport(0, 0, w, h);
        }

        gl.uniform1f(this.u_time, time);
        gl.uniform3f(this.u_audio, audio.bass, audio.mid, audio.high);
        gl.uniform3f(this.u_hue, this.params.baseHue / 360, 0.7, 0.5);
        gl.uniform1f(this.u_density, this.params.noiseDensity || 3.0);
        gl.uniform1f(this.u_speed, this.params.animSpeed || 1.0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}

// === MAIN LOOP ===
const bgCanvas = document.getElementById('bgCanvas');
const charCanvas = document.getElementById('charCanvas');
const ctx = charCanvas.getContext('2d');
const viz = new HolographicVisualizer(bgCanvas);

let lastTime = performance.now();

function loop() {
    requestAnimationFrame(loop);

    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Get audio data
    analyser.getByteFrequencyData(freqData);
    const bassSum = freqData.slice(0, 10).reduce((a, b) => a + b, 0);
    const midSum = freqData.slice(10, 100).reduce((a, b) => a + b, 0);
    const highSum = freqData.slice(100, 300).reduce((a, b) => a + b, 0);

    let bass = (bassSum / 10) / 255;
    let mid = (midSum / 90) / 255;
    let high = (highSum / 200) / 255;

    // Synthetic beat fallback
    if (STATE.syntheticBeat) {
        const t = now / 1000;
        const beatPhase = (t * (STATE.bpm / 60)) % 1;
        bass = Math.pow(Math.sin(beatPhase * Math.PI), 4) * 0.6;
        mid = 0.3 + 0.2 * Math.sin(t * 2);
        high = 0.2 + 0.1 * Math.sin(t * 3);
    }

    // Beat detection
    const isBeat = detectBeat(bass, now);
    const phase = getPhase(STATE.beatCounter, bass, high);
    const isCloseupLocked = now < STATE.closeupLockTime;

    // Update beat bars
    for (let i = 0; i < 4; i++) {
        const bar = document.getElementById('beat' + i);
        if (bar) {
            bar.classList.toggle('active', i === STATE.beatCounter);
            bar.classList.toggle('downbeat', i === 0 && STATE.beatCounter === 0);
        }
    }

    // Update BPM display
    const bpmEl = document.getElementById('bpmValue');
    if (bpmEl) bpmEl.textContent = STATE.bpm;

    // Transition progress
    STATE.transitionProgress = Math.min(1.0, STATE.transitionProgress + dt * STATE.transitionSpeed);

    // Energy trend
    const energyTrend = bass - (bpmHistory[bpmHistory.length - 2] || bass);

    // Frame selection on beat
    if (isBeat) {
        STATE.charSquash = 0.85;
        STATE.charBounceY = -50 * bass;
        STATE.flashIntensity = 0.8;

        if (phase === 'SWING_LEFT') { STATE.targetTilt = -8; STATE.direction = 'left'; }
        else if (phase === 'SWING_RIGHT') { STATE.targetTilt = 8; STATE.direction = 'right'; }
        else { STATE.targetTilt = 0; STATE.direction = 'center'; }

        // Pool selection based on pattern
        let pool = [];
        const pattern = STATE.pattern;

        if (isCloseupLocked) pool = CLOSEUPS;
        else if (pattern === 'EMOTE' && CLOSEUPS.length > 0) pool = CLOSEUPS;
        else if (pattern === 'CHAOS') pool = [...FRAMES_BY_ENERGY.low, ...FRAMES_BY_ENERGY.mid, ...FRAMES_BY_ENERGY.high];
        else if (pattern === 'MINIMAL') pool = FRAMES_BY_ENERGY.low;
        else if (pattern === 'IMPACT' || pattern === 'BUILD_DROP') pool = FRAMES_BY_ENERGY.high;
        else if (pattern === 'GROOVE' || pattern === 'FLOW') pool = FRAMES_BY_ENERGY.mid;
        else if (pattern === 'FOOTWORK') pool = FRAMES_BY_ENERGY.mid.filter(f => f.direction === 'left' || f.direction === 'right');
        else {
            if (energyTrend > 0.1 * STATE.energyMultiplier && FRAMES_BY_ENERGY.high.length > 0) pool = FRAMES_BY_ENERGY.high;
            else {
                if (phase === 'WARMUP') pool = FRAMES_BY_ENERGY.low;
                else if (phase === 'SWING_LEFT') pool = FRAMES_BY_ENERGY.mid.filter(f => f.direction === 'left');
                else if (phase === 'SWING_RIGHT') pool = FRAMES_BY_ENERGY.mid.filter(f => f.direction === 'right');
                else if (phase === 'DROP') pool = FRAMES_BY_ENERGY.high;
            }
        }

        if (pool.length === 0) pool = FRAMES_BY_ENERGY.mid;
        if (pool.length === 0) pool = FRAMES_BY_ENERGY.low;

        if (pool.length > 0) {
            const next = pool[Math.floor(Math.random() * pool.length)];
            let mode = 'CUT';

            if (isCloseupLocked || next.type === 'closeup') mode = 'ZOOM_IN';
            else if (phase.includes('SWING')) {
                if (high > 0.4) mode = 'SMOOTH';
                else mode = 'SLIDE';
            } else if (energyTrend < -0.1) {
                mode = 'SMOOTH';
            }

            triggerTransition(next.pose, mode);
        }
    } else if (bass < 0.3 && mid < 0.3 && Math.random() < 0.02) {
        // Ambient drift
        const pool = FRAMES_BY_ENERGY.low;
        if (pool.length > 0) {
            const next = pool[Math.floor(Math.random() * pool.length)];
            triggerTransition(next.pose, 'SMOOTH');
        }
        STATE.targetTilt = 0;
    }

    // Vocal gate for closeups
    if (!isCloseupLocked && high > 0.6 && mid > 0.4 && bass < 0.5) {
        if (CLOSEUPS.length > 0 && Math.random() < 0.5) {
            const next = CLOSEUPS[Math.floor(Math.random() * CLOSEUPS.length)];
            triggerTransition(next.pose, 'ZOOM_IN');
            STATE.closeupLockTime = now + 2500;
        }
    }

    // Physics decay
    STATE.charSquash += (1.0 - STATE.charSquash) * (12 * dt);
    STATE.charSkew += (0.0 - STATE.charSkew) * (10 * dt);
    STATE.charTilt += (STATE.targetTilt - STATE.charTilt) * (6 * dt);
    STATE.charBounceY += (0 - STATE.charBounceY) * (10 * dt);
    STATE.flashIntensity *= Math.exp(-15 * dt);
    STATE.camZoom += (1.15 - STATE.camZoom) * (1 - Math.exp(-5 * dt));

    let targetPanX = 0;
    if (STATE.direction === 'left') targetPanX = 30;
    else if (STATE.direction === 'right') targetPanX = -30;
    STATE.camPanX += (targetPanX - STATE.camPanX) * (4 * dt);

    // Render background
    const rx = STATE.dynamicCam ? STATE.masterRot.x : 0;
    const ry = STATE.dynamicCam ? STATE.masterRot.y : 0;
    const rz = STATE.dynamicCam ? STATE.masterRot.z : 0;
    viz.render({ bass, mid, high }, now / 1000, { x: rx * 0.3, y: ry * 0.3, z: rz * 0.2 });

    // Render character
    if (charCanvas.width !== w || charCanvas.height !== h) {
        charCanvas.width = w;
        charCanvas.height = h;
    }
    const cx = w / 2;
    const cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    // Build filter string from FX state
    let filters = [];
    if (STATE.fx.invert) filters.push('invert(1)');
    if (STATE.fx.grayscale) filters.push('grayscale(1)');
    if (STATE.fx.hue !== 0) filters.push(`hue-rotate(${STATE.fx.hue}deg)`);
    if (STATE.fx.saturation !== 100) filters.push(`saturate(${STATE.fx.saturation}%)`);
    if (STATE.fx.contrast !== 100) filters.push(`contrast(${STATE.fx.contrast}%)`);
    ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';

    // Flash effect
    const flashAmount = Math.max(STATE.flashIntensity, STATE.fx.flash, STATE.triggers.burst ? 0.8 : 0);
    if (flashAmount > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${flashAmount})`;
        ctx.fillRect(0, 0, w, h);
    }

    // Draw layer function
    const drawLayer = (pose, opacity, blur, skew, extraScale) => {
        const frame = ALL_FRAMES.find(f => f.pose === pose);
        const img = IMAGES[pose];
        if (!img || !img.complete) return;

        const aspect = img.width / img.height;
        let dw = w * 1.0;
        let dh = dw / aspect;
        if (dh > h) { dh = h; dw = dh * aspect; }

        let zoom = STATE.camZoom;
        let vOffset = 0;
        if (frame && frame.isVirtual) {
            zoom *= frame.virtualZoom || 1;
            vOffset = frame.virtualOffsetY || 0;
        }

        ctx.save();
        ctx.translate(cx + STATE.camPanX, cy + STATE.charBounceY);

        const radX = (rx * Math.PI) / 180;
        const radY = (ry * Math.PI) / 180;
        const scaleX = Math.cos(radY);
        const scaleY = Math.cos(radX);
        const tiltZ = (rz * 0.8) * (Math.PI / 180);

        ctx.rotate(tiltZ + (STATE.charTilt * Math.PI / 180));
        ctx.scale(Math.abs(scaleX), Math.abs(scaleY));
        ctx.scale(1 / STATE.charSquash, STATE.charSquash);
        if (skew) ctx.transform(1, 0, skew, 1, 0, 0);
        if (STATE.charSkew !== 0) ctx.transform(1, 0, STATE.charSkew * 0.2, 1, 0, 0);

        const finalZoom = zoom * (extraScale || 1.0);
        ctx.scale(finalZoom, finalZoom);
        ctx.translate(0, vOffset * dh);

        if (blur > 0) ctx.filter = (ctx.filter === 'none' ? '' : ctx.filter) + ` blur(${blur}px)`;

        ctx.globalAlpha = opacity;
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
    };

    // Draw with transition
    const prog = STATE.transitionProgress;
    if (prog >= 1.0 || STATE.transitionMode === 'CUT') {
        drawLayer(STATE.targetPose, 1.0, 0, 0, 1.0);
    } else {
        const easeT = prog * prog * (3 - 2 * prog);
        if (STATE.transitionMode === 'ZOOM_IN') {
            const zf = 1.0 + (easeT * 0.5);
            drawLayer(STATE.sourcePose, 1.0 - easeT, easeT * 10, 0, zf);
            drawLayer(STATE.targetPose, easeT, 0, 0, 1.0);
        } else if (STATE.transitionMode === 'SLIDE') {
            const dir = STATE.targetPose.includes('right') ? -1 : 1;
            drawLayer(STATE.sourcePose, 1.0 - easeT, 0, w * 0.0002 * easeT * dir, 1.0);
            drawLayer(STATE.targetPose, easeT, 0, w * 0.0002 * (1.0 - easeT) * -dir, 1.0);
        } else {
            drawLayer(STATE.sourcePose, 1.0 - easeT, 0, 0, 1.0);
            drawLayer(STATE.targetPose, easeT, 0, 0, 1.0);
        }
    }

    // Update UI
    const fpsEl = document.getElementById('fps');
    if (fpsEl) fpsEl.textContent = Math.round(1 / dt) + ' FPS';
    const poseEl = document.getElementById('poseDisplay');
    if (poseEl) poseEl.textContent = STATE.targetPose.toUpperCase();

    // Update FX bars
    const fxBarX = document.getElementById('fxBarX');
    const fxBarY = document.getElementById('fxBarY');
    if (fxBarX) fxBarX.style.width = (STATE.fx.x * 100) + '%';
    if (fxBarY) fxBarY.style.width = (STATE.fx.y * 100) + '%';
}

// === GESTURE GATE ===
const gestureGate = document.getElementById('gestureGate');
const gestureStart = document.getElementById('gestureStart');
let gestureResolved = false;

function resolveGesture() {
    if (gestureResolved) return;
    gestureResolved = true;
    gestureGate.style.display = 'none';
    audioCtx.resume();
}

gestureStart.onclick = resolveGesture;

// === AUDIO SOURCES ===
function setMediaStream(stream, label = 'mic') {
    if (sourceNode) sourceNode.disconnect();
    sourceNode = audioCtx.createMediaStreamSource(stream);
    sourceNode.connect(analyser);
    micStream = stream;
    STATE.syntheticBeat = false;
    audioEl.pause();

    const btnMic = document.getElementById('btnMic');
    if (btnMic) btnMic.classList.add('mic-active');
}

async function requestMicrophone() {
    resolveGesture();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone unavailable. Using synthetic beat.');
        STATE.syntheticBeat = true;
        return null;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true } });
        setMediaStream(stream, 'mic');
        return stream;
    } catch (e) {
        console.warn('Microphone request failed', e);
        alert('Microphone blocked. Enable mic or use file.');
        STATE.syntheticBeat = true;
        return null;
    }
}

async function captureSystemAudio() {
    resolveGesture();
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) throw new Error('No system audio');
        const audioOnly = new MediaStream(audioTracks);
        stream.getVideoTracks().forEach(t => t.stop());
        setMediaStream(audioOnly, 'system');
    } catch (e) {
        console.warn('System audio failed', e);
        alert('System audio blocked. Try file or mic.');
    }
}

function loadAudioUrl(url) {
    resolveGesture();
    connectAudioElement();
    audioEl.src = url;
    audioEl.play();
    STATE.syntheticBeat = false;

    const btnMic = document.getElementById('btnMic');
    if (btnMic) btnMic.classList.remove('mic-active');
}

// === ADAPTER PILLS ===
const adapterTray = document.getElementById('adapterTray');
const fileAdapterInput = document.getElementById('fileAdapter');

function activateAdapter(adapter) {
    document.querySelectorAll('.adapter-pill').forEach(pill =>
        pill.classList.toggle('active', pill.dataset.adapter === adapter)
    );

    if (adapter === 'file') fileAdapterInput.click();
    else if (adapter === 'mic') requestMicrophone();
    else if (adapter === 'system') captureSystemAudio();
}

fileAdapterInput.onchange = () => {
    const file = fileAdapterInput.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    loadAudioUrl(url);
};

adapterTray.querySelectorAll('.adapter-pill').forEach(pill =>
    pill.addEventListener('click', () => activateAdapter(pill.dataset.adapter))
);

// === STREAMING INPUT ===
const streamInput = document.getElementById('streamInput');
const btnPasteStream = document.getElementById('btnPasteStream');
const btnLinkStream = document.getElementById('btnLinkStream');

btnPasteStream.onclick = async () => {
    try {
        const text = await navigator.clipboard.readText();
        streamInput.value = text;
    } catch (e) {
        console.warn('Clipboard read failed', e);
    }
};

btnLinkStream.onclick = () => {
    const url = streamInput.value.trim();
    if (url) loadAudioUrl(url);
};

// === BEZEL CONTROLS ===
const bezelLeft = document.getElementById('bezelLeft');
const bezelRight = document.getElementById('bezelRight');

bezelLeft.onclick = () => bezelLeft.classList.toggle('expanded');
bezelRight.onclick = () => bezelRight.classList.toggle('expanded');

// FX buttons
document.querySelectorAll('[data-fx]').forEach(btn => {
    btn.onclick = (e) => {
        e.stopPropagation();
        const fx = btn.dataset.fx;
        if (fx === 'flash') STATE.fx.flash = 0.8;
        else if (fx === 'glitch') STATE.fx.glitch = 0.8;
        else if (fx === 'invert') STATE.fx.invert = !STATE.fx.invert;
        else if (fx === 'bw') STATE.fx.grayscale = !STATE.fx.grayscale;
        btn.classList.toggle('active');
    };
});

// Mode buttons
document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.onclick = (e) => {
        e.stopPropagation();
        STATE.engineMode = btn.dataset.mode;
        document.querySelectorAll('[data-mode]').forEach(b =>
            b.classList.toggle('active', b.dataset.mode === STATE.engineMode)
        );
    };
});

// Trigger buttons
document.querySelectorAll('[data-trigger]').forEach(btn => {
    btn.onclick = (e) => {
        e.stopPropagation();
        const trigger = btn.dataset.trigger;
        STATE.triggers[trigger] = true;
        setTimeout(() => STATE.triggers[trigger] = false, 100);
    };
});

// FX sliders
document.getElementById('fxIntensityX')?.addEventListener('input', (e) => {
    STATE.fx.x = e.target.value / 100;
});
document.getElementById('fxIntensityY')?.addEventListener('input', (e) => {
    STATE.fx.y = e.target.value / 100;
});

// === TOUCH ZONE CONTROLLER ===
const touchZone = document.getElementById('touchZone');
const patternJoystick = document.getElementById('patternJoystick');
const joystickRing = patternJoystick.querySelector('.joystick-ring');
const joystickKnob = patternJoystick.querySelector('.joystick-knob');
const patternIndicator = document.querySelector('.pattern-indicator');
const zoneLabels = document.querySelectorAll('.zone-label');
const zoneHalves = document.querySelectorAll('.zone-half');
const patternGrid = document.getElementById('patternGrid');

let touchState = { active: false, startX: 0, startY: 0, side: null };

function getPatternFromAngle(x, y, patterns) {
    const angle = Math.atan2(y, x);
    const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
    const index = Math.floor(normalizedAngle * patterns.length) % patterns.length;
    return patterns[index];
}

function getSide(clientX) {
    return clientX < window.innerWidth / 2 ? 'left' : 'right';
}

function updateJoystickLabels(patterns, currentPattern) {
    const ringSize = patterns.length > 8 ? 180 : 140;
    joystickRing.style.width = ringSize + 'px';
    joystickRing.style.height = ringSize + 'px';
    joystickRing.querySelectorAll('.pattern-label').forEach(l => l.remove());

    const radius = ringSize / 2 - 20;
    patterns.forEach((p, i) => {
        const anglePerPattern = (Math.PI * 2) / patterns.length;
        const angle = (i * anglePerPattern) - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const label = document.createElement('div');
        label.className = 'pattern-label' + (p === currentPattern ? ' active' : '');
        label.textContent = p.replace('_', '').slice(0, 3);
        label.style.left = 'calc(50% + ' + x + 'px)';
        label.style.top = 'calc(50% + ' + y + 'px)';
        label.style.transform = 'translate(-50%, -50%)';
        joystickRing.appendChild(label);
    });
}

function handleTouchStart(clientX, clientY) {
    const side = getSide(clientX);
    touchState = { active: true, startX: clientX, startY: clientY, side };

    STATE.engineMode = side === 'left' ? 'PATTERN' : 'KINETIC';
    document.querySelectorAll('[data-mode]').forEach(b =>
        b.classList.toggle('active', b.dataset.mode === STATE.engineMode)
    );

    const patterns = side === 'left' ? PATTERNS : KINETIC_PATTERNS;
    patternJoystick.style.left = clientX + 'px';
    patternJoystick.style.top = clientY + 'px';
    patternJoystick.classList.add('visible');
    joystickRing.classList.toggle('kinetic', side === 'right');
    joystickKnob.classList.toggle('kinetic', side === 'right');
    joystickKnob.style.transform = 'translate(-50%, -50%)';
    updateJoystickLabels(patterns, STATE.pattern);

    zoneHalves.forEach(z => {
        z.classList.remove('active-left', 'active-right');
        if (z.classList.contains(side)) z.classList.add('active-' + side);
    });
    zoneLabels.forEach(l => l.classList.toggle('visible', l.classList.contains(side)));

    patternIndicator.textContent = STATE.pattern.replace('_', ' ');
    patternIndicator.className = 'pattern-indicator visible ' + (side === 'left' ? 'pattern-mode' : 'kinetic-mode');
}

function handleTouchMove(clientX, clientY) {
    if (!touchState.active) return;
    const deltaX = clientX - touchState.startX;
    const deltaY = clientY - touchState.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const maxRadius = 60;
    const clampedDistance = Math.min(distance, maxRadius);
    const angle = Math.atan2(deltaY, deltaX);
    const joyX = Math.cos(angle) * clampedDistance;
    const joyY = Math.sin(angle) * clampedDistance;
    joystickKnob.style.transform = 'translate(calc(-50% + ' + joyX + 'px), calc(-50% + ' + joyY + 'px))';

    if (distance > 30) {
        const patterns = touchState.side === 'left' ? PATTERNS : KINETIC_PATTERNS;
        const newPattern = getPatternFromAngle(deltaX, deltaY, patterns);
        if (newPattern !== STATE.pattern) {
            STATE.pattern = newPattern;
            patternIndicator.textContent = newPattern.replace('_', ' ');
            patternGrid.querySelectorAll('.pattern-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.pattern === newPattern)
            );
            updateJoystickLabels(patterns, newPattern);
        }
    }
}

function handleTouchEnd() {
    touchState.active = false;
    patternJoystick.classList.remove('visible');
    zoneHalves.forEach(z => z.classList.remove('active-left', 'active-right'));
    zoneLabels.forEach(l => l.classList.remove('visible'));
    patternIndicator.classList.remove('visible');
}

// Touch events
touchZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    handleTouchStart(t.clientX, t.clientY);
}, { passive: false });

touchZone.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    handleTouchMove(t.clientX, t.clientY);
}, { passive: false });

touchZone.addEventListener('touchend', handleTouchEnd);
touchZone.addEventListener('touchcancel', handleTouchEnd);

// Mouse events for desktop
touchZone.addEventListener('mousedown', (e) => handleTouchStart(e.clientX, e.clientY));
touchZone.addEventListener('mousemove', (e) => { if (touchState.active) handleTouchMove(e.clientX, e.clientY); });
touchZone.addEventListener('mouseup', handleTouchEnd);
touchZone.addEventListener('mouseleave', () => { if (touchState.active) handleTouchEnd(); });

// === PATTERN BUTTONS ===
PATTERNS.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'pattern-btn' + (p === STATE.pattern ? ' active' : '');
    btn.dataset.pattern = p;
    btn.textContent = p.replace('_', ' ');
    btn.onclick = () => {
        STATE.pattern = p;
        patternGrid.querySelectorAll('.pattern-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.pattern === p)
        );
    };
    patternGrid.appendChild(btn);
});

// === STATUS BAR BUTTONS ===
const btnMic = document.getElementById('btnMic');
const btnPlay = document.getElementById('btnPlay');
const btnCam = document.getElementById('btnCam');
const btnHelp = document.getElementById('btnHelp');
const helpOverlay = document.getElementById('helpOverlay');

btnMic.onclick = requestMicrophone;
btnPlay.onclick = () => {
    if (audioEl.paused) audioEl.play();
    else audioEl.pause();
};
btnCam.onclick = () => STATE.dynamicCam = !STATE.dynamicCam;
btnHelp.onclick = () => {
    STATE.helpVisible = !STATE.helpVisible;
    helpOverlay.style.display = STATE.helpVisible ? 'block' : 'none';
};

// === KEYBOARD SHORTCUTS ===
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === ' ') { e.preventDefault(); btnPlay.click(); }
    else if (key === 'm') requestMicrophone();
    else if (key === 'p') { STATE.engineMode = 'PATTERN'; document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === 'PATTERN')); }
    else if (key === 'k') { STATE.engineMode = 'KINETIC'; document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === 'KINETIC')); }
    else if (key === 'f') { STATE.fx.flash = 0.8; }
    else if (key === 'g') { STATE.fx.glitch = 0.8; }
    else if (key === '?') btnHelp.click();
    else if (key >= '1' && key <= '9') {
        const idx = parseInt(key) - 1;
        if (idx < PATTERNS.length) {
            STATE.pattern = PATTERNS[idx];
            patternGrid.querySelectorAll('.pattern-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.pattern === PATTERNS[idx])
            );
        }
    }
});

// === INIT ===
loadRig();
loop();
