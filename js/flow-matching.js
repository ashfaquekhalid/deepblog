/* ═══════════════════════════════════════════════════════════════════════════
   Flow Matching — 3D Interactive Animations (Three.js)
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

  /* ── Target distribution: 5-cluster flower in 3D ──────────────────────── */
  const CLUSTER_CENTERS = [
    [0, 2.2, 0], [2.1, 0.68, 0.5], [1.3, -1.78, -0.5],
    [-1.3, -1.78, 0.5], [-2.1, 0.68, -0.5],
  ];

  /* ══════════════════════════════════════════════════════════════════════
     DEMO 1: Distribution Transport (3D Particle Flow)
     ══════════════════════════════════════════════════════════════════════ */
  function initTransportDemo() {
    const container = document.getElementById("transportCanvas");
    if (!container) return;

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

    const N = 800;
    const rng = seededRandom(42);

    const x0 = [], x1 = [], clusterIds = [];
    for (let i = 0; i < N; i++) {
      const [g1, g2] = gaussianPair(rng);
      const [g3] = gaussianPair(rng);
      x0.push(g1, g2, g3 * 0.5);

      const cid = Math.floor(rng() * 5);
      clusterIds.push(cid);
      const c = CLUSTER_CENTERS[cid];
      const [n1, n2] = gaussianPair(rng);
      const [n3] = gaussianPair(rng);
      x1.push(c[0] + n1 * 0.22, c[1] + n2 * 0.22, c[2] + n3 * 0.22);
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);

    for (let i = 0; i < N; i++) {
      const col = new THREE.Color(PALETTE[clusterIds[i]]);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    /* Trail lines for a subset of particles */
    const TRAIL_COUNT = 60;
    const TRAIL_LEN = 30;
    const trailMeshes = [];
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const idx = Math.floor(i * (N / TRAIL_COUNT));
      const tGeo = new THREE.BufferGeometry();
      const tPos = new Float32Array(TRAIL_LEN * 3);
      tGeo.setAttribute("position", new THREE.BufferAttribute(tPos, 3));
      const tMat = new THREE.LineBasicMaterial({
        color: PALETTE[clusterIds[idx]],
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(tGeo, tMat);
      scene.add(line);
      trailMeshes.push({ line, idx, history: [] });
    }

    /* Subtle grid */
    const gridHelper = new THREE.GridHelper(8, 16, 0x1a1a2e, 0x1a1a2e);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -2;
    scene.add(gridHelper);

    /* Mouse rotation */
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotation = { x: 0, y: 0 };

    renderer.domElement.addEventListener("pointerdown", (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener("pointerup", () => (isDragging = false));
    window.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      rotation.y += (e.clientX - prevMouse.x) * 0.005;
      rotation.x += (e.clientY - prevMouse.y) * 0.005;
      rotation.x = Math.max(-1.2, Math.min(1.2, rotation.x));
      prevMouse = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener("wheel", (e) => {
      e.preventDefault();
      camera.position.z = Math.max(4, Math.min(18, camera.position.z + e.deltaY * 0.01));
    }, { passive: false });

    /* Controls */
    const slider = document.getElementById("timeSlider");
    const display = document.getElementById("timeDisplay");
    const playBtn = document.getElementById("playBtn");
    const resetBtn = document.getElementById("resetBtn");

    let t = 0;
    let playing = false;
    let animId;

    function setT(newT) {
      t = Math.max(0, Math.min(1, newT));
      slider.value = t;
      display.textContent = `t = ${t.toFixed(2)}`;
    }

    slider.addEventListener("input", () => {
      playing = false;
      playBtn.textContent = "▶ Play";
      setT(parseFloat(slider.value));
    });

    playBtn.addEventListener("click", () => {
      playing = !playing;
      playBtn.textContent = playing ? "⏸ Pause" : "▶ Play";
      if (playing && t >= 0.99) setT(0);
    });

    resetBtn.addEventListener("click", () => {
      playing = false;
      playBtn.textContent = "▶ Play";
      setT(0);
      trailMeshes.forEach(tm => (tm.history = []));
    });

    function updatePositions() {
      const posArr = geometry.attributes.position.array;
      for (let i = 0; i < N; i++) {
        posArr[i * 3] = (1 - t) * x0[i * 3] + t * x1[i * 3];
        posArr[i * 3 + 1] = (1 - t) * x0[i * 3 + 1] + t * x1[i * 3 + 1];
        posArr[i * 3 + 2] = (1 - t) * x0[i * 3 + 2] + t * x1[i * 3 + 2];
      }
      geometry.attributes.position.needsUpdate = true;

      for (const tm of trailMeshes) {
        const idx = tm.idx;
        const px = posArr[idx * 3], py = posArr[idx * 3 + 1], pz = posArr[idx * 3 + 2];
        tm.history.push(px, py, pz);
        if (tm.history.length > TRAIL_LEN * 3) {
          tm.history = tm.history.slice(-TRAIL_LEN * 3);
        }
        const tPosArr = tm.line.geometry.attributes.position.array;
        tPosArr.fill(0);
        for (let j = 0; j < tm.history.length; j++) {
          tPosArr[j] = tm.history[j];
        }
        tm.line.geometry.setDrawRange(0, tm.history.length / 3);
        tm.line.geometry.attributes.position.needsUpdate = true;
      }

      material.size = 0.04 + 0.06 * t;
    }

    function animate() {
      animId = requestAnimationFrame(animate);

      if (playing) {
        setT(t + 0.004);
        if (t >= 1) {
          playing = false;
          playBtn.textContent = "▶ Play";
        }
      }

      updatePositions();

      points.rotation.x = rotation.x;
      points.rotation.y = rotation.y + (playing ? 0 : Date.now() * 0.0001);
      trailMeshes.forEach(tm => {
        tm.line.rotation.x = points.rotation.x;
        tm.line.rotation.y = points.rotation.y;
      });
      gridHelper.rotation.x = Math.PI / 2 + rotation.x;
      gridHelper.rotation.z = rotation.y + (playing ? 0 : Date.now() * 0.0001);

      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener("resize", () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     DEMO 2: Velocity Field (3D Arrows + Paths)
     ══════════════════════════════════════════════════════════════════════ */
  function initVelocityDemo() {
    const container = document.getElementById("velocityCanvas");
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const rng = seededRandom(123);

    const N_PARTICLES = 300;
    const x0 = [], x1 = [], clusterIds = [];
    for (let i = 0; i < N_PARTICLES; i++) {
      const [g1, g2] = gaussianPair(rng);
      const [g3] = gaussianPair(rng);
      x0.push(g1, g2, g3 * 0.3);

      const cid = Math.floor(rng() * 5);
      clusterIds.push(cid);
      const c = CLUSTER_CENTERS[cid];
      const [n1, n2] = gaussianPair(rng);
      const [n3] = gaussianPair(rng);
      x1.push(c[0] + n1 * 0.2, c[1] + n2 * 0.2, c[2] + n3 * 0.2);
    }

    /* Particles */
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(N_PARTICLES * 3);
    const pCol = new Float32Array(N_PARTICLES * 3);
    for (let i = 0; i < N_PARTICLES; i++) {
      const col = new THREE.Color(PALETTE[clusterIds[i]]);
      pCol[i * 3] = col.r; pCol[i * 3 + 1] = col.g; pCol[i * 3 + 2] = col.b;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.05, vertexColors: true, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    /* Velocity arrows as lines with cone tips */
    const GRID = 7;
    const arrowGroup = new THREE.Group();
    scene.add(arrowGroup);
    const arrowData = [];

    for (let ix = 0; ix < GRID; ix++) {
      for (let iy = 0; iy < GRID; iy++) {
        for (let iz = 0; iz < 3; iz++) {
          const ox = (ix / (GRID - 1) - 0.5) * 6;
          const oy = (iy / (GRID - 1) - 0.5) * 6;
          const oz = (iz / 2 - 0.5) * 2;

          const lineGeo = new THREE.BufferGeometry();
          const linePos = new Float32Array(6);
          lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
          const lineMat = new THREE.LineBasicMaterial({
            color: 0x00d4ff, transparent: true, opacity: 0.5,
            blending: THREE.AdditiveBlending,
          });
          const line = new THREE.Line(lineGeo, lineMat);
          arrowGroup.add(line);

          const coneGeo = new THREE.ConeGeometry(0.06, 0.15, 6);
          const coneMat = new THREE.MeshBasicMaterial({
            color: 0x00d4ff, transparent: true, opacity: 0.6,
          });
          const cone = new THREE.Mesh(coneGeo, coneMat);
          arrowGroup.add(cone);

          arrowData.push({ ox, oy, oz, line, cone, linePos });
        }
      }
    }

    /* Trajectory paths */
    const pathGroup = new THREE.Group();
    scene.add(pathGroup);
    const N_PATHS = 40;
    const PATH_STEPS = 50;
    const pathLines = [];

    for (let i = 0; i < N_PATHS; i++) {
      const idx = Math.floor(i * (N_PARTICLES / N_PATHS));
      const pathGeo = new THREE.BufferGeometry();
      const pathPos = new Float32Array(PATH_STEPS * 3);
      for (let s = 0; s < PATH_STEPS; s++) {
        const st = s / (PATH_STEPS - 1);
        pathPos[s * 3] = (1 - st) * x0[idx * 3] + st * x1[idx * 3];
        pathPos[s * 3 + 1] = (1 - st) * x0[idx * 3 + 1] + st * x1[idx * 3 + 1];
        pathPos[s * 3 + 2] = (1 - st) * x0[idx * 3 + 2] + st * x1[idx * 3 + 2];
      }
      pathGeo.setAttribute("position", new THREE.BufferAttribute(pathPos, 3));
      const pathMat = new THREE.LineBasicMaterial({
        color: PALETTE[clusterIds[idx]], transparent: true, opacity: 0.15,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(pathGeo, pathMat);
      pathGroup.add(line);
      pathLines.push(line);
    }

    let showArrows = true, showPaths = true;
    arrowGroup.visible = showArrows;
    pathGroup.visible = showPaths;

    /* Mouse */
    let isDragging = false, prevMouse = { x: 0, y: 0 };
    let rot = { x: 0.3, y: 0.3 };
    renderer.domElement.addEventListener("pointerdown", (e) => {
      isDragging = true; prevMouse = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener("pointerup", () => (isDragging = false));
    window.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      rot.y += (e.clientX - prevMouse.x) * 0.005;
      rot.x += (e.clientY - prevMouse.y) * 0.005;
      rot.x = Math.max(-1.5, Math.min(1.5, rot.x));
      prevMouse = { x: e.clientX, y: e.clientY };
    });
    renderer.domElement.addEventListener("wheel", (e) => {
      e.preventDefault();
      camera.position.z = Math.max(5, Math.min(20, camera.position.z + e.deltaY * 0.01));
    }, { passive: false });

    /* Controls */
    const slider = document.getElementById("velTimeSlider");
    const display = document.getElementById("velTimeDisplay");
    const btnArrows = document.getElementById("toggleArrows");
    const btnPaths = document.getElementById("togglePaths");

    let t = 0.3;
    slider.addEventListener("input", () => {
      t = parseFloat(slider.value);
      display.textContent = `t = ${t.toFixed(2)}`;
    });

    btnArrows.addEventListener("click", () => {
      showArrows = !showArrows;
      arrowGroup.visible = showArrows;
      btnArrows.classList.toggle("active", showArrows);
    });
    btnArrows.classList.add("active");

    btnPaths.addEventListener("click", () => {
      showPaths = !showPaths;
      pathGroup.visible = showPaths;
      btnPaths.classList.toggle("active", showPaths);
    });
    btnPaths.classList.add("active");

    function computeVelocityAt(px, py, pz, t_val) {
      let vx = 0, vy = 0, vz = 0, wSum = 0;
      for (let i = 0; i < N_PARTICLES; i++) {
        const xt = (1 - t_val) * x0[i * 3] + t_val * x1[i * 3];
        const yt = (1 - t_val) * x0[i * 3 + 1] + t_val * x1[i * 3 + 1];
        const zt = (1 - t_val) * x0[i * 3 + 2] + t_val * x1[i * 3 + 2];
        const dx = px - xt, dy = py - yt, dz = pz - zt;
        const d2 = dx * dx + dy * dy + dz * dz;
        const w = 1 / (d2 + 0.3);
        const vi0 = x1[i * 3] - x0[i * 3];
        const vi1 = x1[i * 3 + 1] - x0[i * 3 + 1];
        const vi2 = x1[i * 3 + 2] - x0[i * 3 + 2];
        vx += w * vi0; vy += w * vi1; vz += w * vi2;
        wSum += w;
      }
      return [vx / wSum, vy / wSum, vz / wSum];
    }

    function animate() {
      requestAnimationFrame(animate);

      /* Update particle positions */
      for (let i = 0; i < N_PARTICLES; i++) {
        pPos[i * 3] = (1 - t) * x0[i * 3] + t * x1[i * 3];
        pPos[i * 3 + 1] = (1 - t) * x0[i * 3 + 1] + t * x1[i * 3 + 1];
        pPos[i * 3 + 2] = (1 - t) * x0[i * 3 + 2] + t * x1[i * 3 + 2];
      }
      pGeo.attributes.position.needsUpdate = true;

      /* Update arrows */
      if (showArrows) {
        for (const ad of arrowData) {
          const [vx, vy, vz] = computeVelocityAt(ad.ox, ad.oy, ad.oz, t);
          const mag = Math.sqrt(vx * vx + vy * vy + vz * vz);
          const scale = Math.min(mag * 0.3, 0.8);
          const nx = vx / (mag + 1e-8), ny = vy / (mag + 1e-8), nz = vz / (mag + 1e-8);

          ad.linePos[0] = ad.ox; ad.linePos[1] = ad.oy; ad.linePos[2] = ad.oz;
          ad.linePos[3] = ad.ox + nx * scale;
          ad.linePos[4] = ad.oy + ny * scale;
          ad.linePos[5] = ad.oz + nz * scale;
          ad.line.geometry.attributes.position.needsUpdate = true;

          ad.cone.position.set(
            ad.ox + nx * scale, ad.oy + ny * scale, ad.oz + nz * scale
          );
          ad.cone.lookAt(ad.ox + nx * (scale + 1), ad.oy + ny * (scale + 1), ad.oz + nz * (scale + 1));
          ad.cone.rotateX(Math.PI / 2);

          const hue = 0.5 + mag * 0.1;
          const color = new THREE.Color().setHSL(hue % 1, 0.8, 0.6);
          ad.line.material.color = color;
          ad.cone.material.color = color;
          ad.line.material.opacity = 0.3 + Math.min(mag * 0.15, 0.5);
        }
      }

      const groupRot = rot.y + Date.now() * 0.00005;
      particles.rotation.set(rot.x, groupRot, 0);
      arrowGroup.rotation.set(rot.x, groupRot, 0);
      pathGroup.rotation.set(rot.x, groupRot, 0);

      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener("resize", () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     BLOG HERO: Flowing particles background
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

    const N = 1200;
    const rng = seededRandom(77);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const velocities = new Float32Array(N * 3);

    for (let i = 0; i < N; i++) {
      const [g1, g2] = gaussianPair(rng);
      const [g3] = gaussianPair(rng);
      pos[i * 3] = g1 * 2.5;
      pos[i * 3 + 1] = g2 * 2.5;
      pos[i * 3 + 2] = g3 * 1.5;

      const cid = Math.floor(rng() * 5);
      const c = new THREE.Color(PALETTE[cid]);
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
          if (entry.target.id === "transportCanvas") {
            initTransportDemo();
            observer.unobserve(entry.target);
          }
          if (entry.target.id === "velocityCanvas") {
            initVelocityDemo();
            observer.unobserve(entry.target);
          }
        }
      });
    }, { rootMargin: "200px" });

    const tc = document.getElementById("transportCanvas");
    const vc = document.getElementById("velocityCanvas");
    if (tc) observer.observe(tc);
    if (vc) observer.observe(vc);
  });

})();
