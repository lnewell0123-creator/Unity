/* ═══════════════════════════════════════════════════════════════
   Unity Effects — splash + interstellar-style particle backdrop

   Shared by every page in the project. Loaded as
     <script src="../effects.js"></script>          (inner pages)
     <script src="effects.js"></script>             (root index.html)

   Reads the following page-level attributes on <body>:
     data-no-particles          — skip the particle canvas
     data-no-splash             — skip the splash overlay
     data-theme-color           — particle / accent color (#rrggbb)
     data-splash-name           — override the splash title
     data-splash-bg             — override the splash background color
     data-particle-count        — hard-cap particle count (else auto)

   Reads CSS variables from :root:
     --particle-color           — hex/rgb color, falls back to #a29bfe
     --bg                       — dark page bg, used as splash bg fallback

   Exposes a tiny global API:
     window.UnityEffects.dismiss()        — manually skip splash
     window.UnityEffects.setVisitorName() — persist visitor name
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── helpers ────────────────────────────────────────────────────
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function hexToRgb(hex) {
    let h = String(hex || '').trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return { r: 162, g: 155, b: 254 }; // #a29bfe
    const num = parseInt(h, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgba(rgb, a) { return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`; }

  const $body = document.body;
  const noParticles = $body && $body.dataset.noParticles !== undefined;
  const noSplash    = $body && $body.dataset.noSplash !== undefined;
  const themeColor  = ($body && $body.dataset.themeColor) || cssVar('--particle-color', '#a29bfe');
  const splashName  = ($body && $body.dataset.splashName) || document.title || 'Unity';
  const splashBg    = ($body && $body.dataset.splashBg)   || cssVar('--bg', '#0b0b15');
  const explicitCount = parseInt(($body && $body.dataset.particleCount) || '', 10);
  const isCoarse = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const THEME = hexToRgb(themeColor);

  // ── inject shared CSS for splash + canvas ──────────────────────
  const style = document.createElement('style');
  style.textContent = `
    /* Splash overlay */
    #unity-splash {
      position: fixed; inset: 0;
      z-index: 2147483647;          /* same as the eruda sidebar; DOM order wins */
      background: ${splashBg};
      color: ${themeColor};
      display: flex;
      flex-direction: column;
      align-items: center; justify-content: center;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      cursor: pointer;
      user-select: none;
      opacity: 0;
      transform: scale(1.04);
      transition: opacity 380ms cubic-bezier(0.2, 0.8, 0.2, 1),
                  transform 480ms cubic-bezier(0.2, 0.8, 0.2, 1);
      pointer-events: none;        /* clicks fall through to elements below */
      overflow: hidden;
    }
    #unity-splash.shown {
      opacity: 1;
      transform: scale(1);
    }
    #unity-splash.fade-out {
      opacity: 0;
      transform: scale(0.985);
      transition: opacity 380ms ease-in, transform 380ms ease-in;
      pointer-events: none;
    }
    #unity-splash .us-bg {
      position: absolute; inset: 0;
      background:
        radial-gradient(ellipse 70% 50% at 50% 30%, ${rgba(THEME, 0.15)}, transparent 70%),
        radial-gradient(ellipse 60% 50% at 80% 100%, ${rgba(THEME, 0.10)}, transparent 70%);
      pointer-events: none;
      animation: us-bg-shift 6s ease-in-out infinite alternate;
    }
    @keyframes us-bg-shift {
      0%   { background-position: 50% 30%, 80% 100%; }
      100% { background-position: 50% 35%, 75% 95%; }
    }
    #unity-splash .us-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      animation: us-rise 600ms cubic-bezier(0.2, 0.8, 0.2, 1) 80ms both;
      pointer-events: auto;        /* only the inner card catches clicks */
      cursor: pointer;
    }
    @keyframes us-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

    #unity-splash .us-logo {
      width: 64px; height: 64px;
      border-radius: 18px;
      background: ${themeColor};
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 30px; font-weight: 800;
      box-shadow: 0 0 36px ${rgba(THEME, 0.55)}, 0 8px 30px rgba(0,0,0,0.5),
                  inset 0 1px 0 rgba(255,255,255,0.3);
      animation: us-logo-pulse 2.4s ease-in-out infinite;
    }
    @keyframes us-logo-pulse {
      0%, 100% { box-shadow: 0 0 36px ${rgba(THEME, 0.55)}, 0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3); }
      50%      { box-shadow: 0 0 56px ${rgba(THEME, 0.75)}, 0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3); }
    }
    #unity-splash .us-name {
      margin-top: 22px;
      font-size: 38px; font-weight: 800;
      letter-spacing: -0.8px;
      color: #fff;
      text-shadow: 0 0 24px ${rgba(THEME, 0.35)};
      text-align: center;
    }
    #unity-splash .us-greeting {
      margin-top: 10px;
      font-size: 12.5px; font-weight: 600;
      letter-spacing: 1.6px; text-transform: uppercase;
      color: ${rgba(THEME, 0.75)};
    }
    #unity-splash .us-loader {
      width: 90px; height: 2px;
      background: ${rgba(THEME, 0.18)};
      margin-top: 26px;
      border-radius: 999px;
      overflow: hidden;
      position: relative;
    }
    #unity-splash .us-loader::before {
      content: '';
      position: absolute;
      top: 0; left: -30%;
      width: 30%; height: 100%;
      background: ${themeColor};
      border-radius: 999px;
      animation: us-loader 1.4s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    }
    @keyframes us-loader { to { left: 100%; } }
    #unity-splash .us-hint {
      margin-top: 18px;
      font-size: 11px;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.4px;
    }

    /* Particle canvas */
    #unity-particles {
      position: fixed; inset: 0;
      width: 100%; height: 100%;
      z-index: -1;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  // Public API
  window.UnityEffects = window.UnityEffects || {
    setVisitorName(name) {
      try {
        if (name && String(name).trim()) {
          localStorage.setItem('unity.visitor_name', String(name).trim());
        } else {
          localStorage.removeItem('unity.visitor_name');
        }
      } catch (e) { /* noop */ }
    },
    getVisitorName() {
      try { return localStorage.getItem('unity.visitor_name') || ''; }
      catch (e) { return ''; }
    },
    dismiss() {
      const el = document.getElementById('unity-splash');
      if (el) fadeOut(el);
    }
  };

  // ═══ SPLASH ════════════════════════════════════════════════════
  function showSplash() {
    if (noSplash) return;
    const visitor = window.UnityEffects.getVisitorName();
    const greeting = visitor ? `Welcome back, ${visitor}` : 'Welcome back';

    const el = document.createElement('div');
    el.id = 'unity-splash';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <div class="us-bg"></div>
      <div class="us-inner">
        <div class="us-logo">✦</div>
        <div class="us-name">${splashName}</div>
        <div class="us-greeting">${greeting}</div>
        <div class="us-loader"></div>
        <div class="us-hint">click anywhere to skip</div>
      </div>
    `;

    // Click anywhere to dismiss early
    el.addEventListener('click', dismissEarly, { once: true });

    document.body.appendChild(el);

    // Trigger entry animation next frame
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('shown')));

    // Auto-dismiss after 1.6s
    setTimeout(() => fadeOut(el), 1600);

    function dismissEarly() {
      fadeOut(el);
    }
  }

  function fadeOut(el) {
    if (!el || el.classList.contains('fade-out')) return;
    el.classList.add('fade-out');
    setTimeout(() => el.remove(), 460);
  }

  // ═══ PARTICLES ════════════════════════════════════════════════
  function startParticles() {
    if (noParticles) return;
    if (typeof window === 'undefined' || !document.body) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'unity-particles';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); return; }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;

    // Determine base count: explicit > auto (60 mobile/30 desktop → flipped)
    const baseCount = isCoarse ? 36 : 72;
    const N = Number.isFinite(explicitCount) && explicitCount > 0
      ? Math.min(explicitCount, isCoarse ? 60 : 140)
      : baseCount;

    // Mouse tracking only on devices that can hover
    const supportsHover = !isCoarse;
    let mouseX = null, mouseY = null;

    function spawn() {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.18 + Math.random() * 0.55;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1 + Math.random() * 1.6,
      };
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let particles = [];
    for (let i = 0; i < N; i++) particles.push(spawn());

    window.addEventListener('resize', () => {
      resize();
      // re-clamp existing particles that fell off-screen
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.x < 0) p.x = 0; if (p.x > W) p.x = W;
        if (p.y < 0) p.y = 0; if (p.y > H) p.y = H;
      }
    }, { passive: true });

    if (supportsHover) {
      window.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }, { passive: true });
      window.addEventListener('mouseleave', () => {
        mouseX = null;
        mouseY = null;
      }, { passive: true });
      // Drop cursor when the cursor leaves via top of viewport
      document.addEventListener('mouseleave', () => {
        mouseX = null;
        mouseY = null;
      }, { passive: true });
    }

    // Pause the loop when tab is hidden (massive battery saver)
    document.addEventListener('visibilitychange', () => {
      running = document.visibilityState === 'visible';
      if (running) requestAnimationFrame(tick);
    });

    const PP_MAX = isCoarse ? 80 : 110;     // particle–particle max distance
    const PC_MAX = isCoarse ? 110 : 160;    // particle–cursor max distance
    const PP_ALPHA = 0.34;                  // base alpha for pp lines
    const PC_ALPHA = 0.62;                  // base alpha for cursor lines
    const DOT_ALPHA = 0.55;

    let running = true;
    resize();

    function tick() {
      if (!running) return;
      // Clear with full alpha (no trails) — keeps it crisp
      ctx.clearRect(0, 0, W, H);

      // Use lighter blend for nicer line overlap on dark pages
      ctx.globalCompositeOperation = 'lighter';

      // 1. Move + draw dots
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;

        ctx.fillStyle = rgba(THEME, DOT_ALPHA);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Particle-to-particle lines
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > PP_MAX * PP_MAX) continue;
          const d = Math.sqrt(d2);
          ctx.strokeStyle = rgba(THEME, PP_ALPHA * (1 - d / PP_MAX));
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // 3. Cursor connections (brighter + thicker)
      if (supportsHover && mouseX != null) {
        ctx.lineWidth = 1.4;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const d2 = dx * dx + dy * dy;
          if (d2 > PC_MAX * PC_MAX) continue;
          const d = Math.sqrt(d2);
          ctx.strokeStyle = rgba(THEME, PC_ALPHA * (1 - d / PC_MAX));
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.stroke();
        }

        // Subtle halo at cursor
        ctx.fillStyle = rgba(THEME, 0.18);
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 28, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  onReady(function () {
    showSplash();
    startParticles();
  });
})();
