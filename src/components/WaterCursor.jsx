import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playWaterSplashSound } from '../services/soundEffects';

/**
 * PrakanGuard Dynamic Water Droplet Cursor & Splash Engine
 * - Custom hydrodynamic water droplet cursor for desktop pointer devices
 * - Organic tilt and stretch based on cursor velocity
 * - Micro-interaction hover states on clickable elements
 * - 60/120fps Canvas water splash physics (expanding shockwave ripples + liquid splash beads) on click
 * - Native text caret preserved for text input elements
 * - Zero CPU overhead when idle (RAF automatically stops when particles dissipate)
 */
export default function WaterCursor() {
  const cursorRef = useRef(null);
  const canvasRef = useRef(null);

  // Particle and Ripple pools
  const particlesRef = useRef([]);
  const ripplesRef = useRef([]);
  const animFrameIdRef = useRef(null);
  const isLoopRunningRef = useRef(false);

  // Position and Physics tracking
  const posRef = useRef({ x: -100, y: -100 });
  const prevPosRef = useRef({ x: -100, y: -100 });
  const velocityRef = useRef({ x: 0, y: 0, speed: 0 });
  const currentAngleRef = useRef(-38); // Standard tilt angle
  const isMouseDownRef = useRef(false);
  const isHoveringRef = useRef(false);
  const isTextInputRef = useRef(false);
  const isVisibleRef = useRef(false);

  // State to control initial fine pointer detection
  const [isFinePointer, setIsFinePointer] = useState(false);

  // Detect whether device has a precision pointer (Desktop mouse/trackpad)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsFinePointer(mediaQuery.matches);

    const handleChange = (e) => setIsFinePointer(e.matches);
    try {
      mediaQuery.addEventListener('change', handleChange);
    } catch (_) {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      try {
        mediaQuery.removeEventListener('change', handleChange);
      } catch (_) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Update canvas dimensions on window resize
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  // Spawn water splash effect on click
  const triggerWaterSplash = useCallback((x, y) => {
    // 1. Concentric Water Shockwave Ripples
    ripplesRef.current.push({
      x,
      y,
      radius: 3,
      maxRadius: 52 + Math.random() * 14,
      speed: 2.8,
      alpha: 0.85,
      decay: 0.028
    });
    ripplesRef.current.push({
      x,
      y,
      radius: 1,
      maxRadius: 36 + Math.random() * 8,
      speed: 1.8,
      alpha: 0.65,
      decay: 0.024
    });

    // 2. Water Droplet Splash Beads (Radial dispersion with natural arc & drag)
    const particleCount = 18;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.45;
      const speed = 2.4 + Math.random() * 5.2;
      particlesRef.current.push({
        x,
        y,
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

    // 3. Fine Micro-spray Mist
    for (let j = 0; j < 8; j++) {
      const mAngle = Math.random() * Math.PI * 2;
      const mSpeed = 1.0 + Math.random() * 3.5;
      particlesRef.current.push({
        x,
        y,
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

    // Play subtle synthesized water droplet chime
    playWaterSplashSound();

    // Start canvas animation loop if currently idle
    if (!isLoopRunningRef.current) {
      isLoopRunningRef.current = true;
      runAnimationLoop();
    }
  }, []);

  // High-performance Canvas animation loop (Runs only when splash active)
  const runAnimationLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      isLoopRunningRef.current = false;
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      isLoopRunningRef.current = false;
      return;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const ripples = ripplesRef.current;
    const particles = particlesRef.current;

    // Render & update expanding ripples
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

    // Render & update splash droplet beads
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
      // 3D Liquid droplet gradient
      const grad = ctx.createRadialGradient(
        p.x - p.radius * 0.35,
        p.y - p.radius * 0.35,
        p.radius * 0.1,
        p.x,
        p.y,
        p.radius
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

      // Specular highlight gleam
      if (!p.isMist && p.radius > 1.4) {
        ctx.beginPath();
        ctx.arc(p.x - p.radius * 0.35, p.y - p.radius * 0.35, p.radius * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.9})`;
        ctx.shadowBlur = 0;
        ctx.fill();
      }
      ctx.restore();
    }

    // Keep loop active until all water elements have dissolved
    if (ripples.length > 0 || particles.length > 0) {
      animFrameIdRef.current = requestAnimationFrame(runAnimationLoop);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      isLoopRunningRef.current = false;
    }
  }, []);

  // Update cursor transformation (position, hydrodynamic tilt & squash)
  const updateCursorTransform = useCallback(() => {
    const el = cursorRef.current;
    if (!el) return;

    const { x, y } = posRef.current;
    const isDown = isMouseDownRef.current;
    const isHover = isHoveringRef.current;
    const isText = isTextInputRef.current;
    const isVis = isVisibleRef.current;

    // Check visibility
    if (!isVis || isText) {
      el.style.opacity = '0';
      return;
    }

    el.style.opacity = '1';

    // Calculate velocity for hydrodynamic tilt and stretch
    const vx = x - prevPosRef.current.x;
    const vy = y - prevPosRef.current.y;
    const speed = Math.sqrt(vx * vx + vy * vy);
    velocityRef.current = { x: vx, y: vy, speed };
    prevPosRef.current = { x, y };

    let targetAngle = -38;
    if (speed > 3) {
      // Slightly lean towards movement vector
      const moveAngleDeg = (Math.atan2(vy, vx) * 180) / Math.PI;
      targetAngle = -38 + Math.sin((moveAngleDeg * Math.PI) / 180) * 15;
    }
    // Smooth angle lerp
    currentAngleRef.current += (targetAngle - currentAngleRef.current) * 0.2;

    // Dynamic squash and stretch
    let scaleX = 1;
    let scaleY = 1;

    if (isDown) {
      // Squash on click impact
      scaleX = 1.32;
      scaleY = 0.68;
    } else if (isHover) {
      // Expand on interactive hover
      scaleX = 1.18;
      scaleY = 1.18;
    } else if (speed > 4) {
      // Hydrodynamic stretch when gliding fast
      const stretch = Math.min(speed * 0.006, 0.25);
      scaleX = 1 - stretch * 0.5;
      scaleY = 1 + stretch;
    }

    // Hotspot is apex tip at (16, 2) in 32x32 SVG, anchored at (x, y)
    el.style.transform = `translate3d(${x - 16}px, ${y - 2}px, 0) rotate(${currentAngleRef.current}deg) scale(${scaleX}, ${scaleY})`;
  }, []);

  // Listeners setup when fine pointer is active
  useEffect(() => {
    if (!isFinePointer) {
      document.body.classList.remove('water-cursor-enabled');
      return;
    }

    document.body.classList.add('water-cursor-enabled');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Target element classification helpers
    const checkInteractive = (target) => {
      if (!target || !(target instanceof Element)) return false;
      return Boolean(
        target.closest(
          'a, button, [role="button"], select, label, summary, ' +
          '.cursor-pointer, .leaflet-interactive, .leaflet-control, .interactive-hover, ' +
          '[onclick], [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    const checkTextInput = (target) => {
      if (!target || !(target instanceof Element)) return false;
      const tag = target.tagName ? target.tagName.toLowerCase() : '';
      if (tag === 'textarea') return true;
      if (tag === 'input') {
        const type = (target.getAttribute('type') || 'text').toLowerCase();
        return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'file', 'color'].includes(type);
      }
      return target.isContentEditable;
    };

    const handlePointerMove = (e) => {
      if (e.pointerType === 'touch') {
        isVisibleRef.current = false;
        updateCursorTransform();
        return;
      }

      isVisibleRef.current = true;
      posRef.current = { x: e.clientX, y: e.clientY };

      const target = document.elementFromPoint(e.clientX, e.clientY);
      isHoveringRef.current = checkInteractive(target);
      isTextInputRef.current = checkTextInput(target);

      updateCursorTransform();
    };

    const handlePointerDown = (e) => {
      if (e.pointerType === 'touch') return;
      isMouseDownRef.current = true;
      updateCursorTransform();

      // Trigger rich water splash effect
      triggerWaterSplash(e.clientX, e.clientY);
    };

    const handlePointerUp = () => {
      isMouseDownRef.current = false;
      updateCursorTransform();
    };

    const handleMouseLeave = () => {
      isVisibleRef.current = false;
      updateCursorTransform();
    };

    const handleMouseEnter = () => {
      isVisibleRef.current = true;
      updateCursorTransform();
    };

    const handleTouchStart = () => {
      // Instantly hide on touchscreens
      isVisibleRef.current = false;
      updateCursorTransform();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      document.body.classList.remove('water-cursor-enabled');
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('touchstart', handleTouchStart);

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isFinePointer, resizeCanvas, triggerWaterSplash, updateCursorTransform]);

  if (!isFinePointer) return null;

  return (
    <>
      {/* 1. Water Splash & Shockwave Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[9999998]"
        style={{ width: '100vw', height: '100vh' }}
        aria-hidden="true"
      />

      {/* 2. Fluid Water Droplet Cursor Element */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999999] will-change-transform transition-opacity duration-150"
        style={{
          width: '32px',
          height: '32px',
          transformOrigin: '16px 2px',
          opacity: 0
        }}
        aria-hidden="true"
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="overflow-visible"
          style={{
            filter: 'drop-shadow(0 3px 8px rgba(2, 132, 199, 0.45)) drop-shadow(0 0 4px rgba(56, 189, 248, 0.6))'
          }}
        >
          <defs>
            {/* Primary Aquatic Liquid Gradient */}
            <linearGradient id="pg-droplet-body" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.98" />
              <stop offset="22%" stopColor="#38bdf8" stopOpacity="0.94" />
              <stop offset="68%" stopColor="#0284c7" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.98" />
            </linearGradient>

            {/* Specular White Caustic Rim */}
            <linearGradient id="pg-droplet-shine" x1="0%" y1="0%" x2="40%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Droplet Body: Precision Apex at (16, 2) */}
          <path
            d="M 16,2 C 12,7 6,15 6,22 C 6,27.5 10.5,31 16,31 C 21.5,31 26,27.5 26,22 C 26,15 20,7 16,2 Z"
            fill="url(#pg-droplet-body)"
            stroke="rgba(255, 255, 255, 0.85)"
            strokeWidth="0.8"
          />

          {/* Internal Refraction Depth Sphere */}
          <ellipse cx="16" cy="23" rx="6" ry="4.5" fill="rgba(14, 165, 233, 0.35)" />

          {/* 3D Glass Surface Gloss Arc */}
          <path
            d="M 14,7 C 10,12 8.5,17 9,21"
            fill="none"
            stroke="url(#pg-droplet-shine)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Secondary Light Glints */}
          <circle cx="21" cy="24" r="1.3" fill="#ffffff" opacity="0.75" />
          <circle cx="15.8" cy="4.2" r="0.9" fill="#ffffff" opacity="0.95" />
        </svg>
      </div>
    </>
  );
}
