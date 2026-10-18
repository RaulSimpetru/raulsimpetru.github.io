// The truth behind the EMG bench figure. Everything the page shows (finger flexion, electrode
// activity, the decoder's bars and the readout) is computed here, in the build and in the page.

// Decoder output rate and latency, as reported for real-time full-hand control
// (Sîmpetru, März & Del Vecchio, IEEE TNSRE 2023: 32 predictions per second, latency < 50 ms).
export const RATE = 32;
export const LATENCY_MS = 50;

// The 22 degrees of freedom the decoder estimates (IEEE TBME 2024):
// wrist 2, thumb 4 (CMC flex, CMC abduction, MCP, IP), and per finger MCP flex, MCP abduction, PIP, DIP.
export const DOF = 22;

// Gestures from the recorded movement sets: single digits, pinches, a point and a fist.
// Finger order: thumb, index, middle, ring, little; 0 is relaxed, 1 is full flexion.
export const DIGITS = ["thumb", "index", "middle", "ring", "little"];
export const GESTURES = [
  { id: "rest", label: "rest", f: [0, 0, 0, 0, 0] },
  { id: "index", label: "index flexion", f: [0, 1, 0, 0, 0] },
  { id: "middle", label: "middle flexion", f: [0, 0, 1, 0, 0] },
  { id: "ring", label: "ring flexion", f: [0, 0, 0, 1, 0] },
  { id: "little", label: "little-finger flexion", f: [0, 0, 0, 0, 1] },
  { id: "thumb", label: "thumb flexion", f: [1, 0, 0, 0, 0] },
  { id: "pinch", label: "two-finger pinch", f: [0.7, 0.5, 0, 0, 0] },
  { id: "tripod", label: "three-finger pinch", f: [0.7, 0.45, 0.45, 0, 0] },
  { id: "point", label: "pointing", f: [0.6, 0, 1, 1, 1] },
  { id: "fist", label: "fist", f: [0.6, 1, 1, 1, 1] },
];

// LimbKit bend inputs (radians) for the hands. Rest is a relaxed open hand; full is each joint at the
// end of its range: MCP 83°, PIP 100°, DIP 63°, which closes a fist. The thumb bends at MCP and IP and
// rotates across the palm (opposition) as it flexes.
export const LIMB = {
  rest: { index: [0.06, 0.2, 0.07], middle: [0.12, 0.26, 0.1], ring: [0.2, 0.3, 0.16], little: [0.28, 0.34, 0.2] },
  full: [1.45, 1.75, 1.1],
  thumb: { rest: [0, -0.17, 0], full: [0.55, 0.8, 0.45] },
};

// The LimbKit inputs for one digit at flexion v in 0..1.
export function bendsOf(digit, v) {
  if (digit === "thumb") {
    const [c, t, r] = LIMB.thumb.rest.map((a, i) => a + (LIMB.thumb.full[i] - a) * v);
    return { "Bend Center": c, "Bend Tip": t, Rotation: [r, 0, 0] };
  }
  const [root, center, tip] = LIMB.rest[digit].map((a, i) => a + (LIMB.full[i] - a) * v);
  return { "Bend Root": root, "Bend Center": center, "Bend Tip": tip };
}

// The 22 decoded degrees of freedom as 0..1 bar heights, in the decoder's display order.
export function dofOf(f) {
  const [t, ...fingers] = f;
  const bars = [0.08, 0.05, t, 0.35 * t, 0.8 * t, t];
  for (const v of fingers) bars.push(v, 0.12 * v, v, 0.85 * v);
  return bars;
}

// Illustrative electrode activity on an 8 x 8 grid over the forearm (rows from elbow to wrist,
// columns from the radial to the ulnar side). Each digit lights its own compartment; the thumb
// lights the distal radial corner. Values 0..1.
const CENTRES = [
  [5.6, 0.9],
  [3.2, 1.6],
  [3.0, 3.2],
  [3.4, 4.9],
  [3.8, 6.3],
];
export function activityOf(f, row, col) {
  let a = 0;
  f.forEach((v, i) => {
    const [r, c] = CENTRES[i];
    a += v * Math.exp(-((row - r) ** 2) / 5.5 - ((col - c) ** 2) / 1.9);
  });
  return Math.min(1, a);
}

// The phrase the readout uses for a finger vector: the nearest gesture.
export function nameOf(f) {
  let best = GESTURES[0];
  let gap = Infinity;
  for (const g of GESTURES) {
    const d = g.f.reduce((sum, v, i) => sum + (v - f[i]) ** 2, 0);
    if (d < gap) {
      gap = d;
      best = g;
    }
  }
  return best;
}

if (process.argv[1] && process.argv[1].endsWith("model.mjs")) {
  const assert = (ok, what) => {
    if (!ok) throw new Error(what);
  };
  assert(dofOf([0, 0, 0, 0, 0]).length === DOF, "22 decoded degrees of freedom");
  assert(bendsOf("index", 1)["Bend Center"] === LIMB.full[1], "index PIP at full flexion");
  assert(bendsOf("thumb", 0).Rotation[0] === 0, "thumb at rest keeps LimbKit's own rotation");
  for (const g of GESTURES) assert(nameOf(g.f).id === g.id, `gesture ${g.id} names itself`);
  assert(activityOf([0, 1, 0, 0, 0], 3, 2) > activityOf([0, 1, 0, 0, 0], 3, 7), "index lights the radial side");
  assert(Math.abs(1000 / RATE - 31.25) < 1e-9, "one decoder update every 31.25 ms");
  console.log("model ok");
}
