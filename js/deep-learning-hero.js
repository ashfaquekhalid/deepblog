/* ═══════════════════════════════════════════════════════════════════════════
   Deep Learning Landing — Neural Network Hero Animation (Three.js)
   Animated nodes in layers with pulsing connections and data flowing forward
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  if (typeof THREE === "undefined") return;

  const canvas = document.getElementById("dlHeroCanvas");
  if (!canvas) return;

  const parent = canvas.parentElement;
  let W = parent.clientWidth, H = parent.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
  camera.position.set(0, 0, 14);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const LAYERS = [4, 8, 12, 16, 12, 8, 4];
  const LAYER_SPACING = 3.2;
  const NODE_RADIUS = 0.12;
  const COLORS = [0x00d4ff, 0x7c3aed, 0xf472b6, 0x34d399, 0xfb923c];

  const nodes = [];
  const nodeGroup = new THREE.Group();
  scene.add(nodeGroup);

  const totalWidth = (LAYERS.length - 1) * LAYER_SPACING;

  LAYERS.forEach((count, li) => {
    const x = li * LAYER_SPACING - totalWidth / 2;
    const layerHeight = (count - 1) * 0.7;
    for (let ni = 0; ni < count; ni++) {
      const y = ni * 0.7 - layerHeight / 2;
      const geo = new THREE.SphereGeometry(NODE_RADIUS, 12, 12);
      const mat = new THREE.MeshBasicMaterial({
        color: COLORS[li % COLORS.length],
        transparent: true,
        opacity: 0.7,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0);
      nodeGroup.add(mesh);

      const glowGeo = new THREE.SphereGeometry(NODE_RADIUS * 2.5, 12, 12);
      const glowMat = new THREE.MeshBasicMaterial({
        color: COLORS[li % COLORS.length],
        transparent: true,
        opacity: 0.08,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(mesh.position);
      nodeGroup.add(glow);

      nodes.push({ mesh, glow, layer: li, idx: ni, baseY: y, x });
    }
  });

  const connections = [];
  const connGroup = new THREE.Group();
  scene.add(connGroup);

  for (let li = 0; li < LAYERS.length - 1; li++) {
    const currentLayer = nodes.filter(n => n.layer === li);
    const nextLayer = nodes.filter(n => n.layer === li + 1);

    const step = Math.max(1, Math.floor(currentLayer.length * nextLayer.length / 60));
    let idx = 0;

    for (const src of currentLayer) {
      for (const dst of nextLayer) {
        idx++;
        if (idx % step !== 0) continue;

        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(6);
        pos[0] = src.x; pos[1] = src.baseY; pos[2] = 0;
        pos[3] = dst.x; pos[4] = dst.baseY; pos[5] = 0;
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.LineBasicMaterial({
          color: 0x00d4ff,
          transparent: true,
          opacity: 0.04,
          blending: THREE.AdditiveBlending,
        });
        const line = new THREE.Line(geo, mat);
        connGroup.add(line);
        connections.push({ line, src, dst, mat });
      }
    }
  }

  const PULSE_COUNT = 25;
  const pulses = [];
  const pulseGeo = new THREE.SphereGeometry(0.06, 8, 8);

  function spawnPulse() {
    const li = Math.floor(Math.random() * (LAYERS.length - 1));
    const currentLayer = nodes.filter(n => n.layer === li);
    const nextLayer = nodes.filter(n => n.layer === li + 1);
    const src = currentLayer[Math.floor(Math.random() * currentLayer.length)];
    const dst = nextLayer[Math.floor(Math.random() * nextLayer.length)];
    const color = COLORS[li % COLORS.length];

    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(pulseGeo, mat);
    nodeGroup.add(mesh);

    return {
      mesh, src, dst,
      progress: 0,
      speed: 0.008 + Math.random() * 0.012,
      color,
    };
  }

  for (let i = 0; i < PULSE_COUNT; i++) {
    const p = spawnPulse();
    p.progress = Math.random();
    pulses.push(p);
  }

  let mouseX = 0, mouseY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function animate() {
    requestAnimationFrame(animate);

    const t = Date.now() * 0.001;

    nodes.forEach(n => {
      const wave = Math.sin(t * 0.8 + n.layer * 0.5 + n.idx * 0.3) * 0.08;
      n.mesh.position.y = n.baseY + wave;
      n.glow.position.y = n.baseY + wave;

      const pulse = 0.7 + Math.sin(t * 2 + n.layer + n.idx * 0.7) * 0.15;
      n.mesh.material.opacity = pulse;
      n.glow.material.opacity = 0.05 + Math.sin(t * 1.5 + n.idx) * 0.03;
    });

    pulses.forEach(p => {
      p.progress += p.speed;
      if (p.progress >= 1) {
        p.progress = 0;
        const li = Math.floor(Math.random() * (LAYERS.length - 1));
        const cl = nodes.filter(n => n.layer === li);
        const nl = nodes.filter(n => n.layer === li + 1);
        p.src = cl[Math.floor(Math.random() * cl.length)];
        p.dst = nl[Math.floor(Math.random() * nl.length)];
        p.mesh.material.color.setHex(COLORS[li % COLORS.length]);
      }
      const t2 = p.progress;
      p.mesh.position.lerpVectors(p.src.mesh.position, p.dst.mesh.position, t2);
      p.mesh.material.opacity = Math.sin(t2 * Math.PI) * 0.9;
    });

    connections.forEach(c => {
      const pos = c.line.geometry.attributes.position.array;
      pos[1] = c.src.mesh.position.y;
      pos[4] = c.dst.mesh.position.y;
      c.line.geometry.attributes.position.needsUpdate = true;
    });

    nodeGroup.rotation.y = mouseX * 0.15 + Math.sin(t * 0.2) * 0.05;
    nodeGroup.rotation.x = -mouseY * 0.08;
    connGroup.rotation.copy(nodeGroup.rotation);

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
