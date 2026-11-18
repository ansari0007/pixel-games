/* ==========================================================================
   PIXEL CLIMBER — Retro Arcade Infinite Vertical Climber
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // ============================
    // CONSTANTS & GAME SETTINGS
    // ============================
    const CANVAS_W = 480;
    const CANVAS_H = 640;

    const GRAVITY = 0.38;
    const JUMP_VELOCITY = -10.8;
    const SPRING_VELOCITY = -18.5;
    const JETPACK_VELOCITY = -13.5;

    // Platform Types
    const PLATFORM_TYPE = {
        STATIC: 'STATIC',       // Green standard
        MOVING: 'MOVING',       // Blue horizontal slider
        CRACKED: 'CRACKED',     // Brown breakable
        SPRING: 'SPRING',       // Yellow with coil
        VANISHING: 'VANISHING'  // Translucent cloud
    };

    // Game States
    const STATE = {
        TITLE: 'TITLE',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        GAME_OVER: 'GAME_OVER'
    };


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
                case 'jump': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(320, t);
                    osc.frequency.exponentialRampToValueAtTime(640, t + 0.1);
                    gain.gain.setValueAtTime(0.15, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.11);
                    break;
                }
                case 'spring': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(400, t);
                    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.25);
                    gain.gain.setValueAtTime(0.22, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.26);
                    break;
                }
                case 'jetpack': {
                    // Filtered noise thruster roar
                    const bufSize = this.ctx.sampleRate * 0.15;
                    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufSize; i++) {
                        data[i] = (Math.random() * 2 - 1) * 0.3;
                    }
                    const noise = this.ctx.createBufferSource();
                    noise.buffer = buffer;
                    const filter = this.ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(600, t);
                    const gain = this.ctx.createGain();
                    gain.gain.setValueAtTime(0.18, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                    noise.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);
                    noise.start(t);
                    break;
                }
                case 'star': {
                    const notes = [659, 880, 1046, 1318];
                    notes.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sine';
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
                case 'crack': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(160, t);
                    osc.frequency.linearRampToValueAtTime(70, t + 0.12);
                    gain.gain.setValueAtTime(0.18, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.13);
                    break;
                }
                case 'shoot': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(900, t);
                    osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);
                    gain.gain.setValueAtTime(0.1, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.09);
                    break;
                }
                case 'monsterHit': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(280, t);
                    osc.frequency.linearRampToValueAtTime(80, t + 0.16);
                    gain.gain.setValueAtTime(0.25, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.17);
                    break;
                }
                case 'fall': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(600, t);
                    osc.frequency.exponentialRampToValueAtTime(80, t + 0.6);
                    gain.gain.setValueAtTime(0.2, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.62);
                    break;
                }
            }
        }
    };


    // ============================
    // VISUAL PARTICLES & POPUPS
    // ============================
    class Particle {
        constructor(x, y, color, size = 3, vx = null, vy = null) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size;
            this.vx = vx !== null ? vx : (Math.random() * 4 - 2);
            this.vy = vy !== null ? vy : (Math.random() * 4 - 2);
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
            this.vy = -1.4;
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
    // PLATFORM & ENTITY CLASSES
    // ============================
    class Platform {
        constructor(x, y, type = PLATFORM_TYPE.STATIC) {
            this.x = x;
            this.y = y;
            this.w = 68;
            this.h = 14;
            this.type = type;

            // Moving platform props
            this.vx = (Math.random() < 0.5 ? 1 : -1) * (1.2 + Math.random() * 0.8);

            // Broken / cracked state
            this.broken = false;
            this.breakAnim = 0;

            // Spring prop
            this.hasSpring = (type === PLATFORM_TYPE.SPRING);
            this.springCompressed = false;

            // Collectibles on platform
            this.star = (Math.random() < 0.18 && type !== PLATFORM_TYPE.CRACKED);
            this.jetpack = (Math.random() < 0.04 && type === PLATFORM_TYPE.STATIC);
        }

        update() {
            if (this.type === PLATFORM_TYPE.MOVING) {
                this.x += this.vx;
                if (this.x <= 10) {
                    this.x = 10;
                    this.vx *= -1;
                } else if (this.x + this.w >= CANVAS_W - 10) {
                    this.x = CANVAS_W - 10 - this.w;
                    this.vx *= -1;
                }
            }

            if (this.broken) {
                this.breakAnim += 2.5;
            }
        }

        draw(ctx) {
            if (this.broken && this.breakAnim > 30) return;

            ctx.save();

            if (this.type === PLATFORM_TYPE.STATIC) {
                // Neon Green high-tech pad
                ctx.fillStyle = '#103816';
                ctx.fillRect(this.x, this.y, this.w, this.h);
                ctx.strokeStyle = '#39ff14';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#39ff14';
                ctx.shadowBlur = 8;
                ctx.strokeRect(this.x, this.y, this.w, this.h);

                // Grid detail
                ctx.fillStyle = '#39ff14';
                ctx.fillRect(this.x + 6, this.y + 3, this.w - 12, 3);
            } else if (this.type === PLATFORM_TYPE.MOVING) {
                // Neon Blue floating shuttle pad
                ctx.fillStyle = '#062038';
                ctx.fillRect(this.x, this.y, this.w, this.h);
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 8;
                ctx.strokeRect(this.x, this.y, this.w, this.h);

                // Chevron arrows indicating movement
                ctx.fillStyle = '#00f0ff';
                ctx.fillRect(this.x + 10, this.y + 4, 6, 6);
                ctx.fillRect(this.x + this.w - 16, this.y + 4, 6, 6);
            } else if (this.type === PLATFORM_TYPE.CRACKED) {
                // Brown fragile crumbling ledge
                ctx.fillStyle = '#382010';
                ctx.fillRect(this.x, this.y + this.breakAnim, this.w, this.h);
                ctx.strokeStyle = '#ff9900';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(this.x, this.y + this.breakAnim, this.w, this.h);

                // Crack lines
                ctx.strokeStyle = '#ffff00';
                ctx.beginPath();
                ctx.moveTo(this.x + this.w * 0.45, this.y + this.breakAnim);
                ctx.lineTo(this.x + this.w * 0.52, this.y + this.h + this.breakAnim);
                ctx.stroke();
            } else if (this.type === PLATFORM_TYPE.SPRING) {
                // Golden bounce pad
                ctx.fillStyle = '#383008';
                ctx.fillRect(this.x, this.y, this.w, this.h);
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 8;
                ctx.strokeRect(this.x, this.y, this.w, this.h);

                // Spring Coil on top
                const coilX = this.x + this.w / 2 - 8;
                const coilH = this.springCompressed ? 4 : 10;
                const coilY = this.y - coilH;

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(coilX, coilY, 16, coilH);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(coilX - 2, coilY, 20, 3);
            } else if (this.type === PLATFORM_TYPE.VANISHING) {
                // Translucent vapor pad
                ctx.globalAlpha = 0.55;
                ctx.fillStyle = '#200838';
                ctx.fillRect(this.x, this.y, this.w, this.h);
                ctx.strokeStyle = '#ff007f';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(this.x, this.y, this.w, this.h);
            }

            // Draw Collectible Star
            if (this.star && !this.broken) {
                const sx = this.x + this.w / 2;
                const sy = this.y - 14;
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(sx, sy, 5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw Jetpack Item
            if (this.jetpack && !this.broken) {
                const jx = this.x + this.w / 2;
                const jy = this.y - 16;
                ctx.fillStyle = '#ff0055';
                ctx.fillRect(jx - 5, jy - 6, 10, 14);
                ctx.fillStyle = '#00f0ff';
                ctx.fillRect(jx - 3, jy + 8, 6, 4);
            }

            ctx.restore();
        }
    }

    class Monster {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.w = 32;
            this.h = 24;
            this.vx = (Math.random() < 0.5 ? 1 : -1) * (1.0 + Math.random() * 0.8);
            this.alive = true;
            this.wiggle = Math.random() * Math.PI * 2;
        }

        update() {
            this.wiggle += 0.08;
            this.x += this.vx;
            if (this.x <= 20) {
                this.x = 20;
                this.vx *= -1;
            } else if (this.x + this.w >= CANVAS_W - 20) {
                this.x = CANVAS_W - 20 - this.w;
                this.vx *= -1;
            }
        }

        draw(ctx) {
            if (!this.alive) return;
            ctx.save();
            const yOff = Math.sin(this.wiggle) * 4;

            // Cute flying purple arcade bat/alien
            ctx.fillStyle = '#8a00ff';
            ctx.shadowColor = '#8a00ff';
            ctx.shadowBlur = 12;
            ctx.fillRect(this.x + 6, this.y + yOff + 4, this.w - 12, this.h - 8);

            // Flapping Wings
            ctx.fillStyle = '#ff007f';
            const wingY = Math.sin(this.wiggle * 2) > 0 ? -4 : 4;
            ctx.fillRect(this.x, this.y + yOff + 6 + wingY, 6, 8);
            ctx.fillRect(this.x + this.w - 6, this.y + yOff + 6 + wingY, 6, 8);

            // Large glowing single eye
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x + this.w / 2, this.y + yOff + 10, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff0055';
            ctx.beginPath();
            ctx.arc(this.x + this.w / 2 + (this.vx > 0 ? 2 : -2), this.y + yOff + 10, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    class Pellet {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.vy = -14;
            this.alive = true;
        }

        update() {
            this.y += this.vy;
            if (this.y < -50) this.alive = false;
        }

        draw(ctx) {
            ctx.save();
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }


    // ============================
    // MAIN CLIMBER CONTROLLER
    // ============================
    class PixelClimberGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;

            this.W = CANVAS_W;
            this.H = CANVAS_H;

            // Player State
            this.px = CANVAS_W / 2;
            this.py = CANVAS_H - 120;
            this.pw = 28;
            this.ph = 36;
            this.vx = 0;
            this.vy = 0;
            this.facingLeft = false;

            // Powerup state
            this.jetpackFuel = 0;
            this.springShoes = 0;

            // Camera & Score
            this.cameraY = 0;
            this.altitude = 0;
            this.highestAltitude = 0;
            this.score = 0;
            this.highScore = 0;
            this.starsCollected = 0;

            // Game State
            this.state = STATE.TITLE;
            this.platforms = [];
            this.monsters = [];
            this.pellets = [];
            this.particles = [];
            this.popups = [];

            // Input tracking
            this.keys = { left: false, right: false };

            this._loadHighScore();
            this._initInputs();
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }

        resize() {
            this.canvas.width = CANVAS_W;
            this.canvas.height = CANVAS_H;
        }

        _loadHighScore() {
            try {
                this.highScore = parseInt(localStorage.getItem('pixelclimber_highscore') || '0', 10);
            } catch (e) {}
        }

        _saveHighScore() {
            try {
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('pixelclimber_highscore', String(this.highScore));
                }
            } catch (e) {}
        }

        _initInputs() {
            // Keyboard
            window.addEventListener('keydown', (e) => {
                Sound.init();
                const code = e.code;

                if (this.state === STATE.TITLE || this.state === STATE.GAME_OVER) {
                    if (code === 'Space' || code === 'Enter') {
                        this.startGame();
                        return;
                    }
                } else if (this.state === STATE.PLAYING) {
                    if (code === 'ArrowLeft' || code === 'KeyA') {
                        this.keys.left = true;
                    } else if (code === 'ArrowRight' || code === 'KeyD') {
                        this.keys.right = true;
                    } else if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
                        this.shootPellet();
                    } else if (code === 'KeyP' || code === 'Escape') {
                        this.togglePause();
                    }
                } else if (this.state === STATE.PAUSED) {
                    if (code === 'KeyP' || code === 'Escape' || code === 'Space') {
                        this.togglePause();
                    }
                }
            });

            window.addEventListener('keyup', (e) => {
                const code = e.code;
                if (code === 'ArrowLeft' || code === 'KeyA') this.keys.left = false;
                if (code === 'ArrowRight' || code === 'KeyD') this.keys.right = false;
            });

            // Mobile On-Screen Buttons
            const btnLeft = document.getElementById('btn-left');
            const btnRight = document.getElementById('btn-right');
            const btnShoot = document.getElementById('btn-shoot');

            const bindBtn = (btn, onDown, onUp) => {
                if (!btn) return;
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    Sound.init();
                    if (this.state === STATE.TITLE || this.state === STATE.GAME_OVER) {
                        this.startGame();
                    } else {
                        onDown();
                    }
                }, { passive: false });
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    onUp();
                }, { passive: false });
                btn.addEventListener('mousedown', () => {
                    Sound.init();
                    if (this.state === STATE.TITLE || this.state === STATE.GAME_OVER) {
                        this.startGame();
                    } else {
                        onDown();
                    }
                });
                btn.addEventListener('mouseup', onUp);
            };

            bindBtn(btnLeft, () => { this.keys.left = true; }, () => { this.keys.left = false; });
            bindBtn(btnRight, () => { this.keys.right = true; }, () => { this.keys.right = false; });
            bindBtn(btnShoot, () => { this.shootPellet(); }, () => {});

            // Canvas Click
            this.canvas.addEventListener('click', () => {
                Sound.init();
                if (this.state === STATE.TITLE || this.state === STATE.GAME_OVER) {
                    this.startGame();
                }
            });

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
                    this.startGame();
                });
            }
        }

        togglePause() {
            if (this.state === STATE.PLAYING) {
                this.state = STATE.PAUSED;
            } else if (this.state === STATE.PAUSED) {
                this.state = STATE.PLAYING;
            }
        }

        shootPellet() {
            if (this.state !== STATE.PLAYING) return;
            this.pellets.push(new Pellet(this.px, this.py - 10));
            Sound.play('shoot');
        }

        startGame() {
            this.state = STATE.PLAYING;
            this.px = CANVAS_W / 2;
            this.py = CANVAS_H - 140;
            this.vx = 0;
            this.vy = JUMP_VELOCITY;
            this.cameraY = 0;
            this.altitude = 0;
            this.highestAltitude = 0;
            this.score = 0;
            this.starsCollected = 0;
            this.jetpackFuel = 0;
            this.springShoes = 0;

            this.pellets.length = 0;
            this.particles.length = 0;
            this.popups.length = 0;
            this.monsters.length = 0;

            // Generate initial ladder of platforms
            this.platforms = [];

            // Solid starter platform under player
            const startPlat = new Platform(CANVAS_W / 2 - 40, CANVAS_H - 80, PLATFORM_TYPE.STATIC);
            startPlat.w = 80;
            this.platforms.push(startPlat);

            let currentY = CANVAS_H - 140;
            while (currentY > -1000) {
                currentY -= (45 + Math.random() * 35);
                const rx = 20 + Math.random() * (CANVAS_W - 100);
                const plat = this._generatePlatform(rx, currentY);
                this.platforms.push(plat);
            }

            Sound.play('jump');
        }

        _generatePlatform(x, y) {
            const alt = Math.abs(y);
            let type = PLATFORM_TYPE.STATIC;

            const roll = Math.random();
            if (alt > 2000 && roll < 0.22) {
                type = PLATFORM_TYPE.CRACKED;
            } else if (alt > 1000 && roll < 0.45) {
                type = PLATFORM_TYPE.MOVING;
            } else if (roll < 0.58) {
                type = PLATFORM_TYPE.SPRING;
            } else if (alt > 3000 && roll < 0.70) {
                type = PLATFORM_TYPE.VANISHING;
            }

            const plat = new Platform(x, y, type);

            // Chance to spawn flying monster above high platforms
            if (alt > 1500 && Math.random() < 0.12 && !plat.star && !plat.jetpack) {
                this.monsters.push(new Monster(x + plat.w / 2 - 16, y - 50));
            }

            return plat;
        }


        // ============================
        // UPDATE LOOP
        // ============================
        update() {
            if (this.state !== STATE.PLAYING) return;

            // 1. Horizontal Player Movement
            const accel = 0.85;
            const maxSpeed = 7.5;
            const friction = 0.88;

            if (this.keys.left) {
                this.vx -= accel;
                this.facingLeft = true;
            } else if (this.keys.right) {
                this.vx += accel;
                this.facingLeft = false;
            } else {
                this.vx *= friction;
            }

            this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));
            this.px += this.vx;

            // Screen wrapping
            if (this.px < -this.pw / 2) {
                this.px = CANVAS_W + this.pw / 2;
            } else if (this.px > CANVAS_W + this.pw / 2) {
                this.px = -this.pw / 2;
            }

            // 2. Vertical Jetpack or Gravity
            if (this.jetpackFuel > 0) {
                this.jetpackFuel--;
                this.vy = JETPACK_VELOCITY;
                Sound.play('jetpack');

                // Jetpack fiery thruster particles
                this.particles.push(new Particle(this.px - (this.facingLeft ? -8 : 8), this.py + 16, '#00f0ff', 4, (Math.random() * 2 - 1), 4));
                this.particles.push(new Particle(this.px - (this.facingLeft ? -8 : 8), this.py + 18, '#ff007f', 3, (Math.random() * 2 - 1), 5));
            } else {
                this.vy += GRAVITY;
            }

            this.py += this.vy;

            // 3. Platform Landing Collisions (Only when falling downwards!)
            if (this.vy > 0 && this.jetpackFuel <= 0) {
                const footX = this.px;
                const footY = this.py + this.ph / 2;

                this.platforms.forEach(plat => {
                    if (plat.broken) return;

                    // Overlap test
                    if (footX >= plat.x - 10 && footX <= plat.x + plat.w + 10 &&
                        footY >= plat.y && footY <= plat.y + 15) {

                        if (plat.type === PLATFORM_TYPE.CRACKED) {
                            plat.broken = true;
                            Sound.play('crack');
                            for (let i = 0; i < 8; i++) {
                                this.particles.push(new Particle(plat.x + plat.w / 2, plat.y, '#ff9900', 3));
                            }
                        } else if (plat.hasSpring) {
                            plat.springCompressed = true;
                            this.vy = SPRING_VELOCITY;
                            Sound.play('spring');
                            this.popups.push(new FloatingText('SUPER BOUNCE!', this.px, this.py - 20, '#ffd700', 12));
                            setTimeout(() => { plat.springCompressed = false; }, 200);
                        } else {
                            // Standard or moving bounce
                            if (this.springShoes > 0) {
                                this.springShoes--;
                                this.vy = SPRING_VELOCITY * 0.9;
                                Sound.play('spring');
                            } else {
                                this.vy = JUMP_VELOCITY;
                                Sound.play('jump');
                            }

                            if (plat.type === PLATFORM_TYPE.VANISHING) {
                                plat.broken = true;
                            }
                        }
                    }
                });
            }

            // 4. Collectibles Collection
            this.platforms.forEach(plat => {
                if (plat.star && !plat.broken) {
                    const dist = Math.hypot(this.px - (plat.x + plat.w / 2), this.py - (plat.y - 14));
                    if (dist < 26) {
                        plat.star = false;
                        this.starsCollected++;
                        this.score += 150;
                        this._saveHighScore();
                        Sound.play('star');
                        this.popups.push(new FloatingText('+150', plat.x + plat.w / 2, plat.y - 30, '#ffd700', 12));
                        for (let i = 0; i < 8; i++) {
                            this.particles.push(new Particle(plat.x + plat.w / 2, plat.y - 14, '#ffd700', 3));
                        }
                    }
                }

                if (plat.jetpack && !plat.broken) {
                    const dist = Math.hypot(this.px - (plat.x + plat.w / 2), this.py - (plat.y - 16));
                    if (dist < 28) {
                        plat.jetpack = false;
                        this.jetpackFuel = 160; // ~4.5s
                        Sound.play('spring');
                        this.popups.push(new FloatingText('ROCKET JETPACK!', this.px, this.py - 30, '#00f0ff', 14));
                        for (let i = 0; i < 16; i++) {
                            this.particles.push(new Particle(this.px, this.py, '#00f0ff', 4));
                        }
                    }
                }
            });

            // 5. Monster Collisions
            this.monsters.forEach(m => {
                if (!m.alive) return;
                m.update();

                // Player vs Monster
                const dist = Math.hypot(this.px - (m.x + m.w / 2), this.py - (m.y + m.h / 2));
                if (dist < 26) {
                    // If player is flying with jetpack or falling directly onto monster's head
                    if (this.jetpackFuel > 0 || (this.vy > 0 && this.py < m.y)) {
                        m.alive = false;
                        this.vy = JUMP_VELOCITY * 1.1; // Stomp bounce!
                        this.score += 300;
                        this._saveHighScore();
                        Sound.play('monsterHit');
                        this.popups.push(new FloatingText('STOMP! +300', m.x + m.w / 2, m.y - 20, '#ff007f', 12));
                        for (let i = 0; i < 14; i++) {
                            this.particles.push(new Particle(m.x + m.w / 2, m.y + m.h / 2, '#ff007f', 4));
                        }
                    } else {
                        // Player hit by monster -> Knock down!
                        this.vy = 8;
                        this._gameOver('MONSTER AMBUSH');
                    }
                }

                // Pellets vs Monster
                this.pellets.forEach(pellet => {
                    if (!pellet.alive || !m.alive) return;
                    if (pellet.x >= m.x && pellet.x <= m.x + m.w &&
                        pellet.y >= m.y && pellet.y <= m.y + m.h) {
                        pellet.alive = false;
                        m.alive = false;
                        this.score += 250;
                        this._saveHighScore();
                        Sound.play('monsterHit');
                        this.popups.push(new FloatingText('ZAPPED! +250', m.x + m.w / 2, m.y - 20, '#ffd700', 12));
                        for (let i = 0; i < 12; i++) {
                            this.particles.push(new Particle(m.x + m.w / 2, m.y + m.h / 2, '#ffd700', 3));
                        }
                    }
                });
            });

            // 6. Camera Scrolling (Smoothly follow player upward)
            const targetCamY = this.py - CANVAS_H * 0.55;
            if (targetCamY < this.cameraY) {
                const diff = this.cameraY - targetCamY;
                this.cameraY = targetCamY;

                // Update altitude and score
                this.altitude = Math.floor(Math.abs(this.cameraY));
                if (this.altitude > this.highestAltitude) {
                    const gained = this.altitude - this.highestAltitude;
                    this.highestAltitude = this.altitude;
                    this.score += gained;
                    this._saveHighScore();
                }
            }

            // 7. Dynamic Platform Generation & Cleanup
            this.platforms.forEach(p => p.update());

            // Remove platforms and monsters far below the screen
            const cullY = this.cameraY + CANVAS_H + 80;
            this.platforms = this.platforms.filter(p => p.y < cullY);
            this.monsters = this.monsters.filter(m => m.y < cullY && m.alive);

            // Spawn new platforms above as camera rises
            let highestPlatY = this.platforms.reduce((min, p) => Math.min(min, p.y), 0);
            while (highestPlatY > this.cameraY - 400) {
                highestPlatY -= (45 + Math.random() * 40);
                const rx = 20 + Math.random() * (CANVAS_W - 100);
                const plat = this._generatePlatform(rx, highestPlatY);
                this.platforms.push(plat);
            }

            // 8. Pellets update
            this.pellets.forEach(p => p.update());
            this.pellets = this.pellets.filter(p => p.alive);

            // 9. Particles update
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].alpha <= 0) this.particles.splice(i, 1);
            }

            // 10. Popups update
            for (let i = this.popups.length - 1; i >= 0; i--) {
                this.popups[i].update();
                if (this.popups[i].alpha <= 0) this.popups.splice(i, 1);
            }

            // 11. Fall below screen -> Game Over
            if (this.py > this.cameraY + CANVAS_H + 40) {
                this._gameOver('FELL INTO THE VOID');
            }
        }

        _gameOver(reason = '') {
            this.state = STATE.GAME_OVER;
            Sound.play('fall');
            this._saveHighScore();
            this.popups.push(new FloatingText(reason, CANVAS_W / 2, CANVAS_H / 2 - 40, '#ff0055', 12));
        }


        // ============================
        // RENDER LOOP
        // ============================
        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.W, this.H);

            // 1. Dynamic Altitude Sky Background
            this._drawSky(ctx);

            // Save context for camera transformation
            ctx.save();
            ctx.translate(0, -this.cameraY);

            // 2. Platforms
            this.platforms.forEach(p => p.draw(ctx));

            // 3. Monsters
            this.monsters.forEach(m => m.draw(ctx));

            // 4. Pellets
            this.pellets.forEach(pellet => pellet.draw(ctx));

            // 5. Player Character
            if (this.state !== STATE.TITLE) {
                this._drawPlayer(ctx);
            }

            // 6. Particles
            this.particles.forEach(p => p.draw(ctx));

            // 7. Popups
            this.popups.forEach(pop => pop.draw(ctx));

            ctx.restore();

            // 8. Static HUD Overlay
            if (this.state === STATE.PLAYING || this.state === STATE.PAUSED) {
                this._drawHUD(ctx);
            }

            // 9. State Overlays
            if (this.state === STATE.TITLE) {
                this._drawTitleScreen(ctx);
            } else if (this.state === STATE.PAUSED) {
                this._drawPauseOverlay(ctx);
            } else if (this.state === STATE.GAME_OVER) {
                this._drawGameOverOverlay(ctx);
            }
        }

        _drawSky(ctx) {
            const alt = this.highestAltitude;
            const grad = ctx.createLinearGradient(0, 0, 0, this.H);

            if (alt < 3000) {
                // Sunset City Skyline (Dusk orange & deep purple)
                grad.addColorStop(0, '#1a0836');
                grad.addColorStop(0.6, '#3a1050');
                grad.addColorStop(1, '#662244');
            } else if (alt < 8000) {
                // Stratosphere (Deep sapphire twilight)
                grad.addColorStop(0, '#060a26');
                grad.addColorStop(0.5, '#0e1848');
                grad.addColorStop(1, '#1b1240');
            } else {
                // Cosmic Orbit & Nebula (Pure dark space with stars)
                grad.addColorStop(0, '#020108');
                grad.addColorStop(0.7, '#070514');
                grad.addColorStop(1, '#100a26');
            }

            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.W, this.H);

            // Distant pixel stars
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            for (let i = 0; i < 25; i++) {
                const sx = (i * 97) % this.W;
                const sy = (i * 123 + Math.floor(this.cameraY * 0.1)) % this.H;
                const r = (i % 3 === 0) ? 2 : 1;
                ctx.fillRect(sx, sy, r, r);
            }
        }

        _drawPlayer(ctx) {
            ctx.save();
            ctx.translate(this.px, this.py);

            if (this.facingLeft) {
                ctx.scale(-1, 1);
            }

            const isRocket = this.jetpackFuel > 0;

            // Jetpack Tank on back
            ctx.fillStyle = isRocket ? '#ffaa00' : '#4a5568';
            ctx.fillRect(-16, -6, 7, 18);
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(-15, 12, 5, 4);

            // Astronaut Body (Cute rounded neon suit)
            ctx.fillStyle = '#39ff14';
            ctx.shadowColor = '#39ff14';
            ctx.shadowBlur = 8;
            ctx.fillRect(-10, -12, 20, 24);

            // White Belly Panel
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-6, -6, 12, 14);

            // Big Curved Visor / Eyes
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.fillRect(0, -10, 10, 8);

            // Cute Antenna with glowing beacon
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, -18, 3, 6);
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.beginPath();
            ctx.arc(-0.5, -20, 3, 0, Math.PI * 2);
            ctx.fill();

            // Spring Shoes if active
            if (this.springShoes > 0) {
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-10, 12, 8, 5);
                ctx.fillRect(2, 12, 8, 5);
            } else {
                // Cute little boot feet
                ctx.fillStyle = '#103816';
                ctx.fillRect(-8, 12, 6, 4);
                ctx.fillRect(2, 12, 6, 4);
            }

            ctx.restore();
        }

        _drawHUD(ctx) {
            // Semi-transparent top bar
            ctx.fillStyle = 'rgba(6, 4, 16, 0.82)';
            ctx.fillRect(0, 0, this.W, 36);
            ctx.strokeStyle = 'rgba(57, 255, 20, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, this.W, 36);

            // Altitude & Score
            ctx.fillStyle = '#39ff14';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`ALT: ${Math.floor(this.highestAltitude / 10)}m`, 14, 22);

            // Stars Collected
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.fillText(`★ ${this.starsCollected}`, this.W / 2, 22);

            // Total Score
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'right';
            ctx.fillText(`SCORE: ${this.score}`, this.W - 14, 22);

            // Active Jetpack Fuel Gauge
            if (this.jetpackFuel > 0) {
                const barW = 120;
                const barH = 8;
                const barX = 14;
                const barY = 44;
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(barX, barY, barW, barH);
                ctx.fillStyle = '#00f0ff';
                ctx.fillRect(barX, barY, (this.jetpackFuel / 160) * barW, barH);
                ctx.strokeStyle = '#00f0ff';
                ctx.strokeRect(barX, barY, barW, barH);
            }
        }

        _drawTitleScreen(ctx) {
            ctx.textAlign = 'center';

            ctx.fillStyle = '#39ff14';
            ctx.shadowColor = '#39ff14';
            ctx.shadowBlur = 18;
            ctx.font = '28px "Press Start 2P", monospace';
            ctx.fillText('PIXEL', this.W / 2, 170);

            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 24;
            ctx.font = '34px "Press Start 2P", monospace';
            ctx.fillText('CLIMBER', this.W / 2, 225);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#00f0ff';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText('INFINITE VERTICAL ARCADE JUMP', this.W / 2, 265);

            // Animated Preview
            const previewY = 350;
            ctx.fillStyle = '#39ff14';
            ctx.fillRect(this.W / 2 - 35, previewY + 20, 70, 12);
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(this.W / 2 - 35, previewY + 20, 70, 12);

            // Floating character
            const bounce = Math.abs(Math.sin(Date.now() * 0.005)) * 30;
            ctx.save();
            ctx.translate(this.W / 2, previewY - bounce);
            ctx.fillStyle = '#39ff14';
            ctx.fillRect(-10, -12, 20, 24);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-6, -6, 12, 14);
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(0, -10, 10, 8);
            ctx.restore();

            // Pulsing Start Button
            const pulse = Math.sin(Date.now() * 0.006) * 0.2 + 0.8;
            ctx.fillStyle = `rgba(57, 255, 20, ${0.2 * pulse})`;
            ctx.fillRect(this.W / 2 - 160, 440, 320, 50);
            ctx.strokeStyle = '#39ff14';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.W / 2 - 160, 440, 320, 50);

            ctx.fillStyle = '#ffffff';
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillText('▶ CLICK OR SPACE TO CLIMB', this.W / 2, 472);

            // High Score
            ctx.fillStyle = '#ffd700';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText(`HIGH SCORE: ${this.highScore}`, this.W / 2, 530);

            // Instructions
            ctx.fillStyle = '#8899aa';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('LEFT / RIGHT / A / D: STEER', this.W / 2, 565);
            ctx.fillText('SPACE / 🎯: SHOOT • BOUNCE ON SPRINGS & ROCKETS', this.W / 2, 585);
        }

        _drawPauseOverlay(ctx) {
            ctx.fillStyle = 'rgba(6, 4, 16, 0.85)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 16;
            ctx.font = '22px "Press Start 2P", monospace';
            ctx.fillText('PAUSED', this.W / 2, this.H / 2 - 15);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('PRESS P OR TAP TO RESUME', this.W / 2, this.H / 2 + 25);
        }

        _drawGameOverOverlay(ctx) {
            ctx.fillStyle = 'rgba(6, 4, 16, 0.88)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 18;
            ctx.font = '26px "Press Start 2P", monospace';
            ctx.fillText('YOU FELL!', this.W / 2, 210);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText(`ALTITUDE: ${Math.floor(this.highestAltitude / 10)}m`, this.W / 2, 270);
            ctx.fillText(`SCORE: ${this.score}`, this.W / 2, 305);

            ctx.fillStyle = '#ffd700';
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillText(`HIGH SCORE: ${this.highScore}`, this.W / 2, 345);

            ctx.fillStyle = '#00f0ff';
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillText('CLICK OR SPACE TO RETRY', this.W / 2, 420);
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
        const game = new PixelClimberGame();
        game.run();
    });

})();

