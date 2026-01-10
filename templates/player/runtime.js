        // --- 1. DATA INJECTION ---
        let FRAMES = {{FRAMES_JSON}};
        let PARAMS = {{PARAMS_JSON}};
        let SUBJECT = {{SUBJECT_CATEGORY_JSON}};
        
        // --- 2. SHADER SOURCE ---
        const VERTEX = {{VERTEX_SHADER_JSON}};
        const FRAGMENT = {{FRAGMENT_SHADER_JSON}};

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
            // If synthetic mode is active, toggle it off
            if (STATE.syntheticBeat) {
                STATE.syntheticBeat = false;
                btnMic.classList.remove('active');
                btnMic.style.background = '';
                btnMic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>';
                return;
            }

            // If mic is active, turn it off
            if(micStream) {
                micStream.getTracks().forEach(t=>t.stop()); micStream=null;
                btnMic.classList.remove('active');
                btnMic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>';
                if(sourceNode) { sourceNode.disconnect(); sourceNode=null; }
                return;
            }

            // Check for secure context and offer synthetic mode as alternative
            const canUseMic = window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

            if (!canUseMic) {
                // Offer synthetic beat mode as alternative
                const useSynthetic = confirm("Microphone requires HTTPS or localhost.\\n\\nWould you like to use SYNTHETIC BEAT mode instead?\\n\\nThis generates rhythmic patterns without audio input.");
                if (useSynthetic) {
                    STATE.syntheticBeat = true;
                    btnMic.classList.add('active');
                    btnMic.style.background = 'linear-gradient(135deg, #00ff88, #00ccff)';
                    btnMic.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="color:#000"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
                }
                return;
            }

            // Try to get microphone access
            audioCtx.resume();
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
                if(audioEl) {
                    audioEl.pause();
                    btnPlay.classList.remove('active');
                    btnPlay.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
                }
                btnMic.classList.add('active');
                btnMic.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="color:#ef4444"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="2"/></svg>';
                if (typeof resetUITimeout === 'function') resetUITimeout();
            } catch(e) {
                console.error("Mic error:", e);
                // Offer synthetic mode as fallback on any error
                let errorMsg = "Microphone access failed.";
                if (e.name === 'NotAllowedError') errorMsg = "Microphone access denied.";
                else if (e.name === 'NotFoundError') errorMsg = "No microphone found.";

                const useSynthetic = confirm(errorMsg + "\\n\\nWould you like to use SYNTHETIC BEAT mode instead?\\n\\nThis generates rhythmic patterns without audio input.");
                if (useSynthetic) {
                    STATE.syntheticBeat = true;
                    btnMic.classList.add('active');
                    btnMic.style.background = 'linear-gradient(135deg, #00ff88, #00ccff)';
                    btnMic.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="color:#000"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
                }
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
        const streamInput = document.getElementById('streamInput');
        const streamRow = document.getElementById('streamRow');
        const btnStreamToggle = document.getElementById('btnStreamToggle');
        const btnLinkStream = document.getElementById('btnLinkStream');
        const btnPasteStream = document.getElementById('btnPasteStream');
        const streamStatus = document.getElementById('streamStatus');
        const btnLoadRig = document.getElementById('btnLoadRig');
        const btnFx = document.getElementById('btnFx');
        const btnPhysics = document.getElementById('btnPhysics');
        const btnEngine = document.getElementById('btnEngine');
        const physicsLabel = document.getElementById('physicsLabel');
        const engineLabel = document.getElementById('engineLabel');
        const tapHint = document.getElementById('tapHint');
        const progressBars = document.querySelectorAll('.prog-bar');

        // Load buttons
        btnLoadRig.onclick = () => rigInput.click();

        if (btnStreamToggle) {
            btnStreamToggle.onclick = () => {
                const shouldShow = !streamRow || streamRow.style.display === 'none';
                if (streamRow) streamRow.style.display = shouldShow ? 'flex' : 'none';
                if (shouldShow && streamInput) {
                    streamInput.focus();
                    if (streamStatus) streamStatus.textContent = 'Paste any streaming URL (https://...)';
                }
            };
        }

        rigInput.onchange = (e) => {
            const file = e.target.files[0];
            if(file) handleRigFile(file);
        };

        audioInput.onchange = (e) => {
            const file = e.target.files[0];
            if(file) handleAudioFile(file);
        };

        function linkStream(url) {
            const normalized = url.match(/^https?:\/\//) ? url : 'https://' + url;
            if(streamStatus) streamStatus.textContent = 'Loading stream...';
            if(streamRow) streamRow.style.display = 'flex';
            audioEl.src = normalized;
            audioCtx.resume();
            audioEl.play().then(() => {
                connectAudioElement();
                btnPlay.classList.add('active');
                btnPlay.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                if(streamStatus) streamStatus.textContent = 'Stream ready';
            }).catch(err => {
                console.error('Stream load failed', err);
                if(streamStatus) streamStatus.textContent = 'Stream failed to load';
            });
        }

        if(btnLinkStream) {
            btnLinkStream.onclick = () => {
                const raw = streamInput && streamInput.value ? streamInput.value.trim() : '';
                if(!raw) {
                    if(streamStatus) streamStatus.textContent = 'Paste a stream link first';
                    return;
                }
                linkStream(raw);
            };
        }

        if(btnPasteStream) {
            btnPasteStream.onclick = async () => {
                if(!navigator.clipboard) {
                    if(streamStatus) streamStatus.textContent = 'Clipboard blocked';
                    return;
                }
                try {
                    const clip = await navigator.clipboard.readText();
                    if(clip) {
                        if(streamInput) streamInput.value = clip.trim();
                        linkStream(clip.trim());
                        if(streamStatus) streamStatus.textContent = 'Linked from clipboard';
                    }
                } catch (e) {
                    console.error('Clipboard read failed', e);
                    if(streamStatus) streamStatus.textContent = 'Clipboard denied';
                }
            };
        }

        function normalizeRigPayload(proj) {
            return {
                frames: proj.frames || proj.generatedFrames || proj.sequence || [],
                hologramParams: proj.hologramParams || proj.hologram_params || proj.params || {},
                subjectCategory: proj.subjectCategory || proj.subject || SUBJECT || "UNKNOWN"
            };
        }

        function offerDkgConversion(file, normalized) {
            const lower = file.name.toLowerCase();
            if(lower.endsWith('.dkg')) return;

            const shouldConvert = confirm('Legacy rig detected. Convert to .dkg for future use?');
            if(!shouldConvert) return;

            const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const baseName = file.name.replace(/\.[^.]+$/, '');
            a.download = baseName + '.dkg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        }

        function handleRigFile(file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const raw = JSON.parse(ev.target.result);
                    const normalized = normalizeRigPayload(raw);
                    if(normalized.frames && normalized.frames.length) {
                        loadRig(normalized.frames, normalized.hologramParams, normalized.subjectCategory);
                        offerDkgConversion(file, normalized);
                    } else {
                        alert('Invalid Golem file structure');
                    }
                } catch(e) { alert("Invalid Golem (.dkg/.jusdnce) File"); }
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
            if(file.name.toLowerCase().endsWith('.dkg') || file.name.toLowerCase().endsWith('.rig') || file.name.toLowerCase().endsWith('.jusdnce') || file.type.includes('json')) {
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
                    bar.style.background = 'linear-gradient(to right, ' + color + ' ' + (progress*100) + '%, rgba(255,255,255,0.15) ' + (progress*100) + '%)';
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