/**
 * ui.js — small page-level behaviours
 * Scroll progress indicator and the footer year.
 */
(function () {
  'use strict';

  var bar = document.querySelector('.progress');
  if (bar) {
    var tick = false;

    var update = function () {
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - window.innerHeight;
      var ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, ratio)) + ')';
      tick = false;
    };

    window.addEventListener('scroll', function () {
      if (!tick) {
        tick = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
}());
