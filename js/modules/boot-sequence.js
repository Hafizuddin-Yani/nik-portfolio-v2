/**
 * Boot Sequence - Page Load Orchestration
 * Terminal-style boot animation with system initialization messages
 */

'use strict';

const BootSequence = (function() {
  const CONFIG = {
    phases: {
      preloader: { duration: 800, messages: [
        '[OK] Memory check passed',
        '[OK] CPU cores detected: 8',
        '[OK] Network stack initialized',
        '[OK] Crypto module loaded: ChaCha20-Poly1305',
        '[OK] Secure enclave ready',
        '[OK] Loading user profile...',
        '[OK] Welcome back, nik'
      ]},
      background: { duration: 400 },
      hero: { duration: 1000 },
      nav: { duration: 400 },
      scrollReveal: { duration: 0 }
    },
    reducedMotion: false
  };

  let preloaderEl, bootMessagesEl, heroCards, heroMetrics;

  function init() {
    CONFIG.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cacheElements();
    if (CONFIG.reducedMotion) {
      return instantReveal();
    }
    runBootSequence();
  }

  function cacheElements() {
    preloaderEl = document.getElementById('boot-preloader');
    bootMessagesEl = document.getElementById('boot-messages');
    heroCards = document.querySelectorAll('.hero-card');
    heroMetrics = document.querySelectorAll('.metric-value[data-count]');
  }

  function instantReveal() {
    if (preloaderEl) preloaderEl.style.display = 'none';
    document.body.classList.add('boot-complete');
    document.dispatchEvent(new CustomEvent('boot:complete'));
  }

  async function runBootSequence() {
    await phasePreloader();
    await phaseBackgroundInit();
    await phaseHeroAssembly();
    await phaseNavInit();
    completeBoot();
  }

  function phasePreloader() {
    return new Promise(resolve => {
      if (!preloaderEl || !bootMessagesEl) return resolve();

      const messages = CONFIG.phases.preloader.messages;
      let msgIndex = 0;

      function typeMessage() {
        if (msgIndex >= messages.length) {
          gsap.to(preloaderEl, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: () => {
              preloaderEl.style.display = 'none';
              resolve();
            }
          });
          return;
        }

        const msg = messages[msgIndex];
        const line = document.createElement('div');
        line.className = 'boot-line';
        line.innerHTML = `<span class="boot-prefix">> </span><span class="boot-text"></span>`;
        bootMessagesEl.appendChild(line);

        const textEl = line.querySelector('.boot-text');
        let charIndex = 0;

        function typeChar() {
          if (charIndex >= msg.length) {
            msgIndex++;
            setTimeout(typeMessage, msgIndex < messages.length ? 120 : 0);
            return;
          }
          textEl.textContent += msg[charIndex];
          charIndex++;
          setTimeout(typeChar, 15 + Math.random() * 25);
        }

        typeChar();
      }

      typeMessage();
    });
  }

  function phaseBackgroundInit() {
    return new Promise(resolve => {
      const matrixCanvas = document.getElementById('canvas-matrix');
      const particlesCanvas = document.getElementById('canvas-particles');
      const scanlines = document.querySelector('.scanlines');
      const bgGradient = document.querySelector('.bg-gradient');

      gsap.timeline()
        .fromTo([matrixCanvas, particlesCanvas, scanlines, bgGradient],
          { opacity: 0, scale: 1.1 },
          { opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: 'power2.out' },
          0)
        .call(resolve);
    });
  }

  function phaseHeroAssembly() {
    return new Promise(resolve => {
      const greeting = document.querySelector('.hero-greeting');
      const nameLines = document.querySelectorAll('.name-line');
      const roleText = document.getElementById('role-text');
      const tagline = document.querySelector('.hero-tagline');
      const metaItems = document.querySelectorAll('.meta-item');
      const heroActions = document.querySelector('.hero-actions');
      const heroSocials = document.querySelector('.hero-socials');
      const scrollIndicator = document.querySelector('.scroll-indicator');
      const heroCards = document.querySelectorAll('.hero-card');
      const heroMetrics = document.querySelectorAll('.metric-value[data-count]');

      const tl = gsap.timeline({ onComplete: resolve });

      tl
        .from(greeting, { y: 20, opacity: 0, duration: 0.5, ease: 'power3.out' })
        .from(nameLines, {
          y: 50, opacity: 0, duration: 0.7, stagger: 0.12,
          ease: 'power3.out'
        }, '-=0.3')
        .from(roleText, {
          opacity: 0,
          duration: 0.5,
          ease: 'power3.out'
        }, '-=0.4')
        .from(tagline, { y: 20, opacity: 0, duration: 0.5, ease: 'power3.out' }, '-=0.6')
        .from(metaItems, { y: 20, opacity: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }, '-=0.4')
        .from(heroActions, { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
        .from(heroSocials, { y: 20, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' }, '-=0.2')
        .from(scrollIndicator, { y: 20, opacity: 0, duration: 0.5, ease: 'power3.out' }, '-=0.2')
        .from(heroCards, {
          rotationY: 90, opacity: 0, scale: 0.9,
          duration: 1, stagger: 0.15,
          ease: 'elastic.out(1, 0.5)',
          transformOrigin: 'center center -100px'
        }, '-=0.8')
        .from(heroMetrics, {
          duration: 1.5,
          ease: 'power2.out',
          onStart: () => animateCounters(heroMetrics)
        }, '-=0.6');
    });
  }

  function phaseNavInit() {
    return new Promise(resolve => {
      const navbar = document.querySelector('.navbar');
      const scrollProgress = document.getElementById('scroll-progress');

      gsap.timeline()
        .from(navbar, { y: -100, opacity: 0, duration: 0.6, ease: 'power3.out' })
        .from(scrollProgress, { scaleX: 0, transformOrigin: 'left center', duration: 0.4, ease: 'power2.out' }, '-=0.2')
        .call(resolve);
    });
  }

  function animateCounters(counters) {
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.count, 10);
      const duration = 1500;
      const start = performance.now();

      function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        counter.textContent = current.toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    });
  }

  function completeBoot() {
    document.body.classList.add('boot-complete');
    document.dispatchEvent(new CustomEvent('boot:complete'));
  }

  return { init };
})();

// Auto-initialize when module loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BootSequence.init());
} else {
  BootSequence.init();
}

// Expose globally for script.js
window.BootSequence = BootSequence;

// Auto-init removed - handled by script.js
