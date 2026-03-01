/* ═══════════════════════════════════════════════════════════════════════════
   Deep Blog — Main JavaScript
   Navigation, scroll animations, hero canvas, utilities
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── Navigation ─────────────────────────────────────────────────────── */
  const navbar = document.getElementById("navbar");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => navLinks.classList.remove("open"));
    });
  }

  window.addEventListener("scroll", () => {
    if (navbar) {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    }
  });

  /* ── Scroll Progress Bar ────────────────────────────────────────────── */
  const scrollProgress = document.getElementById("scrollProgress");
  if (scrollProgress) {
    window.addEventListener("scroll", () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      scrollProgress.style.width = progress + "%";
    });
  }

  /* ── Scroll Reveal Animations ───────────────────────────────────────── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  /* ── Blog Article Content Animation ─────────────────────────────────── */
  const articleObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animationDelay =
            (Array.from(entry.target.parentElement.children).indexOf(entry.target) % 5) * 0.08 + "s";
          entry.target.style.animationPlayState = "running";
        }
      });
    },
    { threshold: 0.05 }
  );

  document.querySelectorAll(".blog-article .container-narrow > *").forEach((el) => {
    el.style.animationPlayState = "paused";
    articleObserver.observe(el);
  });

  /* ── Table of Contents Active State ─────────────────────────────────── */
  const tocLinks = document.querySelectorAll(".toc a");
  if (tocLinks.length > 0) {
    const sections = [];
    tocLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href) {
        const target = document.querySelector(href);
        if (target) sections.push({ link, target });
      }
    });

    window.addEventListener("scroll", () => {
      const scrollPos = window.scrollY + 200;
      let activeIdx = 0;
      sections.forEach((s, i) => {
        if (s.target.offsetTop <= scrollPos) activeIdx = i;
      });
      tocLinks.forEach((l) => l.classList.remove("active"));
      if (sections[activeIdx]) sections[activeIdx].link.classList.add("active");
    });
  }

  /* ── Hero Canvas (Landing Page) ─────────────────────────────────────── */
  function initHeroCanvas() {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let W, H;
    const particles = [];
    const COLORS = ["#4fc3f7", "#7c3aed", "#f472b6", "#34d399", "#ff8a65"];
    const N = 120;

    function resize() {
      W = canvas.width = canvas.parentElement.clientWidth;
      H = canvas.height = canvas.parentElement.clientHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function rand(a, b) { return Math.random() * (b - a) + a; }

    for (let i = 0; i < N; i++) {
      particles.push({
        x: rand(0, W),
        y: rand(0, H),
        vx: rand(-0.3, 0.3),
        vy: rand(-0.3, 0.3),
        r: rand(1.5, 3.5),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: rand(0.15, 0.5),
      });
    }

    function draw() {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }

      /* Draw connections */
      ctx.globalAlpha = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = particles[i].color;
            ctx.globalAlpha = 0.06 * (1 - dist / 120);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    }
    draw();
  }

  document.addEventListener("DOMContentLoaded", initHeroCanvas);

  /* ── Smooth anchor scroll for same-page links ───────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

})();
