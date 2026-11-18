/* ==========================================================================
   PIXEL LUDO — Classic 4-Player Board Game Engine
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // ============================
    // CONSTANTS & GAME SETTINGS
    // ============================
    const CANVAS_W = 560;
    const CANVAS_H = 680;

    const GRID_SIZE = 15;
    const BOARD_PX = 480;
    const CELL_PX = BOARD_PX / GRID_SIZE; // 32px per cell!
    const OFFSET_X = (CANVAS_W - BOARD_PX) / 2; // 40px
    const OFFSET_Y = 64; // 64px

    // 4 Players / Colors
    const PLAYER = {
        RED: 0,
        GREEN: 1,
        YELLOW: 2,
        BLUE: 3
    };

    const PLAYER_INFO = {
        0: { name: 'Red',    primary: '#ff2a5f', light: '#ff7597', dark: '#b3002d', startTrack: 0,  homeTurn: 50 },
        1: { name: 'Green',  primary: '#00e676', light: '#69f0ae', dark: '#009624', startTrack: 13, homeTurn: 11 },
        2: { name: 'Yellow', primary: '#ffea00', light: '#ffff77', dark: '#b3a000', startTrack: 26, homeTurn: 24 },
        3: { name: 'Blue',   primary: '#00b0ff', light: '#80d8ff', dark: '#007bb5', startTrack: 39, homeTurn: 37 },
    };

    // Safe Star Tiles on Main 52-tile circuit
    const SAFE_TILES = [0, 8, 13, 21, 26, 34, 39, 47];

    // Master 52-Tile Outer Track Coordinates [row, col]
    const MAIN_TRACK = [
        [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],             // Red start & arm
        [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],     // Up to top-left
        [0, 7],                                             // Top turn
        [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],     // Down from top (Green start at index 13 = [1,8])
        [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],// Right arm
        [7, 14],                                            // Right turn
        [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],// Left back (Yellow start at index 26 = [8,13])
        [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],// Down bottom-right
        [14, 7],                                            // Bottom turn
        [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],// Up (Blue start at index 39 = [13,6])
        [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],     // Left arm
        [7, 0],                                             // Left turn
        [6, 0]                                              // Connects back to [6,1]
    ];

    // Home Stretch Paths (5 cells each) leading to Center
    const HOME_STRETCH = {
        0: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],       // Red (Rightwards)
        1: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],       // Green (Downwards)
        2: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],   // Yellow (Leftwards)
        3: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]]    // Blue (Upwards)
    };

    // Center Home Positions (Final Destination)
    const CENTER_POS = {
        0: [7, 6],
        1: [6, 7],
        2: [7, 8],
        3: [8, 7]
    };

    // Base Token Coordinates inside 6x6 homes
    const BASE_SLOTS = {
        0: [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],       // Red (top-left)
        1: [[1.5, 10.5], [1.5, 12.5], [3.5, 10.5], [3.5, 12.5]],   // Green (top-right)
        2: [[10.5, 10.5], [10.5, 12.5], [12.5, 10.5], [12.5, 12.5]], // Yellow (bottom-right)
        3: [[10.5, 1.5], [10.5, 3.5], [12.5, 1.5], [12.5, 3.5]],   // Blue (bottom-left)
    };

    // Token State
    const TOKEN_STATE = {
        BASE: 'BASE',
        TRACK: 'TRACK',
        HOME_STRETCH: 'HOME_STRETCH',
        HOME: 'HOME'
    };

    // Turn States
    const TURN_STATE = {
        WAIT_ROLL: 'WAIT_ROLL',
        ROLLING: 'ROLLING',
        DECIDING: 'DECIDING',
        MOVING: 'MOVING',
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

        toggle() {
            this.enabled = !this.enabled;
            return this.enabled;
        },

        play(type, arg = 0) {
            if (!this.enabled || !this.ctx) return;
            const t = this.ctx.currentTime;

            switch (type) {
                case 'dice': {
                    // Rattling dice tumble
                    for (let i = 0; i < 4; i++) {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(200 + Math.random() * 250, t + i * 0.05);
                        gain.gain.setValueAtTime(0.1, t + i * 0.05);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.04);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.05);
                        osc.stop(t + i * 0.05 + 0.05);
                    }
                    break;
                }
                case 'hop': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440 + arg * 30, t);
                    osc.frequency.exponentialRampToValueAtTime(660 + arg * 30, t + 0.07);
                    gain.gain.setValueAtTime(0.12, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.08);
                    break;
                }
                case 'exitBase': {
                    const notes = [523, 659, 784];
                    notes.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.value = f;
                        gain.gain.setValueAtTime(0.12, t + i * 0.06);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.12);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.06);
                        osc.stop(t + i * 0.06 + 0.14);
                    });
                    break;
                }
                case 'capture': {
                    // Cartoon knock / zap
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(500, t);
                    osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);
                    gain.gain.setValueAtTime(0.25, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.26);
                    break;
                }
                case 'bonus': {
                    [659, 880, 1046].forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.value = f;
                        gain.gain.setValueAtTime(0.15, t + i * 0.08);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.08);
                        osc.stop(t + i * 0.08 + 0.16);
                    });
                    break;
                }
                case 'home': {
                    [523, 659, 784, 1046, 1318].forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.value = f;
                        gain.gain.setValueAtTime(0.15, t + i * 0.07);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.16);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.07);
                        osc.stop(t + i * 0.07 + 0.18);
                    });
                    break;
                }
                case 'win': {
                    const melody = [
                        { f: 523, d: 0.12 }, { f: 659, d: 0.12 }, { f: 784, d: 0.12 },
                        { f: 1046, d: 0.25 }, { f: 880, d: 0.15 }, { f: 1046, d: 0.5 }
                    ];
                    let cursor = 0;
                    melody.forEach(m => {
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
    // TOKEN CLASS
    // ============================
    class Token {
        constructor(id, player, slotIndex) {
            this.id = id;
            this.player = player;
            this.slotIndex = slotIndex;
            this.state = TOKEN_STATE.BASE;
            this.step = 0; // 0..50 on track, 51..55 in home stretch, 56 in center home

            // Pixel position
            this.x = 0;
            this.y = 0;
            this.targetX = 0;
            this.targetY = 0;
            this.isEligible = false;
            this.hopProgress = 0;

            this.resetToBase();
        }

        resetToBase() {
            this.state = TOKEN_STATE.BASE;
            this.step = 0;
            const slot = BASE_SLOTS[this.player][this.slotIndex];
            this.x = OFFSET_X + slot[1] * CELL_PX;
            this.y = OFFSET_Y + slot[0] * CELL_PX;
            this.targetX = this.x;
            this.targetY = this.y;
            this.isEligible = false;
        }

        getGridPos() {
            if (this.state === TOKEN_STATE.BASE) {
                return BASE_SLOTS[this.player][this.slotIndex];
            } else if (this.state === TOKEN_STATE.TRACK) {
                const trackIdx = (PLAYER_INFO[this.player].startTrack + this.step) % 52;
                return MAIN_TRACK[trackIdx];
            } else if (this.state === TOKEN_STATE.HOME_STRETCH) {
                const stretchIdx = this.step - 51;
                return HOME_STRETCH[this.player][stretchIdx];
            } else {
                return CENTER_POS[this.player];
            }
        }

        updatePixelTarget() {
            const [r, c] = this.getGridPos();
            this.targetX = OFFSET_X + c * CELL_PX + CELL_PX / 2;
            this.targetY = OFFSET_Y + r * CELL_PX + CELL_PX / 2;
        }

        update(dt) {
            // Smooth movement lerp
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            if (Math.hypot(dx, dy) > 0.5) {
                this.x += dx * 0.35;
                this.y += dy * 0.35;
            } else {
                this.x = this.targetX;
                this.y = this.targetY;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            const colors = PLAYER_INFO[this.player];
            const radius = 10;

            // Highlight ring if eligible to move
            if (this.isEligible) {
                const pulse = Math.sin(Date.now() * 0.008) * 3 + 4;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, 0, radius + pulse, 0, Math.PI * 2);
                ctx.stroke();

                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, radius + pulse + 3, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Token Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(0, radius - 1, radius, radius * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();

            // 3D Sphere Pawn
            const g = ctx.createRadialGradient(-radius * 0.35, -radius * 0.35, 1, 0, 0, radius);
            g.addColorStop(0, colors.light);
            g.addColorStop(0.6, colors.primary);
            g.addColorStop(1, colors.dark);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();

            // Rim
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Center pip/crown
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-radius * 0.3, -radius * 0.3, 3, 0, Math.PI * 2);
            ctx.fill();

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

            // Game Settings & Mode
            this.isVsBots = true; // true = Human vs 3 Bots, false = Pass & Play
            this.activePlayers = [0, 1, 2, 3]; // Red, Green, Yellow, Blue
            this.botPlayers = [1, 2, 3]; // Green, Yellow, Blue are bots in vs mode

            this.turnIndex = 0; // Current player index in activePlayers
            this.turnState = TURN_STATE.WAIT_ROLL;

            // Dice Data
            this.diceValue = 1;
            this.diceRolling = false;
            this.diceRollTimer = 0;
            this.consecutiveSixes = 0;

            // Token Animation Sequence
            this.movingToken = null;
            this.movePath = [];
            this.moveTimer = 0;

            // Tokens
            this.tokens = [];
            for (let p = 0; p < 4; p++) {
                this.tokens[p] = [];
                for (let i = 0; i < 4; i++) {
                    this.tokens[p].push(new Token(i, p, i));
                }
            }

            // Winners
            this.winners = [];
            this.statusMessage = 'CLICK ROLL TO START';

            this._initCanvas();
            this._initInputs();
            this._initModeButton();
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

        _initModeButton() {
            const btnMode = document.getElementById('btn-mode');
            const btnSound = document.getElementById('btn-sound');

            if (btnMode) {
                btnMode.addEventListener('click', () => {
                    this.isVsBots = !this.isVsBots;
                    btnMode.textContent = this.isVsBots ? 'PLAY: VS BOTS' : 'PLAY: PASS & PLAY';
                    this.botPlayers = this.isVsBots ? [1, 2, 3] : [];
                    this.resetGame();
                });
            }

            if (btnSound) {
                btnSound.addEventListener('click', () => {
                    const on = Sound.toggle();
                    btnSound.textContent = on ? '🔊 SOUND' : '🔇 MUTED';
                });
            }
        }

        _initInputs() {
            const handleInteract = (clientX, clientY) => {
                Sound.init();
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = CANVAS_W / rect.width;
                const scaleY = CANVAS_H / rect.height;
                const x = (clientX - rect.left) * scaleX;
                const y = (clientY - rect.top) * scaleY;

                this._handleClick(x, y);
            };

            this.canvas.addEventListener('click', (e) => handleInteract(e.clientX, e.clientY));
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const t = e.touches[0];
                handleInteract(t.clientX, t.clientY);
            }, { passive: false });

            window.addEventListener('keydown', (e) => {
                if (e.code === 'Space' || e.code === 'Enter') {
                    e.preventDefault();
                    if (this.turnState === TURN_STATE.WAIT_ROLL && !this._isCurrentPlayerBot()) {
                        this.rollDice();
                    }
                }
            });
        }

        resetGame() {
            this.turnIndex = 0;
            this.turnState = TURN_STATE.WAIT_ROLL;
            this.diceValue = 1;
            this.consecutiveSixes = 0;
            this.winners = [];
            this.movingToken = null;
            this.movePath = [];

            for (let p = 0; p < 4; p++) {
                for (let i = 0; i < 4; i++) {
                    this.tokens[p][i].resetToBase();
                }
            }

            this.statusMessage = `${PLAYER_INFO[this.getCurrentPlayer()].name.toUpperCase()}'S TURN - ROLL!`;
        }

        getCurrentPlayer() {
            return this.activePlayers[this.turnIndex];
        }

        _isCurrentPlayerBot() {
            return this.isVsBots && this.botPlayers.includes(this.getCurrentPlayer());
        }

        _handleClick(x, y) {
            // 1. Check Dice Click (at bottom area: x ~ 230..330, y ~ 570..650)
            const diceX = CANVAS_W / 2;
            const diceY = 605;
            if (Math.hypot(x - diceX, y - diceY) < 45) {
                if (this.turnState === TURN_STATE.WAIT_ROLL && !this._isCurrentPlayerBot()) {
                    this.rollDice();
                    return;
                }
            }

            // 2. Check Token Click during DECIDING state
            if (this.turnState === TURN_STATE.DECIDING && !this._isCurrentPlayerBot()) {
                const curPlayer = this.getCurrentPlayer();
                for (let token of this.tokens[curPlayer]) {
                    if (token.isEligible) {
                        if (Math.hypot(x - token.x, y - token.y) < 18) {
                            this.selectTokenMove(token);
                            return;
                        }
                    }
                }
            }
        }

        rollDice() {
            if (this.turnState !== TURN_STATE.WAIT_ROLL) return;

            this.turnState = TURN_STATE.ROLLING;
            this.diceRolling = true;
            this.diceRollTimer = 650; // ms
            Sound.play('dice');
        }

        _finishDiceRoll() {
            this.diceRolling = false;
            // Fair 1..6 roll
            this.diceValue = Math.floor(Math.random() * 6) + 1;

            if (this.diceValue === 6) {
                this.consecutiveSixes++;
                if (this.consecutiveSixes >= 3) {
                    // Forfeit turn on 3 consecutive sixes!
                    this.statusMessage = '3 SIXES! TURN FORFEIT!';
                    setTimeout(() => this.passTurn(), 1000);
                    return;
                }
            } else {
                this.consecutiveSixes = 0;
            }

            this.turnState = TURN_STATE.DECIDING;
            this._evaluateEligibleTokens();
        }

        _evaluateEligibleTokens() {
            const curPlayer = this.getCurrentPlayer();
            const eligible = [];

            for (let token of this.tokens[curPlayer]) {
                token.isEligible = false;

                if (token.state === TOKEN_STATE.BASE) {
                    // Can leave base only on roll of 6
                    if (this.diceValue === 6) {
                        token.isEligible = true;
                        eligible.push(token);
                    }
                } else if (token.state === TOKEN_STATE.TRACK || token.state === TOKEN_STATE.HOME_STRETCH) {
                    // Can advance if doesn't overshoot Center Home (step 56)
                    if (token.step + this.diceValue <= 56) {
                        token.isEligible = true;
                        eligible.push(token);
                    }
                }
            }

            if (eligible.length === 0) {
                this.statusMessage = 'NO VALID MOVES!';
                setTimeout(() => this.passTurn(), 800);
            } else if (eligible.length === 1 && this._isCurrentPlayerBot()) {
                setTimeout(() => this.selectTokenMove(eligible[0]), 500);
            } else if (this._isCurrentPlayerBot()) {
                // AI picks best move
                setTimeout(() => {
                    const best = this._aiPickBestToken(eligible);
                    this.selectTokenMove(best);
                }, 600);
            } else if (eligible.length === 1) {
                // Human single eligible token: auto move or let click
                this.statusMessage = 'SELECT YOUR TOKEN TO MOVE!';
            } else {
                this.statusMessage = 'CHOOSE A TOKEN TO ADVANCE!';
            }
        }

        _aiPickBestToken(eligibleList) {
            // AI smart heuristics:
            // 1. Capture opponent token (+100)
            // 2. Reach Home (+80)
            // 3. Exit Base on 6 (+70)
            // 4. Furthest ahead
            let bestToken = eligibleList[0];
            let bestScore = -999;

            for (let token of eligibleList) {
                let score = 0;

                if (token.state === TOKEN_STATE.BASE) {
                    score += 70;
                } else {
                    const targetStep = token.step + this.diceValue;
                    if (targetStep === 56) {
                        score += 90; // Enters Home!
                    }

                    // Check if lands on opponent (Capture!)
                    if (targetStep <= 50) {
                        const targetTrackIdx = (PLAYER_INFO[token.player].startTrack + targetStep) % 52;
                        if (!SAFE_TILES.includes(targetTrackIdx)) {
                            for (let otherPlayer of this.activePlayers) {
                                if (otherPlayer !== token.player) {
                                    for (let otherToken of this.tokens[otherPlayer]) {
                                        if (otherToken.state === TOKEN_STATE.TRACK) {
                                            const otherTrack = (PLAYER_INFO[otherPlayer].startTrack + otherToken.step) % 52;
                                            if (otherTrack === targetTrackIdx) {
                                                score += 150; // Capture opportunity!
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    score += targetStep * 2; // Prefer advancing forward
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestToken = token;
                }
            }

            return bestToken;
        }

        selectTokenMove(token) {
            // Clear eligibility halos
            for (let p = 0; p < 4; p++) {
                for (let t of this.tokens[p]) t.isEligible = false;
            }

            this.turnState = TURN_STATE.MOVING;
            this.movingToken = token;
            this.movePath = [];

            if (token.state === TOKEN_STATE.BASE) {
                // Move out of base onto start tile (step 0)
                token.state = TOKEN_STATE.TRACK;
                token.step = 0;
                this.movePath.push(token.getGridPos());
                Sound.play('exitBase');
            } else {
                // Build step-by-step path for hopping animation
                const startStep = token.step;
                const endStep = token.step + this.diceValue;

                for (let s = startStep + 1; s <= endStep; s++) {
                    token.step = s;
                    if (s > 50 && s <= 55) {
                        token.state = TOKEN_STATE.HOME_STRETCH;
                    } else if (s === 56) {
                        token.state = TOKEN_STATE.HOME;
                    }
                    this.movePath.push(token.getGridPos());
                }
            }

            this.moveTimer = 0;
        }

        _finalizeTokenMove() {
            const token = this.movingToken;
            this.movingToken = null;
            this.movePath = [];

            let bonusRoll = false;

            // 1. Check if token reached Home (Victory!)
            if (token.state === TOKEN_STATE.HOME) {
                Sound.play('home');
                bonusRoll = true;

                // Check if all 4 tokens of this player reached Home
                const allHome = this.tokens[token.player].every(t => t.state === TOKEN_STATE.HOME);
                if (allHome && !this.winners.includes(token.player)) {
                    this.winners.push(token.player);
                    Sound.play('win');
                    if (this.winners.length === 1) {
                        this.statusMessage = `${PLAYER_INFO[token.player].name.toUpperCase()} WINS 1ST PLACE!`;
                    }
                }
            }

            // 2. Check for Capture on opponent's token
            if (token.state === TOKEN_STATE.TRACK) {
                const trackIdx = (PLAYER_INFO[token.player].startTrack + token.step) % 52;

                // Captures only occur on non-safe tiles
                if (!SAFE_TILES.includes(trackIdx)) {
                    for (let otherPlayer of this.activePlayers) {
                        if (otherPlayer !== token.player) {
                            for (let otherToken of this.tokens[otherPlayer]) {
                                if (otherToken.state === TOKEN_STATE.TRACK) {
                                    const otherTrack = (PLAYER_INFO[otherPlayer].startTrack + otherToken.step) % 52;
                                    if (otherTrack === trackIdx) {
                                        // CAPTURE!
                                        otherToken.resetToBase();
                                        Sound.play('capture');
                                        this.statusMessage = `${PLAYER_INFO[token.player].name.toUpperCase()} CAPTURED ${PLAYER_INFO[otherPlayer].name.toUpperCase()}!`;
                                        bonusRoll = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 3. Roll of 6 awards bonus roll
            if (this.diceValue === 6) {
                bonusRoll = true;
                Sound.play('bonus');
            }

            if (bonusRoll && this.winners.length < 3) {
                this.turnState = TURN_STATE.WAIT_ROLL;
                this.statusMessage = `${PLAYER_INFO[this.getCurrentPlayer()].name.toUpperCase()} GETS A BONUS ROLL!`;
                if (this._isCurrentPlayerBot()) {
                    setTimeout(() => this.rollDice(), 800);
                }
            } else {
                this.passTurn();
            }
        }

        passTurn() {
            this.consecutiveSixes = 0;
            this.turnIndex = (this.turnIndex + 1) % this.activePlayers.length;

            // Skip players who already got all 4 tokens Home
            let attempts = 0;
            while (this.winners.includes(this.getCurrentPlayer()) && attempts < 4) {
                this.turnIndex = (this.turnIndex + 1) % this.activePlayers.length;
                attempts++;
            }

            this.turnState = TURN_STATE.WAIT_ROLL;
            this.statusMessage = `${PLAYER_INFO[this.getCurrentPlayer()].name.toUpperCase()}'S TURN - ROLL!`;

            if (this._isCurrentPlayerBot()) {
                setTimeout(() => this.rollDice(), 700);
            }
        }

        // ============================
        // UPDATE LOOP
        // ============================
        update(dt) {
            // Dice tumbling animation
            if (this.turnState === TURN_STATE.ROLLING) {
                this.diceRollTimer -= dt;
                this.diceValue = Math.floor(Math.random() * 6) + 1;
                if (this.diceRollTimer <= 0) {
                    this._finishDiceRoll();
                }
            }

            // Step-by-step Token Hopping Animation
            if (this.turnState === TURN_STATE.MOVING && this.movingToken) {
                this.moveTimer += dt;
                if (this.moveTimer > 180) { // Hop interval
                    this.moveTimer = 0;
                    if (this.movePath.length > 0) {
                        const [r, c] = this.movePath.shift();
                        this.movingToken.targetX = OFFSET_X + c * CELL_PX + CELL_PX / 2;
                        this.movingToken.targetY = OFFSET_Y + r * CELL_PX + CELL_PX / 2;
                        Sound.play('hop');
                    } else {
                        this._finalizeTokenMove();
                    }
                }
            }

            // Update all tokens smooth lerping
            for (let p = 0; p < 4; p++) {
                for (let t of this.tokens[p]) {
                    t.update(dt);
                }
            }
        }


        // ============================
        // RENDER LOOP
        // ============================
        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.W, this.H);

            // 1. Background
            this._drawBackground(ctx);

            // 2. Top HUD Bar
            this._drawHUD(ctx);

            // 3. Draw 15x15 Ludo Board
            this._drawLudoBoard(ctx);

            // 4. Draw Tokens
            for (let p = 0; p < 4; p++) {
                for (let t of this.tokens[p]) {
                    if (t !== this.movingToken) {
                        t.draw(ctx);
                    }
                }
            }
            if (this.movingToken) {
                this.movingToken.draw(ctx);
            }

            // 5. Draw 3D Interactive Dice Panel at bottom
            this._drawDicePanel(ctx);

            // 6. Draw Winner overlay if game complete
            if (this.winners.length > 0) {
                this._drawWinnerCrowns(ctx);
            }
        }

        _drawBackground(ctx) {
            const g = ctx.createLinearGradient(0, 0, 0, this.H);
            g.addColorStop(0, '#15132d');
            g.addColorStop(0.5, '#1e1b3d');
            g.addColorStop(1, '#0c0a1a');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, this.W, this.H);
        }

        _drawHUD(ctx) {
            ctx.fillStyle = 'rgba(14, 12, 28, 0.9)';
            ctx.fillRect(0, 0, this.W, 56);
            ctx.strokeStyle = '#00b0ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, this.W, 56);

            // Turn Indicator
            const curP = this.getCurrentPlayer();
            const colors = PLAYER_INFO[curP];

            ctx.fillStyle = colors.primary;
            ctx.beginPath();
            ctx.arc(30, 28, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(this.statusMessage, 54, 32);

            // Player Mode Pill on right
            ctx.textAlign = 'right';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffea00';
            ctx.fillText(this.isVsBots ? 'VS BOTS' : 'PASS & PLAY', this.W - 20, 32);
        }

        _drawLudoBoard(ctx) {
            // Outer Board Frame with Shadow
            ctx.save();
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(OFFSET_X, OFFSET_Y, BOARD_PX, BOARD_PX);
            ctx.strokeStyle = '#222233';
            ctx.lineWidth = 3;
            ctx.strokeRect(OFFSET_X, OFFSET_Y, BOARD_PX, BOARD_PX);

            // 1. Draw 4 Corner Home Bases (6x6 cells each)
            this._drawBaseBox(ctx, 0, 0, PLAYER.RED);
            this._drawBaseBox(ctx, 0, 9, PLAYER.GREEN);
            this._drawBaseBox(ctx, 9, 9, PLAYER.YELLOW);
            this._drawBaseBox(ctx, 9, 0, PLAYER.BLUE);

            // 2. Draw Center Victory Triangle (3x3 cells)
            this._drawCenterHome(ctx);

            // 3. Draw Track Grid & Cells
            this._drawTracks(ctx);

            ctx.restore();
        }

        _drawBaseBox(ctx, startRow, startCol, player) {
            const bx = OFFSET_X + startCol * CELL_PX;
            const by = OFFSET_Y + startRow * CELL_PX;
            const size = 6 * CELL_PX;
            const colors = PLAYER_INFO[player];

            // Outer colored quadrant
            ctx.fillStyle = colors.primary;
            ctx.fillRect(bx, by, size, size);
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, size, size);

            // Inner white courtyard
            const pad = CELL_PX;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(bx + pad, by + pad, size - pad * 2, size - pad * 2);
            ctx.strokeRect(bx + pad, by + pad, size - pad * 2, size - pad * 2);

            // 4 Circular Token Hold Pockets
            const slots = BASE_SLOTS[player];
            slots.forEach(([r, c]) => {
                const px = OFFSET_X + c * CELL_PX;
                const py = OFFSET_Y + r * CELL_PX;

                ctx.fillStyle = colors.primary;
                ctx.beginPath();
                ctx.arc(px, py, 13, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = colors.dark;
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        }

        _drawCenterHome(ctx) {
            const cx = OFFSET_X + 6 * CELL_PX;
            const cy = OFFSET_Y + 6 * CELL_PX;
            const size = 3 * CELL_PX;
            const centerMidX = cx + size / 2;
            const centerMidY = cy + size / 2;

            // 4 Triangles pointing to center
            // Red (Left triangle)
            ctx.fillStyle = PLAYER_INFO[PLAYER.RED].primary;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(centerMidX, centerMidY);
            ctx.lineTo(cx, cy + size);
            ctx.closePath();
            ctx.fill();

            // Green (Top triangle)
            ctx.fillStyle = PLAYER_INFO[PLAYER.GREEN].primary;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(centerMidX, centerMidY);
            ctx.lineTo(cx + size, cy);
            ctx.closePath();
            ctx.fill();

            // Yellow (Right triangle)
            ctx.fillStyle = PLAYER_INFO[PLAYER.YELLOW].primary;
            ctx.beginPath();
            ctx.moveTo(cx + size, cy);
            ctx.lineTo(centerMidX, centerMidY);
            ctx.lineTo(cx + size, cy + size);
            ctx.closePath();
            ctx.fill();

            // Blue (Bottom triangle)
            ctx.fillStyle = PLAYER_INFO[PLAYER.BLUE].primary;
            ctx.beginPath();
            ctx.moveTo(cx, cy + size);
            ctx.lineTo(centerMidX, centerMidY);
            ctx.lineTo(cx + size, cy + size);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx, cy, size, size);
        }

        _drawTracks(ctx) {
            // Draw all track cells
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    // Skip 4 corner bases and center
                    if ((r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8) || (r >= 6 && r <= 8 && c >= 6 && c <= 8)) {
                        continue;
                    }

                    const tx = OFFSET_X + c * CELL_PX;
                    const ty = OFFSET_Y + r * CELL_PX;

                    ctx.fillStyle = '#ffffff';

                    // Color Home Stretches
                    if (r === 7 && c >= 1 && c <= 5) ctx.fillStyle = PLAYER_INFO[PLAYER.RED].primary;
                    if (c === 7 && r >= 1 && r <= 5) ctx.fillStyle = PLAYER_INFO[PLAYER.GREEN].primary;
                    if (r === 7 && c >= 9 && c <= 13) ctx.fillStyle = PLAYER_INFO[PLAYER.YELLOW].primary;
                    if (c === 7 && r >= 9 && r <= 13) ctx.fillStyle = PLAYER_INFO[PLAYER.BLUE].primary;

                    // Color Start Tiles
                    if (r === 6 && c === 1) ctx.fillStyle = PLAYER_INFO[PLAYER.RED].primary;
                    if (r === 1 && c === 8) ctx.fillStyle = PLAYER_INFO[PLAYER.GREEN].primary;
                    if (r === 8 && c === 13) ctx.fillStyle = PLAYER_INFO[PLAYER.YELLOW].primary;
                    if (r === 13 && c === 6) ctx.fillStyle = PLAYER_INFO[PLAYER.BLUE].primary;

                    ctx.fillRect(tx, ty, CELL_PX, CELL_PX);
                    ctx.strokeStyle = '#bbb';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(tx, ty, CELL_PX, CELL_PX);

                    // Draw Safe Stars
                    if ((r === 6 && c === 1) || (r === 2 && c === 6) ||
                        (r === 1 && c === 8) || (r === 6 && c === 12) ||
                        (r === 8 && c === 13) || (r === 12 && c === 8) ||
                        (r === 13 && c === 6) || (r === 8 && c === 2)) {
                        this._drawStarIcon(ctx, tx + CELL_PX / 2, ty + CELL_PX / 2);
                    }
                }
            }
        }

        _drawStarIcon(ctx, cx, cy) {
            ctx.save();
            ctx.fillStyle = '#ffd700';
            ctx.strokeStyle = '#b38f00';
            ctx.lineWidth = 1;
            const points = 5;
            const outer = 6;
            const inner = 3;
            ctx.beginPath();
            for (let i = 0; i < points * 2; i++) {
                const r = (i % 2 === 0) ? outer : inner;
                const angle = (i * Math.PI) / points - Math.PI / 2;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        _drawDicePanel(ctx) {
            const diceX = CANVAS_W / 2;
            const diceY = 605;
            const diceSize = 54;

            // Panel Background
            ctx.fillStyle = 'rgba(14, 12, 28, 0.85)';
            ctx.fillRect(0, 550, this.W, 130);

            // Dice Rolling / Idle Visual
            ctx.save();
            ctx.translate(diceX, diceY);

            // Rotation wobble while rolling
            if (this.diceRolling) {
                const rot = (Date.now() * 0.02) % (Math.PI * 2);
                ctx.rotate(rot);
            }

            // Dice Outer Frame
            ctx.fillStyle = '#ffffff';
            ctx.roundRect(-diceSize / 2, -diceSize / 2, diceSize, diceSize, 8);
            ctx.fill();
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Dice Pips (1 to 6)
            this._drawDicePips(ctx, this.diceValue, diceSize);

            ctx.restore();

            // Roll Button / Instructions
            ctx.textAlign = 'center';
            ctx.font = '9px "Press Start 2P", monospace';
            const curP = this.getCurrentPlayer();
            const colors = PLAYER_INFO[curP];

            if (this.turnState === TURN_STATE.WAIT_ROLL) {
                if (this._isCurrentPlayerBot()) {
                    ctx.fillStyle = '#8888aa';
                    ctx.fillText('BOT IS ROLLING...', this.W / 2, 650);
                } else {
                    const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
                    ctx.fillStyle = colors.primary;
                    ctx.fillText('▶ CLICK DICE OR SPACE TO ROLL ◀', this.W / 2, 650);
                }
            } else if (this.turnState === TURN_STATE.ROLLING) {
                ctx.fillStyle = '#ffd700';
                ctx.fillText('ROLLING...', this.W / 2, 650);
            } else if (this.turnState === TURN_STATE.DECIDING) {
                ctx.fillStyle = '#00e5ff';
                ctx.fillText(`ROLLED A ${this.diceValue}! SELECT TOKEN`, this.W / 2, 650);
            }
        }

        _drawDicePips(ctx, val, size) {
            const pad = size * 0.25;
            const pips = {
                1: [[0, 0]],
                2: [[-pad, -pad], [pad, pad]],
                3: [[-pad, -pad], [0, 0], [pad, pad]],
                4: [[-pad, -pad], [pad, -pad], [-pad, pad], [pad, pad]],
                5: [[-pad, -pad], [pad, -pad], [0, 0], [-pad, pad], [pad, pad]],
                6: [[-pad, -pad], [pad, -pad], [-pad, 0], [pad, 0], [-pad, pad], [pad, pad]]
            };

            const dots = pips[val] || pips[1];
            ctx.fillStyle = (val === 1 || val === 6) ? '#ff2a5f' : '#222233';

            dots.forEach(([px, py]) => {
                ctx.beginPath();
                ctx.arc(px, py, 4.5, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        _drawWinnerCrowns(ctx) {
            if (this.winners.length === 0) return;

            // Show 1st place crown in center
            const winner = this.winners[0];
            const colors = PLAYER_INFO[winner];

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(OFFSET_X + 6 * CELL_PX, OFFSET_Y + 6 * CELL_PX, 3 * CELL_PX, 3 * CELL_PX);

            ctx.font = '22px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('👑', OFFSET_X + 7.5 * CELL_PX, OFFSET_Y + 7.8 * CELL_PX);
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
    // INITIALIZATION
    // ============================
    window.addEventListener('DOMContentLoaded', () => {
        const game = new Game();
        game.run();
    });

})();

