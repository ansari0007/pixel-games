/* ============================================
   FREE PIXEL GAMES — Website JavaScript
   Background animations, hero scene, card previews
   ============================================ */

// --- Floating Particles Background ---
(function initBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H;
    const particles = [];
    const PARTICLE_COUNT = 60;

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 3 + 1,
            speedY: -(Math.random() * 0.3 + 0.1),
            speedX: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.2,
            color: ['#00ff88', '#44aaff', '#ff4488', '#ffdd00'][Math.floor(Math.random() * 4)]
        });
    }

    function drawParticles() {
        ctx.clearRect(0, 0, W, H);
        for (const p of particles) {
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            // Draw pixel-style square particles
            ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);

            p.x += p.speedX;
            p.y += p.speedY;

            if (p.y < -10) {
                p.y = H + 10;
                p.x = Math.random() * W;
            }
            if (p.x < -10) p.x = W + 10;
            if (p.x > W + 10) p.x = -10;
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(drawParticles);
    }
    drawParticles();
})();


// --- Hero Canvas Animation ---
(function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;  // 320
    const H = canvas.height; // 160

    let frame = 0;

    // Simple pixel art scene
    function drawScene() {
        ctx.clearRect(0, 0, W, H);

        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#1a1a4e');
        grad.addColorStop(1, '#2a2a6e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 20; i++) {
            const sx = (i * 37 + frame * 0.1) % W;
            const sy = (i * 23) % (H - 40);
            const blink = Math.sin(frame * 0.05 + i) > 0.3 ? 1 : 0;
            if (blink) ctx.fillRect(Math.floor(sx), Math.floor(sy), 2, 2);
        }

        // Mountains (background)
        ctx.fillStyle = '#1a1a3e';
        for (let x = 0; x < W; x += 2) {
            const mh = Math.sin(x * 0.02) * 20 + Math.sin(x * 0.05) * 10 + 40;
            ctx.fillRect(x, H - 32 - mh, 2, mh);
        }

        // Ground
        ctx.fillStyle = '#2d8a4e';
        ctx.fillRect(0, H - 32, W, 8);
        ctx.fillStyle = '#8B5E3C';
        ctx.fillRect(0, H - 24, W, 24);

        // Ground detail
        ctx.fillStyle = '#3da85e';
        for (let x = 0; x < W; x += 8) {
            ctx.fillRect(x, H - 34, 4, 2);
        }

        // Platforms
        ctx.fillStyle = '#2d8a4e';
        ctx.fillRect(80, H - 64, 48, 8);
        ctx.fillStyle = '#8B5E3C';
        ctx.fillRect(80, H - 56, 48, 8);

        ctx.fillStyle = '#2d8a4e';
        ctx.fillRect(180, H - 80, 48, 8);
        ctx.fillStyle = '#8B5E3C';
        ctx.fillRect(180, H - 72, 48, 8);

        // Question block
        const qbY = H - 80 + Math.sin(frame * 0.1) * 2;
        ctx.fillStyle = '#FFB800';
        ctx.fillRect(100, qbY, 16, 16);
        ctx.fillStyle = '#CC8800';
        ctx.fillRect(100, qbY, 16, 2);
        ctx.fillRect(100, qbY + 14, 16, 2);
        ctx.fillRect(100, qbY, 2, 16);
        ctx.fillRect(114, qbY, 2, 16);
        // ? mark
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(106, qbY + 4, 4, 2);
        ctx.fillRect(108, qbY + 6, 2, 2);
        ctx.fillRect(106, qbY + 8, 2, 2);
        ctx.fillRect(106, qbY + 11, 2, 2);

        // Coins
        for (let i = 0; i < 3; i++) {
            const coinX = 186 + i * 14;
            const coinY = H - 96 + Math.sin(frame * 0.08 + i) * 3;
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(coinX + 2, coinY, 8, 12);
            ctx.fillStyle = '#FFF4AA';
            ctx.fillRect(coinX + 4, coinY + 2, 2, 8);
        }

        // Player character (running animation)
        const runFrame = Math.floor(frame / 8) % 4;
        const playerX = 40 + Math.sin(frame * 0.03) * 20;
        const playerY = H - 48;
        drawPlayer(ctx, playerX, playerY, runFrame);

        // Enemy (slime)
        const slimeX = 220 + Math.sin(frame * 0.02) * 15;
        const slimeFrame = Math.floor(frame / 12) % 2;
        drawSlime(ctx, slimeX, H - 44, slimeFrame);

        frame++;
        requestAnimationFrame(drawScene);
    }

    function drawPlayer(ctx, x, y, f) {
        // Hat (blue)
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(x + 2, y, 10, 4);
        ctx.fillRect(x, y + 2, 14, 2);
        // Face
        ctx.fillStyle = '#FFD39B';
        ctx.fillRect(x + 2, y + 4, 10, 6);
        // Eyes
        ctx.fillStyle = '#222';
        ctx.fillRect(x + 4, y + 6, 2, 2);
        ctx.fillRect(x + 8, y + 6, 2, 2);
        // Body (red)
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(x + 2, y + 10, 10, 6);
        // Legs (blue)
        ctx.fillStyle = '#3344aa';
        if (f % 2 === 0) {
            ctx.fillRect(x + 2, y + 16, 4, 4);
            ctx.fillRect(x + 8, y + 14, 4, 4);
        } else {
            ctx.fillRect(x + 2, y + 14, 4, 4);
            ctx.fillRect(x + 8, y + 16, 4, 4);
        }
    }

    function drawSlime(ctx, x, y, f) {
        const squish = f === 0 ? 0 : 2;
        ctx.fillStyle = '#44cc44';
        ctx.fillRect(x + 2, y + squish, 12, 12 - squish);
        ctx.fillRect(x, y + 4 + squish, 16, 8 - squish);
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 4, y + 4 + squish, 3, 3);
        ctx.fillRect(x + 9, y + 4 + squish, 3, 3);
        ctx.fillStyle = '#222';
        ctx.fillRect(x + 5, y + 5 + squish, 2, 2);
        ctx.fillRect(x + 10, y + 5 + squish, 2, 2);
    }

    drawScene();
})();


// --- Game Card Thumbnail ---
(function initCardCanvas() {
    const canvas = document.getElementById('card-canvas-1');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    // Draw a static game scene as thumbnail
    function drawThumbnail() {
        // Sky
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#5599ff');
        grad.addColorStop(1, '#aaddff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Clouds
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        drawCloud(60, 40, 40);
        drawCloud(200, 60, 30);
        drawCloud(350, 35, 35);

        // Background hills
        ctx.fillStyle = '#55aa55';
        for (let x = 0; x < W; x += 4) {
            const hillH = Math.sin(x * 0.015) * 25 + Math.sin(x * 0.03) * 15 + 50;
            ctx.fillRect(x, H - 60 - hillH, 4, hillH);
        }

        // Ground
        ctx.fillStyle = '#44aa44';
        ctx.fillRect(0, H - 60, W, 12);
        ctx.fillStyle = '#8B5E3C';
        ctx.fillRect(0, H - 48, W, 48);

        // Grass tufts
        ctx.fillStyle = '#55cc55';
        for (let x = 0; x < W; x += 16) {
            ctx.fillRect(x, H - 64, 8, 4);
        }

        // Platforms
        drawPlatform(120, H - 110, 80);
        drawPlatform(260, H - 140, 64);
        drawPlatform(60, H - 160, 48);

        // Question blocks
        drawQBlock(140, H - 130, 20);
        drawQBlock(280, H - 160, 20);

        // Bricks
        drawBrick(160, H - 130, 20);
        drawBrick(180, H - 130, 20);

        // Coins
        for (let i = 0; i < 3; i++) {
            drawCoin(268 + i * 22, H - 170);
        }

        // Enemies
        drawSlime(340, H - 76, 16);
        drawSlime(180, H - 76, 16);

        // Pipe
        drawPipe(400, H - 100, 32, 40);

        // Player
        drawPlayerChar(100, H - 86, 20);

        // Flag
        drawFlag(440, H - 140);

        // Title overlay
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, W, 50);
        ctx.fillStyle = '#FFD700';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SUPER RUNNER', W / 2, 32);
    }

    function drawCloud(x, y, size) {
        ctx.fillRect(x, y, size, size * 0.4);
        ctx.fillRect(x + size * 0.2, y - size * 0.2, size * 0.6, size * 0.3);
    }

    function drawPlatform(x, y, width) {
        ctx.fillStyle = '#44aa44';
        ctx.fillRect(x, y, width, 8);
        ctx.fillStyle = '#8B5E3C';
        ctx.fillRect(x, y + 8, width, 12);
    }

    function drawQBlock(x, y, size) {
        ctx.fillStyle = '#FFB800';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + size/2 - 3, y + 4, 6, 4);
        ctx.fillRect(x + size/2, y + 8, 3, 3);
        ctx.fillRect(x + size/2 - 2, y + 12, 4, 3);
    }

    function drawBrick(x, y, size) {
        ctx.fillStyle = '#cc6633';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#994422';
        ctx.fillRect(x, y + size/2 - 1, size, 2);
        ctx.fillRect(x + size/2 - 1, y, 2, size);
    }

    function drawCoin(x, y) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF4AA';
        ctx.fillRect(x - 1, y - 3, 2, 6);
    }

    function drawSlime(x, y, size) {
        ctx.fillStyle = '#44cc44';
        ctx.fillRect(x, y, size, size * 0.7);
        ctx.fillRect(x + 2, y - size * 0.2, size - 4, size * 0.3);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 3, y + 2, 4, 3);
        ctx.fillRect(x + size - 7, y + 2, 4, 3);
        ctx.fillStyle = '#222';
        ctx.fillRect(x + 4, y + 3, 2, 2);
        ctx.fillRect(x + size - 6, y + 3, 2, 2);
    }

    function drawPipe(x, y, width, height) {
        ctx.fillStyle = '#33aa33';
        ctx.fillRect(x, y, width, height);
        ctx.fillRect(x - 4, y, width + 8, 12);
        ctx.fillStyle = '#55cc55';
        ctx.fillRect(x + 4, y + 12, 4, height - 12);
        ctx.fillRect(x - 2, y + 2, 4, 8);
    }

    function drawPlayerChar(x, y, size) {
        const s = size;
        // Hat
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(x + s*0.1, y, s*0.8, s*0.25);
        ctx.fillRect(x, y + s*0.1, s, s*0.15);
        // Face
        ctx.fillStyle = '#FFD39B';
        ctx.fillRect(x + s*0.15, y + s*0.25, s*0.7, s*0.3);
        // Eyes
        ctx.fillStyle = '#222';
        ctx.fillRect(x + s*0.3, y + s*0.35, s*0.1, s*0.1);
        ctx.fillRect(x + s*0.55, y + s*0.35, s*0.1, s*0.1);
        // Body
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(x + s*0.15, y + s*0.55, s*0.7, s*0.25);
        // Legs
        ctx.fillStyle = '#3344aa';
        ctx.fillRect(x + s*0.15, y + s*0.8, s*0.25, s*0.2);
        ctx.fillRect(x + s*0.55, y + s*0.8, s*0.25, s*0.2);
    }

    function drawFlag(x, y) {
        ctx.fillStyle = '#888';
        ctx.fillRect(x, y, 4, 80);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(x + 4, y, 24, 16);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x - 2, y - 4, 8, 8);
    }

    drawThumbnail();

    const img = new Image();
    img.src = 'assets/images/super-runner-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 2 Thumbnail (Space Blaster) ---
(function initCardCanvas2() {
    const canvas = document.getElementById('card-canvas-2');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawSpaceThumbnail() {
        // Deep space background
        ctx.fillStyle = '#040410';
        ctx.fillRect(0, 0, W, H);

        // Purple & cyan nebulae
        const g = ctx.createRadialGradient(W * 0.7, H * 0.4, 0, W * 0.7, H * 0.4, 140);
        g.addColorStop(0, 'rgba(180, 0, 255, 0.25)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(W * 0.7, H * 0.4, 140, 0, Math.PI * 2);
        ctx.fill();

        // Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 40; i++) {
            const sx = (i * 47) % W;
            const sy = (i * 31) % H;
            ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
        }

        // Alien fighters (red)
        for (let i = 0; i < 3; i++) {
            const ex = 140 + i * 100;
            const ey = 50 + (i % 2) * 20;
            ctx.fillStyle = '#ff2255';
            ctx.fillRect(ex - 8, ey - 6, 16, 12);
            ctx.fillRect(ex - 14, ey, 28, 6);
            ctx.fillStyle = '#ffee00';
            ctx.fillRect(ex - 2, ey - 2, 4, 4);
        }

        // Player Ship (white & cyan)
        const px = W / 2;
        const py = H - 55;
        // Thrusters
        ctx.fillStyle = '#00aaff';
        ctx.fillRect(px - 4, py + 12, 8, 14);
        // Body
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 4, py - 16, 8, 28);
        ctx.fillRect(px - 14, py, 28, 8);
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(px - 2, py - 10, 4, 8);
        ctx.fillRect(px - 18, py + 4, 36, 6);

        // Lasers firing
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(px - 10, py - 36, 3, 14);
        ctx.fillRect(px + 8, py - 36, 3, 14);

        // Title overlay
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, W, 46);
        ctx.fillStyle = '#00e5ff';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE BLASTER', W / 2, 30);
    }

    drawSpaceThumbnail();

    const img = new Image();
    img.src = 'assets/images/space-blaster-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 3 Thumbnail (Bubble Master) ---
(function initCardCanvas3() {
    const canvas = document.getElementById('card-canvas-3');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawBubbleThumbnail() {
        // Deep purple arcade background
        ctx.fillStyle = '#0c0721';
        ctx.fillRect(0, 0, W, H);

        // Glow gradient in center
        const g = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, 160);
        g.addColorStop(0, 'rgba(0, 229, 255, 0.2)');
        g.addColorStop(0.7, 'rgba(255, 0, 127, 0.1)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(W / 2, H * 0.4, 160, 0, Math.PI * 2);
        ctx.fill();

        // Draw some colorful bubbles
        const colors = ['#ff2b54', '#00e5ff', '#ffea00', '#00e676', '#b388ff', '#ff9100'];
        const rows = [
            [0, 1, 2, 3, 4, 5, 0, 1],
            [2, 3, 4, 5, 0, 1, 2],
            [1, 1, 4, 3, 0, 5, 1, 4]
        ];

        rows.forEach((row, r) => {
            const isOdd = r % 2 !== 0;
            const startX = isOdd ? 45 : 30;
            row.forEach((cIdx, col) => {
                const cx = startX + col * 55;
                const cy = 30 + r * 42;
                const color = colors[cIdx];

                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, 20, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();

                // Bubble shine
                ctx.beginPath();
                ctx.arc(cx - 6, cy - 6, 6, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fill();
                ctx.restore();
            });
        });

        // Shooter cannon at bottom
        const sx = W / 2;
        const sy = H - 30;
        ctx.save();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 25, sy - 50);
        ctx.stroke();

        // Shooter bubble
        ctx.beginPath();
        ctx.arc(sx, sy, 22, 0, Math.PI * 2);
        ctx.fillStyle = '#00e5ff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx - 7, sy - 7, 7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fill();
        ctx.restore();

        // Title overlay
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, W, 46);
        ctx.fillStyle = '#00e5ff';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BUBBLE MASTER', W / 2, 30);
    }

    drawBubbleThumbnail();

    const img = new Image();
    img.src = 'assets/images/bubble-master-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 4 Thumbnail (Candy Smash) ---
(function initCardCanvas4() {
    const canvas = document.getElementById('card-canvas-4');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawCandyThumbnail() {
        // Deep purple candy background
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#261245');
        g.addColorStop(0.5, '#3a1a63');
        g.addColorStop(1, '#150826');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // Candy checkerboard preview
        const cols = 8;
        const rows = 4;
        const tileSize = 44;
        const startX = (W - cols * tileSize) / 2;
        const startY = 65;

        const colors = ['#ff2255', '#ff8800', '#ffea00', '#00e676', '#00b0ff', '#aa00ff'];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const tx = startX + c * tileSize;
                const ty = startY + r * tileSize;
                ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(55, 25, 95, 0.7)' : 'rgba(38, 16, 68, 0.7)';
                ctx.fillRect(tx, ty, tileSize, tileSize);
                ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                ctx.strokeRect(tx, ty, tileSize, tileSize);

                // Candy gem
                const colorIdx = (r * 3 + c * 2) % colors.length;
                const cx = tx + tileSize / 2;
                const cy = ty + tileSize / 2;
                const cr = 14;

                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, cr, 0, Math.PI * 2);
                ctx.fillStyle = colors[colorIdx];
                ctx.fill();

                // Specular shine
                ctx.beginPath();
                ctx.arc(cx - 4, cy - 4, 4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fill();
                ctx.restore();
            }
        }

        // Title overlay
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, 0, W, 46);
        ctx.fillStyle = '#ff4081';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CANDY SMASH', W / 2, 30);
    }

    drawCandyThumbnail();

    const img = new Image();
    img.src = 'assets/images/candy-smash-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 5 Thumbnail (Pixel Blocks) ---
(function initCardCanvas5() {
    const canvas = document.getElementById('card-canvas-5');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawBlocksThumbnail() {
        // Deep cyber backdrop
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#0c0822');
        g.addColorStop(0.5, '#120b33');
        g.addColorStop(1, '#070514');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }

        // Draw some colorful tetromino blocks
        const blocks = [
            { x: 120, y: 140, color: '#00f0ff', light: '#80f8ff' }, // I
            { x: 140, y: 140, color: '#00f0ff', light: '#80f8ff' },
            { x: 160, y: 140, color: '#00f0ff', light: '#80f8ff' },
            { x: 180, y: 140, color: '#00f0ff', light: '#80f8ff' },

            { x: 220, y: 120, color: '#ffee00', light: '#ffff80' }, // O
            { x: 240, y: 120, color: '#ffee00', light: '#ffff80' },
            { x: 220, y: 140, color: '#ffee00', light: '#ffff80' },
            { x: 240, y: 140, color: '#ffee00', light: '#ffff80' },

            { x: 300, y: 100, color: '#b388ff', light: '#d8bfff' }, // T
            { x: 280, y: 120, color: '#b388ff', light: '#d8bfff' },
            { x: 300, y: 120, color: '#b388ff', light: '#d8bfff' },
            { x: 320, y: 120, color: '#b388ff', light: '#d8bfff' },

            { x: 160, y: 180, color: '#00e676', light: '#80ffbb' }, // S
            { x: 180, y: 180, color: '#00e676', light: '#80ffbb' },
            { x: 140, y: 200, color: '#00e676', light: '#80ffbb' },
            { x: 160, y: 200, color: '#00e676', light: '#80ffbb' },
        ];

        blocks.forEach(b => {
            const size = 18;
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, size, size);
            ctx.fillStyle = b.light;
            ctx.fillRect(b.x, b.y, size, 2);
            ctx.fillRect(b.x, b.y, 2, size);
        });

        // Title overlay
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, 0, W, 46);
        ctx.fillStyle = '#00f0ff';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PIXEL BLOCKS', W / 2, 30);
    }

    drawBlocksThumbnail();

    const img = new Image();
    img.src = 'assets/images/pixel-blocks-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 6 Thumbnail (Pixel Bomber) ---
(function initCardCanvas6() {
    const canvas = document.getElementById('card-canvas-6');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawBomberThumbnail() {
        // Grass arena background
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(0, 0, W, H);

        // Checkered tiles
        const tileSize = 32;
        for (let y = 0; y < H; y += tileSize) {
            for (let x = 0; x < W; x += tileSize) {
                if ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0) {
                    ctx.fillStyle = '#388e3c';
                    ctx.fillRect(x, y, tileSize, tileSize);
                }
            }
        }

        // Draw concrete pillars
        for (let y = 64; y < H; y += 64) {
            for (let x = 64; x < W; x += 64) {
                ctx.fillStyle = '#546e7a';
                ctx.fillRect(x, y, 28, 28);
                ctx.fillStyle = '#90a4ae';
                ctx.fillRect(x, y, 28, 3);
                ctx.fillRect(x, y, 3, 28);
            }
        }

        // Draw a central bomb with fuse spark
        const bx = W / 2;
        const by = H / 2 + 10;
        ctx.fillStyle = '#111116';
        ctx.beginPath();
        ctx.arc(bx, by, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.arc(bx, by - 28, 6, 0, Math.PI * 2);
        ctx.fill();

        // Title overlay
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, W, 46);
        ctx.fillStyle = '#ff5722';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PIXEL BOMBER', W / 2, 30);
    }

    drawBomberThumbnail();

    const img = new Image();
    img.src = 'assets/images/pixel-bomber-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 7 Thumbnail (Pixel Ludo) ---
(function initCardCanvas7() {
    const canvas = document.getElementById('card-canvas-7');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawLudoThumbnail() {
        // Deep felt dark board background
        ctx.fillStyle = '#0f1424';
        ctx.fillRect(0, 0, W, H);

        // Center mini Ludo board preview
        const bw = 200;
        const bh = 200;
        const bx = (W - bw) / 2;
        const by = (H - bh) / 2 + 10;

        // Board outer base
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx, by, bw, bh);

        // 4 color quadrants
        const hw = bw * 0.4;
        const hh = bh * 0.4;
        ctx.fillStyle = '#e53935'; // Red top-left
        ctx.fillRect(bx, by, hw, hh);

        ctx.fillStyle = '#43a047'; // Green top-right
        ctx.fillRect(bx + bw - hw, by, hw, hh);

        ctx.fillStyle = '#1e88e5'; // Blue bottom-left
        ctx.fillRect(bx, by + bh - hh, hw, hh);

        ctx.fillStyle = '#fdd835'; // Yellow bottom-right
        ctx.fillRect(bx + bw - hw, by + bh - hh, hw, hh);

        // Center cross track lines
        ctx.fillStyle = '#cfd8dc';
        ctx.fillRect(bx + hw, by, bw - 2 * hw, bh);
        ctx.fillRect(bx, by + hh, bw, bh - 2 * hh);

        // Center victory triangle
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx + hw, by + hh, bw - 2 * hw, bh - 2 * hh);

        // A decorative 3D dice in front
        const dx = W * 0.8;
        const dy = H * 0.65;
        const ds = 36;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(dx - ds / 2, dy - ds / 2, ds, ds, 6);
        ctx.fill();
        ctx.strokeStyle = '#90a4ae';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 5 red dots on dice
        ctx.fillStyle = '#e53935';
        const dots = [[0, 0], [-9, -9], [9, -9], [-9, 9], [9, 9]];
        dots.forEach(([ox, oy]) => {
            ctx.beginPath();
            ctx.arc(dx + ox, dy + oy, 3.5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Title overlay
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, W, 46);
        ctx.fillStyle = '#ffb300';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PIXEL LUDO', W / 2, 30);
    }

    drawLudoThumbnail();

    const img = new Image();
    img.src = 'assets/images/pixel-ludo-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 8 Thumbnail (Pixel Word Search) ---
(function initCardCanvas8() {
    const canvas = document.getElementById('card-canvas-8');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawWordSearchThumbnail() {
        // Deep matrix cyber background
        ctx.fillStyle = '#080916';
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = 1;
        const cellSize = 28;
        for (let x = 0; x < W; x += cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = 0; y < H; y += cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Draw sample matrix letters
        const sampleLetters = [
            'P','I','X','E','L','A','R','C','A','D','E',
            'R','E','T','R','O','G','A','M','I','N','G',
            'Z','E','L','D','A','B','O','S','S','Q','U',
            'M','A','R','I','O','P','A','C','M','A','N',
            'C','Y','B','E','R','S','E','A','R','C','H'
        ];

        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const startX = 60;
        const startY = 80;
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 11; c++) {
                const char = sampleLetters[r * 11 + c] || 'A';
                const lx = startX + c * 34;
                const ly = startY + r * 32;

                ctx.fillStyle = '#414d7a';
                ctx.fillText(char, lx, ly);
            }
        }

        // Highlight "PIXEL" in cyan capsule
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 26;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + 4 * 34, startY);
        ctx.stroke();

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Highlighted text
        ctx.fillStyle = '#ffffff';
        ['P','I','X','E','L'].forEach((ch, i) => {
            ctx.fillText(ch, startX + i * 34, startY);
        });
        ctx.restore();

        // Highlight "ARCADE" in pink capsule
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
        ctx.lineWidth = 26;
        ctx.beginPath();
        ctx.moveTo(startX + 5 * 34, startY);
        ctx.lineTo(startX + 10 * 34, startY);
        ctx.stroke();

        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ['A','R','C','A','D','E'].forEach((ch, i) => {
            ctx.fillText(ch, startX + (5 + i) * 34, startY);
        });
        ctx.restore();

        // Title overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, 46);
        ctx.fillStyle = '#00f0ff';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PIXEL WORD SEARCH', W / 2, 30);
    }

    drawWordSearchThumbnail();

    const img = new Image();
    img.src = 'assets/images/word-search-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 9 Thumbnail (Pixel Fruit Ninja) ---
(function initCardCanvas9() {
    const canvas = document.getElementById('card-canvas-9');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawFruitNinjaThumbnail() {
        // Deep warm dojo wood background
        for (let y = 0; y < H; y += 30) {
            ctx.fillStyle = (Math.floor(y / 30) % 2 === 0) ? '#28170c' : '#1e1008';
            ctx.fillRect(0, y, W, 30);
            ctx.strokeStyle = '#120a05';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(0, y, W, 30);
        }

        // Juice splatters
        ctx.fillStyle = 'rgba(255, 42, 95, 0.4)';
        ctx.beginPath();
        ctx.arc(W * 0.45, H * 0.55, 35, 0, Math.PI * 2);
        ctx.arc(W * 0.4, H * 0.62, 18, 0, Math.PI * 2);
        ctx.arc(W * 0.52, H * 0.52, 22, 0, Math.PI * 2);
        ctx.fill();

        // Sliced Watermelon Halves
        const wx = W * 0.46;
        const wy = H * 0.56;
        const wr = 38;

        // Top-left half
        ctx.save();
        ctx.translate(wx - 18, wy - 16);
        ctx.rotate(-0.35);
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(0, 0, wr, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#ff2a5f';
        ctx.beginPath();
        ctx.arc(0, 0, wr - 4, Math.PI, 0);
        ctx.fill();
        // Seeds
        ctx.fillStyle = '#111';
        ctx.fillRect(-12, -14, 3, 4);
        ctx.fillRect(0, -18, 3, 4);
        ctx.fillRect(12, -12, 3, 4);
        ctx.restore();

        // Bottom-right half
        ctx.save();
        ctx.translate(wx + 22, wy + 20);
        ctx.rotate(0.35);
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(0, 0, wr, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ff2a5f';
        ctx.beginPath();
        ctx.arc(0, 0, wr - 4, 0, Math.PI);
        ctx.fill();
        // Seeds
        ctx.fillStyle = '#111';
        ctx.fillRect(-10, 14, 3, 4);
        ctx.fillRect(8, 16, 3, 4);
        ctx.restore();

        // Sliced Orange (Right side)
        const ox = W * 0.76;
        const oy = H * 0.5;
        ctx.fillStyle = '#e65100';
        ctx.beginPath();
        ctx.arc(ox, oy, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.arc(ox, oy, 20, 0, Math.PI * 2);
        ctx.fill();

        // Flying Banana (Left side)
        const bx = W * 0.2;
        const by = H * 0.58;
        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.ellipse(bx, by, 28, 12, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(bx + 18, by - 12, 4, 4);

        // Katana Neon Slash Blade Trail
        ctx.save();
        ctx.lineCap = 'round';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(W * 0.1, H * 0.85);
        ctx.quadraticCurveTo(W * 0.45, H * 0.45, W * 0.9, H * 0.25);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();

        // Title overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, 46);
        ctx.fillStyle = '#ffb300';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PIXEL FRUIT NINJA', W / 2, 30);
    }

    drawFruitNinjaThumbnail();

    const img = new Image();
    img.src = 'assets/images/fruit-ninja-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 10 Thumbnail (Hyper Wave) ---
(function initCardCanvas10() {
    const canvas = document.getElementById('card-canvas-10');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawHyperWaveThumbnail() {
        // Synthwave deep purple void
        ctx.fillStyle = '#080514';
        ctx.fillRect(0, 0, W, H);

        // Perspective Horizon at H * 0.55
        const hy = H * 0.55;

        // Retro Sun
        const sunX = W / 2;
        const sunY = hy;
        const sunR = 50;
        const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
        sunGrad.addColorStop(0, '#ffea00');
        sunGrad.addColorStop(0.7, '#ff007f');
        sunGrad.addColorStop(1, '#7b00ff');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, Math.PI, 0);
        ctx.fill();

        // 3D Perspective Grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, hy);
        ctx.lineTo(W, hy);
        ctx.stroke();

        for (let i = 0; i <= 14; i++) {
            ctx.beginPath();
            ctx.moveTo(sunX, hy);
            ctx.lineTo((W / 14) * i, H);
            ctx.stroke();
        }

        for (let i = 1; i <= 6; i++) {
            const y = hy + Math.pow(i / 6, 2) * (H - hy);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Giant Magenta Wireframe Boss (Upper Center)
        ctx.save();
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 2.5;
        const bx = W / 2;
        const by = H * 0.32;
        const br = 36;
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const a = (i * Math.PI) / 6;
            const r = (i % 2 === 0) ? br : br * 0.7;
            const px = bx + Math.cos(a) * r;
            const py = by + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // Expanding Blue Shockwave Ring
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(W * 0.5, H * 0.78, 60, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Player Cyber Fighter (Foreground)
        ctx.save();
        const px = W * 0.5;
        const py = H * 0.78;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = '#0e122b';
        ctx.beginPath();
        ctx.moveTo(px, py - 18);
        ctx.lineTo(px + 16, py + 12);
        ctx.lineTo(px + 8, py + 8);
        ctx.lineTo(px, py + 14);
        ctx.lineTo(px - 8, py + 8);
        ctx.lineTo(px - 16, py + 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Triple Lasers
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px, py - 20); ctx.lineTo(px, py - 55);
        ctx.moveTo(px - 12, py - 16); ctx.lineTo(px - 18, py - 50);
        ctx.moveTo(px + 12, py - 16); ctx.lineTo(px + 18, py - 50);
        ctx.stroke();
        ctx.restore();

        // Title overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, 46);
        ctx.fillStyle = '#00f0ff';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('HYPER WAVE', W / 2, 30);
    }

    drawHyperWaveThumbnail();

    const img = new Image();
    img.src = 'assets/images/hyper-wave-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 11 Thumbnail (Merge Cube 2048) ---
(function initCardCanvas11() {
    const canvas = document.getElementById('card-canvas-11');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawCube(x, y, size, val, baseColor, topColor, rightColor, isCrown = false) {
        ctx.save();
        ctx.translate(x, y);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(0, size * 0.7, size * 0.8, size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3D Beveled Cube
        const b = 5;
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.roundRect(-size / 2, -size / 2, size, size, b);
        ctx.fill();

        // Top highlight
        ctx.fillStyle = topColor;
        ctx.beginPath();
        ctx.moveTo(-size / 2, -size / 2);
        ctx.lineTo(size / 2, -size / 2);
        ctx.lineTo(size / 2 - b, -size / 2 + b);
        ctx.lineTo(-size / 2 + b, -size / 2 + b);
        ctx.closePath();
        ctx.fill();

        // Right shadow
        ctx.fillStyle = rightColor;
        ctx.beginPath();
        ctx.moveTo(size / 2, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.lineTo(size / 2 - b, size / 2 - b);
        ctx.lineTo(size / 2 - b, -size / 2 + b);
        ctx.closePath();
        ctx.fill();

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isCrown ? 2.5 : 1.5;
        if (isCrown) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 14;
        }
        ctx.stroke();

        // Label
        ctx.font = size > 45 ? '12px "Press Start 2P", monospace' : '9px "Press Start 2P", monospace';
        ctx.fillStyle = isCrown ? '#060710' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val, 0, 1);

        if (isCrown) {
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('👑', 0, -size / 2 + 8);
        }

        ctx.restore();
    }

    function drawMergeCubeThumbnail() {
        // Futuristic cyber lane
        ctx.fillStyle = '#0a0d1e';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#10142e';
        ctx.fillRect(40, 45, W - 80, H - 45);

        // Grid lines
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 40; x <= W - 40; x += 36) {
            ctx.beginPath(); ctx.moveTo(x, 45); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 45; y <= H; y += 36) {
            ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 40, y); ctx.stroke();
        }

        // Walls
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.strokeRect(40, 45, W - 80, H - 45);
        ctx.shadowBlur = 0;

        // Dotted Aim Laser
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(W / 2, H - 35);
        ctx.lineTo(W / 2, 120);
        ctx.stroke();
        ctx.setLineDash([]);

        // Merging Collision Sparks between 64 and 64
        const mx = W * 0.48;
        const my = 150;
        ctx.save();
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        for (let i = 0; i < 12; i++) {
            const a = (i * Math.PI) / 6;
            ctx.fillRect(mx + Math.cos(a) * 26 - 3, my + Math.sin(a) * 26 - 3, 6, 6);
        }
        ctx.restore();

        // Cubes on board
        drawCube(W * 0.35, 150, 42, 64, '#00b0ff', '#40c4ff', '#0091ea');
        drawCube(W * 0.60, 150, 42, 64, '#00b0ff', '#40c4ff', '#0091ea');

        // Central Crown 2048 Cube
        drawCube(W * 0.5, 95, 52, 2048, '#ffd700', '#fff176', '#fbc02d', true);

        // Flanking Cubes
        drawCube(W * 0.22, 110, 40, 8, '#e91e63', '#f06292', '#c2185b');
        drawCube(W * 0.78, 110, 40, 32, '#3f51b5', '#7986cb', '#303f9f');
        drawCube(W * 0.25, 180, 40, 128, '#00e676', '#69f0ae', '#00c853');
        drawCube(W * 0.74, 180, 40, 256, '#ffea00', '#ffff00', '#ffd600');

        // Shooter Cube
        drawCube(W / 2, H - 45, 46, 4, '#ff5722', '#ff8a65', '#e64a19');

        // Title overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, 46);
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MERGE CUBE 2048', W / 2, 30);
    }

    drawMergeCubeThumbnail();

    const img = new Image();
    img.src = 'assets/images/merge-cube-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 12 Thumbnail (Pixel Drifter) ---
(function initCardCanvas12() {
    const canvas = document.getElementById('card-canvas-12');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawPixelDrifterThumbnail() {
        // Deep purple synthwave sky
        const g = ctx.createLinearGradient(0, 0, 0, H * 0.55);
        g.addColorStop(0, '#060212');
        g.addColorStop(0.7, '#240638');
        g.addColorStop(1, '#ff007f');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H * 0.55);

        // Synthwave Sun
        const sunX = W * 0.65;
        const sunY = H * 0.45;
        const sunR = 48;
        const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
        sunGrad.addColorStop(0, '#ffea00');
        sunGrad.addColorStop(0.75, '#ff007f');
        sunGrad.addColorStop(1, '#9c27b0');
        ctx.fillStyle = sunGrad;
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, Math.PI, 0);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Sun slices
        ctx.fillStyle = '#060212';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(sunX - sunR - 6, sunY - 26 + i * 6, sunR * 2 + 12, 2);
        }

        // Grass
        ctx.fillStyle = '#0f051c';
        ctx.fillRect(0, H * 0.5, W, H * 0.5);

        // Curved Road
        ctx.fillStyle = '#1c132b';
        ctx.beginPath();
        ctx.moveTo(W * 0.45, H * 0.5);
        ctx.lineTo(W * 0.60, H * 0.5);
        ctx.lineTo(W * 0.88, H);
        ctx.lineTo(W * 0.08, H);
        ctx.closePath();
        ctx.fill();

        // Rumble curbs (red & white)
        ctx.fillStyle = '#ff2a5f';
        ctx.fillRect(W * 0.08 - 14, H - 25, 16, 25);
        ctx.fillRect(W * 0.88 - 2, H - 25, 16, 25);

        // Lane divider dashed
        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 4;
        ctx.setLineDash([16, 12]);
        ctx.beginPath();
        ctx.moveTo(W * 0.52, H * 0.5);
        ctx.lineTo(W * 0.48, H);
        ctx.stroke();
        ctx.setLineDash([]);

        // Drifting Red Sports Car
        ctx.save();
        const cx = W * 0.45;
        const cy = H * 0.76;
        ctx.translate(cx, cy);
        ctx.rotate(-0.18); // Sideways drift tilt

        // Tire skid smoke
        ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-42, 18, 14, 0, Math.PI * 2);
        ctx.arc(-26, 22, 10, 0, Math.PI * 2);
        ctx.fill();

        // Nitro exhaust flame
        ctx.fillStyle = '#ff007f';
        ctx.fillRect(-18, 16, 6, 20);
        ctx.fillRect(12, 16, 6, 20);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(-16, 16, 3, 14);
        ctx.fillRect(14, 16, 3, 14);

        // Car chassis
        ctx.fillStyle = '#e53935';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-42, -18, 84, 36, 6);
        ctx.fill();
        ctx.stroke();

        // Rear grill & tail lights
        ctx.fillStyle = '#111';
        ctx.fillRect(-36, 4, 72, 10);
        ctx.fillStyle = '#ff1744';
        ctx.fillRect(-34, 6, 18, 6);
        ctx.fillRect(16, 6, 18, 6);

        // Windshield
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.roundRect(-24, -14, 48, 10, 2);
        ctx.fill();

        ctx.restore();

        // Title overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, 46);
        ctx.fillStyle = '#ff007f';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PIXEL DRIFTER', W / 2, 30);
    }

    drawPixelDrifterThumbnail();

    const img = new Image();
    img.src = 'assets/images/pixel-drifter-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 13 Thumbnail (Neon Breakout) ---
(function initCardCanvas13() {
    const canvas = document.getElementById('card-canvas-13');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawNeonBreakoutThumbnail() {
        // Deep space background
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#060214');
        g.addColorStop(0.6, '#18082e');
        g.addColorStop(1, '#05010c');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // Synthwave perspective grid floor
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.15)';
        ctx.lineWidth = 1;
        for (let y = H * 0.65; y < H; y += 16) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
        for (let x = -60; x <= W + 60; x += 40) {
            ctx.beginPath();
            ctx.moveTo(W / 2, H * 0.65);
            ctx.lineTo(x, H);
            ctx.stroke();
        }

        // Brick matrix at top
        const rows = 4;
        const cols = 8;
        const bW = 48;
        const bH = 16;
        const pad = 6;
        const startX = (W - (cols * (bW + pad) - pad)) / 2;
        const startY = 48;

        const rowColors = [
            { f: '#ff007f', b: '#ff80bf' },
            { f: '#b026ff', b: '#d893ff' },
            { f: '#00f0ff', b: '#80f7ff' },
            { f: '#ffea00', b: '#fff580' }
        ];

        for (let r = 0; r < rows; r++) {
            const colDef = rowColors[r];
            for (let c = 0; c < cols; c++) {
                // Break a few bricks for action look
                if ((r === 2 && (c === 3 || c === 4)) || (r === 3 && (c === 2 || c === 5))) continue;

                const bx = startX + c * (bW + pad);
                const by = startY + r * (bH + pad);

                ctx.save();
                ctx.shadowColor = colDef.f;
                ctx.shadowBlur = 8;
                ctx.fillStyle = colDef.f;
                ctx.fillRect(bx, by, bW, bH);
                ctx.strokeStyle = colDef.b;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(bx, by, bW, bH);

                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillRect(bx + 4, by + 2, bW - 8, 2);
                ctx.restore();
            }
        }

        // Impact spark particles
        ctx.fillStyle = '#ffea00';
        for (let i = 0; i < 20; i++) {
            const px = startX + 3.5 * (bW + pad) + (Math.random() * 40 - 20);
            const py = startY + 2.5 * (bH + pad) + (Math.random() * 30 - 15);
            ctx.fillRect(px, py, 3, 3);
        }

        // Glowing Plasma Balls
        const balls = [
            { x: startX + 3.5 * (bW + pad), y: startY + 2.8 * (bH + pad), r: 8, color: '#ffea00' },
            { x: W * 0.35, y: H * 0.65, r: 7, color: '#00f0ff' }
        ];

        balls.forEach(b => {
            ctx.save();
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 14;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Twin laser beams
        ctx.save();
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(W / 2 - 36, H * 0.52, 4, 38);
        ctx.fillRect(W / 2 + 32, H * 0.52, 4, 38);
        ctx.fillStyle = '#ff007f';
        ctx.fillRect(W / 2 - 37, H * 0.52, 6, 8);
        ctx.fillRect(W / 2 + 31, H * 0.52, 6, 8);
        ctx.restore();

        // Cyber Paddle at bottom
        ctx.save();
        const pW = 120;
        const pH = 20;
        const pX = W / 2 - pW / 2;
        const pY = H - 42;

        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;

        const pGrad = ctx.createLinearGradient(pX, pY, pX, pY + pH);
        pGrad.addColorStop(0, '#ffffff');
        pGrad.addColorStop(0.3, '#00f0ff');
        pGrad.addColorStop(1, '#060218');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.roundRect(pX, pY, pW, pH, 6);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Laser cannons on sides
        ctx.fillStyle = '#ff007f';
        ctx.fillRect(pX - 4, pY - 6, 8, 14);
        ctx.fillRect(pX + pW - 4, pY - 6, 8, 14);
        ctx.restore();

        // Title overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, 42);
        ctx.fillStyle = '#00f0ff';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NEON BREAKOUT', W / 2, 28);
    }

    drawNeonBreakoutThumbnail();

    const img = new Image();
    img.src = 'assets/images/neon-breakout-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 14 Thumbnail (Dungeon Quest) ---
(function initCardCanvas14() {
    const canvas = document.getElementById('card-canvas-14');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawDungeonQuestThumbnail() {
        // Dark stone dungeon background
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#120b1f');
        g.addColorStop(0.5, '#201633');
        g.addColorStop(1, '#0b0614');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // Cobblestone floor grid
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1;
        const tileSize = 32;
        for (let x = 0; x < W; x += tileSize) {
            for (let y = 60; y < H; y += tileSize) {
                if ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0) {
                    ctx.fillStyle = 'rgba(38, 28, 58, 0.4)';
                    ctx.fillRect(x, y, tileSize, tileSize);
                }
                ctx.strokeRect(x, y, tileSize, tileSize);
            }
        }

        // Stone pillars & Wall archways
        ctx.fillStyle = '#2f2145';
        ctx.fillRect(30, 40, 28, H - 40);
        ctx.fillRect(W - 58, 40, 28, H - 40);
        ctx.strokeStyle = '#4e3770';
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 40, 28, H - 40);
        ctx.strokeRect(W - 58, 40, 28, H - 40);

        // Wall torch lights
        const torches = [
            { x: 44, y: 110 },
            { x: W - 44, y: 110 }
        ];
        torches.forEach(t => {
            const rad = ctx.createRadialGradient(t.x, t.y, 4, t.x, t.y, 50);
            rad.addColorStop(0, 'rgba(255, 170, 0, 0.4)');
            rad.addColorStop(1, 'rgba(255, 170, 0, 0)');
            ctx.fillStyle = rad;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 50, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff7700';
            ctx.fillRect(t.x - 3, t.y - 5, 6, 8);
            ctx.fillStyle = '#ffea00';
            ctx.fillRect(t.x - 2, t.y - 8, 4, 5);
        });

        // Glowing Treasure Chest
        const cx = W / 2 + 110;
        const cy = H * 0.65;
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(cx - 16, cy - 10, 32, 22);
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 16, cy - 10, 32, 22);
        ctx.fillStyle = '#ff1744';
        ctx.fillRect(cx - 4, cy - 3, 8, 8);
        ctx.restore();

        // Green Acid Slime enemy
        ctx.save();
        const sx = W / 2 + 35;
        const sy = H * 0.72;
        ctx.fillStyle = '#00e676';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00b0ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Slime eyes
        ctx.fillStyle = '#111';
        ctx.fillRect(sx - 7, sy - 5, 4, 5);
        ctx.fillRect(sx + 3, sy - 5, 4, 5);
        ctx.restore();

        // Skeleton Warrior enemy
        ctx.save();
        const skX = W * 0.68;
        const skY = H * 0.42;
        ctx.fillStyle = '#cfd8dc';
        ctx.fillRect(skX - 8, skY - 8, 16, 16);
        ctx.fillStyle = '#eceff1';
        ctx.fillRect(skX - 10, skY - 22, 20, 15);
        // Red glowing eyes
        ctx.fillStyle = '#ff1744';
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 6;
        ctx.fillRect(skX - 7, skY - 17, 4, 4);
        ctx.fillRect(skX + 3, skY - 17, 4, 4);
        ctx.shadowBlur = 0;
        // Bone sword
        ctx.fillStyle = '#90a4ae';
        ctx.fillRect(skX - 18, skY - 14, 5, 24);
        ctx.restore();

        // Player Knight Hero
        ctx.save();
        const kx = W * 0.32;
        const ky = H * 0.58;

        // Cape
        ctx.fillStyle = '#b71c1c';
        ctx.beginPath();
        ctx.moveTo(kx - 10, ky - 4);
        ctx.lineTo(kx + 10, ky - 4);
        ctx.lineTo(kx + 16, ky + 24);
        ctx.lineTo(kx - 16, ky + 24);
        ctx.closePath();
        ctx.fill();

        // Plate Armor
        ctx.fillStyle = '#cfd8dc';
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(kx - 12, ky - 12, 24, 24, 6);
        ctx.fill();
        ctx.stroke();

        // Gold Chestplate badge
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(kx - 4, ky - 6, 8, 12);

        // Helmet & Blue Glowing Visor
        ctx.fillStyle = '#90a4ae';
        ctx.fillRect(kx - 10, ky - 26, 20, 16);
        ctx.strokeStyle = '#263238';
        ctx.strokeRect(kx - 10, ky - 26, 20, 16);

        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.fillRect(kx - 6, ky - 20, 12, 4);
        ctx.shadowBlur = 0;

        // Magic Sword with Blue Flame
        ctx.save();
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(kx + 14, ky - 28, 6, 36);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(kx + 12, ky - 30, 10, 4);
        // Hilt
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(kx + 10, ky + 4, 14, 4);
        ctx.fillRect(kx + 15, ky + 8, 4, 8);
        ctx.restore();

        ctx.restore();

        // Title overlay banner
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, W, 44);
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DUNGEON QUEST', W / 2, 28);
    }

    drawDungeonQuestThumbnail();

    const img = new Image();
    img.src = 'assets/images/dungeon-quest-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 15 Thumbnail (Kingdom Guard) ---
(function initCardCanvas15() {
    const canvas = document.getElementById('card-canvas-15');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawKingdomGuardThumbnail() {
        // Lush green meadow background
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#1b5e20');
        g.addColorStop(0.5, '#2e7d32');
        g.addColorStop(1, '#1b381e');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // River at bottom
        ctx.fillStyle = '#0288d1';
        ctx.fillRect(0, H - 36, W, 36);

        // Winding dirt road
        ctx.lineWidth = 38;
        ctx.strokeStyle = '#795548';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 100);
        ctx.lineTo(120, 100);
        ctx.lineTo(120, 200);
        ctx.lineTo(260, 200);
        ctx.lineTo(260, 90);
        ctx.lineTo(380, 90);
        ctx.lineTo(380, 190);
        ctx.lineTo(W, 190);
        ctx.stroke();

        ctx.lineWidth = 26;
        ctx.strokeStyle = '#8d6e63';
        ctx.stroke();

        // Castle Gate at right
        ctx.fillStyle = '#37474f';
        ctx.fillRect(W - 70, 140, 70, 80);
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 2;
        ctx.strokeRect(W - 70, 140, 70, 80);
        ctx.fillStyle = '#1e88e5';
        ctx.fillRect(W - 55, 125, 20, 20);

        // Archer Tower
        const ax = 180;
        const ay = 130;
        ctx.fillStyle = '#78909c';
        ctx.fillRect(ax - 14, ay - 24, 28, 24);
        ctx.strokeStyle = '#263238';
        ctx.strokeRect(ax - 14, ay - 24, 28, 24);
        // Archer with bow
        ctx.strokeStyle = '#d7ccc8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ax, ay - 28, 8, -0.8, 0.8);
        ctx.stroke();

        // Flying flaming arrow
        ctx.save();
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ff5722';
        ctx.fillRect(ax + 20, ay - 18, 12, 3);
        ctx.restore();

        // Cannon Tower
        const cx = 320;
        const cy = 135;
        ctx.fillStyle = '#424242';
        ctx.fillRect(cx - 16, cy - 20, 32, 20);
        ctx.fillStyle = '#111';
        ctx.fillRect(cx - 18, cy - 14, 18, 8);

        // Cannonball & Smoke
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx - 32, cy + 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 87, 34, 0.8)';
        ctx.beginPath();
        ctx.arc(cx - 38, cy + 20, 14, 0, Math.PI * 2);
        ctx.fill();

        // Approaching Orc Creep
        ctx.fillStyle = '#7cb342';
        ctx.beginPath();
        ctx.arc(80, 100, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#33691e';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Goblin Runner Creep
        ctx.fillStyle = '#39ff14';
        ctx.beginPath();
        ctx.arc(120, 160, 9, 0, Math.PI * 2);
        ctx.fill();

        // Meteor Trail from sky
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 87, 34, 0.7)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(W * 0.7, 0);
        ctx.lineTo(W * 0.55, 120);
        ctx.stroke();
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.arc(W * 0.55, 120, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Title overlay banner
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, W, 44);
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('KINGDOM GUARD', W / 2, 28);
    }

    drawKingdomGuardThumbnail();

    const img = new Image();
    img.src = 'assets/images/kingdom-guard-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 16 Thumbnail (Neon Pac-Maze) ---
(function initCardCanvas16() {
    const canvas = document.getElementById('card-canvas-16');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawNeonPacMazeThumbnail() {
        // Deep space synthwave background
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#06020e');
        g.addColorStop(0.5, '#120524');
        g.addColorStop(1, '#05010b');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // Neon maze walls
        ctx.save();
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;

        // Outer border
        ctx.strokeRect(20, 48, W - 40, H - 68);

        // Inner neon maze blocks
        ctx.strokeRect(50, 75, 70, 35);
        ctx.strokeRect(W - 120, 75, 70, 35);
        ctx.strokeRect(160, 75, 160, 35);

        ctx.strokeRect(50, 140, 70, 50);
        ctx.strokeRect(W - 120, 140, 70, 50);

        // Ghost house in center
        ctx.strokeStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.strokeRect(W / 2 - 50, 130, 100, 60);
        ctx.fillStyle = '#ff007f';
        ctx.fillRect(W / 2 - 20, 128, 40, 4); // door
        ctx.restore();

        // Glowing dots
        ctx.fillStyle = '#ffea00';
        for (let x = 35; x < W - 30; x += 22) {
            ctx.beginPath();
            ctx.arc(x, 122, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Glowing Power Pellet
        ctx.save();
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(35, 122, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Neon Yellow Pac-Man Hero
        const px = W * 0.38;
        const py = 215;
        ctx.save();
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.arc(px, py, 16, 0.25 * Math.PI, 1.75 * Math.PI);
        ctx.lineTo(px, py);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Chasing Neon Ghosts
        const ghosts = [
            { x: px - 45, y: py, color: '#ff1744' }, // Red (Blinky)
            { x: px - 85, y: py, color: '#ff007f' }, // Pink (Pinky)
            { x: px - 125, y: py, color: '#00f0ff' }  // Cyan (Inky)
        ];

        ghosts.forEach(gh => {
            ctx.save();
            ctx.shadowColor = gh.color;
            ctx.shadowBlur = 12;
            ctx.fillStyle = gh.color;
            ctx.beginPath();
            ctx.arc(gh.x, gh.y - 4, 13, Math.PI, 0, false);
            ctx.lineTo(gh.x + 13, gh.y + 12);
            ctx.lineTo(gh.x + 6, gh.y + 8);
            ctx.lineTo(gh.x, gh.y + 12);
            ctx.lineTo(gh.x - 6, gh.y + 8);
            ctx.lineTo(gh.x - 13, gh.y + 12);
            ctx.closePath();
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(gh.x - 7, gh.y - 7, 4, 6);
            ctx.fillRect(gh.x + 3, gh.y - 7, 4, 6);
            ctx.fillStyle = '#111';
            ctx.fillRect(gh.x - 5, gh.y - 5, 2, 3);
            ctx.fillRect(gh.x + 5, gh.y - 5, 2, 3);
            ctx.restore();
        });

        // Frightened Blue Ghost on right fleeing
        const fx = W * 0.75;
        const fy = 215;
        ctx.save();
        ctx.shadowColor = '#2979ff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#2979ff';
        ctx.beginPath();
        ctx.arc(fx, fy - 4, 13, Math.PI, 0, false);
        ctx.lineTo(fx + 13, fy + 12);
        ctx.lineTo(fx + 6, fy + 8);
        ctx.lineTo(fx, fy + 12);
        ctx.lineTo(fx - 6, fy + 8);
        ctx.lineTo(fx - 13, fy + 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(fx - 5, fy - 5, 3, 3);
        ctx.fillRect(fx + 2, fy - 5, 3, 3);
        ctx.restore();

        // Title overlay banner
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, W, 44);
        ctx.fillStyle = '#ffea00';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NEON PAC-MAZE', W / 2, 28);
    }

    drawNeonPacMazeThumbnail();

    const img = new Image();
    img.src = 'assets/images/neon-pac-maze-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 17 Thumbnail (Pixel Hopper) ---
(function initCardCanvas17() {
    const canvas = document.getElementById('card-canvas-17');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawPixelHopperThumbnail() {
        // Deep blue river at top half
        ctx.fillStyle = '#0288d1';
        ctx.fillRect(0, 0, W, H * 0.48);

        // Water ripples
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(20, 60, 40, 2);
        ctx.fillRect(160, 80, 50, 2);
        ctx.fillRect(320, 55, 60, 2);

        // Lily pads at top edge
        ctx.fillStyle = '#1b5e20';
        ctx.fillRect(0, 40, W, 22);
        const pads = [60, 150, 240, 330, 420];
        pads.forEach(px => {
            ctx.fillStyle = '#388e3c';
            ctx.beginPath();
            ctx.arc(px, 50, 14, 0, Math.PI * 2);
            ctx.fill();
        });

        // Floating Logs
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.roundRect(80, 75, 100, 20, 8);
        ctx.roundRect(280, 75, 110, 20, 8);
        ctx.roundRect(140, 105, 130, 20, 8);
        ctx.fill();

        // Green Grass Median
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(0, H * 0.48, W, 24);
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, H * 0.48, W, 24);

        // Asphalt Highway at bottom half
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, H * 0.48 + 24, W, H - (H * 0.48 + 24));

        // Dashed lane line
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([14, 14]);
        ctx.beginPath();
        ctx.moveTo(0, H * 0.72);
        ctx.lineTo(W, H * 0.72);
        ctx.stroke();
        ctx.setLineDash([]);

        // Speeding Vehicles
        // Red Sports Car
        ctx.save();
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.roundRect(80, H * 0.58, 60, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(92, H * 0.58 + 4, 36, 16);
        ctx.restore();

        // Yellow Taxi
        ctx.save();
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.roundRect(260, H * 0.78, 65, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(274, H * 0.78 + 4, 38, 16);
        ctx.restore();

        // Heavy Truck
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.roundRect(380, H * 0.58, 90, 26, 4);
        ctx.fill();

        // Leaping Green Frog Hero
        const fx = W * 0.46;
        const fy = H * 0.48 + 4;
        ctx.save();
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#39ff14';
        ctx.beginPath();
        ctx.ellipse(fx, fy, 16, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs extended
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(fx - 14, fy + 8, 6, 12, -0.4, 0, Math.PI * 2);
        ctx.ellipse(fx + 14, fy + 8, 6, 12, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Big cartoon eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fx - 8, fy - 16, 5.5, 0, Math.PI * 2);
        ctx.arc(fx + 8, fy - 16, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(fx - 8, fy - 17, 2.5, 0, Math.PI * 2);
        ctx.arc(fx + 8, fy - 17, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Title overlay banner
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, W, 44);
        ctx.fillStyle = '#39ff14';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PIXEL HOPPER', W / 2, 28);
    }

    drawPixelHopperThumbnail();

    const img = new Image();
    img.src = 'assets/images/pixel-hopper-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 18 Thumbnail (Cyber Snake) ---
(function initCardCanvas18() {
    const canvas = document.getElementById('card-canvas-18');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawCyberSnakeThumbnail() {
        // Dark synthwave gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0a061b');
        grad.addColorStop(0.5, '#060410');
        grad.addColorStop(1, '#020108');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Perspective wireframe grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = 0; y <= H; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Glowing snake curve
        const segments = [
            { x: 300, y: 150 }, { x: 275, y: 150 }, { x: 250, y: 150 },
            { x: 225, y: 150 }, { x: 225, y: 175 }, { x: 225, y: 200 },
            { x: 200, y: 200 }, { x: 175, y: 200 }, { x: 150, y: 200 },
            { x: 150, y: 175 }, { x: 150, y: 150 }, { x: 150, y: 125 }
        ];

        segments.forEach((seg, i) => {
            const p = i / segments.length;
            ctx.fillStyle = i === 0 ? '#ffffff' : (i % 2 === 0 ? '#00f0ff' : '#39ff14');
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.fillRect(seg.x - 10, seg.y - 10, 20, 20);
        });

        // Food / Powerup
        ctx.fillStyle = '#ffea00';
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(360, 150, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Title overlay banner
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, 44);
        ctx.fillStyle = '#00f0ff';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CYBER SNAKE', W / 2, 28);
    }

    drawCyberSnakeThumbnail();

    const img = new Image();
    img.src = 'assets/images/cyber-snake-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 19 Thumbnail (Pixel Climber) ---
(function initCardCanvas19() {
    const canvas = document.getElementById('card-canvas-19');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawPixelClimberThumbnail() {
        // Vertical gradient from dark nebula at top to dusk sky at bottom
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#090518');
        grad.addColorStop(0.5, '#1e0c38');
        grad.addColorStop(1, '#4a154b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Distant stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 30; i++) {
            const sx = (i * 73) % W;
            const sy = (i * 97) % H;
            ctx.fillRect(sx, sy, 2, 2);
        }

        // Floating platforms
        const plats = [
            { x: 60, y: 220, w: 90, col: '#39ff14' },
            { x: 190, y: 160, w: 100, col: '#00f0ff' },
            { x: 330, y: 110, w: 90, col: '#ffd700' },
            { x: 110, y: 70, w: 90, col: '#39ff14' }
        ];

        plats.forEach(p => {
            ctx.fillStyle = '#101828';
            ctx.fillRect(p.x, p.y, p.w, 14);
            ctx.strokeStyle = p.col;
            ctx.lineWidth = 2;
            ctx.shadowColor = p.col;
            ctx.shadowBlur = 8;
            ctx.strokeRect(p.x, p.y, p.w, 14);
            ctx.shadowBlur = 0;
        });

        // Collectible star
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(375, 90, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Cute jumper character on center platform
        const jx = 240;
        const jy = 135;
        ctx.fillStyle = '#39ff14';
        ctx.fillRect(jx - 12, jy - 16, 24, 28);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(jx - 6, jy - 8, 14, 16);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(jx + 2, jy - 14, 10, 8);

        // Jetpack thruster flame
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(jx - 18, jy - 8, 6, 16);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(jx - 17, jy + 8, 4, 6);

        // Title overlay banner
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, 44);
        ctx.fillStyle = '#39ff14';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PIXEL CLIMBER', W / 2, 28);
    }

    drawPixelClimberThumbnail();

    const img = new Image();
    img.src = 'assets/images/pixel-climber-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Game Card 20 Thumbnail (Neon Dash) ---
(function initCardCanvas20() {
    const canvas = document.getElementById('card-canvas-20');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;

    function drawNeonDashThumbnail() {
        // Synthwave sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#040510');
        grad.addColorStop(0.5, '#190a32');
        grad.addColorStop(1, '#2c0b3c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Synthwave Sun
        const sunX = W / 2;
        const sunY = 120;
        const sunR = 50;
        const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
        sunGrad.addColorStop(0, '#ffea00');
        sunGrad.addColorStop(0.6, '#ff007f');
        sunGrad.addColorStop(1, '#7700ff');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
        ctx.fill();

        // Floor
        const groundY = 210;
        ctx.fillStyle = '#060714';
        ctx.fillRect(0, groundY, W, H - groundY);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(W, groundY);
        ctx.stroke();

        // Spikes
        ctx.fillStyle = 'rgba(255, 0, 85, 0.4)';
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 2;
        [280, 320].forEach(sx => {
            ctx.beginPath();
            ctx.moveTo(sx, groundY);
            ctx.lineTo(sx + 15, groundY - 30);
            ctx.lineTo(sx + 30, groundY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        // Yellow Jump Pad
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(380, groundY - 8, 36, 8);

        // Mid-air Glowing Cube
        const cx = 170;
        const cy = 135;
        const csize = 32;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(0.4);
        ctx.fillStyle = '#060714';
        ctx.fillRect(-csize / 2, -csize / 2, csize, csize);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(-csize / 2, -csize / 2, csize, csize);
        ctx.fillStyle = '#ff007f';
        ctx.fillRect(-csize / 4, -csize / 4, csize / 2, csize / 2);
        ctx.restore();

        // Title overlay banner
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, 44);
        ctx.fillStyle = '#00f0ff';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NEON DASH', W / 2, 28);
    }

    drawNeonDashThumbnail();

    const img = new Image();
    img.src = 'assets/images/neon-dash-thumb.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
    };
})();


// --- Smooth scroll for nav links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});


// --- Game Search & Category Filtering ---
(function initGameSearchAndFilters() {
    const searchInput = document.getElementById('game-search');
    const clearBtn = document.getElementById('search-clear-btn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const resultsCountEl = document.getElementById('results-count');
    const activeFilterIndicatorEl = document.getElementById('active-filter-indicator');
    const noResultsEl = document.getElementById('no-results-msg');
    const resetBtn = document.getElementById('btn-reset-filters');
    const cards = Array.from(document.querySelectorAll('.games-grid .game-card'));

    if (!cards.length) return;

    let currentCategory = 'all';
    let searchQuery = '';

    // Calculate initial counts per category and update button labels
    const categoryCounts = { all: cards.length };
    filterBtns.forEach(btn => {
        const cat = btn.dataset.category;
        if (cat && cat !== 'all') {
            categoryCounts[cat] = cards.filter(card => {
                const cats = (card.dataset.category || '').toLowerCase().split(/\s+/);
                return cats.includes(cat);
            }).length;
        }
    });

    filterBtns.forEach(btn => {
        const cat = btn.dataset.category;
        const count = categoryCounts[cat] !== undefined ? categoryCounts[cat] : 0;
        let countSpan = btn.querySelector('.filter-count');
        if (!countSpan) {
            countSpan = document.createElement('span');
            countSpan.className = 'filter-count';
            btn.appendChild(countSpan);
        }
        countSpan.textContent = `(${count})`;
    });

    function applyFilter() {
        const query = searchQuery.trim().toLowerCase();
        const rawTokens = query.split(/\s+/).filter(Boolean);
        const cleanTokens = query.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

        let visibleCount = 0;

        cards.forEach(card => {
            const title = (card.dataset.title || '').toLowerCase();
            const cats = (card.dataset.category || '').toLowerCase().split(/\s+/);
            const tags = (card.dataset.tags || '').toLowerCase();
            const desc = (card.querySelector('.card-info p')?.textContent || '').toLowerCase();
            const searchableRaw = `${title} ${cats.join(' ')} ${tags} ${desc}`;
            const searchableClean = searchableRaw.replace(/[^a-z0-9\s]/g, ' ');

            // Category match
            const matchesCategory = currentCategory === 'all' || cats.includes(currentCategory);

            // Search query match (either raw tokens match raw text or cleaned tokens match normalized text)
            const matchesSearch = rawTokens.length === 0 || 
                rawTokens.every(token => searchableRaw.includes(token)) ||
                (cleanTokens.length > 0 && cleanTokens.every(token => searchableClean.includes(token)));

            const isVisible = matchesCategory && matchesSearch;
            card.style.display = isVisible ? '' : 'none';

            if (isVisible) {
                visibleCount++;
            }
        });

        // Toggle no-results container
        if (noResultsEl) {
            noResultsEl.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        // Toggle search clear button
        if (clearBtn) {
            clearBtn.style.display = query.length > 0 ? 'block' : 'none';
        }

        // Update results counter
        if (resultsCountEl) {
            resultsCountEl.textContent = `SHOWING ${visibleCount} OF ${cards.length} GAMES`;
        }

        // Update active filter label
        if (activeFilterIndicatorEl) {
            const catName = currentCategory.toUpperCase();
            if (query) {
                activeFilterIndicatorEl.textContent = `CATEGORY: ${catName} | SEARCH: "${query}"`;
            } else {
                activeFilterIndicatorEl.textContent = `CATEGORY: ${catName}`;
            }
        }
    }

    // Category button click handling
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category || 'all';
            applyFilter();
        });
    });

    // Search input handling
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            applyFilter();
        });

        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                searchQuery = '';
                searchInput.focus();
                applyFilter();
            });
        }
    }

    // Reset filters button in no-results box
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            searchQuery = '';
            currentCategory = 'all';
            filterBtns.forEach(b => {
                b.classList.toggle('active', b.dataset.category === 'all');
            });
            applyFilter();
            if (searchInput) searchInput.focus();
        });
    }

    // Keyboard shortcut: '/' or 'Ctrl+K' to focus search, 'Escape' to clear and blur
    window.addEventListener('keydown', (e) => {
        if (!searchInput) return;
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea') {
            if (e.key === 'Escape') {
                searchInput.value = '';
                searchQuery = '';
                applyFilter();
                searchInput.blur();
            }
            return;
        }

        if (e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    // Initial filter run
    applyFilter();
})();

