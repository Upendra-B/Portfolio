/**
 * regression.js — the interactive plot in the hero
 *
 * Draws a scatter and fits an ordinary least-squares line through it. The
 * line, the slope, the intercept and R² are all computed from the points
 * actually on screen — nothing here is faked for appearance.
 *
 * Click or tap the plot to add a point and watch the fit move. The faint
 * vertical segments are the residuals: the quantity least squares minimises.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('fit');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var out = {
    n:  document.getElementById('outN'),
    m:  document.getElementById('outM'),
    c:  document.getElementById('outC'),
    r2: document.getElementById('outR2')
  };
  var addBtn = document.getElementById('addPoint');
  var resetBtn = document.getElementById('resetPlot');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SEED_COUNT = 40;
  var PAD_X = 18;
  var PAD_Y = 16;

  var points = [];
  var width = 0;
  var height = 0;
  var palette = window.sitePalette || {
    ink: '#EAF1F1', muted: '#8AA0A2', line: '#1F2D2E',
    sigA: '#4FD0DE', sigB: '#F0A93F'
  };

  /* ---------------------------------------------------------- *
   * Maths
   * ---------------------------------------------------------- */

  /**
   * Ordinary least-squares fit of y = mx + c.
   * @param {Array<{x:number,y:number}>} pts
   * @returns {{m:number, c:number, r2:number}}
   */
  function leastSquares(pts) {
    var n = pts.length;
    if (n < 2) return { m: 0, c: n ? pts[0].y : 0.5, r2: 0 };

    var sx = 0, sy = 0, sxx = 0, sxy = 0, i;
    for (i = 0; i < n; i++) {
      sx  += pts[i].x;
      sy  += pts[i].y;
      sxx += pts[i].x * pts[i].x;
      sxy += pts[i].x * pts[i].y;
    }

    var denom = n * sxx - sx * sx;
    var m = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
    var c = (sy - m * sx) / n;

    // Coefficient of determination: 1 - SSres / SStot
    var mean = sy / n;
    var ssRes = 0, ssTot = 0;
    for (i = 0; i < n; i++) {
      var predicted = m * pts[i].x + c;
      ssRes += Math.pow(pts[i].y - predicted, 2);
      ssTot += Math.pow(pts[i].y - mean, 2);
    }
    var r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    return { m: m, c: c, r2: r2 };
  }

  /* ---------------------------------------------------------- *
   * Data
   * ---------------------------------------------------------- */

  /** Build the starting cloud: a noisy upward trend. */
  function seed() {
    points = [];
    for (var i = 0; i < SEED_COUNT; i++) {
      var x = i / (SEED_COUNT - 1);
      points.push({
        x: x,
        base: 0.22 + 0.56 * x,
        noise: (Math.random() * 2 - 1) * 0.13,
        phase: Math.random() * Math.PI * 2,
        user: false
      });
    }
  }

  /** Resolve each point's current y, including the idle drift. */
  function resolve(time) {
    return points.map(function (p) {
      if (p.user) return { x: p.x, y: p.y, user: true };
      var drift = reduceMotion ? 0 : Math.sin(time / 2400 + p.phase) * 0.03;
      return { x: p.x, y: p.base + p.noise + drift, user: false };
    });
  }

  /* ---------------------------------------------------------- *
   * Drawing
   * ---------------------------------------------------------- */

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(time) {
    if (!width || !height) return;

    var plotW = width - PAD_X * 2;
    var plotH = height - PAD_Y * 2;
    var toPx = function (p) {
      return { px: PAD_X + p.x * plotW, py: PAD_Y + plotH * (1 - p.y) };
    };

    ctx.clearRect(0, 0, width, height);

    // Gridlines
    ctx.strokeStyle = palette.line;
    ctx.lineWidth = 1;
    var g;
    for (g = 0; g <= 4; g++) {
      var gy = Math.round(PAD_Y + plotH * g / 4) + 0.5;
      ctx.beginPath();
      ctx.moveTo(PAD_X, gy);
      ctx.lineTo(width - PAD_X, gy);
      ctx.stroke();
    }
    for (g = 0; g <= 6; g++) {
      var gx = Math.round(PAD_X + plotW * g / 6) + 0.5;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(gx, PAD_Y);
      ctx.lineTo(gx, height - PAD_Y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    var current = resolve(time);
    var fit = leastSquares(current);

    // Residuals — the distances least squares is minimising.
    ctx.strokeStyle = palette.muted;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    current.forEach(function (p) {
      var a = toPx(p);
      var b = toPx({ x: p.x, y: fit.m * p.x + fit.c });
      ctx.beginPath();
      ctx.moveTo(a.px, a.py);
      ctx.lineTo(b.px, b.py);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // The fitted line
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(PAD_X, PAD_Y + plotH * (1 - fit.c));
    ctx.lineTo(PAD_X + plotW, PAD_Y + plotH * (1 - (fit.m + fit.c)));
    ctx.stroke();

    // Points, coloured by which side of the line they fall on
    current.forEach(function (p) {
      var at = toPx(p);
      var above = p.y > fit.m * p.x + fit.c;
      ctx.fillStyle = above ? palette.sigA : palette.sigB;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(at.px, at.py, p.user ? 4 : 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Points the visitor added get a ring so they stand out.
      if (p.user) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = palette.ink;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(at.px, at.py, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;

    report(current.length, fit);
  }

  function report(n, fit) {
    if (out.n)  out.n.textContent  = String(n);
    if (out.m)  out.m.textContent  = fit.m.toFixed(3);
    if (out.c)  out.c.textContent  = fit.c.toFixed(3);
    if (out.r2) out.r2.textContent = fit.r2.toFixed(3);
  }

  /* ---------------------------------------------------------- *
   * Interaction
   * ---------------------------------------------------------- */

  function clamp(v) { return Math.max(0.02, Math.min(0.98, v)); }

  /** Add a point at a position given in CSS pixels relative to the canvas. */
  function addAt(cssX, cssY) {
    var plotW = width - PAD_X * 2;
    var plotH = height - PAD_Y * 2;
    points.push({
      x: clamp((cssX - PAD_X) / plotW),
      y: clamp(1 - (cssY - PAD_Y) / plotH),
      user: true
    });
    if (reduceMotion) draw(0);
  }

  canvas.addEventListener('pointerdown', function (event) {
    var rect = canvas.getBoundingClientRect();
    addAt(event.clientX - rect.left, event.clientY - rect.top);
  });

  if (addBtn) {
    // Keyboard and screen-reader path to the same behaviour.
    addBtn.addEventListener('click', function () {
      points.push({ x: clamp(Math.random()), y: clamp(Math.random()), user: true });
      if (reduceMotion) draw(0);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      seed();
      if (reduceMotion) draw(0);
    });
  }

  window.addEventListener('themechange', function (event) {
    palette = event.detail;
    if (reduceMotion) draw(0);
  });

  window.addEventListener('resize', function () {
    resize();
    if (reduceMotion) draw(0);
  });

  /* ---------------------------------------------------------- *
   * Start
   * ---------------------------------------------------------- */

  function frame(time) {
    draw(time);
    window.requestAnimationFrame(frame);
  }

  seed();
  resize();
  if (reduceMotion) {
    draw(0);
  } else {
    window.requestAnimationFrame(frame);
  }
}());
