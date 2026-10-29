import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playWaterSplashSound } from '../services/soundEffects';

/**
 * PrakanGuard Native Hardware Water Droplet Cursor & Splash Engine
 * - Uses 100% native OS hardware cursor plane (via CSS SVG data-URI cursor)
 *   so cursor movement tracks the user's physical device mouse at native OS refresh rate (60Hz-240Hz+) with 0ms latency
 * - Zero pointermove listeners or DOM reflows during mouse movement
 * - 60/120fps Canvas water splash physics (expanding shockwave ripples + liquid splash beads) on click
 * - Zero CPU overhead when idle (RAF automatically stops when particles dissipate)
 */
export default function WaterCursor() {
  const canvasRef = useRef(null);

  // Particle and Ripple pools
  const particlesRef = useRef([]);
  const ripplesRef = useRef([]);
  const animFrameIdRef = useRef(null);
  const isLoopRunningRef = useRef(false);

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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }, []);

  // High-performance Canvas animation loop (Runs only when click splash is active)
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
      animFrameIdRef.current = requestAnimationFrame(runAnimationLoop);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      isLoopRunningRef.current = false;
    }
  }, []);

  // Spawn water splash effect on click
  const triggerWaterSplash = useCallback((x, y) => {
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

    const particleCount = 16;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.45;
      const speed = 2.4 + Math.random() * 5.0;
      particlesRef.current.push({
        x,
        y,
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

    playWaterSplashSound();

    if (!isLoopRunningRef.current) {
      isLoopRunningRef.current = true;
      runAnimationLoop();
    }
  }, [runAnimationLoop]);

  useEffect(() => {
    if (!isFinePointer) {
      document.body.classList.remove('water-cursor-enabled');
      return;
    }

    document.body.classList.add('water-cursor-enabled');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    const handlePointerDown = (e) => {
      if (e.pointerType === 'touch') return;
      triggerWaterSplash(e.clientX, e.clientY);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    return () => {
      document.body.classList.remove('water-cursor-enabled');
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointerdown', handlePointerDown);

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isFinePointer, resizeCanvas, triggerWaterSplash]);

  if (!isFinePointer) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999998]"
      style={{ width: '100vw', height: '100vh' }}
      aria-hidden="true"
    />
  );
}
