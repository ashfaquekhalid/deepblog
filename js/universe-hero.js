/* ===========================================================================
   Universe Hero — Spacetime Fabric (Three.js)
   Full-block animated spacetime grid with:
   - Static gravity well around a compact object
   - Occasional quadrupole-like wave packets
   - Subtle star field behind
   - Mouse-interactive camera tilt
   =========================================================================== */
(function () {
  if (typeof THREE === "undefined") return;

  const canvas = document.getElementById("universeHeroCanvas");
  if (!canvas) return;

  const parent = canvas.parentElement;
  let W = parent.clientWidth;
  let H = parent.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 300);
  const CAMERA_BASE = { x: 0, y: 9.2, z: 13.9 };
  camera.position.set(CAMERA_BASE.x, CAMERA_BASE.y, CAMERA_BASE.z);
  camera.lookAt(0, -2.8, 0);

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

  /* ── Stars ─────────────────────────────────────────────────────────────── */
  const STAR_COUNT = 1600;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(STAR_COUNT * 3);
  const starCol = new Float32Array(STAR_COUNT * 3);

  for (let i = 0; i < STAR_COUNT; i++) {
    const r = 40 + rng() * 80;
    const theta = Math.acos(2 * rng() - 1);
    const phi = rng() * Math.PI * 2;
    starPos[i * 3] = r * Math.sin(theta) * Math.cos(phi);
    starPos[i * 3 + 1] = r * Math.cos(theta);
    starPos[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);

    const warm = rng() > 0.5;
    starCol[i * 3] = warm ? 1.0 : 0.7;
    starCol[i * 3 + 1] = warm ? 0.92 : 0.8;
    starCol[i * 3 + 2] = warm ? 0.78 : 1.0;
  }

  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.07,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  scene.add(new THREE.Points(starGeo, starMat));

  /* ── Spacetime grid ────────────────────────────────────────────────────── */
  const GRID = 120;
  const SIZE = 56;
  const fabricGeo = new THREE.PlaneGeometry(SIZE, SIZE, GRID, GRID);
  fabricGeo.rotateX(-Math.PI / 2);
  const pos = fabricGeo.attributes.position;

  const fabricMat = new THREE.MeshBasicMaterial({
    color: 0x4f8aff,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const fabric = new THREE.Mesh(fabricGeo, fabricMat);
  scene.add(fabric);

  /* Second slightly offset grid for depth feel */
  const fabric2Mat = new THREE.MeshBasicMaterial({
    color: 0x7c3aed,
    wireframe: true,
    transparent: true,
    opacity: 0.06,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const fabric2Geo = fabricGeo.clone();
  const fabric2 = new THREE.Mesh(fabric2Geo, fabric2Mat);
  fabric2.position.y = -0.15;
  scene.add(fabric2);

  /* ── Gravity well glow at center ───────────────────────────────────────── */
  const wellGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 24, 24),
    new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  wellGlow.position.y = -5.4;
  scene.add(wellGlow);

  const wellCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.56, 20, 20),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  wellCore.position.y = -5.4;
  scene.add(wellCore);

  /* ── Concentric ring lines on the grid surface ─────────────────────────── */
  const ringColors = [0x4fc3f7, 0x7c3aed, 0xf472b6];
  for (let r = 0; r < 3; r++) {
    const radius = 4 + r * 4.5;
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const rGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const rLine = new THREE.Line(
      rGeo,
      new THREE.LineBasicMaterial({
        color: ringColors[r],
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    scene.add(rLine);
  }

  /* ── Update function ───────────────────────────────────────────────────── */
  const MASS = 7.8;
  const WELL_SOFTENING = 1.9;
  const WELL_FALLOFF = 0.048;
  const BROAD_CURVE_STRENGTH = 1.15;
  const BROAD_CURVE_RADIUS = 14.5;

  // Sparse transient packets mimic merger-like gravitational-wave bursts.
  const packets = [];
  const PACKET_MAX_AGE = 13;
  const PACKET_MIN_GAP = 5.2;
  const PACKET_MAX_GAP = 9.0;
  let nextPacketAt = 1.2 + rng() * 1.8;

  function spawnPacket(t) {
    packets.push({
      t0: t,
      phase: rng() * Math.PI,
      amp: 0.045 + rng() * 0.02,
      speed: 2.6 + rng() * 0.5,
      width: 1.2 + rng() * 0.5,
      decay: 0.24 + rng() * 0.08,
    });
    nextPacketAt = t + PACKET_MIN_GAP + rng() * (PACKET_MAX_GAP - PACKET_MIN_GAP);
  }

  function packetWave(p, r, theta, t) {
    const age = t - p.t0;
    if (age <= 0 || age > PACKET_MAX_AGE) return 0;

    const front = p.speed * age;
    const shell =
      Math.exp(-Math.pow(r - front, 2) / (2 * p.width * p.width)) +
      0.45 * Math.exp(-Math.pow(r - (front - 2.2), 2) / (2 * (p.width * 1.6) * (p.width * 1.6)));
    const angular = Math.cos(2 * (theta - p.phase)); // quadrupole pattern
    const temporal = Math.exp(-age * p.decay);

    return p.amp * shell * angular * temporal;
  }

  function latestPacketFlash(t) {
    let flash = 0;
    for (let i = 0; i < packets.length; i++) {
      const age = t - packets[i].t0;
      if (age >= 0 && age < 2.8) {
        flash = Math.max(flash, Math.exp(-age * 1.6));
      }
    }
    return flash;
  }

  function updateFabric(t) {
    if (t >= nextPacketAt && packets.length < 3) {
      spawnPacket(t);
    }

    for (let i = packets.length - 1; i >= 0; i--) {
      if (t - packets[i].t0 > PACKET_MAX_AGE) packets.splice(i, 1);
    }

    const p = fabricGeo.attributes.position;
    const p2 = fabric2Geo.attributes.position;

    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const r = Math.sqrt(x * x + z * z);
      const theta = Math.atan2(z, x);

      // Mostly static potential well; dampened outward for visual stability.
      const compactWell =
        (-MASS / Math.sqrt(r * r + WELL_SOFTENING)) *
        Math.exp(-r * WELL_FALLOFF);
      const broadWell =
        -BROAD_CURVE_STRENGTH *
        Math.exp(-(r * r) / (BROAD_CURVE_RADIUS * BROAD_CURVE_RADIUS));
      const well = compactWell + broadWell;

      let wave = 0;
      for (let k = 0; k < packets.length; k++) {
        wave += packetWave(packets[k], r, theta, t);
      }

      const tidal =
        Math.sin(r * 0.58 - t * 0.5 + theta * 0.8) *
        0.014 *
        Math.exp(-r * 0.05);

      const y = well + wave + tidal;

      p.setY(i, y);
      p2.setY(i, y - 0.15);
    }

    p.needsUpdate = true;
    p2.needsUpdate = true;
  }

  /* ── Animation ─────────────────────────────────────────────────────────── */
  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    updateFabric(t);
    const flash = latestPacketFlash(t);

    /* Breathing glow */
    wellGlow.material.opacity = 0.07 + Math.sin(t * 0.7) * 0.015 + flash * 0.04;
    wellCore.material.opacity = 0.16 + Math.sin(t * 1.1) * 0.02 + flash * 0.16;
    wellGlow.scale.setScalar(0.98 + Math.sin(t * 0.9) * 0.03 + flash * 0.08);

    /* Subtle emissive variation */
    fabricMat.opacity = 0.155 + Math.sin(t * 0.35) * 0.012 + flash * 0.02;
    fabric2Mat.opacity = 0.06 + Math.sin(t * 0.22 + 1.4) * 0.008 + flash * 0.012;

    /* Subtle global motion so scene stays alive */
    fabric.rotation.y = Math.sin(t * 0.06) * 0.018;
    fabric2.rotation.y = -Math.sin(t * 0.06) * 0.024;

    /* Gentle camera sway + mouse response (zoomed toward curved well) */
    camera.position.x = CAMERA_BASE.x + Math.sin(t * 0.12) * 1.0 + mouseX * 1.9;
    camera.position.z = CAMERA_BASE.z + Math.sin(t * 0.08) * 0.55;
    camera.position.y = CAMERA_BASE.y + mouseY * -1.05 + Math.sin(t * 0.1) * 0.28;
    camera.lookAt(0, -2.8, 0);

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
