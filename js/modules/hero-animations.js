/**
 * Hero Animations - Deep Interactive Card Effects
 * Code card syntax highlighting, terminal execution, metrics count-up
 */

'use strict';

const HeroAnimations = (function() {
  let codeCard, terminalCard, metricsCard;
  let codeLines, terminalLines, metricValues;
  let scrollTriggerInstances = [];

  function init() {
    if (prefersReducedMotion()) return;
    cacheElements();
    initCodeCard();
    initTerminalCard();
    initMetricsCard();
    initCard3DTilt();
  }

  function cacheElements() {
    codeCard = document.querySelector('.hero-card.card-1');
    terminalCard = document.querySelector('.hero-card.card-2');
    metricsCard = document.querySelector('.hero-card.card-3');

    codeLines = codeCard?.querySelectorAll('.card-code code, .card-code .kw, .card-code .str, .card-code .fn');
    terminalLines = terminalCard?.querySelectorAll('.term-line');
    metricValues = metricsCard?.querySelectorAll('.metric-value[data-count]');
  }

  // ===== CODE CARD - Syntax Token Highlighting =====
  function initCodeCard() {
    if (!codeCard) return;

    const tokens = codeCard.querySelectorAll('.card-code .kw, .card-code .str, .card-code .fn, .card-code .comment, .card-code .operator');
    if (!tokens.length) return;

    // Initial state
    gsap.set(tokens, { opacity: 0.4 });

    // Scroll-triggered sequential highlight
    ScrollTrigger.create({
      trigger: codeCard,
      start: 'top 80%',
      end: 'bottom 20%',
      onEnter: () => highlightTokens(tokens),
      onLeaveBack: () => resetTokens(tokens),
      onEnterBack: () => highlightTokens(tokens),
      onLeave: () => resetTokens(tokens)
    });

    // Hover: pause animation, highlight all
    codeCard.addEventListener('mouseenter', () => {
      gsap.to(tokens, { opacity: 1, duration: 0.3, stagger: 0.02 });
    });
    codeCard.addEventListener('mouseleave', () => {
      gsap.to(tokens, { opacity: 0.4, duration: 0.5, stagger: 0.01 });
    });
  }

  function highlightTokens(tokens) {
    gsap.to(tokens, {
      opacity: 1,
      duration: 1.5,
      stagger: 0.08,
      ease: 'power2.out'
    });
  }

  function resetTokens(tokens) {
    gsap.to(tokens, { opacity: 0.4, duration: 0.3 });
  }

  // ===== TERMINAL CARD - Command Execution Simulation =====
  function initTerminalCard() {
    if (!terminalCard) return;

    const commands = [
      { prompt: 'nik@lab:~$', cmd: 'nmap -sS -A 192.168.1.0/24', delay: 500, output: [
        'Starting Nmap 7.94 at 2026-01-14 10:30 UTC',
        'Nmap scan report for 192.168.1.1',
        'Host is up (0.002s latency).',
        'PORT     STATE SERVICE',
        '22/tcp   open  ssh',
        '80/tcp   open  http',
        '443/tcp  open  https'
      ]},
      { prompt: 'nik@lab:~$', cmd: 'wazuh-manager status', delay: 800, output: [
        'Wazuh v4.7.0 - Running',
        'Active agents: 12',
        'Events processed: 1.2M/hr'
      ]},
      { prompt: 'nik@lab:~$', cmd: 'cat flag.txt', delay: 300, output: [
        'FLAG{E2EE_X25519_CHACHA20_POLY1305}'
      ]}
    ];

    let currentCmd = 0;
    const terminalContent = terminalCard.querySelector('.card-terminal');

    function runSequence() {
      if (currentCmd >= commands.length) {
        currentCmd = 0;
        terminalContent.innerHTML = '';
      }

      const cmd = commands[currentCmd];
      executeCommand(cmd, terminalContent);
      currentCmd++;
    }

    function executeCommand(cmd, container) {
      const promptLine = document.createElement('div');
      promptLine.className = 'term-line';
      promptLine.innerHTML = `<span class="prompt">${cmd.prompt}</span> <span class="cmd">${cmd.cmd}</span>`;
      container.appendChild(promptLine);

      gsap.from(promptLine, { opacity: 0, y: 10, duration: 0.4 });

      setTimeout(() => {
        cmd.output.forEach((line, i) => {
          setTimeout(() => {
            const outLine = document.createElement('div');
            outLine.className = 'term-line';
            outLine.innerHTML = `<span class="out">${line}</span>`;
            container.appendChild(outLine);
            gsap.from(outLine, { opacity: 0, y: 5, duration: 0.3 });
            container.scrollTop = container.scrollHeight;
          }, i * 150);
        });

        // Next command
        setTimeout(() => runSequence(), cmd.output.length * 150 + 1500);
      }, cmd.delay);
    }

    // Start on scroll into view
    ScrollTrigger.create({
      trigger: terminalCard,
      start: 'top 85%',
      onEnter: () => {
        if (!terminalCard.dataset.started) {
          terminalCard.dataset.started = 'true';
          runSequence();
        }
      }
    });
  }

  // ===== METRICS CARD - Count-Up Animation =====
  function initMetricsCard() {
    if (!metricsCard || !metricValues.length) return;

    const animateMetrics = () => {
      metricValues.forEach((el, i) => {
        const target = parseInt(el.dataset.count, 10);
        const proxy = { value: 0 };
        gsap.to(proxy, {
          value: target,
          duration: 1.5,
          ease: 'power2.out',
          delay: i * 0.15,
          onUpdate: () => {
            el.textContent = Math.round(proxy.value).toLocaleString();
          }
        });
      });
    };

    ScrollTrigger.create({
      trigger: metricsCard,
      start: 'top 85%',
      onEnter: animateMetrics,
      onEnterBack: animateMetrics,
      once: true
    });
  }

  // ===== 3D Tilt Effect on All Hero Cards =====
  function initCard3DTilt() {
    const cards = document.querySelectorAll('.hero-card');

    cards.forEach(card => {
      const content = card.querySelector('.card-content');
      if (!content) return;

      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / centerY * 8; // max 8deg
        const rotateY = (centerX - x) / centerX * 8;

        gsap.to(content, {
          rotationX: rotateX,
          rotationY: rotateY,
          transformPerspective: 1000,
          transformOrigin: 'center center',
          duration: 0.3,
          ease: 'power2.out'
        });

        // Glow follows mouse
        const glow = card.querySelector('.card-glow');
        if (glow) {
          gsap.to(glow, {
            x: (x - centerX) * 0.5,
            y: (y - centerY) * 0.5,
            duration: 0.3
          });
        }
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(content, {
          rotationX: 0,
          rotationY: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)'
        });
        const glow = card.querySelector('.card-glow');
        if (glow) gsap.to(glow, { x: 0, y: 0, duration: 0.6 });
      });
    });
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function destroy() {
    scrollTriggerInstances.forEach(st => st.kill());
    scrollTriggerInstances = [];
  }

  return { init, destroy };
})();

// Auto-initialize when module loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => HeroAnimations.init());
} else {
  HeroAnimations.init();
}

// Expose globally for script.js
window.HeroAnimations = HeroAnimations;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeroAnimations;
}