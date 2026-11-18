/* ==========================================================================
   CYBER SNAKE — Neon Synthwave Arcade Engine
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // ============================
    // CONSTANTS & CONFIGURATION
    // ============================
    const CANVAS_SIZE = 600;
    const GRID_SIZE = 24; // 24x24 tiles
    const TILE_SIZE = CANVAS_SIZE / GRID_SIZE; // 25px per tile

    // Game States
    const STATE = {
        TITLE: 'TITLE',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        GAME_OVER: 'GAME_OVER',
        LEVEL_CLEAR: 'LEVEL_CLEAR'
    };

    // Directions
    const DIR = {
        UP:    { x: 0, y: -1, name: 'UP' },
        DOWN:  { x: 0, y: 1,  name: 'DOWN' },
        LEFT:  { x: -1, y: 0, name: 'LEFT' },
        RIGHT: { x: 1, y: 0,  name: 'RIGHT' }
    };

    // Powerup Types
    const ITEM_TYPE = {
        DATA_ORB: 'DATA_ORB',       // Standard food
        OVERCLOCK: 'OVERCLOCK',     // Golden 2x/3x score multiplier
        PHASE_WARP: 'PHASE_WARP',   // Pass through walls & tail
        MAGNET: 'MAGNET',           // Pulls orbs
        GLITCH_BUG: 'GLITCH_BUG'    // Wandering bonus glitch entity
    };

    // Level Designs & Obstacle Layouts
    const LEVELS = [
        {
            level: 1,
            name: 'THE GRID',
            targetLength: 20,
            baseSpeedMs: 110,
            obstacles: []
        },
        {
            level: 2,
            name: 'NEON MATRIX',
            targetLength: 28,
            baseSpeedMs: 100,
            obstacles: [
                // 4 Corner data hubs
                { x: 5, y: 5, w: 2, h: 2 },
                { x: 17, y: 5, w: 2, h: 2 },
                { x: 5, y: 17, w: 2, h: 2 },
                { x: 17, y: 17, w: 2, h: 2 }
            ]
        },
        {
            level: 3,
            name: 'CIRCUIT GATES',
            targetLength: 36,
            baseSpeedMs: 90,
            obstacles: [
                // Center cross with gap
                { x: 11, y: 3, w: 2, h: 6 },
                { x: 11, y: 15, w: 2, h: 6 },
                { x: 3, y: 11, w: 6, h: 2 },
                { x: 15, y: 11, w: 6, h: 2 }
            ]
        },
        {
            level: 4,
            name: 'FIREWALL VAULT',
            targetLength: 45,
            baseSpeedMs: 82,
            obstacles: [
                // Double ring barriers
                { x: 4, y: 4, w: 16, h: 1 },
                { x: 4, y: 19, w: 16, h: 1 },
                { x: 4, y: 5, w: 1, h: 5 },
                { x: 4, y: 14, w: 1, h: 5 },
                { x: 19, y: 5, w: 1, h: 5 },
                { x: 19, y: 14, w: 1, h: 5 },
                { x: 11, y: 9, w: 2, h: 6 }
            ]
        },
        {
            level: 5,
            name: 'QUANTUM OVERDRIVE',
            targetLength: 60,
            baseSpeedMs: 75,
            obstacles: [
                // Dense labyrinth pillars
                { x: 6, y: 6, w: 3, h: 3 },
                { x: 15, y: 6, w: 3, h: 3 },
                { x: 6, y: 15, w: 3, h: 3 },
                { x: 15, y: 15, w: 3, h: 3 },
                { x: 10, y: 10, w: 4, h: 4 }
            ]
        }
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
                if (AudioCtx) this.ctx = new AudioCtx();
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
                case 'turn': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(360, t);
                    osc.frequency.exponentialRampToValueAtTime(540, t + 0.04);
                    gain.gain.setValueAtTime(0.06, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.05);
                    break;
                }
                case 'eat': {
                    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
                    const note = notes[Math.min(notes.length - 1, arg % notes.length)];
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(note, t);
                    osc.frequency.exponentialRampToValueAtTime(note * 1.5, t + 0.08);
                    gain.gain.setValueAtTime(0.18, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.09);
                    break;
                }
                case 'powerup': {
                    const freqs = [523, 659, 784, 1046, 1318];
                    freqs.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.value = f;
                        gain.gain.setValueAtTime(0.12, t + i * 0.05);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.15);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.05);
                        osc.stop(t + i * 0.05 + 0.16);
                    });
                    break;
                }
                case 'nitro': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(140, t);
                    osc.frequency.linearRampToValueAtTime(280, t + 0.08);
                    gain.gain.setValueAtTime(0.08, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.09);
                    break;
                }
                case 'glitch': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(800, t);
                    osc.frequency.setValueAtTime(320, t + 0.03);
                    osc.frequency.setValueAtTime(1200, t + 0.06);
                    gain.gain.setValueAtTime(0.15, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.16);
                    break;
                }
                case 'crash': {
                    // Noise buffer explosion
                    const bufSize = this.ctx.sampleRate * 0.35;
                    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufSize; i++) {
                        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
                    }
                    const noise = this.ctx.createBufferSource();
                    noise.buffer = buffer;
                    const gain = this.ctx.createGain();
                    gain.gain.setValueAtTime(0.35, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                    noise.connect(gain);
                    gain.connect(this.ctx.destination);
                    noise.start(t);
                    break;
                }
                case 'levelClear': {
                    const fanfare = [
                        { f: 587, d: 0.1 }, { f: 659, d: 0.1 }, { f: 784, d: 0.12 },
                        { f: 880, d: 0.15 }, { f: 1174, d: 0.35 }
                    ];
                    let cur = 0;
                    fanfare.forEach(m => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.value = m.f;
                        gain.gain.setValueAtTime(0.18, t + cur);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + cur + m.d);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + cur);
                        osc.stop(t + cur + m.d + 0.02);
                        cur += m.d;
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
        constructor(x, y, color, size = 3, speed = 3) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size;
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * speed + 1;
            this.vx = Math.cos(angle) * spd;
            this.vy = Math.sin(angle) * spd;
            this.alpha = 1.0;
            this.decay = Math.random() * 0.03 + 0.02;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 6;
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    class FloatingText {
        constructor(text, x, y, color = '#ffd700', size = 12) {
            this.text = text;
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size;
            this.alpha = 1.0;
            this.vy = -1.2;
        }

        update() {
            this.y += this.vy;
            this.alpha -= 0.025;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
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
    // MAIN CYBER SNAKE GAME
    // ============================
    class CyberSnakeGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;

            this.W = CANVAS_SIZE;
            this.H = CANVAS_SIZE;

            // Core state
            this.state = STATE.TITLE;
            this.score = 0;
            this.highScore = 0;
            this.currentLevel = 1;
            this.multiplier = 1;
            this.multiplierTimer = 0;
            this.phaseWarpTimer = 0;
            this.magnetTimer = 0;
            this.streak = 0;

            // Snake Body & Direction
            this.snake = [];
            this.dir = DIR.RIGHT;
            this.nextDirQueue = [];
            this.growPending = 0;
            this.isNitro = false;

            // Items & Obstacles
            this.foods = [];
            this.food = null;
            this.powerup = null;
            this.glitchBug = null;
            this.obstacles = [];

            // Timing
            this.lastStepTime = 0;
            this.stepInterval = 110; // ms per tick

            // Particles & Popups
            this.particles = [];
            this.popups = [];
            this.glowAnim = 0;

            this._loadHighScore();
            this._initInputs();
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }

        resize() {
            this.canvas.width = CANVAS_SIZE;
            this.canvas.height = CANVAS_SIZE;
        }

        _loadHighScore() {
            try {
                this.highScore = parseInt(localStorage.getItem('cybersnake_highscore') || '0', 10);
            } catch (e) {}
        }

        _saveHighScore() {
            try {
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('cybersnake_highscore', String(this.highScore));
                }
            } catch (e) {}
        }

        _initInputs() {
            // Keyboard controls
            window.addEventListener('keydown', (e) => {
                Sound.init();
                const code = e.code;

                if (this.state === STATE.TITLE || this.state === STATE.GAME_OVER) {
                    if (code === 'Space' || code === 'Enter') {
                        this.startLevel(1);
                        return;
                    }
                } else if (this.state === STATE.LEVEL_CLEAR) {
                    if (code === 'Space' || code === 'Enter') {
                        this.nextLevel();
                        return;
                    }
                } else if (this.state === STATE.PLAYING) {
                    if (code === 'KeyP' || code === 'Escape') {
                        this.togglePause();
                        return;
                    }
                    if (code === 'Space') {
                        this.isNitro = true;
                        Sound.play('nitro');
                    }

                    // Directions
                    if (code === 'ArrowUp' || code === 'KeyW') {
                        e.preventDefault();
                        this._queueDirection(DIR.UP);
                    } else if (code === 'ArrowDown' || code === 'KeyS') {
                        e.preventDefault();
                        this._queueDirection(DIR.DOWN);
                    } else if (code === 'ArrowLeft' || code === 'KeyA') {
                        e.preventDefault();
                        this._queueDirection(DIR.LEFT);
                    } else if (code === 'ArrowRight' || code === 'KeyD') {
                        e.preventDefault();
                        this._queueDirection(DIR.RIGHT);
                    }
                } else if (this.state === STATE.PAUSED) {
                    if (code === 'KeyP' || code === 'Escape' || code === 'Space') {
                        this.togglePause();
                    }
                }
            });

            window.addEventListener('keyup', (e) => {
                if (e.code === 'Space') {
                    this.isNitro = false;
                }
            });

            // Mobile D-Pad Buttons
            const btnUp = document.getElementById('btn-up');
            const btnDown = document.getElementById('btn-down');
            const btnLeft = document.getElementById('btn-left');
            const btnRight = document.getElementById('btn-right');
            const btnNitro = document.getElementById('btn-nitro');

            const bindDpad = (btn, dir) => {
                if (!btn) return;
                const act = (e) => {
                    e.preventDefault();
                    Sound.init();
                    if (this.state === STATE.TITLE || this.state === STATE.GAME_OVER) {
                        this.startLevel(1);
                    } else if (this.state === STATE.LEVEL_CLEAR) {
                        this.nextLevel();
                    } else if (this.state === STATE.PLAYING) {
                        this._queueDirection(dir);
                    }
                };
                btn.addEventListener('touchstart', act, { passive: false });
                btn.addEventListener('mousedown', act);
            };

            bindDpad(btnUp, DIR.UP);
            bindDpad(btnDown, DIR.DOWN);
            bindDpad(btnLeft, DIR.LEFT);
            bindDpad(btnRight, DIR.RIGHT);

            if (btnNitro) {
                const nitroDown = (e) => {
                    e.preventDefault();
                    Sound.init();
                    this.isNitro = true;
                    Sound.play('nitro');
                };
                const nitroUp = (e) => {
                    e.preventDefault();
                    this.isNitro = false;
                };
                btnNitro.addEventListener('touchstart', nitroDown, { passive: false });
                btnNitro.addEventListener('touchend', nitroUp, { passive: false });
                btnNitro.addEventListener('mousedown', nitroDown);
                btnNitro.addEventListener('mouseup', nitroUp);
            }

            // Top HUD Action Buttons
            const btnSound = document.getElementById('btn-sound');
            const btnPause = document.getElementById('btn-pause');
            const btnRestart = document.getElementById('btn-restart');

            if (btnSound) {
                btnSound.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const on = Sound.toggle();
                    btnSound.textContent = on ? '🔊 SOUND' : '🔇 MUTED';
                });
            }

            if (btnPause) {
                btnPause.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.state === STATE.PLAYING || this.state === STATE.PAUSED) {
                        this.togglePause();
                    }
                });
            }

            if (btnRestart) {
                btnRestart.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.startLevel(this.currentLevel);
                });
            }

            // Canvas Click / Tap for Title and Overlays
            this.canvas.addEventListener('click', () => {
                Sound.init();
                if (this.state === STATE.TITLE || this.state === STATE.GAME_OVER) {
                    this.startLevel(1);
                } else if (this.state === STATE.LEVEL_CLEAR) {
                    this.nextLevel();
                }
            });

            // Swipe gestures for touch screens
            let touchStartX = 0;
            let touchStartY = 0;
            this.canvas.addEventListener('touchstart', (e) => {
                const t = e.touches[0];
                touchStartX = t.clientX;
                touchStartY = t.clientY;
            }, { passive: true });

            this.canvas.addEventListener('touchend', (e) => {
                const t = e.changedTouches[0];
                const dx = t.clientX - touchStartX;
                const dy = t.clientY - touchStartY;
                const threshold = 25;

                if (Math.abs(dx) > Math.abs(dy)) {
                    if (dx > threshold) this._queueDirection(DIR.RIGHT);
                    else if (dx < -threshold) this._queueDirection(DIR.LEFT);
                } else {
                    if (dy > threshold) this._queueDirection(DIR.DOWN);
                    else if (dy < -threshold) this._queueDirection(DIR.UP);
                }
            }, { passive: true });
        }

        _queueDirection(newDir) {
            Sound.init();
            const lastQueued = this.nextDirQueue.length > 0 ?
                this.nextDirQueue[this.nextDirQueue.length - 1] : this.dir;

            // Disallow reversing into self
            if (newDir.x + lastQueued.x === 0 && newDir.y + lastQueued.y === 0) {
                return;
            }

            // Limit queue depth
            if (this.nextDirQueue.length < 3) {
                this.nextDirQueue.push(newDir);
                Sound.play('turn');
            }
        }

        togglePause() {
            if (this.state === STATE.PLAYING) {
                this.state = STATE.PAUSED;
            } else if (this.state === STATE.PAUSED) {
                this.state = STATE.PLAYING;
                this.lastStepTime = performance.now();
            }
        }

        startLevel(lvlNum) {
            this.currentLevel = Math.max(1, Math.min(LEVELS.length, lvlNum));
            const cfg = LEVELS[this.currentLevel - 1];

            this.state = STATE.PLAYING;
            this.stepInterval = cfg.baseSpeedMs;
            this.dir = DIR.RIGHT;
            this.nextDirQueue = [];
            this.growPending = 0;
            this.multiplier = 1;
            this.multiplierTimer = 0;
            this.phaseWarpTimer = 0;
            this.magnetTimer = 0;
            this.streak = 0;
            this.lastStepTime = performance.now();

            if (lvlNum === 1) {
                this.score = 0;
            }

            // Setup snake in center-left moving right
            const startX = 8;
            const startY = 12;
            this.snake = [
                { x: startX, y: startY },
                { x: startX - 1, y: startY },
                { x: startX - 2, y: startY },
                { x: startX - 3, y: startY }
            ];

            // Build obstacles from level configuration
            this.obstacles = [];
            cfg.obstacles.forEach(b => {
                for (let ox = 0; ox < b.w; ox++) {
                    for (let oy = 0; oy < b.h; oy++) {
                        this.obstacles.push({ x: b.x + ox, y: b.y + oy });
                    }
                }
            });

            this.particles.length = 0;
            this.popups.length = 0;
            this.powerup = null;
            this.glitchBug = null;

            this._spawnFood();
            Sound.play('turn');
        }

        nextLevel() {
            if (this.currentLevel < LEVELS.length) {
                this.startLevel(this.currentLevel + 1);
            } else {
                this.startLevel(1); // Victory loop
            }
        }

        _spawnFood() {
            this.foods = [];
            for (let i = 0; i < 3; i++) {
                this._spawnOneFood();
            }
            this.food = this.foods[0] || null;
        }

        _spawnOneFood() {
            let valid = false;
            let pt = null;
            let attempts = 0;

            const foodThemes = [
                { color: '#ff0055', name: 'CYBER BERRY', points: 100 },
                { color: '#ffd700', name: 'SOLAR BIT',   points: 150 },
                { color: '#39ff14', name: 'NEON LIME',   points: 120 }
            ];

            while (!valid && attempts < 250) {
                attempts++;
                // Spawn safely inside visible playing field: not under HUD (y >= 2) and not on boundary edge
                pt = {
                    x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
                    y: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2
                };

                const inSnake = this.snake.some(s => s.x === pt.x && s.y === pt.y);
                const inObstacle = this.obstacles.some(o => o.x === pt.x && o.y === pt.y);
                const inOtherFood = this.foods && this.foods.some(f => f.x === pt.x && f.y === pt.y);
                const inPowerup = this.powerup && this.powerup.x === pt.x && this.powerup.y === pt.y;

                if (!inSnake && !inObstacle && !inOtherFood && !inPowerup) {
                    valid = true;
                }
            }

            if (pt) {
                const theme = foodThemes[this.foods.length % foodThemes.length];
                const newFood = {
                    x: pt.x,
                    y: pt.y,
                    color: theme.color,
                    points: theme.points,
                    name: theme.name
                };
                this.foods.push(newFood);
                this.food = this.foods[0];

                // Glowing spawn spark
                const fx = pt.x * TILE_SIZE + TILE_SIZE / 2;
                const fy = pt.y * TILE_SIZE + TILE_SIZE / 2;
                for (let i = 0; i < 6; i++) {
                    this.particles.push(new Particle(fx, fy, theme.color, 3, 2));
                }
            }
        }

        _maybeSpawnPowerup() {
            if (this.powerup || Math.random() > 0.35) return;

            const types = [ITEM_TYPE.OVERCLOCK, ITEM_TYPE.PHASE_WARP, ITEM_TYPE.MAGNET];
            const type = types[Math.floor(Math.random() * types.length)];

            let pt = null;
            let attempts = 0;
            while (!pt && attempts < 80) {
                attempts++;
                const cand = {
                    x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
                    y: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2
                };
                const inSnake = this.snake.some(s => s.x === cand.x && s.y === cand.y);
                const inObs = this.obstacles.some(o => o.x === cand.x && o.y === cand.y);
                const inFood = this.foods && this.foods.some(f => f.x === cand.x && f.y === cand.y);

                if (!inSnake && !inObs && !inFood) {
                    pt = cand;
                }
            }

            if (pt) {
                this.powerup = {
                    x: pt.x,
                    y: pt.y,
                    type: type,
                    life: 250 // ~12 seconds
                };
            }
        }

        _maybeSpawnGlitchBug() {
            if (this.glitchBug || Math.random() > 0.15) return;

            const cand = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            this.glitchBug = {
                x: cand.x,
                y: cand.y,
                life: 180, // ~8s
                moveTimer: 0
            };
            Sound.play('glitch');
            this.popups.push(new FloatingText('GLITCH DETECTED!', cand.x * TILE_SIZE + 12, cand.y * TILE_SIZE, '#ffea00', 11));
        }


        // ============================
        // STEP & GAME TICK
        // ============================
        step() {
            // Apply next queued direction
            if (this.nextDirQueue.length > 0) {
                this.dir = this.nextDirQueue.shift();
            }

            const head = this.snake[0];
            const newHead = {
                x: head.x + this.dir.x,
                y: head.y + this.dir.y
            };

            const isPhased = this.phaseWarpTimer > 0;

            // Boundary wrapping or collision
            if (isPhased) {
                // Wrap through edges during Phase Warp!
                if (newHead.x < 0) newHead.x = GRID_SIZE - 1;
                if (newHead.x >= GRID_SIZE) newHead.x = 0;
                if (newHead.y < 0) newHead.y = GRID_SIZE - 1;
                if (newHead.y >= GRID_SIZE) newHead.y = 0;
            } else {
                // Wall collision
                if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
                    this._gameOver('WALL COLLISION');
                    return;
                }
            }

            // Obstacle collision
            if (!isPhased && this.obstacles.some(o => o.x === newHead.x && o.y === newHead.y)) {
                this._gameOver('CYBER BARRIER HIT');
                return;
            }

            // Self-tail collision (exclude tail tip if not growing)
            const checkBody = this.growPending > 0 ? this.snake : this.snake.slice(0, -1);
            if (!isPhased && checkBody.some(s => s.x === newHead.x && s.y === newHead.y)) {
                this._gameOver('CIRCUIT FEEDBACK (SELF HIT)');
                return;
            }

            // Advance snake
            this.snake.unshift(newHead);

            // Trail particles behind head
            const hpx = newHead.x * TILE_SIZE + TILE_SIZE / 2;
            const hpy = newHead.y * TILE_SIZE + TILE_SIZE / 2;
            const trailCol = isPhased ? '#ff007f' : (this.isNitro ? '#ffaa00' : '#00f0ff');
            this.particles.push(new Particle(hpx, hpy, trailCol, 4, 1.5));

            // Check food collision with all active dots
            let ate = false;
            let eatenIndex = -1;
            if (this.foods && this.foods.length > 0) {
                for (let i = 0; i < this.foods.length; i++) {
                    const f = this.foods[i];
                    if (newHead.x === f.x && newHead.y === f.y) {
                        eatenIndex = i;
                        break;
                    }
                }
            }

            if (eatenIndex !== -1) {
                ate = true;
                const f = this.foods[eatenIndex];
                this.streak++;
                this.growPending += 1;

                const pts = f.points * this.multiplier;
                this.score += pts;
                this._saveHighScore();

                Sound.play('eat', this.streak);
                this._spawnBurst(hpx, hpy, f.color, 16);
                this.popups.push(new FloatingText(`+${pts}`, hpx, hpy - 12, f.color, 13));

                // Remove eaten dot and immediately spawn a fresh dot!
                this.foods.splice(eatenIndex, 1);
                this._spawnOneFood();
                this.food = this.foods[0] || null;

                this._maybeSpawnPowerup();
                this._maybeSpawnGlitchBug();

                // Check Level Clear
                const cfg = LEVELS[this.currentLevel - 1];
                if (this.snake.length >= cfg.targetLength) {
                    this._levelClear();
                    return;
                }
            }

            // Magnet pull effect
            if (this.magnetTimer > 0 && this.foods && this.foods.length > 0 && !ate) {
                let closest = null;
                let minDist = 999;
                for (const f of this.foods) {
                    const dist = Math.abs(newHead.x - f.x) + Math.abs(newHead.y - f.y);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = f;
                    }
                }
                if (closest && minDist <= 4) {
                    if (closest.x < newHead.x) closest.x++;
                    else if (closest.x > newHead.x) closest.x--;
                    if (closest.y < newHead.y) closest.y++;
                    else if (closest.y > newHead.y) closest.y--;
                }
            }

            // Powerup collision
            if (this.powerup && newHead.x === this.powerup.x && newHead.y === this.powerup.y) {
                this._applyPowerup(this.powerup.type);
                this.powerup = null;
            }

            // Glitch bug collision
            if (this.glitchBug && newHead.x === this.glitchBug.x && newHead.y === this.glitchBug.y) {
                const gpts = 500 * this.multiplier;
                this.score += gpts;
                this._saveHighScore();
                Sound.play('glitch');
                this._spawnBurst(hpx, hpy, '#ffea00', 20);
                this.popups.push(new FloatingText(`GLITCH PURGED! +${gpts}`, hpx, hpy - 12, '#ffea00', 13));
                this.glitchBug = null;
            }

            // Grow or slide tail
            if (this.growPending > 0) {
                this.growPending--;
            } else {
                this.snake.pop();
            }

            // Update timers
            if (this.multiplierTimer > 0) {
                this.multiplierTimer--;
                if (this.multiplierTimer === 0) this.multiplier = 1;
            }
            if (this.phaseWarpTimer > 0) this.phaseWarpTimer--;
            if (this.magnetTimer > 0) this.magnetTimer--;

            if (this.powerup) {
                this.powerup.life--;
                if (this.powerup.life <= 0) this.powerup = null;
            }

            if (this.glitchBug) {
                this.glitchBug.life--;
                this.glitchBug.moveTimer++;
                if (this.glitchBug.moveTimer >= 3) {
                    this.glitchBug.moveTimer = 0;
                    const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
                    const rd = dirs[Math.floor(Math.random() * dirs.length)];
                    const nx = Math.max(0, Math.min(GRID_SIZE - 1, this.glitchBug.x + rd.x));
                    const ny = Math.max(0, Math.min(GRID_SIZE - 1, this.glitchBug.y + rd.y));
                    if (!this.obstacles.some(o => o.x === nx && o.y === ny)) {
                        this.glitchBug.x = nx;
                        this.glitchBug.y = ny;
                    }
                }
                if (this.glitchBug.life <= 0) this.glitchBug = null;
            }
        }

        _applyPowerup(type) {
            Sound.play('powerup');
            const hpx = this.snake[0].x * TILE_SIZE + TILE_SIZE / 2;
            const hpy = this.snake[0].y * TILE_SIZE + TILE_SIZE / 2;

            switch (type) {
                case ITEM_TYPE.OVERCLOCK:
                    this.multiplier = 3;
                    this.multiplierTimer = 110; // ~12s
                    this.popups.push(new FloatingText('3X OVERCLOCK!', hpx, hpy - 12, '#ffea00', 14));
                    this._spawnBurst(hpx, hpy, '#ffea00', 16);
                    break;
                case ITEM_TYPE.PHASE_WARP:
                    this.phaseWarpTimer = 90; // ~9s
                    this.popups.push(new FloatingText('PHASE WARP ON!', hpx, hpy - 12, '#ff007f', 14));
                    this._spawnBurst(hpx, hpy, '#ff007f', 16);
                    break;
                case ITEM_TYPE.MAGNET:
                    this.magnetTimer = 120; // ~12s
                    this.popups.push(new FloatingText('ORB MAGNET!', hpx, hpy - 12, '#39ff14', 14));
                    this._spawnBurst(hpx, hpy, '#39ff14', 16);
                    break;
            }
        }

        _spawnBurst(x, y, color, count = 12) {
            for (let i = 0; i < count; i++) {
                this.particles.push(new Particle(x, y, color, Math.random() * 4 + 2, Math.random() * 4 + 2));
            }
        }

        _gameOver(reason = '') {
            this.state = STATE.GAME_OVER;
            Sound.play('crash');
            this._saveHighScore();

            const head = this.snake[0];
            this._spawnBurst(head.x * TILE_SIZE + TILE_SIZE / 2, head.y * TILE_SIZE + TILE_SIZE / 2, '#ff0055', 30);
            this.popups.push(new FloatingText(reason, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 40, '#ff0055', 12));
        }

        _levelClear() {
            this.state = STATE.LEVEL_CLEAR;
            Sound.play('levelClear');
            this._saveHighScore();

            for (let i = 0; i < 40; i++) {
                const rx = Math.random() * CANVAS_SIZE;
                const ry = Math.random() * CANVAS_SIZE;
                const colors = ['#00f0ff', '#39ff14', '#ffea00', '#ff007f'];
                this.particles.push(new Particle(rx, ry, colors[Math.floor(Math.random() * colors.length)], 4, 3));
            }
        }


        // ============================
        // UPDATE & RENDER
        // ============================
        update(now) {
            this.glowAnim += 0.05;

            // Tick snake logic
            if (this.state === STATE.PLAYING) {
                let speed = this.stepInterval;
                if (this.isNitro) speed = Math.floor(speed * 0.55);

                if (now - this.lastStepTime >= speed) {
                    this.lastStepTime = now;
                    this.step();
                }
            }

            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].alpha <= 0) this.particles.splice(i, 1);
            }

            // Update popups
            for (let i = this.popups.length - 1; i >= 0; i--) {
                this.popups[i].update();
                if (this.popups[i].alpha <= 0) this.popups.splice(i, 1);
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.W, this.H);

            // 1. Cyber Synthwave Grid Background
            this._drawGrid(ctx);

            // 2. Obstacles & Cyber Walls
            this._drawObstacles(ctx);

            // 3. Food, Powerups & Glitch Bug
            this._drawItems(ctx);

            // 4. Snake Body & Visor
            if (this.state !== STATE.TITLE) {
                this._drawSnake(ctx);
            }

            // 5. Particles & Lasers
            this.particles.forEach(p => p.draw(ctx));

            // 6. Floating Text Popups
            this.popups.forEach(pop => pop.draw(ctx));

            // 7. HUD Status
            if (this.state === STATE.PLAYING || this.state === STATE.PAUSED) {
                this._drawHUD(ctx);
            }

            // 8. Overlays
            if (this.state === STATE.TITLE) {
                this._drawTitleScreen(ctx);
            } else if (this.state === STATE.PAUSED) {
                this._drawPauseOverlay(ctx);
            } else if (this.state === STATE.LEVEL_CLEAR) {
                this._drawLevelClearOverlay(ctx);
            } else if (this.state === STATE.GAME_OVER) {
                this._drawGameOverOverlay(ctx);
            }
        }

        _drawGrid(ctx) {
            // Dark cyber gradient base
            const bgGrad = ctx.createLinearGradient(0, 0, 0, this.H);
            bgGrad.addColorStop(0, '#0a061b');
            bgGrad.addColorStop(0.5, '#060410');
            bgGrad.addColorStop(1, '#020108');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, this.W, this.H);

            // Perspective synthwave lines & grid
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
            ctx.lineWidth = 1;
            for (let c = 0; c <= GRID_SIZE; c++) {
                const x = c * TILE_SIZE;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, this.H);
                ctx.stroke();
            }
            for (let r = 0; r <= GRID_SIZE; r++) {
                const y = r * TILE_SIZE;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.W, y);
                ctx.stroke();
            }

            // Glowing boundary perimeter
            const phaseActive = this.phaseWarpTimer > 0;
            ctx.strokeStyle = phaseActive ? 'rgba(255, 0, 127, 0.7)' : 'rgba(0, 240, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.shadowColor = phaseActive ? '#ff007f' : '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.strokeRect(1, 1, this.W - 2, this.H - 2);
            ctx.shadowBlur = 0;
        }

        _drawObstacles(ctx) {
            this.obstacles.forEach(o => {
                const x = o.x * TILE_SIZE;
                const y = o.y * TILE_SIZE;

                // Glowing neon barrier block
                ctx.fillStyle = '#140c2e';
                ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

                ctx.strokeStyle = '#ff0055';
                ctx.lineWidth = 1.5;
                ctx.shadowColor = '#ff0055';
                ctx.shadowBlur = 8;
                ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.shadowBlur = 0;

                // Inner cross hatch
                ctx.strokeStyle = 'rgba(255, 0, 85, 0.35)';
                ctx.beginPath();
                ctx.moveTo(x + 4, y + 4);
                ctx.lineTo(x + TILE_SIZE - 4, y + TILE_SIZE - 4);
                ctx.moveTo(x + TILE_SIZE - 4, y + 4);
                ctx.lineTo(x + 4, y + TILE_SIZE - 4);
                ctx.stroke();
            });
        }

        _drawItems(ctx) {
            const basePulse = Math.sin(this.glowAnim) * 2;

            // 1. Food / Energy Orbs (Multiple glowing dots on screen)
            if (this.foods && this.foods.length > 0) {
                this.foods.forEach((f, idx) => {
                    const fx = f.x * TILE_SIZE + TILE_SIZE / 2;
                    const fy = f.y * TILE_SIZE + TILE_SIZE / 2;
                    const pulse = Math.sin(this.glowAnim * 1.6 + idx * 1.3) * 2.5;
                    const radius = 8 + pulse;

                    ctx.save();

                    // Expanding sonar radar ping ring
                    const beaconPhase = (Date.now() * 0.0025 + idx * 0.33) % 1;
                    const beaconRadius = radius + beaconPhase * 16;
                    ctx.strokeStyle = f.color;
                    ctx.globalAlpha = Math.max(0, 1 - beaconPhase);
                    ctx.lineWidth = 1.8;
                    ctx.beginPath();
                    ctx.arc(fx, fy, beaconRadius, 0, Math.PI * 2);
                    ctx.stroke();

                    // Radiant Neon Outer Glow
                    ctx.globalAlpha = 1.0;
                    ctx.shadowColor = f.color;
                    ctx.shadowBlur = 18;
                    ctx.fillStyle = f.color;
                    ctx.beginPath();
                    ctx.arc(fx, fy, radius, 0, Math.PI * 2);
                    ctx.fill();

                    // Inner bright core
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(fx - 2, fy - 2, radius * 0.45, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.restore();
                });
            }

            // 2. Powerup
            if (this.powerup) {
                const px = this.powerup.x * TILE_SIZE + TILE_SIZE / 2;
                const py = this.powerup.y * TILE_SIZE + TILE_SIZE / 2;
                const pr = 9 + pulse;

                ctx.save();
                let col = '#ffea00';
                let symbol = '⚡';
                if (this.powerup.type === ITEM_TYPE.PHASE_WARP) {
                    col = '#ff007f';
                    symbol = '✦';
                } else if (this.powerup.type === ITEM_TYPE.MAGNET) {
                    col = '#39ff14';
                    symbol = '🧲';
                }

                ctx.shadowColor = col;
                ctx.shadowBlur = 16;
                ctx.strokeStyle = col;
                ctx.lineWidth = 2;
                ctx.strokeRect(px - pr, py - pr, pr * 2, pr * 2);

                ctx.fillStyle = col;
                ctx.font = '10px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(symbol, px, py);
                ctx.restore();
            }

            // 3. Glitch Bug
            if (this.glitchBug) {
                const gx = this.glitchBug.x * TILE_SIZE + 2;
                const gy = this.glitchBug.y * TILE_SIZE + 2;
                const s = TILE_SIZE - 4;

                ctx.save();
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 14;
                ctx.fillStyle = Math.random() < 0.5 ? '#ffea00' : '#ff0055';
                ctx.fillRect(gx, gy, s, s);

                // Pixel bug antenna
                ctx.fillStyle = '#000000';
                ctx.fillRect(gx + 4, gy + 4, 3, 3);
                ctx.fillRect(gx + s - 7, gy + 4, 3, 3);
                ctx.restore();
            }
        }

        _drawSnake(ctx) {
            const isPhased = this.phaseWarpTimer > 0;
            const isBoost = this.isNitro;

            // Draw body segments from tail to neck
            for (let i = this.snake.length - 1; i >= 1; i--) {
                const seg = this.snake[i];
                const x = seg.x * TILE_SIZE;
                const y = seg.y * TILE_SIZE;
                const progress = i / this.snake.length;

                // Color gradient along snake body
                let bodyColor;
                if (isPhased) {
                    bodyColor = `rgba(255, 0, 127, ${0.4 + 0.5 * (1 - progress)})`;
                } else if (isBoost) {
                    bodyColor = `rgb(${255}, ${Math.floor(170 * (1 - progress))}, 0)`;
                } else {
                    // Cyan into bright lime tail
                    const r = Math.floor(57 * progress);
                    const g = Math.floor(240 - 50 * progress);
                    const b = Math.floor(255 * (1 - progress));
                    bodyColor = `rgb(${r}, ${g}, ${b})`;
                }

                ctx.save();
                ctx.fillStyle = bodyColor;
                ctx.shadowColor = isPhased ? '#ff007f' : (isBoost ? '#ffaa00' : '#00f0ff');
                ctx.shadowBlur = 8;

                const pad = 2;
                ctx.fillRect(x + pad, y + pad, TILE_SIZE - pad * 2, TILE_SIZE - pad * 2);

                // Segment metallic core line
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.fillRect(x + pad + 3, y + pad + 3, TILE_SIZE - pad * 2 - 6, TILE_SIZE - pad * 2 - 6);
                ctx.restore();
            }

            // Draw Snake Head
            const head = this.snake[0];
            const hx = head.x * TILE_SIZE;
            const hy = head.y * TILE_SIZE;

            ctx.save();
            ctx.fillStyle = isPhased ? '#ff007f' : (isBoost ? '#ffcc00' : '#ffffff');
            ctx.shadowColor = isPhased ? '#ff007f' : (isBoost ? '#ffaa00' : '#00f0ff');
            ctx.shadowBlur = 16;
            ctx.fillRect(hx + 1, hy + 1, TILE_SIZE - 2, TILE_SIZE - 2);

            // Robotic Cyber Visor / Eyes based on direction
            ctx.fillStyle = isPhased ? '#00f0ff' : '#ff0055';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 6;

            if (this.dir === DIR.RIGHT) {
                ctx.fillRect(hx + TILE_SIZE - 7, hy + 4, 4, 5);
                ctx.fillRect(hx + TILE_SIZE - 7, hy + TILE_SIZE - 9, 4, 5);
            } else if (this.dir === DIR.LEFT) {
                ctx.fillRect(hx + 3, hy + 4, 4, 5);
                ctx.fillRect(hx + 3, hy + TILE_SIZE - 9, 4, 5);
            } else if (this.dir === DIR.UP) {
                ctx.fillRect(hx + 4, hy + 3, 5, 4);
                ctx.fillRect(hx + TILE_SIZE - 9, hy + 3, 5, 4);
            } else if (this.dir === DIR.DOWN) {
                ctx.fillRect(hx + 4, hy + TILE_SIZE - 7, 5, 4);
                ctx.fillRect(hx + TILE_SIZE - 9, hy + TILE_SIZE - 7, 5, 4);
            }
            ctx.restore();
        }

        _drawHUD(ctx) {
            const cfg = LEVELS[this.currentLevel - 1];

            // Semi-transparent sleek top HUD bar
            ctx.fillStyle = 'rgba(6, 4, 16, 0.75)';
            ctx.fillRect(0, 0, this.W, 34);
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 34);
            ctx.lineTo(this.W, 34);
            ctx.stroke();

            // Level & Name
            ctx.fillStyle = '#00f0ff';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`LVL ${this.currentLevel} • ${cfg.name}`, 12, 21);

            // Length Progress
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.fillText(`LEN: ${this.snake.length}/${cfg.targetLength}`, this.W / 2, 21);

            // Score & Multiplier
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'right';
            const multText = this.multiplier > 1 ? ` (x${this.multiplier})` : '';
            ctx.fillText(`SCORE: ${this.score}${multText}`, this.W - 12, 21);

            // Active Powerup Indicators
            let buffOffset = 52;
            if (this.phaseWarpTimer > 0) {
                ctx.fillStyle = 'rgba(255, 0, 127, 0.25)';
                ctx.fillRect(8, buffOffset - 11, 150, 14);
                ctx.fillStyle = '#ff007f';
                ctx.font = '8px "Press Start 2P", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`⚡ PHASE WARP: ${Math.ceil(this.phaseWarpTimer / 10)}s`, 12, buffOffset);
                buffOffset += 18;
            }
            if (this.multiplierTimer > 0) {
                ctx.fillStyle = 'rgba(255, 234, 0, 0.25)';
                ctx.fillRect(8, buffOffset - 11, 150, 14);
                ctx.fillStyle = '#ffea00';
                ctx.font = '8px "Press Start 2P", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`★ 3X BOOST: ${Math.ceil(this.multiplierTimer / 10)}s`, 12, buffOffset);
                buffOffset += 18;
            }
            if (this.magnetTimer > 0) {
                ctx.fillStyle = 'rgba(57, 255, 20, 0.25)';
                ctx.fillRect(8, buffOffset - 11, 150, 14);
                ctx.fillStyle = '#39ff14';
                ctx.font = '8px "Press Start 2P", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`🧲 MAGNET: ${Math.ceil(this.magnetTimer / 10)}s`, 12, buffOffset);
            }
        }

        _drawTitleScreen(ctx) {
            ctx.textAlign = 'center';

            // Title
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 20;
            ctx.font = '32px "Press Start 2P", monospace';
            ctx.fillText('CYBER', this.W / 2, 160);

            ctx.fillStyle = '#ff007f';
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 24;
            ctx.font = '38px "Press Start 2P", monospace';
            ctx.fillText('SNAKE', this.W / 2, 215);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#39ff14';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('NEON SYNTHWAVE REFLEX ARCADE', this.W / 2, 255);

            // Animated demo snake preview
            const demoY = 325;
            const segments = 10;
            for (let i = 0; i < segments; i++) {
                const dx = this.W / 2 + Math.cos(this.glowAnim + i * 0.4) * 60 - (i * 12);
                const dy = demoY + Math.sin(this.glowAnim + i * 0.4) * 18;
                ctx.fillStyle = i === 0 ? '#ffffff' : (i % 2 === 0 ? '#00f0ff' : '#39ff14');
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 8;
                ctx.fillRect(dx - 8, dy - 8, 16, 16);
            }
            ctx.shadowBlur = 0;

            // Start Button
            const pulse = Math.sin(this.glowAnim * 2) * 0.2 + 0.8;
            ctx.fillStyle = `rgba(0, 240, 255, ${0.2 * pulse})`;
            ctx.fillRect(this.W / 2 - 160, 410, 320, 52);
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.W / 2 - 160, 410, 320, 52);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('▶ CLICK OR SPACE TO PLAY', this.W / 2, 442);

            // High Score
            ctx.fillStyle = '#ffd700';
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillText(`HIGH SCORE: ${this.highScore}`, this.W / 2, 510);

            // Instructions
            ctx.fillStyle = '#8899aa';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('ARROWS / WASD: TURN • SPACE: NITRO', this.W / 2, 545);
            ctx.fillText('EAT ORBS • PHASE WARP • 5 CYBER ARENAS', this.W / 2, 565);
        }

        _drawPauseOverlay(ctx) {
            ctx.fillStyle = 'rgba(4, 2, 12, 0.85)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 16;
            ctx.font = '24px "Press Start 2P", monospace';
            ctx.fillText('PAUSED', this.W / 2, this.H / 2 - 20);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('PRESS P OR TAP TO RESUME', this.W / 2, this.H / 2 + 25);
        }

        _drawLevelClearOverlay(ctx) {
            ctx.fillStyle = 'rgba(4, 2, 12, 0.88)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#39ff14';
            ctx.shadowColor = '#39ff14';
            ctx.shadowBlur = 20;
            ctx.font = '24px "Press Start 2P", monospace';
            ctx.fillText('ARENA CLEARED!', this.W / 2, 210);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffd700';
            ctx.font = '13px "Press Start 2P", monospace';
            ctx.fillText(`SCORE: ${this.score}`, this.W / 2, 275);
            ctx.fillText(`FINAL LENGTH: ${this.snake.length}`, this.W / 2, 310);

            ctx.fillStyle = '#00f0ff';
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillText('CLICK OR SPACE TO ADVANCE', this.W / 2, 400);
        }

        _drawGameOverOverlay(ctx) {
            ctx.fillStyle = 'rgba(4, 2, 12, 0.9)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 20;
            ctx.font = '26px "Press Start 2P", monospace';
            ctx.fillText('CIRCUIT CRASHED', this.W / 2, 200);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText(`SCORE: ${this.score}`, this.W / 2, 260);

            ctx.fillStyle = '#ffd700';
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillText(`HIGH SCORE: ${this.highScore}`, this.W / 2, 300);

            ctx.fillStyle = '#8899aa';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText(`MAX LENGTH: ${this.snake.length}`, this.W / 2, 335);

            ctx.fillStyle = '#00f0ff';
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillText('CLICK OR SPACE TO RETRY', this.W / 2, 420);
        }

        run() {
            const loop = (now) => {
                this.update(now);
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
        const game = new CyberSnakeGame();
        game.run();
    });

})();

