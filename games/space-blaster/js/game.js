/* ============================================
   SPACE BLASTER — Complete Arcade Shoot-Em-Up
   A Retro Space Shooter built with HTML5 Canvas
   ============================================ */

(function() {
    'use strict';

    // ============================
    // CONSTANTS & PALETTE
    // ============================
    const CANVAS_W = 600;
    const CANVAS_H = 750;

    const STATE = {
        TITLE: 'title',
        PLAYING: 'playing',
        PAUSED: 'paused',
        WAVE_CLEAR: 'waveClear',
        GAME_OVER: 'gameOver',
        VICTORY: 'victory'
    };

    // Color palette
    const C = {
        bg: '#040410',
        playerCyan: '#00e5ff',
        playerBlue: '#0077ff',
        playerWhite: '#ffffff',
        laserRed: '#ff2255',
        laserYellow: '#ffee22',
        laserCyan: '#00f0ff',
        shieldBlue: '#00c3ff',
        bombGold: '#ffbb00',
        enemyRed: '#ff3344',
        enemyGreen: '#00ff66',
        enemyPurple: '#b344ff',
        enemyOrange: '#ff8800',
        bossGold: '#ffd700',
        hudText: '#ffffff',
        hudDim: '#8899aa'
    };


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

        play(type) {
            if (!this.enabled || !this.ctx) return;
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const t = this.ctx.currentTime;
            switch(type) {
                case 'shoot': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(880, t);
                    osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);
                    gain.gain.setValueAtTime(0.08, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.12);
                    break;
                }
                case 'laser_plasma': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(1200, t);
                    osc.frequency.exponentialRampToValueAtTime(220, t + 0.16);
                    gain.gain.setValueAtTime(0.1, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.16);
                    break;
                }
                case 'hit': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(300, t);
                    osc.frequency.linearRampToValueAtTime(80, t + 0.08);
                    gain.gain.setValueAtTime(0.1, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.08);
                    break;
                }
                case 'explode': {
                    // Filtered noise explosion
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(180, t);
                    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);
                    gain.gain.setValueAtTime(0.2, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.35);
                    break;
                }
                case 'boss_explode': {
                    for (let i = 0; i < 4; i++) {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(160 - i * 30, t + i * 0.1);
                        osc.frequency.exponentialRampToValueAtTime(20, t + i * 0.1 + 0.4);
                        gain.gain.setValueAtTime(0.25, t + i * 0.1);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.4);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.1);
                        osc.stop(t + i * 0.1 + 0.42);
                    }
                    break;
                }
                case 'powerup': {
                    const notes = [440, 554, 659, 880];
                    notes.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.value = f;
                        gain.gain.setValueAtTime(0.12, t + i * 0.06);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.1);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.06);
                        osc.stop(t + i * 0.06 + 0.12);
                    });
                    break;
                }
                case 'bomb': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(600, t);
                    osc.frequency.exponentialRampToValueAtTime(40, t + 0.7);
                    gain.gain.setValueAtTime(0.3, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.72);
                    break;
                }
                case 'warning': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(600, t);
                    osc.frequency.linearRampToValueAtTime(800, t + 0.15);
                    gain.gain.setValueAtTime(0.12, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.26);
                    break;
                }
            }
        }
    };


    // ============================
    // INPUT HANDLER
    // ============================
    const Input = {
        keys: {},
        justPressed: {},
        touchActive: false,
        touchX: 0,
        touchY: 0,

        init(canvas, getScale) {
            window.addEventListener('keydown', (e) => {
                if (!this.keys[e.code]) this.justPressed[e.code] = true;
                this.keys[e.code] = true;
                if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
                    e.preventDefault();
                }
            });

            window.addEventListener('keyup', (e) => {
                this.keys[e.code] = false;
            });

            // Mobile on-screen buttons
            this._initMobile();

            // Direct touch drag / mouse move on canvas
            canvas.addEventListener('mousemove', (e) => {
                if (e.buttons === 1) { // mouse drag
                    const { scaleX, scaleY, rect } = getScale();
                    this.touchActive = true;
                    this.touchX = (e.clientX - rect.left) * scaleX;
                    this.touchY = (e.clientY - rect.top) * scaleY;
                }
            });

            canvas.addEventListener('mouseup', () => {
                this.touchActive = false;
            });

            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (e.touches.length > 0) {
                    const { scaleX, scaleY, rect } = getScale();
                    this.touchActive = true;
                    this.touchX = (e.touches[0].clientX - rect.left) * scaleX;
                    this.touchY = (e.touches[0].clientY - rect.top) * scaleY;
                }
            }, { passive: false });

            canvas.addEventListener('touchend', (e) => {
                if (e.touches.length === 0) {
                    this.touchActive = false;
                }
            });
        },

        _initMobile() {
            const btnLeft = document.getElementById('btn-left');
            const btnRight = document.getElementById('btn-right');
            const btnUp = document.getElementById('btn-up');
            const btnDown = document.getElementById('btn-down');
            const btnFire = document.getElementById('btn-fire');
            const btnBomb = document.getElementById('btn-bomb');

            const bind = (el, code) => {
                if (!el) return;
                const press = (e) => {
                    e.preventDefault();
                    if (!this.keys[code]) this.justPressed[code] = true;
                    this.keys[code] = true;
                    el.classList.add('active');
                };
                const release = (e) => {
                    e.preventDefault();
                    this.keys[code] = false;
                    el.classList.remove('active');
                };
                el.addEventListener('touchstart', press, { passive: false });
                el.addEventListener('touchend', release, { passive: false });
                el.addEventListener('touchcancel', release, { passive: false });
                el.addEventListener('mousedown', press);
                el.addEventListener('mouseup', release);
                el.addEventListener('mouseleave', release);
            };

            bind(btnLeft, 'ArrowLeft');
            bind(btnRight, 'ArrowRight');
            bind(btnUp, 'ArrowUp');
            bind(btnDown, 'ArrowDown');
            bind(btnFire, 'Space');
            bind(btnBomb, 'KeyB');
        },

        isDown(code) { return !!this.keys[code]; },
        wasPressed(code) { return !!this.justPressed[code]; },

        left() { return this.isDown('ArrowLeft') || this.isDown('KeyA'); },
        right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); },
        up() { return this.isDown('ArrowUp') || this.isDown('KeyW'); },
        down() { return this.isDown('ArrowDown') || this.isDown('KeyS'); },
        fire() { return this.isDown('Space') || this.isDown('KeyJ') || this.isDown('KeyZ'); },
        bomb() { return this.wasPressed('KeyB') || this.wasPressed('KeyX') || this.wasPressed('KeyK'); },
        enter() { return this.wasPressed('Enter') || this.wasPressed('Space'); },
        escape() { return this.wasPressed('Escape') || this.wasPressed('KeyP'); },

        clearJustPressed() {
            this.justPressed = {};
        }
    };


    // ============================
    // STARFIELD BACKGROUND
    // ============================
    class Starfield {
        constructor(w, h) {
            this.w = w;
            this.h = h;
            this.stars = [];
            for (let i = 0; i < 120; i++) {
                this.stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    speed: Math.random() * 2.5 + 0.5,
                    size: Math.random() < 0.2 ? 2.5 : (Math.random() < 0.6 ? 1.5 : 1),
                    color: ['#ffffff', '#00e5ff', '#ff007f', '#ffe57f', '#aaccff'][Math.floor(Math.random() * 5)],
                    twinkle: Math.random() * Math.PI * 2
                });
            }
            this.nebulas = [
                { x: 100, y: 150, r: 180, color: 'rgba(80, 0, 160, 0.15)' },
                { x: 450, y: 400, r: 220, color: 'rgba(0, 100, 200, 0.12)' },
                { x: 250, y: 650, r: 160, color: 'rgba(200, 0, 100, 0.1)' }
            ];
        }

        update(boost = 1) {
            for (const s of this.stars) {
                s.y += s.speed * boost;
                s.twinkle += 0.05;
                if (s.y > this.h) {
                    s.y = 0;
                    s.x = Math.random() * this.w;
                }
            }
        }

        draw(ctx) {
            // Space background
            ctx.fillStyle = C.bg;
            ctx.fillRect(0, 0, this.w, this.h);

            // Nebulas
            for (const n of this.nebulas) {
                const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
                g.addColorStop(0, n.color);
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fill();
            }

            // Stars
            for (const s of this.stars) {
                const alpha = Math.sin(s.twinkle) * 0.3 + 0.7;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = s.color;
                ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size * (s.speed > 2 ? 1.5 : 1));
            }
            ctx.globalAlpha = 1;
        }
    }


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
            this.vx *= 0.96;
            this.vy *= 0.96;
            this.life--;
        }
        draw(ctx) {
            ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
            ctx.fillStyle = this.color;
            ctx.fillRect(Math.floor(this.x - this.size / 2), Math.floor(this.y - this.size / 2), this.size, this.size);
            ctx.globalAlpha = 1;
        }
    }

    class Popup {
        constructor(x, y, text, color = '#ffffff') {
            this.x = x; this.y = y;
            this.text = text;
            this.color = color;
            this.life = 40;
            this.maxLife = 40;
        }
        update() {
            this.y -= 1;
            this.life--;
        }
        draw(ctx) {
            ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
            ctx.fillStyle = this.color;
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
            ctx.globalAlpha = 1;
        }
    }


    // ============================
    // PLAYER
    // ============================
    class Player {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.w = 34;
            this.h = 42;
            this.speed = 5.5;
            this.lives = 3;
            this.shield = 100;
            this.maxShield = 100;
            this.hasShield = false;
            this.bombs = 2;
            this.weaponTier = 1; // 1 to 4
            this.shootCooldown = 0;
            this.shootRate = 12; // frames between shots
            this.invulnerableTimer = 90;
            this.thrusterFrame = 0;
        }

        update(canvasW, canvasH) {
            if (this.invulnerableTimer > 0) this.invulnerableTimer--;
            if (this.shootCooldown > 0) this.shootCooldown--;
            this.thrusterFrame++;

            // Keyboard movement
            let dx = 0;
            let dy = 0;
            if (Input.left()) dx -= 1;
            if (Input.right()) dx += 1;
            if (Input.up()) dy -= 1;
            if (Input.down()) dy += 1;

            if (dx !== 0 && dy !== 0) {
                dx *= 0.707;
                dy *= 0.707;
            }

            this.x += dx * this.speed;
            this.y += dy * this.speed;

            // Touch drag follow
            if (Input.touchActive) {
                const targetX = Input.touchX;
                const targetY = Input.touchY - 40; // finger offset above touch point
                this.x += (targetX - this.x) * 0.2;
                this.y += (targetY - this.y) * 0.2;
            }

            // Screen boundary clamping
            this.x = Math.max(this.w / 2, Math.min(canvasW - this.w / 2, this.x));
            this.y = Math.max(this.h / 2 + 30, Math.min(canvasH - this.h / 2 - 10, this.y));
        }

        shoot(bullets) {
            if (this.shootCooldown > 0) return;
            this.shootCooldown = this.shootRate;

            const t = this.weaponTier;
            if (t === 1) {
                // Single central laser
                bullets.push(new Bullet(this.x, this.y - 20, 0, -12, 'player', C.playerCyan, 4, 16, 25));
                Sound.play('shoot');
            } else if (t === 2) {
                // Dual blasters
                bullets.push(new Bullet(this.x - 10, this.y - 18, 0, -13, 'player', C.playerCyan, 4, 16, 25));
                bullets.push(new Bullet(this.x + 10, this.y - 18, 0, -13, 'player', C.playerCyan, 4, 16, 25));
                Sound.play('shoot');
            } else if (t === 3) {
                // Triple blaster (center + angled)
                bullets.push(new Bullet(this.x, this.y - 20, 0, -13, 'player', C.laserYellow, 5, 18, 30));
                bullets.push(new Bullet(this.x - 12, this.y - 16, -2.5, -12.5, 'player', C.playerCyan, 4, 16, 25));
                bullets.push(new Bullet(this.x + 12, this.y - 16, 2.5, -12.5, 'player', C.playerCyan, 4, 16, 25));
                Sound.play('laser_plasma');
            } else {
                // Tier 4: Plasma 5-way spread
                bullets.push(new Bullet(this.x, this.y - 22, 0, -14, 'player', '#ff007f', 6, 22, 40));
                bullets.push(new Bullet(this.x - 8, this.y - 18, -1.8, -13.5, 'player', C.laserYellow, 5, 18, 30));
                bullets.push(new Bullet(this.x + 8, this.y - 18, 1.8, -13.5, 'player', C.laserYellow, 5, 18, 30));
                bullets.push(new Bullet(this.x - 16, this.y - 14, -3.8, -12, 'player', C.playerCyan, 4, 16, 25));
                bullets.push(new Bullet(this.x + 16, this.y - 14, 3.8, -12, 'player', C.playerCyan, 4, 16, 25));
                Sound.play('laser_plasma');
            }
        }

        hit(damage, particles) {
            if (this.invulnerableTimer > 0) return false;

            if (this.hasShield) {
                this.shield -= damage;
                Sound.play('hit');
                if (this.shield <= 0) {
                    this.hasShield = false;
                    this.shield = 0;
                    this.invulnerableTimer = 40;
                }
                return false;
            }

            this.lives--;
            this.invulnerableTimer = 100;
            this.weaponTier = Math.max(1, this.weaponTier - 1);
            Sound.play('explode');

            // Debris explosion
            for (let i = 0; i < 24; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = Math.random() * 5 + 1;
                particles.push(new Particle(
                    this.x, this.y,
                    Math.cos(angle) * spd, Math.sin(angle) * spd,
                    ['#00e5ff', '#ff3344', '#ffffff', '#ffee00'][Math.floor(Math.random() * 4)],
                    25 + Math.random() * 20, 3 + Math.random() * 3
                ));
            }
            return true;
        }

        draw(ctx) {
            // Invulnerability blink
            if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
                return;
            }

            const x = Math.floor(this.x);
            const y = Math.floor(this.y);

            // Thruster fire animation
            const flameH = (Math.sin(this.thrusterFrame * 0.4) * 4) + 12;
            ctx.fillStyle = '#00aaff';
            ctx.fillRect(x - 5, y + 16, 10, flameH);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 2, y + 16, 4, flameH * 0.6);

            // Ship Body (Pixel Art Fighter)
            // Main Fuselage (white / light cyan)
            ctx.fillStyle = C.playerWhite;
            ctx.fillRect(x - 4, y - 20, 8, 32);
            ctx.fillRect(x - 8, y - 10, 16, 24);

            // Cockpit canopy (neon cyan)
            ctx.fillStyle = C.playerCyan;
            ctx.fillRect(x - 3, y - 14, 6, 10);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 1, y - 12, 2, 4);

            // Wings (deep cyan & blue accents)
            ctx.fillStyle = C.playerBlue;
            ctx.fillRect(x - 16, y, 32, 10);
            ctx.fillRect(x - 20, y + 8, 40, 8);
            ctx.fillRect(x - 22, y + 12, 6, 6);
            ctx.fillRect(x + 16, y + 12, 6, 6);

            // Wing tip gun barrels
            ctx.fillStyle = C.laserYellow;
            ctx.fillRect(x - 18, y - 4, 3, 10);
            ctx.fillRect(x + 15, y - 4, 3, 10);

            // Shield bubble
            if (this.hasShield) {
                const pulse = Math.sin(this.thrusterFrame * 0.15) * 3;
                ctx.strokeStyle = `rgba(0, 229, 255, ${0.4 + Math.sin(this.thrusterFrame * 0.2) * 0.2})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 28 + pulse, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
                ctx.fill();
            }
        }
    }


    // ============================
    // BULLETS
    // ============================
    class Bullet {
        constructor(x, y, vx, vy, owner, color, w = 4, h = 12, damage = 20) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.owner = owner; // 'player' | 'enemy'
            this.color = color;
            this.w = w;
            this.h = h;
            this.damage = damage;
            this.alive = true;
        }

        update(canvasW, canvasH) {
            this.x += this.vx;
            this.y += this.vy;
            if (this.y < -30 || this.y > canvasH + 30 || this.x < -30 || this.x > canvasW + 30) {
                this.alive = false;
            }
        }

        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.fillRect(Math.floor(this.x - this.w / 2), Math.floor(this.y - this.h / 2), this.w, this.h);

            // Glow core
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.floor(this.x - this.w / 4), Math.floor(this.y - this.h / 4), this.w / 2, this.h / 2);
        }
    }


    // ============================
    // ENEMIES
    // ============================
    class Enemy {
        constructor(x, y, type, wave = 1) {
            this.x = x;
            this.y = y;
            this.type = type; // 'scout' | 'fighter' | 'cruiser' | 'asteroid' | 'boss1' | 'boss2'
            this.alive = true;
            this.animTimer = Math.random() * 100;
            this.shootTimer = Math.floor(Math.random() * 60) + 30;

            this.setupStats(wave);
        }

        setupStats(wave) {
            const mult = 1 + (wave - 1) * 0.15;
            switch(this.type) {
                case 'scout':
                    this.w = 26; this.h = 24;
                    this.hp = Math.round(30 * mult);
                    this.maxHp = this.hp;
                    this.vx = (Math.random() - 0.5) * 2;
                    this.vy = 2.2 + Math.random() * 0.8;
                    this.scoreVal = 100;
                    this.color = C.enemyGreen;
                    break;

                case 'fighter':
                    this.w = 32; this.h = 28;
                    this.hp = Math.round(50 * mult);
                    this.maxHp = this.hp;
                    this.vx = (Math.random() - 0.5) * 1.5;
                    this.vy = 1.6 + Math.random() * 0.6;
                    this.scoreVal = 200;
                    this.color = C.enemyRed;
                    break;

                case 'cruiser':
                    this.w = 48; this.h = 44;
                    this.hp = Math.round(180 * mult);
                    this.maxHp = this.hp;
                    this.vx = 0.8;
                    this.vy = 0.8;
                    this.scoreVal = 450;
                    this.color = C.enemyPurple;
                    break;

                case 'asteroid':
                    this.w = 36; this.h = 36;
                    this.hp = Math.round(70 * mult);
                    this.maxHp = this.hp;
                    this.vx = (Math.random() - 0.5) * 1.2;
                    this.vy = 1.8 + Math.random() * 1.2;
                    this.rot = 0;
                    this.rotSpd = (Math.random() - 0.5) * 0.08;
                    this.scoreVal = 150;
                    this.color = '#888899';
                    break;

                case 'boss1': // Dreadnought Alpha
                    this.w = 120; this.h = 70;
                    this.hp = 1200 + (wave * 300);
                    this.maxHp = this.hp;
                    this.vx = 2;
                    this.vy = 0.5;
                    this.scoreVal = 3000;
                    this.color = C.bossGold;
                    this.targetY = 110;
                    this.isBoss = true;
                    break;

                case 'boss2': // Omega Core
                    this.w = 140; this.h = 90;
                    this.hp = 2200 + (wave * 400);
                    this.maxHp = this.hp;
                    this.vx = 2.4;
                    this.vy = 0.5;
                    this.scoreVal = 5000;
                    this.color = '#ff007f';
                    this.targetY = 120;
                    this.isBoss = true;
                    break;
            }
        }

        update(canvasW, canvasH, player, enemyBullets) {
            this.animTimer++;

            if (this.isBoss) {
                // Boss enters smoothly then strafes side to side
                if (this.y < this.targetY) {
                    this.y += this.vy;
                } else {
                    this.x += this.vx;
                    if (this.x < this.w / 2 + 20 || this.x > canvasW - this.w / 2 - 20) {
                        this.vx *= -1;
                    }
                }

                // Boss firing patterns
                this.shootTimer--;
                if (this.shootTimer <= 0) {
                    this.shootTimer = 45;
                    if (this.type === 'boss1') {
                        // 3-way aimed burst
                        const angle = Math.atan2(player.y - this.y, player.x - this.x);
                        for (let a = -0.3; a <= 0.3; a += 0.3) {
                            enemyBullets.push(new Bullet(
                                this.x, this.y + 30,
                                Math.cos(angle + a) * 5, Math.sin(angle + a) * 5,
                                'enemy', C.enemyOrange, 6, 6, 20
                            ));
                        }
                    } else if (this.type === 'boss2') {
                        // 6-way radial ring
                        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
                            enemyBullets.push(new Bullet(
                                this.x, this.y + 20,
                                Math.cos(a) * 4.5, Math.sin(a) * 4.5,
                                'enemy', C.laserRed, 6, 6, 20
                            ));
                        }
                    }
                }
                return;
            }

            // Normal enemy behaviors
            if (this.type === 'scout') {
                this.y += this.vy;
                this.x += Math.sin(this.animTimer * 0.08) * 3;
            } else if (this.type === 'fighter') {
                this.y += this.vy;
                this.x += this.vx;
                if (this.x < 30 || this.x > canvasW - 30) this.vx *= -1;

                this.shootTimer--;
                if (this.shootTimer <= 0) {
                    this.shootTimer = 80 + Math.random() * 40;
                    enemyBullets.push(new Bullet(this.x, this.y + 14, 0, 5, 'enemy', C.enemyRed, 4, 10, 15));
                }
            } else if (this.type === 'cruiser') {
                this.y += this.vy * 0.7;
                this.x += this.vx;
                if (this.x < 40 || this.x > canvasW - 40) this.vx *= -1;

                this.shootTimer--;
                if (this.shootTimer <= 0) {
                    this.shootTimer = 60;
                    enemyBullets.push(new Bullet(this.x - 14, this.y + 18, -1, 5.5, 'enemy', C.enemyPurple, 5, 12, 20));
                    enemyBullets.push(new Bullet(this.x + 14, this.y + 18, 1, 5.5, 'enemy', C.enemyPurple, 5, 12, 20));
                }
            } else if (this.type === 'asteroid') {
                this.y += this.vy;
                this.x += this.vx;
                this.rot += this.rotSpd;
            }

            // Off screen
            if (this.y > canvasH + 60) {
                this.alive = false;
            }
        }

        draw(ctx) {
            const x = Math.floor(this.x);
            const y = Math.floor(this.y);

            switch(this.type) {
                case 'scout': {
                    // Insectoid green flyer
                    ctx.fillStyle = C.enemyGreen;
                    ctx.fillRect(x - 8, y - 10, 16, 12);
                    ctx.fillRect(x - 12, y - 4, 24, 8);
                    ctx.fillRect(x - 14, y + 4, 8, 8);
                    ctx.fillRect(x + 6, y + 4, 8, 8);
                    // Eye glow
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x - 4, y - 6, 2, 4);
                    ctx.fillRect(x + 2, y - 6, 2, 4);
                    break;
                }
                case 'fighter': {
                    // Sleek red attack craft
                    ctx.fillStyle = C.enemyRed;
                    ctx.fillRect(x - 4, y - 12, 8, 22);
                    ctx.fillRect(x - 14, y - 2, 28, 8);
                    ctx.fillRect(x - 16, y + 6, 6, 6);
                    ctx.fillRect(x + 10, y + 6, 6, 6);
                    ctx.fillStyle = C.enemyOrange;
                    ctx.fillRect(x - 2, y - 6, 4, 8);
                    break;
                }
                case 'cruiser': {
                    // Heavy purple gunship
                    ctx.fillStyle = C.enemyPurple;
                    ctx.fillRect(x - 18, y - 18, 36, 36);
                    ctx.fillRect(x - 24, y - 6, 48, 16);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x - 8, y - 10, 16, 8);
                    ctx.fillStyle = C.laserRed;
                    ctx.fillRect(x - 16, y + 10, 6, 8);
                    ctx.fillRect(x + 10, y + 10, 6, 8);
                    break;
                }
                case 'asteroid': {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(this.rot || 0);
                    ctx.fillStyle = '#6b6b7a';
                    ctx.fillRect(-16, -14, 32, 28);
                    ctx.fillRect(-12, -18, 24, 36);
                    ctx.fillStyle = '#8b8b9e';
                    ctx.fillRect(-8, -10, 8, 8);
                    ctx.fillRect(2, 2, 6, 6);
                    ctx.restore();
                    break;
                }
                case 'boss1': {
                    // Dreadnought Alpha (massive golden mothership)
                    ctx.fillStyle = C.bossGold;
                    ctx.fillRect(x - 50, y - 25, 100, 45);
                    ctx.fillRect(x - 60, y - 10, 120, 24);
                    ctx.fillRect(x - 25, y + 15, 50, 15);
                    // Core
                    ctx.fillStyle = C.laserRed;
                    ctx.fillRect(x - 15, y - 10, 30, 20);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x - 6, y - 4, 12, 8);
                    // Wings & Turrets
                    ctx.fillStyle = '#ff8800';
                    ctx.fillRect(x - 55, y + 5, 10, 15);
                    ctx.fillRect(x + 45, y + 5, 10, 15);
                    break;
                }
                case 'boss2': {
                    // Omega Core (alien cybernetic behemoth)
                    ctx.fillStyle = '#ff007f';
                    ctx.fillRect(x - 60, y - 35, 120, 60);
                    ctx.fillRect(x - 70, y - 15, 140, 30);
                    ctx.fillRect(x - 40, y + 25, 80, 20);
                    // Pulsing central eye
                    const p = Math.sin(this.animTimer * 0.1) * 4;
                    ctx.fillStyle = '#00e5ff';
                    ctx.beginPath();
                    ctx.arc(x, y - 5, 16 + p, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(x, y - 5, 7, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
            }

            // Health bar for damaged cruisers or bosses
            if (this.hp < this.maxHp) {
                const barW = this.w;
                const barH = this.isBoss ? 6 : 3;
                const barX = x - barW / 2;
                const barY = y - this.h / 2 - (this.isBoss ? 14 : 7);
                const pct = Math.max(0, this.hp / this.maxHp);

                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(barX, barY, barW, barH);
                ctx.fillStyle = this.isBoss ? C.enemyOrange : C.enemyGreen;
                ctx.fillRect(barX, barY, barW * pct, barH);
            }
        }
    }


    // ============================
    // POWER-UPS
    // ============================
    class Powerup {
        constructor(x, y, kind) {
            this.x = x;
            this.y = y;
            this.kind = kind; // 'weapon' | 'shield' | 'bomb' | 'life' | 'gem'
            this.w = 20;
            this.h = 20;
            this.vy = 1.6;
            this.timer = 0;
            this.alive = true;
        }

        update(canvasH) {
            this.y += this.vy;
            this.timer += 0.1;
            if (this.y > canvasH + 30) this.alive = false;
        }

        draw(ctx) {
            const x = Math.floor(this.x);
            const y = Math.floor(this.y);
            const pulse = Math.sin(this.timer) * 2;

            ctx.save();
            ctx.translate(x, y);

            if (this.kind === 'weapon') {
                ctx.fillStyle = '#ffee00';
                ctx.fillRect(-9 - pulse, -9 - pulse, 18 + pulse*2, 18 + pulse*2);
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('W', 0, 3);
            } else if (this.kind === 'shield') {
                ctx.fillStyle = '#00c3ff';
                ctx.beginPath();
                ctx.arc(0, 0, 10 + pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('S', 0, 3);
            } else if (this.kind === 'bomb') {
                ctx.fillStyle = '#ff8800';
                ctx.fillRect(-9, -9, 18, 18);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('B', 0, 3);
            } else if (this.kind === 'life') {
                ctx.fillStyle = '#ff2255';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('♥', 0, 4);
            } else { // gem
                ctx.fillStyle = '#00ffcc';
                ctx.fillRect(-7, -7, 14, 14);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-3, -3, 6, 6);
            }

            ctx.restore();
        }
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
            this.wave = 1;
            this.waveTimer = 0;
            this.waveClearTimer = 0;

            this.starfield = new Starfield(this.W, this.H);
            this.player = new Player(this.W / 2, this.H - 120);

            this.playerBullets = [];
            this.enemyBullets = [];
            this.enemies = [];
            this.powerups = [];
            this.particles = [];
            this.popups = [];

            this.screenShake = 0;
            this.bombFlash = 0;

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

            Input.init(this.canvas, getScale);

            // Canvas Click / Tap for UI transitions
            this.canvas.addEventListener('click', (e) => {
                Sound.init();
                const { scaleX, scaleY, rect } = getScale();
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                this.handleClick(x, y);
            });

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
                this.highScore = parseInt(localStorage.getItem('spaceblaster_highscore') || '0', 10);
            } catch(e) {}
        }

        _saveHighScore() {
            try {
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('spaceblaster_highscore', String(this.highScore));
                }
            } catch(e) {}
        }

        handleClick(x, y) {
            if (this.state === STATE.TITLE) {
                Sound.play('powerup');
                this.startNewGame();
                return;
            }

            if (this.state === STATE.GAME_OVER || this.state === STATE.VICTORY) {
                Sound.play('shoot');
                this.state = STATE.TITLE;
                return;
            }

            if (this.state === STATE.PAUSED) {
                this.state = STATE.PLAYING;
                return;
            }

            if (this.state === STATE.PLAYING) {
                // If clicked top-right, trigger bomb
                if (x > this.W - 80 && y < 60) {
                    this.triggerBomb();
                }
            }
        }

        startNewGame() {
            this.score = 0;
            this.wave = 1;
            this.player = new Player(this.W / 2, this.H - 120);
            this.playerBullets.length = 0;
            this.enemyBullets.length = 0;
            this.enemies.length = 0;
            this.powerups.length = 0;
            this.particles.length = 0;
            this.popups.length = 0;
            this.waveTimer = 0;
            this.screenShake = 0;
            this.bombFlash = 0;
            this.state = STATE.PLAYING;

            this.spawnWave(this.wave);
        }

        triggerBomb() {
            if (this.player.bombs <= 0) return;
            this.player.bombs--;
            this.bombFlash = 25;
            this.screenShake = 20;
            Sound.play('bomb');

            // Clear all enemy bullets
            this.enemyBullets.length = 0;

            // Damage all enemies
            for (const e of this.enemies) {
                e.hp -= 350;
                if (e.hp <= 0) {
                    e.alive = false;
                    this.score += e.scoreVal;
                    this.popups.push(new Popup(e.x, e.y, '+' + e.scoreVal, C.neonYellow));
                }
            }

            // Bomb particle shockwave
            for (let i = 0; i < 40; i++) {
                const angle = (i / 40) * Math.PI * 2;
                const spd = Math.random() * 8 + 4;
                this.particles.push(new Particle(
                    this.W / 2, this.H / 2,
                    Math.cos(angle) * spd, Math.sin(angle) * spd,
                    ['#ffbb00', '#ff007f', '#00e5ff'][i % 3], 35, 4
                ));
            }
        }

        spawnWave(waveNum) {
            this.enemies.length = 0;
            this.waveTimer = 0;

            // Boss waves at wave 3 and wave 5
            if (waveNum === 3) {
                Sound.play('warning');
                this.enemies.push(new Enemy(this.W / 2, -80, 'boss1', waveNum));
                return;
            }
            if (waveNum === 5) {
                Sound.play('warning');
                this.enemies.push(new Enemy(this.W / 2, -100, 'boss2', waveNum));
                return;
            }

            // Normal wave compositions
            const scoutCount = 4 + waveNum * 2;
            for (let i = 0; i < scoutCount; i++) {
                setTimeout(() => {
                    if (this.state === STATE.PLAYING) {
                        const x = (i % 2 === 0 ? 80 : this.W - 80) + (Math.random() - 0.5) * 60;
                        this.enemies.push(new Enemy(x, -30 - (i * 25), 'scout', waveNum));
                    }
                }, i * 450);
            }

            const fighterCount = 2 + waveNum;
            for (let i = 0; i < fighterCount; i++) {
                setTimeout(() => {
                    if (this.state === STATE.PLAYING) {
                        const x = 100 + Math.random() * (this.W - 200);
                        this.enemies.push(new Enemy(x, -40, 'fighter', waveNum));
                    }
                }, 2000 + i * 800);
            }

            if (waveNum >= 2) {
                const cruiserCount = Math.min(3, waveNum - 1);
                for (let i = 0; i < cruiserCount; i++) {
                    setTimeout(() => {
                        if (this.state === STATE.PLAYING) {
                            const x = 120 + i * 160;
                            this.enemies.push(new Enemy(x, -60, 'cruiser', waveNum));
                        }
                    }, 4000 + i * 1200);
                }
            }

            // Asteroids
            for (let i = 0; i < 4; i++) {
                setTimeout(() => {
                    if (this.state === STATE.PLAYING) {
                        this.enemies.push(new Enemy(Math.random() * (this.W - 100) + 50, -50, 'asteroid', waveNum));
                    }
                }, 1000 + i * 1500);
            }
        }

        update() {
            if (this.screenShake > 0) this.screenShake--;
            if (this.bombFlash > 0) this.bombFlash--;

            this.starfield.update(this.state === STATE.WAVE_CLEAR ? 3 : 1);

            switch(this.state) {
                case STATE.TITLE:
                    if (Input.enter()) {
                        Sound.play('powerup');
                        this.startNewGame();
                    }
                    break;

                case STATE.PLAYING:
                    this._updatePlaying();
                    break;

                case STATE.PAUSED:
                    if (Input.escape() || Input.enter()) {
                        this.state = STATE.PLAYING;
                    }
                    break;

                case STATE.WAVE_CLEAR:
                    this.waveClearTimer++;
                    if (this.waveClearTimer > 100) {
                        this.wave++;
                        this.waveClearTimer = 0;
                        this.state = STATE.PLAYING;
                        this.spawnWave(this.wave);
                    }
                    break;

                case STATE.GAME_OVER:
                case STATE.VICTORY:
                    if (Input.enter()) {
                        this.state = STATE.TITLE;
                    }
                    break;
            }

            Input.clearJustPressed();
        }

        _updatePlaying() {
            if (Input.escape()) {
                this.state = STATE.PAUSED;
                return;
            }

            if (Input.bomb()) {
                this.triggerBomb();
            }

            // Player controls & auto/manual shooting
            this.player.update(this.W, this.H);

            // Fire on Space, touch active, or continuous button hold
            if (Input.fire() || Input.touchActive) {
                this.player.shoot(this.playerBullets);
            }

            // Update player bullets
            for (let i = this.playerBullets.length - 1; i >= 0; i--) {
                const b = this.playerBullets[i];
                b.update(this.W, this.H);
                if (!b.alive) {
                    this.playerBullets.splice(i, 1);
                }
            }

            // Update enemy bullets
            for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
                const b = this.enemyBullets[i];
                b.update(this.W, this.H);

                // Hit player?
                if (b.alive && this._collide(b, this.player)) {
                    b.alive = false;
                    this.player.hit(b.damage, this.particles);
                    if (this.player.lives <= 0) {
                        this._gameOver();
                        return;
                    }
                }

                if (!b.alive) {
                    this.enemyBullets.splice(i, 1);
                }
            }

            // Update enemies & bullet collisions
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const e = this.enemies[i];
                e.update(this.W, this.H, this.player, this.enemyBullets);

                // Collision with player ship?
                if (e.alive && this._collide(e, this.player)) {
                    this.player.hit(40, this.particles);
                    e.hp -= 80;
                    if (this.player.lives <= 0) {
                        this._gameOver();
                        return;
                    }
                }

                // Collision with player bullets
                for (let j = this.playerBullets.length - 1; j >= 0; j--) {
                    const b = this.playerBullets[j];
                    if (b.alive && e.alive && this._collide(b, e)) {
                        b.alive = false;
                        e.hp -= b.damage;
                        Sound.play('hit');

                        // Hit spark
                        this.particles.push(new Particle(b.x, b.y, (Math.random()-0.5)*3, (Math.random()-0.5)*3, '#ffffff', 10, 2));

                        if (e.hp <= 0) {
                            e.alive = false;
                            this._onEnemyDestroyed(e);
                            break;
                        }
                    }
                }

                if (!e.alive) {
                    this.enemies.splice(i, 1);
                }
            }

            // Update powerups
            for (let i = this.powerups.length - 1; i >= 0; i--) {
                const p = this.powerups[i];
                p.update(this.H);

                // Player pickup
                if (p.alive && this._collide(p, this.player)) {
                    p.alive = false;
                    this._collectPowerup(p);
                }

                if (!p.alive) {
                    this.powerups.splice(i, 1);
                }
            }

            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].life <= 0) this.particles.splice(i, 1);
            }

            // Update score popups
            for (let i = this.popups.length - 1; i >= 0; i--) {
                this.popups[i].update();
                if (this.popups[i].life <= 0) this.popups.splice(i, 1);
            }

            // Check if wave is completed
            this.waveTimer++;
            if (this.waveTimer > 300 && this.enemies.length === 0) {
                if (this.wave === 5) {
                    this._victory();
                } else {
                    this.state = STATE.WAVE_CLEAR;
                    this.waveClearTimer = 0;
                    Sound.play('powerup');
                }
            }
        }

        _onEnemyDestroyed(e) {
            this.score += e.scoreVal;
            this.popups.push(new Popup(e.x, e.y, '+' + e.scoreVal, C.neonYellow));

            if (e.isBoss) {
                Sound.play('boss_explode');
                this.screenShake = 25;
            } else {
                Sound.play('explode');
            }

            // Explosion sparks
            const count = e.isBoss ? 50 : 16;
            for (let k = 0; k < count; k++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = Math.random() * (e.isBoss ? 7 : 4) + 1;
                this.particles.push(new Particle(
                    e.x, e.y,
                    Math.cos(angle) * spd, Math.sin(angle) * spd,
                    [e.color, '#ff8800', '#ffee00', '#ffffff'][k % 4],
                    20 + Math.random() * 20, 3 + Math.random() * 3
                ));
            }

            // Power-up drop chance (25%)
            if (Math.random() < 0.25 || e.isBoss) {
                const roll = Math.random();
                let kind = 'gem';
                if (roll < 0.35) kind = 'weapon';
                else if (roll < 0.65) kind = 'shield';
                else if (roll < 0.85) kind = 'bomb';
                else if (roll < 0.95) kind = 'life';
                this.powerups.push(new Powerup(e.x, e.y, kind));
            }
        }

        _collectPowerup(p) {
            Sound.play('powerup');
            switch(p.kind) {
                case 'weapon':
                    this.player.weaponTier = Math.min(4, this.player.weaponTier + 1);
                    this.popups.push(new Popup(p.x, p.y, 'WEAPON UP!', C.neonYellow));
                    break;
                case 'shield':
                    this.player.hasShield = true;
                    this.player.shield = 100;
                    this.popups.push(new Popup(p.x, p.y, 'SHIELD ON!', C.neonBlue));
                    break;
                case 'bomb':
                    this.player.bombs = Math.min(5, this.player.bombs + 1);
                    this.popups.push(new Popup(p.x, p.y, '+1 BOMB', C.neonPink));
                    break;
                case 'life':
                    this.player.lives = Math.min(5, this.player.lives + 1);
                    this.popups.push(new Popup(p.x, p.y, '+1 LIFE!', '#ff2255'));
                    break;
                case 'gem':
                    this.score += 500;
                    this.popups.push(new Popup(p.x, p.y, '+500', C.neonBlue));
                    break;
            }
        }

        _gameOver() {
            this.state = STATE.GAME_OVER;
            this._saveHighScore();
        }

        _victory() {
            this.state = STATE.VICTORY;
            this.score += 10000;
            this._saveHighScore();
        }

        _collide(a, b) {
            return Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
                   Math.abs(a.y - b.y) < (a.h + b.h) / 2;
        }

        // ============================
        // DRAW
        // ============================
        draw() {
            const ctx = this.ctx;
            ctx.save();

            // Screen shake
            if (this.screenShake > 0) {
                const sx = (Math.random() - 0.5) * this.screenShake;
                const sy = (Math.random() - 0.5) * this.screenShake;
                ctx.translate(sx, sy);
            }

            // Starfield
            this.starfield.draw(ctx);

            switch(this.state) {
                case STATE.TITLE:
                    this._drawTitle(ctx);
                    break;
                case STATE.PLAYING:
                case STATE.PAUSED:
                case STATE.WAVE_CLEAR:
                    this._drawGame(ctx);
                    if (this.state === STATE.PAUSED) this._drawPause(ctx);
                    if (this.state === STATE.WAVE_CLEAR) this._drawWaveClear(ctx);
                    break;
                case STATE.GAME_OVER:
                    this._drawGame(ctx);
                    this._drawGameOver(ctx);
                    break;
                case STATE.VICTORY:
                    this._drawGame(ctx);
                    this._drawVictory(ctx);
                    break;
            }

            // Smart bomb white flash
            if (this.bombFlash > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${this.bombFlash / 25})`;
                ctx.fillRect(0, 0, this.W, this.H);
            }

            ctx.restore();
        }

        _drawGame(ctx) {
            // Powerups
            for (const p of this.powerups) p.draw(ctx);

            // Enemies
            for (const e of this.enemies) e.draw(ctx);

            // Bullets
            for (const b of this.playerBullets) b.draw(ctx);
            for (const b of this.enemyBullets) b.draw(ctx);

            // Player
            this.player.draw(ctx);

            // Particles
            for (const p of this.particles) p.draw(ctx);

            // Popups
            for (const popup of this.popups) popup.draw(ctx);

            // HUD Overlay
            this._drawHUD(ctx);
        }

        _drawHUD(ctx) {
            ctx.fillStyle = 'rgba(2, 2, 10, 0.75)';
            ctx.fillRect(0, 0, this.W, 46);

            ctx.font = '9px "Press Start 2P", monospace';
            ctx.textAlign = 'left';

            // Score
            ctx.fillStyle = C.hudDim;
            ctx.fillText('SCORE', 16, 18);
            ctx.fillStyle = C.neonYellow;
            ctx.fillText(String(this.score).padStart(6, '0'), 16, 34);

            // Wave
            ctx.fillStyle = C.hudDim;
            ctx.textAlign = 'center';
            ctx.fillText('SECTOR', this.W / 2, 18);
            ctx.fillStyle = C.neonBlue;
            ctx.fillText('WAVE ' + this.wave, this.W / 2, 34);

            // High Score
            ctx.fillStyle = C.hudDim;
            ctx.textAlign = 'right';
            ctx.fillText('HIGH', this.W - 16, 18);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(String(Math.max(this.score, this.highScore)).padStart(6, '0'), this.W - 16, 34);

            // Bottom status bar (Lives, Bombs, Weapon Level)
            const botY = this.H - 18;
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ff3366';
            ctx.fillText('♥'.repeat(Math.max(0, this.player.lives)), 16, botY);

            ctx.fillStyle = C.neonYellow;
            ctx.fillText('💣 x' + this.player.bombs, 100, botY);

            ctx.fillStyle = C.neonBlue;
            ctx.textAlign = 'right';
            ctx.fillText('PWR LV.' + this.player.weaponTier, this.W - 16, botY);
        }

        _drawTitle(ctx) {
            ctx.textAlign = 'center';

            // Title glowing text
            ctx.fillStyle = C.neonBlue;
            ctx.font = '32px "Press Start 2P", monospace';
            ctx.shadowColor = C.neonBlue;
            ctx.shadowBlur = 20;
            ctx.fillText('SPACE', this.W / 2, 180);

            ctx.fillStyle = C.neonPink;
            ctx.font = '38px "Press Start 2P", monospace';
            ctx.shadowColor = C.neonPink;
            ctx.fillText('BLASTER', this.W / 2, 235);
            ctx.shadowBlur = 0;

            // Subtitle
            ctx.fillStyle = C.hudDim;
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText('RETRO ARCADE GALAXY DEFENDER', this.W / 2, 280);

            // Animated player ship showcase
            this.player.x = this.W / 2;
            this.player.y = 360;
            this.player.draw(ctx);

            // Start button
            const btnW = 320;
            const btnH = 50;
            const btnX = (this.W - btnW) / 2;
            const btnY = 460;
            const pulse = (Math.sin(Date.now() * 0.005) * 0.2 + 0.8);

            ctx.fillStyle = `rgba(0, 229, 255, ${pulse * 0.25})`;
            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeStyle = C.neonBlue;
            ctx.lineWidth = 2;
            ctx.strokeRect(btnX, btnY, btnW, btnH);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('▶ CLICK OR TAP TO PLAY', this.W / 2, btnY + 31);

            // Controls instructions
            ctx.fillStyle = '#667788';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('WASD / ARROWS / DRAG to MOVE', this.W / 2, 570);
            ctx.fillText('SPACE / TAP to FIRE — B to BOMB', this.W / 2, 595);

            // High score record
            ctx.fillStyle = C.neonYellow;
            ctx.fillText('ALL-TIME HIGH: ' + this.highScore, this.W / 2, 660);
        }

        _drawPause(ctx) {
            ctx.fillStyle = 'rgba(4, 4, 16, 0.7)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.fillStyle = C.neonBlue;
            ctx.font = '24px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', this.W / 2, this.H / 2 - 20);

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('CLICK OR PRESS ESC TO RESUME', this.W / 2, this.H / 2 + 25);
        }

        _drawWaveClear(ctx) {
            ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
            ctx.fillRect(0, this.H / 2 - 60, this.W, 120);

            ctx.fillStyle = C.neonYellow;
            ctx.font = '22px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SECTOR CLEARED!', this.W / 2, this.H / 2 - 10);

            ctx.fillStyle = '#ffffff';
            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillText('WARPING TO WAVE ' + (this.wave + 1), this.W / 2, this.H / 2 + 25);
        }

        _drawGameOver(ctx) {
            ctx.fillStyle = 'rgba(20, 0, 10, 0.8)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.fillStyle = C.laserRed;
            ctx.font = '32px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', this.W / 2, this.H / 2 - 40);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('FINAL SCORE: ' + this.score, this.W / 2, this.H / 2 + 15);

            ctx.fillStyle = C.hudDim;
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('CLICK OR ENTER TO RETRY', this.W / 2, this.H / 2 + 65);
        }

        _drawVictory(ctx) {
            ctx.fillStyle = 'rgba(0, 20, 30, 0.85)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.fillStyle = C.neonBlue;
            ctx.font = '26px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GALAXY SAVED!', this.W / 2, this.H / 2 - 50);

            ctx.fillStyle = C.neonYellow;
            ctx.font = '14px "Press Start 2P", monospace';
            ctx.fillText('VICTORY BONUS: +10,000', this.W / 2, this.H / 2);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('FINAL SCORE: ' + this.score, this.W / 2, this.H / 2 + 35);

            ctx.fillStyle = C.hudDim;
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('CLICK OR ENTER TO CONTINUE', this.W / 2, this.H / 2 + 80);
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

