/* ==========================================================================
   PIXEL HOPPER — Retro Arcade Frogger Engine
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // --- Canvas & Context Setup ---
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const COLS = 14;
    const ROWS = 15;
    const TILE_SIZE = 40;

    const GAME_WIDTH = COLS * TILE_SIZE; // 560
    const GAME_HEIGHT = ROWS * TILE_SIZE; // 600

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    // --- Audio Engine ---
    class HopperAudioEngine {
        constructor() {
            this.ctx = null;
            this.muted = localStorage.getItem('pixel_hopper_muted') === 'true';
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

        playHop() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.09);
            } catch (e) {}
        }

        playSplash() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.linearRampToValueAtTime(80, now + 0.25);

                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.26);
            } catch (e) {}
        }

        playSquash() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.linearRampToValueAtTime(40, now + 0.2);

                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.22);
            } catch (e) {}
        }

        playGoal() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((f, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(f, now + idx * 0.06);

                    gain.gain.setValueAtTime(0.22, now + idx * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.06);
                    osc.stop(now + idx * 0.06 + 0.16);
                });
            } catch (e) {}
        }

        playLevelClear() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const chords = [
                    { f: [523.25, 659.25, 783.99], t: 0 },
                    { f: [587.33, 739.99, 880.00], t: 0.14 },
                    { f: [659.25, 830.61, 987.77], t: 0.28 },
                    { f: [1046.50, 1318.51, 1567.98], t: 0.44 }
                ];
                chords.forEach(c => {
                    c.f.forEach(freq => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, now + c.t);

                        gain.gain.setValueAtTime(0.18, now + c.t);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + c.t + 0.25);

                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(now + c.t);
                        osc.stop(now + c.t + 0.26);
                    });
                });
            } catch (e) {}
        }

        playGameOver() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const notes = [329.63, 311.13, 293.66, 261.63, 220];
                notes.forEach((f, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(f, now + idx * 0.15);

                    gain.gain.setValueAtTime(0.2, now + idx * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.25);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.15);
                    osc.stop(now + idx * 0.15 + 0.26);
                });
            } catch (e) {}
        }
    }

    const audio = new HopperAudioEngine();

    // --- Game States ---
    const STATE = {
        TITLE: 0,
        PLAYING: 1,
        DEAD_ANIM: 2,
        LEVEL_CLEAR: 3,
        GAME_OVER: 4
    };

    let gameState = STATE.TITLE;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('pixel_hopper_highscore') || '0', 10);
    let lives = 3;
    let level = 1;
    let isPaused = false;
    let frameCount = 0;

    // Time limit per frog (60 seconds = 3600 frames at 60fps)
    const MAX_TIME = 60 * 30; // 30 seconds
    let timeLeft = MAX_TIME;

    // Goal Lily Pad Bays (5 bays in Row 1: cols 1, 4, 7, 10, 13)
    const GOAL_COLS = [1, 4, 7, 10, 13];
    let goalBays = [false, false, false, false, false];
    let bonusFly = { active: false, bayIdx: -1, timer: 0 };

    // --- Entity Collections ---
    let vehicles = [];
    let logs = [];
    let turtles = [];
    let particles = [];
    let floatingTexts = [];

    // --- Player Class ---
    class Frog {
        constructor() {
            this.reset();
        }

        reset() {
            this.col = 7;
            this.row = 13;
            this.x = this.col * TILE_SIZE + TILE_SIZE / 2;
            this.y = this.row * TILE_SIZE + TILE_SIZE / 2;
            this.targetX = this.x;
            this.targetY = this.y;
            this.dir = 0; // 0: Up, 1: Right, 2: Down, 3: Left
            this.isHopping = false;
            this.hopProgress = 0;
            this.radius = 14;
        }

        hop(dCol, dRow, dirIdx) {
            if (this.isHopping || gameState !== STATE.PLAYING) return;

            const nextCol = this.col + dCol;
            const nextRow = this.row + dRow;

            // Boundaries
            if (nextCol < 0 || nextCol >= COLS || nextRow < 1 || nextRow > 13) return;

            // Prevent hopping into grass between goal bays in row 1
            if (nextRow === 1) {
                const bayIdx = GOAL_COLS.indexOf(nextCol);
                if (bayIdx === -1 || goalBays[bayIdx]) {
                    // Not an open goal bay!
                    return;
                }
            }

            this.col = nextCol;
            this.row = nextRow;
            this.targetX = this.col * TILE_SIZE + TILE_SIZE / 2;
            this.targetY = this.row * TILE_SIZE + TILE_SIZE / 2;
            this.dir = dirIdx;
            this.isHopping = true;
            this.hopProgress = 0;

            audio.playHop();

            // Forward progress score
            if (dRow < 0) {
                score += 10;
            }
        }

        update() {
            // Smooth hop interpolation
            if (this.isHopping) {
                this.hopProgress += 0.2;
                if (this.hopProgress >= 1.0) {
                    this.hopProgress = 1.0;
                    this.isHopping = false;
                    this.x = this.targetX;
                    this.y = this.targetY;

                    // Check Goal Landing (Row 1)
                    if (this.row === 1) {
                        const bayIdx = GOAL_COLS.indexOf(this.col);
                        if (bayIdx !== -1 && !goalBays[bayIdx]) {
                            reachGoal(bayIdx);
                            return;
                        }
                    }
                } else {
                    this.x += (this.targetX - this.x) * 0.45;
                    this.y += (this.targetY - this.y) * 0.45;
                }
            }

            // River mechanics (Rows 2..6)
            if (this.row >= 2 && this.row <= 6 && !this.isHopping) {
                let onPlatform = false;
                let platSpeed = 0;

                // Check logs
                for (let log of logs) {
                    if (log.row === this.row &&
                        this.x >= log.x && this.x <= log.x + log.w) {
                        onPlatform = true;
                        platSpeed = log.speed;
                        break;
                    }
                }

                // Check turtles
                if (!onPlatform) {
                    for (let t of turtles) {
                        if (t.row === this.row && !t.isSubmerged &&
                            this.x >= t.x && this.x <= t.x + t.w) {
                            onPlatform = true;
                            platSpeed = t.speed;
                            break;
                        }
                    }
                }

                if (onPlatform) {
                    // Drift with platform
                    this.x += platSpeed;
                    this.targetX = this.x;
                    this.col = Math.floor(this.x / TILE_SIZE);

                    // Off-screen drift death
                    if (this.x < 10 || this.x > GAME_WIDTH - 10) {
                        killFrog('water');
                    }
                } else {
                    // Sunk into river!
                    killFrog('water');
                }
            }

            // Highway collision (Rows 8..12)
            if (this.row >= 8 && this.row <= 12) {
                for (let v of vehicles) {
                    if (v.row === this.row) {
                        if (this.x + this.radius > v.x &&
                            this.x - this.radius < v.x + v.w &&
                            this.y + this.radius > v.y &&
                            this.y - this.radius < v.y + v.h) {

                            killFrog('car');
                            break;
                        }
                    }
                }
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Rotate based on hop direction (0: Up, 1: Right, 2: Down, 3: Left)
            ctx.rotate(this.dir * Math.PI * 0.5);

            // Hop scale stretch
            let scaleX = 1.0;
            let scaleY = 1.0;
            if (this.isHopping) {
                const hopArc = Math.sin(this.hopProgress * Math.PI);
                scaleY = 1.0 + hopArc * 0.35;
                scaleX = 1.0 - hopArc * 0.2;
            }

            ctx.scale(scaleX, scaleY);

            // Frog Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(0, 4, 13, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Frog Body (Neon Green)
            ctx.shadowColor = '#39ff14';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#39ff14';
            ctx.beginPath();
            ctx.ellipse(0, 0, 12, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            // Hind Legs
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.ellipse(-12, 6, 5, 8, -0.4, 0, Math.PI * 2);
            ctx.ellipse(12, 6, 5, 8, 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Front Legs
            ctx.beginPath();
            ctx.ellipse(-11, -8, 4, 6, 0.4, 0, Math.PI * 2);
            ctx.ellipse(11, -8, 4, 6, -0.4, 0, Math.PI * 2);
            ctx.fill();

            // Big Cartoon Eyes
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-6, -11, 4.5, 0, Math.PI * 2);
            ctx.arc(6, -11, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#0a0a14';
            ctx.beginPath();
            ctx.arc(-6, -12, 2.2, 0, Math.PI * 2);
            ctx.arc(6, -12, 2.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // --- Vehicle Class ---
    class Vehicle {
        constructor(row, x, speed, type) {
            this.row = row;
            this.x = x;
            this.speed = speed;
            this.type = type; // 'sedan', 'taxi', 'truck', 'racecar'
            this.y = row * TILE_SIZE + 6;
            this.h = 28;

            switch (type) {
                case 'sedan':
                    this.w = 46;
                    this.color = '#e91e63';
                    break;
                case 'taxi':
                    this.w = 52;
                    this.color = '#ffea00';
                    break;
                case 'truck':
                    this.w = 98;
                    this.color = '#00f0ff';
                    break;
                case 'racecar':
                    this.w = 42;
                    this.color = '#ff1744';
                    break;
            }
        }

        update() {
            this.x += this.speed;

            // Wrap around screen
            if (this.speed > 0 && this.x > GAME_WIDTH + 30) {
                this.x = -this.w - 30;
            } else if (this.speed < 0 && this.x < -this.w - 30) {
                this.x = GAME_WIDTH + 30;
            }
        }

        draw(ctx) {
            ctx.save();

            // Vehicle Body
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.w, this.h, 6);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Windshield & Windows
            ctx.fillStyle = '#0f172a';
            const winOffset = this.speed > 0 ? 10 : 8;
            ctx.fillRect(this.x + winOffset, this.y + 4, this.w - 18, this.h - 8);

            // Headlights
            ctx.fillStyle = '#ffffff';
            if (this.speed > 0) {
                ctx.fillRect(this.x + this.w - 3, this.y + 3, 3, 5);
                ctx.fillRect(this.x + this.w - 3, this.y + this.h - 8, 3, 5);
            } else {
                ctx.fillRect(this.x, this.y + 3, 3, 5);
                ctx.fillRect(this.x, this.y + this.h - 8, 3, 5);
            }

            ctx.restore();
        }
    }

    // --- Floating Log Class ---
    class Log {
        constructor(row, x, w, speed) {
            this.row = row;
            this.x = x;
            this.w = w;
            this.speed = speed;
            this.y = row * TILE_SIZE + 6;
            this.h = 28;
        }

        update() {
            this.x += this.speed;
            if (this.speed > 0 && this.x > GAME_WIDTH + 40) {
                this.x = -this.w - 40;
            } else if (this.speed < 0 && this.x < -this.w - 40) {
                this.x = GAME_WIDTH + 40;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.fillStyle = '#795548';
            ctx.strokeStyle = '#4e342e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.w, this.h, 12);
            ctx.fill();
            ctx.stroke();

            // Wood grain rings
            ctx.fillStyle = '#5d4037';
            ctx.beginPath();
            ctx.ellipse(this.x + 8, this.y + this.h / 2, 4, 8, 0, 0, Math.PI * 2);
            ctx.ellipse(this.x + this.w - 8, this.y + this.h / 2, 4, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // --- Diving Turtle Class ---
    class TurtleGroup {
        constructor(row, x, count, speed, canDive) {
            this.row = row;
            this.x = x;
            this.count = count;
            this.speed = speed;
            this.canDive = canDive;
            this.y = row * TILE_SIZE + 6;
            this.w = count * 36;
            this.h = 28;

            this.diveCycle = Math.random() * 200;
            this.isSubmerged = false;
        }

        update() {
            this.x += this.speed;
            if (this.speed < 0 && this.x < -this.w - 30) {
                this.x = GAME_WIDTH + 30;
            }

            if (this.canDive) {
                this.diveCycle = (this.diveCycle + 1) % 240;
                // Submerged between 180 and 240
                this.isSubmerged = (this.diveCycle >= 170);
            }
        }

        draw(ctx) {
            ctx.save();

            for (let i = 0; i < this.count; i++) {
                const tx = this.x + i * 36 + 18;
                const ty = this.y + this.h / 2;

                if (this.isSubmerged) {
                    // Water bubbles when submerged
                    ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
                    ctx.beginPath();
                    ctx.arc(tx, ty, 10, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Warning flash when about to dive
                    if (this.canDive && this.diveCycle >= 140) {
                        ctx.fillStyle = Math.floor(frameCount / 6) % 2 === 0 ? '#ffea00' : '#2e7d32';
                    } else {
                        ctx.fillStyle = '#2e7d32';
                    }

                    // Shell
                    ctx.beginPath();
                    ctx.arc(tx, ty, 13, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#1b5e20';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Shell segments
                    ctx.fillStyle = '#1b5e20';
                    ctx.fillRect(tx - 3, ty - 6, 6, 12);
                    ctx.fillRect(tx - 6, ty - 3, 12, 6);
                }
            }

            ctx.restore();
        }
    }

    // --- Entity Instances ---
    let frog = new Frog();

    function initLevelEntities() {
        vehicles = [];
        logs = [];
        turtles = [];
        particles = [];
        floatingTexts = [];

        const speedMult = 1 + (level - 1) * 0.15;

        // Highway Vehicles (Rows 8..12)
        // Row 8: Sedans (Left)
        vehicles.push(new Vehicle(8, 100, -2.2 * speedMult, 'sedan'));
        vehicles.push(new Vehicle(8, 320, -2.2 * speedMult, 'sedan'));
        vehicles.push(new Vehicle(8, 520, -2.2 * speedMult, 'sedan'));

        // Row 9: Heavy Trucks (Right)
        vehicles.push(new Vehicle(9, 60, 1.8 * speedMult, 'truck'));
        vehicles.push(new Vehicle(9, 360, 1.8 * speedMult, 'truck'));

        // Row 10: Yellow Taxis (Left)
        vehicles.push(new Vehicle(10, 80, -2.6 * speedMult, 'taxi'));
        vehicles.push(new Vehicle(10, 260, -2.6 * speedMult, 'taxi'));
        vehicles.push(new Vehicle(10, 440, -2.6 * speedMult, 'taxi'));

        // Row 11: Turbo Racecars (Right)
        vehicles.push(new Vehicle(11, 40, 3.6 * speedMult, 'racecar'));
        vehicles.push(new Vehicle(11, 380, 3.6 * speedMult, 'racecar'));

        // Row 12: Classic Sedans (Left)
        vehicles.push(new Vehicle(12, 120, -2.0 * speedMult, 'sedan'));
        vehicles.push(new Vehicle(12, 380, -2.0 * speedMult, 'sedan'));

        // River Floating Platforms (Rows 2..6)
        // Row 2: Medium Logs (Right)
        logs.push(new Log(2, 60, 120, 2.0 * speedMult));
        logs.push(new Log(2, 320, 120, 2.0 * speedMult));

        // Row 3: Diving Turtles (Left)
        turtles.push(new TurtleGroup(3, 100, 3, -2.2 * speedMult, true));
        turtles.push(new TurtleGroup(3, 340, 3, -2.2 * speedMult, true));

        // Row 4: Giant Logs (Right)
        logs.push(new Log(4, 80, 180, 2.5 * speedMult));
        logs.push(new Log(4, 380, 180, 2.5 * speedMult));

        // Row 5: Diving Turtles (Left)
        turtles.push(new TurtleGroup(5, 80, 2, -2.4 * speedMult, false));
        turtles.push(new TurtleGroup(5, 260, 2, -2.4 * speedMult, true));
        turtles.push(new TurtleGroup(5, 440, 2, -2.4 * speedMult, false));

        // Row 6: Small Logs (Right)
        logs.push(new Log(6, 40, 90, 1.9 * speedMult));
        logs.push(new Log(6, 220, 90, 1.9 * speedMult));
        logs.push(new Log(6, 420, 90, 1.9 * speedMult));
    }

    function reachGoal(bayIdx) {
        goalBays[bayIdx] = true;
        audio.playGoal();

        const timeBonus = Math.floor(timeLeft / 30) * 10;
        const totalBonus = 200 + timeBonus;
        score += totalBonus;
        addFloatingText(`+${totalBonus}!`, frog.x, frog.y - 10, '#39ff14');
        createSparks(frog.x, frog.y, '#39ff14', 16);

        // Check if all 5 bays filled
        const allFilled = goalBays.every(b => b === true);
        if (allFilled) {
            gameState = STATE.LEVEL_CLEAR;
            audio.playLevelClear();
            score += 1000;
            addFloatingText('LEVEL COMPLETE! +1000', GAME_WIDTH / 2, GAME_HEIGHT / 2, '#ffea00');

            setTimeout(() => {
                level++;
                goalBays = [false, false, false, false, false];
                initLevelEntities();
                frog.reset();
                timeLeft = MAX_TIME;
                gameState = STATE.PLAYING;
            }, 2200);
        } else {
            // Reset frog for next run
            frog.reset();
            timeLeft = MAX_TIME;
        }
    }

    function killFrog(cause) {
        gameState = STATE.DEAD_ANIM;
        if (cause === 'water') {
            audio.playSplash();
            createSparks(frog.x, frog.y, '#00f0ff', 18);
        } else {
            audio.playSquash();
            createSparks(frog.x, frog.y, '#ff1744', 18);
        }

        setTimeout(() => {
            lives--;
            if (lives <= 0) {
                gameState = STATE.GAME_OVER;
                audio.playGameOver();
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('pixel_hopper_highscore', highScore.toString());
                }
            } else {
                frog.reset();
                timeLeft = MAX_TIME;
                gameState = STATE.PLAYING;
            }
        }, 1200);
    }

    function createSparks(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 4 + 1;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: color,
                size: Math.random() * 3 + 2,
                life: 1.0,
                decay: 0.05
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

    function startNewGame() {
        score = 0;
        lives = 3;
        level = 1;
        goalBays = [false, false, false, false, false];
        initLevelEntities();
        frog.reset();
        timeLeft = MAX_TIME;
        gameState = STATE.PLAYING;
        audio.playHop();
    }

    // --- Main Update Loop ---
    function update() {
        frameCount++;

        if (isPaused) return;

        // Update Vehicles & Floating Platforms
        vehicles.forEach(v => v.update());
        logs.forEach(l => l.update());
        turtles.forEach(t => t.update());

        if (gameState === STATE.PLAYING) {
            frog.update();

            // Time Countdown
            timeLeft--;
            if (timeLeft <= 0) {
                killFrog('water');
            }
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const pt = particles[i];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.life -= pt.decay;
            if (pt.life <= 0) particles.splice(i, 1);
        }

        // Floating texts
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const t = floatingTexts[i];
            t.y += t.vy;
            t.life -= 0.02;
            if (t.life <= 0) floatingTexts.splice(i, 1);
        }
    }

    // --- Main Render / Drawing Loop ---
    function render() {
        ctx.save();

        // 1. Draw Background Lanes
        drawBackgroundLanes(ctx);

        // 2. Draw Floating Logs & Turtles
        logs.forEach(l => l.draw(ctx));
        turtles.forEach(t => t.draw(ctx));

        // 3. Draw Vehicles
        vehicles.forEach(v => v.draw(ctx));

        // 4. Draw Goal Lily Pads (Row 1)
        drawGoalBays(ctx);

        // 5. Draw Frog
        if (gameState !== STATE.DEAD_ANIM) {
            frog.draw(ctx);
        }

        // 6. Draw Particles
        for (let pt of particles) {
            ctx.save();
            ctx.globalAlpha = pt.life;
            ctx.fillStyle = pt.color;
            ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
            ctx.restore();
        }

        // 7. Draw Floating Texts
        for (let t of floatingTexts) {
            ctx.save();
            ctx.globalAlpha = t.life;
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 6;
            ctx.fillStyle = t.color;
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }

        // 8. Draw Top HUD (Row 0)
        drawHUD(ctx);

        // 9. Draw Bottom Time Bar (Row 14)
        drawTimeBar(ctx);

        // 10. Overlays
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

    function drawBackgroundLanes(ctx) {
        // Row 0: Top HUD Banner
        ctx.fillStyle = '#06040a';
        ctx.fillRect(0, 0, GAME_WIDTH, TILE_SIZE);

        // Row 1: Goal Bank Grass
        ctx.fillStyle = '#1b5e20';
        ctx.fillRect(0, TILE_SIZE, GAME_WIDTH, TILE_SIZE);

        // Rows 2..6: River (Deep Water)
        ctx.fillStyle = '#0277bd';
        ctx.fillRect(0, 2 * TILE_SIZE, GAME_WIDTH, 5 * TILE_SIZE);

        // Water ripples
        ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
        for (let r = 2; r <= 6; r++) {
            const waveOff = (frameCount * 1.5 + r * 50) % GAME_WIDTH;
            ctx.fillRect(waveOff, r * TILE_SIZE + 10, 40, 2);
            ctx.fillRect((waveOff + 200) % GAME_WIDTH, r * TILE_SIZE + 24, 50, 2);
        }

        // Row 7: Middle Safe Grass Median
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(0, 7 * TILE_SIZE, GAME_WIDTH, TILE_SIZE);
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, 7 * TILE_SIZE, GAME_WIDTH, TILE_SIZE);

        // Rows 8..12: Highway (Asphalt)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 8 * TILE_SIZE, GAME_WIDTH, 5 * TILE_SIZE);

        // Highway dashed white lane dividers
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([16, 16]);
        for (let r = 9; r <= 12; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * TILE_SIZE);
            ctx.lineTo(GAME_WIDTH, r * TILE_SIZE);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Row 13: Bottom Safe Starting Sidewalk
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(0, 13 * TILE_SIZE, GAME_WIDTH, TILE_SIZE);

        // Row 14: Bottom Controls / Time bar
        ctx.fillStyle = '#06040a';
        ctx.fillRect(0, 14 * TILE_SIZE, GAME_WIDTH, TILE_SIZE);
    }

    function drawGoalBays(ctx) {
        GOAL_COLS.forEach((colIdx, bayIdx) => {
            const bx = colIdx * TILE_SIZE;
            const by = TILE_SIZE;

            // Water bay cutout
            ctx.fillStyle = '#0277bd';
            ctx.fillRect(bx + 4, by + 4, TILE_SIZE - 8, TILE_SIZE - 8);

            // Lily Pad
            ctx.fillStyle = '#388e3c';
            ctx.beginPath();
            ctx.arc(bx + TILE_SIZE / 2, by + TILE_SIZE / 2, 14, 0, Math.PI * 2);
            ctx.fill();

            // Docked Frog or Star
            if (goalBays[bayIdx]) {
                ctx.fillStyle = '#ffd700';
                ctx.font = '14px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🐸', bx + TILE_SIZE / 2, by + TILE_SIZE / 2 + 2);
            }
        });
    }

    function drawHUD(ctx) {
        ctx.save();
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.textBaseline = 'middle';

        // Score
        ctx.fillStyle = '#ffea00';
        ctx.textAlign = 'left';
        ctx.fillText(`1-UP ${score}`, 16, TILE_SIZE / 2);

        // High Score
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(`HI: ${highScore}`, GAME_WIDTH / 2, TILE_SIZE / 2);

        // Level
        ctx.fillStyle = '#00f0ff';
        ctx.textAlign = 'right';
        ctx.fillText(`LVL ${level}`, GAME_WIDTH - 16, TILE_SIZE / 2);

        ctx.restore();
    }

    function drawTimeBar(ctx) {
        ctx.save();
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textBaseline = 'middle';

        // Lives at bottom left
        ctx.fillStyle = '#39ff14';
        ctx.textAlign = 'left';
        let livesStr = '';
        for (let i = 0; i < lives; i++) livesStr += '🐸 ';
        ctx.fillText(livesStr, 14, 14 * TILE_SIZE + TILE_SIZE / 2);

        // Time Label
        ctx.fillStyle = '#ffea00';
        ctx.textAlign = 'right';
        ctx.fillText('TIME', GAME_WIDTH - 200, 14 * TILE_SIZE + TILE_SIZE / 2);

        // Time gauge bar
        const barW = 160;
        const barH = 10;
        const barX = GAME_WIDTH - 180;
        const barY = 14 * TILE_SIZE + (TILE_SIZE - barH) / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX, barY, barW, barH);

        const fillW = Math.max(0, (timeLeft / MAX_TIME) * barW);
        ctx.fillStyle = timeLeft < MAX_TIME * 0.25 ? '#ff1744' : '#39ff14';
        ctx.fillRect(barX, barY, fillW, barH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        ctx.restore();
    }

    function drawTitleOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(4, 6, 12, 0.9)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const cx = GAME_WIDTH / 2;
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#39ff14';
        ctx.font = '26px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PIXEL HOPPER', cx, 200);

        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#00f0ff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('RETRO ARCADE CROSSING', cx, 240);

        const pulse = (Math.sin(frameCount * 0.08) + 1) * 0.5;
        ctx.shadowBlur = 0;
        ctx.fillStyle = pulse > 0.3 ? '#ffea00' : 'rgba(255, 234, 0, 0.4)';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText('CLICK / TAP / SPACE TO START', cx, 340);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('ARROWS / [W][A][S][D] / SWIPE TO HOP', cx, 400);
        ctx.fillText('DODGE CARS & RIDE LOGS TO LILY PADS', cx, 430);
        ctx.fillText('BEWARE OF DIVING TURTLES!', cx, 460);

        ctx.restore();
    }

    function drawGameOverOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(4, 6, 12, 0.92)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const cx = GAME_WIDTH / 2;
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#ff1744';
        ctx.font = '26px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', cx, 220);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(`FINAL SCORE: ${score}`, cx, 280);

        ctx.fillStyle = '#ffd700';
        ctx.fillText(`HIGH SCORE: ${highScore}`, cx, 320);

        const pulse = (Math.sin(frameCount * 0.08) + 1) * 0.5;
        ctx.fillStyle = pulse > 0.3 ? '#39ff14' : 'rgba(57, 255, 20, 0.3)';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText('CLICK / TAP / SPACE TO RESTART', cx, 420);

        ctx.restore();
    }

    function drawPauseOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(4, 6, 12, 0.85)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#00f0ff';
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('HOPPER PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText('PRESS [P] OR PAUSE BUTTON TO RESUME', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);

        ctx.restore();
    }

    // --- Input & Event Listeners ---
    function handleHopInput(dCol, dRow, dirIdx) {
        audio.init();
        if (gameState === STATE.TITLE || gameState === STATE.GAME_OVER) {
            startNewGame();
            return;
        }
        frog.hop(dCol, dRow, dirIdx);
    }

    window.addEventListener('keydown', e => {
        audio.init();

        if (gameState === STATE.TITLE || gameState === STATE.GAME_OVER) {
            if (e.code === 'Space' || e.code === 'Enter') {
                startNewGame();
                return;
            }
        }

        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                handleHopInput(0, -1, 0);
                break;
            case 'ArrowRight':
            case 'KeyD':
                e.preventDefault();
                handleHopInput(1, 0, 1);
                break;
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                handleHopInput(0, 1, 2);
                break;
            case 'ArrowLeft':
            case 'KeyA':
                e.preventDefault();
                handleHopInput(-1, 0, 3);
                break;
            case 'KeyP':
                togglePause();
                break;
        }
    });

    canvas.addEventListener('click', () => {
        audio.init();
        if (gameState === STATE.TITLE || gameState === STATE.GAME_OVER) {
            startNewGame();
        }
    });

    // Touch Swipe Detection
    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        audio.init();
        if (gameState === STATE.TITLE || gameState === STATE.GAME_OVER) {
            startNewGame();
            return;
        }
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
        if (e.changedTouches.length === 0) return;
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;

        if (Math.hypot(dx, dy) > 20) {
            if (Math.abs(dx) > Math.abs(dy)) {
                handleHopInput(dx > 0 ? 1 : -1, 0, dx > 0 ? 1 : 3);
            } else {
                handleHopInput(0, dy > 0 ? 1 : -1, dy > 0 ? 2 : 0);
            }
        }
    });

    // Mobile Virtual D-Pad buttons
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    if (btnUp) btnUp.addEventListener('click', () => handleHopInput(0, -1, 0));
    if (btnDown) btnDown.addEventListener('click', () => handleHopInput(0, 1, 2));
    if (btnLeft) btnLeft.addEventListener('click', () => handleHopInput(-1, 0, 3));
    if (btnRight) btnRight.addEventListener('click', () => handleHopInput(1, 0, 1));

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
            localStorage.setItem('pixel_hopper_muted', audio.muted.toString());
            updateSoundBtn();
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

    // --- Init & Start Loop ---
    initLevelEntities();

    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);

})();

