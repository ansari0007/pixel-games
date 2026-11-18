/* ==========================================================================
   MERGE CUBE 2048 — 3D Physics Cube Merge Arcade Game
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // ============================
    // CONSTANTS & SETTINGS
    // ============================
    const CANVAS_W = 560;
    const CANVAS_H = 750;

    const ARENA_X = 50;
    const ARENA_W = 460;
    const ARENA_RIGHT = ARENA_X + ARENA_W; // 510
    const ARENA_TOP = 135;
    const DANGER_Y = 560;
    const SPAWN_Y = 665;
    const CUBE_SIZE = 52;
    const CUBE_RADIUS = CUBE_SIZE * 0.48; // 25px

    const STATE = {
        START: 'START',
        PLAYING: 'PLAYING',
        GAME_OVER: 'GAME_OVER'
    };

    // Color Palette per Cube Number (3D Isometric Face Tints)
    const CUBE_COLORS = {
        2:    { base: '#ff9800', top: '#ffb74d', right: '#f57c00', text: '#ffffff' },
        4:    { base: '#ff5722', top: '#ff8a65', right: '#e64a19', text: '#ffffff' },
        8:    { base: '#e91e63', top: '#f06292', right: '#c2185b', text: '#ffffff' },
        16:   { base: '#9c27b0', top: '#ba68c8', right: '#7b1fa2', text: '#ffffff' },
        32:   { base: '#3f51b5', top: '#7986cb', right: '#303f9f', text: '#ffffff' },
        64:   { base: '#00b0ff', top: '#40c4ff', right: '#0091ea', text: '#ffffff' },
        128:  { base: '#00e676', top: '#69f0ae', right: '#00c853', text: '#060710' },
        256:  { base: '#ffea00', top: '#ffff00', right: '#ffd600', text: '#060710' },
        512:  { base: '#ff3d00', top: '#ff6e40', right: '#dd2c00', text: '#ffffff' },
        1024: { base: '#00f0ff', top: '#80d8ff', right: '#00b0ff', text: '#060710' },
        2048: { base: '#ffd700', top: '#fff176', right: '#fbc02d', text: '#060710', crown: true },
        4096: { base: '#e040fb', top: '#ea80fc', right: '#aa00ff', text: '#ffffff', crown: true },
        8192: { base: '#ffffff', top: '#ffffff', right: '#cfd8dc', text: '#060710', crown: true },
        BOMB: { base: '#212121', top: '#424242', right: '#000000', text: '#ff2a5f', isBomb: true }
    };

    const SPAWN_VALUES = [2, 4, 8, 16, 32, 64];


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
                case 'launch': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(320, t);
                    osc.frequency.exponentialRampToValueAtTime(750, t + 0.08);
                    gain.gain.setValueAtTime(0.1, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.09);
                    break;
                }
                case 'clack': {
                    // Wooden block collision clack
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    const f = 280 + Math.random() * 80 + Math.min(arg * 15, 300);
                    osc.frequency.setValueAtTime(f, t);
                    osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);
                    gain.gain.setValueAtTime(0.14, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.07);
                    break;
                }
                case 'merge': {
                    // Harmonic bell chime ascending with cube value
                    const baseFreq = 440 * Math.pow(1.08, Math.min(arg, 12));
                    [baseFreq, baseFreq * 1.25, baseFreq * 1.5].forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(f, t + i * 0.04);
                        gain.gain.setValueAtTime(0.15, t + i * 0.04);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.25);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.04);
                        osc.stop(t + i * 0.04 + 0.28);
                    });
                    break;
                }
                case 'legendary': {
                    // 2048 Legendary Achievement Fanfare
                    const fanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51];
                    fanfare.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(f, t + i * 0.08);
                        gain.gain.setValueAtTime(0.22, t + i * 0.08);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.4);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.08);
                        osc.stop(t + i * 0.08 + 0.45);
                    });
                    break;
                }
                case 'bomb': {
                    // Deep explosion boom
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(160, t);
                    osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
                    gain.gain.setValueAtTime(0.35, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.46);
                    break;
                }
                case 'warning': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(440, t);
                    osc.frequency.setValueAtTime(330, t + 0.1);
                    gain.gain.setValueAtTime(0.12, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.22);
                    break;
                }
            }
        }
    };


    // ============================
    // PARTICLES & POPUPS
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
            this.vy += 0.15; // subtle gravity
            this.life -= 0.025;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    class FloatingText {
        constructor(x, y, text, color) {
            this.x = x;
            this.y = y;
            this.text = text;
            this.color = color;
            this.life = 1;
            this.vy = -1.6;
        }

        update() {
            this.y += this.vy;
            this.life -= 0.02;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
    }


    // ============================
    // 3D ISOMETRIC CUBE ENTITY
    // ============================
    class Cube {
        constructor(val, x, y, isShooter = false) {
            this.val = val;
            this.isBomb = (val === 'BOMB');
            this.x = x;
            this.y = y;
            this.z = 0; // vertical hop height in pixels
            this.vz = 0;
            this.vx = 0;
            this.vy = 0;
            this.angle = 0;
            this.va = 0;
            this.scale = 1.0;
            this.isShooter = isShooter;
            this.dead = false;
            this.mergedThisFrame = false;
        }

        update(dt) {
            if (this.dead) return;

            // Horizontal & vertical physics movement
            this.x += this.vx;
            this.y += this.vy;
            this.angle += this.va;

            // Natural deceleration (friction)
            this.vx *= 0.982;
            this.vy *= 0.982;
            this.va *= 0.95;

            if (Math.abs(this.vx) < 0.05) this.vx = 0;
            if (Math.abs(this.vy) < 0.05) this.vy = 0;
            if (Math.abs(this.va) < 0.005) this.va = 0;

            // Z-axis jump physics
            if (this.z > 0 || this.vz > 0) {
                this.z += this.vz;
                this.vz -= 0.45;
                if (this.z <= 0) {
                    this.z = 0;
                    this.vz = 0;
                }
            }

            // Spring scale back to 1.0
            if (this.scale > 1.0) {
                this.scale = Math.max(1.0, this.scale - 0.04);
            }

            // Wall Collisions
            const r = CUBE_SIZE / 2;
            if (this.x - r < ARENA_X) {
                this.x = ARENA_X + r;
                this.vx = -this.vx * 0.72;
                this.va = (Math.random() - 0.5) * 0.06;
                Sound.play('clack', 2);
            } else if (this.x + r > ARENA_RIGHT) {
                this.x = ARENA_RIGHT - r;
                this.vx = -this.vx * 0.72;
                this.va = (Math.random() - 0.5) * 0.06;
                Sound.play('clack', 2);
            }

            if (this.y - r < ARENA_TOP) {
                this.y = ARENA_TOP + r;
                this.vy = -this.vy * 0.72;
                this.va = (Math.random() - 0.5) * 0.06;
                Sound.play('clack', 2);
            }

            // Bottom Arena limit
            if (this.y + r > CANVAS_H - 10) {
                this.y = CANVAS_H - 10 - r;
                this.vy = -this.vy * 0.72;
            }
        }

        draw(ctx) {
            ctx.save();

            // 1. Draw Drop Shadow on Arena Floor
            const r = (CUBE_SIZE / 2) * this.scale;
            const shadowAlpha = Math.max(0.12, 0.35 - (this.z / 180));
            ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + r * 0.75, r * 1.1, r * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();

            // 2. Translate with Z-Hop offset
            ctx.translate(this.x, this.y - this.z);
            ctx.rotate(this.angle);
            ctx.scale(this.scale, this.scale);

            const cfg = CUBE_COLORS[this.val] || CUBE_COLORS[2];
            const size = CUBE_SIZE;
            const bevel = 6;

            // 3D Isometric Front Face
            ctx.fillStyle = cfg.base;
            ctx.beginPath();
            ctx.roundRect(-size / 2, -size / 2, size, size, bevel);
            ctx.fill();

            // Top Bevel Highlight
            ctx.fillStyle = cfg.top;
            ctx.beginPath();
            ctx.moveTo(-size / 2, -size / 2);
            ctx.lineTo(size / 2, -size / 2);
            ctx.lineTo(size / 2 - bevel, -size / 2 + bevel);
            ctx.lineTo(-size / 2 + bevel, -size / 2 + bevel);
            ctx.closePath();
            ctx.fill();

            // Right Bevel Shadow
            ctx.fillStyle = cfg.right;
            ctx.beginPath();
            ctx.moveTo(size / 2, -size / 2);
            ctx.lineTo(size / 2, size / 2);
            ctx.lineTo(size / 2 - bevel, size / 2 - bevel);
            ctx.lineTo(size / 2 - bevel, -size / 2 + bevel);
            ctx.closePath();
            ctx.fill();

            // Outer Stroke Border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = cfg.crown ? 2.5 : 1.5;
            if (cfg.crown) {
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 12;
            }
            ctx.stroke();

            // Inner Number / Symbol Label
            ctx.font = this.val >= 1024 ? '11px "Press Start 2P", monospace' : (this.val >= 128 ? '13px "Press Start 2P", monospace' : '15px "Press Start 2P", monospace');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = cfg.text;

            if (this.isBomb) {
                ctx.font = '16px "Press Start 2P", monospace';
                ctx.fillText('💣', 0, 1);
            } else {
                ctx.fillText(this.val, 0, 1);
                if (cfg.crown) {
                    ctx.font = '9px "Press Start 2P", monospace';
                    ctx.fillText('👑', 0, -size / 2 + 10);
                }
            }

            ctx.restore();
        }
    }


    // ============================
    // MAIN GAME CONTROLLER
    // ============================
    class MergeCubeGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;

            this.W = CANVAS_W;
            this.H = CANVAS_H;

            // Game State
            this.state = STATE.PLAYING;
            this.score = 0;
            this.highScore = parseInt(localStorage.getItem('merge_cube_2048_high') || '0', 10);
            this.highestCube = 2;
            this.bombsLeft = 2;
            this.dangerTimer = 0;
            this.screenShake = 0;

            // Arena & Shooter
            this.cubes = [];
            this.particles = [];
            this.floatingTexts = [];

            this.shooterX = CANVAS_W / 2;
            this.currentValue = 2;
            this.nextValue = 4;
            this.isAiming = false;
            this.shootCooldown = 0;

            this._initCanvas();
            this._initDOM();
            this._initInputs();
            this._setupInitialArena();
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
            const btnBomb = document.getElementById('btn-bomb');
            const btnSound = document.getElementById('btn-sound');
            const btnRestart = document.getElementById('btn-restart');

            if (btnBomb) {
                btnBomb.addEventListener('click', () => {
                    this.useBombPowerUp();
                });
            }

            if (btnSound) {
                btnSound.addEventListener('click', () => {
                    const on = Sound.toggle();
                    btnSound.textContent = on ? '🔊 SOUND' : '🔇 MUTED';
                });
            }

            if (btnRestart) {
                btnRestart.addEventListener('click', () => {
                    this.resetGame();
                });
            }
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

            const onPointerDown = (clientX, clientY) => {
                Sound.init();
                const pos = getCanvasPos(clientX, clientY);

                if (this.state === STATE.GAME_OVER) {
                    this.resetGame();
                    return;
                }

                this.isAiming = true;
                this._clampShooterX(pos.x);
            };

            const onPointerMove = (clientX, clientY) => {
                if (!this.isAiming) return;
                const pos = getCanvasPos(clientX, clientY);
                this._clampShooterX(pos.x);
            };

            const onPointerUp = () => {
                if (!this.isAiming) return;
                this.isAiming = false;
                this.shootCube();
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
                if (!this.isAiming) return;
                e.preventDefault();
                const t = e.touches[0];
                onPointerMove(t.clientX, t.clientY);
            }, { passive: false });

            window.addEventListener('touchend', onPointerUp);

            // Keyboard Controls
            window.addEventListener('keydown', (e) => {
                Sound.init();
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                    this.shooterX = Math.max(ARENA_X + CUBE_SIZE / 2, this.shooterX - 25);
                } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                    this.shooterX = Math.min(ARENA_RIGHT - CUBE_SIZE / 2, this.shooterX + 25);
                } else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown') {
                    e.preventDefault();
                    if (this.state === STATE.GAME_OVER) {
                        this.resetGame();
                    } else {
                        this.shootCube();
                    }
                }
            });
        }

        _clampShooterX(rawX) {
            const minX = ARENA_X + CUBE_SIZE / 2 + 6;
            const maxX = ARENA_RIGHT - CUBE_SIZE / 2 - 6;
            this.shooterX = Math.max(minX, Math.min(maxX, rawX));
        }

        _setupInitialArena() {
            this.cubes = [];
            // Spawn 3 starting stationary cubes near the top wall
            const startCubes = [
                { val: 2, x: ARENA_X + 110, y: ARENA_TOP + 50 },
                { val: 4, x: ARENA_X + 230, y: ARENA_TOP + 50 },
                { val: 2, x: ARENA_X + 350, y: ARENA_TOP + 50 }
            ];
            startCubes.forEach(sc => {
                this.cubes.push(new Cube(sc.val, sc.x, sc.y));
            });

            this.currentValue = 2;
            this.nextValue = this._getRandomNextValue();
        }

        _getRandomNextValue() {
            // Pool adapts to highest achieved cube
            let maxPoolIdx = 2; // [2, 4, 8]
            if (this.highestCube >= 128) maxPoolIdx = 3; // + 16
            if (this.highestCube >= 512) maxPoolIdx = 4; // + 32
            if (this.highestCube >= 2048) maxPoolIdx = 5; // + 64

            const pool = SPAWN_VALUES.slice(0, maxPoolIdx + 1);
            return pool[Math.floor(Math.random() * pool.length)];
        }

        shootCube() {
            if (this.shootCooldown > 0 || this.state !== STATE.PLAYING) return;

            Sound.play('launch');
            const launched = new Cube(this.currentValue, this.shooterX, SPAWN_Y);
            launched.vy = -18.5; // Fast launch forward
            this.cubes.push(launched);

            this.shootCooldown = 350; // ms cooldown
            this.currentValue = this.nextValue;
            this.nextValue = this._getRandomNextValue();
        }

        useBombPowerUp() {
            if (this.bombsLeft <= 0 || this.state !== STATE.PLAYING) return;
            this.bombsLeft--;
            const countElem = document.getElementById('bomb-count');
            if (countElem) countElem.textContent = this.bombsLeft;

            // Load Bomb cube into shooter slot!
            this.currentValue = 'BOMB';
            Sound.play('launch');
        }

        resetGame() {
            this.state = STATE.PLAYING;
            this.score = 0;
            this.dangerTimer = 0;
            this.bombsLeft = 2;
            const countElem = document.getElementById('bomb-count');
            if (countElem) countElem.textContent = this.bombsLeft;

            this.particles = [];
            this.floatingTexts = [];
            this._setupInitialArena();
        }

        update(dt) {
            if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - 0.4);
            if (this.shootCooldown > 0) this.shootCooldown -= dt;

            if (this.state !== STATE.PLAYING) return;

            // Update all cubes
            this.cubes.forEach(c => c.update(dt));

            // Physics collision detection & merging
            this._resolveCollisions();

            // Remove dead cubes
            this.cubes = this.cubes.filter(c => !c.dead);

            // Check Danger Line
            let anyCrossing = false;
            for (let c of this.cubes) {
                // If cube has settled and is below Danger Line
                if (Math.abs(c.vx) < 0.25 && Math.abs(c.vy) < 0.25 && c.y > DANGER_Y) {
                    anyCrossing = true;
                    break;
                }
            }

            if (anyCrossing) {
                this.dangerTimer += dt;
                if (Math.floor(this.dangerTimer / 500) % 2 === 0) {
                    Sound.play('warning');
                }
                if (this.dangerTimer >= 3200) {
                    this._triggerGameOver();
                }
            } else {
                this.dangerTimer = Math.max(0, this.dangerTimer - dt * 1.5);
            }

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

        _resolveCollisions() {
            const len = this.cubes.length;
            const minDist = CUBE_SIZE * 0.94;

            for (let i = 0; i < len; i++) {
                const c1 = this.cubes[i];
                if (c1.dead) continue;

                for (let j = i + 1; j < len; j++) {
                    const c2 = this.cubes[j];
                    if (c2.dead) continue;

                    const dx = c2.x - c1.x;
                    const dy = c2.y - c1.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < minDist && dist > 0.001) {
                        // Check Bomb Detonation
                        if (c1.isBomb || c2.isBomb) {
                            this._detonateBomb(c1.isBomb ? c1 : c2);
                            return;
                        }

                        // Check Merge (identical values)
                        if (c1.val === c2.val && typeof c1.val === 'number') {
                            this._mergeCubes(c1, c2);
                            return;
                        }

                        // Different values: Realistic Elastic Bounce
                        const overlap = minDist - dist;
                        const nx = dx / dist;
                        const ny = dy / dist;

                        // Separate cubes
                        c1.x -= nx * overlap * 0.5;
                        c1.y -= ny * overlap * 0.5;
                        c2.x += nx * overlap * 0.5;
                        c2.y += ny * overlap * 0.5;

                        // Normal velocity
                        const rvx = c2.vx - c1.vx;
                        const rvy = c2.vy - c1.vy;
                        const velAlongNormal = rvx * nx + rvy * ny;

                        if (velAlongNormal < 0) {
                            const restitution = 0.75;
                            const impulse = -(1 + restitution) * velAlongNormal / 2;

                            c1.vx -= nx * impulse;
                            c1.vy -= ny * impulse;
                            c2.vx += nx * impulse;
                            c2.vy += ny * impulse;

                            c1.va = (Math.random() - 0.5) * 0.08;
                            c2.va = (Math.random() - 0.5) * 0.08;

                            Sound.play('clack', Math.abs(velAlongNormal));
                        }
                    }
                }
            }
        }

        _mergeCubes(c1, c2) {
            c1.dead = true;
            c2.dead = true;

            const nextVal = c1.val * 2;
            const midX = (c1.x + c2.x) / 2;
            const midY = (c1.y + c2.y) / 2;

            // Merged cube with explosive jump bounce
            const merged = new Cube(nextVal, midX, midY);
            merged.vz = 8.5; // High bounce into air
            merged.scale = 1.45; // Pop animation
            merged.vx = (Math.random() - 0.5) * 3;
            merged.vy = (Math.random() - 0.5) * 3;
            this.cubes.push(merged);

            // Update Score & Highest Cube
            this.score += nextVal;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('merge_cube_2048_high', this.highScore);
            }

            if (nextVal > this.highestCube) {
                this.highestCube = nextVal;
            }

            // Sound & Effects
            const logVal = Math.log2(nextVal);
            if (nextVal === 2048) {
                Sound.play('legendary');
                this.screenShake = 14;
                this.floatingTexts.push(new FloatingText(midX, midY - 30, '👑 2048 ACHIEVED! 👑', '#ffd700'));
            } else {
                Sound.play('merge', logVal);
                this.screenShake = 4;
                this.floatingTexts.push(new FloatingText(midX, midY - 20, `+${nextVal}!`, CUBE_COLORS[nextVal]?.base || '#00f0ff'));
            }

            // Burst particle sparks
            const pCol = CUBE_COLORS[nextVal]?.base || '#00f0ff';
            for (let i = 0; i < 22; i++) {
                const spd = Math.random() * 6 + 2;
                const a = Math.random() * Math.PI * 2;
                this.particles.push(new Particle(midX, midY, Math.cos(a) * spd, Math.sin(a) * spd, Math.random() * 5 + 3, pCol));
            }
        }

        _detonateBomb(bomb) {
            bomb.dead = true;
            Sound.play('bomb');
            this.screenShake = 16;

            const blastRadius = 140;
            for (let c of this.cubes) {
                if (c.dead) continue;
                const dist = Math.hypot(c.x - bomb.x, c.y - bomb.y);
                if (dist < blastRadius) {
                    c.dead = true;
                    this.score += c.val || 50;
                    for (let i = 0; i < 14; i++) {
                        const spd = Math.random() * 8 + 3;
                        const a = Math.random() * Math.PI * 2;
                        this.particles.push(new Particle(c.x, c.y, Math.cos(a) * spd, Math.sin(a) * spd, 4, '#ff2a5f'));
                    }
                }
            }

            this.floatingTexts.push(new FloatingText(bomb.x, bomb.y - 20, '💥 BOOM! 💥', '#ff2a5f'));
        }

        _triggerGameOver() {
            this.state = STATE.GAME_OVER;
            Sound.play('warning');
        }

        draw() {
            const ctx = this.ctx;
            ctx.save();

            // Screen Shake
            if (this.screenShake > 0) {
                const ox = (Math.random() - 0.5) * this.screenShake;
                const oy = (Math.random() - 0.5) * this.screenShake;
                ctx.translate(ox, oy);
            }

            // 1. Dark Futuristic Cyber Arena Background
            this._drawArenaBackground(ctx);

            // 2. Cubes in Arena
            this.cubes.forEach(c => c.draw(ctx));

            // 3. Aiming Laser Trajectory Guide
            if (this.state === STATE.PLAYING) {
                this._drawAimTrajectory(ctx);
            }

            // 4. Shooter Cube at launchpad
            if (this.state === STATE.PLAYING) {
                this._drawShooterSlot(ctx);
            }

            // 5. Particles & Floating Texts
            this.particles.forEach(p => p.draw(ctx));
            this.floatingTexts.forEach(ft => ft.draw(ctx));

            // 6. HUD Header (Score, Next Cube, Danger Warning)
            this._drawHUD(ctx);

            // 7. Game Over Screen Overlay
            if (this.state === STATE.GAME_OVER) {
                this._drawGameOverOverlay(ctx);
            }

            ctx.restore();
        }

        _drawArenaBackground(ctx) {
            // Deep neon void
            ctx.fillStyle = '#0a0d1e';
            ctx.fillRect(0, 0, this.W, this.H);

            // Arena Lane Floor
            ctx.fillStyle = '#10142e';
            ctx.fillRect(ARENA_X, ARENA_TOP, ARENA_W, CANVAS_H - ARENA_TOP);

            // Grid Tiles on Floor
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
            ctx.lineWidth = 1;
            const step = 46;
            for (let x = ARENA_X; x <= ARENA_RIGHT; x += step) {
                ctx.beginPath();
                ctx.moveTo(x, ARENA_TOP);
                ctx.lineTo(x, CANVAS_H);
                ctx.stroke();
            }
            for (let y = ARENA_TOP; y <= CANVAS_H; y += step) {
                ctx.beginPath();
                ctx.moveTo(ARENA_X, y);
                ctx.lineTo(ARENA_RIGHT, y);
                ctx.stroke();
            }

            // Neon Outer Arena Walls
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 14;

            ctx.beginPath();
            ctx.moveTo(ARENA_X, CANVAS_H);
            ctx.lineTo(ARENA_X, ARENA_TOP);
            ctx.lineTo(ARENA_RIGHT, ARENA_TOP);
            ctx.lineTo(ARENA_RIGHT, CANVAS_H);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Danger Line
            const isWarning = this.dangerTimer > 0;
            ctx.strokeStyle = isWarning ? '#ff2a5f' : 'rgba(255, 42, 95, 0.4)';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.moveTo(ARENA_X, DANGER_Y);
            ctx.lineTo(ARENA_RIGHT, DANGER_Y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Danger Label
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = isWarning ? '#ff2a5f' : 'rgba(255, 42, 95, 0.5)';
            ctx.textAlign = 'right';
            ctx.fillText(isWarning ? '⚠ DANGER! ⚠' : 'DANGER LINE', ARENA_RIGHT - 12, DANGER_Y - 8);
        }

        _drawAimTrajectory(ctx) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);

            ctx.beginPath();
            ctx.moveTo(this.shooterX, SPAWN_Y);
            ctx.lineTo(this.shooterX, ARENA_TOP + 20);
            ctx.stroke();

            // Aim target dot
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(this.shooterX, ARENA_TOP + 25, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        _drawShooterSlot(ctx) {
            // Draw current cube to launch
            const shooterCube = new Cube(this.currentValue, this.shooterX, SPAWN_Y, true);
            shooterCube.draw(ctx);

            // Left-Right Aim arrows beneath cube
            ctx.save();
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
            ctx.textAlign = 'center';
            ctx.fillText('◀ DRAG TO AIM & RELEASE ▶', CANVAS_W / 2, SPAWN_Y + 45);
            ctx.restore();
        }

        _drawHUD(ctx) {
            ctx.save();

            // Header Banner Container
            ctx.fillStyle = 'rgba(10, 13, 30, 0.92)';
            ctx.fillRect(0, 0, this.W, 115);
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, 115);
            ctx.lineTo(this.W, 115);
            ctx.stroke();

            // Title
            ctx.font = '13px "Press Start 2P", monospace';
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 8;
            ctx.textAlign = 'left';
            ctx.fillText('MERGE CUBE 2048', 25, 34);
            ctx.shadowBlur = 0;

            // Score & Best
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`SCORE: ${this.score}`, 25, 60);

            ctx.fillStyle = '#b0bec5';
            ctx.fillText(`BEST:  ${this.highScore}`, 25, 82);

            // Highest Cube Badge
            ctx.fillStyle = '#00e676';
            ctx.fillText(`CROWN: ${this.highestCube} 👑`, 25, 102);

            // Next Cube Preview (Top-Right)
            const nX = this.W - 85;
            const nY = 48;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('NEXT', nX, 22);

            // Draw mini preview cube
            const previewCube = new Cube(this.nextValue, nX, nY);
            previewCube.scale = 0.65;
            previewCube.draw(ctx);

            ctx.restore();
        }

        _drawGameOverOverlay(ctx) {
            ctx.save();
            ctx.fillStyle = 'rgba(8, 10, 24, 0.88)';
            ctx.fillRect(0, 0, this.W, this.H);

            const cx = this.W / 2;

            ctx.font = '22px "Press Start 2P", monospace';
            ctx.fillStyle = '#ff2a5f';
            ctx.shadowColor = '#ff2a5f';
            ctx.shadowBlur = 16;
            ctx.textAlign = 'center';
            ctx.fillText('ARENA OVERFLOW!', cx, 230);
            ctx.shadowBlur = 0;

            // Score Card
            ctx.fillStyle = 'rgba(16, 20, 46, 0.92)';
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2.5;
            ctx.roundRect(cx - 150, 270, 300, 160, 8);
            ctx.fill();
            ctx.stroke();

            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`FINAL SCORE: ${this.score}`, cx, 315);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(`BEST SCORE: ${this.highScore}`, cx, 350);
            ctx.fillText(`HIGHEST CUBE: ${this.highestCube}`, cx, 385);

            // Retry Button
            const btnX = cx - 120;
            const btnY = 465;
            const pulse = Math.sin(Date.now() * 0.008) * 0.15 + 0.85;

            ctx.fillStyle = '#00e676';
            ctx.globalAlpha = pulse;
            ctx.roundRect(btnX, btnY, 240, 50, 8);
            ctx.fill();

            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillStyle = '#060710';
            ctx.fillText('▶ PLAY AGAIN ◀', cx, btnY + 30);

            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = '#b0bec5';
            ctx.fillText('(OR PRESS SPACEBAR / ENTER)', cx, btnY + 74);

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
        const game = new MergeCubeGame();
        game.run();
    });

})();

