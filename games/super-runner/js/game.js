/* ============================================
   SUPER RUNNER — Complete Platformer Game Engine
   A Mario-like game built with HTML5 Canvas
   ============================================ */

(function() {
    'use strict';

    // ============================
    // CONSTANTS & CONFIG
    // ============================
    const TILE = 32;
    const GRAVITY = 0.46;
    const MAX_FALL = 11;
    const PLAYER_SPEED = 3.6;
    const PLAYER_JUMP = -12.5;
    const FRICTION = 0.82;
    const CAMERA_SMOOTH = 0.1;
    const FPS = 60;
    const INVINCIBLE_TIME = 90; // frames

    // Game states
    const STATE = {
        TITLE: 'title',
        LEVEL_SELECT: 'levelSelect',
        PLAYING: 'playing',
        PAUSED: 'paused',
        LEVEL_COMPLETE: 'levelComplete',
        GAME_OVER: 'gameOver',
        TRANSITION: 'transition'
    };

    // Tile types
    const T = {
        AIR: 0,
        GRASS: 1,
        DIRT: 2,
        BRICK: 3,
        QBLOCK: 4,
        QBLOCK_USED: 5,
        STONE: 6,
        PIPE_TL: 7,
        PIPE_TR: 8,
        PIPE_BL: 9,
        PIPE_BR: 10,
        LAVA_TOP: 11,
        LAVA: 12,
        BRIDGE: 13,
        CASTLE_BLOCK: 14,
        DARK_BRICK: 15,
        ICE: 16,
        CLOUD_PLAT: 17,
        SPIKE_TILE: 18,
    };

    // Color themes per level
    const THEMES = {
        overworld: {
            skyTop: '#5599ff', skyBot: '#aaddff',
            groundTop: '#44aa44', groundFill: '#8B5E3C',
            brickColor: '#cc6633', brickDark: '#994422',
            stoneColor: '#888888', stoneDark: '#666666',
        },
        underground: {
            skyTop: '#111122', skyBot: '#1a1a2e',
            groundTop: '#555555', groundFill: '#333333',
            brickColor: '#666688', brickDark: '#444466',
            stoneColor: '#555577', stoneDark: '#333355',
        },
        sky: {
            skyTop: '#88ccff', skyBot: '#ddeeff',
            groundTop: '#ffffff', groundFill: '#ccddee',
            brickColor: '#aabbcc', brickDark: '#8899aa',
            stoneColor: '#bbccdd', stoneDark: '#99aabb',
        },
        castle: {
            skyTop: '#1a0a0a', skyBot: '#2a1515',
            groundTop: '#555544', groundFill: '#3a3a2e',
            brickColor: '#554433', brickDark: '#332211',
            stoneColor: '#666655', stoneDark: '#444433',
        },
        night: {
            skyTop: '#0a0a2e', skyBot: '#151540',
            groundTop: '#336633', groundFill: '#664433',
            brickColor: '#aa5533', brickDark: '#883322',
            stoneColor: '#777777', stoneDark: '#555555',
        }
    };


    // ============================
    // SPRITE DATA (Pixel Art)
    // ============================
    // Sprites defined as 2D arrays: each sub-array is a row,
    // each number is a palette index. 0 = transparent.
    const PAL = {
        0: null,           // transparent
        1: '#4488ff',      // blue (hat)
        2: '#3366cc',      // dark blue
        3: '#FFD39B',      // skin
        4: '#DEB078',      // skin shadow
        5: '#ff4444',      // red (shirt)
        6: '#cc2222',      // dark red
        7: '#3344aa',      // blue (pants)
        8: '#222266',      // dark pants
        9: '#222222',      // black
        10: '#ffffff',     // white
        11: '#FFD700',     // gold
        12: '#FFA500',     // orange
        13: '#44cc44',     // green
        14: '#228822',     // dark green
        15: '#8B5E3C',     // brown
        16: '#FFB800',     // q-block yellow
        17: '#CC8800',     // q-block dark
        18: '#ff88aa',     // pink
        19: '#cc6688',     // dark pink
        20: '#aaaaaa',     // gray
        21: '#888888',     // dark gray
        22: '#ff6644',     // fire
        23: '#ffaa22',     // fire light
    };

    // Player idle - 14w x 16h
    const SPR_PLAYER_IDLE = [
        [0,0,0,0,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,2,2,2,3,3,2,0,0,0,0,0],
        [0,0,2,3,2,3,3,3,3,2,0,0,0,0],
        [0,0,2,3,2,2,3,3,4,3,2,0,0,0],
        [0,0,0,3,3,3,3,4,0,0,0,0,0,0],
        [0,0,0,0,5,5,5,5,5,0,0,0,0,0],
        [0,0,0,5,5,5,5,5,5,5,0,0,0,0],
        [0,0,5,5,5,5,5,5,5,5,5,0,0,0],
        [0,0,3,3,5,5,5,5,5,3,3,0,0,0],
        [0,0,3,3,5,5,5,5,5,3,3,0,0,0],
        [0,0,0,0,7,7,7,7,7,0,0,0,0,0],
        [0,0,0,7,7,7,0,7,7,7,0,0,0,0],
        [0,0,7,7,7,0,0,0,7,7,7,0,0,0],
        [0,0,8,8,8,0,0,0,8,8,8,0,0,0],
    ];

    // Player run frame 1
    const SPR_PLAYER_RUN1 = [
        [0,0,0,0,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,2,2,2,3,3,2,0,0,0,0,0],
        [0,0,2,3,2,3,3,3,3,2,0,0,0,0],
        [0,0,2,3,2,2,3,3,4,3,2,0,0,0],
        [0,0,0,3,3,3,3,4,0,0,0,0,0,0],
        [0,0,0,0,5,5,5,5,5,0,0,0,0,0],
        [0,0,0,5,5,5,5,5,5,5,0,0,0,0],
        [0,0,5,5,5,5,5,5,5,5,5,0,0,0],
        [0,0,3,3,5,5,5,5,5,3,3,0,0,0],
        [0,0,0,0,5,5,5,5,5,0,0,0,0,0],
        [0,0,0,0,7,7,0,7,7,0,0,0,0,0],
        [0,0,0,0,7,7,0,0,7,7,0,0,0,0],
        [0,0,0,7,7,0,0,0,0,8,8,0,0,0],
        [0,0,0,8,8,0,0,0,0,0,0,0,0,0],
    ];

    // Player run frame 2
    const SPR_PLAYER_RUN2 = [
        [0,0,0,0,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,2,2,2,3,3,2,0,0,0,0,0],
        [0,0,2,3,2,3,3,3,3,2,0,0,0,0],
        [0,0,2,3,2,2,3,3,4,3,2,0,0,0],
        [0,0,0,3,3,3,3,4,0,0,0,0,0,0],
        [0,0,0,5,5,5,5,5,0,0,0,0,0,0],
        [0,0,5,5,5,5,5,5,5,0,0,0,0,0],
        [0,0,5,5,5,5,5,5,5,5,0,0,0,0],
        [0,0,3,5,5,5,5,5,5,3,0,0,0,0],
        [0,0,0,5,5,5,5,5,5,0,0,0,0,0],
        [0,0,0,0,7,7,7,7,0,0,0,0,0,0],
        [0,0,0,8,8,0,7,7,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,8,8,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];

    // Player jump
    const SPR_PLAYER_JUMP = [
        [0,0,0,0,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,2,2,2,3,3,2,0,0,0,0,0],
        [0,0,2,3,2,3,3,3,3,2,0,0,0,0],
        [0,0,2,3,2,2,3,3,4,3,2,0,0,0],
        [0,0,0,3,3,3,3,4,0,0,0,0,0,0],
        [0,0,3,0,5,5,5,5,5,0,3,0,0,0],
        [0,3,3,5,5,5,5,5,5,5,3,3,0,0],
        [0,0,3,5,5,5,5,5,5,5,3,0,0,0],
        [0,0,0,5,5,5,5,5,5,5,0,0,0,0],
        [0,0,0,0,5,5,5,5,5,0,0,0,0,0],
        [0,0,0,7,7,0,0,0,7,7,0,0,0,0],
        [0,0,7,7,0,0,0,0,0,7,7,0,0,0],
        [0,8,8,0,0,0,0,0,0,0,8,8,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];

    // Player dead
    const SPR_PLAYER_DEAD = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,2,2,2,3,3,2,0,0,0,0,0],
        [0,0,2,3,9,3,3,9,3,2,0,0,0,0],
        [0,0,2,3,3,3,3,3,3,3,2,0,0,0],
        [0,0,0,3,3,9,9,9,3,0,0,0,0,0],
        [0,3,0,0,5,5,5,5,5,0,0,3,0,0],
        [0,0,3,5,5,5,5,5,5,5,3,0,0,0],
        [0,0,0,5,5,5,5,5,5,5,0,0,0,0],
        [0,0,0,0,5,5,5,5,5,0,0,0,0,0],
        [0,0,0,0,7,7,7,7,7,0,0,0,0,0],
        [0,0,0,7,7,0,0,0,7,7,0,0,0,0],
        [0,0,8,8,0,0,0,0,0,8,8,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];

    // Slime enemy - 14w x 12h
    const SPR_SLIME1 = [
        [0,0,0,0,0,13,13,13,0,0,0,0,0,0],
        [0,0,0,0,13,13,13,13,13,0,0,0,0,0],
        [0,0,0,13,13,13,13,13,13,13,0,0,0,0],
        [0,0,13,13,13,13,13,13,13,13,13,0,0,0],
        [0,13,10,10,13,13,13,10,10,13,13,0,0,0],
        [0,13,9,10,13,13,13,9,10,13,13,13,0,0],
        [13,13,13,13,13,13,13,13,13,13,13,13,0,0],
        [13,13,13,13,13,14,14,13,13,13,13,13,0,0],
        [13,13,13,13,13,13,13,13,13,13,13,13,0,0],
        [0,13,13,13,13,13,13,13,13,13,13,0,0,0],
        [0,0,14,14,14,14,14,14,14,14,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];

    const SPR_SLIME2 = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,13,13,13,0,0,0,0,0,0],
        [0,0,0,0,13,13,13,13,13,0,0,0,0,0],
        [0,0,0,13,13,13,13,13,13,13,0,0,0,0],
        [0,0,13,10,10,13,13,10,10,13,13,0,0,0],
        [0,0,13,9,10,13,13,9,10,13,13,0,0,0],
        [0,13,13,13,13,13,13,13,13,13,13,13,0,0],
        [0,13,13,13,13,14,14,13,13,13,13,13,0,0],
        [13,13,13,13,13,13,13,13,13,13,13,13,13,0],
        [13,13,13,13,13,13,13,13,13,13,13,13,13,0],
        [0,14,14,14,14,14,14,14,14,14,14,14,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];

    // Spike enemy - 14w x 14h
    const SPR_SPIKE = [
        [0,0,0,0,0,0,9,9,0,0,0,0,0,0],
        [0,0,0,9,0,0,9,9,0,0,9,0,0,0],
        [0,0,0,9,9,0,9,9,0,9,9,0,0,0],
        [0,0,0,9,9,9,20,20,9,9,9,0,0,0],
        [0,0,9,20,20,20,20,20,20,20,9,0,0,0],
        [0,9,20,20,10,10,20,10,10,20,20,9,0,0],
        [0,9,20,20,9,10,20,9,10,20,20,9,0,0],
        [9,20,20,20,20,20,20,20,20,20,20,20,9,0],
        [9,20,20,20,20,20,20,20,20,20,20,20,9,0],
        [0,9,20,20,20,9,9,9,20,20,20,9,0,0],
        [0,0,9,20,20,20,20,20,20,20,9,0,0,0],
        [0,0,0,9,9,20,20,20,9,9,0,0,0,0],
        [0,0,0,9,0,9,9,9,0,9,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];

    // Flying enemy (bat) - 16w x 12h
    const SPR_BAT1 = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,9,0,0,0,0,0,0,0,0,0,0,0,9,0,0],
        [9,9,9,0,0,0,0,0,0,0,0,0,9,9,9,0],
        [0,9,9,9,0,0,0,0,0,0,0,9,9,9,0,0],
        [0,0,9,9,9,9,9,9,9,9,9,9,9,0,0,0],
        [0,0,0,9,9,10,9,9,9,10,9,9,0,0,0,0],
        [0,0,0,9,9,9,9,9,9,9,9,9,0,0,0,0],
        [0,0,0,0,9,9,9,9,9,9,9,0,0,0,0,0],
        [0,0,0,0,0,9,9,9,9,9,0,0,0,0,0,0],
        [0,0,0,0,0,0,9,0,9,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];

    const SPR_BAT2 = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,9,0,0,0,0,0,0,0,0,0,9,0,0,0],
        [0,0,9,9,9,9,9,9,9,9,9,9,9,0,0,0],
        [0,0,9,9,9,10,9,9,9,10,9,9,9,0,0,0],
        [0,0,9,9,9,9,9,9,9,9,9,9,9,0,0,0],
        [0,0,0,9,9,9,9,9,9,9,9,9,0,0,0,0],
        [0,0,0,0,9,9,9,9,9,9,9,0,0,0,0,0],
        [0,9,9,0,0,0,9,0,9,0,0,0,9,9,0,0],
        [9,9,0,0,0,0,0,0,0,0,0,0,0,9,9,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];


    // ============================
    // SPRITE CACHE
    // ============================
    const spriteCache = {};

    function renderSprite(data) {
        const key = data;
        if (spriteCache[key]) return spriteCache[key];

        const h = data.length;
        const w = data[0].length;
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const cx = c.getContext('2d');

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = data[y][x];
                if (idx === 0) continue;
                cx.fillStyle = PAL[idx];
                cx.fillRect(x, y, 1, 1);
            }
        }
        spriteCache[key] = c;
        return c;
    }

    // Flip sprite horizontally (cached)
    const flipCache = new Map();
    function flipSprite(spriteCanvas) {
        if (flipCache.has(spriteCanvas)) return flipCache.get(spriteCanvas);
        const c = document.createElement('canvas');
        c.width = spriteCanvas.width;
        c.height = spriteCanvas.height;
        const cx = c.getContext('2d');
        cx.translate(c.width, 0);
        cx.scale(-1, 1);
        cx.drawImage(spriteCanvas, 0, 0);
        flipCache.set(spriteCanvas, c);
        return c;
    }


    // ============================
    // SOUND ENGINE (Web Audio API)
    // ============================
    const Sound = {
        ctx: null,
        enabled: true,

        init() {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch(e) {
                this.enabled = false;
            }
        },

        play(type) {
            if (!this.enabled || !this.ctx) return;
            if (this.ctx.state === 'suspended') this.ctx.resume();

            switch(type) {
                case 'jump': this._tone(600, 0.1, 'square', 0.15); break;
                case 'coin': this._coin(); break;
                case 'stomp': this._tone(200, 0.15, 'square', 0.2); break;
                case 'hurt': this._tone(150, 0.3, 'sawtooth', 0.2); break;
                case 'die': this._die(); break;
                case 'powerup': this._powerup(); break;
                case 'flag': this._flag(); break;
                case 'bump': this._tone(100, 0.08, 'square', 0.15); break;
                case 'break': this._tone(80, 0.12, 'noise', 0.2); break;
                case 'pause': this._tone(400, 0.05, 'square', 0.1); break;
                case 'select': this._tone(500, 0.05, 'square', 0.1); break;
            }
        },

        _tone(freq, duration, type, vol) {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type === 'noise' ? 'sawtooth' : type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + duration);
        },

        _coin() {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(988, t);
            osc.frequency.setValueAtTime(1319, t + 0.07);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.2);
        },

        _die() {
            const t = this.ctx.currentTime;
            for (let i = 0; i < 6; i++) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = 400 - i * 60;
                gain.gain.setValueAtTime(0.15, t + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.08);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t + i * 0.08);
                osc.stop(t + i * 0.08 + 0.1);
            }
        },

        _powerup() {
            const notes = [523, 659, 784, 1047];
            const t = this.ctx.currentTime;
            notes.forEach((f, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = f;
                gain.gain.setValueAtTime(0.12, t + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.12);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t + i * 0.08);
                osc.stop(t + i * 0.08 + 0.15);
            });
        },

        _flag() {
            const notes = [523, 659, 784, 1047, 1319, 1568];
            const t = this.ctx.currentTime;
            notes.forEach((f, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = f;
                gain.gain.setValueAtTime(0.12, t + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.15);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t + i * 0.1);
                osc.stop(t + i * 0.1 + 0.2);
            });
        }
    };


    // ============================
    // INPUT HANDLER
    // ============================
    const Input = {
        keys: {},
        justPressed: {},

        init() {
            window.addEventListener('keydown', (e) => {
                if (!this.keys[e.code]) this.justPressed[e.code] = true;
                this.keys[e.code] = true;
                // Prevent scrolling with arrow keys / space
                if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
                    e.preventDefault();
                }
            });
            window.addEventListener('keyup', (e) => {
                this.keys[e.code] = false;
            });

            // Mobile controls
            this._initMobile();
        },

        _initMobile() {
            const btnLeft = document.getElementById('btn-left');
            const btnRight = document.getElementById('btn-right');
            const btnJump = document.getElementById('btn-jump');

            if (!btnLeft) return;

            const addEvents = (el, code) => {
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

            addEvents(btnLeft, 'ArrowLeft');
            addEvents(btnRight, 'ArrowRight');
            addEvents(btnJump, 'Space');
        },

        isDown(code) {
            return !!this.keys[code];
        },

        wasPressed(code) {
            return !!this.justPressed[code];
        },

        left() { return this.isDown('ArrowLeft') || this.isDown('KeyA'); },
        right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); },
        jump() { return this.wasPressed('Space') || this.wasPressed('ArrowUp') || this.wasPressed('KeyW'); },
        jumpHeld() { return this.isDown('Space') || this.isDown('ArrowUp') || this.isDown('KeyW'); },
        enter() { return this.wasPressed('Enter') || this.wasPressed('Space'); },
        escape() { return this.wasPressed('Escape') || this.wasPressed('KeyP'); },

        clearJustPressed() {
            this.justPressed = {};
        }
    };


    // ============================
    // PARTICLE SYSTEM
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
            this.vy += 0.15;
            this.life--;
        }
        draw(ctx, camX, camY) {
            const alpha = this.life / this.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - camX, this.y - camY, this.size, this.size);
            ctx.globalAlpha = 1;
        }
    }

    const particles = [];

    function spawnParticles(x, y, color, count, spread) {
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(
                x, y,
                (Math.random() - 0.5) * spread,
                -Math.random() * spread * 0.8,
                color,
                20 + Math.random() * 20,
                2 + Math.random() * 3
            ));
        }
    }

    function spawnCoinParticles(x, y) {
        const colors = ['#FFD700', '#FFA500', '#FFFF00', '#FFF4AA'];
        for (let i = 0; i < 8; i++) {
            particles.push(new Particle(
                x, y,
                (Math.random() - 0.5) * 4,
                -Math.random() * 5 - 2,
                colors[Math.floor(Math.random() * colors.length)],
                25 + Math.random() * 15,
                2 + Math.random() * 2
            ));
        }
    }

    function spawnBrickParticles(x, y) {
        const colors = ['#cc6633', '#994422', '#aa5533', '#663311'];
        for (let i = 0; i < 12; i++) {
            particles.push(new Particle(
                x, y,
                (Math.random() - 0.5) * 6,
                -Math.random() * 7 - 1,
                colors[Math.floor(Math.random() * colors.length)],
                30 + Math.random() * 20,
                3 + Math.random() * 4
            ));
        }
    }


    // ============================
    // PLAYER
    // ============================
    class Player {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.prevY = y;
            this.w = 12 * 2; // sprite width scaled
            this.h = 16 * 2; // sprite height scaled
            this.vx = 0;
            this.vy = 0;
            this.onGround = false;
            this.facingRight = true;
            this.lives = 3;
            this.score = 0;
            this.coins = 0;
            this.dead = false;
            this.invincible = 0;
            this.animFrame = 0;
            this.animTimer = 0;
            this.deathTimer = 0;
            this.big = false;

            // Responsive jump controls
            this.coyoteTimer = 0;
            this.jumpBuffer = 0;
            this.jumpHoldTimer = 0;
        }

        triggerJump() {
            this.jumpBuffer = 8;
            this.jumpHoldTimer = 16;
        }

        update(level) {
            if (this.dead) {
                this.deathTimer++;
                if (this.deathTimer < 20) {
                    this.vy = -5;
                } else {
                    this.vy += GRAVITY;
                }
                this.y += this.vy;
                return;
            }

            if (this.invincible > 0) this.invincible--;

            // Store previous vertical position for one-way platform checks
            this.prevY = this.y;

            // Update timers
            if (this.onGround) {
                this.coyoteTimer = 6;
            } else if (this.coyoteTimer > 0) {
                this.coyoteTimer--;
            }

            if (this.jumpBuffer > 0) this.jumpBuffer--;
            if (this.jumpHoldTimer > 0) this.jumpHoldTimer--;

            // Horizontal movement
            if (Input.left()) {
                this.vx -= PLAYER_SPEED * 0.45;
                this.facingRight = false;
            }
            if (Input.right()) {
                this.vx += PLAYER_SPEED * 0.45;
                this.facingRight = true;
            }

            // Apply friction
            this.vx *= FRICTION;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;

            // Clamp speed
            this.vx = Math.max(-PLAYER_SPEED, Math.min(PLAYER_SPEED, this.vx));

            // Jump check (keyboard press or buffered click/touch + coyote time)
            const canJump = this.onGround || this.coyoteTimer > 0;
            const wantsJump = Input.jump() || this.jumpBuffer > 0;

            if (wantsJump && canJump) {
                this.vy = PLAYER_JUMP;
                this.onGround = false;
                this.coyoteTimer = 0;
                this.jumpBuffer = 0;
                Sound.play('jump');
            }

            // Variable jump: smooth reduction when released early
            const isHoldingJump = Input.jumpHeld() || this.jumpHoldTimer > 0;
            if (!isHoldingJump && this.vy < -4) {
                this.vy *= 0.86;
            }

            // Gravity
            this.vy += GRAVITY;
            if (this.vy > MAX_FALL) this.vy = MAX_FALL;

            // Move X with collision
            this.x += this.vx;
            this._collideX(level);

            // Move Y with collision
            this.y += this.vy;
            this.onGround = false;
            this._collideY(level);

            // Fall off screen = death
            if (this.y > level.height * TILE + 100) {
                if (!this.dead) {
                    this.die();
                }
            }

            // Don't go left of level start
            if (this.x < 0) this.x = 0;

            // Animation
            this.animTimer++;
            if (this.animTimer > 6) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 3;
            }
        }

        _isSolid(tile) {
            return tile !== T.AIR && tile !== T.LAVA_TOP && tile !== T.LAVA &&
                   tile !== T.SPIKE_TILE && tile !== T.CLOUD_PLAT && tile !== T.BRIDGE &&
                   tile !== undefined;
        }

        _isOneWay(tile) {
            return tile === T.CLOUD_PLAT || tile === T.BRIDGE;
        }

        _collideX(level) {
            // Check tiles with top/bottom margin for smooth step-up onto platforms
            const top = Math.floor((this.y + 4) / TILE);
            const bot = Math.floor((this.y + this.h - 8) / TILE);

            if (this.vx > 0) {
                const col = Math.floor((this.x + this.w) / TILE);
                for (let row = top; row <= bot; row++) {
                    const tile = level.getTile(col, row);
                    if (this._isSolid(tile)) {
                        this.x = col * TILE - this.w;
                        this.vx = 0;
                        break;
                    }
                }
            } else if (this.vx < 0) {
                const col = Math.floor(this.x / TILE);
                for (let row = top; row <= bot; row++) {
                    const tile = level.getTile(col, row);
                    if (this._isSolid(tile)) {
                        this.x = (col + 1) * TILE;
                        this.vx = 0;
                        break;
                    }
                }
            }
        }

        _collideY(level) {
            const left = Math.floor((this.x + 4) / TILE);
            const right = Math.floor((this.x + this.w - 4) / TILE);

            if (this.vy > 0) {
                // Falling - check below
                const row = Math.floor((this.y + this.h) / TILE);
                for (let col = left; col <= right; col++) {
                    const tile = level.getTile(col, row);
                    if (this._isSolid(tile)) {
                        this.y = row * TILE - this.h;
                        this.vy = 0;
                        this.onGround = true;
                        break;
                    } else if (this._isOneWay(tile)) {
                        // Land on one-way platform if feet came from above
                        if (this.prevY + this.h <= row * TILE + 8) {
                            this.y = row * TILE - this.h;
                            this.vy = 0;
                            this.onGround = true;
                            break;
                        }
                    }
                }
            } else if (this.vy < 0) {
                // Jumping - check above (only solid blocks bonk, one-way pass through)
                const row = Math.floor(this.y / TILE);
                for (let col = left; col <= right; col++) {
                    const tile = level.getTile(col, row);
                    if (this._isSolid(tile)) {
                        this.y = (row + 1) * TILE;
                        this.vy = 0;
                        // Hit a question block?
                        level.hitBlock(col, row);
                        break;
                    }
                }
            }
        }

        hurt() {
            if (this.invincible > 0 || this.dead) return;
            if (this.lives <= 1) {
                this.die();
            } else {
                Sound.play('hurt');
                this.lives--;
                this.invincible = INVINCIBLE_TIME;
                this.vy = -6;
                this.vx = this.facingRight ? -3 : 3;
            }
        }

        die() {
            if (this.dead) return;
            this.dead = true;
            this.lives = Math.max(0, this.lives - 1);
            this.vy = -8;
            this.vx = 0;
            this.deathTimer = 0;
            Sound.play('die');
        }

        draw(ctx, camX, camY) {
            // Blink when invincible
            if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;

            let sprite;
            if (this.dead) {
                sprite = renderSprite(SPR_PLAYER_DEAD);
            } else if (!this.onGround) {
                sprite = renderSprite(SPR_PLAYER_JUMP);
            } else if (Math.abs(this.vx) > 0.5) {
                const frames = [SPR_PLAYER_RUN1, SPR_PLAYER_IDLE, SPR_PLAYER_RUN2, SPR_PLAYER_IDLE];
                sprite = renderSprite(frames[this.animFrame % frames.length]);
            } else {
                sprite = renderSprite(SPR_PLAYER_IDLE);
            }

            if (!this.facingRight) {
                sprite = flipSprite(sprite);
            }

            const drawX = Math.round(this.x - camX) - 2;
            const drawY = Math.round(this.y - camY);

            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(sprite, drawX, drawY, this.w + 4, this.h);
        }
    }


    // ============================
    // ENEMIES
    // ============================
    class Enemy {
        constructor(x, y, type) {
            this.x = x * TILE;
            this.y = y * TILE;
            this.type = type;
            this.w = TILE - 4;
            this.h = TILE - 4;
            this.vx = -1;
            this.vy = 0;
            this.alive = true;
            this.dying = false;
            this.dyingTimer = 0;
            this.animFrame = 0;
            this.animTimer = 0;
            this.startY = this.y;
            this.active = false;
        }

        update(level, camX, canvasW) {
            // Only activate when near camera
            if (!this.active) {
                if (this.x < camX + canvasW + 100) {
                    this.active = true;
                }
                return;
            }

            if (this.dying) {
                this.dyingTimer++;
                this.y += 3;
                if (this.dyingTimer > 30) this.alive = false;
                return;
            }

            if (!this.alive) return;

            // Animation
            this.animTimer++;
            if (this.animTimer > 10) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 2;
            }

            if (this.type === 'bat') {
                // Flying sine wave
                this.x += this.vx;
                this.y = this.startY + Math.sin(this.animTimer * 0.15 + this.x * 0.02) * 30;
            } else {
                // Walking enemy
                this.x += this.vx;
                this.vy += GRAVITY;
                if (this.vy > MAX_FALL) this.vy = MAX_FALL;
                this.y += this.vy;

                // Tile collision
                this._collide(level);
            }

            // Remove if fallen off
            if (this.y > level.height * TILE + 100) {
                this.alive = false;
            }
        }

        _collide(level) {
            // Ground collision
            const row = Math.floor((this.y + this.h) / TILE);
            const col = Math.floor((this.x + this.w / 2) / TILE);
            const tile = level.getTile(col, row);
            if (tile && tile !== T.AIR && tile !== T.LAVA && tile !== T.LAVA_TOP && tile !== T.SPIKE_TILE) {
                this.y = row * TILE - this.h;
                this.vy = 0;
            }

            // Wall collision - turn around
            const checkCol = this.vx > 0
                ? Math.floor((this.x + this.w + 2) / TILE)
                : Math.floor((this.x - 2) / TILE);
            const midRow = Math.floor((this.y + this.h / 2) / TILE);
            const wallTile = level.getTile(checkCol, midRow);
            if (wallTile && wallTile !== T.AIR && wallTile !== T.LAVA && wallTile !== T.LAVA_TOP) {
                this.vx *= -1;
            }

            // Edge detection - turn around at edges
            const aheadCol = this.vx > 0
                ? Math.floor((this.x + this.w + 2) / TILE)
                : Math.floor((this.x - 2) / TILE);
            const belowTile = level.getTile(aheadCol, row);
            if (this.vy === 0 && (!belowTile || belowTile === T.AIR)) {
                this.vx *= -1;
            }
        }

        stomp() {
            this.dying = true;
            this.dyingTimer = 0;
            Sound.play('stomp');
            spawnParticles(this.x + this.w/2, this.y + this.h/2, '#44cc44', 6, 3);
        }

        draw(ctx, camX, camY) {
            if (!this.alive || !this.active) return;

            let sprite;
            const scale = 2;

            if (this.dying) {
                // Flatten effect
                ctx.globalAlpha = 1 - this.dyingTimer / 30;
                if (this.type === 'slime') {
                    sprite = renderSprite(this.animFrame === 0 ? SPR_SLIME1 : SPR_SLIME2);
                } else {
                    sprite = renderSprite(SPR_SPIKE);
                }
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(sprite, this.x - camX, this.y - camY + this.h * 0.5,
                    sprite.width * scale, sprite.height * scale * 0.3);
                ctx.globalAlpha = 1;
                return;
            }

            if (this.type === 'slime') {
                sprite = renderSprite(this.animFrame === 0 ? SPR_SLIME1 : SPR_SLIME2);
            } else if (this.type === 'spike') {
                sprite = renderSprite(SPR_SPIKE);
            } else if (this.type === 'bat') {
                sprite = renderSprite(this.animFrame === 0 ? SPR_BAT1 : SPR_BAT2);
            }

            if (sprite) {
                if (this.vx > 0) sprite = flipSprite(sprite);
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(sprite,
                    Math.round(this.x - camX), Math.round(this.y - camY),
                    sprite.width * scale, sprite.height * scale);
            }
        }
    }


    // ============================
    // ITEMS (Coins, PowerUps)
    // ============================
    class Coin {
        constructor(x, y) {
            this.x = x * TILE + TILE * 0.25;
            this.y = y * TILE + TILE * 0.15;
            this.w = TILE * 0.5;
            this.h = TILE * 0.7;
            this.collected = false;
            this.bobOffset = Math.random() * Math.PI * 2;
        }

        update(frame) {
            this.drawY = this.y + Math.sin(frame * 0.06 + this.bobOffset) * 3;
        }

        draw(ctx, camX, camY, frame) {
            if (this.collected) return;
            const stretch = Math.abs(Math.cos(frame * 0.08 + this.bobOffset));
            const w = this.w * Math.max(0.3, stretch);
            const x = this.x + (this.w - w) / 2;
            const y = this.drawY || this.y;

            // Coin body
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x - camX, y - camY, w, this.h);

            // Highlight
            ctx.fillStyle = '#FFF4AA';
            ctx.fillRect(x - camX + 2, y - camY + 2, Math.max(1, w * 0.3), this.h - 4);

            // Border
            ctx.fillStyle = '#CC8800';
            ctx.fillRect(x - camX, y - camY, w, 2);
            ctx.fillRect(x - camX, y - camY + this.h - 2, w, 2);
        }

        collect(player) {
            if (this.collected) return;
            this.collected = true;
            player.coins++;
            player.score += 100;
            Sound.play('coin');
            spawnCoinParticles(this.x + this.w/2, this.y + this.h/2);
        }
    }

    // Popup score text
    class PopupText {
        constructor(x, y, text, color) {
            this.x = x; this.y = y;
            this.text = text;
            this.color = color || '#fff';
            this.life = 40;
            this.maxLife = 40;
        }
        update() {
            this.y -= 1;
            this.life--;
        }
        draw(ctx, camX, camY) {
            ctx.globalAlpha = this.life / this.maxLife;
            ctx.fillStyle = this.color;
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x - camX, this.y - camY);
            ctx.globalAlpha = 1;
        }
    }


    // ============================
    // LEVEL DATA & MANAGER
    // ============================
    // Level maps: each char = tile
    // Legend:
    //   . = air
    //   G = grass top
    //   D = dirt
    //   B = brick
    //   ? = question block
    //   S = stone
    //   [ = pipe top-left
    //   ] = pipe top-right
    //   { = pipe body-left
    //   } = pipe body-right
    //   L = lava top
    //   l = lava
    //   ^ = spike tile
    //   ~ = bridge
    //   C = castle block
    //   K = dark brick
    //   I = ice
    //   = = cloud platform
    //
    // Entities placed separately

    const LEVEL_DATA = [
        // ===== LEVEL 1: Green Grasslands =====
        {
            name: "World 1-1",
            subtitle: "Green Grasslands",
            theme: "overworld",
            timeLimit: 300,
            map: [
                '.........................................................................................................',
                '.........................................................................................................',
                '.........................................................................................................',
                '.........................................................................................................',
                '.........................................................................................................',
                '.........................................................................................................',
                '.........................................................................................................',
                '.........................................................................................................',
                '.........................................................................................................',
                '..............?......?B?....................................................................?.............',
                '...............................GGGGG......GGG..........GGGG.............................................',
                '.........................................................................................................',
                '..............................................................................[]....[]...................',
                'GGGGGGGGGGGGGGGGGGGGGGG....GGGGGGGGGGGGGGGGGGG....GGGGG{}GGGGG{}GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
                'DDDDDDDDDDDDDDDDDDDDD....DDDDDDDDDDDDDDDDDDD....DDDDD{}DDDDD{}DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
            ],
            entities: [
                { type: 'player', x: 2, y: 12 },
                { type: 'coin', x: 10, y: 9 },
                { type: 'coin', x: 11, y: 8 },
                { type: 'coin', x: 12, y: 8 },
                { type: 'coin', x: 13, y: 9 },
                { type: 'coin', x: 14, y: 7 },
                { type: 'coin', x: 18, y: 9 },
                { type: 'coin', x: 19, y: 9 },
                { type: 'coin', x: 21, y: 7 },
                { type: 'coin', x: 22, y: 7 },
                { type: 'coin', x: 23, y: 7 },
                { type: 'coin', x: 31, y: 9 },
                { type: 'coin', x: 32, y: 9 },
                { type: 'coin', x: 33, y: 9 },
                { type: 'coin', x: 34, y: 9 },
                { type: 'coin', x: 35, y: 9 },
                { type: 'coin', x: 42, y: 9 },
                { type: 'coin', x: 43, y: 9 },
                { type: 'coin', x: 44, y: 9 },
                { type: 'coin', x: 55, y: 9 },
                { type: 'coin', x: 56, y: 9 },
                { type: 'coin', x: 57, y: 9 },
                { type: 'coin', x: 58, y: 9 },
                { type: 'coin', x: 85, y: 7 },
                { type: 'slime', x: 15, y: 12 },
                { type: 'slime', x: 30, y: 12 },
                { type: 'slime', x: 40, y: 12 },
                { type: 'slime', x: 55, y: 12 },
                { type: 'slime', x: 70, y: 12 },
                { type: 'flag', x: 100, y: 5 },
            ]
        },

        // ===== LEVEL 2: Underground Caverns =====
        {
            name: "World 1-2",
            subtitle: "Underground Caverns",
            theme: "underground",
            timeLimit: 300,
            map: [
                'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
                'S.........................................................................................................S',
                'S.........................................................................................................S',
                'S.........................................................................................................S',
                'S.........................................................................................................S',
                'S...............BBBB.......??.................................................................BB..........S',
                'S.........................................................................................................S',
                'S.........................................................................................................S',
                'S..........................SSSS......SSSS......SSSS...........SSSSS..........SSS...........................S',
                'S.........................................................................................................S',
                'S............SSSSS........................................................................................S',
                'S.........................................................................................................S',
                'S.........................................SSSS............................................................S',
                'SSSSSSSSSSSSSSSSSSSSSSSS....SSSSSSSSSSSSSSSSS....SSSSSSSSSSS....SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
                'SSSSSSSSSSSSSSSSSSSSSSSS....SSSSSSSSSSSSSSSSS....SSSSSSSSSSS....SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
            ],
            entities: [
                { type: 'player', x: 2, y: 12 },
                { type: 'coin', x: 14, y: 9 },
                { type: 'coin', x: 15, y: 9 },
                { type: 'coin', x: 16, y: 9 },
                { type: 'coin', x: 17, y: 4 },
                { type: 'coin', x: 18, y: 4 },
                { type: 'coin', x: 27, y: 7 },
                { type: 'coin', x: 28, y: 7 },
                { type: 'coin', x: 33, y: 7 },
                { type: 'coin', x: 34, y: 7 },
                { type: 'coin', x: 39, y: 7 },
                { type: 'coin', x: 40, y: 7 },
                { type: 'coin', x: 55, y: 7 },
                { type: 'coin', x: 56, y: 7 },
                { type: 'coin', x: 57, y: 7 },
                { type: 'coin', x: 66, y: 7 },
                { type: 'coin', x: 67, y: 7 },
                { type: 'coin', x: 68, y: 7 },
                { type: 'slime', x: 20, y: 12 },
                { type: 'spike', x: 30, y: 12 },
                { type: 'slime', x: 38, y: 12 },
                { type: 'slime', x: 50, y: 12 },
                { type: 'spike', x: 60, y: 12 },
                { type: 'slime', x: 75, y: 12 },
                { type: 'slime', x: 80, y: 12 },
                { type: 'flag', x: 100, y: 5 },
            ]
        },

        // ===== LEVEL 3: Sky World =====
        {
            name: "World 1-3",
            subtitle: "Sky World",
            theme: "sky",
            timeLimit: 280,
            map: [
                '.........................................................................................................',
                '.........................................................................................................',
                '.........................................................................................................',
                '.........................................................................................................',
                '.........................................................................................................',
                '.........................................................................................................',
                '........................................?..........................................................?.......',
                '.........................................................................................................',
                '....====.......====.......====........====.......====........====.......====........===.......===...........',
                '.........................................................................................................',
                '.====.......====.......====.......====.......====.......====.......====.......====.......====...............',
                '.........................................................................................................',
                '.........................................................................................................',
                'GGGGGGG...........................................................................GGGGGGGGGGGGGGGGGGGGGGG',
                'DDDDDDD...........................................................................DDDDDDDDDDDDDDDDDDDDDDD',
            ],
            entities: [
                { type: 'player', x: 2, y: 12 },
                { type: 'coin', x: 2, y: 9 },
                { type: 'coin', x: 3, y: 9 },
                { type: 'coin', x: 6, y: 7 },
                { type: 'coin', x: 7, y: 7 },
                { type: 'coin', x: 14, y: 9 },
                { type: 'coin', x: 15, y: 9 },
                { type: 'coin', x: 20, y: 7 },
                { type: 'coin', x: 21, y: 7 },
                { type: 'coin', x: 28, y: 9 },
                { type: 'coin', x: 29, y: 9 },
                { type: 'coin', x: 35, y: 7 },
                { type: 'coin', x: 36, y: 7 },
                { type: 'coin', x: 42, y: 9 },
                { type: 'coin', x: 43, y: 9 },
                { type: 'coin', x: 48, y: 7 },
                { type: 'coin', x: 55, y: 7 },
                { type: 'coin', x: 62, y: 9 },
                { type: 'coin', x: 69, y: 9 },
                { type: 'coin', x: 76, y: 7 },
                { type: 'coin', x: 83, y: 7 },
                { type: 'coin', x: 88, y: 5 },
                { type: 'bat', x: 15, y: 4 },
                { type: 'bat', x: 30, y: 5 },
                { type: 'bat', x: 50, y: 3 },
                { type: 'bat', x: 65, y: 4 },
                { type: 'bat', x: 80, y: 5 },
                { type: 'flag', x: 95, y: 5 },
            ]
        },

        // ===== LEVEL 4: Fire Castle =====
        {
            name: "World 1-4",
            subtitle: "Fire Castle",
            theme: "castle",
            timeLimit: 260,
            map: [
                'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
                'C.........................................................................................................C',
                'C.........................................................................................................C',
                'C.........................................................................................................C',
                'C...............KKKK......................................................KKKK.............................C',
                'C.........................................................................................................C',
                'C.........................................................................................................C',
                'C..........................CCCC......CCCC......CCCC.......CCCC.......CCC...CCCC............................C',
                'C.........................................................................................................C',
                'C.........................................................................................................C',
                'C............CCCC.......CCCC..............................................................................C',
                'C.........................................................................................................C',
                'C.........................................................................................................C',
                'CCCCCCCCCCCCCCCCCCCCCCCC....CCCCCCCCCCCCCCCCC....CCCCCCCCCCCC....CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
                'CCCCCCCCCCCCCCCCCCCCCCCC....LLLLLLLLLLLLlllll....LLLLLlllllll....CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
            ],
            entities: [
                { type: 'player', x: 2, y: 12 },
                { type: 'coin', x: 14, y: 9 },
                { type: 'coin', x: 15, y: 9 },
                { type: 'coin', x: 16, y: 3 },
                { type: 'coin', x: 17, y: 3 },
                { type: 'coin', x: 18, y: 3 },
                { type: 'coin', x: 27, y: 6 },
                { type: 'coin', x: 28, y: 6 },
                { type: 'coin', x: 33, y: 6 },
                { type: 'coin', x: 34, y: 6 },
                { type: 'coin', x: 39, y: 6 },
                { type: 'coin', x: 40, y: 6 },
                { type: 'coin', x: 47, y: 6 },
                { type: 'coin', x: 48, y: 6 },
                { type: 'coin', x: 55, y: 6 },
                { type: 'coin', x: 56, y: 6 },
                { type: 'coin', x: 65, y: 3 },
                { type: 'coin', x: 66, y: 3 },
                { type: 'coin', x: 67, y: 3 },
                { type: 'coin', x: 68, y: 3 },
                { type: 'spike', x: 22, y: 12 },
                { type: 'spike', x: 35, y: 12 },
                { type: 'slime', x: 30, y: 12 },
                { type: 'spike', x: 45, y: 12 },
                { type: 'bat', x: 50, y: 3 },
                { type: 'slime', x: 55, y: 12 },
                { type: 'spike', x: 60, y: 12 },
                { type: 'spike', x: 70, y: 12 },
                { type: 'slime', x: 75, y: 12 },
                { type: 'bat', x: 80, y: 4 },
                { type: 'spike', x: 85, y: 12 },
                { type: 'flag', x: 100, y: 5 },
            ]
        },

        // ===== LEVEL 5: Final Challenge =====
        {
            name: "World 1-5",
            subtitle: "Final Challenge",
            theme: "night",
            timeLimit: 240,
            map: [
                '.........................................................................................................',
                '.........................................................................................................',
                '.........................................................................................................',
                '.........................................................................................................',
                '.........?..........?..B?B.....?..............................................................?...........',
                '.........................................................................................................',
                '..............GGGG..............................GGGG...........GGG......GGG................................',
                '.........................................................................................................',
                '........GGG....................GGG...........................................................................',
                '...................................GGG.......................................................................',
                '........................................GGG.......GGG.......GGG........GGG.....GGG.........GGG...............',
                '.........................................................................................................',
                '.........................................................................................................',
                'GGGGGGGGGGGGG....GGGGG....GGGGG....GGGGG....GGGG....GGGG....GGGG....GGGG....GGGG.....GGGGGGGGGGGGGGGGGGGG',
                'DDDDDDDDDDDDD....DDDDD....DDDDD....DDDDD....DDDD....DDDD....DDDD....DDDD....DDDD.....DDDDDDDDDDDDDDDDDDDD',
            ],
            entities: [
                { type: 'player', x: 2, y: 12 },
                { type: 'coin', x: 9, y: 7 },
                { type: 'coin', x: 10, y: 7 },
                { type: 'coin', x: 15, y: 5 },
                { type: 'coin', x: 16, y: 5 },
                { type: 'coin', x: 19, y: 3 },
                { type: 'coin', x: 22, y: 3 },
                { type: 'coin', x: 28, y: 3 },
                { type: 'coin', x: 33, y: 7 },
                { type: 'coin', x: 34, y: 7 },
                { type: 'coin', x: 41, y: 9 },
                { type: 'coin', x: 42, y: 9 },
                { type: 'coin', x: 49, y: 8 },
                { type: 'coin', x: 50, y: 8 },
                { type: 'coin', x: 51, y: 8 },
                { type: 'coin', x: 57, y: 8 },
                { type: 'coin', x: 58, y: 8 },
                { type: 'coin', x: 64, y: 8 },
                { type: 'coin', x: 65, y: 8 },
                { type: 'coin', x: 88, y: 7 },
                { type: 'slime', x: 18, y: 12 },
                { type: 'spike', x: 25, y: 12 },
                { type: 'slime', x: 32, y: 12 },
                { type: 'bat', x: 28, y: 3 },
                { type: 'spike', x: 38, y: 12 },
                { type: 'slime', x: 42, y: 12 },
                { type: 'bat', x: 45, y: 4 },
                { type: 'spike', x: 50, y: 12 },
                { type: 'spike', x: 55, y: 12 },
                { type: 'bat', x: 58, y: 3 },
                { type: 'slime', x: 62, y: 12 },
                { type: 'spike', x: 68, y: 12 },
                { type: 'bat', x: 72, y: 4 },
                { type: 'spike', x: 76, y: 12 },
                { type: 'slime', x: 80, y: 12 },
                { type: 'bat', x: 85, y: 3 },
                { type: 'flag', x: 100, y: 5 },
            ]
        }
    ];


    // Level class
    class Level {
        constructor(data) {
            this.name = data.name;
            this.subtitle = data.subtitle;
            this.theme = THEMES[data.theme] || THEMES.overworld;
            this.themeName = data.theme;
            this.timeLimit = data.timeLimit;
            this.time = data.timeLimit;

            // Parse map
            this.tiles = [];
            this.height = data.map.length;
            this.width = 0;
            for (let row = 0; row < data.map.length; row++) {
                this.tiles[row] = [];
                if (data.map[row].length > this.width) this.width = data.map[row].length;
                for (let col = 0; col < data.map[row].length; col++) {
                    this.tiles[row][col] = this._charToTile(data.map[row][col]);
                }
            }

            // Create entities
            this.enemies = [];
            this.coins = [];
            this.flag = null;
            this.playerStart = { x: 2, y: 12 };

            for (const e of data.entities) {
                switch (e.type) {
                    case 'player':
                        this.playerStart = { x: e.x * TILE, y: e.y * TILE };
                        break;
                    case 'coin':
                        this.coins.push(new Coin(e.x, e.y));
                        break;
                    case 'slime':
                    case 'spike':
                    case 'bat':
                        this.enemies.push(new Enemy(e.x, e.y, e.type));
                        break;
                    case 'flag':
                        this.flag = { x: e.x * TILE, y: e.y * TILE, reached: false };
                        break;
                }
            }

            // Q-block contents tracker
            this.qblockHits = {};

            // Popup texts
            this.popups = [];
        }

        _charToTile(ch) {
            const map = {
                '.': T.AIR,
                'G': T.GRASS,
                'D': T.DIRT,
                'B': T.BRICK,
                '?': T.QBLOCK,
                'S': T.STONE,
                '[': T.PIPE_TL,
                ']': T.PIPE_TR,
                '{': T.PIPE_BL,
                '}': T.PIPE_BR,
                'L': T.LAVA_TOP,
                'l': T.LAVA,
                '~': T.BRIDGE,
                'C': T.CASTLE_BLOCK,
                'K': T.DARK_BRICK,
                'I': T.ICE,
                '=': T.CLOUD_PLAT,
                '^': T.SPIKE_TILE,
            };
            return map[ch] !== undefined ? map[ch] : T.AIR;
        }

        getTile(col, row) {
            if (row < 0 || row >= this.height || col < 0 || col >= this.width) return T.AIR;
            return this.tiles[row][col];
        }

        hitBlock(col, row) {
            const tile = this.getTile(col, row);
            if (tile === T.QBLOCK) {
                this.tiles[row][col] = T.QBLOCK_USED;
                Sound.play('coin');
                // Spawn coin popup
                this.popups.push(new PopupText(col * TILE + TILE/2, row * TILE - 10, '+200', '#FFD700'));
                spawnCoinParticles(col * TILE + TILE/2, row * TILE);
                return 'coin';
            }
            if (tile === T.BRICK) {
                this.tiles[row][col] = T.AIR;
                Sound.play('break');
                spawnBrickParticles(col * TILE + TILE/2, row * TILE + TILE/2);
                return 'break';
            }
            if (tile === T.QBLOCK_USED || tile === T.STONE || tile === T.CASTLE_BLOCK) {
                Sound.play('bump');
                return 'bump';
            }
            return null;
        }
    }


    // ============================
    // TILE RENDERER
    // ============================
    const tileCanvasCache = {};

    function drawTile(ctx, tileType, x, y, theme, frame) {
        switch(tileType) {
            case T.GRASS:
                ctx.fillStyle = theme.groundTop;
                ctx.fillRect(x, y, TILE, TILE);
                ctx.fillStyle = '#55cc55';
                ctx.fillRect(x, y, TILE, 4);
                // Grass detail
                ctx.fillStyle = '#66dd66';
                for (let i = 0; i < TILE; i += 8) {
                    ctx.fillRect(x + i, y, 4, 2);
                }
                break;

            case T.DIRT:
                ctx.fillStyle = theme.groundFill;
                ctx.fillRect(x, y, TILE, TILE);
                // Dirt texture
                ctx.fillStyle = theme.groundTop;
                ctx.fillRect(x + 4, y + 8, 4, 4);
                ctx.fillRect(x + 16, y + 4, 4, 4);
                ctx.fillRect(x + 8, y + 20, 4, 4);
                break;

            case T.BRICK:
                ctx.fillStyle = theme.brickColor;
                ctx.fillRect(x, y, TILE, TILE);
                ctx.fillStyle = theme.brickDark;
                // Brick pattern
                ctx.fillRect(x, y + TILE/2 - 1, TILE, 2);
                ctx.fillRect(x + TILE/2 - 1, y, 2, TILE/2);
                ctx.fillRect(x + TILE/4 - 1, y + TILE/2, 2, TILE/2);
                ctx.fillRect(x + TILE * 3/4 - 1, y + TILE/2, 2, TILE/2);
                break;

            case T.QBLOCK:
                const bob = Math.sin(frame * 0.08) * 2;
                ctx.fillStyle = '#FFB800';
                ctx.fillRect(x, y + bob, TILE, TILE);
                ctx.fillStyle = '#CC8800';
                ctx.fillRect(x, y + bob, TILE, 3);
                ctx.fillRect(x, y + bob + TILE - 3, TILE, 3);
                ctx.fillRect(x, y + bob, 3, TILE);
                ctx.fillRect(x + TILE - 3, y + bob, 3, TILE);
                // ? mark
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 16px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('?', x + TILE/2, y + bob + TILE - 8);
                break;

            case T.QBLOCK_USED:
                ctx.fillStyle = '#887744';
                ctx.fillRect(x, y, TILE, TILE);
                ctx.fillStyle = '#665533';
                ctx.fillRect(x, y, TILE, 3);
                ctx.fillRect(x, y + TILE - 3, TILE, 3);
                ctx.fillRect(x, y, 3, TILE);
                ctx.fillRect(x + TILE - 3, y, 3, TILE);
                break;

            case T.STONE:
                ctx.fillStyle = theme.stoneColor;
                ctx.fillRect(x, y, TILE, TILE);
                ctx.fillStyle = theme.stoneDark;
                ctx.fillRect(x, y, TILE, 2);
                ctx.fillRect(x, y, 2, TILE);
                ctx.fillRect(x + TILE - 2, y, 2, TILE);
                ctx.fillRect(x, y + TILE - 2, TILE, 2);
                break;

            case T.PIPE_TL:
                ctx.fillStyle = '#33aa33';
                ctx.fillRect(x, y, TILE, TILE);
                ctx.fillStyle = '#55cc55';
                ctx.fillRect(x, y, 6, TILE);
                ctx.fillStyle = '#228822';
                ctx.fillRect(x + TILE - 2, y, 2, TILE);
                break;

            case T.PIPE_TR:
                ctx.fillStyle = '#33aa33';
                ctx.fillRect(x, y, TILE, TILE);
                ctx.fillStyle = '#228822';
                ctx.fillRect(x + TILE - 6, y, 6, TILE);
                ctx.fillStyle = '#55cc55';
                ctx.fillRect(x, y, 2, TILE);
                break;

            case T.PIPE_BL:
                ctx.fillStyle = '#33aa33';
                ctx.fillRect(x, y, TILE, TILE);
                ctx.fillStyle = '#55cc55';
                ctx.fillRect(x + 4, y, 4, TILE);
                break;

            case T.PIPE_BR:
                ctx.fillStyle = '#33aa33';
                ctx.fillRect(x, y, TILE, TILE);
                ctx.fillStyle = '#228822';
                ctx.fillRect(x + TILE - 8, y, 4, TILE);
                break;

            case T.LAVA_TOP:
                ctx.fillStyle = '#ff4422';
                ctx.fillRect(x, y, TILE, TILE);
                ctx.fillStyle = '#ffaa22';
                // Animated lava surface
                for (let i = 0; i < TILE; i += 4) {
                    const h = Math.sin((x + i + frame * 2) * 0.2) * 4 + 4;
                    ctx.fillRect(x + i, y, 4, h);
                }
                break;

            case T.LAVA:
                ctx.fillStyle = '#cc2200';
                ctx.fillRect(x, y, TILE, TILE);
                ctx.fillStyle = '#ff4422';
                ctx.fillRect(x + 4 + Math.sin(frame * 0.1) * 4, y + 8, 8, 8);
                break;

            case T.BRIDGE:
                ctx.fillStyle = '#8B5E3C';
                ctx.fillRect(x, y, TILE, 8);
                ctx.fillStyle = '#6B3E1C';
                ctx.fillRect(x + TILE/2 - 2, y + 8, 4, TILE - 8);
                break;

            case T.CASTLE_BLOCK:
                ctx.fillStyle = '#555544';
                ctx.fillRect(x, y, TILE, TILE);
                ctx.fillStyle = '#444433';
                ctx.fillRect(x, y + TILE/2 - 1, TILE, 2);
                ctx.fillRect(x + TILE/2 - 1, y, 2, TILE);
                ctx.fillStyle = '#666655';
                ctx.fillRect(x + 2, y + 2, 4, 4);
                break;

            case T.DARK_BRICK:
                ctx.fillStyle = '#443333';
                ctx.fillRect(x, y, TILE, TILE);
                ctx.fillStyle = '#332222';
                ctx.fillRect(x, y + TILE/2 - 1, TILE, 2);
                ctx.fillRect(x + TILE/2 - 1, y, 2, TILE/2);
                ctx.fillRect(x + TILE/4 - 1, y + TILE/2, 2, TILE/2);
                break;

            case T.CLOUD_PLAT:
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x + 2, y + 4, TILE - 4, TILE - 8);
                ctx.fillRect(x, y + 8, TILE, TILE - 16);
                ctx.fillStyle = '#ddeeff';
                ctx.fillRect(x + 4, y + 6, TILE - 8, 4);
                break;

            case T.SPIKE_TILE:
                ctx.fillStyle = '#888888';
                for (let i = 0; i < TILE; i += 8) {
                    ctx.beginPath();
                    ctx.moveTo(x + i, y + TILE);
                    ctx.lineTo(x + i + 4, y);
                    ctx.lineTo(x + i + 8, y + TILE);
                    ctx.fill();
                }
                break;
        }
    }


    // ============================
    // BACKGROUND RENDERER
    // ============================
    function drawBackground(ctx, theme, themeName, camX, camY, W, H, frame) {
        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, theme.skyTop);
        grad.addColorStop(1, theme.skyBot);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        if (themeName === 'overworld' || themeName === 'night') {
            // Clouds (parallax)
            ctx.fillStyle = themeName === 'night' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)';
            for (let i = 0; i < 8; i++) {
                const cx = ((i * 180 + 50) - camX * 0.2) % (W + 200) - 50;
                const cy = 30 + (i % 3) * 40;
                ctx.fillRect(cx, cy, 60, 16);
                ctx.fillRect(cx + 10, cy - 8, 40, 12);
                ctx.fillRect(cx - 5, cy + 4, 20, 8);
            }

            // Background hills (parallax)
            ctx.fillStyle = themeName === 'night' ? '#1a3a1a' : '#77cc77';
            for (let x = 0; x < W + 20; x += 4) {
                const worldX = x + camX * 0.3;
                const hillH = Math.sin(worldX * 0.008) * 40 + Math.sin(worldX * 0.015) * 20 + 60;
                ctx.fillRect(x, H - hillH, 4, hillH);
            }
        }

        if (themeName === 'sky') {
            // More clouds, bigger
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            for (let i = 0; i < 12; i++) {
                const cx = ((i * 150 + 30) - camX * 0.15) % (W + 300) - 80;
                const cy = 20 + (i % 5) * 50 + Math.sin(frame * 0.01 + i) * 5;
                ctx.fillRect(cx, cy, 80, 20);
                ctx.fillRect(cx + 15, cy - 10, 50, 15);
            }
        }

        if (themeName === 'night') {
            // Stars
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 40; i++) {
                const sx = ((i * 67 + 13) - camX * 0.05) % (W + 100) - 20;
                const sy = (i * 43 + 7) % (H - 100);
                const blink = Math.sin(frame * 0.03 + i * 2.1) > 0.2;
                if (blink) {
                    const size = (i % 3 === 0) ? 2 : 1;
                    ctx.fillRect(sx, sy, size, size);
                }
            }
        }

        if (themeName === 'castle') {
            // Torch-like flickering lights
            for (let i = 0; i < 5; i++) {
                const tx = ((i * 200 + 100) - camX * 0.5) % (W + 200);
                const ty = 60;
                const flicker = Math.sin(frame * 0.2 + i * 3) * 5 + 10;
                ctx.fillStyle = `rgba(255, 100, 30, ${0.1 + Math.sin(frame * 0.15 + i) * 0.05})`;
                ctx.beginPath();
                ctx.arc(tx, ty, flicker + 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff6622';
                ctx.fillRect(tx - 3, ty - 6 + Math.sin(frame * 0.3 + i) * 2, 6, 8);
                ctx.fillStyle = '#ffaa44';
                ctx.fillRect(tx - 1, ty - 4, 2, 4);
            }
        }
    }


    // ============================
    // FLAG (Level End)
    // ============================
    function drawFlag(ctx, flag, camX, camY, frame) {
        if (!flag) return;
        const x = flag.x - camX;
        const y = flag.y - camY;

        // Pole
        ctx.fillStyle = '#888888';
        ctx.fillRect(x + 14, y, 4, TILE * 8);

        // Ball on top
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + 10, y - 6, 12, 12);

        // Flag (waving)
        const wave = Math.sin(frame * 0.1) * 3;
        ctx.fillStyle = flag.reached ? '#44ff44' : '#ff4444';
        ctx.beginPath();
        ctx.moveTo(x + 18, y + 8);
        ctx.lineTo(x + 42 + wave, y + 16);
        ctx.lineTo(x + 18, y + 28);
        ctx.closePath();
        ctx.fill();

        // Flag star
        ctx.fillStyle = '#FFD700';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('★', x + 24 + wave * 0.5, y + 22);
    }


    // ============================
    // HUD
    // ============================
    function drawHUD(ctx, player, level, W) {
        const pad = 16;

        // Semi-transparent HUD background
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, W, 40);

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'left';

        // Score
        ctx.fillText('SCORE', pad, 16);
        ctx.fillStyle = '#FFD700';
        ctx.fillText(String(player.score).padStart(6, '0'), pad, 32);

        // Coins
        ctx.fillStyle = '#FFD700';
        ctx.fillText('x' + player.coins, pad + 140, 32);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('COINS', pad + 130, 16);

        // Level name
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(level.name, W / 2, 16);
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(level.subtitle, W / 2, 32);

        // Time
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('TIME', W - pad, 16);
        const timeColor = level.time > 60 ? '#ffffff' : (level.time > 30 ? '#ffaa00' : '#ff4444');
        ctx.fillStyle = timeColor;
        ctx.fillText(String(Math.ceil(level.time)), W - pad, 32);

        // Lives
        ctx.fillStyle = '#ff4444';
        ctx.textAlign = 'right';
        ctx.fillText('♥'.repeat(Math.max(0, player.lives)), W - pad - 80, 32);
    }


    // ============================
    // MAIN GAME CLASS
    // ============================
    class Game {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');

            this.state = STATE.TITLE;
            this.currentLevel = 0;
            this.level = null;
            this.player = null;
            this.unlockedLevels = 1;
            this.selectedLevel = 0;

            // Camera
            this.camX = 0;
            this.camY = 0;

            // Timing
            this.frame = 0;
            this.timeAccum = 0;
            this.lastTime = 0;

            // Transition
            this.transitionAlpha = 0;
            this.transitionPhase = 0; // 1 = fade in, -1 = fade out, 0 = idle
            this.transitionCallback = null;

            // Level complete
            this.levelCompleteTimer = 0;

            // Canvas sizing
            this.resize();
            window.addEventListener('resize', () => this.resize());

            // Click and touch handling on canvas
            const onCanvasAction = (clientX, clientY) => {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.W / rect.width;
                const scaleY = this.H / rect.height;
                const x = (clientX - rect.left) * scaleX;
                const y = (clientY - rect.top) * scaleY;
                this.handleClick(x, y);
            };

            this.canvas.addEventListener('click', (e) => {
                onCanvasAction(e.clientX, e.clientY);
            });

            this.canvas.addEventListener('touchstart', (e) => {
                if (e.touches && e.touches.length > 0) {
                    onCanvasAction(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: true });

            // Load saved progress
            this._loadProgress();
        }

        resize() {
            const ratio = 800 / 480;
            let w = window.innerWidth;
            let h = window.innerHeight;

            if (w / h > ratio) {
                w = h * ratio;
            } else {
                h = w / ratio;
            }

            this.canvas.width = 800;
            this.canvas.height = 480;
            this.canvas.style.width = w + 'px';
            this.canvas.style.height = h + 'px';
            this.W = 800;
            this.H = 480;
        }

        _loadProgress() {
            try {
                const saved = localStorage.getItem('superrunner_progress');
                if (saved) {
                    const data = JSON.parse(saved);
                    this.unlockedLevels = data.unlockedLevels || 1;
                }
            } catch(e) {}
        }

        _saveProgress() {
            try {
                localStorage.setItem('superrunner_progress', JSON.stringify({
                    unlockedLevels: this.unlockedLevels
                }));
            } catch(e) {}
        }

        handleClick(x, y) {
            Sound.init();

            if (this.transitionPhase === 1) return;

            if (this.state === STATE.TITLE) {
                Sound.play('select');
                this.state = STATE.LEVEL_SELECT;
                this.selectedLevel = 0;
                return;
            }

            if (this.state === STATE.LEVEL_SELECT) {
                // Back button (top-left)
                if (x >= 15 && x <= 110 && y >= 15 && y <= 55) {
                    Sound.play('pause');
                    this.state = STATE.TITLE;
                    return;
                }

                const cardW = 120;
                const cardH = 140;
                const gap = 20;
                const totalW = LEVEL_DATA.length * cardW + (LEVEL_DATA.length - 1) * gap;
                const startX = (this.W - totalW) / 2;

                // Card clicks
                if (y >= 110 && y <= 270) {
                    for (let i = 0; i < LEVEL_DATA.length; i++) {
                        const cx = startX + i * (cardW + gap);
                        if (x >= cx && x <= cx + cardW) {
                            this.selectedLevel = i;
                            if (i < this.unlockedLevels) {
                                Sound.play('select');
                                this.startLevel(i);
                            } else {
                                Sound.play('bump');
                            }
                            return;
                        }
                    }
                }

                // Left arrow
                if (x < startX && y >= 110 && y <= 270) {
                    this.selectedLevel = Math.max(0, this.selectedLevel - 1);
                    Sound.play('select');
                    return;
                }

                // Right arrow
                if (x > startX + totalW && y >= 110 && y <= 270) {
                    this.selectedLevel = Math.min(LEVEL_DATA.length - 1, this.selectedLevel + 1);
                    Sound.play('select');
                    return;
                }

                // Start button at bottom
                if (y >= 310 && y <= 365 && x >= (this.W - 240) / 2 && x <= (this.W + 240) / 2) {
                    if (this.selectedLevel < this.unlockedLevels) {
                        Sound.play('select');
                        this.startLevel(this.selectedLevel);
                    } else {
                        Sound.play('bump');
                    }
                    return;
                }
            }

            if (this.state === STATE.PLAYING) {
                if (this.player) {
                    this.player.triggerJump();
                }
                return;
            }

            if (this.state === STATE.PAUSED) {
                this.state = STATE.PLAYING;
                Sound.play('pause');
                return;
            }

            if (this.state === STATE.LEVEL_COMPLETE) {
                if (this.levelCompleteTimer > 40) {
                    if (this.currentLevel + 1 < LEVEL_DATA.length) {
                        this.startLevel(this.currentLevel + 1);
                    } else {
                        this.state = STATE.TITLE;
                    }
                }
                return;
            }

            if (this.state === STATE.GAME_OVER) {
                this.state = STATE.LEVEL_SELECT;
                return;
            }
        }

        startLevel(index) {
            this.currentLevel = index;
            const data = LEVEL_DATA[index];
            this.level = new Level(data);
            this.player = new Player(this.level.playerStart.x, this.level.playerStart.y);
            this.camX = 0;
            this.camY = 0;
            particles.length = 0;
            this.frame = 0;
            this.timeAccum = 0;
            this.levelCompleteTimer = 0;

            this._transition(() => {
                this.state = STATE.PLAYING;
            });
        }

        _transition(callback) {
            this.transitionAlpha = 0;
            this.transitionPhase = 1; // fade to black
            this.transitionCallback = callback;
        }

        _updateTransition() {
            if (this.transitionPhase === 1) {
                this.transitionAlpha += 0.08;
                if (this.transitionAlpha >= 1) {
                    this.transitionAlpha = 1;
                    if (this.transitionCallback) {
                        this.transitionCallback();
                        this.transitionCallback = null;
                    }
                    this.transitionPhase = -1; // start fade out
                }
            } else if (this.transitionPhase === -1) {
                this.transitionAlpha -= 0.05;
                if (this.transitionAlpha <= 0) {
                    this.transitionAlpha = 0;
                    this.transitionPhase = 0;
                }
            }
        }

        update() {
            this.frame++;

            // Always update transition animation
            if (this.transitionPhase !== 0) {
                this._updateTransition();
            }

            // While fading into black, don't update game entities
            if (this.transitionPhase === 1) {
                Input.clearJustPressed();
                return;
            }

            switch (this.state) {
                case STATE.TITLE:
                    this._updateTitle();
                    break;
                case STATE.LEVEL_SELECT:
                    this._updateLevelSelect();
                    break;
                case STATE.PLAYING:
                    this._updatePlaying();
                    break;
                case STATE.PAUSED:
                    this._updatePaused();
                    break;
                case STATE.LEVEL_COMPLETE:
                    this._updateLevelComplete();
                    break;
                case STATE.GAME_OVER:
                    this._updateGameOver();
                    break;
            }

            Input.clearJustPressed();
        }

        _updateTitle() {
            if (Input.enter()) {
                Sound.play('select');
                this.state = STATE.LEVEL_SELECT;
                this.selectedLevel = 0;
            }
        }

        _updateLevelSelect() {
            if (Input.right() || Input.wasPressed('ArrowRight')) {
                this.selectedLevel = Math.min(LEVEL_DATA.length - 1, this.selectedLevel + 1);
                Sound.play('select');
            }
            if (Input.left() || Input.wasPressed('ArrowLeft')) {
                this.selectedLevel = Math.max(0, this.selectedLevel - 1);
                Sound.play('select');
            }
            if (Input.enter()) {
                if (this.selectedLevel < this.unlockedLevels) {
                    Sound.play('select');
                    this.startLevel(this.selectedLevel);
                } else {
                    Sound.play('bump');
                }
            }
            if (Input.escape()) {
                this.state = STATE.TITLE;
                Sound.play('pause');
            }
        }

        _updatePlaying() {
            // Pause
            if (Input.escape()) {
                this.state = STATE.PAUSED;
                Sound.play('pause');
                return;
            }

            // Update player
            this.player.update(this.level);

            // Update enemies
            for (const enemy of this.level.enemies) {
                enemy.update(this.level, this.camX, this.W);
            }

            // Update coins
            for (const coin of this.level.coins) {
                coin.update(this.frame);
            }

            // Update particles
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                if (particles[i].life <= 0) particles.splice(i, 1);
            }

            // Update popups
            for (let i = this.level.popups.length - 1; i >= 0; i--) {
                this.level.popups[i].update();
                if (this.level.popups[i].life <= 0) this.level.popups.splice(i, 1);
            }

            if (!this.player.dead) {
                // Player-enemy collision
                for (const enemy of this.level.enemies) {
                    if (!enemy.alive || enemy.dying || !enemy.active) continue;
                    if (this._aabb(this.player, enemy)) {
                        // Check if stomping (player falling on top)
                        if (this.player.vy > 0 &&
                            this.player.y + this.player.h - 8 < enemy.y + enemy.h / 2) {
                            enemy.stomp();
                            this.player.vy = -7;
                            this.player.score += 200;
                            this.level.popups.push(new PopupText(
                                enemy.x + enemy.w/2, enemy.y - 10, '+200', '#ffffff'));
                        } else {
                            this.player.hurt();
                        }
                    }
                }

                // Player-coin collision with generous hitbox
                for (const coin of this.level.coins) {
                    if (coin.collected) continue;
                    const coinHitbox = {
                        x: coin.x - 6,
                        y: (coin.drawY || coin.y) - 6,
                        w: coin.w + 12,
                        h: coin.h + 12
                    };
                    if (this._aabb(this.player, coinHitbox)) {
                        coin.collect(this.player);
                        this.level.popups.push(new PopupText(
                            coin.x + coin.w/2, coin.y - 10, '+100', '#FFD700'));
                    }
                }

                // Flag collision
                if (this.level.flag && !this.level.flag.reached) {
                    const fx = this.level.flag.x;
                    const fy = this.level.flag.y;
                    if (this.player.x + this.player.w > fx &&
                        this.player.x < fx + TILE &&
                        this.player.y + this.player.h > fy &&
                        this.player.y < fy + TILE * 8) {
                        this.level.flag.reached = true;
                        this.state = STATE.LEVEL_COMPLETE;
                        this.levelCompleteTimer = 0;
                        this.player.score += 1000;
                        Sound.play('flag');

                        // Unlock next level
                        if (this.currentLevel + 1 < LEVEL_DATA.length) {
                            this.unlockedLevels = Math.max(this.unlockedLevels, this.currentLevel + 2);
                            this._saveProgress();
                        }
                    }
                }

                // Hazard tile collision (lava, spikes)
                const pcx = Math.floor((this.player.x + this.player.w/2) / TILE);
                const pcy = Math.floor((this.player.y + this.player.h) / TILE);
                const hazardTile = this.level.getTile(pcx, pcy);
                if (hazardTile === T.LAVA_TOP || hazardTile === T.LAVA || hazardTile === T.SPIKE_TILE) {
                    this.player.die();
                }

                // Timer
                this.timeAccum++;
                if (this.timeAccum >= 60) {
                    this.timeAccum = 0;
                    this.level.time--;
                    if (this.level.time <= 0) {
                        this.player.die();
                    }
                }
            }

            // Player died - handle respawn
            if (this.player.dead && this.player.deathTimer > 50) {
                if (this.player.lives > 0) {
                    const savedLives = this.player.lives;
                    const savedScore = this.player.score;
                    const savedCoins = this.player.coins;
                    this._transition(() => {
                        const data = LEVEL_DATA[this.currentLevel];
                        this.level = new Level(data);
                        this.player = new Player(this.level.playerStart.x, this.level.playerStart.y);
                        this.player.lives = savedLives;
                        this.player.score = savedScore;
                        this.player.coins = savedCoins;
                        this.camX = 0;
                        this.camY = 0;
                        particles.length = 0;
                        this.state = STATE.PLAYING;
                    });
                } else {
                    this.state = STATE.GAME_OVER;
                }
            }

            // Camera follow
            const targetCamX = this.player.x - this.W / 3;
            const targetCamY = this.player.y - this.H / 2;

            this.camX += (targetCamX - this.camX) * CAMERA_SMOOTH;
            this.camY += (targetCamY - this.camY) * CAMERA_SMOOTH;

            // Clamp camera
            this.camX = Math.max(0, Math.min(this.level.width * TILE - this.W, this.camX));
            this.camY = Math.max(0, Math.min(this.level.height * TILE - this.H, this.camY));
        }

        _updatePaused() {
            if (Input.escape() || Input.enter()) {
                this.state = STATE.PLAYING;
                Sound.play('pause');
            }
        }

        _updateLevelComplete() {
            this.levelCompleteTimer++;
            if (this.levelCompleteTimer > 60 && (Input.enter() || Input.jump())) {
                if (this.currentLevel + 1 < LEVEL_DATA.length) {
                    this.startLevel(this.currentLevel + 1);
                } else {
                    this.state = STATE.TITLE;
                }
            }
        }

        _updateGameOver() {
            if (Input.enter() || Input.jump()) {
                this.state = STATE.LEVEL_SELECT;
            }
        }

        _aabb(a, b) {
            return a.x < b.x + b.w &&
                   a.x + a.w > b.x &&
                   a.y < b.y + b.h &&
                   a.y + a.h > b.y;
        }

        // ============================
        // DRAW
        // ============================
        draw() {
            const ctx = this.ctx;
            ctx.imageSmoothingEnabled = false;

            switch (this.state) {
                case STATE.TITLE:
                    this._drawTitle(ctx);
                    break;
                case STATE.LEVEL_SELECT:
                    this._drawLevelSelect(ctx);
                    break;
                case STATE.PLAYING:
                case STATE.PAUSED:
                    this._drawGame(ctx);
                    if (this.state === STATE.PAUSED) this._drawPauseOverlay(ctx);
                    break;
                case STATE.LEVEL_COMPLETE:
                    this._drawGame(ctx);
                    this._drawLevelComplete(ctx);
                    break;
                case STATE.GAME_OVER:
                    this._drawGameOver(ctx);
                    break;
            }

            // Transition overlay
            if (this.transitionAlpha > 0) {
                ctx.fillStyle = `rgba(0,0,0,${Math.min(1, Math.max(0, this.transitionAlpha))})`;
                ctx.fillRect(0, 0, this.W, this.H);

                if (this.transitionAlpha > 0.4 && this.level) {
                    const textAlpha = Math.min(1, (this.transitionAlpha - 0.4) / 0.4);
                    ctx.globalAlpha = textAlpha;
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '16px "Press Start 2P", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(this.level.name, this.W / 2, this.H / 2 - 10);
                    ctx.font = '10px "Press Start 2P", monospace';
                    ctx.fillStyle = '#aaaaaa';
                    ctx.fillText(this.level.subtitle, this.W / 2, this.H / 2 + 15);
                    // Lives indicator
                    ctx.fillStyle = '#ff4444';
                    ctx.fillText('♥ x ' + (this.player ? this.player.lives : 3), this.W / 2, this.H / 2 + 45);
                    ctx.globalAlpha = 1;
                }
            }
        }

        _drawTitle(ctx) {
            // Background
            const grad = ctx.createLinearGradient(0, 0, 0, this.H);
            grad.addColorStop(0, '#0a0a2e');
            grad.addColorStop(1, '#1a1a4e');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.W, this.H);

            // Animated stars
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 50; i++) {
                const sx = (i * 67 + this.frame * 0.2) % this.W;
                const sy = (i * 43 + 7) % (this.H - 80);
                const blink = Math.sin(this.frame * 0.05 + i * 1.7) > 0.2;
                if (blink) ctx.fillRect(sx, sy, 2, 2);
            }

            // Ground
            ctx.fillStyle = '#44aa44';
            ctx.fillRect(0, this.H - 64, this.W, 8);
            ctx.fillStyle = '#55cc55';
            for (let x = 0; x < this.W; x += 8) {
                ctx.fillRect(x, this.H - 66, 4, 2);
            }
            ctx.fillStyle = '#8B5E3C';
            ctx.fillRect(0, this.H - 56, this.W, 56);

            // Animated player on the ground
            const pFrame = Math.floor(this.frame / 8) % 3;
            const px = (this.frame * 1.5) % (this.W + 100) - 50;
            const py = this.H - 96;
            const pSprites = [SPR_PLAYER_RUN1, SPR_PLAYER_IDLE, SPR_PLAYER_RUN2];
            const pSprite = renderSprite(pSprites[pFrame]);
            ctx.drawImage(pSprite, px, py, 28, 32);

            // Slime chasing
            const sFrame = Math.floor(this.frame / 12) % 2;
            const sSprite = renderSprite(sFrame === 0 ? SPR_SLIME1 : SPR_SLIME2);
            ctx.drawImage(flipSprite(sSprite), px - 60, py + 8, 28, 24);

            // Title
            ctx.fillStyle = '#FFD700';
            ctx.font = '28px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SUPER', this.W / 2, 110);

            ctx.fillStyle = '#ff4444';
            ctx.font = '36px "Press Start 2P", monospace';
            ctx.fillText('RUNNER', this.W / 2, 160);

            // Subtitle
            ctx.fillStyle = '#aaaaaa';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('A Pixel Platformer Adventure', this.W / 2, 200);

            // Interactive Start Button
            const btnW = 320;
            const btnH = 46;
            const btnX = (this.W - btnW) / 2;
            const btnY = 250;

            const pulse = Math.sin(this.frame * 0.08) * 0.2 + 0.8;
            ctx.fillStyle = `rgba(0, 255, 136, ${pulse * 0.3})`;
            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.strokeRect(btnX, btnY, btnW, btnH);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('▶ CLICK OR PRESS ENTER', this.W / 2, btnY + 29);

            // Controls hint
            ctx.fillStyle = '#666666';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('ARROW KEYS / WASD to MOVE — SPACE / TAP to JUMP', this.W / 2, this.H - 24);
        }

        _drawLevelSelect(ctx) {
            // Background
            const grad = ctx.createLinearGradient(0, 0, 0, this.H);
            grad.addColorStop(0, '#0a0a2e');
            grad.addColorStop(1, '#151540');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.W, this.H);

            // Back button (top left)
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(20, 20, 90, 32);
            ctx.strokeStyle = '#666688';
            ctx.lineWidth = 1;
            ctx.strokeRect(20, 20, 90, 32);
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('← BACK', 65, 40);

            // Title
            ctx.fillStyle = '#FFD700';
            ctx.font = '20px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SELECT LEVEL', this.W / 2, 50);

            // Level cards
            const cardW = 120;
            const cardH = 140;
            const gap = 20;
            const totalW = LEVEL_DATA.length * cardW + (LEVEL_DATA.length - 1) * gap;
            const startX = (this.W - totalW) / 2;
            const cardY = 110;

            for (let i = 0; i < LEVEL_DATA.length; i++) {
                const x = startX + i * (cardW + gap);
                const y = cardY;
                const unlocked = i < this.unlockedLevels;
                const selected = i === this.selectedLevel;

                // Card background
                if (selected) {
                    ctx.strokeStyle = '#00ff88';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(x - 3, y - 3, cardW + 6, cardH + 6);

                    ctx.shadowColor = '#00ff88';
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = unlocked ? '#1a2a4a' : '#1a1a2a';
                    ctx.fillRect(x, y, cardW, cardH);
                    ctx.shadowBlur = 0;
                } else {
                    ctx.fillStyle = unlocked ? '#151530' : '#0a0a15';
                    ctx.fillRect(x, y, cardW, cardH);
                    ctx.strokeStyle = unlocked ? '#334466' : '#222233';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, cardW, cardH);
                }

                // Level number
                ctx.fillStyle = unlocked ? '#ffffff' : '#555555';
                ctx.font = '24px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(unlocked ? String(i + 1) : '🔒', x + cardW / 2, y + 48);

                // Level name
                ctx.fillStyle = unlocked ? '#aaaaaa' : '#444444';
                ctx.font = '7px "Press Start 2P", monospace';
                ctx.fillText(LEVEL_DATA[i].name, x + cardW / 2, y + 76);

                // Subtitle
                ctx.fillStyle = unlocked ? '#888888' : '#333333';
                ctx.font = '6px "Press Start 2P", monospace';
                ctx.fillText(LEVEL_DATA[i].subtitle, x + cardW / 2, y + 96);

                // Theme color bar
                const themeColors = {
                    overworld: '#44aa44',
                    underground: '#666688',
                    sky: '#88ccff',
                    castle: '#ff4422',
                    night: '#4444aa'
                };
                ctx.fillStyle = unlocked ? (themeColors[LEVEL_DATA[i].theme] || '#888') : '#222';
                ctx.fillRect(x + 10, y + cardH - 16, cardW - 20, 4);
            }

            // Play Level Button
            const sBtnW = 240;
            const sBtnH = 42;
            const sBtnX = (this.W - sBtnW) / 2;
            const sBtnY = 290;
            const canPlay = this.selectedLevel < this.unlockedLevels;

            ctx.fillStyle = canPlay ? '#00ff88' : '#333333';
            ctx.fillRect(sBtnX, sBtnY, sBtnW, sBtnH);
            ctx.fillStyle = canPlay ? '#0a0a1a' : '#666666';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(canPlay ? '▶ PLAY WORLD 1-' + (this.selectedLevel + 1) : 'LOCKED', this.W / 2, sBtnY + 26);

            // Instructions
            ctx.fillStyle = '#666666';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('CLICK A CARD OR USE ARROWS + ENTER', this.W / 2, this.H - 35);
        }

        _drawGame(ctx) {
            if (!this.level || !this.player) return;

            const theme = this.level.theme;
            const camX = Math.round(this.camX);
            const camY = Math.round(this.camY);

            // Background
            drawBackground(ctx, theme, this.level.themeName, camX, camY, this.W, this.H, this.frame);

            // Tiles (only draw visible)
            const startCol = Math.max(0, Math.floor(camX / TILE) - 1);
            const endCol = Math.min(this.level.width, Math.ceil((camX + this.W) / TILE) + 1);
            const startRow = Math.max(0, Math.floor(camY / TILE) - 1);
            const endRow = Math.min(this.level.height, Math.ceil((camY + this.H) / TILE) + 1);

            for (let row = startRow; row < endRow; row++) {
                for (let col = startCol; col < endCol; col++) {
                    const tile = this.level.getTile(col, row);
                    if (tile !== T.AIR) {
                        drawTile(ctx, tile, col * TILE - camX, row * TILE - camY, theme, this.frame);
                    }
                }
            }

            // Coins
            for (const coin of this.level.coins) {
                coin.draw(ctx, camX, camY, this.frame);
            }

            // Flag
            drawFlag(ctx, this.level.flag, camX, camY, this.frame);

            // Enemies
            for (const enemy of this.level.enemies) {
                enemy.draw(ctx, camX, camY);
            }

            // Player
            this.player.draw(ctx, camX, camY);

            // Particles
            for (const p of particles) {
                p.draw(ctx, camX, camY);
            }

            // Popup texts
            for (const popup of this.level.popups) {
                popup.draw(ctx, camX, camY);
            }

            // HUD
            drawHUD(ctx, this.player, this.level, this.W);
        }

        _drawPauseOverlay(ctx) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.fillStyle = '#ffffff';
            ctx.font = '24px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', this.W / 2, this.H / 2 - 20);

            if (Math.floor(this.frame / 30) % 2 === 0) {
                ctx.fillStyle = '#aaaaaa';
                ctx.font = '10px "Press Start 2P", monospace';
                ctx.fillText('CLICK OR PRESS ESC TO RESUME', this.W / 2, this.H / 2 + 30);
            }
        }

        _drawLevelComplete(ctx) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, this.W, this.H);

            // Firework particles
            if (this.levelCompleteTimer < 60 && this.levelCompleteTimer % 10 === 0) {
                const colors = ['#ff4444', '#FFD700', '#44ff44', '#4488ff', '#ff44ff'];
                spawnParticles(
                    Math.random() * this.W * 0.6 + this.W * 0.2 + this.camX,
                    Math.random() * this.H * 0.3 + 50 + this.camY,
                    colors[Math.floor(Math.random() * colors.length)],
                    15, 6
                );
            }

            // Text
            ctx.fillStyle = '#FFD700';
            ctx.font = '24px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL COMPLETE!', this.W / 2, this.H / 2 - 40);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('SCORE: ' + this.player.score, this.W / 2, this.H / 2 + 10);
            ctx.fillText('COINS: ' + this.player.coins, this.W / 2, this.H / 2 + 35);

            const timeBonus = Math.ceil(this.level.time) * 10;
            ctx.fillStyle = '#44ff44';
            ctx.fillText('TIME BONUS: +' + timeBonus, this.W / 2, this.H / 2 + 60);

            if (this.levelCompleteTimer > 60) {
                if (Math.floor(this.frame / 25) % 2 === 0) {
                    ctx.fillStyle = '#aaaaaa';
                    ctx.font = '10px "Press Start 2P", monospace';
                    const nextText = this.currentLevel + 1 < LEVEL_DATA.length
                        ? 'CLICK OR ENTER FOR NEXT LEVEL'
                        : 'YOU WON THE GAME! CLICK TO RETURN';
                    ctx.fillText(nextText, this.W / 2, this.H / 2 + 110);
                }
            }
        }

        _drawGameOver(ctx) {
            const grad = ctx.createLinearGradient(0, 0, 0, this.H);
            grad.addColorStop(0, '#1a0000');
            grad.addColorStop(1, '#0a0000');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.W, this.H);

            ctx.fillStyle = '#ff4444';
            ctx.font = '32px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', this.W / 2, this.H / 2 - 40);

            ctx.fillStyle = '#aaaaaa';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('FINAL SCORE: ' + (this.player ? this.player.score : 0), this.W / 2, this.H / 2 + 10);

            if (Math.floor(this.frame / 30) % 2 === 0) {
                ctx.fillStyle = '#666666';
                ctx.font = '10px "Press Start 2P", monospace';
                ctx.fillText('CLICK OR PRESS ENTER TO TRY AGAIN', this.W / 2, this.H / 2 + 60);
            }
        }

        // ============================
        // GAME LOOP
        // ============================
        run() {
            const loop = (time) => {
                if (!this.lastTime) this.lastTime = time;
                this.lastTime = time;

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
        // Init sound on first user interaction
        let soundInitialized = false;
        const initSound = () => {
            if (!soundInitialized) {
                Sound.init();
                soundInitialized = true;
            }
        };
        window.addEventListener('click', initSound, { once: true });
        window.addEventListener('keydown', initSound, { once: true });
        window.addEventListener('touchstart', initSound, { once: true });

        // Init input
        Input.init();

        // Create and run game
        const game = new Game();
        game.run();
    });

})();

