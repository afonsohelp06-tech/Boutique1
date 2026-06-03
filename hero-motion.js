/**
 * Animation canvas hero — identique a boutique_nhalabene.html
 */
var heroCanvas, heroCtx, heroPoints = [];

function resizeHeroCanvas() {
    if (!heroCanvas) return;
    heroCanvas.width = heroCanvas.offsetWidth;
    heroCanvas.height = heroCanvas.offsetHeight;
}

function animateHeroCanvas() {
    if (!heroCanvas || !heroCtx) return;

    heroCtx.fillStyle = 'rgba(15, 15, 15, 0.08)';
    heroCtx.fillRect(0, 0, heroCanvas.width, heroCanvas.height);
    heroCtx.strokeStyle = 'rgba(197, 168, 128, 0.06)';
    heroCtx.lineWidth = 0.5;

    for (var i = 0; i < heroPoints.length; i++) {
        var p1 = heroPoints[i];
        p1.x += p1.vx;
        p1.y += p1.vy;
        if (p1.x < 0 || p1.x > heroCanvas.width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > heroCanvas.height) p1.vy *= -1;

        heroCtx.beginPath();
        heroCtx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        heroCtx.fillStyle = 'rgba(197, 168, 128, 0.25)';
        heroCtx.fill();

        for (var j = i + 1; j < heroPoints.length; j++) {
            var p2 = heroPoints[j];
            var dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (dist < 150) {
                heroCtx.beginPath();
                heroCtx.moveTo(p1.x, p1.y);
                heroCtx.lineTo(p2.x, p2.y);
                heroCtx.stroke();
            }
        }
    }
    requestAnimationFrame(animateHeroCanvas);
}

function initHeroCanvas() {
    heroCanvas = document.getElementById('hero-motion-canvas');
    if (!heroCanvas) return;

    heroCtx = heroCanvas.getContext('2d');
    resizeHeroCanvas();

    if (heroCanvas.width < 2 || heroCanvas.height < 2) {
        setTimeout(initHeroCanvas, 100);
        return;
    }

    heroPoints = [];
    for (var i = 0; i < 30; i++) {
        heroPoints.push({
            x: Math.random() * heroCanvas.width,
            y: Math.random() * heroCanvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 1
        });
    }

    if (!heroCanvas.dataset.motionRunning) {
        heroCanvas.dataset.motionRunning = '1';
        requestAnimationFrame(animateHeroCanvas);
    }

    if (!heroCanvas.dataset.resizeBound) {
        heroCanvas.dataset.resizeBound = '1';
        window.addEventListener('resize', resizeHeroCanvas);
    }
}

window.initHeroCanvas = initHeroCanvas;
