/* ==========================================================================
   PIXEL BOMBER — Classic Arcade Maze Bomber Engine
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // ============================
    // CONSTANTS & GAME SETTINGS
    // ============================
    const CANVAS_W = 640;
    const CANVAS_H = 480;

    const GRID_COLS = 15;
    const GRID_ROWS = 11;
    const TILE_SIZE = 36;
    const OFFSET_X = (CANVAS_W - GRID_COLS * TILE_SIZE) / 2; // 50
    const OFFSET_Y = 64;
    const ARENA_W = GRID_COLS * TILE_SIZE; // 540
    const ARENA_H = GRID_ROWS * TILE_SIZE; // 396

    // Tile Types
    const TILE = {
        EMPTY: 0,
        SOLID: 1,    // Indestructible pillar/border
        BRICK: 2     // Destructible soft block
    };

    // Item Types
    const ITEM = {
        NONE: 0,
        BOMB_UP: 1,
        FIRE_UP: 2,
        SPEED_UP: 3,
        SHIELD: 4,
        PORTAL: 5
    };

    // Game States
    const STATE = {
        TITLE: 'TITLE',
        PLAYING: 'PLAYING',
        STAGE_CLEAR: 'STAGE_CLEAR',
        GAME_OVER: 'GAME_OVER'
    };

    // Stage Configurations
    const STAGES = [
        { stage: 1, name: 'Emerald Maze',   ballooms: 4, oneals: 0, minvos: 0, brickDensity: 0.65, timeLimit: 180 },
        { stage: 2, name: 'Ice Cavern',     ballooms: 3, oneals: 2, minvos: 0, brickDensity: 0.68, timeLimit: 170 },
        { stage: 3, name: 'Lava Dungeon',   ballooms: 2, oneals: 2, minvos: 2, brickDensity: 0.70, timeLimit: 160 },
        { stage: 4, name: 'Cyber Zone',     ballooms: 0, oneals: 3, minvos: 3, brickDensity: 0.72, timeLimit: 150 },
        { stage: 5, name: 'Skull Fortress', ballooms: 0, oneals: 4, minvos: 4, brickDensity: 0.75, timeLimit: 140 },
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

        play(type, arg = 0) {
            if (!this.enabled || !this.ctx) return;
            const t = this.ctx.currentTime;

            switch (type) {
                case 'placeBomb': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(320, t);
                    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);
                    gain.gain.setValueAtTime(0.15, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.09);
                    break;
                }
                case 'explosion': {
                    // Deep boom + noise burst
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(160, t);
                    osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);
                    gain.gain.setValueAtTime(0.35, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.36);

                    // Noise explosion sizzle
                    try {
                        const bufferSize = this.ctx.sampleRate * 0.25;
                        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                        const output = buffer.getChannelData(0);
                        for (let i = 0; i < bufferSize; i++) {
                            output[i] = Math.random() * 2 - 1;
                        }
                        const whiteNoise = this.ctx.createBufferSource();
                        whiteNoise.buffer = buffer;
                        const noiseGain = this.ctx.createGain();
                        noiseGain.gain.setValueAtTime(0.2, t);
                        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                        whiteNoise.connect(noiseGain);
                        noiseGain.connect(this.ctx.destination);
                        whiteNoise.start(t);
                    } catch(e) {}
                    break;
                }
                case 'item': {
                    const notes = [523, 659, 784, 1046];
                    notes.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.value = f;
                        gain.gain.setValueAtTime(0.12, t + i * 0.05);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.12);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.05);
                        osc.stop(t + i * 0.05 + 0.14);
                    });
                    break;
                }
                case 'enemyPop': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(600, t);
                    osc.frequency.exponentialRampToValueAtTime(1100, t + 0.12);
                    gain.gain.setValueAtTime(0.18, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.13);
                    break;
                }
                case 'hit': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(450, t);
                    osc.frequency.exponentialRampToValueAtTime(90, t + 0.35);
                    gain.gain.setValueAtTime(0.25, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.36);
                    break;
                }
                case 'victory': {
                    const notes = [
                        { f: 523, d: 0.12 }, { f: 659, d: 0.12 }, { f: 784, d: 0.12 },
                        { f: 1046, d: 0.3 }, { f: 880, d: 0.15 }, { f: 1046, d: 0.5 }
                    ];
                    let cursor = 0;
                    notes.forEach(m => {
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
            }
        }
    };


    // ============================
    // PARTICLES & EFFECTS
    // ============================
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1.5;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed - 1.0;
            this.size = Math.random() * 4 + 2;
            this.alpha = 1.0;
            this.decay = Math.random() * 0.03 + 0.02;
            this.gravity = 0.18;
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
            this.alpha -= 0.02;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.font = `${this.size}px "Press Start 2P", monospace`;
            ctx.fillStyle = this.color;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2.5;
            ctx.textAlign = 'center';
            ctx.strokeText(this.text, this.x, this.y);
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
    }


    // ============================
    // BOMB & EXPLOSION CLASSES
    // ============================
    class Bomb {
        constructor(r, c, range, owner) {
            this.r = r;
            this.c = c;
            this.range = range;
            this.owner = owner;
            this.x = OFFSET_X + c * TILE_SIZE + TILE_SIZE / 2;
            this.y = OFFSET_Y + r * TILE_SIZE + TILE_SIZE / 2;
            this.timer = 2400; // 2.4s fuse
            this.pulseTime = 0;
            this.isExploded = false;
            this.ownerCanPass = true;
        }

        update(dt) {
            this.timer -= dt;
            this.pulseTime += dt * 0.008;
            if (this.timer <= 0) {
                this.isExploded = true;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Pulsing scale as fuse burns down
            const scale = 1.0 + Math.sin(this.pulseTime * 2) * 0.08;
            ctx.scale(scale, scale);

            const radius = 13;

            // Black metallic sphere
            const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, radius);
            g.addColorStop(0, '#555566');
            g.addColorStop(0.6, '#22222a');
            g.addColorStop(1, '#0e0e14');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();

            // Bomb rim
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Fuse cap
            ctx.fillStyle = '#888899';
            ctx.fillRect(-3, -radius - 3, 6, 4);

            // Burning spark fuse
            const sparkY = -radius - 5;
            ctx.fillStyle = (Math.floor(Date.now() / 80) % 2 === 0) ? '#ffeb3b' : '#ff5722';
            ctx.beginPath();
            ctx.arc(0, sparkY, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    class ExplosionFlame {
        constructor(r, c, isCenter = false, dir = 'center') {
            this.r = r;
            this.c = c;
            this.isCenter = isCenter;
            this.dir = dir; // 'up', 'down', 'left', 'right', 'center'
            this.x = OFFSET_X + c * TILE_SIZE;
            this.y = OFFSET_Y + r * TILE_SIZE;
            this.life = 400; // ms
            this.maxLife = 400;
        }

        update(dt) {
            this.life -= dt;
        }

        draw(ctx) {
            ctx.save();
            const progress = this.life / this.maxLife; // 1.0 down to 0
            const alpha = Math.min(1.0, progress * 1.5);
            ctx.globalAlpha = alpha;

            const cx = this.x + TILE_SIZE / 2;
            const cy = this.y + TILE_SIZE / 2;

            // Outer orange fire
            ctx.fillStyle = '#ff5722';
            ctx.fillRect(this.x + 2, this.y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

            // Inner yellow blaze
            ctx.fillStyle = '#ffea00';
            ctx.fillRect(this.x + 6, this.y + 6, TILE_SIZE - 12, TILE_SIZE - 12);

            // Center white heat
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 4, cy - 4, 8, 8);

            ctx.restore();
        }
    }


    // ============================
    // PLAYER CLASS
    // ============================
    class Player {
        constructor(game) {
            this.game = game;
            this.r = 1;
            this.c = 1;
            this.x = OFFSET_X + 1 * TILE_SIZE + TILE_SIZE / 2;
            this.y = OFFSET_Y + 1 * TILE_SIZE + TILE_SIZE / 2;
            this.baseSpeed = 2.4;
            this.speed = 2.4;
            this.direction = 'down'; // up, down, left, right
            this.isMoving = false;
            this.walkFrame = 0;
            this.radius = 11; // collision radius

            // Stats
            this.maxBombs = 1;
            this.activeBombs = 0;
            this.fireRange = 2;
            this.hasShield = false;
            this.isDead = false;
            this.invincibleTimer = 0;
        }

        reset(r = 1, c = 1) {
            this.r = r;
            this.c = c;
            this.x = OFFSET_X + c * TILE_SIZE + TILE_SIZE / 2;
            this.y = OFFSET_Y + r * TILE_SIZE + TILE_SIZE / 2;
            this.isDead = false;
            this.invincibleTimer = 1500; // 1.5s invincibility on spawn
        }

        update(dt, inputDir) {
            if (this.isDead) return;

            if (this.invincibleTimer > 0) {
                this.invincibleTimer -= dt;
            }

            // Movement handling with corner-sliding assistance
            let vx = 0;
            let vy = 0;

            if (inputDir.left)  vx -= this.speed;
            if (inputDir.right) vx += this.speed;
            if (inputDir.up)    vy -= this.speed;
            if (inputDir.down)  vy += this.speed;

            if (vx !== 0 && vy !== 0) {
                // Diagonal normalization
                vx *= 0.7071;
                vy *= 0.7071;
            }

            this.isMoving = (vx !== 0 || vy !== 0);

            if (this.isMoving) {
                this.walkFrame += dt * 0.012;
                if (Math.abs(vx) > Math.abs(vy)) {
                    this.direction = (vx > 0) ? 'right' : 'left';
                } else {
                    this.direction = (vy > 0) ? 'down' : 'up';
                }

                // Check collisions & move
                this._moveWithCollision(vx, vy);
            }

            // Update grid cell
            this.c = Math.floor((this.x - OFFSET_X) / TILE_SIZE);
            this.r = Math.floor((this.y - OFFSET_Y) / TILE_SIZE);
        }

        _moveWithCollision(vx, vy) {
            // Horizontal move
            if (vx !== 0) {
                const newX = this.x + vx;
                if (!this._collidesAt(newX, this.y)) {
                    this.x = newX;
                } else {
                    // Corner sliding: assist navigating tight 1-tile gaps
                    const targetTileY = Math.floor((this.y - OFFSET_Y) / TILE_SIZE) * TILE_SIZE + OFFSET_Y + TILE_SIZE / 2;
                    const diffY = targetTileY - this.y;
                    if (Math.abs(diffY) > 2 && Math.abs(diffY) < 14) {
                        this.y += Math.sign(diffY) * 1.5;
                    }
                }
            }

            // Vertical move
            if (vy !== 0) {
                const newY = this.y + vy;
                if (!this._collidesAt(this.x, newY)) {
                    this.y = newY;
                } else {
                    // Corner sliding
                    const targetTileX = Math.floor((this.x - OFFSET_X) / TILE_SIZE) * TILE_SIZE + OFFSET_X + TILE_SIZE / 2;
                    const diffX = targetTileX - this.x;
                    if (Math.abs(diffX) > 2 && Math.abs(diffX) < 14) {
                        this.x += Math.sign(diffX) * 1.5;
                    }
                }
            }
        }

        _collidesAt(x, y) {
            const rad = this.radius;
            const corners = [
                { x: x - rad, y: y - rad },
                { x: x + rad, y: y - rad },
                { x: x - rad, y: y + rad },
                { x: x + rad, y: y + rad }
            ];

            // 1. Check Solid & Brick Tiles
            for (let pt of corners) {
                const c = Math.floor((pt.x - OFFSET_X) / TILE_SIZE);
                const r = Math.floor((pt.y - OFFSET_Y) / TILE_SIZE);

                if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) return true;
                const tile = this.game.grid[r][c];
                if (tile === TILE.SOLID || tile === TILE.BRICK) return true;
            }

            // 2. Check Bombs
            for (let bomb of this.game.bombs) {
                if (bomb.isExploded) continue;

                const bLeft = OFFSET_X + bomb.c * TILE_SIZE;
                const bRight = bLeft + TILE_SIZE;
                const bTop = OFFSET_Y + bomb.r * TILE_SIZE;
                const bBottom = bTop + TILE_SIZE;

                // Check if player's CURRENT bounding box overlaps the bomb
                const curOverlapping = (this.x - rad < bRight && this.x + rad > bLeft &&
                                        this.y - rad < bBottom && this.y + rad > bTop);

                if (bomb.ownerCanPass && bomb.owner === this) {
                    if (curOverlapping) {
                        // Player is currently on/exiting the bomb they placed; allow moving!
                        continue;
                    } else {
                        // Player has completely stepped off the bomb; make it solid
                        bomb.ownerCanPass = false;
                    }
                }

                // Check if candidate destination overlaps this bomb
                const newOverlapping = (x - rad < bRight && x + rad > bLeft &&
                                        y - rad < bBottom && y + rad > bTop);

                if (newOverlapping) {
                    return true;
                }
            }

            return false;
        }

        draw(ctx) {
            if (this.isDead) return;

            // Invincibility flashing
            if (this.invincibleTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
                return;
            }

            ctx.save();
            ctx.translate(this.x, this.y);

            // Walking bounce
            const bob = (this.isMoving) ? Math.sin(this.walkFrame * 8) * 1.5 : 0;
            ctx.translate(0, bob);

            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.ellipse(0, 11, 10, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // White Suit Body
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-7, -4, 14, 12);

            // Blue Belt & Boots
            ctx.fillStyle = '#2979ff';
            ctx.fillRect(-7, 2, 14, 3);
            ctx.fillRect(-8, 8, 6, 5);
            ctx.fillRect(2, 8, 6, 5);

            // Cute Pink Face
            ctx.fillStyle = '#ff80ab';
            ctx.fillRect(-8, -13, 16, 10);

            // Eyes
            ctx.fillStyle = '#111122';
            if (this.direction === 'right') {
                ctx.fillRect(1, -11, 2, 4);
                ctx.fillRect(5, -11, 2, 4);
            } else if (this.direction === 'left') {
                ctx.fillRect(-7, -11, 2, 4);
                ctx.fillRect(-3, -11, 2, 4);
            } else {
                ctx.fillRect(-4, -11, 2, 4);
                ctx.fillRect(2, -11, 2, 4);
            }

            // Blue Antenna Helmet
            ctx.fillStyle = '#2979ff';
            ctx.fillRect(-6, -17, 12, 4);
            // Antenna stalk & ball
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1, -21, 2, 4);
            ctx.fillStyle = '#ff1744';
            ctx.beginPath();
            ctx.arc(0, -22, 3, 0, Math.PI * 2);
            ctx.fill();

            // Shield Aura
            if (this.hasShield) {
                const shieldPulse = Math.sin(Date.now() * 0.008) * 2;
                ctx.strokeStyle = '#00e5ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 16 + shieldPulse, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }
    }


    // ============================
    // ENEMY CLASSES
    // ============================
    class Enemy {
        constructor(r, c, type = 'balloom') {
            this.r = r;
            this.c = c;
            this.type = type; // 'balloom', 'oneal', 'minvo'
            this.x = OFFSET_X + c * TILE_SIZE + TILE_SIZE / 2;
            this.y = OFFSET_Y + r * TILE_SIZE + TILE_SIZE / 2;
            this.radius = 11;
            this.isDead = false;
            this.animTimer = 0;

            const speeds = { balloom: 1.2, oneal: 1.8, minvo: 2.2 };
            this.speed = speeds[type] || 1.2;

            const points = { balloom: 100, oneal: 200, minvo: 400 };
            this.points = points[type] || 100;

            this.vx = 0;
            this.vy = 0;
            this._pickRandomDirection();
        }

        _pickRandomDirection() {
            const dirs = [
                { vx: this.speed, vy: 0 },
                { vx: -this.speed, vy: 0 },
                { vx: 0, vy: this.speed },
                { vx: 0, vy: -this.speed }
            ];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            this.vx = d.vx;
            this.vy = d.vy;
        }

        update(dt, game) {
            if (this.isDead) return;
            this.animTimer += dt * 0.006;

            // Oneal & Minvo smart tracking: periodically steer towards player if aligned
            if ((this.type === 'oneal' || this.type === 'minvo') && Math.random() < 0.03) {
                const p = game.player;
                if (!p.isDead) {
                    const dx = p.x - this.x;
                    const dy = p.y - this.y;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        this.vx = Math.sign(dx) * this.speed;
                        this.vy = 0;
                    } else {
                        this.vx = 0;
                        this.vy = Math.sign(dy) * this.speed;
                    }
                }
            }

            // Attempt movement
            const nextX = this.x + this.vx;
            const nextY = this.y + this.vy;

            if (!this._collides(nextX, nextY, game)) {
                this.x = nextX;
                this.y = nextY;
            } else {
                // Hit wall/bomb: snap to tile center and pick new direction
                this._snapToTileCenter();
                this._pickRandomDirection();
            }

            this.c = Math.floor((this.x - OFFSET_X) / TILE_SIZE);
            this.r = Math.floor((this.y - OFFSET_Y) / TILE_SIZE);
        }

        _snapToTileCenter() {
            const c = Math.floor((this.x - OFFSET_X) / TILE_SIZE);
            const r = Math.floor((this.y - OFFSET_Y) / TILE_SIZE);
            this.x = OFFSET_X + c * TILE_SIZE + TILE_SIZE / 2;
            this.y = OFFSET_Y + r * TILE_SIZE + TILE_SIZE / 2;
        }

        _collides(x, y, game) {
            const rad = this.radius;
            const corners = [
                { x: x - rad, y: y - rad },
                { x: x + rad, y: y - rad },
                { x: x - rad, y: y + rad },
                { x: x + rad, y: y + rad }
            ];

            for (let pt of corners) {
                const c = Math.floor((pt.x - OFFSET_X) / TILE_SIZE);
                const r = Math.floor((pt.y - OFFSET_Y) / TILE_SIZE);

                if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) return true;
                const tile = game.grid[r][c];
                if (tile === TILE.SOLID || tile === TILE.BRICK) return true;

                // Cannot pass through bombs
                for (let bomb of game.bombs) {
                    if (bomb.r === r && bomb.c === c) return true;
                }
            }
            return false;
        }

        draw(ctx) {
            if (this.isDead) return;

            ctx.save();
            ctx.translate(this.x, this.y);

            const squish = Math.sin(this.animTimer * 10) * 1.5;
            ctx.scale(1 + squish * 0.05, 1 - squish * 0.05);

            if (this.type === 'balloom') {
                // Orange Slime Balloom
                ctx.fillStyle = '#ff7043';
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffab91';
                ctx.fillRect(-6, -8, 4, 4);

                // Cute Slime Eyes
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-5, -3, 3, 5);
                ctx.fillRect(2, -3, 3, 5);
                ctx.fillStyle = '#111';
                ctx.fillRect(-4, -1, 2, 3);
                ctx.fillRect(3, -1, 2, 3);
            } else if (this.type === 'oneal') {
                // Blue Ghost Oneal
                ctx.fillStyle = '#29b6f6';
                ctx.beginPath();
                ctx.arc(0, -3, 11, Math.PI, 0);
                ctx.lineTo(11, 10);
                ctx.lineTo(-11, 10);
                ctx.closePath();
                ctx.fill();

                // Ghost eyes
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-6, -4, 4, 6);
                ctx.fillRect(2, -4, 4, 6);
                ctx.fillStyle = '#01579b';
                ctx.fillRect(-4, -2, 2, 4);
                ctx.fillRect(4, -2, 2, 4);
            } else {
                // Red Minvo
                ctx.fillStyle = '#e53935';
                ctx.beginPath();
                ctx.arc(0, 0, 13, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffeb3b';
                ctx.fillRect(-6, -4, 4, 4);
                ctx.fillRect(2, -4, 4, 4);
                ctx.fillStyle = '#111';
                ctx.fillRect(-4, -3, 2, 2);
                ctx.fillRect(4, -3, 2, 2);
            }

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

            this.state = STATE.TITLE;
            this.currentStage = 1;
            this.score = 0;
            this.lives = 3;
            this.highScore = 0;
            this.timeRemaining = 180;

            // Arena collections
            this.grid = [];
            this.items = []; // grid of items
            this.bombs = [];
            this.flames = [];
            this.enemies = [];
            this.particles = [];
            this.popups = [];
            this.player = new Player(this);

            // Controls
            this.keys = {};
            this.portalUnlocked = false;

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
                this.highScore = parseInt(localStorage.getItem('pixelbomber_highscore') || '0', 10);
            } catch (e) {}
        }

        _saveHighScore() {
            try {
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('pixelbomber_highscore', String(this.highScore));
                }
            } catch (e) {}
        }

        _initInputs() {
            window.addEventListener('keydown', (e) => {
                Sound.init();

                if (this.state === STATE.TITLE) {
                    if (['Space', 'Enter'].includes(e.code)) {
                        this.startStage(1);
                    }
                    return;
                }

                if (this.state === STATE.GAME_OVER) {
                    if (['Space', 'Enter'].includes(e.code)) {
                        this.lives = 3;
                        this.score = 0;
                        this.startStage(1);
                    }
                    return;
                }

                if (this.state === STATE.STAGE_CLEAR) {
                    if (['Space', 'Enter'].includes(e.code)) {
                        this.advanceStage();
                    }
                    return;
                }

                this.keys[e.code] = true;

                if (e.code === 'Space') {
                    e.preventDefault();
                    this.placeBomb();
                }
            });

            window.addEventListener('keyup', (e) => {
                this.keys[e.code] = false;
            });

            // Mobile Buttons
            const btnUp = document.getElementById('btn-up');
            const btnDown = document.getElementById('btn-down');
            const btnLeft = document.getElementById('btn-left');
            const btnRight = document.getElementById('btn-right');
            const btnBomb = document.getElementById('btn-bomb');

            const bindDir = (btn, code) => {
                if (!btn) return;
                const activate = (e) => {
                    e.preventDefault();
                    Sound.init();
                    if (this.state === STATE.TITLE || this.state === STATE.GAME_OVER) {
                        this.lives = 3;
                        this.score = 0;
                        this.startStage(1);
                    } else if (this.state === STATE.STAGE_CLEAR) {
                        this.advanceStage();
                    } else {
                        this.keys[code] = true;
                    }
                };
                const deactivate = (e) => {
                    e.preventDefault();
                    this.keys[code] = false;
                };

                btn.addEventListener('touchstart', activate, { passive: false });
                btn.addEventListener('touchend', deactivate, { passive: false });
                btn.addEventListener('mousedown', activate);
                btn.addEventListener('mouseup', deactivate);
            };

            bindDir(btnUp, 'KeyW');
            bindDir(btnDown, 'KeyS');
            bindDir(btnLeft, 'KeyA');
            bindDir(btnRight, 'KeyD');

            if (btnBomb) {
                btnBomb.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    Sound.init();
                    if (this.state === STATE.TITLE || this.state === STATE.GAME_OVER) {
                        this.lives = 3;
                        this.score = 0;
                        this.startStage(1);
                    } else if (this.state === STATE.STAGE_CLEAR) {
                        this.advanceStage();
                    } else {
                        this.placeBomb();
                    }
                }, { passive: false });

                btnBomb.addEventListener('click', (e) => {
                    e.stopPropagation();
                    Sound.init();
                    if (this.state === STATE.TITLE || this.state === STATE.GAME_OVER) {
                        this.lives = 3;
                        this.score = 0;
                        this.startStage(1);
                    } else if (this.state === STATE.STAGE_CLEAR) {
                        this.advanceStage();
                    } else {
                        this.placeBomb();
                    }
                });
            }

            // Canvas Click / Tap for Title and Game Over
            this.canvas.addEventListener('click', () => {
                Sound.init();
                if (this.state === STATE.TITLE || this.state === STATE.GAME_OVER) {
                    this.lives = 3;
                    this.score = 0;
                    this.startStage(1);
                } else if (this.state === STATE.STAGE_CLEAR) {
                    this.advanceStage();
                }
            });
        }

        // ============================
        // ARENA GENERATION & STAGES
        // ============================
        startStage(stageNum) {
            this.currentStage = Math.min(STAGES.length, Math.max(1, stageNum));
            const cfg = STAGES[this.currentStage - 1];
            this.timeRemaining = cfg.timeLimit;
            this.portalUnlocked = false;

            this.bombs = [];
            this.flames = [];
            this.enemies = [];
            this.particles = [];
            this.popups = [];

            // 1. Build Grid & Pillars
            this.grid = [];
            this.items = [];
            const openTiles = [];

            for (let r = 0; r < GRID_ROWS; r++) {
                this.grid[r] = [];
                this.items[r] = [];
                for (let c = 0; c < GRID_COLS; c++) {
                    this.items[r][c] = ITEM.NONE;

                    // Borders are solid
                    if (r === 0 || r === GRID_ROWS - 1 || c === 0 || c === GRID_COLS - 1) {
                        this.grid[r][c] = TILE.SOLID;
                    }
                    // Alternating pillars
                    else if (r % 2 === 0 && c % 2 === 0) {
                        this.grid[r][c] = TILE.SOLID;
                    }
                    else {
                        this.grid[r][c] = TILE.EMPTY;
                        // Safe spawn zone: (1,1), (1,2), (2,1)
                        if (!(r <= 2 && c <= 2)) {
                            openTiles.push({ r, c });
                        }
                    }
                }
            }

            // Shuffle open tiles
            for (let i = openTiles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [openTiles[i], openTiles[j]] = [openTiles[j], openTiles[i]];
            }

            // Place destructible soft bricks
            const numBricks = Math.floor(openTiles.length * cfg.brickDensity);
            const brickTiles = openTiles.slice(0, numBricks);
            const remainingFreeTiles = openTiles.slice(numBricks);

            brickTiles.forEach(t => {
                this.grid[t.r][t.c] = TILE.BRICK;
            });

            // Hide Portal under a random brick
            if (brickTiles.length > 0) {
                const portalTile = brickTiles[0];
                this.items[portalTile.r][portalTile.c] = ITEM.PORTAL;

                // Hide power-ups under other bricks
                const itemPool = [ITEM.BOMB_UP, ITEM.FIRE_UP, ITEM.SPEED_UP, ITEM.BOMB_UP, ITEM.FIRE_UP, ITEM.SHIELD];
                for (let i = 1; i < Math.min(brickTiles.length, itemPool.length + 1); i++) {
                    const it = itemPool[i - 1];
                    const t = brickTiles[i];
                    this.items[t.r][t.c] = it;
                }
            }

            // 2. Spawn Player
            this.player.reset(1, 1);

            // 3. Spawn Enemies in free tiles (far from player)
            const enemyTiles = remainingFreeTiles.filter(t => (t.r > 3 || t.c > 3));

            for (let i = 0; i < cfg.ballooms && enemyTiles.length > 0; i++) {
                const t = enemyTiles.pop();
                this.enemies.push(new Enemy(t.r, t.c, 'balloom'));
            }
            for (let i = 0; i < cfg.oneals && enemyTiles.length > 0; i++) {
                const t = enemyTiles.pop();
                this.enemies.push(new Enemy(t.r, t.c, 'oneal'));
            }
            for (let i = 0; i < cfg.minvos && enemyTiles.length > 0; i++) {
                const t = enemyTiles.pop();
                this.enemies.push(new Enemy(t.r, t.c, 'minvo'));
            }

            this.state = STATE.PLAYING;
        }

        advanceStage() {
            if (this.currentStage < STAGES.length) {
                this.startStage(this.currentStage + 1);
            } else {
                this.startStage(1); // loop with bonus
            }
        }

        placeBomb() {
            if (this.player.isDead || this.player.activeBombs >= this.player.maxBombs) return;

            const r = this.player.r;
            const c = this.player.c;

            // Check if bomb already on this tile
            for (let b of this.bombs) {
                if (b.r === r && b.c === c) return;
            }

            const bomb = new Bomb(r, c, this.player.fireRange, this.player);
            this.bombs.push(bomb);
            this.player.activeBombs++;
            Sound.play('placeBomb');
        }

        detonateBomb(bomb) {
            bomb.isExploded = true;
            this.player.activeBombs = Math.max(0, this.player.activeBombs - 1);
            Sound.play('explosion');

            const r = bomb.r;
            const c = bomb.c;
            const range = bomb.range;

            // Center flame
            this.flames.push(new ExplosionFlame(r, c, true, 'center'));

            // 4 Ray directions: Up, Down, Left, Right
            const dirs = [
                { dr: -1, dc: 0, dir: 'up' },
                { dr: 1, dc: 0, dir: 'down' },
                { dr: 0, dc: -1, dir: 'left' },
                { dr: 0, dc: 1, dir: 'right' }
            ];

            dirs.forEach(({ dr, dc, dir }) => {
                for (let step = 1; step <= range; step++) {
                    const nr = r + dr * step;
                    const nc = c + dc * step;

                    if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) break;
                    const tile = this.grid[nr][nc];

                    if (tile === TILE.SOLID) {
                        // Stopped cold by concrete pillar
                        break;
                    } else if (tile === TILE.BRICK) {
                        // Destroys soft brick and stops ray
                        this.grid[nr][nc] = TILE.EMPTY;
                        this.flames.push(new ExplosionFlame(nr, nc, false, dir));

                        // Spawn rubble debris particles
                        const px = OFFSET_X + nc * TILE_SIZE + TILE_SIZE / 2;
                        const py = OFFSET_Y + nr * TILE_SIZE + TILE_SIZE / 2;
                        for (let k = 0; k < 6; k++) {
                            this.particles.push(new Particle(px, py, '#b08d55'));
                        }
                        this.score += 20;
                        break;
                    } else {
                        // Empty tile: flame continues
                        this.flames.push(new ExplosionFlame(nr, nc, false, dir));

                        // Trigger other bombs in flame path immediately (chain reaction!)
                        for (let otherBomb of this.bombs) {
                            if (!otherBomb.isExploded && otherBomb.r === nr && otherBomb.c === nc) {
                                otherBomb.timer = 0;
                            }
                        }
                    }
                }
            });
        }

        // ============================
        // UPDATE LOOP
        // ============================
        update(dt) {
            // Particle updates
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].alpha <= 0) this.particles.splice(i, 1);
            }

            // Popup updates
            for (let i = this.popups.length - 1; i >= 0; i--) {
                this.popups[i].update();
                if (this.popups[i].alpha <= 0) this.popups.splice(i, 1);
            }

            if (this.state !== STATE.PLAYING) return;

            // Timer countdown
            this.timeRemaining -= dt * 0.001;
            if (this.timeRemaining <= 0) {
                this.handlePlayerDeath('TIME OUT!');
                return;
            }

            // Player controls
            const inputDir = {
                up: this.keys['ArrowUp'] || this.keys['KeyW'],
                down: this.keys['ArrowDown'] || this.keys['KeyS'],
                left: this.keys['ArrowLeft'] || this.keys['KeyA'],
                right: this.keys['ArrowRight'] || this.keys['KeyD']
            };
            this.player.update(dt, inputDir);

            // Update Bombs
            for (let i = this.bombs.length - 1; i >= 0; i--) {
                const b = this.bombs[i];
                b.update(dt);
                if (b.isExploded) {
                    this.bombs.splice(i, 1);
                    this.detonateBomb(b);
                }
            }

            // Update Flames
            for (let i = this.flames.length - 1; i >= 0; i--) {
                const f = this.flames[i];
                f.update(dt);
                if (f.life <= 0) {
                    this.flames.splice(i, 1);
                }
            }

            // Update Enemies
            this.enemies.forEach(e => e.update(dt, this));

            // 1. Check Flame Collisions with Player & Enemies
            this.flames.forEach(f => {
                // Enemy hit by flame
                this.enemies.forEach(e => {
                    if (!e.isDead && e.r === f.r && e.c === f.c) {
                        e.isDead = true;
                        this.score += e.points;
                        Sound.play('enemyPop');
                        this.popups.push(new FloatingText(`+${e.points}`, e.x, e.y - 10, '#ffee00', 12));

                        for (let k = 0; k < 8; k++) {
                            this.particles.push(new Particle(e.x, e.y, '#ff5722'));
                        }
                    }
                });

                // Player hit by flame
                if (!this.player.isDead && this.player.invincibleTimer <= 0) {
                    if (this.player.r === f.r && this.player.c === f.c) {
                        this.handlePlayerDamage();
                    }
                }
            });

            // Filter dead enemies
            this.enemies = this.enemies.filter(e => !e.isDead);

            // Unlock Portal when all enemies are cleared
            if (this.enemies.length === 0 && !this.portalUnlocked) {
                this.portalUnlocked = true;
                this.popups.push(new FloatingText('PORTAL OPEN!', CANVAS_W / 2, OFFSET_Y + ARENA_H / 2, '#00e5ff', 18));
            }

            // 2. Check Enemy Touch Collision with Player
            this.enemies.forEach(e => {
                if (!this.player.isDead && this.player.invincibleTimer <= 0) {
                    const dist = Math.hypot(this.player.x - e.x, this.player.y - e.y);
                    if (dist < this.player.radius + e.radius - 3) {
                        this.handlePlayerDamage();
                    }
                }
            });

            // 3. Check Item Pickups & Portal
            const pr = this.player.r;
            const pc = this.player.c;
            const item = this.items[pr]?.[pc];

            if (item && item !== ITEM.NONE) {
                if (this.grid[pr][pc] === TILE.EMPTY) {
                    if (item === ITEM.PORTAL) {
                        if (this.portalUnlocked) {
                            this.triggerStageClear();
                        }
                    } else {
                        // Power-up collected!
                        this.items[pr][pc] = ITEM.NONE;
                        Sound.play('item');

                        if (item === ITEM.BOMB_UP) {
                            this.player.maxBombs++;
                            this.popups.push(new FloatingText('BOMB UP!', this.player.x, this.player.y - 15, '#ffd700', 12));
                        } else if (item === ITEM.FIRE_UP) {
                            this.player.fireRange++;
                            this.popups.push(new FloatingText('FIRE UP!', this.player.x, this.player.y - 15, '#ff5722', 12));
                        } else if (item === ITEM.SPEED_UP) {
                            this.player.speed = Math.min(3.4, this.player.speed + 0.3);
                            this.popups.push(new FloatingText('SPEED UP!', this.player.x, this.player.y - 15, '#00e676', 12));
                        } else if (item === ITEM.SHIELD) {
                            this.player.hasShield = true;
                            this.popups.push(new FloatingText('SHIELD!', this.player.x, this.player.y - 15, '#00e5ff', 12));
                        }
                        this.score += 100;
                    }
                }
            }
        }

        handlePlayerDamage() {
            if (this.player.hasShield) {
                this.player.hasShield = false;
                this.player.invincibleTimer = 1200;
                Sound.play('hit');
                this.popups.push(new FloatingText('SHIELD BROKEN!', this.player.x, this.player.y - 15, '#00e5ff', 12));
                return;
            }
            this.handlePlayerDeath('YOU DIED');
        }

        handlePlayerDeath(reason = 'YOU DIED') {
            this.player.isDead = true;
            this.lives--;
            Sound.play('hit');

            for (let k = 0; k < 12; k++) {
                this.particles.push(new Particle(this.player.x, this.player.y, '#ffffff'));
            }

            if (this.lives > 0) {
                setTimeout(() => {
                    this.player.reset(1, 1);
                }, 1200);
            } else {
                this.state = STATE.GAME_OVER;
                this._saveHighScore();
            }
        }

        triggerStageClear() {
            this.state = STATE.STAGE_CLEAR;
            Sound.play('victory');
            const timeBonus = Math.floor(this.timeRemaining) * 10;
            this.score += timeBonus;
            this._saveHighScore();
        }


        // ============================
        // RENDER LOOP
        // ============================
        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.W, this.H);

            // 1. Background
            this._drawBackground(ctx);

            if (this.state === STATE.TITLE) {
                this._drawTitleScreen(ctx);
                return;
            }

            // 2. HUD
            this._drawHUD(ctx);

            // 3. Grid & Walls
            this._drawArena(ctx);

            // 4. Items (Portal and Power-ups under broken bricks)
            this._drawItems(ctx);

            // 5. Bombs
            this.bombs.forEach(b => b.draw(ctx));

            // 6. Flames
            this.flames.forEach(f => f.draw(ctx));

            // 7. Enemies
            this.enemies.forEach(e => e.draw(ctx));

            // 8. Player
            this.player.draw(ctx);

            // 9. Particles & Popups
            this.particles.forEach(p => p.draw(ctx));
            this.popups.forEach(pop => pop.draw(ctx));

            // 10. Overlays for Stage Clear / Game Over
            if (this.state === STATE.STAGE_CLEAR) {
                this._drawStageClearOverlay(ctx);
            } else if (this.state === STATE.GAME_OVER) {
                this._drawGameOverOverlay(ctx);
            }
        }

        _drawBackground(ctx) {
            const g = ctx.createLinearGradient(0, 0, 0, this.H);
            g.addColorStop(0, '#101726');
            g.addColorStop(0.5, '#172238');
            g.addColorStop(1, '#090e18');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, this.W, this.H);
        }

        _drawHUD(ctx) {
            ctx.fillStyle = 'rgba(10, 15, 26, 0.9)';
            ctx.fillRect(0, 0, this.W, 54);
            ctx.strokeStyle = '#00e676';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, this.W, 54);

            // Stage Title
            ctx.fillStyle = '#00e676';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`STAGE ${this.currentStage}`, 20, 22);

            // Time Remaining
            const mins = Math.floor(Math.max(0, this.timeRemaining) / 60);
            const secs = Math.floor(Math.max(0, this.timeRemaining) % 60);
            const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            ctx.fillStyle = (this.timeRemaining < 30) ? '#ff1744' : '#ffee00';
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillText(`TIME ${timeStr}`, 140, 22);

            // Lives
            ctx.fillStyle = '#ff4081';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText(`LIVES: ${'❤️'.repeat(Math.max(0, this.lives))}`, 300, 22);

            // Score & High Score
            ctx.fillStyle = '#ffffff';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`SCORE: ${this.score}`, this.W - 20, 22);
            ctx.fillStyle = '#8899aa';
            ctx.fillText(`HI: ${this.highScore}`, this.W - 20, 42);

            // Bombs & Fire Range Icons
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffd700';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText(`💣 ${this.player.maxBombs}  🔥 ${this.player.fireRange}`, 20, 42);
        }

        _drawArena(ctx) {
            // Grass Arena Floor
            ctx.fillStyle = '#2e7d32';
            ctx.fillRect(OFFSET_X, OFFSET_Y, ARENA_W, ARENA_H);

            // Checkerboard Grass Tiles
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    if ((r + c) % 2 === 0) {
                        ctx.fillStyle = '#388e3c';
                        ctx.fillRect(OFFSET_X + c * TILE_SIZE, OFFSET_Y + r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                }
            }

            // Grid Walls and Bricks
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    const tile = this.grid[r][c];
                    const tx = OFFSET_X + c * TILE_SIZE;
                    const ty = OFFSET_Y + r * TILE_SIZE;

                    if (tile === TILE.SOLID) {
                        this._drawSolidPillar(ctx, tx, ty);
                    } else if (tile === TILE.BRICK) {
                        this._drawSoftBrick(ctx, tx, ty);
                    }
                }
            }
        }

        _drawSolidPillar(ctx, x, y) {
            // Hard concrete pillar
            ctx.fillStyle = '#546e7a';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // Top-left bevel
            ctx.fillStyle = '#90a4ae';
            ctx.fillRect(x, y, TILE_SIZE, 3);
            ctx.fillRect(x, y, 3, TILE_SIZE);

            // Bottom-right shadow
            ctx.fillStyle = '#263238';
            ctx.fillRect(x, y + TILE_SIZE - 3, TILE_SIZE, 3);
            ctx.fillRect(x + TILE_SIZE - 3, y, 3, TILE_SIZE);

            // Inner rivet
            ctx.fillStyle = '#37474f';
            ctx.fillRect(x + 10, y + 10, TILE_SIZE - 20, TILE_SIZE - 20);
        }

        _drawSoftBrick(ctx, x, y) {
            // Destructible brick block
            ctx.fillStyle = '#a1622b';
            ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

            // Brick pattern mortar lines
            ctx.fillStyle = '#d7ccc8';
            ctx.fillRect(x + 1, y + 12, TILE_SIZE - 2, 2);
            ctx.fillRect(x + 1, y + 24, TILE_SIZE - 2, 2);
            ctx.fillRect(x + 18, y + 1, 2, 11);
            ctx.fillRect(x + 9, y + 14, 2, 10);
            ctx.fillRect(x + 27, y + 14, 2, 10);

            // Highlight & Shadow
            ctx.fillStyle = '#bcaaa4';
            ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 2);
            ctx.fillStyle = '#4e342e';
            ctx.fillRect(x + 1, y + TILE_SIZE - 3, TILE_SIZE - 2, 2);
        }

        _drawItems(ctx) {
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    const item = this.items[r][c];
                    // Only visible if soft brick is cleared
                    if (item !== ITEM.NONE && this.grid[r][c] === TILE.EMPTY) {
                        const ix = OFFSET_X + c * TILE_SIZE + TILE_SIZE / 2;
                        const iy = OFFSET_Y + r * TILE_SIZE + TILE_SIZE / 2;
                        this._drawItemIcon(ctx, item, ix, iy);
                    }
                }
            }
        }

        _drawItemIcon(ctx, item, x, y) {
            ctx.save();
            ctx.translate(x, y);

            const bob = Math.sin(Date.now() * 0.007) * 2;
            ctx.translate(0, bob);

            if (item === ITEM.PORTAL) {
                // Exit Portal Vortex
                const rot = Date.now() * 0.004;
                ctx.rotate(rot);
                ctx.fillStyle = this.portalUnlocked ? '#00e5ff' : '#455a64';
                ctx.beginPath();
                ctx.arc(0, 0, 14, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = this.portalUnlocked ? '#ffea00' : '#263238';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Power-up Item Capsule
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();

                ctx.font = '14px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                if (item === ITEM.BOMB_UP) {
                    ctx.fillText('💣', 0, 1);
                } else if (item === ITEM.FIRE_UP) {
                    ctx.fillText('🔥', 0, 1);
                } else if (item === ITEM.SPEED_UP) {
                    ctx.fillText('⚡', 0, 1);
                } else if (item === ITEM.SHIELD) {
                    ctx.fillText('🛡️', 0, 1);
                }
            }

            ctx.restore();
        }

        _drawTitleScreen(ctx) {
            ctx.textAlign = 'center';
            ctx.shadowColor = '#00e676';
            ctx.shadowBlur = 18;

            ctx.fillStyle = '#00e676';
            ctx.font = '28px "Press Start 2P", monospace';
            ctx.fillText('PIXEL', this.W / 2, 130);

            ctx.fillStyle = '#ff5722';
            ctx.font = '36px "Press Start 2P", monospace';
            ctx.fillText('BOMBER', this.W / 2, 180);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#00e5ff';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText('CLASSIC ARCADE MAZE ACTION', this.W / 2, 215);

            // Showcase Bomb with Spark
            const bomb = new Bomb(0, 0, 2, null);
            bomb.x = this.W / 2;
            bomb.y = 280;
            bomb.draw(ctx);

            // Start Button
            const btnW = 340;
            const btnH = 50;
            const btnX = (this.W - btnW) / 2;
            const btnY = 330;
            const pulse = Math.sin(Date.now() * 0.006) * 0.25 + 0.75;

            ctx.fillStyle = `rgba(0, 230, 118, ${pulse * 0.3})`;
            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeStyle = '#00e676';
            ctx.lineWidth = 2;
            ctx.strokeRect(btnX, btnY, btnW, btnH);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('▶ CLICK OR SPACE TO PLAY', this.W / 2, btnY + 31);

            // High Score
            ctx.fillStyle = '#ffd700';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText(`HIGH SCORE: ${this.highScore}`, this.W / 2, 420);

            // Guide
            ctx.fillStyle = '#8899aa';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('MOVE: ARROWS / WASD • BOMB: SPACE', this.W / 2, 450);
        }

        _drawStageClearOverlay(ctx) {
            ctx.fillStyle = 'rgba(10, 16, 28, 0.88)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#00e676';
            ctx.font = '24px "Press Start 2P", monospace';
            ctx.fillText('STAGE CLEARED!', this.W / 2, 190);

            ctx.fillStyle = '#ffee00';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText(`TIME BONUS: +${Math.floor(this.timeRemaining) * 10}`, this.W / 2, 240);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText(`CURRENT SCORE: ${this.score}`, this.W / 2, 280);

            ctx.fillStyle = '#00e5ff';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('CLICK OR SPACE TO ADVANCE', this.W / 2, 340);
        }

        _drawGameOverOverlay(ctx) {
            ctx.fillStyle = 'rgba(20, 8, 16, 0.9)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff1744';
            ctx.font = '28px "Press Start 2P", monospace';
            ctx.fillText('GAME OVER', this.W / 2, 200);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText(`FINAL SCORE: ${this.score}`, this.W / 2, 260);

            ctx.fillStyle = '#ffd700';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('CLICK OR SPACE TO RETRY', this.W / 2, 330);
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
    // INITIALIZATION
    // ============================
    window.addEventListener('DOMContentLoaded', () => {
        const game = new Game();
        game.run();
    });

})();

