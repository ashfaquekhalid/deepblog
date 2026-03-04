/* ═══════════════════════════════════════════════════════════════════════════
   Quantum Mechanics — Interactive Animations
   Canvas-based simulations for double-slit experiment, uncertainty
   principle, quantum tunneling, and hero background
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var CYAN = "#00d4ff";
  var PURPLE = "#7c3aed";
  var PINK = "#f472b6";
  var GREEN = "#34d399";
  var ORANGE = "#fb923c";
  var WHITE = "#e6edf3";
  var MUTED = "#484f58";
  var BG = "#06060e";

  function dpr() { return Math.min(window.devicePixelRatio || 1, 2); }

  function setupCanvas(canvas, container) {
    var r = dpr();
    var w = container.clientWidth;
    var h = container.clientHeight;
    canvas.width = w * r;
    canvas.height = h * r;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    var ctx = canvas.getContext("2d");
    ctx.scale(r, r);
    return { ctx: ctx, w: w, h: h };
  }

  /* ═══════════════════════════════════════════════════════════════════════
     1. DOUBLE-SLIT EXPERIMENT
     ═══════════════════════════════════════════════════════════════════════ */
  function initDoubleSlit() {
    var container = document.getElementById("doubleSlitContainer");
    var canvas = document.getElementById("doubleSlitCanvas");
    if (!canvas || !container) return;

    var ctx, w, h;
    var particles = [];
    var hits = [];
    var histogram = [];
    var histBins = 200;
    var detectorOn = false;
    var rate = 5;
    var slitWidth = 15;
    var slitSep = 60;
    var totalParticles = 0;

    for (var i = 0; i < histBins; i++) histogram[i] = 0;

    var barrierX = 0.35;
    var screenX = 0.88;

    function fireParticle() {
      var p = { x: 0.05, y: 0.5, phase: 0, alive: true, hit: false };
      p.vx = 0.008 + Math.random() * 0.004;
      particles.push(p);
    }

    function interferenceProb(yNorm) {
      var y = (yNorm - 0.5) * 400;
      var d = slitSep;
      var a = slitWidth;
      var lambda = 12;
      var k = 2 * Math.PI / lambda;
      var theta = y / 300;

      var beta = k * a * theta / 2;
      var gamma = k * d * theta / 2;

      var sinc = Math.abs(beta) < 0.001 ? 1 : Math.sin(beta) / beta;
      var interference = Math.cos(gamma);

      return sinc * sinc * interference * interference;
    }

    function classicalProb(yNorm) {
      var y = (yNorm - 0.5) * 400;
      var slit1 = slitSep / 2;
      var slit2 = -slitSep / 2;
      var sigma = slitWidth * 1.5;

      var p1 = Math.exp(-(y - slit1) * (y - slit1) / (2 * sigma * sigma));
      var p2 = Math.exp(-(y - slit2) * (y - slit2) / (2 * sigma * sigma));

      return (p1 + p2) / 2;
    }

    function sampleHitPosition() {
      var probFn = detectorOn ? classicalProb : interferenceProb;
      for (var attempt = 0; attempt < 100; attempt++) {
        var y = Math.random();
        var prob = probFn(y);
        if (Math.random() < prob) return y;
      }
      return 0.5 + (Math.random() - 0.5) * 0.2;
    }

    function draw() {
      requestAnimationFrame(draw);
      var c = setupCanvas(canvas, container);
      ctx = c.ctx; w = c.w; h = c.h;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      for (var i = 0; i < rate; i++) fireParticle();

      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(barrierX * w - 3, 0, 6, h);

      var slit1Y = 0.5 - slitSep / h;
      var slit2Y = 0.5 + slitSep / h;
      var sw = slitWidth / h;

      ctx.fillStyle = "rgba(90,90,120,0.7)";
      ctx.fillRect(barrierX * w - 3, 0, 6, (slit1Y - sw) * h);
      ctx.fillRect(barrierX * w - 3, (slit1Y + sw) * h, 6, (slit2Y - sw - slit1Y - sw) * h);
      ctx.fillRect(barrierX * w - 3, (slit2Y + sw) * h, 6, h - (slit2Y + sw) * h);

      ctx.fillStyle = CYAN;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(barrierX * w - 3, (slit1Y - sw) * h, 6, sw * 2 * h);
      ctx.fillRect(barrierX * w - 3, (slit2Y - sw) * h, 6, sw * 2 * h);
      ctx.globalAlpha = 1;

      ctx.fillStyle = "rgba(124, 58, 237, 0.08)";
      ctx.fillRect(screenX * w - 1, 0, 3, h);

      if (detectorOn) {
        ctx.fillStyle = "rgba(248, 113, 113, 0.15)";
        ctx.fillRect(barrierX * w + 5, (slit1Y - sw - 0.02) * h, 20, (sw * 2 + 0.04) * h);
        ctx.fillRect(barrierX * w + 5, (slit2Y - sw - 0.02) * h, 20, (sw * 2 + 0.04) * h);
        ctx.fillStyle = "rgba(248,113,113,0.5)";
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.fillText("👁", barrierX * w + 10, (slit1Y) * h + 3);
        ctx.fillText("👁", barrierX * w + 10, (slit2Y) * h + 3);
      }

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx;
        p.phase += 0.1;

        if (p.x > screenX && !p.hit) {
          p.hit = true;
          p.alive = false;
          var hitY = sampleHitPosition();
          hits.push({ x: screenX * w, y: hitY * h, age: 0 });
          var bin = Math.floor(hitY * histBins);
          if (bin >= 0 && bin < histBins) histogram[bin]++;
          totalParticles++;
        }

        if (p.x > 1 || !p.alive) {
          particles.splice(i, 1);
          continue;
        }

        var px = p.x * w;
        var py;
        if (p.x < barrierX) {
          py = p.y * h;
        } else {
          py = p.y * h;
        }

        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = CYAN;
        ctx.fill();

        var glow = ctx.createRadialGradient(px, py, 0, px, py, 6);
        glow.addColorStop(0, "rgba(0,212,255,0.4)");
        glow.addColorStop(1, "rgba(0,212,255,0)");
        ctx.fillStyle = glow;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (var i = hits.length - 1; i >= 0; i--) {
        var hit = hits[i];
        hit.age++;
        ctx.globalAlpha = Math.max(0.1, 1 - hit.age / 600);
        ctx.beginPath();
        ctx.arc(hit.x, hit.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = PURPLE;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (hits.length > 5000) hits.splice(0, hits.length - 5000);

      var maxHist = 1;
      for (var i = 0; i < histBins; i++) {
        if (histogram[i] > maxHist) maxHist = histogram[i];
      }

      ctx.beginPath();
      ctx.strokeStyle = PINK;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.8;
      for (var i = 0; i < histBins; i++) {
        var hx = screenX * w + 8 + (histogram[i] / maxHist) * (w * 0.1);
        var hy = (i / histBins) * h;
        if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = WHITE;
      ctx.font = "bold 12px 'Space Grotesk', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Particles: " + totalParticles, 10, 20);
      ctx.fillStyle = detectorOn ? "#f87171" : GREEN;
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText("Detector: " + (detectorOn ? "ON" : "OFF"), 10, 36);
    }

    var rateSlider = document.getElementById("dsRate");
    var rateVal = document.getElementById("dsRateVal");
    var slitSlider = document.getElementById("dsSlitWidth");
    var slitVal = document.getElementById("dsSlitWidthVal");
    var detectorBtn = document.getElementById("dsDetector");
    var resetBtn = document.getElementById("dsReset");

    if (rateSlider) rateSlider.addEventListener("input", function () {
      rate = parseInt(this.value);
      rateVal.textContent = rate + "/frame";
    });
    if (slitSlider) slitSlider.addEventListener("input", function () {
      slitWidth = parseInt(this.value);
      slitVal.textContent = slitWidth;
    });
    if (detectorBtn) detectorBtn.addEventListener("click", function () {
      detectorOn = !detectorOn;
      this.textContent = "🔍 Detector: " + (detectorOn ? "ON" : "OFF");
      this.style.background = detectorOn ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.08)";
      this.style.borderColor = detectorOn ? "var(--accent-green)" : "rgba(248,113,113,0.25)";
      this.style.color = detectorOn ? "var(--accent-green)" : "var(--accent-red)";
      histogram = [];
      for (var i = 0; i < histBins; i++) histogram[i] = 0;
      hits = [];
      totalParticles = 0;
    });
    if (resetBtn) resetBtn.addEventListener("click", function () {
      particles = []; hits = []; totalParticles = 0;
      histogram = [];
      for (var i = 0; i < histBins; i++) histogram[i] = 0;
    });

    draw();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     2. UNCERTAINTY PRINCIPLE VISUALIZER
     ═══════════════════════════════════════════════════════════════════════ */
  function initUncertainty() {
    var container = document.getElementById("uncertaintyContainer");
    var canvas = document.getElementById("uncertaintyCanvas");
    if (!canvas || !container) return;

    var ctx, w, h;
    var sigmaX = 30;
    var time = 0;

    function draw() {
      requestAnimationFrame(draw);
      time += 0.016;
      var c = setupCanvas(canvas, container);
      ctx = c.ctx; w = c.w; h = c.h;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      var margin = { left: 50, right: 20, top: 20, bottom: 10 };
      var gw = w - margin.left - margin.right;
      var halfH = h / 2 - 15;
      var sigmaP = 800 / sigmaX;
      var product = sigmaX * sigmaP;

      ctx.fillStyle = MUTED;
      ctx.font = "10px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Position Space |Ψ(x)|²", margin.left + gw / 2, margin.top + 12);

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top + halfH);
      ctx.lineTo(margin.left + gw, margin.top + halfH);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 2;
      var amp = halfH * 0.85;
      for (var i = 0; i <= gw; i++) {
        var x = (i - gw / 2);
        var gauss = Math.exp(-x * x / (2 * sigmaX * sigmaX));
        var wave = gauss * Math.cos(x * 0.15 + time * 2);
        var yVal = margin.top + halfH - gauss * amp;
        if (i === 0) ctx.moveTo(margin.left + i, yVal); else ctx.lineTo(margin.left + i, yVal);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = CYAN;
      for (var i = 0; i <= gw; i++) {
        var x = (i - gw / 2);
        var gauss = Math.exp(-x * x / (2 * sigmaX * sigmaX));
        var yVal = margin.top + halfH - gauss * amp;
        if (i === 0) ctx.moveTo(margin.left + i, margin.top + halfH);
        ctx.lineTo(margin.left + i, yVal);
      }
      ctx.lineTo(margin.left + gw, margin.top + halfH);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = "rgba(0,212,255,0.4)";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      var dxLeft = gw / 2 - sigmaX;
      var dxRight = gw / 2 + sigmaX;
      ctx.beginPath();
      ctx.moveTo(margin.left + dxLeft, margin.top + 20);
      ctx.lineTo(margin.left + dxLeft, margin.top + halfH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(margin.left + dxRight, margin.top + 20);
      ctx.lineTo(margin.left + dxRight, margin.top + halfH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = CYAN;
      ctx.font = "bold 11px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("← Δx →", margin.left + gw / 2, margin.top + halfH + 14);

      var pTop = margin.top + halfH + 30;
      ctx.fillStyle = MUTED;
      ctx.font = "10px 'Inter', sans-serif";
      ctx.fillText("Momentum Space |Φ(p)|²", margin.left + gw / 2, pTop + 2);

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.moveTo(margin.left, pTop + halfH - 10);
      ctx.lineTo(margin.left + gw, pTop + halfH - 10);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = PINK;
      ctx.lineWidth = 2;
      var pAmp = (halfH - 15) * 0.85;
      for (var i = 0; i <= gw; i++) {
        var p = (i - gw / 2);
        var gauss = Math.exp(-p * p / (2 * sigmaP * sigmaP));
        var yVal = pTop + halfH - 10 - gauss * pAmp;
        if (i === 0) ctx.moveTo(margin.left + i, yVal); else ctx.lineTo(margin.left + i, yVal);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = PINK;
      for (var i = 0; i <= gw; i++) {
        var p = (i - gw / 2);
        var gauss = Math.exp(-p * p / (2 * sigmaP * sigmaP));
        var yVal = pTop + halfH - 10 - gauss * pAmp;
        if (i === 0) ctx.moveTo(margin.left + i, pTop + halfH - 10);
        ctx.lineTo(margin.left + i, yVal);
      }
      ctx.lineTo(margin.left + gw, pTop + halfH - 10);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = "rgba(244,114,182,0.4)";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      var dpLeft = gw / 2 - sigmaP;
      var dpRight = gw / 2 + sigmaP;
      ctx.beginPath();
      ctx.moveTo(margin.left + dpLeft, pTop + 10);
      ctx.lineTo(margin.left + dpLeft, pTop + halfH - 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(margin.left + dpRight, pTop + 10);
      ctx.lineTo(margin.left + dpRight, pTop + halfH - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = PINK;
      ctx.font = "bold 11px 'Space Grotesk', sans-serif";
      ctx.fillText("← Δp →", margin.left + gw / 2, pTop + halfH + 2);

      ctx.fillStyle = WHITE;
      ctx.font = "bold 13px 'Space Grotesk', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("Δx·Δp = " + product.toFixed(0) + " ≥ ℏ/2", w - margin.right, margin.top + 18);
    }

    var dxSlider = document.getElementById("uncDx");
    var dxVal = document.getElementById("uncDxVal");
    var productDisplay = document.getElementById("uncProduct");

    if (dxSlider) dxSlider.addEventListener("input", function () {
      sigmaX = parseInt(this.value);
      dxVal.textContent = "Δx = " + sigmaX;
      var sigmaP = 800 / sigmaX;
      var prod = sigmaX * sigmaP;
      productDisplay.textContent = "Δx·Δp = " + prod.toFixed(0) + " ≥ ℏ/2";
    });

    draw();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     3. QUANTUM TUNNELING SIMULATOR
     ═══════════════════════════════════════════════════════════════════════ */
  function initTunneling() {
    var container = document.getElementById("tunnelingContainer");
    var canvas = document.getElementById("tunnelingCanvas");
    if (!canvas || !container) return;

    var ctx, w, h;
    var barrierHeight = 60;
    var barrierWidth = 25;
    var packets = [];
    var packetId = 0;

    function createPacket() {
      var N = 300;
      var wf = [];
      var sigma = 20;
      var k0 = 0.3;
      for (var i = 0; i < N; i++) {
        var x = i - 80;
        var envelope = Math.exp(-x * x / (2 * sigma * sigma));
        var re = envelope * Math.cos(k0 * i);
        var im = envelope * Math.sin(k0 * i);
        wf.push({ re: re, im: im });
      }
      return { wf: wf, N: N, pos: 0, time: 0, id: packetId++, sigma: sigma };
    }

    function firePacket() {
      packets.push(createPacket());
    }

    function stepPacket(pkt) {
      pkt.time++;
      pkt.pos += 0.8;
      var N = pkt.N;
      var wf = pkt.wf;
      var dt = 0.5;
      var dx = 1;

      for (var step = 0; step < 3; step++) {
        var newWf = [];
        for (var i = 0; i < N; i++) {
          if (i === 0 || i === N - 1) {
            newWf.push({ re: 0, im: 0 });
            continue;
          }

          var globalX = i + pkt.pos;
          var barrierCenter = 180;
          var bStart = barrierCenter - barrierWidth / 2;
          var bEnd = barrierCenter + barrierWidth / 2;
          var V = (globalX >= bStart && globalX <= bEnd) ? barrierHeight * 0.01 : 0;

          var lapRe = (wf[i + 1].re - 2 * wf[i].re + wf[i - 1].re) / (dx * dx);
          var lapIm = (wf[i + 1].im - 2 * wf[i].im + wf[i - 1].im) / (dx * dx);

          newWf.push({
            re: wf[i].re + dt * (0.5 * lapIm + V * wf[i].im),
            im: wf[i].im + dt * (-0.5 * lapRe - V * wf[i].re)
          });
        }
        pkt.wf = newWf;
        wf = newWf;
      }
    }

    function draw() {
      requestAnimationFrame(draw);
      var c = setupCanvas(canvas, container);
      ctx = c.ctx; w = c.w; h = c.h;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      var margin = { left: 30, right: 20, top: 15, bottom: 30 };
      var gw = w - margin.left - margin.right;
      var gh = h - margin.top - margin.bottom;
      var midY = margin.top + gh * 0.55;

      var barrierCenter = 180;
      var bStart = barrierCenter - barrierWidth / 2;
      var bEnd = barrierCenter + barrierWidth / 2;

      var bxStart = margin.left + (bStart / 350) * gw;
      var bxEnd = margin.left + (bEnd / 350) * gw;
      var bHeight = (barrierHeight / 100) * gh * 0.45;

      ctx.fillStyle = "rgba(124, 58, 237, 0.15)";
      ctx.fillRect(bxStart, midY - bHeight, bxEnd - bxStart, bHeight);
      ctx.strokeStyle = "rgba(124, 58, 237, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bxStart, midY - bHeight, bxEnd - bxStart, bHeight);

      ctx.fillStyle = "rgba(124,58,237,0.6)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("V₀", (bxStart + bxEnd) / 2, midY - bHeight - 6);

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, midY);
      ctx.lineTo(margin.left + gw, midY);
      ctx.stroke();

      for (var p = packets.length - 1; p >= 0; p--) {
        var pkt = packets[p];
        stepPacket(pkt);

        if (pkt.pos > 400) { packets.splice(p, 1); continue; }

        var N = pkt.wf.length;
        ctx.beginPath();
        ctx.strokeStyle = CYAN;
        ctx.lineWidth = 2;

        var maxProb = 0;
        for (var i = 0; i < N; i++) {
          var prob = pkt.wf[i].re * pkt.wf[i].re + pkt.wf[i].im * pkt.wf[i].im;
          if (prob > maxProb) maxProb = prob;
        }
        if (maxProb < 0.001) maxProb = 0.001;

        for (var i = 0; i < N; i++) {
          var globalX = i + pkt.pos;
          var screenXPos = margin.left + (globalX / 350) * gw;
          if (screenXPos < margin.left || screenXPos > margin.left + gw) continue;

          var prob = pkt.wf[i].re * pkt.wf[i].re + pkt.wf[i].im * pkt.wf[i].im;
          var yVal = midY - (prob / maxProb) * gh * 0.4;

          var isTransmitted = globalX > bEnd;
          if (isTransmitted) ctx.strokeStyle = GREEN;
          else ctx.strokeStyle = CYAN;

          if (i === 0) ctx.moveTo(screenXPos, yVal);
          else ctx.lineTo(screenXPos, yVal);
        }
        ctx.stroke();

        ctx.globalAlpha = 0.08;
        ctx.beginPath();
        for (var i = 0; i < N; i++) {
          var globalX = i + pkt.pos;
          var screenXPos = margin.left + (globalX / 350) * gw;
          if (screenXPos < margin.left || screenXPos > margin.left + gw) continue;
          var prob = pkt.wf[i].re * pkt.wf[i].re + pkt.wf[i].im * pkt.wf[i].im;
          var yVal = midY - (prob / maxProb) * gh * 0.4;
          if (i === 0) {
            ctx.moveTo(screenXPos, midY);
            ctx.lineTo(screenXPos, yVal);
          } else {
            ctx.lineTo(screenXPos, yVal);
          }
        }
        ctx.lineTo(margin.left + ((N - 1 + pkt.pos) / 350) * gw, midY);
        ctx.fillStyle = CYAN;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = WHITE;
      ctx.font = "bold 12px 'Space Grotesk', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("Barrier: " + barrierHeight + "% | Width: " + barrierWidth + "px", w - margin.right, margin.top + 16);

      ctx.fillStyle = MUTED;
      ctx.font = "9px 'Inter', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("← Incident", margin.left + 5, midY + 18);
      ctx.fillStyle = GREEN;
      ctx.textAlign = "right";
      ctx.fillText("Transmitted →", margin.left + gw - 5, midY + 18);
    }

    var barrierSlider = document.getElementById("tunBarrier");
    var barrierVal = document.getElementById("tunBarrierVal");
    var widthSlider = document.getElementById("tunWidth");
    var widthVal = document.getElementById("tunWidthVal");
    var fireBtn = document.getElementById("tunFire");
    var resetBtn = document.getElementById("tunReset");

    if (barrierSlider) barrierSlider.addEventListener("input", function () {
      barrierHeight = parseInt(this.value);
      barrierVal.textContent = barrierHeight + "%";
    });
    if (widthSlider) widthSlider.addEventListener("input", function () {
      barrierWidth = parseInt(this.value);
      widthVal.textContent = barrierWidth + " px";
    });
    if (fireBtn) fireBtn.addEventListener("click", firePacket);
    if (resetBtn) resetBtn.addEventListener("click", function () {
      packets = [];
    });

    firePacket();
    draw();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     4. HERO CANVAS — Quantum particles / wave-particle duality
     ═══════════════════════════════════════════════════════════════════════ */
  function initQuantumHero() {
    var canvas = document.getElementById("quantumHeroCanvas");
    if (!canvas) return;
    var parent = canvas.parentElement;
    var ctx = canvas.getContext("2d");
    var W, H;
    var particles = [];
    var waves = [];
    var time = 0;
    var COLORS = [PINK, CYAN, PURPLE, "#8b5cf6", "#06b6d4"];

    function resize() {
      var r = dpr();
      W = parent.clientWidth;
      H = parent.clientHeight;
      canvas.width = W * r;
      canvas.height = H * r;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(r, 0, 0, r, 0, 0);
    }

    function init() {
      resize();
      particles = [];
      waves = [];
      for (var i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          r: 1 + Math.random() * 2.5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 0.15 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
          waveAmp: 2 + Math.random() * 4,
          freq: 0.02 + Math.random() * 0.03
        });
      }
      for (var i = 0; i < 5; i++) {
        waves.push({
          x: Math.random() * W,
          y: Math.random() * H,
          radius: 0,
          maxRadius: 80 + Math.random() * 120,
          speed: 0.5 + Math.random() * 0.5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
      }
    }
    init();
    window.addEventListener("resize", resize);

    function draw() {
      requestAnimationFrame(draw);
      time += 0.016;
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < waves.length; i++) {
        var wave = waves[i];
        wave.radius += wave.speed;
        if (wave.radius > wave.maxRadius) {
          wave.x = Math.random() * W;
          wave.y = Math.random() * H;
          wave.radius = 0;
          wave.maxRadius = 80 + Math.random() * 120;
        }
        ctx.globalAlpha = 0.06 * (1 - wave.radius / wave.maxRadius);
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx + Math.sin(time * p.freq * 10 + p.phase) * 0.2;
        p.y += p.vy + Math.cos(time * p.freq * 10 + p.phase) * 0.2;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        var wobble = Math.sin(time * 3 + p.phase) * p.waveAmp;
        var px = p.x;
        var py = p.y + wobble;

        ctx.globalAlpha = p.alpha * (0.7 + 0.3 * Math.sin(time * 2 + p.phase));
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        var glow = ctx.createRadialGradient(px, py, 0, px, py, p.r * 4);
        glow.addColorStop(0, p.color.replace(")", ",0.2)").replace("rgb", "rgba"));
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, p.r * 4, 0, Math.PI * 2);
        ctx.fill();

        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var dx = px - q.x;
          var dy = py - q.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(q.x, q.y + Math.sin(time * 3 + q.phase) * q.waveAmp);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = 0.03 * (1 - dist / 120);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    }
    draw();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════════════════ */
  document.addEventListener("DOMContentLoaded", function () {
    initQuantumHero();
    initDoubleSlit();
    initUncertainty();
    initTunneling();
  });

})();
