/* ═══════════════════════════════════════════════════════════════════════════
   Samplers for Flow Matching — Interactive Three.js Animations
   4 demos: Euler step visualization, Sampler comparison, Adaptive vs Fixed,
   Step count vs quality
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  if (typeof THREE === "undefined") return;

  /* ── Utility ──────────────────────────────────────────────────────────── */
  function seededRandom(seed) {
    let s = seed;
    return function () {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function gaussianPair(rng) {
    let u1 = rng(), u2 = rng();
    while (u1 === 0) u1 = rng();
    const mag = Math.sqrt(-2 * Math.log(u1));
    const angle = 2 * Math.PI * u2;
    return [mag * Math.cos(angle), mag * Math.sin(angle)];
  }

  const PALETTE = [0x4fc3f7, 0xff8a65, 0x81c784, 0xe57373, 0xba68c8];
  const CLUSTER_CENTERS = [
    [0, 2.2, 0], [2.1, 0.68, 0.5], [1.3, -1.78, -0.5],
    [-1.3, -1.78, 0.5], [-2.1, 0.68, -0.5],
  ];

  /* Velocity field: weighted average of conditional velocities (u = x1 - x0) */
  function velocityField(px, py, pz, t, x0arr, x1arr, N) {
    let vx = 0, vy = 0, vz = 0, wSum = 0;
    for (let i = 0; i < N; i++) {
      const xt = (1 - t) * x0arr[i * 3] + t * x1arr[i * 3];
      const yt = (1 - t) * x0arr[i * 3 + 1] + t * x1arr[i * 3 + 1];
      const zt = (1 - t) * x0arr[i * 3 + 2] + t * x1arr[i * 3 + 2];
      const dx = px - xt, dy = py - yt, dz = pz - zt;
      const d2 = dx * dx + dy * dy + dz * dz;
      const w = 1 / (d2 + 0.25);
      vx += w * (x1arr[i * 3] - x0arr[i * 3]);
      vy += w * (x1arr[i * 3 + 1] - x0arr[i * 3 + 1]);
      vz += w * (x1arr[i * 3 + 2] - x0arr[i * 3 + 2]);
      wSum += w;
    }
    return [vx / wSum, vy / wSum, vz / wSum];
  }

  function generateData(N, seed) {
    const rng = seededRandom(seed);
    const x0 = [], x1 = [], cids = [];
    for (let i = 0; i < N; i++) {
      const [g1, g2] = gaussianPair(rng);
      const [g3] = gaussianPair(rng);
      x0.push(g1, g2, g3 * 0.4);
      const cid = Math.floor(rng() * 5);
      cids.push(cid);
      const c = CLUSTER_CENTERS[cid];
      const [n1, n2] = gaussianPair(rng);
      const [n3] = gaussianPair(rng);
      x1.push(c[0] + n1 * 0.2, c[1] + n2 * 0.2, c[2] + n3 * 0.2);
    }
    return { x0, x1, cids, rng };
  }

  /* ODE solvers operating on the velocity field */
  function eulerStep(px, py, pz, t, h, x0, x1, N) {
    const [vx, vy, vz] = velocityField(px, py, pz, t, x0, x1, N);
    return [px + h * vx, py + h * vy, pz + h * vz];
  }

  function midpointStep(px, py, pz, t, h, x0, x1, N) {
    const [k1x, k1y, k1z] = velocityField(px, py, pz, t, x0, x1, N);
    const mx = px + 0.5 * h * k1x;
    const my = py + 0.5 * h * k1y;
    const mz = pz + 0.5 * h * k1z;
    const [k2x, k2y, k2z] = velocityField(mx, my, mz, t + 0.5 * h, x0, x1, N);
    return [px + h * k2x, py + h * k2y, pz + h * k2z];
  }

  function heunStep(px, py, pz, t, h, x0, x1, N) {
    const [k1x, k1y, k1z] = velocityField(px, py, pz, t, x0, x1, N);
    const ex = px + h * k1x;
    const ey = py + h * k1y;
    const ez = pz + h * k1z;
    const [k2x, k2y, k2z] = velocityField(ex, ey, ez, t + h, x0, x1, N);
    return [
      px + 0.5 * h * (k1x + k2x),
      py + 0.5 * h * (k1y + k2y),
      pz + 0.5 * h * (k1z + k2z),
    ];
  }

  function rk4Step(px, py, pz, t, h, x0, x1, N) {
    const [k1x, k1y, k1z] = velocityField(px, py, pz, t, x0, x1, N);
    const [k2x, k2y, k2z] = velocityField(
      px + 0.5 * h * k1x, py + 0.5 * h * k1y, pz + 0.5 * h * k1z,
      t + 0.5 * h, x0, x1, N
    );
    const [k3x, k3y, k3z] = velocityField(
      px + 0.5 * h * k2x, py + 0.5 * h * k2y, pz + 0.5 * h * k2z,
      t + 0.5 * h, x0, x1, N
    );
    const [k4x, k4y, k4z] = velocityField(
      px + h * k3x, py + h * k3y, pz + h * k3z,
      t + h, x0, x1, N
    );
    return [
      px + (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x),
      py + (h / 6) * (k1y + 2 * k2y + 2 * k3y + k4y),
      pz + (h / 6) * (k1z + 2 * k2z + 2 * k3z + k4z),
    ];
  }

  function solveODE(startX, startY, startZ, steps, method, x0, x1, N) {
    const path = [[startX, startY, startZ]];
    let px = startX, py = startY, pz = startZ;
    const h = 1.0 / steps;
    const stepFn = { euler: eulerStep, midpoint: midpointStep, heun: heunStep, rk4: rk4Step }[method];
    for (let i = 0; i < steps; i++) {
      const t = i * h;
      [px, py, pz] = stepFn(px, py, pz, t, h, x0, x1, N);
      path.push([px, py, pz]);
    }
    return path;
  }

  function setupDragRotate(renderer, rotObj) {
    let isDragging = false, prev = { x: 0, y: 0 };
    renderer.domElement.addEventListener("pointerdown", (e) => {
      isDragging = true; prev = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener("pointerup", () => (isDragging = false));
    window.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      rotObj.y += (e.clientX - prev.x) * 0.005;
      rotObj.x += (e.clientY - prev.y) * 0.005;
      rotObj.x = Math.max(-1.5, Math.min(1.5, rotObj.x));
      prev = { x: e.clientX, y: e.clientY };
    });
    return rotObj;
  }

  function setupZoom(renderer, camera) {
    renderer.domElement.addEventListener("wheel", (e) => {
      e.preventDefault();
      camera.position.z = Math.max(4, Math.min(20, camera.position.z + e.deltaY * 0.01));
    }, { passive: false });
  }

  function createRenderer(container) {
    const W = container.clientWidth;
    const H = container.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 9);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    window.addEventListener("resize", () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    return { scene, camera, renderer };
  }

  function addGrid(scene) {
    const g = new THREE.GridHelper(8, 16, 0x1a1a2e, 0x1a1a2e);
    g.rotation.x = Math.PI / 2;
    g.position.z = -2;
    scene.add(g);
    return g;
  }

  function createLineFromPath(path, color, opacity, linewidth) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(path.length * 3);
    for (let i = 0; i < path.length; i++) {
      pos[i * 3] = path[i][0];
      pos[i * 3 + 1] = path[i][1];
      pos[i * 3 + 2] = path[i][2];
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: opacity || 0.8,
      blending: THREE.AdditiveBlending, linewidth: linewidth || 1,
    });
    return new THREE.Line(geo, mat);
  }

  function createDotAtPoint(x, y, z, color, size) {
    const geo = new THREE.SphereGeometry(size || 0.06, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  /* ══════════════════════════════════════════════════════════════════════
     DEMO 1: Euler Method Step-by-Step
     Shows how Euler steps approximate the true ODE solution
     ══════════════════════════════════════════════════════════════════════ */
  function initEulerDemo() {
    const container = document.getElementById("eulerCanvas");
    if (!container) return;

    const { scene, camera, renderer } = createRenderer(container);
    const rot = { x: 0.2, y: 0.3 };
    setupDragRotate(renderer, rot);
    setupZoom(renderer, camera);
    const grid = addGrid(scene);

    const FIELD_N = 150;
    const data = generateData(FIELD_N, 42);

    const NUM_TRAJECTORIES = 12;
    const trjRng = seededRandom(99);
    const startPoints = [];
    for (let i = 0; i < NUM_TRAJECTORIES; i++) {
      const [g1, g2] = gaussianPair(trjRng);
      const [g3] = gaussianPair(trjRng);
      startPoints.push([g1, g2, g3 * 0.4]);
    }

    const truePathGroup = new THREE.Group();
    scene.add(truePathGroup);
    const eulerPathGroup = new THREE.Group();
    scene.add(eulerPathGroup);
    const dotsGroup = new THREE.Group();
    scene.add(dotsGroup);

    const TRAJECTORY_COLORS = [
      0x4fc3f7, 0xff8a65, 0x81c784, 0xe57373, 0xba68c8,
      0xffd54f, 0x4db6ac, 0xf06292, 0x7986cb, 0xa1887f,
      0x90a4ae, 0xdce775,
    ];

    function buildPaths(numSteps) {
      while (truePathGroup.children.length > 0) truePathGroup.remove(truePathGroup.children[0]);
      while (eulerPathGroup.children.length > 0) eulerPathGroup.remove(eulerPathGroup.children[0]);
      while (dotsGroup.children.length > 0) dotsGroup.remove(dotsGroup.children[0]);

      for (let ti = 0; ti < NUM_TRAJECTORIES; ti++) {
        const sp = startPoints[ti];
        const col = TRAJECTORY_COLORS[ti % TRAJECTORY_COLORS.length];

        const truePath = solveODE(sp[0], sp[1], sp[2], 200, "rk4", data.x0, data.x1, FIELD_N);
        const trueLine = createLineFromPath(truePath, 0xffffff, 0.15);
        truePathGroup.add(trueLine);

        const eulerPath = solveODE(sp[0], sp[1], sp[2], numSteps, "euler", data.x0, data.x1, FIELD_N);
        const eulerLine = createLineFromPath(eulerPath, col, 0.7);
        eulerPathGroup.add(eulerLine);

        for (let j = 0; j < eulerPath.length; j++) {
          const dot = createDotAtPoint(eulerPath[j][0], eulerPath[j][1], eulerPath[j][2], col, 0.04);
          dotsGroup.add(dot);
        }

        dotsGroup.add(createDotAtPoint(sp[0], sp[1], sp[2], 0xffffff, 0.06));

        const ep = truePath[truePath.length - 1];
        dotsGroup.add(createDotAtPoint(ep[0], ep[1], ep[2], 0xffffff, 0.04));
      }
    }

    let currentSteps = 5;
    buildPaths(currentSteps);

    const slider = document.getElementById("eulerSteps");
    const display = document.getElementById("eulerStepsDisplay");
    const playBtn = document.getElementById("eulerPlayBtn");
    const resetBtn = document.getElementById("eulerResetBtn");

    slider.addEventListener("input", () => {
      currentSteps = parseInt(slider.value);
      display.textContent = `N = ${currentSteps}`;
      buildPaths(currentSteps);
    });

    let animating = false, animStep = 0;
    playBtn.addEventListener("click", () => {
      animating = !animating;
      playBtn.textContent = animating ? "⏸ Pause" : "▶ Animate";
      if (animating) { animStep = 2; }
    });
    resetBtn.addEventListener("click", () => {
      animating = false;
      playBtn.textContent = "▶ Animate";
      currentSteps = 5;
      slider.value = 5;
      display.textContent = "N = 5";
      buildPaths(5);
    });

    let frameCount = 0;
    function animate() {
      requestAnimationFrame(animate);
      frameCount++;

      if (animating && frameCount % 30 === 0) {
        animStep++;
        if (animStep > 50) {
          animating = false;
          playBtn.textContent = "▶ Animate";
        } else {
          currentSteps = animStep;
          slider.value = animStep;
          display.textContent = `N = ${animStep}`;
          buildPaths(animStep);
        }
      }

      const autoRot = animating ? 0 : Date.now() * 0.00008;
      truePathGroup.rotation.set(rot.x, rot.y + autoRot, 0);
      eulerPathGroup.rotation.set(rot.x, rot.y + autoRot, 0);
      dotsGroup.rotation.set(rot.x, rot.y + autoRot, 0);
      grid.rotation.x = Math.PI / 2 + rot.x;
      grid.rotation.z = rot.y + autoRot;

      renderer.render(scene, camera);
    }
    animate();
  }

  /* ══════════════════════════════════════════════════════════════════════
     DEMO 2: Sampler Comparison (Euler vs Midpoint vs Heun vs RK4)
     ══════════════════════════════════════════════════════════════════════ */
  function initCompareDemo() {
    const container = document.getElementById("compareCanvas");
    if (!container) return;

    const { scene, camera, renderer } = createRenderer(container);
    camera.position.z = 10;
    const rot = { x: 0.15, y: 0.2 };
    setupDragRotate(renderer, rot);
    setupZoom(renderer, camera);
    const grid = addGrid(scene);

    const FIELD_N = 150;
    const data = generateData(FIELD_N, 77);

    const COLORS = { euler: 0xff6b6b, midpoint: 0xffd93d, heun: 0x6bcb77, rk4: 0x4d96ff };
    const METHODS = ["euler", "midpoint", "heun", "rk4"];

    const NUM_TRJ = 8;
    const trjRng = seededRandom(55);
    const startPoints = [];
    for (let i = 0; i < NUM_TRJ; i++) {
      const [g1, g2] = gaussianPair(trjRng);
      const [g3] = gaussianPair(trjRng);
      startPoints.push([g1 * 0.8, g2 * 0.8, g3 * 0.3]);
    }

    const groups = {};
    METHODS.forEach(m => { groups[m] = new THREE.Group(); scene.add(groups[m]); });
    const trueGroup = new THREE.Group();
    scene.add(trueGroup);
    const dotsGroup = new THREE.Group();
    scene.add(dotsGroup);

    let playing = false, animProgress = 0;

    function buildPaths(numSteps) {
      METHODS.forEach(m => { while (groups[m].children.length) groups[m].remove(groups[m].children[0]); });
      while (trueGroup.children.length) trueGroup.remove(trueGroup.children[0]);
      while (dotsGroup.children.length) dotsGroup.remove(dotsGroup.children[0]);

      for (let ti = 0; ti < NUM_TRJ; ti++) {
        const sp = startPoints[ti];

        const truePath = solveODE(sp[0], sp[1], sp[2], 200, "rk4", data.x0, data.x1, FIELD_N);
        trueGroup.add(createLineFromPath(truePath, 0xffffff, 0.12));

        dotsGroup.add(createDotAtPoint(sp[0], sp[1], sp[2], 0xffffff, 0.05));

        METHODS.forEach(m => {
          const path = solveODE(sp[0], sp[1], sp[2], numSteps, m, data.x0, data.x1, FIELD_N);
          groups[m].add(createLineFromPath(path, COLORS[m], 0.65));

          for (let j = 0; j < path.length; j++) {
            dotsGroup.add(createDotAtPoint(path[j][0], path[j][1], path[j][2], COLORS[m], 0.03));
          }

          const end = path[path.length - 1];
          const trueEnd = truePath[truePath.length - 1];
          const err = Math.sqrt(
            (end[0] - trueEnd[0]) ** 2 + (end[1] - trueEnd[1]) ** 2 + (end[2] - trueEnd[2]) ** 2
          );
          if (err > 0.15) {
            const errGeo = new THREE.BufferGeometry();
            const errPos = new Float32Array(6);
            errPos[0] = end[0]; errPos[1] = end[1]; errPos[2] = end[2];
            errPos[3] = trueEnd[0]; errPos[4] = trueEnd[1]; errPos[5] = trueEnd[2];
            errGeo.setAttribute("position", new THREE.BufferAttribute(errPos, 3));
            const errMat = new THREE.LineDashedMaterial({
              color: COLORS[m], transparent: true, opacity: 0.3,
              dashSize: 0.08, gapSize: 0.05,
            });
            const errLine = new THREE.Line(errGeo, errMat);
            errLine.computeLineDistances();
            groups[m].add(errLine);
          }
        });
      }
    }

    let currentSteps = 8;
    buildPaths(currentSteps);

    const slider = document.getElementById("compareSteps");
    const display = document.getElementById("compareStepsDisplay");
    const playBtn = document.getElementById("comparePlayBtn");
    const resetBtn = document.getElementById("compareResetBtn");

    slider.addEventListener("input", () => {
      currentSteps = parseInt(slider.value);
      display.textContent = `N = ${currentSteps}`;
      buildPaths(currentSteps);
    });

    playBtn.addEventListener("click", () => {
      playing = !playing;
      playBtn.textContent = playing ? "⏸ Pause" : "▶ Animate";
      if (playing) { animProgress = 3; }
    });
    resetBtn.addEventListener("click", () => {
      playing = false;
      playBtn.textContent = "▶ Animate";
      currentSteps = 8;
      slider.value = 8;
      display.textContent = "N = 8";
      buildPaths(8);
    });

    let fc = 0;
    function animate() {
      requestAnimationFrame(animate);
      fc++;

      if (playing && fc % 25 === 0) {
        animProgress++;
        if (animProgress > 30) {
          playing = false;
          playBtn.textContent = "▶ Animate";
        } else {
          currentSteps = animProgress;
          slider.value = animProgress;
          display.textContent = `N = ${animProgress}`;
          buildPaths(animProgress);
        }
      }

      const ar = Date.now() * 0.00006;
      [trueGroup, dotsGroup, ...METHODS.map(m => groups[m])].forEach(g => {
        g.rotation.set(rot.x, rot.y + ar, 0);
      });
      grid.rotation.x = Math.PI / 2 + rot.x;
      grid.rotation.z = rot.y + ar;

      renderer.render(scene, camera);
    }
    animate();
  }

  /* ══════════════════════════════════════════════════════════════════════
     DEMO 3: Adaptive vs Fixed Step Size
     Shows how adaptive methods concentrate steps in high-curvature regions
     ══════════════════════════════════════════════════════════════════════ */
  function initAdaptiveDemo() {
    const container = document.getElementById("adaptiveCanvas");
    if (!container) return;

    const { scene, camera, renderer } = createRenderer(container);
    camera.position.z = 10;
    const rot = { x: 0.15, y: 0 };
    setupDragRotate(renderer, rot);
    setupZoom(renderer, camera);
    const grid = addGrid(scene);

    const FIELD_N = 150;
    const data = generateData(FIELD_N, 31);

    const fixedGroup = new THREE.Group();
    scene.add(fixedGroup);
    const adaptiveGroup = new THREE.Group();
    scene.add(adaptiveGroup);
    const trueGroup = new THREE.Group();
    scene.add(trueGroup);

    const NUM_TRJ = 10;
    const trjRng = seededRandom(88);
    const startPoints = [];
    for (let i = 0; i < NUM_TRJ; i++) {
      const [g1, g2] = gaussianPair(trjRng);
      const [g3] = gaussianPair(trjRng);
      startPoints.push([g1 * 0.9, g2 * 0.9, g3 * 0.3]);
    }

    function adaptiveSchedule(nfe, x, y, z) {
      const finePath = solveODE(x, y, z, 200, "rk4", data.x0, data.x1, FIELD_N);
      const curvatures = [];
      for (let i = 1; i < finePath.length - 1; i++) {
        const dx1 = finePath[i][0] - finePath[i - 1][0];
        const dy1 = finePath[i][1] - finePath[i - 1][1];
        const dz1 = finePath[i][2] - finePath[i - 1][2];
        const dx2 = finePath[i + 1][0] - finePath[i][0];
        const dy2 = finePath[i + 1][1] - finePath[i][1];
        const dz2 = finePath[i + 1][2] - finePath[i][2];
        const curv = Math.sqrt((dx2 - dx1) ** 2 + (dy2 - dy1) ** 2 + (dz2 - dz1) ** 2);
        curvatures.push(curv + 0.001);
      }

      const segLen = Math.floor(200 / nfe);
      const segCurvatures = [];
      for (let s = 0; s < nfe; s++) {
        let total = 0;
        for (let j = s * segLen; j < Math.min((s + 1) * segLen, curvatures.length); j++) {
          total += curvatures[j];
        }
        segCurvatures.push(total);
      }

      const totalCurv = segCurvatures.reduce((a, b) => a + b, 0);
      const schedule = [0];
      let cumulative = 0;
      for (let s = 0; s < nfe; s++) {
        cumulative += segCurvatures[s] / totalCurv;
        schedule.push(Math.min(cumulative, 1));
      }
      schedule[schedule.length - 1] = 1;
      return schedule;
    }

    function solveWithSchedule(x, y, z, schedule) {
      const path = [[x, y, z]];
      let px = x, py = y, pz = z;
      for (let i = 0; i < schedule.length - 1; i++) {
        const t = schedule[i];
        const h = schedule[i + 1] - schedule[i];
        [px, py, pz] = heunStep(px, py, pz, t, h, data.x0, data.x1, FIELD_N);
        path.push([px, py, pz]);
      }
      return path;
    }

    function buildPaths(nfe) {
      [fixedGroup, adaptiveGroup, trueGroup].forEach(g => {
        while (g.children.length) g.remove(g.children[0]);
      });

      for (let ti = 0; ti < NUM_TRJ; ti++) {
        const sp = startPoints[ti];

        const truePath = solveODE(sp[0], sp[1], sp[2], 200, "rk4", data.x0, data.x1, FIELD_N);
        trueGroup.add(createLineFromPath(truePath, 0xffffff, 0.1));

        const fixedPath = solveODE(sp[0], sp[1], sp[2], nfe, "euler", data.x0, data.x1, FIELD_N);
        fixedGroup.add(createLineFromPath(fixedPath, 0xff6b6b, 0.6));
        for (const pt of fixedPath) {
          fixedGroup.add(createDotAtPoint(pt[0], pt[1], pt[2], 0xff6b6b, 0.035));
        }

        const schedule = adaptiveSchedule(nfe, sp[0], sp[1], sp[2]);
        const adaptPath = solveWithSchedule(sp[0], sp[1], sp[2], schedule);
        adaptiveGroup.add(createLineFromPath(adaptPath, 0x00d4ff, 0.7));
        for (const pt of adaptPath) {
          adaptiveGroup.add(createDotAtPoint(pt[0], pt[1], pt[2], 0x00d4ff, 0.035));
        }
      }
    }

    let currentNFE = 15;
    buildPaths(currentNFE);

    const slider = document.getElementById("adaptiveNFE");
    const display = document.getElementById("adaptiveNFEDisplay");
    const playBtn = document.getElementById("adaptivePlayBtn");
    const resetBtn = document.getElementById("adaptiveResetBtn");

    slider.addEventListener("input", () => {
      currentNFE = parseInt(slider.value);
      display.textContent = `NFE = ${currentNFE}`;
      buildPaths(currentNFE);
    });

    let playing = false, ap = 5;
    playBtn.addEventListener("click", () => {
      playing = !playing;
      playBtn.textContent = playing ? "⏸ Pause" : "▶ Animate";
      if (playing) ap = 5;
    });
    resetBtn.addEventListener("click", () => {
      playing = false;
      playBtn.textContent = "▶ Animate";
      currentNFE = 15;
      slider.value = 15;
      display.textContent = "NFE = 15";
      buildPaths(15);
    });

    let fc = 0;
    function animate() {
      requestAnimationFrame(animate);
      fc++;
      if (playing && fc % 30 === 0) {
        ap++;
        if (ap > 40) { playing = false; playBtn.textContent = "▶ Animate"; }
        else {
          currentNFE = ap;
          slider.value = ap;
          display.textContent = `NFE = ${ap}`;
          buildPaths(ap);
        }
      }

      const ar = Date.now() * 0.00006;
      [fixedGroup, adaptiveGroup, trueGroup].forEach(g => g.rotation.set(rot.x, rot.y + ar, 0));
      grid.rotation.x = Math.PI / 2 + rot.x;
      grid.rotation.z = rot.y + ar;
      renderer.render(scene, camera);
    }
    animate();
  }

  /* ══════════════════════════════════════════════════════════════════════
     DEMO 4: Step Count vs Quality (Particle Cloud)
     Shows the full particle cloud arriving at targets with different steps
     ══════════════════════════════════════════════════════════════════════ */
  function initStepsDemo() {
    const container = document.getElementById("stepsCanvas");
    if (!container) return;

    const { scene, camera, renderer } = createRenderer(container);
    camera.position.z = 9;
    const rot = { x: 0.1, y: 0 };
    setupDragRotate(renderer, rot);
    setupZoom(renderer, camera);

    const N = 500;
    const FIELD_N = N;
    const data = generateData(N, 42);

    const targetGeo = new THREE.BufferGeometry();
    const targetPos = new Float32Array(N * 3);
    const targetCol = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      targetPos[i * 3] = data.x1[i * 3];
      targetPos[i * 3 + 1] = data.x1[i * 3 + 1];
      targetPos[i * 3 + 2] = data.x1[i * 3 + 2];
      const col = new THREE.Color(PALETTE[data.cids[i]]);
      targetCol[i * 3] = col.r; targetCol[i * 3 + 1] = col.g; targetCol[i * 3 + 2] = col.b;
    }
    targetGeo.setAttribute("position", new THREE.BufferAttribute(targetPos, 3));
    targetGeo.setAttribute("color", new THREE.BufferAttribute(targetCol, 3));
    const targetMat = new THREE.PointsMaterial({
      size: 0.04, vertexColors: true, transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    const targetPts = new THREE.Points(targetGeo, targetMat);
    scene.add(targetPts);

    const sampleGeo = new THREE.BufferGeometry();
    const samplePos = new Float32Array(N * 3);
    const sampleCol = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const col = new THREE.Color(PALETTE[data.cids[i]]);
      sampleCol[i * 3] = col.r; sampleCol[i * 3 + 1] = col.g; sampleCol[i * 3 + 2] = col.b;
    }
    sampleGeo.setAttribute("position", new THREE.BufferAttribute(samplePos, 3));
    sampleGeo.setAttribute("color", new THREE.BufferAttribute(sampleCol, 3));
    const sampleMat = new THREE.PointsMaterial({
      size: 0.06, vertexColors: true, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    const samplePts = new THREE.Points(sampleGeo, sampleMat);
    scene.add(samplePts);

    const trailGroup = new THREE.Group();
    scene.add(trailGroup);
    const TRAIL_N = 30;

    function computeSamples(numSteps, method) {
      while (trailGroup.children.length) trailGroup.remove(trailGroup.children[0]);

      const stepFn = { euler: eulerStep, midpoint: midpointStep, heun: heunStep, rk4: rk4Step }[method];
      const h = 1.0 / numSteps;
      const positions = [];

      for (let i = 0; i < N; i++) {
        let px = data.x0[i * 3], py = data.x0[i * 3 + 1], pz = data.x0[i * 3 + 2];
        for (let s = 0; s < numSteps; s++) {
          const t = s * h;
          [px, py, pz] = stepFn(px, py, pz, t, h, data.x0, data.x1, FIELD_N);
        }
        positions.push(px, py, pz);
        samplePos[i * 3] = px;
        samplePos[i * 3 + 1] = py;
        samplePos[i * 3 + 2] = pz;
      }
      sampleGeo.attributes.position.needsUpdate = true;

      for (let ti = 0; ti < TRAIL_N; ti++) {
        const idx = Math.floor(ti * (N / TRAIL_N));
        const path = [];
        let px = data.x0[idx * 3], py = data.x0[idx * 3 + 1], pz = data.x0[idx * 3 + 2];
        path.push([px, py, pz]);
        for (let s = 0; s < numSteps; s++) {
          const t = s * h;
          [px, py, pz] = stepFn(px, py, pz, t, h, data.x0, data.x1, FIELD_N);
          path.push([px, py, pz]);
        }
        trailGroup.add(createLineFromPath(path, PALETTE[data.cids[idx]], 0.2));
      }
    }

    let currentSteps = 3;
    let currentMethod = "rk4";
    computeSamples(currentSteps, currentMethod);

    const slider = document.getElementById("stepsSlider");
    const display = document.getElementById("stepsDisplay");
    const samplerSelect = document.getElementById("samplerSelect");

    slider.addEventListener("input", () => {
      currentSteps = parseInt(slider.value);
      display.textContent = `N = ${currentSteps}`;
      computeSamples(currentSteps, currentMethod);
    });

    samplerSelect.addEventListener("change", () => {
      currentMethod = samplerSelect.value;
      computeSamples(currentSteps, currentMethod);
    });

    function animate() {
      requestAnimationFrame(animate);
      const ar = Date.now() * 0.0001;
      targetPts.rotation.set(rot.x, rot.y + ar, 0);
      samplePts.rotation.set(rot.x, rot.y + ar, 0);
      trailGroup.rotation.set(rot.x, rot.y + ar, 0);
      renderer.render(scene, camera);
    }
    animate();
  }

  /* ══════════════════════════════════════════════════════════════════════
     BLOG HERO: Flowing particles background (same as flow-matching)
     ══════════════════════════════════════════════════════════════════════ */
  function initBlogHero() {
    const canvas = document.getElementById("blogHeroCanvas");
    if (!canvas) return;

    const scene = new THREE.Scene();
    const W = canvas.parentElement.clientWidth;
    const H = canvas.parentElement.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const N = 1000;
    const rng = seededRandom(33);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const velocities = new Float32Array(N * 3);

    const heroColors = [0x4fc3f7, 0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xba68c8];
    for (let i = 0; i < N; i++) {
      const [g1, g2] = gaussianPair(rng);
      const [g3] = gaussianPair(rng);
      pos[i * 3] = g1 * 2.5;
      pos[i * 3 + 1] = g2 * 2.5;
      pos[i * 3 + 2] = g3 * 1.5;
      const c = new THREE.Color(heroColors[Math.floor(rng() * heroColors.length)]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      const [v1, v2] = gaussianPair(rng);
      const [v3] = gaussianPair(rng);
      velocities[i * 3] = v1 * 0.003;
      velocities[i * 3 + 1] = v2 * 0.003;
      velocities[i * 3 + 2] = v3 * 0.002;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.035, vertexColors: true, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    function animate() {
      requestAnimationFrame(animate);
      const p = geo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        p[i * 3] += velocities[i * 3];
        p[i * 3 + 1] += velocities[i * 3 + 1];
        p[i * 3 + 2] += velocities[i * 3 + 2];
        const dist = Math.sqrt(p[i * 3] ** 2 + p[i * 3 + 1] ** 2 + p[i * 3 + 2] ** 2);
        if (dist > 5) {
          velocities[i * 3] *= -0.8;
          velocities[i * 3 + 1] *= -0.8;
          velocities[i * 3 + 2] *= -0.8;
        }
        velocities[i * 3] += (rng() - 0.5) * 0.0003;
        velocities[i * 3 + 1] += (rng() - 0.5) * 0.0003;
      }
      geo.attributes.position.needsUpdate = true;
      pts.rotation.y += 0.0004;
      pts.rotation.x = Math.sin(Date.now() * 0.0002) * 0.1;
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", () => {
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  /* ── Initialize on DOM ready ────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", () => {
    initBlogHero();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id === "eulerCanvas") { initEulerDemo(); observer.unobserve(entry.target); }
          if (id === "compareCanvas") { initCompareDemo(); observer.unobserve(entry.target); }
          if (id === "adaptiveCanvas") { initAdaptiveDemo(); observer.unobserve(entry.target); }
          if (id === "stepsCanvas") { initStepsDemo(); observer.unobserve(entry.target); }
        }
      });
    }, { rootMargin: "200px" });

    ["eulerCanvas", "compareCanvas", "adaptiveCanvas", "stepsCanvas"].forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  });

})();
