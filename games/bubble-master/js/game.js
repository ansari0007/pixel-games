/* ============================================
   BUBBLE MASTER — Arcade Bubble Shooter Engine
   Classic Puzzle Bobble style arcade game
   ============================================ */

(function() {
    'use strict';

    // ============================
    // CONSTANTS & CONFIG
    // ============================
    const CANVAS_W = 480;
    const CANVAS_H = 680;

    const BUBBLE_R = 21; // Bubble radius
    const BUBBLE_D = BUBBLE_R * 2; // Diameter = 42
    const ROW_HEIGHT = Math.round(BUBBLE_R * Math.sqrt(3)); // ~36.3px

    const GRID_COLS_EVEN = 8;
    const GRID_COLS_ODD = 7;
    const GRID_MAX_ROWS = 14;

    const WALL_LEFT = 24;
    const WALL_RIGHT = CANVAS_W - 24;
    const PLAY_WIDTH = WALL_RIGHT - WALL_LEFT; // 432
    const GRID_OFFSET_X = WALL_LEFT + Math.round((PLAY_WIDTH - GRID_COLS_EVEN * BUBBLE_D) / 2) + BUBBLE_R;
    const GRID_OFFSET_Y = 56;

    const DANGER_Y = CANVAS_H - 120;
    const CANNON_X = CANVAS_W / 2;
    const CANNON_Y = CANVAS_H - 65;

    const STATE = {
        TITLE: 'title',
        PLAYING: 'playing',
        LEVEL_CLEAR: 'levelClear',
        GAME_OVER: 'gameOver',
        VICTORY: 'victory'
    };

    // Bubble Color definitions
    const COLORS = {
        1: { name: 'cyan', hex: '#00f0ff', dark: '#0088aa', light: '#b3f8ff' },
        2: { name: 'magenta', hex: '#ff007f', dark: '#aa0055', light: '#ffb3d9' },
        3: { name: 'yellow', hex: '#ffee00', dark: '#aa9900', light: '#fff9b3' },
        4: { name: 'green', hex: '#00ff66', dark: '#009933', light: '#b3ffcc' },
        5: { name: 'purple', hex: '#9933ff', dark: '#5511aa', light: '#ddb3ff' },
        6: { name: 'orange', hex: '#ff6600', dark: '#aa3300', light: '#ffcc99' },
        // Specials
        7: { name: 'rainbow', hex: '#ffffff', dark: '#aaaaaa', light: '#ffffff', special: 'rainbow' },
        8: { name: 'bomb', hex: '#222222', dark: '#111111', light: '#ff3300', special: 'bomb' },
        9: { name: 'lightning', hex: '#ffcc00', dark: '#997700', light: '#ffffff', special: 'lightning' },
    };

    const NORMAL_COLOR_KEYS = [1, 2, 3, 4, 5, 6];


    // ============================
    // SOUND ENGINE (Web Audio API)
    // ============================
    const Sound = {
        ctx: null,
        enabled: true,

        init() {
            if (this.ctx) return;
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch(e) {
                this.enabled = false;
            }
        },

        play(type, arg = 0) {
            if (!this.enabled || !this.ctx) return;
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const t = this.ctx.currentTime;
            switch(type) {
                case 'shoot': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(320, t);
                    osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
                    gain.gain.setValueAtTime(0.18, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.1);
                    break;
                }
                case 'bounce': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(440, t);
                    osc.frequency.exponentialRampToValueAtTime(220, t + 0.05);
                    gain.gain.setValueAtTime(0.08, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.05);
                    break;
                }
                case 'stick': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(180, t);
                    osc.frequency.linearRampToValueAtTime(280, t + 0.06);
                    gain.gain.setValueAtTime(0.1, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.06);
                    break;
                }
                case 'pop': {
                    // Musical pitch sequence for chain pops
                    const baseNotes = [440, 523, 587, 659, 784, 880, 1047, 1175];
                    const note = baseNotes[Math.min(baseNotes.length - 1, arg)];
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(note, t);
                    osc.frequency.exponentialRampToValueAtTime(note * 1.5, t + 0.12);
                    gain.gain.setValueAtTime(0.2, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.12);
                    break;
                }
                case 'drop': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(350, t);
                    osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);
                    gain.gain.setValueAtTime(0.12, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.25);
                    break;
                }
                case 'bomb': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(260, t);
                    osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
                    gain.gain.setValueAtTime(0.3, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.42);
                    break;
                }
                case 'swap': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(600, t);
                    osc.frequency.linearRampToValueAtTime(800, t + 0.08);
                    gain.gain.setValueAtTime(0.1, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.08);
                    break;
                }
                case 'victory': {
                    const notes = [523, 659, 784, 1047];
                    notes.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.value = f;
                        gain.gain.setValueAtTime(0.15, t + i * 0.1);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.18);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.1);
                        osc.stop(t + i * 0.1 + 0.2);
                    });
                    break;
                }
            }
        }
    };


    // ============================
    // LEVEL DATA
    // ============================
    // Pre-made starting patterns for Stages 1 to 5
    const STAGES = [
        // Stage 1: Easy rainbow rows
        [
            [1, 1, 2, 2, 3, 3, 4, 4],
            [1, 2, 2, 3, 3, 4, 4],
            [1, 1, 2, 2, 3, 3, 4, 4],
            [5, 5, 6, 6, 1, 1, 2],
        ],
        // Stage 2: Diamond pattern
        [
            [3, 3, 4, 4, 1, 1, 2, 2],
            [3, 4, 4, 7, 1, 1, 2], // 7 = rainbow
            [5, 5, 6, 6, 5, 5, 6, 6],
            [5, 6, 6, 8, 5, 5, 6], // 8 = bomb
            [2, 2, 1, 1, 2, 2, 1, 1],
        ],
        // Stage 3: Zig-zag color arches
        [
            [1, 2, 1, 2, 3, 4, 3, 4],
            [1, 2, 2, 3, 3, 4, 4],
            [5, 5, 6, 6, 1, 1, 2, 2],
            [5, 6, 9, 6, 1, 2, 2], // 9 = lightning
            [3, 3, 4, 4, 5, 5, 6, 6],
            [3, 4, 4, 5, 5, 6, 6],
        ],
        // Stage 4: Clustered honeycomb
        [
            [4, 4, 4, 2, 2, 2, 1, 1],
            [4, 4, 2, 2, 1, 1, 1],
            [6, 6, 6, 3, 3, 3, 5, 5],
            [6, 6, 8, 3, 3, 5, 5],
            [1, 1, 2, 2, 4, 4, 6, 6],
            [1, 2, 2, 4, 4, 6, 6],
        ],
        // Stage 5: Master Challenge
        [
            [5, 5, 3, 3, 2, 2, 4, 4],
            [5, 3, 3, 7, 2, 2, 4],
            [1, 1, 6, 6, 1, 1, 6, 6],
            [1, 6, 8, 9, 1, 6, 6],
            [4, 4, 5, 5, 3, 3, 2, 2],
            [4, 5, 5, 3, 3, 2, 2],
            [6, 6, 1, 1, 4, 4, 5, 5],
        ]
    ];


    // ============================
    // PARTICLES & POPUPS
    // ============================
    class Particle {
        constructor(x, y, vx, vy, color, life, size) {
            this.x = x; this.y = y;
            this.vx = vx; this.vy = vy;
            this.color = color;
            this.life = life;
            this.maxLife = life;
            this.size = size || 3;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.2; // gravity
            this.life--;
        }
        draw(ctx) {
            ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
            ctx.fillStyle = this.color;
            ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.size, this.size);
            ctx.globalAlpha = 1;
        }
    }

    class FallingBubble {
        constructor(x, y, colorId) {
            this.x = x;
            this.y = y;
            this.colorId = colorId;
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = -Math.random() * 3 - 2;
            this.rot = 0;
            this.rotSpd = (Math.random() - 0.5) * 0.1;
            this.alive = true;
        }
        update(canvasH) {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.5; // fall
            this.rot += this.rotSpd;
            if (this.y > canvasH + 40) this.alive = false;
        }
        draw(ctx) {
            drawBubbleGraphic(ctx, this.x, this.y, this.colorId);
        }
    }

    class Popup {
        constructor(x, y, text, color = '#ffffff') {
            this.x = x; this.y = y;
            this.text = text;
            this.color = color;
            this.life = 35;
            this.maxLife = 35;
        }
        update() {
            this.y -= 1.2;
            this.life--;
        }
        draw(ctx) {
            ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
            ctx.fillStyle = this.color;
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
            ctx.globalAlpha = 1;
        }
    }


    // ============================
    // BUBBLE GRAPHIC RENDERING
    // ============================
    function drawBubbleGraphic(ctx, x, y, colorId, scale = 1) {
        const c = COLORS[colorId] || COLORS[1];
        const r = BUBBLE_R * scale;

        ctx.save();
        ctx.translate(Math.floor(x), Math.floor(y));

        if (c.special === 'rainbow') {
            // Rainbow bubble (swirling gradient)
            const g = ctx.createRadialGradient(-r*0.2, -r*0.2, 2, 0, 0, r);
            g.addColorStop(0, '#ffffff');
            g.addColorStop(0.3, '#00f0ff');
            g.addColorStop(0.6, '#ff007f');
            g.addColorStop(1, '#ffee00');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
            ctx.fill();

            // Star icon
            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.round(12 * scale)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('★', 0, 4 * scale);

        } else if (c.special === 'bomb') {
            // Bomb bubble
            ctx.fillStyle = '#222228';
            ctx.beginPath();
            ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ff3300';
            ctx.lineWidth = 2 * scale;
            ctx.stroke();

            // Bomb icon
            ctx.fillStyle = '#ffaa00';
            ctx.font = `${Math.round(12 * scale)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('💣', 0, 4 * scale);

        } else if (c.special === 'lightning') {
            // Lightning bubble
            ctx.fillStyle = '#ffbb00';
            ctx.beginPath();
            ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.round(12 * scale)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('⚡', 0, 4 * scale);

        } else {
            // Glossy 3D Arcade Bubble
            // Main sphere
            const g = ctx.createRadialGradient(-r*0.35, -r*0.35, r*0.1, 0, 0, r);
            g.addColorStop(0, c.light);
            g.addColorStop(0.35, c.hex);
            g.addColorStop(1, c.dark);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
            ctx.fill();

            // Specular shine highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.ellipse(-r*0.35, -r*0.35, r*0.35, r*0.2, Math.PI * -0.25, 0, Math.PI * 2);
            ctx.fill();

            // Dark inner rim
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    }


    // ============================
    // MAIN GAME CLASS
    // ============================
    class Game {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.W = CANVAS_W;
            this.H = CANVAS_H;

            this.state = STATE.TITLE;
            this.score = 0;
            this.highScore = 0;
            this.stage = 1;

            // Hex Grid
            this.grid = [];
            this.ceilingDropCounter = 5; // Drops ceiling after 5 misses
            this.ceilingOffsetY = GRID_OFFSET_Y;

            // Cannon & Aiming
            this.cannonAngle = 0; // In radians: 0 = straight up, negative = left, positive = right
            this.currentBubble = 1;
            this.nextBubble = 2;
            this.flyingBubble = null;

            // Effects
            this.particles = [];
            this.fallingBubbles = [];
            this.popups = [];
            this.comboCounter = 0;

            // Resize handling
            this.resize();
            window.addEventListener('resize', () => this.resize());

            // Scale calculations for responsive touch/click
            const getScale = () => {
                const rect = this.canvas.getBoundingClientRect();
                return {
                    scaleX: this.W / rect.width,
                    scaleY: this.H / rect.height,
                    rect
                };
            };

            // Mouse Aiming & Shooting
            this.canvas.addEventListener('mousemove', (e) => {
                const { scaleX, scaleY, rect } = getScale();
                const mx = (e.clientX - rect.left) * scaleX;
                const my = (e.clientY - rect.top) * scaleY;
                this.updateAim(mx, my);
            });

            this.canvas.addEventListener('click', (e) => {
                Sound.init();
                const { scaleX, scaleY, rect } = getScale();
                const mx = (e.clientX - rect.left) * scaleX;
                const my = (e.clientY - rect.top) * scaleY;
                this.handleClick(mx, my);
            });

            // Touch Drag Aim & Release
            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (e.touches.length > 0) {
                    const { scaleX, scaleY, rect } = getScale();
                    const tx = (e.touches[0].clientX - rect.left) * scaleX;
                    const ty = (e.touches[0].clientY - rect.top) * scaleY;
                    this.updateAim(tx, ty);
                }
            }, { passive: false });

            this.canvas.addEventListener('touchend', (e) => {
                Sound.init();
                if (this.state === STATE.PLAYING && !this.flyingBubble) {
                    this.fireBubble();
                }
            });

            // Keyboard Aiming
            window.addEventListener('keydown', (e) => {
                if (['ArrowLeft', 'KeyA'].includes(e.code)) {
                    this.cannonAngle = Math.max(-1.3, this.cannonAngle - 0.08);
                } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
                    this.cannonAngle = Math.min(1.3, this.cannonAngle + 0.08);
                } else if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
                    e.preventDefault();
                    if (this.state === STATE.TITLE) {
                        this.startStage(1);
                    } else if (this.state === STATE.PLAYING) {
                        this.fireBubble();
                    } else {
                        this.state = STATE.TITLE;
                    }
                } else if (['KeyC', 'KeyX'].includes(e.code)) {
                    this.swapBubbles();
                }
            });

            // Mobile HTML Action Buttons
            const btnSwap = document.getElementById('btn-swap');
            const btnFire = document.getElementById('btn-fire');
            if (btnSwap) {
                btnSwap.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.swapBubbles();
                });
            }
            if (btnFire) {
                btnFire.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.fireBubble();
                });
            }

            this._loadHighScore();
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
                this.highScore = parseInt(localStorage.getItem('bubblemaster_highscore') || '0', 10);
            } catch(e) {}
        }

        _saveHighScore() {
            try {
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('bubblemaster_highscore', String(this.highScore));
                }
            } catch(e) {}
        }

        updateAim(targetX, targetY) {
            if (targetY >= CANNON_Y - 20) return; // Don't aim downward
            const dx = targetX - CANNON_X;
            const dy = targetY - CANNON_Y;
            // Angle measured from straight up: 0 = up, negative = left, positive = right
            let angle = Math.atan2(dx, -dy);
            this.cannonAngle = Math.max(-1.32, Math.min(1.32, angle)); // Max ~75 degrees
        }

        handleClick(x, y) {
            if (this.state === STATE.TITLE) {
                Sound.play('victory');
                this.score = 0;
                this.startStage(1);
                return;
            }

            if (this.state === STATE.GAME_OVER || this.state === STATE.VICTORY) {
                this.state = STATE.TITLE;
                return;
            }

            if (this.state === STATE.LEVEL_CLEAR) {
                if (this.stage < STAGES.length) {
                    this.startStage(this.stage + 1);
                } else {
                    this.state = STATE.VICTORY;
                }
                return;
            }

            if (this.state === STATE.PLAYING) {
                // Click near cannon swap preview?
                if (Math.hypot(x - (CANNON_X - 60), y - CANNON_Y) < 30) {
                    this.swapBubbles();
                    return;
                }

                // Normal click fires bubble
                this.updateAim(x, y);
                this.fireBubble();
            }
        }

        startStage(stageNum) {
            this.stage = stageNum;
            this.ceilingDropCounter = 5;
            this.ceilingOffsetY = GRID_OFFSET_Y;
            this.particles.length = 0;
            this.fallingBubbles.length = 0;
            this.popups.length = 0;
            this.flyingBubble = null;
            this.comboCounter = 0;

            // Initialize Grid
            this.grid = [];
            for (let r = 0; r < GRID_MAX_ROWS; r++) {
                this.grid[r] = [];
                const cols = (r % 2 === 0) ? GRID_COLS_EVEN : GRID_COLS_ODD;
                for (let c = 0; c < cols; c++) {
                    this.grid[r][c] = 0; // empty
                }
            }

            // Load preset pattern
            const preset = STAGES[stageNum - 1] || STAGES[0];
            for (let r = 0; r < preset.length; r++) {
                for (let c = 0; c < preset[r].length; c++) {
                    this.grid[r][c] = preset[r][c];
                }
            }

            // Generate initial bubbles
            this.currentBubble = this.getRandomActiveColor();
            this.nextBubble = this.getRandomActiveColor();

            this.state = STATE.PLAYING;
        }

        getRandomActiveColor() {
            // Gather colors currently present in grid so we don't give impossible colors
            const active = new Set();
            for (let r = 0; r < this.grid.length; r++) {
                for (let c = 0; c < this.grid[r].length; c++) {
                    const val = this.grid[r][c];
                    if (val >= 1 && val <= 6) active.add(val);
                }
            }

            let pool = Array.from(active);
            if (pool.length === 0) pool = NORMAL_COLOR_KEYS.slice(0, 4);

            // Small chance (5%) for a special power bubble
            if (Math.random() < 0.05) {
                const specials = [7, 8, 9]; // Rainbow, Bomb, Lightning
                return specials[Math.floor(Math.random() * specials.length)];
            }

            return pool[Math.floor(Math.random() * pool.length)];
        }

        swapBubbles() {
            if (this.state !== STATE.PLAYING || this.flyingBubble) return;
            const temp = this.currentBubble;
            this.currentBubble = this.nextBubble;
            this.nextBubble = temp;
            Sound.play('swap');
        }

        fireBubble() {
            if (this.flyingBubble) return; // Only 1 flying bubble at a time

            const spd = 14;
            const vx = Math.sin(this.cannonAngle) * spd;
            const vy = -Math.cos(this.cannonAngle) * spd;

            this.flyingBubble = {
                x: CANNON_X,
                y: CANNON_Y - 20,
                vx: vx,
                vy: vy,
                colorId: this.currentBubble
            };

            Sound.play('shoot');

            // Rotate next bubble in
            this.currentBubble = this.nextBubble;
            this.nextBubble = this.getRandomActiveColor();
        }

        getHexCenter(r, c) {
            const isOdd = (r % 2 === 1);
            const x = isOdd ? (GRID_OFFSET_X + BUBBLE_R + c * BUBBLE_D) : (GRID_OFFSET_X + c * BUBBLE_D);
            const y = this.ceilingOffsetY + r * ROW_HEIGHT;
            return { x, y };
        }

        findNearestGridSlot(x, y) {
            let bestR = 0;
            let bestC = 0;
            let minDist = Infinity;

            for (let r = 0; r < GRID_MAX_ROWS; r++) {
                const cols = (r % 2 === 0) ? GRID_COLS_EVEN : GRID_COLS_ODD;
                for (let c = 0; c < cols; c++) {
                    if (this.grid[r][c] === 0) { // must be empty slot
                        const pos = this.getHexCenter(r, c);
                        const d = Math.hypot(x - pos.x, y - pos.y);
                        if (d < minDist) {
                            minDist = d;
                            bestR = r;
                            bestC = c;
                        }
                    }
                }
            }

            return { r: bestR, c: bestC, dist: minDist };
        }

        getNeighbors(r, c) {
            const isOdd = (r % 2 === 1);
            const neighbors = [];

            // Directions differ for odd vs even rows in hexagonal layout
            const offsets = isOdd ? [
                { dr: 0, dc: -1 }, { dr: 0, dc: 1 }, // left, right
                { dr: -1, dc: 0 }, { dr: -1, dc: 1 }, // top-left, top-right
                { dr: 1, dc: 0 },  { dr: 1, dc: 1 }   // bot-left, bot-right
            ] : [
                { dr: 0, dc: -1 }, { dr: 0, dc: 1 }, // left, right
                { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, // top-left, top-right
                { dr: 1, dc: -1 },  { dr: 1, dc: 0 }   // bot-left, bot-right
            ];

            for (const off of offsets) {
                const nr = r + off.dr;
                const nc = c + off.dc;
                if (nr >= 0 && nr < GRID_MAX_ROWS) {
                    const maxCols = (nr % 2 === 0) ? GRID_COLS_EVEN : GRID_COLS_ODD;
                    if (nc >= 0 && nc < maxCols) {
                        neighbors.push({ r: nr, c: nc });
                    }
                }
            }

            return neighbors;
        }

        update() {
            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].life <= 0) this.particles.splice(i, 1);
            }

            // Update falling dropped bubbles
            for (let i = this.fallingBubbles.length - 1; i >= 0; i--) {
                this.fallingBubbles[i].update(this.H);
                if (!this.fallingBubbles[i].alive) this.fallingBubbles.splice(i, 1);
            }

            // Update score popups
            for (let i = this.popups.length - 1; i >= 0; i--) {
                this.popups[i].update();
                if (this.popups[i].life <= 0) this.popups.splice(i, 1);
            }

            if (this.state !== STATE.PLAYING) return;

            // Update flying bubble
            if (this.flyingBubble) {
                const fb = this.flyingBubble;
                fb.x += fb.vx;
                fb.y += fb.vy;

                // Wall bounces (left and right)
                if (fb.x - BUBBLE_R <= WALL_LEFT) {
                    fb.x = WALL_LEFT + BUBBLE_R;
                    fb.vx = Math.abs(fb.vx);
                    Sound.play('bounce');
                } else if (fb.x + BUBBLE_R >= WALL_RIGHT) {
                    fb.x = WALL_RIGHT - BUBBLE_R;
                    fb.vx = -Math.abs(fb.vx);
                    Sound.play('bounce');
                }

                // Check collision with ceiling
                let hitCeiling = (fb.y - BUBBLE_R <= this.ceilingOffsetY);

                // Check collision with existing grid bubbles
                let hitGrid = false;
                for (let r = 0; r < GRID_MAX_ROWS; r++) {
                    const cols = (r % 2 === 0) ? GRID_COLS_EVEN : GRID_COLS_ODD;
                    for (let c = 0; c < cols; c++) {
                        if (this.grid[r][c] !== 0) {
                            const pos = this.getHexCenter(r, c);
                            if (Math.hypot(fb.x - pos.x, fb.y - pos.y) < BUBBLE_D - 4) {
                                hitGrid = true;
                                break;
                            }
                        }
                    }
                    if (hitGrid) break;
                }

                // If collision occurred, snap to grid!
                if (hitCeiling || hitGrid) {
                    const slot = this.findNearestGridSlot(fb.x, fb.y);
                    this.grid[slot.r][slot.c] = fb.colorId;
                    this.flyingBubble = null;
                    Sound.play('stick');

                    this.handleBubbleImpact(slot.r, slot.c, fb.colorId);
                }
            }
        }

        handleBubbleImpact(hitR, hitC, colorId) {
            let poppedAny = false;

            // Special Bubble 1: BOMB
            if (colorId === 8) {
                Sound.play('bomb');
                poppedAny = true;
                const toPop = [{ r: hitR, c: hitC }];
                const neighbors = this.getNeighbors(hitR, hitC);
                for (const n of neighbors) {
                    toPop.push(n);
                    // Add secondary neighbors for big radius
                    const n2 = this.getNeighbors(n.r, n.c);
                    for (const second of n2) {
                        if (!toPop.some(p => p.r === second.r && p.c === second.c)) {
                            toPop.push(second);
                        }
                    }
                }
                this.popCluster(toPop, '#ff5500');
            }

            // Special Bubble 2: LIGHTNING
            else if (colorId === 9) {
                Sound.play('bomb');
                poppedAny = true;
                const toPop = [];
                const maxCols = (hitR % 2 === 0) ? GRID_COLS_EVEN : GRID_COLS_ODD;
                for (let c = 0; c < maxCols; c++) {
                    if (this.grid[hitR][c] !== 0) toPop.push({ r: hitR, c });
                }
                this.popCluster(toPop, '#ffee00');
            }

            // Standard Match-3 Cluster Flood Fill
            else {
                const cluster = this.findCluster(hitR, hitC, colorId);
                if (cluster.length >= 3) {
                    poppedAny = true;
                    this.comboCounter++;
                    this.popCluster(cluster, COLORS[colorId].hex);
                } else {
                    this.comboCounter = 0;
                }
            }

            // Check for floating / disconnected bubbles and drop them!
            const dropped = this.removeFloatingBubbles();
            if (dropped > 0) {
                Sound.play('drop');
                const bonus = dropped * 250;
                this.score += bonus;
                const pos = this.getHexCenter(hitR, hitC);
                this.popups.push(new Popup(pos.x, pos.y - 20, `DROP +${bonus}!`, '#00f0ff'));
            }

            // Ceiling advancement logic on fouls
            if (!poppedAny) {
                this.ceilingDropCounter--;
                if (this.ceilingDropCounter <= 0) {
                    this.ceilingDropCounter = 5;
                    this.advanceCeiling();
                }
            }

            // Check Win condition (All bubbles cleared)
            let remaining = 0;
            for (let r = 0; r < GRID_MAX_ROWS; r++) {
                for (let c = 0; c < this.grid[r].length; c++) {
                    if (this.grid[r][c] !== 0) remaining++;
                }
            }

            if (remaining === 0) {
                Sound.play('victory');
                this.score += 5000;
                this._saveHighScore();
                this.state = STATE.LEVEL_CLEAR;
                return;
            }

            // Check Lose condition (Any bubble touching bottom danger line)
            for (let r = 0; r < GRID_MAX_ROWS; r++) {
                for (let c = 0; c < this.grid[r].length; c++) {
                    if (this.grid[r][c] !== 0) {
                        const pos = this.getHexCenter(r, c);
                        if (pos.y + BUBBLE_R >= DANGER_Y) {
                            Sound.play('bomb');
                            this._saveHighScore();
                            this.state = STATE.GAME_OVER;
                            return;
                        }
                    }
                }
            }
        }

        findCluster(startR, startC, targetColor) {
            const cluster = [];
            const visited = new Set();
            const queue = [{ r: startR, c: startC }];
            visited.add(`${startR},${startC}`);

            while (queue.length > 0) {
                const curr = queue.shift();
                cluster.push(curr);

                const neighbors = this.getNeighbors(curr.r, curr.c);
                for (const n of neighbors) {
                    const key = `${n.r},${n.c}`;
                    if (!visited.has(key)) {
                        const val = this.grid[n.r][n.c];
                        // Match if same color OR rainbow (7) OR launched is rainbow
                        if (val !== 0 && (val === targetColor || val === 7 || targetColor === 7)) {
                            visited.add(key);
                            queue.push(n);
                        }
                    }
                }
            }

            return cluster;
        }

        popCluster(cluster, sparkColor) {
            const count = cluster.length;
            const pts = count * 100 * Math.max(1, this.comboCounter);
            this.score += pts;

            Sound.play('pop', Math.min(7, this.comboCounter));

            for (const item of cluster) {
                const pos = this.getHexCenter(item.r, item.c);
                this.grid[item.r][item.c] = 0; // remove from grid

                // Sparkle particles
                for (let i = 0; i < 8; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = Math.random() * 4 + 2;
                    this.particles.push(new Particle(
                        pos.x, pos.y,
                        Math.cos(ang) * spd, Math.sin(ang) * spd,
                        sparkColor, 20 + Math.random() * 15, 3 + Math.random() * 2
                    ));
                }
            }

            if (cluster.length > 0) {
                const first = this.getHexCenter(cluster[0].r, cluster[0].c);
                this.popups.push(new Popup(first.x, first.y, `+${pts}`, sparkColor));
            }
        }

        removeFloatingBubbles() {
            // Find all bubbles connected to the top row (r === 0)
            const anchored = new Set();
            const queue = [];

            // Add all bubbles in row 0
            for (let c = 0; c < this.grid[0].length; c++) {
                if (this.grid[0][c] !== 0) {
                    anchored.add(`0,${c}`);
                    queue.push({ r: 0, c });
                }
            }

            // BFS from ceiling
            while (queue.length > 0) {
                const curr = queue.shift();
                const neighbors = this.getNeighbors(curr.r, curr.c);
                for (const n of neighbors) {
                    const key = `${n.r},${n.c}`;
                    if (!anchored.has(key) && this.grid[n.r][n.c] !== 0) {
                        anchored.add(key);
                        queue.push(n);
                    }
                }
            }

            // Any non-empty bubble NOT in anchored is floating -> drop it!
            let droppedCount = 0;
            for (let r = 0; r < GRID_MAX_ROWS; r++) {
                for (let c = 0; c < this.grid[r].length; c++) {
                    const val = this.grid[r][c];
                    if (val !== 0 && !anchored.has(`${r},${c}`)) {
                        const pos = this.getHexCenter(r, c);
                        this.fallingBubbles.push(new FallingBubble(pos.x, pos.y, val));
                        this.grid[r][c] = 0;
                        droppedCount++;
                    }
                }
            }

            return droppedCount;
        }

        advanceCeiling() {
            // Shift all rows down by 1 and insert a fresh top row
            for (let r = GRID_MAX_ROWS - 1; r > 0; r--) {
                const cols = (r % 2 === 0) ? GRID_COLS_EVEN : GRID_COLS_ODD;
                const prevCols = ((r - 1) % 2 === 0) ? GRID_COLS_EVEN : GRID_COLS_ODD;
                for (let c = 0; c < cols; c++) {
                    this.grid[r][c] = (c < prevCols) ? this.grid[r - 1][c] : 0;
                }
            }

            // Fill top row with random colors
            for (let c = 0; c < GRID_COLS_EVEN; c++) {
                this.grid[0][c] = this.getRandomActiveColor();
            }

            Sound.play('bounce');
        }

        // ============================
        // DRAW
        // ============================
        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.W, this.H);

            // Arcade background
            ctx.fillStyle = '#0a071a';
            ctx.fillRect(0, 0, this.W, this.H);

            // Playfield boundary walls (Neon cyan borders)
            ctx.fillStyle = '#060410';
            ctx.fillRect(WALL_LEFT, 0, PLAY_WIDTH, CANVAS_H);

            ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(WALL_LEFT, 0);
            ctx.lineTo(WALL_LEFT, CANVAS_H);
            ctx.moveTo(WALL_RIGHT, 0);
            ctx.lineTo(WALL_RIGHT, CANVAS_H);
            ctx.stroke();

            // Danger Line at bottom
            ctx.strokeStyle = 'rgba(255, 0, 127, 0.6)';
            ctx.setLineDash([8, 6]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(WALL_LEFT, DANGER_Y);
            ctx.lineTo(WALL_RIGHT, DANGER_Y);
            ctx.stroke();
            ctx.setLineDash([]);

            switch(this.state) {
                case STATE.TITLE:
                    this._drawTitle(ctx);
                    break;
                case STATE.PLAYING:
                case STATE.LEVEL_CLEAR:
                case STATE.GAME_OVER:
                case STATE.VICTORY:
                    this._drawGame(ctx);
                    if (this.state === STATE.LEVEL_CLEAR) this._drawLevelClear(ctx);
                    if (this.state === STATE.GAME_OVER) this._drawGameOver(ctx);
                    if (this.state === STATE.VICTORY) this._drawVictory(ctx);
                    break;
            }
        }

        _drawGame(ctx) {
            // Draw Ceiling Bar
            ctx.fillStyle = '#1c1538';
            ctx.fillRect(WALL_LEFT, 0, PLAY_WIDTH, this.ceilingOffsetY - BUBBLE_R);
            ctx.fillStyle = '#ff007f';
            ctx.fillRect(WALL_LEFT, this.ceilingOffsetY - BUBBLE_R - 3, PLAY_WIDTH, 4);

            // Draw Trajectory Guideline with wall reflection
            if (this.state === STATE.PLAYING && !this.flyingBubble) {
                this._drawTrajectory(ctx);
            }

            // Draw Grid Bubbles
            for (let r = 0; r < GRID_MAX_ROWS; r++) {
                for (let c = 0; c < this.grid[r].length; c++) {
                    const colorId = this.grid[r][c];
                    if (colorId !== 0) {
                        const pos = this.getHexCenter(r, c);
                        drawBubbleGraphic(ctx, pos.x, pos.y, colorId);
                    }
                }
            }

            // Draw Dropped / Falling bubbles
            for (const fb of this.fallingBubbles) fb.draw(ctx);

            // Draw Flying Bubble
            if (this.flyingBubble) {
                drawBubbleGraphic(ctx, this.flyingBubble.x, this.flyingBubble.y, this.flyingBubble.colorId);
            }

            // Draw Cannon Shooter at bottom
            this._drawCannon(ctx);

            // Draw Particles & Popups
            for (const p of this.particles) p.draw(ctx);
            for (const popup of this.popups) popup.draw(ctx);

            // Draw Top HUD Bar
            this._drawHUD(ctx);
        }

        _drawTrajectory(ctx) {
            let cx = CANNON_X;
            let cy = CANNON_Y;
            let vx = Math.sin(this.cannonAngle) * 8;
            let vy = -Math.cos(this.cannonAngle) * 8;

            ctx.fillStyle = 'rgba(0, 240, 255, 0.55)';
            for (let i = 0; i < 35; i++) {
                cx += vx;
                cy += vy;

                // Wall bounce reflection
                if (cx - BUBBLE_R <= WALL_LEFT) {
                    cx = WALL_LEFT + BUBBLE_R;
                    vx = Math.abs(vx);
                } else if (cx + BUBBLE_R >= WALL_RIGHT) {
                    cx = WALL_RIGHT - BUBBLE_R;
                    vx = -Math.abs(vx);
                }

                if (cy <= this.ceilingOffsetY) break;

                // Draw dots
                if (i % 2 === 0) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        _drawCannon(ctx) {
            ctx.save();
            ctx.translate(CANNON_X, CANNON_Y);

            // Platform wheel
            ctx.fillStyle = '#161130';
            ctx.beginPath();
            ctx.arc(0, 0, 36, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Rotating Aim Barrel
            ctx.save();
            ctx.rotate(this.cannonAngle);
            ctx.fillStyle = '#221945';
            ctx.fillRect(-10, -42, 20, 38);
            ctx.strokeStyle = '#ff007f';
            ctx.lineWidth = 2;
            ctx.strokeRect(-10, -42, 20, 38);
            ctx.restore();

            // Loaded Bubble inside cannon center
            drawBubbleGraphic(ctx, 0, 0, this.currentBubble, 0.95);

            // Next Bubble Preview (Left pedestal with Swap cue)
            const nextX = -65;
            const nextY = 8;
            ctx.fillStyle = 'rgba(12, 8, 32, 0.8)';
            ctx.beginPath();
            ctx.arc(nextX, nextY, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffee00';
            ctx.lineWidth = 2;
            ctx.stroke();

            drawBubbleGraphic(ctx, nextX, nextY, this.nextBubble, 0.7);

            ctx.fillStyle = '#aaaaaa';
            ctx.font = '6px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SWAP', nextX, nextY + 30);

            ctx.restore();
        }

        _drawHUD(ctx) {
            ctx.fillStyle = 'rgba(8, 5, 20, 0.85)';
            ctx.fillRect(0, 0, this.W, 46);

            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'left';

            // Score
            ctx.fillStyle = '#8899aa';
            ctx.fillText('SCORE', 16, 18);
            ctx.fillStyle = '#ffee00';
            ctx.fillText(String(this.score).padStart(6, '0'), 16, 34);

            // Stage
            ctx.textAlign = 'center';
            ctx.fillStyle = '#8899aa';
            ctx.fillText('STAGE', this.W / 2, 18);
            ctx.fillStyle = '#00f0ff';
            ctx.fillText('LEVEL ' + this.stage, this.W / 2, 34);

            // Drop Counter (Fouls before ceiling drops)
            ctx.textAlign = 'right';
            ctx.fillStyle = '#8899aa';
            ctx.fillText('DROPS IN', this.W - 16, 18);
            ctx.fillStyle = (this.ceilingDropCounter <= 2) ? '#ff007f' : '#00ff66';
            ctx.fillText(this.ceilingDropCounter + ' SHOTS', this.W - 16, 34);
        }

        _drawTitle(ctx) {
            ctx.textAlign = 'center';

            // Glowing Title
            ctx.fillStyle = '#00f0ff';
            ctx.font = '28px "Press Start 2P", monospace';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 18;
            ctx.fillText('BUBBLE', this.W / 2, 180);

            ctx.fillStyle = '#ff007f';
            ctx.font = '34px "Press Start 2P", monospace';
            ctx.shadowColor = '#ff007f';
            ctx.fillText('MASTER', this.W / 2, 235);
            ctx.shadowBlur = 0;

            // Subtitle
            ctx.fillStyle = '#8899aa';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText('MATCH-3 RETRO BUBBLE SHOOTER', this.W / 2, 275);

            // Showcase Bubbles Cluster
            drawBubbleGraphic(ctx, this.W / 2 - 40, 340, 1, 1.2);
            drawBubbleGraphic(ctx, this.W / 2, 340, 2, 1.2);
            drawBubbleGraphic(ctx, this.W / 2 + 40, 340, 3, 1.2);
            drawBubbleGraphic(ctx, this.W / 2 - 20, 375, 4, 1.2);
            drawBubbleGraphic(ctx, this.W / 2 + 20, 375, 7, 1.2); // Rainbow

            // Start Button
            const btnW = 320;
            const btnH = 50;
            const btnX = (this.W - btnW) / 2;
            const btnY = 445;
            const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;

            ctx.fillStyle = `rgba(0, 240, 255, ${pulse * 0.25})`;
            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(btnX, btnY, btnW, btnH);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('▶ CLICK OR TAP TO PLAY', this.W / 2, btnY + 31);

            // Controls Hint
            ctx.fillStyle = '#667788';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('AIM: MOUSE / TOUCH / ARROWS', this.W / 2, 545);
            ctx.fillText('SHOOT: CLICK / TAP / SPACE', this.W / 2, 570);
            ctx.fillText('SWAP: CLICK BUBBLE / KEY C', this.W / 2, 595);

            // High Score
            ctx.fillStyle = '#ffee00';
            ctx.fillText('HIGH SCORE: ' + this.highScore, this.W / 2, 645);
        }

        _drawLevelClear(ctx) {
            ctx.fillStyle = 'rgba(6, 4, 18, 0.85)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.fillStyle = '#ffee00';
            ctx.font = '22px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('STAGE CLEARED!', this.W / 2, this.H / 2 - 40);

            ctx.fillStyle = '#00f0ff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('BONUS: +5000', this.W / 2, this.H / 2);

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('CLICK TO ADVANCE', this.W / 2, this.H / 2 + 50);
        }

        _drawGameOver(ctx) {
            ctx.fillStyle = 'rgba(20, 2, 10, 0.85)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.fillStyle = '#ff007f';
            ctx.font = '28px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', this.W / 2, this.H / 2 - 40);

            ctx.fillStyle = '#ffffff';
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillText('FINAL SCORE: ' + this.score, this.W / 2, this.H / 2 + 10);

            ctx.fillStyle = '#8899aa';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText('CLICK OR ENTER TO RETRY', this.W / 2, this.H / 2 + 60);
        }

        _drawVictory(ctx) {
            ctx.fillStyle = 'rgba(4, 18, 20, 0.85)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.fillStyle = '#00f0ff';
            ctx.font = '24px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('BUBBLE MASTER!', this.W / 2, this.H / 2 - 40);

            ctx.fillStyle = '#ffee00';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('YOU WON ALL STAGES!', this.W / 2, this.H / 2);

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('FINAL SCORE: ' + this.score, this.W / 2, this.H / 2 + 35);
            ctx.fillText('CLICK TO CONTINUE', this.W / 2, this.H / 2 + 75);
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

