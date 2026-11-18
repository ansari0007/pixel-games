/* ==========================================================================
   PIXEL WORD SEARCH — Classic Retro Word Search Puzzle Engine
   Pure HTML5 Canvas + Vanilla JavaScript + Procedural Web Audio API
   ========================================================================== */

(function () {
    'use strict';

    // ============================
    // CONSTANTS & SETTINGS
    // ============================
    const CANVAS_W = 600;
    const CANVAS_H = 780;

    const GRID_SIZE = 10;
    const CELL_PX = 44; // 10 * 44 = 440px wide & high
    const GRID_PX = GRID_SIZE * CELL_PX;
    const OFFSET_X = (CANVAS_W - GRID_PX) / 2; // 80px
    const OFFSET_Y = 116; // 116px

    // Palette for Found Words (Neon Colors)
    const HIGHLIGHT_COLORS = [
        { main: '#00f0ff', glow: 'rgba(0, 240, 255, 0.4)', text: '#00f0ff' }, // Cyan
        { main: '#ff007f', glow: 'rgba(255, 0, 127, 0.4)', text: '#ff007f' }, // Pink
        { main: '#00e676', glow: 'rgba(0, 230, 118, 0.4)', text: '#00e676' }, // Lime
        { main: '#ffea00', glow: 'rgba(255, 234, 0, 0.4)', text: '#ffea00' }, // Yellow
        { main: '#ff9100', glow: 'rgba(255, 145, 0, 0.4)', text: '#ff9100' }, // Orange
        { main: '#b388ff', glow: 'rgba(179, 136, 255, 0.4)', text: '#b388ff' }, // Purple
        { main: '#00b0ff', glow: 'rgba(0, 176, 255, 0.4)', text: '#00b0ff' }, // Sky Blue
        { main: '#ff5252', glow: 'rgba(255, 82, 82, 0.4)', text: '#ff5252' }, // Coral
    ];

    // English letter frequencies for filling random cells
    const LETTER_POOL = 'AAAAAAAAABBCCCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSSSTTTTTTUUUUVVWWXYYZ';

    // Curated Themes
    const THEMES = [
        {
            id: 'retro_gaming',
            name: 'RETRO GAMING',
            emoji: '👾',
            words: ['PIXEL', 'ARCADE', 'MARIO', 'ZELDA', 'PACMAN', 'TETRIS', 'SONIC', 'BOMBER', 'QUEST', 'COMBO', 'LEVEL', 'COIN']
        },
        {
            id: 'space_cosmos',
            name: 'SPACE EXPLORER',
            emoji: '🚀',
            words: ['GALAXY', 'PLANET', 'COMET', 'NEBULA', 'ROCKET', 'COSMOS', 'ORBIT', 'METEOR', 'PULSAR', 'SOLAR', 'ALIEN', 'LUNAR']
        },
        {
            id: 'delicious_foods',
            name: 'DELICIOUS FOODS',
            emoji: '🍕',
            words: ['PIZZA', 'BURGER', 'SUSHI', 'TACO', 'PASTA', 'COOKIE', 'DONUT', 'NACHO', 'WAFFLE', 'CHEESE', 'RAMEN', 'FRIES']
        },
        {
            id: 'animal_kingdom',
            name: 'ANIMAL KINGDOM',
            emoji: '🐾',
            words: ['TIGER', 'PANDA', 'FALCON', 'DOLPHIN', 'EAGLE', 'WOLF', 'MONKEY', 'GIRAFFE', 'OTTER', 'KOALA', 'JAGUAR', 'ZEBRA']
        },
        {
            id: 'cyber_tech',
            name: 'CYBER & CODE',
            emoji: '💻',
            words: ['BINARY', 'MATRIX', 'ROBOT', 'PYTHON', 'CHIP', 'CYBER', 'SERVER', 'DATA', 'LOGIC', 'HACKER', 'MEMORY', 'CLOUD']
        }
    ];

    // Directions: [dRow, dCol] (8-Way)
    const DIRECTIONS = [
        [0, 1],   // Right
        [1, 0],   // Down
        [1, 1],   // Down-Right
        [-1, 1],  // Up-Right
        [0, -1],  // Left
        [-1, 0],  // Up
        [-1, -1], // Up-Left
        [1, -1]   // Down-Left
    ];


    // ============================
    // PROCEDURAL AUDIO SYNTHESIZER
    // ============================
    const Sound = {
        ctx: null,
        enabled: true,

        init() {
            if (!this.ctx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    this.ctx = new AudioContextClass();
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
                case 'click': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(500 + arg * 60, t);
                    gain.gain.setValueAtTime(0.06, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.05);
                    break;
                }
                case 'found': {
                    // Majestic 4-note ascending chord arpeggio
                    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                    freqs.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(f, t + i * 0.08);
                        gain.gain.setValueAtTime(0.16, t + i * 0.08);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.35);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(t + i * 0.08);
                        osc.stop(t + i * 0.08 + 0.38);
                    });
                    break;
                }
                case 'error': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(140, t);
                    osc.frequency.linearRampToValueAtTime(100, t + 0.14);
                    gain.gain.setValueAtTime(0.08, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.15);
                    break;
                }
                case 'hint': {
                    // Shimmering harp sweep
                    const notes = [440, 554, 659, 880, 1108];
                    notes.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
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
                case 'win': {
                    // Victory Fanfare
                    const melody = [
                        { f: 523, d: 0.12 }, { f: 659, d: 0.12 }, { f: 784, d: 0.12 },
                        { f: 1046, d: 0.28 }, { f: 880, d: 0.15 }, { f: 1046, d: 0.55 }
                    ];
                    let cursor = 0;
                    melody.forEach(m => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.value = m.f;
                        gain.gain.setValueAtTime(0.2, t + cursor);
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
    // PARTICLES & POPUPS
    // ============================
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.size = Math.random() * 5 + 3;
            this.color = color;
            this.alpha = 1;
            this.life = 1;
            this.decay = Math.random() * 0.02 + 0.02;
            this.gravity = 0.08;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            this.life -= this.decay;
            this.alpha = Math.max(0, this.life);
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    class FloatingText {
        constructor(x, y, text, color) {
            this.x = x;
            this.y = y;
            this.text = text;
            this.color = color;
            this.alpha = 1;
            this.life = 1;
            this.vy = -1.5;
        }

        update() {
            this.y += this.vy;
            this.life -= 0.022;
            this.alpha = Math.max(0, this.life);
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillStyle = this.color;
            ctx.textAlign = 'center';
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
    }


    // ============================
    // MAIN WORD SEARCH GAME ENGINE
    // ============================
    class WordSearchGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.ctx.imageSmoothingEnabled = false;

            this.W = CANVAS_W;
            this.H = CANVAS_H;

            // Game State
            this.themeIndex = 0;
            this.grid = []; // 10x10 array of characters
            this.targetWords = []; // List of word objects { word, start, end, cells, color, found }
            this.foundWordsCount = 0;

            // Selection Drag State
            this.isDragging = false;
            this.startCell = null; // { r, c }
            this.currentCell = null; // { r, c } (snapped)
            this.selectedCells = []; // array of { r, c }
            this.formedWord = '';

            // Hints & Stats
            this.hintsLeft = 3;
            this.activeHint = null; // { r, c, timer }
            this.score = 0;
            this.streak = 0;
            this.startTime = Date.now();
            this.elapsedSeconds = 0;
            this.isGameOver = false;

            // Polish & Effects
            this.particles = [];
            this.floatingTexts = [];
            this.shakeTimer = 0;

            this._initCanvas();
            this._initDOMControls();
            this._initInputHandlers();
            this.startNewGame();
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

        _initDOMControls() {
            const btnTheme = document.getElementById('btn-theme');
            const btnHint = document.getElementById('btn-hint');
            const btnNew = document.getElementById('btn-new');
            const btnSound = document.getElementById('btn-sound');
            const modal = document.getElementById('theme-modal');
            const btnCloseModal = document.getElementById('btn-close-modal');
            const themeList = document.getElementById('theme-list');

            // Theme Modal
            if (btnTheme && modal) {
                btnTheme.addEventListener('click', () => {
                    this._populateThemeModal();
                    modal.style.display = 'flex';
                });
            }

            if (btnCloseModal && modal) {
                btnCloseModal.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }

            // Hint Button
            if (btnHint) {
                btnHint.addEventListener('click', () => {
                    this.useHint();
                });
            }

            // New Game Button
            if (btnNew) {
                btnNew.addEventListener('click', () => {
                    this.startNewGame();
                });
            }

            // Sound Toggle
            if (btnSound) {
                btnSound.addEventListener('click', () => {
                    const on = Sound.toggle();
                    btnSound.textContent = on ? '🔊 SOUND' : '🔇 MUTED';
                });
            }
        }

        _populateThemeModal() {
            const themeList = document.getElementById('theme-list');
            const modal = document.getElementById('theme-modal');
            if (!themeList) return;

            themeList.innerHTML = '';
            THEMES.forEach((thm, idx) => {
                const btn = document.createElement('button');
                btn.className = `theme-opt-btn ${idx === this.themeIndex ? 'active' : ''}`;
                btn.innerHTML = `<strong>${thm.emoji} ${thm.name}</strong><br><span style="font-size: 8px; color: #8899bb;">(${thm.words.slice(0, 4).join(', ')}...)</span>`;
                btn.addEventListener('click', () => {
                    this.themeIndex = idx;
                    if (modal) modal.style.display = 'none';
                    this.startNewGame();
                });
                themeList.appendChild(btn);
            });
        }

        _initInputHandlers() {
            const getCanvasPos = (clientX, clientY) => {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = CANVAS_W / rect.width;
                const scaleY = CANVAS_H / rect.height;
                return {
                    x: (clientX - rect.left) * scaleX,
                    y: (clientY - rect.top) * scaleY
                };
            };

            const handlePointerDown = (clientX, clientY) => {
                Sound.init();
                const pos = getCanvasPos(clientX, clientY);

                // If game is over, check for click on Next Puzzle button
                if (this.isGameOver) {
                    const btnX = CANVAS_W / 2 - 120;
                    const btnY = 560;
                    const btnW = 240;
                    const btnH = 50;
                    if (pos.x >= btnX && pos.x <= btnX + btnW && pos.y >= btnY && pos.y <= btnY + btnH) {
                        this.startNewGame();
                        return;
                    }
                }

                // Check cell coordinate
                const cell = this._getCellAt(pos.x, pos.y);
                if (cell) {
                    this.isDragging = true;
                    this.startCell = cell;
                    this.currentCell = cell;
                    this._updateSelectedPath();
                    Sound.play('click', 0);
                }
            };

            const handlePointerMove = (clientX, clientY) => {
                if (!this.isDragging || !this.startCell) return;
                const pos = getCanvasPos(clientX, clientY);
                const cell = this._getCellAt(pos.x, pos.y);

                if (cell) {
                    const snapped = this._snapToLine(this.startCell, cell);
                    if (!this.currentCell || snapped.r !== this.currentCell.r || snapped.c !== this.currentCell.c) {
                        this.currentCell = snapped;
                        const prevLen = this.selectedCells.length;
                        this._updateSelectedPath();
                        if (this.selectedCells.length !== prevLen) {
                            Sound.play('click', this.selectedCells.length);
                        }
                    }
                }
            };

            const handlePointerUp = () => {
                if (!this.isDragging) return;
                this.isDragging = false;
                this._validateSelection();
            };

            // Mouse events
            this.canvas.addEventListener('mousedown', (e) => handlePointerDown(e.clientX, e.clientY));
            window.addEventListener('mousemove', (e) => handlePointerMove(e.clientX, e.clientY));
            window.addEventListener('mouseup', handlePointerUp);

            // Touch events
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const t = e.touches[0];
                handlePointerDown(t.clientX, t.clientY);
            }, { passive: false });

            window.addEventListener('touchmove', (e) => {
                if (!this.isDragging) return;
                e.preventDefault();
                const t = e.touches[0];
                handlePointerMove(t.clientX, t.clientY);
            }, { passive: false });

            window.addEventListener('touchend', handlePointerUp);
        }

        _getCellAt(x, y) {
            if (x < OFFSET_X || x >= OFFSET_X + GRID_PX || y < OFFSET_Y || y >= OFFSET_Y + GRID_PX) {
                return null;
            }
            const c = Math.floor((x - OFFSET_X) / CELL_PX);
            const r = Math.floor((y - OFFSET_Y) / CELL_PX);
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                return { r, c };
            }
            return null;
        }

        _snapToLine(start, current) {
            const dr = current.r - start.r;
            const dc = current.c - start.c;

            if (dr === 0 && dc === 0) return { r: start.r, c: start.c };

            const absR = Math.abs(dr);
            const absC = Math.abs(dc);

            let snappedR = start.r;
            let snappedC = start.c;

            // Determine dominant orientation (horizontal, vertical, or 45-degree diagonal)
            if (absR <= absC * 0.45) {
                // Pure Horizontal
                snappedR = start.r;
                snappedC = current.c;
            } else if (absC <= absR * 0.45) {
                // Pure Vertical
                snappedR = current.r;
                snappedC = start.c;
            } else {
                // Diagonal (45 degrees)
                const step = Math.max(absR, absC);
                const signR = dr > 0 ? 1 : -1;
                const signC = dc > 0 ? 1 : -1;

                // Clamp to prevent exceeding grid boundaries
                let maxSteps = step;
                while (maxSteps > 0) {
                    const testR = start.r + signR * maxSteps;
                    const testC = start.c + signC * maxSteps;
                    if (testR >= 0 && testR < GRID_SIZE && testC >= 0 && testC < GRID_SIZE) {
                        break;
                    }
                    maxSteps--;
                }
                snappedR = start.r + signR * maxSteps;
                snappedC = start.c + signC * maxSteps;
            }

            return { r: snappedR, c: snappedC };
        }

        _updateSelectedPath() {
            if (!this.startCell || !this.currentCell) {
                this.selectedCells = [];
                this.formedWord = '';
                return;
            }

            const dr = this.currentCell.r - this.startCell.r;
            const dc = this.currentCell.c - this.startCell.c;
            const steps = Math.max(Math.abs(dr), Math.abs(dc));

            this.selectedCells = [];
            let str = '';

            const stepR = steps === 0 ? 0 : dr / steps;
            const stepC = steps === 0 ? 0 : dc / steps;

            for (let i = 0; i <= steps; i++) {
                const r = Math.round(this.startCell.r + stepR * i);
                const c = Math.round(this.startCell.c + stepC * i);
                this.selectedCells.push({ r, c });
                str += this.grid[r][c];
            }

            this.formedWord = str;
        }

        _validateSelection() {
            if (this.selectedCells.length < 2 || !this.formedWord) {
                this.selectedCells = [];
                this.formedWord = '';
                this.startCell = null;
                this.currentCell = null;
                return;
            }

            const forward = this.formedWord;
            const backward = this.formedWord.split('').reverse().join('');

            // Check if matches an unfound target word
            let matched = this.targetWords.find(w => !w.found && (w.word === forward || w.word === backward));

            if (matched) {
                // Success!
                matched.found = true;
                matched.foundCells = [...this.selectedCells];
                matched.color = HIGHLIGHT_COLORS[this.foundWordsCount % HIGHLIGHT_COLORS.length];
                this.foundWordsCount++;

                // Score calculation
                this.streak++;
                const wordScore = matched.word.length * 100 + (this.streak * 50);
                this.score += wordScore;

                // Particles along the word
                this.selectedCells.forEach(cell => {
                    const cx = OFFSET_X + cell.c * CELL_PX + CELL_PX / 2;
                    const cy = OFFSET_Y + cell.r * CELL_PX + CELL_PX / 2;
                    for (let p = 0; p < 6; p++) {
                        this.particles.push(new Particle(cx, cy, matched.color.main));
                    }
                });

                // Floating text popup
                const midIdx = Math.floor(this.selectedCells.length / 2);
                const midCell = this.selectedCells[midIdx];
                const popX = OFFSET_X + midCell.c * CELL_PX + CELL_PX / 2;
                const popY = OFFSET_Y + midCell.r * CELL_PX + CELL_PX / 2;
                this.floatingTexts.push(new FloatingText(popX, popY - 10, `+${wordScore}!`, matched.color.main));

                Sound.play('found');

                // Clear active hint if it matched this word
                if (this.activeHint && this.activeHint.word === matched.word) {
                    this.activeHint = null;
                }

                // Check for Puzzle Complete
                if (this.foundWordsCount === this.targetWords.length) {
                    this.triggerVictory();
                }
            } else {
                // Invalid selection
                this.streak = 0;
                Sound.play('error');
            }

            this.selectedCells = [];
            this.formedWord = '';
            this.startCell = null;
            this.currentCell = null;
        }

        useHint() {
            if (this.hintsLeft <= 0 || this.isGameOver) return;

            // Find first unfound word
            const unfound = this.targetWords.find(w => !w.found);
            if (!unfound) return;

            this.hintsLeft--;
            const hintElem = document.getElementById('hint-count');
            if (hintElem) hintElem.textContent = this.hintsLeft;

            // Reveal the first letter of this word
            const firstCell = unfound.cells[0];
            this.activeHint = {
                r: firstCell.r,
                c: firstCell.c,
                word: unfound.word,
                timer: 3500 // 3.5 seconds
            };

            Sound.play('hint');

            // Spawn sparkles on first letter
            const hx = OFFSET_X + firstCell.c * CELL_PX + CELL_PX / 2;
            const hy = OFFSET_Y + firstCell.r * CELL_PX + CELL_PX / 2;
            for (let i = 0; i < 15; i++) {
                this.particles.push(new Particle(hx, hy, '#ffd700'));
            }
            this.floatingTexts.push(new FloatingText(hx, hy - 18, `HINT: "${unfound.word[0]}"`, '#ffd700'));
        }

        triggerVictory() {
            this.isGameOver = true;
            Sound.play('win');

            // Big victory confetti shower
            for (let i = 0; i < 120; i++) {
                const rx = Math.random() * CANVAS_W;
                const ry = Math.random() * (CANVAS_H * 0.7);
                const col = HIGHLIGHT_COLORS[Math.floor(Math.random() * HIGHLIGHT_COLORS.length)].main;
                this.particles.push(new Particle(rx, ry, col));
            }
        }

        startNewGame() {
            this.isGameOver = false;
            this.hintsLeft = 3;
            const hintElem = document.getElementById('hint-count');
            if (hintElem) hintElem.textContent = this.hintsLeft;

            this.activeHint = null;
            this.streak = 0;
            this.startTime = Date.now();
            this.elapsedSeconds = 0;
            this.foundWordsCount = 0;
            this.particles = [];
            this.floatingTexts = [];

            this._generateBoard();
        }

        _generateBoard() {
            const currentTheme = THEMES[this.themeIndex];
            const wordList = [...currentTheme.words];

            // Shuffle words & pick 8
            for (let i = wordList.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [wordList[i], wordList[j]] = [wordList[j], wordList[i]];
            }
            const selectedWords = wordList.slice(0, 8);

            // Sort longer words first
            selectedWords.sort((a, b) => b.length - a.length);

            let success = false;
            let attempts = 0;

            while (!success && attempts < 50) {
                attempts++;
                // Create empty 10x10 grid
                this.grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''));
                this.targetWords = [];

                let allPlaced = true;
                for (let word of selectedWords) {
                    const placed = this._placeWordInGrid(word);
                    if (!placed) {
                        allPlaced = false;
                        break;
                    }
                }

                if (allPlaced) {
                    success = true;
                }
            }

            // Fill empty cells with random letters
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (this.grid[r][c] === '') {
                        this.grid[r][c] = LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
                    }
                }
            }
        }

        _placeWordInGrid(word) {
            // Try random directions and coordinates
            const shuffledDirs = [...DIRECTIONS];
            for (let i = shuffledDirs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledDirs[i], shuffledDirs[j]] = [shuffledDirs[j], shuffledDirs[i]];
            }

            for (let dir of shuffledDirs) {
                const [dr, dc] = dir;
                // Determine valid start bounds for this direction
                const minR = dr < 0 ? (word.length - 1) : 0;
                const maxR = dr > 0 ? GRID_SIZE - word.length : GRID_SIZE - 1;
                const minC = dc < 0 ? (word.length - 1) : 0;
                const maxC = dc > 0 ? GRID_SIZE - word.length : GRID_SIZE - 1;

                if (maxR < minR || maxC < minC) continue;

                // Try up to 40 random starting locations
                for (let tryCount = 0; tryCount < 40; tryCount++) {
                    const r = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
                    const c = Math.floor(Math.random() * (maxC - minC + 1)) + minC;

                    let canPlace = true;
                    const cells = [];

                    for (let step = 0; step < word.length; step++) {
                        const curR = r + dr * step;
                        const curC = c + dc * step;
                        const existing = this.grid[curR][curC];

                        if (existing !== '' && existing !== word[step]) {
                            canPlace = false;
                            break;
                        }
                        cells.push({ r: curR, c: curC });
                    }

                    if (canPlace) {
                        // Place letters
                        for (let step = 0; step < word.length; step++) {
                            const curR = r + dr * step;
                            const curC = c + dc * step;
                            this.grid[curR][curC] = word[step];
                        }

                        this.targetWords.push({
                            word,
                            start: cells[0],
                            end: cells[cells.length - 1],
                            cells,
                            found: false,
                            color: null
                        });
                        return true;
                    }
                }
            }

            return false;
        }

        update(dt) {
            // Update timer
            if (!this.isGameOver) {
                this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            }

            // Update active hint timer
            if (this.activeHint) {
                this.activeHint.timer -= dt;
                if (this.activeHint.timer <= 0) {
                    this.activeHint = null;
                }
            }

            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].life <= 0) {
                    this.particles.splice(i, 1);
                }
            }

            // Update floating texts
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                this.floatingTexts[i].update();
                if (this.floatingTexts[i].life <= 0) {
                    this.floatingTexts.splice(i, 1);
                }
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.W, this.H);

            // Dark cyber retro background
            ctx.fillStyle = '#080916';
            ctx.fillRect(0, 0, this.W, this.H);

            // Subtle scanlines / grid pattern
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
            ctx.lineWidth = 1;
            for (let y = 0; y < this.H; y += 4) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.W, y);
                ctx.stroke();
            }

            this._drawHUD(ctx);
            this._drawGrid(ctx);
            this._drawFoundHighlights(ctx);
            this._drawActiveDragSelection(ctx);
            this._drawLetters(ctx);
            this._drawHintMarker(ctx);
            this._drawWordBank(ctx);

            // Draw floating particles & texts
            this.particles.forEach(p => p.draw(ctx));
            this.floatingTexts.forEach(ft => ft.draw(ctx));

            // Victory Screen Overlay
            if (this.isGameOver) {
                this._drawVictoryScreen(ctx);
            }
        }

        _drawHUD(ctx) {
            const currentTheme = THEMES[this.themeIndex];

            // Title
            ctx.textAlign = 'center';
            ctx.font = '15px "Press Start 2P", monospace';
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 8;
            ctx.fillText('PIXEL WORD SEARCH', this.W / 2, 38);
            ctx.shadowBlur = 0;

            // Theme subtitle pill
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffea00';
            ctx.fillText(`${currentTheme.emoji} ${currentTheme.name}`, this.W / 2, 58);

            // Stats Bar (FOUND, TIME, SCORE)
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffffff';

            const mins = String(Math.floor(this.elapsedSeconds / 60)).padStart(2, '0');
            const secs = String(this.elapsedSeconds % 60).padStart(2, '0');

            ctx.textAlign = 'left';
            ctx.fillText(`WORDS: ${this.foundWordsCount}/${this.targetWords.length}`, OFFSET_X, 86);

            ctx.textAlign = 'center';
            ctx.fillText(`TIME: ${mins}:${secs}`, this.W / 2, 86);

            ctx.textAlign = 'right';
            ctx.fillText(`SCORE: ${this.score}`, OFFSET_X + GRID_PX, 86);

            // Active formed word preview banner
            if (this.isDragging && this.formedWord) {
                ctx.save();
                ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 1.5;
                ctx.roundRect(OFFSET_X, 94, GRID_PX, 18, 4);
                ctx.fill();
                ctx.stroke();

                ctx.font = '9px "Press Start 2P", monospace';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(`SELECTING: ${this.formedWord.split('').join(' ')}`, this.W / 2, 107);
                ctx.restore();
            }
        }

        _drawGrid(ctx) {
            // Main grid board container
            ctx.save();
            ctx.fillStyle = '#0e1124';
            ctx.fillRect(OFFSET_X, OFFSET_Y, GRID_PX, GRID_PX);

            // Outer neon border
            ctx.strokeStyle = '#1e244d';
            ctx.lineWidth = 3;
            ctx.strokeRect(OFFSET_X - 1.5, OFFSET_Y - 1.5, GRID_PX + 3, GRID_PX + 3);

            // Inner cell squares
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    const cx = OFFSET_X + c * CELL_PX;
                    const cy = OFFSET_Y + r * CELL_PX;

                    ctx.fillStyle = (r + c) % 2 === 0 ? '#11142c' : '#141835';
                    ctx.fillRect(cx + 1, cy + 1, CELL_PX - 2, CELL_PX - 2);

                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(cx + 0.5, cy + 0.5, CELL_PX - 1, CELL_PX - 1);
                }
            }
            ctx.restore();
        }

        _drawFoundHighlights(ctx) {
            this.targetWords.forEach(w => {
                if (w.found && w.foundCells && w.foundCells.length >= 2) {
                    const first = w.foundCells[0];
                    const last = w.foundCells[w.foundCells.length - 1];

                    const x1 = OFFSET_X + first.c * CELL_PX + CELL_PX / 2;
                    const y1 = OFFSET_Y + first.r * CELL_PX + CELL_PX / 2;
                    const x2 = OFFSET_X + last.c * CELL_PX + CELL_PX / 2;
                    const y2 = OFFSET_Y + last.r * CELL_PX + CELL_PX / 2;

                    ctx.save();
                    ctx.lineCap = 'round';

                    // Glow outer stroke
                    ctx.strokeStyle = w.color.glow;
                    ctx.lineWidth = CELL_PX * 0.88;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();

                    // Crisp neon capsule
                    ctx.strokeStyle = w.color.main;
                    ctx.lineWidth = CELL_PX * 0.74;
                    ctx.globalAlpha = 0.45;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();

                    // Bright inner line
                    ctx.globalAlpha = 0.9;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();

                    ctx.restore();
                }
            });
        }

        _drawActiveDragSelection(ctx) {
            if (!this.isDragging || !this.startCell || !this.currentCell) return;

            const x1 = OFFSET_X + this.startCell.c * CELL_PX + CELL_PX / 2;
            const y1 = OFFSET_Y + this.startCell.r * CELL_PX + CELL_PX / 2;
            const x2 = OFFSET_X + this.currentCell.c * CELL_PX + CELL_PX / 2;
            const y2 = OFFSET_Y + this.currentCell.r * CELL_PX + CELL_PX / 2;

            ctx.save();
            ctx.lineCap = 'round';

            // Pulsing live selection capsule
            const pulse = Math.sin(Date.now() * 0.01) * 2 + 1;

            ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
            ctx.lineWidth = CELL_PX * 0.85 + pulse;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = CELL_PX * 0.7;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.restore();
        }

        _drawLetters(ctx) {
            ctx.save();
            ctx.font = '16px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    const cx = OFFSET_X + c * CELL_PX + CELL_PX / 2;
                    const cy = OFFSET_Y + r * CELL_PX + CELL_PX / 2 + 1;
                    const letter = this.grid[r][c];

                    // Check if cell is in active selection
                    const isSelected = this.selectedCells.some(cell => cell.r === r && cell.c === c);

                    if (isSelected) {
                        ctx.fillStyle = '#ffffff';
                        ctx.shadowColor = '#00f0ff';
                        ctx.shadowBlur = 6;
                    } else {
                        ctx.fillStyle = '#d0d8f0';
                        ctx.shadowBlur = 0;
                    }

                    ctx.fillText(letter, cx, cy);
                }
            }
            ctx.restore();
        }

        _drawHintMarker(ctx) {
            if (!this.activeHint) return;

            const cx = OFFSET_X + this.activeHint.c * CELL_PX + CELL_PX / 2;
            const cy = OFFSET_Y + this.activeHint.r * CELL_PX + CELL_PX / 2;

            const pulse = (Date.now() * 0.005) % (Math.PI * 2);
            const radius = (CELL_PX / 2 - 2) + Math.sin(pulse) * 4;

            ctx.save();
            ctx.strokeStyle = '#ffea00';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Hint pointer arrow
            ctx.fillStyle = '#ffea00';
            ctx.beginPath();
            ctx.moveTo(cx, cy - radius - 8);
            ctx.lineTo(cx - 5, cy - radius - 16);
            ctx.lineTo(cx + 5, cy - radius - 16);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        _drawWordBank(ctx) {
            const startY = OFFSET_Y + GRID_PX + 16;
            const cardW = 125;
            const cardH = 26;
            const gapX = 14;
            const gapY = 8;
            const cols = 4;

            ctx.save();
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            this.targetWords.forEach((w, idx) => {
                const col = idx % cols;
                const row = Math.floor(idx / cols);

                const totalRowW = cols * cardW + (cols - 1) * gapX;
                const rowStartX = (this.W - totalRowW) / 2;

                const cardX = rowStartX + col * (cardW + gapX);
                const cardY = startY + row * (cardH + gapY);

                if (w.found) {
                    // Completed word pill with color accent & checkmark
                    ctx.fillStyle = 'rgba(20, 24, 46, 0.85)';
                    ctx.roundRect(cardX, cardY, cardW, cardH, 4);
                    ctx.fill();

                    ctx.strokeStyle = w.color.main;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Text
                    ctx.fillStyle = w.color.main;
                    ctx.fillText(`✓ ${w.word}`, cardX + cardW / 2, cardY + cardH / 2);

                    // Strikethrough line
                    ctx.strokeStyle = w.color.main;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(cardX + 16, cardY + cardH / 2);
                    ctx.lineTo(cardX + cardW - 12, cardY + cardH / 2);
                    ctx.stroke();
                } else {
                    // Unfound word pill
                    ctx.fillStyle = '#141833';
                    ctx.roundRect(cardX, cardY, cardW, cardH, 4);
                    ctx.fill();

                    ctx.strokeStyle = '#28305c';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.fillStyle = '#8e9ac2';
                    ctx.fillText(w.word, cardX + cardW / 2, cardY + cardH / 2);
                }
            });

            ctx.restore();
        }

        _drawVictoryScreen(ctx) {
            // Dark glowing overlay
            ctx.save();
            ctx.fillStyle = 'rgba(8, 9, 22, 0.88)';
            ctx.fillRect(0, 0, this.W, this.H);

            const cx = this.W / 2;

            // Victory banner
            ctx.textAlign = 'center';
            ctx.font = '20px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffea00';
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 15;
            ctx.fillText('PUZZLE SOLVED!', cx, 230);
            ctx.shadowBlur = 0;

            // Stars rating (★★★)
            let stars = '★★★';
            if (this.elapsedSeconds > 180 || this.hintsLeft === 0) stars = '★★☆';
            if (this.elapsedSeconds > 300) stars = '★☆☆';

            ctx.font = '28px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffd700';
            ctx.fillText(stars, cx, 290);

            // Stats summary card
            ctx.fillStyle = '#141838';
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.roundRect(cx - 150, 330, 300, 180, 8);
            ctx.fill();
            ctx.stroke();

            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffffff';

            const mins = String(Math.floor(this.elapsedSeconds / 60)).padStart(2, '0');
            const secs = String(this.elapsedSeconds % 60).padStart(2, '0');

            ctx.fillText(`WORDS FOUND: ${this.targetWords.length}/${this.targetWords.length}`, cx, 370);
            ctx.fillText(`COMPLETION TIME: ${mins}:${secs}`, cx, 410);
            ctx.fillText(`FINAL SCORE: ${this.score}`, cx, 450);

            // Next Puzzle Button
            const btnX = cx - 120;
            const btnY = 560;
            const btnW = 240;
            const btnH = 50;

            const pulse = Math.sin(Date.now() * 0.008) * 0.15 + 0.85;
            ctx.fillStyle = '#00e676';
            ctx.globalAlpha = pulse;
            ctx.roundRect(btnX, btnY, btnW, btnH, 8);
            ctx.fill();

            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = '11px "Press Start 2P", monospace';
            ctx.fillStyle = '#060710';
            ctx.fillText('▶ NEXT PUZZLE ◀', cx, btnY + 30);

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
        const game = new WordSearchGame();
        game.run();
    });

})();

