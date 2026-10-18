// EMG bench: a forearm wearing an 8 x 8 HD-EMG grid lies on a padded arm rest, its hand hanging past
// the end. A ribbon carries the signals to an amplifier, a decoder estimates 22 degrees of freedom at
// 32 Hz, and a robotic prosthesis on a wrist post forms the decoded gesture. Both hands are LimbKit's
// realistic hand (mesh.mjs), drawn in a WebGL layer over the drawing.
// The reader can turn the bench: the drawing is built and settled at every STEP degrees of azimuth
// and shipped gzipped; the GL layer turns with it, and the drawn parts write their true shapes into
// its depth buffer so they hide the hands wherever they stand in front.
// node build.mjs [--dark] [--audit]
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/Users/raul/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/Users/raul/.claude/skills/anatomy/kit/lathe.mjs";
import * as A from "/Users/raul/.claude/skills/anatomy/kit/audit.mjs";
import { tubePieces, tubeSvg } from "/Users/raul/.claude/skills/anatomy/kit/tube.mjs";
import { GESTURES, RATE, LATENCY_MS, DOF, DIGITS, dofOf, activityOf } from "./model.mjs";
import { loadLimb, handsOf, segmentsOf, LEVELS } from "./mesh.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const theme = argv.includes("--dark") ? "dark" : "light";

const WIDTH = 760;
const HEIGHT = 470;
const AZIMUTH = 40;
const ELEVATION = 30;
const STEP = 5;

// ---------- world ----------
const BENCH = { x: -214, y: -104, w: 400, d: 188, r: 10 };
const BENCH_H = 12;
const FOOT_H = 6;

const ARM_Y = 44;
const REST_TOP = 50;
const WRIST_X = -95;
const ARM_L = 110;
const CUSHION = { x: BENCH.x + 4, y: ARM_Y - 22, w: WRIST_X - 4 - (BENCH.x + 4), d: 44, r: 6 };
// The forearm runs on past the elbow and fades out between these distances from the wrist, so it reads
// as an arm from a body just out of frame rather than a cut-off limb.
const BEYOND = 48;
const FADE = [ARM_L - 2, ARM_L + 40];
const POSTS = [CUSHION.x + 20, CUSHION.x + CUSHION.w - 22];

const AMP = { x: -170, y: -90, w: 96, d: 48, r: 4 };
const AMP_Z0 = 5;
const AMP_Z1 = 36;
const DEC = { x: -52, y: -90, w: 88, d: 48, r: 4 };
const DEC_Z0 = 5;
const DEC_Z1 = 40;
const PORT_Z = 22;
const PORT_Y = -66;
// The drive cable runs level from the decoder to the prosthesis's column: on a turning bench every
// bend must lie in a horizontal plane or it folds on screen from some side.
const DRIVE_Z = 15;
const DRIVE_R = 1.6;
const PED_H = 9;

// The electrode grid: 8 x 8 discs at 10 mm pitch on a pad over the proximal forearm, measured on the
// skin from the wrist (u) and around from the top toward the thumb side (v).
const SCALE = 340;
const PITCH = 4.2;
const GRID_U0 = 52;
const GRID_V0 = -6.3;
const ELECTRODE_R = 1.0;
const BANDS = [5, 10, 89, 95];

// The grid's ribbon: a flat 64-way cable bonded under the pad's top edge, lifting off the forearm in an
// arch that stays in view, then draping down to a plug in the amplifier's socket.
const RIBBON_U = 63;
const RIBBON_X = WRIST_X - RIBBON_U;
const RIBBON_W = 10;
const RIBBON_T = 0.7;
const RIBBON_LIFT = [0, -1, 0.3];
const SOCKET_D = 1.6;
const SOCKET_Z0 = 18;
const PLUG = { l: 8, w: 12.5, h: 5.6 };

const PALM_FACING = (30 * Math.PI) / 180;
const limb = loadLimb(HERE);
const hands = handsOf(limb, {
  scale: SCALE,
  human: { wrist: [WRIST_X, ARM_Y], floor: REST_TOP, length: ARM_L, beyond: BEYOND, swell: [0.5, 0.55] },
  // The twin stands upright in its cuff, palm toward the reader (PALM_FACING from +x), thumb on the
  // reader's right. Rows give world x, y, z from the mesh's (lateral, wrist, back) axes; a pure rotation,
  // like the person's hand (see mesh.mjs), so it reads as a right hand.
  twin: { scale: 1.0, basis: [[-Math.sin(PALM_FACING), 0, -Math.cos(PALM_FACING)], [Math.cos(PALM_FACING), 0, -Math.sin(PALM_FACING)], [0, -1, 0]], wrist: [138, 6, 24], cuff: [14, 4, 0.1] },
});
const HUMAN = hands.human;
const TWIN = hands.twin;
const CUFF = TWIN.cuff.box;
const COL = TWIN.cuff.centre.slice(0, 2);
const SEAT_Z = CUFF.lo[2];
const PED = { x: COL[0] - 30, y: COL[1] - 28, w: 60, d: 56, r: 6 };

const box = (ps) => [0, 1, 2].map((c) => [Math.min(...ps.map((p) => p[c])), Math.max(...ps.map((p) => p[c]))]);
const corners3 = (b) => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [b[0][i & 1], b[1][(i >> 1) & 1], b[2][(i >> 2) & 1]]);
const HB = box(HUMAN.positions.filter((p) => p[0] > WRIST_X - FADE[1]));
const TB = box(TWIN.positions);

// One camera per azimuth with a shared scale, the bench's centre pinned to one point on screen, so the
// bench turns in place. The scale fits the scene at every azimuth.
const PIVOT = [BENCH.x + BENCH.w / 2, BENCH.y + BENCH.d / 2, 0];
const AZIMUTHS = Array.from({ length: 360 / STEP }, (_, i) => i * STEP);
const SCENE = [...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), ...corners3(HB), ...corners3(TB), ...k.boxCorners(DEC, 0, DEC_Z1 + 8)];
const VIEW = (() => {
  const reach = [0, 0, 0, 0];
  for (const azimuth of AZIMUTHS) {
    const unit = { origin: [0, 0], scale: 1, azimuth, elevation: ELEVATION };
    const c = k.iso(PIVOT, unit);
    for (const p of SCENE) {
      const [x, y] = k.iso(p, unit);
      reach[0] = Math.max(reach[0], c[0] - x);
      reach[1] = Math.max(reach[1], x - c[0]);
      reach[2] = Math.max(reach[2], c[1] - y);
      reach[3] = Math.max(reach[3], y - c[1]);
    }
  }
  const pad = 14;
  const scale = Math.min((WIDTH - 2 * pad) / (reach[0] + reach[1]), (HEIGHT - 2 * pad) / (reach[2] + reach[3]));
  return { scale, target: [pad + reach[0] * scale + (WIDTH - 2 * pad - (reach[0] + reach[1]) * scale) / 2, pad + reach[2] * scale + (HEIGHT - 2 * pad - (reach[2] + reach[3]) * scale) / 2] };
})();
const cameraAt = (azimuth) => {
  const c = k.iso(PIVOT, { origin: [0, 0], scale: VIEW.scale, azimuth, elevation: ELEVATION });
  return { origin: [VIEW.target[0] - c[0], VIEW.target[1] - c[1]], scale: VIEW.scale, azimuth, elevation: ELEVATION };
};
let P = cameraAt(AZIMUTH);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const VERT = (x, y) => G.frameOf([x, y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const frameOf = (o, a, u) => {
  const axis = G.unit3(a);
  const uu = u ? G.unit3(G.sub3(u, G.mul3(axis, G.dot3(u, axis)))) : G.frameAlong(o, axis).u;
  return { o, a: axis, u: uu, v: G.cross3(axis, uu) };
};

// Colour: a palette class re-points the kit's tone variables for everything inside it (bench.css).
const tint = (name, svg) => `<g class="eb-${name}">${svg}</g>`;

let R = A.recorder(P);
const put = (item) =>
  R.put({
    layer: "back",
    ...item,
    // A route's chunks belong to the route; everything else is a solid the audit checks on its own.
    shapes: item.route ? item.shapes : (item.shapes ?? []).map((shape, index) => R.solid(Object.assign(shape, { name: shape.name ?? (index ? `${item.name}#${index + 1}` : item.name) }))),
  });

// ---------- bench ----------
function bench() {
  for (const [x, y] of k.corners(BENCH, 24)) {
    const svg = S(k.cylinder(x, y, 8, -BENCH_H - FOOT_H, 1.8, P, 28), { tone: "lo" }) + S(k.cylinder(x, y, 6, -BENCH_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: "mid" });
    put({ name: `stand.foot.${x}.${y}`, at: [x, y, -BENCH_H - FOOT_H], svg, shapes: [A.cylinder(x, y, 8, -BENCH_H - FOOT_H, 1.8, { ground: true }), A.cylinder(x, y, 6, -BENCH_H - FOOT_H + 1.8, FOOT_H - 1.8)] });
  }
  const screws = k.corners(BENCH, 9);
  const strip = { x: 24, y: BENCH.y + BENCH.d - 13, w: 150, d: 7, r: 1 };
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  const label = { x: -60, y: BENCH.y + BENCH.d - 16, w: 46, d: 11, r: 1.4 };
  const rules = [
    [label.x + 6, label.x + 30],
    [label.x + 6, label.x + 38],
    [label.x + 6, label.x + 24],
  ].map(([x0, x1], i) => L(k.lineOnTop([x0, label.y + 3 + i * 2.6], [x1, label.y + 3 + i * 2.6], 0.8, P), { tone: "lo", free: true }));
  const svg = [
    S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(BENCH, -BENCH_H + 4, P, 8), { tone: "faint" }) }),
    L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: "faint" }),
    L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }),
    D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }),
    S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }),
    L(ticks.minor, { tone: "lo" }),
    L(ticks.major, { tone: "mid" }),
    D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }),
    S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo" }),
    L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P), { tone: "faint" }),
    ...rules,
    D([at([label.x + label.w - 4, label.y + 3, 0.8]), at([label.x + label.w - 4, label.y + label.d - 3, 0.8])], { size: 0.45 }),
  ].join("");
  put({ name: "stand.bench", at: [0, 0, -BENCH_H], bias: -40, svg, shapes: [A.slab(BENCH, -BENCH_H, BENCH_H, { ground: true })] });
}

// ---------- the arm rest: a padded board on two height-adjustable posts ----------
const PLATE_Z0 = REST_TOP - 9;
const CUSHION_Z0 = REST_TOP - 6;
function armRest() {
  for (const x of POSTS) {
    const F = VERT(x, ARM_Y);
    const foot = { x: x - 12, y: ARM_Y - 12, w: 24, d: 24, r: 4 };
    put({ name: `rest.foot.${x}`, at: [x, ARM_Y, 1], bias: -0.3, svg: S(k.slabOf(foot, 0, 2.4, P, 4, 0.5), { tone: "mid" }) + D(k.corners(foot, 3.5).map(([px, py]) => at([px, py, 2.4])), { size: 0.45 }), shapes: [A.slab(foot, 0, 2.4)] });
    put({ name: `rest.post.${x}.low`, at: [x, ARM_Y, 12], bias: 0.1, svg: S(G.disc(2.4, 22, 5.2, F, P), { tone: "mid", inner: L(G.arcOf(F, 6, 5.2, P), { tone: "faint" }) }), shapes: [A.disc(F, 2.4, 22, 5.2)] });
    put({ name: `rest.post.${x}.collar`, at: [x, ARM_Y, 24], bias: 0.15, svg: S(G.disc(22, 27, 7, F, P), { tone: "mid", inner: L(G.ribsOf(F, 22.6, 26.4, 7, 36, P, { fade: [0.1, 0.5] }), { tone: "lo" }) }), shapes: [A.disc(F, 22, 27, 7)] });
    const knob = frameOf([x + 7, ARM_Y, 24.5], [1, 0, 0], [0, 0, 1]);
    put({ name: `rest.post.${x}.screw`, at: [x + 9, ARM_Y, 24.5], bias: 0.2, svg: S(G.disc(0, 2.4, 1.2, knob, P), { tone: "mid" }) + S(G.disc(2.4, 5, 2.6, knob, P), { tone: "hi", inner: L(G.ribsOf(knob, 2.6, 4.8, 2.6, 18, P), { tone: "lo" }) }), shapes: [A.disc(knob, 0, 2.4, 1.2), A.disc(knob, 2.4, 5, 2.6)] });
    put({ name: `rest.post.${x}.high`, at: [x, ARM_Y, 34], bias: 0.1, svg: S(G.disc(27, PLATE_Z0, 3.6, F, P), { tone: "hi" }), shapes: [A.disc(F, 27, PLATE_Z0, 3.6)] });
  }
  const plate = k.insetPlan(CUSHION, -1.5);
  const screws = POSTS.flatMap((x) => [[x - 5, ARM_Y - 18], [x + 5, ARM_Y - 18]]);
  put({ name: "rest.plate", at: [CUSHION.x + CUSHION.w / 2, ARM_Y, PLATE_Z0], bias: 0.2, svg: S(k.slabOf(plate, PLATE_Z0, 3, P, 6, 0.6), { tone: "mid" }) + D(screws.map(([x, y]) => at([x, y - 1.5, PLATE_Z0 + 1.5])), { size: 0.4 }), shapes: [A.slab(plate, PLATE_Z0, 3)] });
  put({ name: "rest.cushion", at: [CUSHION.x + CUSHION.w / 2, ARM_Y, CUSHION_Z0], bias: 0.3, svg: tint("graphite", S(k.slabOf(CUSHION, CUSHION_Z0, REST_TOP - CUSHION_Z0, P, 8, 2.2), { tone: "mid", inner: L(k.sideSeam(CUSHION, CUSHION_Z0 + 3, P, 8), { tone: "faint" }) })), shapes: [A.slab(CUSHION, CUSHION_Z0, REST_TOP - CUSHION_Z0)] });
}

// ---------- electronics ----------
let ports = {};
function portBoss(name, centre, axis, r = 3.4, len = 2) {
  const F = frameOf(centre, axis, [0, 0, 1]);
  const facing = G.dot3(F.a, G.viewOf(P)) > 0.12;
  const svg = S(G.disc(0, len, r, F, P), { tone: "mid" }) + (facing ? L(G.circleOf(F, len, r * 0.62, P, 20), { tone: "faint" }) : "");
  put({ name, at: G.add3(centre, G.mul3(F.a, len / 2)), bias: 0.15, svg, shapes: [A.disc(F, 0, len, r, { name })] });
  ports[name] = G.add3(centre, G.mul3(F.a, len));
  return ports[name];
}

function feetUnder(plan, z1, tag) {
  for (const [x, y] of k.corners(plan, 7)) put({ name: `${tag}.foot.${x}.${y}`, at: [x, y, z1 / 2], bias: -0.2, svg: S(k.cylinder(x, y, 3.2, 0, z1, P, 20), { tone: "lo" }), shapes: [A.cylinder(x, y, 3.2, 0, z1)] });
}

function amplifier() {
  feetUnder(AMP, AMP_Z0, "amp");
  const screws = k.corners(AMP, 5);
  const win = { x: AMP.x + 8, y: AMP.y + 7, w: 40, d: 34, r: 2 };
  const grid = [];
  const acts = [];
  for (let row = 0; row < 8; row++)
    for (let col = 0; col < 8; col++) {
      const [cx, cy] = at([win.x + 6 + col * 4, win.y + 3.5 + row * 3.9, AMP_Z1 + 0.8]);
      grid.push([cx, cy]);
      acts.push(`<circle class="eb-act" data-e="${row * 8 + col}" cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(0.95 * G.scaleOf(P)).toFixed(2)}" fill-opacity="0"/>`);
    }
  const label = { x: AMP.x + 54, y: AMP.y + 30, w: 34, d: 11, r: 1.2 };
  const knobs = [[AMP.x + 62, AMP.y + 15], [AMP.x + 78, AMP.y + 15]];
  const body = [
    S(k.slabOf(AMP, AMP_Z0, AMP_Z1 - AMP_Z0, P, 6, 1), { tone: "mid", inner: L(k.sideSeam(AMP, AMP_Z1 - 6, P, 6), { tone: "faint" }) }),
    L(screws.map(([x, y]) => k.ring(x, y, 1.6, AMP_Z1, P, 14)).join(""), { tone: "lo" }),
    D(screws.map(([x, y]) => at([x, y, AMP_Z1])), { size: 0.45 }),
    S(k.slabOf(win, AMP_Z1, 0.8, P, 3), { tone: "lo" }),
    D(grid, { size: 0.55, tone: "lo" }),
    `<g class="eb-acts">${acts.join("")}</g>`,
    S(k.slabOf(label, AMP_Z1, 0.6, P, 3), { tone: "lo" }),
    L(k.planOutline(k.insetPlan(label, 1.2), AMP_Z1 + 0.6, P, 3), { tone: "faint" }),
    k.faceTextSvg(k.topMatrix([label.x + 3, label.y + 7.2], AMP_Z1 + 0.6, P, "x"), "HD-EMG · 64", { size: 3.2, tone: "mid" }),
  ];
  const svg = [tint("navy", body.join(""))];
  for (const [x, y] of knobs) svg.push(S(k.cylinder(x, y, 4.6, AMP_Z1, 5, P, 32), { tone: "mid" }), L(k.knurl(x, y, 4.6, AMP_Z1, AMP_Z1 + 5, 30, P), { tone: "lo" }), L(k.lineOnTop([x, y], [x + 3.6, y - 1.4], AMP_Z1 + 5, P), { tone: "hi", free: "end" }), D([at([x, y, AMP_Z1 + 5])], { size: 0.45, tone: "hi" }));
  put({ name: "amp.box", at: [AMP.x + AMP.w / 2, AMP.y + AMP.d / 2, AMP_Z0], svg: svg.join(""), shapes: [A.slab(AMP, AMP_Z0, AMP_Z1 - AMP_Z0), ...knobs.map(([x, y]) => A.cylinder(x, y, 4.6, AMP_Z1, 5)), A.slab(win, AMP_Z1, 0.8), A.slab(label, AMP_Z1, 0.6)] });
  // The grid's input: a rectangular header socket the ribbon's plug seats in.
  const socket = { x: RIBBON_X - 8, y: AMP.y + AMP.d, w: 16, d: SOCKET_D, r: 0.6 };
  put({ name: "amp.socket", at: [RIBBON_X, socket.y + SOCKET_D / 2, SOCKET_Z0 + 3.5], bias: 0.15, svg: S(k.slabOf(socket, SOCKET_Z0, 7, P, 2, 0.3), { tone: "mid" }) + D([at([socket.x + 1.6, socket.y + SOCKET_D, SOCKET_Z0 + 3.5]), at([socket.x + socket.w - 1.6, socket.y + SOCKET_D, SOCKET_Z0 + 3.5])], { size: 0.42 }), shapes: [A.slab(socket, SOCKET_Z0, 7)] });
  portBoss("amp.port.out", [AMP.x + AMP.w, PORT_Y, PORT_Z], [1, 0, 0]);
}

const SCREEN = { x0: DEC.x + 10, x1: DEC.x + DEC.w - 10, z0: 12, z1: 33 };
function decoder() {
  feetUnder(DEC, DEC_Z0, "dec");
  const front = DEC.y + DEC.d;
  const plane = k.sideMatrix([0, front], 0, P, "left");
  const flat = (x0, z0, x1, z1, r) => k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, 5).map(([u, z]) => [u, -z]), true);
  const win = flat(SCREEN.x0, SCREEN.z0, SCREEN.x1, SCREEN.z1, 2);
  const bezel = flat(SCREEN.x0 - 2.2, SCREEN.z0 - 2.2, SCREEN.x1 + 2.2, SCREEN.z1 + 2.2, 3);
  const bars = [];
  const gap = (SCREEN.x1 - SCREEN.x0 - 8) / DOF;
  for (let i = 0; i < DOF; i++) bars.push(`<rect class="eb-bar" data-b="${i}" x="${(SCREEN.x0 + 4 + i * gap + 0.4).toFixed(2)}" y="${(-SCREEN.z0 - 4).toFixed(2)}" width="${(gap - 0.8).toFixed(2)}" height="0"/>`);
  const groups = [0, 2, 6, 10, 14, 18, 22];
  const ticks = groups.map((a) => `M${(SCREEN.x0 + 4 + a * gap).toFixed(2)} ${(-SCREEN.z0 - 3).toFixed(2)}V${(-SCREEN.z0 - 1.8).toFixed(2)}`).join("");
  const screen = [
    `<defs><clipPath id="eb-win"><path d="${win}"/></clipPath></defs>`,
    `<g transform="${plane}">`,
    `<path class="eb-bezel" d="${bezel}"/>`,
    `<path class="iso-line" data-tone="lo" d="${bezel}"/>`,
    `<g clip-path="url(#eb-win)"><path class="eb-glass" d="${win}"/>`,
    `<path class="eb-base" d="M${SCREEN.x0 + 3} ${-SCREEN.z0 - 3}H${SCREEN.x1 - 3}"/>`,
    `<path class="eb-tick" d="${ticks}"/>`,
    bars.join(""),
    `<text class="eb-screen-text" x="${SCREEN.x0 + 3.5}" y="${-SCREEN.z1 + 4.4}">22 DoF</text>`,
    `<text class="eb-screen-text" x="${SCREEN.x1 - 3.5}" y="${-SCREEN.z1 + 4.4}" text-anchor="end">32 Hz</text>`,
    `</g>`,
    `<path class="iso-line" data-tone="faint" d="${win}"/>`,
    `</g>`,
  ].join("");
  const fins = [];
  const finShapes = [];
  for (let i = 0; i < 10; i++) {
    const plan = { x: DEC.x + 7 + i * 8, y: DEC.y + 5, w: 2, d: DEC.d - 10, r: 0.6 };
    fins.push(S(k.slabOf(plan, DEC_Z1, 8, P, 2, 0.3), { tone: "mid", crease: "faint" }));
    finShapes.push(A.slab(plan, DEC_Z1, 8));
  }
  const facing = G.viewOf(P)[1] > 0.06;
  const svg = tint("graphite", [S(k.slabOf(DEC, DEC_Z0, DEC_Z1 - DEC_Z0, P, 6, 1), { tone: "mid", inner: L(k.sideSeam(DEC, DEC_Z1 - 4, P, 6), { tone: "faint" }) }), D(k.corners(DEC, 4).map(([x, y]) => at([x, y, DEC_Z1])), { size: 0.45 }), facing ? screen : "", ...fins].join(""));
  put({ name: "dec.box", at: [DEC.x + DEC.w / 2, DEC.y + DEC.d / 2, DEC_Z0], svg, shapes: [A.slab(DEC, DEC_Z0, DEC_Z1 - DEC_Z0), ...finShapes] });
  portBoss("dec.port.in", [DEC.x, PORT_Y, PORT_Z], [-1, 0, 0]);
  portBoss("dec.port.out", [DEC.x + DEC.w, PORT_Y, DRIVE_Z], [1, 0, 0], 2.8);
}

// ---------- the twin's stand: a base, a column and a flange the cuff's end plate sits on ----------
function pedestal() {
  const screws = k.corners(PED, 6);
  put({ name: "ped.base", at: [PED.x + PED.w / 2, PED.y + PED.d / 2, 0], bias: -0.2, svg: tint("graphite", S(k.slabOf(PED, 0, PED_H, P, 6, 0.8), { tone: "mid", inner: L(k.sideSeam(PED, 3, P, 6), { tone: "faint" }) }) + L(screws.map(([x, y]) => k.ring(x, y, 1.8, PED_H, P, 14)).join(""), { tone: "lo" }) + D(screws.map(([x, y]) => at([x, y, PED_H])), { size: 0.45 })), shapes: [A.slab(PED, 0, PED_H)] });
  const F = VERT(COL[0], COL[1]);
  const flange0 = SEAT_Z - 2.4;
  put({ name: "ped.collar", at: [COL[0], COL[1], PED_H + 1.5], bias: 0.05, svg: S(G.disc(PED_H, PED_H + 3, 11, F, P), { tone: "mid" }) + D(G.dotsOf(F, PED_H + 3, 9, 6, P, { all: true }), { size: 0.4 }), shapes: [A.disc(F, PED_H, PED_H + 3, 11)] });
  put({ name: "ped.column", at: [COL[0], COL[1], (PED_H + 3 + flange0) / 2], bias: 0.1, svg: S(G.disc(PED_H + 3, flange0, 5.5, F, P), { tone: "hi" }), shapes: [A.disc(F, PED_H + 3, flange0, 5.5)] });
  put({ name: "ped.flange", at: [COL[0], COL[1], SEAT_Z - 1.2], bias: 0.15, svg: S(G.disc(flange0, SEAT_Z, 9, F, P), { tone: "mid" }) + D(G.dotsOf(F, SEAT_Z, 7.4, 4, P, { all: true }), { size: 0.4 }), shapes: [A.disc(F, flange0, SEAT_Z, 9)] });
  portBoss("ped.port", [COL[0] - 5.5, COL[1], DRIVE_Z], [-1, 0, 0], 2.4, 2);
}

// ---------- cables ----------
function cable(name, control, r, { bend = 8, ferrules = [true, true], tone = "mid", palette = null, front = () => false } = {}) {
  const route = G.fillet(control, bend, 12);
  const total = G.pathLength(route);
  const FER = 3.2;
  const gaps = [...(ferrules[0] ? [[0, FER]] : []), ...(ferrules[1] ? [[total - FER, total]] : [])];
  R.route(name, route, r, { owner: name, gaps, limp: true });
  tubePieces(route, r, P, { maxLength: 16, spacing: 1.2, gaps }).forEach((part, index) => put({ name: `${name}:${index}`, ...(front(part.mid) ? { layer: "front" } : {}), at: part.mid, svg: palette ? tint(palette, tubeSvg(part, { tone })) : tubeSvg(part, { tone }), route: name, chunk: index, shapes: [A.tube(part.points, part.radii)] }));
  [0, 1].forEach((index) => {
    if (!ferrules[index]) return;
    const end = index ? route[route.length - 1] : route[0];
    const tangent = G.tangentAlong(route, index ? total : 0);
    const F = G.frameAlong(end, tangent);
    const [s0, s1] = index ? [-FER, 0] : [0, FER];
    put({ name: `${name}.ferrule.${index}`, ...(front(end) ? { layer: "front" } : {}), at: G.add3(end, G.mul3(tangent, (s0 + s1) / 2)), bias: 0.1, svg: S(G.disc(s0, s1, r * 1.55, F, P, { bevel: 0.25 }), { tone: "mid", inner: L(G.arcOf(F, (s0 + s1) / 2, r * 1.55, P), { tone: "faint" }) }), shapes: [A.disc(F, s0, s1, r * 1.55, { owner: name, name: `${name}.ferrule.${index}` })] });
  });
  return route;
}

// A cable must stay outside the forearm, which the audit cannot see: check it against the skin.
function clearOfArm(route, margin) {
  for (const p of route) {
    const u = HUMAN.wrist[0] - p[0];
    if (u < 0 || u > ARM_L) continue;
    const half = HUMAN.halfWidth(u);
    const top = HUMAN.top(u);
    const cz = (top + REST_TOP) / 2;
    const hz = (top - REST_TOP) / 2;
    const e = ((p[1] - ARM_Y) / (half + margin)) ** 2 + ((p[2] - cz) / (hz + margin)) ** 2;
    if (e < 1) throw new Error(`cable passes through the forearm at ${p.map((v) => v.toFixed(1))}`);
  }
}

// ---------- assemble: the drawing at one azimuth ----------
const CABLES = {};
function frameAt(azimuth) {
  P = cameraAt(azimuth);
  R = A.recorder(P);
  ports = {};
  bench();
  armRest();
  amplifier();
  decoder();
  pedestal();
  CABLES.link = cable("cable.link", [ports["amp.port.out"], ports["dec.port.in"]], 2, { bend: 6, palette: "crimson" });
  const pp = ports["ped.port"];
  const dout = ports["dec.port.out"];
  CABLES.drive = cable("cable.drive", [dout, [dout[0] + 24, dout[1], DRIVE_Z], [pp[0] - 24, pp[1], DRIVE_Z], pp], DRIVE_R, { bend: 10 * DRIVE_R, palette: "navy" });
  A.settle(R, P);
  const back = R.items.filter((item) => item.layer === "back").sort((a, b) => a.key - b.key).map((item) => item.svg);
  return [`<path class="iso-halo" d="${k.haloOf(BENCH, -BENCH_H - FOOT_H, BENCH_H, P)}"/>`, ...back].join("");
}
const audit = argv.includes("--audit");
const started = Date.now();
const FRAMES = AZIMUTHS.map((azimuth) => {
  const svg = frameAt(azimuth);
  if (audit && azimuth % 15 === 0) {
    console.log(`— azimuth ${azimuth}°`);
    A.auditOrExit(R, P);
  }
  return svg;
});
const FIRST = FRAMES[AZIMUTHS.indexOf(AZIMUTH)];
P = cameraAt(AZIMUTH);

// ---------- the ribbon mesh (drawn in the GL layer, where it sits on the skin in true depth) ----------
const ribbon = (() => {
  const r = HUMAN.radiusAt(RIBBON_U);
  const psi0 = (GRID_V0 + 0.6 * PITCH) / r;
  const psi1 = (GRID_V0 - 0.3 * PITCH) / r;
  const centre = [];
  const outward = [];
  for (let i = 0; i <= 4; i++) {
    const { p, normal } = HUMAN.skin(RIBBON_U, psi0 + ((psi1 - psi0) * i) / 4, RIBBON_T / 2 + 0.3);
    centre.push(p);
    outward.push(normal);
  }
  const D0 = centre[centre.length - 1];
  const socketY = AMP.y + AMP.d + SOCKET_D;
  const E = [RIBBON_X, socketY + PLUG.l, SOCKET_Z0 + 3.5];
  const B = [D0, G.add3(D0, G.mul3(G.unit3(RIBBON_LIFT), 30)), G.add3(E, [0, 30, 16]), E];
  for (let i = 1; i <= 40; i++) {
    const t = i / 40;
    const m = [(1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3];
    centre.push([0, 1, 2].map((c) => B.reduce((sum, q, j) => sum + q[c] * m[j], 0)));
  }
  // Clear of the cushion and of the forearm along the free span.
  for (const p of centre.slice(8)) {
    if (p[1] > CUSHION.y - 2 && p[1] < CUSHION.y + CUSHION.d && p[2] < REST_TOP + 2) throw new Error(`ribbon touches the cushion at ${p.map((v) => v.toFixed(1))}`);
  }
  clearOfArm(centre.slice(8), 0.4);
  const w = [1, 0, 0];
  let flipSign = null;
  const frames = centre.map((p, i) => {
    const t = G.unit3(G.sub3(centre[Math.min(i + 1, centre.length - 1)], centre[Math.max(i - 1, 0)]));
    let n = G.unit3(G.cross3(w, t));
    if (flipSign === null) flipSign = G.dot3(n, outward[0]) < 0 ? -1 : 1;
    return { p, n: G.mul3(n, flipSign) };
  });
  const pos = [];
  const uv = [];
  const tris = [];
  let along = 0;
  const lengths = frames.map((f, i) => (along += i ? G.len3(G.sub3(f.p, frames[i - 1].p)) : 0));
  const strip = (side) => {
    const base = pos.length;
    frames.forEach((f, i) => {
      for (const e of [0, 1]) {
        const corner = (ew, en) => G.add3(f.p, G.add3(G.mul3(w, ew * RIBBON_W / 2), G.mul3(f.n, en * RIBBON_T / 2)));
        const [ew0, en0, ew1, en1, a0, a1] = side;
        pos.push(e ? corner(ew1, en1) : corner(ew0, en0));
        uv.push([lengths[i], e ? a1 : a0]);
      }
    });
    for (let i = 0; i + 1 < frames.length; i++) {
      const [a, b, c, d] = [base + i * 2, base + i * 2 + 1, base + i * 2 + 2, base + i * 2 + 3];
      tris.push([a, b, c], [b, d, c]);
    }
  };
  strip([-1, 1, 1, 1, 0, 1]);
  strip([1, -1, -1, -1, 1, 0]);
  strip([-1, -1, -1, 1, 0, 0]);
  strip([1, 1, 1, -1, 1, 1]);
  // The plug: a box from the socket face back to where the ribbon enters it.
  const box = (x0, x1, y0, y1, z0, z1) => {
    const corners = [];
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) corners.push([x, y, z]);
    const faces = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];
    for (const f of faces) {
      const base = pos.length;
      f.forEach((ci) => {
        pos.push(corners[ci]);
        uv.push([0, -1]);
      });
      tris.push([base, base + 1, base + 2], [base, base + 2, base + 3]);
    }
  };
  box(RIBBON_X - PLUG.w / 2, RIBBON_X + PLUG.w / 2, socketY, E[1], E[2] - PLUG.h / 2, E[2] + PLUG.h / 2);
  // Every triangle faces away from the ribbon's own centre line (or the plug's centre).
  const plugCentre = [RIBBON_X, (socketY + E[1]) / 2, E[2]];
  const nearest = (q) => frames.reduce((best, f) => (G.len3(G.sub3(f.p, q)) < G.len3(G.sub3(best, q)) ? f.p : best), frames[0].p);
  for (let t = 0; t < tris.length; t++) {
    const [a, b, c] = tris[t].map((i) => pos[i]);
    const m = G.mul3(G.add3(G.add3(a, b), c), 1 / 3);
    const ref = uv[tris[t][0]][1] < 0 ? plugCentre : nearest(m);
    if (G.dot3(G.cross3(G.sub3(b, a), G.sub3(c, a)), G.sub3(m, ref)) < 0) tris[t] = [tris[t][0], tris[t][2], tris[t][1]];
  }
  return { pos, uv, tris };
})();

// ---------- stand-ins for the drawn parts in the GL depth buffer ----------
// Each drawn solid that can stand in front of a hand, the forearm or the ribbon, as a closed mesh of the
// same size; the page draws them into depth only.
const proxies = (() => {
  const pos = [];
  const tris = [];
  const prism = (polygon, z0, z1) => {
    const n0 = pos.length;
    for (const [x, y] of polygon) pos.push([x, y, z0], [x, y, z1]);
    const m = polygon.length;
    for (let i = 0; i < m; i++) {
      const j = (i + 1) % m;
      tris.push([n0 + 2 * i, n0 + 2 * j, n0 + 2 * i + 1], [n0 + 2 * j, n0 + 2 * j + 1, n0 + 2 * i + 1]);
      if (i > 0 && i < m - 1) tris.push([n0, n0 + 2 * i, n0 + 2 * j], [n0 + 1, n0 + 2 * j + 1, n0 + 2 * i + 1]);
    }
  };
  const plan = (p, z0, z1) => prism(k.roundedPlan(p, 4), z0, z1);
  const disc = (x, y, r, z0, z1) => prism(Array.from({ length: 20 }, (_, i) => [x + r * Math.cos((i / 20) * 2 * Math.PI), y + r * Math.sin((i / 20) * 2 * Math.PI)]), z0, z1);
  const tube = (route, r) => {
    const rings = route.map((p, i) => {
      const t = G.unit3(G.sub3(route[Math.min(i + 1, route.length - 1)], route[Math.max(i - 1, 0)]));
      const F = G.frameAlong(p, t);
      return Array.from({ length: 10 }, (_, j) => {
        const a = (j / 10) * 2 * Math.PI;
        return G.add3(p, G.add3(G.mul3(F.u, r * Math.cos(a)), G.mul3(F.v, r * Math.sin(a))));
      });
    });
    rings.forEach((ring, i) => {
      const base = pos.length;
      pos.push(...ring);
      if (i) for (let j = 0; j < 10; j++) tris.push([base - 10 + j, base - 10 + ((j + 1) % 10), base + j], [base - 10 + ((j + 1) % 10), base + ((j + 1) % 10), base + j]);
    });
  };
  plan(CUSHION, CUSHION_Z0, REST_TOP - 0.5);
  plan(k.insetPlan(CUSHION, -1.5), PLATE_Z0, PLATE_Z0 + 3);
  for (const x of POSTS) {
    disc(x, ARM_Y, 5.2, 2.4, 22);
    disc(x, ARM_Y, 7, 22, 27);
    disc(x, ARM_Y, 3.6, 27, PLATE_Z0);
  }
  plan(AMP, AMP_Z0, AMP_Z1);
  for (const [x, y] of [[AMP.x + 62, AMP.y + 15], [AMP.x + 78, AMP.y + 15]]) disc(x, y, 4.6, AMP_Z1, AMP_Z1 + 5);
  plan({ x: RIBBON_X - 8, y: AMP.y + AMP.d, w: 16, d: SOCKET_D - 0.2, r: 0.6 }, SOCKET_Z0, SOCKET_Z0 + 7);
  plan(DEC, DEC_Z0, DEC_Z1);
  for (let i = 0; i < 10; i++) plan({ x: DEC.x + 7 + i * 8, y: DEC.y + 5, w: 2, d: DEC.d - 10, r: 0.6 }, DEC_Z1, DEC_Z1 + 8);
  plan(PED, 0, PED_H);
  disc(COL[0], COL[1], 11, PED_H, PED_H + 3);
  disc(COL[0], COL[1], 5.5, PED_H + 3, SEAT_Z - 2.4);
  disc(COL[0], COL[1], 9, SEAT_Z - 2.4, SEAT_Z - 0.4);
  tube(CABLES.link, 2);
  tube(CABLES.drive, DRIVE_R);
  return { pos, tris };
})();

// ---------- the mesh payload ----------
const q = (values) => Int16Array.from(values, (v) => Math.round(v * 100));
const flat = (points) => points.flat();
const u8 = (values) => Uint8Array.from(values, (v) => Math.round(Math.max(0, Math.min(1, v)) * 255));
const n = HUMAN.handCount;
const auxOf = (count) => u8(Array.from({ length: count }, (_, i) => (i < n ? [limb.cavity[i], limb.nails[i]] : [0, 0])).flat());
const parts = {
  humanPos: q(flat(HUMAN.positions)),
  humanUV: q(flat(HUMAN.uv)),
  humanAux: auxOf(HUMAN.positions.length),
  handTris: Uint16Array.from(flat(HUMAN.handTris)),
  armTris: Uint16Array.from(flat(HUMAN.armTris)),
  twinPos: q(flat(TWIN.positions)),
  twinAux: auxOf(n),
  twinSeg: u8(Array.from(segmentsOf(limb), (v) => v / 3.2)),
  cuffPos: q(flat(TWIN.cuff.positions)),
  ribbonPos: q(flat(ribbon.pos)),
  ribbonUV: q(flat(ribbon.uv)),
  ribbonTris: Uint16Array.from(flat(ribbon.tris)),
  proxyPos: q(flat(proxies.pos)),
  proxyTris: Uint16Array.from(flat(proxies.tris)),
  cuffTris: Uint16Array.from(flat(TWIN.cuff.tris)),
};
TWIN.moved.forEach((m, d) => {
  parts[`ids${d}`] = Uint16Array.from(m.ids);
  parts[`steps${d}`] = q(m.steps.flat(2));
});
function pack(entries) {
  const layout = {};
  let size = 0;
  for (const [name, array] of Object.entries(entries)) {
    size = Math.ceil(size / 4) * 4;
    layout[name] = { type: array.constructor.name, offset: size, length: array.length };
    size += array.byteLength;
  }
  const bytes = new Uint8Array(size);
  for (const [name, array] of Object.entries(entries)) bytes.set(new Uint8Array(array.buffer, array.byteOffset, array.byteLength), layout[name].offset);
  return { data: Buffer.from(bytes).toString("base64"), layout };
}
const MESH = { ...pack(parts), levels: LEVELS, digits: DIGITS };
const zipped = FRAMES.map((svg) => gzipSync(Buffer.from(svg), { level: 9 }));
const offsets = zipped.reduce((acc, z) => [...acc, acc[acc.length - 1] + z.length], [0]);
const VIEWS = { step: STEP, first: AZIMUTH, data: Buffer.concat(zipped).toString("base64"), offsets };

// The GL layer's camera, per azimuth in the page: viewBox = target + k · (projection of p − pivot).
const frontFace = (() => {
  const V = G.viewOf(P);
  const o = at([0, 0, 0]);
  const axisOf = (e) => at(e).map((v, i) => v - o[i]);
  const [ex, ey, ez] = [axisOf([1, 0, 0]), axisOf([0, 1, 0]), axisOf([0, 0, 1])];
  const a = G.unit3([-V[1], V[0], 0]);
  const c = G.cross3(V, a);
  const clip = (p) => [p[0] * ex[0] + p[1] * ey[0] + p[2] * ez[0], -(p[0] * ex[1] + p[1] * ey[1] + p[2] * ez[1])];
  const [p1, p2] = [clip(a), clip(c)];
  return p1[0] * p2[1] - p1[1] * p2[0] > 0 ? "ccw" : "cw";
})();
const GLD = { W: WIDTH, H: HEIGHT, k: G.scaleOf(P), elevation: ELEVATION, pivot: PIVOT, target: VIEW.target, lightUp: 1.2, grid: [GRID_U0, GRID_V0, PITCH, ELECTRODE_R], bands: BANDS, fade: FADE, twinToHuman: hands.twinToHuman, ring: [SEAT_Z + 5.5, SEAT_Z + 7], frontFace };

// ---------- page ----------
const LABEL =
  "An EMG test bench. A forearm lies on a padded arm rest wearing an eight-by-eight grid of surface electrodes, its hand hanging past the end and flexing its fingers. A flat ribbon cable runs from the grid over the back of the forearm to a plug in an amplifier, a short cable links the amplifier to a decoder whose screen shows 22 bars, and a drive cable runs to a stand holding a robotic prosthetic hand upright by its wrist unit. The prosthesis forms the gesture the decoder reads.";
const backSvg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: LABEL, body: [`<g class="eb-frame">${FIRST}</g>`] });
const buttons = GESTURES.map((g, i) => `<button type="button" class="eb-g" data-g="${i}" aria-pressed="false">${g.label}</button>`).join("");
const stage = `<div class="iso-stage eb-stage" tabindex="0" role="group" aria-label="EMG bench: drag sideways or press the bracket keys to turn it; the arrow keys step through gestures">${backSvg}<canvas class="eb-gl iso-layer" aria-hidden="true"></canvas></div><div class="eb-gestures" role="toolbar" aria-label="Gestures">${buttons}</div><p class="eb-live" aria-live="polite"></p>`;

const DATA = { gestures: GESTURES, rate: RATE, latency: LATENCY_MS, screenZ0: SCREEN.z0, gl: GLD, mesh: MESH, views: VIEWS };
const MODEL = `const dofOf = ${dofOf.toString()};\nconst activityOf = ${activityOf.toString()};\nconst CENTRES = ${JSON.stringify([[5.6, 0.9], [3.2, 1.6], [3.0, 3.2], [3.4, 4.9], [3.8, 6.3]])};\nconst GESTURES = DATA.gestures;`;
const CSS = readFileSync(join(HERE, "bench.css"), "utf8");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA)).replace("/* __MODEL__ */", MODEL);
// The plate keeps one corner, the hint; the credit for the hands sits opposite it.
const CREDIT = `<a class="eb-credit" href="https://joergsla.gumroad.com/l/limbkit" target="_blank" rel="noopener">Hands: LimbKit ↗</a>`;
const body = `<figure class="iso-figure"><div class="iso-plate"><div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="hint">Drag to turn · pick a gesture</span></div><style>${CSS}</style>${CREDIT}${stage}</div></figure>`;
const page = k.pageHtml({ title: "EMG bench", theme, body, script: LIVE, width: 800 });
// The same figure as an artifact page: no document skeleton of its own, and the theme follows the viewer.
const THEME = `const root = document.documentElement;
const wrap = document.querySelector(".eb-page");
const dark = matchMedia("(prefers-color-scheme: dark)");
const apply = () => wrap.setAttribute("data-theme", root.getAttribute("data-theme") || (dark.matches ? "dark" : "light"));
apply();
dark.addEventListener("change", apply);
new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
`;
const ARTIFACT = `<title>EMG Bench</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
:root{--page:#f2f2ef;color-scheme:light}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--page:#0b0b0b;color-scheme:dark}}
:root[data-theme="dark"]{--page:#0b0b0b;color-scheme:dark}
body{background:var(--page);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
${k.ISO_CSS}
.eb-page{background:var(--anatomy-page);color:var(--anatomy-text);font:14px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;max-width:800px;margin:0 auto;padding-block:40px 64px}
</style>
<main class="iso eb-page" data-theme="light">${body}</main>
<script type="module">${(THEME + LIVE).replace(/<\/(script)/gi, "<\\/$1")}</script>
`;
// The figure for the website: markup, style and script as separate files, payloads as binaries.
const site = argv.find((a) => a.startsWith("--site="))?.slice(7);
if (site) {
  const dataFor = { ...DATA, mesh: { ...MESH, data: undefined, url: "bench/mesh.txt" }, views: { ...VIEWS, data: undefined, url: "bench/views.txt" } };
  const liveFor = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(dataFor)).replace("/* __MODEL__ */", MODEL);
  writeFileSync(join(site, "figure.html"), body.replace(`<style>${CSS}</style>`, ""));
  writeFileSync(join(site, "figure.css"), k.ISO_CSS + "\n" + CSS);
  writeFileSync(join(site, "figure.js"), liveFor);
  writeFileSync(join(site, "mesh.txt"), MESH.data);
  writeFileSync(join(site, "views.txt"), VIEWS.data);
  console.log(`site figure → ${site}`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const name = `emg-bench${theme === "dark" ? "-dark" : ""}.html`;
  writeFileSync(join(HERE, name), page);
  writeFileSync(join(HERE, "emg-bench.artifact.html"), ARTIFACT);
  console.log(`wrote ${name} · ${(page.length / 1024).toFixed(0)} KB (mesh ${(MESH.data.length / 1024).toFixed(0)} KB, ${FRAMES.length} views ${(VIEWS.data.length / 1024).toFixed(0)} KB) · ${R.items.length} drawn items · ${proxies.tris.length} stand-in triangles · ${((Date.now() - started) / 1000).toFixed(1)} s · ${frontFace}`);
}
