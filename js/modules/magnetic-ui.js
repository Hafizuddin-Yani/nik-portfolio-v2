/**
 * Magnetic UI - Magnetic Buttons, Cursor Trail, Click Ripples
 * Terminal-themed interactive feedback layer
 */

'use strict';

const MagneticUI = (function() {
  const MAGNETIC_SELECTOR = '.btn, .btn-primary, .btn-secondary, .btn-ghost, .project-link, .social-link, .nav-link, .skill-tag, .timeline-tech span, .project-tech span, .edu-details span, .cert-card, .highlight-card';
  const TRAIL_CHARS = ['>_', '0x', 'root@', 'sudo ', 'npm>', 'git>', 'ssh>', 'cat ', 'ls -la', 'whoami', 'ping', 'nmap', 'wazuh', 'flag{'];
  let magneticElements = [];
  let cursorTrail = [];
  let rafId = null;
  let mouseX = 0, mouseY = 0;

  function init() {
    if (prefersReducedMotion()) return;
    cacheElements();
    initMagneticButtons();
    initCursorTrail();
    initClickRipple();
  }

  function cacheElements() {
    magneticElements = document.querySelectorAll(MAGNETIC_SELECTOR);
  }

  // ===== MAGNETIC BUTTONS =====
  function initMagneticButtons() {
    magneticElements.forEach(el => {
      if (el.classList.contains('magnetic-initialized')) return;
      el.classList.add('magnetic-initialized');

      const strength = el.dataset.magneticStrength || 0.3;
      const maxDist = parseInt(el.dataset.magneticDistance, 10) || 60;

      el.addEventListener('mousemove', e => magneticMove(e, el, strength, maxDist));
      el.addEventListener('mouseleave', e => magneticLeave(e, el));
      el.addEventListener('mousedown', () => el.classList.add('magnetic-click'));
      el.addEventListener('mouseup', () => el.classList.remove('magnetic-click'));
      el.addEventListener('click', e => createRipple(e, el));
    });
  }

  function magneticMove(e, el, strength, maxDist) {
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (dist < maxDist) {
      const force = (1 - dist / maxDist) * strength;
      const moveX = deltaX * force;
      const moveY = deltaY * force;

      gsap.to(el, {
        x: moveX,
        y: moveY,
        duration: 0.3,
        ease: 'power2.out'
      });

      // Scale up slightly
      gsap.to(el, { scale: 1.03, duration: 0.2 });
    }
  }

  function magneticLeave(e, el) {
    gsap.to(el, {
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)'
    });
  }

  // ===== CURSOR TRAIL - Terminal Characters =====
  function initCursorTrail() {
    const trailContainer = document.createElement('div');
    trailContainer.className = 'cursor-trail-container';
    trailContainer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(trailContainer);

    // Spawn trail elements periodically
    let spawnCounter = 0;
    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      spawnCounter++;
      if (spawnCounter % 3 === 0) { // Spawn every 3 mousemove events
        spawnTrailChar(mouseX, mouseY, trailContainer);
      }
    });

    // Pause/resume on blur/focus to prevent memory leaks
    window.addEventListener('blur', pauseTrail);
    window.addEventListener('focus', resumeTrail);
    document.addEventListener('visibilitychange', () => {
      document.hidden ? pauseTrail() : resumeTrail();
    });

    animateTrail();
  }

  function pauseTrail() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function resumeTrail() {
    if (!rafId) {
      animateTrail();
    }
  }

  function spawnTrailChar(x, y, container) {
    const char = TRAIL_CHARS[Math.floor(Math.random() * TRAIL_CHARS.length)];
    const el = document.createElement('span');
    el.className = 'cursor-trail-char';
    el.textContent = char;
    el.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      color: var(--accent);
      opacity: 0;
      pointer-events: none;
      z-index: 9998;
      transform: translate(-50%, -50%);
      white-space: nowrap;
      will-change: transform, opacity;
    `;
    container.appendChild(el);

    cursorTrail.push({
      el,
      x,
      y,
      life: 1,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5 - 0.3 // slight upward drift
    });

    // Fade in
    gsap.to(el, { opacity: 0.6, duration: 0.1 });

    // Cleanup old trails
    if (cursorTrail.length > 30) {
      const old = cursorTrail.shift();
      gsap.to(old.el, { opacity: 0, duration: 0.3, onComplete: () => old.el.remove() });
    }
  }

  function animateTrail() {
    cursorTrail.forEach((trail, i) => {
      trail.life -= 0.02;
      trail.x += trail.vx;
      trail.y += trail.vy;
      trail.vy += 0.005; // gravity

      gsap.set(trail.el, {
        x: trail.x,
        y: trail.y,
        opacity: Math.max(0, trail.life * 0.6),
        scale: trail.life
      });

      if (trail.life <= 0) {
        trail.el.remove();
        cursorTrail.splice(i, 1);
      }
    });

    rafId = requestAnimationFrame(animateTrail);
  }

  // ===== CLICK RIPPLE =====
  function initClickRipple() {
    document.addEventListener('click', e => {
      const target = e.target.closest(MAGNETIC_SELECTOR);
      if (target) createRipple(e, target);
    });
  }

  function createRipple(e, el) {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.className = 'magnetic-ripple';
    ripple.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
      opacity: 0.4;
      pointer-events: none;
      transform: translate(-50%, -50%);
      z-index: 1;
    `;

    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(ripple);

    const maxSize = Math.max(rect.width, rect.height) * 1.5;

    gsap.to(ripple, {
      width: maxSize,
      height: maxSize,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => ripple.remove()
    });
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    document.querySelector('.cursor-trail-container')?.remove();
    magneticElements.forEach(el => {
      el.classList.remove('magnetic-initialized');
      gsap.set(el, { x: 0, y: 0, scale: 1 });
    });
    cursorTrail = [];
  }

  return { init, destroy };
})();

// Auto-initialize when module loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MagneticUI.init());
} else {
  MagneticUI.init();
}

// Expose globally for script.js
window.MagneticUI = MagneticUI;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MagneticUI;
}