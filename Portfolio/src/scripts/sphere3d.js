// Live 3D sphere that sits in the figure's hands.
// Hold it to charge it up (it grows, brightens and spins faster), drag to turn it,
// let go and it releases a ripple and settles back with a spring.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, SphereGeometry, ShaderMaterial, Mesh, Points,
  BufferGeometry, BufferAttribute, AdditiveBlending, BackSide, FrontSide, Clock,
} from 'three';

const NOISE = /* glsl */ `
float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float a = 0.5, t = 0.0; for (int i = 0; i < 4; i++){ t += a * vnoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return t; }
`;

const VERT = /* glsl */ `
varying vec3 vPos; varying vec3 vN; varying vec3 vV;
void main(){
  vPos = position;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

export function initSphere3d(root, { cz = 4.6, fov = 40 } = {}) {
  const hit = root.querySelector('.sphere__hit');
  const ring = root.querySelector('.sphere__ring');
  const body = root.querySelector('.sphere__body');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    body.appendChild(canvas);
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (_) { return false; }

  const dpr = Math.min((devicePixelRatio || 1) * 1.3, 2.5);
  renderer.setPixelRatio(dpr);
  const scene = new Scene();
  const camera = new PerspectiveCamera(fov, 1, 0.1, 50);
  camera.position.z = cz;

  const group = new Group();
  group.rotation.x = 0.35;
  scene.add(group);

  const uniforms = { uTime: { value: 0 }, uCharge: { value: 0 } };

  // glass rim
  const rimMat = (side, a) => new ShaderMaterial({
    uniforms: { uA: { value: a }, uCharge: uniforms.uCharge },
    vertexShader: VERT,
    fragmentShader: `varying vec3 vPos; varying vec3 vN; varying vec3 vV; uniform float uA; uniform float uCharge;
      void main(){ float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 2.4);
        gl_FragColor = vec4(vec3(0.72, 0.84, 1.0), f * uA * (1.0 + uCharge * 0.9)); }`,
    transparent: true, blending: AdditiveBlending, side, depthWrite: false,
  });
  const shell = new SphereGeometry(1, 64, 64);
  group.add(new Mesh(shell, rimMat(BackSide, 0.28)), new Mesh(shell, rimMat(FrontSide, 0.75)));

  // flowing plasma
  const plasma = new Mesh(new SphereGeometry(0.995, 96, 96), new ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: `varying vec3 vPos; varying vec3 vN; varying vec3 vV; uniform float uTime; uniform float uCharge;
      ${NOISE}
      void main(){
        vec3 p = vPos * 1.7;
        float t = uTime * (0.1 + uCharge * 0.25);
        vec3 q = vec3(fbm(p + t), fbm(p + vec3(5.2, 1.3, 2.8) - t), fbm(p + vec3(2.2, 8.4, 0.5) + t * 0.7));
        float d = fbm(p + 2.0 * q);
        float ridge = 1.0 - abs(d * 2.0 - 1.0);
        float m = pow(smoothstep(0.66, 0.99, ridge), 1.4);
        float facing = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
        float depthA = 0.2 + 0.8 * facing;
        vec3 col = mix(vec3(0.22, 0.36, 1.0), vec3(0.92, 0.96, 1.0), m);
        float a = (m * 0.8 + 0.07 * d) * depthA;
        gl_FragColor = vec4(col * (1.0 + uCharge * 1.1), a * (1.0 + uCharge * 0.7));
      }`,
    transparent: true, blending: AdditiveBlending, depthWrite: false,
  }));
  group.add(plasma);

  // stars inside + dust orbiting outside
  const pointsMat = new ShaderMaterial({
    uniforms: { ...uniforms, uPx: { value: 1 } },
    vertexShader: `uniform float uTime; uniform float uPx; uniform float uCharge; attribute float aSize; varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (2.0 + aSize * 5.0) * uPx * (${cz.toFixed(2)} / -mv.z) * (1.0 + uCharge * 0.5);
        vA = (0.55 + 0.45 * sin(uTime * 1.4 + aSize * 40.0)) * (0.8 + uCharge * 0.6);
      }`,
    fragmentShader: `varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; float g = pow(1.0 - d * 2.0, 1.8); gl_FragColor = vec4(0.82, 0.9, 1.0, g * vA); }`,
    transparent: true, blending: AdditiveBlending, depthWrite: false,
  });
  const cloud = (n, rMin, rMax, flat) => {
    const pos = new Float32Array(n * 3), size = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = rMin + (rMax - rMin) * Math.cbrt(Math.random());
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * (flat ? 0.45 : 1);
      pos[i * 3 + 2] = r * Math.cos(ph);
      size[i] = Math.random();
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aSize', new BufferAttribute(size, 1));
    return new Points(g, pointsMat);
  };
  const stars = cloud(420, 0, 0.93, false);
  const dust = cloud(170, 1.18, 1.85, true);
  group.add(stars);
  const outer = new Group();
  outer.add(dust);
  outer.rotation.z = 0.45;
  scene.add(outer);

  const resize = () => {
    const w = Math.max(1, body.clientWidth), h = Math.max(1, body.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pointsMat.uniforms.uPx.value = (h * dpr) / 360;
    if (reduce) draw();
  };
  new ResizeObserver(resize).observe(body);

  /* interaction state */
  const s = { held: false, charge: 0, k: 1, kv: 0, spinV: 0, id: null, lx: 0, ly: 0, mx: 0, my: 0, tilt: 0.35 };
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function release() {
    if (!s.held) return;
    s.held = false;
    const c = s.charge;
    if (c > 0.2) {
      s.spinV += c * 9;
      s.kv += c * 5;
      ring.classList.remove('is-go'); void ring.offsetWidth; ring.classList.add('is-go');
    }
  }
  hit.addEventListener('pointerdown', (e) => {
    s.held = true; s.id = e.pointerId; s.lx = e.clientX; s.ly = e.clientY;
    hit.setPointerCapture(e.pointerId);
    root.classList.add('is-held');
  });
  hit.addEventListener('pointermove', (e) => {
    if (!s.held) return;
    const dx = e.clientX - s.lx, dy = e.clientY - s.ly;
    s.lx = e.clientX; s.ly = e.clientY;
    group.rotation.y += dx * 0.014;
    s.tilt = clamp(s.tilt + dy * 0.01, -0.9, 0.9);
    s.spinV += clamp(dx, -40, 40) * 0.05;
  });
  const up = () => { release(); root.classList.remove('is-held'); };
  hit.addEventListener('pointerup', up);
  hit.addEventListener('pointercancel', up);
  hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.charge = 1; s.held = true; setTimeout(up, 450); } });
  // moving the cursor past the sphere stirs it
  addEventListener('pointermove', (e) => {
    const r = body.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    s.mx = clamp(dx / innerWidth, -0.5, 0.5); s.my = clamp(dy / innerHeight, -0.5, 0.5);
    if (!s.held && s.lastX !== undefined) {
      const d = Math.hypot(dx, dy), reach = Math.max(280, r.width * 1.2);
      if (d < reach) s.spinV += clamp(e.clientX - s.lastX, -50, 50) * (1 - d / reach) * 0.012;
    }
    s.lastX = e.clientX;
  }, { passive: true });

  const clock = new Clock();
  let visible = true, raf = 0, live = false;
  function draw() { renderer.render(scene, camera); }
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    uniforms.uTime.value = t;
    s.charge += ((s.held ? 1 : 0) - s.charge) * (1 - Math.exp(-dt * (s.held ? 2.4 : 5)));
    const target = 1 + s.charge * 0.3;
    s.kv += (target - s.k) * 150 * dt;
    s.kv *= Math.exp(-dt * 9);
    s.k += s.kv * dt;
    body.style.transform = `scale(${s.k.toFixed(4)})`;
    uniforms.uCharge.value = s.charge;
    s.spinV *= Math.exp(-dt * 1.7);
    group.rotation.y += (0.32 + s.charge * 3.2 + s.spinV) * dt;
    group.rotation.x += ((s.tilt + s.my * 0.7) - group.rotation.x) * (1 - Math.exp(-dt * 4));
    s.tilt += (0.35 - s.tilt) * (1 - Math.exp(-dt * (s.held ? 0 : 1.2)));
    plasma.rotation.y = t * 0.07;
    outer.rotation.y += (0.14 + s.charge * 0.5) * dt;
    outer.scale.setScalar(1 + s.charge * 0.28);
    stars.rotation.y -= 0.05 * dt;
    draw();
    if (!live) { live = true; root.classList.add('is-live'); }
    if (visible && !reduce) raf = requestAnimationFrame(frame);
  }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) { clock.getDelta(); raf = requestAnimationFrame(frame); }
  }).observe(root);
  resize();
  raf = requestAnimationFrame(frame);
  return true;
}
