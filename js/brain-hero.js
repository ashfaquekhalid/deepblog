/* ═══════════════════════════════════════════════════════════════════════════
   Brain & Consciousness Landing — 3D Brain Structure Animation (Three.js)
   Large particle cloud forming a brain shape with labeled regions, synaptic
   firing, and glowing region boundaries
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  if (typeof THREE === "undefined") return;

  const canvas = document.getElementById("brainHeroCanvas");
  if (!canvas) return;

  const parent = canvas.parentElement;
  let W = parent.clientWidth, H = parent.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 0.5, 7);

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

  const SCALE = 1.4;

  const BRAIN_REGIONS = [
    { name: "Frontal Lobe",   cx: 0,     cy: 0.9,  cz: 1.3,  rx: 1.6, ry: 1.1, rz: 1.0, color: 0xba68c8, particles: 600 },
    { name: "Parietal Lobe",  cx: 0,     cy: 1.4,  cz: -0.3, rx: 1.5, ry: 0.8, rz: 1.1, color: 0xf472b6, particles: 500 },
    { name: "Temporal Lobe",  cx: 1.6,   cy: -0.5, cz: 0.3,  rx: 0.9, ry: 0.8, rz: 1.3, color: 0x7c3aed, particles: 400 },
    { name: "Temporal (L)",   cx: -1.6,  cy: -0.5, cz: 0.3,  rx: 0.9, ry: 0.8, rz: 1.3, color: 0x7c3aed, particles: 400 },
    { name: "Occipital Lobe", cx: 0,     cy: 0.3,  cz: -1.6, rx: 1.1, ry: 0.9, rz: 0.7, color: 0x4fc3f7, particles: 350 },
    { name: "Cerebellum",     cx: 0,     cy: -1.3, cz: -1.3, rx: 1.3, ry: 0.7, rz: 0.8, color: 0x34d399, particles: 400 },
    { name: "Brain Stem",     cx: 0,     cy: -1.8, cz: -0.3, rx: 0.45,ry: 0.9, rz: 0.45,color: 0xfb923c, particles: 200 },
  ];

  const brainGroup = new THREE.Group();
  brainGroup.scale.set(SCALE, SCALE, SCALE);
  scene.add(brainGroup);

  const allPositions = [];
  const allColors = [];
  const regionIndices = [];

  BRAIN_REGIONS.forEach((region, ri) => {
    for (let i = 0; i < region.particles; i++) {
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const r = 0.82 + rng() * 0.18;

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
    size: 0.055,
    vertexColors: true,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  brainGroup.add(points);

  /* Region glow shells */
  BRAIN_REGIONS.forEach(region => {
    const avg = (region.rx + region.ry + region.rz) / 3;
    const shellGeo = new THREE.SphereGeometry(avg * 0.95, 16, 16);
    const shellMat = new THREE.MeshBasicMaterial({
      color: region.color, transparent: true, opacity: 0.03,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    shell.position.set(region.cx, region.cy, region.cz);
    brainGroup.add(shell);
  });

  /* Synapse pulses */
  const SYNAPSE_COUNT = 30;
  const synapses = [];
  const synapseGeo = new THREE.SphereGeometry(0.06, 8, 8);

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
    const trailPos = new Float32Array(90);
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
    const trailMat = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const trail = new THREE.Line(trailGeo, trailMat);
    brainGroup.add(trail);

    synapses.push({
      pulse, trail, trailPos,
      start, end,
      mid: new THREE.Vector3(
        (start.x + end.x) / 2 + (rng() - 0.5) * 2,
        (start.y + end.y) / 2 + (rng() - 0.5) * 2,
        (start.z + end.z) / 2 + (rng() - 0.5) * 2
      ),
      progress: rng(),
      speed: 0.004 + rng() * 0.008,
      history: [],
    });
  }

  /* Labels using CSS overlay */
  const labelContainer = document.createElement("div");
  labelContainer.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;overflow:hidden;";
  parent.appendChild(labelContainer);

  const labelData = [
    { name: "Frontal Lobe",   pos: new THREE.Vector3(0, 0.9, 1.6),    color: "#ba68c8" },
    { name: "Parietal Lobe",  pos: new THREE.Vector3(0, 1.8, -0.3),   color: "#f472b6" },
    { name: "Temporal Lobe",  pos: new THREE.Vector3(2.2, -0.5, 0.3), color: "#7c3aed" },
    { name: "Occipital Lobe", pos: new THREE.Vector3(0, 0.3, -2.2),   color: "#4fc3f7" },
    { name: "Cerebellum",     pos: new THREE.Vector3(0, -1.8, -1.3),  color: "#34d399" },
    { name: "Brain Stem",     pos: new THREE.Vector3(0.6, -2.3, -0.3),color: "#fb923c" },
  ];

  const labels = labelData.map(ld => {
    const el = document.createElement("div");
    el.innerHTML = `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${ld.color};margin-right:6px;box-shadow:0 0 6px ${ld.color};vertical-align:middle;"></span>${ld.name}`;
    el.style.cssText = `
      position: absolute;
      font-family: 'Space Grotesk', 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: #fff;
      opacity: 0;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-weight: 600;
      white-space: nowrap;
      text-shadow: 0 0 12px ${ld.color}, 0 0 4px rgba(0,0,0,0.8);
      padding: 3px 10px 3px 6px;
      background: rgba(6, 6, 14, 0.55);
      border: 1px solid ${ld.color}33;
      border-radius: 6px;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      transition: opacity 0.4s ease;
      transform: translateX(-50%);
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

    brainGroup.rotation.y = t * 0.12 + mouseX * 0.3;
    brainGroup.rotation.x = Math.sin(t * 0.25) * 0.12 - mouseY * 0.15;

    const posArr = geo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      const wave = Math.sin(t * 1.0 + i * 0.008) * 0.015;
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
          (s.start.x + s.end.x) / 2 + (rng() - 0.5) * 2,
          (s.start.y + s.end.y) / 2 + (rng() - 0.5) * 2,
          (s.start.z + s.end.z) / 2 + (rng() - 0.5) * 2
        );
        s.history = [];
      }

      const p = s.progress;
      const ip = 1 - p;
      const bx = ip * ip * s.start.x + 2 * ip * p * s.mid.x + p * p * s.end.x;
      const by = ip * ip * s.start.y + 2 * ip * p * s.mid.y + p * p * s.end.y;
      const bz = ip * ip * s.start.z + 2 * ip * p * s.mid.z + p * p * s.end.z;

      s.pulse.position.set(bx, by, bz);
      s.pulse.material.opacity = Math.sin(p * Math.PI) * 0.9;

      s.history.push(bx, by, bz);
      if (s.history.length > 90) s.history = s.history.slice(-90);
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

      const facing = tempV.z < 1;
      const dotProduct = tempV.z;
      l.el.style.opacity = facing ? Math.max(0.15, Math.min(0.92, 1.5 - dotProduct * 2)) : "0";
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
