/* ===========================================================================
   Brain & Consciousness Hero (Three.js)
   Simple, meaningful technical visual:
   - brain-shaped neural graph (nodes + links)
   - subtle data pulses traveling through connections
   - lightweight and readable for a technical blog vibe
   =========================================================================== */
(function () {
  if (typeof THREE === "undefined") return;

  const canvas = document.getElementById("brainHeroCanvas");
  if (!canvas) return;

  const parent = canvas.parentElement;
  let W = parent.clientWidth;
  let H = parent.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
  camera.position.set(0, 0.2, 6.9);

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

  const brainGroup = new THREE.Group();
  scene.add(brainGroup);

  function sampleHemisphere(side, count) {
    const pts = [];
    let attempts = 0;
    while (pts.length < count && attempts < count * 80) {
      attempts += 1;
      const x = (rng() * 2 - 1) * 2.1;
      const y = (rng() * 2 - 1) * 1.8;
      const z = (rng() * 2 - 1) * 1.6;

      const cx = side * 0.95;
      const dx = (x - cx) / 1.28;
      const dy = y / 1.45;
      const dz = z / 1.08;
      if (dx * dx + dy * dy + dz * dz > 1) continue;

      /* keep center split visible */
      if (Math.abs(x) < 0.14 && y > -0.15) continue;

      /* temporal lobe area */
      if (y < -0.35 && Math.abs(x - cx) < 0.7) {
        if (rng() < 0.4) continue;
      }

      /* frontal taper */
      if (z > 0.95 && Math.abs(x - cx) > 0.75) continue;

      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }

  const leftNodes = sampleHemisphere(-1, 170);
  const rightNodes = sampleHemisphere(1, 170);
  const stemNodes = [];
  for (let i = 0; i < 36; i++) {
    stemNodes.push(
      new THREE.Vector3(
        (rng() - 0.5) * 0.32,
        -1.4 - rng() * 1.0,
        -0.32 + (rng() - 0.5) * 0.32
      )
    );
  }
  const cerebellumNodes = [];
  for (let i = 0; i < 52; i++) {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng());
    const x = Math.cos(a) * 0.95 * r;
    const y = Math.sin(a) * 0.45 * r;
    const z = (rng() * 2 - 1) * 0.55 * r;
    cerebellumNodes.push(new THREE.Vector3(x, y, z).add(new THREE.Vector3(0, -1.2, -1.0)));
  }

  const nodes = [...leftNodes, ...rightNodes, ...cerebellumNodes, ...stemNodes];

  const nodePos = new Float32Array(nodes.length * 3);
  const nodeColor = new Float32Array(nodes.length * 3);
  for (let i = 0; i < nodes.length; i++) {
    const p = nodes[i];
    nodePos[i * 3] = p.x;
    nodePos[i * 3 + 1] = p.y;
    nodePos[i * 3 + 2] = p.z;

    const c =
      p.y < -1.35
        ? new THREE.Color(0xfb923c)
        : p.y < -0.95
          ? new THREE.Color(0x34d399)
          : p.x < 0
            ? new THREE.Color(0x4fc3f7)
            : new THREE.Color(0x7c3aed);
    nodeColor[i * 3] = c.r;
    nodeColor[i * 3 + 1] = c.g;
    nodeColor[i * 3 + 2] = c.b;
  }

  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
  nodeGeo.setAttribute("color", new THREE.BufferAttribute(nodeColor, 3));
  const nodeMat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const nodeCloud = new THREE.Points(nodeGeo, nodeMat);
  brainGroup.add(nodeCloud);

  const connections = [];
  const lineVerts = [];
  const maxDist = 0.58;
  for (let i = 0; i < nodes.length; i++) {
    const near = [];
    for (let j = i + 1; j < nodes.length; j++) {
      const d = nodes[i].distanceTo(nodes[j]);
      if (d < maxDist) near.push({ j, d });
    }
    near.sort((a, b) => a.d - b.d);
    const keep = near.slice(0, 2);
    for (let k = 0; k < keep.length; k++) {
      const j = keep[k].j;
      lineVerts.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
      connections.push({ a: nodes[i], b: nodes[j] });
    }
  }

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(lineVerts, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x9fc3ff,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const network = new THREE.LineSegments(lineGeo, lineMat);
  brainGroup.add(network);

  /* central split line for clear brain silhouette */
  const fissureCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.35, 0.85),
    new THREE.Vector3(0, 0.6, 0.25),
    new THREE.Vector3(0, -0.15, -0.15),
    new THREE.Vector3(0, -0.65, -0.8),
  ]);
  const fissureGeo = new THREE.BufferGeometry().setFromPoints(fissureCurve.getPoints(42));
  const fissure = new THREE.Line(
    fissureGeo,
    new THREE.LineBasicMaterial({
      color: 0xf472b6,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  brainGroup.add(fissure);

  const pulseGeo = new THREE.SphereGeometry(0.03, 8, 8);
  const pulses = [];
  for (let i = 0; i < 18; i++) {
    const p = new THREE.Mesh(
      pulseGeo,
      new THREE.MeshBasicMaterial({
        color: 0xe0f6ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })
    );
    brainGroup.add(p);
    pulses.push({
      mesh: p,
      idx: Math.floor(rng() * Math.max(connections.length, 1)),
      t: rng(),
      speed: 0.006 + rng() * 0.008,
    });
  }

  const labelContainer = document.createElement("div");
  labelContainer.style.cssText =
    "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;overflow:hidden;";
  parent.appendChild(labelContainer);

  const labelData = [
    { name: "Signal Flow", pos: new THREE.Vector3(1.65, 0.85, 0.5), color: "#7c3aed" },
    { name: "Neural Graph", pos: new THREE.Vector3(-1.6, 0.2, 0.5), color: "#4fc3f7" },
    { name: "Feedback Loops", pos: new THREE.Vector3(0.9, -1.55, -0.7), color: "#34d399" },
  ];
  const labels = labelData.map((l) => {
    const el = document.createElement("div");
    el.innerHTML =
      `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${l.color};` +
      `margin-right:6px;box-shadow:0 0 7px ${l.color};vertical-align:middle;"></span>${l.name}`;
    el.style.cssText = `
      position:absolute;
      font-family:'Space Grotesk',sans-serif;
      font-size:0.78rem;
      color:#fff;
      opacity:0;
      letter-spacing:0.06em;
      text-transform:uppercase;
      font-weight:700;
      white-space:nowrap;
      text-shadow:0 0 14px ${l.color},0 2px 6px rgba(0,0,0,0.95);
      padding:4px 10px 4px 8px;
      background:rgba(6,6,14,0.72);
      border:1px solid ${l.color}80;
      border-radius:6px;
      backdrop-filter:blur(8px);
      -webkit-backdrop-filter:blur(8px);
      transition:opacity 0.35s ease;
      transform:translateX(-50%);
    `;
    labelContainer.appendChild(el);
    return { el, pos: l.pos.clone() };
  });

  let mouseX = 0;
  let mouseY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const temp = new THREE.Vector3();

  const baseScale = 1.08;

  function animate() {
    requestAnimationFrame(animate);
    const t = Date.now() * 0.001;

    brainGroup.rotation.y = t * 0.12 + Math.sin(t * 0.52) * 0.3 + mouseX * 0.2;
    brainGroup.rotation.x = Math.sin(t * 0.34) * 0.085 - mouseY * 0.09;
    const breathe = baseScale + Math.sin(t * 1.6) * 0.018;
    brainGroup.scale.setScalar(breathe);

    nodeMat.opacity = 0.72 + Math.sin(t * 2.3) * 0.08;
    lineMat.opacity = 0.12 + Math.sin(t * 1.7) * 0.03;

    for (let i = 0; i < pulses.length; i++) {
      if (!connections.length) continue;
      const p = pulses[i];
      p.t += p.speed;
      if (p.t > 1) {
        p.idx = Math.floor(rng() * connections.length);
        p.t = 0;
      }
      const c = connections[p.idx];
      p.mesh.position.lerpVectors(c.a, c.b, p.t);
      p.mesh.material.opacity = Math.sin(p.t * Math.PI) * 0.85;
    }

    for (let i = 0; i < labels.length; i++) {
      const l = labels[i];
      temp.copy(l.pos).applyMatrix4(brainGroup.matrixWorld).project(camera);
      l.el.style.left = (temp.x * 0.5 + 0.5) * W + "px";
      l.el.style.top = (-temp.y * 0.5 + 0.5) * H + "px";
      l.el.style.opacity =
        temp.z < 1 ? String(Math.max(0.32, Math.min(1, 1.32 - temp.z * 1.45))) : "0";
    }

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
