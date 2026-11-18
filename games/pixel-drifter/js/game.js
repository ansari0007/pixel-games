/* ==========================================================================
   PIXEL DRIFTER — Pseudo-3D Retro Synthwave Arcade Racer
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // ============================
    // CONSTANTS & CONFIGURATION
    // ============================
    const CANVAS_W = 720;
    const CANVAS_H = 540;

    const ROAD_WIDTH = 2000;
    const SEGMENT_LENGTH = 200;
    const RUMBLE_LENGTH = 3;
    const CAMERA_HEIGHT = 1000;
    const CAMERA_DEPTH = 0.84;
    const DRAW_DISTANCE = 300;

    const STATE = {
        START: 'START',
        RACING: 'RACING',
        GAME_OVER: 'GAME_OVER',
        VICTORY: 'VICTORY'
    };

    // Color Palette
    const COLORS = {
        SKY: '#080415',
        ROAD_DARK: '#1c132b',
        ROAD_LIGHT: '#251a38',
        RUMBLE_RED: '#ff2a5f',
        RUMBLE_WHITE: '#ffffff',
        LANE_YELLOW: '#ffea00',
        GRASS_DARK: '#0c051a',
        GRASS_LIGHT: '#130826',
        CYAN: '#00f0ff',
        PINK: '#ff007f',
        GOLD: '#ffd700'
    };


    // ============================
    // PROCEDURAL AUDIO SYNTHESIZER
    // ============================
    const Sound = {
        ctx: null,
        enabled: true,
        engineOsc: null,
        engineGain: null,

        init() {
            if (!this.ctx) {
                const AudioClass = window.AudioContext || window.webkitAudioContext;
                if (AudioClass) {
                    this.ctx = new AudioClass();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            this._startEngineSound();
        },

        toggle() {
            this.enabled = !this.enabled;
            if (this.engineGain) {
                this.engineGain.gain.value = this.enabled ? 0.05 : 0;
            }
            return this.enabled;
        },

        _startEngineSound() {
            if (!this.ctx || this.engineOsc) return;
            try {
                this.engineOsc = this.ctx.createOscillator();
                this.engineGain = this.ctx.createGain();
                this.engineOsc.type = 'sawtooth';
                this.engineOsc.frequency.value = 65; // Idle RPM
                this.engineGain.gain.value = this.enabled ? 0.03 : 0;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 450;

                this.engineOsc.connect(filter);
                filter.connect(this.engineGain);
                this.engineGain.connect(this.ctx.destination);
                this.engineOsc.start();
            } catch (e) {
                // AudioContext not yet permitted
            }
        },

        updateEngineRPM(speedPct) {
            if (!this.enabled || !this.engineOsc) return;
            const targetFreq = 70 + speedPct * 260;
            this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
            if (this.engineGain) {
                this.engineGain.gain.value = speedPct > 0.05 ? 0.045 : 0.02;
            }
        },

        play(type, arg = 0) {
            if (!this.enabled || !this.ctx) return;
            const t = this.ctx.currentTime;

            switch (type) {
                case 'skid': {
                    // Tire screech noise
                    const bufferSize = this.ctx.sampleRate * 0.12;
                    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                    const output = noiseBuffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        output[i] = Math.random() * 2 - 1;
                    }
                    const whiteNoise = this.ctx.createBufferSource();
                    whiteNoise.buffer = noiseBuffer;

                    const filter = this.ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.value = 1600;
                    filter.Q.value = 4.0;

                    const gain = this.ctx.createGain();
                    gain.gain.setValueAtTime(0.08, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

                    whiteNoise.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);
                    whiteNoise.start(t);
                    whiteNoise.stop(t + 0.12);
                    break;
                }
                case 'nitro': {
                    // Rocket thrust sweep
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(180, t);
                    osc.frequency.linearRampToValueAtTime(540, t + 0.25);
                    gain.gain.setValueAtTime(0.12, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.32);
                    break;
                }
                case 'crash': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(140, t);
                    osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
                    gain.gain.setValueAtTime(0.25, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.33);
                    break;
                }
                case 'checkpoint': {
                    // Majestic brass arpeggio
                    const notes = [523.25, 659.25, 783.99, 1046.50];
                    notes.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(f, t + i * 0.06);
                        gain.gain.setValueAtTime(0.18, t + i * 0.06);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.3);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.06);
                        osc.stop(t + i * 0.06 + 0.32);
                    });
                    break;
                }
            }
        }
    };


    // ============================
    // VISUAL PARTICLES & POPUPS
    // ============================
    class Particle {
        constructor(x, y, vx, vy, size, color) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.size = size;
            this.color = color;
            this.life = 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= 0.035;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    class FloatingText {
        constructor(x, y, text, color, size = 12) {
            this.x = x;
            this.y = y;
            this.text = text;
            this.color = color;
            this.size = size;
            this.life = 1;
            this.vy = -1.5;
        }

        update() {
            this.y += this.vy;
            this.life -= 0.02;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.font = `${this.size}px "Press Start 2P", monospace`;
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
    }


    // ============================
    // MAIN RACING GAME ENGINE
    // ============================
    class PixelDrifterGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;

            this.W = CANVAS_W;
            this.H = CANVAS_H;

            // Game State
            this.state = STATE.START;
            this.score = 0;
            this.highScore = parseInt(localStorage.getItem('pixel_drifter_high') || '0', 10);
            this.timeLeft = 45; // seconds
            this.currentCheckpoint = 1;
            this.screenShake = 0;

            // Player Car Dynamics
            this.playerX = 0; // -1 to +1 on road (0 is center)
            this.playerZ = null;
            this.speed = 0;
            this.maxSpeed = 12000;
            this.accel = this.maxSpeed / 4.5;
            this.decel = -this.maxSpeed / 5;
            this.braking = -this.maxSpeed * 1.2;
            this.position = 0; // distance along road

            // Drifting & Nitro
            this.isDrifting = false;
            this.driftMeter = 0; // 0..100%
            this.nitroActive = false;
            this.nitroTimer = 0;
            this.nitroSpeed = 18500;
            this.skidSoundTimer = 0;

            // Road Segments & Traffic
            this.segments = [];
            this.cars = [];
            this.particles = [];
            this.floatingTexts = [];
            this.trackLength = 0;

            // Input Handling
            this.keyLeft = false;
            this.keyRight = false;
            this.keyFaster = false;
            this.keySlower = false;
            this.keyDrift = false;
            this.keyNitro = false;

            this._initCanvas();
            this._initDOM();
            this._initInputs();
            this._buildTrack();
            this._spawnTraffic();
        }

        _initCanvas() {
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }

        resize() {
            const ratio = CANVAS_W / CANVAS_H;
            let w = window.innerWidth;
            let h = window.innerHeight;

            if (w / h > ratio) {
                w = h * ratio;
            } else {
                h = w / ratio;
            }

            this.canvas.width = CANVAS_W;
            this.canvas.height = CANVAS_H;
            this.canvas.style.width = w + 'px';
            this.canvas.style.height = h + 'px';
        }

        _initDOM() {
            const btnSound = document.getElementById('btn-sound');
            const btnRestart = document.getElementById('btn-restart');

            if (btnSound) {
                btnSound.addEventListener('click', () => {
                    const on = Sound.toggle();
                    btnSound.textContent = on ? '🔊 SOUND' : '🔇 MUTED';
                });
            }

            if (btnRestart) {
                btnRestart.addEventListener('click', () => {
                    this.startRace();
                });
            }

            // Mobile On-Screen Buttons
            const addHold = (id, setter) => {
                const el = document.getElementById(id);
                if (!el) return;
                el.addEventListener('touchstart', (e) => { e.preventDefault(); Sound.init(); setter(true); });
                el.addEventListener('touchend', (e) => { e.preventDefault(); setter(false); });
                el.addEventListener('mousedown', () => { Sound.init(); setter(true); });
                el.addEventListener('mouseup', () => setter(false));
            };

            addHold('btn-left', v => this.keyLeft = v);
            addHold('btn-right', v => this.keyRight = v);
            addHold('btn-gas', v => this.keyFaster = v);
            addHold('btn-drift', v => this.keyDrift = v);
            addHold('btn-nitro', v => {
                if (v && this.driftMeter >= 40) this.activateNitro();
            });
        }

        _initInputs() {
            window.addEventListener('keydown', (e) => {
                Sound.init();

                if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keyLeft = true;
                if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keyRight = true;
                if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keyFaster = true;
                if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keySlower = true;
                if (e.code === 'Space') this.keyDrift = true;
                if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyN') {
                    this.activateNitro();
                }

                if (e.code === 'Enter') {
                    if (this.state === STATE.START || this.state === STATE.GAME_OVER || this.state === STATE.VICTORY) {
                        this.startRace();
                    }
                }
            });

            window.addEventListener('keyup', (e) => {
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keyLeft = false;
                if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keyRight = false;
                if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keyFaster = false;
                if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keySlower = false;
                if (e.code === 'Space') this.keyDrift = false;
            });

            this.canvas.addEventListener('click', () => {
                Sound.init();
                if (this.state === STATE.START || this.state === STATE.GAME_OVER || this.state === STATE.VICTORY) {
                    this.startRace();
                }
            });
        }

        _buildTrack() {
            this.segments = [];
            const addSegment = (curve, y, isArch = false, archText = '') => {
                const n = this.segments.length;
                this.segments.push({
                    index: n,
                    p1: { world: { y: this._lastY(), z: n * SEGMENT_LENGTH }, camera: {}, screen: {} },
                    p2: { world: { y, z: (n + 1) * SEGMENT_LENGTH }, camera: {}, screen: {} },
                    curve,
                    isArch,
                    archText,
                    color: Math.floor(n / RUMBLE_LENGTH) % 2 ? {
                        road: COLORS.ROAD_DARK,
                        rumble: COLORS.RUMBLE_RED,
                        lane: COLORS.LANE_YELLOW,
                        grass: COLORS.GRASS_DARK
                    } : {
                        road: COLORS.ROAD_LIGHT,
                        rumble: COLORS.RUMBLE_WHITE,
                        lane: null,
                        grass: COLORS.GRASS_LIGHT
                    },
                    sprites: []
                });
            };

            const addRoad = (enter, hold, leave, curve, y) => {
                const startY = this._lastY();
                const endY = startY + (y * SEGMENT_LENGTH);
                const total = enter + hold + leave;
                for (let n = 0; n < enter; n++) addSegment(this._easeIn(0, curve, n / enter), this._easeInOut(startY, endY, n / total));
                for (let n = 0; n < hold; n++) addSegment(curve, this._easeInOut(startY, endY, (enter + n) / total));
                for (let n = 0; n < leave; n++) addSegment(this._easeInOut(curve, 0, n / leave), this._easeInOut(startY, endY, (enter + hold + n) / total));
            };

            const addStraight = (num = 50) => addRoad(num, num, num, 0, 0);

            // Build Highway Sections (Total ~1500 segments)
            addStraight(40);
            addRoad(40, 50, 40, 2.5, 0);   // Right curve
            addStraight(30);
            addSegment(0, 0, true, 'CHECKPOINT 1'); // Segment 300
            addRoad(40, 60, 40, -3.2, 10); // Left uphill curve
            addStraight(40);
            addRoad(50, 50, 50, 3.8, -10); // Right downhill curve
            addSegment(0, 0, true, 'CHECKPOINT 2'); // Segment ~650
            addRoad(30, 40, 30, -4.5, 0);  // Sharp hairpin left
            addRoad(30, 40, 30, 4.5, 0);   // Sharp hairpin right
            addSegment(0, 0, true, 'CHECKPOINT 3'); // Segment ~950
            addRoad(50, 60, 50, -2.8, 15); // Long mountain sweep
            addStraight(50);
            addSegment(0, 0, true, 'CHECKPOINT 4'); // Segment ~1250
            addRoad(60, 60, 60, 3.5, 0);   // Final supersonic sweep
            addStraight(40);
            addSegment(0, 0, true, '★ FINISH LINE ★');

            this.trackLength = this.segments.length * SEGMENT_LENGTH;
        }

        _lastY() {
            return this.segments.length === 0 ? 0 : this.segments[this.segments.length - 1].p2.world.y;
        }

        _easeIn(a, b, pct) { return a + (b - a) * Math.pow(pct, 2); }
        _easeInOut(a, b, pct) { return a + (b - a) * ((-Math.cos(pct * Math.PI) / 2) + 0.5); }

        _spawnTraffic() {
            this.cars = [];
            const carColors = ['#ffea00', '#00b0ff', '#e040fb', '#ffffff'];

            for (let i = 0; i < 40; i++) {
                const z = (i * 7000 + 4000) % this.trackLength;
                const offset = (Math.random() * 1.4) - 0.7; // Lane position
                const speed = 4800 + Math.random() * 3200;
                const color = carColors[i % carColors.length];
                this.cars.push({ z, offset, speed, color, percent: 0 });
            }
        }

        startRace() {
            this.state = STATE.RACING;
            this.score = 0;
            this.timeLeft = 45;
            this.currentCheckpoint = 1;
            this.speed = 0;
            this.position = 0;
            this.playerX = 0;
            this.driftMeter = 0;
            this.nitroActive = false;
            this.particles = [];
            this.floatingTexts = [];
            this._spawnTraffic();
            Sound.play('checkpoint');
        }

        activateNitro() {
            if (this.driftMeter < 35 || this.nitroActive || this.state !== STATE.RACING) return;
            this.nitroActive = true;
            this.nitroTimer = 3500; // ms
            this.driftMeter = 0;
            this.screenShake = 6;
            Sound.play('nitro');
            this.floatingTexts.push(new FloatingText(this.W / 2, this.H * 0.45, '⚡ NITRO BOOST! ⚡', COLORS.PINK, 18));
        }

        update(dt) {
            if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - 0.4);

            if (this.state !== STATE.RACING) return;

            // Countdown Timer
            this.timeLeft -= (dt / 1000);
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.state = STATE.GAME_OVER;
                Sound.play('crash');
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('pixel_drifter_high', this.highScore);
                }
                return;
            }

            // Nitro Timer
            if (this.nitroActive) {
                this.nitroTimer -= dt;
                if (this.nitroTimer <= 0) this.nitroActive = false;
            }

            // Acceleration & Speed
            const targetMaxSpeed = this.nitroActive ? this.nitroSpeed : this.maxSpeed;
            if (this.keyFaster) {
                this.speed += this.accel * (dt / 1000);
            } else if (this.keySlower) {
                this.speed += this.braking * (dt / 1000);
            } else {
                this.speed += this.decel * (dt / 1000);
            }

            // Off-road penalty
            if ((this.playerX < -1 || this.playerX > 1) && this.speed > 3500) {
                this.speed += this.braking * 0.6 * (dt / 1000);
            }

            this.speed = Math.max(0, Math.min(targetMaxSpeed, this.speed));
            Sound.updateEngineRPM(this.speed / targetMaxSpeed);

            // Drifting Mechanics
            const isTurning = this.keyLeft || this.keyRight;
            this.isDrifting = (this.keyDrift && isTurning && this.speed > 4200) || (isTurning && this.speed > 9800);

            if (this.isDrifting) {
                // Charge nitro meter & score
                this.driftMeter = Math.min(100, this.driftMeter + 0.35);
                this.score += 8;

                // Tire skid marks & sound
                this.skidSoundTimer += dt;
                if (this.skidSoundTimer >= 180) {
                    this.skidSoundTimer = 0;
                    Sound.play('skid');
                }

                // Tire smoke
                const px = this.W / 2;
                const py = this.H - 55;
                for (let i = 0; i < 2; i++) {
                    this.particles.push(new Particle(
                        px + (this.keyLeft ? 28 : -28) + (Math.random() - 0.5) * 10,
                        py + 10,
                        (Math.random() - 0.5) * 3,
                        (Math.random() - 0.5) * 2 - 1,
                        Math.random() * 6 + 4,
                        'rgba(0, 240, 255, 0.6)'
                    ));
                }
            }

            // Steering with centrifugal force from road curve
            const currentSegment = this._findSegment(this.position + CAMERA_HEIGHT);
            const curveForce = (this.speed / this.maxSpeed) * currentSegment.curve * 1.8 * (dt / 1000);
            this.playerX -= curveForce;

            const steerSpeed = (this.isDrifting ? 1.6 : 1.1) * (dt / 1000);
            if (this.keyLeft) this.playerX -= steerSpeed;
            if (this.keyRight) this.playerX += steerSpeed;
            this.playerX = Math.max(-2, Math.min(2, this.playerX));

            // Move along road
            this.position = (this.position + this.speed * (dt / 1000)) % this.trackLength;
            this.score += Math.floor(this.speed * 0.001);

            // Check Checkpoints
            const segIdx = Math.floor(this.position / SEGMENT_LENGTH);
            const seg = this.segments[segIdx];
            if (seg && seg.isArch && !seg.passed) {
                seg.passed = true;
                this.timeLeft += 25;
                this.currentCheckpoint++;
                Sound.play('checkpoint');
                this.screenShake = 6;
                this.floatingTexts.push(new FloatingText(this.W / 2, this.H * 0.38, 'CHECKPOINT EXTENSION! +25s', COLORS.GOLD, 16));
            }

            // Update Traffic
            this.cars.forEach(car => {
                car.z = (car.z + car.speed * (dt / 1000)) % this.trackLength;

                // Check collision with player
                const carSeg = this._findSegment(car.z);
                const playerSeg = this._findSegment(this.position);

                if (Math.abs(car.z - this.position) < 250) {
                    if (Math.abs(this.playerX - car.offset) < 0.6) {
                        // Crash!
                        this.speed = Math.max(1500, this.speed * 0.4);
                        this.screenShake = 12;
                        Sound.play('crash');
                        this.floatingTexts.push(new FloatingText(this.W / 2, this.H - 120, 'CRASH!', COLORS.RUMBLE_RED, 14));
                    }
                }
            });

            // Update particles & floating texts
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].life <= 0) this.particles.splice(i, 1);
            }
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                this.floatingTexts[i].update();
                if (this.floatingTexts[i].life <= 0) this.floatingTexts.splice(i, 1);
            }
        }

        _findSegment(z) {
            return this.segments[Math.floor(z / SEGMENT_LENGTH) % this.segments.length];
        }

        _project(p, cameraX, cameraY, cameraZ) {
            p.camera.x = (p.world.x || 0) - cameraX;
            p.camera.y = (p.world.y || 0) - cameraY;
            p.camera.z = (p.world.z || 0) - cameraZ;
            p.screen.scale = CAMERA_DEPTH / p.camera.z;
            p.screen.x = Math.round((this.W / 2) + (p.screen.scale * p.camera.x * (this.W / 2)));
            p.screen.y = Math.round((this.H / 2) - (p.screen.scale * p.camera.y * (this.H / 2)));
            p.screen.w = Math.round((p.screen.scale * ROAD_WIDTH * (this.W / 2)));
        }

        draw() {
            const ctx = this.ctx;
            ctx.save();

            if (this.screenShake > 0) {
                ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
            }

            // 1. Synthwave Horizon & Sun Background
            this._drawBackground(ctx);

            // 2. Render Pseudo-3D Road
            this._drawRoad(ctx);

            // 3. Render Traffic Cars
            this._drawTraffic(ctx);

            // 4. Render Player Sports Car
            this._drawPlayerCar(ctx);

            // 5. Particles & Floating Texts
            this.particles.forEach(p => p.draw(ctx));
            this.floatingTexts.forEach(ft => ft.draw(ctx));

            // 6. HUD / Speedometer / Drift Meter
            this._drawHUD(ctx);

            // 7. Start & Game Over Screen
            if (this.state === STATE.START) {
                this._drawStartScreen(ctx);
            } else if (this.state === STATE.GAME_OVER) {
                this._drawGameOverScreen(ctx);
            }

            ctx.restore();
        }

        _drawBackground(ctx) {
            // Sky gradient
            const g = ctx.createLinearGradient(0, 0, 0, this.H * 0.5);
            g.addColorStop(0, '#060212');
            g.addColorStop(0.7, '#240638');
            g.addColorStop(1, '#ff007f');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, this.W, this.H * 0.5);

            // Glowing Synthwave Sun
            const sunX = this.W / 2;
            const sunY = this.H * 0.44;
            const sunR = 65;

            const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
            sunGrad.addColorStop(0, '#ffea00');
            sunGrad.addColorStop(0.75, '#ff007f');
            sunGrad.addColorStop(1, '#9c27b0');

            ctx.save();
            ctx.fillStyle = sunGrad;
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunR, Math.PI, 0);
            ctx.fill();

            // Sun horizon horizontal bars
            ctx.fillStyle = '#060212';
            for (let i = 0; i < 6; i++) {
                const ly = sunY - 38 + i * 7;
                ctx.fillRect(sunX - sunR - 10, ly, sunR * 2 + 20, 2 + i * 0.5);
            }
            ctx.restore();

            // Distant Mountains & City Skyline
            ctx.fillStyle = '#110522';
            ctx.beginPath();
            ctx.moveTo(0, this.H * 0.45);
            for (let x = 0; x <= this.W; x += 30) {
                const my = this.H * 0.45 - (Math.sin(x * 0.015) * 22 + (x % 60 === 0 ? 16 : 0));
                ctx.lineTo(x, my);
            }
            ctx.lineTo(this.W, this.H * 0.45);
            ctx.closePath();
            ctx.fill();
        }

        _drawRoad(ctx) {
            const baseSegment = this._findSegment(this.position);
            const basePercent = (this.position % SEGMENT_LENGTH) / SEGMENT_LENGTH;
            const cameraX = this.playerX * ROAD_WIDTH;
            const cameraY = CAMERA_HEIGHT + baseSegment.p1.world.y;
            let maxY = this.H;

            let x = 0;
            let dx = -(baseSegment.curve * basePercent);

            for (let n = 0; n < DRAW_DISTANCE; n++) {
                const segment = this.segments[(baseSegment.index + n) % this.segments.length];
                const looped = segment.index < baseSegment.index;
                const cameraZ = this.position - (looped ? this.trackLength : 0);

                this._project(segment.p1, cameraX - x, cameraY, cameraZ);
                this._project(segment.p2, cameraX - x - dx, cameraY, cameraZ);

                x += dx;
                dx += segment.curve;

                if (segment.p1.camera.z <= CAMERA_DEPTH || segment.p2.screen.y >= maxY) continue;

                // Render Segment Grass, Rumble, Road & Lane
                this._drawSegment(
                    ctx,
                    segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w,
                    segment.p2.screen.x, segment.p2.screen.y, segment.p2.screen.w,
                    segment.color
                );

                // Render Checkpoint Overhead Arch
                if (segment.isArch) {
                    this._drawArch(ctx, segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w, segment.archText);
                }

                maxY = segment.p2.screen.y;
            }
        }

        _drawSegment(ctx, x1, y1, w1, x2, y2, w2, color) {
            const r1 = w1 / Math.max(6, 2 * 3);
            const r2 = w2 / Math.max(6, 2 * 3);
            const l1 = w1 / 32;
            const l2 = w2 / 32;

            // Grass
            ctx.fillStyle = color.grass;
            ctx.fillRect(0, y2, this.W, y1 - y2);

            // Rumble Strip (Curbs)
            ctx.fillStyle = color.rumble;
            this._drawPolygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2);
            this._drawPolygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2);

            // Asphalt Road
            ctx.fillStyle = color.road;
            this._drawPolygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2);

            // Lane Divider
            if (color.lane) {
                ctx.fillStyle = color.lane;
                this._drawPolygon(ctx, x1 - l1, y1, x1 + l1, y1, x2 + l2, y2, x2 - l2, y2);
            }
        }

        _drawPolygon(ctx, x1, y1, x2, y2, x3, y3, x4, y4) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.lineTo(x4, y4);
            ctx.closePath();
            ctx.fill();
        }

        _drawArch(ctx, x, y, w, text) {
            const h = w * 0.45;
            ctx.save();
            ctx.strokeStyle = COLORS.CYAN;
            ctx.lineWidth = Math.max(2, w * 0.02);
            ctx.shadowColor = COLORS.CYAN;
            ctx.shadowBlur = 10;

            ctx.strokeRect(x - w * 0.75, y - h, w * 1.5, h);

            ctx.font = `${Math.max(8, Math.floor(w * 0.05))}px "Press Start 2P", monospace`;
            ctx.fillStyle = COLORS.GOLD;
            ctx.textAlign = 'center';
            ctx.fillText(text, x, y - h + 15);
            ctx.restore();
        }

        _drawTraffic(ctx) {
            const baseSegment = this._findSegment(this.position);
            this.cars.forEach(car => {
                if (car.z > this.position && car.z < this.position + DRAW_DISTANCE * SEGMENT_LENGTH) {
                    const seg = this._findSegment(car.z);
                    const scale = CAMERA_DEPTH / (car.z - this.position);
                    const cx = (this.W / 2) + (scale * (car.offset * ROAD_WIDTH - this.playerX * ROAD_WIDTH) * (this.W / 2));
                    const cy = seg.p1.screen.y;
                    const cw = scale * 1200;
                    const ch = scale * 600;

                    if (cy > 0 && cy < this.H) {
                        ctx.save();
                        ctx.fillStyle = car.color;
                        ctx.fillRect(cx - cw / 2, cy - ch, cw, ch);
                        // Tail lights
                        ctx.fillStyle = '#ff0033';
                        ctx.fillRect(cx - cw / 2 + 2, cy - 6, cw * 0.25, 4);
                        ctx.fillRect(cx + cw / 2 - cw * 0.25 - 2, cy - 6, cw * 0.25, 4);
                        ctx.restore();
                    }
                }
            });
        }

        _drawPlayerCar(ctx) {
            const cx = this.W / 2;
            const cy = this.H - 45;
            const carW = 96;
            const carH = 44;

            ctx.save();
            ctx.translate(cx, cy);

            // Car Tilt on turn / drift
            const tilt = (this.keyLeft ? -0.12 : (this.keyRight ? 0.12 : 0)) + (this.isDrifting ? (this.keyLeft ? -0.15 : 0.15) : 0);
            ctx.rotate(tilt);

            // Exhaust Nitro Flames
            if (this.nitroActive) {
                const fLen = Math.random() * 20 + 25;
                ctx.fillStyle = '#ff007f';
                ctx.shadowColor = '#ff007f';
                ctx.shadowBlur = 12;
                ctx.fillRect(-26, 12, 8, fLen);
                ctx.fillRect(18, 12, 8, fLen);
                ctx.fillStyle = '#00f0ff';
                ctx.fillRect(-24, 12, 4, fLen * 0.7);
                ctx.fillRect(20, 12, 4, fLen * 0.7);
            }

            // Car Body Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.ellipse(0, 12, carW * 0.55, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cyber Sports Car Chassis (Red & Black)
            ctx.fillStyle = '#e53935';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;

            // Main body
            ctx.beginPath();
            ctx.roundRect(-carW / 2, -carH / 2, carW, carH, 6);
            ctx.fill();
            ctx.stroke();

            // Rear bumper & grill
            ctx.fillStyle = '#111116';
            ctx.fillRect(-carW * 0.45, carH * 0.1, carW * 0.9, carH * 0.35);

            // Dual Cyber Tail Lights
            ctx.fillStyle = '#ff1744';
            ctx.shadowColor = '#ff1744';
            ctx.shadowBlur = 8;
            ctx.fillRect(-carW * 0.42, carH * 0.15, 20, 7);
            ctx.fillRect(carW * 0.42 - 20, carH * 0.15, 20, 7);
            ctx.shadowBlur = 0;

            // Rear spoiler
            ctx.fillStyle = '#b71c1c';
            ctx.fillRect(-carW * 0.48, -carH * 0.45, carW * 0.96, 6);

            // Rear Windshield glass
            ctx.fillStyle = '#00e5ff';
            ctx.beginPath();
            ctx.roundRect(-carW * 0.3, -carH * 0.35, carW * 0.6, 14, 3);
            ctx.fill();

            ctx.restore();
        }

        _drawHUD(ctx) {
            ctx.save();
            ctx.font = '10px "Press Start 2P", monospace';

            // Top Dashboard Glass
            ctx.fillStyle = 'rgba(10, 6, 24, 0.88)';
            ctx.fillRect(0, 0, this.W, 58);
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, 58);
            ctx.lineTo(this.W, 58);
            ctx.stroke();

            // Speedometer (KM/H)
            const speedKmh = Math.floor(this.speed * 0.016);
            ctx.fillStyle = COLORS.CYAN;
            ctx.shadowColor = COLORS.CYAN;
            ctx.shadowBlur = 8;
            ctx.fillText(`${speedKmh} KM/H`, 20, 36);

            // Timer (Countdown)
            ctx.textAlign = 'center';
            ctx.font = '13px "Press Start 2P", monospace';
            ctx.fillStyle = this.timeLeft <= 10 ? COLORS.RUMBLE_RED : COLORS.LANE_YELLOW;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fillText(`TIME: ${this.timeLeft.toFixed(1)}s`, this.W / 2, 38);

            // Score & Checkpoint
            ctx.textAlign = 'right';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillStyle = COLORS.GOLD;
            ctx.fillText(`SCORE: ${this.score}`, this.W - 20, 26);
            ctx.fillStyle = COLORS.PINK;
            ctx.fillText(`CHECKPOINT: ${this.currentCheckpoint}/4`, this.W - 20, 46);

            // Bottom Nitro & Drift Gauge
            const barW = 180;
            const barH = 12;
            const bx = this.W - barW - 20;
            const by = this.H - 35;

            ctx.fillStyle = 'rgba(14, 8, 28, 0.85)';
            ctx.strokeStyle = COLORS.PINK;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(bx, by, barW, barH);
            ctx.fillRect(bx, by, barW, barH);

            const fillW = (this.driftMeter / 100) * barW;
            ctx.fillStyle = this.nitroActive ? COLORS.CYAN : (this.driftMeter >= 40 ? COLORS.PINK : COLORS.LANE_YELLOW);
            ctx.fillRect(bx + 1, by + 1, fillW, barH - 2);

            ctx.font = '7px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(this.nitroActive ? 'NITRO ACTIVE!' : 'NITRO (DRIFT TO CHARGE)', bx, by - 6);

            ctx.restore();
        }

        _drawStartScreen(ctx) {
            ctx.save();
            const cx = this.W / 2;

            ctx.textAlign = 'center';
            ctx.font = '26px "Press Start 2P", monospace';
            ctx.fillStyle = COLORS.PINK;
            ctx.shadowColor = COLORS.PINK;
            ctx.shadowBlur = 18;
            ctx.fillText('PIXEL DRIFTER', cx, 150);
            ctx.shadowBlur = 0;

            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillStyle = COLORS.CYAN;
            ctx.fillText('RETRO SYNTHWAVE HIGHWAY RACER', cx, 185);

            // Instructions Box
            ctx.fillStyle = 'rgba(14, 8, 28, 0.9)';
            ctx.strokeStyle = COLORS.CYAN;
            ctx.lineWidth = 2;
            ctx.roundRect(cx - 200, 215, 400, 185, 8);
            ctx.fill();
            ctx.stroke();

            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';

            const startX = cx - 175;
            ctx.fillText('STEER:  A / D or ◀ ▶ ARROWS', startX, 245);
            ctx.fillText('GAS:    W or ▲ ARROW', startX, 275);
            ctx.fillText('DRIFT:  HOLD SPACE WHILE TURNING', startX, 305);
            ctx.fillText('NITRO:  SHIFT / N (WHEN CHARGED)', startX, 335);
            ctx.fillText(`BEST SCORE: ${this.highScore}`, startX, 375);

            // Start Button
            const btnX = cx - 130;
            const btnY = 430;
            const pulse = Math.sin(Date.now() * 0.008) * 0.15 + 0.85;

            ctx.fillStyle = '#00e676';
            ctx.globalAlpha = pulse;
            ctx.roundRect(btnX, btnY, 260, 52, 8);
            ctx.fill();

            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillStyle = '#060212';
            ctx.textAlign = 'center';
            ctx.fillText('▶ START RACE ◀', cx, btnY + 32);

            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = '#bcaaa4';
            ctx.fillText('(OR PRESS SPACEBAR / ENTER)', cx, btnY + 76);

            ctx.restore();
        }

        _drawGameOverScreen(ctx) {
            ctx.save();
            const cx = this.W / 2;

            ctx.textAlign = 'center';
            ctx.font = '26px "Press Start 2P", monospace';
            ctx.fillStyle = COLORS.RUMBLE_RED;
            ctx.shadowColor = COLORS.RUMBLE_RED;
            ctx.shadowBlur = 18;
            ctx.fillText('TIME EXPIRED!', cx, 160);
            ctx.shadowBlur = 0;

            // Summary Card
            ctx.fillStyle = 'rgba(14, 8, 28, 0.92)';
            ctx.strokeStyle = COLORS.CYAN;
            ctx.lineWidth = 2;
            ctx.roundRect(cx - 170, 200, 340, 160, 8);
            ctx.fill();
            ctx.stroke();

            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillStyle = COLORS.GOLD;
            ctx.fillText(`FINAL SCORE: ${this.score}`, cx, 240);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(`CHECKPOINTS: ${this.currentCheckpoint - 1}/4`, cx, 275);
            ctx.fillText(`BEST SCORE: ${this.highScore}`, cx, 310);

            // Replay Button
            const btnX = cx - 130;
            const btnY = 395;
            const pulse = Math.sin(Date.now() * 0.008) * 0.15 + 0.85;

            ctx.fillStyle = '#00e676';
            ctx.globalAlpha = pulse;
            ctx.roundRect(btnX, btnY, 260, 52, 8);
            ctx.fill();

            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillStyle = '#060212';
            ctx.fillText('▶ PLAY AGAIN ◀', cx, btnY + 32);

            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = '#bcaaa4';
            ctx.fillText('(OR PRESS SPACEBAR / ENTER)', cx, btnY + 76);

            ctx.restore();
        }

        run() {
            let last = performance.now();
            const loop = (now) => {
                const dt = now - last;
                last = now;

                this.update(dt);
                this.draw();
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        }
    }


    // ============================
    // BOOTSTRAP INITIALIZATION
    // ============================
    window.addEventListener('DOMContentLoaded', () => {
        const game = new PixelDrifterGame();
        game.run();
    });

})();

