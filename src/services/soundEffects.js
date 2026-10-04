// PrakanGuard Premium Interactive Web Audio & Micro-Haptic Sound Engine
// Robust zero-latency synthesized acoustic feedback tailored for civic web & admin control center

let audioCtx = null;

export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

// Master Audio Context Exec: Guarantees audio playback even if context was suspended by browser autoplay policy
function withAudioContext(callback) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        try { callback(ctx, ctx.currentTime); } catch (e) {}
      }).catch(() => {});
    } else {
      callback(ctx, ctx.currentTime);
    }
  } catch (e) {}
}

// Mobile Web Audio Autoplay Unlocker: Instantly activates Web Audio on any touch or click gesture
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        // Play an ultra-short inaudible buffer to warm up the audio hardware
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch (e) {}
  };

  ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, unlockAudio, { passive: true, once: false });
  });
}

/* ==========================================================================
   1. MAIN CITIZEN WEBSITE SOUND SUITE (Friendly, Organic, Civic Acoustics)
   ========================================================================== */

/**
 * Standard tactile button click (Crisp bubble pop)
 */
export function playClickSound() {
  withAudioContext((ctx, now) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.05);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.055);
  });
}

/**
 * Map Pin Selection / Flood Marker Tap (Delightful water-droplet pop)
 */
export function playPinClickSound() {
  withAudioContext((ctx, now) => {
    // Note 1: High crisp pop
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(840, now);
    osc1.frequency.exponentialRampToValueAtTime(1180, now + 0.04);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.065);

    // Note 2: Warm resonance
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1050, now + 0.02);
    gain2.gain.setValueAtTime(0.25, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.085);
  });
}

/**
 * Main Web Tab Navigation Switch (Smooth dual-tone tick)
 */
export function playTabSound() {
  withAudioContext((ctx, now) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.setValueAtTime(820, now + 0.03);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.075);
  });
}

/**
 * Modal Open / Overlay Show (Ascending bright welcoming chord)
 */
export function playModalOpenSound() {
  withAudioContext((ctx, now) => {
    const freqs = [440.00, 554.37, 659.25]; // A4 -> C#5 -> E5
    freqs.forEach((freq, idx) => {
      const startTime = now + idx * 0.035;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + 0.09);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.13);
    });
  });
}

/**
 * Modal Close / Dismiss (Soft downward acoustic tap)
 */
export function playCloseSound() {
  withAudioContext((ctx, now) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.07);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  });
}

/**
 * Toggle Switch sound (Day/Night & Layer Switch)
 */
export function playToggleSound(isOn = true) {
  withAudioContext((ctx, now) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    if (isOn) {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.045); // A5
    } else {
      osc.frequency.setValueAtTime(880.00, now); // A5
      osc.frequency.setValueAtTime(587.33, now + 0.045); // D5
    }

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  });
}

/**
 * Telemetry Refresh & Auto Sync Sound (Melodic water arpeggio)
 */
export function playRefreshSound() {
  withAudioContext((ctx, now) => {
    const freqs = [659.25, 783.99, 1046.50, 1318.51];
    freqs.forEach((freq, idx) => {
      const startTime = now + idx * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.26, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.13);
    });
  });
}

/**
 * Selection / Filter Chips / District Dropdown
 */
export function playSelectSound() {
  withAudioContext((ctx, now) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.04);

    gain.gain.setValueAtTime(0.30, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  });
}

/**
 * GPS Location Ping (Crisp resonant radar pulse)
 */
export function playGpsSound() {
  withAudioContext((ctx, now) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1174.66, now); // D6
    osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.07); // G6
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  });
}

/**
 * Citizen Report / Submit Success (Harmonious triumphant chord)
 */
export function playSuccessSound() {
  withAudioContext((ctx, now) => {
    const notes = [
      { freq: 587.33, delay: 0, dur: 0.30 },    // D5
      { freq: 880.00, delay: 0.05, dur: 0.35 }, // A5
      { freq: 1174.66, delay: 0.10, dur: 0.40 } // D6
    ];

    notes.forEach(({ freq, delay, dur }) => {
      const startTime = now + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.30, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + dur + 0.02);
    });
  });
}

/**
 * Citizen Action Modal Chime
 */
export function playReportSound() {
  withAudioContext((ctx, now) => {
    [587.33, 880.00].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0.28, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.20);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.22);
    });
  });
}

/**
 * Emergency hotline / Warning sound
 */
export function playEmergencySound() {
  withAudioContext((ctx, now) => {
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(784, now);
    gain1.gain.setValueAtTime(0.32, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.12);
    gain2.gain.setValueAtTime(0.32, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.34);
  });
}

/**
 * PrakanGuard AI Assistant Sound
 */
export function playAiChatSound() {
  withAudioContext((ctx, now) => {
    const notes = [783.99, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    });
  });
}

/* ==========================================================================
   2. ADMIN DASHBOARD CONTROL CENTER SOUND SUITE (Distinct Cyber / Tactical)
   ========================================================================== */

/**
 * Admin Tab Switch (High-tech digital command console blip)
 */
export function playAdminTabSound() {
  withAudioContext((ctx, now) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.025);
    osc.frequency.setValueAtTime(1320, now + 0.05);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.085);
  });
}

/**
 * Admin Approve Action (Crisp authoritative command confirmation)
 */
export function playAdminApproveSound() {
  withAudioContext((ctx, now) => {
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C5 -> E5 -> G5 -> C6
    chords.forEach((freq, idx) => {
      const t = now + idx * 0.035;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.18);
    });
  });
}

/**
 * Admin Reject / Delete / Revoke (Tactical command buzz & alert)
 */
export function playAdminRejectSound() {
  withAudioContext((ctx, now) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  });
}

/**
 * Admin Resolve Action (Smooth positive water-cleared chime)
 */
export function playAdminResolveSound() {
  withAudioContext((ctx, now) => {
    const notes = [659.25, 830.61, 987.77, 1318.51]; // E5 -> G#5 -> B5 -> E6
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.26, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.22);
    });
  });
}

/**
 * Admin GPS Coordinate FlyTo / Inspection (Tactical radar lock ping)
 */
export function playAdminGpsSound() {
  withAudioContext((ctx, now) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1480, now);
    osc.frequency.exponentialRampToValueAtTime(1920, now + 0.05);
    osc.frequency.setValueAtTime(1480, now + 0.09);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.19);
  });
}

/**
 * Admin Broadcast / Edit Water Level Save (Digital terminal sequence)
 */
export function playAdminTerminalSound() {
  withAudioContext((ctx, now) => {
    [880, 1175, 1480].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.03);

      gain.gain.setValueAtTime(0.16, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.06);
    });
  });
}

/**
 * General Danger / Warning sound
 */
export function playDangerSound() {
  playAdminRejectSound();
}
