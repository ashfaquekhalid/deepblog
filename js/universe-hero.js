/* ═══════════════════════════════════════════════════════════════════════════
   Know Our Universe Landing — Cosmos/Galaxy Hero Animation (Three.js)
   Larger spiral galaxy, orbiting labeled planets, twinkling stars, nebula glow,
   and shooting stars
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  if (typeof THREE === "undefined") return;

  const canvas = document.getElementById("universeHeroCanvas");
  if (!canvas) return;

  const parent = canvas.parentElement;
  let W = parent.clientWidth, H = parent.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 300);
  camera.position.set(0, 5, 14);
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
  const STAR_COUNT = 4000;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(STAR_COUNT * 3);
  const starCol = new Float32Array(STAR_COUNT * 3);
  const starSizes = new Float32Array(STAR_COUNT);

  for (let i = 0; i < STAR_COUNT; i++) {
    starPos[i * 3]     = (rng() - 0.5) * 120;
    starPos[i * 3 + 1] = (rng() - 0.5) * 120;
    starPos[i * 3 + 2] = (rng() - 0.5) * 120;

    const temp = rng();
    let r, g, b;
    if (temp < 0.3)      { r = 0.6; g = 0.7; b = 1.0; }
    else if (temp < 0.6) { r = 1.0; g = 0.95; b = 0.8; }
    else                 { r = 1.0; g = 0.8; b = 0.7; }
    starCol[i * 3] = r; starCol[i * 3 + 1] = g; starCol[i * 3 + 2] = b;
    starSizes[i] = 0.04 + rng() * 0.12;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.1, vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* ── Spiral Galaxy ────────────────────────────────────────────────────── */
  const GALAXY_PARTICLES = 7000;
  const ARMS = 4;
  const galaxyGeo = new THREE.BufferGeometry();
  const gPos = new Float32Array(GALAXY_PARTICLES * 3);
  const gCol = new Float32Array(GALAXY_PARTICLES * 3);

  for (let i = 0; i < GALAXY_PARTICLES; i++) {
    const arm = i % ARMS;
    const armAngle = (arm / ARMS) * Math.PI * 2;
    const radius = rng() * 7;
    const spin = radius * 0.9;
    const angle = armAngle + spin;

    const spreadX = (rng() - 0.5) * 0.5 * (1 + radius * 0.25);
    const spreadY = (rng() - 0.5) * 0.12 * (1 + radius * 0.08);
    const spreadZ = (rng() - 0.5) * 0.5 * (1 + radius * 0.25);

    gPos[i * 3]     = Math.cos(angle) * radius + spreadX;
    gPos[i * 3 + 1] = spreadY;
    gPos[i * 3 + 2] = Math.sin(angle) * radius + spreadZ;

    const distRatio = radius / 7;
    if (distRatio < 0.25)      { gCol[i * 3] = 1.0; gCol[i * 3 + 1] = 0.97; gCol[i * 3 + 2] = 0.75; }
    else if (distRatio < 0.5)  { gCol[i * 3] = 0.5; gCol[i * 3 + 1] = 0.75; gCol[i * 3 + 2] = 1.0; }
    else if (distRatio < 0.75) { gCol[i * 3] = 0.85; gCol[i * 3 + 1] = 0.45; gCol[i * 3 + 2] = 0.75; }
    else                       { gCol[i * 3] = 0.4; gCol[i * 3 + 1] = 0.3; gCol[i * 3 + 2] = 0.9; }
  }
  galaxyGeo.setAttribute("position", new THREE.BufferAttribute(gPos, 3));
  galaxyGeo.setAttribute("color", new THREE.BufferAttribute(gCol, 3));
  const galaxyMat = new THREE.PointsMaterial({
    size: 0.05, vertexColors: true, transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
  galaxy.rotation.x = -0.5;
  cosmosGroup.add(galaxy);

  /* Galactic core */
  const coreGeo = new THREE.SphereGeometry(0.5, 20, 20);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffeebb, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  cosmosGroup.add(core);

  const coreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 20, 20),
    new THREE.MeshBasicMaterial({
      color: 0xffeebb, transparent: true, opacity: 0.1,
      blending: THREE.AdditiveBlending,
    })
  );
  cosmosGroup.add(coreGlow);

  /* Nebula ring glow */
  const nebulaGeo = new THREE.RingGeometry(2.5, 5.5, 64);
  const nebulaMat = new THREE.MeshBasicMaterial({
    color: 0x7c3aed, transparent: true, opacity: 0.04,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
  nebula.rotation.x = -0.5;
  cosmosGroup.add(nebula);

  /* ── Orbiting "planets" with labels ───────────────────────────────────── */
  const PLANET_DATA = [
    { name: "Mercury",  radius: 3.0, size: 0.08, color: 0xb0bec5 },
    { name: "Earth",    radius: 4.5, size: 0.12, color: 0x4fc3f7 },
    { name: "Mars",     radius: 5.8, size: 0.10, color: 0xfb923c },
    { name: "Jupiter",  radius: 7.5, size: 0.18, color: 0xf472b6 },
    { name: "Neptune",  radius: 9.5, size: 0.14, color: 0x34d399 },
  ];

  const planets = [];

  const labelContainer = document.createElement("div");
  labelContainer.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;overflow:hidden;";
  parent.appendChild(labelContainer);

  PLANET_DATA.forEach((pd, i) => {
    const pGeo = new THREE.SphereGeometry(pd.size, 14, 14);
    const pMat = new THREE.MeshBasicMaterial({
      color: pd.color, transparent: true, opacity: 0.9,
    });
    const planet = new THREE.Mesh(pGeo, pMat);

    const glowMat = new THREE.MeshBasicMaterial({
      color: pd.color, transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(pd.size * 3, 14, 14), glowMat);
    planet.add(glow);
    cosmosGroup.add(planet);

    const orbitGeo = new THREE.RingGeometry(pd.radius - 0.015, pd.radius + 0.015, 100);
    const orbitMat = new THREE.MeshBasicMaterial({
      color: pd.color, transparent: true, opacity: 0.07, side: THREE.DoubleSide,
    });
    const orbit = new THREE.Mesh(orbitGeo, orbitMat);
    orbit.rotation.x = Math.PI / 2 - 0.5;
    cosmosGroup.add(orbit);

    const colorHex = "#" + new THREE.Color(pd.color).getHexString();
    const el = document.createElement("div");
    el.innerHTML = `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${colorHex};margin-right:5px;box-shadow:0 0 6px ${colorHex};vertical-align:middle;"></span>${pd.name}`;
    el.style.cssText = `
      position: absolute;
      font-family: 'Space Grotesk', 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      color: #fff;
      opacity: 0;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-weight: 600;
      white-space: nowrap;
      text-shadow: 0 0 10px ${colorHex}, 0 0 4px rgba(0,0,0,0.9);
      padding: 2px 8px 2px 5px;
      background: rgba(6, 6, 14, 0.5);
      border: 1px solid ${colorHex}33;
      border-radius: 5px;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      transition: opacity 0.3s ease;
      transform: translateX(-50%);
    `;
    labelContainer.appendChild(el);

    planets.push({
      mesh: planet, radius: pd.radius,
      speed: 0.12 + rng() * 0.25,
      offset: rng() * Math.PI * 2,
      inclination: (rng() - 0.5) * 0.25,
      label: el,
    });
  });

  /* ── Shooting stars ───────────────────────────────────────────────────── */
  const shootingStars = [];
  const SHOOTING_POOL = 4;

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
      cooldown: 2 + rng() * 5,
      timer: rng() * 3,
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

  const tempV = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    const t = Date.now() * 0.001;
    const dt = 0.016;

    galaxy.rotation.y = t * 0.06;
    core.material.opacity = 0.35 + Math.sin(t * 2) * 0.12;
    coreGlow.material.opacity = 0.08 + Math.sin(t * 1.5) * 0.04;
    nebula.rotation.y = t * 0.03;

    /* Twinkling stars */
    starMat.opacity = 0.7 + Math.sin(t * 0.8) * 0.15;

    planets.forEach(p => {
      const angle = t * p.speed + p.offset;
      p.mesh.position.set(
        Math.cos(angle) * p.radius,
        Math.sin(angle * 0.7) * p.inclination,
        Math.sin(angle) * p.radius
      );
      p.mesh.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.5);

      tempV.copy(p.mesh.position);
      tempV.applyMatrix4(cosmosGroup.matrixWorld);
      tempV.project(camera);

      const sx = (tempV.x * 0.5 + 0.5) * W;
      const sy = (-tempV.y * 0.5 + 0.5) * H;
      p.label.style.left = sx + "px";
      p.label.style.top = (sy - 20) + "px";

      const vis = tempV.z < 1;
      p.label.style.opacity = vis ? "0.85" : "0";
    });

    shootingStars.forEach(ss => {
      if (!ss.active) {
        ss.timer -= dt;
        if (ss.timer <= 0) {
          ss.active = true;
          ss.progress = 0;
          ss.sx = (rng() - 0.5) * 40;
          ss.sy = 8 + rng() * 20;
          ss.sz = -15 - rng() * 15;
          ss.dx = (rng() - 0.5) * 20;
          ss.dy = ss.sy - 12 - rng() * 10;
          ss.dz = ss.sz + rng() * 8;
        }
      } else {
        ss.progress += 0.022;
        if (ss.progress >= 1) {
          ss.active = false;
          ss.timer = 2 + rng() * 5;
          ss.line.material.opacity = 0;
        } else {
          ss.line.material.opacity = Math.sin(ss.progress * Math.PI) * 0.7;
          const head = ss.progress;
          const tailLen = 0.1;
          for (let j = 0; j < 10; j++) {
            const frac = head - (j / 10) * tailLen;
            ss.posArr[j * 3]     = ss.sx + (ss.dx - ss.sx) * frac;
            ss.posArr[j * 3 + 1] = ss.sy + (ss.dy - ss.sy) * frac;
            ss.posArr[j * 3 + 2] = ss.sz + (ss.dz - ss.sz) * frac;
          }
          ss.line.geometry.setDrawRange(0, 10);
          ss.line.geometry.attributes.position.needsUpdate = true;
        }
      }
    });

    cosmosGroup.rotation.y = mouseX * 0.12;
    cosmosGroup.rotation.x = -mouseY * 0.06;
    stars.rotation.y = t * 0.008;

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
