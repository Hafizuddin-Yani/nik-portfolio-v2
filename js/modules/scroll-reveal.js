/**
 * Scroll Reveal - GSAP ScrollTrigger animations per section
 * Orchestrates all section entrance animations
 */

const ScrollReveal = (() => {
  'use strict';

  const CONFIG = {
    sections: [
      {
        id: 'about',
        root: '#about',
        triggers: [
          { selector: '.about-text', animation: 'fadeUp', delay: 0 },
          { selector: '.highlight-card', animation: 'fadeUp', delay: 0, stagger: 0.1 }
        ]
      },
      {
        id: 'skills',
        root: '#skills',
        triggers: [
          { selector: '.skills-radar-wrap', animation: 'fadeUp', delay: 0 },
          { selector: '.skill-category', animation: 'fadeUp', delay: 0, stagger: 0.08 },
          { selector: '.skill-fill', animation: 'fillBar', delay: 0.2, stagger: 0.05 }
        ]
      },
      {
        id: 'experience',
        root: '#experience',
        triggers: [
          { selector: '.timeline-item', animation: 'timelineReveal', delay: 0, stagger: 0.15 }
        ]
      },
      {
        id: 'projects',
        root: '#projects',
        triggers: [
          { selector: '.project-card', animation: 'cardReveal', delay: 0, stagger: 0.12 }
        ]
      },
      {
        id: 'education',
        root: '#education',
        triggers: [
          { selector: '.edu-item', animation: 'eduReveal', delay: 0, stagger: 0.12 }
        ]
      },
      {
        id: 'certifications',
        root: '#certifications',
        triggers: [
          { selector: '.cert-card', animation: 'certReveal', delay: 0, stagger: 0.1 }
        ]
      },
      {
        id: 'contact',
        root: '#contact',
        triggers: [
          { selector: '.footer-brand', animation: 'fadeUp', delay: 0 },
          { selector: '.footer-col', animation: 'fadeUp', delay: 0, stagger: 0.1 }
        ]
      }
    ],
    defaults: {
      start: 'top 75%',
      end: 'bottom 25%',
      toggleActions: 'play none none reverse',
      ease: 'power3.out',
      duration: 0.8
    },
    reducedMotion: {
      duration: 0.01,
      ease: 'none'
    }
  };

  let scrollTriggers = [];
  let prefersReducedMotion = false;

  function init() {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP/ScrollTrigger not loaded, skipping scroll reveal');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    if (prefersReducedMotion) {
      document.body.classList.add('reduced-motion');
      instantReveal();
      return;
    }

    createScrollTriggers();
    setupScrollProgress();
    setupSectionPinning();
  }

  function instantReveal() {
    gsap.set('.reveal, .skill-fill, .timeline-item, .project-card, .edu-item, .cert-card', {
      opacity: 1,
      y: 0,
      scale: 1,
      transformOrigin: 'center center'
    });
    document.body.classList.add('boot-complete');
  }

  function createScrollTriggers() {
    CONFIG.sections.forEach(section => {
      const root = document.querySelector(section.root);
      if (!root) return;

      section.triggers.forEach(triggerConfig => {
        const elements = root.querySelectorAll(triggerConfig.selector);
        if (!elements.length) return;

        const vars = getAnimationVars(triggerConfig, elements);
        const trigger = ScrollTrigger.create({
          trigger: root,
          start: CONFIG.defaults.start,
          end: CONFIG.defaults.end,
          toggleActions: CONFIG.defaults.toggleActions,
          onEnter: () => vars.play(),
          onLeaveBack: () => vars.reverse(),
          ...vars.scrollTrigger
        });

        scrollTriggers.push(trigger);
      });
    });
  }

  function getAnimationVars(triggerConfig, elements) {
    const anim = ANIMATIONS[triggerConfig.animation];
    if (!anim) return { play: () => {}, reverse: () => {} };

    return anim.create(elements, {
      delay: triggerConfig.delay || 0,
      stagger: triggerConfig.stagger || 0,
      duration: prefersReducedMotion ? CONFIG.reducedMotion.duration : CONFIG.defaults.duration,
      ease: prefersReducedMotion ? CONFIG.reducedMotion.ease : CONFIG.defaults.ease
    });
  }

  function setupScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;

    ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progressBar.style.setProperty('--progress', self.progress);
        progressBar.value = self.progress * 100;
      }
    });
  }

  function setupSectionPinning() {
    // Pin timeline while animating
    const timeline = document.querySelector('.timeline');
    if (timeline) {
      ScrollTrigger.create({
        trigger: timeline,
        start: 'top center',
        end: 'bottom center',
        pin: false,
        pinSpacing: false
      });
    }
  }

  function refresh() {
    ScrollTrigger.refresh();
  }

  function killAll() {
    scrollTriggers.forEach(t => t.kill());
    scrollTriggers = [];
  }

  const ANIMATIONS = {
    fadeUp: {
      create(elements, opts) {
        const tl = gsap.timeline({ paused: true });
        tl.from(elements, {
          y: 40,
          opacity: 0,
          duration: opts.duration,
          ease: opts.ease,
          stagger: opts.stagger,
          delay: opts.delay
        });
        return { play: () => tl.play(), reverse: () => tl.reverse() };
      }
    },

    fillBar: {
      create(elements, opts) {
        elements.forEach(el => {
          const targetWidth = el.dataset.width || el.style.width;
          gsap.set(el, { width: 0 });
        });

        const tl = gsap.timeline({ paused: true });
        tl.to(elements, {
          width: (i, el) => el.dataset.width || '100%',
          duration: opts.duration * 1.5,
          ease: 'power2.out',
          stagger: opts.stagger,
          delay: opts.delay
        });
        return { play: () => tl.play(), reverse: () => tl.reverse() };
      }
    },

    timelineReveal: {
      create(elements, opts) {
        const tl = gsap.timeline({ paused: true });
        elements.forEach((item, i) => {
          const marker = item.querySelector('.marker-dot');
          const content = item.querySelector('.timeline-content');

          const itemTl = gsap.timeline();
          itemTl
            .from(marker, {
              scale: 0,
              opacity: 0,
              duration: 0.5,
              ease: 'back.out(1.7)'
            })
            .from(content, {
              x: -60,
              opacity: 0,
              duration: 0.6,
              ease: 'power3.out'
            }, '-=0.3');

          tl.add(itemTl, i * opts.stagger);
        });

        gsap.to(tl, { delay: opts.delay });
        return { play: () => tl.play(), reverse: () => tl.reverse() };
      }
    },

    cardReveal: {
      create(elements, opts) {
        const tl = gsap.timeline({ paused: true });
        tl.from(elements, {
          y: 60,
          opacity: 0,
          rotationX: -15,
          transformPerspective: 1000,
          duration: opts.duration,
          ease: opts.ease,
          stagger: opts.stagger,
          delay: opts.delay
        });
        return { play: () => tl.play(), reverse: () => tl.reverse() };
      }
    },

    eduReveal: {
      create(elements, opts) {
        const tl = gsap.timeline({ paused: true });
        elements.forEach((item, i) => {
          const marker = item.querySelector('.edu-marker');
          const content = item.querySelector('.edu-content');

          const itemTl = gsap.timeline();
          itemTl
            .from(marker, {
              scale: 0,
              rotation: -90,
              duration: 0.5,
              ease: 'back.out(1.7)'
            })
            .from(content, {
              x: -40,
              opacity: 0,
              duration: 0.6,
              ease: 'power3.out'
            }, '-=0.3');

          tl.add(itemTl, i * opts.stagger);
        });
        return { play: () => tl.play(), reverse: () => tl.reverse() };
      }
    },

    certReveal: {
      create(elements, opts) {
        const tl = gsap.timeline({ paused: true });
        tl.from(elements, {
          y: 30,
          opacity: 0,
          scale: 0.95,
          duration: opts.duration,
          ease: opts.ease,
          stagger: opts.stagger,
          delay: opts.delay
        });
        return { play: () => tl.play(), reverse: () => tl.reverse() };
      }
    }
  };

  return {
    init,
    refresh,
    killAll,
    prefersReducedMotion: () => prefersReducedMotion
  };
})();

// Auto-initialize when module loads (ES modules are deferred, DOM is ready)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ScrollReveal.init());
} else {
  ScrollReveal.init();
}

// Expose globally for script.js
window.ScrollReveal = ScrollReveal;

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollReveal;
}