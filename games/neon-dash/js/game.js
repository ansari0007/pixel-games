/* ==========================================================================
   NEON DASH — Pure HTML5 Canvas & Web Audio API
   Retro Synthwave Geometry Rhythm Runner
   ========================================================================== */

(function () {
    'use strict';

    // --- Audio Engine (Procedural Synthwave Chiptune & FX) ---
    class NeonAudio {
        constructor() {
            this.ctx = null;
            this.enabled = true;
            this.masterVolume = 0.35;
            this.musicTimer = null;
            this.beatIndex = 0;
            this.bpm = 130;
            this.isPlayingMusic = false;

            // Load saved audio preference
            const saved = localStorage.getItem('neon_dash_sound');
            if (saved !== null) {
                this.enabled = saved === 'true';
            }
        }

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
        }

        toggleSound() {
            this.enabled = !this.enabled;
            localStorage.setItem('neon_dash_sound', this.enabled);
            if (!this.enabled && this.isPlayingMusic) {
                this.stopMusic();
            } else if (this.enabled && !this.isPlayingMusic) {
                this.startMusic();
            }
            return this.enabled;
        }

        playTone(freq, duration, type = 'sine', decay = true, vol = 1.0) {
            if (!this.enabled || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = type;
                osc.frequency.setValueAtTime(freq, now);

                const finalVol = this.masterVolume * vol;
                gain.gain.setValueAtTime(finalVol, now);
                if (decay) {
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
                }

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + duration);
            } catch (e) {}
        }

        playJump() {
            if (!this.enabled || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);

                gain.gain.setValueAtTime(this.masterVolume * 0.45, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
            } catch (e) {}
        }

        playBouncePad() {
            if (!this.enabled || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);

                gain.gain.setValueAtTime(this.masterVolume * 0.7, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } catch (e) {}
        }

        playRingHit() {
            if (!this.enabled || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                [660, 990, 1320].forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.03);
                    gain.gain.setValueAtTime(this.masterVolume * 0.4, now + idx * 0.03);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.03);
                    osc.stop(now + 0.22);
                });
            } catch (e) {}
        }

        playGravityFlip() {
            if (!this.enabled || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.24);

                gain.gain.setValueAtTime(this.masterVolume * 0.6, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } catch (e) {}
        }

        playCoin() {
            if (!this.enabled || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(987.77, now); // B5
                osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
                gain.gain.setValueAtTime(this.masterVolume * 0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.26);
            } catch (e) {}
        }

        playCrash() {
            if (!this.enabled || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;

                // White noise burst
                const bufferSize = this.ctx.sampleRate * 0.3;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
                }

                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1000, now);
                filter.frequency.exponentialRampToValueAtTime(80, now + 0.3);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(this.masterVolume * 0.9, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                noise.start(now);

                // Deep sub boom
                const osc = this.ctx.createOscillator();
                const oscGain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(120, now);
                osc.frequency.exponentialRampToValueAtTime(25, now + 0.3);
                oscGain.gain.setValueAtTime(this.masterVolume * 0.8, now);
                oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(oscGain);
                oscGain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.32);
            } catch (e) {}
        }

        playVictory() {
            if (!this.enabled || !this.ctx) return;
            const melody = [523.25, 659.25, 783.99, 1046.50]; // C E G C
            melody.forEach((f, i) => {
                setTimeout(() => this.playTone(f, 0.25, 'triangle', true, 0.6), i * 120);
            });
        }

        // --- Synthwave Rhythm Music Sequencer ---
        startMusic() {
            if (!this.enabled || this.isPlayingMusic) return;
            this.init();
            if (!this.ctx) return;
            this.isPlayingMusic = true;
            this.beatIndex = 0;

            const stepDuration = (60 / this.bpm) / 4; // 16th notes
            const chordAm = [110, 130.81, 164.81, 220]; // A2, C3, E3, A3
            const chordF  = [87.31, 110, 130.81, 174.61]; // F2, A2, C3, F3
            const chordC  = [130.81, 164.81, 196, 261.63]; // C3, E3, G3, C4
            const chordG  = [98.00, 123.47, 146.83, 196]; // G2, B2, D3, G3
            const chords = [chordAm, chordF, chordC, chordG];

            this.musicTimer = setInterval(() => {
                if (!this.enabled || !this.isPlayingMusic || !this.ctx) return;

                const chordIdx = Math.floor(this.beatIndex / 16) % chords.length;
                const currentChord = chords[chordIdx];
                const noteInBar = this.beatIndex % 16;
                const noteFreq = currentChord[noteInBar % 4];

                // Synth Bass Note (every 16th note)
                this.playTone(noteFreq, stepDuration * 0.85, 'sawtooth', true, 0.28);

                // Four-on-the-floor Kick (beats 0, 4, 8, 12)
                if (noteInBar % 4 === 0) {
                    try {
                        const now = this.ctx.currentTime;
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.frequency.setValueAtTime(140, now);
                        osc.frequency.exponentialRampToValueAtTime(35, now + 0.1);
                        gain.gain.setValueAtTime(this.masterVolume * 0.7, now);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(now);
                        osc.stop(now + 0.12);
                    } catch (e) {}
                }

                // Snare on beats 4 and 12
                if (noteInBar === 4 || noteInBar === 12) {
                    try {
                        const now = this.ctx.currentTime;
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(220, now);
                        gain.gain.setValueAtTime(this.masterVolume * 0.4, now);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(now);
                        osc.stop(now + 0.1);
                    } catch (e) {}
                }

                // Hi-Hat ticks
                if (noteInBar % 2 === 0) {
                    this.playTone(1800, 0.03, 'sine', true, 0.1);
                }

                this.beatIndex++;
            }, stepDuration * 1000);
        }

        stopMusic() {
            this.isPlayingMusic = false;
            if (this.musicTimer) {
                clearInterval(this.musicTimer);
                this.musicTimer = null;
            }
        }
    }

    // --- Particle System ---
    class ParticleSystem {
        constructor() {
            this.particles = [];
            this.rings = [];
        }

        spawnDust(x, y, color = '#00f0ff', count = 8, speed = 120) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = (Math.random() * 0.7 + 0.3) * speed;
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd,
                    size: Math.random() * 4 + 2,
                    color,
                    alpha: 1.0,
                    life: Math.random() * 0.3 + 0.2
                });
            }
        }

        spawnShatter(x, y, color = '#00f0ff') {
            const colors = [color, '#ffffff', '#ff007f', '#ffea00'];
            for (let i = 0; i < 28; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = Math.random() * 380 + 100;
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd - 100,
                    size: Math.random() * 7 + 3,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    rot: Math.random() * Math.PI,
                    vrot: (Math.random() - 0.5) * 12,
                    alpha: 1.0,
                    life: Math.random() * 0.8 + 0.5,
                    gravity: 900
                });
            }
        }

        spawnRingShockwave(x, y, color = '#ff007f') {
            this.rings.push({
                x, y,
                radius: 10,
                maxRadius: 75,
                color,
                alpha: 1.0,
                growth: 260
            });
        }

        update(dt) {
            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                if (p.gravity) p.vy += p.gravity * dt;
                if (p.vrot) p.rot += p.vrot * dt;

                p.alpha -= dt / p.life;
                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                }
            }

            // Update rings
            for (let i = this.rings.length - 1; i >= 0; i--) {
                const r = this.rings[i];
                r.radius += r.growth * dt;
                r.alpha = Math.max(0, 1 - (r.radius / r.maxRadius));
                if (r.radius >= r.maxRadius || r.alpha <= 0) {
                    this.rings.splice(i, 1);
                }
            }
        }

        draw(ctx, cameraX) {
            ctx.save();
            // Draw shockwave rings
            for (const r of this.rings) {
                ctx.save();
                ctx.strokeStyle = r.color;
                ctx.globalAlpha = r.alpha;
                ctx.lineWidth = 3;
                ctx.shadowColor = r.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(r.x - cameraX, r.y, r.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // Draw particles
            for (const p of this.particles) {
                ctx.save();
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;

                if (p.rot !== undefined) {
                    ctx.translate(p.x - cameraX, p.y);
                    ctx.rotate(p.rot);
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                } else {
                    ctx.fillRect(p.x - cameraX, p.y, p.size, p.size);
                }
                ctx.restore();
            }
            ctx.restore();
        }

        clear() {
            this.particles.length = 0;
            this.rings.length = 0;
        }
    }

    // --- Level Stage Generator ---
    class StageBuilder {
        static getStage(stageIndex) {
            switch (stageIndex) {
                case 0: return StageBuilder.buildStage1();
                case 1: return StageBuilder.buildStage2();
                case 2: return StageBuilder.buildStage3();
                case 3: default: return StageBuilder.buildEndlessStage();
            }
        }

        static buildStage1() {
            // Stage 1: CYBER PULSE (Beginner, intro to rhythm jumping and yellow pads)
            const objects = [];
            const GROUND_Y = 440;
            const BLOCK_SIZE = 40;

            // Spikes, platforms, launch pads
            const pattern = [
                { type: 'spike', x: 500 },
                { type: 'spike', x: 750 },
                { type: 'spike', x: 1000 },
                { type: 'spike', x: 1040 }, // Double spike
                { type: 'block', x: 1300, y: GROUND_Y - BLOCK_SIZE, w: BLOCK_SIZE * 3, h: BLOCK_SIZE },
                { type: 'coin',  x: 1360, y: GROUND_Y - BLOCK_SIZE - 40 },
                { type: 'spike', x: 1550 },
                { type: 'pad',   x: 1800, y: GROUND_Y }, // Mega bounce
                { type: 'spike', x: 1880 },
                { type: 'spike', x: 1920 },
                { type: 'spike', x: 1960 },
                { type: 'block', x: 2150, y: GROUND_Y - BLOCK_SIZE, w: BLOCK_SIZE * 4, h: BLOCK_SIZE },
                { type: 'block', x: 2310, y: GROUND_Y - BLOCK_SIZE * 2, w: BLOCK_SIZE * 3, h: BLOCK_SIZE * 2 },
                { type: 'spike', x: 2470 },
                { type: 'ring',  x: 2700, y: 320 }, // Mid-air ring
                { type: 'spike', x: 2680 },
                { type: 'spike', x: 2720 },
                { type: 'coin',  x: 2900, y: 220 },
                { type: 'block', x: 3100, y: GROUND_Y - BLOCK_SIZE, w: BLOCK_SIZE * 2, h: BLOCK_SIZE },
                { type: 'pad',   x: 3300, y: GROUND_Y },
                { type: 'spike', x: 3380 },
                { type: 'spike', x: 3420 },
                { type: 'coin',  x: 3500, y: 200 }
            ];

            pattern.forEach(p => {
                if (p.type === 'spike') {
                    objects.push({ type: 'spike', x: p.x, y: GROUND_Y - 36, w: 36, h: 36, dir: 'up' });
                } else if (p.type === 'block') {
                    objects.push({ type: 'block', x: p.x, y: p.y, w: p.w, h: p.h });
                } else if (p.type === 'pad') {
                    objects.push({ type: 'pad', x: p.x, y: p.y - 10, w: 44, h: 10 });
                } else if (p.type === 'ring') {
                    objects.push({ type: 'ring', x: p.x, y: p.y, radius: 22 });
                } else if (p.type === 'coin') {
                    objects.push({ type: 'coin', x: p.x, y: p.y, radius: 14, collected: false });
                }
            });

            return {
                id: 0,
                name: 'CYBER PULSE',
                speed: 370,
                length: 3900,
                objects
            };
        }

        static buildStage2() {
            // Stage 2: GRAVITY SHIFT (Gravity portals, upside down ceiling running)
            const objects = [];
            const GROUND_Y = 440;
            const CEIL_Y = 80;
            const B = 40;

            const pattern = [
                { type: 'spike', x: 450, y: GROUND_Y - 36, dir: 'up' },
                { type: 'spike', x: 700, y: GROUND_Y - 36, dir: 'up' },
                { type: 'spike', x: 740, y: GROUND_Y - 36, dir: 'up' },
                // Blue Gravity Portal: Inverts gravity to ceiling
                { type: 'portal_up', x: 950, y: 260 },
                { type: 'spike', x: 1200, y: CEIL_Y, dir: 'down' },
                { type: 'spike', x: 1400, y: CEIL_Y, dir: 'down' },
                { type: 'spike', x: 1440, y: CEIL_Y, dir: 'down' },
                { type: 'coin',  x: 1600, y: CEIL_Y + 70 },
                { type: 'block', x: 1750, y: CEIL_Y, w: B * 3, h: B },
                { type: 'spike', x: 1950, y: CEIL_Y, dir: 'down' },
                // Orange Portal: Restores gravity to floor
                { type: 'portal_down', x: 2150, y: 260 },
                { type: 'spike', x: 2350, y: GROUND_Y - 36, dir: 'up' },
                { type: 'ring',  x: 2550, y: 310 },
                { type: 'spike', x: 2530, y: GROUND_Y - 36, dir: 'up' },
                { type: 'spike', x: 2570, y: GROUND_Y - 36, dir: 'up' },
                { type: 'pad',   x: 2800, y: GROUND_Y },
                { type: 'spike', x: 2880, y: GROUND_Y - 36, dir: 'up' },
                { type: 'spike', x: 2920, y: GROUND_Y - 36, dir: 'up' },
                { type: 'portal_up', x: 3150, y: 260 },
                { type: 'spike', x: 3400, y: CEIL_Y, dir: 'down' },
                { type: 'coin',  x: 3600, y: CEIL_Y + 80 },
                { type: 'portal_down', x: 3850, y: 260 },
                { type: 'spike', x: 4100, y: GROUND_Y - 36, dir: 'up' },
                { type: 'spike', x: 4140, y: GROUND_Y - 36, dir: 'up' }
            ];

            pattern.forEach(p => {
                if (p.type === 'spike') {
                    objects.push({ type: 'spike', x: p.x, y: p.y, w: 36, h: 36, dir: p.dir });
                } else if (p.type === 'block') {
                    objects.push({ type: 'block', x: p.x, y: p.y, w: p.w, h: p.h });
                } else if (p.type === 'pad') {
                    objects.push({ type: 'pad', x: p.x, y: p.y - 10, w: 44, h: 10 });
                } else if (p.type === 'ring') {
                    objects.push({ type: 'ring', x: p.x, y: p.y, radius: 22 });
                } else if (p.type === 'portal_up') {
                    objects.push({ type: 'portal_up', x: p.x, y: p.y, w: 40, h: 120 });
                } else if (p.type === 'portal_down') {
                    objects.push({ type: 'portal_down', x: p.x, y: p.y, w: 40, h: 120 });
                } else if (p.type === 'coin') {
                    objects.push({ type: 'coin', x: p.x, y: p.y, radius: 14, collected: false });
                }
            });

            return {
                id: 1,
                name: 'GRAVITY SHIFT',
                speed: 400,
                length: 4600,
                objects
            };
        }

        static buildStage3() {
            // Stage 3: NEON OVERDRIVE (High speed, fast rhythm, tight obstacles)
            const objects = [];
            const GROUND_Y = 440;
            const CEIL_Y = 80;
            const B = 40;

            const pattern = [
                { type: 'spike', x: 450, y: GROUND_Y - 36, dir: 'up' },
                { type: 'spike', x: 680, y: GROUND_Y - 36, dir: 'up' },
                { type: 'pad',   x: 900, y: GROUND_Y },
                { type: 'spike', x: 980, y: GROUND_Y - 36, dir: 'up' },
                { type: 'spike', x: 1020, y: GROUND_Y - 36, dir: 'up' },
                { type: 'ring',  x: 1250, y: 270 },
                { type: 'ring',  x: 1450, y: 220 },
                { type: 'portal_up', x: 1650, y: 260 },
                { type: 'spike', x: 1900, y: CEIL_Y, dir: 'down' },
                { type: 'spike', x: 1940, y: CEIL_Y, dir: 'down' },
                { type: 'pad',   x: 2150, y: CEIL_Y + 10, dir: 'down' },
                { type: 'spike', x: 2250, y: CEIL_Y, dir: 'down' },
                { type: 'portal_down', x: 2500, y: 260 },
                { type: 'block', x: 2750, y: GROUND_Y - B, w: B * 3, h: B },
                { type: 'spike', x: 2950, y: GROUND_Y - 36, dir: 'up' },
                { type: 'ring',  x: 3200, y: 280 },
                { type: 'portal_up', x: 3450, y: 260 },
                { type: 'spike', x: 3700, y: CEIL_Y, dir: 'down' },
                { type: 'coin',  x: 3900, y: CEIL_Y + 70 },
                { type: 'portal_down', x: 4100, y: 260 },
                { type: 'spike', x: 4350, y: GROUND_Y - 36, dir: 'up' },
                { type: 'spike', x: 4390, y: GROUND_Y - 36, dir: 'up' },
                { type: 'spike', x: 4430, y: GROUND_Y - 36, dir: 'up' },
                { type: 'coin',  x: 4600, y: 220 },
                { type: 'spike', x: 4850, y: GROUND_Y - 36, dir: 'up' }
            ];

            pattern.forEach(p => {
                if (p.type === 'spike') {
                    objects.push({ type: 'spike', x: p.x, y: p.y, w: 36, h: 36, dir: p.dir || 'up' });
                } else if (p.type === 'block') {
                    objects.push({ type: 'block', x: p.x, y: p.y, w: p.w, h: p.h });
                } else if (p.type === 'pad') {
                    objects.push({ type: 'pad', x: p.x, y: p.dir === 'down' ? p.y : p.y - 10, w: 44, h: 10, dir: p.dir || 'up' });
                } else if (p.type === 'ring') {
                    objects.push({ type: 'ring', x: p.x, y: p.y, radius: 22 });
                } else if (p.type === 'portal_up') {
                    objects.push({ type: 'portal_up', x: p.x, y: p.y, w: 40, h: 120 });
                } else if (p.type === 'portal_down') {
                    objects.push({ type: 'portal_down', x: p.x, y: p.y, w: 40, h: 120 });
                } else if (p.type === 'coin') {
                    objects.push({ type: 'coin', x: p.x, y: p.y, radius: 14, collected: false });
                }
            });

            return {
                id: 2,
                name: 'NEON OVERDRIVE',
                speed: 435,
                length: 5300,
                objects
            };
        }

        static buildEndlessStage() {
            return {
                id: 3,
                name: 'ENDLESS DASH',
                speed: 380,
                length: Infinity,
                isEndless: true,
                objects: [],
                nextSpawnX: 600
            };
        }
    }

    // --- Main Game Engine ---
    class NeonDashGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.audio = new NeonAudio();
            this.particles = new ParticleSystem();

            // Virtual standard resolution (16:9)
            this.V_WIDTH = 960;
            this.V_HEIGHT = 540;
            this.canvas.width = this.V_WIDTH;
            this.canvas.height = this.V_HEIGHT;

            this.GROUND_Y = 440;
            this.CEIL_Y = 80;

            // State
            this.state = 'READY'; // READY, PLAYING, PAUSED, DEAD, COMPLETE
            this.currentStageIndex = 0;
            this.stage = StageBuilder.getStage(this.currentStageIndex);

            // Player properties
            this.player = {
                size: 36,
                screenX: 200,
                y: this.GROUND_Y - 36,
                vy: 0,
                rotation: 0,
                targetRotation: 0,
                gravity: 2100, // standard downwards
                jumpPower: 670,
                grounded: true,
                trail: [],
                color: '#00f0ff',
                coreColor: '#ffffff'
            };

            this.cameraX = 0;
            this.attempt = 1;
            this.coinsCollected = 0;
            this.score = 0;
            this.highScore = parseInt(localStorage.getItem('neon_dash_highscore') || '0', 10);
            this.shakeTimer = 0;
            this.shakeIntensity = 0;

            // Jump buffering & input tracking
            this.jumpBuffered = false;
            this.jumpBufferTime = 0;
            this.isHoldingJump = false;

            this.lastTime = performance.now();

            this.initDOM();
            this.initEvents();
            this.updateProgressBar();

            // Start Animation Loop
            requestAnimationFrame((t) => this.loop(t));
        }

        initDOM() {
            this.progressBar = document.getElementById('progress-bar-fill');
            this.progressText = document.getElementById('progress-text');
            this.btnSound = document.getElementById('btn-sound');
            this.btnPause = document.getElementById('btn-pause');
            this.btnRestart = document.getElementById('btn-restart');
            this.btnStages = document.getElementById('btn-stages');
            this.stageModal = document.getElementById('stage-modal');
            this.btnCloseStages = document.getElementById('btn-close-stages');
            this.tapPrompt = document.getElementById('tap-prompt');

            // Set sound button text
            if (this.btnSound) {
                this.btnSound.textContent = this.audio.enabled ? '🔊 SOUND' : '🔇 MUTED';
            }
        }

        initEvents() {
            // Screen resizing
            window.addEventListener('resize', () => this.resizeCanvas());
            this.resizeCanvas();

            // Keyboard
            window.addEventListener('keydown', (e) => {
                if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                    e.preventDefault();
                    this.onJumpPress();
                } else if (e.code === 'KeyP' || e.code === 'Escape') {
                    e.preventDefault();
                    this.togglePause();
                } else if (e.code === 'KeyR') {
                    e.preventDefault();
                    this.restart();
                }
            });

            window.addEventListener('keyup', (e) => {
                if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                    this.isHoldingJump = false;
                }
            });

            // Touch / Mouse controls
            const container = document.getElementById('game-container');
            const handleStart = (e) => {
                // If clicked a button or modal, ignore
                if (e.target.closest('.action-btn') || e.target.closest('.back-btn') || e.target.closest('.modal-box')) {
                    return;
                }
                e.preventDefault();
                this.audio.init();
                this.onJumpPress();
            };

            const handleEnd = (e) => {
                this.isHoldingJump = false;
            };

            container.addEventListener('pointerdown', handleStart);
            container.addEventListener('pointerup', handleEnd);
            container.addEventListener('pointercancel', handleEnd);

            // Top HUD buttons
            if (this.btnSound) {
                this.btnSound.addEventListener('click', () => {
                    const enabled = this.audio.toggleSound();
                    this.btnSound.textContent = enabled ? '🔊 SOUND' : '🔇 MUTED';
                });
            }

            if (this.btnPause) {
                this.btnPause.addEventListener('click', () => this.togglePause());
            }

            if (this.btnRestart) {
                this.btnRestart.addEventListener('click', () => this.restart());
            }

            if (this.btnStages) {
                this.btnStages.addEventListener('click', () => {
                    this.openStageModal();
                });
            }

            if (this.btnCloseStages) {
                this.btnCloseStages.addEventListener('click', () => {
                    this.closeStageModal();
                });
            }

            // Stage Select buttons
            document.querySelectorAll('.stage-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const stg = parseInt(btn.dataset.stage, 10);
                    this.selectStage(stg);
                    this.closeStageModal();
                });
            });
        }

        resizeCanvas() {
            // Keep 16:9 virtual canvas cleanly scaled on screen
            const cont = document.getElementById('game-container');
            if (!cont) return;
            const w = cont.clientWidth;
            const h = cont.clientHeight;
            const aspect = 16 / 9;

            let finalW = w;
            let finalH = w / aspect;

            if (finalH > h) {
                finalH = h;
                finalW = h * aspect;
            }

            this.canvas.style.width = `${Math.floor(finalW * 0.98)}px`;
            this.canvas.style.height = `${Math.floor(finalH * 0.98)}px`;
        }

        onJumpPress() {
            if (this.state === 'READY') {
                this.state = 'PLAYING';
                if (this.tapPrompt) this.tapPrompt.style.display = 'none';
                this.audio.startMusic();
            } else if (this.state === 'DEAD') {
                this.restart();
                return;
            } else if (this.state === 'COMPLETE') {
                this.nextStage();
                return;
            } else if (this.state === 'PAUSED') {
                this.togglePause();
                return;
            }

            this.isHoldingJump = true;
            this.tryJump();
        }

        tryJump() {
            if (this.state !== 'PLAYING') return;

            // Check if inside a jump ring
            const ring = this.findNearbyRing();
            if (ring) {
                this.activateRing(ring);
                return;
            }

            // Normal Jump if grounded
            if (this.player.grounded) {
                this.executeJump();
            } else {
                // Buffer jump if near ground/ceiling
                this.jumpBuffered = true;
                this.jumpBufferTime = 0.14; // 140ms buffer
            }
        }

        executeJump() {
            const dir = this.player.gravity > 0 ? -1 : 1;
            this.player.vy = dir * this.player.jumpPower;
            this.player.grounded = false;
            this.audio.playJump();

            // Spawn jump dust
            const dustY = this.player.gravity > 0 ? this.player.y + this.player.size : this.player.y;
            this.particles.spawnDust(this.cameraX + this.player.screenX + this.player.size / 2, dustY, '#00f0ff', 6);
        }

        findNearbyRing() {
            const px = this.cameraX + this.player.screenX + this.player.size / 2;
            const py = this.player.y + this.player.size / 2;
            const activateDist = 38;

            for (const obj of this.stage.objects) {
                if (obj.type === 'ring') {
                    const dx = px - obj.x;
                    const dy = py - obj.y;
                    if (Math.hypot(dx, dy) <= activateDist) {
                        return obj;
                    }
                }
            }
            return null;
        }

        activateRing(ring) {
            const dir = this.player.gravity > 0 ? -1 : 1;
            this.player.vy = dir * (this.player.jumpPower * 1.05);
            this.player.grounded = false;
            this.audio.playRingHit();
            this.particles.spawnRingShockwave(ring.x, ring.y, '#ff007f');
            this.triggerScreenShake(4, 0.15);
        }

        triggerScreenShake(intensity, duration) {
            this.shakeIntensity = intensity;
            this.shakeTimer = duration;
        }

        togglePause() {
            if (this.state === 'PLAYING') {
                this.state = 'PAUSED';
                this.audio.stopMusic();
                if (this.btnPause) this.btnPause.textContent = '▶ RESUME';
            } else if (this.state === 'PAUSED') {
                this.state = 'PLAYING';
                this.audio.startMusic();
                if (this.btnPause) this.btnPause.textContent = '⏸ PAUSE';
            }
        }

        openStageModal() {
            if (this.state === 'PLAYING') this.togglePause();
            if (this.stageModal) {
                this.stageModal.classList.remove('hidden');
                document.querySelectorAll('.stage-btn').forEach(btn => {
                    const stg = parseInt(btn.dataset.stage, 10);
                    btn.classList.toggle('active', stg === this.currentStageIndex);
                });
            }
        }

        closeStageModal() {
            if (this.stageModal) {
                this.stageModal.classList.add('hidden');
            }
        }

        selectStage(index) {
            this.currentStageIndex = index;
            this.stage = StageBuilder.getStage(index);
            this.attempt = 1;
            this.restart();
        }

        nextStage() {
            this.currentStageIndex = (this.currentStageIndex + 1) % 4;
            this.selectStage(this.currentStageIndex);
        }

        restart() {
            this.cameraX = 0;
            this.player.y = this.GROUND_Y - this.player.size;
            this.player.vy = 0;
            this.player.gravity = 2100;
            this.player.rotation = 0;
            this.player.grounded = true;
            this.player.trail.length = 0;
            this.jumpBuffered = false;
            this.shakeTimer = 0;
            this.particles.clear();
            this.coinsCollected = 0;
            this.score = 0;

            // Reset coins collected flag in current stage
            this.stage = StageBuilder.getStage(this.currentStageIndex);

            this.state = 'PLAYING';
            this.audio.stopMusic();
            this.audio.startMusic();
            if (this.tapPrompt) this.tapPrompt.style.display = 'none';
            if (this.btnPause) this.btnPause.textContent = '⏸ PAUSE';
            this.updateProgressBar();
        }

        die() {
            if (this.state === 'DEAD') return;
            this.state = 'DEAD';
            this.attempt++;
            this.audio.stopMusic();
            this.audio.playCrash();
            this.triggerScreenShake(12, 0.4);

            const px = this.cameraX + this.player.screenX + this.player.size / 2;
            const py = this.player.y + this.player.size / 2;
            this.particles.spawnShatter(px, py, this.player.color);
        }

        completeLevel() {
            if (this.state === 'COMPLETE') return;
            this.state = 'COMPLETE';
            this.audio.stopMusic();
            this.audio.playVictory();
            this.triggerScreenShake(6, 0.3);

            // Celebration confetti
            const px = this.cameraX + this.player.screenX;
            for (let i = 0; i < 4; i++) {
                setTimeout(() => {
                    this.particles.spawnDust(px + Math.random() * 200 - 100, 200 + Math.random() * 100, '#ffea00', 16, 200);
                }, i * 150);
            }
        }

        // --- Main Update Loop ---
        update(dt) {
            // Screen shake
            if (this.shakeTimer > 0) {
                this.shakeTimer -= dt;
                if (this.shakeTimer <= 0) this.shakeIntensity = 0;
            }

            this.particles.update(dt);

            if (this.state !== 'PLAYING') return;

            // Camera movement
            const prevCameraX = this.cameraX;
            this.cameraX += this.stage.speed * dt;
            this.score = Math.floor(this.cameraX / 10);
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('neon_dash_highscore', this.highScore);
            }

            // Endless mode procedural object generation
            if (this.stage.isEndless) {
                this.generateEndlessObjects();
            }

            // Jump buffer tick
            if (this.jumpBuffered) {
                this.jumpBufferTime -= dt;
                if (this.jumpBufferTime <= 0) {
                    this.jumpBuffered = false;
                }
            }

            // Player Physics
            this.player.vy += this.player.gravity * dt;
            this.player.y += this.player.vy * dt;

            // Rotation logic
            if (this.player.grounded) {
                // Snap rotation to nearest 90 deg (Math.PI / 2)
                const step = Math.PI / 2;
                const target = Math.round(this.player.rotation / step) * step;
                this.player.rotation += (target - this.player.rotation) * 15 * dt;
            } else {
                // Spin in air
                const spinDir = this.player.gravity > 0 ? 1 : -1;
                this.player.rotation += spinDir * 8.5 * dt;
            }

            // Record trail
            this.player.trail.push({
                x: this.cameraX + this.player.screenX,
                y: this.player.y,
                rot: this.player.rotation,
                alpha: 0.6
            });
            if (this.player.trail.length > 6) {
                this.player.trail.shift();
            }

            // Collision check against floor & ceiling
            this.player.grounded = false;

            if (this.player.gravity > 0) {
                // Falling towards floor
                if (this.player.y >= this.GROUND_Y - this.player.size) {
                    this.player.y = this.GROUND_Y - this.player.size;
                    this.player.vy = 0;
                    this.player.grounded = true;
                }
            } else {
                // Rising towards ceiling
                if (this.player.y <= this.CEIL_Y) {
                    this.player.y = this.CEIL_Y;
                    this.player.vy = 0;
                    this.player.grounded = true;
                }
            }

            // Execute buffered jump if landed
            if (this.player.grounded && (this.jumpBuffered || this.isHoldingJump)) {
                this.jumpBuffered = false;
                this.executeJump();
            }

            // Check stage obstacles collision
            this.checkObstacleCollisions();

            // Check level complete
            if (!this.stage.isEndless && this.cameraX >= this.stage.length) {
                this.completeLevel();
            }

            this.updateProgressBar();
        }

        generateEndlessObjects() {
            // Keep generating random fun obstacles ahead of camera
            const lookahead = this.cameraX + this.V_WIDTH + 400;
            const B = 40;
            while (this.stage.nextSpawnX < lookahead) {
                const x = this.stage.nextSpawnX;
                const patternType = Math.floor(Math.random() * 6);

                if (patternType === 0) {
                    // Single spike
                    this.stage.objects.push({ type: 'spike', x, y: this.GROUND_Y - 36, w: 36, h: 36, dir: 'up' });
                    this.stage.nextSpawnX += 340;
                } else if (patternType === 1) {
                    // Double spike
                    this.stage.objects.push({ type: 'spike', x, y: this.GROUND_Y - 36, w: 36, h: 36, dir: 'up' });
                    this.stage.objects.push({ type: 'spike', x: x + 40, y: this.GROUND_Y - 36, w: 36, h: 36, dir: 'up' });
                    this.stage.nextSpawnX += 420;
                } else if (patternType === 2) {
                    // Jump Pad over triple spikes
                    this.stage.objects.push({ type: 'pad', x, y: this.GROUND_Y - 10, w: 44, h: 10 });
                    this.stage.objects.push({ type: 'spike', x: x + 80, y: this.GROUND_Y - 36, w: 36, h: 36, dir: 'up' });
                    this.stage.objects.push({ type: 'spike', x: x + 120, y: this.GROUND_Y - 36, w: 36, h: 36, dir: 'up' });
                    this.stage.objects.push({ type: 'spike', x: x + 160, y: this.GROUND_Y - 36, w: 36, h: 36, dir: 'up' });
                    this.stage.nextSpawnX += 460;
                } else if (patternType === 3) {
                    // Elevated Block platform with coin
                    this.stage.objects.push({ type: 'block', x, y: this.GROUND_Y - B, w: B * 3, h: B });
                    this.stage.objects.push({ type: 'coin', x: x + 60, y: this.GROUND_Y - B - 40, radius: 14, collected: false });
                    this.stage.nextSpawnX += 380;
                } else if (patternType === 4) {
                    // Mid-air Jump Ring
                    this.stage.objects.push({ type: 'ring', x, y: 300, radius: 22 });
                    this.stage.objects.push({ type: 'spike', x: x - 20, y: this.GROUND_Y - 36, w: 36, h: 36, dir: 'up' });
                    this.stage.objects.push({ type: 'spike', x: x + 20, y: this.GROUND_Y - 36, w: 36, h: 36, dir: 'up' });
                    this.stage.nextSpawnX += 450;
                } else {
                    // Gravity Portal combo
                    const isNormal = this.player.gravity > 0;
                    this.stage.objects.push({
                        type: isNormal ? 'portal_up' : 'portal_down',
                        x, y: 260, w: 40, h: 120
                    });
                    this.stage.nextSpawnX += 500;
                }
            }

            // Cleanup old objects far behind camera
            this.stage.objects = this.stage.objects.filter(obj => obj.x >= this.cameraX - 200);
        }

        checkObstacleCollisions() {
            const px = this.cameraX + this.player.screenX;
            const py = this.player.y;
            const ps = this.player.size;

            // Inset player box for forgiving collision
            const inset = 4;
            const pbox = {
                x: px + inset,
                y: py + inset,
                w: ps - inset * 2,
                h: ps - inset * 2
            };

            for (const obj of this.stage.objects) {
                // Skip objects far off-screen
                if (obj.x < px - 100 || obj.x > px + 150) continue;

                if (obj.type === 'spike') {
                    // Spike triangle collision check (fair inset)
                    if (this.rectIntersect(pbox, { x: obj.x + 8, y: obj.y + 6, w: obj.w - 16, h: obj.h - 10 })) {
                        this.die();
                        return;
                    }
                } else if (obj.type === 'block') {
                    // Solid Block platform
                    if (this.rectIntersect(pbox, obj)) {
                        // Check if landing on top
                        const isFallingDown = this.player.gravity > 0 && this.player.vy >= 0;
                        const isRisingUp = this.player.gravity < 0 && this.player.vy <= 0;

                        if (isFallingDown && pbox.y + pbox.h - (this.player.vy * 0.05) <= obj.y + 12) {
                            // Land on top
                            this.player.y = obj.y - ps;
                            this.player.vy = 0;
                            this.player.grounded = true;
                            if (this.jumpBuffered || this.isHoldingJump) {
                                this.jumpBuffered = false;
                                this.executeJump();
                            }
                        } else if (isRisingUp && pbox.y >= obj.y + obj.h - 14) {
                            // Land on bottom of block while inverted
                            this.player.y = obj.y + obj.h;
                            this.player.vy = 0;
                            this.player.grounded = true;
                            if (this.jumpBuffered || this.isHoldingJump) {
                                this.jumpBuffered = false;
                                this.executeJump();
                            }
                        } else {
                            // Hit side or front of block
                            this.die();
                            return;
                        }
                    }
                } else if (obj.type === 'pad') {
                    // Launch pad collision
                    if (this.rectIntersect(pbox, obj)) {
                        const dir = obj.dir === 'down' ? 1 : -1;
                        this.player.vy = dir * (this.player.jumpPower * 1.35);
                        this.player.grounded = false;
                        this.audio.playBouncePad();
                        this.particles.spawnDust(obj.x + obj.w / 2, obj.y, '#ffea00', 12, 220);
                        this.triggerScreenShake(5, 0.2);
                    }
                } else if (obj.type === 'portal_up') {
                    // Invert gravity to ceiling
                    if (this.rectIntersect(pbox, obj) && this.player.gravity > 0) {
                        this.player.gravity = -2100;
                        this.audio.playGravityFlip();
                        this.particles.spawnRingShockwave(obj.x + obj.w / 2, obj.y + obj.h / 2, '#00f0ff');
                        this.triggerScreenShake(4, 0.15);
                    }
                } else if (obj.type === 'portal_down') {
                    // Restore gravity to floor
                    if (this.rectIntersect(pbox, obj) && this.player.gravity < 0) {
                        this.player.gravity = 2100;
                        this.audio.playGravityFlip();
                        this.particles.spawnRingShockwave(obj.x + obj.w / 2, obj.y + obj.h / 2, '#ff7700');
                        this.triggerScreenShake(4, 0.15);
                    }
                } else if (obj.type === 'coin' && !obj.collected) {
                    // Collect Secret Cyber Coin
                    const cx = obj.x;
                    const cy = obj.y;
                    const playerCenterX = px + ps / 2;
                    const playerCenterY = py + ps / 2;
                    if (Math.hypot(playerCenterX - cx, playerCenterY - cy) <= obj.radius + ps / 2) {
                        obj.collected = true;
                        this.coinsCollected++;
                        this.audio.playCoin();
                        this.particles.spawnDust(cx, cy, '#ffea00', 16, 180);
                    }
                }
            }
        }

        rectIntersect(r1, r2) {
            return !(r2.x > r1.x + r1.w ||
                     r2.x + r2.w < r1.x ||
                     r2.y > r1.y + r1.h ||
                     r2.y + r2.h < r1.y);
        }

        updateProgressBar() {
            if (!this.progressBar || !this.progressText) return;
            if (this.stage.isEndless) {
                this.progressBar.style.width = '100%';
                this.progressText.textContent = `${this.score}m`;
            } else {
                const pct = Math.min(100, Math.floor((this.cameraX / this.stage.length) * 100));
                this.progressBar.style.width = `${pct}%`;
                this.progressText.textContent = `${pct}%`;
            }
        }

        // --- Main Render Loop ---
        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.V_WIDTH, this.V_HEIGHT);

            // Screen shake transform
            ctx.save();
            if (this.shakeIntensity > 0) {
                const sx = (Math.random() - 0.5) * this.shakeIntensity;
                const sy = (Math.random() - 0.5) * this.shakeIntensity;
                ctx.translate(sx, sy);
            }

            // 1. Draw Synthwave Gradient Background
            this.drawBackground(ctx);

            // 2. Draw Floor & Ceiling
            this.drawFloorAndCeiling(ctx);

            // 3. Draw Stage Objects
            this.drawStageObjects(ctx);

            // 4. Draw Particles & Rings
            this.particles.draw(ctx, this.cameraX);

            // 5. Draw Player Cube & Trail
            if (this.state !== 'DEAD') {
                this.drawPlayer(ctx);
            }

            // 6. Draw UI / HUD Overlays
            this.drawHUD(ctx);

            ctx.restore();
        }

        drawBackground(ctx) {
            // Sky gradient
            const grad = ctx.createLinearGradient(0, 0, 0, this.V_HEIGHT);
            grad.addColorStop(0, '#040510');
            grad.addColorStop(0.5, '#120b28');
            grad.addColorStop(1, '#240a38');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.V_WIDTH, this.V_HEIGHT);

            // Distant Synthwave Sun
            const sunX = this.V_WIDTH / 2;
            const sunY = 220;
            const sunRadius = 70;
            const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
            sunGrad.addColorStop(0, '#ffea00');
            sunGrad.addColorStop(0.6, '#ff007f');
            sunGrad.addColorStop(1, '#7700ff');

            ctx.save();
            ctx.fillStyle = sunGrad;
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
            ctx.fill();

            // Sun horizon horizontal blind slats
            ctx.fillStyle = '#0f0822';
            for (let i = 0; i < 5; i++) {
                const slatY = sunY + 12 + i * 11;
                const slatH = 2 + i * 1.5;
                ctx.fillRect(sunX - sunRadius, slatY, sunRadius * 2, slatH);
            }
            ctx.restore();

            // Parallax Grid Lines
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
            ctx.lineWidth = 1;
            const gridOffset = (this.cameraX * 0.4) % 40;

            // Vertical perspective grid lines
            for (let x = -gridOffset; x < this.V_WIDTH; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, 260);
                ctx.lineTo(x - 60, this.GROUND_Y);
                ctx.stroke();
            }

            // Horizontal grid lines
            for (let y = 260; y <= this.GROUND_Y; y += 28) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.V_WIDTH, y);
                ctx.stroke();
            }
            ctx.restore();
        }

        drawFloorAndCeiling(ctx) {
            // Floor
            ctx.save();
            ctx.fillStyle = '#050713';
            ctx.fillRect(0, this.GROUND_Y, this.V_WIDTH, this.V_HEIGHT - this.GROUND_Y);

            // Neon floor rim
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(0, this.GROUND_Y);
            ctx.lineTo(this.V_WIDTH, this.GROUND_Y);
            ctx.stroke();

            // Floor vertical ticks
            const floorTickOffset = this.cameraX % 40;
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 0;
            for (let x = -floorTickOffset; x < this.V_WIDTH; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, this.GROUND_Y);
                ctx.lineTo(x, this.GROUND_Y + 18);
                ctx.stroke();
            }

            // Ceiling
            ctx.fillStyle = '#050713';
            ctx.fillRect(0, 0, this.V_WIDTH, this.CEIL_Y);

            // Neon ceiling rim
            ctx.strokeStyle = '#ff007f';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(0, this.CEIL_Y);
            ctx.lineTo(this.V_WIDTH, this.CEIL_Y);
            ctx.stroke();

            // Ceiling vertical ticks
            const ceilTickOffset = this.cameraX % 40;
            ctx.strokeStyle = 'rgba(255, 0, 127, 0.35)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 0;
            for (let x = -ceilTickOffset; x < this.V_WIDTH; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, this.CEIL_Y);
                ctx.lineTo(x, this.CEIL_Y - 18);
                ctx.stroke();
            }
            ctx.restore();
        }

        drawStageObjects(ctx) {
            ctx.save();
            const cam = this.cameraX;

            for (const obj of this.stage.objects) {
                const screenX = obj.x - cam;
                // Cull offscreen
                if (screenX < -100 || screenX > this.V_WIDTH + 100) continue;

                if (obj.type === 'spike') {
                    // Glowing Neon Triangle Spike
                    ctx.save();
                    ctx.fillStyle = 'rgba(255, 0, 85, 0.25)';
                    ctx.strokeStyle = '#ff0055';
                    ctx.lineWidth = 2.5;
                    ctx.shadowColor = '#ff0055';
                    ctx.shadowBlur = 10;

                    ctx.beginPath();
                    if (obj.dir === 'down') {
                        // Inverted spike from ceiling
                        ctx.moveTo(screenX, obj.y);
                        ctx.lineTo(screenX + obj.w, obj.y);
                        ctx.lineTo(screenX + obj.w / 2, obj.y + obj.h);
                    } else {
                        // Normal spike from floor
                        ctx.moveTo(screenX, obj.y + obj.h);
                        ctx.lineTo(screenX + obj.w / 2, obj.y);
                        ctx.lineTo(screenX + obj.w, obj.y + obj.h);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Inner bright core
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    if (obj.dir === 'down') {
                        ctx.arc(screenX + obj.w / 2, obj.y + 12, 3, 0, Math.PI * 2);
                    } else {
                        ctx.arc(screenX + obj.w / 2, obj.y + obj.h - 12, 3, 0, Math.PI * 2);
                    }
                    ctx.fill();
                    ctx.restore();
                } else if (obj.type === 'block') {
                    // Solid Platform Block
                    ctx.save();
                    ctx.fillStyle = '#0d1326';
                    ctx.fillRect(screenX, obj.y, obj.w, obj.h);

                    ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 8;
                    ctx.strokeRect(screenX, obj.y, obj.w, obj.h);

                    // Inner cross detail
                    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.shadowBlur = 0;
                    ctx.strokeRect(screenX + 5, obj.y + 5, obj.w - 10, obj.h - 10);
                    ctx.restore();
                } else if (obj.type === 'pad') {
                    // Yellow Mega-Bounce Launch Pad
                    ctx.save();
                    ctx.fillStyle = '#ffea00';
                    ctx.shadowColor = '#ffea00';
                    ctx.shadowBlur = 12;
                    ctx.fillRect(screenX, obj.y, obj.w, obj.h);

                    // Pulsing spring glow
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(screenX + 4, obj.y + 2, obj.w - 8, obj.h - 4);
                    ctx.restore();
                } else if (obj.type === 'ring') {
                    // Mid-Air Jump Ring
                    ctx.save();
                    ctx.strokeStyle = '#ff007f';
                    ctx.lineWidth = 3.5;
                    ctx.shadowColor = '#ff007f';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(screenX, obj.y, obj.radius, 0, Math.PI * 2);
                    ctx.stroke();

                    // Inner glowing core
                    ctx.fillStyle = 'rgba(255, 234, 0, 0.8)';
                    ctx.shadowColor = '#ffea00';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(screenX, obj.y, 7, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                } else if (obj.type === 'portal_up') {
                    // Blue Gravity Portal (Inverts gravity)
                    ctx.save();
                    ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
                    ctx.fillRect(screenX, obj.y, obj.w, obj.h);

                    ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 16;
                    ctx.strokeRect(screenX, obj.y, obj.w, obj.h);

                    // Upward neon arrows inside portal
                    ctx.fillStyle = '#00f0ff';
                    ctx.font = '16px "Press Start 2P"';
                    ctx.textAlign = 'center';
                    ctx.fillText('▲', screenX + obj.w / 2, obj.y + 40);
                    ctx.fillText('▲', screenX + obj.w / 2, obj.y + 80);
                    ctx.restore();
                } else if (obj.type === 'portal_down') {
                    // Orange Gravity Portal (Restores floor gravity)
                    ctx.save();
                    ctx.fillStyle = 'rgba(255, 119, 0, 0.2)';
                    ctx.fillRect(screenX, obj.y, obj.w, obj.h);

                    ctx.strokeStyle = '#ff7700';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#ff7700';
                    ctx.shadowBlur = 16;
                    ctx.strokeRect(screenX, obj.y, obj.w, obj.h);

                    // Downward neon arrows inside portal
                    ctx.fillStyle = '#ff7700';
                    ctx.font = '16px "Press Start 2P"';
                    ctx.textAlign = 'center';
                    ctx.fillText('▼', screenX + obj.w / 2, obj.y + 50);
                    ctx.fillText('▼', screenX + obj.w / 2, obj.y + 90);
                    ctx.restore();
                } else if (obj.type === 'coin' && !obj.collected) {
                    // Secret Cyber Star Coin
                    ctx.save();
                    ctx.fillStyle = '#ffea00';
                    ctx.shadowColor = '#ffea00';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(screenX, obj.y, obj.radius, 0, Math.PI * 2);
                    ctx.fill();

                    // Star symbol inside
                    ctx.fillStyle = '#060714';
                    ctx.font = '10px "Press Start 2P"';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('★', screenX, obj.y);
                    ctx.restore();
                }
            }
            ctx.restore();
        }

        drawPlayer(ctx) {
            ctx.save();
            const px = this.player.screenX;
            const py = this.player.y;
            const ps = this.player.size;

            // Draw afterimage trail
            for (let i = 0; i < this.player.trail.length; i++) {
                const t = this.player.trail[i];
                const trailScreenX = t.x - this.cameraX;
                ctx.save();
                ctx.translate(trailScreenX + ps / 2, t.y + ps / 2);
                ctx.rotate(t.rot);
                ctx.fillStyle = this.player.color;
                ctx.globalAlpha = (i + 1) / (this.player.trail.length * 4);
                ctx.fillRect(-ps / 2, -ps / 2, ps, ps);
                ctx.restore();
            }

            // Draw current player cube with rotation
            ctx.translate(px + ps / 2, py + ps / 2);
            ctx.rotate(this.player.rotation);

            // Outer Neon Border
            ctx.fillStyle = '#060714';
            ctx.fillRect(-ps / 2, -ps / 2, ps, ps);

            ctx.strokeStyle = this.player.color;
            ctx.lineWidth = 3;
            ctx.shadowColor = this.player.color;
            ctx.shadowBlur = 14;
            ctx.strokeRect(-ps / 2, -ps / 2, ps, ps);

            // Inner Accent Box
            ctx.fillStyle = this.player.color;
            ctx.fillRect(-ps / 4, -ps / 4, ps / 2, ps / 2);

            // Glowing Cyber Core
            ctx.fillStyle = this.player.coreColor;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 8;
            ctx.fillRect(-4, -4, 8, 8);

            ctx.restore();
        }

        drawHUD(ctx) {
            // Stage Name & Attempts (Top Left)
            ctx.save();
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 6;
            ctx.fillText(this.stage.name, 24, 46);

            ctx.font = '8px "Press Start 2P"';
            ctx.fillStyle = '#ffea00';
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 4;
            ctx.fillText(`ATTEMPT ${this.attempt}`, 24, 64);

            // Score / Coins (Top Right)
            if (this.stage.isEndless) {
                ctx.textAlign = 'right';
                ctx.font = '9px "Press Start 2P"';
                ctx.fillStyle = '#00f0ff';
                ctx.fillText(`BEST: ${this.highScore}m`, this.V_WIDTH - 24, 46);
            } else if (this.coinsCollected > 0) {
                ctx.textAlign = 'right';
                ctx.font = '9px "Press Start 2P"';
                ctx.fillStyle = '#ffea00';
                ctx.fillText(`★ COINS: ${this.coinsCollected}`, this.V_WIDTH - 24, 46);
            }
            ctx.restore();

            // Center Screen Overlays according to State
            if (this.state === 'READY') {
                this.drawReadyScreen(ctx);
            } else if (this.state === 'DEAD') {
                this.drawDeathScreen(ctx);
            } else if (this.state === 'COMPLETE') {
                this.drawVictoryScreen(ctx);
            } else if (this.state === 'PAUSED') {
                this.drawPauseScreen(ctx);
            }
        }

        drawReadyScreen(ctx) {
            ctx.save();
            ctx.fillStyle = 'rgba(6, 7, 20, 0.65)';
            ctx.fillRect(0, 0, this.V_WIDTH, this.V_HEIGHT);

            ctx.textAlign = 'center';
            ctx.font = '26px "Press Start 2P"';
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 20;
            ctx.fillText('NEON DASH', this.V_WIDTH / 2, 210);

            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#ffea00';
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 10;
            ctx.fillText(this.stage.name, this.V_WIDTH / 2, 250);

            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            const blink = Math.sin(performance.now() * 0.006) > 0;
            if (blink) {
                ctx.fillText('TAP SCREEN OR PRESS SPACE TO START', this.V_WIDTH / 2, 330);
            }
            ctx.restore();
        }

        drawDeathScreen(ctx) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 0, 85, 0.2)';
            ctx.fillRect(0, 0, this.V_WIDTH, this.V_HEIGHT);

            ctx.textAlign = 'center';
            ctx.font = '24px "Press Start 2P"';
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 18;
            ctx.fillText('CRASHED!', this.V_WIDTH / 2, 230);

            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.fillText('TAP OR PRESS SPACE TO RETRY', this.V_WIDTH / 2, 280);
            ctx.restore();
        }

        drawVictoryScreen(ctx) {
            ctx.save();
            ctx.fillStyle = 'rgba(6, 7, 20, 0.75)';
            ctx.fillRect(0, 0, this.V_WIDTH, this.V_HEIGHT);

            ctx.textAlign = 'center';
            ctx.font = '24px "Press Start 2P"';
            ctx.fillStyle = '#39ff14';
            ctx.shadowColor = '#39ff14';
            ctx.shadowBlur = 20;
            ctx.fillText('STAGE COMPLETE!', this.V_WIDTH / 2, 190);

            ctx.font = '12px "Press Start 2P"';
            ctx.fillStyle = '#ffea00';
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 10;
            ctx.fillText(`100% CLEAR IN ${this.attempt} ATTEMPTS`, this.V_WIDTH / 2, 240);

            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`★ COINS COLLECTED: ${this.coinsCollected}`, this.V_WIDTH / 2, 280);

            const blink = Math.sin(performance.now() * 0.006) > 0;
            if (blink) {
                ctx.fillStyle = '#00f0ff';
                ctx.fillText('TAP OR PRESS SPACE FOR NEXT STAGE', this.V_WIDTH / 2, 340);
            }
            ctx.restore();
        }

        drawPauseScreen(ctx) {
            ctx.save();
            ctx.fillStyle = 'rgba(6, 7, 20, 0.75)';
            ctx.fillRect(0, 0, this.V_WIDTH, this.V_HEIGHT);

            ctx.textAlign = 'center';
            ctx.font = '22px "Press Start 2P"';
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 15;
            ctx.fillText('PAUSED', this.V_WIDTH / 2, 220);

            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.fillText('PRESS P, ESC OR TAP RESUME TO CONTINUE', this.V_WIDTH / 2, 270);
            ctx.restore();
        }

        loop(time) {
            const dt = Math.min((time - this.lastTime) / 1000, 0.1);
            this.lastTime = time;

            this.update(dt);
            this.draw();

            requestAnimationFrame((t) => this.loop(t));
        }
    }

    // Initialize Game on DOM ready
    window.addEventListener('DOMContentLoaded', () => {
        window.game = new NeonDashGame();
    });
})();
