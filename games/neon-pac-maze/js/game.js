/* ==========================================================================
   NEON PAC-MAZE — Cyberpunk / Synthwave Arcade Engine
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // --- Canvas & Context Setup ---
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const COLS = 28;
    const ROWS = 31;
    const TILE_SIZE = 20;

    const GAME_WIDTH = COLS * TILE_SIZE; // 560
    const GAME_HEIGHT = (ROWS * TILE_SIZE) + 20; // 640 (extra 20px for bottom HUD)

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    // --- Audio Engine ---
    class NeonPacAudio {
        constructor() {
            this.ctx = null;
            this.muted = localStorage.getItem('neon_pac_muted') === 'true';
            this.chompToggle = false;
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

        playChomp() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                this.chompToggle = !this.chompToggle;
                const freq = this.chompToggle ? 320 : 480;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.06);

                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.07);
            } catch (e) {}
        }

        playPowerPellet() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.linearRampToValueAtTime(280, now + 0.15);

                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.21);
            } catch (e) {}
        }

        playEatGhost() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const freqs = [350, 440, 587.33, 700];
                freqs.forEach((f, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(f, now + idx * 0.05);

                    gain.gain.setValueAtTime(0.2, now + idx * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.05);
                    osc.stop(now + idx * 0.05 + 0.13);
                });
            } catch (e) {}
        }

        playFruit() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const freqs = [523.25, 659.25, 783.99, 1046.50];
                freqs.forEach((f, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(f, now + idx * 0.06);

                    gain.gain.setValueAtTime(0.2, now + idx * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.06);
                    osc.stop(now + idx * 0.06 + 0.16);
                });
            } catch (e) {}
        }

        playDeath() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.6);

                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.66);
            } catch (e) {}
        }

        playStart() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const notes = [261.63, 293.66, 329.63, 392.00, 523.25];
                notes.forEach((f, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(f, now + idx * 0.1);

                    gain.gain.setValueAtTime(0.22, now + idx * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.2);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.1);
                    osc.stop(now + idx * 0.1 + 0.22);
                });
            } catch (e) {}
        }
    }

    const audio = new NeonPacAudio();

    // --- Game States ---
    const STATE = {
        TITLE: 0,
        READY: 1,
        PLAYING: 2,
        PAC_DYING: 3,
        LEVEL_CLEAR: 4,
        GAME_OVER: 5
    };

    let gameState = STATE.TITLE;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('neon_pac_highscore') || '0', 10);
    let lives = 3;
    let level = 1;
    let isPaused = false;
    let frameCount = 0;
    let ghostsEatenChain = 0;

    // --- Directions ---
    const DIR = {
        NONE: 0,
        UP: 1,
        DOWN: 2,
        LEFT: 3,
        RIGHT: 4
    };

    const DIR_OFFSET = {
        [DIR.NONE]: { x: 0, y: 0 },
        [DIR.UP]: { x: 0, y: -1 },
        [DIR.DOWN]: { x: 0, y: 1 },
        [DIR.LEFT]: { x: -1, y: 0 },
        [DIR.RIGHT]: { x: 1, y: 0 }
    };

    // --- Maze Matrix Definition ---
    // 0: Empty / Path
    // 1: Wall
    // 2: Dot
    // 3: Power Pellet
    // 4: Ghost House Door
    // 5: Ghost House Interior
    const RAW_MAZE = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
        [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
        [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
        [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
        [0,0,0,0,0,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,0,0,0,0,0],
        [1,1,1,1,1,1,2,1,1,0,1,5,5,5,5,5,5,1,0,1,1,2,1,1,1,1,1,1],
        [0,0,0,0,0,0,2,0,0,0,1,5,5,5,5,5,5,1,0,0,0,2,0,0,0,0,0,0],
        [1,1,1,1,1,1,2,1,1,0,1,5,5,5,5,5,5,1,0,1,1,2,1,1,1,1,1,1],
        [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
        [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
        [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
        [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
        [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
        [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
        [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
        [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    let maze = [];
    let totalDots = 0;
    let dotsRemaining = 0;

    function resetMaze() {
        maze = [];
        totalDots = 0;
        for (let r = 0; r < ROWS; r++) {
            maze[r] = [];
            for (let c = 0; c < COLS; c++) {
                const val = RAW_MAZE[r][c];
                maze[r][c] = val;
                if (val === 2 || val === 3) totalDots++;
            }
        }
        dotsRemaining = totalDots;
    }

    // --- Entity Classes ---

    class PacMan {
        constructor() {
            this.reset();
        }

        reset() {
            this.col = 13;
            this.row = 23;
            this.x = this.col * TILE_SIZE + TILE_SIZE / 2;
            this.y = this.row * TILE_SIZE + TILE_SIZE / 2;
            this.dir = DIR.NONE;
            this.nextDir = DIR.NONE;
            this.speed = 2.4;
            this.mouthAngle = 0.2;
            this.mouthOpening = true;
            this.deathAnim = 0;
        }

        update() {
            if (gameState !== STATE.PLAYING) return;

            // Turn buffering / direction changes
            if (this.nextDir !== this.dir) {
                if (this.canMoveInDir(this.nextDir)) {
                    // Snap to grid axis before turning
                    if ((this.dir === DIR.LEFT || this.dir === DIR.RIGHT) && (this.nextDir === DIR.UP || this.nextDir === DIR.DOWN)) {
                        this.x = Math.round((this.x - TILE_SIZE / 2) / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                    } else if ((this.dir === DIR.UP || this.dir === DIR.DOWN) && (this.nextDir === DIR.LEFT || this.nextDir === DIR.RIGHT)) {
                        this.y = Math.round((this.y - TILE_SIZE / 2) / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                    }
                    this.dir = this.nextDir;
                }
            }

            // Move
            if (this.canMoveInDir(this.dir)) {
                const offset = DIR_OFFSET[this.dir];
                this.x += offset.x * this.speed;
                this.y += offset.y * this.speed;

                // Animate mouth
                if (this.mouthOpening) {
                    this.mouthAngle += 0.04;
                    if (this.mouthAngle >= 0.45) this.mouthOpening = false;
                } else {
                    this.mouthAngle -= 0.04;
                    if (this.mouthAngle <= 0.05) this.mouthOpening = true;
                }
            }

            // Screen Wrap Tunnel (row 14)
            if (this.x < -TILE_SIZE / 2) {
                this.x = GAME_WIDTH + TILE_SIZE / 2;
            } else if (this.x > GAME_WIDTH + TILE_SIZE / 2) {
                this.x = -TILE_SIZE / 2;
            }

            this.col = Math.floor(this.x / TILE_SIZE);
            this.row = Math.floor(this.y / TILE_SIZE);

            // Eat dots
            this.eatDot();
        }

        canMoveInDir(dir) {
            if (dir === DIR.NONE) return false;

            const offset = DIR_OFFSET[dir];
            // Test 10px forward
            const checkX = this.x + offset.x * (TILE_SIZE * 0.55);
            const checkY = this.y + offset.y * (TILE_SIZE * 0.55);
            const checkCol = Math.floor(checkX / TILE_SIZE);
            const checkRow = Math.floor(checkY / TILE_SIZE);

            // Wrap tunnel check
            if (checkRow === 14 && (checkCol < 0 || checkCol >= COLS)) return true;

            if (checkCol < 0 || checkCol >= COLS || checkRow < 0 || checkRow >= ROWS) return false;

            const tile = maze[checkRow][checkCol];
            return (tile !== 1 && tile !== 4 && tile !== 5);
        }

        eatDot() {
            if (this.col >= 0 && this.col < COLS && this.row >= 0 && this.row < ROWS) {
                const tile = maze[this.row][this.col];
                if (tile === 2) {
                    // Regular dot
                    maze[this.row][this.col] = 0;
                    score += 10;
                    dotsRemaining--;
                    audio.playChomp();
                    createSparks(this.x, this.y, '#ffea00', 3);
                    checkLevelClear();
                } else if (tile === 3) {
                    // Power Pellet
                    maze[this.row][this.col] = 0;
                    score += 50;
                    dotsRemaining--;
                    audio.playPowerPellet();
                    createSparks(this.x, this.y, '#00f0ff', 12);
                    frightenGhosts();
                    checkLevelClear();
                }
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Facing angle
            let rot = 0;
            if (this.dir === DIR.DOWN) rot = Math.PI * 0.5;
            else if (this.dir === DIR.LEFT) rot = Math.PI;
            else if (this.dir === DIR.UP) rot = Math.PI * 1.5;

            ctx.rotate(rot);

            // Neon yellow glow
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 15;

            // Chomping arc
            ctx.fillStyle = '#ffea00';
            ctx.beginPath();
            ctx.arc(0, 0, TILE_SIZE * 0.45, this.mouthAngle * Math.PI, (2 - this.mouthAngle) * Math.PI);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();

            // Highlight shine
            ctx.beginPath();
            ctx.arc(2, -4, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            ctx.restore();
        }
    }

    class Ghost {
        constructor(type, homeCol, homeRow, color) {
            this.type = type; // 'blinky', 'pinky', 'inky', 'clyde'
            this.homeCol = homeCol;
            this.homeRow = homeRow;
            this.color = color;
            this.reset();
        }

        reset() {
            this.dir = DIR.UP;
            this.mode = 'chase'; // 'chase', 'scatter', 'frightened', 'eaten'
            this.frightenedTimer = 0;
            this.speed = 2.0;

            if (this.type === 'blinky') {
                this.col = 13;
                this.row = 11;
                this.inHouse = false;
                this.exitTimer = 0;
            } else if (this.type === 'pinky') {
                this.col = 13;
                this.row = 14;
                this.inHouse = true;
                this.exitTimer = 60 * 1;
            } else if (this.type === 'inky') {
                this.col = 12;
                this.row = 14;
                this.inHouse = true;
                this.exitTimer = 60 * 3.5;
            } else { // clyde
                this.col = 15;
                this.row = 14;
                this.inHouse = true;
                this.exitTimer = 60 * 6;
            }

            this.x = this.col * TILE_SIZE + TILE_SIZE / 2;
            this.y = this.row * TILE_SIZE + TILE_SIZE / 2;
            this.animSkirt = 0;
        }

        update() {
            if (gameState !== STATE.PLAYING) return;

            this.animSkirt += 0.2;

            // Frightened countdown
            if (this.mode === 'frightened') {
                this.frightenedTimer--;
                this.speed = 1.3;
                if (this.frightenedTimer <= 0) {
                    this.mode = 'chase';
                    this.speed = 2.0;
                }
            } else if (this.mode === 'eaten') {
                this.speed = 4.0;
                // Reached ghost house entry?
                if (Math.abs(this.x - (13.5 * TILE_SIZE)) < 8 && Math.abs(this.y - (11 * TILE_SIZE + TILE_SIZE / 2)) < 8) {
                    this.mode = 'chase';
                    this.speed = 2.0;
                    this.inHouse = false;
                }
            } else {
                this.speed = 2.0;
            }

            // In-house emergence logic
            if (this.inHouse) {
                this.exitTimer--;
                if (this.exitTimer <= 0) {
                    const targetX = 13.5 * TILE_SIZE;
                    const targetY = 11 * TILE_SIZE + TILE_SIZE / 2;

                    if (Math.abs(this.x - targetX) > 1.5) {
                        this.x += Math.sign(targetX - this.x) * 1.5;
                    } else if (this.y > targetY) {
                        this.y -= 1.5;
                        this.dir = DIR.UP;
                    } else {
                        // Fully exited into maze!
                        this.inHouse = false;
                        this.dir = DIR.LEFT;
                        this.col = 13;
                        this.row = 11;
                        this.x = this.col * TILE_SIZE + TILE_SIZE / 2;
                        this.y = this.row * TILE_SIZE + TILE_SIZE / 2;
                    }
                } else {
                    // Gentle floating bob in place
                    this.y += Math.sin(frameCount * 0.1) * 0.3;
                }
                return;
            }

            // Normal maze navigation
            this.col = Math.floor(this.x / TILE_SIZE);
            this.row = Math.floor(this.y / TILE_SIZE);

            const tileCenterX = this.col * TILE_SIZE + TILE_SIZE / 2;
            const tileCenterY = this.row * TILE_SIZE + TILE_SIZE / 2;

            const atIntersection = Math.hypot(this.x - tileCenterX, this.y - tileCenterY) < this.speed;

            if (atIntersection) {
                this.x = tileCenterX;
                this.y = tileCenterY;
                this.chooseNextDirection();
            }

            // If current direction is blocked by wall, force direction re-evaluation
            if (!this.canMoveInDir(this.dir)) {
                this.x = tileCenterX;
                this.y = tileCenterY;
                this.chooseNextDirection();
            }

            // Move
            const offset = DIR_OFFSET[this.dir];
            this.x += offset.x * this.speed;
            this.y += offset.y * this.speed;

            // Wrap tunnel (row 14)
            if (this.x < -TILE_SIZE / 2) {
                this.x = GAME_WIDTH + TILE_SIZE / 2;
            } else if (this.x > GAME_WIDTH + TILE_SIZE / 2) {
                this.x = -TILE_SIZE / 2;
            }

            this.col = Math.floor(this.x / TILE_SIZE);
            this.row = Math.floor(this.y / TILE_SIZE);
        }

        canMoveInDir(d) {
            const off = DIR_OFFSET[d];
            const nextC = this.col + off.x;
            const nextR = this.row + off.y;

            if (nextR === 14 && (nextC < 0 || nextC >= COLS)) return true; // wrap tunnel
            if (nextC < 0 || nextC >= COLS || nextR < 0 || nextR >= ROWS) return false;

            const tile = maze[nextR][nextC];
            if (tile === 1) return false; // Wall
            if (tile === 4 && this.mode !== 'eaten') return false; // Ghost door (only passable when eaten)
            if (tile === 5 && this.mode !== 'eaten') return false; // Inside ghost house
            return true;
        }

        chooseNextDirection() {
            let targetCol = pacman.col;
            let targetRow = pacman.row;

            if (this.mode === 'scatter') {
                targetCol = this.homeCol;
                targetRow = this.homeRow;
            } else if (this.mode === 'eaten') {
                targetCol = 13;
                targetRow = 11;
            } else if (this.mode === 'frightened') {
                const validDirs = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT].filter(d => this.canMoveInDir(d));
                if (validDirs.length > 0) {
                    this.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
                }
                return;
            } else {
                // Chase modes
                if (this.type === 'blinky') {
                    targetCol = pacman.col;
                    targetRow = pacman.row;
                } else if (this.type === 'pinky') {
                    const off = DIR_OFFSET[pacman.dir];
                    targetCol = pacman.col + off.x * 4;
                    targetRow = pacman.row + off.y * 4;
                } else if (this.type === 'inky') {
                    const blinky = ghosts[0];
                    const off = DIR_OFFSET[pacman.dir];
                    const pivotCol = pacman.col + off.x * 2;
                    const pivotRow = pacman.row + off.y * 2;
                    targetCol = pivotCol + (pivotCol - blinky.col);
                    targetRow = pivotRow + (pivotRow - blinky.row);
                } else if (this.type === 'clyde') {
                    const d = Math.hypot(this.col - pacman.col, this.row - pacman.row);
                    if (d > 8) {
                        targetCol = pacman.col;
                        targetRow = pacman.row;
                    } else {
                        targetCol = this.homeCol;
                        targetRow = this.homeRow;
                    }
                }
            }

            const opposite = {
                [DIR.UP]: DIR.DOWN,
                [DIR.DOWN]: DIR.UP,
                [DIR.LEFT]: DIR.RIGHT,
                [DIR.RIGHT]: DIR.LEFT
            };

            const candidates = [DIR.UP, DIR.LEFT, DIR.DOWN, DIR.RIGHT];
            let bestDir = this.dir;
            let bestDist = Infinity;

            for (let d of candidates) {
                // Cannot reverse direction unless no other move is available
                if (d === opposite[this.dir] && candidates.some(other => other !== d && other !== opposite[this.dir] && this.canMoveInDir(other))) {
                    continue;
                }

                if (!this.canMoveInDir(d)) continue;

                const off = DIR_OFFSET[d];
                const nextC = this.col + off.x;
                const nextR = this.row + off.y;

                const dist = Math.hypot(nextC - targetCol, nextR - targetRow);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = d;
                }
            }

            this.dir = bestDir;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            const r = TILE_SIZE * 0.45;

            if (this.mode === 'eaten') {
                // Just floating digital eyes
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-6, -4, 4, 6);
                ctx.fillRect(2, -4, 4, 6);
                ctx.fillStyle = '#00f0ff';
                ctx.fillRect(-5, -2, 2, 3);
                ctx.fillRect(3, -2, 2, 3);
                ctx.restore();
                return;
            }

            // Ghost Color
            let ghostColor = this.color;
            if (this.mode === 'frightened') {
                // Flashing white if almost recovered (<120 frames)
                if (this.frightenedTimer < 120 && Math.floor(frameCount / 12) % 2 === 0) {
                    ghostColor = '#ffffff';
                } else {
                    ghostColor = '#2979ff';
                }
            }

            ctx.shadowColor = ghostColor;
            ctx.shadowBlur = 12;

            // Ghost Dome & Skirt
            ctx.fillStyle = ghostColor;
            ctx.beginPath();
            ctx.arc(0, -2, r, Math.PI, 0, false);
            ctx.lineTo(r, r);

            // Wavy trailing skirt
            const wave = Math.sin(this.animSkirt) * 2;
            ctx.lineTo(r * 0.5, r - 3 + wave);
            ctx.lineTo(0, r);
            ctx.lineTo(-r * 0.5, r - 3 - wave);
            ctx.lineTo(-r, r);
            ctx.closePath();
            ctx.fill();

            // Big Cartoon Eyes
            if (this.mode === 'frightened') {
                ctx.fillStyle = '#ffea00';
                ctx.fillRect(-4, -3, 3, 3);
                ctx.fillRect(2, -3, 3, 3);
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(-3, -3, 3, 4, 0, 0, Math.PI * 2);
                ctx.ellipse(3, -3, 3, 4, 0, 0, Math.PI * 2);
                ctx.fill();

                // Pupils pointing in facing direction
                const off = DIR_OFFSET[this.dir];
                ctx.fillStyle = '#111122';
                ctx.beginPath();
                ctx.arc(-3 + off.x * 1.5, -3 + off.y * 1.5, 1.8, 0, Math.PI * 2);
                ctx.arc(3 + off.x * 1.5, -3 + off.y * 1.5, 1.8, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // --- Entity Instances ---
    let pacman = new PacMan();
    let ghosts = [
        new Ghost('blinky', 25, 0, '#ff1744'), // Red
        new Ghost('pinky', 2, 0, '#ff007f'),  // Pink
        new Ghost('inky', 27, 30, '#00f0ff'), // Cyan
        new Ghost('clyde', 0, 30, '#ff9100')  // Orange
    ];
    let particles = [];
    let floatingTexts = [];

    // --- Helpers ---
    function frightenGhosts() {
        ghostsEatenChain = 0;
        ghosts.forEach(g => {
            if (g.mode !== 'eaten') {
                g.mode = 'frightened';
                g.frightenedTimer = 60 * 8; // 8 seconds
            }
        });
    }

    function checkCollisions() {
        for (let g of ghosts) {
            const dist = Math.hypot(g.x - pacman.x, g.y - pacman.y);
            if (dist < TILE_SIZE * 0.75) {
                if (g.mode === 'frightened') {
                    // Eat ghost!
                    g.mode = 'eaten';
                    ghostsEatenChain++;
                    const pts = 200 * Math.pow(2, ghostsEatenChain - 1);
                    score += pts;
                    audio.playEatGhost();
                    addFloatingText(`+${pts}`, g.x, g.y - 12, '#00f0ff');
                    createSparks(g.x, g.y, '#00f0ff', 16);
                } else if (g.mode === 'chase' || g.mode === 'scatter') {
                    // Pac-Man caught!
                    pacmanDeath();
                    break;
                }
            }
        }
    }

    function pacmanDeath() {
        gameState = STATE.PAC_DYING;
        audio.playDeath();
        createSparks(pacman.x, pacman.y, '#ffea00', 25);

        setTimeout(() => {
            lives--;
            if (lives <= 0) {
                gameState = STATE.GAME_OVER;
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('neon_pac_highscore', highScore.toString());
                }
            } else {
                pacman.reset();
                ghosts.forEach(g => g.reset());
                gameState = STATE.READY;
            }
        }, 1500);
    }

    function checkLevelClear() {
        if (dotsRemaining <= 0) {
            gameState = STATE.LEVEL_CLEAR;
            audio.playStart();
            score += 1000;
            addFloatingText('SECTOR CLEARED! +1000', GAME_WIDTH / 2, GAME_HEIGHT / 2, '#39ff14');

            setTimeout(() => {
                level++;
                resetMaze();
                pacman.reset();
                ghosts.forEach(g => g.reset());
                gameState = STATE.READY;
            }, 2000);
        }
    }

    function createSparks(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 3 + 1;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: color,
                size: Math.random() * 3 + 1.5,
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
        resetMaze();
        pacman.reset();
        ghosts.forEach(g => g.reset());
        gameState = STATE.READY;
        audio.playStart();
    }

    // --- Main Update Loop ---
    function update() {
        frameCount++;

        if (isPaused) return;

        if (gameState === STATE.PLAYING) {
            pacman.update();
            ghosts.forEach(g => g.update());
            checkCollisions();
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

        // Dark Synthwave Cyber Background
        ctx.fillStyle = '#05020c';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw Maze Walls & Dots
        drawMaze(ctx);

        // Draw Ghosts
        ghosts.forEach(g => g.draw(ctx));

        // Draw Pac-Man
        if (gameState !== STATE.PAC_DYING) {
            pacman.draw(ctx);
        }

        // Draw Particles
        for (let pt of particles) {
            ctx.save();
            ctx.globalAlpha = pt.life;
            ctx.fillStyle = pt.color;
            ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
            ctx.restore();
        }

        // Draw Floating Texts
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

        // Draw Bottom HUD
        drawHUD(ctx);

        // Overlays
        if (gameState === STATE.TITLE) {
            drawTitleOverlay(ctx);
        } else if (gameState === STATE.READY) {
            drawReadyOverlay(ctx);
        } else if (gameState === STATE.GAME_OVER) {
            drawGameOverOverlay(ctx);
        }

        if (isPaused) {
            drawPauseOverlay(ctx);
        }

        ctx.restore();
    }

    function drawMaze(ctx) {
        ctx.save();

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const val = maze[r][c];
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;

                if (val === 1) {
                    // Glowing Neon Wall
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 4;
                    ctx.fillStyle = '#0a192f';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

                    ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.shadowBlur = 0;
                } else if (val === 2) {
                    // Small Neon Dot
                    ctx.fillStyle = '#ffea00';
                    ctx.beginPath();
                    ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                } else if (val === 3) {
                    // Pulsing Power Pellet
                    const pulse = (Math.sin(frameCount * 0.15) + 1) * 1.5;
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 5 + pulse, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else if (val === 4) {
                    // Ghost Door
                    ctx.fillStyle = '#ff007f';
                    ctx.fillRect(x, y + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
                }
            }
        }

        ctx.restore();
    }

    function drawHUD(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 4, 20, 0.95)';
        ctx.fillRect(0, ROWS * TILE_SIZE, GAME_WIDTH, 20);

        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textBaseline = 'middle';

        // Score
        ctx.fillStyle = '#ffea00';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 12, ROWS * TILE_SIZE + 10);

        // High Score
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(`HI: ${highScore}`, 180, ROWS * TILE_SIZE + 10);

        // Lives
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffea00';
        let pacLives = '';
        for (let i = 0; i < lives; i++) pacLives += '● ';
        ctx.fillText(pacLives, GAME_WIDTH - 12, ROWS * TILE_SIZE + 10);

        ctx.restore();
    }

    function drawTitleOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(4, 1, 10, 0.9)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const cx = GAME_WIDTH / 2;

        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#ffea00';
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NEON PAC-MAZE', cx, 200);

        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#00f0ff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('CYBER MAZE EVOLUTION', cx, 240);

        // Ghost lineup demo
        const demoGhosts = [
            { col: '#ff1744', name: 'BLINKY' },
            { col: '#ff007f', name: 'PINKY' },
            { col: '#00f0ff', name: 'INKY' },
            { col: '#ff9100', name: 'CLYDE' }
        ];
        demoGhosts.forEach((g, idx) => {
            ctx.fillStyle = g.col;
            ctx.beginPath();
            ctx.arc(cx - 105 + idx * 70, 310, 12, 0, Math.PI * 2);
            ctx.fill();
        });

        const pulse = (Math.sin(frameCount * 0.08) + 1) * 0.5;
        ctx.shadowBlur = 0;
        ctx.fillStyle = pulse > 0.3 ? '#39ff14' : 'rgba(57, 255, 20, 0.4)';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText('CLICK / TAP / SPACE TO START', cx, 400);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('ARROWS / [W][A][S][D] / SWIPE TO STEER', cx, 460);
        ctx.fillText('EAT POWER PELLETS TO CHOMP GHOSTS', cx, 490);

        ctx.restore();
    }

    function drawReadyOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = '#ffea00';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('READY!', GAME_WIDTH / 2, 340);
        ctx.restore();
    }

    function drawGameOverOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(4, 1, 10, 0.9)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const cx = GAME_WIDTH / 2;
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#ff1744';
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', cx, 230);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(`FINAL SCORE: ${score}`, cx, 290);

        ctx.fillStyle = '#ffd700';
        ctx.fillText(`HIGH SCORE: ${highScore}`, cx, 330);

        const pulse = (Math.sin(frameCount * 0.08) + 1) * 0.5;
        ctx.fillStyle = pulse > 0.3 ? '#00f0ff' : 'rgba(0, 240, 255, 0.3)';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText('CLICK / TAP / SPACE TO RESTART', cx, 420);

        ctx.restore();
    }

    function drawPauseOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(4, 1, 10, 0.85)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#00f0ff';
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MAZE PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText('PRESS [P] OR PAUSE BUTTON TO RESUME', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);

        ctx.restore();
    }

    // --- Input & Event Listeners ---
    function setDesiredDirection(dir) {
        audio.init();
        if (gameState === STATE.READY) {
            gameState = STATE.PLAYING;
        }
        pacman.nextDir = dir;
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
                setDesiredDirection(DIR.UP);
                break;
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                setDesiredDirection(DIR.DOWN);
                break;
            case 'ArrowLeft':
            case 'KeyA':
                e.preventDefault();
                setDesiredDirection(DIR.LEFT);
                break;
            case 'ArrowRight':
            case 'KeyD':
                e.preventDefault();
                setDesiredDirection(DIR.RIGHT);
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
        } else if (gameState === STATE.READY) {
            gameState = STATE.PLAYING;
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
        if (gameState === STATE.READY) {
            gameState = STATE.PLAYING;
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
                setDesiredDirection(dx > 0 ? DIR.RIGHT : DIR.LEFT);
            } else {
                setDesiredDirection(dy > 0 ? DIR.DOWN : DIR.UP);
            }
        }
    });

    // Mobile Virtual D-Pad buttons
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    if (btnUp) btnUp.addEventListener('click', () => setDesiredDirection(DIR.UP));
    if (btnDown) btnDown.addEventListener('click', () => setDesiredDirection(DIR.DOWN));
    if (btnLeft) btnLeft.addEventListener('click', () => setDesiredDirection(DIR.LEFT));
    if (btnRight) btnRight.addEventListener('click', () => setDesiredDirection(DIR.RIGHT));

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
            localStorage.setItem('neon_pac_muted', audio.muted.toString());
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
    resetMaze();

    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);

})();

