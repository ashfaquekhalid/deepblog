/* ═══════════════════════════════════════════════════════════════════════════
   Know Our Universe Landing — Cosmos/Galaxy Hero Animation (Three.js)
   Spiral galaxy, orbiting spheres, twinkling stars, shooting stars
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  if (typeof THREE === "undefined") return;

  const canvas = document.getElementById("universeHeroCanvas");
  if (!canvas) return;

  const parent = canvas.parentElement;
  let W = parent.clientWidth, H = parent.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
  camera.position.set(0, 4, 12);
  camera.lookAt(0, 0, 0);

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
  const rng = seededRandom(77);

  const cosmosGroup = new THREE.Group();
  scene.add(cosmosGroup);

  /* ── Background stars ─────────────────────────────────────────────────── */
  const STAR_COUNT = 2000;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(STAR_COUNT * 3);
  const starCol = new Float32Array(STAR_COUNT * 3);
  const starAlphas = [];

  for (let i = 0; i < STAR_COUNT; i++) {
    starPos[i * 3] = (rng() - 0.5) * 80;
    starPos[i * 3 + 1] = (rng() - 0.5) * 80;
    starPos[i * 3 + 2] = (rng() - 0.5) * 80;

    const temp = rng();
    let r, g, b;
    if (temp < 0.3) { r = 0.6; g = 0.7; b = 1.0; }
    else if (temp < 0.6) { r = 1.0; g = 0.95; b = 0.8; }
    else { r = 1.0; g = 0.8; b = 0.7; }
    starCol[i * 3] = r; starCol[i * 3 + 1] = g; starCol[i * 3 + 2] = b;
    starAlphas.push(0.3 + rng() * 0.7);
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.08, vertexColors: true, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* ── Spiral Galaxy ────────────────────────────────────────────────────── */
  const GALAXY_PARTICLES = 4000;
  const ARMS = 3;
  const galaxyGeo = new THREE.BufferGeometry();
  const gPos = new Float32Array(GALAXY_PARTICLES * 3);
  const gCol = new Float32Array(GALAXY_PARTICLES * 3);

  for (let i = 0; i < GALAXY_PARTICLES; i++) {
    const arm = i % ARMS;
    const armAngle = (arm / ARMS) * Math.PI * 2;
    const radius = rng() * 5;
    const spin = radius * 0.8;
    const angle = armAngle + spin;

    const spreadX = (rng() - 0.5) * 0.6 * (1 + radius * 0.3);
    const spreadY = (rng() - 0.5) * 0.15 * (1 + radius * 0.1);
    const spreadZ = (rng() - 0.5) * 0.6 * (1 + radius * 0.3);

    gPos[i * 3] = Math.cos(angle) * radius + spreadX;
    gPos[i * 3 + 1] = spreadY;
    gPos[i * 3 + 2] = Math.sin(angle) * radius + spreadZ;

    const distRatio = radius / 5;
    if (distRatio < 0.3) {
      gCol[i * 3] = 1.0; gCol[i * 3 + 1] = 0.95; gCol[i * 3 + 2] = 0.7;
    } else if (distRatio < 0.6) {
      gCol[i * 3] = 0.4; gCol[i * 3 + 1] = 0.7; gCol[i * 3 + 2] = 1.0;
    } else {
      gCol[i * 3] = 0.9; gCol[i * 3 + 1] = 0.4; gCol[i * 3 + 2] = 0.7;
    }
  }
  galaxyGeo.setAttribute("position", new THREE.BufferAttribute(gPos, 3));
  galaxyGeo.setAttribute("color", new THREE.BufferAttribute(gCol, 3));
  const galaxyMat = new THREE.PointsMaterial({
    size: 0.04, vertexColors: true, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
  galaxy.rotation.x = -0.5;
  cosmosGroup.add(galaxy);

  const coreGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffeebb, transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  cosmosGroup.add(core);

  const coreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xffeebb, transparent: true, opacity: 0.08,
      blending: THREE.AdditiveBlending,
    })
  );
  cosmosGroup.add(coreGlow);

  /* ── Orbiting "planets" ───────────────────────────────────────────────── */
  const PLANET_COLORS = [0x4fc3f7, 0xf472b6, 0xfb923c, 0x34d399, 0xba68c8];
  const planets = [];

  for (let i = 0; i < 5; i++) {
    const radius = 2.5 + i * 1.5;
    const size = 0.08 + rng() * 0.12;
    const col = PLANET_COLORS[i];
    const pGeo = new THREE.SphereGeometry(size, 12, 12);
    const pMat = new THREE.MeshBasicMaterial({
      color: col, transparent: true, opacity: 0.85,
    });
    const planet = new THREE.Mesh(pGeo, pMat);

    const glowMat = new THREE.MeshBasicMaterial({
      color: col, transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(size * 3, 12, 12), glowMat);
    planet.add(glow);
    cosmosGroup.add(planet);

    const orbitGeo = new THREE.RingGeometry(radius - 0.01, radius + 0.01, 80);
    const orbitMat = new THREE.MeshBasicMaterial({
      color: col, transparent: true, opacity: 0.06, side: THREE.DoubleSide,
    });
    const orbit = new THREE.Mesh(orbitGeo, orbitMat);
    orbit.rotation.x = Math.PI / 2 - 0.5;
    cosmosGroup.add(orbit);

    planets.push({
      mesh: planet, radius,
      speed: 0.15 + rng() * 0.3,
      offset: rng() * Math.PI * 2,
      inclination: (rng() - 0.5) * 0.3,
    });
  }

  /* ── Shooting stars ───────────────────────────────────────────────────── */
  const shootingStars = [];
  const SHOOTING_POOL = 3;

  for (let i = 0; i < SHOOTING_POOL; i++) {
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(30);
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    const sMat = new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const line = new THREE.Line(sGeo, sMat);
    scene.add(line);
    shootingStars.push({
      line, posArr: sPos,
      active: false,
      cooldown: 2 + rng() * 6,
      timer: rng() * 4,
      sx: 0, sy: 0, sz: 0,
      dx: 0, dy: 0, dz: 0,
      progress: 0,
    });
  }

  let mouseX = 0, mouseY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function animate() {
    requestAnimationFrame(animate);
    const t = Date.now() * 0.001;
    const dt = 0.016;

    galaxy.rotation.y = t * 0.08;
    core.material.opacity = 0.3 + Math.sin(t * 2) * 0.1;
    coreGlow.material.opacity = 0.06 + Math.sin(t * 1.5) * 0.03;

    planets.forEach(p => {
      const angle = t * p.speed + p.offset;
      p.mesh.position.set(
        Math.cos(angle) * p.radius,
        Math.sin(angle * 0.7) * p.inclination,
        Math.sin(angle) * p.radius
      );
      p.mesh.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.5);
    });

    shootingStars.forEach(ss => {
      if (!ss.active) {
        ss.timer -= dt;
        if (ss.timer <= 0) {
          ss.active = true;
          ss.progress = 0;
          ss.sx = (rng() - 0.5) * 30;
          ss.sy = 5 + rng() * 15;
          ss.sz = -10 - rng() * 10;
          ss.dx = (rng() - 0.5) * 15;
          ss.dy = ss.sy - 10 - rng() * 8;
          ss.dz = ss.sz + rng() * 5;
        }
      } else {
        ss.progress += 0.025;
        if (ss.progress >= 1) {
          ss.active = false;
          ss.timer = 2 + rng() * 6;
          ss.line.material.opacity = 0;
        } else {
          ss.line.material.opacity = Math.sin(ss.progress * Math.PI) * 0.6;
          const head = ss.progress;
          const tailLen = 0.08;
          for (let j = 0; j < 10; j++) {
            const frac = head - (j / 10) * tailLen;
            const cx = ss.sx + (ss.dx - ss.sx) * frac;
            const cy = ss.sy + (ss.dy - ss.sy) * frac;
            const cz = ss.sz + (ss.dz - ss.sz) * frac;
            ss.posArr[j * 3] = cx;
            ss.posArr[j * 3 + 1] = cy;
            ss.posArr[j * 3 + 2] = cz;
          }
          ss.line.geometry.setDrawRange(0, 10);
          ss.line.geometry.attributes.position.needsUpdate = true;
        }
      }
    });

    cosmosGroup.rotation.y = mouseX * 0.15;
    cosmosGroup.rotation.x = -mouseY * 0.08;
    stars.rotation.y = t * 0.01;

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
