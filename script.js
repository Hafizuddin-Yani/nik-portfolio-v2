/**
 * Cybersecurity Portfolio - Main JavaScript
 * Vanilla ES6+ with no external dependencies
 */

'use strict';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Throttle & Debounce
const throttle = (fn, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
const State = {
  theme: 'dark',
  scrollY: 0,
  lastScrollY: 0,
  cursor: { x: 0, y: 0, targetX: 0, targetY: 0, hidden: false },
  terminal: { open: false, history: [], historyIndex: -1 },
  modals: { active: null },
  particles: [],
  matrix: { columns: [], chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?' },
  skillsAnimated: false,
  countersAnimated: false,
};

// ============================================================================
// THEME MANAGEMENT
// ============================================================================
const Theme = {
  init() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.set(saved || (prefersDark ? 'dark' : 'light'));

    $('#theme-toggle').addEventListener('click', () => this.toggle());
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) this.set(e.matches ? 'dark' : 'light');
    });
  },

  set(theme) {
    State.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    $('#theme-toggle').setAttribute('aria-pressed', theme === 'dark');
  },

  toggle() { this.set(State.theme === 'dark' ? 'light' : 'dark'); }
};

// ============================================================================
// CUSTOM CURSOR
// ============================================================================
const Cursor = {
  el: null,
  dot: null,
  ring: null,
  text: null,
  rafId: null,

  init() {
    if (prefersReducedMotion()) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    this.el = $('#custom-cursor');
    this.dot = this.el.querySelector('.cursor-dot');
    this.ring = this.el.querySelector('.cursor-ring');
    this.text = this.el.querySelector('.cursor-text');

    document.addEventListener('mousemove', this.onMove.bind(this), { passive: true });
    document.addEventListener('mousedown', () => this.el.classList.add('click'));
    document.addEventListener('mouseup', () => this.el.classList.remove('click'));
    document.addEventListener('mouseleave', () => this.el.classList.add('hide'));
    document.addEventListener('mouseenter', () => this.el.classList.remove('hide'));

    // Pause on blur/visibility change
    window.addEventListener('blur', () => this.pause());
    window.addEventListener('focus', () => this.resume());
    document.addEventListener('visibilitychange', () => {
      document.hidden ? this.pause() : this.resume();
    });

    // Hover detection
    $$('a, button, .btn, .project-card, .skill-card, .cert-card, .timeline-content, .education-card, .highlight-card, .social-link, .nav-link').forEach(el => {
      el.addEventListener('mouseenter', () => this.setHover(true, el));
      el.addEventListener('mouseleave', () => this.setHover(false));
    });

    this.animate();
  },

  onMove(e) {
    State.cursor.targetX = e.clientX;
    State.cursor.targetY = e.clientY;
  },

  setHover(hover, el) {
    this.el.classList.toggle('hover', hover);
    if (hover && el) {
      const text = el.dataset.cursor || el.getAttribute('aria-label') || '';
      if (text) this.text.textContent = text;
    }
  },

  animate() {
    if (State.cursor.hidden) return;

    State.cursor.x = lerp(State.cursor.x, State.cursor.targetX, 0.2);
    State.cursor.y = lerp(State.cursor.y, State.cursor.targetY, 0.2);

    this.dot.style.transform = `translate(${State.cursor.x}px, ${State.cursor.y}px) translate(-50%, -50%)`;
    this.ring.style.transform = `translate(${State.cursor.x}px, ${State.cursor.y}px) translate(-50%, -50%)`;

    this.rafId = requestAnimationFrame(this.animate.bind(this));
  },

  pause() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  },

  resume() {
    if (!this.rafId) {
      this.animate();
    }
  }
};

// ============================================================================
// PARTICLE BACKGROUND
// ============================================================================
const Particles = {
  canvas: null,
  ctx: null,
  particles: [],
  config: { count: 60, maxDist: 140, speed: 0.3 },
  rafId: null,
  prefersReducedMotion: false,

  init() {
    this.prefersReducedMotion = prefersReducedMotion();
    if (this.prefersReducedMotion) return;
    this.canvas = $('#canvas-particles');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.createParticles();
    window.addEventListener('resize', debounce(this.resize.bind(this), 250));
    window.addEventListener('blur', () => this.pause());
    window.addEventListener('focus', () => this.resume());
    document.addEventListener('visibilitychange', () => {
      document.hidden ? this.pause() : this.resume();
    });
    this.animate();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.count; i++) {
      this.particles.push({
        x: rand(0, this.canvas.width),
        y: rand(0, this.canvas.height),
        vx: rand(-this.config.speed, this.config.speed),
        vy: rand(-this.config.speed, this.config.speed),
        radius: rand(1, 2.5),
        opacity: rand(0.1, 0.5),
        hue: Math.random() > 0.5 ? 195 : 150
      });
    }
  },

  animate() {
    if (this.prefersReducedMotion) return;
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    ctx.clearRect(0, 0, width, height);

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${p.opacity})`;
      ctx.fill();
    });

    this.drawConnections();
    this.rafId = requestAnimationFrame(this.animate.bind(this));
  },

  drawConnections() {
    const ctx = this.ctx;
    const { particles, config } = this;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < config.maxDist) {
          const opacity = (1 - dist / config.maxDist) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `hsla(195, 100%, 50%, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  },

  pause() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  },

  resume() {
    if (!this.rafId && !this.prefersReducedMotion) {
      this.animate();
    }
  }
};

// ============================================================================
// MATRIX RAIN EFFECT
// ============================================================================
const MatrixRain = {
  canvas: null,
  ctx: null,
  columns: [],
  fontSize: 14,
  chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?',
  rafId: null,
  prefersReducedMotion: false,

  init() {
    this.prefersReducedMotion = prefersReducedMotion();
    if (this.prefersReducedMotion) return;
    this.canvas = $('#canvas-matrix');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.initColumns();
    window.addEventListener('resize', debounce(this.resize.bind(this), 250));
    window.addEventListener('blur', () => this.pause());
    window.addEventListener('focus', () => this.resume());
    document.addEventListener('visibilitychange', () => {
      document.hidden ? this.pause() : this.resume();
    });
    this.animate();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.initColumns();
  },

  initColumns() {
    this.columns = [];
    const colCount = Math.floor(this.canvas.width / this.fontSize);
    for (let i = 0; i < colCount; i++) {
      this.columns[i] = {
        y: rand(-this.canvas.height, 0),
        speed: rand(0.5, 2),
        opacity: rand(0.02, 0.08),
        chars: []
      };
      for (let j = 0; j < 20; j++) {
        this.columns[i].chars[j] = this.chars[randInt(0, this.chars.length - 1)];
      }
    }
  },

  animate() {
    if (this.prefersReducedMotion) return;
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    // Fade effect
    ctx.fillStyle = 'rgba(10, 14, 23, 0.08)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${this.fontSize}px 'JetBrains Mono', monospace`;
    ctx.textBaseline = 'top';

    this.columns.forEach((col, i) => {
      const x = i * this.fontSize;

      col.chars.forEach((char, j) => {
        const y = col.y + j * this.fontSize;
        if (y > height) return;

        const alpha = col.opacity * (1 - j / col.chars.length);
        const isHead = j === 0;
        ctx.fillStyle = isHead ? `rgba(0, 212, 255, ${alpha * 5})` : `rgba(0, 255, 136, ${alpha})`;
        ctx.fillText(char, x, y);
      });

      col.y += col.speed;

      if (col.y > height + 200) {
        col.y = rand(-200, 0);
        col.speed = rand(0.5, 2);
        col.opacity = rand(0.02, 0.08);
      }
    });

    this.rafId = requestAnimationFrame(this.animate.bind(this));
  },

  pause() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  },

  resume() {
    if (!this.rafId && !this.prefersReducedMotion) {
      this.animate();
    }
  }
};

// ============================================================================
// SCROLL PROGRESS
// ============================================================================
const ScrollProgress = {
  el: null,

  init() {
    this.el = $('#scroll-progress');
    window.addEventListener('scroll', throttle(this.update.bind(this), 16), { passive: true });
  },

  update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    this.el.value = progress;
  }
};

// ============================================================================
// NAVIGATION
// ============================================================================
const Navigation = {
  navbar: null,
  menu: null,
  toggle: null,
  links: [],

  init() {
    this.navbar = $('.navbar');
    this.menu = $('.nav-center');
    this.toggle = $('.nav-toggle');
    this.links = $$('.nav-link');

    this.toggle.addEventListener('click', this.toggleMenu.bind(this));
    this.links.forEach(link => link.addEventListener('click', this.closeMenu.bind(this)));

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.navbar.contains(e.target)) this.closeMenu();
    });

    // Scroll hide/show
    let lastScroll = 0;
    window.addEventListener('scroll', throttle(() => {
      const current = window.scrollY;
      if (current > lastScroll && current > 100) {
        this.navbar.classList.add('hidden');
      } else {
        this.navbar.classList.remove('hidden');
      }
      this.navbar.classList.toggle('scrolled', current > 20);
      lastScroll = current;
    }, 16), { passive: true });

    // Active link highlighting
    this.observeSections();
  },

  toggleMenu() {
    const open = this.menu.classList.toggle('open');
    this.toggle.classList.toggle('active');
    this.toggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  },

  closeMenu() {
    this.menu.classList.remove('open');
    this.toggle.classList.remove('active');
    this.toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  },

  observeSections() {
    const sections = $$('section[id]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          this.links.forEach(link => {
            link.classList.toggle('active', link.dataset.section === id);
          });
        }
      });
    }, { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 });

    sections.forEach(s => observer.observe(s));
  }
};

// ============================================================================
// SMOOTH SCROLL
// ============================================================================
const SmoothScroll = {
  init() {
    $$('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offset = 80;
          const targetPos = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: targetPos, behavior: 'smooth' });
          // Update URL hash without jumping
          window.history.pushState(null, '', href);
        }
      });
    });
  }
};

// ============================================================================
// TYPING ANIMATIONS
// ============================================================================
const TypingAnimations = {
  greetings: [
    'Hello, world!',
    'Welcome to my portfolio',
    'Initializing secure connection...',
    'Access granted. Loading...',
    'Ready to deploy.'
  ],
  roles: [
    'Cybersecurity & IT Professional',
    'System Engineer',
    'Secure Mobile Developer',
    'SOC Analyst (Aspiring)',
    'Cloud Infrastructure Enthusiast'
  ],

  greetingIndex: 0,
  greetingCharIndex: 0,
  greetingDeleting: false,

  roleIndex: 0,
  roleCharIndex: 0,
  roleDeleting: false,

  init() {
    this.typeGreeting();
    this.typeRole();
  },

  typeGreeting() {
    const el = $('.typing-greeting');
    if (!el) return;

    const text = this.greetings[this.greetingIndex];
    const speed = this.greetingDeleting ? 30 : 80;

    if (this.greetingDeleting) {
      el.textContent = text.substring(0, this.greetingCharIndex - 1);
      this.greetingCharIndex--;
    } else {
      el.textContent = text.substring(0, this.greetingCharIndex + 1);
      this.greetingCharIndex++;
    }

    let delay = speed;

    if (!this.greetingDeleting && this.greetingCharIndex === text.length) {
      delay = 2000;
      this.greetingDeleting = true;
    } else if (this.greetingDeleting && this.greetingCharIndex === 0) {
      this.greetingDeleting = false;
      this.greetingIndex = (this.greetingIndex + 1) % this.greetings.length;
      delay = 500;
    }

    setTimeout(() => this.typeGreeting(), delay);
  },

  typeRole() {
    const el = $('#role-text');
    if (!el) return;

    const text = this.roles[this.roleIndex];
    const speed = this.roleDeleting ? 25 : 60;

    if (this.roleDeleting) {
      el.textContent = text.substring(0, this.roleCharIndex - 1);
      this.roleCharIndex--;
    } else {
      el.textContent = text.substring(0, this.roleCharIndex + 1);
      this.roleCharIndex++;
    }

    let delay = speed;

    if (!this.roleDeleting && this.roleCharIndex === text.length) {
      delay = 2500;
      this.roleDeleting = true;
    } else if (this.roleDeleting && this.roleCharIndex === 0) {
      this.roleDeleting = false;
      this.roleIndex = (this.roleIndex + 1) % this.roles.length;
      delay = 500;
    }

    setTimeout(() => this.typeRole(), delay);
  }
};

// ============================================================================
// COUNTER ANIMATION
// ============================================================================
const CounterAnimation = {
  init() {
    const counters = $$('.metric-value[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !State.countersAnimated) {
          this.animateCounters(counters);
          State.countersAnimated = true;
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });

    const heroVisual = $('.hero-visual');
    if (heroVisual) observer.observe(heroVisual);
  },

  animateCounters(counters) {
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.count, 10);
      const duration = 2000;
      const start = performance.now();

      const animate = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const current = Math.floor(eased * target);
        counter.textContent = current.toLocaleString();
        if (progress < 1) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }
};

// ============================================================================
// SKILL RADAR CHART
// ============================================================================
const SkillRadar = {
  canvas: null,
  ctx: null,
  skills: [
    { name: 'Languages', value: 85, color: '#00d4ff' },
    { name: 'Offensive Security', value: 75, color: '#ff4466' },
    { name: 'Network & Vuln Analysis', value: 80, color: '#00d4ff' },
    { name: 'SIEM & Monitoring', value: 70, color: '#00ff88' },
    { name: 'Hardware & IT Ops', value: 90, color: '#ffb800' },
    { name: 'Dev Tools & Workflows', value: 85, color: '#00d4ff' },
    { name: 'Operating Systems', value: 80, color: '#00ff88' }
  ],

  init() {
    this.canvas = $('#skill-radar');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.draw();
    this.createLegend();
    window.addEventListener('resize', debounce(this.draw.bind(this), 250));
  },

  draw() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    const levels = 5;

    ctx.clearRect(0, 0, width, height);

    // Grid circles
    for (let i = 1; i <= levels; i++) {
      const r = (radius / levels) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Axis lines
    const angleStep = (Math.PI * 2) / this.skills.length;
    this.skills.forEach((_, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Skill polygon
    ctx.beginPath();
    this.skills.forEach((skill, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = radius * (skill.value / 100);
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // Gradient fill
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Stroke
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Data points
    this.skills.forEach((skill, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = radius * (skill.value / 100);
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = skill.color;
      ctx.fill();
      ctx.strokeStyle = '#0a0e17';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Labels
    ctx.font = '12px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#8892a4';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    this.skills.forEach((skill, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const labelRadius = radius + 28;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;

      // Adjust alignment
      let align = 'center';
      let baseline = 'middle';
      if (angle < -Math.PI / 2 || angle > Math.PI / 2) align = 'right';
      if (angle > 0 && angle < Math.PI) baseline = 'top';
      if (angle < 0 && angle > -Math.PI) baseline = 'bottom';

      ctx.textAlign = align;
      ctx.textBaseline = baseline;
      ctx.fillText(skill.name, x, y);
    });
  },

  createLegend() {
    const container = $('#radar-legend');
    if (!container) return;

    container.innerHTML = this.skills.map(skill => `
      <div class="radar-legend-item">
        <span class="radar-legend-color" style="background: ${skill.color}"></span>
        <span>${skill.name}</span>
      </div>
    `).join('');
  }
};

// ============================================================================
// SKILL BARS ANIMATION
// ============================================================================
const SkillBars = {
  data: {
    languages: [
      { name: 'Dart/Flutter', percent: 90 },
      { name: 'Python', percent: 85 },
      { name: 'C++', percent: 75 },
      { name: 'HTML/CSS', percent: 90 },
      { name: 'Java', percent: 70 },
      { name: 'Bash/PowerShell', percent: 80 },
      { name: 'PHP', percent: 65 }
    ],
    security: [
      { name: 'Metasploit', percent: 75 },
      { name: 'Nmap', percent: 85 },
      { name: 'Burp Suite', percent: 80 },
      { name: 'OWASP ZAP', percent: 75 },
      { name: 'Maltego', percent: 70 },
      { name: 'MITRE ATT&CK', percent: 80 }
    ],
    network: [
      { name: 'Wireshark', percent: 85 },
      { name: 'Nessus', percent: 75 },
      { name: 'tcpdump', percent: 80 },
      { name: 'Cisco IOS', percent: 80 },
      { name: 'Firewall Config', percent: 75 }
    ],
    siem: [
      { name: 'Wazuh', percent: 80 },
      { name: 'ELK Stack', percent: 75 },
      { name: 'Log Analysis', percent: 85 },
      { name: 'Incident Triage', percent: 75 }
    ],
    hardware: [
      { name: 'PC/Laptop Assembly', percent: 95 },
      { name: 'Component Diagnostics', percent: 90 },
      { name: 'BIOS/UEFI Optimization', percent: 85 }
    ],
    devtools: [
      { name: 'Git', percent: 90 },
      { name: 'VS Code', percent: 95 },
      { name: 'Flutter SDK', percent: 85 },
      { name: 'Firebase', percent: 80 },
      { name: 'AI-Assisted Workflows', percent: 85 }
    ],
    os: [
      { name: 'Linux (Kali, Ubuntu, RHEL)', percent: 90 },
      { name: 'Windows Server', percent: 80 },
      { name: 'macOS', percent: 75 }
    ]
  },

  init() {
    Object.entries(this.data).forEach(([key, skills]) => {
      const container = $(`#skills-${key}`);
      if (!container) return;

      container.innerHTML = skills.map(skill => `
        <div class="skill-bar">
          <div class="skill-bar-header">
            <span class="skill-name">${skill.name}</span>
            <span class="skill-percent">${skill.percent}%</span>
          </div>
          <div class="skill-track">
            <div class="skill-fill" style="width: 0%" data-width="${skill.percent}%"></div>
          </div>
        </div>
      `).join('');
    });

    // Animate on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateBars(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    $$('.skill-category').forEach(cat => observer.observe(cat));
  },

  animateBars(category) {
    $$('.skill-fill', category).forEach((fill, i) => {
      setTimeout(() => {
        fill.style.width = fill.dataset.width;
      }, i * 100);
    });
  }
};

// ============================================================================
// PROJECT MODALS
// ============================================================================
const ProjectModals = {
  modal: null,
  content: null,
  closeBtn: null,
  backdrop: null,
  currentProject: null,
  lastFocusedElement: null,

  projects: {
    'secure-messaging': {
      title: 'Secure Mobile Messaging (E2EE)',
      type: 'Security / Mobile Application',
      period: 'Oct 2025 – Jan 2026',
      tech: ['Flutter', 'Dart', 'X25519', 'ChaCha20-Poly1305', 'Firebase', 'Android Keystore', 'iOS Keychain'],
      description: `Architected a cross-platform secure messaging application with a formal threat model focused on mitigating Man-in-the-Middle (MitM) and replay attacks. The application implements a hybrid End-to-End Encryption (E2EE) protocol combining X25519 (Elliptic Curve Diffie-Hellman) for secure key exchange and ChaCha20-Poly1305 (AEAD) for high-performance authenticated encryption.`,
      highlights: [
        'Forward secrecy via ephemeral key rotation per session',
        'Message integrity verification using Poly1305 authentication tags',
        'Secure local key storage leveraging Android Keystore & iOS Keychain',
        'Replay attack prevention via monotonic message sequencing',
        'Zero-knowledge architecture: server cannot decrypt messages',
        'Offline-first design with encrypted local database (SQLCipher)'
      ],
      github: 'https://github.com/Hafizuddin-Yani',
      demo: null
    },
    'security-lab': {
      title: 'Home Security Lab Environment',
      type: 'Security Lab / SIEM',
      period: '2025 – Present',
      tech: ['VirtualBox', 'Kali Linux', 'Wazuh', 'ELK Stack', 'MITRE ATT&CK', 'Docker', 'Sysmon'],
      description: `Built a fully virtualized security lab to simulate real-world attack and defense scenarios. The environment includes network reconnaissance, vulnerability scanning, and log-based threat detection capabilities. Configured Wazuh SIEM for centralized log ingestion from multiple agents with custom detection rules aligned to MITRE ATT&CK framework techniques.`,
      highlights: [
        'Custom detection rules for T1059 (Command Scripting), T1078 (Valid Accounts), T1003 (Credential Dumping), T1566 (Phishing)',
        'Multi-agent deployment: Windows + Linux endpoints forwarding to Wazuh manager',
        'ELK Stack integration for advanced log visualization & dashboarding',
        'Automated alerting via webhook integrations (Slack, Email)',
        'Attack simulation: Atomic Red Team, Caldera, custom scripts',
        'Blue team practice: log analysis, threat hunting, incident response playbooks'
      ],
      github: 'https://github.com/Hafizuddin-Yani',
      demo: null
    },
    'iot-water': {
      title: 'IoT Water Level Detection System',
      type: 'IoT / Embedded Systems',
      period: '2022',
      tech: ['Arduino', 'C++', 'Firebase Realtime Database', 'Ultrasonic Sensor (HC-SR04)', 'ESP8266'],
      description: `Developed a real-time flood early-warning monitoring system utilizing Arduino microcontrollers and ultrasonic sensors for water level detection. Integrated Firebase Realtime Database to synchronize telemetry data instantly, enabling remote threshold alerts with sub-second latency. The system won Gold Medal at the PIP Learning Innovation Competition for the BOARDPi-KIT IoT STEM Framework.`,
      highlights: [
        'Real-time water level monitoring with 1cm precision',
        'Configurable alert thresholds via mobile dashboard',
        'Historical data logging & trend visualization',
        'Low-power design for battery-operated deployment',
        'Multi-sensor support for distributed monitoring',
        'Gold Medal - PIP Learning Innovation Competition (BOARDPi-KIT)'
      ],
      github: 'https://github.com/Hafizuddin-Yani',
      demo: null
    }
  },

  init() {
    this.modal = $('#project-modal');
    this.content = $('#modal-content');
    this.closeBtn = this.modal.querySelector('.modal-close');
    this.backdrop = this.modal.querySelector('.modal-backdrop');

    $$('[data-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open(btn.dataset.modal);
      });
    });

    this.closeBtn.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('open')) this.close();
    });
  },

  open(projectId) {
    const project = this.projects[projectId];
    if (!project) return;

    this.currentProject = projectId;
    this.lastFocusedElement = document.activeElement;
    this.content.innerHTML = this.render(project);
    this.modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.content.focus();
  },

  close() {
    this.modal.classList.remove('open');
    document.body.style.overflow = '';
    this.currentProject = null;
    this.lastFocusedElement?.focus?.();
    this.lastFocusedElement = null;
  },

  render(p) {
    const links = [
      p.github ? `
        <a href="${p.github}" class="modal-link secondary" target="_blank" rel="noopener noreferrer">
          <i class="fab fa-github" aria-hidden="true"></i> GitHub Profile
        </a>` : '',
      p.demo ? `
        <a href="${p.demo}" class="modal-link primary" target="_blank" rel="noopener noreferrer">
          <i class="fas fa-external-link-alt" aria-hidden="true"></i> Live Demo
        </a>` : ''
    ].join('');

    return `
      <header class="modal-header">
        <div class="modal-meta">
          <span class="modal-type">${p.type}</span>
          <span class="modal-date">${p.period}</span>
        </div>
        <h2 id="modal-title" class="modal-title">${p.title}</h2>
      </header>
      <div class="modal-body">
        <section class="modal-section">
          <h3>Technologies</h3>
          <div class="modal-tech-grid">
            ${p.tech.map(t => `<span class="modal-tech-item">${t}</span>`).join('')}
          </div>
        </section>
        <section class="modal-section">
          <h3>Overview</h3>
          <p class="modal-desc">${p.description}</p>
        </section>
        <section class="modal-section">
          <h3>Key Achievements</h3>
          <ul class="modal-highlights">
            ${p.highlights.map(h => `<li>${h}</li>`).join('')}
          </ul>
        </section>
        ${links ? `<div class="modal-links">${links}</div>` : ''}
      </div>
    `;
  }
};

// ============================================================================
// CERTIFICATIONS CAROUSEL
// ============================================================================
// CERTIFICATIONS SCROLL (drag to scroll)
// ============================================================================
const CertScroll = {
  track: null,
  isDragging: false,
  startX: 0,
  scrollLeft: 0,

  init() {
    this.track = $('#certs-track');
    if (!this.track) return;

    // Mouse drag
    this.track.addEventListener('mousedown', this.onDragStart.bind(this));
    this.track.addEventListener('mousemove', this.onDragMove.bind(this));
    this.track.addEventListener('mouseup', this.onDragEnd.bind(this));
    this.track.addEventListener('mouseleave', this.onDragEnd.bind(this));

    // Touch drag
    this.track.addEventListener('touchstart', this.onDragStart.bind(this), { passive: true });
    this.track.addEventListener('touchmove', this.onDragMove.bind(this), { passive: true });
    this.track.addEventListener('touchend', this.onDragEnd.bind(this));

    // Click on cards (prevent navigation during drag)
    this.track.addEventListener('click', (e) => {
      if (this.isDragging) e.preventDefault();
    }, true);
  },

  onDragStart(e) {
    if (e.type === 'mousedown' && e.button !== 0) return;
    this.isDragging = true;
    this.track.classList.add('dragging');
    this.startX = (e.touches ? e.touches[0] : e).clientX;
    this.scrollLeft = this.track.scrollLeft;
    e.preventDefault();
  },

  onDragMove(e) {
    if (!this.isDragging) return;
    const x = (e.touches ? e.touches[0] : e).clientX;
    const walk = (x - this.startX) * 1.5; // scroll speed multiplier
    this.track.scrollLeft = this.scrollLeft - walk;
  },

  onDragEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.track.classList.remove('dragging');
  }
};

// Expose globally for script.js init
window.CertScroll = CertScroll;

// ============================================================================
// TERMINAL EASTER EGG
// ============================================================================
const Terminal = {
  overlay: null,
  body: null,
  input: null,
  toggleBtn: null,
  closeBtn: null,
  history: [],
  historyIndex: -1,
  cwd: '~',

  commands: {
    help: { desc: 'Show available commands', fn: () => this.showHelp() },
    whoami: { desc: 'Display user info', fn: () => this.print('nik@portfolio:~$ Cybersecurity & IT Professional | System Engineer | Secure Mobile Dev') },
    skills: { desc: 'List technical skills', fn: () => this.showSkills() },
    projects: { desc: 'Show projects', fn: () => this.showProjects() },
    contact: { desc: 'Contact information', fn: () => this.showContact() },
    clear: { desc: 'Clear terminal', fn: () => this.clear() },
    echo: { desc: 'Echo arguments', fn: (args) => this.print(args.join(' ')) },
    date: { desc: 'Show current date', fn: () => this.print(new Date().toString()) },
    ls: { desc: 'List directory', fn: () => this.print('about/  skills/  projects/  experience/  education/  certifications/  contact/') },
    cd: { desc: 'Change directory', fn: (args) => { this.cwd = args[0] || '~'; this.print(`Changed to ${this.cwd}`); } },
    pwd: { desc: 'Print working directory', fn: () => this.print(this.cwd) },
    sudo: { desc: 'Attempt privilege escalation', fn: () => this.print('Nice try. Incident logged. 🔒') },
    hack: { desc: 'Hack the planet', fn: () => this.print('ACCESS DENIED. This portfolio is protected by E2EE. 🛡️') },
    matrix: { desc: 'Toggle matrix rain', fn: () => { MatrixRain.canvas.style.opacity = MatrixRain.canvas.style.opacity === '0' ? '1' : '0'; this.print('Matrix rain toggled'); } },
    theme: { desc: 'Toggle theme', fn: () => { Theme.toggle(); this.print(`Theme switched to ${State.theme}`); } },
    resume: { desc: 'Download CV', fn: () => { this.print('Preparing CV download...'); setTimeout(() => downloadCV(), 500); } }
  },

  init() {
    this.overlay = $('#terminal-overlay');
    this.body = $('#terminal-body');
    this.input = $('#terminal-input');
    this.toggleBtn = $('#terminal-toggle');
    this.closeBtn = this.overlay.querySelector('.terminal-close');
    this.focusableElements = null;
    this.firstFocusable = null;
    this.lastFocusable = null;

    this.toggleBtn.addEventListener('click', () => this.open());
    this.closeBtn.addEventListener('click', () => this.close());
    this.overlay.querySelector('.modal-backdrop')?.addEventListener('click', () => this.close());

    this.input.addEventListener('keydown', this.handleInput.bind(this));
    this.overlay.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault();
        this.toggle();
      }
    });
  },

  toggle() { this.overlay.classList.contains('open') ? this.close() : this.open(); },
  open() {
    this.overlay.classList.add('open');
    this.toggleBtn.setAttribute('aria-expanded', 'true');
    this.setupFocusTrap();
    this.input.focus();
    this.print('Welcome to nik@portfolio terminal. Type "help" for commands.');
  },

  close() {
    this.overlay.classList.remove('open');
    this.toggleBtn.setAttribute('aria-expanded', 'false');
    this.input.blur();
    this.removeFocusTrap();
  },

  setupFocusTrap() {
    this.focusableElements = this.overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
    this.firstFocusable?.focus();
  },

  removeFocusTrap() {
    this.focusableElements = null;
    this.firstFocusable = null;
    this.lastFocusable = null;
  },

  handleKeyDown(e) {
    if (!this.overlay.classList.contains('open')) return;
    
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === this.firstFocusable) {
          e.preventDefault();
          this.lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === this.lastFocusable) {
          e.preventDefault();
          this.firstFocusable?.focus();
        }
      }
    }
  },

  handleInput(e) {
    if (e.key === 'Enter') {
      const cmd = this.input.value.trim();
      this.input.value = '';
      if (cmd) this.execute(cmd);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.input.value = this.history[this.history.length - 1 - this.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.input.value = this.history[this.history.length - 1 - this.historyIndex];
      } else {
        this.historyIndex = -1;
        this.input.value = '';
      }
    }
  },

  execute(cmd) {
    this.history.unshift(cmd);
    this.historyIndex = -1;
    this.print(`nik@portfolio:${this.cwd}$ ${cmd}`, 'cmd');

    const [name, ...args] = cmd.split(' ');
    const command = this.commands[name.toLowerCase()];

    if (command) {
      try { command.fn(args); }
      catch (err) { this.print(`Error: ${err.message}`, 'error'); }
    } else {
      this.print(`Command not found: ${name}. Type "help" for available commands.`, 'error');
    }
  },

  print(text, className = 'out') {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.textContent = text;
    this.body.insertBefore(line, this.body.querySelector('.terminal-line:last-of-type'));
    this.body.scrollTop = this.body.scrollHeight;
  },

  clear() {
    $$('.terminal-line:not(:last-of-type)', this.body).forEach(el => el.remove());
  },

  showHelp() {
    this.print('Available commands:', 'cmd');
    Object.entries(this.commands).forEach(([name, cmd]) => {
      this.print(`  ${name.padEnd(12)} ${cmd.desc}`);
    });
  },

  showSkills() {
    this.print('Technical Skills:', 'cmd');
    Object.entries(SkillBars.data).forEach(([cat, skills]) => {
      this.print(`  ${cat}:`);
      skills.forEach(s => this.print(`    ${s.name} - ${s.percent}%`));
    });
  },

  showProjects() {
    this.print('Projects:', 'cmd');
    Object.values(ProjectModals.projects).forEach(p => {
      this.print(`  ${p.title} (${p.type})`);
    });
  },

  showContact() {
    this.print('Contact:', 'cmd');
    this.print('  Email: hafizuddinyani@gmail.com');
    this.print('  Phone: +6011-1990 3157');
    this.print('  LinkedIn: linkedin.com/in/nik-hafizuddin-yani');
    this.print('  GitHub: github.com/Hafizuddin-Yani');
  }
};

// ============================================================================
// DOWNLOAD CV
// ============================================================================
function downloadCV() {
  // Generate a simple PDF-like content or redirect to actual CV
  const content = `Nik Hafizuddin Bin N Ahmad Yani
Cybersecurity & IT Professional
Kuala Lumpur, Malaysia | hafizuddinyani@gmail.com | +6011-1990 3157
LinkedIn: linkedin.com/in/nik-hafizuddin-yani | GitHub: github.com/Hafizuddin-Yani

CAREER PROFILE
Cybersecurity and Information Technology graduate (B.Sc. Hons) with hands-on experience in system engineering, secure mobile development, and network infrastructure. Proven ability to execute enterprise-scale IT operations, including complex hardware migrations across 500+ endpoints for national utility providers. Certified in Red Hat (RH124) and Cisco (CCNA), with practical knowledge of vulnerability assessment, cryptographic protocols, and incident response methodologies.

TECHNICAL SKILLS
Languages: Dart, Python, C++, HTML/CSS, PHP, Java, Bash, PowerShell
Offensive Security: Metasploit, Nmap, Burp Suite, OWASP ZAP, Maltego, MITRE ATT&CK
Network & Vulnerability: Wireshark, Nessus, tcpdump, Cisco IOS, Firewall Configuration
SIEM & Monitoring: Wazuh, ELK Stack, Log Analysis, Incident Triage
Hardware & IT Ops: PC/Laptop Assembly, Component Diagnostics, BIOS/UEFI Optimization
Dev Tools: Git, VS Code, Flutter SDK, Firebase, AI-Assisted Development
OS: Linux (Kali, Ubuntu, Red Hat), Windows Server, macOS

EXPERIENCE
System Engineer Intern (PMO) | Beyond2u Sdn Bhd | Mar 2026 – Jun 2026
- Enterprise hardware refresh & data migration for TNB & MOE (500+ endpoints)
- Automated backups with Robocopy scripting (zero data loss, 30% faster)
- Tier-2 support, reduced resolution time & operational downtime

Software Engineer Intern | PKINK | Feb 2023 – Jun 2023
- Maintained corporate databases & legacy systems, resolved 15+ bugs
- Full SDLC collaboration: testing, deployment, documentation

IT Technician & Tech Advisor | Monaliza | Sep 2019 – Dec 2019
- Hardware diagnostics, custom PC builds, BIOS optimization for 100+ clients

PROJECTS
1. Secure Mobile Messaging (E2EE) | Flutter, Dart, Cryptography
   - X25519 key exchange + ChaCha20-Poly1305 AEAD
   - Forward secrecy, secure key storage, replay attack prevention

2. Home Security Lab | VirtualBox, Kali, Wazuh, ELK Stack
   - MITRE ATT&CK aligned detection rules (T1059, T1078, etc.)
   - Centralized log ingestion, automated alerting

3. IoT Water Level Detection | Arduino, Firebase, C++
   - Real-time flood early-warning, sub-second Firebase sync
   - Gold Medal - PIP Learning Innovation Competition

EDUCATION
B.Sc. (Hons) Computer System Security | UniKL MIIT | 2026
Diploma in IT (CGPA 3.57) | UniKL MIIT | 2024
Certificate in IT (CGPA 3.78) | Kolej Komuniti Gerik | 2020

CERTIFICATIONS
- Red Hat System Administration I (RH124)
- Cisco CCNA: Introduction to Networks
- CompTIA Security+ (In Progress)
- Gold Medal - PIP Learning Innovation (BOARDPi-KIT)
- President, Student Representative Council`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Nik_Hafizuddin_Yani_CV.txt';
  a.click();
  URL.revokeObjectURL(url);

  showToast('CV downloaded as text file', 'success');
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================
function showToast(message, type = 'success') {
  let toast = $('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas"></i><span class="toast-text"></span>`;
    document.body.appendChild(toast);
  }

  toast.className = `toast ${type} show`;
  toast.querySelector('i').className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
  toast.querySelector('.toast-text').textContent = message;

  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================================
// DOWNLOAD CV BUTTON
// ==================================$('#download-cv')?.addEventListener('click', downloadCV);

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize in sequence for proper layering
  await initSequence();

  // Download CV button
  $('#download-cv')?.addEventListener('click', downloadCV);

  // Console easter egg
  console.log(
    '%c Nik Hafizuddin Yani %c Portfolio v2.0 ',
    'background:#00d4ff;color:#0a0e17;font-weight:bold;padding:4px 8px;border-radius:4px 0 0 4px;font-family:monospace;',
    'background:#0a0e17;color:#00d4ff;padding:4px 8px;border-radius:0 4px 4px 0;font-family:monospace;border:1px solid #00d4ff;'
  );
  console.log('%c Type help() in the terminal (Ctrl+` or click terminal icon) ', 'color:#8892a4;font-style:italic;');
  console.log('%c Built with vanilla JS, CSS variables & ❤️ from Kuala Lumpur ', 'color:#8892a4;font-style:italic;');
});

async function initSequence() {
  // Phase 1: Boot sequence (runs its own preloader)
  // BootSequence module auto-initializes on DOMContentLoaded
  // Wait for boot to complete
  if (document.body.classList.contains('boot-complete')) {
    // Already complete
  } else {
    await new Promise(resolve => {
      if (document.body.classList.contains('boot-complete')) {
        resolve();
      } else {
        document.addEventListener('boot:complete', resolve, { once: true });
        // Fallback timeout
        setTimeout(resolve, 3000);
      }
    });
  }

  // Phase 2: Core systems (parallel)
  Theme.init();
  Cursor.init();
  Particles.init();
  MatrixRain.init();
  ScrollProgress.init();
  Navigation.init();
  SmoothScroll.init();
  TypingAnimations.init();
  CounterAnimation.init();

  // Initialize Lenis smooth scroll
  if (typeof Lenis !== 'undefined') {
    window.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false
    });
    window.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      window.lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  // Initialize Prism syntax highlighting
  if (typeof Prism !== 'undefined') {
    Prism.highlightAll();
  }

  // Phase 3: Scroll-triggered animations (need GSAP)
  // ScrollReveal, HeroAnimations, MagneticUI, TextFX auto-initialize via ES modules
  SkillRadar.init();
  SkillBars.init();

  // Phase 4: Interactive modules
  ProjectModals.init();
  if (window.CertScroll) {
    window.CertScroll.init();
  }
  Terminal.init();

  // Refresh ScrollTrigger after all content is ready
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.refresh();
  }
}

// Expose some functions globally for terminal
window.downloadCV = downloadCV;
window.showToast = showToast;

// Performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perf = performance.getEntriesByType('navigation')[0];
      console.log(`%c Page load: ${perf.loadEventEnd - perf.startTime}ms `, 'color:#00ff88;font-family:monospace;');
    }, 0);
  });
}
