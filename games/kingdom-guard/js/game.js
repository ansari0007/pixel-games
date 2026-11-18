/* ==========================================================================
   KINGDOM GUARD — Pixel Tower Defense Engine
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // --- Canvas & Context Setup ---
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const GAME_WIDTH = 800;
    const GAME_HEIGHT = 560;

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    // --- Audio Engine ---
    class KingdomAudioEngine {
        constructor() {
            this.ctx = null;
            this.muted = localStorage.getItem('kingdom_guard_muted') === 'true';
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

        playArrow() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.09);
            } catch (e) {}
        }

        playCannon() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const bufferSize = this.ctx.sampleRate * 0.3;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
                }

                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(350, now);
                filter.frequency.linearRampToValueAtTime(60, now + 0.28);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                noise.start(now);
            } catch (e) {}
        }

        playFrost() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.linearRampToValueAtTime(880, now + 0.1);

                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
            } catch (e) {}
        }

        playTesla() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.setValueAtTime(200, now + 0.04);
                osc.frequency.setValueAtTime(600, now + 0.08);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
            } catch (e) {}
        }

        playCoin() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(987.77, now);
                osc.frequency.setValueAtTime(1318.51, now + 0.05);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.16);
            } catch (e) {}
        }

        playBuild() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.setValueAtTime(440, now + 0.05);

                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.16);
            } catch (e) {}
        }

        playMeteor() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.linearRampToValueAtTime(40, now + 0.5);

                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.56);
            } catch (e) {}
        }

        playHorn() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const notes = [293.66, 369.99, 440.00, 587.33];
                notes.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.1);

                    gain.gain.setValueAtTime(0.2, now + idx * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.1);
                    osc.stop(now + idx * 0.1 + 0.27);
                });
            } catch (e) {}
        }

        playVictory() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const chords = [523.25, 659.25, 783.99, 1046.50];
                chords.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.12);

                    gain.gain.setValueAtTime(0.25, now + idx * 0.12);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.12);
                    osc.stop(now + idx * 0.12 + 0.37);
                });
            } catch (e) {}
        }

        playDefeat() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const notes = [392, 349.23, 329.63, 293.66, 220];
                notes.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.16);

                    gain.gain.setValueAtTime(0.25, now + idx * 0.16);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.28);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.16);
                    osc.stop(now + idx * 0.16 + 0.3);
                });
            } catch (e) {}
        }
    }

    const audio = new KingdomAudioEngine();

    // --- Game States ---
    const STATE = {
        TITLE: 0,
        PLAYING: 1,
        GAME_OVER: 2,
        VICTORY: 3
    };

    let gameState = STATE.TITLE;
    let gold = 350;
    let lives = 20;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('kingdom_guard_highscore') || '0', 10);
    let waveIndex = 0;
    let isWaveActive = false;
    let waveSpawnQueue = [];
    let spawnTimer = 0;
    let gameSpeed = 1; // 1x or 2x
    let isPaused = false;
    let frameCount = 0;
    let screenShake = 0;

    // Selected tools
    let selectedTowerType = null; // 'archer', 'cannon', 'frost', 'tesla'
    let selectedSpell = null; // 'meteor', 'reinforce'
    let activeSelectedPlot = null; // When clicking an existing tower to upgrade/sell

    // Spell Cooldowns (frames at 60fps)
    let meteorCooldown = 0;
    let reinforceCooldown = 0;
    const METEOR_MAX_CD = 60 * 25; // 25s
    const REINFORCE_MAX_CD = 60 * 18; // 18s

    // --- Map & Waypoint Geometry ---
    // Winding path through the kingdom from Left to Right Castle Gate
    const WAYPOINTS = [
        { x: -20, y: 160 },
        { x: 180, y: 160 },
        { x: 180, y: 390 },
        { x: 380, y: 390 },
        { x: 380, y: 140 },
        { x: 590, y: 140 },
        { x: 590, y: 360 },
        { x: 770, y: 360 }
    ];

    // Build Foundation Plots (pre-placed tactical building spots)
    const PLOTS = [
        { id: 1, x: 90, y: 105, tower: null },
        { id: 2, x: 90, y: 220, tower: null },
        { id: 3, x: 245, y: 250, tower: null },
        { id: 4, x: 245, y: 335, tower: null },
        { id: 5, x: 290, y: 450, tower: null },
        { id: 6, x: 445, y: 330, tower: null },
        { id: 7, x: 315, y: 85, tower: null },
        { id: 8, x: 450, y: 85, tower: null },
        { id: 9, x: 520, y: 220, tower: null },
        { id: 10, x: 655, y: 220, tower: null },
        { id: 11, x: 655, y: 425, tower: null },
        { id: 12, x: 505, y: 425, tower: null }
    ];

    // --- Tower Definitions ---
    const TOWER_SPECS = {
        archer: {
            name: 'ARCHER TOWER',
            cost: 100,
            upgradeCost: 80,
            range: 135,
            upgradeRange: 165,
            damage: 16,
            upgradeDamage: 32,
            cooldown: 26,
            upgradeCooldown: 20,
            color: '#8d6e63',
            bulletSpeed: 9
        },
        cannon: {
            name: 'CANNON TOWER',
            cost: 150,
            upgradeCost: 120,
            range: 125,
            upgradeRange: 150,
            damage: 55,
            upgradeDamage: 110,
            splash: 52,
            cooldown: 68,
            upgradeCooldown: 54,
            color: '#37474f',
            bulletSpeed: 6
        },
        frost: {
            name: 'FROST SPIRE',
            cost: 125,
            upgradeCost: 95,
            range: 115,
            upgradeRange: 145,
            damage: 6,
            upgradeDamage: 14,
            slow: 0.5,
            slowDuration: 75,
            cooldown: 18,
            upgradeCooldown: 12,
            color: '#00d2ff',
            bulletSpeed: 7
        },
        tesla: {
            name: 'TESLA SPIRE',
            cost: 200,
            upgradeCost: 160,
            range: 140,
            upgradeRange: 175,
            damage: 42,
            upgradeDamage: 85,
            chains: 3,
            cooldown: 52,
            upgradeCooldown: 40,
            color: '#ffd700',
            bulletSpeed: 12
        }
    };

    // --- Creep Definitions ---
    const CREEP_SPECS = {
        goblin: { name: 'Goblin Runner', speed: 2.7, hp: 45, gold: 8, radius: 10, color: '#39ff14' },
        orc: { name: 'Orc Warrior', speed: 1.6, hp: 130, gold: 16, radius: 13, color: '#7cb342' },
        golem: { name: 'Armored Golem', speed: 0.9, hp: 380, gold: 32, radius: 16, color: '#90a4ae' },
        gargoyle: { name: 'Gargoyle Bat', speed: 2.1, hp: 85, gold: 20, radius: 11, color: '#b026ff', flying: true },
        boss: { name: 'Warlord Boss', speed: 1.0, hp: 1400, gold: 150, radius: 24, color: '#d32f2f', boss: true }
    };

    // --- Collections ---
    let towers = [];
    let creeps = [];
    let projectiles = [];
    let particles = [];
    let floatingTexts = [];
    let soldiers = []; // militia

    let mouseX = 0;
    let mouseY = 0;
    let hoveredPlot = null;

    // --- Tower Class ---
    class Tower {
        constructor(plot, typeKey) {
            this.plot = plot;
            this.typeKey = typeKey;
            this.spec = TOWER_SPECS[typeKey];
            this.level = 1;
            this.x = plot.x;
            this.y = plot.y;
            this.cooldownTimer = 0;
            this.target = null;
            this.aimAngle = 0;
        }

        get range() {
            return this.level === 1 ? this.spec.range : this.spec.upgradeRange;
        }

        get damage() {
            return this.level === 1 ? this.spec.damage : this.spec.upgradeDamage;
        }

        get cooldown() {
            return this.level === 1 ? this.spec.cooldown : this.spec.upgradeCooldown;
        }

        upgrade() {
            if (gold >= this.spec.upgradeCost && this.level === 1) {
                gold -= this.spec.upgradeCost;
                this.level = 2;
                audio.playBuild();
                addFloatingText('UPGRADED!', this.x, this.y - 30, '#ffd700');
                createSparks(this.x, this.y, '#ffd700', 16);
                updateUIState();
            }
        }

        sell() {
            const refund = Math.floor((this.spec.cost + (this.level > 1 ? this.spec.upgradeCost : 0)) * 0.7);
            gold += refund;
            audio.playCoin();
            addFloatingText(`+${refund}g`, this.x, this.y - 20, '#ffd700');
            this.plot.tower = null;
            const idx = towers.indexOf(this);
            if (idx !== -1) towers.splice(idx, 1);
            activeSelectedPlot = null;
            updateUIState();
        }

        update() {
            if (this.cooldownTimer > 0) this.cooldownTimer--;

            // Find target along path (furthest along path within range)
            this.target = null;
            let maxProgress = -1;

            for (let c of creeps) {
                if (!c.isAlive) continue;
                const dist = Math.hypot(c.x - this.x, c.y - this.y);
                if (dist <= this.range) {
                    if (c.pathProgress > maxProgress) {
                        maxProgress = c.pathProgress;
                        this.target = c;
                    }
                }
            }

            if (this.target) {
                this.aimAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);

                if (this.cooldownTimer <= 0) {
                    this.fire();
                    this.cooldownTimer = this.cooldown;
                }
            }
        }

        fire() {
            if (!this.target) return;

            if (this.typeKey === 'archer') {
                audio.playArrow();
                projectiles.push(new Projectile(this.x, this.y - 12, this.target, 'arrow', this.damage));
            } else if (this.typeKey === 'cannon') {
                audio.playCannon();
                projectiles.push(new Projectile(this.x, this.y - 10, this.target, 'cannon', this.damage, this.spec.splash));
            } else if (this.typeKey === 'frost') {
                audio.playFrost();
                projectiles.push(new Projectile(this.x, this.y - 14, this.target, 'frost', this.damage, 0, this.spec.slow, this.spec.slowDuration));
            } else if (this.typeKey === 'tesla') {
                audio.playTesla();
                chainLightning(this.x, this.y - 16, this.target, this.damage, this.spec.chains);
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Base Foundation Plinth
            ctx.fillStyle = '#42372c';
            ctx.strokeStyle = '#261e16';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-20, -14, 40, 28, 6);
            ctx.fill();
            ctx.stroke();

            // Tower Body
            if (this.typeKey === 'archer') {
                // Stone Guard Tower
                ctx.fillStyle = this.level > 1 ? '#546e7a' : '#78909c';
                ctx.fillRect(-12, -26, 24, 20);
                ctx.strokeStyle = '#263238';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(-12, -26, 24, 20);

                // Crenellations
                ctx.fillStyle = this.level > 1 ? '#37474f' : '#455a64';
                ctx.fillRect(-14, -32, 28, 6);
                ctx.fillRect(-14, -36, 6, 6);
                ctx.fillRect(8, -36, 6, 6);

                // Archer Bow tracking target
                ctx.save();
                ctx.translate(0, -28);
                ctx.rotate(this.aimAngle);
                ctx.strokeStyle = '#d7ccc8';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 10, -Math.PI * 0.4, Math.PI * 0.4);
                ctx.stroke();
                ctx.restore();
            } else if (this.typeKey === 'cannon') {
                // Heavy Iron Cannon
                ctx.fillStyle = this.level > 1 ? '#212121' : '#424242';
                ctx.fillRect(-14, -20, 28, 16);
                ctx.strokeStyle = '#111';
                ctx.strokeRect(-14, -20, 28, 16);

                // Cannon Barrel
                ctx.save();
                ctx.translate(0, -12);
                ctx.rotate(this.aimAngle);
                ctx.fillStyle = '#111';
                ctx.fillRect(0, -4, 20, 8);
                ctx.restore();
            } else if (this.typeKey === 'frost') {
                // Ice Crystal Spire
                ctx.fillStyle = '#263238';
                ctx.fillRect(-10, -22, 20, 18);

                // Glowing Floating Crystal
                const floatY = Math.sin(frameCount * 0.1) * 3;
                ctx.save();
                ctx.translate(0, -32 + floatY);
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 12;
                ctx.fillStyle = this.level > 1 ? '#00e5ff' : '#80d8ff';
                ctx.beginPath();
                ctx.moveTo(0, -10);
                ctx.lineTo(8, 0);
                ctx.lineTo(0, 10);
                ctx.lineTo(-8, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else if (this.typeKey === 'tesla') {
                // Tesla Coil Tower
                ctx.fillStyle = '#3e2723';
                ctx.fillRect(-8, -26, 16, 22);

                // Copper Ring Coils
                ctx.fillStyle = '#ffb300';
                ctx.fillRect(-11, -22, 22, 3);
                ctx.fillRect(-11, -16, 22, 3);

                // Top Plasma Orb
                ctx.save();
                ctx.translate(0, -32);
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Level 2 Golden Star Badge
            if (this.level > 1) {
                ctx.fillStyle = '#ffd700';
                ctx.font = '8px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('★', 0, -42);
            }

            ctx.restore();
        }
    }

    // --- Creep Class ---
    class Creep {
        constructor(typeKey) {
            this.typeKey = typeKey;
            this.spec = CREEP_SPECS[typeKey];
            this.x = WAYPOINTS[0].x;
            this.y = WAYPOINTS[0].y;
            this.radius = this.spec.radius;
            this.speed = this.spec.speed;
            this.maxHp = this.spec.hp + (waveIndex * 15);
            this.hp = this.maxHp;
            this.goldReward = this.spec.gold;
            this.isAlive = true;

            this.waypointIdx = 1;
            this.pathProgress = 0;
            this.slowTimer = 0;
            this.slowFactor = 1.0;
            this.walkAnim = Math.random() * 10;
        }

        update() {
            if (!this.isAlive) return;

            this.walkAnim += 0.2;

            // Slow effect update
            if (this.slowTimer > 0) {
                this.slowTimer--;
                if (this.slowTimer <= 0) this.slowFactor = 1.0;
            }

            // Soldiers blocking logic
            let blockedBySoldier = null;
            if (!this.spec.flying) {
                for (let s of soldiers) {
                    if (s.isAlive && Math.hypot(s.x - this.x, s.y - this.y) < this.radius + 12) {
                        blockedBySoldier = s;
                        break;
                    }
                }
            }

            if (blockedBySoldier) {
                // Fight soldier
                blockedBySoldier.hp -= 0.5;
                if (blockedBySoldier.hp <= 0) blockedBySoldier.isAlive = false;
                return; // Pauses march while fighting
            }

            // Move towards next waypoint
            const targetWP = WAYPOINTS[this.waypointIdx];
            const dx = targetWP.x - this.x;
            const dy = targetWP.y - this.y;
            const dist = Math.hypot(dx, dy);

            const effectiveSpeed = this.speed * this.slowFactor * (gameSpeed === 2 ? 1.6 : 1.0);

            if (dist <= effectiveSpeed) {
                this.x = targetWP.x;
                this.y = targetWP.y;
                this.waypointIdx++;

                if (this.waypointIdx >= WAYPOINTS.length) {
                    // Reached Castle!
                    this.reachCastle();
                    return;
                }
            } else {
                this.x += (dx / dist) * effectiveSpeed;
                this.y += (dy / dist) * effectiveSpeed;
            }

            this.pathProgress += effectiveSpeed;
        }

        takeDamage(dmg) {
            this.hp -= dmg;
            createSparks(this.x, this.y, '#ffffff', 4);

            if (this.hp <= 0 && this.isAlive) {
                this.die();
            }
        }

        die() {
            this.isAlive = false;
            gold += this.goldReward;
            score += this.goldReward * 10;
            audio.playCoin();
            addFloatingText(`+${this.goldReward}g`, this.x, this.y - 12, '#ffd700');
            createSparks(this.x, this.y, this.spec.color, 12);
            updateUIState();
        }

        reachCastle() {
            this.isAlive = false;
            lives = Math.max(0, lives - (this.spec.boss ? 5 : 1));
            screenShake = 12;
            audio.playDefeat();
            createSparks(this.x, this.y, '#ff1744', 18);

            if (lives <= 0) {
                gameState = STATE.GAME_OVER;
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('kingdom_guard_highscore', highScore.toString());
                }
            }
            updateUIState();
        }

        draw(ctx) {
            if (!this.isAlive) return;

            ctx.save();
            ctx.translate(this.x, this.y);

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(0, this.radius * 0.7, this.radius, this.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Bobbing movement
            const bob = Math.sin(this.walkAnim) * 2;

            if (this.spec.boss) {
                // Massive Red Warlord
                ctx.fillStyle = '#b71c1c';
                ctx.beginPath();
                ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Horns
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.moveTo(-16, -14 + bob);
                ctx.lineTo(-24, -28 + bob);
                ctx.lineTo(-8, -18 + bob);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(16, -14 + bob);
                ctx.lineTo(24, -28 + bob);
                ctx.lineTo(8, -18 + bob);
                ctx.closePath();
                ctx.fill();
            } else if (this.spec.flying) {
                // Flying Gargoyle
                ctx.fillStyle = '#7b1fa2';
                ctx.beginPath();
                ctx.arc(0, -6 + bob, this.radius, 0, Math.PI * 2);
                ctx.fill();
                // Wings
                const wingFlap = Math.sin(this.walkAnim * 1.5) * 8;
                ctx.fillStyle = '#4a148c';
                ctx.beginPath();
                ctx.moveTo(-10, -6 + bob);
                ctx.lineTo(-22, -18 + wingFlap + bob);
                ctx.lineTo(-8, 2 + bob);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(10, -6 + bob);
                ctx.lineTo(22, -18 + wingFlap + bob);
                ctx.lineTo(8, 2 + bob);
                ctx.closePath();
                ctx.fill();
            } else {
                // Ground Creep
                ctx.fillStyle = this.spec.color;
                ctx.beginPath();
                ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#263238';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Eyes
                ctx.fillStyle = '#111';
                ctx.fillRect(2, -3 + bob, 3, 3);
                ctx.fillRect(6, -3 + bob, 3, 3);
            }

            // Chilled ice overlay
            if (this.slowTimer > 0) {
                ctx.fillStyle = 'rgba(0, 210, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(0, bob, this.radius + 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Health bar
            const barW = this.radius * 2;
            const barH = 3;
            const barY = -this.radius - 8;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(-barW / 2, barY, barW, barH);
            ctx.fillStyle = '#00e676';
            ctx.fillRect(-barW / 2, barY, (Math.max(0, this.hp) / this.maxHp) * barW, barH);

            ctx.restore();
        }
    }

    // --- Projectile Class ---
    class Projectile {
        constructor(x, y, target, type, damage, splash = 0, slow = 0, slowDur = 0) {
            this.x = x;
            this.y = y;
            this.target = target;
            this.type = type;
            this.damage = damage;
            this.splash = splash;
            this.slow = slow;
            this.slowDur = slowDur;
            this.speed = TOWER_SPECS[type === 'arrow' ? 'archer' : (type === 'cannon' ? 'cannon' : 'frost')].bulletSpeed;
            this.isAlive = true;
            this.targetX = target.x;
            this.targetY = target.y;
        }

        update() {
            if (!this.isAlive) return;

            if (this.target && this.target.isAlive) {
                this.targetX = this.target.x;
                this.targetY = this.target.y;
            }

            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist <= this.speed) {
                this.hit();
            } else {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }

        hit() {
            this.isAlive = false;

            if (this.splash > 0) {
                // Cannon Area splash
                audio.playCannon();
                screenShake = 6;
                createExplosion(this.x, this.y, '#ff5722', 24);

                for (let c of creeps) {
                    if (!c.isAlive) continue;
                    const d = Math.hypot(c.x - this.x, c.y - this.y);
                    if (d <= this.splash) {
                        c.takeDamage(this.damage);
                    }
                }
            } else {
                // Single target (arrow or frost)
                if (this.target && this.target.isAlive) {
                    this.target.takeDamage(this.damage);
                    if (this.slow > 0) {
                        this.target.slowTimer = this.slowDur;
                        this.target.slowFactor = this.slow;
                        createSparks(this.target.x, this.target.y, '#00d2ff', 6);
                    }
                }
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            if (this.type === 'arrow') {
                const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
                ctx.rotate(angle);
                ctx.strokeStyle = '#d7ccc8';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-6, 0);
                ctx.lineTo(6, 0);
                ctx.stroke();
                ctx.fillStyle = '#ffea00';
                ctx.fillRect(4, -1, 3, 2);
            } else if (this.type === 'cannon') {
                ctx.fillStyle = '#111';
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'frost') {
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 8;
                ctx.fillStyle = '#e0f7fa';
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // --- Chain Lightning Helper ---
    function chainLightning(startX, startY, firstTarget, damage, maxChains) {
        let currentTarget = firstTarget;
        let fromX = startX;
        let fromY = startY;
        const hitSet = new Set();

        for (let i = 0; i < maxChains; i++) {
            if (!currentTarget) break;
            hitSet.add(currentTarget);
            currentTarget.takeDamage(damage);

            // Draw bolt effect
            particles.push({
                isBolt: true,
                x1: fromX,
                y1: fromY,
                x2: currentTarget.x,
                y2: currentTarget.y,
                life: 0.25,
                color: '#ffd700'
            });

            fromX = currentTarget.x;
            fromY = currentTarget.y;

            // Find next closest creep
            let nextTarget = null;
            let closestDist = 110;
            for (let c of creeps) {
                if (c.isAlive && !hitSet.has(c)) {
                    const d = Math.hypot(c.x - fromX, c.y - fromY);
                    if (d < closestDist) {
                        closestDist = d;
                        nextTarget = c;
                    }
                }
            }
            currentTarget = nextTarget;
        }
    }

    // --- Militia Soldiers ---
    class Soldier {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.hp = 80;
            this.maxHp = 80;
            this.isAlive = true;
            this.lifeTimer = 60 * 18; // 18 seconds
        }

        update() {
            this.lifeTimer--;
            if (this.lifeTimer <= 0) this.isAlive = false;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            // Foot soldier sprite
            ctx.fillStyle = '#1e88e5';
            ctx.fillRect(-6, -10, 12, 14);
            ctx.fillStyle = '#ffd54f';
            ctx.fillRect(-4, -16, 8, 7);
            // Shield
            ctx.fillStyle = '#90a4ae';
            ctx.fillRect(6, -8, 4, 12);
            ctx.restore();
        }
    }

    // --- Visual Effects & Particles ---
    function createSparks(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Math.random() * 3 + 2,
                life: 1.0,
                decay: 0.05
            });
        }
    }

    function createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Math.random() * 4 + 2,
                life: 1.0,
                decay: 0.04
            });
        }
    }

    function addFloatingText(text, x, y, color = '#ffffff') {
        floatingTexts.push({
            text: text,
            x: x,
            y: y,
            vy: -1.0,
            life: 1.0,
            color: color
        });
    }

    // --- Wave Management ---
    function startNextWave() {
        audio.init();

        if (isWaveActive) {
            // Early call bonus!
            gold += 25;
            audio.playCoin();
            addFloatingText('+25g EARLY BONUS!', GAME_WIDTH / 2, 80, '#ffd700');
            updateUIState();
        }

        waveIndex++;
        isWaveActive = true;
        audio.playHorn();

        // Build queue of creeps for this wave
        waveSpawnQueue = [];

        const countGoblins = 5 + waveIndex * 2;
        const countOrcs = Math.max(0, (waveIndex - 1) * 3);
        const countGargoyles = waveIndex >= 3 ? 3 + waveIndex : 0;
        const countGolems = waveIndex >= 4 ? Math.floor(waveIndex / 2) : 0;
        const hasBoss = (waveIndex % 5 === 0);

        for (let i = 0; i < countGoblins; i++) waveSpawnQueue.push('goblin');
        for (let i = 0; i < countOrcs; i++) waveSpawnQueue.push('orc');
        for (let i = 0; i < countGargoyles; i++) waveSpawnQueue.push('gargoyle');
        for (let i = 0; i < countGolems; i++) waveSpawnQueue.push('gargoyle');
        if (hasBoss) waveSpawnQueue.push('boss');

        // Shuffle slightly for varied mix
        waveSpawnQueue.sort(() => Math.random() - 0.5);

        spawnTimer = 0;
        updateUIState();
    }

    function checkWaveCompletion() {
        if (isWaveActive && waveSpawnQueue.length === 0 && creeps.length === 0) {
            isWaveActive = false;
            audio.playVictory();
            gold += 50 + waveIndex * 10;
            score += 500;
            addFloatingText(`WAVE ${waveIndex} CLEARED! +${50 + waveIndex * 10}g`, GAME_WIDTH / 2, 70, '#39ff14');
            updateUIState();
        }
    }

    // --- Spells Execution ---
    function triggerMeteor(targetX, targetY) {
        audio.playMeteor();
        screenShake = 16;
        meteorCooldown = METEOR_MAX_CD;

        createExplosion(targetX, targetY, '#ff1744', 35);
        createExplosion(targetX, targetY, '#ffea00', 25);

        const radius = 90;
        for (let c of creeps) {
            if (!c.isAlive) continue;
            const dist = Math.hypot(c.x - targetX, c.y - targetY);
            if (dist <= radius) {
                c.takeDamage(260);
            }
        }
        addFloatingText('METEOR STRIKE!', targetX, targetY - 30, '#ff1744');
    }

    function triggerReinforcements(targetX, targetY) {
        audio.playHorn();
        reinforceCooldown = REINFORCE_MAX_CD;
        soldiers.push(new Soldier(targetX - 12, targetY));
        soldiers.push(new Soldier(targetX + 12, targetY));
        addFloatingText('MILITIA DEPLOYED!', targetX, targetY - 20, '#00d2ff');
    }

    // --- Main Update Loop ---
    function update() {
        frameCount++;

        if (screenShake > 0) {
            screenShake *= 0.88;
            if (screenShake < 0.2) screenShake = 0;
        }

        if (isPaused || gameState !== STATE.PLAYING) return;

        // Spell Cooldowns
        if (meteorCooldown > 0) meteorCooldown--;
        if (reinforceCooldown > 0) reinforceCooldown--;

        // Wave Spawning
        if (isWaveActive && waveSpawnQueue.length > 0) {
            spawnTimer--;
            if (spawnTimer <= 0) {
                const nextCreepType = waveSpawnQueue.shift();
                creeps.push(new Creep(nextCreepType));
                spawnTimer = 40; // frame gap between spawns
            }
        }

        // Towers
        towers.forEach(t => t.update());

        // Creeps
        for (let i = creeps.length - 1; i >= 0; i--) {
            const c = creeps[i];
            c.update();
            if (!c.isAlive) creeps.splice(i, 1);
        }

        // Projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.update();
            if (!p.isAlive) projectiles.splice(i, 1);
        }

        // Soldiers
        for (let i = soldiers.length - 1; i >= 0; i--) {
            const s = soldiers[i];
            s.update();
            if (!s.isAlive) soldiers.splice(i, 1);
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const pt = particles[i];
            pt.life -= (pt.decay || 0.05);
            if (!pt.isBolt) {
                pt.x += pt.vx;
                pt.y += pt.vy;
            }
            if (pt.life <= 0) particles.splice(i, 1);
        }

        // Floating texts
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const txt = floatingTexts[i];
            txt.y += txt.vy;
            txt.life -= 0.02;
            if (txt.life <= 0) floatingTexts.splice(i, 1);
        }

        checkWaveCompletion();
    }

    // --- Main Render / Drawing Loop ---
    function render() {
        ctx.save();

        // Screen Shake
        if (screenShake > 0) {
            const sx = (Math.random() * 2 - 1) * screenShake;
            const sy = (Math.random() * 2 - 1) * screenShake;
            ctx.translate(sx, sy);
        }

        // 1. Draw Kingdom Map (Grass, Hills, Dirt Road, Castle)
        drawTerrain(ctx);

        // 2. Draw Tower Build Plots
        drawPlots(ctx);

        // 3. Draw Soldiers
        soldiers.forEach(s => s.draw(ctx));

        // 4. Draw Creeps
        creeps.forEach(c => c.draw(ctx));

        // 5. Draw Towers
        towers.forEach(t => t.draw(ctx));

        // 6. Draw Projectiles & Lightning
        for (let pt of particles) {
            if (pt.isBolt) {
                ctx.save();
                ctx.strokeStyle = pt.color;
                ctx.lineWidth = 3;
                ctx.shadowColor = pt.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(pt.x1, pt.y1);
                ctx.lineTo((pt.x1 + pt.x2) / 2 + (Math.random() * 12 - 6), (pt.y1 + pt.y2) / 2 + (Math.random() * 12 - 6));
                ctx.lineTo(pt.x2, pt.y2);
                ctx.stroke();
                ctx.restore();
            }
        }
        projectiles.forEach(p => p.draw(ctx));

        // 7. Draw Particles
        for (let pt of particles) {
            if (!pt.isBolt) {
                ctx.save();
                ctx.globalAlpha = pt.life;
                ctx.fillStyle = pt.color;
                ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
                ctx.restore();
            }
        }

        // 8. Draw Range Previews & Hover Rings
        drawPlacementHover(ctx);

        // 9. Floating Texts
        for (let txt of floatingTexts) {
            ctx.save();
            ctx.globalAlpha = txt.life;
            ctx.shadowColor = txt.color;
            ctx.shadowBlur = 6;
            ctx.fillStyle = txt.color;
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(txt.text, txt.x, txt.y);
            ctx.restore();
        }

        // 10. Top HUD Header
        drawHUD(ctx);

        // 11. Overlays
        if (gameState === STATE.TITLE) {
            drawTitleOverlay(ctx);
        } else if (gameState === STATE.GAME_OVER) {
            drawGameOverOverlay(ctx);
        }

        if (isPaused) {
            drawPauseOverlay(ctx);
        }

        ctx.restore();
    }

    function drawTerrain(ctx) {
        // Lush green meadow
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Subtle grass texture patches
        ctx.fillStyle = '#256528';
        for (let x = 20; x < GAME_WIDTH; x += 60) {
            for (let y = 30; y < GAME_HEIGHT; y += 70) {
                ctx.fillRect(x, y, 16, 8);
            }
        }

        // River at bottom
        ctx.fillStyle = '#0288d1';
        ctx.fillRect(0, 500, GAME_WIDTH, 60);
        ctx.strokeStyle = '#0277bd';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 500, GAME_WIDTH, 60);

        // Winding Dirt Road (Stone & Sand)
        ctx.lineWidth = 42;
        ctx.strokeStyle = '#795548';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        WAYPOINTS.forEach((wp, idx) => {
            if (idx === 0) ctx.moveTo(wp.x, wp.y);
            else ctx.lineTo(wp.x, wp.y);
        });
        ctx.stroke();

        // Road inner cobblestones
        ctx.lineWidth = 32;
        ctx.strokeStyle = '#8d6e63';
        ctx.stroke();

        // Castle Gate Fortress at end
        ctx.fillStyle = '#37474f';
        ctx.fillRect(730, 310, 70, 100);
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 3;
        ctx.strokeRect(730, 310, 70, 100);

        // Castle towers & Royal Blue Banner
        ctx.fillStyle = '#1e88e5';
        ctx.fillRect(745, 290, 18, 25);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(751, 298, 6, 8);
    }

    function drawPlots(ctx) {
        PLOTS.forEach(plot => {
            if (!plot.tower) {
                ctx.save();
                ctx.fillStyle = '#4e342e';
                ctx.strokeStyle = '#3e2723';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(plot.x - 18, plot.y - 14, 36, 28, 4);
                ctx.fill();
                ctx.stroke();

                // Build icon
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.font = '10px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('+', plot.x, plot.y + 1);
                ctx.restore();
            }
        });
    }

    function drawPlacementHover(ctx) {
        // Selected plot upgrade/sell menu
        if (activeSelectedPlot && activeSelectedPlot.tower) {
            const t = activeSelectedPlot.tower;
            ctx.save();

            // Range Circle
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Upgrade/Sell Floating Box
            const boxX = Math.min(GAME_WIDTH - 150, Math.max(10, t.x - 70));
            const boxY = Math.max(60, t.y - 85);
            ctx.fillStyle = 'rgba(18, 12, 28, 0.94)';
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, 140, 54, 6);
            ctx.fill();
            ctx.stroke();

            ctx.font = '7px "Press Start 2P", monospace';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(t.spec.name, boxX + 8, boxY + 14);

            if (t.level === 1) {
                ctx.fillStyle = gold >= t.spec.upgradeCost ? '#39ff14' : '#ff1744';
                ctx.fillText(`UPGRADE: ${t.spec.upgradeCost}g`, boxX + 8, boxY + 30);
            } else {
                ctx.fillStyle = '#ffd700';
                ctx.fillText(`MAX LEVEL ★`, boxX + 8, boxY + 30);
            }

            const refund = Math.floor((t.spec.cost + (t.level > 1 ? t.spec.upgradeCost : 0)) * 0.7);
            ctx.fillStyle = '#ff7700';
            ctx.fillText(`SELL: +${refund}g`, boxX + 8, boxY + 44);

            ctx.restore();
        }

        // Preview range when selecting a tower to build
        if (selectedTowerType && hoveredPlot && !hoveredPlot.tower) {
            const spec = TOWER_SPECS[selectedTowerType];
            ctx.save();
            ctx.strokeStyle = 'rgba(57, 255, 20, 0.6)';
            ctx.fillStyle = 'rgba(57, 255, 20, 0.12)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(hoveredPlot.x, hoveredPlot.y, spec.range, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }

    function drawHUD(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(14, 10, 22, 0.88)';
        ctx.fillRect(0, 0, GAME_WIDTH, 42);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 42);
        ctx.lineTo(GAME_WIDTH, 42);
        ctx.stroke();

        ctx.font = '9px "Press Start 2P", monospace';
        ctx.textBaseline = 'middle';

        // Gold
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'left';
        ctx.fillText(`💰 GOLD: ${gold}`, 16, 21);

        // Lives
        ctx.fillStyle = '#ff2a5f';
        ctx.fillText(`🏰 LIVES: ${lives}`, 170, 21);

        // Wave
        ctx.fillStyle = '#00d2ff';
        ctx.textAlign = 'center';
        ctx.fillText(`WAVE: ${waveIndex}`, GAME_WIDTH / 2, 21);

        // Score
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(`SCORE: ${score}`, GAME_WIDTH - 16, 21);

        ctx.restore();
    }

    function drawTitleOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(6, 4, 12, 0.92)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const cx = GAME_WIDTH / 2;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#ffd700';
        ctx.font = '28px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('KINGDOM GUARD', cx, 190);

        ctx.shadowColor = '#ff2a5f';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#ff2a5f';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText('PIXEL TOWER DEFENSE STRATEGY', cx, 230);

        const pulse = (Math.sin(frameCount * 0.08) + 1) * 0.5;
        ctx.shadowBlur = 0;
        ctx.fillStyle = pulse > 0.3 ? '#39ff14' : 'rgba(57, 255, 20, 0.4)';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText('CLICK / TAP / SPACE TO COMMENCE DEFENSE', cx, 330);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('BUILD ARCHERS, CANNONS, FROST & TESLA SPIRES', cx, 390);
        ctx.fillText('CALL WAVES EARLY FOR EXTRA BONUS GOLD', cx, 420);
        ctx.fillText('UNLEASH METEORS & MILITIA TO SAVE THE CASTLE', cx, 450);

        ctx.restore();
    }

    function drawGameOverOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(6, 4, 12, 0.92)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const cx = GAME_WIDTH / 2;
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#ff1744';
        ctx.font = '26px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('THE CASTLE HAS FALLEN', cx, 200);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(`WAVES DEFENDED: ${waveIndex}`, cx, 260);
        ctx.fillText(`FINAL SCORE: ${score}`, cx, 300);

        ctx.fillStyle = '#ffd700';
        ctx.fillText(`HIGH SCORE: ${highScore}`, cx, 340);

        const pulse = (Math.sin(frameCount * 0.08) + 1) * 0.5;
        ctx.fillStyle = pulse > 0.3 ? '#00d2ff' : 'rgba(0, 210, 255, 0.3)';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText('CLICK / TAP / SPACE TO RESTART', cx, 420);

        ctx.restore();
    }

    function drawPauseOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(6, 4, 12, 0.85)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ffd700';
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('KINGDOM PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText('PRESS [P] OR PAUSE BUTTON TO RESUME', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);

        ctx.restore();
    }

    // --- UI Controls & Event Listeners ---
    function updateUIState() {
        // Update tower buttons disabled / affordability state
        document.querySelectorAll('.tower-btn').forEach(btn => {
            const type = btn.getAttribute('data-type');
            const spec = TOWER_SPECS[type];
            if (gold < spec.cost) {
                btn.classList.add('disabled');
            } else {
                btn.classList.remove('disabled');
            }

            if (selectedTowerType === type) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });

        // Update spells
        const meteorBtn = document.getElementById('btn-meteor');
        const meteorCdEl = document.getElementById('meteor-cd');
        if (meteorCooldown > 0) {
            meteorBtn.classList.add('on-cooldown');
            meteorCdEl.textContent = `${Math.ceil(meteorCooldown / 60)}s`;
        } else {
            meteorBtn.classList.remove('on-cooldown');
            meteorCdEl.textContent = 'READY';
        }

        const reinforceBtn = document.getElementById('btn-reinforce');
        const reinforceCdEl = document.getElementById('reinforce-cd');
        if (reinforceCooldown > 0) {
            reinforceBtn.classList.add('on-cooldown');
            reinforceCdEl.textContent = `${Math.ceil(reinforceCooldown / 60)}s`;
        } else {
            reinforceBtn.classList.remove('on-cooldown');
            reinforceCdEl.textContent = 'READY';
        }
    }

    function getCanvasCoordinates(e) {
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

    canvas.addEventListener('mousemove', e => {
        const pos = getCanvasCoordinates(e);
        mouseX = pos.x;
        mouseY = pos.y;

        hoveredPlot = null;
        for (let p of PLOTS) {
            if (Math.hypot(p.x - mouseX, p.y - mouseY) < 26) {
                hoveredPlot = p;
                break;
            }
        }
    });

    canvas.addEventListener('mousedown', e => {
        const pos = getCanvasCoordinates(e);
        handleCanvasClick(pos.x, pos.y);
    });

    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        const pos = getCanvasCoordinates(e);
        handleCanvasClick(pos.x, pos.y);
    }, { passive: false });

    function handleCanvasClick(x, y) {
        audio.init();

        if (gameState === STATE.TITLE || gameState === STATE.GAME_OVER) {
            startNewGame();
            return;
        }

        // Spell execution
        if (selectedSpell === 'meteor' && meteorCooldown <= 0) {
            triggerMeteor(x, y);
            selectedSpell = null;
            document.querySelectorAll('.spell-btn').forEach(b => b.classList.remove('selected'));
            return;
        }

        if (selectedSpell === 'reinforce' && reinforceCooldown <= 0) {
            triggerReinforcements(x, y);
            selectedSpell = null;
            document.querySelectorAll('.spell-btn').forEach(b => b.classList.remove('selected'));
            return;
        }

        // Check if clicked an existing plot
        let clickedPlot = null;
        for (let p of PLOTS) {
            if (Math.hypot(p.x - x, p.y - y) < 28) {
                clickedPlot = p;
                break;
            }
        }

        if (clickedPlot) {
            if (clickedPlot.tower) {
                // If already selected, check if click was on upgrade/sell
                if (activeSelectedPlot === clickedPlot) {
                    // Clicked on existing selected tower: check upgrade or sell
                    if (y < clickedPlot.y - 10) {
                        clickedPlot.tower.upgrade();
                    } else {
                        clickedPlot.tower.sell();
                    }
                } else {
                    activeSelectedPlot = clickedPlot;
                }
            } else if (selectedTowerType) {
                // Empty plot & tower selected: build!
                const spec = TOWER_SPECS[selectedTowerType];
                if (gold >= spec.cost) {
                    gold -= spec.cost;
                    clickedPlot.tower = new Tower(clickedPlot, selectedTowerType);
                    towers.push(clickedPlot.tower);
                    audio.playBuild();
                    addFloatingText(`-${spec.cost}g`, clickedPlot.x, clickedPlot.y - 20, '#ffd700');
                    createSparks(clickedPlot.x, clickedPlot.y, '#ffd700', 14);
                    activeSelectedPlot = clickedPlot;
                    selectedTowerType = null;
                    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
                    updateUIState();
                }
            }
        } else {
            activeSelectedPlot = null;
        }
    }

    // Tower Selector Buttons
    document.querySelectorAll('.tower-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            audio.init();
            const type = btn.getAttribute('data-type');
            if (selectedTowerType === type) {
                selectedTowerType = null;
            } else {
                selectedTowerType = type;
                selectedSpell = null;
                document.querySelectorAll('.spell-btn').forEach(b => b.classList.remove('selected'));
            }
            updateUIState();
        });
    });

    // Spell Buttons
    const btnMeteor = document.getElementById('btn-meteor');
    if (btnMeteor) {
        btnMeteor.addEventListener('click', () => {
            audio.init();
            if (meteorCooldown <= 0) {
                selectedSpell = selectedSpell === 'meteor' ? null : 'meteor';
                selectedTowerType = null;
                btnMeteor.classList.toggle('selected', selectedSpell === 'meteor');
                document.getElementById('btn-reinforce').classList.remove('selected');
                document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
            }
        });
    }

    const btnReinforce = document.getElementById('btn-reinforce');
    if (btnReinforce) {
        btnReinforce.addEventListener('click', () => {
            audio.init();
            if (reinforceCooldown <= 0) {
                selectedSpell = selectedSpell === 'reinforce' ? null : 'reinforce';
                selectedTowerType = null;
                btnReinforce.classList.toggle('selected', selectedSpell === 'reinforce');
                document.getElementById('btn-meteor').classList.remove('selected');
                document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
            }
        });
    }

    // Wave Button
    const btnNextWave = document.getElementById('btn-next-wave');
    if (btnNextWave) {
        btnNextWave.addEventListener('click', () => {
            if (gameState === STATE.TITLE) {
                startNewGame();
            } else {
                startNextWave();
            }
        });
    }

    // Top HUD controls
    const btnSound = document.getElementById('btn-sound');
    const btnSpeed = document.getElementById('btn-speed');
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
            localStorage.setItem('kingdom_guard_muted', audio.muted.toString());
            updateSoundBtn();
        });
    }

    if (btnSpeed) {
        btnSpeed.addEventListener('click', () => {
            gameSpeed = gameSpeed === 1 ? 2 : 1;
            btnSpeed.textContent = gameSpeed === 2 ? '⏩ 2X' : '⏩ 1X';
        });
    }

    function togglePause() {
        if (gameState === STATE.PLAYING) {
            isPaused = !isPaused;
            if (btnPause) btnPause.textContent = isPaused ? '▶ RESUME' : '⏸ PAUSE';
        }
    }

    if (btnPause) btnPause.addEventListener('click', togglePause);

    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            startNewGame();
        });
    }

    window.addEventListener('keydown', e => {
        audio.init();
        if ((gameState === STATE.TITLE || gameState === STATE.GAME_OVER) && (e.code === 'Space' || e.code === 'Enter')) {
            startNewGame();
            return;
        }
        if (e.code === 'KeyP') togglePause();
        if (e.code === 'Space') startNextWave();
    });

    function startNewGame() {
        gold = 350;
        lives = 20;
        score = 0;
        waveIndex = 0;
        isWaveActive = false;
        waveSpawnQueue = [];
        towers = [];
        creeps = [];
        projectiles = [];
        particles = [];
        floatingTexts = [];
        soldiers = [];
        PLOTS.forEach(p => p.tower = null);
        activeSelectedPlot = null;
        selectedTowerType = null;
        selectedSpell = null;
        meteorCooldown = 0;
        reinforceCooldown = 0;
        gameState = STATE.PLAYING;
        updateUIState();
        startNextWave();
    }

    // --- Main Loop ---
    function gameLoop() {
        update();
        if (gameSpeed === 2 && !isPaused && gameState === STATE.PLAYING) {
            update(); // Second update tick for 2X speed simulation
        }
        render();
        requestAnimationFrame(gameLoop);
    }

    updateUIState();
    requestAnimationFrame(gameLoop);

})();

