/* ==========================================================================
   DUNGEON QUEST — Pixel Action RPG & Dungeon Crawler Engine
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // --- Canvas & Context Setup ---
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const VIEW_WIDTH = 720;
    const VIEW_HEIGHT = 540;

    canvas.width = VIEW_WIDTH;
    canvas.height = VIEW_HEIGHT;

    // --- Audio Engine ---
    class DungeonAudioEngine {
        constructor() {
            this.ctx = null;
            this.muted = localStorage.getItem('dungeon_quest_muted') === 'true';
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

        playSlash() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(420, now);
                osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);

                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.11);
            } catch (e) {}
        }

        playHit() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.13);
            } catch (e) {}
        }

        playSpell() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.linearRampToValueAtTime(680, now + 0.15);

                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.21);
            } catch (e) {}
        }

        playExplosion() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const bufferSize = this.ctx.sampleRate * 0.35;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
                }

                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(600, now);
                filter.frequency.linearRampToValueAtTime(100, now + 0.3);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                noise.start(now);
            } catch (e) {}
        }

        playDash() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(350, now);
                osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);

                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.16);
            } catch (e) {}
        }

        playCoin() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(987.77, now); // B5
                osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.22);
            } catch (e) {}
        }

        playChest() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

                    gain.gain.setValueAtTime(0.25, now + idx * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.08);
                    osc.stop(now + idx * 0.08 + 0.22);
                });
            } catch (e) {}
        }

        playLevelUp() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const notes = [440, 554.37, 659.25, 880, 1108.73];
                notes.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.09);

                    gain.gain.setValueAtTime(0.25, now + idx * 0.09);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.09);
                    osc.stop(now + idx * 0.09 + 0.27);
                });
            } catch (e) {}
        }

        playPlayerHurt() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.linearRampToValueAtTime(70, now + 0.18);

                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.19);
            } catch (e) {}
        }

        playGameOver() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const notes = [329.63, 311.13, 293.66, 277.18, 261.63, 220];
                notes.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.15);

                    gain.gain.setValueAtTime(0.25, now + idx * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.25);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.15);
                    osc.stop(now + idx * 0.15 + 0.26);
                });
            } catch (e) {}
        }
    }

    const audio = new DungeonAudioEngine();

    // --- Game States ---
    const STATE = {
        TITLE: 0,
        PLAYING: 1,
        FLOOR_CLEAR: 2,
        GAME_OVER: 3,
        VICTORY: 4
    };

    let gameState = STATE.TITLE;
    let currentFloor = 1;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('dungeon_quest_highscore') || '0', 10);
    let isPaused = false;
    let frameCount = 0;
    let screenShake = 0;

    // --- World & Camera Geometry ---
    const MAP_COLS = 48;
    const MAP_ROWS = 36;
    const TILE_SIZE = 36;
    const WORLD_WIDTH = MAP_COLS * TILE_SIZE; // 1728 px
    const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE; // 1296 px

    let camera = {
        x: 0,
        y: 0,
        follow(targetX, targetY) {
            this.x = targetX - VIEW_WIDTH / 2;
            this.y = targetY - VIEW_HEIGHT / 2;
            this.x = Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH, this.x));
            this.y = Math.max(0, Math.min(WORLD_HEIGHT - VIEW_HEIGHT, this.y));
        }
    };

    // --- Tiles & Map Grid ---
    const TILE_FLOOR = 0;
    const TILE_WALL = 1;
    const TILE_PILLAR = 2;
    const TILE_DOOR = 3;

    let dungeonGrid = [];
    let rooms = [];
    let torches = [];
    let portal = null;

    // --- Entities & Collections ---
    let player;
    let enemies = [];
    let projectiles = [];
    let particles = [];
    let floatingTexts = [];
    let lootItems = [];
    let slashEffects = [];

    // --- Input Handling ---
    const keys = {
        up: false,
        down: false,
        left: false,
        right: false,
        attack: false,
        spell: false,
        dash: false
    };

    let mouseWorldX = 0;
    let mouseWorldY = 0;

    // --- Player Class ---
    class Player {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 14;
            this.speed = 3.6;
            this.maxHp = 10;
            this.hp = 10;
            this.maxMana = 100;
            this.mana = 100;
            this.manaRegen = 0.3;
            this.gold = 0;
            this.xp = 0;
            this.level = 1;
            this.xpNext = 100;

            this.facingAngle = 0;
            this.attackCooldown = 0;
            this.dashCooldown = 0;
            this.dashDuration = 0;
            this.dashVx = 0;
            this.dashVy = 0;
            this.invulnerableTimer = 0;

            this.walkAnim = 0;
            this.isMoving = false;
        }

        update() {
            // Regeneration
            if (this.mana < this.maxMana) {
                this.mana = Math.min(this.maxMana, this.mana + this.manaRegen);
            }

            // Cooldowns
            if (this.attackCooldown > 0) this.attackCooldown--;
            if (this.dashCooldown > 0) this.dashCooldown--;
            if (this.invulnerableTimer > 0) this.invulnerableTimer--;

            // Facing angle follows mouse cursor in world
            this.facingAngle = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);

            // Dash movement
            if (this.dashDuration > 0) {
                this.dashDuration--;
                this.moveWithCollision(this.dashVx, this.dashVy);

                // Trail particle
                if (frameCount % 2 === 0) {
                    particles.push({
                        x: this.x,
                        y: this.y,
                        vx: 0,
                        vy: 0,
                        color: 'rgba(0, 210, 255, 0.5)',
                        size: 12,
                        life: 0.6,
                        decay: 0.08
                    });
                }
                return;
            }

            // Normal movement
            let dx = 0;
            let dy = 0;

            if (keys.up) dy -= 1;
            if (keys.down) dy += 1;
            if (keys.left) dx -= 1;
            if (keys.right) dx += 1;

            if (dx !== 0 && dy !== 0) {
                const norm = Math.SQRT1_2;
                dx *= norm;
                dy *= norm;
            }

            this.isMoving = (dx !== 0 || dy !== 0);
            if (this.isMoving) {
                this.walkAnim += 0.2;
                this.moveWithCollision(dx * this.speed, dy * this.speed);
            }

            // Attacks
            if (keys.attack && this.attackCooldown <= 0) {
                this.performSlash();
            }

            if (keys.spell && this.mana >= 30) {
                this.castFireball();
            }

            if (keys.dash && this.dashCooldown <= 0 && this.isMoving) {
                this.performDash(dx, dy);
            }

            // Portal touch check
            if (portal && portal.active) {
                const distToPortal = Math.hypot(this.x - portal.x, this.y - portal.y);
                if (distToPortal < 28) {
                    descendToNextFloor();
                }
            }
        }

        moveWithCollision(vx, vy) {
            // Horizontal move & collide
            const nextX = this.x + vx;
            if (!this.checkWallCollision(nextX, this.y)) {
                this.x = nextX;
            }

            // Vertical move & collide
            const nextY = this.y + vy;
            if (!this.checkWallCollision(this.x, nextY)) {
                this.y = nextY;
            }
        }

        checkWallCollision(x, y) {
            const r = this.radius;
            const points = [
                { x: x - r, y: y - r },
                { x: x + r, y: y - r },
                { x: x - r, y: y + r },
                { x: x + r, y: y + r }
            ];

            for (let pt of points) {
                const col = Math.floor(pt.x / TILE_SIZE);
                const row = Math.floor(pt.y / TILE_SIZE);
                if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return true;
                const tile = dungeonGrid[row][col];
                if (tile === TILE_WALL || tile === TILE_PILLAR) return true;
            }
            return false;
        }

        performSlash() {
            this.attackCooldown = 18; // frame delay
            audio.playSlash();

            const slashDist = 38;
            const slashAngle = this.facingAngle;

            slashEffects.push({
                x: this.x + Math.cos(slashAngle) * 22,
                y: this.y + Math.sin(slashAngle) * 22,
                angle: slashAngle,
                radius: 46,
                life: 1.0,
                decay: 0.1
            });

            // Strike enemies within cone
            const slashArc = Math.PI * 0.65; // ~120 degrees
            enemies.forEach(e => {
                if (!e.isAlive) return;
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist <= slashDist + e.radius) {
                    const angleToEnemy = Math.atan2(e.y - this.y, e.x - this.x);
                    let angleDiff = Math.abs(angleToEnemy - slashAngle);
                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                    if (angleDiff <= slashArc / 2) {
                        const dmg = 25 + (this.level - 1) * 6;
                        e.takeDamage(dmg, Math.cos(slashAngle) * 6, Math.sin(slashAngle) * 6);
                    }
                }
            });
        }

        castFireball() {
            this.mana -= 30;
            keys.spell = false; // single trigger
            audio.playSpell();

            const speed = 7.5;
            projectiles.push(new Projectile(
                this.x + Math.cos(this.facingAngle) * 16,
                this.y + Math.sin(this.facingAngle) * 16,
                Math.cos(this.facingAngle) * speed,
                Math.sin(this.facingAngle) * speed,
                true, // isPlayer
                50 + (this.level - 1) * 10
            ));
        }

        performDash(dx, dy) {
            audio.playDash();
            this.dashCooldown = 50; // 0.8s
            this.dashDuration = 10;
            const dashSpeed = 8.5;
            this.dashVx = dx * dashSpeed;
            this.dashVy = dy * dashSpeed;
            this.invulnerableTimer = 16;
            keys.dash = false;
        }

        takeDamage(dmg) {
            if (this.invulnerableTimer > 0 || this.dashDuration > 0) return;

            this.hp = Math.max(0, this.hp - dmg);
            this.invulnerableTimer = 35;
            screenShake = 10;
            audio.playPlayerHurt();
            createBloodSplatter(this.x, this.y, '#ff2a5f');

            if (this.hp <= 0) {
                gameState = STATE.GAME_OVER;
                audio.playGameOver();
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('dungeon_quest_highscore', highScore.toString());
                }
            }
        }

        gainXp(amount) {
            this.xp += amount;
            score += amount * 10;

            if (this.xp >= this.xpNext) {
                this.level++;
                this.xp -= this.xpNext;
                this.xpNext = Math.floor(this.xpNext * 1.5);
                this.maxHp += 2;
                this.hp = this.maxHp;
                this.mana = this.maxMana;
                audio.playLevelUp();
                screenShake = 12;
                addFloatingText(`LEVEL UP! LVL ${this.level}`, this.x, this.y - 30, '#ffd700');
                createHolyAura(this.x, this.y);
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Flashing during invulnerability
            if (this.invulnerableTimer > 0 && Math.floor(frameCount / 4) % 2 === 0) {
                ctx.globalAlpha = 0.4;
            }

            // Hero shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.ellipse(0, 10, 12, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cape behind player
            const capeWave = Math.sin(this.walkAnim) * 4;
            ctx.fillStyle = '#b71c1c';
            ctx.beginPath();
            ctx.moveTo(-6, 2);
            ctx.lineTo(6, 2);
            ctx.lineTo(8 + capeWave, 16);
            ctx.lineTo(-8 + capeWave, 16);
            ctx.closePath();
            ctx.fill();

            // Plate Armor Body
            ctx.fillStyle = '#cfd8dc';
            ctx.strokeStyle = '#37474f';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(-8, -8, 16, 16, 4);
            ctx.fill();
            ctx.stroke();

            // Gold chestplate insignia
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-3, -4, 6, 8);

            // Helmet & Glowing Blue Visor
            ctx.fillStyle = '#90a4ae';
            ctx.fillRect(-7, -18, 14, 11);
            ctx.strokeStyle = '#263238';
            ctx.strokeRect(-7, -18, 14, 11);

            // Visor slit
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 6;
            ctx.fillRect(-4, -14, 8, 3);
            ctx.shadowBlur = 0;

            // Weapon in hand (Sword tracking facing angle)
            ctx.save();
            ctx.rotate(this.facingAngle);
            ctx.fillStyle = '#cfd8dc';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            // Blade
            ctx.fillRect(8, -2, 20, 4);
            ctx.strokeRect(8, -2, 20, 4);
            // Crossguard & pommel
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(6, -6, 3, 12);
            ctx.fillRect(3, -2, 3, 4);
            ctx.restore();

            ctx.restore();
        }
    }

    // --- Enemy Class & Variants ---
    const ENEMY_TYPE = {
        SLIME: 1,
        SKELETON: 2,
        NECROMANCER: 3,
        BOSS: 4
    };

    class Enemy {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.isAlive = true;
            this.vx = 0;
            this.vy = 0;
            this.flashTimer = 0;
            this.animTimer = Math.random() * 10;
            this.shootCooldown = 60 + Math.floor(Math.random() * 60);

            switch (type) {
                case ENEMY_TYPE.SLIME:
                    this.radius = 13;
                    this.maxHp = 30;
                    this.hp = 30;
                    this.speed = 2.0;
                    this.xpValue = 25;
                    this.color = '#39ff14';
                    break;
                case ENEMY_TYPE.SKELETON:
                    this.radius = 14;
                    this.maxHp = 60;
                    this.hp = 60;
                    this.speed = 2.4;
                    this.xpValue = 45;
                    this.color = '#eceff1';
                    break;
                case ENEMY_TYPE.NECROMANCER:
                    this.radius = 15;
                    this.maxHp = 50;
                    this.hp = 50;
                    this.speed = 1.6;
                    this.xpValue = 65;
                    this.color = '#b026ff';
                    break;
                case ENEMY_TYPE.BOSS:
                    this.radius = 32;
                    this.maxHp = 350 + (currentFloor - 1) * 200;
                    this.hp = this.maxHp;
                    this.speed = 1.9;
                    this.xpValue = 250;
                    this.color = '#ff1744';
                    this.bossAttackTimer = 0;
                    break;
            }
        }

        update() {
            if (!this.isAlive) return;

            this.animTimer += 0.1;
            if (this.flashTimer > 0) this.flashTimer--;

            // Friction from knockback
            this.vx *= 0.85;
            this.vy *= 0.85;

            // Distance to player
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);

            // AI Behaviors
            if (dist < 400) {
                const angle = Math.atan2(dy, dx);

                if (this.type === ENEMY_TYPE.SLIME) {
                    // Slime hop pulse
                    const hop = Math.sin(this.animTimer * 2);
                    if (hop > 0.4) {
                        this.moveWithCollision(Math.cos(angle) * this.speed * 1.6 + this.vx, Math.sin(angle) * this.speed * 1.6 + this.vy);
                    } else {
                        this.moveWithCollision(this.vx, this.vy);
                    }
                } else if (this.type === ENEMY_TYPE.SKELETON) {
                    // March directly towards hero
                    this.moveWithCollision(Math.cos(angle) * this.speed + this.vx, Math.sin(angle) * this.speed + this.vy);
                } else if (this.type === ENEMY_TYPE.NECROMANCER) {
                    // Kites away if player is close, casts homing dark bolts
                    if (dist < 140) {
                        this.moveWithCollision(-Math.cos(angle) * this.speed + this.vx, -Math.sin(angle) * this.speed + this.vy);
                    } else if (dist > 220) {
                        this.moveWithCollision(Math.cos(angle) * this.speed + this.vx, Math.sin(angle) * this.speed + this.vy);
                    } else {
                        this.moveWithCollision(this.vx, this.vy);
                    }

                    // Cast dark bolt
                    this.shootCooldown--;
                    if (this.shootCooldown <= 0) {
                        this.shootCooldown = 90;
                        projectiles.push(new Projectile(
                            this.x,
                            this.y,
                            Math.cos(angle) * 4.2,
                            Math.sin(angle) * 4.2,
                            false, // isPlayer
                            1
                        ));
                        audio.playSpell();
                    }
                } else if (this.type === ENEMY_TYPE.BOSS) {
                    // Boss AI: Charge & Radial Shockwave
                    this.moveWithCollision(Math.cos(angle) * this.speed + this.vx, Math.sin(angle) * this.speed + this.vy);
                    this.bossAttackTimer++;

                    if (this.bossAttackTimer >= 140) {
                        this.bossAttackTimer = 0;
                        // Fire 8-way fireballs
                        audio.playExplosion();
                        screenShake = 8;
                        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                            projectiles.push(new Projectile(
                                this.x,
                                this.y,
                                Math.cos(a) * 4.0,
                                Math.sin(a) * 4.0,
                                false,
                                2
                            ));
                        }
                    }
                }

                // Melee contact damage to player
                if (dist < this.radius + player.radius) {
                    player.takeDamage(this.type === ENEMY_TYPE.BOSS ? 2 : 1);
                }
            } else {
                this.moveWithCollision(this.vx, this.vy);
            }
        }

        moveWithCollision(vx, vy) {
            const nextX = this.x + vx;
            if (!this.checkWallCollision(nextX, this.y)) {
                this.x = nextX;
            }
            const nextY = this.y + vy;
            if (!this.checkWallCollision(this.x, nextY)) {
                this.y = nextY;
            }
        }

        checkWallCollision(x, y) {
            const r = this.radius;
            const points = [
                { x: x - r, y: y - r },
                { x: x + r, y: y - r },
                { x: x - r, y: y + r },
                { x: x + r, y: y + r }
            ];

            for (let pt of points) {
                const col = Math.floor(pt.x / TILE_SIZE);
                const row = Math.floor(pt.y / TILE_SIZE);
                if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return true;
                const tile = dungeonGrid[row][col];
                if (tile === TILE_WALL || tile === TILE_PILLAR) return true;
            }
            return false;
        }

        takeDamage(dmg, knockX = 0, knockY = 0) {
            this.hp -= dmg;
            this.flashTimer = 8;
            this.vx += knockX;
            this.vy += knockY;
            audio.playHit();
            addFloatingText(`-${dmg}`, this.x, this.y - 14, '#ff2a5f');
            createBloodSplatter(this.x, this.y, this.color);

            if (this.hp <= 0) {
                this.die();
            }
        }

        die() {
            this.isAlive = false;
            player.gainXp(this.xpValue);
            createBloodSplatter(this.x, this.y, this.color, 24);

            // Slime split mechanic
            if (this.type === ENEMY_TYPE.SLIME && this.radius > 8) {
                const mini1 = new Enemy(this.x + 8, this.y, ENEMY_TYPE.SLIME);
                mini1.radius = 8;
                mini1.maxHp = 12;
                mini1.hp = 12;
                mini1.speed = 2.4;
                const mini2 = new Enemy(this.x - 8, this.y, ENEMY_TYPE.SLIME);
                mini2.radius = 8;
                mini2.maxHp = 12;
                mini2.hp = 12;
                mini2.speed = 2.4;
                enemies.push(mini1, mini2);
            }

            // Drop loot (Gold coins, hearts, potions)
            const dropRoll = Math.random();
            if (dropRoll < 0.45) {
                lootItems.push(new LootItem(this.x, this.y, 'gold'));
            } else if (dropRoll < 0.65) {
                lootItems.push(new LootItem(this.x, this.y, 'heart'));
            } else if (dropRoll < 0.80) {
                lootItems.push(new LootItem(this.x, this.y, 'mana'));
            }

            // Check if boss died
            if (this.type === ENEMY_TYPE.BOSS) {
                audio.playChest();
                screenShake = 16;
                addFloatingText('BOSS SLAIN!', this.x, this.y - 40, '#ffd700');
                lootItems.push(new LootItem(this.x - 20, this.y, 'gold_chest'));
                // Activate portal
                if (portal) portal.active = true;
            }

            // Check if all enemies in dungeon cleared
            checkDungeonClear();
        }

        draw(ctx) {
            if (!this.isAlive) return;

            ctx.save();
            ctx.translate(this.x, this.y);

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(0, this.radius * 0.7, this.radius, this.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Flash white on hit
            if (this.flashTimer > 0) {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                return;
            }

            if (this.type === ENEMY_TYPE.SLIME) {
                // Jiggling green slime
                const squishX = 1 + Math.sin(this.animTimer * 2) * 0.2;
                const squishY = 1 - Math.sin(this.animTimer * 2) * 0.2;

                ctx.fillStyle = '#00e676';
                ctx.beginPath();
                ctx.ellipse(0, 0, this.radius * squishX, this.radius * squishY, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#00b0ff';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Slime cute eyes
                ctx.fillStyle = '#111';
                ctx.fillRect(-5, -4, 3, 4);
                ctx.fillRect(2, -4, 3, 4);
                ctx.fillStyle = '#fff';
                ctx.fillRect(-5, -4, 1, 2);
                ctx.fillRect(2, -4, 1, 2);
            } else if (this.type === ENEMY_TYPE.SKELETON) {
                // Skull & Bone Body
                ctx.fillStyle = '#cfd8dc';
                ctx.fillRect(-6, -6, 12, 12);
                // Skull
                ctx.fillStyle = '#eceff1';
                ctx.fillRect(-7, -16, 14, 11);
                // Red glowing eye sockets
                ctx.fillStyle = '#ff1744';
                ctx.shadowColor = '#ff1744';
                ctx.shadowBlur = 6;
                ctx.fillRect(-5, -12, 3, 3);
                ctx.fillRect(2, -12, 3, 3);
                ctx.shadowBlur = 0;
                // Bone Sword
                ctx.fillStyle = '#b0bec5';
                ctx.fillRect(7, -8, 4, 16);
            } else if (this.type === ENEMY_TYPE.NECROMANCER) {
                // Purple Cultist Robe & Hood
                ctx.fillStyle = '#4a148c';
                ctx.beginPath();
                ctx.moveTo(0, -18);
                ctx.lineTo(10, 10);
                ctx.lineTo(-10, 10);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#b026ff';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Glowing yellow eyes inside dark hood
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 6;
                ctx.fillRect(-4, -6, 2, 2);
                ctx.fillRect(2, -6, 2, 2);
                ctx.shadowBlur = 0;

                // Magic Staff with floating crystal
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(9, -12, 3, 24);
                ctx.fillStyle = '#b026ff';
                ctx.shadowColor = '#b026ff';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(10.5, -16, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (this.type === ENEMY_TYPE.BOSS) {
                // Giant Minotaur / Demon Lord
                ctx.fillStyle = '#b71c1c';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Horns
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.moveTo(-18, -20);
                ctx.lineTo(-28, -40);
                ctx.lineTo(-10, -26);
                ctx.closePath();
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(18, -20);
                ctx.lineTo(28, -40);
                ctx.lineTo(10, -26);
                ctx.closePath();
                ctx.fill();

                // Fierce Glowing Eyes
                ctx.fillStyle = '#ffea00';
                ctx.shadowColor = '#ffea00';
                ctx.shadowBlur = 8;
                ctx.fillRect(-12, -8, 6, 4);
                ctx.fillRect(6, -8, 6, 4);
                ctx.shadowBlur = 0;

                // Giant battle axe
                ctx.fillStyle = '#37474f';
                ctx.fillRect(24, -20, 6, 40);
                ctx.fillStyle = '#90a4ae';
                ctx.fillRect(20, -32, 14, 18);
            }

            // Health bar above enemy
            if (this.hp < this.maxHp) {
                const barW = this.radius * 2;
                const barH = 4;
                const barY = -this.radius - 12;
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(-barW / 2, barY, barW, barH);
                ctx.fillStyle = '#ff1744';
                ctx.fillRect(-barW / 2, barY, (this.hp / this.maxHp) * barW, barH);
            }

            ctx.restore();
        }
    }

    // --- Projectile Class ---
    class Projectile {
        constructor(x, y, vx, vy, isPlayer, damage) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.isPlayer = isPlayer;
            this.damage = damage;
            this.radius = isPlayer ? 7 : 5;
            this.isAlive = true;
            this.life = 120; // 2 seconds
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life--;

            // Trail particle
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                color: this.isPlayer ? '#ff7700' : '#b026ff',
                size: this.radius * 0.8,
                life: 0.6,
                decay: 0.08
            });

            // Wall collision
            const col = Math.floor(this.x / TILE_SIZE);
            const row = Math.floor(this.y / TILE_SIZE);
            if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS ||
                dungeonGrid[row][col] === TILE_WALL || dungeonGrid[row][col] === TILE_PILLAR ||
                this.life <= 0) {

                this.isAlive = false;
                audio.playExplosion();
                createExplosionSparks(this.x, this.y, this.isPlayer ? '#ffea00' : '#b026ff');
                return;
            }

            // Target collision
            if (this.isPlayer) {
                for (let e of enemies) {
                    if (e.isAlive && Math.hypot(e.x - this.x, e.y - this.y) <= e.radius + this.radius) {
                        this.isAlive = false;
                        audio.playExplosion();
                        createExplosionSparks(this.x, this.y, '#ffea00');
                        e.takeDamage(this.damage, this.vx * 0.4, this.vy * 0.4);
                        break;
                    }
                }
            } else {
                if (Math.hypot(player.x - this.x, player.y - this.y) <= player.radius + this.radius) {
                    this.isAlive = false;
                    audio.playExplosion();
                    createExplosionSparks(this.x, this.y, '#b026ff');
                    player.takeDamage(this.damage);
                }
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.shadowColor = this.isPlayer ? '#ffea00' : '#b026ff';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = this.isPlayer ? '#ff7700' : '#b026ff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // --- Loot Items (Gold, Hearts, Mana, Chests) ---
    class LootItem {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.isAlive = true;
            this.anim = Math.random() * 5;
        }

        update() {
            this.anim += 0.08;

            // Pick up by player
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            if (dist < player.radius + 14) {
                this.isAlive = false;

                if (this.type === 'gold') {
                    player.gold += 15;
                    score += 150;
                    audio.playCoin();
                    addFloatingText('+15 GOLD', this.x, this.y - 10, '#ffd700');
                } else if (this.type === 'heart') {
                    if (player.hp < player.maxHp) {
                        player.hp = Math.min(player.maxHp, player.hp + 2);
                        audio.playCoin();
                        addFloatingText('+1 HEART', this.x, this.y - 10, '#ff2a5f');
                    }
                } else if (this.type === 'mana') {
                    player.mana = Math.min(player.maxMana, player.mana + 40);
                    audio.playCoin();
                    addFloatingText('+40 MANA', this.x, this.y - 10, '#00d2ff');
                } else if (this.type === 'gold_chest') {
                    player.gold += 100;
                    score += 1000;
                    audio.playChest();
                    addFloatingText('+100 GOLD & BOSS RELIC!', this.x, this.y - 20, '#ffd700');
                    createHolyAura(this.x, this.y);
                }
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y + Math.sin(this.anim) * 3);

            if (this.type === 'gold') {
                ctx.fillStyle = '#ffd700';
                ctx.strokeStyle = '#b78103';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else if (this.type === 'heart') {
                ctx.fillStyle = '#ff1744';
                ctx.font = '12px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('♥', 0, 4);
            } else if (this.type === 'mana') {
                ctx.fillStyle = '#00d2ff';
                ctx.font = '12px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('💧', 0, 4);
            } else if (this.type === 'gold_chest') {
                // Chest graphic
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-12, -8, 24, 16);
                ctx.strokeStyle = '#5d4037';
                ctx.lineWidth = 2;
                ctx.strokeRect(-12, -8, 24, 16);
                ctx.fillStyle = '#ff1744';
                ctx.fillRect(-3, -2, 6, 6);
            }

            ctx.restore();
        }
    }

    // --- Particle & Visual Helpers ---
    function createBloodSplatter(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Math.random() * 3 + 2,
                life: 1.0,
                decay: Math.random() * 0.04 + 0.02
            });
        }
    }

    function createExplosionSparks(x, y, color) {
        for (let i = 0; i < 18; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1.5;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Math.random() * 4 + 2,
                life: 1.0,
                decay: 0.05
            });
        }
    }

    function createHolyAura(x, y) {
        for (let i = 0; i < 28; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                x: x + Math.cos(angle) * 15,
                y: y + Math.sin(angle) * 15,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2 - 1.5,
                color: '#ffd700',
                size: 3,
                life: 1.0,
                decay: 0.03
            });
        }
    }

    function addFloatingText(text, x, y, color = '#ffffff') {
        floatingTexts.push({
            text: text,
            x: x,
            y: y,
            vy: -1.2,
            life: 1.0,
            color: color
        });
    }

    // --- Procedural Dungeon Generation ---
    function generateDungeon(floor) {
        dungeonGrid = [];
        rooms = [];
        torches = [];
        enemies = [];
        projectiles = [];
        particles = [];
        floatingTexts = [];
        lootItems = [];
        slashEffects = [];

        // Fill with solid walls initially
        for (let r = 0; r < MAP_ROWS; r++) {
            dungeonGrid[r] = [];
            for (let c = 0; c < MAP_COLS; c++) {
                dungeonGrid[r][c] = TILE_WALL;
            }
        }

        // Room Grid Layout (3x3 chambers)
        const roomCols = 3;
        const roomRows = 3;
        const cellW = Math.floor(MAP_COLS / roomCols);
        const cellH = Math.floor(MAP_ROWS / roomRows);

        for (let r = 0; r < roomRows; r++) {
            for (let c = 0; c < roomCols; c++) {
                const rw = Math.floor(Math.random() * 3) + (cellW - 5);
                const rh = Math.floor(Math.random() * 3) + (cellH - 4);
                const rx = c * cellW + 2;
                const ry = r * cellH + 2;

                rooms.push({
                    col: c,
                    row: r,
                    x: rx,
                    y: ry,
                    w: rw,
                    h: rh,
                    centerX: rx + Math.floor(rw / 2),
                    centerY: ry + Math.floor(rh / 2),
                    isBoss: (r === roomRows - 1 && c === roomCols - 1),
                    isSpawn: (r === 0 && c === 0)
                });

                // Carve room floor
                for (let y = ry; y < ry + rh; y++) {
                    for (let x = rx; x < rx + rw; x++) {
                        dungeonGrid[y][x] = TILE_FLOOR;
                    }
                }

                // Add corner pillars in larger rooms
                if (rw > 9 && rh > 7) {
                    dungeonGrid[ry + 2][rx + 2] = TILE_PILLAR;
                    dungeonGrid[ry + 2][rx + rw - 3] = TILE_PILLAR;
                    dungeonGrid[ry + rh - 3][rx + 2] = TILE_PILLAR;
                    dungeonGrid[ry + rh - 3][rx + rw - 3] = TILE_PILLAR;
                }

                // Add wall torches
                torches.push({
                    x: (rx + Math.floor(rw / 2)) * TILE_SIZE + TILE_SIZE / 2,
                    y: ry * TILE_SIZE + 6
                });
            }
        }

        // Connect rooms with corridors
        for (let i = 0; i < rooms.length; i++) {
            const current = rooms[i];
            // Connect to right neighbor
            if (current.col < roomCols - 1) {
                const rightNeighbor = rooms[i + 1];
                carveCorridor(current.centerX, current.centerY, rightNeighbor.centerX, rightNeighbor.centerY);
            }
            // Connect to bottom neighbor
            if (current.row < roomRows - 1) {
                const bottomNeighbor = rooms[i + roomCols];
                carveCorridor(current.centerX, current.centerY, bottomNeighbor.centerX, bottomNeighbor.centerY);
            }
        }

        // Setup Player at Spawn room
        const spawnRoom = rooms[0];
        if (!player) {
            player = new Player(spawnRoom.centerX * TILE_SIZE, spawnRoom.centerY * TILE_SIZE);
        } else {
            player.x = spawnRoom.centerX * TILE_SIZE;
            player.y = spawnRoom.centerY * TILE_SIZE;
        }

        // Setup Boss Room & Exit Portal
        const bossRoom = rooms[rooms.length - 1];
        portal = {
            x: bossRoom.centerX * TILE_SIZE,
            y: bossRoom.centerY * TILE_SIZE,
            active: false
        };

        // Spawn Boss in Boss Room
        enemies.push(new Enemy(
            bossRoom.centerX * TILE_SIZE,
            bossRoom.centerY * TILE_SIZE,
            ENEMY_TYPE.BOSS
        ));

        // Spawn Monsters in other rooms
        for (let i = 1; i < rooms.length - 1; i++) {
            const rm = rooms[i];
            const enemyCount = Math.floor(Math.random() * 2) + 2 + Math.floor(floor * 0.8);

            for (let j = 0; j < enemyCount; j++) {
                const ex = (rm.x + 2 + Math.floor(Math.random() * (rm.w - 4))) * TILE_SIZE;
                const ey = (rm.y + 2 + Math.floor(Math.random() * (rm.h - 4))) * TILE_SIZE;

                let enemyType = ENEMY_TYPE.SLIME;
                const roll = Math.random();
                if (roll > 0.65) enemyType = ENEMY_TYPE.NECROMANCER;
                else if (roll > 0.3) enemyType = ENEMY_TYPE.SKELETON;

                enemies.push(new Enemy(ex, ey, enemyType));
            }
        }
    }

    function carveCorridor(x1, y1, x2, y2) {
        let x = x1;
        let y = y1;

        while (x !== x2) {
            dungeonGrid[y][x] = TILE_FLOOR;
            dungeonGrid[Math.min(MAP_ROWS - 1, y + 1)][x] = TILE_FLOOR; // 2 tiles wide corridor
            x += (x2 > x) ? 1 : -1;
        }

        while (y !== y2) {
            dungeonGrid[y][x] = TILE_FLOOR;
            dungeonGrid[y][Math.min(MAP_COLS - 1, x + 1)] = TILE_FLOOR;
            y += (y2 > y) ? 1 : -1;
        }
    }

    function checkDungeonClear() {
        const remaining = enemies.filter(e => e.isAlive);
        if (remaining.length === 0 && portal) {
            portal.active = true;
        }
    }

    function descendToNextFloor() {
        audio.playLevelUp();
        currentFloor++;
        score += 1500;
        addFloatingText(`DESCENDED TO FLOOR ${currentFloor}!`, player.x, player.y - 20, '#ffd700');
        generateDungeon(currentFloor);
    }

    function startNewGame() {
        currentFloor = 1;
        score = 0;
        player = null;
        generateDungeon(1);
        gameState = STATE.PLAYING;
    }

    // --- Main Update Loop ---
    function update() {
        frameCount++;

        if (screenShake > 0) {
            screenShake *= 0.88;
            if (screenShake < 0.2) screenShake = 0;
        }

        if (isPaused) return;

        if (gameState === STATE.PLAYING) {
            player.update();
            camera.follow(player.x, player.y);

            // Enemies update
            for (let i = enemies.length - 1; i >= 0; i--) {
                const e = enemies[i];
                e.update();
                if (!e.isAlive) enemies.splice(i, 1);
            }

            // Projectiles update
            for (let i = projectiles.length - 1; i >= 0; i--) {
                const p = projectiles[i];
                p.update();
                if (!p.isAlive) projectiles.splice(i, 1);
            }

            // Loot Items update
            for (let i = lootItems.length - 1; i >= 0; i--) {
                const item = lootItems[i];
                item.update();
                if (!item.isAlive) lootItems.splice(i, 1);
            }

            // Slash effects update
            for (let i = slashEffects.length - 1; i >= 0; i--) {
                const s = slashEffects[i];
                s.life -= s.decay;
                if (s.life <= 0) slashEffects.splice(i, 1);
            }

            // Particles update
            for (let i = particles.length - 1; i >= 0; i--) {
                const pt = particles[i];
                pt.x += pt.vx;
                pt.y += pt.vy;
                pt.life -= pt.decay;
                if (pt.life <= 0) particles.splice(i, 1);
            }

            // Floating texts update
            for (let i = floatingTexts.length - 1; i >= 0; i--) {
                const txt = floatingTexts[i];
                txt.y += txt.vy;
                txt.life -= 0.02;
                if (txt.life <= 0) floatingTexts.splice(i, 1);
            }
        }
    }

    // --- Main Render / Drawing Loop ---
    function render() {
        ctx.save();

        // Screen Shake
        if (screenShake > 0) {
            const shakeX = (Math.random() * 2 - 1) * screenShake;
            const shakeY = (Math.random() * 2 - 1) * screenShake;
            ctx.translate(shakeX, shakeY);
        }

        // Clear Viewport
        ctx.fillStyle = '#06040a';
        ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

        if (gameState === STATE.TITLE) {
            drawTitleScreen(ctx);
            ctx.restore();
            return;
        }

        // Camera Offset
        ctx.save();
        ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

        // Draw Dungeon Tiles
        drawDungeonTiles(ctx);

        // Draw Exit Portal
        if (portal) {
            drawPortal(ctx);
        }

        // Draw Loot Items
        lootItems.forEach(item => item.draw(ctx));

        // Draw Torches
        torches.forEach(t => {
            // Flickering light circle
            const flicker = Math.sin(frameCount * 0.15 + t.x) * 4;
            const grad = ctx.createRadialGradient(t.x, t.y, 4, t.x, t.y, 48 + flicker);
            grad.addColorStop(0, 'rgba(255, 170, 0, 0.35)');
            grad.addColorStop(1, 'rgba(255, 170, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 48 + flicker, 0, Math.PI * 2);
            ctx.fill();

            // Torch flame
            ctx.fillStyle = '#ff7700';
            ctx.fillRect(t.x - 2, t.y - 4, 4, 6);
            ctx.fillStyle = '#ffea00';
            ctx.fillRect(t.x - 1, t.y - 6, 2, 4);
        });

        // Draw Enemies
        enemies.forEach(e => e.draw(ctx));

        // Draw Player
        player.draw(ctx);

        // Draw Sword Slashes
        for (let s of slashEffects) {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.angle);
            ctx.globalAlpha = s.life;
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, s.radius, -Math.PI * 0.3, Math.PI * 0.3);
            ctx.stroke();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }

        // Draw Projectiles
        projectiles.forEach(p => p.draw(ctx));

        // Draw Particles
        for (let pt of particles) {
            ctx.save();
            ctx.globalAlpha = pt.life;
            ctx.fillStyle = pt.color;
            ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
            ctx.restore();
        }

        // Draw Floating Texts
        for (let txt of floatingTexts) {
            ctx.save();
            ctx.globalAlpha = txt.life;
            ctx.shadowColor = txt.color;
            ctx.shadowBlur = 6;
            ctx.fillStyle = txt.color;
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(txt.text, txt.x, txt.y);
            ctx.restore();
        }

        ctx.restore(); // End Camera Offset

        // Draw Top HUD & Minimap
        drawHUD(ctx);
        drawMinimap(ctx);

        // Game Over Overlay
        if (gameState === STATE.GAME_OVER) {
            drawGameOverScreen(ctx);
        }

        // Pause Overlay
        if (isPaused) {
            drawPauseScreen(ctx);
        }

        ctx.restore();
    }

    function drawDungeonTiles(ctx) {
        const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE));
        const endCol = Math.min(MAP_COLS - 1, Math.ceil((camera.x + VIEW_WIDTH) / TILE_SIZE));
        const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE));
        const endRow = Math.min(MAP_ROWS - 1, Math.ceil((camera.y + VIEW_HEIGHT) / TILE_SIZE));

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const tile = dungeonGrid[r][c];
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;

                if (tile === TILE_FLOOR) {
                    // Dark stone cobblestone
                    ctx.fillStyle = (r + c) % 2 === 0 ? '#1b1426' : '#221a30';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
                } else if (tile === TILE_WALL) {
                    // Medieval stone wall
                    ctx.fillStyle = '#2f2342';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#43345e';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

                    // Stone brick pattern lines
                    ctx.fillStyle = '#181122';
                    ctx.fillRect(x, y + 16, TILE_SIZE, 2);
                    ctx.fillRect(x + 16, y, 2, 16);
                    ctx.fillRect(x + 8, y + 16, 2, 20);
                } else if (tile === TILE_PILLAR) {
                    // Carved stone pillar
                    ctx.fillStyle = '#1b1426';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#5c487a';
                    ctx.beginPath();
                    ctx.roundRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8, 4);
                    ctx.fill();
                    ctx.strokeStyle = '#ffd700';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }
        }
    }

    function drawPortal(ctx) {
        ctx.save();
        const pulse = Math.sin(frameCount * 0.1) * 4;
        const color = portal.active ? '#00f0ff' : '#4a148c';

        ctx.shadowColor = color;
        ctx.shadowBlur = portal.active ? 20 : 6;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        // Magic Portal Circle
        ctx.beginPath();
        ctx.arc(portal.x, portal.y, 22 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = portal.active ? 'rgba(0, 240, 255, 0.35)' : 'rgba(74, 20, 140, 0.35)';
        ctx.fill();

        // Runes
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(portal.active ? 'EXIT' : 'LOCKED', portal.x, portal.y);

        ctx.restore();
    }

    function drawHUD(ctx) {
        ctx.save();

        // HUD Banner
        ctx.fillStyle = 'rgba(10, 6, 18, 0.85)';
        ctx.fillRect(0, 0, VIEW_WIDTH, 44);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 44);
        ctx.lineTo(VIEW_WIDTH, 44);
        ctx.stroke();

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textBaseline = 'middle';

        // Hearts (HP)
        let heartStr = '';
        for (let i = 0; i < Math.ceil(player.hp / 2); i++) heartStr += '♥ ';
        ctx.fillStyle = '#ff2a5f';
        ctx.textAlign = 'left';
        ctx.fillText(heartStr, 14, 22);

        // Mana Bar
        const manaW = 80;
        const manaH = 8;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(160, 18, manaW, manaH);
        ctx.fillStyle = '#00d2ff';
        ctx.fillRect(160, 18, (player.mana / player.maxMana) * manaW, manaH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(160, 18, manaW, manaH);

        // Floor #
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText(`FLOOR ${currentFloor}`, VIEW_WIDTH / 2 - 40, 22);

        // Gold Coins
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'left';
        ctx.fillText(`💰 ${player.gold}`, VIEW_WIDTH / 2 + 50, 22);

        // Level & Score
        ctx.fillStyle = '#00e676';
        ctx.fillText(`LVL ${player.level}`, VIEW_WIDTH / 2 + 150, 22);

        ctx.restore();
    }

    function drawMinimap(ctx) {
        ctx.save();
        const mapW = 80;
        const mapH = 60;
        const mapX = VIEW_WIDTH - mapW - 14;
        const mapY = 56;

        ctx.fillStyle = 'rgba(8, 4, 16, 0.85)';
        ctx.fillRect(mapX, mapY, mapW, mapH);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(mapX, mapY, mapW, mapH);

        const scaleX = mapW / WORLD_WIDTH;
        const scaleY = mapH / WORLD_HEIGHT;

        // Player dot
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(mapX + player.x * scaleX - 2, mapY + player.y * scaleY - 2, 4, 4);

        // Portal dot
        if (portal) {
            ctx.fillStyle = portal.active ? '#39ff14' : '#ff1744';
            ctx.fillRect(mapX + portal.x * scaleX - 2, mapY + portal.y * scaleY - 2, 4, 4);
        }

        ctx.restore();
    }

    function drawTitleScreen(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(6, 4, 12, 0.92)';
        ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

        const cx = VIEW_WIDTH / 2;

        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ffd700';
        ctx.font = '26px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DUNGEON QUEST', cx, 180);

        ctx.shadowColor = '#ff2a5f';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#ff2a5f';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText('PIXEL ACTION RPG & DUNGEON CRAWLER', cx, 220);

        const pulse = (Math.sin(frameCount * 0.08) + 1) * 0.5;
        ctx.shadowBlur = 0;
        ctx.fillStyle = pulse > 0.3 ? '#00f0ff' : 'rgba(0, 240, 255, 0.4)';
        ctx.font = '13px "Press Start 2P", monospace';
        ctx.fillText('CLICK / TAP / SPACE TO START', cx, 320);

        // Instructions
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText('[W][A][S][D] / ARROWS : MOVE HERO', cx, 380);
        ctx.fillText('[LEFT CLICK] / [J] : SWORD SLASH', cx, 410);
        ctx.fillText('[RIGHT CLICK] / [K] : FIREBALL SPELL (30 MP)', cx, 440);
        ctx.fillText('[SPACE] / [L] : DODGE ROLL / DASH', cx, 470);

        ctx.restore();
    }

    function drawGameOverScreen(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(6, 4, 12, 0.9)';
        ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

        const cx = VIEW_WIDTH / 2;
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#ff1744';
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('YOU HAVE FALLEN', cx, 200);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(`FLOORS EXPLORED: ${currentFloor}`, cx, 260);
        ctx.fillText(`GOLD COLLECTED: ${player.gold}`, cx, 300);
        ctx.fillText(`FINAL SCORE: ${score}`, cx, 340);

        ctx.fillStyle = '#ffd700';
        ctx.fillText(`HIGH SCORE: ${highScore}`, cx, 380);

        const pulse = (Math.sin(frameCount * 0.08) + 1) * 0.5;
        ctx.fillStyle = pulse > 0.3 ? '#00f0ff' : 'rgba(0, 240, 255, 0.3)';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText('CLICK / TAP / SPACE TO TRY AGAIN', cx, 460);

        ctx.restore();
    }

    function drawPauseScreen(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(6, 4, 12, 0.85)';
        ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

        ctx.shadowColor = '#00d2ff';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#00d2ff';
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('QUEST PAUSED', VIEW_WIDTH / 2, VIEW_HEIGHT / 2);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('PRESS [P] OR PAUSE BUTTON TO RESUME', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 50);

        ctx.restore();
    }

    // --- Input & Event Listeners ---
    function updateMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const scaleX = VIEW_WIDTH / rect.width;
        const scaleY = VIEW_HEIGHT / rect.height;
        const viewX = (clientX - rect.left) * scaleX;
        const viewY = (clientY - rect.top) * scaleY;
        mouseWorldX = viewX + camera.x;
        mouseWorldY = viewY + camera.y;
    }

    canvas.addEventListener('mousemove', updateMousePos);

    canvas.addEventListener('mousedown', e => {
        updateMousePos(e);
        audio.init();

        if (gameState === STATE.TITLE) {
            startNewGame();
            return;
        }
        if (gameState === STATE.GAME_OVER) {
            startNewGame();
            return;
        }

        if (e.button === 0) { // Left click
            keys.attack = true;
        } else if (e.button === 2) { // Right click
            keys.spell = true;
        }
    });

    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Touch event helpers
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        updateMousePos(e);
        audio.init();
        if (gameState === STATE.TITLE || gameState === STATE.GAME_OVER) {
            startNewGame();
        }
    }, { passive: false });

    // Keyboard controls
    window.addEventListener('keydown', e => {
        audio.init();
        if (gameState === STATE.TITLE && (e.code === 'Space' || e.code === 'Enter')) {
            startNewGame();
            return;
        }
        if (gameState === STATE.GAME_OVER && (e.code === 'Space' || e.code === 'Enter')) {
            startNewGame();
            return;
        }

        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                keys.up = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                keys.down = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                keys.right = true;
                break;
            case 'KeyJ':
                keys.attack = true;
                break;
            case 'KeyK':
                keys.spell = true;
                break;
            case 'Space':
            case 'KeyL':
                e.preventDefault();
                keys.dash = true;
                break;
            case 'KeyP':
                togglePause();
                break;
        }
    });

    window.addEventListener('keyup', e => {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                keys.up = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                keys.down = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                keys.right = false;
                break;
            case 'KeyJ':
                keys.attack = false;
                break;
            case 'KeyK':
                keys.spell = false;
                break;
            case 'Space':
            case 'KeyL':
                keys.dash = false;
                break;
        }
    });

    // Mobile Virtual Buttons
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnAttack = document.getElementById('btn-attack');
    const btnSpell = document.getElementById('btn-spell');
    const btnDash = document.getElementById('btn-dash');

    function wireBtn(el, keyName) {
        if (!el) return;
        el.addEventListener('touchstart', e => { e.preventDefault(); keys[keyName] = true; audio.init(); });
        el.addEventListener('touchend', e => { e.preventDefault(); keys[keyName] = false; });
        el.addEventListener('mousedown', () => { keys[keyName] = true; audio.init(); });
        el.addEventListener('mouseup', () => { keys[keyName] = false; });
    }

    wireBtn(btnUp, 'up');
    wireBtn(btnDown, 'down');
    wireBtn(btnLeft, 'left');
    wireBtn(btnRight, 'right');
    wireBtn(btnAttack, 'attack');
    wireBtn(btnSpell, 'spell');
    wireBtn(btnDash, 'dash');

    // Top HUD controls
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
            localStorage.setItem('dungeon_quest_muted', audio.muted.toString());
            updateSoundBtn();
        });
    }

    function togglePause() {
        if (gameState === STATE.PLAYING) {
            isPaused = !isPaused;
            if (btnPause) {
                btnPause.textContent = isPaused ? '▶ RESUME' : '⏸ PAUSE';
            }
        }
    }

    if (btnPause) {
        btnPause.addEventListener('click', togglePause);
    }

    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            audio.init();
            isPaused = false;
            if (btnPause) btnPause.textContent = '⏸ PAUSE';
            startNewGame();
        });
    }

    // --- Start Loop ---
    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);

})();

