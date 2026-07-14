/**
 * Text FX - Decrypt, Typewriter, Clip-Path, Scramble Effects
 * Reusable text animation utilities for immersive feel
 */

'use strict';

const TextFX = (function() {
  const DECRYPT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let scrollTriggers = [];

  function init() {
    if (prefersReducedMotion()) return;
    initDecryptText();
    initTypewriterText();
    initClipPathReveal();
    initScrambleText();
    initLineReveal();
  }

  // ===== DECRYPT EFFECT - Matrix-style character resolution =====
  function initDecryptText() {
    const elements = document.querySelectorAll('[data-decrypt]');

    elements.forEach(el => {
      const originalText = el.textContent;
      el.dataset.originalText = originalText;
      el.style.opacity = '0';

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => decrypt(el, originalText),
        onEnterBack: () => decrypt(el, originalText),
        once: true
      });
    });
  }

  function decrypt(el, targetText) {
    const chars = targetText.split('');
    let currentFrame = 0;
    const totalFrames = 20;

    const interval = setInterval(() => {
      let displayText = '';
      chars.forEach((char, i) => {
        if (i < currentFrame) {
          displayText += char;
        } else if (i === currentFrame) {
          displayText += DECRYPT_CHARS[Math.floor(Math.random() * DECRYPT_CHARS.length)];
        } else {
          displayText += '░';
        }
      });
      el.textContent = displayText;
      currentFrame++;

      if (currentFrame >= chars.length + 5) {
        clearInterval(interval);
        el.textContent = targetText;
        gsap.to(el, { opacity: 1, duration: 0.3 });
      }
    }, 30);
  }

  // ===== TYPEWRITER EFFECT =====
  function initTypewriterText() {
    const elements = document.querySelectorAll('[data-typewriter]');

    elements.forEach(el => {
      const text = el.dataset.typewriter || el.textContent;
      const speed = parseInt(el.dataset.typewriterSpeed, 10) || 40;
      const cursor = el.dataset.typewriterCursor !== 'false';
      el.textContent = '';

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => typewriter(el, text, speed, cursor),
        once: true
      });
    });
  }

  function typewriter(el, text, speed, showCursor) {
    let i = 0;
    const cursor = showCursor ? '<span class="typewriter-cursor">|</span>' : '';

    function type() {
      if (i <= text.length) {
        el.innerHTML = text.slice(0, i) + cursor;
        i++;
        setTimeout(type, speed + Math.random() * 30);
      } else if (showCursor) {
        // Blink cursor
        const cursorEl = el.querySelector('.typewriter-cursor');
        if (cursorEl) {
          setInterval(() => {
            cursorEl.style.opacity = cursorEl.style.opacity === '0' ? '1' : '0';
          }, 530);
        }
      }
    }
    type();
  }

  // ===== CLIP-PATH REVEAL - Line by line =====
  function initClipPathReveal() {
    const elements = document.querySelectorAll('[data-clip-reveal]');

    elements.forEach(el => {
      const lines = el.dataset.clipReveal === 'lines' ? el.querySelectorAll('p, li, h1, h2, h3, h4, span') : [el];
      const stagger = parseFloat(el.dataset.clipStagger) || 0.1;

      lines.forEach((line, i) => {
        if (line.style.clipPath === undefined && !line.dataset.clipInitialized) {
          line.dataset.clipInitialized = 'true';
          line.style.clipPath = 'inset(0 100% 0 0)';
          line.style.opacity = '1';
        }
      });

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(lines, {
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.8,
            ease: 'power3.out',
            stagger: stagger
          });
        },
        once: true
      });
    });
  }

  // ===== SCRAMBLE EFFECT - Random chars settling =====
  function initScrambleText() {
    const elements = document.querySelectorAll('[data-scramble]');

    elements.forEach(el => {
      const originalText = el.textContent;
      const duration = parseFloat(el.dataset.scrambleDuration) || 1.5;

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => scramble(el, originalText, duration),
        once: true
      });
    });
  }

  function scramble(el, targetText, duration) {
    const chars = targetText.split('');
    const totalFrames = 30;
    let frame = 0;

    const interval = setInterval(() => {
      let display = '';
      chars.forEach((char, i) => {
        if (char === ' ') {
          display += ' ';
        } else if (i < frame * (chars.length / totalFrames)) {
          display += char;
        } else {
          display += DECRYPT_CHARS[Math.floor(Math.random() * DECRYPT_CHARS.length)];
        }
      });
      el.textContent = display;
      frame++;

      if (frame > totalFrames) {
        clearInterval(interval);
        el.textContent = targetText;
      }
    }, duration * 1000 / totalFrames);
  }

  // ===== LINE REVEAL - Staggered line animation =====
  function initLineReveal() {
    const containers = document.querySelectorAll('[data-line-reveal]');

    containers.forEach(container => {
      const lines = container.querySelectorAll('[data-line], p, li, .highlight-content p');
      const stagger = parseFloat(container.dataset.lineStagger) || 0.1;

      lines.forEach(line => {
        if (!line.dataset.lineInitialized) {
          line.dataset.lineInitialized = 'true';
          line.style.opacity = '0';
          line.style.transform = 'translateY(20px)';
        }
      });

      ScrollTrigger.create({
        trigger: container,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(lines, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            stagger: stagger
          });
        },
        once: true
      });
    });
  }

  // ===== UTILITY: Split text into spans for per-char animation =====
  function splitText(element, type = 'chars') {
    const text = element.textContent;
    element.textContent = '';
    element.style.display = 'inline-block';

    const splitBy = type === 'words' ? ' ' : '';
    const parts = text.split(splitBy);
    const wrapper = document.createElement('span');
    wrapper.className = `split-text split-${type}`;
    wrapper.style.display = 'inline-block';

    parts.forEach((part, i) => {
      const span = document.createElement('span');
      span.className = type === 'words' ? 'word' : 'char';
      span.textContent = part;
      span.style.display = 'inline-block';
      if (type === 'words' && i < parts.length - 1) span.textContent += ' ';
      wrapper.appendChild(span);
    });

    element.appendChild(wrapper);
    return wrapper;
  }

  // ===== UTILITY: Reveal split text =====
  function revealSplitText(element, options = {}) {
    const { type = 'chars', stagger = 0.03, duration = 0.5, ease = 'power3.out', from = { opacity: 0, y: 20 } } = options;
    const wrapper = element.querySelector(`.split-${type}`) || splitText(element, type);
    const items = wrapper.querySelectorAll(`.${type === 'words' ? 'word' : 'char'}`);

    gsap.from(items, {
      ...from,
      duration,
      ease,
      stagger,
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        once: true
      }
    });

    return items;
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function destroy() {
    scrollTriggers.forEach(st => st.kill());
    scrollTriggers = [];
    document.querySelectorAll('[data-decrypt], [data-typewriter], [data-clip-reveal], [data-scramble], [data-line-reveal]')
      .forEach(el => {
        el.style.opacity = '';
        el.style.clipPath = '';
        el.style.transform = '';
      });
  }

  return {
    init,
    destroy,
    splitText,
    revealSplitText,
    decrypt,
    typewriter,
    scramble
  };
})();

// Expose globally for script.js
window.TextFX = TextFX;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TextFX;
}