/**
 * PrakanGuard Admin Command Center - Liquid Water Droplet Cursor & Splash Engine
 */

export function initWaterCursor() {
  if (typeof window === 'undefined') return;

  const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!mediaQuery.matches) return;

  document.body.classList.add('water-cursor-enabled');

  // 1. Create Canvas Overlay for Splash & Ripples
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
    if (ctx) ctx.scale(dpr, dpr);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // 2. Create Water Droplet Cursor Element
  const cursorWrap = document.createElement('div');
  cursorWrap.id = 'admin-water-cursor-wrap';
  cursorWrap.style.position = 'fixed';
  cursorWrap.style.top = '0';
  cursorWrap.style.left = '0';
  cursorWrap.style.width = '32px';
  cursorWrap.style.height = '32px';
  cursorWrap.style.pointerEvents = 'none';
  cursorWrap.style.zIndex = '9999999';
  cursorWrap.style.transformOrigin = '16px 2px';
  cursorWrap.style.opacity = '0';
  cursorWrap.style.willChange = 'transform';
  cursorWrap.style.transition = 'opacity 0.15s ease';

  cursorWrap.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 32 32" style="overflow: visible; filter: drop-shadow(0 3px 8px rgba(2, 132, 199, 0.45)) drop-shadow(0 0 4px rgba(56, 189, 248, 0.6));">
      <defs>
        <linearGradient id="pg-admin-droplet" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stop-color="#e0f2fe" stop-opacity="0.98" />
          <stop offset="22%" stop-color="#38bdf8" stop-opacity="0.94" />
          <stop offset="68%" stop-color="#0284c7" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#0369a1" stop-opacity="0.98" />
        </linearGradient>
        <linearGradient id="pg-admin-shine" x1="0%" y1="0%" x2="40%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.98" />
          <stop offset="60%" stop-color="#ffffff" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      <path d="M 16,2 C 12,7 6,15 6,22 C 6,27.5 10.5,31 16,31 C 21.5,31 26,27.5 26,22 C 26,15 20,7 16,2 Z"
        fill="url(#pg-admin-droplet)" stroke="rgba(255, 255, 255, 0.85)" stroke-width="0.8" />
      <ellipse cx="16" cy="23" rx="6" ry="4.5" fill="rgba(14, 165, 233, 0.35)" />
      <path d="M 14,7 C 10,12 8.5,17 9,21" fill="none" stroke="url(#pg-admin-shine)" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="21" cy="24" r="1.3" fill="#ffffff" opacity="0.75" />
      <circle cx="15.8" cy="4.2" r="0.9" fill="#ffffff" opacity="0.95" />
    </svg>
  `;
  document.body.appendChild(cursorWrap);

  // 3. Audio synthesis for splash
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

  // 4. Splash Pools & Simulation
  const ripples = [];
  const particles = [];
  let isLoopRunning = false;
  let animId = null;

  function triggerSplash(x, y) {
    // 2 Water concentric shockwaves
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

    // 18 Droplets
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.45;
      const speed = 2.4 + Math.random() * 5.0;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.0 + Math.random() * 2.8,
        alpha: 1.0,
        decay: 0.022 + Math.random() * 0.016,
        gravity: 0.13,
        drag: 0.94,
        isMist: false
      });
    }

    // 8 Mist specks
    for (let j = 0; j < 8; j++) {
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

    // Ripples
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

    // Droplets
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
      animId = requestAnimationFrame(runLoop);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      isLoopRunning = false;
    }
  }

  // 5. Cursor Motion Dynamics
  let mouseX = -100;
  let mouseY = -100;
  let prevX = -100;
  let prevY = -100;
  let currentAngle = -38;
  let isDown = false;
  let isHover = false;
  let isText = false;
  let isVisible = false;

  function updateTransform() {
    if (!isVisible || isText) {
      cursorWrap.style.opacity = '0';
      return;
    }
    cursorWrap.style.opacity = '1';

    const vx = mouseX - prevX;
    const vy = mouseY - prevY;
    const speed = Math.sqrt(vx * vx + vy * vy);
    prevX = mouseX;
    prevY = mouseY;

    let targetAngle = -38;
    if (speed > 3) {
      const moveAngleDeg = (Math.atan2(vy, vx) * 180) / Math.PI;
      targetAngle = -38 + Math.sin((moveAngleDeg * Math.PI) / 180) * 15;
    }
    currentAngle += (targetAngle - currentAngle) * 0.2;

    let scaleX = 1;
    let scaleY = 1;

    if (isDown) {
      scaleX = 1.32;
      scaleY = 0.68;
    } else if (isHover) {
      scaleX = 1.18;
      scaleY = 1.18;
    } else if (speed > 4) {
      const stretch = Math.min(speed * 0.006, 0.25);
      scaleX = 1 - stretch * 0.5;
      scaleY = 1 + stretch;
    }

    cursorWrap.style.transform = `translate3d(${mouseX - 16}px, ${mouseY - 2}px, 0) rotate(${currentAngle}deg) scale(${scaleX}, ${scaleY})`;
  }

  function checkInteractive(el) {
    if (!el || !(el instanceof Element)) return false;
    return Boolean(
      el.closest('a, button, [role="button"], select, label, summary, .btn, .nav-item, .card, [onclick], [tabindex]:not([tabindex="-1"])')
    );
  }

  function checkTextInput(el) {
    if (!el || !(el instanceof Element)) return false;
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag === 'textarea') return true;
    if (tag === 'input') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'file', 'color'].includes(type);
    }
    return el.isContentEditable;
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') {
      isVisible = false;
      updateTransform();
      return;
    }
    isVisible = true;
    mouseX = e.clientX;
    mouseY = e.clientY;

    const target = document.elementFromPoint(e.clientX, e.clientY);
    isHover = checkInteractive(target);
    isText = checkTextInput(target);

    updateTransform();
  }, { passive: true });

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    isDown = true;
    updateTransform();
    triggerSplash(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener('pointerup', () => {
    isDown = false;
    updateTransform();
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    isVisible = false;
    updateTransform();
  });

  document.addEventListener('mouseenter', () => {
    isVisible = true;
    updateTransform();
  });

  window.addEventListener('touchstart', () => {
    isVisible = false;
    updateTransform();
  }, { passive: true });
}
