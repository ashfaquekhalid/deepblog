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

  /* ═══════════════════════════════════════════════════════════════════════
     BLOG REGISTRY — Single source of truth for all blog posts
     ═══════════════════════════════════════════════════════════════════════ */
  window.BLOG_REGISTRY = [
    { title: "Samplers for Flow Matching", section: "Deep Learning", sectionClass: "dl", icon: "🎯", tags: "samplers,ode,euler,rk4,heun,midpoint,adaptive,flow matching,generative models", url: "samplers-flow-matching.html", time: "30 min", date: "Mar 2026", summary: "A deep dive into ODE solvers for generating samples — Euler, Midpoint, Heun, RK4, adaptive methods, stochastic samplers, and distillation." },
    { title: "Flow Matching: The Complete Guide", section: "Deep Learning", sectionClass: "dl", icon: "📐", tags: "flow matching,generative models,velocity field,optimal transport,conditional flow matching,cnf,ode,probability paths", url: "flow-matching.html", time: "35 min", date: "Mar 2026", summary: "From probability distributions to state-of-the-art generative models — everything about flow matching with interactive 3D animations." },
    { title: "How Neurons Compute", section: "Brain", sectionClass: "brain", icon: "🧬", tags: "neuroscience,neurons,action potential,synapses,plasticity,hodgkin-huxley,computation,brain", url: "how-neurons-compute.html", time: "40 min", date: "Mar 2026", summary: "From action potentials to synaptic plasticity — the fundamental computational unit of the brain, with interactive simulations." },
    { title: "Quantum Mechanics: The Rules of Reality", section: "Universe", sectionClass: "universe", icon: "⚛️", tags: "quantum,physics,wave-particle duality,superposition,entanglement,uncertainty,tunneling,measurement,schrodinger", url: "quantum-mechanics.html", time: "45 min", date: "Mar 2026", summary: "Wave-particle duality, superposition, entanglement, and the measurement problem — explained with interactive simulations." }
  ];

  /* ═══════════════════════════════════════════════════════════════════════
     SEARCH — Upgraded search bar logic (section pages + global)
     ═══════════════════════════════════════════════════════════════════════ */
  function initSectionSearch() {
    const wrapper = document.querySelector(".search-wrapper");
    const input = wrapper && wrapper.querySelector(".search-bar");
    const grid = document.getElementById("blogGrid");
    const noResults = document.getElementById("noResults");
    const shortcut = wrapper && wrapper.querySelector(".search-shortcut");
    const meta = wrapper && wrapper.querySelector(".search-meta");
    const countEl = wrapper && wrapper.querySelector(".search-count");
    const clearBtn = wrapper && wrapper.querySelector(".search-clear");
    if (!input || !grid) return;

    const cards = Array.from(grid.querySelectorAll(".blog-card"));
    const totalCards = cards.filter(c => !c.classList.contains("coming-soon-card")).length;

    input.addEventListener("focus", () => wrapper.classList.add("focused"));
    input.addEventListener("blur", () => { if (!input.value) wrapper.classList.remove("focused"); });

    input.addEventListener("input", function () {
      const q = this.value.toLowerCase().trim();
      if (shortcut) shortcut.classList.toggle("hidden", q.length > 0);
      if (meta) meta.classList.toggle("visible", q.length > 0);
      let visible = 0;

      cards.forEach(card => {
        const title = (card.dataset.title || "").toLowerCase();
        const tags = (card.dataset.tags || "").toLowerCase();
        const summary = (card.querySelector(".blog-card-summary") || {}).textContent || "";
        const match = !q || title.includes(q) || tags.includes(q) || summary.toLowerCase().includes(q);
        card.classList.toggle("filtered-out", !match);
        card.classList.toggle("filtered-in", match);
        if (match) visible++;
      });

      if (countEl) countEl.textContent = visible + " of " + totalCards;
      if (noResults) noResults.classList.toggle("visible", visible === 0 && q.length > 0);
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        input.value = "";
        input.dispatchEvent(new Event("input"));
        input.focus();
      });
    }
  }

  function initGlobalSearch() {
    const wrapper = document.querySelector(".global-search-wrapper");
    if (!wrapper) return;
    const input = wrapper.querySelector(".search-bar");
    const dropdown = wrapper.querySelector(".search-dropdown");
    const shortcut = wrapper.querySelector(".search-shortcut");
    const meta = wrapper.querySelector(".search-meta");
    const countEl = wrapper.querySelector(".search-count");
    const clearBtn = wrapper.querySelector(".search-clear");
    if (!input || !dropdown) return;

    let activeIndex = -1;

    input.addEventListener("focus", () => wrapper.classList.add("focused"));
    input.addEventListener("blur", () => {
      setTimeout(() => {
        wrapper.classList.remove("focused");
        dropdown.classList.remove("open");
      }, 200);
    });

    function renderResults(q) {
      const blogs = window.BLOG_REGISTRY || [];
      const query = q.toLowerCase().trim();
      let matches = blogs;
      if (query) {
        matches = blogs.filter(b =>
          b.title.toLowerCase().includes(query) ||
          b.tags.toLowerCase().includes(query) ||
          b.summary.toLowerCase().includes(query) ||
          b.section.toLowerCase().includes(query)
        );
      }

      if (shortcut) shortcut.classList.toggle("hidden", query.length > 0);
      if (meta) meta.classList.toggle("visible", query.length > 0);
      if (countEl) countEl.textContent = matches.length + " result" + (matches.length !== 1 ? "s" : "");

      if (!query) { dropdown.classList.remove("open"); activeIndex = -1; return; }

      activeIndex = -1;
      let html = "";

      if (matches.length === 0) {
        html = '<div class="search-dropdown-empty">No blogs match your search.</div>';
      } else {
        const grouped = {};
        matches.forEach(b => {
          if (!grouped[b.section]) grouped[b.section] = [];
          grouped[b.section].push(b);
        });
        for (const section in grouped) {
          html += '<div class="search-dropdown-section">' + section + "</div>";
          grouped[section].forEach(b => {
            html += '<a href="' + b.url + '" class="search-result" data-url="' + b.url + '">' +
              '<div class="search-result-icon">' + b.icon + "</div>" +
              '<div class="search-result-body">' +
                '<div class="search-result-title">' + b.title + "</div>" +
                '<div class="search-result-summary">' + b.summary + "</div>" +
                '<div class="search-result-meta">' +
                  '<span class="search-section-pill ' + b.sectionClass + '">' + b.section + "</span>" +
                  '<span class="search-result-time">' + b.time + " read</span>" +
                "</div>" +
              "</div>" +
            "</a>";
          });
        }
      }

      html += '<div class="search-dropdown-hint"><kbd>↑</kbd><kbd>↓</kbd> navigate  <kbd>↵</kbd> open  <kbd>esc</kbd> close</div>';
      dropdown.innerHTML = html;
      dropdown.classList.add("open");
    }

    input.addEventListener("input", function () {
      renderResults(this.value);
    });

    input.addEventListener("keydown", function (e) {
      if (!dropdown.classList.contains("open")) return;
      const items = dropdown.querySelectorAll(".search-result");
      if (!items.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        const url = items[activeIndex].getAttribute("data-url") || items[activeIndex].getAttribute("href");
        if (url) window.location.href = url;
        return;
      } else if (e.key === "Escape") {
        e.preventDefault();
        dropdown.classList.remove("open");
        input.blur();
        return;
      } else {
        return;
      }

      items.forEach(it => it.classList.remove("active"));
      if (items[activeIndex]) {
        items[activeIndex].classList.add("active");
        items[activeIndex].scrollIntoView({ block: "nearest" });
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        input.value = "";
        dropdown.classList.remove("open");
        if (shortcut) shortcut.classList.remove("hidden");
        if (meta) meta.classList.remove("visible");
        input.focus();
      });
    }
  }

  /* ── Keyboard shortcuts: Ctrl+K or / to focus search ─────────────────── */
  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) {
      if (e.key === "Escape") {
        e.target.blur();
        const dd = document.querySelector(".search-dropdown.open");
        if (dd) dd.classList.remove("open");
      }
      return;
    }
    if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey)))) {
      e.preventDefault();
      const searchInput = document.querySelector(".global-search-wrapper .search-bar") ||
                          document.querySelector(".search-wrapper .search-bar");
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  });

  /* ═══════════════════════════════════════════════════════════════════════
     ASK FORM — Submit questions to Google Apps Script
     ═══════════════════════════════════════════════════════════════════════ */
  var ASK_ENDPOINT = "https://script.google.com/macros/s/AKfycbwRHRdEJfSYezvHIURu9YJOhRe4g3gVqwiUIVYwKQNlb-FD7scJiHaXO093YcKnpJs8YA/exec";

  function initAskForm() {
    var form = document.getElementById("askForm");
    if (!form) return;
    var btn = form.querySelector(".ask-btn");
    var successEl = document.getElementById("askSuccess");
    var errorEl = document.getElementById("askError");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var question = form.elements.question.value.trim();
      if (!question) return;

      btn.disabled = true;
      btn.classList.add("loading");
      successEl.classList.remove("visible");
      errorEl.classList.remove("visible");

      var payload = {
        name: name || "Anonymous",
        question: question,
        page: window.location.pathname.split("/").pop() || "index.html"
      };

      var formData = new FormData();
      formData.append("name", payload.name);
      formData.append("question", payload.question);
      formData.append("page", payload.page);

      fetch(ASK_ENDPOINT, {
        method: "POST",
        body: formData
      })
      .then(function () {
        successEl.classList.add("visible");
        form.reset();
        setTimeout(function () { successEl.classList.remove("visible"); }, 4000);
      })
      .catch(function () {
        successEl.classList.add("visible");
        form.reset();
        setTimeout(function () { successEl.classList.remove("visible"); }, 4000);
      })
      .finally(function () {
        btn.disabled = false;
        btn.classList.remove("loading");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSectionSearch();
    initGlobalSearch();
    initAskForm();
  });

})();
