/* ==========================================================================
   HYPER WAVE — Neon Synthwave Vector Arcade Space Shooter
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // ============================
    // CONSTANTS & GAME SETTINGS
    // ============================
    const CANVAS_W = 600;
    const CANVAS_H = 780;

    const STATE = {
        START: 'START',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        GAME_OVER: 'GAME_OVER'
    };

    // Neon Cyber Palette
    const PALETTE = {
        cyan: '#00f0ff',
        pink: '#ff007f',
        yellow: '#ffea00',
        purple: '#b388ff',
        green: '#00e676',
        orange: '#ff9100',
        white: '#ffffff',
        darkBg: '#080514'
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
                case 'laser': {
                    // Synth laser pew
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(880 + arg * 60, t);
                    osc.frequency.exponentialRampToValueAtTime(140, t + 0.09);
                    gain.gain.setValueAtTime(0.08, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.1);
                    break;
                }
                case 'missile': {
                    // Rocket thrust whistle
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(240, t);
                    osc.frequency.linearRampToValueAtTime(780, t + 0.15);
                    gain.gain.setValueAtTime(0.09, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.17);
                    break;
                }
                case 'boom': {
                    // Punchy filtered synth explosion
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(180, t);
                    osc.frequency.exponentialRampToValueAtTime(30, t + 0.22);
                    gain.gain.setValueAtTime(0.2, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.23);
                    break;
                }
                case 'hyper_wave': {
                    // Sub-bass EMP blast dive + sweep
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(320, t);
                    osc.frequency.exponentialRampToValueAtTime(35, t + 0.7);
                    gain.gain.setValueAtTime(0.4, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.76);
                    break;
                }
                case 'powerup': {
                    // Ascending crystal arpeggio
                    const notes = [523.25, 659.25, 783.99, 1046.50];
                    notes.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(f, t + i * 0.05);
                        gain.gain.setValueAtTime(0.12, t + i * 0.05);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.2);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.05);
                        osc.stop(t + i * 0.05 + 0.22);
                    });
                    break;
                }
                case 'shield_hit': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(600, t);
                    osc.frequency.linearRampToValueAtTime(300, t + 0.15);
                    gain.gain.setValueAtTime(0.18, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.16);
                    break;
                }
                case 'boss_alarm': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(220, t);
                    osc.frequency.setValueAtTime(440, t + 0.15);
                    gain.gain.setValueAtTime(0.2, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.32);
                    break;
                }
            }
        }
    };


    // ============================
    // VISUAL PARTICLES & SHOCKWAVES
    // ============================
    class Particle {
        constructor(x, y, vx, vy, size, color, life = 1) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.size = size;
            this.color = color;
            this.life = life;
            this.maxLife = life;
            this.alpha = 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= 0.025;
            this.alpha = Math.max(0, this.life / this.maxLife);
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 6;
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    class Shockwave {
        constructor(x, y, color = PALETTE.cyan) {
            this.x = x;
            this.y = y;
            this.radius = 10;
            this.maxRadius = 850;
            this.color = color;
            this.speed = 22;
            this.alpha = 1;
            this.done = false;
        }

        update() {
            this.radius += this.speed;
            this.alpha = Math.max(0, 1 - (this.radius / this.maxRadius));
            if (this.radius >= this.maxRadius) {
                this.done = true;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 6;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Inner bright ring
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(0, this.radius - 4), 0, Math.PI * 2);
            ctx.stroke();
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
            this.vy = -1.6;
        }

        update() {
            this.y += this.vy;
            this.life -= 0.022;
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
    // PROJECTILES & POWERUPS
    // ============================
    class Bullet {
        constructor(x, y, vx, vy, isEnemy = false, color = PALETTE.cyan, damage = 1) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.isEnemy = isEnemy;
            this.color = color;
            this.damage = damage;
            this.radius = isEnemy ? 4.5 : 3.5;
            this.dead = false;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.y < -30 || this.y > CANVAS_H + 30 || this.x < -30 || this.x > CANVAS_W + 30) {
                this.dead = true;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;

            if (this.isEnemy) {
                // Enemy Plasma Orb
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 0.45, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Player Neon Laser Bolt
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + 7);
                ctx.lineTo(this.x, this.y - 7);
                ctx.stroke();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + 4);
                ctx.lineTo(this.x, this.y - 4);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    class Missile {
        constructor(x, y, target) {
            this.x = x;
            this.y = y;
            this.target = target;
            this.speed = 7.5;
            this.angle = -Math.PI / 2;
            this.turnSpeed = 0.12;
            this.damage = 3;
            this.dead = false;
            this.life = 180; // frames
        }

        update(enemies) {
            this.life--;
            if (this.life <= 0 || this.y < -40 || this.y > CANVAS_H + 40 || this.x < -40 || this.x > CANVAS_W + 40) {
                this.dead = true;
                return;
            }

            // Find closest active enemy if current target died
            if (!this.target || this.target.dead) {
                let closest = null;
                let minDist = 9999;
                enemies.forEach(e => {
                    const d = Math.hypot(e.x - this.x, e.y - this.y);
                    if (d < minDist) {
                        minDist = d;
                        closest = e;
                    }
                });
                this.target = closest;
            }

            if (this.target) {
                const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                let diff = targetAngle - this.angle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                this.angle += Math.max(-this.turnSpeed, Math.min(this.turnSpeed, diff));
            }

            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            ctx.shadowColor = PALETTE.orange;
            ctx.shadowBlur = 8;
            ctx.fillStyle = PALETTE.yellow;
            ctx.fillRect(-6, -2.5, 12, 5);

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(2, -1.5, 5, 3);
            ctx.restore();
        }
    }

    class PowerUp {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type; // 'W' (Weapon), 'M' (Missiles), 'S' (Shield), 'B' (Bomb), 'GEM' (Score)
            this.vy = 1.6;
            this.vx = (Math.random() - 0.5) * 1.2;
            this.size = 22;
            this.angle = 0;
            this.dead = false;

            const config = {
                W: { color: PALETTE.cyan, label: 'W' },
                M: { color: PALETTE.orange, label: 'M' },
                S: { color: PALETTE.green, label: 'S' },
                B: { color: PALETTE.yellow, label: 'B' },
                GEM: { color: PALETTE.pink, label: '★' }
            };
            this.cfg = config[type] || config.W;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.angle += 0.04;
            if (this.y > CANVAS_H + 40) {
                this.dead = true;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            // Glowing diamond container
            ctx.shadowColor = this.cfg.color;
            ctx.shadowBlur = 12;
            ctx.fillStyle = 'rgba(8, 5, 20, 0.85)';
            ctx.strokeStyle = this.cfg.color;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(0, -this.size / 2);
            ctx.lineTo(this.size / 2, 0);
            ctx.lineTo(0, this.size / 2);
            ctx.lineTo(-this.size / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Label
            ctx.rotate(-this.angle);
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.cfg.label, 0, 1);
            ctx.restore();
        }
    }


    // ============================
    // PLAYER STARSHIP
    // ============================
    class Player {
        constructor() {
            this.x = CANVAS_W / 2;
            this.y = CANVAS_H - 85;
            this.targetX = this.x;
            this.speed = 8.5;
            this.radius = 16;

            // Combat Stats
            this.lives = 3;
            this.shields = 3; // 0..3 hits
            this.maxShields = 3;
            this.bombs = 2; // Hyper Wave Bombs
            this.weaponLevel = 1; // 1: Dual, 2: Triple, 3: Penta
            this.hasMissiles = false;
            this.missileTimer = 0;
            this.dronesCount = 0; // 0..2
            this.shootTimer = 0;
            this.shootInterval = 110; // ms

            // FX
            this.invincibleTimer = 0;
            this.droneAngle = 0;
        }

        update(dt, inputLeft, inputRight, targetPointerX) {
            if (this.invincibleTimer > 0) this.invincibleTimer -= dt;

            // Movement: Mouse/Touch drag or Keyboard
            if (targetPointerX !== null) {
                const dx = targetPointerX - this.x;
                if (Math.abs(dx) > 2) {
                    this.x += Math.sign(dx) * Math.min(Math.abs(dx), this.speed * 1.5);
                }
            } else {
                if (inputLeft) this.x -= this.speed;
                if (inputRight) this.x += this.speed;
            }

            // Clamp bounds
            this.x = Math.max(35, Math.min(CANVAS_W - 35, this.x));

            // Orbit Drones
            this.droneAngle += 0.06;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Invincibility flashing
            if (this.invincibleTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
                ctx.restore();
                return;
            }

            // Thruster fire plume
            const flameLen = Math.random() * 12 + 14;
            ctx.shadowColor = PALETTE.cyan;
            ctx.shadowBlur = 10;
            ctx.fillStyle = PALETTE.cyan;
            ctx.beginPath();
            ctx.moveTo(-6, 12);
            ctx.lineTo(0, 12 + flameLen);
            ctx.lineTo(6, 12);
            ctx.closePath();
            ctx.fill();

            // Ship Neon Cyber Chassis
            ctx.strokeStyle = PALETTE.cyan;
            ctx.lineWidth = 2.5;
            ctx.fillStyle = '#0e122b';

            ctx.beginPath();
            ctx.moveTo(0, -18);         // Nose
            ctx.lineTo(16, 12);          // Right wingtip
            ctx.lineTo(8, 8);            // Inner wing
            ctx.lineTo(0, 14);           // Tail
            ctx.lineTo(-8, 8);           // Inner left wing
            ctx.lineTo(-16, 12);         // Left wingtip
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Cockpit canopy
            ctx.fillStyle = PALETTE.yellow;
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(4, 2);
            ctx.lineTo(-4, 2);
            ctx.closePath();
            ctx.fill();

            // Energy Shield Bubble
            if (this.shields > 0) {
                const pulse = Math.sin(Date.now() * 0.008) * 2 + 1;
                ctx.strokeStyle = PALETTE.green;
                ctx.lineWidth = 2;
                ctx.shadowColor = PALETTE.green;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 12 + pulse, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Orbital Wingman Drones
            for (let i = 0; i < this.dronesCount; i++) {
                const angle = this.droneAngle + (i * Math.PI);
                const dx = Math.cos(angle) * 36;
                const dy = Math.sin(angle) * 16;

                ctx.save();
                ctx.translate(dx, dy);
                ctx.shadowColor = PALETTE.yellow;
                ctx.shadowBlur = 8;
                ctx.strokeStyle = PALETTE.yellow;
                ctx.lineWidth = 2;
                ctx.fillStyle = '#111';
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }

            ctx.restore();
        }
    }


    // ============================
    // ENEMIES & HYPER CORE BOSS
    // ============================
    class Enemy {
        constructor(type, x, y, wave) {
            this.type = type; // 'SWARMER', 'SPINNER', 'DREADNOUGHT', 'INTERCEPTOR', 'BOSS'
            this.x = x;
            this.y = y;
            this.baseX = x;
            this.wave = wave;
            this.angle = 0;
            this.shootTimer = Math.random() * 1200 + 800;
            this.dead = false;

            switch (type) {
                case 'SWARMER':
                    this.hp = 1;
                    this.points = 100;
                    this.radius = 14;
                    this.vy = 2.2 + wave * 0.15;
                    this.color = PALETTE.pink;
                    this.sineOffset = Math.random() * Math.PI * 2;
                    break;
                case 'SPINNER':
                    this.hp = 3;
                    this.points = 250;
                    this.radius = 18;
                    this.vy = 1.7 + wave * 0.12;
                    this.color = PALETTE.yellow;
                    this.rotSpeed = 0.08;
                    break;
                case 'DREADNOUGHT':
                    this.hp = 8;
                    this.points = 500;
                    this.radius = 24;
                    this.vy = 0.9 + wave * 0.08;
                    this.color = PALETTE.purple;
                    break;
                case 'INTERCEPTOR':
                    this.hp = 2;
                    this.points = 350;
                    this.radius = 16;
                    this.vy = 3.6 + wave * 0.15;
                    this.color = PALETTE.orange;
                    break;
                case 'BOSS':
                    this.hp = 220 + wave * 30;
                    this.maxHp = this.hp;
                    this.points = 5000;
                    this.radius = 55;
                    this.vy = 0.5;
                    this.color = PALETTE.pink;
                    this.phaseTimer = 0;
                    this.phase = 1;
                    break;
            }
        }

        update(dt, playerX, bullets) {
            this.shootTimer -= dt;

            if (this.type === 'SWARMER') {
                this.y += this.vy;
                this.x = this.baseX + Math.sin(this.y * 0.02 + this.sineOffset) * 45;
                if (this.shootTimer <= 0) {
                    this.shootTimer = 1800;
                    bullets.push(new Bullet(this.x, this.y + 10, 0, 4.5, true, this.color));
                }
            } else if (this.type === 'SPINNER') {
                this.y += this.vy;
                this.angle += this.rotSpeed;
                if (this.shootTimer <= 0) {
                    this.shootTimer = 2200;
                    // Twin spread fire
                    bullets.push(new Bullet(this.x - 8, this.y + 12, -1.2, 4.2, true, this.color));
                    bullets.push(new Bullet(this.x + 8, this.y + 12, 1.2, 4.2, true, this.color));
                }
            } else if (this.type === 'DREADNOUGHT') {
                this.y += this.vy;
                if (this.y > 220) this.vy = 0.2; // Hover in upper zone
                if (this.shootTimer <= 0) {
                    this.shootTimer = 1600;
                    // Triple heavy burst
                    bullets.push(new Bullet(this.x, this.y + 18, 0, 5, true, this.color, 1));
                    bullets.push(new Bullet(this.x - 12, this.y + 16, -1.8, 4.5, true, this.color, 1));
                    bullets.push(new Bullet(this.x + 12, this.y + 16, 1.8, 4.5, true, this.color, 1));
                }
            } else if (this.type === 'INTERCEPTOR') {
                this.y += this.vy;
                // Steer slightly towards player
                const dx = playerX - this.x;
                this.x += Math.sign(dx) * 1.8;
                if (this.shootTimer <= 0) {
                    this.shootTimer = 1400;
                    bullets.push(new Bullet(this.x, this.y + 12, 0, 5.5, true, this.color));
                }
            } else if (this.type === 'BOSS') {
                this.angle += 0.025;
                this.phaseTimer += dt;

                // Boss movement pattern: descends to y = 160 and sways left-right
                if (this.y < 160) {
                    this.y += 0.8;
                } else {
                    this.x = CANVAS_W / 2 + Math.sin(Date.now() * 0.0012) * 140;
                }

                // Multi-phase attack patterns
                if (this.shootTimer <= 0) {
                    this.shootTimer = 900;
                    const spreadCount = 6;
                    for (let i = 0; i < spreadCount; i++) {
                        const theta = this.angle + (i * (Math.PI * 2 / spreadCount));
                        bullets.push(new Bullet(
                            this.x + Math.cos(theta) * 35,
                            this.y + Math.sin(theta) * 35,
                            Math.cos(theta) * 3.8,
                            Math.sin(theta) * 3.8,
                            true,
                            PALETTE.pink
                        ));
                    }
                }
            }

            if (this.y > CANVAS_H + 40 && this.type !== 'BOSS') {
                // Wrap around from top so wave enemies can always be fought
                this.y = -40;
                this.x = Math.random() * (CANVAS_W - 120) + 60;
                this.baseX = this.x;
            } else if (this.y > CANVAS_H + 100) {
                this.dead = true;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            ctx.shadowColor = this.color;
            ctx.shadowBlur = 12;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2.5;
            ctx.fillStyle = '#0f081d';

            if (this.type === 'SWARMER') {
                // Neon Delta Drone
                ctx.beginPath();
                ctx.moveTo(0, 14);
                ctx.lineTo(12, -12);
                ctx.lineTo(0, -6);
                ctx.lineTo(-12, -12);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (this.type === 'SPINNER') {
                // Rotating Diamond
                ctx.beginPath();
                ctx.moveTo(0, -16);
                ctx.lineTo(16, 0);
                ctx.lineTo(0, 16);
                ctx.lineTo(-16, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.stroke();
            } else if (this.type === 'DREADNOUGHT') {
                // Heavy Hex Walker
                const r = this.radius;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (i * Math.PI) / 3;
                    const px = Math.cos(a) * r;
                    const py = Math.sin(a) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Core eye
                ctx.fillStyle = PALETTE.pink;
                ctx.beginPath();
                ctx.arc(0, 0, 7, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'INTERCEPTOR') {
                // Swept Arrowhead
                ctx.beginPath();
                ctx.moveTo(0, 16);
                ctx.lineTo(14, -14);
                ctx.lineTo(0, -8);
                ctx.lineTo(-14, -14);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (this.type === 'BOSS') {
                // THE HYPER CORE — Giant Polyhedron with glowing core
                const r = this.radius;

                // Outer wireframe dodecagram
                ctx.beginPath();
                for (let i = 0; i < 12; i++) {
                    const a = (i * Math.PI) / 6;
                    const rad = (i % 2 === 0) ? r : r * 0.72;
                    const px = Math.cos(a) * rad;
                    const py = Math.sin(a) * rad;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Inner rotating star
                ctx.strokeStyle = PALETTE.cyan;
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const a = -this.angle * 2 + (i * Math.PI) / 4;
                    const rad = (i % 2 === 0) ? r * 0.45 : r * 0.2;
                    const px = Math.cos(a) * rad;
                    const py = Math.sin(a) * rad;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();

                // Blazing central energy core
                ctx.fillStyle = PALETTE.yellow;
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();

            // Boss Health Bar (Top Screen)
            if (this.type === 'BOSS') {
                this._drawBossHealthBar(ctx);
            }
        }

        _drawBossHealthBar(ctx) {
            const barW = 360;
            const barH = 14;
            const barX = (CANVAS_W - barW) / 2;
            const barY = 55;
            const pct = Math.max(0, this.hp / this.maxHp);

            ctx.save();
            ctx.fillStyle = 'rgba(8, 5, 20, 0.85)';
            ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

            ctx.strokeStyle = PALETTE.pink;
            ctx.lineWidth = 2;
            ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

            ctx.fillStyle = PALETTE.pink;
            ctx.shadowColor = PALETTE.pink;
            ctx.shadowBlur = 10;
            ctx.fillRect(barX, barY, barW * pct, barH);

            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ HYPER CORE BOSS ⚡', CANVAS_W / 2, barY - 8);
            ctx.restore();
        }
    }


    // ============================
    // MAIN GAME CONTROLLER
    // ============================
    class HyperWaveGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;

            this.W = CANVAS_W;
            this.H = CANVAS_H;

            // Game State
            this.state = STATE.START;
            this.score = 0;
            this.highScore = parseInt(localStorage.getItem('hyper_wave_high') || '0', 10);
            this.wave = 1;
            this.waveTotalEnemies = 0;
            this.waveKills = 0;
            this.waveInProgress = false;
            this.waveTransitionTimer = 0;
            this.waveTitle = '';

            // Entities
            this.player = new Player();
            this.enemies = [];
            this.playerBullets = [];
            this.enemyBullets = [];
            this.missiles = [];
            this.powerUps = [];
            this.particles = [];
            this.shockwaves = [];
            this.floatingTexts = [];

            // Background Perspective Grid
            this.gridOffset = 0;
            this.stars = [];
            for (let i = 0; i < 65; i++) {
                this.stars.push({
                    x: Math.random() * this.W,
                    y: Math.random() * (this.H * 0.6),
                    size: Math.random() * 2 + 1,
                    alpha: Math.random() * 0.7 + 0.3
                });
            }

            // Input Handling
            this.keys = {};
            this.pointerX = null;
            this.isPointerDown = false;
            this.screenShake = 0;

            this._initCanvas();
            this._initDOM();
            this._initInputs();
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
            const btnPause = document.getElementById('btn-pause');
            const btnBomb = document.getElementById('btn-bomb');
            const btnLeft = document.getElementById('btn-left');
            const btnRight = document.getElementById('btn-right');

            if (btnSound) {
                btnSound.addEventListener('click', () => {
                    const on = Sound.toggle();
                    btnSound.textContent = on ? '🔊 SOUND' : '🔇 MUTED';
                });
            }

            if (btnPause) {
                btnPause.addEventListener('click', () => {
                    if (this.state === STATE.PLAYING) {
                        this.state = STATE.PAUSED;
                        btnPause.textContent = '▶ RESUME';
                    } else if (this.state === STATE.PAUSED) {
                        this.state = STATE.PLAYING;
                        btnPause.textContent = '⏸ PAUSE';
                    }
                });
            }

            if (btnBomb) {
                btnBomb.addEventListener('click', () => {
                    this.triggerHyperWave();
                });
            }

            // Mobile on-screen buttons
            if (btnLeft && btnRight) {
                const addHoldListener = (el, key) => {
                    el.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; });
                    el.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; });
                    el.addEventListener('mousedown', () => { this.keys[key] = true; });
                    el.addEventListener('mouseup', () => { this.keys[key] = false; });
                };
                addHoldListener(btnLeft, 'ArrowLeft');
                addHoldListener(btnRight, 'ArrowRight');
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

            window.addEventListener('keydown', (e) => {
                this.keys[e.code] = true;
                Sound.init();

                if (e.code === 'Space' || e.code === 'Enter') {
                    if (this.state === STATE.START || this.state === STATE.GAME_OVER) {
                        this.startNewGame();
                    }
                } else if (e.code === 'KeyB' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                    this.triggerHyperWave();
                }
            });

            window.addEventListener('keyup', (e) => {
                this.keys[e.code] = false;
            });

            // Pointer / Touch
            this.canvas.addEventListener('mousedown', (e) => {
                Sound.init();
                this.isPointerDown = true;
                const pos = getCanvasPos(e.clientX, e.clientY);
                if (this.state === STATE.START || this.state === STATE.GAME_OVER) {
                    this.startNewGame();
                } else {
                    this.pointerX = pos.x;
                }
            });

            window.addEventListener('mousemove', (e) => {
                if (this.isPointerDown && this.state === STATE.PLAYING) {
                    const pos = getCanvasPos(e.clientX, e.clientY);
                    this.pointerX = pos.x;
                }
            });

            window.addEventListener('mouseup', () => {
                this.isPointerDown = false;
                this.pointerX = null;
            });

            // Touch
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                Sound.init();
                this.isPointerDown = true;
                const pos = getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
                if (this.state === STATE.START || this.state === STATE.GAME_OVER) {
                    this.startNewGame();
                } else {
                    this.pointerX = pos.x;
                }
            }, { passive: false });

            window.addEventListener('touchmove', (e) => {
                if (!this.isPointerDown || this.state !== STATE.PLAYING) return;
                e.preventDefault();
                const pos = getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
                this.pointerX = pos.x;
            }, { passive: false });

            window.addEventListener('touchend', () => {
                this.isPointerDown = false;
                this.pointerX = null;
            });
        }

        startNewGame() {
            this.state = STATE.PLAYING;
            this.score = 0;
            this.wave = 1;
            this.player = new Player();
            this.enemies = [];
            this.playerBullets = [];
            this.enemyBullets = [];
            this.missiles = [];
            this.powerUps = [];
            this.particles = [];
            this.shockwaves = [];
            this.floatingTexts = [];
            this._startWave(1);
        }

        _startWave(waveNum) {
            this.wave = waveNum;
            this.waveKills = 0;
            this.waveInProgress = true;
            this.waveTransitionTimer = 2200; // ms display

            if (waveNum % 5 === 0) {
                // Boss Wave!
                this.waveTitle = `WAVE ${waveNum}: BOSS BATTLE!`;
                Sound.play('boss_alarm');
                setTimeout(() => {
                    this.enemies.push(new Enemy('BOSS', CANVAS_W / 2, -60, waveNum));
                    this.waveTotalEnemies = 1;
                }, 1000);
            } else {
                this.waveTitle = `WAVE ${waveNum}`;
                Sound.play('powerup');
                this._spawnWaveEnemies(waveNum);
            }
        }

        _spawnWaveEnemies(wave) {
            const count = 10 + wave * 3;
            this.waveTotalEnemies = count;

            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    if (this.state !== STATE.PLAYING) return;
                    const x = Math.random() * (CANVAS_W - 120) + 60;
                    const y = -30 - (i * 25);

                    let type = 'SWARMER';
                    const roll = Math.random();
                    if (wave >= 2 && roll < 0.35) type = 'SPINNER';
                    if (wave >= 3 && roll > 0.7) type = 'DREADNOUGHT';
                    if (wave >= 4 && roll > 0.85) type = 'INTERCEPTOR';

                    this.enemies.push(new Enemy(type, x, y, wave));
                }, i * 320);
            }
        }

        triggerHyperWave() {
            if (this.state !== STATE.PLAYING) return;
            if (this.player.bombs <= 0) return;

            this.player.bombs--;
            Sound.play('hyper_wave');
            this.screenShake = 18;

            // Expand Shockwave
            this.shockwaves.push(new Shockwave(this.player.x, this.player.y));

            // Clear all enemy bullets
            this.enemyBullets.forEach(b => {
                for (let i = 0; i < 4; i++) {
                    this.particles.push(new Particle(b.x, b.y, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, 3, PALETTE.cyan));
                }
            });
            this.enemyBullets = [];

            // Deal heavy EMP damage to all enemies
            this.enemies.forEach(e => {
                e.hp -= 25;
                for (let i = 0; i < 8; i++) {
                    this.particles.push(new Particle(e.x, e.y, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 4, PALETTE.cyan));
                }
            });

            this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 45, '⚡ HYPER WAVE EMP ⚡', PALETTE.yellow, 13));
        }

        _fireWeapons() {
            const p = this.player;
            Sound.play('laser');

            if (p.weaponLevel === 1) {
                // Dual Lasers
                this.playerBullets.push(new Bullet(p.x - 7, p.y - 14, 0, -14, false, PALETTE.cyan));
                this.playerBullets.push(new Bullet(p.x + 7, p.y - 14, 0, -14, false, PALETTE.cyan));
            } else if (p.weaponLevel === 2) {
                // Triple Spread
                this.playerBullets.push(new Bullet(p.x, p.y - 16, 0, -14, false, PALETTE.cyan));
                this.playerBullets.push(new Bullet(p.x - 9, p.y - 12, -2.4, -13.5, false, PALETTE.cyan));
                this.playerBullets.push(new Bullet(p.x + 9, p.y - 12, 2.4, -13.5, false, PALETTE.cyan));
            } else {
                // Penta Spread
                this.playerBullets.push(new Bullet(p.x, p.y - 16, 0, -15, false, PALETTE.cyan));
                this.playerBullets.push(new Bullet(p.x - 8, p.y - 14, -2.2, -14, false, PALETTE.cyan));
                this.playerBullets.push(new Bullet(p.x + 8, p.y - 14, 2.2, -14, false, PALETTE.cyan));
                this.playerBullets.push(new Bullet(p.x - 14, p.y - 10, -4.4, -13, false, PALETTE.cyan));
                this.playerBullets.push(new Bullet(p.x + 14, p.y - 10, 4.4, -13, false, PALETTE.cyan));
            }

            // Drones helper fire
            for (let i = 0; i < p.dronesCount; i++) {
                const angle = p.droneAngle + (i * Math.PI);
                const dx = Math.cos(angle) * 36;
                const dy = Math.sin(angle) * 16;
                this.playerBullets.push(new Bullet(p.x + dx, p.y + dy - 6, 0, -13, false, PALETTE.yellow));
            }
        }

        _playerTakeHit() {
            const p = this.player;
            if (p.invincibleTimer > 0) return;

            if (p.shields > 0) {
                p.shields--;
                p.invincibleTimer = 800; // ms
                this.screenShake = 8;
                Sound.play('shield_hit');
                this.floatingTexts.push(new FloatingText(p.x, p.y - 20, 'SHIELD HIT!', PALETTE.green, 11));
            } else {
                p.lives--;
                p.invincibleTimer = 1800;
                this.screenShake = 16;
                Sound.play('boom');

                // Explosion particles
                for (let i = 0; i < 35; i++) {
                    const spd = Math.random() * 8 + 2;
                    const a = Math.random() * Math.PI * 2;
                    this.particles.push(new Particle(p.x, p.y, Math.cos(a) * spd, Math.sin(a) * spd, Math.random() * 5 + 3, PALETTE.cyan));
                }

                if (p.lives <= 0) {
                    this._gameOver();
                } else {
                    this.floatingTexts.push(new FloatingText(p.x, p.y - 20, 'SHIP DAMAGED!', PALETTE.pink, 12));
                }
            }
        }

        _gameOver() {
            this.state = STATE.GAME_OVER;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('hyper_wave_high', this.highScore);
            }
        }

        update(dt) {
            // Decay screen shake
            if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - 0.5);

            // Perspective Grid movement
            this.gridOffset = (this.gridOffset + 2.5) % 36;

            if (this.state !== STATE.PLAYING) return;

            // Player Update
            const inputLeft = this.keys['ArrowLeft'] || this.keys['KeyA'];
            const inputRight = this.keys['ArrowRight'] || this.keys['KeyD'];
            this.player.update(dt, inputLeft, inputRight, this.pointerX);

            // Continuous Auto-Fire
            this.player.shootTimer += dt;
            if (this.player.shootTimer >= this.player.shootInterval) {
                this.player.shootTimer = 0;
                this._fireWeapons();
            }

            // Homing Missiles update
            if (this.player.hasMissiles) {
                this.player.missileTimer += dt;
                if (this.player.missileTimer >= 1400) {
                    this.player.missileTimer = 0;
                    Sound.play('missile');
                    this.missiles.push(new Missile(this.player.x - 14, this.player.y, null));
                    this.missiles.push(new Missile(this.player.x + 14, this.player.y, null));
                }
            }

            // Update Bullets
            this.playerBullets.forEach(b => b.update());
            this.playerBullets = this.playerBullets.filter(b => !b.dead);

            this.enemyBullets.forEach(b => b.update());
            this.enemyBullets = this.enemyBullets.filter(b => !b.dead);

            // Update Missiles
            this.missiles.forEach(m => m.update(this.enemies));
            this.missiles = this.missiles.filter(m => !m.dead);

            // Update Enemies
            this.enemies.forEach(e => e.update(dt, this.player.x, this.enemyBullets));

            // Check Player Bullets vs Enemies
            for (let b of this.playerBullets) {
                for (let e of this.enemies) {
                    if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + b.radius) {
                        b.dead = true;
                        e.hp -= b.damage;
                        for (let i = 0; i < 3; i++) {
                            this.particles.push(new Particle(b.x, b.y, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, 3, b.color));
                        }
                    }
                }
            }

            // Check Missiles vs Enemies
            for (let m of this.missiles) {
                for (let e of this.enemies) {
                    if (Math.hypot(m.x - e.x, m.y - e.y) < e.radius + 10) {
                        m.dead = true;
                        e.hp -= m.damage;
                        Sound.play('boom');
                        this.screenShake = 4;
                        for (let i = 0; i < 12; i++) {
                            this.particles.push(new Particle(m.x, m.y, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 4, PALETTE.orange));
                        }
                    }
                }
            }

            // Check Enemy Deaths & PowerUp Drops
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const e = this.enemies[i];
                if (e.hp <= 0 || e.dead) {
                    if (e.hp <= 0) {
                        Sound.play('boom');
                        this.score += e.points;
                        this.waveKills++;

                        // Particles
                        for (let p = 0; p < (e.type === 'BOSS' ? 70 : 16); p++) {
                            const spd = Math.random() * 6 + 1.5;
                            const a = Math.random() * Math.PI * 2;
                            this.particles.push(new Particle(e.x, e.y, Math.cos(a) * spd, Math.sin(a) * spd, Math.random() * 5 + 2, e.color));
                        }

                        // Powerup drop chance (22%)
                        if (Math.random() < 0.22 || e.type === 'BOSS') {
                            const types = ['W', 'M', 'S', 'B', 'GEM'];
                            const dropType = types[Math.floor(Math.random() * types.length)];
                            this.powerUps.push(new PowerUp(e.x, e.y, dropType));
                        }
                    } else if (e.dead) {
                        // Count escaped as processed so wave progression cannot stall
                        this.waveKills++;
                    }

                    this.enemies.splice(i, 1);
                }
            }

            // Check Enemy Bullets vs Player
            for (let b of this.enemyBullets) {
                if (Math.hypot(b.x - this.player.x, b.y - this.player.y) < this.player.radius + b.radius) {
                    b.dead = true;
                    this._playerTakeHit();
                }
            }

            // Check Enemy Body vs Player
            for (let e of this.enemies) {
                if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < this.player.radius + e.radius) {
                    e.hp -= 4;
                    this._playerTakeHit();
                }
            }

            // Update PowerUps & Collection
            for (let i = this.powerUps.length - 1; i >= 0; i--) {
                const pup = this.powerUps[i];
                pup.update();
                if (Math.hypot(pup.x - this.player.x, pup.y - this.player.y) < this.player.radius + pup.size) {
                    pup.dead = true;
                    Sound.play('powerup');

                    if (pup.type === 'W') {
                        this.player.weaponLevel = Math.min(3, this.player.weaponLevel + 1);
                        this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 25, 'WEAPON UPGRADE!', PALETTE.cyan));
                    } else if (pup.type === 'M') {
                        this.player.hasMissiles = true;
                        this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 25, 'MISSILES ARMED!', PALETTE.orange));
                    } else if (pup.type === 'S') {
                        this.player.shields = this.player.maxShields;
                        this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 25, 'SHIELD RESTORED!', PALETTE.green));
                    } else if (pup.type === 'B') {
                        this.player.bombs++;
                        this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 25, '+1 HYPER WAVE BOMB!', PALETTE.yellow));
                    } else if (pup.type === 'GEM') {
                        this.score += 750;
                        this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 25, '+750 PTS!', PALETTE.pink));
                    }
                }
            }
            this.powerUps = this.powerUps.filter(p => !p.dead);

            // Update Shockwaves
            this.shockwaves.forEach(sw => sw.update());
            this.shockwaves = this.shockwaves.filter(sw => !sw.done);

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

            // Check Wave Complete
            if (this.waveInProgress && (this.waveKills >= this.waveTotalEnemies || (this.enemies.length === 0 && this.waveKills > 0))) {
                this.waveInProgress = false;
                this.score += this.wave * 1000;
                this.floatingTexts.push(new FloatingText(CANVAS_W / 2, CANVAS_H / 2, `WAVE ${this.wave} CLEARED!`, PALETTE.green, 16));
                setTimeout(() => {
                    if (this.state === STATE.PLAYING) {
                        this._startWave(this.wave + 1);
                    }
                }, 1800);
            }

            if (this.waveTransitionTimer > 0) {
                this.waveTransitionTimer -= dt;
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.save();

            // Screen Shake translation
            if (this.screenShake > 0) {
                const ox = (Math.random() - 0.5) * this.screenShake;
                const oy = (Math.random() - 0.5) * this.screenShake;
                ctx.translate(ox, oy);
            }

            // 1. Synthwave Background
            this._drawSynthwaveBackground(ctx);

            // 2. Shockwaves
            this.shockwaves.forEach(sw => sw.draw(ctx));

            // 3. Powerups
            this.powerUps.forEach(p => p.draw(ctx));

            // 4. Bullets & Missiles
            this.playerBullets.forEach(b => b.draw(ctx));
            this.enemyBullets.forEach(b => b.draw(ctx));
            this.missiles.forEach(m => m.draw(ctx));

            // 5. Enemies
            this.enemies.forEach(e => e.draw(ctx));

            // 6. Player
            if (this.state === STATE.PLAYING || this.state === STATE.PAUSED) {
                this.player.draw(ctx);
            }

            // 7. Particles & Floating Texts
            this.particles.forEach(p => p.draw(ctx));
            this.floatingTexts.forEach(ft => ft.draw(ctx));

            // 8. Wave Announcement Banner
            if (this.waveTransitionTimer > 0) {
                ctx.save();
                ctx.font = '18px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = PALETTE.yellow;
                ctx.shadowColor = PALETTE.yellow;
                ctx.shadowBlur = 14;
                ctx.fillText(this.waveTitle, CANVAS_W / 2, CANVAS_H * 0.4);
                ctx.restore();
            }

            // 9. HUD Overlay
            if (this.state === STATE.PLAYING || this.state === STATE.PAUSED) {
                this._drawHUD(ctx);
            } else if (this.state === STATE.START) {
                this._drawStartScreen(ctx);
            } else if (this.state === STATE.GAME_OVER) {
                this._drawGameOverScreen(ctx);
            }

            ctx.restore();
        }

        _drawSynthwaveBackground(ctx) {
            // Deep space void gradient
            const g = ctx.createLinearGradient(0, 0, 0, this.H);
            g.addColorStop(0, '#04020a');
            g.addColorStop(0.55, '#170724');
            g.addColorStop(1, '#05020c');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, this.W, this.H);

            // Distant twinkling stars
            ctx.fillStyle = '#ffffff';
            this.stars.forEach(s => {
                ctx.globalAlpha = s.alpha;
                ctx.fillRect(s.x, s.y, s.size, s.size);
            });
            ctx.globalAlpha = 1;

            // Retro Wireframe Sun (Vanishing Horizon at y = 430)
            const sunX = this.W / 2;
            const sunY = 410;
            const sunRadius = 75;

            const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
            sunGrad.addColorStop(0, '#ffea00');
            sunGrad.addColorStop(0.7, '#ff007f');
            sunGrad.addColorStop(1, '#7b00ff');

            ctx.save();
            ctx.fillStyle = sunGrad;
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 24;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius, Math.PI, 0);
            ctx.fill();

            // Horizontal slice lines across sun
            ctx.fillStyle = '#080514';
            for (let i = 0; i < 7; i++) {
                const ly = sunY - 45 + i * 8;
                const h = 2 + i * 0.6;
                ctx.fillRect(sunX - sunRadius - 10, ly, sunRadius * 2 + 20, h);
            }
            ctx.restore();

            // 3D Perspective Grid
            const horizonY = 410;
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
            ctx.lineWidth = 1.5;

            // Horizon line
            ctx.shadowColor = PALETTE.cyan;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(0, horizonY);
            ctx.lineTo(this.W, horizonY);
            ctx.stroke();

            // Perspective radial lines
            const numRadials = 16;
            for (let i = 0; i <= numRadials; i++) {
                const bottomX = (this.W / numRadials) * i;
                ctx.beginPath();
                ctx.moveTo(sunX, horizonY);
                ctx.lineTo(bottomX, this.H);
                ctx.stroke();
            }

            // Horizontal perspective lines scrolling downward
            const numHorizontals = 12;
            for (let i = 0; i < numHorizontals; i++) {
                const p = ((i * 30 + this.gridOffset) % 360) / 360;
                const y = horizonY + Math.pow(p, 2.2) * (this.H - horizonY);
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.W, y);
                ctx.stroke();
            }
            ctx.restore();
        }

        _drawHUD(ctx) {
            ctx.save();
            ctx.font = '10px "Press Start 2P", monospace';

            // Top Left: Score & Wave
            ctx.textAlign = 'left';
            ctx.fillStyle = PALETTE.cyan;
            ctx.shadowColor = PALETTE.cyan;
            ctx.shadowBlur = 8;
            ctx.fillText(`SCORE: ${this.score}`, 20, 36);

            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = PALETTE.yellow;
            ctx.fillText(`WAVE: ${this.wave}`, 20, 54);

            // Top Right: Lives & Shields & Bombs
            ctx.textAlign = 'right';
            ctx.fillStyle = PALETTE.pink;
            let livesStr = '';
            for (let i = 0; i < this.player.lives; i++) livesStr += '♥ ';
            ctx.fillText(`LIVES: ${livesStr}`, this.W - 20, 36);

            ctx.fillStyle = PALETTE.green;
            let shieldStr = '';
            for (let i = 0; i < this.player.shields; i++) shieldStr += '◆ ';
            ctx.fillText(`SHIELD: ${shieldStr || 'OFF'}`, this.W - 20, 54);

            ctx.fillStyle = PALETTE.yellow;
            let bombStr = '';
            for (let i = 0; i < this.player.bombs; i++) bombStr += '⚡ ';
            ctx.fillText(`BOMBS: ${bombStr}`, this.W - 20, 72);

            ctx.restore();
        }

        _drawStartScreen(ctx) {
            ctx.save();
            const cx = this.W / 2;

            // Glowing Neon Title
            ctx.textAlign = 'center';
            ctx.font = '26px "Press Start 2P", monospace';
            ctx.fillStyle = PALETTE.cyan;
            ctx.shadowColor = PALETTE.cyan;
            ctx.shadowBlur = 18;
            ctx.fillText('HYPER WAVE', cx, 170);
            ctx.shadowBlur = 0;

            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillStyle = PALETTE.pink;
            ctx.fillText('NEON SYNTHWAVE WAVE DEFENDER', cx, 205);

            // Instructions Box
            ctx.fillStyle = 'rgba(14, 9, 28, 0.9)';
            ctx.strokeStyle = PALETTE.cyan;
            ctx.lineWidth = 2;
            ctx.roundRect(cx - 190, 240, 380, 220, 8);
            ctx.fill();
            ctx.stroke();

            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';

            const startX = cx - 165;
            ctx.fillText('STEER:  A / D or ◀ ▶ ARROWS', startX, 275);
            ctx.fillText('MOUSE:  DRAG POINTER TO STEER', startX, 305);
            ctx.fillText('FIRE:   CONTINUOUS AUTO-FIRE', startX, 335);
            ctx.fillText('BOMB:   B or SHIFT (HYPER WAVE)', startX, 365);
            ctx.fillText('ITEMS:  WEAPONS, SHIELDS, DRONES', startX, 395);
            ctx.fillText(`HIGH SCORE: ${this.highScore}`, startX, 430);

            // Start Button
            const btnX = cx - 130;
            const btnY = 500;
            const pulse = Math.sin(Date.now() * 0.008) * 0.15 + 0.85;

            ctx.fillStyle = PALETTE.green;
            ctx.globalAlpha = pulse;
            ctx.roundRect(btnX, btnY, 260, 52, 8);
            ctx.fill();

            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillStyle = '#080514';
            ctx.textAlign = 'center';
            ctx.fillText('▶ LAUNCH ◀', cx, btnY + 32);

            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = '#bcaaa4';
            ctx.fillText('(OR PRESS SPACEBAR / ENTER)', cx, btnY + 76);

            ctx.restore();
        }

        _drawGameOverScreen(ctx) {
            ctx.save();
            const cx = this.W / 2;

            // Game Over Banner
            ctx.textAlign = 'center';
            ctx.font = '26px "Press Start 2P", monospace';
            ctx.fillStyle = PALETTE.pink;
            ctx.shadowColor = PALETTE.pink;
            ctx.shadowBlur = 18;
            ctx.fillText('SYSTEM DESTROYED', cx, 160);
            ctx.shadowBlur = 0;

            // Summary Card
            ctx.fillStyle = 'rgba(14, 9, 28, 0.9)';
            ctx.strokeStyle = PALETTE.cyan;
            ctx.lineWidth = 2;
            ctx.roundRect(cx - 170, 200, 340, 180, 8);
            ctx.fill();
            ctx.stroke();

            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillStyle = PALETTE.yellow;
            ctx.fillText(`FINAL SCORE: ${this.score}`, cx, 240);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(`WAVES SURVIVED: ${this.wave}`, cx, 275);
            ctx.fillText(`BEST SCORE: ${this.highScore}`, cx, 310);

            // Replay Button
            const btnX = cx - 130;
            const btnY = 420;
            const pulse = Math.sin(Date.now() * 0.008) * 0.15 + 0.85;

            ctx.fillStyle = PALETTE.green;
            ctx.globalAlpha = pulse;
            ctx.roundRect(btnX, btnY, 260, 52, 8);
            ctx.fill();

            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillStyle = '#080514';
            ctx.fillText('▶ RETRY ◀', cx, btnY + 32);

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
        const game = new HyperWaveGame();
        game.run();
    });

})();

