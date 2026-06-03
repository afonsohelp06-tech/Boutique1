/**
 * Animation canvas du bandeau d'accueil — boutique_nhalabene.html
 */
(function () {
    let canvas, ctx, points = [];
    let started = false;

    function resizeCanvas() {
        if (!canvas) return false;
        const parent = canvas.parentElement;
        const w = parent ? parent.clientWidth : canvas.offsetWidth;
        const h = parent ? parent.clientHeight : canvas.offsetHeight;
        if (w < 2 || h < 2) return false;
        canvas.width = w;
        canvas.height = h;
        return true;
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

    function seedPoints() {
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
    }

    function initHeroCanvas() {
        canvas = document.getElementById('hero-motion-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        if (!resizeCanvas()) {
            requestAnimationFrame(initHeroCanvas);
            return;
        }
        seedPoints();
        if (!started) {
            started = true;
            window.addEventListener('resize', () => {
                resizeCanvas();
            });
            requestAnimationFrame(animateHeroCanvas);
        }
    }

    function boot() {
        initHeroCanvas();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
    window.addEventListener('load', boot);
})();
