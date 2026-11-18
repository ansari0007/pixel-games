/* ==========================================================================
   NEON BREAKOUT — Cyber Arkanoid / Brick Breaker Engine
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // --- Canvas & Context Setup ---
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const GAME_WIDTH = 640;
    const GAME_HEIGHT = 800;

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    // --- Audio Engine ---
    class NeonAudioEngine {
        constructor() {
            this.ctx = null;
            this.muted = localStorage.getItem('neon_breakout_muted') === 'true';
            this.notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
        }

        init() {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this.ctx = new AudioContext();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playPaddleHit(offsetNorm = 0) {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                const baseFreq = 220 + Math.abs(offsetNorm) * 120;
                osc.frequency.setValueAtTime(baseFreq, now);
                osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.04);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.13);
            } catch (e) {}
        }

        playBrickHit(combo = 1) {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                const noteIdx = Math.min(this.notes.length - 1, (combo - 1) % this.notes.length);
                const freq = this.notes[noteIdx];

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.08);

                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.19);
            } catch (e) {}
        }

        playArmoredHit() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'square';
                osc.frequency.setValueAtTime(360, now);
                osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
            } catch (e) {}
        }

        playExplosion() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const bufferSize = this.ctx.sampleRate * 0.4;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
                }

                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, now);
                filter.frequency.linearRampToValueAtTime(80, now + 0.38);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.6, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                noise.start(now);
            } catch (e) {}
        }

        playLaser() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(900, now);
                osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.13);
            } catch (e) {}
        }

        playPowerup() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const freqs = [440, 554.37, 659.25, 880];
                freqs.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.05);

                    gain.gain.setValueAtTime(0.2, now + idx * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.05);
                    osc.stop(now + idx * 0.05 + 0.19);
                });
            } catch (e) {}
        }

        playShieldBounce() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(320, now + 0.15);

                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.19);
            } catch (e) {}
        }

        playLoseBall() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(280, now);
                osc.frequency.linearRampToValueAtTime(90, now + 0.35);

                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.36);
            } catch (e) {}
        }

        playLevelClear() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const chords = [
                    { f: [523.25, 659.25, 783.99], t: 0 },
                    { f: [587.33, 739.99, 880.00], t: 0.15 },
                    { f: [659.25, 830.61, 987.77], t: 0.30 },
                    { f: [1046.50, 1318.51, 1567.98], t: 0.45 }
                ];
                chords.forEach(c => {
                    c.f.forEach(freq => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, now + c.t);

                        gain.gain.setValueAtTime(0.18, now + c.t);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + c.t + 0.28);

                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(now + c.t);
                        osc.stop(now + c.t + 0.3);
                    });
                });
            } catch (e) {}
        }

        playGameOver() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const notes = [392, 349.23, 329.63, 293.66, 261.63, 220];
                notes.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.14);

                    gain.gain.setValueAtTime(0.2, now + idx * 0.14);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.2);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.14);
                    osc.stop(now + idx * 0.14 + 0.22);
                });
            } catch (e) {}
        }
    }

    const audio = new NeonAudioEngine();

    // --- Game Constants & Enums ---
    const STATE = {
        TITLE: 0,
        READY: 1,
        PLAYING: 2,
        LEVEL_CLEAR: 3,
        GAME_OVER: 4,
        GAME_VICTORY: 5
    };

    const BRICK_TYPE = {
        NORMAL: 1,
        ARMORED: 2,
        TNT: 3,
        STEEL: 4,
        BONUS: 5,
        MOVING: 6
    };

    const BRICK_COLORS = {
        cyan: { fill: '#00f0ff', glow: 'rgba(0, 240, 255, 0.6)', border: '#80f7ff' },
        pink: { fill: '#ff007f', glow: 'rgba(255, 0, 127, 0.6)', border: '#ff80bf' },
        lime: { fill: '#39ff14', glow: 'rgba(57, 255, 20, 0.6)', border: '#9cff8a' },
        yellow: { fill: '#ffea00', glow: 'rgba(255, 234, 0, 0.6)', border: '#fff580' },
        purple: { fill: '#b026ff', glow: 'rgba(176, 38, 255, 0.6)', border: '#d893ff' },
        orange: { fill: '#ff7700', glow: 'rgba(255, 119, 0, 0.6)', border: '#ffbb80' }
    };

    const POWERUP_TYPE = {
        MULTIBALL: { id: 'multi', label: '⚡ MULTI-BALL', color: '#00f0ff', icon: '⚡' },
        LASER: { id: 'laser', label: '🔫 LASER CANNONS', color: '#ff007f', icon: '🔫' },
        FIREBALL: { id: 'fire', label: '🔥 FIREBALL', color: '#ffea00', icon: '🔥' },
        WIDE: { id: 'wide', label: '↔️ WIDE PADDLE', color: '#39ff14', icon: '↔️' },
        SHIELD: { id: 'shield', label: '🛡️ ENERGY FLOOR', color: '#00f0ff', icon: '🛡️' },
        SLOW: { id: 'slow', label: '⏱️ SLOW MOTION', color: '#b026ff', icon: '⏱️' },
        LIFE: { id: 'life', label: '💖 +1 LIFE', color: '#ff2a5f', icon: '💖' },
        GEM: { id: 'gem', label: '💎 +1000 BONUS', color: '#ffd700', icon: '💎' }
    };

    // --- Game Variables ---
    let gameState = STATE.TITLE;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('neon_breakout_highscore') || '0', 10);
    let lives = 3;
    let levelIndex = 0;
    let comboStreak = 0;
    let maxCombo = 0;
    let screenShake = 0;
    let isPaused = false;
    let frameCount = 0;

    // Entities
    let paddle;
    let balls = [];
    let bricks = [];
    let powerups = [];
    let lasers = [];
    let particles = [];
    let floatingTexts = [];
    let backgroundStars = [];

    // Timers & Active Buffs
    let laserTimer = 0;
    let wideTimer = 0;
    let shieldTimer = 0;
    let fireballTimer = 0;
    let slowTimer = 0;
    let laserAutoFireCooldown = 0;

    // Keys & Input
    const keys = {
        left: false,
        right: false,
        launch: false
    };
    let touchDragging = false;
    let targetPaddleX = GAME_WIDTH / 2;

    // --- Starfield Background Generation ---
    for (let i = 0; i < 65; i++) {
        backgroundStars.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * GAME_HEIGHT,
            size: Math.random() * 2 + 0.8,
            speed: Math.random() * 0.4 + 0.1,
            brightness: Math.random() * 0.7 + 0.3,
            pulseSpeed: Math.random() * 0.03 + 0.01
        });
    }

    // --- Entity Classes ---

    class Paddle {
        constructor() {
            this.baseWidth = 104;
            this.curWidth = 104;
            this.targetWidth = 104;
            this.height = 18;
            this.x = GAME_WIDTH / 2;
            this.y = 740;
            this.speed = 10;
            this.glowAnim = 0;
            this.vx = 0;
            this.lastX = this.x;
        }

        update() {
            this.glowAnim += 0.05;

            // Target width interpolation (e.g. Wide buff)
            if (wideTimer > 0) {
                this.targetWidth = 156;
            } else {
                this.targetWidth = this.baseWidth;
            }
            this.curWidth += (this.targetWidth - this.curWidth) * 0.15;

            // Movement handling
            this.lastX = this.x;

            if (keys.left) {
                targetPaddleX -= this.speed;
            }
            if (keys.right) {
                targetPaddleX += this.speed;
            }

            // Clamp target inside bounds
            const halfW = this.curWidth / 2;
            targetPaddleX = Math.max(halfW + 8, Math.min(GAME_WIDTH - halfW - 8, targetPaddleX));

            // Smooth paddle tracking
            this.x += (targetPaddleX - this.x) * 0.45;
            this.vx = this.x - this.lastX;

            // Laser auto fire or manual fire
            if (laserTimer > 0) {
                laserAutoFireCooldown--;
                if (laserAutoFireCooldown <= 0) {
                    this.fireLasers();
                    laserAutoFireCooldown = 22; // frame rate of shots
                }
            }
        }

        fireLasers() {
            const halfW = this.curWidth / 2;
            lasers.push(new Laser(this.x - halfW + 6, this.y - 4));
            lasers.push(new Laser(this.x + halfW - 6, this.y - 4));
            audio.playLaser();
        }

        draw(ctx) {
            const halfW = this.curWidth / 2;
            const x = this.x - halfW;
            const y = this.y;
            const w = this.curWidth;
            const h = this.height;

            ctx.save();

            // Glow shadow
            const glowColor = laserTimer > 0 ? '#ff007f' : (wideTimer > 0 ? '#39ff14' : '#00f0ff');
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15 + Math.sin(this.glowAnim) * 5;

            // Main paddle chassis (Curved cyber capsule)
            const grad = ctx.createLinearGradient(x, y, x, y + h);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, glowColor);
            grad.addColorStop(1, '#060214');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 8);
            ctx.fill();

            // Outer border
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Inner energy core
            const coreW = w * 0.6;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x - coreW / 2, y + 5, coreW, 3);

            // Side thrusters / laser mounts
            if (laserTimer > 0) {
                ctx.fillStyle = '#ff007f';
                ctx.fillRect(x - 5, y - 6, 8, 14);
                ctx.fillRect(x + w - 3, y - 6, 8, 14);

                // Laser nozzle muzzle flashes
                ctx.fillStyle = '#fff';
                ctx.fillRect(x - 3, y - 8, 4, 3);
                ctx.fillRect(x + w - 1, y - 8, 4, 3);
            } else {
                ctx.fillStyle = '#00f0ff';
                ctx.fillRect(x - 3, y + 3, 5, 12);
                ctx.fillRect(x + w - 2, y + 3, 5, 12);
            }

            ctx.restore();
        }
    }

    class Ball {
        constructor(x, y, vx, vy, isFireball = false) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.radius = 7;
            this.baseSpeed = 7.5;
            this.curSpeed = 7.5;
            this.isFireball = isFireball;
            this.trail = [];
            this.maxTrail = 10;
        }

        update() {
            // Apply speed buffs
            let targetSpeed = this.baseSpeed;
            if (slowTimer > 0) targetSpeed *= 0.65;
            if (fireballTimer > 0) this.isFireball = true;

            const curMag = Math.hypot(this.vx, this.vy) || 1;
            this.vx = (this.vx / curMag) * targetSpeed;
            this.vy = (this.vy / curMag) * targetSpeed;

            // Record trail
            this.trail.unshift({ x: this.x, y: this.y });
            if (this.trail.length > this.maxTrail) {
                this.trail.pop();
            }

            // Move
            this.x += this.vx;
            this.y += this.vy;

            // Wall collisions (Left & Right)
            if (this.x - this.radius <= 0) {
                this.x = this.radius;
                this.vx = Math.abs(this.vx);
                audio.playPaddleHit(0.2);
                createSparks(this.x, this.y, '#00f0ff', 6);
            } else if (this.x + this.radius >= GAME_WIDTH) {
                this.x = GAME_WIDTH - this.radius;
                this.vx = -Math.abs(this.vx);
                audio.playPaddleHit(0.2);
                createSparks(this.x, this.y, '#00f0ff', 6);
            }

            // Top wall collision
            if (this.y - this.radius <= 0) {
                this.y = this.radius;
                this.vy = Math.abs(this.vy);
                audio.playPaddleHit(0.3);
                createSparks(this.x, this.y, '#00f0ff', 8);
            }

            // Shield floor collision
            if (shieldTimer > 0 && this.y + this.radius >= 775) {
                this.y = 775 - this.radius;
                this.vy = -Math.abs(this.vy);
                audio.playShieldBounce();
                createShockwave(this.x, 780, '#00f0ff');
                createSparks(this.x, 780, '#00f0ff', 14);
            }

            // Paddle collision
            const halfW = paddle.curWidth / 2;
            const paddleTop = paddle.y;
            const paddleBottom = paddle.y + paddle.height;
            const paddleLeft = paddle.x - halfW;
            const paddleRight = paddle.x + halfW;

            if (this.vy > 0 &&
                this.y + this.radius >= paddleTop &&
                this.y - this.radius <= paddleBottom &&
                this.x + this.radius >= paddleLeft &&
                this.x - this.radius <= paddleRight) {

                this.y = paddleTop - this.radius;

                // Normalized offset from center (-1.0 to 1.0)
                let offset = (this.x - paddle.x) / (halfW);
                offset = Math.max(-0.95, Math.min(0.95, offset));

                // Dynamic angle bounce (up to 68 degrees)
                const maxAngle = Math.PI * 0.38;
                const angle = offset * maxAngle;

                const speed = Math.hypot(this.vx, this.vy);
                this.vx = speed * Math.sin(angle);
                this.vy = -speed * Math.cos(angle);

                // Add slight paddle momentum English
                this.vx += paddle.vx * 0.25;

                // Reset combo streak
                comboStreak = 0;

                audio.playPaddleHit(offset);
                createSparks(this.x, paddleTop, '#ffffff', 8);
            }
        }

        draw(ctx) {
            ctx.save();

            // Trail rendering
            for (let i = 0; i < this.trail.length; i++) {
                const pt = this.trail[i];
                const factor = 1 - (i / this.trail.length);
                const r = this.radius * factor * 0.85;

                ctx.beginPath();
                ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
                if (this.isFireball) {
                    ctx.fillStyle = `rgba(255, ${Math.floor(100 + 155 * factor)}, 0, ${factor * 0.5})`;
                } else {
                    ctx.fillStyle = `rgba(0, 240, 255, ${factor * 0.4})`;
                }
                ctx.fill();
            }

            // Main Ball
            ctx.shadowColor = this.isFireball ? '#ffea00' : '#00f0ff';
            ctx.shadowBlur = this.isFireball ? 20 : 12;

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

            if (this.isFireball) {
                const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.4, '#ffea00');
                grad.addColorStop(1, '#ff3300');
                ctx.fillStyle = grad;
            } else {
                const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.4, '#00f0ff');
                grad.addColorStop(1, '#0077ff');
                ctx.fillStyle = grad;
            }
            ctx.fill();

            // Ball highlight
            ctx.beginPath();
            ctx.arc(this.x - 2, this.y - 2, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fill();

            ctx.restore();
        }
    }

    class Brick {
        constructor(x, y, w, h, type, colorKey = 'cyan') {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.type = type;
            this.colorKey = colorKey;
            this.color = BRICK_COLORS[colorKey] || BRICK_COLORS.cyan;

            this.maxHits = (type === BRICK_TYPE.ARMORED) ? 2 : 1;
            this.hitsLeft = this.maxHits;
            this.isAlive = true;
            this.flashAnim = 0;

            // Moving brick mechanics
            this.vx = 0;
            this.startX = x;
            if (type === BRICK_TYPE.MOVING) {
                this.vx = 1.6;
                this.moveRange = 50;
            }
        }

        update() {
            if (this.flashAnim > 0) this.flashAnim -= 0.1;

            if (this.type === BRICK_TYPE.MOVING) {
                this.x += this.vx;
                if (Math.abs(this.x - this.startX) > this.moveRange) {
                    this.vx *= -1;
                }
            }
        }

        hit(ball) {
            if (this.type === BRICK_TYPE.STEEL) {
                audio.playArmoredHit();
                createSparks(ball.x, ball.y, '#ffffff', 6);
                return false; // Not destroyed
            }

            this.flashAnim = 1.0;
            this.hitsLeft--;

            if (this.hitsLeft <= 0 || ball.isFireball) {
                this.isAlive = false;
                comboStreak++;
                if (comboStreak > maxCombo) maxCombo = comboStreak;

                // Points based on type and combo
                let pts = 100;
                if (this.type === BRICK_TYPE.ARMORED) pts = 250;
                if (this.type === BRICK_TYPE.TNT) pts = 500;
                if (this.type === BRICK_TYPE.BONUS) pts = 400;

                const totalPts = pts * Math.min(comboStreak, 10);
                score += totalPts;

                audio.playBrickHit(comboStreak);
                addFloatingText(`+${totalPts}`, this.x + this.w / 2, this.y, comboStreak > 3 ? '#ffea00' : '#ffffff');

                if (comboStreak >= 3 && comboStreak % 3 === 0) {
                    addFloatingText(`COMBO x${comboStreak}!`, this.x + this.w / 2, this.y - 18, '#ff007f');
                }

                // Explosions / Sparks
                createSparks(this.x + this.w / 2, this.y + this.h / 2, this.color.fill, 16);

                // TNT trigger
                if (this.type === BRICK_TYPE.TNT) {
                    detonateTNT(this);
                }

                // Chance to drop power-up
                if (this.type === BRICK_TYPE.BONUS || Math.random() < 0.16) {
                    spawnPowerup(this.x + this.w / 2, this.y + this.h / 2);
                }

                return true;
            } else {
                // Damaged armored brick
                audio.playArmoredHit();
                createSparks(ball.x, ball.y, '#ffffff', 8);
                return false;
            }
        }

        draw(ctx) {
            if (!this.isAlive) return;

            ctx.save();

            const x = this.x;
            const y = this.y;
            const w = this.w;
            const h = this.h;

            if (this.flashAnim > 0) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x, y, w, h);
                ctx.restore();
                return;
            }

            if (this.type === BRICK_TYPE.STEEL) {
                // Chrome steel brick
                const grad = ctx.createLinearGradient(x, y, x, y + h);
                grad.addColorStop(0, '#e0e0e0');
                grad.addColorStop(0.5, '#757575');
                grad.addColorStop(1, '#424242');
                ctx.fillStyle = grad;
                ctx.fillRect(x, y, w, h);

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

                // Rivets
                ctx.fillStyle = '#111';
                ctx.fillRect(x + 4, y + 4, 3, 3);
                ctx.fillRect(x + w - 7, y + 4, 3, 3);
                ctx.fillRect(x + 4, y + h - 7, 3, 3);
                ctx.fillRect(x + w - 7, y + h - 7, 3, 3);
            } else if (this.type === BRICK_TYPE.TNT) {
                // Explosive red hazard brick
                const pulse = (Math.sin(frameCount * 0.15) + 1) * 0.5;
                ctx.fillStyle = pulse > 0.5 ? '#ff1744' : '#b71c1c';
                ctx.fillRect(x, y, w, h);

                ctx.strokeStyle = '#ffea00';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, w, h);

                // Hazard stripes or TNT text
                ctx.fillStyle = '#ffea00';
                ctx.font = '8px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('TNT', x + w / 2, y + h / 2 + 1);
            } else if (this.type === BRICK_TYPE.ARMORED) {
                // Armored cyan/purple brick
                ctx.fillStyle = this.hitsLeft === 2 ? '#37474f' : '#263238';
                ctx.fillRect(x, y, w, h);

                ctx.strokeStyle = this.color.fill;
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, w, h);

                // Armor plating line
                ctx.fillStyle = this.color.fill;
                ctx.fillRect(x + 5, y + 5, w - 10, h - 10);

                if (this.hitsLeft === 1) {
                    // Crack lines
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(x + 10, y + 4);
                    ctx.lineTo(x + w / 2, y + h / 2);
                    ctx.lineTo(x + w - 8, y + h - 4);
                    ctx.stroke();
                }
            } else {
                // Normal & Bonus neon bricks
                ctx.shadowColor = this.color.glow;
                ctx.shadowBlur = 8;

                const grad = ctx.createLinearGradient(x, y, x, y + h);
                grad.addColorStop(0, this.color.border);
                grad.addColorStop(0.3, this.color.fill);
                grad.addColorStop(1, '#080816');
                ctx.fillStyle = grad;
                ctx.fillRect(x, y, w, h);

                // Glowing border
                ctx.strokeStyle = this.color.border;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

                // Gloss line
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillRect(x + 4, y + 3, w - 8, 2);

                if (this.type === BRICK_TYPE.BONUS) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '9px "Press Start 2P", monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('★', x + w / 2, y + h / 2 + 1);
                }
            }

            ctx.restore();
        }
    }

    class Laser {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.w = 4;
            this.h = 16;
            this.vy = -14;
            this.isAlive = true;
        }

        update() {
            this.y += this.vy;
            if (this.y < -20) {
                this.isAlive = false;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x - this.w / 2, this.y, this.w, this.h);
            ctx.fillStyle = '#ff007f';
            ctx.fillRect(this.x - this.w / 2 - 1, this.y - 2, this.w + 2, 4);
            ctx.restore();
        }
    }

    class PowerUp {
        constructor(x, y, typeDef) {
            this.x = x;
            this.y = y;
            this.typeDef = typeDef;
            this.w = 34;
            this.h = 18;
            this.vy = 2.4;
            this.isAlive = true;
            this.rot = 0;
        }

        update() {
            this.y += this.vy;
            this.rot += 0.05;

            // Off screen
            if (this.y > GAME_HEIGHT + 30) {
                this.isAlive = false;
                return;
            }

            // Paddle catch collision
            const halfW = paddle.curWidth / 2;
            if (this.y + this.h / 2 >= paddle.y &&
                this.y - this.h / 2 <= paddle.y + paddle.height &&
                this.x >= paddle.x - halfW &&
                this.x <= paddle.x + halfW) {

                this.isAlive = false;
                applyPowerUp(this.typeDef);
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.shadowColor = this.typeDef.color;
            ctx.shadowBlur = 12;

            const x = this.x - this.w / 2;
            const y = this.y - this.h / 2;

            // Capsule body
            ctx.fillStyle = '#100c24';
            ctx.strokeStyle = this.typeDef.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x, y, this.w, this.h, 9);
            ctx.fill();
            ctx.stroke();

            // Icon / Label
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.typeDef.icon, this.x, this.y + 1);

            ctx.restore();
        }
    }

    // --- Particle & VFX Helpers ---

    function createSparks(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1.5;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: Math.random() * 0.04 + 0.02,
                size: Math.random() * 3 + 1.5,
                color: color
            });
        }
    }

    function createShockwave(x, y, color) {
        particles.push({
            isWave: true,
            x: x,
            y: y,
            radius: 5,
            maxRadius: 60,
            life: 1.0,
            decay: 0.05,
            color: color
        });
    }

    function addFloatingText(text, x, y, color = '#ffffff') {
        floatingTexts.push({
            text: text,
            x: x,
            y: y,
            vy: -1.4,
            life: 1.0,
            color: color
        });
    }

    function detonateTNT(tntBrick) {
        audio.playExplosion();
        screenShake = 16;
        createShockwave(tntBrick.x + tntBrick.w / 2, tntBrick.y + tntBrick.h / 2, '#ff1744');
        createSparks(tntBrick.x + tntBrick.w / 2, tntBrick.y + tntBrick.h / 2, '#ffea00', 30);

        const radius = 80;
        const cx = tntBrick.x + tntBrick.w / 2;
        const cy = tntBrick.y + tntBrick.h / 2;

        bricks.forEach(b => {
            if (b.isAlive && b !== tntBrick && b.type !== BRICK_TYPE.STEEL) {
                const bx = b.x + b.w / 2;
                const by = b.y + b.h / 2;
                const dist = Math.hypot(bx - cx, by - cy);
                if (dist <= radius) {
                    b.hitsLeft = 0;
                    b.isAlive = false;
                    score += 200;
                    createSparks(bx, by, b.color.fill, 12);
                    addFloatingText('+200', bx, by, '#ffea00');
                    if (b.type === BRICK_TYPE.TNT) {
                        // Cascading detonation with slight delay
                        setTimeout(() => {
                            if (b.isAlive) detonateTNT(b);
                        }, 80);
                    }
                }
            }
        });
    }

    function spawnPowerup(x, y) {
        const types = [
            POWERUP_TYPE.MULTIBALL,
            POWERUP_TYPE.LASER,
            POWERUP_TYPE.FIREBALL,
            POWERUP_TYPE.WIDE,
            POWERUP_TYPE.SHIELD,
            POWERUP_TYPE.SLOW,
            POWERUP_TYPE.GEM,
            POWERUP_TYPE.LIFE
        ];
        const chosen = types[Math.floor(Math.random() * types.length)];
        powerups.push(new PowerUp(x, y, chosen));
    }

    function applyPowerUp(typeDef) {
        audio.playPowerup();
        addFloatingText(typeDef.label, paddle.x, paddle.y - 30, typeDef.color);

        switch (typeDef.id) {
            case 'multi':
                if (balls.length > 0) {
                    const originalBalls = [...balls];
                    originalBalls.forEach(b => {
                        const curSpeed = Math.hypot(b.vx, b.vy) || 7.5;
                        balls.push(new Ball(b.x, b.y, curSpeed * 0.7, -curSpeed * 0.7, b.isFireball));
                        balls.push(new Ball(b.x, b.y, -curSpeed * 0.7, -curSpeed * 0.7, b.isFireball));
                    });
                } else {
                    balls.push(new Ball(paddle.x, paddle.y - 15, 4, -7));
                }
                break;
            case 'laser':
                laserTimer = 60 * 12; // 12 seconds
                laserAutoFireCooldown = 0;
                break;
            case 'fire':
                fireballTimer = 60 * 10; // 10 seconds
                balls.forEach(b => b.isFireball = true);
                break;
            case 'wide':
                wideTimer = 60 * 15; // 15 seconds
                break;
            case 'shield':
                shieldTimer = 60 * 15; // 15 seconds
                break;
            case 'slow':
                slowTimer = 60 * 10; // 10 seconds
                break;
            case 'life':
                if (lives < 5) lives++;
                break;
            case 'gem':
                score += 1000;
                addFloatingText('+1000', paddle.x, paddle.y - 50, '#ffd700');
                break;
        }
    }

    // --- Level Layout Definitions ---

    const LEVELS = [
        // Level 1: Classic Neon Grid
        {
            name: "LEVEL 1: CYBER SPECTRUM",
            rows: 6,
            cols: 10,
            layout: [
                ['pink', 'pink', 'pink', 'pink', 'pink', 'pink', 'pink', 'pink', 'pink', 'pink'],
                ['purple', 'purple', 'purple', 'purple', 'purple', 'purple', 'purple', 'purple', 'purple', 'purple'],
                ['cyan', 'cyan', 'bonus', 'cyan', 'cyan', 'cyan', 'cyan', 'bonus', 'cyan', 'cyan'],
                ['lime', 'lime', 'lime', 'lime', 'lime', 'lime', 'lime', 'lime', 'lime', 'lime'],
                ['yellow', 'yellow', 'yellow', 'tnt', 'yellow', 'yellow', 'tnt', 'yellow', 'yellow', 'yellow'],
                ['orange', 'orange', 'orange', 'orange', 'orange', 'orange', 'orange', 'orange', 'orange', 'orange']
            ]
        },
        // Level 2: Space Invader Matrix
        {
            name: "LEVEL 2: ALIEN INVADER",
            rows: 8,
            cols: 10,
            layout: [
                ['none', 'none', 'cyan', 'none', 'none', 'none', 'none', 'cyan', 'none', 'none'],
                ['none', 'none', 'none', 'cyan', 'none', 'none', 'cyan', 'none', 'none', 'none'],
                ['none', 'none', 'lime', 'lime', 'lime', 'lime', 'lime', 'lime', 'none', 'none'],
                ['none', 'lime', 'lime', 'tnt', 'lime', 'lime', 'tnt', 'lime', 'lime', 'none'],
                ['lime', 'lime', 'lime', 'lime', 'lime', 'lime', 'lime', 'lime', 'lime', 'lime'],
                ['armor', 'none', 'armor', 'armor', 'bonus', 'bonus', 'armor', 'armor', 'none', 'armor'],
                ['armor', 'none', 'pink', 'none', 'none', 'none', 'none', 'pink', 'none', 'armor'],
                ['none', 'none', 'none', 'pink', 'pink', 'pink', 'pink', 'none', 'none', 'none']
            ]
        },
        // Level 3: Quantum Vault
        {
            name: "LEVEL 3: QUANTUM VAULT",
            rows: 8,
            cols: 10,
            layout: [
                ['steel', 'steel', 'steel', 'none', 'none', 'none', 'none', 'steel', 'steel', 'steel'],
                ['steel', 'armor', 'pink', 'pink', 'pink', 'pink', 'pink', 'pink', 'armor', 'steel'],
                ['steel', 'pink', 'tnt', 'cyan', 'bonus', 'bonus', 'cyan', 'tnt', 'pink', 'steel'],
                ['steel', 'pink', 'cyan', 'armor', 'armor', 'armor', 'armor', 'cyan', 'pink', 'steel'],
                ['steel', 'pink', 'cyan', 'armor', 'tnt', 'tnt', 'armor', 'cyan', 'pink', 'steel'],
                ['steel', 'pink', 'cyan', 'cyan', 'bonus', 'bonus', 'cyan', 'cyan', 'pink', 'steel'],
                ['steel', 'armor', 'pink', 'pink', 'pink', 'pink', 'pink', 'pink', 'armor', 'steel'],
                ['steel', 'steel', 'steel', 'none', 'none', 'none', 'none', 'steel', 'steel', 'steel']
            ]
        },
        // Level 4: TNT Chain Storm
        {
            name: "LEVEL 4: TNT CASCADE",
            rows: 8,
            cols: 10,
            layout: [
                ['yellow', 'tnt', 'yellow', 'tnt', 'yellow', 'yellow', 'tnt', 'yellow', 'tnt', 'yellow'],
                ['armor', 'purple', 'armor', 'purple', 'bonus', 'bonus', 'purple', 'armor', 'purple', 'armor'],
                ['cyan', 'cyan', 'moving', 'cyan', 'cyan', 'cyan', 'cyan', 'moving', 'cyan', 'cyan'],
                ['steel', 'none', 'tnt', 'none', 'armor', 'armor', 'none', 'tnt', 'none', 'steel'],
                ['steel', 'none', 'tnt', 'none', 'armor', 'armor', 'none', 'tnt', 'none', 'steel'],
                ['cyan', 'cyan', 'moving', 'cyan', 'cyan', 'cyan', 'cyan', 'moving', 'cyan', 'cyan'],
                ['armor', 'purple', 'armor', 'purple', 'bonus', 'bonus', 'purple', 'armor', 'purple', 'armor'],
                ['yellow', 'tnt', 'yellow', 'tnt', 'yellow', 'yellow', 'tnt', 'yellow', 'tnt', 'yellow']
            ]
        },
        // Level 5: Cyber Core Boss
        {
            name: "LEVEL 5: CYBER CORE MATRIX",
            rows: 9,
            cols: 10,
            layout: [
                ['steel', 'armor', 'armor', 'steel', 'bonus', 'bonus', 'steel', 'armor', 'armor', 'steel'],
                ['armor', 'pink', 'pink', 'armor', 'tnt', 'tnt', 'armor', 'pink', 'pink', 'armor'],
                ['armor', 'pink', 'moving', 'pink', 'armor', 'armor', 'pink', 'moving', 'pink', 'armor'],
                ['steel', 'armor', 'pink', 'pink', 'tnt', 'tnt', 'pink', 'pink', 'armor', 'steel'],
                ['bonus', 'cyan', 'armor', 'steel', 'armor', 'armor', 'steel', 'armor', 'cyan', 'bonus'],
                ['steel', 'armor', 'pink', 'pink', 'tnt', 'tnt', 'pink', 'pink', 'armor', 'steel'],
                ['armor', 'pink', 'moving', 'pink', 'armor', 'armor', 'pink', 'moving', 'pink', 'armor'],
                ['armor', 'pink', 'pink', 'armor', 'tnt', 'tnt', 'armor', 'pink', 'pink', 'armor'],
                ['steel', 'armor', 'armor', 'steel', 'bonus', 'bonus', 'steel', 'armor', 'armor', 'steel']
            ]
        }
    ];

    function buildLevel(lvlIdx) {
        bricks = [];
        powerups = [];
        lasers = [];
        particles = [];
        floatingTexts = [];

        // Reset buffs
        laserTimer = 0;
        wideTimer = 0;
        shieldTimer = 0;
        fireballTimer = 0;
        slowTimer = 0;

        const def = LEVELS[lvlIdx % LEVELS.length];
        const brickW = 56;
        const brickH = 22;
        const padding = 6;
        const offsetX = (GAME_WIDTH - (def.cols * (brickW + padding) - padding)) / 2;
        const offsetY = 70;

        for (let r = 0; r < def.rows; r++) {
            for (let c = 0; c < def.cols; c++) {
                const cell = def.layout[r] ? def.layout[r][c] : 'none';
                if (!cell || cell === 'none') continue;

                const bx = offsetX + c * (brickW + padding);
                const by = offsetY + r * (brickH + padding);

                let type = BRICK_TYPE.NORMAL;
                let colorKey = 'cyan';

                if (cell === 'armor') {
                    type = BRICK_TYPE.ARMORED;
                    colorKey = 'cyan';
                } else if (cell === 'tnt') {
                    type = BRICK_TYPE.TNT;
                    colorKey = 'orange';
                } else if (cell === 'steel') {
                    type = BRICK_TYPE.STEEL;
                    colorKey = 'cyan';
                } else if (cell === 'bonus') {
                    type = BRICK_TYPE.BONUS;
                    colorKey = 'yellow';
                } else if (cell === 'moving') {
                    type = BRICK_TYPE.MOVING;
                    colorKey = 'lime';
                } else if (BRICK_COLORS[cell]) {
                    colorKey = cell;
                }

                bricks.push(new Brick(bx, by, brickW, brickH, type, colorKey));
            }
        }

        // Reset paddle & ball
        paddle.x = GAME_WIDTH / 2;
        targetPaddleX = GAME_WIDTH / 2;
        balls = [];
        gameState = STATE.READY;
    }

    function checkLevelClear() {
        // Clear when all breakable bricks (non-steel) are gone
        const remainingBreakable = bricks.filter(b => b.isAlive && b.type !== BRICK_TYPE.STEEL);
        if (remainingBreakable.length === 0) {
            gameState = STATE.LEVEL_CLEAR;
            audio.playLevelClear();
            score += 2000;
            addFloatingText('+2000 LEVEL BONUS!', GAME_WIDTH / 2, GAME_HEIGHT / 2, '#39ff14');

            setTimeout(() => {
                if (gameState === STATE.LEVEL_CLEAR) {
                    levelIndex++;
                    buildLevel(levelIndex);
                }
            }, 2500);
        }
    }

    function launchBall() {
        if (gameState === STATE.READY) {
            audio.init();
            gameState = STATE.PLAYING;
            const initialAngle = (Math.random() * 0.4 - 0.2); // slight random angle
            const speed = 7.5;
            balls = [
                new Ball(
                    paddle.x,
                    paddle.y - 15,
                    speed * Math.sin(initialAngle),
                    -speed * Math.cos(initialAngle)
                )
            ];
            audio.playPaddleHit(0);
        } else if (gameState === STATE.TITLE) {
            audio.init();
            startGame();
        } else if (gameState === STATE.GAME_OVER) {
            audio.init();
            startGame();
        } else if (gameState === STATE.PLAYING) {
            if (laserTimer > 0) {
                paddle.fireLasers();
            }
        }
    }

    function loseLife() {
        audio.playLoseBall();
        lives--;

        if (lives <= 0) {
            gameState = STATE.GAME_OVER;
            audio.playGameOver();
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('neon_breakout_highscore', highScore.toString());
            }
        } else {
            // Respawn ball on paddle
            gameState = STATE.READY;
            laserTimer = 0;
            wideTimer = 0;
            fireballTimer = 0;
            slowTimer = 0;
        }
    }

    function startGame() {
        score = 0;
        lives = 3;
        levelIndex = 0;
        comboStreak = 0;
        maxCombo = 0;
        buildLevel(levelIndex);
    }

    // --- Laser & Collision Update Logic ---

    function updateLasers() {
        for (let i = lasers.length - 1; i >= 0; i--) {
            const l = lasers[i];
            l.update();
            if (!l.isAlive) {
                lasers.splice(i, 1);
                continue;
            }

            // Check collision with bricks
            for (let b of bricks) {
                if (b.isAlive &&
                    l.x >= b.x && l.x <= b.x + b.w &&
                    l.y >= b.y && l.y <= b.y + b.h) {

                    l.isAlive = false;
                    b.hit({ isFireball: false });
                    break;
                }
            }
        }
    }

    function updateBalls() {
        for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i];
            ball.update();

            // Check brick collisions
            let hitBrick = null;
            for (let b of bricks) {
                if (!b.isAlive) continue;

                // Circle vs AABB collision
                const nearestX = Math.max(b.x, Math.min(ball.x, b.x + b.w));
                const nearestY = Math.max(b.y, Math.min(ball.y, b.y + b.h));
                const dx = ball.x - nearestX;
                const dy = ball.y - nearestY;

                if ((dx * dx + dy * dy) < (ball.radius * ball.radius)) {
                    hitBrick = b;

                    // If not fireball, reflect ball velocity
                    if (!ball.isFireball || b.type === BRICK_TYPE.STEEL) {
                        const overlapX = ball.radius - Math.abs(dx);
                        const overlapY = ball.radius - Math.abs(dy);

                        if (overlapX < overlapY) {
                            ball.vx *= -1;
                            ball.x += (dx > 0 ? overlapX : -overlapX);
                        } else {
                            ball.vy *= -1;
                            ball.y += (dy > 0 ? overlapY : -overlapY);
                        }
                    }

                    b.hit(ball);
                    break; // Hit one brick per frame per ball
                }
            }

            // Bottom pit collision
            if (ball.y - ball.radius > GAME_HEIGHT) {
                balls.splice(i, 1);
            }
        }

        // Check if all balls were lost
        if (balls.length === 0 && gameState === STATE.PLAYING) {
            loseLife();
        } else {
            checkLevelClear();
        }
    }

    // --- Main Update Loop ---

    function update() {
        frameCount++;

        // Starfield
        for (let star of backgroundStars) {
            star.y += star.speed;
            if (star.y > GAME_HEIGHT) {
                star.y = 0;
                star.x = Math.random() * GAME_WIDTH;
            }
            star.brightness += Math.sin(frameCount * star.pulseSpeed) * 0.05;
        }

        // Screen Shake decay
        if (screenShake > 0) {
            screenShake *= 0.88;
            if (screenShake < 0.2) screenShake = 0;
        }

        if (isPaused) return;

        // Buff Timers
        if (laserTimer > 0) laserTimer--;
        if (wideTimer > 0) wideTimer--;
        if (shieldTimer > 0) shieldTimer--;
        if (slowTimer > 0) slowTimer--;
        if (fireballTimer > 0) {
            fireballTimer--;
            if (fireballTimer === 0) {
                balls.forEach(b => b.isFireball = false);
            }
        }

        paddle.update();

        // Bricks update (e.g. moving bricks, flash animation)
        bricks.forEach(b => b.update());

        // Laser update
        updateLasers();

        // Power-ups update
        for (let i = powerups.length - 1; i >= 0; i--) {
            const p = powerups[i];
            p.update();
            if (!p.isAlive) powerups.splice(i, 1);
        }

        // Particles update
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= p.decay;
            if (p.isWave) {
                p.radius += 3.5;
            } else {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.08; // light gravity
            }
            if (p.life <= 0) particles.splice(i, 1);
        }

        // Floating texts update
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const t = floatingTexts[i];
            t.y += t.vy;
            t.life -= 0.02;
            if (t.life <= 0) floatingTexts.splice(i, 1);
        }

        if (gameState === STATE.PLAYING) {
            updateBalls();
        }
    }

    // --- Main Render / Drawing Loop ---

    function render() {
        ctx.save();

        // Handle Screen Shake
        if (screenShake > 0) {
            const shakeX = (Math.random() * 2 - 1) * screenShake;
            const shakeY = (Math.random() * 2 - 1) * screenShake;
            ctx.translate(shakeX, shakeY);
        }

        // Clear Canvas
        ctx.fillStyle = '#060212';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw Synthwave Grid Floor
        drawRetroGrid(ctx);

        // Draw Starfield
        for (let star of backgroundStars) {
            const alpha = Math.max(0.1, Math.min(1.0, star.brightness));
            ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        }

        // Draw Shield Floor
        if (shieldTimer > 0) {
            ctx.save();
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 15;
            ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
            ctx.fillRect(0, 780, GAME_WIDTH, 8);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 780, GAME_WIDTH, 8);

            // Digital electric tick lines
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < GAME_WIDTH; i += 30) {
                const tickOffset = (frameCount * 2 + i) % GAME_WIDTH;
                ctx.fillRect(tickOffset, 781, 12, 6);
            }
            ctx.restore();
        }

        // Draw Bricks
        bricks.forEach(b => b.draw(ctx));

        // Draw Lasers
        lasers.forEach(l => l.draw(ctx));

        // Draw Power-ups
        powerups.forEach(p => p.draw(ctx));

        // Draw Paddle
        paddle.draw(ctx);

        // Draw Balls
        if (gameState === STATE.READY) {
            // Ball rested on paddle
            ctx.save();
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(paddle.x, paddle.y - 12, 7, 0, Math.PI * 2);
            ctx.fill();

            // Aim guide dotted line
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ctx.moveTo(paddle.x, paddle.y - 18);
            ctx.lineTo(paddle.x, paddle.y - 80);
            ctx.stroke();
            ctx.restore();
        } else {
            balls.forEach(b => b.draw(ctx));
        }

        // Draw Particles & Shockwaves
        for (let p of particles) {
            ctx.save();
            if (p.isWave) {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 3 * p.life;
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
            ctx.restore();
        }

        // Draw Floating Texts
        for (let t of floatingTexts) {
            ctx.save();
            ctx.globalAlpha = t.life;
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = t.color;
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }

        // Draw HUD Header
        drawHUD(ctx);

        // Overlay Screens (Title, Ready, Level Clear, Game Over)
        if (gameState === STATE.TITLE) {
            drawTitleScreen(ctx);
        } else if (gameState === STATE.READY) {
            drawReadyPrompt(ctx);
        } else if (gameState === STATE.LEVEL_CLEAR) {
            drawLevelClearScreen(ctx);
        } else if (gameState === STATE.GAME_OVER) {
            drawGameOverScreen(ctx);
        }

        // Pause Overlay
        if (isPaused) {
            drawPauseScreen(ctx);
        }

        ctx.restore();
    }

    function drawRetroGrid(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.12)';
        ctx.lineWidth = 1;

        // Horizontal perspective lines
        const horizonY = 560;
        for (let y = horizonY; y < GAME_HEIGHT; y += 22) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(GAME_WIDTH, y);
            ctx.stroke();
        }

        // Perspective converging lines
        const vanishingX = GAME_WIDTH / 2;
        for (let x = -200; x <= GAME_WIDTH + 200; x += 60) {
            ctx.beginPath();
            ctx.moveTo(vanishingX, horizonY);
            ctx.lineTo(x, GAME_HEIGHT);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawHUD(ctx) {
        ctx.save();

        // Top HUD Bar Background
        ctx.fillStyle = 'rgba(8, 4, 20, 0.85)';
        ctx.fillRect(0, 0, GAME_WIDTH, 48);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 48);
        ctx.lineTo(GAME_WIDTH, 48);
        ctx.stroke();

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Score
        ctx.fillStyle = '#ffea00';
        ctx.fillText(`SCORE: ${score}`, 16, 24);

        // High Score
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(`HI: ${highScore}`, 200, 24);

        // Level
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(`LVL ${levelIndex + 1}`, GAME_WIDTH / 2 + 50, 24);

        // Lives (Hearts)
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ff2a5f';
        let lifeStr = '';
        for (let i = 0; i < lives; i++) lifeStr += '♥ ';
        ctx.fillText(lifeStr, GAME_WIDTH - 16, 24);

        // Active Buff Indicators at bottom right
        let buffY = 70;
        if (laserTimer > 0) {
            drawBuffPill(ctx, `LASER ${Math.ceil(laserTimer / 60)}s`, '#ff007f', buffY);
            buffY += 22;
        }
        if (wideTimer > 0) {
            drawBuffPill(ctx, `WIDE ${Math.ceil(wideTimer / 60)}s`, '#39ff14', buffY);
            buffY += 22;
        }
        if (shieldTimer > 0) {
            drawBuffPill(ctx, `SHIELD ${Math.ceil(shieldTimer / 60)}s`, '#00f0ff', buffY);
            buffY += 22;
        }
        if (fireballTimer > 0) {
            drawBuffPill(ctx, `FIRE ${Math.ceil(fireballTimer / 60)}s`, '#ffea00', buffY);
            buffY += 22;
        }
        if (slowTimer > 0) {
            drawBuffPill(ctx, `SLOW ${Math.ceil(slowTimer / 60)}s`, '#b026ff', buffY);
            buffY += 22;
        }

        ctx.restore();
    }

    function drawBuffPill(ctx, text, color, y) {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 4, 24, 0.8)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(GAME_WIDTH - 130, y, 114, 18, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, GAME_WIDTH - 73, y + 10);
        ctx.restore();
    }

    function drawTitleScreen(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(4, 2, 12, 0.88)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const cx = GAME_WIDTH / 2;

        // Big Title
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#00f0ff';
        ctx.font = '28px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NEON BREAKOUT', cx, 220);

        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ff007f';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText('CYBER ARKANOID EVOLUTION', cx, 260);

        // Demo Brick Icon cluster
        const demoBricks = ['cyan', 'pink', 'lime', 'yellow', 'purple'];
        const bW = 44;
        const bH = 16;
        const startX = cx - (demoBricks.length * (bW + 4)) / 2;
        demoBricks.forEach((col, idx) => {
            ctx.fillStyle = BRICK_COLORS[col].fill;
            ctx.fillRect(startX + idx * (bW + 4), 310, bW, bH);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(startX + idx * (bW + 4), 310, bW, bH);
        });

        // Pulsing Start Prompt
        const pulse = (Math.sin(frameCount * 0.08) + 1) * 0.5;
        ctx.shadowBlur = 0;
        ctx.fillStyle = pulse > 0.3 ? '#ffea00' : 'rgba(255, 234, 0, 0.4)';
        ctx.font = '13px "Press Start 2P", monospace';
        ctx.fillText('CLICK / TAP / SPACE TO START', cx, 420);

        // Power-Up Legend
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('⚡ MULTI-BALL   🔫 LASER CANNONS', cx, 490);
        ctx.fillText('🔥 FIREBALL     ↔️ WIDE PADDLE', cx, 520);
        ctx.fillText('🛡️ ENERGY SHIELD ⏱️ SLOW MOTION', cx, 550);
        ctx.fillText('💣 TNT BRICKS DESTROY SURROUNDING BRICKS', cx, 580);

        // Controls info
        ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
        ctx.fillText('MOUSE / TOUCH DRAG OR [A]/[D] / ARROWS', cx, 660);

        ctx.restore();
    }

    function drawReadyPrompt(ctx) {
        ctx.save();
        const pulse = (Math.sin(frameCount * 0.1) + 1) * 0.5;
        ctx.fillStyle = pulse > 0.3 ? '#ffea00' : 'rgba(255, 234, 0, 0.4)';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CLICK / TAP / SPACE TO LAUNCH BALL', GAME_WIDTH / 2, 690);

        // Current level name banner
        const def = LEVELS[levelIndex % LEVELS.length];
        ctx.fillStyle = '#00f0ff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText(def.name, GAME_WIDTH / 2, 380);

        ctx.restore();
    }

    function drawLevelClearScreen(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(4, 2, 14, 0.75)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const cx = GAME_WIDTH / 2;
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#39ff14';
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL CLEARED!', cx, 360);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffea00';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText('+2000 CLEAR BONUS', cx, 410);

        ctx.fillStyle = '#00f0ff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('PREPARING NEXT SECTOR...', cx, 460);

        ctx.restore();
    }

    function drawGameOverScreen(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(4, 2, 14, 0.9)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const cx = GAME_WIDTH / 2;
        ctx.shadowColor = '#ff2a5f';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#ff2a5f';
        ctx.font = '26px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM OVERLOAD', cx, 280);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText(`FINAL SCORE: ${score}`, cx, 340);

        ctx.fillStyle = '#ffea00';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText(`MAX COMBO: x${maxCombo}`, cx, 380);

        ctx.fillStyle = '#00f0ff';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText(`HIGH SCORE: ${highScore}`, cx, 420);

        const pulse = (Math.sin(frameCount * 0.08) + 1) * 0.5;
        ctx.fillStyle = pulse > 0.3 ? '#ffea00' : 'rgba(255, 234, 0, 0.3)';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText('CLICK / TAP / SPACE TO RESTART', cx, 520);

        ctx.restore();
    }

    function drawPauseScreen(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(4, 2, 14, 0.85)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#00f0ff';
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('PRESS [P] OR PAUSE BUTTON TO RESUME', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);

        ctx.restore();
    }

    // --- Input & Event Handling ---

    function getCanvasPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const scaleX = GAME_WIDTH / rect.width;
        const scaleY = GAME_HEIGHT / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    // Mouse events
    canvas.addEventListener('mousemove', e => {
        const pos = getCanvasPos(e);
        targetPaddleX = pos.x;
    });

    canvas.addEventListener('mousedown', e => {
        const pos = getCanvasPos(e);
        targetPaddleX = pos.x;
        launchBall();
    });

    // Touch events
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        touchDragging = true;
        const pos = getCanvasPos(e);
        targetPaddleX = pos.x;
        launchBall();
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
        if (!touchDragging) return;
        e.preventDefault();
        const pos = getCanvasPos(e);
        targetPaddleX = pos.x;
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
        touchDragging = false;
    });

    // Keyboard controls
    window.addEventListener('keydown', e => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            keys.left = true;
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            keys.right = true;
        } else if (e.code === 'Space') {
            e.preventDefault();
            launchBall();
        } else if (e.code === 'KeyP') {
            togglePause();
        }
    });

    window.addEventListener('keyup', e => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            keys.left = false;
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            keys.right = false;
        }
    });

    // Mobile Action Bar buttons
    const btnTouchLeft = document.getElementById('btn-touch-left');
    const btnTouchRight = document.getElementById('btn-touch-right');
    const btnTouchLaunch = document.getElementById('btn-touch-launch');

    if (btnTouchLeft) {
        btnTouchLeft.addEventListener('touchstart', e => { e.preventDefault(); keys.left = true; });
        btnTouchLeft.addEventListener('touchend', e => { e.preventDefault(); keys.left = false; });
        btnTouchLeft.addEventListener('mousedown', () => { keys.left = true; });
        btnTouchLeft.addEventListener('mouseup', () => { keys.left = false; });
    }

    if (btnTouchRight) {
        btnTouchRight.addEventListener('touchstart', e => { e.preventDefault(); keys.right = true; });
        btnTouchRight.addEventListener('touchend', e => { e.preventDefault(); keys.right = false; });
        btnTouchRight.addEventListener('mousedown', () => { keys.right = true; });
        btnTouchRight.addEventListener('mouseup', () => { keys.right = false; });
    }

    if (btnTouchLaunch) {
        btnTouchLaunch.addEventListener('click', e => {
            e.preventDefault();
            launchBall();
        });
    }

    // Top HUD buttons
    const btnSound = document.getElementById('btn-sound');
    const btnPause = document.getElementById('btn-pause');
    const btnRestart = document.getElementById('btn-restart');

    function updateSoundBtn() {
        if (btnSound) {
            btnSound.textContent = audio.muted ? '🔇 MUTED' : '🔊 SOUND';
        }
    }

    if (btnSound) {
        updateSoundBtn();
        btnSound.addEventListener('click', () => {
            audio.init();
            audio.muted = !audio.muted;
            localStorage.setItem('neon_breakout_muted', audio.muted.toString());
            updateSoundBtn();
        });
    }

    function togglePause() {
        if (gameState === STATE.PLAYING || gameState === STATE.READY) {
            isPaused = !isPaused;
            if (btnPause) {
                btnPause.textContent = isPaused ? '▶ RESUME' : '⏸ PAUSE';
            }
        }
    }

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            togglePause();
        });
    }

    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            audio.init();
            isPaused = false;
            if (btnPause) btnPause.textContent = '⏸ PAUSE';
            startGame();
        });
    }

    // --- Init & Game Loop ---
    paddle = new Paddle();
    buildLevel(0);
    gameState = STATE.TITLE; // Start at Title

    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);

})();

