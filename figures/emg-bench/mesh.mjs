// The hands come from LimbKit (~/work/LimbKit/limbKit_01.blend). limb.py evaluates its realistic hand in
// Blender at rest and at LEVELS flexion steps per digit; this module turns those poses into the
// person's hand on the arm board (with a forearm grown from the wrist opening) and the twin hand,
// and packs both for the page. Finger motion in the page is rest + one sampled displacement per digit.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DIGITS, bendsOf } from "./model.mjs";

const BLEND = "/Users/raul/work/LimbKit/limbKit_01.blend";
const BLENDER = "/Applications/Blender.app/Contents/MacOS/Blender";
// GN-blend.001 is LimbKit's "fingerMaleStraight" digit: blunt, short nails.
export const LEVELS = 6;
// One joint at a time, bent by JOINT_DELTA: how far each vertex's normal turns says which phalanx it
// rides on, which is how the twin is painted as a prosthetic with real segment joints.
const JOINT_DELTA = 0.35;
const JOINTS = { thumb: ["Rotation", "Bend Center", "Bend Tip"], index: ["Bend Root", "Bend Center", "Bend Tip"], middle: ["Bend Root", "Bend Center", "Bend Tip"], ring: ["Bend Root", "Bend Center", "Bend Tip"], little: ["Bend Root", "Bend Center", "Bend Tip"] };

export function loadLimb(dir) {
  const out = join(dir, "limb");
  const rest = Object.fromEntries(DIGITS.map((d) => [d, bendsOf(d, 0)]));
  const poses = [rest];
  for (const d of DIGITS) for (let j = 1; j <= LEVELS; j++) poses.push({ ...rest, [d]: bendsOf(d, j / LEVELS) });
  for (const d of DIGITS)
    for (const joint of JOINTS[d]) {
      const bent = { ...rest[d] };
      bent[joint] = joint === "Rotation" ? [JOINT_DELTA, 0, 0] : bent[joint] + JOINT_DELTA;
      poses.push({ ...rest, [d]: bent });
    }
  const job = JSON.stringify({ levels: 1, blends: { "GN-blend.001": 1 }, poses });
  const file = join(out, "limb.json");
  if (!existsSync(file) || JSON.stringify(JSON.parse(readFileSync(file, "utf8")).job) !== job) {
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "job.json"), job);
    execFileSync(BLENDER, ["-b", BLEND, "--python", join(dir, "limb.py"), "--", join(out, "job.json"), out], { stdio: ["ignore", "ignore", "inherit"] });
  }
  const meta = JSON.parse(readFileSync(file, "utf8"));
  const bin = readFileSync(join(out, "limb.bin"));
  const all = new Float32Array(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.length));
  const n = meta.verts;
  const pose = (i) => all.subarray(i * n * 3, (i + 1) * n * 3);
  const base = 1 + DIGITS.length * LEVELS;
  return { n, tris: meta.tris, cavity: meta.cavity, nails: meta.nails, wrist: meta.wrist, rest: pose(0), digit: (d, j) => pose(1 + DIGITS.indexOf(d) * LEVELS + (j - 1)), joint: (d, j) => pose(base + DIGITS.indexOf(d) * 3 + j) };
}

// Per vertex: 0 on the palm, rising by one across each joint (MCP, PIP, DIP; for the thumb CMC, MCP, IP).
// Bending one joint by JOINT_DELTA turns every edge on the phalanges beyond it by that angle, whatever
// side of the finger it lies on; the largest turn among a vertex's edges, over JOINT_DELTA, is its weight.
export function segmentsOf(L) {
  const seg = new Float32Array(L.n);
  const edgeTurn = (a, b) => {
    const r = L.rest;
    const u = [r[b * 3] - r[a * 3], r[b * 3 + 1] - r[a * 3 + 1], r[b * 3 + 2] - r[a * 3 + 2]];
    return (p) => {
      const v = [p[b * 3] - p[a * 3], p[b * 3 + 1] - p[a * 3 + 1], p[b * 3 + 2] - p[a * 3 + 2]];
      const c = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v) || 1);
      return Math.acos(Math.max(-1, Math.min(1, c)));
    };
  };
  const edges = [];
  for (let t = 0; t < L.tris.length; t += 3) for (let e = 0; e < 3; e++) edges.push([L.tris[t + e], L.tris[t + ((e + 1) % 3)]]);
  const turns = edges.map(([a, b]) => edgeTurn(a, b));
  for (const d of DIGITS)
    for (let j = 0; j < 3; j++) {
      const bent = L.joint(d, j);
      const w = new Float32Array(L.n);
      edges.forEach(([a, b], i) => {
        const turn = Math.min(1, turns[i](bent) / JOINT_DELTA);
        if (turn > w[a]) w[a] = turn;
        if (turn > w[b]) w[b] = turn;
      });
      for (let i = 0; i < L.n; i++) seg[i] += w[i];
    }
  // Relax the field over the mesh so the painted joint boundaries run smoothly instead of zigzagging
  // along triangle edges.
  const neighbours = Array.from({ length: L.n }, () => new Set());
  for (const [a, b] of edges) {
    neighbours[a].add(b);
    neighbours[b].add(a);
  }
  let field = seg;
  for (let pass = 0; pass < 10; pass++) {
    const next = new Float32Array(L.n);
    for (let i = 0; i < L.n; i++) {
      let sum = 0;
      for (const j of neighbours[i]) sum += field[j];
      next[i] = 0.5 * field[i] + (0.5 * sum) / Math.max(1, neighbours[i].size);
    }
    field = next;
  }
  return field;
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const smooth = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// The tilt (about the mesh's lateral axis) that levels the forearm: the wrist opening's plane turns
// vertical, so the forearm grown from it lies along the arm rest and the hand hangs in its own relaxed
// droop past the rest's end.
function tiltOf(L) {
  const nrm = newell(L.wrist.map((i) => [L.rest[i * 3], L.rest[i * 3 + 1], L.rest[i * 3 + 2]]));
  return Math.atan(-nrm[2] / nrm[1]);
}

// A placement: mesh point -> world point, from the tilt, a scale and a signed basis (rows: world x, y, z
// as combinations of the tilted mesh axes), plus a translation fitted afterwards.
function placer(tilt, scale, basis) {
  const c = Math.cos(tilt);
  const s = Math.sin(tilt);
  const M = basis.map((row) => [row[0] * scale, (row[1] * c + row[2] * s) * scale, (-row[1] * s + row[2] * c) * scale]);
  const linear = (p) => [dot(M[0], p), dot(M[1], p), dot(M[2], p)];
  return { linear, M, flip: dot(cross(M[0], M[1]), M[2]) < 0 };
}

function newell(p) {
  const nrm = [0, 0, 0];
  p.forEach((a, i) => {
    const b = p[(i + 1) % p.length];
    nrm[0] += (a[1] - b[1]) * (a[2] + b[2]);
    nrm[1] += (a[2] - b[2]) * (a[0] + b[0]);
    nrm[2] += (a[0] - b[0]) * (a[1] + b[1]);
  });
  return nrm;
}

// The component of p - c perpendicular to the axis: the outward direction of a tube at p.
const radial = (p, c, axis) => {
  const d = sub(p, c);
  const along = dot(d, axis);
  return d.map((v, k) => v - axis[k] * along);
};

// Turn every triangle from index `from` so its normal points along out(centroid).
function orient(tris, at, out, from = 0) {
  for (let t = from; t < tris.length; t++) {
    const [a, b, c] = tris[t].map(at);
    const centroid = [0, 1, 2].map((k) => (a[k] + b[k] + c[k]) / 3);
    if (dot(cross(sub(b, a), sub(c, a)), out(centroid)) < 0) tris[t] = [tris[t][0], tris[t][2], tris[t][1]];
  }
}

function loopFrame(points) {
  const c = [0, 1, 2].map((k) => points.reduce((sum, p) => sum + p[k], 0) / points.length);
  return { c, lo: [0, 1, 2].map((k) => Math.min(...points.map((p) => p[k]))), hi: [0, 1, 2].map((k) => Math.max(...points.map((p) => p[k]))) };
}

// Join ring a to ring b (equal lengths, closed) with triangles facing away from axisPoint(i).
function bridge(tris, a, b, outward) {
  const n = a.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    tris.push(outward ? [a[i], b[i], a[j]] : [a[i], a[j], b[i]], outward ? [a[j], b[i], b[j]] : [a[j], b[j], b[i]]);
  }
}

export function handsOf(L, { scale, human, twin }) {
  const tilt = tiltOf(L);
  const n = L.n;
  const tris = [];
  for (let i = 0; i < L.tris.length; i += 3) tris.push([L.tris[i], L.tris[i + 1], L.tris[i + 2]]);
  const meshAt = (src, i) => [src[i * 3], src[i * 3 + 1], src[i * 3 + 2]];

  // The person's hand: palm down, fingers along +x, thumb toward -y. LimbKit's hand is a left hand and
  // the kit's projection mirrors the world, so placing it by a pure rotation reads as a right hand.
  const H = placer(tilt, scale, [[0, -1, 0], [1, 0, 0], [0, 0, 1]]);
  const hp = Array.from({ length: n }, (_, i) => H.linear(meshAt(L.rest, i)));
  const wristH = loopFrame(L.wrist.map((i) => hp[i]));
  const shiftH = [human.wrist[0] - wristH.c[0], human.wrist[1] - wristH.c[1], human.floor - wristH.lo[2]];
  for (const p of hp) for (let k = 0; k < 3; k++) p[k] += shiftH[k];
  const handTris = H.flip ? tris.map(([a, b, c]) => [a, c, b]) : tris;

  // The forearm, grown from the wrist opening toward the elbow (-x), resting on the board.
  const W = L.wrist.map((i) => hp[i]);
  const { c: c0, lo: wlo, hi: whi } = loopFrame(W);
  const hy = (whi[1] - wlo[1]) / 2;
  const hz = c0[2] - wlo[2];
  const swell = (t) => (t < 0.68 ? smooth(0, 0.68, t) : 1 - 0.3 * ((Math.min(1, t) - 0.68) / 0.32) ** 2);
  const sy = (t) => 1 + human.swell[0] * swell(t);
  const sz = (t) => 1 + human.swell[1] * swell(t);
  const bottomAt = (t) => wlo[2] + (human.floor - wlo[2]) * smooth(0, 0.3, t);
  const psi = W.map((p) => Math.atan2((p[1] - c0[1]) / hy, (p[2] - c0[2]) / hz));
  const psi_ = psi;
  const arm = [];
  const uv = [];
  const rings = [L.wrist.slice()];
  const ringAt = (t, extra, shrink) => {
    const cz = bottomAt(t) + hz * sz(t);
    const r = (hy * sy(t) + hz * sz(t)) / 2;
    const ids = [];
    W.forEach((p, i) => {
      ids.push(n + arm.length);
      arm.push([c0[0] - t * human.length - extra + (p[0] - c0[0]) * (1 - smooth(0, 0.2, t)), c0[1] + (p[1] - c0[1]) * sy(t) * shrink, cz + (p[2] - c0[2]) * sz(t) * shrink]);
      uv.push([t * human.length + extra, psi[i] * r]);
    });
    return ids;
  };
  // Past the elbow the arm runs on toward a body the figure does not show; the page feathers it out.
  const K = Math.round(26 * (1 + human.beyond / human.length));
  for (let k = 1; k <= K; k++) rings.push(ringAt((k / K) * (1 + human.beyond / human.length), 0, 1));
  const all = (i) => (i < n ? hp[i] : arm[i - n]);
  const armTris = [];
  for (let k = 0; k + 1 < rings.length; k++) bridge(armTris, rings[k], rings[k + 1], true);
  orient(armTris, all, (p) => {
    const t = Math.max(0, (c0[0] - p[0]) / human.length);
    return [0, p[1] - c0[1], p[2] - (bottomAt(t) + hz * sz(t))];
  });

  // The twin: placed by the caller's basis, held by a cuff at the wrist.
  const T = placer(tilt, scale * twin.scale, twin.basis);
  const tp = Array.from({ length: n }, (_, i) => T.linear(meshAt(L.rest, i)));
  const wristT = loopFrame(L.wrist.map((i) => tp[i]));
  const shiftT = sub(twin.wrist, wristT.c);
  for (const p of tp) for (let k = 0; k < 3; k++) p[k] += shiftT[k];
  const twinTris = T.flip ? tris.map(([a, b, c]) => [a, c, b]) : tris;
  const moved = DIGITS.map((d) => {
    const ids = [];
    const top = L.digit(d, LEVELS);
    for (let i = 0; i < n; i++) if (Math.hypot(top[i * 3] - L.rest[i * 3], top[i * 3 + 1] - L.rest[i * 3 + 1], top[i * 3 + 2] - L.rest[i * 3 + 2]) > 1e-7) ids.push(i);
    const steps = [];
    for (let j = 1; j <= LEVELS; j++) {
      const p = L.digit(d, j);
      steps.push(ids.map((i) => T.linear(sub(meshAt(p, i), meshAt(L.rest, i)))));
    }
    return { digit: d, ids, steps };
  });
  // Cuff: a sleeve slightly wider than the wrist, over the last of the forearm, closed by an end plate.
  const WT = L.wrist.map((i) => tp[i]);
  const wt = loopFrame(WT);
  const axis = (() => {
    const nrm = newell(WT);
    const l = Math.hypot(...nrm);
    const toHand = sub(loopFrame(tp).c, wt.c);
    return nrm.map((v) => (v / l) * (dot(nrm, toHand) > 0 ? -1 : 1));
  })();
  const cuff = [];
  const cuffRing = (along, grow) => {
    const ids = [];
    for (const p of WT) {
      ids.push(cuff.length);
      cuff.push([0, 1, 2].map((k) => wt.c[k] + (p[k] - wt.c[k]) * grow + axis[k] * along));
    }
    return ids;
  };
  const [inner, outer, grow] = twin.cuff;
  const cuffTris = [];
  const at = (i) => cuff[i];
  const lip = [cuffRing(-inner, 1), cuffRing(-inner, 1 + grow)];
  bridge(cuffTris, lip[0], lip[1], true);
  orient(cuffTris, at, () => axis.map((v) => -v), cuffTris.length - lip[0].length * 2);
  const side = [cuffRing(-inner, 1 + grow), cuffRing(outer, 1 + grow)];
  let from = cuffTris.length;
  bridge(cuffTris, side[0], side[1], true);
  orient(cuffTris, at, (p) => radial(p, wt.c, axis), from);
  const rim = cuffRing(outer, 1 + grow);
  const plate = cuff.length;
  cuff.push(wt.c.map((v, k) => v + axis[k] * outer));
  from = cuffTris.length;
  for (let i = 0; i < rim.length; i++) cuffTris.push([rim[i], plate, rim[(i + 1) % rim.length]]);
  orient(cuffTris, at, () => axis, from);
  const cuffBox = loopFrame(cuff);

  return {
    tilt,
    human: {
      positions: [...hp, ...arm],
      handTris,
      armTris,
      uv: [...Array(n).fill([-300, 0]), ...uv],
      handCount: n,
      wrist: c0,
      // A point on the forearm's skin u units from the wrist toward the elbow, at angle psi from the top
      // toward +y, lifted along the normal; with that normal.
      // On the real forearm surface (the scaled wrist loop, not an ellipse): between the two loop
      // vertices whose angles bracket psi, lifted along the outward direction.
      skin: (u, psi, lift = 0) => {
        const t = u / human.length;
        const cz = bottomAt(t) + hz * sz(t);
        const ring = W.map((p) => [c0[0] - u + (p[0] - c0[0]) * (1 - smooth(0, 0.2, t)), c0[1] + (p[1] - c0[1]) * sy(t), cz + (p[2] - c0[2]) * sz(t)]);
        let best = null;
        for (let i = 0; i < W.length; i++) {
          const j = (i + 1) % W.length;
          const [a, b] = [psi_[i], psi_[j]];
          if (Math.abs(a - b) > Math.PI) continue;
          const f = (psi - a) / (b - a);
          if (f >= 0 && f <= 1) best = ring[i].map((v, k) => v + (ring[j][k] - v) * f);
        }
        const out = [0, best[1] - c0[1], best[2] - cz];
        const l = Math.hypot(...out);
        const normal = out.map((v) => v / l);
        return { p: best.map((v, k) => v + normal[k] * lift), normal };
      },
      radiusAt: (u) => (hy * sy(u / human.length) + hz * sz(u / human.length)) / 2,
      top: (u) => bottomAt(u / human.length) + 2 * hz * sz(u / human.length),
      halfWidth: (u) => hy * sy(u / human.length),
    },
    // Twin displacements turned into the person's hand: H · T^-1 (both are rotation and scale).
    twinToHuman: (() => {
      const m = T.M;
      const det = dot(m[0], cross(m[1], m[2]));
      const inv = [cross(m[1], m[2]), cross(m[2], m[0]), cross(m[0], m[1])].map((r) => r.map((v) => v / det));
      // inv's rows are the columns of T^-1
      const Ti = [0, 1, 2].map((i) => [inv[0][i], inv[1][i], inv[2][i]]);
      return H.M.map((row) => [0, 1, 2].map((j) => row[0] * Ti[0][j] + row[1] * Ti[1][j] + row[2] * Ti[2][j]));
    })(),
    twin: { positions: tp, tris: twinTris, moved, cuff: { positions: cuff, tris: cuffTris, box: cuffBox, axis, centre: wt.c }, box: loopFrame(tp) },
    cavity: L.cavity,
    nails: L.nails,
  };
}

if (process.argv[1] && process.argv[1].endsWith("mesh.mjs")) {
  const L = loadLimb(new URL(".", import.meta.url).pathname);
  const r = L.rest;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < L.n; i++) for (let c = 0; c < 3; c++) {
    lo[c] = Math.min(lo[c], r[i * 3 + c]);
    hi[c] = Math.max(hi[c], r[i * 3 + c]);
  }
  const w = L.wrist.map((i) => [r[i * 3], r[i * 3 + 1], r[i * 3 + 2]]);
  const wc = [0, 1, 2].map((c) => w.reduce((s, p) => s + p[c], 0) / w.length);
  const wlo = [0, 1, 2].map((c) => Math.min(...w.map((p) => p[c])));
  const whi = [0, 1, 2].map((c) => Math.max(...w.map((p) => p[c])));
  console.log("verts", L.n, "tris", L.tris.length / 3, "bounds", lo.map((v) => v.toFixed(3)), hi.map((v) => v.toFixed(3)));
  console.log("wrist loop", w.length, "centre", wc.map((v) => v.toFixed(3)), "span", wlo.map((v, i) => (whi[i] - v).toFixed(3)));
  for (const d of DIGITS) {
    const p = L.digit(d, LEVELS);
    let moved = 0;
    for (let i = 0; i < L.n; i++) if (Math.hypot(p[i * 3] - r[i * 3], p[i * 3 + 1] - r[i * 3 + 1], p[i * 3 + 2] - r[i * 3 + 2]) > 1e-6) moved++;
    console.log(d, "moves", moved);
  }
}
