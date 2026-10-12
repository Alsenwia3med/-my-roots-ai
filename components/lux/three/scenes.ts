/**
 * Lux 3D — one small WebGL engine and the scenes that sit beside each page's title.
 *
 * Every scene is built from the same vocabulary so the site reads as one world: pearl and teal
 * gloss materials lit by a soft studio environment, thin neon-teal orbit lines, drifting motes,
 * and a contact shadow so the object rests on the white page instead of floating on it.
 *
 * Scenes are purely decorative (the canvas is aria-hidden). They render only while on screen,
 * pause in background tabs, follow the pointer gently, and hold still under reduced motion.
 */

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type SceneVariant =
  | "core"
  | "helix"
  | "flow"
  | "layers"
  | "lattice"
  | "panels"
  | "beacon"
  | "dialog"
  | "wave"
  | "rings"
  | "shield"
  | "orb";

export interface Anchor {
  x: number;
  y: number;
  /** 0 (far) … 1 (near), for depth-sorting overlays. */
  depth: number;
}

export interface MountOptions {
  reduced: boolean;
  /** Called every frame with screen-space anchors (CSS px relative to the host), where a scene has any. */
  onAnchors?: (anchors: Anchor[]) => void;
  /** Cap the frame rate (ambient scenes that stay on screen for a long time). */
  fps?: number;
}

/* ------------------------------------------------------------------ palette */
const C = {
  deep: new THREE.Color("#032a33"),
  teal: new THREE.Color("#055564"),
  teal2: new THREE.Color("#0b7f90"),
  cyan: new THREE.Color("#19a7b8"),
  neon: new THREE.Color("#8fe6ea"),
  pearl: new THREE.Color("#f4fafb"),
  ivory: new THREE.Color("#e8f3f5"),
};

/* ------------------------------------------------------------------ materials */
function materials() {
  return {
    pearl: new THREE.MeshPhysicalMaterial({
      color: C.pearl,
      roughness: 0.26,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      sheen: 1,
      sheenColor: C.neon,
      sheenRoughness: 0.45,
      iridescence: 0.35,
      iridescenceIOR: 1.3,
    }),
    teal: new THREE.MeshPhysicalMaterial({
      color: C.teal2,
      roughness: 0.2,
      metalness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      emissive: C.cyan,
      emissiveIntensity: 0.12,
    }),
    deep: new THREE.MeshPhysicalMaterial({
      color: C.teal,
      roughness: 0.18,
      metalness: 0.35,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    }),
    glow: new THREE.MeshPhysicalMaterial({
      color: C.cyan,
      roughness: 0.3,
      metalness: 0,
      emissive: C.cyan,
      emissiveIntensity: 0.55,
      clearcoat: 1,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#dff6f8"),
      roughness: 0.06,
      metalness: 0,
      transparent: true,
      opacity: 0.24,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      iridescence: 0.5,
      iridescenceIOR: 1.25,
      envMapIntensity: 1.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    line: new THREE.MeshBasicMaterial({ color: C.cyan, transparent: true, opacity: 0.55 }),
    lineSoft: new THREE.MeshBasicMaterial({ color: C.teal2, transparent: true, opacity: 0.22 }),
  };
}
type Mats = ReturnType<typeof materials>;

/* ------------------------------------------------------------------ textures */
function radialTexture(inner: string, outer: string, size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------------------------------------------------ helpers */
interface Ctx {
  scene: THREE.Scene;
  root: THREE.Group;
  camera: THREE.PerspectiveCamera;
  m: Mats;
  small: boolean;
  sprite: THREE.Texture;
}

function contactShadow(ctx: Ctx, y: number, size: number, strength = 0.32) {
  const tex = radialTexture(`rgba(3,42,51,${strength})`, "rgba(3,42,51,0)", 256);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.renderOrder = -1;
  ctx.scene.add(mesh);
  return mesh;
}

function motes(ctx: Ctx, count: number, rMin: number, rMax: number, color = C.teal2, size = 0.05, opacity = 0.55) {
  const n = ctx.small ? Math.round(count * 0.55) : count;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = rMin + Math.random() * (rMax - rMin);
    const u = Math.random() * 2 - 1;
    const a = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    pos[i * 3] = r * s * Math.cos(a);
    pos[i * 3 + 1] = r * u * 0.8;
    pos[i * 3 + 2] = r * s * Math.sin(a);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color,
      size,
      map: ctx.sprite,
      transparent: true,
      opacity,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  return pts;
}

function ring(radius: number, tube: number, mat: THREE.Material, arc = Math.PI * 2, seg = 160) {
  return new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, seg, arc), mat);
}

function glowSprite(ctx: Ctx, scale: number, color = "rgba(143,230,234,0.9)") {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: radialTexture(color, "rgba(143,230,234,0)", 128),
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.scale.setScalar(scale);
  return sprite;
}

type Built = { update: (t: number, dt: number) => void; anchors?: () => THREE.Vector3[] };

/* ================================================================== scenes */

/** A soft fresnel rim of light — makes glass read as glass on a white page. */
function rimMaterial(color = C.neon, power = 2.6, strength = 0.9) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: color.clone() }, uPower: { value: power }, uStrength: { value: strength } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uPower; uniform float uStrength;
      varying vec3 vN; varying vec3 vV;
      void main(){
        float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), uPower);
        gl_FragColor = vec4(uColor * f * uStrength, f * uStrength);
      }`,
  });
}

/** A heartbeat envelope: a strong beat, a softer echo, then rest (≈ 66 bpm). */
function heartbeat(t: number) {
  const p = (t % 0.9) / 0.9;
  const beat = (c: number, w: number) => Math.exp(-((p - c) * (p - c)) / w);
  return beat(0.08, 0.0012) + beat(0.24, 0.0018) * 0.55;
}

/**
 * Home — a living biological intelligence: a breathing nucleus that beats like a heart inside a
 * glass cell, a diagnostic scan sweeping through it, and seven domains in orbit that keep sending
 * signals inward along fine synapses — many sources, one connected reading.
 */
function core(ctx: Ctx): Built {
  const { root, m } = ctx;
  ctx.camera.position.set(0, 0.2, 9.6);

  /* the nucleus: an organic surface that breathes (vertex displacement) */
  const nGeo = new THREE.IcosahedronGeometry(0.7, ctx.small ? 3 : 4);
  const base = (nGeo.attributes.position.array as Float32Array).slice();
  const nucleus = new THREE.Mesh(nGeo, m.teal);
  root.add(nucleus);
  const heart = glowSprite(ctx, 3.2, "rgba(25,167,184,0.55)");
  root.add(heart);

  /* an inner lattice of thought and a cloud of signal inside the cell */
  const lattice = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.02, 1),
    new THREE.MeshBasicMaterial({ color: C.cyan, wireframe: true, transparent: true, opacity: 0.16 }),
  );
  root.add(lattice);
  const inner = motes(ctx, 260, 0.82, 1.25, C.cyan, 0.04, 0.7);
  root.add(inner);

  /* the glass cell, with a rim of light so it reads on white */
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1.34, 72, 72), m.glass);
  root.add(shell);
  const rim = new THREE.Mesh(new THREE.SphereGeometry(1.36, 64, 64), rimMaterial(C.cyan, 2.4, 0.75));
  root.add(rim);

  /* a diagnostic scan: a thin ring of light travelling up and down through the cell */
  const scanMat = new THREE.MeshBasicMaterial({ color: C.neon, transparent: true, opacity: 0.85, depthWrite: false });
  const scan = ring(1, 0.008, scanMat, Math.PI * 2, 120);
  scan.rotation.x = Math.PI / 2;
  root.add(scan);
  const scanGlow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 64),
    new THREE.MeshBasicMaterial({
      map: radialTexture("rgba(143,230,234,0)", "rgba(143,230,234,0.28)", 128),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  scanGlow.rotation.x = Math.PI / 2;
  root.add(scanGlow);

  /* three orbital planes, each tilted so it reads as an open ellipse rather than a line */
  const orbits = new THREE.Group();
  root.add(orbits);
  const planes = [
    { tilt: [1.02, 0.12, 0.28], r: 1.95, dir: 1, mat: m.line },
    { tilt: [1.28, -0.4, -0.55], r: 2.32, dir: -1, mat: m.lineSoft },
    { tilt: [0.92, 0.45, 1.05], r: 2.62, dir: 1, mat: m.lineSoft },
  ];
  const ringGroups = planes.map((pl) => {
    const g = new THREE.Group();
    g.rotation.set(pl.tilt[0], pl.tilt[1], pl.tilt[2]);
    g.add(ring(pl.r, 0.006, pl.mat));
    orbits.add(g);
    return g;
  });

  /* seven satellites, evenly spaced on their orbits so their labels never collide */
  const plan: Array<[ring: number, phase: number]> = [
    [0, 0],
    [1, 0.55],
    [2, 1.25],
    [0, 2.09],
    [1, 3.7],
    [2, 4.4],
    [0, 4.19],
  ];
  const sats = plan.map(([ri, phase], i) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(i === 0 ? 0.16 : 0.125, 32, 32), i % 3 === 0 ? m.deep : m.pearl);
    s.add(glowSprite(ctx, 0.66));
    ringGroups[ri].add(s);
    return { mesh: s, r: planes[ri].r, phase, speed: 0.13 * planes[ri].dir };
  });

  /* synapses: a fine curved line from every domain to the nucleus, with a pulse running inward */
  const SEG = 28;
  const synapseMat = new THREE.LineBasicMaterial({ color: C.cyan, transparent: true, opacity: 0.32, depthWrite: false });
  const synapses = sats.map((_, i) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array((SEG + 1) * 3), 3));
    const line = new THREE.Line(geo, synapseMat);
    root.add(line);
    const pulse = glowSprite(ctx, 0.34, "rgba(143,230,234,1)");
    root.add(pulse);
    return { geo, pulse, offset: i / sats.length + i * 0.13 };
  });

  const dust = motes(ctx, 700, 2.9, 4.2, C.teal2, 0.04, 0.38);
  root.add(dust);
  contactShadow(ctx, -2.75, 5.6, 0.24);

  const tmp = new THREE.Vector3();
  const a = new THREE.Vector3();
  const ctrl = new THREE.Vector3();
  const pt = new THREE.Vector3();
  const pos = nGeo.attributes.position as THREE.BufferAttribute;
  const arr = pos.array as Float32Array;
  let frame = 0;

  return {
    update(t) {
      const hb = heartbeat(t);

      /* breathing nucleus: three slow waves across the surface, lifted by each heartbeat */
      if (frame++ % (ctx.small ? 2 : 1) === 0) {
        for (let i = 0; i < arr.length; i += 3) {
          const x = base[i], y = base[i + 1], z = base[i + 2];
          const n =
            Math.sin(x * 4.2 + t * 1.3) * 0.5 + Math.sin(y * 5.1 - t * 1.1) * 0.35 + Math.sin(z * 4.6 + t * 0.9) * 0.4;
          const k = 1 + n * 0.035 + hb * 0.05;
          arr[i] = x * k;
          arr[i + 1] = y * k;
          arr[i + 2] = z * k;
        }
        pos.needsUpdate = true;
        nGeo.computeVertexNormals();
      }
      heart.material.opacity = 0.55 + hb * 0.45;
      heart.scale.setScalar(3.0 + hb * 0.5);
      (m.teal as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.12 + hb * 0.35;

      lattice.rotation.set(t * 0.1, -t * 0.15, 0);
      inner.rotation.set(t * 0.08, t * 0.22, 0);
      shell.rotation.y = t * 0.05;
      dust.rotation.y = -t * 0.02;

      /* scan sweeps from pole to pole (ease in-out), its radius following the sphere */
      const sy = Math.sin(t * 0.55) * 1.16;
      const sr = Math.sqrt(Math.max(0.0001, 1.34 * 1.34 - sy * sy));
      scan.position.y = sy;
      scan.scale.setScalar(sr);
      scanGlow.position.y = sy;
      scanGlow.scale.setScalar(sr);
      scanMat.opacity = 0.35 + (1 - Math.abs(sy) / 1.16) * 0.5;

      for (const s of sats) {
        const ang = s.phase + t * s.speed;
        s.mesh.position.set(Math.cos(ang) * s.r, Math.sin(ang) * s.r, 0);
      }

      /* synapses follow their domain; the pulse travels from the domain into the nucleus */
      root.updateMatrixWorld();
      sats.forEach((s, i) => {
        s.mesh.getWorldPosition(a);
        root.worldToLocal(a);
        ctrl.copy(a).multiplyScalar(0.45);
        ctrl.y += 0.35;
        const attr = synapses[i].geo.attributes.position as THREE.BufferAttribute;
        const la = attr.array as Float32Array;
        for (let k = 0; k <= SEG; k++) {
          const u = k / SEG;
          const iu = 1 - u;
          /* quadratic bezier: domain → control → the centre of the nucleus */
          la[k * 3] = iu * iu * a.x + 2 * iu * u * ctrl.x;
          la[k * 3 + 1] = iu * iu * a.y + 2 * iu * u * ctrl.y;
          la[k * 3 + 2] = iu * iu * a.z + 2 * iu * u * ctrl.z;
        }
        attr.needsUpdate = true;
        const u = (t * 0.32 + synapses[i].offset) % 1;
        const iu = 1 - u;
        pt.set(
          iu * iu * a.x + 2 * iu * u * ctrl.x,
          iu * iu * a.y + 2 * iu * u * ctrl.y,
          iu * iu * a.z + 2 * iu * u * ctrl.z,
        );
        synapses[i].pulse.position.copy(pt);
        synapses[i].pulse.material.opacity = Math.sin(u * Math.PI) * 0.95;
      });
    },
    anchors() {
      /* seven satellites, then the nucleus (for the readout) */
      return [...sats.map((s) => s.mesh.getWorldPosition(tmp.clone())), nucleus.getWorldPosition(tmp.clone())];
    },
  };
}

/** About — a double helix: biology adapting long before a diagnosis. */
function helix(ctx: Ctx): Built {
  const { root, m } = ctx;
  ctx.camera.position.set(0, 0, 11.2);
  const g = new THREE.Group();
  g.rotation.z = -0.5;
  root.add(g);
  const pairs = ctx.small ? 18 : 26;
  const height = 6.2;
  const ball = new THREE.SphereGeometry(0.15, 32, 32);
  const rung = new THREE.CylinderGeometry(0.022, 0.022, 1, 10);
  for (let i = 0; i < pairs; i++) {
    const k = i / (pairs - 1);
    const y = (k - 0.5) * height;
    const a = k * Math.PI * 3.4;
    const r = 1.05;
    const p1 = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    const p2 = new THREE.Vector3(Math.cos(a + Math.PI) * r, y, Math.sin(a + Math.PI) * r);
    const b1 = new THREE.Mesh(ball, i % 4 === 0 ? m.glow : m.teal);
    b1.position.copy(p1);
    const b2 = new THREE.Mesh(ball, m.pearl);
    b2.position.copy(p2);
    g.add(b1, b2);
    const link = new THREE.Mesh(rung, i % 2 ? m.glass : m.lineSoft);
    link.position.copy(p1).add(p2).multiplyScalar(0.5);
    link.scale.y = p1.distanceTo(p2);
    link.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
    g.add(link);
  }
  /* backbone curves */
  [0, Math.PI].forEach((off, j) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 160; i++) {
      const k = i / 160;
      const a = k * Math.PI * 3.4 + off;
      pts.push(new THREE.Vector3(Math.cos(a) * 1.05, (k - 0.5) * height, Math.sin(a) * 1.05));
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.035, 10), j ? m.pearl : m.deep);
    g.add(tube);
  });
  root.add(motes(ctx, 520, 1.8, 3.6, C.cyan, 0.04, 0.4));
  contactShadow(ctx, -3.35, 4.4, 0.22);
  return {
    update(t) {
      g.rotation.y = t * 0.32;
    },
  };
}

/** How it works — six glass stages in sequence, with a light passing through each in turn. */
function flow(ctx: Ctx): Built {
  const { root, m } = ctx;
  ctx.camera.position.set(0, 1.8, 11.2);
  ctx.camera.lookAt(0, 0, 0);
  const g = new THREE.Group();
  g.rotation.set(0.42, -0.7, 0);
  root.add(g);
  const plates: THREE.Mesh[] = [];
  const geo = new RoundedBoxGeometry(2.6, 0.12, 2.6, 4, 0.12);
  const edge = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.6, 0.12, 2.6));
  for (let i = 0; i < 6; i++) {
    const plate = new THREE.Mesh(geo, i === 0 ? m.deep : i === 5 ? m.teal : m.glass);
    plate.position.y = 2.1 - i * 0.84;
    const lines = new THREE.LineSegments(edge, new THREE.LineBasicMaterial({ color: C.cyan, transparent: true, opacity: 0.35 }));
    plate.add(lines);
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), m.glow);
    node.position.set(0.95, 0.1, 0.95);
    plate.add(node);
    g.add(plate);
    plates.push(plate);
  }
  const packet = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 32), m.pearl);
  const packetGlow = glowSprite(ctx, 1.4);
  packet.add(packetGlow);
  g.add(packet);
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 4.6, 8), m.line);
  spine.position.y = 0;
  g.add(spine);
  root.add(motes(ctx, 360, 2.4, 4, C.teal2, 0.04, 0.35));
  contactShadow(ctx, -3.2, 6, 0.2);
  return {
    update(t) {
      const cycle = (t * 0.32) % 1;
      const y = 2.5 - cycle * 5;
      packet.position.set(0, y, 0);
      packetGlow.material.opacity = Math.sin(cycle * Math.PI);
      plates.forEach((p, i) => {
        const d = Math.abs(p.position.y - y);
        const lit = Math.max(0, 1 - d * 1.6);
        p.scale.setScalar(1 + lit * 0.05);
        p.position.x = Math.sin(t * 0.8 + i * 0.7) * 0.05;
      });
      g.rotation.y = -0.7 + Math.sin(t * 0.25) * 0.12;
    },
  };
}

/** Platform — one foundation, deeper layers around it: an available core inside opening shells. */
function layers(ctx: Ctx): Built {
  const { root, m } = ctx;
  ctx.camera.position.set(0, 0.4, 10.2);
  const coreBall = new THREE.Mesh(new THREE.SphereGeometry(0.7, 64, 64), m.teal);
  root.add(coreBall);
  root.add(glowSprite(ctx, 3, "rgba(25,167,184,0.5)"));
  const shells: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const r = 1.05 + i * 0.36;
    const mat = (m.glass as THREE.MeshPhysicalMaterial).clone();
    mat.opacity = 0.32 - i * 0.04;
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48, 0, Math.PI * (1.25 + i * 0.12)), mat);
    s.rotation.set(i * 0.5, i * 1.1, i * 0.3);
    const rim = ring(r, 0.008, i % 2 ? m.line : m.lineSoft);
    rim.rotation.x = Math.PI / 2;
    s.add(rim);
    root.add(s);
    shells.push(s);
  }
  root.add(motes(ctx, 600, 3, 4.2, C.teal2, 0.04, 0.4));
  contactShadow(ctx, -3.1, 5.6, 0.24);
  return {
    update(t) {
      coreBall.scale.setScalar(1 + Math.sin(t * 1.4) * 0.03);
      shells.forEach((s, i) => {
        s.rotation.y += 0.0016 * (i % 2 ? -1 : 1) * (1 + i * 0.3);
        s.rotation.x = i * 0.5 + Math.sin(t * 0.3 + i) * 0.12;
      });
    },
  };
}

/** Research — a governed network: nodes and links drawn with care, a few signals in motion. */
function lattice(ctx: Ctx): Built {
  const { root, m } = ctx;
  ctx.camera.position.set(0, 0, 8.6);
  const n = ctx.small ? 34 : 48;
  const nodes: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = golden * i;
    const rad = 2.1 + (Math.random() - 0.5) * 0.5;
    nodes.push(new THREE.Vector3(Math.cos(a) * r * rad, y * rad, Math.sin(a) * r * rad));
  }
  const g = new THREE.Group();
  root.add(g);
  const ball = new THREE.SphereGeometry(0.09, 20, 20);
  const meshes = nodes.map((p, i) => {
    const mesh = new THREE.Mesh(ball, i % 7 === 0 ? m.glow : i % 3 === 0 ? m.deep : m.pearl);
    mesh.position.copy(p);
    g.add(mesh);
    return mesh;
  });
  const seg: number[] = [];
  nodes.forEach((p, i) => {
    const near = nodes
      .map((q, j) => ({ j, d: p.distanceTo(q) }))
      .filter((o) => o.j > i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
    near.forEach(({ j }) => seg.push(p.x, p.y, p.z, nodes[j].x, nodes[j].y, nodes[j].z));
  });
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
  g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: C.teal2, transparent: true, opacity: 0.28 })));
  const inner = new THREE.Mesh(new THREE.SphereGeometry(1.1, 48, 48), m.glass);
  g.add(inner);
  root.add(motes(ctx, 380, 2.8, 4, C.cyan, 0.035, 0.35));
  contactShadow(ctx, -3, 5.4, 0.2);
  return {
    update(t) {
      g.rotation.y = t * 0.12;
      g.rotation.x = Math.sin(t * 0.2) * 0.15;
      meshes.forEach((mesh, i) => {
        if (i % 7 === 0) mesh.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.35);
      });
    },
  };
}

/** Healthcare professionals — a transparent report: layered glass sheets read through a lens. */
function panels(ctx: Ctx): Built {
  const { root, m } = ctx;
  ctx.camera.position.set(0, 0.2, 9);
  const g = new THREE.Group();
  g.rotation.set(-0.12, -0.55, 0.06);
  root.add(g);
  const sheet = new RoundedBoxGeometry(2.6, 3.3, 0.06, 4, 0.06);
  const sheets: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(sheet, i === 0 ? m.pearl : m.glass);
    s.position.set(i * 0.55, i * 0.12, -i * 0.75);
    g.add(s);
    sheets.push(s);
    if (i === 0) {
      /* bars on the front sheet — a report you can see through */
      for (let k = 0; k < 6; k++) {
        const w = 0.6 + ((k * 37) % 10) / 10 * 1.3;
        const bar = new THREE.Mesh(new RoundedBoxGeometry(w, 0.12, 0.04, 2, 0.04), k % 2 ? m.teal : m.glow);
        bar.position.set(-1.05 + w / 2, 1.1 - k * 0.42, 0.06);
        s.add(bar);
      }
    }
  }
  const lens = new THREE.Group();
  lens.add(new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.07, 24, 96), m.deep));
  lens.add(new THREE.Mesh(new THREE.CircleGeometry(0.68, 64), m.glass));
  lens.position.set(-0.9, -0.6, 1.2);
  root.add(lens);
  root.add(motes(ctx, 320, 2.6, 4, C.teal2, 0.04, 0.35));
  contactShadow(ctx, -2.6, 5.2, 0.22);
  return {
    update(t) {
      g.rotation.y = -0.55 + Math.sin(t * 0.3) * 0.16;
      sheets.forEach((s, i) => (s.position.y = i * 0.12 + Math.sin(t * 0.9 + i) * 0.06));
      lens.position.x = -0.9 + Math.sin(t * 0.5) * 0.5;
      lens.position.y = -0.6 + Math.cos(t * 0.4) * 0.35;
      lens.rotation.y = Math.sin(t * 0.5) * 0.3;
    },
  };
}

/** Pilot — an open invitation: a beacon sending gentle waves outward. */
function beacon(ctx: Ctx): Built {
  const { root, m } = ctx;
  ctx.camera.position.set(0, 1.4, 8.6);
  ctx.camera.lookAt(0, 0, 0);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.85, 64, 64), m.pearl);
  orb.position.y = 0.25;
  root.add(orb);
  const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(0.45, 48, 48), m.glow);
  coreGlow.position.y = 0.25;
  root.add(coreGlow);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1.05, 64, 64), m.glass);
  shell.position.y = 0.25;
  root.add(shell);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.18, 96), m.deep);
  base.position.y = -1;
  root.add(base);
  const waves: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const w = ring(1, 0.012, (m.line as THREE.MeshBasicMaterial).clone());
    w.rotation.x = Math.PI / 2;
    w.position.y = -0.9;
    root.add(w);
    waves.push(w);
  }
  const sats = [0, 1, 2].map((i) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 24), i ? m.pearl : m.teal);
    root.add(s);
    return s;
  });
  root.add(motes(ctx, 420, 2.4, 4, C.cyan, 0.04, 0.35));
  contactShadow(ctx, -1.12, 6, 0.26);
  return {
    update(t) {
      orb.position.y = coreGlow.position.y = shell.position.y = 0.25 + Math.sin(t * 1.1) * 0.08;
      coreGlow.scale.setScalar(1 + Math.sin(t * 2.2) * 0.06);
      waves.forEach((w, i) => {
        const k = (t * 0.35 + i / waves.length) % 1;
        w.scale.setScalar(1.6 + k * 2.6);
        (w.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.6;
      });
      sats.forEach((s, i) => {
        const a = t * (0.5 + i * 0.12) + i * 2.1;
        s.position.set(Math.cos(a) * (1.7 + i * 0.25), 0.3 + Math.sin(a * 1.3) * 0.4, Math.sin(a) * (1.7 + i * 0.25));
      });
    },
  };
}

/** Contact — two rings in conversation, linked and turning together. */
function dialog(ctx: Ctx): Built {
  const { root, m } = ctx;
  ctx.camera.position.set(0, 0.2, 8.4);
  const g = new THREE.Group();
  root.add(g);
  const a = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.2, 48, 160), m.pearl);
  const b = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.2, 48, 160), m.deep);
  a.position.x = -0.62;
  b.position.x = 0.62;
  b.rotation.y = Math.PI / 2;
  g.add(a, b);
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), m.glow);
  spark.add(glowSprite(ctx, 0.9));
  g.add(spark);
  root.add(motes(ctx, 460, 2.4, 3.8, C.teal2, 0.04, 0.38));
  contactShadow(ctx, -2.3, 5.4, 0.24);
  return {
    update(t) {
      g.rotation.y = t * 0.22;
      g.rotation.x = Math.sin(t * 0.3) * 0.25 + 0.2;
      const k = t * 0.9;
      spark.position.set(Math.cos(k) * 0.62 * Math.sign(Math.sin(k * 0.5)) , Math.sin(k) * 1.25, 0);
    },
  };
}

/** Blog — a field of insight: a calm particle surface breathing in waves. */
function wave(ctx: Ctx): Built {
  const { root } = ctx;
  ctx.camera.position.set(0, 2.6, 8.2);
  ctx.camera.lookAt(0, -0.2, 0);
  const cols = ctx.small ? 46 : 70;
  const rows = ctx.small ? 30 : 44;
  const pos = new Float32Array(cols * rows * 3);
  const colors = new Float32Array(cols * rows * 3);
  const c = new THREE.Color();
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const k = (i * rows + j) * 3;
      pos[k] = (i / (cols - 1) - 0.5) * 6.4;
      pos[k + 2] = (j / (rows - 1) - 0.5) * 5;
      c.copy(C.teal).lerp(C.cyan, i / cols);
      colors[k] = c.r;
      colors[k + 1] = c.g;
      colors[k + 2] = c.b;
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 0.07, map: ctx.sprite, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false }),
  );
  root.add(pts);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 48, 48), ctx.m.pearl);
  orb.position.set(1.2, 0.9, 0);
  root.add(orb);
  orb.add(glowSprite(ctx, 2.2, "rgba(143,230,234,0.5)"));
  return {
    update(t) {
      const arr = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        const x = arr[i];
        const z = arr[i + 2];
        arr[i + 1] = Math.sin(x * 0.9 + t * 0.9) * 0.28 + Math.cos(z * 1.2 + t * 0.7) * 0.22 - 0.6;
      }
      geo.attributes.position.needsUpdate = true;
      orb.position.y = 0.9 + Math.sin(t) * 0.12;
    },
  };
}

/** Example report — seven domains as concentric arcs, each drawn to its own length. */
function rings(ctx: Ctx): Built {
  const { root, m } = ctx;
  ctx.camera.position.set(0, 0.6, 10.8);
  const g = new THREE.Group();
  g.rotation.set(-0.55, 0.35, 0);
  root.add(g);
  const arcs: { mesh: THREE.Mesh; target: number }[] = [];
  const lengths = [0.62, 0.48, 0.71, 0.55, 0.39, 0.66, 0.58];
  lengths.forEach((len, i) => {
    const r = 0.9 + i * 0.27;
    g.add(ring(r, 0.035, m.glass));
    const arc = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 18, 200, Math.PI * 2 * len), i % 2 ? m.teal : m.glow);
    arc.rotation.z = Math.PI / 2;
    g.add(arc);
    arcs.push({ mesh: arc, target: len });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 20), m.pearl);
    const a = Math.PI / 2 + Math.PI * 2 * len;
    cap.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
    g.add(cap);
  });
  const centre = new THREE.Mesh(new THREE.SphereGeometry(0.55, 48, 48), m.pearl);
  g.add(centre);
  root.add(motes(ctx, 380, 3, 4.2, C.teal2, 0.04, 0.35));
  contactShadow(ctx, -2.7, 6, 0.2);
  return {
    update(t) {
      g.rotation.z = t * 0.08;
      g.rotation.y = 0.35 + Math.sin(t * 0.3) * 0.15;
      arcs.forEach((a, i) => (a.mesh.position.z = Math.sin(t * 0.8 + i * 0.6) * 0.05));
    },
  };
}

/** Legal notices — a glass shield holding a quiet core: protection, clearly bounded. */
function shield(ctx: Ctx): Built {
  const { root, m } = ctx;
  ctx.camera.position.set(0, 0.2, 8.2);
  const s = new THREE.Shape();
  s.moveTo(0, 1.6);
  s.bezierCurveTo(0.7, 1.35, 1.15, 1.32, 1.35, 1.25);
  s.bezierCurveTo(1.35, 0.1, 1.05, -0.95, 0, -1.65);
  s.bezierCurveTo(-1.05, -0.95, -1.35, 0.1, -1.35, 1.25);
  s.bezierCurveTo(-1.15, 1.32, -0.7, 1.35, 0, 1.6);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.12, bevelSegments: 8, curveSegments: 48 });
  geo.center();
  const body = new THREE.Mesh(geo, m.glass);
  const frame = new THREE.Mesh(geo, m.pearl);
  frame.scale.set(1.02, 1.02, 0.4);
  frame.position.z = -0.22;
  const g = new THREE.Group();
  g.add(frame, body);
  const coreBall = new THREE.Mesh(new THREE.SphereGeometry(0.42, 48, 48), m.teal);
  coreBall.add(glowSprite(ctx, 2, "rgba(25,167,184,0.55)"));
  g.add(coreBall);
  const orbit = ring(2.05, 0.008, m.line);
  orbit.rotation.x = 1.25;
  g.add(orbit);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 20), m.glow);
  g.add(dot);
  root.add(g);
  root.add(motes(ctx, 360, 2.6, 3.8, C.teal2, 0.04, 0.35));
  contactShadow(ctx, -2.4, 4.6, 0.24);
  return {
    update(t) {
      g.rotation.y = Math.sin(t * 0.45) * 0.55;
      g.position.y = Math.sin(t * 0.9) * 0.08;
      coreBall.scale.setScalar(1 + Math.sin(t * 1.8) * 0.05);
      const a = t * 0.8;
      dot.position.set(Math.cos(a) * 2.05, Math.sin(a) * 2.05 * Math.cos(1.25), Math.sin(a) * 2.05 * Math.sin(1.25));
    },
  };
}

/** Assessment — a calm, breathing orb that keeps the participant company. */
function orb(ctx: Ctx): Built {
  const { root, m } = ctx;
  ctx.camera.position.set(0, 0, 7.2);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1.15, 72, 72), m.pearl);
  root.add(ball);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(1.5, 72, 72), m.glass);
  root.add(glass);
  root.add(glowSprite(ctx, 4.2, "rgba(143,230,234,0.45)"));
  const rs = [0, 1].map((i) => {
    const r = ring(1.95 + i * 0.3, 0.007, i ? m.lineSoft : m.line);
    r.rotation.set(1.2 + i * 0.3, i * 0.6, 0);
    root.add(r);
    return r;
  });
  root.add(motes(ctx, 420, 2.2, 3.4, C.cyan, 0.035, 0.32));
  return {
    update(t) {
      const k = 1 + Math.sin(t * 0.9) * 0.035;
      ball.scale.setScalar(k);
      glass.scale.setScalar(1 + Math.sin(t * 0.9 + 0.6) * 0.03);
      rs.forEach((r, i) => (r.rotation.z = t * (0.1 + i * 0.05)));
    },
  };
}

const BUILDERS: Record<SceneVariant, (ctx: Ctx) => Built> = {
  core,
  helix,
  flow,
  layers,
  lattice,
  panels,
  beacon,
  dialog,
  wave,
  rings,
  shield,
  orb,
};

/* ================================================================== engine */
export function mountScene(host: HTMLElement, canvas: HTMLCanvasElement, variant: SceneVariant, opts: MountOptions): () => void {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0xffffff, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x0b5f6d, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-4, 6, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x19a7b8, 22, 18, 2);
  rim.position.set(4, -1.5, 3);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const root = new THREE.Group();
  scene.add(root);

  const sprite = radialTexture("rgba(255,255,255,1)", "rgba(255,255,255,0)", 64);
  const m = materials();
  const small = host.clientWidth < 420;
  const ctx: Ctx = { scene, root, camera, m, small, sprite };
  const built = BUILDERS[variant](ctx);

  /* sizing */
  const resize = () => {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    /* keep the object framed on narrow, tall hosts */
    camera.zoom = camera.aspect < 0.9 ? Math.max(0.72, camera.aspect / 0.9) : 1;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  /* pointer: the whole object leans gently toward the cursor */
  const target = { x: 0, y: 0 };
  const lean = { x: 0, y: 0 };
  const onPointer = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  /* run only while visible */
  let visible = false;
  let raf = 0;
  let last = performance.now();
  let t = Math.random() * 10;
  const vec = new THREE.Vector3();

  const minGap = opts.fps ? 1000 / opts.fps - 2 : 0;
  const frame = (now: number) => {
    raf = 0;
    if (minGap && now - last < minGap) {
      if (visible && !opts.reduced && !document.hidden) raf = requestAnimationFrame(frame);
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!opts.reduced) t += dt;
    lean.x += (target.x - lean.x) * 0.04;
    lean.y += (target.y - lean.y) * 0.04;
    root.rotation.y = lean.x * 0.32;
    root.rotation.x = lean.y * 0.18;
    built.update(t, dt);
    renderer.render(scene, camera);
    if (opts.onAnchors && built.anchors) {
      const w = host.clientWidth;
      const h = host.clientHeight;
      const originDist = camera.position.length();
      const list = built.anchors().map((p) => {
        const d = -vec.copy(p).applyMatrix4(camera.matrixWorldInverse).z;
        vec.copy(p).project(camera);
        return {
          x: (vec.x * 0.5 + 0.5) * w,
          y: (-vec.y * 0.5 + 0.5) * h,
          depth: Math.min(1, Math.max(0, 0.5 + (originDist - d) / 5)),
        };
      });
      opts.onAnchors(list);
    }
    if (visible && !opts.reduced && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    },
    { rootMargin: "120px" },
  );
  io.observe(host);
  const onVis = () => {
    if (!document.hidden && visible) kick();
  };
  document.addEventListener("visibilitychange", onVis);
  /* first frame even under reduced motion */
  kick();

  return () => {
    if (raf) cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVis);
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = (mesh as unknown as { material?: THREE.Material | THREE.Material[] }).material;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    envTarget.dispose();
    sprite.dispose();
    renderer.dispose();
  };
}
