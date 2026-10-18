const DATA = __DATA__;
/* __MODEL__ */
const stage = document.querySelector(".eb-stage");
const live = document.querySelector(".eb-live");
const buttons = [...document.querySelectorAll(".eb-g[data-g]")];
let leds = [...stage.querySelectorAll(".eb-act")];
let bars = [...stage.querySelectorAll(".eb-bar")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const TICK = 1 / DATA.rate;
const MUSCLE_TAU = 0.09;
const MOTOR_TAU = 0.12;
const FINGER_TAU = 0.07;
const BASE_Y = -(DATA.screenZ0 + 4);
const BAR_H = 10;
const TOUR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const HOLD = 2.1;

// ---------- the hands: LimbKit meshes in a WebGL layer between the back and front drawings ----------
// Payloads arrive as base64, inline (standalone page) or as text files beside the page (the website).
const load = async (src) => Uint8Array.from(atob(src.url ? (await (await fetch(src.url)).text()).trim() : src.data), (c) => c.charCodeAt(0));
const M = DATA.mesh;
const bytes = await load(M);
const take = (name) => {
  const { type, offset, length } = M.layout[name];
  return new globalThis[type](bytes.buffer, offset, length);
};
const unq = (name) => Float32Array.from(take(name), (v) => v / 100);
const human = { rest: unq("humanPos"), uv: unq("humanUV"), aux: take("humanAux"), tris: Uint16Array.from([...take("handTris"), ...take("armTris")]) };
human.pos = human.rest.slice();
const twin = { rest: unq("twinPos"), aux: take("twinAux"), seg: take("twinSeg"), tris: take("handTris") };
twin.pos = twin.rest.slice();
const cuff = { pos: unq("cuffPos"), tris: take("cuffTris") };
const ribbon = { pos: unq("ribbonPos"), uv: unq("ribbonUV"), tris: take("ribbonTris") };
const proxy = { pos: unq("proxyPos"), tris: take("proxyTris") };
// One set of sampled finger displacements, for the prosthesis and, turned into its pose, for the person.
const moves = M.digits.map((_, d) => ({ ids: take(`ids${d}`), steps: unq(`steps${d}`) }));
const R = DATA.gl.twinToHuman;
const humanMoves = moves.map(({ ids, steps }) => {
  const out = new Float32Array(steps.length);
  for (let i = 0; i < steps.length; i += 3) for (let r = 0; r < 3; r++) out[i + r] = R[r][0] * steps[i] + R[r][1] * steps[i + 1] + R[r][2] * steps[i + 2];
  return { ids, steps: out };
});

const normalsOf = (pos, tris, out = new Float32Array(pos.length)) => {
  out.fill(0);
  for (let t = 0; t < tris.length; t += 3) {
    const a = tris[t] * 3;
    const b = tris[t + 1] * 3;
    const c = tris[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const i of [a, b, c]) {
      out[i] += nx;
      out[i + 1] += ny;
      out[i + 2] += nz;
    }
  }
  for (let i = 0; i < out.length; i += 3) {
    const l = Math.hypot(out[i], out[i + 1], out[i + 2]) || 1;
    out[i] /= l;
    out[i + 1] /= l;
    out[i + 2] /= l;
  }
  return out;
};
const pose = (f, mesh = twin, sets = moves) => {
  const p = mesh.pos;
  p.set(mesh.rest);
  sets.forEach(({ ids, steps }, d) => {
    const x = Math.max(0, Math.min(1, f[d])) * M.levels;
    if (x <= 0) return;
    const j = Math.min(M.levels - 1, Math.floor(x));
    const t = x - j;
    const n = ids.length;
    const s1 = j * n * 3;
    const s0 = (j - 1) * n * 3;
    for (let k = 0; k < n; k++) {
      const i = ids[k] * 3;
      for (let c = 0; c < 3; c++) {
        const d0 = j ? steps[s0 + k * 3 + c] : 0;
        p[i + c] += d0 + (steps[s1 + k * 3 + c] - d0) * t;
      }
    }
  });
};

const canvas = stage.querySelector(".eb-gl");
const gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: true });
const VERT = `#version 300 es
in vec3 aPos;in vec3 aNrm;in vec2 aUV;in vec2 aAux;in float aSeg;
uniform vec3 uMx,uMy,uV,uO;uniform vec2 uView;uniform float uGrow;
out vec3 vN;out vec3 vW;out vec2 vUV;out vec2 vAux;out float vSeg;
void main(){vec3 p=aPos+aNrm*uGrow;vec2 s=vec2(dot(uMx,p),dot(uMy,p))+uO.xy;
gl_Position=vec4(s.x/uView.x*2.-1.,1.-s.y/uView.y*2.,-dot(uV,p)/2000.,1.);vN=aNrm;vW=aPos;vUV=aUV;vAux=aAux;vSeg=aSeg*3.2;}`;
// Materials: 0 skin (the person's hand and forearm), 1 the prosthesis's wrist unit, 2 the prosthetic hand:
// a white palm shell, navy phalanges, steel rings at every joint and steel fingertip caps.
const FRAG = `#version 300 es
precision highp float;
in vec3 vN;in vec3 vW;in vec2 vUV;in vec2 vAux;in float vSeg;
uniform vec3 uLight,uV,uFace,uShade,uInk,uSignal,uPad,uShellL,uShellD,uJointL,uJointD,uNail,uRing,uBandL,uBandD,uPlugL,uPlugD;
uniform float uOutline,uMaterial,uAct[64];
uniform vec4 uGrid,uBands;uniform vec2 uRingZ,uFade;uniform float uPx;
out vec4 o;
float line(float d,float w){float a=fwidth(d);return 1.-smoothstep(w-a,w+a,abs(d));}
void main(){
  bool skin=uMaterial<.5&&vUV.x>-100.;
  float alpha=skin?1.-smoothstep(uFade.x,uFade.y,vUV.x):1.;
  alpha*=alpha;
  if(uOutline>.5){o=vec4(uInk,1.)*alpha;return;}
  vec3 n=normalize(gl_FrontFacing?vN:-vN);
  float lam=max(dot(n,uLight),0.);
  float s=clamp(.28+.62*lam+.22*n.z+.12*max(dot(n,uV),0.),0.,1.);
  vec3 c=mix(uShade,uFace,s);
  float inkA=0.;
  if(uMaterial<.5){
    c*=1.-.18*vAux.x;
    c=mix(c,mix(uNail*.88,uNail,s),vAux.y*.8);
  }else if(uMaterial<1.5){
    float ring=step(uRingZ.x,vW.z)*step(vW.z,uRingZ.y);
    c=mix(c,mix(uRing*.75,uRing,s),ring);
    inkA=max(inkA,line(min(abs(vW.z-uRingZ.x),abs(vW.z-uRingZ.y)),uPx*.3));
  }else if(uMaterial>2.5){
    // the ribbon: 64 conductors under grey insulation, pin 1 striped red; the plug in graphite
    if(vUV.y<-.5){c=mix(uPlugD,uPlugL,s);}
    else{float k=vUV.y*32.;float cw=fwidth(k);
      inkA=max(inkA,(1.-smoothstep(0.,cw*1.2,abs(fract(k)-.5)-.5+cw))*.35);
      c=mix(c,mix(uSignal*.8,uSignal,s),1.-smoothstep(1./32.-fwidth(vUV.y),1./32.+fwidth(vUV.y),vUV.y));}
  }else{
    float f=vSeg;
    float w=max(fwidth(f),1e-4);
    c=mix(c,mix(uShellD,uShellL,s),smoothstep(.5-w,.5+w,f));
    float j=abs(fract(f)-.5);
    float joint=step(.3,f)*step(f,2.72);
    float ring=(1.-smoothstep(.07-w,.07+w,j))*joint;
    c=mix(c,mix(uJointD,uJointL,s),ring);
    inkA=max(inkA,(1.-smoothstep(.0,w*1.4,abs(j-.07)))*joint*.9);
    float cap=smoothstep(.25,.55,vAux.y);
    c=mix(c,mix(uJointD,uJointL,s),cap);
  }
  if(skin){
    // straps: the ground band at the wrist and the strap near the elbow
    for(int k=0;k<2;k++){vec2 b=k==0?uBands.xy:uBands.zw;
      float inside=step(b.x,vUV.x)*step(vUV.x,b.y);
      c=mix(c,k==0?mix(uShellD,uShellL,s):mix(uBandD,uBandL,s),inside);
      float e=min(abs(vUV.x-b.x),abs(vUV.x-b.y));inkA=max(inkA,line(e,uPx*.35));}
    // the electrode grid: an 8 x 8 array of discs on a flexible silicone pad
    vec2 g=(vUV-uGrid.xy)/uGrid.z;
    vec2 q=abs(g-4.)-4.4;float pad=(length(max(q,0.))+min(max(q.x,q.y),0.))*uGrid.z;
    float padIn=1.-smoothstep(-fwidth(pad),fwidth(pad),pad);
    c=mix(c,mix(uPad*.86,uPad,s),padIn*.9);
    inkA=max(inkA,line(pad,uPx*.35));
    if(padIn>0.&&all(greaterThanEqual(g,vec2(0.)))&&all(lessThan(g,vec2(8.)))){
      vec2 cell=floor(g);vec2 f=(fract(g)-.5)*uGrid.z;float d=length(f)-uGrid.w;
      int row=7-int(cell.x);int col=int(cell.y);float a=uAct[row*8+col];
      float disc=1.-smoothstep(-fwidth(d),fwidth(d),d);
      c=mix(c,mix(mix(uJointD,uJointL,s),uSignal,a),disc);
      inkA=max(inkA,line(d,uPx*.22)*(.55-a*.3));}
  }
  c=mix(c,uInk,inkA*.85);
  o=vec4(c*alpha,alpha);
}`;
let ready = false;
const program = (() => {
  if (!gl) return null;
  const shader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(p));
    return null;
  }
  return p;
})();
const U = {};
const meshOf = (pos, nrm, tris, uv, aux, dynamic, seg = null) => {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffer = (data, name, size, usage = gl.STATIC_DRAW, norm = false) => {
    const loc = gl.getAttribLocation(program, name);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, data instanceof Uint8Array ? gl.UNSIGNED_BYTE : gl.FLOAT, norm, 0, 0);
    return b;
  };
  const m = { vao, count: tris.length };
  m.pos = buffer(pos, "aPos", 3, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
  m.nrm = buffer(nrm, "aNrm", 3, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
  if (uv) buffer(uv, "aUV", 2);
  else gl.disableVertexAttribArray(gl.getAttribLocation(program, "aUV"));
  if (aux) buffer(aux, "aAux", 2, gl.STATIC_DRAW, true);
  else gl.disableVertexAttribArray(gl.getAttribLocation(program, "aAux"));
  if (seg) buffer(seg, "aSeg", 1, gl.STATIC_DRAW, true);
  else gl.disableVertexAttribArray(gl.getAttribLocation(program, "aSeg"));
  const ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tris, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return m;
};
let meshes = null;
// The kit's camera at one azimuth: viewBox = target + k · (projection of p − pivot), light from the
// viewer's upper left.
const camera = (azimuth) => {
  if (!program) return;
  const G = DATA.gl;
  const a = (azimuth * Math.PI) / 180;
  const e = (G.elevation * Math.PI) / 180;
  const [sa, ca, se, ce] = [Math.sin(a), Math.cos(a), Math.sin(e), Math.cos(e)];
  const mx = [sa * G.k, -ca * G.k, 0];
  const my = [ca * se * G.k, sa * se * G.k, -ce * G.k];
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const l = Math.hypot(sa, ca, G.lightUp);
  gl.useProgram(program);
  gl.uniform3fv(U.uMx, mx);
  gl.uniform3fv(U.uMy, my);
  gl.uniform3fv(U.uO, [G.target[0] - dot(mx, G.pivot), G.target[1] - dot(my, G.pivot), 0]);
  gl.uniform3fv(U.uV, [ca * ce, sa * ce, se]);
  gl.uniform3fv(U.uLight, [-sa / l, ca / l, G.lightUp / l]);
};
if (program) {
  gl.useProgram(program);
  for (const name of ["uMx", "uMy", "uV", "uO", "uView", "uGrow", "uLight", "uFace", "uShade", "uInk", "uSignal", "uPad", "uShellL", "uShellD", "uJointL", "uJointD", "uNail", "uRing", "uBandL", "uBandD", "uOutline", "uMaterial", "uAct", "uGrid", "uBands", "uRingZ", "uFade", "uPx", "uPlugL", "uPlugD"]) U[name] = gl.getUniformLocation(program, name);
  twin.nrm = normalsOf(twin.pos, twin.tris);
  meshes = {
    human: meshOf(human.pos, (human.nrm = normalsOf(human.pos, human.tris)), human.tris, human.uv, human.aux, true),
    twin: meshOf(twin.pos, twin.nrm, twin.tris, null, twin.aux, true, twin.seg),
    cuff: meshOf(cuff.pos, normalsOf(cuff.pos, cuff.tris), cuff.tris, null, null, false),
    ribbon: meshOf(ribbon.pos, normalsOf(ribbon.pos, ribbon.tris), ribbon.tris, ribbon.uv, null, false),
  };
  meshes.proxy = meshOf(proxy.pos, new Float32Array(proxy.pos.length), proxy.tris, null, null, false);
  const G = DATA.gl;
  gl.uniform2fv(U.uView, [G.W, G.H]);
  gl.uniform4fv(U.uGrid, G.grid);
  gl.uniform4fv(U.uBands, G.bands);
  gl.uniform2fv(U.uRingZ, G.ring);
  gl.uniform2fv(U.uFade, G.fade);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.frontFace(G.frontFace === "cw" ? gl.CW : gl.CCW);
  stage.setAttribute("data-gl", "");
}
const colour = (name) => {
  const probe = document.createElement("span");
  probe.style.color = `var(${name})`;
  stage.append(probe);
  const [r, g, b] = getComputedStyle(probe).color.match(/[\d.]+/g).map(Number);
  probe.remove();
  return [r / 255, g / 255, b / 255];
};
// Each mesh's base material (lit, shade) and the shared accents, read from bench.css so both themes work.
const MATERIALS = { human: ["--eb-skin", "--eb-skin-shade"], cuff: ["--eb-unit", "--eb-unit-shade"], twin: ["--eb-palm", "--eb-palm-shade"], ribbon: ["--eb-ribbon", "--eb-ribbon-shade"] };
let tones = {};
const theme = () => {
  if (!program) return;
  gl.useProgram(program);
  for (const [u, v] of [["uInk", "--anatomy-hi"], ["uSignal", "--eb-signal"], ["uPad", "--eb-pad"], ["uShellL", "--eb-shell"], ["uShellD", "--eb-shell-shade"], ["uJointL", "--eb-joint"], ["uJointD", "--eb-joint-shade"], ["uNail", "--eb-nail"], ["uRing", "--eb-ring"], ["uBandL", "--eb-band"], ["uBandD", "--eb-band-shade"], ["uPlugL", "--eb-unit"], ["uPlugD", "--eb-unit-shade"]]) gl.uniform3fv(U[u], colour(v));
  tones = Object.fromEntries(Object.entries(MATERIALS).map(([name, [lit, shade]]) => [name, [colour(lit), colour(shade)]]));
};
const size = () => {
  const box = canvas.getBoundingClientRect();
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(box.width * dpr));
  canvas.height = Math.max(1, Math.round(box.height * dpr));
  return box.width / DATA.gl.W;
};
let unit = 1;
let activity = new Float32Array(64);
const draw = () => {
  if (!program) return;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniform1fv(U.uAct, activity);
  const px = 1 / (DATA.gl.k * unit);
  gl.uniform1f(U.uPx, px);
  // The drawn parts' stand-ins: depth only, so they hide whatever GL content stands behind them.
  gl.colorMask(false, false, false, false);
  gl.disable(gl.CULL_FACE);
  gl.uniform1f(U.uOutline, 0);
  gl.uniform1f(U.uGrow, 0);
  gl.bindVertexArray(meshes.proxy.vao);
  gl.drawElements(gl.TRIANGLES, meshes.proxy.count, gl.UNSIGNED_SHORT, 0);
  gl.colorMask(true, true, true, true);
  gl.enable(gl.CULL_FACE);
  for (const [name, mesh] of Object.entries(meshes)) {
    if (name === "proxy") continue;
    gl.bindVertexArray(mesh.vao);
    if (name !== "human" && name !== "ribbon") gl.vertexAttrib2f(gl.getAttribLocation(program, "aUV"), -300, 0);
    if (name === "cuff" || name === "ribbon") gl.vertexAttrib2f(gl.getAttribLocation(program, "aAux"), 0, 0);
    if (name !== "twin") gl.vertexAttrib1f(gl.getAttribLocation(program, "aSeg"), 0);
    gl.uniform1f(U.uMaterial, { human: 0, cuff: 1, twin: 2, ribbon: 3 }[name]);
    gl.uniform3fv(U.uFace, tones[name][0]);
    gl.uniform3fv(U.uShade, tones[name][1]);
    // Surface first, then the ink hull: the hull's far side fails the depth test behind the surface,
    // so only the rim past the silhouette shows, even where the forearm fades out.
    gl.uniform1f(U.uOutline, 0);
    gl.uniform1f(U.uGrow, 0);
    gl.cullFace(gl.BACK);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    gl.uniform1f(U.uOutline, 1);
    gl.uniform1f(U.uGrow, px * 0.75);
    gl.cullFace(gl.FRONT);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  }
  gl.bindVertexArray(null);
};
const upload = () => {
  if (!program) return;
  for (const [mesh, gpu] of [[twin, meshes.twin], [human, meshes.human]]) {
    normalsOf(mesh.pos, mesh.tris, mesh.nrm);
    gl.bindBuffer(gl.ARRAY_BUFFER, gpu.pos);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, gpu.nrm);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.nrm);
  }
};
new ResizeObserver(() => {
  unit = size();
  draw();
}).observe(canvas);
new MutationObserver(() => {
  theme();
  draw();
}).observe(stage.closest(".iso") ?? document.body, { attributes: true, attributeFilter: ["data-theme"] });
theme();

// ---------- turning the bench: one drawing per STEP degrees, unzipped when first needed ----------
const VIEWS = DATA.views;
const frameEl = stage.querySelector(".eb-frame");
const zippedReady = load(VIEWS);
const count = VIEWS.offsets.length - 1;
const views = new Map();
const viewOf = (i) => {
  if (!views.has(i))
    views.set(
      i,
      zippedReady.then((zipped) => new Response(new Blob([zipped.subarray(VIEWS.offsets[i], VIEWS.offsets[i + 1])]).stream().pipeThrough(new DecompressionStream("gzip"))).text()),
    );
  return views.get(i);
};
let azimuth = VIEWS.first;
let shown = Math.round(VIEWS.first / VIEWS.step) % count;
let wanted = shown;
let swapping = false;
const showView = async () => {
  if (swapping || wanted === shown) return;
  swapping = true;
  const i = wanted;
  const svg = await viewOf(i);
  frameEl.innerHTML = svg;
  leds = [...stage.querySelectorAll(".eb-act")];
  bars = [...stage.querySelectorAll(".eb-bar")];
  shown = i;
  camera(i * VIEWS.step);
  paintSignal();
  draw();
  swapping = false;
  showView();
};
const turnTo = (next) => {
  azimuth = ((next % 360) + 360) % 360;
  wanted = Math.round(azimuth / VIEWS.step) % count;
  showView();
};
camera(shown * VIEWS.step);
// Unzip the other views in the background, nearest first.
(async () => {
  for (let d = 1; d <= count / 2; d++) for (const i of [(shown + d) % count, (shown - d + count) % count]) await viewOf(i);
})();
let drag = null;
stage.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || event.button > 0) return;
  drag = { x: event.clientX, from: azimuth, id: event.pointerId };
  stage.setPointerCapture(event.pointerId);
  stage.setAttribute("data-turning", "");
});
stage.addEventListener("pointermove", (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  turnTo(drag.from - (event.clientX - drag.x) * (360 / Math.max(320, stage.clientWidth * 1.4)));
});
const release = (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  drag = null;
  stage.removeAttribute("data-turning");
};
stage.addEventListener("pointerup", release);
stage.addEventListener("pointercancel", release);

// ---------- the signal chain ----------
let intent = GESTURES[0].f.slice();
let muscle = intent.slice();
let decoded = intent.slice();
let hand = intent.slice();
let actual = intent.slice();
let chosen = 0;
let touring = !still.matches;
let tourAt = TOUR.length - 1;
let tourClock = HOLD * 0.6;
let tickClock = 0;
let seed = 11;
let visible = false;
let frame = 0;
let last = 0;
let idle = 0;
const noise = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const paintSignal = () => {
  for (let e = 0; e < 64; e++) {
    const a = activityOf(muscle, Math.floor(e / 8), e % 8);
    activity[e] = a < 0.04 ? 0 : a * (0.82 + 0.18 * noise());
  }
  for (const el of leds) el.setAttribute("fill-opacity", activity[+el.dataset.e].toFixed(2));
  dofOf(decoded).forEach((v, i) => {
    if (!bars[i]) return;
    const h = Math.max(0.4, Math.min(1, v) * BAR_H);
    bars[i].setAttribute("y", (BASE_Y - h).toFixed(2));
    bars[i].setAttribute("height", h.toFixed(2));
  });
};
const settle = () => {
  pose(hand);
  pose(actual, human, humanMoves);
  upload();
  paintSignal();
  draw();
};
const choose = (index, announce) => {
  chosen = (index + GESTURES.length) % GESTURES.length;
  intent = GESTURES[chosen].f.slice();
  buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === chosen)));
  if (announce) live.textContent = `Decoding ${GESTURES[chosen].label}`;
  if (still.matches) {
    muscle = intent.slice();
    decoded = intent.slice();
    hand = intent.slice();
    actual = intent.slice();
    settle();
  } else run();
};
const pause = () => {
  touring = false;
  clearTimeout(idle);
  idle = setTimeout(() => {
    touring = !still.matches;
    tourClock = 0;
    run();
  }, 7000);
};

// One frame: intent drives the muscles and the person's fingers follow them; the grid samples the
// muscles, the decoder updates 32 times a second, and the prosthesis follows the latest estimate.
const step = (now) => {
  frame = 0;
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
  last = now;
  if (touring) {
    tourClock += dt;
    if (tourClock > HOLD) {
      tourClock = 0;
      tourAt = (tourAt + 1) % TOUR.length;
      choose(TOUR[tourAt], false);
    }
  }
  const km = 1 - Math.exp(-dt / MUSCLE_TAU);
  muscle = muscle.map((v, i) => v + (intent[i] - v) * km);
  tickClock += dt;
  let ticked = false;
  while (tickClock >= TICK) {
    tickClock -= TICK;
    decoded = muscle.slice();
    ticked = true;
  }
  const kf = 1 - Math.exp(-dt / FINGER_TAU);
  actual = actual.map((v, i) => v + (muscle[i] - v) * kf);
  const kh = 1 - Math.exp(-dt / MOTOR_TAU);
  hand = hand.map((v, i) => v + (decoded[i] - v) * kh);
  pose(hand);
  pose(actual, human, humanMoves);
  upload();
  if (ticked) paintSignal();
  draw();
  const settled = hand.every((v, i) => Math.abs(v - intent[i]) < 0.002) && actual.every((v, i) => Math.abs(v - intent[i]) < 0.002);
  if (visible && (touring || !settled)) frame = requestAnimationFrame(step);
  else last = 0;
};
const run = () => {
  if (!frame && visible && !still.matches) frame = requestAnimationFrame(step);
};

buttons.forEach((b, i) =>
  b.addEventListener("click", () => {
    pause();
    choose(i, true);
  }),
);
stage.addEventListener("keydown", (event) => {
  const turn = { "[": -15, "]": 15 }[event.key];
  if (turn) {
    event.preventDefault();
    turnTo(azimuth + turn);
    return;
  }
  const delta = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
  if (!delta) return;
  event.preventDefault();
  pause();
  choose(chosen + delta, true);
});
new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  if (visible) run();
  else if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  }
}).observe(stage);
still.addEventListener("change", () => {
  touring = !still.matches;
  choose(chosen, false);
});
window.__bench = { choose, settle, pose: (f) => ((hand = f.slice()), (actual = f.slice()), (decoded = f.slice()), (muscle = f.slice()), settle()) };
choose(0, false);
settle();
