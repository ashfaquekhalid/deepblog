/* ═══════════════════════════════════════════════════════════════════════════
   Brain & Consciousness Landing — 3D Brain Structure Animation (Three.js)
   Particle cloud forming a brain shape with labeled regions and synaptic firing
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  if (typeof THREE === "undefined") return;

  const canvas = document.getElementById("brainHeroCanvas");
  if (!canvas) return;

  const parent = canvas.parentElement;
  let W = parent.clientWidth, H = parent.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
  camera.position.set(0, 0, 8);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  function seededRandom(seed) {
    let s = seed;
    return function () {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  const rng = seededRandom(42);

  /* Brain surface approximation using ellipsoids */
  const BRAIN_REGIONS = [
    { name: "Frontal Lobe", cx: 0, cy: 0.8, cz: 1.2, rx: 1.4, ry: 1.0, rz: 0.9, color: 0xba68c8, particles: 350 },
    { name: "Parietal Lobe", cx: 0, cy: 1.2, cz: -0.3, rx: 1.3, ry: 0.7, rz: 1.0, color: 0xf472b6, particles: 280 },
    { name: "Temporal Lobe", cx: 1.5, cy: -0.5, cz: 0.3, rx: 0.8, ry: 0.7, rz: 1.2, color: 0x7c3aed, particles: 200 },
    { name: "Temporal (L)", cx: -1.5, cy: -0.5, cz: 0.3, rx: 0.8, ry: 0.7, rz: 1.2, color: 0x7c3aed, particles: 200 },
    { name: "Occipital Lobe", cx: 0, cy: 0.3, cz: -1.5, rx: 1.0, ry: 0.8, rz: 0.6, color: 0x4fc3f7, particles: 200 },
    { name: "Cerebellum", cx: 0, cy: -1.2, cz: -1.2, rx: 1.2, ry: 0.6, rz: 0.7, color: 0x34d399, particles: 250 },
    { name: "Brain Stem", cx: 0, cy: -1.5, cz: -0.3, rx: 0.4, ry: 0.8, rz: 0.4, color: 0xfb923c, particles: 120 },
  ];

  const brainGroup = new THREE.Group();
  scene.add(brainGroup);

  const allPositions = [];
  const allColors = [];
  const regionIndices = [];

  BRAIN_REGIONS.forEach((region, ri) => {
    for (let i = 0; i < region.particles; i++) {
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const r = 0.85 + rng() * 0.15;

      const x = region.cx + region.rx * r * Math.sin(phi) * Math.cos(theta);
      const y = region.cy + region.ry * r * Math.sin(phi) * Math.sin(theta);
      const z = region.cz + region.rz * r * Math.cos(phi);

      allPositions.push(x, y, z);
      const col = new THREE.Color(region.color);
      allColors.push(col.r, col.g, col.b);
      regionIndices.push(ri);
    }
  });

  const N = allPositions.length / 3;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(allPositions);
  const colors = new Float32Array(allColors);
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  brainGroup.add(points);

  /* Synapse pulses — glowing connections firing between regions */
  const SYNAPSE_COUNT = 20;
  const synapses = [];
  const synapseGeo = new THREE.SphereGeometry(0.05, 6, 6);

  function randomPoint() {
    const i = Math.floor(rng() * N) * 3;
    return new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
  }

  for (let i = 0; i < SYNAPSE_COUNT; i++) {
    const start = randomPoint();
    const end = randomPoint();
    const color = BRAIN_REGIONS[Math.floor(rng() * BRAIN_REGIONS.length)].color;

    const pulseMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const pulse = new THREE.Mesh(synapseGeo, pulseMat);
    brainGroup.add(pulse);

    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(60);
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
    const trailMat = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });
    const trail = new THREE.Line(trailGeo, trailMat);
    brainGroup.add(trail);

    synapses.push({
      pulse, trail, trailPos,
      start, end,
      mid: new THREE.Vector3(
        (start.x + end.x) / 2 + (rng() - 0.5) * 1.5,
        (start.y + end.y) / 2 + (rng() - 0.5) * 1.5,
        (start.z + end.z) / 2 + (rng() - 0.5) * 1.5
      ),
      progress: rng(),
      speed: 0.005 + rng() * 0.01,
      history: [],
    });
  }

  /* Labels using CSS overlay */
  const labelContainer = document.createElement("div");
  labelContainer.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;";
  parent.appendChild(labelContainer);

  const labelData = [
    { name: "Frontal Lobe", pos: new THREE.Vector3(0, 0.8, 1.2), color: "#ba68c8" },
    { name: "Parietal", pos: new THREE.Vector3(0, 1.5, -0.3), color: "#f472b6" },
    { name: "Temporal", pos: new THREE.Vector3(2.0, -0.5, 0.3), color: "#7c3aed" },
    { name: "Occipital", pos: new THREE.Vector3(0, 0.3, -2.0), color: "#4fc3f7" },
    { name: "Cerebellum", pos: new THREE.Vector3(0, -1.5, -1.2), color: "#34d399" },
    { name: "Brain Stem", pos: new THREE.Vector3(0.5, -2.0, -0.3), color: "#fb923c" },
  ];

  const labels = labelData.map(ld => {
    const el = document.createElement("div");
    el.textContent = ld.name;
    el.style.cssText = `
      position: absolute; font-family: 'JetBrains Mono', monospace; font-size: 0.65rem;
      color: ${ld.color}; opacity: 0.6; letter-spacing: 0.08em; text-transform: uppercase;
      font-weight: 600; white-space: nowrap; text-shadow: 0 0 8px ${ld.color}40;
      transition: opacity 0.3s;
    `;
    labelContainer.appendChild(el);
    return { el, pos: ld.pos.clone() };
  });

  let mouseX = 0, mouseY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const tempV = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    const t = Date.now() * 0.001;

    brainGroup.rotation.y = t * 0.15 + mouseX * 0.3;
    brainGroup.rotation.x = Math.sin(t * 0.3) * 0.1 - mouseY * 0.15;

    const posArr = geo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      const wave = Math.sin(t * 1.2 + i * 0.01) * 0.01;
      posArr[i * 3 + 1] = allPositions[i * 3 + 1] + wave;
    }
    geo.attributes.position.needsUpdate = true;

    synapses.forEach(s => {
      s.progress += s.speed;
      if (s.progress > 1) {
        s.progress = 0;
        s.start = randomPoint();
        s.end = randomPoint();
        s.mid.set(
          (s.start.x + s.end.x) / 2 + (rng() - 0.5) * 1.5,
          (s.start.y + s.end.y) / 2 + (rng() - 0.5) * 1.5,
          (s.start.z + s.end.z) / 2 + (rng() - 0.5) * 1.5
        );
        s.history = [];
      }

      const p = s.progress;
      const ip = 1 - p;
      const bx = ip * ip * s.start.x + 2 * ip * p * s.mid.x + p * p * s.end.x;
      const by = ip * ip * s.start.y + 2 * ip * p * s.mid.y + p * p * s.end.y;
      const bz = ip * ip * s.start.z + 2 * ip * p * s.mid.z + p * p * s.end.z;

      s.pulse.position.set(bx, by, bz);
      s.pulse.material.opacity = Math.sin(p * Math.PI) * 0.8;

      s.history.push(bx, by, bz);
      if (s.history.length > 60) s.history = s.history.slice(-60);
      s.trailPos.fill(0);
      for (let j = 0; j < s.history.length; j++) s.trailPos[j] = s.history[j];
      s.trail.geometry.setDrawRange(0, s.history.length / 3);
      s.trail.geometry.attributes.position.needsUpdate = true;
    });

    labels.forEach(l => {
      tempV.copy(l.pos);
      tempV.applyMatrix4(brainGroup.matrixWorld);
      tempV.project(camera);

      const x = (tempV.x * 0.5 + 0.5) * W;
      const y = (-tempV.y * 0.5 + 0.5) * H;
      l.el.style.left = x + "px";
      l.el.style.top = y + "px";
      l.el.style.opacity = tempV.z < 1 ? "0.55" : "0";
    });

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    W = parent.clientWidth;
    H = parent.clientHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
})();
