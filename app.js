/* ==========================================================================
   A LITTLE BIRTHDAY SURPRISE — app.js
   Vanilla JS. No frameworks. Everything client-side.
   ========================================================================== */
"use strict";

/* ---------------------------------------------------------------------
   0. CONFIG — change these to personalize the experience
--------------------------------------------------------------------- */
const CONFIG = {
  NAME: "Your Name",         // recipient name — change this for your own version
  FROM: "Your Name",         // sender name — shown as a small signature on the final card
  SHOW_NAME_ON_FINAL: true,  // show NAME on the final card
  REDUCED_MOTION: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

const prefersReducedMotion = CONFIG.REDUCED_MOTION;

/* ---------------------------------------------------------------------
   1. CONTENT — wishes, messages
--------------------------------------------------------------------- */
const BALLOON_WISHES = [
  "May your birthday be filled with happiness, laughter, and beautiful moments.",
  "Wishing you a year filled with joy, success, and exciting new experiences.",
  "May every new chapter bring you closer to the things that make you truly happy.",
  "Wishing you good health, wonderful memories, and plenty of reasons to smile.",
  "May the year ahead be bright, rewarding, and full of unforgettable moments.",
];

const GALLERY_WISHES = [
  "Wishing you countless reasons to smile and many wonderful memories to look back on.",
  "May the people and experiences around you bring plenty of happiness to your year ahead.",
  "Here is to a new year of life filled with exciting opportunities, meaningful moments, and success.",
];

const GIFT_FIRST_WISH =
  "Happy birthday! Wishing you a wonderful day and an amazing year ahead filled with happiness, success, and memorable moments.";

const TOPPINGS = [
  { id: "candle", icon: "🕯️", label: "Candle" },
  { id: "flower", icon: "🌸", label: "Flower" },
  { id: "strawberry", icon: "🍓", label: "Strawberry" },
  { id: "chocolate", icon: "🍫", label: "Chocolate" },
  { id: "sprinkle", icon: "✨", label: "Sprinkles" },
  { id: "cherry", icon: "🍒", label: "Cherry" },
];

/* ---------------------------------------------------------------------
   2. TINY UTILITIES
--------------------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const vibrate = (pattern) => {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }
};

function showToast(msg, ms = 1800) {
  const toast = $("#toast");
  toast.textContent = msg;
  toast.classList.add("show");

  clearTimeout(showToast._t);

  showToast._t = setTimeout(() => {
    toast.classList.remove("show");
  }, ms);
}

function rippleAt(x, y, container = document.body, color) {
  const el = document.createElement("span");
  el.className = "ripple";

  const size = 18;

  el.style.width = el.style.height = size + "px";
  el.style.left = x - size / 2 + "px";
  el.style.top = y - size / 2 + "px";

  if (color) {
    el.style.background = color;
  }

  container.appendChild(el);

  setTimeout(() => el.remove(), 650);
}

/* ---------------------------------------------------------------------
   3. AUDIO ENGINE — synthesized piano ambience + sound effects
      (fully generative, offline-capable, no audio files needed)
--------------------------------------------------------------------- */
const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let musicTimer = null;
  let started = false;

  let muted = localStorage.getItem("bday_muted") === "1";

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;

      ctx = new AC();

      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : 1;
      masterGain.connect(ctx.destination);

      musicGain = ctx.createGain();
      musicGain.gain.value = 0.5;
      musicGain.connect(masterGain);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.7;
      sfxGain.connect(masterGain);
    }

    if (ctx.state === "suspended") {
      ctx.resume();
    }
  }

  // Soft "piano" note using a couple of detuned sine/triangle oscillators
  // with a plucky envelope — no samples required.
  function pianoNote(freq, time, dur, gainVal = 0.18) {
    const g = ctx.createGain();

    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gainVal, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    g.connect(musicGain);

    [1, 2].forEach((h, i) => {
      const o = ctx.createOscillator();

      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = freq * h;

      const hg = ctx.createGain();
      hg.gain.value = i === 0 ? 1 : 0.12;

      o.connect(hg);
      hg.connect(g);

      o.start(time);
      o.stop(time + dur + 0.05);
    });
  }

  // Pentatonic ambient loop — gentle, non-intrusive, generative each time.
  const SCALE = [
    261.63,
    293.66,
    329.63,
    392.0,
    440.0,
    523.25,
    587.33,
    659.25,
  ];

  function scheduleMusicLoop() {
    if (muted || !started) return;

    const now = ctx.currentTime;
    const stepDur = 1.15;

    for (let i = 0; i < 8; i++) {
      const t = now + i * stepDur;

      if (Math.random() > 0.28) {
        const note = pick(SCALE);

        pianoNote(
          note,
          t,
          stepDur * 1.7,
          rand(0.09, 0.16)
        );
      }

      if (i % 4 === 0 && Math.random() > 0.5) {
        pianoNote(
          pick(SCALE) / 2,
          t + 0.05,
          stepDur * 2.2,
          0.07
        );
      }
    }

    musicTimer = setTimeout(
      scheduleMusicLoop,
      stepDur * 8 * 1000
    );
  }

  function startMusic() {
    ensureCtx();

    if (started) return;

    started = true;
    scheduleMusicLoop();
  }

  function stopMusic() {
    started = false;
    clearTimeout(musicTimer);
  }

  function setMuted(v) {
    muted = v;

    localStorage.setItem(
      "bday_muted",
      v ? "1" : "0"
    );

    if (masterGain) {
      const now = ctx ? ctx.currentTime : 0;

      masterGain.gain.cancelScheduledValues(now);

      masterGain.gain.linearRampToValueAtTime(
        v ? 0 : 1,
        now + 0.25
      );
    }

    if (!v && started) {
      scheduleMusicLoop();
    }
  }

  function isMuted() {
    return muted;
  }

  /* ----- Sound Effects ----- */

  function sfxTap() {
    ensureCtx();

    const t = ctx.currentTime;

    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = "sine";

    o.frequency.setValueAtTime(660, t);
    o.frequency.exponentialRampToValueAtTime(
      880,
      t + 0.08
    );

    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(
      0.18,
      t + 0.01
    );

    g.gain.exponentialRampToValueAtTime(
      0.0001,
      t + 0.14
    );

    o.connect(g);
    g.connect(sfxGain);

    o.start(t);
    o.stop(t + 0.16);
  }

  function sfxPop() {
    ensureCtx();

    const t = ctx.currentTime;

    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = "triangle";

    o.frequency.setValueAtTime(
      rand(300, 380),
      t
    );

    o.frequency.exponentialRampToValueAtTime(
      rand(700, 900),
      t + 0.09
    );

    g.gain.setValueAtTime(0.0001, t);

    g.gain.exponentialRampToValueAtTime(
      0.3,
      t + 0.015
    );

    g.gain.exponentialRampToValueAtTime(
      0.0001,
      t + 0.18
    );

    o.connect(g);
    g.connect(sfxGain);

    o.start(t);
    o.stop(t + 0.2);
  }

  function sfxChime() {
    ensureCtx();

    const t = ctx.currentTime;

    [523.25, 659.25, 783.99].forEach((f, i) => {
      pianoNoteSfx(
        f,
        t + i * 0.09,
        0.9,
        0.14
      );
    });
  }

  function pianoNoteSfx(
    freq,
    time,
    dur,
    gainVal
  ) {
    const g = ctx.createGain();

    g.gain.setValueAtTime(
      0.0001,
      time
    );

    g.gain.exponentialRampToValueAtTime(
      gainVal,
      time + 0.02
    );

    g.gain.exponentialRampToValueAtTime(
      0.0001,
      time + dur
    );

    g.connect(sfxGain);

    const o = ctx.createOscillator();

    o.type = "sine";
    o.frequency.value = freq;

    o.connect(g);

    o.start(time);
    o.stop(time + dur + 0.05);
  }

  function sfxWhoosh() {
    ensureCtx();

    const t = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.4;

    const buffer = ctx.createBuffer(
      1,
      bufferSize,
      ctx.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] =
        (Math.random() * 2 - 1) *
        (1 - i / bufferSize);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filt = ctx.createBiquadFilter();

    filt.type = "bandpass";

    filt.frequency.setValueAtTime(
      400,
      t
    );

    filt.frequency.exponentialRampToValueAtTime(
      2200,
      t + 0.35
    );

    const g = ctx.createGain();

    g.gain.setValueAtTime(
      0.25,
      t
    );

    g.gain.exponentialRampToValueAtTime(
      0.0001,
      t + 0.4
    );

    src.connect(filt);
    filt.connect(g);
    g.connect(sfxGain);

    src.start(t);
  }

  function sfxBoom() {
    ensureCtx();

    const t = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.5;

    const buffer = ctx.createBuffer(
      1,
      bufferSize,
      ctx.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] =
        (Math.random() * 2 - 1) *
        Math.pow(1 - i / bufferSize, 2);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filt = ctx.createBiquadFilter();

    filt.type = "lowpass";
    filt.frequency.value = 900;

    const g = ctx.createGain();

    g.gain.setValueAtTime(
      0.35,
      t
    );

    g.gain.exponentialRampToValueAtTime(
      0.0001,
      t + 0.5
    );

    src.connect(filt);
    filt.connect(g);
    g.connect(sfxGain);

    src.start(t);
  }

  function sfxBuzz() {
    ensureCtx();

    const t = ctx.currentTime;

    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = "sawtooth";

    o.frequency.setValueAtTime(
      160,
      t
    );

    o.frequency.exponentialRampToValueAtTime(
      60,
      t + 0.25
    );

    g.gain.setValueAtTime(
      0.001,
      t
    );

    g.gain.exponentialRampToValueAtTime(
      0.22,
      t + 0.02
    );

    g.gain.exponentialRampToValueAtTime(
      0.0001,
      t + 0.28
    );

    o.connect(g);
    g.connect(sfxGain);

    o.start(t);
    o.stop(t + 0.3);
  }

  return {
    ensureCtx,
    startMusic,
    stopMusic,
    setMuted,
    isMuted,
    sfxTap,
    sfxPop,
    sfxChime,
    sfxWhoosh,
    sfxBoom,
    sfxBuzz,
  };
})();

/* ---------------------------------------------------------------------
   4. AMBIENT BACKGROUND — soft floating particles across every screen
--------------------------------------------------------------------- */
const BgParticles = (() => {
  const canvas = document.getElementById("bg-canvas");
  const ctx2d = canvas.getContext("2d");

  let w;
  let h;
  let dpr;

  let particles = [];

  const PALETTE = [
    "#B8A6F5",
    "#FFB5A7",
    "#FFD97D",
    "#B4E8C4",
  ];

  function resize() {
    dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    w = canvas.width =
      window.innerWidth * dpr;

    h = canvas.height =
      window.innerHeight * dpr;

    canvas.style.width =
      window.innerWidth + "px";

    canvas.style.height =
      window.innerHeight + "px";
  }

  function init() {
    resize();

    const count = prefersReducedMotion
      ? 0
      : Math.min(
          26,
          Math.floor(
            (window.innerWidth *
              window.innerHeight) /
              45000
          )
        );

    particles = Array.from(
      { length: count },
      () => spawn()
    );

    window.addEventListener(
      "resize",
      resize
    );

    if (!prefersReducedMotion) {
      requestAnimationFrame(loop);
    } else {
      draw();
    }
  }

  function spawn(atBottom = false) {
    return {
      x: rand(0, w),
      y: atBottom
        ? h + rand(0, h * 0.3)
        : rand(0, h),
      r: rand(6, 22) * dpr,
      speed: rand(0.15, 0.5) * dpr,
      drift: rand(-0.3, 0.3) * dpr,
      color: pick(PALETTE),
      alpha: rand(0.08, 0.22),
      phase: rand(0, Math.PI * 2),
    };
  }

  function draw() {
    ctx2d.clearRect(
      0,
      0,
      w,
      h
    );

    particles.forEach((p) => {
      ctx2d.beginPath();

      ctx2d.globalAlpha = p.alpha;
      ctx2d.fillStyle = p.color;
      ctx2d.filter = "blur(2px)";

      ctx2d.arc(
        p.x +
          Math.sin(p.phase) *
            8 *
            dpr,
        p.y,
        p.r,
        0,
        Math.PI * 2
      );

      ctx2d.fill();
    });

    ctx2d.globalAlpha = 1;
    ctx2d.filter = "none";
  }

  function loop() {
    particles.forEach((p) => {
      p.y -= p.speed;
      p.phase += 0.01;

      if (p.y < -30 * dpr) {
        Object.assign(
          p,
          spawn(true)
        );
      }
    });

    draw();

    requestAnimationFrame(loop);
  }

  return {
    init,
  };
})();

/* ---------------------------------------------------------------------
   5. CONFETTI / PARTICLE BURST — reusable canvas confetti engine
--------------------------------------------------------------------- */
function createBurstEngine(canvas) {
  const ctx2d = canvas.getContext("2d");

  let particles = [];
  let raf = null;

  const COLORS = [
    "#B8A6F5",
    "#FFB5A7",
    "#FFD97D",
    "#B4E8C4",
    "#FF8A72",
    "#8B76D9",
  ];

  function fit() {
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    const rect =
      canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    canvas._dpr = dpr;
  }

  function burst(
    cx,
    cy,
    count = 60
  ) {
    fit();

    const dpr = canvas._dpr || 1;

    for (let i = 0; i < count; i++) {
      const angle = rand(
        0,
        Math.PI * 2
      );

      const speed =
        rand(2, 9) * dpr;

      particles.push({
        x: cx * dpr,
        y: cy * dpr,

        vx:
          Math.cos(angle) *
          speed,

        vy:
          Math.sin(angle) *
            speed -
          rand(1, 4) *
            dpr,

        size:
          rand(4, 9) *
          dpr,

        color: pick(COLORS),

        rot: rand(
          0,
          Math.PI * 2
        ),

        vrot: rand(
          -0.2,
          0.2
        ),

        life: 0,

        maxLife: rand(
          50,
          90
        ),

        shape:
          Math.random() > 0.5
            ? "rect"
            : "circle",
      });
    }

    if (!raf) {
      loop();
    }
  }

  function loop() {
    ctx2d.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const dpr =
      canvas._dpr || 1;

    particles.forEach((p) => {
      p.vy +=
        0.14 * dpr;

      p.x += p.vx;
      p.y += p.vy;

      p.rot += p.vrot;
      p.life++;

      const alpha = clamp(
        1 -
          p.life /
            p.maxLife,
        0,
        1
      );

      ctx2d.save();

      ctx2d.globalAlpha =
        alpha;

      ctx2d.translate(
        p.x,
        p.y
      );

      ctx2d.rotate(
        p.rot
      );

      ctx2d.fillStyle =
        p.color;

      if (
        p.shape ===
        "rect"
      ) {
        ctx2d.fillRect(
          -p.size / 2,
          -p.size / 3,
          p.size,
          p.size * 0.66
        );
      } else {
        ctx2d.beginPath();

        ctx2d.arc(
          0,
          0,
          p.size / 2,
          0,
          Math.PI * 2
        );

        ctx2d.fill();
      }

      ctx2d.restore();
    });

    particles =
      particles.filter(
        (p) =>
          p.life <
          p.maxLife
      );

    if (particles.length) {
      raf =
        requestAnimationFrame(
          loop
        );
    } else {
      raf = null;
    }
  }

  window.addEventListener(
    "resize",
    fit
  );

  fit();

  return {
    burst,
  };
}

/* ---------------------------------------------------------------------
   6. SCREEN MANAGER
--------------------------------------------------------------------- */
const SCREEN_ORDER = [
  "screen-welcome",
  "screen-gift",
  "screen-balloons",
  "screen-cake",
  "screen-catch",
  "screen-gallery",
  "screen-fireworks",
  "screen-final",
];

const ScreenManager = (() => {
  let current =
    "screen-splash";

  const enterHooks = {};

  function onEnter(
    id,
    fn
  ) {
    enterHooks[id] = fn;
  }

  function buildDots() {
    const wrap =
      $("#progress-dots");

    wrap.innerHTML = "";

    SCREEN_ORDER.forEach(
      (id) => {
        const d =
          document.createElement(
            "span"
          );

        d.className =
          "dot";

        d.dataset.id =
          id;

        wrap.appendChild(
          d
        );
      }
    );
  }

  function updateDots() {
    const idx =
      SCREEN_ORDER.indexOf(
        current
      );

    $$("#progress-dots .dot").forEach(
      (d, i) => {
        d.classList.toggle(
          "done",
          i < idx
        );

        d.classList.toggle(
          "current",
          i === idx
        );
      }
    );
  }

  function go(id) {
    const from =
      document.getElementById(
        current
      );

    const to =
      document.getElementById(
        id
      );

    if (!to) return;

    if (from) {
      from.classList.remove(
        "active"
      );
    }

    to.classList.add(
      "active"
    );

    current = id;

    updateDots();

    if (enterHooks[id]) {
      enterHooks[id]();
    }

    to.scrollTop = 0;
  }

  return {
    go,
    onEnter,
    buildDots,

    get current() {
      return current;
    },
  };
})();

/* ---------------------------------------------------------------------
   7. MUTE BUTTON
--------------------------------------------------------------------- */
function initMuteButton() {
  const btn =
    $("#mute-btn");

  const setUI = (
    muted
  ) => {
    btn.classList.toggle(
      "muted",
      muted
    );

    btn.setAttribute(
      "aria-pressed",
      String(muted)
    );

    btn.setAttribute(
      "aria-label",
      muted
        ? "Unmute music"
        : "Mute music"
    );
  };

  setUI(
    AudioEngine.isMuted()
  );

  btn.addEventListener(
    "click",
    () => {
      const next =
        !AudioEngine.isMuted();

      AudioEngine.setMuted(
        next
      );

      setUI(next);

      vibrate(10);
    }
  );
}

/* ---------------------------------------------------------------------
   8. GLOBAL TAP SFX + RIPPLE (delegated)
--------------------------------------------------------------------- */
function initGlobalInteractions() {
  document.addEventListener(
    "pointerdown",
    (e) => {
      const target =
        e.target.closest(
          "[data-sfx]"
        );

      if (!target) return;

      const kind =
        target.dataset.sfx;

      AudioEngine.ensureCtx();

      if (
        kind === "tap"
      ) {
        AudioEngine.sfxTap();
      }

      if (
        kind === "pop"
      ) {
        AudioEngine.sfxPop();
      }

      rippleAt(
        e.clientX,
        e.clientY,
        document.body,
        "rgba(255,255,255,0.5)"
      );
    },
    {
      passive: true,
    }
  );
}

/* ---------------------------------------------------------------------
   9. SPLASH SCREEN
--------------------------------------------------------------------- */
function initSplash() {
  BgParticles.init();

  ScreenManager.buildDots();

  setTimeout(() => {
    ScreenManager.go(
      "screen-welcome"
    );
  }, 2200);
}

/* ---------------------------------------------------------------------
   10. WELCOME
--------------------------------------------------------------------- */
function initWelcome() {
  const eyebrow =
    $("#welcome-eyebrow");

  if (
    eyebrow &&
    CONFIG.NAME
  ) {
    eyebrow.textContent =
      "for " +
      CONFIG.NAME;
  }

  $("#btn-start").addEventListener(
    "click",
    () => {
      AudioEngine.ensureCtx();
      AudioEngine.startMusic();

      ScreenManager.go(
        "screen-gift"
      );
    }
  );
}

/* ---------------------------------------------------------------------
   11. GIFT BOX
--------------------------------------------------------------------- */
function initGiftBox() {
  const box =
    $("#gift-box");

  const reveal =
    $("#gift-reveal");

  const wishText =
    $("#gift-wish-text");

  const burstCanvas =
    $("#confetti-canvas-gift");

  const burst =
    createBurstEngine(
      burstCanvas
    );

  let opened = false;

  box.addEventListener(
    "click",
    () => {
      if (opened) return;

      opened = true;

      box.classList.add(
        "shake"
      );

      vibrate(15);

      AudioEngine.sfxWhoosh();

      setTimeout(() => {
        box.classList.add(
          "opened"
        );

        vibrate([
          20,
          30,
          20,
        ]);

        AudioEngine.sfxChime();

        const rect =
          burstCanvas.getBoundingClientRect();

        burst.burst(
          rect.width / 2,
          rect.height / 2,
          90
        );

        wishText.textContent =
          GIFT_FIRST_WISH;

        setTimeout(() => {
          reveal.classList.remove(
            "hidden"
          );
        }, 300);
      }, 380);
    }
  );

  $("#btn-after-gift").addEventListener(
    "click",
    () =>
      ScreenManager.go(
        "screen-balloons"
      )
  );
}

/* ---------------------------------------------------------------------
   12. BALLOONS
--------------------------------------------------------------------- */
function initBalloons() {
  const field =
    $("#balloon-field");

  const countLabel =
    $("#balloon-count");

  const continueBtn =
    $("#btn-after-balloons");

  let popped = 0;
  let built = false;

  ScreenManager.onEnter(
    "screen-balloons",
    () => {
      if (built) return;

      built = true;

      buildBalloons();

      // Show the button after 1.2 seconds so the user can move on whenever they want
      setTimeout(() => {
        continueBtn.classList.remove(
          "hidden"
        );

        continueBtn.classList.add(
          "show"
        );
      }, 1200);
    }
  );

  function buildBalloons() {
    const anims = [
      "anim-drift",
      "anim-wobble",
      "anim-spiral",
      "anim-bounce",
    ];

    BALLOON_WISHES.forEach(
      (wish, i) => {
        const b =
          document.createElement(
            "button"
          );

        b.className =
          `balloon pc-${(i % 4) + 1} ${pick(anims)}`;

        b.style.left =
          rand(2, 86) +
          "%";

        b.style.setProperty(
          "--dx",
          rand(-40, 40) +
            "px"
        );

        const dur =
          rand(11, 19);

        b.style.animationDuration =
          dur + "s";

        b.style.animationDelay =
          -rand(0, dur) +
          "s";

        b.style.animationIterationCount =
          "infinite";

        b.setAttribute(
          "aria-label",
          "Pop balloon for a birthday wish"
        );

        b.dataset.wish =
          wish;

        b.innerHTML =
          `<div class="b-body"></div><div class="b-knot"></div><div class="b-string"></div>`;

        b.addEventListener(
          "click",
          () =>
            popBalloon(b)
        );

        field.appendChild(
          b
        );
      }
    );

    countLabel.textContent =
      BALLOON_WISHES.length;
  }

  function popBalloon(b) {
    if (
      b.dataset.popped
    ) {
      return;
    }

    b.dataset.popped =
      "1";

    const rect =
      b.getBoundingClientRect();

    const fieldRect =
      field.getBoundingClientRect();

    b.classList.add(
      "popping"
    );

    AudioEngine.sfxPop();

    vibrate(18);

    popConfetti(
      rect.left -
        fieldRect.left +
        rect.width / 2,

      rect.top -
        fieldRect.top +
        rect.height / 2
    );

    popped++;

    countLabel.textContent =
      Math.max(
        0,
        BALLOON_WISHES.length -
          popped
      );

    showWishModal(
      "wish popped",
      b.dataset.wish
    );

    setTimeout(() => {
      b.remove();
    }, 320);

    // Ensure button is shown when balloons are popped
    continueBtn.classList.remove(
      "hidden"
    );

    continueBtn.classList.add(
      "show"
    );
  }

  let confettiCanvas;
  let confettiBurst;

  function popConfetti(
    x,
    y
  ) {
    if (!confettiCanvas) {
      confettiCanvas =
        document.createElement(
          "canvas"
        );

      confettiCanvas.style.position =
        "absolute";

      confettiCanvas.style.inset =
        "0";

      confettiCanvas.style.width =
        "100%";

      confettiCanvas.style.height =
        "100%";

      confettiCanvas.style.pointerEvents =
        "none";

      field.appendChild(
        confettiCanvas
      );

      confettiBurst =
        createBurstEngine(
          confettiCanvas
        );
    }

    confettiBurst.burst(
      x,
      y,
      26
    );
  }

  continueBtn.addEventListener(
    "click",
    () =>
      ScreenManager.go(
        "screen-cake"
      )
  );
}

function showWishModal(
  label,
  text
) {
  const backdrop =
    $("#wish-modal-backdrop");

  $("#wish-modal-label").textContent =
    label;

  $("#wish-modal-text").textContent =
    text;

  backdrop.classList.remove(
    "hidden"
  );

  requestAnimationFrame(
    () =>
      backdrop.classList.add(
        "show"
      )
  );
}

function hideWishModal() {
  const backdrop =
    $("#wish-modal-backdrop");

  backdrop.classList.remove(
    "show"
  );

  setTimeout(() => {
    backdrop.classList.add(
      "hidden"
    );
  }, 300);
}

/* ---------------------------------------------------------------------
   13. CAKE DECORATION (drag & drop toppings)
--------------------------------------------------------------------- */
function initCake() {
  const tray =
    $("#topping-tray");

  const dropzone =
    $("#cake-dropzone");

  const dropItemsLayer =
    $("#cake-drop-items");

  const finishBtn =
    $("#btn-cake-finish");

  let placedCount = 0;
  let built = false;

  ScreenManager.onEnter(
    "screen-cake",
    () => {
      if (built) return;

      built = true;

      buildTray();
    }
  );

  function buildTray() {
    TOPPINGS.forEach(
      (t) => {
        // three of each so the tray never runs out
        for (
          let i = 0;
          i < 3;
          i++
        ) {
          const item =
            document.createElement(
              "div"
            );

          item.className =
            "topping";

          item.textContent =
            t.icon;

          item.setAttribute(
            "role",
            "option"
          );

          item.setAttribute(
            "aria-label",
            "Drag " +
              t.label +
              " onto the cake"
          );

          item.dataset.icon =
            t.icon;

          attachDrag(
            item,
            false
          );

          tray.appendChild(
            item
          );
        }
      }
    );
  }

  function attachDrag(
    el,
    isPlaced
  ) {
    el.addEventListener(
      "pointerdown",
      (e) => {
        e.preventDefault();

        const icon =
          el.dataset.icon;

        const ghost =
          document.createElement(
            "div"
          );

        ghost.textContent =
          icon;

        ghost.style.position =
          "fixed";

        ghost.style.left =
          e.clientX + "px";

        ghost.style.top =
          e.clientY + "px";

        ghost.style.fontSize =
          "30px";

        ghost.style.transform =
          "translate(-50%,-50%) scale(1.2)";

        ghost.style.pointerEvents =
          "none";

        ghost.style.zIndex =
          "80";

        ghost.style.filter =
          "drop-shadow(0 6px 10px rgba(0,0,0,0.25))";

        document.body.appendChild(
          ghost
        );

        if (isPlaced) {
          el.style.opacity =
            "0.25";
        }

        const move = (
          ev
        ) => {
          ghost.style.left =
            ev.clientX + "px";

          ghost.style.top =
            ev.clientY + "px";
        };

        const up = (
          ev
        ) => {
          document.removeEventListener(
            "pointermove",
            move
          );

          document.removeEventListener(
            "pointerup",
            up
          );

          document.removeEventListener(
            "pointercancel",
            up
          );

          ghost.remove();

          if (isPlaced) {
            el.style.opacity =
              "1";
          }

          const dzRect =
            dropzone.getBoundingClientRect();

          const inside =
            ev.clientX >=
              dzRect.left &&
            ev.clientX <=
              dzRect.right &&
            ev.clientY >=
              dzRect.top &&
            ev.clientY <=
              dzRect.bottom;

          if (inside) {
            const xPct =
              ((ev.clientX -
                dzRect.left) /
                dzRect.width) *
              100;

            const yPct =
              ((ev.clientY -
                dzRect.top) /
                dzRect.height) *
              100;

            if (isPlaced) {
              el.style.left =
                xPct + "%";

              el.style.top =
                yPct + "%";
            } else {
              placeTopping(
                icon,
                xPct,
                yPct
              );
            }
          } else if (
            isPlaced
          ) {
            el.remove();
          }
        };

        document.addEventListener(
          "pointermove",
          move
        );

        document.addEventListener(
          "pointerup",
          up,
          {
            once: true,
          }
        );

        document.addEventListener(
          "pointercancel",
          up,
          {
            once: true,
          }
        );
      }
    );
  }

  function placeTopping(
    icon,
    xPct,
    yPct
  ) {
    const el =
      document.createElement(
        "div"
      );

    el.className =
      "dropped-topping";

    el.textContent =
      icon;

    el.style.left =
      xPct + "%";

    el.style.top =
      yPct + "%";

    el.style.transform =
      `translate(-50%,-50%) rotate(${rand(-15, 15)}deg) scale(${rand(0.9, 1.15)})`;

    attachDrag(
      el,
      true
    );

    dropItemsLayer.appendChild(
      el
    );

    placedCount++;

    AudioEngine.sfxTap();

    vibrate(12);
  }

  finishBtn.addEventListener(
    "click",
    () => {
      if (
        placedCount ===
        0
      ) {
        showToast(
          "Add at least one topping ✨"
        );

        return;
      }

      AudioEngine.sfxChime();

      vibrate([
        15,
        20,
        15,
      ]);

      const dzRect =
        dropzone.getBoundingClientRect();

      const tempCanvas =
        document.createElement(
          "canvas"
        );

      tempCanvas.style.position =
        "fixed";

      tempCanvas.style.left =
        "0";

      tempCanvas.style.top =
        "0";

      tempCanvas.style.width =
        "100%";

      tempCanvas.style.height =
        "100%";

      tempCanvas.style.pointerEvents =
        "none";

      tempCanvas.style.zIndex =
        "70";

      document.body.appendChild(
        tempCanvas
      );

      const eng =
        createBurstEngine(
          tempCanvas
        );

      eng.burst(
        dzRect.left +
          dzRect.width / 2,

        dzRect.top +
          dzRect.height / 2,

        110
      );

      setTimeout(
        () =>
          tempCanvas.remove(),
        2200
      );

      setTimeout(
        () =>
          ScreenManager.go(
            "screen-catch"
          ),
        700
      );
    }
  );
}

/* ---------------------------------------------------------------------
   14. CATCH GAME
--------------------------------------------------------------------- */
function initCatchGame() {
  const canvas =
    $("#catch-canvas");

  const ctx2d =
    canvas.getContext(
      "2d"
    );

  const startBtn =
    $("#btn-catch-start");

  const resultCard =
    $("#catch-result");

  const scoreLbl =
    $("#catch-score");

  const comboLbl =
    $("#catch-combo");

  const timeLbl =
    $("#catch-time");

  const finalScoreLbl =
    $("#catch-final-score");

  const highScoreLbl =
    $("#catch-high-score");

  let dpr = 1;
  let cw = 0;
  let ch = 0;

  let items = [];

  let running = false;

  let score = 0;
  let combo = 1;
  let timeLeft = 30;

  let spawnTimer = null;
  let countdownTimer = null;
  let raf = null;

  const GOOD = [
    "🎁",
    "🎈",
    "🧁",
    "🍰",
    "⭐",
  ];

  const BAD = [
    "💣",
    "🧨",
  ];

  // Completely stops game loops and timers
  function stopGame() {
    running = false;

    clearInterval(
      spawnTimer
    );

    clearInterval(
      countdownTimer
    );

    cancelAnimationFrame(
      raf
    );
  }

  // End game logic
  function endGame() {
    stopGame();

    const best =
      Math.max(
        score,
        getHighScore()
      );

    setHighScore(best);

    finalScoreLbl.textContent =
      "Score: " +
      score;

    highScoreLbl.textContent =
      "Best: " +
      best;

    resultCard.classList.remove(
      "hidden"
    );

    AudioEngine.sfxChime();
  }

  // Skip game at any point (before starting or mid-game)
  function skipToNext() {
    stopGame();

    ScreenManager.go(
      "screen-gallery"
    );
  }

  function fit() {
    dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    const rect =
      canvas.getBoundingClientRect();

    cw =
      canvas.width =
        rect.width * dpr;

    ch =
      canvas.height =
        rect.height * dpr;
  }

  window.addEventListener(
    "resize",
    fit
  );

  ScreenManager.onEnter(
    "screen-catch",
    () => {
      fit();

      stopGame();

      resetState();

      highScoreLbl.textContent =
        "Best: " +
        getHighScore();
    }
  );

  function getHighScore() {
    return parseInt(
      localStorage.getItem(
        "bday_catch_high"
      ) || "0",
      10
    );
  }

  function setHighScore(v) {
    localStorage.setItem(
      "bday_catch_high",
      String(v)
    );
  }

  function resetState() {
    running = false;

    items = [];

    score = 0;
    combo = 1;
    timeLeft = 30;

    scoreLbl.textContent =
      "0";

    comboLbl.textContent =
      "×1";

    timeLbl.textContent =
      "30";

    resultCard.classList.add(
      "hidden"
    );

    startBtn.classList.remove(
      "hidden"
    );

    ctx2d.clearRect(
      0,
      0,
      cw,
      ch
    );
  }

  function startGame() {
    resetState();

    running = true;

    startBtn.classList.add(
      "hidden"
    );

    spawnTimer =
      setInterval(
        spawnItem,
        650
      );

    countdownTimer =
      setInterval(
        () => {
          timeLeft--;

          timeLbl.textContent =
            String(
              Math.max(
                0,
                timeLeft
              )
            );

          if (
            timeLeft <=
            0
          ) {
            endGame();
          }
        },
        1000
      );

    raf =
      requestAnimationFrame(
        loop
      );
  }

  function spawnItem() {
    const isBad =
      Math.random() <
      0.28;

    const emoji =
      isBad
        ? pick(BAD)
        : pick(GOOD);

    items.push({
      x:
        rand(0.1, 0.9) *
        cw,

      y:
        -40 * dpr,

      vy:
        rand(1.6, 2.6) *
        dpr,

      r:
        22 * dpr,

      emoji,
      isBad,

      caught: false,
      missed: false,

      life: 0,
    });
  }

  function loop() {
    if (!running) return;

    ctx2d.clearRect(
      0,
      0,
      cw,
      ch
    );

    ctx2d.font =
      `${34 * dpr}px sans-serif`;

    ctx2d.textAlign =
      "center";

    ctx2d.textBaseline =
      "middle";

    items.forEach(
      (it) => {
        if (
          it.caught ||
          it.missed
        ) {
          it.life++;

          ctx2d.save();

          ctx2d.globalAlpha =
            clamp(
              1 -
                it.life /
                  20,
              0,
              1
            );

          ctx2d.translate(
            it.x,
            it.y -
              it.life *
                2
          );

          ctx2d.scale(
            1 +
              it.life *
                0.03,

            1 +
              it.life *
                0.03
          );

          ctx2d.fillText(
            it.emoji,
            0,
            0
          );

          ctx2d.restore();

          return;
        }

        it.y += it.vy;

        ctx2d.fillText(
          it.emoji,
          it.x,
          it.y
        );
      }
    );

    items =
      items.filter(
        (it) => {
          if (
            it.caught ||
            it.missed
          ) {
            return (
              it.life <
              20
            );
          }

          if (
            it.y >
            ch +
              40 *
                dpr
          ) {
            if (
              !it.isBad
            ) {
              combo = 1;
            }

            return false;
          }

          return true;
        }
      );

    comboLbl.textContent =
      "×" +
      combo;

    raf =
      requestAnimationFrame(
        loop
      );
  }

  function hitTest(
    clientX,
    clientY
  ) {
    const rect =
      canvas.getBoundingClientRect();

    const x =
      (clientX -
        rect.left) *
      dpr;

    const y =
      (clientY -
        rect.top) *
      dpr;

    for (
      let i =
        items.length -
        1;
      i >= 0;
      i--
    ) {
      const it =
        items[i];

      if (
        it.caught ||
        it.missed
      ) {
        continue;
      }

      const d =
        Math.hypot(
          it.x - x,
          it.y - y
        );

      if (
        d <
        it.r +
          14 *
            dpr
      ) {
        return it;
      }
    }

    return null;
  }

  canvas.addEventListener(
    "pointerdown",
    (e) => {
      if (!running)
        return;

      const it =
        hitTest(
          e.clientX,
          e.clientY
        );

      if (!it) return;

      if (it.isBad) {
        it.missed =
          true;

        combo = 1;

        score =
          Math.max(
            0,
            score - 15
          );

        AudioEngine.sfxBuzz();

        vibrate([
          30,
          20,
          30,
        ]);
      } else {
        it.caught =
          true;

        score +=
          10 *
          combo;

        combo =
          Math.min(
            8,
            combo + 1
          );

        AudioEngine.sfxPop();

        vibrate(15);
      }

      scoreLbl.textContent =
        String(score);
    }
  );

  // Event Listeners
  startBtn.addEventListener(
    "click",
    startGame
  );

  $("#btn-catch-retry").addEventListener(
    "click",
    startGame
  );

  const btnAfterCatch =
    $("#btn-after-catch");

  const btnAfterGame =
    $("#btn-after-game");

  if (btnAfterCatch) {
    btnAfterCatch.addEventListener(
      "click",
      skipToNext
    );
  }

  if (btnAfterGame) {
    btnAfterGame.addEventListener(
      "click",
      skipToNext
    );
  }
}

/* ---------------------------------------------------------------------
   15. WISH GALLERY
--------------------------------------------------------------------- */
function initGallery() {
  const grid =
    $("#gallery-grid");

  let built = false;

  const icons = [
    "💛",
    "🌷",
    "✨",
    "🍡",
    "🦋",
    "🌙",
    "🍰",
    "🎈",
    "🌸",
    "⭐",
  ];

  ScreenManager.onEnter(
    "screen-gallery",
    () => {
      if (built) return;

      built = true;

      GALLERY_WISHES.forEach(
        (wish, i) => {
          const card =
            document.createElement(
              "button"
            );

          card.className =
            "gallery-card";

          card.setAttribute(
            "aria-label",
            "Open wish " +
              (i + 1)
          );

          card.innerHTML =
            `<span class="g-num">${String(i + 1).padStart(2, "0")}</span><span class="g-icon">${icons[i % icons.length]}</span><span class="g-check hidden">✓</span>`;

          card.addEventListener(
            "click",
            () => {
              card.classList.add(
                "opened"
              );

              card
                .querySelector(
                  ".g-check"
                )
                .classList.remove(
                  "hidden"
                );

              AudioEngine.sfxTap();

              vibrate(10);

              showWishModal(
                "wish " +
                  String(
                    i + 1
                  ).padStart(
                    2,
                    "0"
                  ),
                wish
              );
            }
          );

          grid.appendChild(
            card
          );
        }
      );
    }
  );

  $("#btn-after-gallery").addEventListener(
    "click",
    () =>
      ScreenManager.go(
        "screen-fireworks"
      )
  );
}

/* ---------------------------------------------------------------------
   16. FIREWORKS
--------------------------------------------------------------------- */
function initFireworks() {
  const canvas =
    $("#fireworks-canvas");

  const ctx2d =
    canvas.getContext(
      "2d"
    );

  let dpr = 1;
  let cw = 0;
  let ch = 0;

  let rockets = [];
  let sparks = [];

  let raf = null;
  let launchTimer = null;

  let active = false;

  const COLORS = [
    "#B8A6F5",
    "#FFB5A7",
    "#FFD97D",
    "#B4E8C4",
    "#FF8A72",
    "#ffffff",
  ];

  function fit() {
    dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    cw =
      canvas.width =
        window.innerWidth *
        dpr;

    ch =
      canvas.height =
        window.innerHeight *
        dpr;
  }

  window.addEventListener(
    "resize",
    fit
  );

  ScreenManager.onEnter(
    "screen-fireworks",
    () => {
      fit();
      start();
    }
  );

  function start() {
    active = true;

    rockets = [];
    sparks = [];

    if (
      prefersReducedMotion
    ) {
      // Single gentle static burst rendering, no continuous animation.
      drawStaticCelebration();

      return;
    }

    launchTimer =
      setInterval(
        launchRocket,
        900
      );

    launchRocket();

    raf =
      requestAnimationFrame(
        loop
      );
  }

  function stop() {
    active = false;

    clearInterval(
      launchTimer
    );

    cancelAnimationFrame(
      raf
    );
  }

  function drawStaticCelebration() {
    ctx2d.clearRect(
      0,
      0,
      cw,
      ch
    );

    for (
      let i = 0;
      i < 40;
      i++
    ) {
      ctx2d.beginPath();

      ctx2d.fillStyle =
        pick(COLORS);

      ctx2d.globalAlpha =
        rand(
          0.4,
          0.9
        );

      ctx2d.arc(
        rand(0, cw),
        rand(
          0,
          ch * 0.6
        ),
        rand(
          2,
          5
        ) * dpr,
        0,
        Math.PI * 2
      );

      ctx2d.fill();
    }

    ctx2d.globalAlpha =
      1;
  }

  function launchRocket() {
    if (!active) return;

    rockets.push({
      x:
        rand(0.15, 0.85) *
        cw,

      y: ch,

      targetY:
        rand(0.18, 0.45) *
        ch,

      vy:
        -rand(9, 13) *
        dpr,

      color:
        pick(COLORS),
    });

    AudioEngine.sfxWhoosh();
  }

  function explode(
    x,
    y,
    color
  ) {
    const count =
      randInt(
        38,
        60
      );

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const angle =
        (Math.PI * 2 * i) /
          count +
        rand(
          -0.1,
          0.1
        );

      const speed =
        rand(1.5, 5.5) *
        dpr;

      sparks.push({
        x,
        y,

        vx:
          Math.cos(angle) *
          speed,

        vy:
          Math.sin(angle) *
          speed,

        color,

        life: 0,

        maxLife:
          rand(
            50,
            80
          ),
      });
    }

    AudioEngine.sfxBoom();

    vibrate(20);
  }

  function loop() {
    if (!active) return;

    ctx2d.fillStyle =
      "rgba(20,14,36,0.22)";

    ctx2d.fillRect(
      0,
      0,
      cw,
      ch
    );

    rockets =
      rockets.filter(
        (r) => {
          r.y += r.vy;

          ctx2d.beginPath();

          ctx2d.fillStyle =
            r.color;

          ctx2d.arc(
            r.x,
            r.y,
            3 * dpr,
            0,
            Math.PI * 2
          );

          ctx2d.fill();

          if (
            r.y <=
            r.targetY
          ) {
            explode(
              r.x,
              r.y,
              r.color
            );

            return false;
          }

          return true;
        }
      );

    sparks =
      sparks.filter(
        (s) => {
          s.vy +=
            0.05 * dpr;

          s.x += s.vx;
          s.y += s.vy;

          s.life++;

          const alpha =
            clamp(
              1 -
                s.life /
                  s.maxLife,
              0,
              1
            );

          ctx2d.beginPath();

          ctx2d.globalAlpha =
            alpha;

          ctx2d.fillStyle =
            s.color;

          ctx2d.arc(
            s.x,
            s.y,
            2.6 * dpr,
            0,
            Math.PI * 2
          );

          ctx2d.fill();

          ctx2d.globalAlpha =
            1;

          return (
            s.life <
            s.maxLife
          );
        }
      );

    raf =
      requestAnimationFrame(
        loop
      );
  }

  $("#btn-after-fireworks").addEventListener(
    "click",
    () => {
      stop();

      ScreenManager.go(
        "screen-final"
      );
    }
  );
}

/* ---------------------------------------------------------------------
   17. FINAL CARD + HIDDEN DEV MODE
--------------------------------------------------------------------- */
function initFinal() {
  const nameEl =
    $("#final-name");

  if (
    CONFIG.NAME &&
    CONFIG.SHOW_NAME_ON_FINAL
  ) {
    nameEl.textContent =
      ", " +
      CONFIG.NAME +
      "!";
  } else {
    nameEl.textContent =
      "!";
  }

  const sigEl =
    $("#final-signature");

  if (CONFIG.FROM) {
    sigEl.textContent =
      "— " +
      CONFIG.FROM;
  }

  let tapCount = 0;
  let tapTimer = null;

  const secretCake =
    $("#secret-cake");

  secretCake.addEventListener(
    "click",
    () => {
      tapCount++;

      vibrate(8);

      clearTimeout(
        tapTimer
      );

      tapTimer =
        setTimeout(
          () => {
            tapCount = 0;
          },
          2200
        );

      if (
        tapCount >= 10
      ) {
        tapCount = 0;

        ScreenManager.go(
          "screen-dev"
        );
      }
    }
  );

  $("#btn-replay").addEventListener(
    "click",
    () => {
      window.location.reload();
    }
  );
}

function initDevMode() {
  $("#btn-dev-close").addEventListener(
    "click",
    () =>
      ScreenManager.go(
        "screen-final"
      )
  );
}

/* ---------------------------------------------------------------------
   18. WISH MODAL CLOSE
--------------------------------------------------------------------- */
function initWishModal() {
  $("#wish-modal-close").addEventListener(
    "click",
    hideWishModal
  );

  $("#wish-modal-backdrop").addEventListener(
    "click",
    (e) => {
      if (
        e.target.id ===
        "wish-modal-backdrop"
      ) {
        hideWishModal();
      }
    }
  );
}

/* ---------------------------------------------------------------------
   19. SERVICE WORKER
--------------------------------------------------------------------- */
function initServiceWorker() {
  if (
    "serviceWorker" in
    navigator
  ) {
    window.addEventListener(
      "load",
      () => {
        navigator.serviceWorker
          .register(
            "./service-worker.js"
          )
          .catch(() => {
            /* offline support simply won't be available; app still works */
          });
      }
    );
  }
}

/* ---------------------------------------------------------------------
   20. BOOTSTRAP
--------------------------------------------------------------------- */
function boot() {
  initServiceWorker();
  initMuteButton();
  initGlobalInteractions();
  initWishModal();
  initSplash();
  initWelcome();
  initGiftBox();
  initBalloons();
  initCake();
  initCatchGame();
  initGallery();
  initFireworks();
  initFinal();
  initDevMode();
}

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    boot
  );
} else {
  boot();
}
