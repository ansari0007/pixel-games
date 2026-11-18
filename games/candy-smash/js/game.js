/* ==========================================================================
   CANDY SMASH — Retro Arcade Match-3 Engine
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // ============================
    // CONSTANTS & GAME SETTINGS
    // ============================
    const CANVAS_W = 480;
    const CANVAS_H = 680;

    const GRID_ROWS = 8;
    const GRID_COLS = 8;
    const TILE_SIZE = 54;
    const BOARD_X = (CANVAS_W - GRID_COLS * TILE_SIZE) / 2; // (480 - 432)/2 = 24
    const BOARD_Y = 130;
    const BOARD_W = GRID_COLS * TILE_SIZE; // 432
    const BOARD_H = GRID_ROWS * TILE_SIZE; // 432

    // Candy Types (1..6)
    const CANDY_TYPES = [1, 2, 3, 4, 5, 6];
    const CANDY_COLORS = {
        1: { name: 'Strawberry', primary: '#ff2255', light: '#ff6688', dark: '#b3002d', specular: '#ffffff' }, // Red Heart
        2: { name: 'Mandarin',   primary: '#ff8800', light: '#ffb347', dark: '#b35900', specular: '#ffffff' }, // Orange Lozenge
        3: { name: 'Lemon',      primary: '#ffea00', light: '#ffff77', dark: '#b3a000', specular: '#ffffff' }, // Yellow Star
        4: { name: 'Apple',      primary: '#00e676', light: '#69f0ae', dark: '#009624', specular: '#ffffff' }, // Green Gummy
        5: { name: 'Soda',       primary: '#00b0ff', light: '#80d8ff', dark: '#007bb5', specular: '#ffffff' }, // Blue Drop
        6: { name: 'Grape',      primary: '#aa00ff', light: '#e040fb', dark: '#6a0080', specular: '#ffffff' }, // Purple Hex
    };

    // Special Candy Variants
    const SPECIAL = {
        NONE: 0,
        STRIPED_H: 1,  // Clears row
        STRIPED_V: 2,  // Clears column
        WRAPPED: 3,    // Explodes 3x3 twice
        COLOR_BOMB: 4  // Chocolate sprinkle ball, clears all of one color
    };

    // Game States
    const STATE = {
        TITLE: 'TITLE',
        PLAYING: 'PLAYING',
        LEVEL_CLEAR: 'LEVEL_CLEAR',
        GAME_OVER: 'GAME_OVER',
        SUGAR_CRUSH: 'SUGAR_CRUSH'
    };

    // Board Animation States
    const BOARD_STATE = {
        IDLE: 'IDLE',
        SWAPPING: 'SWAPPING',
        SWAP_BACK: 'SWAP_BACK',
        MATCHING: 'MATCHING',
        SPECIAL_ACTION: 'SPECIAL_ACTION',
        FALLING: 'FALLING',
        CASCADE_PAUSE: 'CASCADE_PAUSE'
    };

    // Level progression configurations
    const LEVELS = [
        { level: 1, targetScore: 2500,  moves: 25, numColors: 4, name: 'Sugar Meadows' },
        { level: 2, targetScore: 6000,  moves: 22, numColors: 5, name: 'Lollipop Lake' },
        { level: 3, targetScore: 12000, moves: 20, numColors: 5, name: 'Gummy Glade' },
        { level: 4, targetScore: 20000, moves: 22, numColors: 6, name: 'Chocolate Canyon' },
        { level: 5, targetScore: 30000, moves: 25, numColors: 6, name: 'Candy Castle' },
    ];


    // ============================
    // PROCEDURAL WEB AUDIO SYNTH
    // ============================
    const Sound = {
        ctx: null,
        enabled: true,

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
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
                case 'select': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(650, t);
                    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);
                    gain.gain.setValueAtTime(0.12, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.09);
                    break;
                }
                case 'swap': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(320, t);
                    osc.frequency.linearRampToValueAtTime(540, t + 0.1);
                    gain.gain.setValueAtTime(0.15, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.11);
                    break;
                }
                case 'invalid': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(180, t);
                    osc.frequency.setValueAtTime(140, t + 0.06);
                    gain.gain.setValueAtTime(0.12, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.16);
                    break;
                }
                case 'pop': {
                    // Pentatonic pitch ascending with combo count
                    const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98];
                    const pitch = notes[Math.min(notes.length - 1, arg)];
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(pitch, t);
                    osc.frequency.exponentialRampToValueAtTime(pitch * 1.25, t + 0.12);
                    gain.gain.setValueAtTime(0.2, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.13);
                    break;
                }
                case 'stripe': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(400, t);
                    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.25);
                    gain.gain.setValueAtTime(0.2, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.28);
                    break;
                }
                case 'bomb': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(260, t);
                    osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);
                    gain.gain.setValueAtTime(0.35, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.38);
                    break;
                }
                case 'colorBomb': {
                    // Electric cosmic chord
                    [440, 554, 659, 880].forEach((freq, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, t);
                        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.35);
                        gain.gain.setValueAtTime(0.1, t);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.04);
                        osc.stop(t + i * 0.04 + 0.4);
                    });
                    break;
                }
                case 'star': {
                    const notes = [659, 880, 1046, 1318];
                    notes.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.value = f;
                        gain.gain.setValueAtTime(0.12, t + i * 0.07);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.18);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.07);
                        osc.stop(t + i * 0.07 + 0.2);
                    });
                    break;
                }
                case 'victory': {
                    const melody = [
                        { f: 523, d: 0.12 }, { f: 659, d: 0.12 }, { f: 784, d: 0.12 },
                        { f: 1046, d: 0.25 }, { f: 880, d: 0.15 }, { f: 1046, d: 0.45 }
                    ];
                    let cursor = 0;
                    melody.forEach(m => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.value = m.f;
                        gain.gain.setValueAtTime(0.18, t + cursor);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + cursor + m.d);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + cursor);
                        osc.stop(t + cursor + m.d + 0.05);
                        cursor += m.d;
                    });
                    break;
                }
                case 'gameOver': {
                    [440, 392, 349, 293].forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.value = f;
                        gain.gain.setValueAtTime(0.12, t + i * 0.14);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.14 + 0.25);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.14);
                        osc.stop(t + i * 0.14 + 0.26);
                    });
                    break;
                }
            }
        }
    };


    // ============================
    // CANDY CLASS
    // ============================
    class Candy {
        constructor(r, c, type, special = SPECIAL.NONE) {
            this.r = r;
            this.c = c;
            this.type = type;
            this.special = special;

            // Pixel positions
            this.x = BOARD_X + c * TILE_SIZE + TILE_SIZE / 2;
            this.y = BOARD_Y + r * TILE_SIZE + TILE_SIZE / 2;
            this.targetX = this.x;
            this.targetY = this.y;

            // Visual attributes
            this.scale = 1.0;
            this.targetScale = 1.0;
            this.alpha = 1.0;
            this.vy = 0;
            this.isFalling = false;
            this.wobbleAngle = 0;
            this.wobbleSpeed = 0;
            this.shineAngle = Math.random() * Math.PI * 2;
        }

        update() {
            // Smooth movement lerp towards target
            if (Math.abs(this.x - this.targetX) > 0.5) {
                this.x += (this.targetX - this.x) * 0.35;
            } else {
                this.x = this.targetX;
            }

            if (Math.abs(this.y - this.targetY) > 0.5) {
                this.y += (this.targetY - this.y) * 0.35;
            } else {
                this.y = this.targetY;
                this.isFalling = false;
            }

            // Scale lerp
            if (Math.abs(this.scale - this.targetScale) > 0.02) {
                this.scale += (this.targetScale - this.scale) * 0.3;
            } else {
                this.scale = this.targetScale;
            }

            // Subtle idle wobble for hints
            if (this.wobbleSpeed > 0) {
                this.wobbleAngle += this.wobbleSpeed;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Wobble rotation if active
            if (this.wobbleSpeed > 0) {
                ctx.rotate(Math.sin(this.wobbleAngle) * 0.15);
            }

            ctx.scale(this.scale, this.scale);
            ctx.globalAlpha = this.alpha;

            const radius = (TILE_SIZE / 2) - 4; // ~23px

            if (this.special === SPECIAL.COLOR_BOMB) {
                this._drawColorBomb(ctx, radius);
            } else {
                this._drawCandyBody(ctx, radius);

                // Draw Special candy overlays
                if (this.special === SPECIAL.STRIPED_H) {
                    this._drawStripes(ctx, radius, 'horizontal');
                } else if (this.special === SPECIAL.STRIPED_V) {
                    this._drawStripes(ctx, radius, 'vertical');
                } else if (this.special === SPECIAL.WRAPPED) {
                    this._drawWrapper(ctx, radius);
                }
            }

            ctx.restore();
        }

        _drawCandyBody(ctx, r) {
            const colors = CANDY_COLORS[this.type] || CANDY_COLORS[1];

            ctx.beginPath();
            switch (this.type) {
                case 1: // Red Heart / Strawberry
                    this._drawHeart(ctx, r);
                    break;
                case 2: // Orange Lozenge / Mandarin
                    this._drawLozenge(ctx, r);
                    break;
                case 3: // Yellow Star / Lemon
                    this._drawStar(ctx, r);
                    break;
                case 4: // Green Apple Gummy Square
                    this._drawGummySquare(ctx, r);
                    break;
                case 5: // Blue Soda Teardrop / Sphere
                    this._drawDrop(ctx, r);
                    break;
                case 6: // Purple Grape Hexagon
                    this._drawHexagon(ctx, r);
                    break;
                default:
                    ctx.arc(0, 0, r, 0, Math.PI * 2);
                    break;
            }

            // Radial sweet glossy gradient fill
            const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 1, 0, 0, r * 1.15);
            grad.addColorStop(0, colors.light);
            grad.addColorStop(0.55, colors.primary);
            grad.addColorStop(1, colors.dark);
            ctx.fillStyle = grad;
            ctx.fill();

            // Inner border rim
            ctx.strokeStyle = colors.light;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Glossy Specular Highlight Bubble
            ctx.beginPath();
            ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.45, r * 0.25, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.fill();
        }

        _drawHeart(ctx, r) {
            const topY = -r * 0.2;
            ctx.moveTo(0, r * 0.85);
            ctx.bezierCurveTo(-r * 1.1, topY, -r * 0.6, -r * 1.05, 0, -r * 0.45);
            ctx.bezierCurveTo(r * 0.6, -r * 1.05, r * 1.1, topY, 0, r * 0.85);
        }

        _drawLozenge(ctx, r) {
            // Rounded diamond / oval
            ctx.moveTo(0, -r);
            ctx.quadraticCurveTo(r * 0.9, -r * 0.4, r * 0.9, 0);
            ctx.quadraticCurveTo(r * 0.9, r * 0.4, 0, r);
            ctx.quadraticCurveTo(-r * 0.9, r * 0.4, -r * 0.9, 0);
            ctx.quadraticCurveTo(-r * 0.9, -r * 0.4, 0, -r);
        }

        _drawStar(ctx, r) {
            // 5-pointed sweet star
            const points = 5;
            const outerR = r * 1.05;
            const innerR = r * 0.52;
            for (let i = 0; i < points * 2; i++) {
                const radius = (i % 2 === 0) ? outerR : innerR;
                const angle = (i * Math.PI) / points - Math.PI / 2;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        }

        _drawGummySquare(ctx, r) {
            // Rounded square pillow
            const s = r * 0.85;
            const cr = 6;
            ctx.roundRect(-s, -s, s * 2, s * 2, cr);
        }

        _drawDrop(ctx, r) {
            // Teardrop / Sphere
            ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
        }

        _drawHexagon(ctx, r) {
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x = Math.cos(angle) * r * 0.95;
                const y = Math.sin(angle) * r * 0.95;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        }

        _drawStripes(ctx, r, dir) {
            ctx.save();
            // Clip to candy shape by re-running shape function
            ctx.clip();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            const stripeW = 4;
            const spacing = 9;

            if (dir === 'horizontal') {
                for (let y = -r; y <= r; y += spacing) {
                    ctx.fillRect(-r, y, r * 2, stripeW);
                }
            } else {
                for (let x = -r; x <= r; x += spacing) {
                    ctx.fillRect(x, -r, stripeW, r * 2);
                }
            }
            ctx.restore();
        }

        _drawWrapper(ctx, r) {
            // Cellophane candy wrapper with bowtie ends
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;

            // Left bow
            ctx.beginPath();
            ctx.moveTo(-r * 0.7, 0);
            ctx.lineTo(-r * 1.3, -r * 0.5);
            ctx.lineTo(-r * 1.3, r * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Right bow
            ctx.beginPath();
            ctx.moveTo(r * 0.7, 0);
            ctx.lineTo(r * 1.3, -r * 0.5);
            ctx.lineTo(r * 1.3, r * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Sparkle box overlay
            ctx.strokeRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
            ctx.restore();
        }

        _drawColorBomb(ctx, r) {
            // Dark rich chocolate sprinkle sphere
            const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
            g.addColorStop(0, '#5a2d0c');
            g.addColorStop(0.7, '#381804');
            g.addColorStop(1, '#1b0a01');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Multi-colored sprinkles
            const sprinkleColors = ['#ff2255', '#ffea00', '#00e676', '#00b0ff', '#ffffff', '#ff8800'];
            for (let i = 0; i < 14; i++) {
                const angle = (i * 2.3999);
                const dist = (i % 3 + 1) * (r * 0.26);
                const sx = Math.cos(angle) * dist;
                const sy = Math.sin(angle) * dist;
                ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
                ctx.beginPath();
                ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Pulsing rainbow outer ring
            const pulse = Math.sin(Date.now() * 0.008) * 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, r + pulse, 0, Math.PI * 2);
            ctx.stroke();
        }
    }


    // ============================
    // PARTICLE & EFFECT CLASSES
    // ============================
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.size = Math.random() * 4 + 2;
            this.alpha = 1.0;
            this.decay = Math.random() * 0.03 + 0.02;
            this.gravity = 0.15;
            this.shape = Math.random() < 0.5 ? 'circle' : 'square';
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            this.alpha -= this.decay;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle = this.color;
            if (this.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            }
            ctx.restore();
        }
    }

    class LaserBeam {
        constructor(x, y, dir, color) {
            this.x = x;
            this.y = y;
            this.dir = dir; // 'horizontal' or 'vertical'
            this.color = color;
            this.life = 1.0;
            this.decay = 0.05;
        }

        update() {
            this.life -= this.decay;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;

            const thickness = 14 * this.life;
            if (this.dir === 'horizontal') {
                ctx.fillRect(BOARD_X, this.y - thickness / 2, BOARD_W, thickness);
            } else {
                ctx.fillRect(this.x - thickness / 2, BOARD_Y, thickness, BOARD_H);
            }
            ctx.restore();
        }
    }

    class FloatingText {
        constructor(text, x, y, color = '#ffd700', size = 16) {
            this.text = text;
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size;
            this.alpha = 1.0;
            this.vy = -1.8;
            this.scale = 1.4;
        }

        update() {
            this.y += this.vy;
            this.alpha -= 0.02;
            if (this.scale > 1.0) this.scale -= 0.04;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.font = `bold ${Math.floor(this.size * this.scale)}px "Press Start 2P", monospace`;
            ctx.fillStyle = this.color;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.strokeText(this.text, this.x, this.y);
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
    }


    // ============================
    // MAIN GAME CONTROLLER
    // ============================
    class Game {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;

            this.W = CANVAS_W;
            this.H = CANVAS_H;

            // Game Progress
            this.state = STATE.TITLE;
            this.boardState = BOARD_STATE.IDLE;
            this.currentLevel = 1;
            this.score = 0;
            this.movesLeft = 25;
            this.targetScore = 2500;
            this.starsEarned = 0;
            this.highScore = 0;

            // Board Data (8x8)
            this.grid = [];
            this.selectedCandy = null;
            this.swappingCandies = null;
            this.isInvalidSwap = false;
            this.comboCount = 0;
            this.hintTimer = 0;
            this.hintCandies = null;

            // Visual Effects Collections
            this.particles = [];
            this.lasers = [];
            this.popups = [];

            // Input tracking
            this.dragStart = null;
            this.isDragging = false;

            this._initCanvas();
            this._initInputs();
            this._loadHighScore();
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

        _loadHighScore() {
            try {
                this.highScore = parseInt(localStorage.getItem('candysmash_highscore') || '0', 10);
            } catch (e) {}
        }

        _saveHighScore() {
            try {
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('candysmash_highscore', String(this.highScore));
                }
            } catch (e) {}
        }

        _initInputs() {
            const getCanvasPos = (clientX, clientY) => {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = CANVAS_W / rect.width;
                const scaleY = CANVAS_H / rect.height;
                return {
                    x: (clientX - rect.left) * scaleX,
                    y: (clientY - rect.top) * scaleY
                };
            };

            // Mouse Events
            this.canvas.addEventListener('mousedown', (e) => {
                Sound.init();
                const pos = getCanvasPos(e.clientX, e.clientY);
                this._handlePointerDown(pos.x, pos.y);
            });

            this.canvas.addEventListener('mousemove', (e) => {
                if (!this.isDragging) return;
                const pos = getCanvasPos(e.clientX, e.clientY);
                this._handlePointerMove(pos.x, pos.y);
            });

            window.addEventListener('mouseup', () => {
                this._handlePointerUp();
            });

            // Touch Events
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                Sound.init();
                const touch = e.touches[0];
                const pos = getCanvasPos(touch.clientX, touch.clientY);
                this._handlePointerDown(pos.x, pos.y);
            }, { passive: false });

            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (!this.isDragging) return;
                const touch = e.touches[0];
                const pos = getCanvasPos(touch.clientX, touch.clientY);
                this._handlePointerMove(pos.x, pos.y);
            }, { passive: false });

            this.canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                this._handlePointerUp();
            }, { passive: false });

            // Keyboard Shortcuts
            window.addEventListener('keydown', (e) => {
                if (e.code === 'Space' || e.code === 'Enter') {
                    if (this.state === STATE.TITLE) {
                        this.startLevel(1);
                    } else if (this.state === STATE.GAME_OVER || this.state === STATE.LEVEL_CLEAR) {
                        this._nextOrRetry();
                    }
                } else if (e.code === 'KeyH') {
                    this.triggerHint();
                }
            });

            // HTML Buttons
            const btnHint = document.getElementById('btn-hint');
            const btnSound = document.getElementById('btn-sound');

            if (btnHint) {
                btnHint.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.triggerHint();
                });
            }

            if (btnSound) {
                btnSound.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const on = Sound.toggle();
                    btnSound.textContent = on ? '🔊 SOUND' : '🔇 MUTED';
                });
            }
        }

        _handlePointerDown(x, y) {
            if (this.state === STATE.TITLE) {
                Sound.play('victory');
                this.startLevel(1);
                return;
            }

            if (this.state === STATE.LEVEL_CLEAR || this.state === STATE.GAME_OVER) {
                this._nextOrRetry();
                return;
            }

            if (this.state !== STATE.PLAYING || this.boardState !== BOARD_STATE.IDLE) {
                return;
            }

            const tile = this._pixelToTile(x, y);
            if (!tile) return;

            const candy = this.grid[tile.r][tile.c];
            if (!candy) return;

            this.dragStart = { x, y, r: tile.r, c: tile.c, candy };
            this.isDragging = true;

            // Clear previous hints
            this._clearHints();
            this.hintTimer = 0;

            if (!this.selectedCandy) {
                this.selectedCandy = candy;
                Sound.play('select');
            } else {
                if (this.selectedCandy === candy) {
                    // Clicked same candy -> deselect
                    this.selectedCandy = null;
                } else if (this._isAdjacent(this.selectedCandy, candy)) {
                    // Clicked adjacent candy -> initiate swap!
                    this._initiateSwap(this.selectedCandy, candy);
                    this.selectedCandy = null;
                    this.isDragging = false;
                    this.dragStart = null;
                } else {
                    // Clicked another candy -> switch selection
                    this.selectedCandy = candy;
                    Sound.play('select');
                }
            }
        }

        _handlePointerMove(x, y) {
            if (!this.isDragging || !this.dragStart || this.boardState !== BOARD_STATE.IDLE) return;

            const dx = x - this.dragStart.x;
            const dy = y - this.dragStart.y;
            const threshold = 14; // High responsiveness

            const candy = this.dragStart.candy;
            if (candy) {
                // Tactile displacement visual feedback while dragging
                candy.x = candy.targetX + Math.max(-TILE_SIZE * 0.6, Math.min(TILE_SIZE * 0.6, dx * 0.65));
                candy.y = candy.targetY + Math.max(-TILE_SIZE * 0.6, Math.min(TILE_SIZE * 0.6, dy * 0.65));
            }

            if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
                let targetR = this.dragStart.r;
                let targetC = this.dragStart.c;

                if (Math.abs(dx) > Math.abs(dy)) {
                    targetC += (dx > 0) ? 1 : -1;
                } else {
                    targetR += (dy > 0) ? 1 : -1;
                }

                if (targetR >= 0 && targetR < GRID_ROWS && targetC >= 0 && targetC < GRID_COLS) {
                    const targetCandy = this.grid[targetR][targetC];
                    if (targetCandy) {
                        // Reset drag displacement before animated swap
                        if (candy) {
                            candy.x = candy.targetX;
                            candy.y = candy.targetY;
                        }
                        this._initiateSwap(this.dragStart.candy, targetCandy);
                        this.selectedCandy = null;
                    }
                }
                this.isDragging = false;
                this.dragStart = null;
            }
        }

        _handlePointerUp() {
            if (this.dragStart && this.dragStart.candy) {
                this.dragStart.candy.x = this.dragStart.candy.targetX;
                this.dragStart.candy.y = this.dragStart.candy.targetY;
            }
            this.isDragging = false;
            this.dragStart = null;
        }

        _pixelToTile(x, y) {
            if (x < BOARD_X || x >= BOARD_X + BOARD_W || y < BOARD_Y || y >= BOARD_Y + BOARD_H) {
                return null;
            }
            const c = Math.floor((x - BOARD_X) / TILE_SIZE);
            const r = Math.floor((y - BOARD_Y) / TILE_SIZE);
            if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
                return { r, c };
            }
            return null;
        }

        _isAdjacent(c1, c2) {
            const dr = Math.abs(c1.r - c2.r);
            const dc = Math.abs(c1.c - c2.c);
            return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
        }

        _clearHints() {
            if (this.hintCandies) {
                this.hintCandies.forEach(c => {
                    c.wobbleSpeed = 0;
                    c.wobbleAngle = 0;
                    c.targetScale = 1.0;
                });
                this.hintCandies = null;
            }
        }

        triggerHint() {
            if (this.boardState !== BOARD_STATE.IDLE) return;
            const move = this._findPossibleMove();
            if (move) {
                this._clearHints();
                this.hintCandies = [move.c1, move.c2];
                this.hintCandies.forEach(c => {
                    c.wobbleSpeed = 0.2;
                    c.targetScale = 1.15;
                });
                Sound.play('select');
                this.popups.push(new FloatingText('HINT!', BOARD_X + BOARD_W / 2, BOARD_Y - 15, '#00e5ff', 12));
            }
        }

        // ============================
        // GAME LIFECYCLE & STAGES
        // ============================
        startLevel(lvlNum) {
            this.currentLevel = Math.min(LEVELS.length, Math.max(1, lvlNum));
            const cfg = LEVELS[this.currentLevel - 1];
            this.targetScore = cfg.targetScore;
            this.movesLeft = cfg.moves;
            this.score = 0;
            this.starsEarned = 0;
            this.comboCount = 0;
            this.hintTimer = 0;

            this.selectedCandy = null;
            this.hintCandies = null;
            this.particles.length = 0;
            this.lasers.length = 0;
            this.popups.length = 0;

            this._generateBoard(cfg.numColors);
            this.state = STATE.PLAYING;
            this.boardState = BOARD_STATE.IDLE;
        }

        _generateBoard(numColors) {
            const colors = CANDY_TYPES.slice(0, numColors);
            let valid = false;

            while (!valid) {
                this.grid = [];
                for (let r = 0; r < GRID_ROWS; r++) {
                    this.grid[r] = [];
                    for (let c = 0; c < GRID_COLS; c++) {
                        // Pick color that doesn't cause match on spawn
                        let available = [...colors];
                        if (c >= 2 && this.grid[r][c - 1].type === this.grid[r][c - 2].type) {
                            available = available.filter(t => t !== this.grid[r][c - 1].type);
                        }
                        if (r >= 2 && this.grid[r - 1][c].type === this.grid[r - 2][c].type) {
                            available = available.filter(t => t !== this.grid[r - 1][c].type);
                        }

                        const type = available[Math.floor(Math.random() * available.length)];
                        this.grid[r][c] = new Candy(r, c, type);
                    }
                }

                // Verify there's at least one valid move
                if (this._findPossibleMove()) {
                    valid = true;
                }
            }
        }

        _nextOrRetry() {
            if (this.state === STATE.LEVEL_CLEAR) {
                if (this.currentLevel < LEVELS.length) {
                    this.startLevel(this.currentLevel + 1);
                } else {
                    this.startLevel(1); // loop back
                }
            } else if (this.state === STATE.GAME_OVER) {
                this.startLevel(this.currentLevel);
            }
        }


        // ============================
        // SWAP & MATCH MECHANICS
        // ============================
        _initiateSwap(c1, c2) {
            this.boardState = BOARD_STATE.SWAPPING;
            this.swappingCandies = { c1, c2, progress: 0 };
            Sound.play('swap');

            // Set animation targets
            c1.targetX = BOARD_X + c2.c * TILE_SIZE + TILE_SIZE / 2;
            c1.targetY = BOARD_Y + c2.r * TILE_SIZE + TILE_SIZE / 2;
            c2.targetX = BOARD_X + c1.c * TILE_SIZE + TILE_SIZE / 2;
            c2.targetY = BOARD_Y + c1.r * TILE_SIZE + TILE_SIZE / 2;

            // Decrement move counter
            this.movesLeft--;
        }

        _executeSwapInGrid(c1, c2) {
            const r1 = c1.r, c1_col = c1.c;
            const r2 = c2.r, c2_col = c2.c;

            this.grid[r1][c1_col] = c2;
            this.grid[r2][c2_col] = c1;

            c1.r = r2;
            c1.c = c2_col;
            c2.r = r1;
            c2.c = c1_col;
        }

        _checkAfterSwap() {
            const { c1, c2 } = this.swappingCandies;

            // First swap in grid
            this._executeSwapInGrid(c1, c2);

            // 1. Special + Special Merges (Candy Crush Combos!)
            const isSpecial1 = c1.special !== SPECIAL.NONE;
            const isSpecial2 = c2.special !== SPECIAL.NONE;

            if (isSpecial1 && isSpecial2) {
                this.swappingCandies = null;
                this._handleSpecialCombo(c1, c2);
                return;
            }

            // 2. Color Bomb + Normal Candy
            if (c1.special === SPECIAL.COLOR_BOMB || c2.special === SPECIAL.COLOR_BOMB) {
                this.swappingCandies = null;
                this._handleColorBombSwap(c1, c2);
                return;
            }

            // 3. Two Candies of the Same Color -> MERGE THEM!
            if (c1.type === c2.type) {
                this.swappingCandies = null;
                this._handleSameCandyMerge(c1, c2);
                return;
            }

            // 4. Standard match check (Line of 3 or more)
            const matches = this._findMatches();

            if (matches.length > 0) {
                // Successful swap!
                this.swappingCandies = null;
                this.comboCount = 0;
                this._processMatches(matches, c2); // c2 was destination
            } else {
                // Invalid swap: animate swap back!
                this.isInvalidSwap = true;
                this.boardState = BOARD_STATE.SWAP_BACK;
                Sound.play('invalid');

                // Refund the move
                this.movesLeft++;

                // Clear, helpful feedback popup
                this.popups.push(new FloatingText('MATCH 3 OR SAME COLOR!', (c1.x + c2.x) / 2, (c1.y + c2.y) / 2 - 22, '#ff4081', 10));

                // Reverse targets
                c1.targetX = BOARD_X + c2.c * TILE_SIZE + TILE_SIZE / 2;
                c1.targetY = BOARD_Y + c2.r * TILE_SIZE + TILE_SIZE / 2;
                c2.targetX = BOARD_X + c1.c * TILE_SIZE + TILE_SIZE / 2;
                c2.targetY = BOARD_Y + c1.r * TILE_SIZE + TILE_SIZE / 2;
            }
        }

        _handleSameCandyMerge(c1, c2) {
            this.boardState = BOARD_STATE.SPECIAL_ACTION;

            // Merge destination candy (c1 is at destination after _executeSwapInGrid)
            const dest = c1;
            const src = c2;

            // Determine upgraded special candy
            let newSpecial = SPECIAL.STRIPED_H;
            let mergeTitle = 'STRIPED MERGE!';

            if (src.special === SPECIAL.NONE && dest.special === SPECIAL.NONE) {
                newSpecial = Math.random() < 0.5 ? SPECIAL.STRIPED_H : SPECIAL.STRIPED_V;
                mergeTitle = 'STRIPED MERGE!';
            } else if (src.special === SPECIAL.STRIPED_H || src.special === SPECIAL.STRIPED_V ||
                       dest.special === SPECIAL.STRIPED_H || dest.special === SPECIAL.STRIPED_V) {
                newSpecial = SPECIAL.WRAPPED;
                mergeTitle = 'WRAPPED MERGE!';
            } else if (src.special === SPECIAL.WRAPPED || dest.special === SPECIAL.WRAPPED) {
                newSpecial = SPECIAL.COLOR_BOMB;
                mergeTitle = 'COLOR BOMB MERGE!';
            } else {
                newSpecial = SPECIAL.COLOR_BOMB;
                mergeTitle = 'MEGA MERGE!';
            }

            // SFX & Feedback
            Sound.play('star');
            Sound.play('pop', 2);
            this.popups.push(new FloatingText(mergeTitle, dest.x, dest.y - 10, '#ffd700', 14));
            this.popups.push(new FloatingText('+250', dest.x, dest.y + 16, '#00e5ff', 12));
            this._addScore(250);

            // Particle burst at merge location
            this._spawnExplosion(dest.x, dest.y, dest.type);

            // Animate src candy vanishing into dest
            src.targetScale = 0;
            src.alpha = 0;
            this.grid[src.r][src.c] = null;

            // Upgrade dest candy
            dest.special = newSpecial;
            dest.scale = 1.4;
            dest.targetScale = 1.0;

            // Check if this merge also formed lines of 3+
            setTimeout(() => {
                const matches = this._findMatches();
                if (matches.length > 0) {
                    this._processMatches(matches, dest);
                } else {
                    this._dropAndRefill();
                }
            }, 250);
        }

        _handleSpecialCombo(c1, c2) {
            this.boardState = BOARD_STATE.SPECIAL_ACTION;

            // Sort so bomb is first if present, then wrapped, then striped
            let first = c1, second = c2;
            if (second.special === SPECIAL.COLOR_BOMB || (second.special === SPECIAL.WRAPPED && first.special !== SPECIAL.COLOR_BOMB)) {
                first = c2;
                second = c1;
            }

            const s1 = first.special;
            const s2 = second.special;

            // 1. Color Bomb + Color Bomb: Screen Clear!
            if (s1 === SPECIAL.COLOR_BOMB && s2 === SPECIAL.COLOR_BOMB) {
                Sound.play('victory');
                this.popups.push(new FloatingText('MEGA CLEAR!', CANVAS_W / 2, BOARD_Y + BOARD_H / 2, '#ffd700', 20));
                for (let r = 0; r < GRID_ROWS; r++) {
                    for (let c = 0; c < GRID_COLS; c++) {
                        const cand = this.grid[r][c];
                        if (cand) {
                            this._spawnExplosion(cand.x, cand.y, cand.type);
                            cand.alpha = 0;
                            this.grid[r][c] = null;
                            this._addScore(100);
                        }
                    }
                }
                setTimeout(() => this._dropAndRefill(), 400);
                return;
            }

            // 2. Color Bomb + Striped: All candies of that color become striped!
            if (s1 === SPECIAL.COLOR_BOMB && (s2 === SPECIAL.STRIPED_H || s2 === SPECIAL.STRIPED_V)) {
                Sound.play('colorBomb');
                this.popups.push(new FloatingText('STRIPE STORM!', CANVAS_W / 2, BOARD_Y + 50, '#00e5ff', 16));
                const targetType = second.type;
                const stripedList = [];

                for (let r = 0; r < GRID_ROWS; r++) {
                    for (let c = 0; c < GRID_COLS; c++) {
                        const cand = this.grid[r][c];
                        if (cand && (cand.type === targetType || cand === first)) {
                            cand.special = Math.random() < 0.5 ? SPECIAL.STRIPED_H : SPECIAL.STRIPED_V;
                            stripedList.push(cand);
                        }
                    }
                }

                stripedList.forEach((cand, idx) => {
                    setTimeout(() => {
                        this._triggerStriped(cand.r, cand.c, cand.special === SPECIAL.STRIPED_H ? 'horizontal' : 'vertical');
                    }, idx * 60);
                });

                setTimeout(() => this._dropAndRefill(), stripedList.length * 60 + 350);
                return;
            }

            // 3. Color Bomb + Wrapped: All candies of that color become wrapped bombs!
            if (s1 === SPECIAL.COLOR_BOMB && s2 === SPECIAL.WRAPPED) {
                Sound.play('colorBomb');
                this.popups.push(new FloatingText('BOMB BLITZ!', CANVAS_W / 2, BOARD_Y + 50, '#ff4081', 16));
                const targetType = second.type;
                const wrappedList = [];

                for (let r = 0; r < GRID_ROWS; r++) {
                    for (let c = 0; c < GRID_COLS; c++) {
                        const cand = this.grid[r][c];
                        if (cand && (cand.type === targetType || cand === first)) {
                            cand.special = SPECIAL.WRAPPED;
                            wrappedList.push(cand);
                        }
                    }
                }

                wrappedList.forEach((cand, idx) => {
                    setTimeout(() => {
                        this._triggerWrapped(cand.r, cand.c);
                    }, idx * 70);
                });

                setTimeout(() => this._dropAndRefill(), wrappedList.length * 70 + 350);
                return;
            }

            // 4. Striped + Striped: Cross laser clearing row AND column!
            if ((s1 === SPECIAL.STRIPED_H || s1 === SPECIAL.STRIPED_V) && (s2 === SPECIAL.STRIPED_H || s2 === SPECIAL.STRIPED_V)) {
                Sound.play('stripe');
                this.popups.push(new FloatingText('CROSS BLAST!', second.x, second.y, '#00e5ff', 16));
                const r = second.r;
                const c = second.c;
                this._triggerStriped(r, c, 'horizontal');
                this._triggerStriped(r, c, 'vertical');
                setTimeout(() => this._dropAndRefill(), 350);
                return;
            }

            // 5. Striped + Wrapped: Giant 3-row x 3-column Mega Roller!
            if (((s1 === SPECIAL.STRIPED_H || s1 === SPECIAL.STRIPED_V) && s2 === SPECIAL.WRAPPED) ||
                (s1 === SPECIAL.WRAPPED && (s2 === SPECIAL.STRIPED_H || s2 === SPECIAL.STRIPED_V))) {
                Sound.play('bomb');
                Sound.play('stripe');
                this.popups.push(new FloatingText('MEGA ROLLER!', second.x, second.y, '#ffd700', 16));
                const centerR = second.r;
                const centerC = second.c;

                for (let dr = -1; dr <= 1; dr++) {
                    const row = centerR + dr;
                    if (row >= 0 && row < GRID_ROWS) {
                        this._triggerStriped(row, centerC, 'horizontal');
                    }
                }
                for (let dc = -1; dc <= 1; dc++) {
                    const col = centerC + dc;
                    if (col >= 0 && col < GRID_COLS) {
                        this._triggerStriped(centerR, col, 'vertical');
                    }
                }

                setTimeout(() => this._dropAndRefill(), 400);
                return;
            }

            // 6. Wrapped + Wrapped: Mega 5x5 blast!
            if (s1 === SPECIAL.WRAPPED && s2 === SPECIAL.WRAPPED) {
                Sound.play('bomb');
                this.popups.push(new FloatingText('MEGA BLAST!', second.x, second.y, '#ff2255', 18));
                const centerR = second.r;
                const centerC = second.c;

                for (let dr = -2; dr <= 2; dr++) {
                    for (let dc = -2; dc <= 2; dc++) {
                        const nr = centerR + dr;
                        const nc = centerC + dc;
                        if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
                            const cand = this.grid[nr][nc];
                            if (cand) {
                                this._spawnExplosion(cand.x, cand.y, cand.type);
                                cand.alpha = 0;
                                this.grid[nr][nc] = null;
                                this._addScore(80);
                            }
                        }
                    }
                }

                setTimeout(() => this._dropAndRefill(), 400);
                return;
            }
        }

        _handleColorBombSwap(c1, c2) {
            this.boardState = BOARD_STATE.SPECIAL_ACTION;
            Sound.play('colorBomb');

            const bomb = (c1.special === SPECIAL.COLOR_BOMB) ? c1 : c2;
            const other = (bomb === c1) ? c2 : c1;

            const targets = [];

            if (other.special === SPECIAL.COLOR_BOMB) {
                // Bomb + Bomb: Clear entire board!
                for (let r = 0; r < GRID_ROWS; r++) {
                    for (let c = 0; c < GRID_COLS; c++) {
                        targets.push(this.grid[r][c]);
                    }
                }
                this.popups.push(new FloatingText('MEGA CLEAR!', CANVAS_W / 2, BOARD_Y + BOARD_H / 2, '#ffd700', 18));
            } else {
                // Destroy all candies matching 'other.type'
                const targetType = other.type;
                for (let r = 0; r < GRID_ROWS; r++) {
                    for (let c = 0; c < GRID_COLS; c++) {
                        const candy = this.grid[r][c];
                        if (candy && candy.type === targetType) {
                            targets.push(candy);
                        }
                    }
                }
                targets.push(bomb);
                this.popups.push(new FloatingText('COLOR BLAST!', bomb.x, bomb.y, '#ffd700', 14));
            }

            // Create electric beam visual effects to each target
            targets.forEach((cand, idx) => {
                setTimeout(() => {
                    this._spawnExplosion(cand.x, cand.y, cand.type);
                    cand.alpha = 0;
                    this.grid[cand.r][cand.c] = null;
                    this._addScore(120);
                }, idx * 25);
            });

            setTimeout(() => {
                this._dropAndRefill();
            }, targets.length * 25 + 300);
        }

        _findMatches() {
            const matches = [];
            const matchedTiles = new Set();

            // 1. Horizontal Matches
            for (let r = 0; r < GRID_ROWS; r++) {
                let matchLength = 1;
                for (let c = 0; c < GRID_COLS; c++) {
                    const current = this.grid[r][c];
                    const next = (c < GRID_COLS - 1) ? this.grid[r][c + 1] : null;

                    if (next && current && next.type === current.type && current.special !== SPECIAL.COLOR_BOMB) {
                        matchLength++;
                    } else {
                        if (matchLength >= 3) {
                            const matchGroup = [];
                            for (let k = 0; k < matchLength; k++) {
                                const tile = this.grid[r][c - k];
                                matchGroup.push(tile);
                                matchedTiles.add(`${tile.r},${tile.c}`);
                            }
                            matches.push({ type: 'horizontal', tiles: matchGroup });
                        }
                        matchLength = 1;
                    }
                }
            }

            // 2. Vertical Matches
            for (let c = 0; c < GRID_COLS; c++) {
                let matchLength = 1;
                for (let r = 0; r < GRID_ROWS; r++) {
                    const current = this.grid[r][c];
                    const next = (r < GRID_ROWS - 1) ? this.grid[r + 1][c] : null;

                    if (next && current && next.type === current.type && current.special !== SPECIAL.COLOR_BOMB) {
                        matchLength++;
                    } else {
                        if (matchLength >= 3) {
                            const matchGroup = [];
                            for (let k = 0; k < matchLength; k++) {
                                const tile = this.grid[r - k][c];
                                matchGroup.push(tile);
                                matchedTiles.add(`${tile.r},${tile.c}`);
                            }
                            matches.push({ type: 'vertical', tiles: matchGroup });
                        }
                        matchLength = 1;
                    }
                }
            }

            return matches;
        }

        _processMatches(matches, swapDestCandy = null) {
            this.boardState = BOARD_STATE.MATCHING;
            this.comboCount++;
            Sound.play('pop', this.comboCount);

            const allMatchedCandies = new Set();
            const specialsToCreate = [];

            // Analyze matches for special creation
            matches.forEach(m => {
                m.tiles.forEach(t => allMatchedCandies.add(t));

                if (m.tiles.length >= 5) {
                    // Match-5: Create Color Bomb!
                    const target = (swapDestCandy && m.tiles.includes(swapDestCandy)) ? swapDestCandy : m.tiles[2];
                    specialsToCreate.push({ candy: target, special: SPECIAL.COLOR_BOMB, type: target.type });
                } else if (m.tiles.length === 4) {
                    // Match-4: Create Striped Candy!
                    const target = (swapDestCandy && m.tiles.includes(swapDestCandy)) ? swapDestCandy : m.tiles[1];
                    const specialType = (m.type === 'horizontal') ? SPECIAL.STRIPED_V : SPECIAL.STRIPED_H;
                    specialsToCreate.push({ candy: target, special: specialType, type: target.type });
                }
            });

            // Check for L/T intersections -> Wrapped Candy
            const tileCounts = new Map();
            matches.forEach(m => {
                m.tiles.forEach(t => {
                    const key = `${t.r},${t.c}`;
                    tileCounts.set(key, (tileCounts.get(key) || 0) + 1);
                });
            });

            tileCounts.forEach((count, key) => {
                if (count >= 2) {
                    const [r, c] = key.split(',').map(Number);
                    const candy = this.grid[r][c];
                    if (candy) {
                        specialsToCreate.push({ candy, special: SPECIAL.WRAPPED, type: candy.type });
                    }
                }
            });

            // Trigger special candies being destroyed
            allMatchedCandies.forEach(candy => {
                if (candy.special === SPECIAL.STRIPED_H) {
                    this._triggerStriped(candy.r, candy.c, 'horizontal');
                } else if (candy.special === SPECIAL.STRIPED_V) {
                    this._triggerStriped(candy.r, candy.c, 'vertical');
                } else if (candy.special === SPECIAL.WRAPPED) {
                    this._triggerWrapped(candy.r, candy.c);
                }
            });

            // Calculate points with combo multipliers
            const basePoints = allMatchedCandies.size * 60;
            const comboMultiplier = Math.min(8, this.comboCount);
            const totalEarned = basePoints * comboMultiplier;
            this._addScore(totalEarned);

            // Floating combo banners
            if (this.comboCount === 2) {
                this.popups.push(new FloatingText('SWEET!', CANVAS_W / 2, BOARD_Y + 40, '#ff4081', 16));
            } else if (this.comboCount === 3) {
                this.popups.push(new FloatingText('TASTY!', CANVAS_W / 2, BOARD_Y + 40, '#ffd700', 18));
            } else if (this.comboCount === 4) {
                this.popups.push(new FloatingText('DELICIOUS!', CANVAS_W / 2, BOARD_Y + 40, '#00e5ff', 20));
            } else if (this.comboCount >= 5) {
                this.popups.push(new FloatingText('SUGAR RUSH!', CANVAS_W / 2, BOARD_Y + 40, '#e040fb', 22));
            }

            // Animate candy pops & particles
            allMatchedCandies.forEach(candy => {
                this._spawnExplosion(candy.x, candy.y, candy.type);
                candy.targetScale = 0;
            });

            // Remove popped candies from grid after pop animation
            setTimeout(() => {
                allMatchedCandies.forEach(candy => {
                    this.grid[candy.r][candy.c] = null;
                });

                // Spawn newly created specials
                specialsToCreate.forEach(sp => {
                    const newSpecial = new Candy(sp.candy.r, sp.candy.c, sp.type, sp.special);
                    newSpecial.scale = 0.2;
                    newSpecial.targetScale = 1.0;
                    this.grid[sp.candy.r][sp.candy.c] = newSpecial;
                    Sound.play('star');
                });

                // Move to drop and refill
                this._dropAndRefill();
            }, 250);
        }

        _triggerStriped(r, c, dir) {
            Sound.play('stripe');
            const color = (dir === 'horizontal') ? '#00e5ff' : '#ff4081';
            this.lasers.push(new LaserBeam(BOARD_X + c * TILE_SIZE + TILE_SIZE / 2, BOARD_Y + r * TILE_SIZE + TILE_SIZE / 2, dir, color));

            if (dir === 'horizontal') {
                for (let col = 0; col < GRID_COLS; col++) {
                    const cand = this.grid[r][col];
                    if (cand) {
                        this._spawnExplosion(cand.x, cand.y, cand.type);
                        cand.alpha = 0;
                        this.grid[r][col] = null;
                        this._addScore(60);
                    }
                }
            } else {
                for (let row = 0; row < GRID_ROWS; row++) {
                    const cand = this.grid[row][c];
                    if (cand) {
                        this._spawnExplosion(cand.x, cand.y, cand.type);
                        cand.alpha = 0;
                        this.grid[row][c] = null;
                        this._addScore(60);
                    }
                }
            }
        }

        _triggerWrapped(r, c) {
            Sound.play('bomb');
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
                        const cand = this.grid[nr][nc];
                        if (cand) {
                            this._spawnExplosion(cand.x, cand.y, cand.type);
                            cand.alpha = 0;
                            this.grid[nr][nc] = null;
                            this._addScore(60);
                        }
                    }
                }
            }
        }

        _dropAndRefill() {
            this.boardState = BOARD_STATE.FALLING;
            const cfg = LEVELS[this.currentLevel - 1];
            const colors = CANDY_TYPES.slice(0, cfg.numColors);

            // 1. Drop existing candies
            for (let c = 0; c < GRID_COLS; c++) {
                let emptySpaces = 0;
                for (let r = GRID_ROWS - 1; r >= 0; r--) {
                    if (this.grid[r][c] === null) {
                        emptySpaces++;
                    } else if (emptySpaces > 0) {
                        const candy = this.grid[r][c];
                        const newR = r + emptySpaces;

                        this.grid[newR][c] = candy;
                        this.grid[r][c] = null;

                        candy.r = newR;
                        candy.targetY = BOARD_Y + newR * TILE_SIZE + TILE_SIZE / 2;
                        candy.isFalling = true;
                    }
                }

                // 2. Refill empty top spaces with new candies
                for (let r = emptySpaces - 1; r >= 0; r--) {
                    const type = colors[Math.floor(Math.random() * colors.length)];
                    const newCandy = new Candy(r, c, type);

                    // Position above board
                    newCandy.y = BOARD_Y - (emptySpaces - r) * TILE_SIZE;
                    newCandy.targetY = BOARD_Y + r * TILE_SIZE + TILE_SIZE / 2;
                    newCandy.isFalling = true;

                    this.grid[r][c] = newCandy;
                }
            }

            // Wait for candies to settle, then recheck matches (Cascades)
            setTimeout(() => {
                const cascades = this._findMatches();
                if (cascades.length > 0) {
                    this._processMatches(cascades);
                } else {
                    this.boardState = BOARD_STATE.IDLE;
                    this._checkGameStatus();
                }
            }, 320);
        }

        _checkGameStatus() {
            // Check victory / game over
            if (this.score >= this.targetScore && this.movesLeft === 0) {
                this._levelClear();
                return;
            }

            if (this.movesLeft <= 0 && this.score < this.targetScore) {
                this.state = STATE.GAME_OVER;
                Sound.play('gameOver');
                return;
            }

            // If player cleared score target early, allow playing remaining moves or bonus
            if (this.score >= this.targetScore && this.movesLeft > 0) {
                // Earned 1, 2, or 3 stars
                this._updateStars();
            }

            // Verify if board has possible moves, else reshuffle!
            if (!this._findPossibleMove()) {
                this._reshuffleBoard();
            }
        }

        _reshuffleBoard() {
            this.popups.push(new FloatingText('RESHUFFLING!', CANVAS_W / 2, BOARD_Y + BOARD_H / 2, '#ffd700', 18));
            Sound.play('swap');

            const allCandies = [];
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    if (this.grid[r][c]) allCandies.push(this.grid[r][c]);
                }
            }

            // Shuffle array
            for (let i = allCandies.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const tempType = allCandies[i].type;
                allCandies[i].type = allCandies[j].type;
                allCandies[j].type = tempType;
            }

            // Verify reshuffle has valid moves
            if (!this._findPossibleMove()) {
                this._generateBoard(LEVELS[this.currentLevel - 1].numColors);
            }
        }

        _levelClear() {
            this.state = STATE.LEVEL_CLEAR;
            Sound.play('victory');
            this._saveHighScore();

            // Fireworks celebration
            for (let i = 0; i < 60; i++) {
                const rx = BOARD_X + Math.random() * BOARD_W;
                const ry = BOARD_Y + Math.random() * BOARD_H;
                const colors = ['#ff4081', '#00e5ff', '#ffd700', '#00e676', '#e040fb'];
                this.particles.push(new Particle(rx, ry, colors[Math.floor(Math.random() * colors.length)]));
            }
        }

        _addScore(pts) {
            this.score += pts;
            this._updateStars();
            this._saveHighScore();
        }

        _updateStars() {
            if (this.score >= this.targetScore * 2.2) {
                if (this.starsEarned < 3) Sound.play('star');
                this.starsEarned = 3;
            } else if (this.score >= this.targetScore * 1.5) {
                if (this.starsEarned < 2) Sound.play('star');
                this.starsEarned = 2;
            } else if (this.score >= this.targetScore) {
                if (this.starsEarned < 1) Sound.play('star');
                this.starsEarned = 1;
            }
        }

        _findPossibleMove() {
            // Check all horizontal swaps
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS - 1; c++) {
                    const c1 = this.grid[r][c];
                    const c2 = this.grid[r][c + 1];
                    if (!c1 || !c2) continue;

                    // Two candies of the same type can always merge!
                    if (c1.type === c2.type) {
                        return { c1, c2 };
                    }

                    // Any special candy is always a valid move
                    if (c1.special !== SPECIAL.NONE || c2.special !== SPECIAL.NONE) {
                        return { c1, c2 };
                    }

                    // Test match-3 swap
                    this.grid[r][c] = c2;
                    this.grid[r][c + 1] = c1;
                    const matches = this._findMatches();
                    this.grid[r][c] = c1;
                    this.grid[r][c + 1] = c2;

                    if (matches.length > 0) return { c1, c2 };
                }
            }

            // Check all vertical swaps
            for (let r = 0; r < GRID_ROWS - 1; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    const c1 = this.grid[r][c];
                    const c2 = this.grid[r + 1][c];
                    if (!c1 || !c2) continue;

                    // Two candies of the same type can always merge!
                    if (c1.type === c2.type) {
                        return { c1, c2 };
                    }

                    // Any special candy is always a valid move
                    if (c1.special !== SPECIAL.NONE || c2.special !== SPECIAL.NONE) {
                        return { c1, c2 };
                    }

                    // Test match-3 swap
                    this.grid[r][c] = c2;
                    this.grid[r + 1][c] = c1;
                    const matches = this._findMatches();
                    this.grid[r][c] = c1;
                    this.grid[r + 1][c] = c2;

                    if (matches.length > 0) return { c1, c2 };
                }
            }

            return null;
        }

        _spawnExplosion(x, y, candyType) {
            const color = CANDY_COLORS[candyType]?.primary || '#ffd700';
            for (let i = 0; i < 12; i++) {
                this.particles.push(new Particle(x, y, color));
            }
        }


        // ============================
        // UPDATE LOOP
        // ============================
        update() {
            // Update Candies
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    const candy = this.grid[r]?.[c];
                    if (candy) candy.update();
                }
            }

            // Update Swapping State
            if (this.boardState === BOARD_STATE.SWAPPING) {
                const { c1, c2 } = this.swappingCandies;
                if (c1.x === c1.targetX && c1.y === c1.targetY && c2.x === c2.targetX && c2.y === c2.targetY) {
                    this._checkAfterSwap();
                }
            } else if (this.boardState === BOARD_STATE.SWAP_BACK) {
                const { c1, c2 } = this.swappingCandies;
                if (c1.x === c1.targetX && c1.y === c1.targetY && c2.x === c2.targetX && c2.y === c2.targetY) {
                    this._executeSwapInGrid(c1, c2); // put back in grid
                    this.boardState = BOARD_STATE.IDLE;
                    this.swappingCandies = null;
                }
            }

            // Inactivity Hint Timer
            if (this.state === STATE.PLAYING && this.boardState === BOARD_STATE.IDLE) {
                this.hintTimer++;
                if (this.hintTimer > 360) { // ~6 seconds
                    this.triggerHint();
                    this.hintTimer = 0;
                }
            }

            // Update Lasers
            for (let i = this.lasers.length - 1; i >= 0; i--) {
                this.lasers[i].update();
                if (this.lasers[i].life <= 0) this.lasers.splice(i, 1);
            }

            // Update Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].alpha <= 0) this.particles.splice(i, 1);
            }

            // Update Popups
            for (let i = this.popups.length - 1; i >= 0; i--) {
                this.popups[i].update();
                if (this.popups[i].alpha <= 0) this.popups.splice(i, 1);
            }
        }


        // ============================
        // RENDER LOOP
        // ============================
        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.W, this.H);

            // 1. Sweet Candy Background
            this._drawBackground(ctx);

            if (this.state === STATE.TITLE) {
                this._drawTitleScreen(ctx);
                return;
            }

            // 2. HUD (Top bar: moves, score, stars)
            this._drawHUD(ctx);

            // 3. Board Frame & Grid Background
            this._drawBoardGrid(ctx);

            // 4. Draw Candies
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    const candy = this.grid[r]?.[c];
                    if (candy && candy !== this.selectedCandy) {
                        candy.draw(ctx);
                    }
                }
            }

            // Draw selected candy on top with glowing ring & swap direction hints
            if (this.selectedCandy) {
                const adjOffsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                const pulse = Math.sin(Date.now() * 0.008) * 0.25 + 0.75;
                ctx.save();
                adjOffsets.forEach(([dr, dc]) => {
                    const nr = this.selectedCandy.r + dr;
                    const nc = this.selectedCandy.c + dc;
                    if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
                        const ax = BOARD_X + nc * TILE_SIZE;
                        const ay = BOARD_Y + nr * TILE_SIZE;
                        ctx.strokeStyle = `rgba(0, 229, 255, ${0.7 * pulse})`;
                        ctx.lineWidth = 2.5;
                        ctx.strokeRect(ax + 3, ay + 3, TILE_SIZE - 6, TILE_SIZE - 6);

                        // Mini swap arrow indicator pointing to center
                        const arrowCX = ax + TILE_SIZE / 2;
                        const arrowCY = ay + TILE_SIZE / 2;
                        ctx.fillStyle = `rgba(0, 229, 255, ${0.4 * pulse})`;
                        ctx.beginPath();
                        ctx.arc(arrowCX, arrowCY, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });

                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.arc(this.selectedCandy.x, this.selectedCandy.y, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                this.selectedCandy.draw(ctx);
            }

            // 5. Lasers & Special Effects
            this.lasers.forEach(laser => laser.draw(ctx));

            // 6. Particles
            this.particles.forEach(p => p.draw(ctx));

            // 7. Popups
            this.popups.forEach(pop => pop.draw(ctx));

            // 8. Overlays for Level Clear / Game Over
            if (this.state === STATE.LEVEL_CLEAR) {
                this._drawLevelClearOverlay(ctx);
            } else if (this.state === STATE.GAME_OVER) {
                this._drawGameOverOverlay(ctx);
            }
        }

        _drawBackground(ctx) {
            // Gradient purple arcade backdrop
            const bgGrad = ctx.createLinearGradient(0, 0, 0, this.H);
            bgGrad.addColorStop(0, '#1d0b36');
            bgGrad.addColorStop(0.5, '#2e1254');
            bgGrad.addColorStop(1, '#110524');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, this.W, this.H);

            // Subtle candy stripes in background
            ctx.fillStyle = 'rgba(255, 64, 129, 0.04)';
            for (let x = -this.H; x < this.W; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x + this.H, this.H);
                ctx.lineTo(x + this.H + 20, this.H);
                ctx.lineTo(x + 20, 0);
                ctx.closePath();
                ctx.fill();
            }
        }

        _drawHUD(ctx) {
            const cfg = LEVELS[this.currentLevel - 1];

            // Level Title
            ctx.fillStyle = '#ff4081';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`LVL ${this.currentLevel}: ${cfg.name.toUpperCase()}`, 24, 25);

            // Moves Left Badge (Large and prominent)
            const movesBoxX = 24;
            const movesBoxY = 38;
            ctx.fillStyle = 'rgba(255, 64, 129, 0.2)';
            ctx.fillRect(movesBoxX, movesBoxY, 110, 68);
            ctx.strokeStyle = (this.movesLeft <= 5) ? '#ff2255' : '#ff4081';
            ctx.lineWidth = 2;
            ctx.strokeRect(movesBoxX, movesBoxY, 110, 68);

            ctx.fillStyle = '#8899aa';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('MOVES', movesBoxX + 55, movesBoxY + 18);

            ctx.fillStyle = (this.movesLeft <= 5) ? '#ff2255' : '#ffffff';
            ctx.font = '22px "Press Start 2P", monospace';
            ctx.fillText(String(this.movesLeft), movesBoxX + 55, movesBoxY + 52);

            // Target & Current Score Box
            const scoreBoxX = 146;
            const scoreBoxY = 38;
            const scoreBoxW = 310;
            ctx.fillStyle = 'rgba(156, 39, 176, 0.2)';
            ctx.fillRect(scoreBoxX, scoreBoxY, scoreBoxW, 68);
            ctx.strokeStyle = '#9c27b0';
            ctx.strokeRect(scoreBoxX, scoreBoxY, scoreBoxW, 68);

            // Score Labels
            ctx.fillStyle = '#8899aa';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'left';
            ctx.fillText('SCORE', scoreBoxX + 14, scoreBoxY + 18);

            ctx.fillStyle = '#ffd700';
            ctx.font = '14px "Press Start 2P", monospace';
            ctx.fillText(String(this.score), scoreBoxX + 14, scoreBoxY + 38);

            ctx.fillStyle = '#667788';
            ctx.font = '7px "Press Start 2P", monospace';
            ctx.fillText(`TARGET: ${this.targetScore}`, scoreBoxX + 14, scoreBoxY + 54);

            // Star Rating Display
            ctx.textAlign = 'right';
            ctx.font = '14px "Press Start 2P", monospace';
            const star1 = this.starsEarned >= 1 ? '★' : '☆';
            const star2 = this.starsEarned >= 2 ? '★' : '☆';
            const star3 = this.starsEarned >= 3 ? '★' : '☆';
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`${star1} ${star2} ${star3}`, scoreBoxX + scoreBoxW - 14, scoreBoxY + 28);

            // Score Progress Bar
            const barX = scoreBoxX + 130;
            const barY = scoreBoxY + 42;
            const barW = scoreBoxW - 145;
            const barH = 12;

            ctx.fillStyle = '#120722';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);

            const progress = Math.min(1.0, this.score / (this.targetScore * 2.2));
            if (progress > 0) {
                const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW * progress, 0);
                fillGrad.addColorStop(0, '#ff4081');
                fillGrad.addColorStop(1, '#ffd700');
                ctx.fillStyle = fillGrad;
                ctx.fillRect(barX + 2, barY + 2, (barW - 4) * progress, barH - 4);
            }
        }

        _drawBoardGrid(ctx) {
            // Outer Frame
            ctx.fillStyle = 'rgba(18, 7, 34, 0.75)';
            ctx.fillRect(BOARD_X - 6, BOARD_Y - 6, BOARD_W + 12, BOARD_H + 12);
            ctx.strokeStyle = 'rgba(255, 64, 129, 0.5)';
            ctx.lineWidth = 3;
            ctx.strokeRect(BOARD_X - 6, BOARD_Y - 6, BOARD_W + 12, BOARD_H + 12);

            // Checkerboard Tile Grid
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    const tx = BOARD_X + c * TILE_SIZE;
                    const ty = BOARD_Y + r * TILE_SIZE;
                    const isEven = (r + c) % 2 === 0;

                    ctx.fillStyle = isEven ? 'rgba(40, 16, 75, 0.65)' : 'rgba(26, 10, 52, 0.65)';
                    ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
                }
            }

            // Bottom Info Bar
            ctx.fillStyle = '#8899aa';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SWAP TO MATCH 3 • MERGE 2 SAME CANDIES!', CANVAS_W / 2, BOARD_Y + BOARD_H + 32);
            ctx.fillText('MERGE 2 SPECIALS TO TRIGGER MEGA COMBOS!', CANVAS_W / 2, BOARD_Y + BOARD_H + 52);
        }

        _drawTitleScreen(ctx) {
            // Title Screen Header
            ctx.textAlign = 'center';
            ctx.shadowColor = '#ff4081';
            ctx.shadowBlur = 18;

            ctx.fillStyle = '#ff4081';
            ctx.font = '28px "Press Start 2P", monospace';
            ctx.fillText('CANDY', this.W / 2, 140);

            ctx.fillStyle = '#ffd700';
            ctx.font = '36px "Press Start 2P", monospace';
            ctx.fillText('SMASH', this.W / 2, 190);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#00e5ff';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText('SWEET MATCH-3 & MERGE ARCADE', this.W / 2, 225);

            // Showcase Candies in Circle
            const centerX = this.W / 2;
            const centerY = 320;
            const demoRadius = 60;
            for (let i = 1; i <= 6; i++) {
                const angle = (i * Math.PI) / 3 + Date.now() * 0.001;
                const cx = centerX + Math.cos(angle) * demoRadius;
                const cy = centerY + Math.sin(angle) * demoRadius;
                const dummy = new Candy(0, 0, i);
                dummy.x = cx;
                dummy.y = cy;
                dummy.scale = 0.9;
                dummy.draw(ctx);
            }

            // Center Chocolate Bomb
            const centerBomb = new Candy(0, 0, 1, SPECIAL.COLOR_BOMB);
            centerBomb.x = centerX;
            centerBomb.y = centerY;
            centerBomb.scale = 1.1;
            centerBomb.draw(ctx);

            // Pulsing Start Button
            const btnW = 320;
            const btnH = 52;
            const btnX = (this.W - btnW) / 2;
            const btnY = 440;
            const pulse = Math.sin(Date.now() * 0.006) * 0.2 + 0.8;

            ctx.fillStyle = `rgba(255, 64, 129, ${pulse * 0.35})`;
            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeStyle = '#ff4081';
            ctx.lineWidth = 2;
            ctx.strokeRect(btnX, btnY, btnW, btnH);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('▶ CLICK OR TAP TO PLAY', this.W / 2, btnY + 32);

            // High Score
            ctx.fillStyle = '#ffd700';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText(`HIGH SCORE: ${this.highScore}`, this.W / 2, 540);

            // Instructions
            ctx.fillStyle = '#667788';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('5 LEVELS • CASCADES • SPECIALS', this.W / 2, 580);
            ctx.fillText('SWAP TO MATCH 3 • MERGE 2 SAME CANDIES!', this.W / 2, 605);
        }

        _drawLevelClearOverlay(ctx) {
            ctx.fillStyle = 'rgba(18, 7, 34, 0.85)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffd700';
            ctx.font = '22px "Press Start 2P", monospace';
            ctx.fillText('LEVEL CLEARED!', this.W / 2, 230);

            // Stars
            ctx.font = '28px "Press Start 2P", monospace';
            const star1 = this.starsEarned >= 1 ? '★' : '☆';
            const star2 = this.starsEarned >= 2 ? '★' : '☆';
            const star3 = this.starsEarned >= 3 ? '★' : '☆';
            ctx.fillText(`${star1} ${star2} ${star3}`, this.W / 2, 285);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText(`SCORE: ${this.score}`, this.W / 2, 335);

            ctx.fillStyle = '#00e5ff';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('CLICK OR SPACE TO ADVANCE', this.W / 2, 400);
        }

        _drawGameOverOverlay(ctx) {
            ctx.fillStyle = 'rgba(18, 7, 34, 0.88)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff2255';
            ctx.font = '26px "Press Start 2P", monospace';
            ctx.fillText('OUT OF MOVES', this.W / 2, 240);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText(`SCORE: ${this.score}`, this.W / 2, 295);
            ctx.fillText(`TARGET: ${this.targetScore}`, this.W / 2, 325);

            ctx.fillStyle = '#ffd700';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('CLICK OR SPACE TO RETRY', this.W / 2, 390);
        }

        run() {
            const loop = () => {
                this.update();
                this.draw();
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        }
    }


    // ============================
    // INITIALIZATION
    // ============================
    window.addEventListener('DOMContentLoaded', () => {
        const game = new Game();
        game.run();
    });

})();

