/**
 * Animation canvas du bandeau d'accueil — identique à boutique_nhalabene.html
 */
let canvas, ctx, points = [];
let heroMotionInitialized = false;
let heroMotionAnimating = false;

function resizeCanvas() {
    if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
}

function animateHeroCanvas() {
    if (!canvas || !ctx) return;

    ctx.fillStyle = 'rgba(15, 15, 15, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(197, 168, 128, 0.06)';
    ctx.lineWidth = 0.5;

    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > canvas.width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > canvas.height) p1.vy *= -1;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(197, 168, 128, 0.25)';
        ctx.fill();

        for (let j = i + 1; j < points.length; j++) {
            const p2 = points[j];
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (dist < 150) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animateHeroCanvas);
}

function initHeroCanvas() {
    canvas = document.getElementById('hero-motion-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    resizeCanvas();
    if (canvas.width < 2 || canvas.height < 2) {
        requestAnimationFrame(initHeroCanvas);
        return;
    }

    if (!heroMotionInitialized) {
        heroMotionInitialized = true;
        window.addEventListener('resize', resizeCanvas);
    }

    points = [];
    for (let i = 0; i < 30; i++) {
        points.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 1
        });
    }

    if (!heroMotionAnimating) {
        heroMotionAnimating = true;
        requestAnimationFrame(animateHeroCanvas);
    }
}

document.addEventListener('DOMContentLoaded', initHeroCanvas);
