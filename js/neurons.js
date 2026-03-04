/* ═══════════════════════════════════════════════════════════════════════════
   How Neurons Compute — Interactive Animations
   Canvas-based simulations for neuron anatomy, action potentials,
   synaptic integration, and spike trains
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const CYAN = "#00d4ff";
  const PURPLE = "#7c3aed";
  const PINK = "#f472b6";
  const GREEN = "#34d399";
  const ORANGE = "#fb923c";
  const RED = "#f87171";
  const WHITE = "#e6edf3";
  const MUTED = "#484f58";
  const BG = "#06060e";

  function dpr() { return Math.min(window.devicePixelRatio || 1, 2); }

  function setupCanvas(canvas, container) {
    const r = dpr();
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w * r;
    canvas.height = h * r;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(r, r);
    return { ctx, w, h };
  }

  /* ═══════════════════════════════════════════════════════════════════════
     1. NEURON ANATOMY — Interactive labeled diagram
     ═══════════════════════════════════════════════════════════════════════ */
  function initNeuronAnatomy() {
    const container = document.getElementById("neuronAnatomyContainer");
    const canvas = document.getElementById("neuronAnatomyCanvas");
    if (!canvas || !container) return;

    let { ctx, w, h } = setupCanvas(canvas, container);
    let mouseX = -1, mouseY = -1;
    let time = 0;
    let signals = [];

    const parts = [
      { name: "Dendrites", desc: "Input receivers — collect signals from other neurons", color: PURPLE,
        cx: 0.18, cy: 0.35, rx: 0.12, ry: 0.25 },
      { name: "Soma (Cell Body)", desc: "Integration center — sums all inputs", color: CYAN,
        cx: 0.32, cy: 0.45, rx: 0.07, ry: 0.09 },
      { name: "Axon Hillock", desc: "Decision point — highest density of Na⁺ channels", color: ORANGE,
        cx: 0.38, cy: 0.48, rx: 0.03, ry: 0.04 },
      { name: "Axon", desc: "Output cable — carries action potentials at up to 120 m/s", color: GREEN,
        cx: 0.58, cy: 0.50, rx: 0.18, ry: 0.03 },
      { name: "Myelin Sheath", desc: "Insulating wrap — speeds up signal by 10×", color: PINK,
        cx: 0.58, cy: 0.50, rx: 0.15, ry: 0.06 },
      { name: "Synaptic Terminals", desc: "Output ports — release neurotransmitters", color: RED,
        cx: 0.85, cy: 0.45, rx: 0.08, ry: 0.15 }
    ];

    let hoveredPart = null;

    canvas.addEventListener("mousemove", function (e) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener("mouseleave", function () {
      mouseX = -1; mouseY = -1; hoveredPart = null;
    });

    function spawnSignal() {
      signals.push({ x: 0.12, y: 0.35 + (Math.random() - 0.5) * 0.15, speed: 0.003 + Math.random() * 0.002, phase: 0 });
    }

    function drawDendrites(ctx, w, h) {
      ctx.strokeStyle = PURPLE;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.7;
      const branches = [
        [[0.05, 0.15], [0.12, 0.25], [0.22, 0.32]],
        [[0.03, 0.30], [0.10, 0.33], [0.22, 0.38]],
        [[0.08, 0.45], [0.14, 0.42], [0.22, 0.40]],
        [[0.04, 0.55], [0.11, 0.50], [0.22, 0.45]],
        [[0.06, 0.65], [0.13, 0.58], [0.22, 0.50]],
        [[0.10, 0.20], [0.16, 0.28], [0.22, 0.35]],
        [[0.02, 0.40], [0.09, 0.40], [0.22, 0.42]],
        [[0.07, 0.70], [0.15, 0.62], [0.22, 0.52]]
      ];
      branches.forEach(function (pts) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
        for (var i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i][0] * w, pts[i][1] * h);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pts[0][0] * w, pts[0][1] * h, 3, 0, Math.PI * 2);
        ctx.fillStyle = PURPLE;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function drawSoma(ctx, w, h) {
      var cx = 0.28 * w, cy = 0.43 * h, rx = 0.07 * w, ry = 0.11 * h;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
      grad.addColorStop(0, "rgba(0, 212, 255, 0.25)");
      grad.addColorStop(0.7, "rgba(0, 212, 255, 0.08)");
      grad.addColorStop(1, "rgba(0, 212, 255, 0.02)");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - ry * 0.1, rx * 0.35, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 212, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(0, 212, 255, 0.1)";
      ctx.fill();
    }

    function drawAxon(ctx, w, h) {
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(0.35 * w, 0.45 * h);
      ctx.lineTo(0.78 * w, 0.48 * h);
      ctx.stroke();

      var myelinSegments = 5;
      for (var i = 0; i < myelinSegments; i++) {
        var startX = 0.38 + i * 0.075;
        var endX = startX + 0.055;
        var midX = (startX + endX) / 2;
        var yy = 0.465 + i * 0.005;
        ctx.beginPath();
        ctx.ellipse(midX * w, yy * h, (endX - startX) / 2 * w, 0.035 * h, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(244, 114, 182, 0.12)";
        ctx.fill();
        ctx.strokeStyle = PINK;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function drawTerminals(ctx, w, h) {
      var branches = [
        [0.78, 0.48, 0.88, 0.30],
        [0.78, 0.48, 0.90, 0.45],
        [0.78, 0.48, 0.88, 0.60],
        [0.78, 0.48, 0.85, 0.50],
        [0.78, 0.48, 0.86, 0.36]
      ];
      ctx.strokeStyle = RED;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7;
      branches.forEach(function (b) {
        ctx.beginPath();
        ctx.moveTo(b[0] * w, b[1] * h);
        ctx.lineTo(b[2] * w, b[3] * h);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b[2] * w, b[3] * h, 5 + Math.sin(time * 2 + b[2] * 10) * 2, 0, Math.PI * 2);
        ctx.fillStyle = RED;
        ctx.globalAlpha = 0.6 + Math.sin(time * 2 + b[2] * 10) * 0.3;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function drawSignals(ctx, w, h) {
      for (var i = signals.length - 1; i >= 0; i--) {
        var s = signals[i];
        s.x += s.speed;
        if (s.x < 0.35) {
          var t = (s.x - 0.12) / 0.23;
          s.y += (0.43 - s.y) * 0.03;
        }
        if (s.x > 0.95) { signals.splice(i, 1); continue; }

        var yPos = s.x < 0.35 ? s.y * h : (0.45 + (s.x - 0.35) * 0.07) * h;
        ctx.beginPath();
        ctx.arc(s.x * w, yPos, 4, 0, Math.PI * 2);
        var glow = ctx.createRadialGradient(s.x * w, yPos, 0, s.x * w, yPos, 12);
        glow.addColorStop(0, "rgba(0, 212, 255, 0.9)");
        glow.addColorStop(1, "rgba(0, 212, 255, 0)");
        ctx.fillStyle = glow;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x * w, yPos, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }
    }

    function hitTest(mx, my) {
      hoveredPart = null;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var dx = (mx / w - p.cx) / p.rx;
        var dy = (my / h - p.cy) / p.ry;
        if (dx * dx + dy * dy < 1) {
          hoveredPart = p;
          return;
        }
      }
    }

    function drawTooltip(ctx, w, h) {
      if (!hoveredPart) return;
      var tx = mouseX + 15;
      var ty = mouseY - 10;
      var label = hoveredPart.name;
      var desc = hoveredPart.desc;
      ctx.font = "bold 14px 'Space Grotesk', sans-serif";
      var tw1 = ctx.measureText(label).width;
      ctx.font = "12px 'Inter', sans-serif";
      var tw2 = ctx.measureText(desc).width;
      var bw = Math.max(tw1, tw2) + 24;
      var bh = 52;
      if (tx + bw > w) tx = mouseX - bw - 10;
      if (ty + bh > h) ty = mouseY - bh;

      ctx.fillStyle = "rgba(12, 12, 29, 0.92)";
      ctx.strokeStyle = hoveredPart.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tx, ty, bw, bh, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = "bold 13px 'Space Grotesk', sans-serif";
      ctx.fillStyle = hoveredPart.color;
      ctx.fillText(label, tx + 12, ty + 20);
      ctx.font = "11px 'Inter', sans-serif";
      ctx.fillStyle = WHITE;
      ctx.globalAlpha = 0.8;
      ctx.fillText(desc, tx + 12, ty + 38);
      ctx.globalAlpha = 1;
    }

    function drawLabels(ctx, w, h) {
      var labels = [
        { text: "Dendrites", x: 0.08, y: 0.12, color: PURPLE },
        { text: "Soma", x: 0.24, y: 0.28, color: CYAN },
        { text: "Axon Hillock", x: 0.34, y: 0.36, color: ORANGE },
        { text: "Myelin Sheath", x: 0.50, y: 0.32, color: PINK },
        { text: "Axon", x: 0.60, y: 0.60, color: GREEN },
        { text: "Terminals", x: 0.84, y: 0.22, color: RED }
      ];
      ctx.font = "11px 'Space Grotesk', sans-serif";
      labels.forEach(function (l) {
        var isH = hoveredPart && hoveredPart.name.indexOf(l.text.split(" ")[0]) !== -1;
        ctx.globalAlpha = isH ? 1 : 0.6;
        ctx.fillStyle = l.color;
        ctx.fillText(l.text, l.x * w, l.y * h);
      });
      ctx.globalAlpha = 1;
    }

    function render() {
      requestAnimationFrame(render);
      time += 0.016;
      if (Math.random() < 0.02) spawnSignal();

      var c = setupCanvas(canvas, container);
      ctx = c.ctx; w = c.w; h = c.h;

      ctx.fillStyle = "rgba(6, 6, 14, 0.95)";
      ctx.fillRect(0, 0, w, h);

      if (mouseX > 0) hitTest(mouseX, mouseY);

      drawDendrites(ctx, w, h);
      drawSoma(ctx, w, h);
      drawAxon(ctx, w, h);
      drawTerminals(ctx, w, h);
      drawSignals(ctx, w, h);
      drawLabels(ctx, w, h);
      drawTooltip(ctx, w, h);
    }
    render();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     2. ACTION POTENTIAL SIMULATOR (Hodgkin-Huxley)
     ═══════════════════════════════════════════════════════════════════════ */
  function initAPSimulator() {
    var container = document.getElementById("apSimContainer");
    var canvas = document.getElementById("apSimCanvas");
    if (!canvas || !container) return;

    var { ctx, w, h } = setupCanvas(canvas, container);

    var C_m = 1.0, g_Na = 120.0, g_K = 36.0, g_L = 0.3;
    var E_Na = 50.0, E_K = -77.0, E_L = -54.387;
    var V = -65.0, m = 0.0529, h_gate = 0.5961, n = 0.3177;
    var dt_sim = 0.02;
    var I_ext = 0;
    var pulseTimer = 0;

    var history = [];
    var maxHistory = 1200;
    var gNaHistory = [];
    var gKHistory = [];

    function alphaM(V) { return (V === -40) ? 1.0 : 0.1 * (V + 40) / (1 - Math.exp(-(V + 40) / 10)); }
    function betaM(V) { return 4.0 * Math.exp(-(V + 65) / 18); }
    function alphaH(V) { return 0.07 * Math.exp(-(V + 65) / 20); }
    function betaH(V) { return 1.0 / (1 + Math.exp(-(V + 35) / 10)); }
    function alphaN(V) { return (V === -55) ? 0.1 : 0.01 * (V + 55) / (1 - Math.exp(-(V + 55) / 10)); }
    function betaN(V) { return 0.125 * Math.exp(-(V + 65) / 80); }

    function step() {
      var I = I_ext;
      if (pulseTimer > 0) { I += 15; pulseTimer--; }

      var I_Na = g_Na * Math.pow(m, 3) * h_gate * (V - E_Na);
      var I_K = g_K * Math.pow(n, 4) * (V - E_K);
      var I_L = g_L * (V - E_L);

      var dV = (I - I_Na - I_K - I_L) / C_m;
      V += dV * dt_sim;

      var dm = alphaM(V) * (1 - m) - betaM(V) * m;
      var dh = alphaH(V) * (1 - h_gate) - betaH(V) * h_gate;
      var dn = alphaN(V) * (1 - n) - betaN(V) * n;

      m += dm * dt_sim;
      h_gate += dh * dt_sim;
      n += dn * dt_sim;

      m = Math.max(0, Math.min(1, m));
      h_gate = Math.max(0, Math.min(1, h_gate));
      n = Math.max(0, Math.min(1, n));

      history.push(V);
      gNaHistory.push(g_Na * Math.pow(m, 3) * h_gate);
      gKHistory.push(g_K * Math.pow(n, 4));
      if (history.length > maxHistory) {
        history.shift();
        gNaHistory.shift();
        gKHistory.shift();
      }
    }

    function drawGraph() {
      var c = setupCanvas(canvas, container);
      ctx = c.ctx; w = c.w; h = c.h;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      var margin = { left: 55, right: 20, top: 15, bottom: 35 };
      var gw = w - margin.left - margin.right;
      var gh = h - margin.top - margin.bottom;

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      var voltages = [-80, -60, -40, -20, 0, 20, 40];
      voltages.forEach(function (v) {
        var y = margin.top + gh * (1 - (v + 80) / 130);
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + gw, y);
        ctx.stroke();
        ctx.fillStyle = MUTED;
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.textAlign = "right";
        ctx.fillText(v + " mV", margin.left - 8, y + 3);
      });

      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.setLineDash([4, 4]);
      var threshY = margin.top + gh * (1 - (-55 + 80) / 130);
      ctx.beginPath();
      ctx.moveTo(margin.left, threshY);
      ctx.lineTo(margin.left + gw, threshY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "9px 'Inter', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("threshold −55 mV", margin.left + 4, threshY - 5);

      if (history.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = CYAN;
        ctx.lineWidth = 2;
        for (var i = 0; i < history.length; i++) {
          var x = margin.left + (i / maxHistory) * gw;
          var y = margin.top + gh * (1 - (history[i] + 80) / 130);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = PINK;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        for (var i = 0; i < gNaHistory.length; i++) {
          var x = margin.left + (i / maxHistory) * gw;
          var y = margin.top + gh * (1 - gNaHistory[i] / 130);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = GREEN;
        for (var i = 0; i < gKHistory.length; i++) {
          var x = margin.left + (i / maxHistory) * gw;
          var y = margin.top + gh * (1 - gKHistory[i] / 40);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = WHITE;
      ctx.font = "bold 13px 'Space Grotesk', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("V = " + V.toFixed(1) + " mV", w - margin.right, margin.top + 18);
    }

    var currentSlider = document.getElementById("apCurrent");
    var currentVal = document.getElementById("apCurrentVal");
    var pulseBtn = document.getElementById("apPulse");
    var resetBtn = document.getElementById("apReset");

    if (currentSlider) {
      currentSlider.addEventListener("input", function () {
        I_ext = parseFloat(this.value);
        currentVal.textContent = I_ext.toFixed(1) + " μA";
      });
    }
    if (pulseBtn) {
      pulseBtn.addEventListener("click", function () {
        pulseTimer = 100;
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        V = -65; m = 0.0529; h_gate = 0.5961; n = 0.3177;
        history = []; gNaHistory = []; gKHistory = [];
        I_ext = 0;
        if (currentSlider) { currentSlider.value = 0; currentVal.textContent = "0.0 μA"; }
      });
    }

    function animate() {
      requestAnimationFrame(animate);
      for (var i = 0; i < 20; i++) step();
      drawGraph();
    }
    animate();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     3. LEAKY INTEGRATE-AND-FIRE SIMULATOR
     ═══════════════════════════════════════════════════════════════════════ */
  function initLIFSimulator() {
    var container = document.getElementById("lifSimContainer");
    var canvas = document.getElementById("lifSimCanvas");
    if (!canvas || !container) return;

    var ctx, w, h;

    var V_rest = -70, V_thresh = -55, V_reset = -75;
    var tau = 20, R_m = 10;
    var V = V_rest;
    var dt_sim = 0.5;

    var history = [];
    var maxHistory = 800;
    var events = [];
    var spikeTimes = [];
    var simTime = 0;

    function addInput(type) {
      var amplitude = type === "excite" ? 4.0 : -3.0;
      events.push({ time: simTime, amp: amplitude, type: type });
    }

    function step() {
      simTime += dt_sim;
      var I_syn = 0;
      for (var i = events.length - 1; i >= 0; i--) {
        var ev = events[i];
        var dt = simTime - ev.time;
        if (dt < 0 || dt > 60) { if (dt > 60) events.splice(i, 1); continue; }
        var psp = ev.amp * (dt / tau) * Math.exp(1 - dt / tau);
        I_syn += psp;
      }

      var dV = (-(V - V_rest) + R_m * I_syn) / tau;
      V += dV * dt_sim;

      if (V >= V_thresh) {
        history.push(30);
        spikeTimes.push(simTime);
        V = V_reset;
      } else {
        history.push(V);
      }

      if (history.length > maxHistory) history.shift();
    }

    function drawGraph() {
      var c = setupCanvas(canvas, container);
      ctx = c.ctx; w = c.w; h = c.h;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      var margin = { left: 55, right: 20, top: 15, bottom: 30 };
      var gw = w - margin.left - margin.right;
      var gh = h - margin.top - margin.bottom;
      var vMin = -80, vMax = 40;

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      [-80, -70, -60, -55, -40, -20, 0, 20, 40].forEach(function (v) {
        var y = margin.top + gh * (1 - (v - vMin) / (vMax - vMin));
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + gw, y);
        ctx.stroke();
        ctx.fillStyle = MUTED;
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.textAlign = "right";
        ctx.fillText(v + "", margin.left - 8, y + 3);
      });

      var threshY = margin.top + gh * (1 - (V_thresh - vMin) / (vMax - vMin));
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(margin.left, threshY);
      ctx.lineTo(margin.left + gw, threshY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "9px 'Inter', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("threshold", margin.left + 4, threshY - 5);

      if (history.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = CYAN;
        ctx.lineWidth = 2;
        for (var i = 0; i < history.length; i++) {
          var x = margin.left + (i / maxHistory) * gw;
          var y = margin.top + gh * (1 - (history[i] - vMin) / (vMax - vMin));
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      var visibleStart = simTime - maxHistory * dt_sim;
      events.forEach(function (ev) {
        if (ev.time < visibleStart) return;
        var xPos = margin.left + ((ev.time - visibleStart) / (maxHistory * dt_sim)) * gw;
        if (xPos < margin.left || xPos > margin.left + gw) return;
        ctx.fillStyle = ev.type === "excite" ? GREEN : RED;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        if (ev.type === "excite") {
          ctx.moveTo(xPos, margin.top + gh + 5);
          ctx.lineTo(xPos - 4, margin.top + gh + 13);
          ctx.lineTo(xPos + 4, margin.top + gh + 13);
        } else {
          ctx.moveTo(xPos, margin.top + gh + 13);
          ctx.lineTo(xPos - 4, margin.top + gh + 5);
          ctx.lineTo(xPos + 4, margin.top + gh + 5);
        }
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      ctx.fillStyle = WHITE;
      ctx.font = "bold 12px 'Space Grotesk', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("V = " + (V > V_thresh ? "SPIKE" : V.toFixed(1) + " mV"), w - margin.right, margin.top + 16);
      ctx.fillStyle = MUTED;
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText("Spikes: " + spikeTimes.length, w - margin.right, margin.top + 32);
    }

    var exciteBtn = document.getElementById("lifExcite");
    var inhibitBtn = document.getElementById("lifInhibit");
    var burstBtn = document.getElementById("lifBurst");
    var resetBtn = document.getElementById("lifReset");
    var tauSlider = document.getElementById("lifTau");
    var tauVal = document.getElementById("lifTauVal");

    if (exciteBtn) exciteBtn.addEventListener("click", function () { addInput("excite"); });
    if (inhibitBtn) inhibitBtn.addEventListener("click", function () { addInput("inhibit"); });
    if (burstBtn) {
      burstBtn.addEventListener("click", function () {
        for (var i = 0; i < 5; i++) {
          setTimeout(function () { addInput("excite"); }, i * 30);
        }
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        V = V_rest; history = []; events = []; spikeTimes = []; simTime = 0;
      });
    }
    if (tauSlider) {
      tauSlider.addEventListener("input", function () {
        tau = parseFloat(this.value);
        tauVal.textContent = tau + " ms";
      });
    }

    function animate() {
      requestAnimationFrame(animate);
      for (var i = 0; i < 4; i++) step();
      drawGraph();
    }
    animate();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     4. SPIKE TRAIN VISUALIZER
     ═══════════════════════════════════════════════════════════════════════ */
  function initSpikeTrainVisualizer() {
    var container = document.getElementById("spikeTrainContainer");
    var canvas = document.getElementById("spikeTrainCanvas");
    if (!canvas || !container) return;

    var ctx, w, h;

    var V = -65, m = 0.0529, h_gate = 0.5961, n = 0.3177;
    var C_m = 1.0, g_Na = 120, g_K = 36, g_L = 0.3;
    var E_Na = 50, E_K = -77, E_L = -54.387;
    var dt_sim = 0.02;
    var stimulus = 40;
    var noiseLevel = 10;

    var vHistory = [];
    var spikeRaster = [];
    var firingRateHistory = [];
    var maxHistory = 1500;
    var recentSpikes = [];
    var simTime = 0;

    function alphaM(V) { return (Math.abs(V + 40) < 0.001) ? 1.0 : 0.1 * (V + 40) / (1 - Math.exp(-(V + 40) / 10)); }
    function betaM(V) { return 4.0 * Math.exp(-(V + 65) / 18); }
    function alphaH(V) { return 0.07 * Math.exp(-(V + 65) / 20); }
    function betaH(V) { return 1.0 / (1 + Math.exp(-(V + 35) / 10)); }
    function alphaN(V) { return (Math.abs(V + 55) < 0.001) ? 0.1 : 0.01 * (V + 55) / (1 - Math.exp(-(V + 55) / 10)); }
    function betaN(V) { return 0.125 * Math.exp(-(V + 65) / 80); }

    var prevV = V;

    function step() {
      simTime += dt_sim;
      var I = stimulus * 0.15 + (Math.random() - 0.5) * noiseLevel * 0.2;

      var I_Na = g_Na * Math.pow(m, 3) * h_gate * (V - E_Na);
      var I_K = g_K * Math.pow(n, 4) * (V - E_K);
      var I_L = g_L * (V - E_L);

      var dV = (I - I_Na - I_K - I_L) / C_m;
      prevV = V;
      V += dV * dt_sim;

      var dm = alphaM(V) * (1 - m) - betaM(V) * m;
      var dh = alphaH(V) * (1 - h_gate) - betaH(V) * h_gate;
      var dn = alphaN(V) * (1 - n) - betaN(V) * n;
      m = Math.max(0, Math.min(1, m + dm * dt_sim));
      h_gate = Math.max(0, Math.min(1, h_gate + dh * dt_sim));
      n = Math.max(0, Math.min(1, n + dn * dt_sim));

      vHistory.push(V);
      if (vHistory.length > maxHistory) vHistory.shift();

      if (V > 0 && prevV <= 0) {
        spikeRaster.push(simTime);
        recentSpikes.push(simTime);
      }

      while (recentSpikes.length > 0 && simTime - recentSpikes[0] > 500) {
        recentSpikes.shift();
      }
      var rate = recentSpikes.length * 2;
      firingRateHistory.push(rate);
      if (firingRateHistory.length > maxHistory) firingRateHistory.shift();
    }

    function drawVisualization() {
      var c = setupCanvas(canvas, container);
      ctx = c.ctx; w = c.w; h = c.h;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      var margin = { left: 55, right: 20, top: 15, bottom: 25 };
      var gw = w - margin.left - margin.right;
      var topH = (h - margin.top - margin.bottom) * 0.5;
      var rasterH = (h - margin.top - margin.bottom) * 0.15;
      var bottomH = (h - margin.top - margin.bottom) * 0.30;

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      [-80, -40, 0, 40].forEach(function (v) {
        var y = margin.top + topH * (1 - (v + 80) / 130);
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + gw, y);
        ctx.stroke();
        ctx.fillStyle = MUTED;
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.textAlign = "right";
        ctx.fillText(v + "", margin.left - 6, y + 3);
      });

      if (vHistory.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = CYAN;
        ctx.lineWidth = 1.5;
        for (var i = 0; i < vHistory.length; i++) {
          var x = margin.left + (i / maxHistory) * gw;
          var y = margin.top + topH * (1 - (vHistory[i] + 80) / 130);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      var rasterTop = margin.top + topH + 8;
      ctx.fillStyle = MUTED;
      ctx.font = "9px 'Inter', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Spikes", margin.left - 44, rasterTop + rasterH / 2 + 3);

      var visibleStart = simTime - maxHistory * dt_sim;
      spikeRaster.forEach(function (t) {
        if (t < visibleStart) return;
        var x = margin.left + ((t - visibleStart) / (maxHistory * dt_sim)) * gw;
        ctx.strokeStyle = PINK;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(x, rasterTop);
        ctx.lineTo(x, rasterTop + rasterH);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      while (spikeRaster.length > 0 && spikeRaster[0] < visibleStart - 100) {
        spikeRaster.shift();
      }

      var rateTop = rasterTop + rasterH + 10;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      [0, 50, 100].forEach(function (r) {
        var y = rateTop + bottomH * (1 - r / 120);
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + gw, y);
        ctx.stroke();
        ctx.fillStyle = MUTED;
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.textAlign = "right";
        ctx.fillText(r + " Hz", margin.left - 6, y + 3);
      });

      if (firingRateHistory.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.8;
        for (var i = 0; i < firingRateHistory.length; i++) {
          var x = margin.left + (i / maxHistory) * gw;
          var y = rateTop + bottomH * (1 - Math.min(firingRateHistory[i], 120) / 120);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = WHITE;
      ctx.font = "bold 12px 'Space Grotesk', sans-serif";
      ctx.textAlign = "right";
      var currentRate = firingRateHistory.length > 0 ? firingRateHistory[firingRateHistory.length - 1] : 0;
      ctx.fillText("Rate: " + currentRate.toFixed(0) + " Hz", w - margin.right, rateTop + 14);

      ctx.fillStyle = ORANGE;
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText("Stimulus: " + stimulus + "%", w - margin.right, margin.top + 14);
    }

    var stimSlider = document.getElementById("spikeStimulus");
    var stimVal = document.getElementById("spikeStimulusVal");
    var noiseSlider = document.getElementById("spikeNoise");
    var noiseVal = document.getElementById("spikeNoiseVal");
    var resetBtn = document.getElementById("spikeReset");

    if (stimSlider) {
      stimSlider.addEventListener("input", function () {
        stimulus = parseInt(this.value);
        stimVal.textContent = stimulus + "%";
      });
    }
    if (noiseSlider) {
      noiseSlider.addEventListener("input", function () {
        noiseLevel = parseInt(this.value);
        noiseVal.textContent = noiseLevel + "%";
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        V = -65; m = 0.0529; h_gate = 0.5961; n = 0.3177;
        vHistory = []; spikeRaster = []; firingRateHistory = [];
        recentSpikes = []; simTime = 0;
      });
    }

    function animate() {
      requestAnimationFrame(animate);
      for (var i = 0; i < 25; i++) step();
      drawVisualization();
    }
    animate();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     5. HERO CANVAS — Neuron network particles
     ═══════════════════════════════════════════════════════════════════════ */
  function initNeuronHero() {
    var canvas = document.getElementById("neuronHeroCanvas");
    if (!canvas) return;
    var parent = canvas.parentElement;

    var ctx = canvas.getContext("2d");
    var W, H, particles, pulses;
    var COLORS = [PURPLE, PINK, CYAN, GREEN];

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
      pulses = [];
      for (var i = 0; i < 100; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: 1.5 + Math.random() * 2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 0.2 + Math.random() * 0.4
        });
      }
    }
    init();
    window.addEventListener("resize", resize);

    function spawnPulse() {
      if (particles.length < 2) return;
      var a = Math.floor(Math.random() * particles.length);
      var b = Math.floor(Math.random() * particles.length);
      if (a === b) return;
      var dx = particles[a].x - particles[b].x;
      var dy = particles[a].y - particles[b].y;
      if (Math.sqrt(dx * dx + dy * dy) < 180) {
        pulses.push({ from: a, to: b, t: 0 });
      }
    }

    function draw() {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = 0.04 * (1 - dist / 150);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      if (Math.random() < 0.03) spawnPulse();
      for (var i = pulses.length - 1; i >= 0; i--) {
        var pulse = pulses[i];
        pulse.t += 0.02;
        if (pulse.t > 1) { pulses.splice(i, 1); continue; }
        var from = particles[pulse.from];
        var to = particles[pulse.to];
        var px = from.x + (to.x - from.x) * pulse.t;
        var py = from.y + (to.y - from.y) * pulse.t;
        ctx.globalAlpha = 0.8 * (1 - pulse.t);
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        var grd = ctx.createRadialGradient(px, py, 0, px, py, 8);
        grd.addColorStop(0, "rgba(0, 212, 255, 0.8)");
        grd.addColorStop(1, "rgba(0, 212, 255, 0)");
        ctx.fillStyle = grd;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }
    draw();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════════════════ */
  document.addEventListener("DOMContentLoaded", function () {
    initNeuronHero();
    initNeuronAnatomy();
    initAPSimulator();
    initLIFSimulator();
    initSpikeTrainVisualizer();
  });

})();
