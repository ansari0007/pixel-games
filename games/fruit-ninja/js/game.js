/* ==========================================================================
   PIXEL FRUIT NINJA — Retro Dojo Arcade Slicing Engine
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // ============================
    // CONSTANTS & GAME SETTINGS
    // ============================
    const CANVAS_W = 760;
    const CANVAS_H = 540;
    const GRAVITY = 0.36;

    // Fruit Types Configuration
    const FRUIT_TYPES = {
        WATERMELON: {
            name: 'WATERMELON',
            radius: 38,
            innerColor: '#ff2a5f',
            rindColor: '#2e7d32',
            points: 1,
            splatColor: 'rgba(255, 42, 95, 0.45)',
            particleColor: '#ff2a5f',
            hasSeeds: true
        },
        APPLE: {
            name: 'APPLE',
            radius: 28,
            innerColor: '#fff9c4',
            rindColor: '#e53935',
            points: 1,
            splatColor: 'rgba(229, 57, 53, 0.4)',
            particleColor: '#e53935',
            hasLeaf: true
        },
        ORANGE: {
            name: 'ORANGE',
            radius: 30,
            innerColor: '#ff9800',
            rindColor: '#e65100',
            points: 1,
            splatColor: 'rgba(255, 152, 0, 0.45)',
            particleColor: '#ff9800',
            hasSegments: true
        },
        BANANA: {
            name: 'BANANA',
            radius: 26,
            innerColor: '#fffde7',
            rindColor: '#ffea00',
            points: 1,
            splatColor: 'rgba(255, 234, 0, 0.4)',
            particleColor: '#ffea00',
            isBanana: true
        },
        STRAWBERRY: {
            name: 'STRAWBERRY',
            radius: 22,
            innerColor: '#ff1744',
            rindColor: '#d50000',
            points: 2,
            splatColor: 'rgba(255, 23, 68, 0.45)',
            particleColor: '#ff1744',
            hasSeeds: true
        },
        PINEAPPLE: {
            name: 'PINEAPPLE',
            radius: 34,
            innerColor: '#ffee58',
            rindColor: '#ff8f00',
            points: 2,
            splatColor: 'rgba(255, 143, 0, 0.4)',
            particleColor: '#ffee58',
            hasSpikes: true
        },
        COCONUT: {
            name: 'COCONUT',
            radius: 32,
            innerColor: '#ffffff',
            rindColor: '#5d4037',
            points: 2,
            splatColor: 'rgba(255, 255, 255, 0.4)',
            particleColor: '#ffffff',
            isCoconut: true
        },
        BOMB: {
            name: 'BOMB',
            radius: 26,
            innerColor: '#1a1a1a',
            rindColor: '#424242',
            points: 0,
            isBomb: true
        }
    };

    const FRUIT_KEYS = ['WATERMELON', 'APPLE', 'ORANGE', 'BANANA', 'STRAWBERRY', 'PINEAPPLE', 'COCONUT'];

    // Blade Styles
    const BLADE_STYLES = [
        { name: 'KATANA', color: '#00f0ff', glow: '#00e5ff', core: '#ffffff', spark: '#80d8ff' },
        { name: 'FIRE',   color: '#ff5722', glow: '#ff9100', core: '#fff59d', spark: '#ffea00' },
        { name: 'RAINBOW',color: 'rainbow', glow: '#ff00ff', core: '#ffffff', spark: '#ffff00' }
    ];

    // Game States
    const STATE = {
        START: 'START',
        PLAYING: 'PLAYING',
        GAME_OVER: 'GAME_OVER'
    };


    // ============================
    // PROCEDURAL AUDIO SYNTHESIZER
    // ============================
    const Sound = {
        ctx: null,
        enabled: true,

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
        },

        toggle() {
            this.enabled = !this.enabled;
            return this.enabled;
        },

        play(type, arg = 0) {
            if (!this.enabled || !this.ctx) return;
            const t = this.ctx.currentTime;

            switch (type) {
                case 'swoosh': {
                    // Realistic katana air whoosh using noise buffer + bandpass sweep
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
                    filter.frequency.setValueAtTime(800 + Math.random() * 400, t);
                    filter.frequency.exponentialRampToValueAtTime(2200, t + 0.1);
                    filter.Q.value = 3.0;

                    const gain = this.ctx.createGain();
                    gain.gain.setValueAtTime(0.2, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

                    whiteNoise.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);

                    whiteNoise.start(t);
                    whiteNoise.stop(t + 0.12);
                    break;
                }
                case 'splat': {
                    // Juicy squish slice sound
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(450 + Math.random() * 200, t);
                    osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);
                    gain.gain.setValueAtTime(0.25, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.13);
                    break;
                }
                case 'critical': {
                    // Rare golden critical slice chime
                    const freqs = [587.33, 880, 1174.66, 1760]; // D5, A5, D6, A6
                    freqs.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(f, t + i * 0.05);
                        gain.gain.setValueAtTime(0.2, t + i * 0.05);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.3);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.05);
                        osc.stop(t + i * 0.05 + 0.32);
                    });
                    break;
                }
                case 'combo': {
                    // Ascending combo bell chime
                    const baseF = 440 + arg * 70;
                    [baseF, baseF * 1.25, baseF * 1.5].forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(f, t + i * 0.06);
                        gain.gain.setValueAtTime(0.2, t + i * 0.06);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.25);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.06);
                        osc.stop(t + i * 0.06 + 0.28);
                    });
                    break;
                }
                case 'explosion': {
                    // Big bomb detonation rumble
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(130, t);
                    osc.frequency.exponentialRampToValueAtTime(30, t + 0.6);
                    gain.gain.setValueAtTime(0.4, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.66);
                    break;
                }
                case 'strike': {
                    // Harsh low buzzer for missed fruit
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(90, t);
                    osc.frequency.linearRampToValueAtTime(70, t + 0.22);
                    gain.gain.setValueAtTime(0.18, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.23);
                    break;
                }
            }
        }
    };


    // ============================
    // VISUAL DECORATIONS: SPLATS & PARTICLES
    // ============================
    class SplatDecal {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.radius = Math.random() * 24 + 20;
            this.blobs = [];
            for (let i = 0; i < 7; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * this.radius;
                const r = Math.random() * 12 + 6;
                this.blobs.push({ ox: Math.cos(angle) * dist, oy: Math.sin(angle) * dist, r });
            }
            // Drips
            this.drips = [];
            for (let i = 0; i < 3; i++) {
                const ox = (Math.random() - 0.5) * this.radius;
                const len = Math.random() * 25 + 15;
                const w = Math.random() * 3 + 2;
                this.drips.push({ ox, len, w });
            }
            this.alpha = 1;
            this.life = 7000; // 7 seconds fade
        }

        update(dt) {
            this.life -= dt;
            if (this.life < 2000) {
                this.alpha = Math.max(0, this.life / 2000);
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;

            // Center blob
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Surrounding splat blobs
            this.blobs.forEach(b => {
                ctx.beginPath();
                ctx.arc(this.x + b.ox, this.y + b.oy, b.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // Downward juice drips
            this.drips.forEach(d => {
                ctx.fillRect(this.x + d.ox, this.y, d.w, d.len);
                ctx.beginPath();
                ctx.arc(this.x + d.ox + d.w / 2, this.y + d.len, d.w * 0.8, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.restore();
        }
    }

    class Particle {
        constructor(x, y, vx, vy, size, color, isSpark = false) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.size = size;
            this.color = color;
            this.isSpark = isSpark;
            this.alpha = 1;
            this.life = 1;
            this.decay = isSpark ? (Math.random() * 0.04 + 0.03) : (Math.random() * 0.02 + 0.015);
            this.gravity = isSpark ? 0.05 : 0.28;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            this.life -= this.decay;
            this.alpha = Math.max(0, this.life);
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            if (this.isSpark) {
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 6;
                ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
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
            this.alpha = 1;
            this.life = 1;
            this.vy = -1.8;
        }

        update() {
            this.y += this.vy;
            this.life -= 0.02;
            this.alpha = Math.max(0, this.life);
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
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
    // FRUIT & SLICED HALVES
    // ============================
    class Fruit {
        constructor(typeKey, x, y, vx, vy, isFloating = false) {
            this.type = FRUIT_TYPES[typeKey];
            this.typeKey = typeKey;
            this.x = x;
            this.y = y;
            this.baseY = y;
            this.vx = vx;
            this.vy = vy;
            this.isFloating = isFloating;
            this.floatOffset = Math.random() * Math.PI * 2;
            this.radius = this.type.radius;
            this.angle = Math.random() * Math.PI * 2;
            this.angularVelocity = (Math.random() - 0.5) * 0.08;
            this.isSliced = false;
            this.isBomb = !!this.type.isBomb;
            this.fuseTimer = 0;
            this.sparkPositions = [];
        }

        update() {
            if (this.isFloating) {
                this.y = this.baseY + Math.sin(Date.now() * 0.003 + this.floatOffset) * 6;
                this.angle += this.angularVelocity;
                if (this.isBomb) {
                    this.fuseTimer += 0.2;
                }
                return;
            }

            this.x += this.vx;
            this.y += this.vy;
            this.vy += GRAVITY;
            this.angle += this.angularVelocity;

            if (this.isBomb) {
                this.fuseTimer += 0.2;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            if (this.isBomb) {
                this._drawBomb(ctx);
            } else {
                this._drawWholeFruit(ctx);
            }

            ctx.restore();
        }

        _drawWholeFruit(ctx) {
            const r = this.radius;

            // Fruit Shadow
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(4, 4, r, r * 0.9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (this.type.isBanana) {
                // Curved yellow banana
                ctx.fillStyle = this.type.rindColor;
                ctx.beginPath();
                ctx.ellipse(0, 0, r * 1.3, r * 0.65, Math.PI / 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#f57f17';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // Tips
                ctx.fillStyle = '#4e342e';
                ctx.fillRect(r * 0.8, -r * 0.5, 6, 6);
                ctx.fillRect(-r * 0.8, r * 0.5, 6, 6);
                return;
            }

            if (this.typeKey === 'WATERMELON') {
                // Outer green rind
                ctx.fillStyle = this.type.rindColor;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();

                // Darker green stripes
                ctx.strokeStyle = '#1b5e20';
                ctx.lineWidth = 4;
                for (let i = -r + 10; i < r; i += 16) {
                    ctx.beginPath();
                    ctx.arc(0, 0, r - 2, (i / r) * 0.5, (i / r) * 0.5 + 0.3);
                    ctx.stroke();
                }

                ctx.strokeStyle = '#1b5e20';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.stroke();
                return;
            }

            // General round fruits (Apple, Orange, Strawberry, Pineapple, Coconut)
            ctx.fillStyle = this.type.rindColor;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            // Shiny 3D highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.beginPath();
            ctx.arc(-r * 0.3, -r * 0.3, r * 0.35, 0, Math.PI * 2);
            ctx.fill();

            // Fruit specific decorations
            if (this.type.hasLeaf) {
                // Apple Stem & Green Leaf
                ctx.fillStyle = '#4e342e';
                ctx.fillRect(-2, -r - 6, 4, 8);
                ctx.fillStyle = '#43a047';
                ctx.beginPath();
                ctx.ellipse(5, -r - 4, 6, 3, Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type.hasSeeds) {
                // Strawberry seeds
                ctx.fillStyle = '#ffee58';
                const seeds = [[-6, -6], [6, -8], [-10, 4], [8, 4], [0, 8], [-4, -14], [4, -14]];
                seeds.forEach(([sx, sy]) => {
                    ctx.fillRect(sx, sy, 2.5, 2.5);
                });
                // Green top crown
                ctx.fillStyle = '#43a047';
                ctx.beginPath();
                ctx.moveTo(-12, -r + 4);
                ctx.lineTo(-4, -r - 5);
                ctx.lineTo(0, -r + 2);
                ctx.lineTo(6, -r - 5);
                ctx.lineTo(12, -r + 4);
                ctx.closePath();
                ctx.fill();
            } else if (this.type.hasSpikes) {
                // Pineapple spiky texture
                ctx.strokeStyle = '#e65100';
                ctx.lineWidth = 2;
                for (let i = -r + 8; i < r; i += 12) {
                    ctx.beginPath();
                    ctx.moveTo(-r + 6, i);
                    ctx.lineTo(r - 6, i);
                    ctx.stroke();
                }
                // Crown leaves
                ctx.fillStyle = '#2e7d32';
                ctx.beginPath();
                ctx.moveTo(-10, -r);
                ctx.lineTo(-6, -r - 16);
                ctx.lineTo(0, -r - 20);
                ctx.lineTo(6, -r - 16);
                ctx.lineTo(10, -r);
                ctx.closePath();
                ctx.fill();
            }
        }

        _drawBomb(ctx) {
            const r = this.radius;

            // Bomb body (dark sphere)
            const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
            g.addColorStop(0, '#555555');
            g.addColorStop(0.7, '#1a1a1a');
            g.addColorStop(1, '#000000');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            // Skull & crossbones icon
            ctx.fillStyle = '#ff2a5f';
            ctx.font = '14px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('☠', 0, 1);

            // Metal neck cap
            ctx.fillStyle = '#757575';
            ctx.fillRect(-6, -r - 4, 12, 6);

            // Fuse rope
            ctx.strokeStyle = '#d7ccc8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -r - 4);
            ctx.quadraticCurveTo(8, -r - 14, 14, -r - 18);
            ctx.stroke();

            // Sizzling spark at end of fuse
            const sparkX = 14;
            const sparkY = -r - 18;
            const sparkCol = Math.sin(this.fuseTimer * 2) > 0 ? '#ffea00' : '#ff3d00';
            ctx.fillStyle = sparkCol;
            ctx.shadowColor = sparkCol;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 5 + Math.sin(this.fuseTimer * 3) * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    class SlicedHalf {
        constructor(fruit, halfIndex, sliceAngle) {
            this.type = fruit.type;
            this.x = fruit.x;
            this.y = fruit.y;
            this.sliceAngle = sliceAngle;
            this.halfIndex = halfIndex; // 0 = right/top half, 1 = left/bottom half

            // Impulse perpendicular to the slice cut line
            const normalAngle = sliceAngle + (halfIndex === 0 ? Math.PI / 2 : -Math.PI / 2);
            const impulse = Math.random() * 2.5 + 4.5;
            this.vx = fruit.vx * 0.7 + Math.cos(normalAngle) * impulse;
            this.vy = fruit.vy * 0.7 + Math.sin(normalAngle) * impulse;

            this.radius = fruit.radius;
            this.angle = sliceAngle;
            this.angularVelocity = (halfIndex === 0 ? 1 : -1) * (Math.random() * 0.08 + 0.08);
            this.alpha = 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += GRAVITY;
            this.angle += this.angularVelocity;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            const r = this.radius;

            // Clip half-circle along the slice cut (y = 0)
            ctx.beginPath();
            if (this.halfIndex === 0) {
                // Top half
                ctx.rect(-r - 4, -r - 4, (r + 4) * 2, r + 4);
            } else {
                // Bottom half
                ctx.rect(-r - 4, 0, (r + 4) * 2, r + 4);
            }
            ctx.clip();

            // Outer rind
            ctx.fillStyle = this.type.rindColor;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            // Inner flesh / pulp
            ctx.fillStyle = this.type.innerColor;
            ctx.beginPath();
            ctx.arc(0, 0, r - 4, 0, Math.PI * 2);
            ctx.fill();

            // Seeds / details inside sliced pulp
            if (this.type.hasSeeds) {
                ctx.fillStyle = '#111111';
                const yOff = this.halfIndex === 0 ? -r * 0.4 : r * 0.4;
                ctx.fillRect(-8, yOff, 3, 3);
                ctx.fillRect(0, yOff * 0.8, 3, 3);
                ctx.fillRect(8, yOff, 3, 3);
            } else if (this.type.hasSegments) {
                ctx.strokeStyle = '#fff3e0';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-r + 6, 0);
                ctx.lineTo(r - 6, 0);
                ctx.stroke();
            }

            // Fresh cut highlight line on the severed edge
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-r, 0);
            ctx.lineTo(r, 0);
            ctx.stroke();

            ctx.restore();
        }
    }


    // ============================
    // MAIN GAME CONTROLLER
    // ============================
    class FruitNinjaGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;

            this.W = CANVAS_W;
            this.H = CANVAS_H;

            // Game State
            this.state = STATE.START;
            this.score = 0;
            this.highScore = parseInt(localStorage.getItem('pixel_fruit_ninja_high') || '0', 10);
            this.strikes = 0; // 0..3 strikes
            this.fruitsSlicedTotal = 0;

            // Blade Configuration
            this.bladeIndex = 0;
            this.trailPoints = []; // [{ x, y, time }]
            this.isPointerDown = false;
            this.rainbowHue = 0;

            // Combo Detection
            this.comboCounter = 0;
            this.lastSliceTime = 0;
            this.bestCombo = 0;

            // Game Entities
            this.fruits = [];
            this.slicedHalves = [];
            this.splats = [];
            this.particles = [];
            this.floatingTexts = [];

            // Spawner System
            this.spawnTimer = 0;
            this.spawnInterval = 2200; // ms
            this.waveCount = 0;

            // Start & Game Over interactive buttons (Fruit to slice)
            this.startWatermelon = null;
            this.startBomb = null;
            this.replayWatermelon = null;

            // Visual FX
            this.screenShake = 0;
            this.flashAlpha = 0;

            this._initCanvas();
            this._initDOM();
            this._initInputHandlers();
            this._setupStartScreen();
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
            const btnBlade = document.getElementById('btn-blade');
            const btnSound = document.getElementById('btn-sound');

            if (btnBlade) {
                btnBlade.addEventListener('click', () => {
                    this.bladeIndex = (this.bladeIndex + 1) % BLADE_STYLES.length;
                    btnBlade.textContent = `⚔️ BLADE: ${BLADE_STYLES[this.bladeIndex].name}`;
                    Sound.play('swoosh');
                });
            }

            if (btnSound) {
                btnSound.addEventListener('click', () => {
                    const on = Sound.toggle();
                    btnSound.textContent = on ? '🔊 SOUND' : '🔇 MUTED';
                });
            }
        }

        _initInputHandlers() {
            const getCanvasPos = (clientX, clientY) => {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = CANVAS_W / rect.width;
                const scaleY = CANVAS_H / rect.height;
                return {
                    x: (clientX - rect.left) * scaleX,
                    y: (clientY - rect.top) * scaleY
                };
            };

            const onPointerDown = (clientX, clientY) => {
                Sound.init();
                this.isPointerDown = true;
                const pos = getCanvasPos(clientX, clientY);
                this.trailPoints = [{ x: pos.x, y: pos.y, time: performance.now() }];

                // 1. Direct Click / Tap in START Screen
                if (this.state === STATE.START) {
                    // Click on Watermelon
                    if (this.startWatermelon && !this.startWatermelon.isSliced) {
                        if (Math.hypot(pos.x - this.startWatermelon.x, pos.y - this.startWatermelon.y) < this.startWatermelon.radius + 30) {
                            this._sliceFruit(this.startWatermelon, -Math.PI / 4);
                            setTimeout(() => this.startPlaying(), 250);
                            return;
                        }
                    }
                    // Click on Bomb
                    if (this.startBomb && !this.startBomb.isSliced) {
                        if (Math.hypot(pos.x - this.startBomb.x, pos.y - this.startBomb.y) < this.startBomb.radius + 20) {
                            this._triggerBombDetonation(this.startBomb);
                            return;
                        }
                    }
                    // Click on START GAME button area (center bottom)
                    const btnX = CANVAS_W / 2 - 120;
                    const btnY = 445;
                    if (pos.x >= btnX && pos.x <= btnX + 240 && pos.y >= btnY && pos.y <= btnY + 50) {
                        if (this.startWatermelon && !this.startWatermelon.isSliced) {
                            this._sliceFruit(this.startWatermelon, -Math.PI / 4);
                        }
                        setTimeout(() => this.startPlaying(), 250);
                        return;
                    }
                }

                // 2. Direct Click / Tap in GAME OVER Screen
                if (this.state === STATE.GAME_OVER) {
                    // Click on Replay Watermelon
                    if (this.replayWatermelon && !this.replayWatermelon.isSliced) {
                        if (Math.hypot(pos.x - this.replayWatermelon.x, pos.y - this.replayWatermelon.y) < this.replayWatermelon.radius + 30) {
                            this._sliceFruit(this.replayWatermelon, -Math.PI / 4);
                            setTimeout(() => this.startPlaying(), 250);
                            return;
                        }
                    }
                    // Click on PLAY AGAIN button
                    const btnX = CANVAS_W / 2 - 120;
                    const btnY = 455;
                    if (pos.x >= btnX && pos.x <= btnX + 240 && pos.y >= btnY && pos.y <= btnY + 50) {
                        if (this.replayWatermelon && !this.replayWatermelon.isSliced) {
                            this._sliceFruit(this.replayWatermelon, -Math.PI / 4);
                        }
                        setTimeout(() => this.startPlaying(), 250);
                        return;
                    }
                }

                // 3. Direct Click / Tap on fruits in PLAYING state
                if (this.state === STATE.PLAYING) {
                    for (let i = this.fruits.length - 1; i >= 0; i--) {
                        const fruit = this.fruits[i];
                        if (!fruit.isSliced && Math.hypot(pos.x - fruit.x, pos.y - fruit.y) < fruit.radius + 15) {
                            if (fruit.isBomb) {
                                this._triggerBombDetonation(fruit);
                                return;
                            } else {
                                this._sliceFruit(fruit, -Math.PI / 4);
                                this.fruits.splice(i, 1);
                                return;
                            }
                        }
                    }
                }
            };

            const onPointerMove = (clientX, clientY) => {
                const pos = getCanvasPos(clientX, clientY);
                const now = performance.now();

                // Add to blade trail if mouse button is held OR if mouse is moving fast
                if (this.trailPoints.length > 0) {
                    const last = this.trailPoints[this.trailPoints.length - 1];
                    const dist = Math.hypot(pos.x - last.x, pos.y - last.y);

                    // Slicing allowed when pointer is down OR swift movement (dist > 7)
                    if (this.isPointerDown || dist > 7) {
                        this.trailPoints.push({ x: pos.x, y: pos.y, time: now });
                        this._checkSliceCollision(last, pos);

                        // Occasional blade swoosh sound when swiping swiftly
                        if (dist > 30 && Math.random() < 0.35) {
                            Sound.play('swoosh');
                        }
                    }
                } else if (this.isPointerDown) {
                    this.trailPoints.push({ x: pos.x, y: pos.y, time: now });
                }
            };

            const onPointerUp = () => {
                this.isPointerDown = false;
                this._finishComboStroke();
            };

            // Mouse Events
            this.canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
            window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
            window.addEventListener('mouseup', onPointerUp);

            // Touch Events
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const t = e.touches[0];
                onPointerDown(t.clientX, t.clientY);
            }, { passive: false });

            window.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const t = e.touches[0];
                onPointerMove(t.clientX, t.clientY);
            }, { passive: false });

            window.addEventListener('touchend', onPointerUp);

            // Keyboard Space / Enter to Start or Replay
            window.addEventListener('keydown', (e) => {
                if (e.code === 'Space' || e.code === 'Enter') {
                    e.preventDefault();
                    if (this.state === STATE.START) {
                        if (this.startWatermelon && !this.startWatermelon.isSliced) {
                            this._sliceFruit(this.startWatermelon, -Math.PI / 4);
                        }
                        setTimeout(() => this.startPlaying(), 250);
                    } else if (this.state === STATE.GAME_OVER) {
                        if (this.replayWatermelon && !this.replayWatermelon.isSliced) {
                            this._sliceFruit(this.replayWatermelon, -Math.PI / 4);
                        }
                        setTimeout(() => this.startPlaying(), 250);
                    }
                }
            });
        }

        _setupStartScreen() {
            this.state = STATE.START;
            this.fruits = [];
            this.slicedHalves = [];
            this.splats = [];
            this.particles = [];
            this.floatingTexts = [];

            // Spinning Watermelon to slice and start (isFloating = true!)
            this.startWatermelon = new Fruit('WATERMELON', CANVAS_W * 0.35, CANVAS_H * 0.54, 0, 0, true);
            this.startWatermelon.angularVelocity = 0.035;

            // Spinning Bomb with "DON'T SLICE!" (isFloating = true!)
            this.startBomb = new Fruit('BOMB', CANVAS_W * 0.65, CANVAS_H * 0.54, 0, 0, true);
            this.startBomb.angularVelocity = -0.035;
        }

        startPlaying() {
            this.state = STATE.PLAYING;
            this.score = 0;
            this.strikes = 0;
            this.fruitsSlicedTotal = 0;
            this.fruits = [];
            this.slicedHalves = [];
            this.comboCounter = 0;
            this.spawnTimer = 400;
            this.spawnInterval = 2200;
            this.waveCount = 0;

            Sound.play('swoosh');
            this.floatingTexts.push(new FloatingText(CANVAS_W / 2, CANVAS_H / 2, 'READY? SLICE!', '#00f0ff', 18));
        }

        _setupGameOver() {
            this.state = STATE.GAME_OVER;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('pixel_fruit_ninja_high', this.highScore);
            }

            // Interactive watermelon to slice and restart (isFloating = true!)
            this.replayWatermelon = new Fruit('WATERMELON', CANVAS_W / 2, CANVAS_H * 0.68, 0, 0, true);
            this.replayWatermelon.angularVelocity = 0.035;
        }

        _checkSliceCollision(p1, p2) {
            const sliceAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

            // 1. Check Start Screen Fruits
            if (this.state === STATE.START) {
                if (this.startWatermelon && !this.startWatermelon.isSliced) {
                    if (this._lineIntersectsCircle(p1, p2, this.startWatermelon, this.startWatermelon.radius)) {
                        this._sliceFruit(this.startWatermelon, sliceAngle);
                        setTimeout(() => this.startPlaying(), 300);
                        return;
                    }
                }
                if (this.startBomb && !this.startBomb.isSliced) {
                    if (this._lineIntersectsCircle(p1, p2, this.startBomb, this.startBomb.radius)) {
                        this._triggerBombDetonation(this.startBomb);
                        return;
                    }
                }
                return;
            }

            // 2. Check Game Over Screen Fruit
            if (this.state === STATE.GAME_OVER) {
                if (this.replayWatermelon && !this.replayWatermelon.isSliced) {
                    if (this._lineIntersectsCircle(p1, p2, this.replayWatermelon, this.replayWatermelon.radius)) {
                        this._sliceFruit(this.replayWatermelon, sliceAngle);
                        setTimeout(() => this.startPlaying(), 300);
                        return;
                    }
                }
                return;
            }

            // 3. Check In-Game Active Fruits
            if (this.state === STATE.PLAYING) {
                for (let i = this.fruits.length - 1; i >= 0; i--) {
                    const fruit = this.fruits[i];
                    if (!fruit.isSliced && this._lineIntersectsCircle(p1, p2, fruit, fruit.radius)) {
                        if (fruit.isBomb) {
                            this._triggerBombDetonation(fruit);
                            return;
                        } else {
                            this._sliceFruit(fruit, sliceAngle);
                            this.fruits.splice(i, 1);
                        }
                    }
                }
            }
        }

        _lineIntersectsCircle(p1, p2, circle, radius) {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy);
            if (len === 0) return false;

            const u = ((circle.x - p1.x) * dx + (circle.y - p1.y) * dy) / (len * len);
            const clampedU = Math.max(0, Math.min(1, u));

            const closestX = p1.x + clampedU * dx;
            const closestY = p1.y + clampedU * dy;

            const dist = Math.hypot(circle.x - closestX, circle.y - closestY);
            return dist <= radius;
        }

        _sliceFruit(fruit, sliceAngle) {
            fruit.isSliced = true;
            this.fruitsSlicedTotal++;

            // Halves
            this.slicedHalves.push(new SlicedHalf(fruit, 0, sliceAngle));
            this.slicedHalves.push(new SlicedHalf(fruit, 1, sliceAngle));

            // Wall Splat Decal
            this.splats.push(new SplatDecal(fruit.x, fruit.y, fruit.type.splatColor));

            // Particle burst (pulp, seeds, blade spark)
            for (let i = 0; i < 18; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 6 + 2;
                this.particles.push(new Particle(
                    fruit.x, fruit.y,
                    Math.cos(angle) * speed, Math.sin(angle) * speed,
                    Math.random() * 6 + 3,
                    fruit.type.particleColor
                ));
            }

            // Blade sparks
            const curBlade = BLADE_STYLES[this.bladeIndex];
            for (let i = 0; i < 8; i++) {
                const angle = sliceAngle + (Math.random() - 0.5) * 1.5;
                const speed = Math.random() * 8 + 3;
                this.particles.push(new Particle(
                    fruit.x, fruit.y,
                    Math.cos(angle) * speed, Math.sin(angle) * speed,
                    Math.random() * 4 + 2,
                    curBlade.spark,
                    true
                ));
            }

            // Sound
            Sound.play('splat');

            // Scoring & Critical Hit Chance
            let pts = fruit.type.points;
            const isCritical = Math.random() < 0.06; // 6% critical chance
            if (isCritical) {
                pts += 10;
                Sound.play('critical');
                this.floatingTexts.push(new FloatingText(fruit.x, fruit.y - 20, 'CRITICAL! +10', '#ffd700', 14));
            } else {
                this.floatingTexts.push(new FloatingText(fruit.x, fruit.y - 12, `+${pts}`, fruit.type.particleColor, 11));
            }

            this.score += pts;

            // Track Combo in current stroke
            const now = performance.now();
            if (now - this.lastSliceTime < 380) {
                this.comboCounter++;
            } else {
                this.comboCounter = 1;
            }
            this.lastSliceTime = now;

            // Screen shake
            this.screenShake = 4;
        }

        _finishComboStroke() {
            if (this.comboCounter >= 3) {
                const bonus = this.comboCounter;
                this.score += bonus;

                if (this.comboCounter > this.bestCombo) {
                    this.bestCombo = this.comboCounter;
                }

                Sound.play('combo', this.comboCounter);

                const bannerText = this.comboCounter >= 5 ? `MEGA ${this.comboCounter}x COMBO! +${bonus}` : `${this.comboCounter}x COMBO! +${bonus}`;
                this.floatingTexts.push(new FloatingText(CANVAS_W / 2, CANVAS_H * 0.35, bannerText, '#00f0ff', 16));
            }
            this.comboCounter = 0;
        }

        _triggerBombDetonation(bomb) {
            this.flashAlpha = 1;
            this.screenShake = 22;
            Sound.play('explosion');

            // Spawn explosion particles
            for (let i = 0; i < 60; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 12 + 4;
                const col = ['#ff2a5f', '#ff9800', '#ffea00', '#ffffff'][Math.floor(Math.random() * 4)];
                this.particles.push(new Particle(bomb.x, bomb.y, Math.cos(angle) * speed, Math.sin(angle) * speed, Math.random() * 7 + 4, col, true));
            }

            this.floatingTexts.push(new FloatingText(CANVAS_W / 2, CANVAS_H / 2, 'BOOM! GAME OVER', '#ff2a5f', 18));
            setTimeout(() => this._setupGameOver(), 600);
        }

        _spawnFruitVolley() {
            this.waveCount++;

            // Volley count scales gradually from 1 to 4 fruits
            let count = 1;
            if (this.score >= 10) count = Math.floor(Math.random() * 2) + 1;
            if (this.score >= 30) count = Math.floor(Math.random() * 3) + 1;
            if (this.score >= 60) count = Math.floor(Math.random() * 3) + 2;

            // Bomb chance scales with score
            const bombChance = this.score > 25 ? Math.min(0.28, 0.12 + (this.score / 400)) : 0;
            const spawnBombThisWave = Math.random() < bombChance;

            for (let i = 0; i < count; i++) {
                const x = Math.random() * (CANVAS_W - 240) + 120;
                const y = CANVAS_H + 40;
                const targetApexY = Math.random() * 120 + 90;

                // Physics velocity formula: vy = -sqrt(2 * g * height)
                const height = y - targetApexY;
                const vy = -Math.sqrt(2 * GRAVITY * height);
                const vx = (CANVAS_W / 2 - x) * 0.012 + (Math.random() - 0.5) * 3;

                // Pick fruit type or bomb
                let typeKey = FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)];
                if (i === 0 && spawnBombThisWave) {
                    typeKey = 'BOMB';
                }

                // Stagger spawn delay slightly for organic feel
                setTimeout(() => {
                    if (this.state === STATE.PLAYING) {
                        this.fruits.push(new Fruit(typeKey, x, y, vx, vy));
                    }
                }, i * 160);
            }
        }

        update(dt) {
            // Decay screen shake & flash
            if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - 0.4);
            if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - 0.035);

            // Cycle rainbow hue
            this.rainbowHue = (this.rainbowHue + 3) % 360;

            // Clean expired blade trail points (> 180ms)
            const now = performance.now();
            while (this.trailPoints.length > 0 && now - this.trailPoints[0].time > 180) {
                this.trailPoints.shift();
            }

            // Update Splats
            for (let i = this.splats.length - 1; i >= 0; i--) {
                this.splats[i].update(dt);
                if (this.splats[i].life <= 0) {
                    this.splats.splice(i, 1);
                }
            }

            // Update Start Screen entities
            if (this.state === STATE.START) {
                if (this.startWatermelon) this.startWatermelon.update();
                if (this.startBomb) this.startBomb.update();
            }

            // Update Game Over entities
            if (this.state === STATE.GAME_OVER) {
                if (this.replayWatermelon) this.replayWatermelon.update();
            }

            // Update Playing state
            if (this.state === STATE.PLAYING) {
                this.spawnTimer -= dt;
                if (this.spawnTimer <= 0) {
                    this._spawnFruitVolley();
                    this.spawnInterval = Math.max(1200, 2400 - (this.score * 12));
                    this.spawnTimer = this.spawnInterval;
                }

                // Update active fruits
                for (let i = this.fruits.length - 1; i >= 0; i--) {
                    const fruit = this.fruits[i];
                    fruit.update();

                    // Check if fallen below screen uncut
                    if (fruit.y > CANVAS_H + 80) {
                        if (!fruit.isBomb && !fruit.isSliced) {
                            // Player missed a fruit!
                            this.strikes++;
                            Sound.play('strike');
                            this.floatingTexts.push(new FloatingText(fruit.x, CANVAS_H - 40, 'MISS!', '#ff2a5f', 12));

                            if (this.strikes >= 3) {
                                this._setupGameOver();
                            }
                        }
                        this.fruits.splice(i, 1);
                    }
                }
            }

            // Update Sliced Halves
            for (let i = this.slicedHalves.length - 1; i >= 0; i--) {
                const half = this.slicedHalves[i];
                half.update();
                if (half.y > CANVAS_H + 100) {
                    this.slicedHalves.splice(i, 1);
                }
            }

            // Update Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].life <= 0) {
                    this.particles.splice(i, 1);
                }
            }

            // Update Floating Texts
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                this.floatingTexts[i].update();
                if (this.floatingTexts[i].life <= 0) {
                    this.floatingTexts.splice(i, 1);
                }
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.save();

            // Screen shake translation
            if (this.screenShake > 0) {
                const ox = (Math.random() - 0.5) * this.screenShake;
                const oy = (Math.random() - 0.5) * this.screenShake;
                ctx.translate(ox, oy);
            }

            // 1. Dojo Wooden Background
            this._drawDojoBackground(ctx);

            // 2. Wall Splats Decal Layer
            this.splats.forEach(s => s.draw(ctx));

            // 3. Fruits & Sliced Halves
            if (this.state === STATE.START) {
                if (this.startWatermelon) this.startWatermelon.draw(ctx);
                if (this.startBomb) this.startBomb.draw(ctx);
                this._drawStartScreenHUD(ctx);
            } else if (this.state === STATE.GAME_OVER) {
                if (this.replayWatermelon) this.replayWatermelon.draw(ctx);
                this._drawGameOverHUD(ctx);
            } else if (this.state === STATE.PLAYING) {
                this.fruits.forEach(f => f.draw(ctx));
            }

            this.slicedHalves.forEach(h => h.draw(ctx));

            // 4. Particles & Floating Texts
            this.particles.forEach(p => p.draw(ctx));
            this.floatingTexts.forEach(ft => ft.draw(ctx));

            // 5. Razor Blade Slash Trail
            this._drawBladeTrail(ctx);

            // 6. Top In-Game HUD (Score & Strikes)
            if (this.state === STATE.PLAYING) {
                this._drawPlayingHUD(ctx);
            }

            // 7. Fullscreen Explosion Flash
            if (this.flashAlpha > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
                ctx.fillRect(0, 0, this.W, this.H);
            }

            ctx.restore();
        }

        _drawDojoBackground(ctx) {
            // Wood Planks
            const plankH = 45;
            for (let y = 0; y < this.H; y += plankH) {
                ctx.fillStyle = (Math.floor(y / plankH) % 2 === 0) ? '#24140a' : '#1c0f07';
                ctx.fillRect(0, y, this.W, plankH);

                // Plank border groove
                ctx.strokeStyle = '#0e0703';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.W, y);
                ctx.stroke();

                // Subtle wood grain lines
                ctx.strokeStyle = 'rgba(255, 179, 0, 0.035)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, y + 16);
                ctx.lineTo(this.W, y + 16);
                ctx.moveTo(0, y + 32);
                ctx.lineTo(this.W, y + 32);
                ctx.stroke();
            }

            // Vignette shadow around edges
            const g = ctx.createRadialGradient(this.W / 2, this.H / 2, this.W * 0.3, this.W / 2, this.H / 2, this.W * 0.65);
            g.addColorStop(0, 'transparent');
            g.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, this.W, this.H);
        }

        _drawBladeTrail(ctx) {
            if (this.trailPoints.length < 2) return;

            const curBlade = BLADE_STYLES[this.bladeIndex];
            let mainColor = curBlade.color;
            let glowColor = curBlade.glow;

            if (mainColor === 'rainbow') {
                mainColor = `hsl(${this.rainbowHue}, 100%, 65%)`;
                glowColor = `hsl(${this.rainbowHue}, 100%, 50%)`;
            }

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const len = this.trailPoints.length;

            // Outer Glow Trail
            for (let i = 0; i < len - 1; i++) {
                const p1 = this.trailPoints[i];
                const p2 = this.trailPoints[i + 1];
                const progress = (i + 1) / len; // 0 to 1

                ctx.strokeStyle = glowColor;
                ctx.lineWidth = progress * 14;
                ctx.globalAlpha = progress * 0.6;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }

            // Razor Core Blade
            for (let i = 0; i < len - 1; i++) {
                const p1 = this.trailPoints[i];
                const p2 = this.trailPoints[i + 1];
                const progress = (i + 1) / len;

                ctx.strokeStyle = curBlade.core;
                ctx.lineWidth = Math.max(1, progress * 4.5);
                ctx.globalAlpha = progress * 0.95;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }

            ctx.restore();
        }

        _drawPlayingHUD(ctx) {
            ctx.save();

            // Watermelon Score Counter (Top-Left)
            ctx.font = '16px "Press Start 2P", monospace';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffea00';
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 8;
            ctx.fillText(`🍉 ${this.score}`, 25, 42);
            ctx.shadowBlur = 0;

            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = '#bcaaa4';
            ctx.fillText(`BEST: ${this.highScore}`, 28, 62);

            // Strikes / Lives (Top-Right)
            const sx = this.W - 140;
            const sy = 42;
            for (let i = 0; i < 3; i++) {
                ctx.font = '18px "Press Start 2P", monospace';
                if (i < this.strikes) {
                    ctx.fillStyle = '#ff2a5f';
                    ctx.shadowColor = '#ff2a5f';
                    ctx.shadowBlur = 10;
                    ctx.fillText('X', sx + i * 36, sy);
                } else {
                    ctx.fillStyle = '#4e342e';
                    ctx.shadowBlur = 0;
                    ctx.fillText('X', sx + i * 36, sy);
                }
            }

            ctx.restore();
        }

        _drawStartScreenHUD(ctx) {
            ctx.save();
            const cx = this.W / 2;

            // Dojo Title Sign
            ctx.textAlign = 'center';
            ctx.font = '24px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffb300';
            ctx.shadowColor = '#ffb300';
            ctx.shadowBlur = 16;
            ctx.fillText('PIXEL FRUIT NINJA', cx, 95);
            ctx.shadowBlur = 0;

            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillStyle = '#00f0ff';
            ctx.fillText('SWIPE KATANA OR CLICK TO SLICE!', cx, 130);

            // High Score
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillStyle = '#d7ccc8';
            ctx.fillText(`HIGH SCORE: ${this.highScore}`, cx, 160);

            // Interactive Fruit Labels
            ctx.font = '9px "Press Start 2P", monospace';
            const pulse = Math.sin(Date.now() * 0.008) * 0.2 + 0.8;

            // Watermelon Start Label
            ctx.fillStyle = `rgba(0, 230, 118, ${pulse})`;
            ctx.fillText('SLICE / CLICK', CANVAS_W * 0.35, CANVAS_H * 0.54 + 65);
            ctx.fillText('TO START', CANVAS_W * 0.35, CANVAS_H * 0.54 + 82);

            // Bomb Warning Label
            ctx.fillStyle = '#ff2a5f';
            ctx.fillText("DON'T SLICE!", CANVAS_W * 0.65, CANVAS_H * 0.54 + 65);

            // Start Game Button
            const btnX = cx - 120;
            const btnY = 445;
            const btnW = 240;
            const btnH = 46;

            ctx.fillStyle = 'rgba(0, 230, 118, 0.9)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.roundRect(btnX, btnY, btnW, btnH, 8);
            ctx.fill();
            ctx.stroke();

            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillStyle = '#0d0602';
            ctx.fillText('▶ START GAME ◀', cx, btnY + 28);

            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = '#bcaaa4';
            ctx.fillText('(OR PRESS SPACEBAR / ENTER)', cx, btnY + 68);

            ctx.restore();
        }

        _drawGameOverHUD(ctx) {
            ctx.save();
            const cx = this.W / 2;

            // Game Over Banner
            ctx.textAlign = 'center';
            ctx.font = '26px "Press Start 2P", monospace';
            ctx.fillStyle = '#ff2a5f';
            ctx.shadowColor = '#ff2a5f';
            ctx.shadowBlur = 18;
            ctx.fillText('GAME OVER', cx, 85);
            ctx.shadowBlur = 0;

            // Summary Card
            ctx.fillStyle = 'rgba(28, 15, 7, 0.9)';
            ctx.strokeStyle = '#ffb300';
            ctx.lineWidth = 2.5;
            ctx.roundRect(cx - 160, 110, 320, 160, 8);
            ctx.fill();
            ctx.stroke();

            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffea00';
            ctx.fillText(`FINAL SCORE: ${this.score}`, cx, 145);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(`BEST SCORE: ${this.highScore}`, cx, 178);
            ctx.fillText(`FRUITS SLICED: ${this.fruitsSlicedTotal}`, cx, 211);
            ctx.fillText(`BEST COMBO: ${this.bestCombo}x`, cx, 244);

            // Replay Button
            const btnX = cx - 120;
            const btnY = 450;
            const btnW = 240;
            const btnH = 46;

            ctx.fillStyle = 'rgba(0, 230, 118, 0.9)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.roundRect(btnX, btnY, btnW, btnH, 8);
            ctx.fill();
            ctx.stroke();

            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillStyle = '#0d0602';
            ctx.fillText('▶ PLAY AGAIN ◀', cx, btnY + 28);

            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = '#bcaaa4';
            ctx.fillText('(OR PRESS SPACEBAR / ENTER)', cx, btnY + 68);

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
        const game = new FruitNinjaGame();
        game.run();
    });

})();

