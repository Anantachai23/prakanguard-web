/**
 * PrakanGuard Admin Command Center - Native Hardware Water Droplet Cursor & Splash Engine
 * - Uses native OS hardware cursor plane via CSS SVG data-URI cursor (0ms latency, 1:1 with user device mouse)
 * - Lightweight click-only Canvas water splash ripple engine
 */

export function initWaterCursor() {
  if (typeof window === 'undefined') return;

  const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!mediaQuery.matches) return;

  // Ensure legacy cursor:none class is never active
  document.body.classList.remove('water-cursor-enabled');

  // 1. Create Canvas Overlay for Splash & Ripples on Click
  const canvas = document.createElement('canvas');
  canvas.id = 'admin-water-splash-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999998';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // 2. Audio synthesis for splash
  function playSplashAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const actx = new AudioCtx();
      if (actx.state === 'suspended') actx.resume();
      const now = actx.currentTime;

      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1080, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.035);
      osc.frequency.exponentialRampToValueAtTime(1380, now + 0.07);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (_) {}
  }

  // 3. Splash Pools & Simulation
  const ripples = [];
  const particles = [];
  let isLoopRunning = false;

  function triggerSplash(x, y) {
    ripples.push({
      x, y,
      radius: 3,
      maxRadius: 50 + Math.random() * 12,
      speed: 2.7,
      alpha: 0.85,
      decay: 0.028
    });
    ripples.push({
      x, y,
      radius: 1,
      maxRadius: 34 + Math.random() * 8,
      speed: 1.8,
      alpha: 0.65,
      decay: 0.024
    });

    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5) * 0.45;
      const speed = 2.4 + Math.random() * 5.0;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.0 + Math.random() * 2.6,
        alpha: 1.0,
        decay: 0.024 + Math.random() * 0.016,
        gravity: 0.13,
        drag: 0.94,
        isMist: false
      });
    }

    for (let j = 0; j < 6; j++) {
      const mAngle = Math.random() * Math.PI * 2;
      const mSpeed = 1.0 + Math.random() * 3.5;
      particles.push({
        x, y,
        vx: Math.cos(mAngle) * mSpeed,
        vy: Math.sin(mAngle) * mSpeed,
        radius: 0.9 + Math.random() * 1.1,
        alpha: 0.85,
        decay: 0.038 + Math.random() * 0.02,
        gravity: 0.06,
        drag: 0.92,
        isMist: true
      });
    }

    playSplashAudio();

    if (!isLoopRunning) {
      isLoopRunning = true;
      runLoop();
    }
  }

  function runLoop() {
    if (!ctx) {
      isLoopRunning = false;
      return;
    }
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.radius += r.speed;
      r.alpha -= r.decay;

      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        ripples.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(186, 230, 253, ${Math.max(0, r.alpha * 0.85)})`;
      ctx.lineWidth = Math.max(0.6, 2.4 * (1 - r.radius / r.maxRadius));
      ctx.shadowColor = 'rgba(56, 189, 248, 0.65)';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.restore();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.alpha -= p.decay;
      p.radius = Math.max(0.4, p.radius * 0.985);

      if (p.alpha <= 0 || p.radius <= 0.4) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      const grad = ctx.createRadialGradient(
        p.x - p.radius * 0.35, p.y - p.radius * 0.35, p.radius * 0.1,
        p.x, p.y, p.radius
      );
      grad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha * 0.95})`);
      grad.addColorStop(0.35, `rgba(56, 189, 248, ${p.alpha * 0.9})`);
      grad.addColorStop(0.75, `rgba(2, 132, 199, ${p.alpha * 0.85})`);
      grad.addColorStop(1, `rgba(3, 105, 161, ${p.alpha * 0.75})`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(56, 189, 248, 0.45)';
      ctx.shadowBlur = 3;
      ctx.fill();

      if (!p.isMist && p.radius > 1.4) {
        ctx.beginPath();
        ctx.arc(p.x - p.radius * 0.35, p.y - p.radius * 0.35, p.radius * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.9})`;
        ctx.shadowBlur = 0;
        ctx.fill();
      }
      ctx.restore();
    }

    if (ripples.length > 0 || particles.length > 0) {
      requestAnimationFrame(runLoop);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      isLoopRunning = false;
    }
  }

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    triggerSplash(e.clientX, e.clientY);
  }, { passive: true });
}
