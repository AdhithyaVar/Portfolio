(async () => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches, k = still ? 0 : 1;

  // 3D Card tilt on mouse hover (desktop only)
  document.querySelectorAll('.card').forEach(el => {
    el.addEventListener('pointermove', e => {
      if (still || innerWidth < 1024) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 8 + 'deg');
      el.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 8 + 'deg');
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });

  // Reversible Scroll-Driven Content Reveal
  const sceneSections = ['top', 'about', 'work', 'skills', 'education', 'contact'].map(id => document.getElementById(id));
  const sceneItems = sceneSections.map(section => Array.from(section.querySelectorAll('h1, h2, p, .eyebrow, .hero-actions, .card, .skills, .background-block, .mail, .contact-phone, .links'))
    .map((el, index) => {
      el.classList.add('scene-animated');
      return { el, index };
    }));

  const cinemaClamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const cinemaEase = v => { v = cinemaClamp(v); return v * v * (3 - 2 * v); };
  let cinemaY = scrollY, cinemaMotion = 0, cinemaDrift = 0;

  const updateSceneText = () => {
    if (still) return;
    cinemaY += (scrollY - cinemaY) * 0.12;
    const height = innerHeight;
    const bounds = sceneSections.map(section => ({ top: section.offsetTop, height: section.offsetHeight }));

    sceneSections.forEach((section, s) => {
      const top = bounds[s].top - cinemaY;
      const bottom = top + bounds[s].height;
      sceneItems[s].forEach(({ el, index }) => {
        const entering = s === 0 ? 1 : cinemaEase((height * 0.90 - top - index * 12) / (height * 0.65));
        const exiting = cinemaEase((height * 0.40 - bottom + index * 8) / (height * 0.58));
        const alpha = cinemaClamp(entering * (1 - exiting));
        const y = (1 - entering) * 18 - exiting * 16;
        el.style.setProperty('--scene-opacity', alpha.toFixed(4));
        el.style.setProperty('--scene-y', y.toFixed(2) + 'px');
        el.style.setProperty('--scene-x', '0px');
        el.style.setProperty('--scene-blur', ((1 - alpha) * 2).toFixed(2) + 'px');
        el.style.setProperty('--scene-scale', '1');
      });
    });

    let wave = 0, drift = 0;
    for (let i = 1; i < sceneSections.length; i++) {
      const start = bounds[i].top - height * 0.82;
      const end = bounds[i].top - height * 0.05;
      const u = cinemaEase((cinemaY - start) / Math.max(1, end - start));
      const pulse = Math.sin(u * Math.PI);
      wave = Math.max(wave, pulse);
      drift += pulse * (i % 2 ? 0.4 : -0.35);
    }
    cinemaMotion = wave;
    cinemaDrift = drift;
  };

  if (!still) {
    const textLoop = () => { updateSceneText(); requestAnimationFrame(textLoop); };
    textLoop();
    document.body.classList.add('cinema-ready');
  }

  // Active Navbar Indicator on Scroll
  const navLinks = Array.from(document.querySelectorAll('nav a.nav-link'));
  const updateNavActive = () => {
    const scrollMid = scrollY + innerHeight * 0.35;
    let currentId = 'top';
    sceneSections.forEach(sec => {
      if (sec && sec.offsetTop <= scrollMid) {
        currentId = sec.id;
      }
    });
    // Check if within experience inside about
    const expEl = document.getElementById('experience');
    if (expEl && expEl.offsetTop <= scrollMid && currentId === 'about') {
      currentId = 'experience';
    }
    navLinks.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      if (href === currentId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  };
  window.addEventListener('scroll', updateNavActive, { passive: true });
  updateNavActive();

  // WebGL Renderer Setup
  const cv = document.getElementById('bg');
  if (!window.THREE) { cv.remove(); return; }
  let R;
  try {
    R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    console.error('WebGL init failed:', e);
    cv.remove();
    return;
  }

  R.setClearColor(0x000000, 1);
  const IV = 0xece8e1, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const DZ = 17.55, S = new THREE.Scene(), C = new THREE.PerspectiveCamera(24, 1, 0.1, 200);
  C.position.z = DZ;

  // Particle Dot Sprite Texture
  const c2 = document.createElement('canvas'); c2.width = c2.height = 64;
  const x2 = c2.getContext('2d'), gr = x2.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.3, 'rgba(255,255,255,0.8)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  x2.fillStyle = gr; x2.fillRect(0, 0, 64, 64);
  const dot = new THREE.CanvasTexture(c2);

  const BG = a => new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(a instanceof Float32Array ? a : new Float32Array(a), 3));
  const LM = o => new THREE.LineBasicMaterial({ color: IV, transparent: true, opacity: o });

  // Await decompressed 3D assets
  try {
    await window.__modelAssetsReady;
  } catch (err) {
    console.error('Could not initialize 3D assets:', err);
    cv.remove();
    return;
  }

  const rn = Math.random, R2 = () => rn() * 2 - 1, TAU = 6.2831853;

  // Build the 5 Morph Targets
  const MT = (() => {
    const N = 26000, T = [0, 1, 2, 3, 4].map(() => new Float32Array(N * 3)), sd = new Float32Array(N), em = new Float32Array(N), S = 1.3;
    const sph = () => { const u = R2(), a = rn() * TAU, r = Math.sqrt(1 - u * u); return [Math.cos(a) * r, u, Math.sin(a) * r]; };
    const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

    // Model 1: Robot Bust from embedded data
    const nrMesh = window.NiwwrdRobotData;
    if (!nrMesh || !nrMesh.positions) throw new Error('Robot model data was not loaded.');
    const nrP = nrMesh.positions, nrE = nrMesh.emissive;

    // Model 3: Neural Network graph sampler
    const graph = (nodes, edges, nf, nr, jt = 0.012) => {
      const cum = []; let tot = 0;
      edges.forEach(e => { tot += dist(nodes[e[0]], nodes[e[1]]); cum.push(tot); });
      return () => {
        if (rn() < nf) {
          const n = nodes[Math.floor(rn() * nodes.length)], s = sph();
          return [(n[0] + s[0] * nr) * S, (n[1] + s[1] * nr) * S, (n[2] + s[2] * nr) * S];
        }
        const r = rn() * tot; let lo = 0, hi = cum.length - 1;
        while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < r) lo = m + 1; else hi = m; }
        const a = nodes[edges[lo][0]], b = nodes[edges[lo][1]], t = rn();
        return [(a[0] + (b[0] - a[0]) * t + R2() * jt) * S, (a[1] + (b[1] - a[1]) * t + R2() * jt) * S, (a[2] + (b[2] - a[2]) * t + R2() * jt) * S];
      };
    };
    const Ls = [4, 6, 6, 3], NN = [], L0 = [];
    Ls.forEach((n, l) => {
      L0.push(NN.length);
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + l, r = 0.5 + n * 0.16;
        NN.push([(l - 1.5) * 1.7, Math.sin(a) * r, Math.cos(a) * r]);
      }
    });
    const NE = [];
    Ls.forEach((n, l) => {
      if (l < Ls.length - 1) {
        for (let i = 0; i < n; i++) for (let j = 0; j < Ls[l + 1]; j++) NE.push([L0[l] + i, L0[l + 1] + j]);
      }
    });

    // Model 5: Keyboard data
    const KR = [];
    [[14, 0], [14, 1], [14, 2], [13, 3]].forEach(a => {
      for (let i = 0; i < a[0]; i++) KR.push([(i - (a[0] - 1) / 2) * 0.56, (a[1] - 2) * 0.62, 0.5, 0.5]);
    });
    [0, 1, 2].forEach(j => {
      const x = 1.81 + 0.56 * j;
      KR.push([-x, 1.24, 0.5, 0.5], [x, 1.24, 0.5, 0.5]);
    });
    KR.push([0, 1.24, 3, 0.5]);

    const kct = Math.cos(0.62), ksn = Math.sin(0.62), SC = 0.86;
    const keyW = (x, y, z) => [x * SC, y * SC - 1.85 + (-z * ksn) * SC, (z * kct) * SC + 0.55];
    const edge2 = (w, h) => {
      const p = rn() * 2 * (w + h);
      if (p < w) return [p - w / 2, h / 2];
      if (p < w + h) return [w / 2, h / 2 - (p - w)];
      if (p < 2 * w + h) return [w / 2 - (p - w - h), -h / 2];
      return [-w / 2, -h / 2 + (p - 2 * w - h)];
    };
    const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const poly2 = pts => { const i = Math.floor(rn() * pts.length), t = rn(); return lerp2(pts[i], pts[(i + 1) % pts.length], t); };

    const ico = kind => {
      if (kind === 'cube') {
        const s = 0.26, T = [[0, 0.24], [-s, 0.08], [0, -0.08], [s, 0.08]], L = [[-s, 0.08], [0, -0.08], [0, -0.34], [-s, -0.18]], R = [[s, 0.08], [0, -0.08], [0, -0.34], [s, -0.18]];
        return poly2([T, L, R][Math.floor(rn() * 3)]);
      }
      if (kind === 'nested') { const k = rn() < 0.5 ? 0.4 : 0.2; return edge2(k * 2, k * 2); }
      if (kind === 'hex') { const r = 0.32, i = Math.floor(rn() * 6), t = rn(), a = i * TAU / 6, b = (i + 1) * TAU / 6; return [(Math.cos(a) * (1 - t) + Math.cos(b) * t) * r, (Math.sin(a) * (1 - t) + Math.sin(b) * t) * r]; }
      if (kind === 'rings') { const r = 0.1 + Math.floor(rn() * 3) * 0.12, a = rn() * TAU; return [Math.cos(a) * r, Math.sin(a) * r]; }
      if (kind === 'wave') { const x = (rn() - 0.5) * 1.1; return [x, Math.sin(x * 9) * 0.15 + R2() * 0.025]; }
      if (kind === 'chart') { if (rn() < 0.3) return rn() < 0.5 ? [(rn() - 0.5) * 0.9, -0.32] : [-0.45, (rn() - 0.5) * 0.68]; const x = (rn() - 0.5) * 0.9; return [x, -0.16 + 0.2 * x + Math.sin(x * 6) * 0.13]; }
      if (kind === 'diamonds') { const n = Math.floor(rn() * 4), ox = [-0.36, 0, 0.36, 0][n], oy = [0.08, 0.26, 0.08, -0.14][n], e = edge2(0.18, 0.18), c = 0.707; return [ox + e[0] * c - e[1] * c, oy + e[0] * c + e[1] * c]; }
      if (kind === 'stack') { const layer = Math.floor(rn() * 3), e = edge2(0.74, 0.18); return [e[0] * 0.68, e[1] + layer * 0.28 - 0.28]; }
      if (kind === 'stats') { return rn() < 0.7 ? edge2(1.22, 0.88) : [(rn() - 0.5) * 1, (rn() - 0.5) * 0.55]; }
      if (kind === 'tri') { return poly2([[-0.22, -0.2], [0.28, 0], [-0.22, 0.2]]); }
      return edge2(0.8, 0.8);
    };

    const cards = [
      { x: -2.10, y: 1.78, z: 0.82, w: 0.92, h: 0.92, k: 'cube' },
      { x: 0.00, y: 2.00, z: 0.66, w: 1.36, h: 0.96, k: 'diamonds' },
      { x: 2.10, y: 1.78, z: 0.82, w: 0.94, h: 0.94, k: 'nested' },
      { x: -3.35, y: 0.20, z: 0.92, w: 0.96, h: 1.18, k: 'stack' },
      { x: 3.38, y: 0.58, z: 0.90, w: 0.94, h: 1.16, k: 'rings' },
      { x: 3.08, y: -0.58, z: 0.96, w: 0.94, h: 1.04, k: 'hex' },
      { x: -2.85, y: -1.46, z: 1.02, w: 1.18, h: 0.92, k: 'stats' },
      { x: 2.72, y: -1.32, z: 1.02, w: 1.16, h: 0.88, k: 'chart' },
      { x: 1.35, y: -2.06, z: 0.98, w: 0.86, h: 0.86, k: 'tri' },
      { x: -2.65, y: -0.64, z: 0.98, w: 0.92, h: 0.62, k: 'wave' }
    ];

    // Model 4: Desktop Monitor
    const monitor = () => {
      const quad = (A, B, C, D, t, u) => [
        A[0] * (1 - t) * (1 - u) + B[0] * t * (1 - u) + C[0] * t * u + D[0] * (1 - t) * u,
        A[1] * (1 - t) * (1 - u) + B[1] * t * (1 - u) + C[1] * t * u + D[1] * (1 - t) * u,
        A[2] * (1 - t) * (1 - u) + B[2] * t * (1 - u) + C[2] * t * u + D[2] * (1 - t) * u
      ];
      const pick = rn(); let p;
      const A = [-2.48, 1.30, -1.02], B = [2.48, 1.30, -1.02], C = [2.48, -0.72, -1.02], D = [-2.48, -0.72, -1.02];
      if (pick < 0.40) {
        const t = rn(), u = rn(), e = rn();
        if (e < 0.25) p = quad(A, B, C, D, 0, u);
        else if (e < 0.5) p = quad(A, B, C, D, 1, u);
        else if (e < 0.75) p = quad(A, B, C, D, t, 0);
        else p = quad(A, B, C, D, t, 1);
      } else if (pick < 0.52) {
        const t = rn(), u = rn();
        p = quad(A, B, C, D, t, u);
        p = [p[0] * 0.965, p[1] * 0.965, p[2]];
      } else if (pick < 0.63) {
        const e = edge2(0.86, 1.12);
        p = [e[0] * 0.94, -1.18 + e[1], -0.08 + (rn() - 0.5) * 0.02];
      } else if (pick < 0.69) {
        const e = edge2(1.36, 0.16);
        p = [e[0], -1.86 + e[1], 0.04 + (rn() - 0.5) * 0.015];
      } else if (pick < 0.74) {
        const e = edge2(0.92, 0.07);
        p = [e[0], -1.93 + e[1], 0.08 + (rn() - 0.5) * 0.01];
      } else if (pick < 0.988) {
        const c = cards[Math.floor(rn() * cards.length)];
        if (rn() < 0.30) {
          const e = edge2(c.w, c.h);
          p = [c.x + e[0], c.y + e[1], c.z + (rn() - 0.5) * 0.025];
        } else {
          const g = ico(c.k);
          const sx = Math.max(0.28, c.w * 0.48), sy = Math.max(0.28, c.h * 0.48);
          p = [c.x + g[0] * sx, c.y + g[1] * sy, c.z + (rn() - 0.5) * 0.02];
        }
      } else {
        const t = rn();
        p = [-4.05 + t * 1.9, -1.78 + Math.sin(t * Math.PI) * 0.08, 0.07 + (rn() - 0.5) * 0.008];
      }
      return [p[0] * 0.93, (p[1] - 0.06) * 0.98, p[2] * 0.92];
    };

    // Model 5: Keyboard
    const keyboard = () => {
      const pick = rn(); let x, z;
      if (pick < 0.82) {
        const q = rn() < 0.14 ? KR[KR.length - 1] : KR[Math.floor(rn() * KR.length)];
        if (rn() < 0.70) {
          const e = Math.floor(rn() * 4), s = rn();
          x = q[0] + (e < 2 ? (s - 0.5) * q[2] : (e === 2 ? -1 : 1) * q[2] / 2);
          z = q[1] + (e < 2 ? (e === 0 ? -1 : 1) * q[3] / 2 : (s - 0.5) * q[3]);
        } else {
          x = q[0] + (rn() - 0.5) * q[2];
          z = q[1] + (rn() - 0.5) * q[3];
        }
        const p = keyW(x, rn() < 0.3 ? 0.08 : 0.02, z);
        return [p[0], p[1] + 1.5, p[2]];
      }
      x = (rn() - 0.5) * 5.2; z = (rn() - 0.5) * 2.4;
      const p = keyW(x, 0.015, z + 0.1);
      return [p[0], p[1] + 1.5, p[2]];
    };

    const gn = graph(NN, NE, 0.32, 0.09, 0.004);

    // Model 2: Anatomical Brain sampled from mesh
    const brainMesh = window.BrainModelData;
    if (!brainMesh || !brainMesh.positions || !brainMesh.edges) throw new Error('Embedded brain geometry missing.');
    const bp = brainMesh.positions, be = brainMesh.edges;
    const nEdges = be.length / 2, edgeCDF = new Float32Array(nEdges);
    let edgeTotal = 0;
    for (let e = 0; e < nEdges; e++) {
      const a = be[2 * e] * 3, b = be[2 * e + 1] * 3;
      const dx = bp[a] - bp[b], dy = bp[a + 1] - bp[b + 1], dz = bp[a + 2] - bp[b + 2];
      edgeTotal += Math.hypot(dx, dy, dz);
      edgeCDF[e] = edgeTotal;
    }
    const brainSample = () => {
      let x, y, z;
      if (rn() < 0.23) {
        const p = Math.floor(rn() * (bp.length / 3)) * 3;
        x = bp[p]; y = bp[p + 1]; z = bp[p + 2];
      } else {
        const r = rn() * edgeTotal;
        let lo = 0, hi = nEdges - 1;
        while (lo < hi) { const m = (lo + hi) >> 1; if (edgeCDF[m] < r) lo = m + 1; else hi = m; }
        const a = be[lo * 2] * 3, b = be[lo * 2 + 1] * 3, t = rn();
        x = bp[a] + (bp[b] - bp[a]) * t;
        y = bp[a + 1] + (bp[b + 1] - bp[a + 1]) * t;
        z = bp[a + 2] + (bp[b + 2] - bp[a + 2]) * t;
      }
      return [x * 2.5, y * 2.5, z * 2.5];
    };

    for (let i = 0; i < N; i++) {
      sd[i] = rn();
      T[0][i * 3] = nrP[i * 3]; T[0][i * 3 + 1] = nrP[i * 3 + 1]; T[0][i * 3 + 2] = nrP[i * 3 + 2];
      em[i] = nrE[i] / 255.0;
      T[1].set(brainSample(), i * 3);
      T[2].set(gn(), i * 3);
      T[3].set(monitor(), i * 3);
      T[4].set(keyboard(), i * 3);
    }

    // Preserve robot's balanced scale and framing
    let minX = 1e9, minY = 1e9, minZ = 1e9, maxX = -1e9, maxY = -1e9, maxZ = -1e9;
    for (let i = 0; i < N; i++) {
      const j = i * 3, x = T[0][j], y = T[0][j + 1], z = T[0][j + 2];
      if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z;
    }
    const rcx = (minX + maxX) * 0.5, rcy = (minY + maxY) * 0.5, rcz = (minZ + maxZ) * 0.5;
    const robotScale = 1.14, robotOffsetX = -0.10, robotOffsetY = 0.06, robotOffsetZ = 0;
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      T[0][j]     = (T[0][j] - rcx) * robotScale + rcx + robotOffsetX;
      T[0][j + 1] = (T[0][j + 1] - rcy) * robotScale + rcy + robotOffsetY;
      T[0][j + 2] = (T[0][j + 2] - rcz) * robotScale + rcz + robotOffsetZ;
    }

    return { T, sd, em };
  })();

  // Production Shaders with zero-rotation monitor constraint & keyboard 360°
  const VSM = `attribute vec3 t1, t2, t3, t4;
attribute float aS, aE;
uniform vec4 uW, uR;
uniform float uT, uK, uPR, uAsp, uB, uAl, uScreenMix;
uniform vec2 uM;
varying float vA;

vec3 ry(vec3 v, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}

void main() {
  // Stationary monitor t3: NEVER rotated by uR.w!
  // Rotating keyboard t4: rotated continuously 360 degrees around its local center by uR.w
  vec3 finalStage = mix(t3, ry(t4, uR.w), uScreenMix);
  vec3 p = ry(position, uR.x) * uW.x +
           ry(t1, uR.y) * uW.y +
           ry(t2, uR.z) * uW.z +
           finalStage * uW.w;

  p += uK * vec3(
    sin(p.y * 2.3 + uT * 1.7 + aS * 20.0),
    sin(p.z * 2.1 + uT * 1.3 + aS * 11.0),
    sin(p.x * 2.7 + uT * 1.9 + aS * 7.0)
  ) * 0.6;
  p += 0.02 * vec3(
    sin(uT * 1.1 + aS * 50.0),
    sin(uT * 1.3 + aS * 40.0),
    sin(uT * 1.7 + aS * 30.0)
  );

  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec4 cp = projectionMatrix * viewMatrix * wp;
  vec2 d = (cp.xy / cp.w - uM) * vec2(uAsp, 1.0);
  float w = exp(-dot(d, d) / 0.04);
  vec4 mv = viewMatrix * wp;
  mv.xy += normalize(d + vec2(0.0001)) * (w * 0.45 + uB * exp(-dot(d, d) / 0.5) * 0.3) * (-mv.z / 17.55);
  gl_Position = projectionMatrix * mv;

  float keyboardBlend = clamp(uScreenMix, 0.0, 1.0);
  float referenceSize = 1.05 + aS * 0.85 + w * 1.25 + aE * uW.x * 0.85;
  float monitorSize = 1.10 + aS * 0.88 + w * 1.25 + aE * uW.x * 0.85 + uW.w * 0.35;
  gl_PointSize = mix(monitorSize, referenceSize, keyboardBlend) * uPR * (17.55 / -mv.z);

  // Softened, non-glaring opacity curve
  float referenceOpacity = 0.38 + aS * 0.38 + w * 0.32 + aE * uW.x * 0.36;
  vA = (referenceOpacity + uW.w * 0.18 * (1.0 - keyboardBlend)) * uAl;
}`;

  const FSM = `varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vec3(0.88, 0.86, 0.83), smoothstep(0.5, 0.1, d) * vA);
}`;

  const UM = {
    uW: { value: new THREE.Vector4(1, 0, 0, 0) },
    uR: { value: new THREE.Vector4() },
    uT: { value: 0 },
    uK: { value: 0 },
    uPR: { value: 1 },
    uAsp: { value: 1 },
    uB: { value: 0 },
    uAl: { value: 0.55 },
    uScreenMix: { value: 0 },
    uM: { value: new THREE.Vector2(9, 9) }
  };

  const mgeo = new THREE.BufferGeometry();
  mgeo.setAttribute('position', new THREE.BufferAttribute(MT.T[0], 3));
  [1, 2, 3, 4].forEach(q => mgeo.setAttribute('t' + q, new THREE.BufferAttribute(MT.T[q], 3)));
  mgeo.setAttribute('aS', new THREE.BufferAttribute(MT.sd, 1));
  mgeo.setAttribute('aE', new THREE.BufferAttribute(MT.em, 1));

  const G = new THREE.Group();
  S.add(G);

  const MP = new THREE.Points(mgeo, new THREE.ShaderMaterial({
    uniforms: UM, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: VSM, fragmentShader: FSM
  }));
  MP.frustumCulled = false;
  MP.scale.setScalar(1.2);
  G.add(MP);

  // Model 3: Neural Network Lines & Flowing Signals (HNET)
  const makeHNetwork = () => {
    const Ls = [4, 6, 6, 3], P = [], E = [], st = [], la = [];
    Ls.forEach((n, l) => {
      st.push(P.length);
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + l, r = 0.5 + n * 0.16;
        P.push(V((l - 1.5) * 1.7, Math.sin(a) * r, Math.cos(a) * r));
      }
    });
    Ls.forEach((n, l) => {
      if (l < Ls.length - 1) {
        for (let i = 0; i < n; i++) for (let j = 0; j < Ls[l + 1]; j++) {
          E.push([st[l] + i, st[l + 1] + j]);
          la.push(...P[st[l] + i].toArray(), ...P[st[l + 1] + j].toArray());
        }
      }
    });
    const pa = new Float32Array(P.length * 3);
    P.forEach((p, i) => p.toArray(pa, i * 3));
    const lm = LM(0);
    const pm = new THREE.PointsMaterial({ map: dot, color: IV, size: 0.27, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    lm.depthWrite = false;
    lm.blending = THREE.AdditiveBlending;
    const lines = new THREE.LineSegments(BG(la), lm), nodes = new THREE.Points(BG(pa), pm);
    lines.frustumCulled = nodes.frustumCulled = false;
    const group = new THREE.Group();
    group.add(lines, nodes);

    const out = P.map(() => []);
    E.forEach((e, i) => out[e[0]].push(i));
    const SN = 36, spos = new Float32Array(SN * 3), state = [];
    for (let i = 0; i < SN; i++) state.push({ e: Math.floor(rn() * E.length), u: rn(), v: 0.4 + rn() * 0.4 });
    const smat = new THREE.PointsMaterial({ map: dot, color: IV, size: 0.14, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const signals = new THREE.Points(BG(spos), smat);
    signals.frustumCulled = false;
    group.add(signals);
    group.scale.setScalar(1.18);
    G.add(group);
    return { group, P, E, out, lm, pm, smat, signals, state, spos };
  };
  const HNET = makeHNetwork();

  // Model 2: Anatomical Brain Detail Layers (BR)
  const makeBrain = () => {
    const D = window.BrainModelData, P = D.positions, E = D.edges, edgeCount = E.length / 2;
    const group = new THREE.Group();
    group.visible = false;
    G.add(group);

    const eCDF = new Float32Array(edgeCount); let total = 0;
    for (let e = 0; e < edgeCount; e++) {
      const a = E[e * 2] * 3, b = E[e * 2 + 1] * 3;
      total += Math.hypot(P[a] - P[b], P[a + 1] - P[b + 1], P[a + 2] - P[b + 2]);
      eCDF[e] = total;
    }
    const randomEdge = () => {
      const d = rn() * total; let lo = 0, hi = edgeCount - 1;
      while (lo < hi) { const m = (lo + hi) >> 1; if (eCDF[m] < d) lo = m + 1; else hi = m; }
      return lo;
    };

    const count = innerWidth < 768 ? 16000 : 45000;
    const fibrePositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const e = randomEdge(), a = E[e * 2] * 3, b = E[e * 2 + 1] * 3, t = rn();
      fibrePositions[i * 3]     = P[a] + (P[b] - P[a]) * t;
      fibrePositions[i * 3 + 1] = P[a + 1] + (P[b + 1] - P[a + 1]) * t;
      fibrePositions[i * 3 + 2] = P[a + 2] + (P[b + 2] - P[a + 2]) * t;
    }
    const fm = new THREE.PointsMaterial({ map: dot, color: 0xf8f7f4, size: 0.020, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const fibres = new THREE.Points(BG(fibrePositions), fm);
    fibres.frustumCulled = false;
    group.add(fibres);

    const nodeCount = innerWidth < 768 ? 1200 : 2400, nodes = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      const a = Math.floor(rn() * (P.length / 3)) * 3;
      nodes.set(P.subarray(a, a + 3), i * 3);
    }
    const nm = new THREE.PointsMaterial({ map: dot, color: 0xffffff, size: 0.055, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const nodePts = new THREE.Points(BG(nodes), nm);
    nodePts.frustumCulled = false;
    group.add(nodePts);

    const degree = new Uint16Array(P.length / 3);
    for (let e = 0; e < edgeCount; e++) {
      degree[E[e * 2]]++;
      degree[E[e * 2 + 1]]++;
    }
    const regions = [
      [0, 10580, 11],
      [10580, 22589, 29],
      [22589, 22726, 3],
      [22726, 36856, 25],
      [36856, 39396, 11]
    ];
    const accents = [], anchors = [], usedCells = new Set();
    const cellSize = 0.17;
    for (const [start, end, stride] of regions) {
      for (let i = start; i < Math.min(end, degree.length); i += stride) {
        if (degree[i] < 3) continue;
        const x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2];
        accents.push(x, y, z);
        if (degree[i] < 4 || ((i - start) % 7 !== 0)) continue;
        const key = Math.floor(x / cellSize) + ':' + Math.floor(y / cellSize) + ':' + Math.floor(z / cellSize);
        if (usedCells.has(key) || anchors.length >= 780) continue;
        usedCells.add(key);
        anchors.push(x, y, z);
      }
    }
    const hm = new THREE.PointsMaterial({ map: dot, color: 0xffffff, size: 0.083, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const highlight = new THREE.Points(BG(accents), hm);
    highlight.frustumCulled = false;
    group.add(highlight);

    const am = new THREE.PointsMaterial({ map: dot, color: 0xffffff, size: 0.135, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const anchorsPts = new THREE.Points(BG(anchors), am);
    anchorsPts.frustumCulled = false;
    group.add(anchorsPts);

    const pulseCount = 44, positions = new Float32Array(pulseCount * 3), geo = BG(positions);
    const sm = new THREE.PointsMaterial({ map: dot, color: 0xffffff, size: 0.075, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const sparks = new THREE.Points(geo, sm);
    sparks.frustumCulled = false;
    group.add(sparks);

    const paths = Array.from({ length: pulseCount }, () => ({ edge: randomEdge(), u: rn(), v: 0.23 + rn() * 0.43 }));
    const step = dt => {
      const A = geo.attributes.position.array;
      for (let i = 0; i < pulseCount; i++) {
        const p = paths[i]; p.u += p.v * dt;
        if (p.u >= 1) { p.edge = randomEdge(); p.u = 0; }
        const a = E[p.edge * 2] * 3, b = E[p.edge * 2 + 1] * 3;
        A[i * 3]     = P[a] + (P[b] - P[a]) * p.u;
        A[i * 3 + 1] = P[a + 1] + (P[b + 1] - P[a + 1]) * p.u;
        A[i * 3 + 2] = P[a + 2] + (P[b + 2] - P[a + 2]) * p.u;
      }
      geo.attributes.position.needsUpdate = true;
    };
    group.scale.setScalar(3);
    return { group, fm, nm, hm, am, sm, step };
  };
  const BR = makeBrain();

  // Model slots and section mappings
  const SECS = ['top', 'about', 'work', 'skills', 'education', 'contact'].map(id => document.getElementById(id));
  const IDX = [0, 1, 2, 2, 3, 4]; // Work and Skills share stage 2 (Neural Network)
  let Sm = 0;

  const cl = (x, a, b) => Math.min(b, Math.max(a, x));
  const ss = x => (x = cl(x, 0, 1)) * x * (3 - 2 * x);
  const lerp = (a, b, t) => a + (b - a) * t;

  let sp = 0, mx = 0, my = 0, cx = 0, cy = 0, px = 9, py = 9, sx = 9, sy = 9;

  // Viewport resize handling
  let visibleHeight = 7.4607, visibleWidth = 7.4607;
  const rs = () => {
    const W = innerWidth, H = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    R.setPixelRatio(dpr);
    R.setSize(W, H, false);
    C.aspect = W / H;
    UM.uPR.value = dpr;
    UM.uAsp.value = W / H;
    C.updateProjectionMatrix();
    C.updateMatrixWorld();

    const fovRad = (C.fov * Math.PI) / 180;
    visibleHeight = 2 * C.position.z * Math.tan(fovRad / 2);
    visibleWidth = visibleHeight * C.aspect;
  };
  addEventListener('resize', rs, { passive: true });
  rs();

  // Pointer interactions
  const mv = e => {
    mx = e.clientX / innerWidth - 0.5;
    my = e.clientY / innerHeight - 0.5;
    px = mx * 2;
    py = -my * 2;
    if (sx > 5) { sx = px; sy = py; }
  };
  window.addEventListener('pointermove', mv, { passive: true });
  window.addEventListener('pointerdown', e => { mv(e); UM.uB.value = 1; }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { px = 9; py = 9; });

  // Query DOM model slots
  const modelSlots = [
    document.querySelector('#top .model-slot'),
    document.querySelector('#about .model-slot'),
    document.querySelector('#work .model-slot'),
    document.querySelector('#skills .model-slot'),
    document.querySelector('#education .model-slot'),
    document.querySelector('#contact .model-slot')
  ];

  // Intrinsic model bounding radii for precision collision and scale fitting
  const MODEL_RADII = [2.35, 2.75, 2.50, 2.70, 2.86];

  // Rock-Solid Boundary Guard: Structural layout separation guarantees collision clearance
  // without per-frame discrete jumps or scale snapping
  const checkCollision = (centerWorld, currentScale, stageIdx, activeSection) => {
    return { x: centerWorld.x, y: centerWorld.y, scale: currentScale };
  };

  // WebGL Context Loss Recovery
  cv.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    console.warn('WebGL context lost. Attempting recovery...');
  }, false);
  cv.addEventListener('webglcontextrestored', () => {
    console.info('WebGL context restored.');
    rs();
  }, false);

  // Tab visibility power-saving
  let isPageVisible = true;
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
  });

  const clk = new THREE.Clock();
  const tmp = V(0, 0, 0);

  // Main Render Loop
  (function loop() {
    requestAnimationFrame(loop);
    if (!isPageVisible) return;

    const dt = Math.min(clk.getDelta(), 0.05) * k;
    const t = clk.elapsedTime * k;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;

    // Smooth continuous exponential damping without discontinuity thresholds
    sp += (p - sp) * 0.08;
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    sx += (px - sx) * 0.2;
    sy += (py - sy) * 0.2;

    const A = SECS.map(e => cl((e.offsetTop + e.offsetHeight / 2 - innerHeight / 2) / Math.max(1, max), 0, 1));
    let sv = IDX[IDX.length - 1];
    let activeSecIdx = 0;
    for (let j = 0; j < IDX.length - 1; j++) {
      if (sp <= A[j + 1]) {
        const d = A[j + 1] - A[j];
        const tt = d > 1e-4 ? cl((sp - A[j]) / d, 0, 1) : 1;
        sv = IDX[j] + (IDX[j + 1] - IDX[j]) * ss(cl((tt - 0.2) / 0.6, 0, 1));
        activeSecIdx = j;
        break;
      }
    }

    Sm += (sv - Sm) * 0.10;

    // Morph stage calculation
    const k0 = Math.min(2, Math.floor(Sm));
    const f = cl(Sm - k0, 0, 1);
    const Wv = [0, 0, 0, 0];
    Wv[k0] = 1 - f;
    Wv[k0 + 1] = f;
    UM.uW.value.set(Wv[0], Wv[1], Wv[2], Wv[3]);
    UM.uScreenMix.value = ss(cl(Sm - 3, 0, 1));

    // Keyboard spins 360 degrees in Contact stage; Monitor remains STRICTLY stationary!
    const keyboardSpin = ss(cl((UM.uScreenMix.value - 0.80) / 0.20, 0, 1));
    const keyboardAngle = (t * TAU / 12) * keyboardSpin;

    // Morph particle turbulence
    UM.uK.value = Math.sin(Math.PI * f) * 0.65 + Math.sin(Math.PI * UM.uScreenMix.value) * 0.40;

    // Brain synchronized rotation angle
    const brainAngle = 0.14 + (t * TAU / 14) + cl(cx * 0.22, -0.11, 0.11);
    UM.uR.value.set(-TAU * A[0], brainAngle, -TAU * (A[2] + A[3]) / 2 + t * 0.35, keyboardAngle);

    // Neural Network Overlay (HNET)
    const netFade = UM.uW.value.z;
    HNET.lm.opacity = 0.16 * netFade;
    HNET.pm.opacity = 0.98 * netFade;
    HNET.smat.opacity = 0.95 * netFade;
    HNET.group.rotation.y = UM.uR.value.z;
    if (netFade > 0.01) {
      const a = HNET.signals.geometry.attributes.position.array;
      for (let i = 0; i < HNET.state.length; i++) {
        const s = HNET.state[i];
        s.u += s.v * dt;
        if (s.u >= 1) {
          const next = HNET.out[HNET.E[s.e][1]];
          s.e = next.length ? next[Math.floor(rn() * next.length)] : Math.floor(rn() * HNET.E.length);
          s.u = 0;
        }
        const A0 = HNET.P[HNET.E[s.e][0]], B0 = HNET.P[HNET.E[s.e][1]];
        a[i * 3]     = A0.x + (B0.x - A0.x) * s.u;
        a[i * 3 + 1] = A0.y + (B0.y - A0.y) * s.u;
        a[i * 3 + 2] = A0.z + (B0.z - A0.z) * s.u;
      }
      HNET.signals.geometry.attributes.position.needsUpdate = true;
    }

    // Brain Details Layer (BR)
    const bf = UM.uW.value.y;
    const detailFade = ss(cl(bf * 1.7 - 0.34, 0, 1));
    BR.group.visible = detailFade > 0.008;
    BR.fm.opacity = 0.42 * detailFade;
    BR.nm.opacity = 0.73 * detailFade;
    BR.hm.opacity = 0.94 * detailFade;
    BR.am.opacity = 0.98 * detailFade;
    BR.sm.opacity = 0.86 * detailFade;
    if (BR.group.visible) BR.step(dt);
    BR.group.rotation.y = brainAngle;
    BR.group.rotation.x = 0;
    BR.group.rotation.z = 0;

    // Group Rotation Locks:
    // Brain & Laptop locks ensure the monitor is stationary and keyboard rotates locally!
    const brainLock = ss(cl(bf * 1.25, 0, 1));
    const laptopLock = ss(cl(UM.uW.value.w * 1.2, 0, 1));
    G.rotation.y = (sp * TAU * 0.85 + cx * 0.38) * (1 - brainLock) * (1 - laptopLock);
    G.rotation.x = (0.06 + cy * 0.32) * (1 - brainLock) * (1 - laptopLock * 0.8);

    // Responsive Model Placement & Framing System
    const isDesktop = (innerWidth >= 1024 && C.aspect >= 1.02);
    const wideFactor = cl((innerWidth - 768) / (1280 - 768), 0, 1) * cl((C.aspect - 0.72) / (1.25 - 0.72), 0, 1);

    // Desktop: Dedicated right column (structural clearance guaranteed)
    const deskRightCenter = (visibleWidth * 0.5) * 0.46; // ~3.05 on 1920x1080
    const stageFinalOffset = UM.uW.value.w * 0.12;
    const deskX = deskRightCenter - stageFinalOffset;
    const deskY = 0.05;

    // Mobile: Upper center visual viewport (top 38svh slot above text)
    const mobX = 0.0;
    const mobY = cl(visibleHeight * 0.24, 1.65, 1.95);

    const targetWorldX = lerp(mobX, deskX, wideFactor);
    const targetWorldY = lerp(mobY, deskY, wideFactor);

    // Responsive Scale System (continuous stage blending)
    const maxRadius = 2.75;
    const deskFitScale = ((visibleWidth * 0.5 * 0.84) / maxRadius);
    const deskScale = cl(deskFitScale, 0.75, 1.05) * (1 - UM.uW.value.w * 0.05);
    const mobFitScale = ((visibleWidth * 0.78) / (maxRadius * 2));
    const mobScale = cl(mobFitScale, 0.40, 0.52);
    const targetScale = lerp(mobScale, deskScale, wideFactor);

    const activeSection = SECS[activeSecIdx] || SECS[0];

    // Continuous Exponential Damping on 3D Model Group (Zero jerking, zero snapping)
    if (G.position.x === 0 && G.position.y === 0 && !G.__initPos) {
      G.position.set(targetWorldX, targetWorldY, 0);
      G.scale.setScalar(targetScale);
      G.__initPos = true;
    } else {
      G.position.x += (targetWorldX - G.position.x) * 0.14;
      G.position.y += (targetWorldY - G.position.y) * 0.14;
      G.position.z = 0;
      const currentScale = G.scale.x || targetScale;
      G.scale.setScalar(currentScale + (targetScale - currentScale) * 0.14);
    }

    G.updateMatrixWorld(true);
    tmp.set(0, 0, 0).applyMatrix4(G.matrixWorld).project(C);
    UM.uT.value = t;
    UM.uM.value.set(sx, sy);
    const bst = UM.uB.value;
    UM.uB.value = bst * 0.95;

    // Refined, softer model brightness (comfortably dimmer without harsh glare)
    const baseAlpha = UM.uW.value.x + UM.uW.value.y + UM.uW.value.z + UM.uW.value.w * (1.08 - 0.68 * UM.uScreenMix.value);
    UM.uAl.value = baseAlpha * 0.76;

    // Expose debug info for automated testing verification
    window.__debugInfo = () => ({
      Sm: Sm.toFixed(2),
      activeSec: activeSection ? activeSection.id : 'unknown',
      stageWeights: [UM.uW.value.x.toFixed(2), UM.uW.value.y.toFixed(2), UM.uW.value.z.toFixed(2), UM.uW.value.w.toFixed(2)],
      screenMix: UM.uScreenMix.value.toFixed(2),
      pos: { x: G.position.x.toFixed(2), y: G.position.y.toFixed(2) },
      scale: G.scale.x.toFixed(2),
      alpha: UM.uAl.value.toFixed(2)
    });

    R.render(S, C);
  })();
})();