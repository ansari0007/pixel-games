/* ==========================================================================
   PIXEL BLOCKS — Classic Falling Blocks Arcade Engine
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // ============================
    // CONSTANTS & GAME SETTINGS
    // ============================
    const CANVAS_W = 480;
    const CANVAS_H = 680;

    const MATRIX_COLS = 10;
    const MATRIX_ROWS = 20;
    const TILE_SIZE = 28;
    const MATRIX_X = 100;
    const MATRIX_Y = 60;
    const MATRIX_W = MATRIX_COLS * TILE_SIZE; // 280
    const MATRIX_H = MATRIX_ROWS * TILE_SIZE; // 560

    // Tetromino Color Definitions
    const PIECE_COLORS = {
        'I': { primary: '#00f0ff', light: '#80f8ff', dark: '#008c99', name: 'Cyan' },
        'O': { primary: '#ffee00', light: '#ffff80', dark: '#998f00', name: 'Yellow' },
        'T': { primary: '#b388ff', light: '#d8bfff', dark: '#633cb8', name: 'Purple' },
        'S': { primary: '#00e676', light: '#80ffbb', dark: '#008f48', name: 'Green' },
        'Z': { primary: '#ff1744', light: '#ff8a9e', dark: '#99001e', name: 'Red' },
        'J': { primary: '#2979ff', light: '#82b1ff', dark: '#114cb3', name: 'Blue' },
        'L': { primary: '#ff9100', light: '#ffc880', dark: '#b36200', name: 'Orange' },
    };

    // Standard Tetromino Geometries
    const SHAPES = {
        'I': [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        'O': [
            [1, 1],
            [1, 1]
        ],
        'T': [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        'S': [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        'Z': [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        'J': [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        'L': [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ]
    };

    const PIECE_NAMES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

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
                case 'move': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(420, t);
                    osc.frequency.linearRampToValueAtTime(320, t + 0.04);
                    gain.gain.setValueAtTime(0.08, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.05);
                    break;
                }
                case 'rotate': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(500, t);
                    osc.frequency.exponentialRampToValueAtTime(750, t + 0.07);
                    gain.gain.setValueAtTime(0.1, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.08);
                    break;
                }
                case 'drop': {
                    // Hard drop impact
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(140, t);
                    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
                    gain.gain.setValueAtTime(0.25, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.16);
                    break;
                }
                case 'lock': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(220, t);
                    osc.frequency.linearRampToValueAtTime(120, t + 0.06);
                    gain.gain.setValueAtTime(0.12, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.07);
                    break;
                }
                case 'clear': {
                    // Lines cleared: 1=Single, 2=Double, 3=Triple, 4=TETRIS!
                    const notes = [
                        [523, 659],                     // Single
                        [523, 659, 784],                // Double
                        [523, 659, 784, 1046],          // Triple
                        [523, 659, 784, 1046, 1318, 1567] // TETRIS!
                    ][Math.min(3, Math.max(0, arg - 1))];

                    notes.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = arg === 4 ? 'sawtooth' : 'triangle';
                        osc.frequency.value = f;
                        gain.gain.setValueAtTime(0.15, t + i * 0.06);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.18);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.06);
                        osc.stop(t + i * 0.06 + 0.2);
                    });
                    break;
                }
                case 'hold': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(350, t);
                    osc.frequency.linearRampToValueAtTime(480, t + 0.09);
                    gain.gain.setValueAtTime(0.1, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.1);
                    break;
                }
                case 'gameOver': {
                    [320, 280, 240, 180].forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.value = f;
                        gain.gain.setValueAtTime(0.15, t + i * 0.12);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.22);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.12);
                        osc.stop(t + i * 0.12 + 0.23);
                    });
                    break;
                }
            }
        }
    };


    // ============================
    // VISUAL PARTICLES & POPUPS
    // ============================
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed - 1.5;
            this.size = Math.random() * 4 + 2;
            this.alpha = 1.0;
            this.decay = Math.random() * 0.03 + 0.02;
            this.gravity = 0.2;
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
        constructor(text, x, y, color = '#ffd700', size = 14) {
            this.text = text;
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size;
            this.alpha = 1.0;
            this.vy = -1.5;
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
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.strokeText(this.text, this.x, this.y);
            ctx.fillText(this.text, this.x, this.y);
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
            this.ctx.imageSmoothingEnabled = false;

            this.W = CANVAS_W;
            this.H = CANVAS_H;

            this.state = STATE.TITLE;
            this.grid = []; // 20 rows x 10 cols
            this.bag = [];
            this.currentPiece = null;
            this.nextQueue = [];
            this.holdPiece = null;
            this.canHold = true;

            // Stats
            this.score = 0;
            this.highScore = 0;
            this.lines = 0;
            this.level = 1;

            // Timing & Gravity
            this.dropCounter = 0;
            this.dropInterval = 800; // ms per drop
            this.lastTime = 0;
            this.lockDelay = 0;
            this.clearingLines = [];
            this.clearAnimationTimer = 0;

            // Effects
            this.particles = [];
            this.popups = [];
            this.screenShake = 0;

            // Input handling
            this.keys = {};
            this.dasTimer = 0;
            this.dasDirection = 0;

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
                this.highScore = parseInt(localStorage.getItem('pixelblocks_highscore') || '0', 10);
            } catch (e) {}
        }

        _saveHighScore() {
            try {
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('pixelblocks_highscore', String(this.highScore));
                }
            } catch (e) {}
        }

        _initInputs() {
            // Keyboard Controls
            window.addEventListener('keydown', (e) => {
                Sound.init();

                if (this.state === STATE.TITLE) {
                    if (['Space', 'Enter'].includes(e.code)) {
                        this.startNewGame();
                    }
                    return;
                }

                if (this.state === STATE.GAME_OVER) {
                    if (['Space', 'Enter'].includes(e.code)) {
                        this.startNewGame();
                    }
                    return;
                }

                if (e.code === 'KeyP' || e.code === 'Escape') {
                    this.state = (this.state === STATE.PLAYING) ? STATE.PAUSED : STATE.PLAYING;
                    return;
                }

                if (this.state !== STATE.PLAYING || this.clearingLines.length > 0) return;

                if (['ArrowLeft', 'KeyA'].includes(e.code)) {
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    this.dasDirection = -1;
                    this.dasTimer = 0;
                } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
                    e.preventDefault();
                    this.movePiece(1, 0);
                    this.dasDirection = 1;
                    this.dasTimer = 0;
                } else if (['ArrowUp', 'KeyW', 'KeyX'].includes(e.code)) {
                    e.preventDefault();
                    this.rotatePiece(1);
                } else if (['KeyZ', 'KeyQ'].includes(e.code)) {
                    e.preventDefault();
                    this.rotatePiece(-1);
                } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
                    e.preventDefault();
                    this.softDrop();
                } else if (e.code === 'Space') {
                    e.preventDefault();
                    this.hardDrop();
                } else if (['KeyC', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
                    e.preventDefault();
                    this.holdActivePiece();
                }
            });

            window.addEventListener('keyup', (e) => {
                if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) {
                    this.dasDirection = 0;
                }
            });

            // Mobile HTML On-Screen Button Controls
            const btnLeft = document.getElementById('btn-left');
            const btnRight = document.getElementById('btn-right');
            const btnDown = document.getElementById('btn-down');
            const btnRotate = document.getElementById('btn-rotate');
            const btnDrop = document.getElementById('btn-drop');
            const btnHold = document.getElementById('btn-hold');

            const bindBtn = (btn, action) => {
                if (!btn) return;
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    Sound.init();
                    if (this.state === STATE.TITLE || this.state === STATE.GAME_OVER) {
                        this.startNewGame();
                    } else if (this.state === STATE.PLAYING) {
                        action();
                    }
                }, { passive: false });

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    Sound.init();
                    if (this.state === STATE.TITLE || this.state === STATE.GAME_OVER) {
                        this.startNewGame();
                    } else if (this.state === STATE.PLAYING) {
                        action();
                    }
                });
            };

            bindBtn(btnLeft, () => this.movePiece(-1, 0));
            bindBtn(btnRight, () => this.movePiece(1, 0));
            bindBtn(btnDown, () => this.softDrop());
            bindBtn(btnRotate, () => this.rotatePiece(1));
            bindBtn(btnDrop, () => this.hardDrop());
            bindBtn(btnHold, () => this.holdActivePiece());

            // Canvas Click / Tap for Title and Game Over
            this.canvas.addEventListener('click', () => {
                Sound.init();
                if (this.state === STATE.TITLE || this.state === STATE.GAME_OVER) {
                    this.startNewGame();
                }
            });
        }

        // ============================
        // GAME LIFECYCLE & BAG SYSTEM
        // ============================
        startNewGame() {
            // Reset Grid
            this.grid = [];
            for (let r = 0; r < MATRIX_ROWS; r++) {
                this.grid[r] = new Array(MATRIX_COLS).fill(null);
            }

            this.score = 0;
            this.lines = 0;
            this.level = 1;
            this.dropInterval = 800;
            this.holdPiece = null;
            this.canHold = true;
            this.clearingLines = [];
            this.particles = [];
            this.popups = [];
            this.bag = [];
            this.nextQueue = [];

            // Populate next queue
            for (let i = 0; i < 3; i++) {
                this.nextQueue.push(this._getNextFromBag());
            }

            this.spawnPiece();
            this.state = STATE.PLAYING;
            Sound.play('clear', 4);
        }

        _getNextFromBag() {
            if (this.bag.length === 0) {
                // 7-Bag Randomizer
                const p = [...PIECE_NAMES];
                for (let i = p.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [p[i], p[j]] = [p[j], p[i]];
                }
                this.bag = p;
            }
            return this.bag.pop();
        }

        spawnPiece() {
            if (this.nextQueue.length < 3) {
                while (this.nextQueue.length < 3) {
                    this.nextQueue.push(this._getNextFromBag());
                }
            }

            const pieceName = this.nextQueue.shift();
            this.nextQueue.push(this._getNextFromBag());

            const shape = SHAPES[pieceName].map(row => [...row]);
            const pieceW = shape[0].length;
            const startX = Math.floor((MATRIX_COLS - pieceW) / 2);
            const startY = 0;

            this.currentPiece = {
                name: pieceName,
                shape: shape,
                x: startX,
                y: startY
            };

            this.canHold = true;
            this.lockDelay = 0;
            this.dropCounter = 0;
            this.lockResets = 0;

            // Check if blocked on spawn -> Game Over!
            if (!this.isValidPosition(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y)) {
                this.state = STATE.GAME_OVER;
                Sound.play('gameOver');
                this._saveHighScore();
            }
        }

        holdActivePiece() {
            if (!this.canHold || this.clearingLines.length > 0 || !this.currentPiece) return;

            Sound.play('hold');
            const currentName = this.currentPiece.name;

            if (this.holdPiece === null) {
                this.holdPiece = currentName;
                this.spawnPiece();
            } else {
                const temp = this.holdPiece;
                this.holdPiece = currentName;
                const shape = SHAPES[temp].map(row => [...row]);
                const pieceW = shape[0].length;
                this.currentPiece = {
                    name: temp,
                    shape: shape,
                    x: Math.floor((MATRIX_COLS - pieceW) / 2),
                    y: 0
                };
                this.lockDelay = 0;
                this.dropCounter = 0;
                this.lockResets = 0;
            }

            this.canHold = false;
        }

        // ============================
        // MOVEMENT & ROTATION
        // ============================
        movePiece(dx, dy) {
            if (!this.currentPiece) return false;
            const newX = this.currentPiece.x + dx;
            const newY = this.currentPiece.y + dy;

            if (this.isValidPosition(this.currentPiece.shape, newX, newY)) {
                this.currentPiece.x = newX;
                this.currentPiece.y = newY;
                if (dx !== 0) Sound.play('move');

                // If moving horizontally on ground, allow lock reset extension
                if (dx !== 0 && !this.isValidPosition(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y + 1)) {
                    if (this.lockResets < 15) {
                        this.lockDelay = 0;
                        this.lockResets++;
                    }
                }
                return true;
            }
            return false;
        }

        rotatePiece(dir = 1) {
            if (!this.currentPiece) return;
            const orig = this.currentPiece.shape;
            const n = orig.length;
            const rotated = [];

            for (let r = 0; r < n; r++) {
                rotated[r] = [];
                for (let c = 0; c < n; c++) {
                    if (dir === 1) {
                        rotated[r][c] = orig[n - 1 - c][r];
                    } else {
                        rotated[r][c] = orig[c][n - 1 - r];
                    }
                }
            }

            // Wall kick offsets: try normal, then x+1, x-1, x+2, x-2, y-1
            const kicks = [0, 1, -1, 2, -2];
            for (let kick of kicks) {
                if (this.isValidPosition(rotated, this.currentPiece.x + kick, this.currentPiece.y)) {
                    this.currentPiece.shape = rotated;
                    this.currentPiece.x += kick;
                    Sound.play('rotate');

                    if (!this.isValidPosition(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y + 1)) {
                        if (this.lockResets < 15) {
                            this.lockDelay = 0;
                            this.lockResets++;
                        }
                    }
                    return;
                }
            }
        }

        softDrop() {
            if (!this.currentPiece || this.clearingLines.length > 0) return;
            if (this.movePiece(0, 1)) {
                this.score += 1;
                this.lockDelay = 0;
            } else {
                // If piece is already on ground, pressing soft drop locks immediately!
                this.lockPiece();
            }
        }

        hardDrop() {
            if (!this.currentPiece) return;
            let cellsDropped = 0;
            while (this.movePiece(0, 1)) {
                cellsDropped++;
            }
            this.score += cellsDropped * 2;
            Sound.play('drop');
            this.screenShake = 6;

            // Spawn hard drop sparks
            const ghost = this.getGhostPosition();
            for (let r = 0; r < this.currentPiece.shape.length; r++) {
                for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
                    if (this.currentPiece.shape[r][c]) {
                        const px = MATRIX_X + (ghost.x + c) * TILE_SIZE + TILE_SIZE / 2;
                        const py = MATRIX_Y + (ghost.y + r) * TILE_SIZE + TILE_SIZE;
                        for (let k = 0; k < 3; k++) {
                            this.particles.push(new Particle(px, py, PIECE_COLORS[this.currentPiece.name].primary));
                        }
                    }
                }
            }

            this.lockPiece();
        }

        getGhostPosition() {
            if (!this.currentPiece) return null;
            let ghostY = this.currentPiece.y;
            while (this.isValidPosition(this.currentPiece.shape, this.currentPiece.x, ghostY + 1)) {
                ghostY++;
            }
            return { x: this.currentPiece.x, y: ghostY };
        }

        isValidPosition(shape, posX, posY) {
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        const gridX = posX + c;
                        const gridY = posY + r;

                        if (gridX < 0 || gridX >= MATRIX_COLS || gridY >= MATRIX_ROWS) {
                            return false;
                        }
                        if (gridY >= 0 && this.grid[gridY][gridX] !== null) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        lockPiece() {
            const { shape, x, y, name } = this.currentPiece;

            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        const gridY = y + r;
                        const gridX = x + c;
                        if (gridY >= 0 && gridY < MATRIX_ROWS && gridX >= 0 && gridX < MATRIX_COLS) {
                            this.grid[gridY][gridX] = name;
                        }
                    }
                }
            }

            Sound.play('lock');
            this.currentPiece = null;
            this.checkLineClears();
        }

        // ============================
        // LINE CLEARS & SCORING
        // ============================
        checkLineClears() {
            const fullRows = [];
            for (let r = 0; r < MATRIX_ROWS; r++) {
                if (this.grid[r].every(cell => cell !== null)) {
                    fullRows.push(r);
                }
            }

            if (fullRows.length > 0) {
                this.clearingLines = fullRows;
                this.clearAnimationTimer = 180; // ms
                Sound.play('clear', fullRows.length);

                // Spawn line clear fireworks
                fullRows.forEach(row => {
                    for (let col = 0; col < MATRIX_COLS; col++) {
                        const px = MATRIX_X + col * TILE_SIZE + TILE_SIZE / 2;
                        const py = MATRIX_Y + row * TILE_SIZE + TILE_SIZE / 2;
                        for (let k = 0; k < 2; k++) {
                            this.particles.push(new Particle(px, py, '#ffffff'));
                        }
                    }
                });

                // Scoring
                const lineScores = [0, 100, 300, 500, 800];
                const pts = (lineScores[fullRows.length] || 100) * this.level;
                this.score += pts;
                this.lines += fullRows.length;

                // Level up every 10 lines
                const newLevel = Math.floor(this.lines / 10) + 1;
                if (newLevel > this.level) {
                    this.level = newLevel;
                    this.dropInterval = Math.max(100, 800 - (this.level - 1) * 65);
                    this.popups.push(new FloatingText('LEVEL UP!', CANVAS_W / 2, MATRIX_Y + 120, '#00f0ff', 18));
                }

                // Popup labels
                if (fullRows.length === 4) {
                    this.popups.push(new FloatingText('TETRIS!', CANVAS_W / 2, MATRIX_Y + 160, '#ffee00', 22));
                    this.screenShake = 10;
                } else if (fullRows.length === 3) {
                    this.popups.push(new FloatingText('TRIPLE!', CANVAS_W / 2, MATRIX_Y + 160, '#b388ff', 16));
                } else if (fullRows.length === 2) {
                    this.popups.push(new FloatingText('DOUBLE!', CANVAS_W / 2, MATRIX_Y + 160, '#00f0ff', 14));
                }

                this._saveHighScore();
            } else {
                this.spawnPiece();
            }
        }

        _finalizeLineClears() {
            // Remove cleared rows cleanly and push empty rows to top
            this.grid = this.grid.filter((_, idx) => !this.clearingLines.includes(idx));
            while (this.grid.length < MATRIX_ROWS) {
                this.grid.unshift(new Array(MATRIX_COLS).fill(null));
            }
            this.clearingLines = [];
            this.spawnPiece();
        }


        // ============================
        // UPDATE LOOP
        // ============================
        update(dt) {
            // Screen Shake decay
            if (this.screenShake > 0) {
                this.screenShake *= 0.85;
                if (this.screenShake < 0.5) this.screenShake = 0;
            }

            // Line Clear Animation Timer
            if (this.clearingLines.length > 0) {
                this.clearAnimationTimer -= dt;
                if (this.clearAnimationTimer <= 0) {
                    this._finalizeLineClears();
                }
            }

            // Particle Updates
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].alpha <= 0) this.particles.splice(i, 1);
            }

            // Popup Updates
            for (let i = this.popups.length - 1; i >= 0; i--) {
                this.popups[i].update();
                if (this.popups[i].alpha <= 0) this.popups.splice(i, 1);
            }

            if (this.state !== STATE.PLAYING || this.clearingLines.length > 0) return;

            // Safety Watchdog: Ensure an active piece is always present during gameplay
            if (!this.currentPiece) {
                this.spawnPiece();
                return;
            }

            // Delayed Auto Shift (DAS)
            if (this.dasDirection !== 0) {
                this.dasTimer += dt;
                if (this.dasTimer > 180) { // DAS initial delay
                    this.movePiece(this.dasDirection, 0);
                    this.dasTimer = 140; // ARR repeat rate
                }
            }

            // Ground Detection & Lock Delay (continuous every frame on ground)
            const isGrounded = !this.isValidPosition(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y + 1);

            if (isGrounded) {
                this.lockDelay += dt;
                if (this.lockDelay >= 450) { // Standard 450ms lock delay
                    this.lockPiece();
                }
            } else {
                this.lockDelay = 0;
                this.dropCounter += dt;
                if (this.dropCounter >= this.dropInterval) {
                    this.dropCounter = 0;
                    this.movePiece(0, 1);
                }
            }
        }


        // ============================
        // RENDER LOOP
        // ============================
        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.W, this.H);

            ctx.save();
            if (this.screenShake > 0) {
                const ox = (Math.random() - 0.5) * this.screenShake;
                const oy = (Math.random() - 0.5) * this.screenShake;
                ctx.translate(ox, oy);
            }

            // 1. Background
            this._drawBackground(ctx);

            if (this.state === STATE.TITLE) {
                this._drawTitleScreen(ctx);
                ctx.restore();
                return;
            }

            // 2. Playfield Matrix & Border
            this._drawMatrix(ctx);

            // 3. Side Panels (Hold on left, Next on right)
            this._drawSidePanels(ctx);

            // 4. Ghost Piece Outline
            if (this.currentPiece && this.clearingLines.length === 0) {
                this._drawGhostPiece(ctx);
            }

            // 5. Active Tetromino Piece
            if (this.currentPiece && this.clearingLines.length === 0) {
                this._drawPiece(ctx, this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y, this.currentPiece.name);
            }

            // 6. Visual Effects: Particles & Popups
            this.particles.forEach(p => p.draw(ctx));
            this.popups.forEach(pop => pop.draw(ctx));

            // 7. Paused / Game Over Overlays
            if (this.state === STATE.PAUSED) {
                this._drawPausedOverlay(ctx);
            } else if (this.state === STATE.GAME_OVER) {
                this._drawGameOverOverlay(ctx);
            }

            ctx.restore();
        }

        _drawBackground(ctx) {
            // Dark cyberpunk radial backdrop
            const g = ctx.createLinearGradient(0, 0, 0, this.H);
            g.addColorStop(0, '#0c0822');
            g.addColorStop(0.5, '#120b33');
            g.addColorStop(1, '#070514');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, this.W, this.H);

            // Subtle matrix scanline grid lines
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
            ctx.lineWidth = 1;
            for (let y = 0; y < this.H; y += 20) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.W, y);
                ctx.stroke();
            }
        }

        _drawMatrix(ctx) {
            // Outer Matrix Frame with neon glow
            ctx.save();
            ctx.fillStyle = 'rgba(7, 5, 20, 0.85)';
            ctx.fillRect(MATRIX_X, MATRIX_Y, MATRIX_W, MATRIX_H);

            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 12;
            ctx.strokeRect(MATRIX_X, MATRIX_Y, MATRIX_W, MATRIX_H);
            ctx.restore();

            // Inner Tile Grid lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = 1;
            for (let c = 1; c < MATRIX_COLS; c++) {
                ctx.beginPath();
                ctx.moveTo(MATRIX_X + c * TILE_SIZE, MATRIX_Y);
                ctx.lineTo(MATRIX_X + c * TILE_SIZE, MATRIX_Y + MATRIX_H);
                ctx.stroke();
            }
            for (let r = 1; r < MATRIX_ROWS; r++) {
                ctx.beginPath();
                ctx.moveTo(MATRIX_X, MATRIX_Y + r * TILE_SIZE);
                ctx.lineTo(MATRIX_X + MATRIX_W, MATRIX_Y + r * TILE_SIZE);
                ctx.stroke();
            }

            // Locked Matrix Blocks
            for (let r = 0; r < MATRIX_ROWS; r++) {
                const isClearing = this.clearingLines.includes(r);
                for (let c = 0; c < MATRIX_COLS; c++) {
                    const block = this.grid[r][c];
                    if (block !== null) {
                        const bx = MATRIX_X + c * TILE_SIZE;
                        const by = MATRIX_Y + r * TILE_SIZE;

                        if (isClearing) {
                            // Flash white on line clear
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(bx + 1, by + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                        } else {
                            this._drawBlock(ctx, bx, by, block);
                        }
                    }
                }
            }
        }

        _drawBlock(ctx, x, y, pieceName, alpha = 1.0) {
            const colors = PIECE_COLORS[pieceName] || PIECE_COLORS['I'];

            ctx.save();
            ctx.globalAlpha = alpha;

            // Base fill
            ctx.fillStyle = colors.primary;
            ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

            // 3D Bevel Highlights (Retro Arcade Block Style)
            // Top & Left light bevel
            ctx.fillStyle = colors.light;
            ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 3);
            ctx.fillRect(x + 1, y + 1, 3, TILE_SIZE - 2);

            // Bottom & Right dark bevel
            ctx.fillStyle = colors.dark;
            ctx.fillRect(x + 1, y + TILE_SIZE - 4, TILE_SIZE - 2, 3);
            ctx.fillRect(x + TILE_SIZE - 4, y + 1, 3, TILE_SIZE - 2);

            // Center pixel shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.fillRect(x + 5, y + 5, 4, 4);

            ctx.restore();
        }

        _drawPiece(ctx, shape, gridX, gridY, pieceName) {
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        const px = MATRIX_X + (gridX + c) * TILE_SIZE;
                        const py = MATRIX_Y + (gridY + r) * TILE_SIZE;
                        this._drawBlock(ctx, px, py, pieceName);
                    }
                }
            }
        }

        _drawGhostPiece(ctx) {
            const ghost = this.getGhostPosition();
            if (!ghost) return;

            const shape = this.currentPiece.shape;
            const colors = PIECE_COLORS[this.currentPiece.name];

            ctx.save();
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);

            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        const px = MATRIX_X + (ghost.x + c) * TILE_SIZE;
                        const py = MATRIX_Y + (ghost.y + r) * TILE_SIZE;
                        ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    }
                }
            }
            ctx.restore();
        }

        _drawSidePanels(ctx) {
            // LEFT PANEL: HOLD & STATS
            const leftBoxX = 14;
            const leftBoxW = 74;

            // HOLD Box
            ctx.fillStyle = 'rgba(12, 8, 30, 0.85)';
            ctx.fillRect(leftBoxX, MATRIX_Y, leftBoxW, 76);
            ctx.strokeStyle = this.canHold ? '#ffee00' : '#444466';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(leftBoxX, MATRIX_Y, leftBoxW, 76);

            ctx.fillStyle = '#ffee00';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('HOLD', leftBoxX + leftBoxW / 2, MATRIX_Y + 16);

            if (this.holdPiece) {
                this._drawMiniPiece(ctx, this.holdPiece, leftBoxX + leftBoxW / 2, MATRIX_Y + 48, this.canHold ? 1.0 : 0.4);
            }

            // LEVEL & LINES Box
            const statsBoxY = MATRIX_Y + 95;
            ctx.fillStyle = 'rgba(12, 8, 30, 0.85)';
            ctx.fillRect(leftBoxX, statsBoxY, leftBoxW, 110);
            ctx.strokeStyle = '#b388ff';
            ctx.strokeRect(leftBoxX, statsBoxY, leftBoxW, 110);

            ctx.fillStyle = '#b388ff';
            ctx.font = '7px "Press Start 2P", monospace';
            ctx.fillText('LEVEL', leftBoxX + leftBoxW / 2, statsBoxY + 20);
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px "Press Start 2P", monospace';
            ctx.fillText(String(this.level), leftBoxX + leftBoxW / 2, statsBoxY + 42);

            ctx.fillStyle = '#00f0ff';
            ctx.font = '7px "Press Start 2P", monospace';
            ctx.fillText('LINES', leftBoxX + leftBoxW / 2, statsBoxY + 70);
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText(String(this.lines), leftBoxX + leftBoxW / 2, statsBoxY + 92);


            // RIGHT PANEL: NEXT QUEUE & SCORE
            const rightBoxX = 392;
            const rightBoxW = 74;

            // NEXT Queue Box (Shows next 3 upcoming pieces)
            ctx.fillStyle = 'rgba(12, 8, 30, 0.85)';
            ctx.fillRect(rightBoxX, MATRIX_Y, rightBoxW, 185);
            ctx.strokeStyle = '#00f0ff';
            ctx.strokeRect(rightBoxX, MATRIX_Y, rightBoxW, 185);

            ctx.fillStyle = '#00f0ff';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('NEXT', rightBoxX + rightBoxW / 2, MATRIX_Y + 16);

            for (let i = 0; i < Math.min(3, this.nextQueue.length); i++) {
                const nextName = this.nextQueue[i];
                this._drawMiniPiece(ctx, nextName, rightBoxX + rightBoxW / 2, MATRIX_Y + 46 + i * 50);
            }

            // SCORE Box
            const scoreBoxY = MATRIX_Y + 200;
            ctx.fillStyle = 'rgba(12, 8, 30, 0.85)';
            ctx.fillRect(rightBoxX, scoreBoxY, rightBoxW, 95);
            ctx.strokeStyle = '#ff007f';
            ctx.strokeRect(rightBoxX, scoreBoxY, rightBoxW, 95);

            ctx.fillStyle = '#ff007f';
            ctx.font = '7px "Press Start 2P", monospace';
            ctx.fillText('SCORE', rightBoxX + rightBoxW / 2, scoreBoxY + 20);

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText(String(this.score), rightBoxX + rightBoxW / 2, scoreBoxY + 42);

            ctx.fillStyle = '#8888aa';
            ctx.font = '6px "Press Start 2P", monospace';
            ctx.fillText('BEST', rightBoxX + rightBoxW / 2, scoreBoxY + 65);
            ctx.fillStyle = '#ffee00';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText(String(this.highScore), rightBoxX + rightBoxW / 2, scoreBoxY + 82);

            // Bottom Matrix Header
            ctx.fillStyle = '#00f0ff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('PIXEL BLOCKS', CANVAS_W / 2, 38);
        }

        _drawMiniPiece(ctx, pieceName, centerX, centerY, alpha = 1.0) {
            const shape = SHAPES[pieceName];
            const miniSize = 14;
            const rows = shape.length;
            const cols = shape[0].length;

            const startX = centerX - (cols * miniSize) / 2;
            const startY = centerY - (rows * miniSize) / 2;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (shape[r][c]) {
                        const bx = startX + c * miniSize;
                        const by = startY + r * miniSize;

                        ctx.save();
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = PIECE_COLORS[pieceName].primary;
                        ctx.fillRect(bx + 1, by + 1, miniSize - 2, miniSize - 2);

                        ctx.fillStyle = PIECE_COLORS[pieceName].light;
                        ctx.fillRect(bx + 1, by + 1, miniSize - 2, 2);
                        ctx.fillRect(bx + 1, by + 1, 2, miniSize - 2);
                        ctx.restore();
                    }
                }
            }
        }

        _drawTitleScreen(ctx) {
            ctx.textAlign = 'center';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 18;

            ctx.fillStyle = '#00f0ff';
            ctx.font = '28px "Press Start 2P", monospace';
            ctx.fillText('PIXEL', this.W / 2, 140);

            ctx.fillStyle = '#ffee00';
            ctx.font = '34px "Press Start 2P", monospace';
            ctx.fillText('BLOCKS', this.W / 2, 190);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ff007f';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText('CLASSIC FALLING BLOCK ARCADE', this.W / 2, 225);

            // Showcase Tetromino cluster
            const demoPieces = ['T', 'S', 'Z', 'L', 'I'];
            demoPieces.forEach((name, i) => {
                this._drawMiniPiece(ctx, name, 140 + i * 50, 310);
            });

            // Start Button
            const btnW = 320;
            const btnH = 52;
            const btnX = (this.W - btnW) / 2;
            const btnY = 410;
            const pulse = Math.sin(Date.now() * 0.006) * 0.25 + 0.75;

            ctx.fillStyle = `rgba(0, 240, 255, ${pulse * 0.3})`;
            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(btnX, btnY, btnW, btnH);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('▶ CLICK OR SPACE TO PLAY', this.W / 2, btnY + 32);

            // High Score
            ctx.fillStyle = '#ffee00';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText(`HIGH SCORE: ${this.highScore}`, this.W / 2, 510);

            // Controls Guide
            ctx.fillStyle = '#8899aa';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('MOVE: ARROWS / A, D', this.W / 2, 560);
            ctx.fillText('ROTATE: UP / W / X', this.W / 2, 585);
            ctx.fillText('HARD DROP: SPACE', this.W / 2, 610);
            ctx.fillText('HOLD: C / SHIFT', this.W / 2, 635);
        }

        _drawPausedOverlay(ctx) {
            ctx.fillStyle = 'rgba(7, 5, 20, 0.85)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffee00';
            ctx.font = '24px "Press Start 2P", monospace';
            ctx.fillText('PAUSED', this.W / 2, this.H / 2 - 20);

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('PRESS P OR ESC TO RESUME', this.W / 2, this.H / 2 + 30);
        }

        _drawGameOverOverlay(ctx) {
            ctx.fillStyle = 'rgba(12, 5, 25, 0.88)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff1744';
            ctx.font = '26px "Press Start 2P", monospace';
            ctx.fillText('GAME OVER', this.W / 2, 230);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText(`SCORE: ${this.score}`, this.W / 2, 290);
            ctx.fillText(`LINES: ${this.lines}`, this.W / 2, 320);
            ctx.fillText(`LEVEL: ${this.level}`, this.W / 2, 350);

            ctx.fillStyle = '#ffee00';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('CLICK OR SPACE TO RETRY', this.W / 2, 420);
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

