/**
 * theme.js — light/dark switching and palette broadcast
 *
 * The site defaults to dark and follows the visitor's OS preference.
 * An explicit choice is remembered in localStorage and wins over the OS.
 *
 * Canvas drawing can't read CSS variables cheaply on every frame, so this
 * module resolves the current palette once and republishes it on a
 * `themechange` event. regression.js listens for that.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var btn = document.getElementById('themeBtn');
  var STORE_KEY = 'theme';

  /** Restore a remembered choice. Private browsing can throw here. */
  try {
    var saved = localStorage.getItem(STORE_KEY);
    if (saved === 'dark' || saved === 'light') {
      root.setAttribute('data-theme', saved);
    }
  } catch (err) { /* storage unavailable — fall back to the OS preference */ }

  /** @returns {boolean} true when the page is currently rendering dark. */
  function isDark() {
    var explicit = root.getAttribute('data-theme');
    if (explicit) return explicit === 'dark';
    return !window.matchMedia('(prefers-color-scheme: light)').matches;
  }

  /** Read the resolved token values and tell anyone who draws with them. */
  function broadcast() {
    var cs = getComputedStyle(root);
    var palette = {
      ink:   cs.getPropertyValue('--ink').trim(),
      muted: cs.getPropertyValue('--muted').trim(),
      line:  cs.getPropertyValue('--line').trim(),
      panel: cs.getPropertyValue('--panel').trim(),
      sigA:  cs.getPropertyValue('--sig-a').trim(),
      sigB:  cs.getPropertyValue('--sig-b').trim()
    };
    window.sitePalette = palette;
    window.dispatchEvent(new CustomEvent('themechange', { detail: palette }));
  }

  if (btn) {
    btn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      btn.setAttribute('aria-pressed', String(next === 'dark'));
      try { localStorage.setItem(STORE_KEY, next); } catch (err) { /* ignore */ }
      // Let the new custom-property values settle before reading them back.
      setTimeout(broadcast, 20);
    });
  }

  try {
    window.matchMedia('(prefers-color-scheme: light)')
      .addEventListener('change', function () { setTimeout(broadcast, 20); });
  } catch (err) { /* older browsers: OS changes simply won't repaint the canvas */ }

  broadcast();
}());
