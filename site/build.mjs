// The site, a clean-line comic desert: bun run build → public/. The illustrations in img/ are described in README.md.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PAPERS, ACTS, QUESTIONS, CAST, SOFTWARE, TOOLS, FACTS, HIGHLIGHTS, ON_SCREEN, NOW, MILESTONES } from "./data.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../public");
const h = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const byId = Object.fromEntries(PAPERS.map((p) => [p.id, p]));
// The RS monogram: Bai Jamjuree Bold's R and S (the S tucked in) with the lower leg of the R in crimson, in a 1175 x 716 box.
const RS = {
  r: "M0 8H372Q463 8 518.5 57Q574 106 574 186V256Q574 308 544.5 346.5Q515 385 459 405V407Q491 428 507.5 455Q524 482 540 530L596 708H453L400 542Q387 499 364 478Q341 457 307 457H138V708H0ZM346 338Q388 338 412 315.5Q436 293 436 257V192Q436 163 418 145.5Q400 128 370 128H138V338Z",
  s: "M591 483H727Q727 535 753.5 564.5Q780 594 827 594H938Q982 594 1009.5 575.5Q1037 557 1037 526V492Q1037 443 965 431L781 400Q691 385 644.5 342.5Q598 300 598 234V178Q598 125 626.5 84.5Q655 44 707.5 22Q760 0 829 0H942Q1007 0 1057 27Q1107 54 1134.5 102.5Q1162 151 1162 215H1026Q1026 173 1003 147.5Q980 122 942 122H829Q787 122 761.5 140Q736 158 736 188V215Q736 265 805 277L988 309Q1079 325 1127 365.5Q1175 406 1175 470V536Q1175 589 1145.5 630Q1116 671 1063 693.5Q1010 716 940 716H825Q715 716 653 654.5Q591 593 591 483Z",
  leg: "M453 708L596 708L544.4 544L400.6 544Z",
};
const monogram = (ink, leg) => `<path fill="${ink}" d="${RS.r}"/><path fill="${leg}" d="${RS.leg}"/><path fill="${ink}" d="${RS.s}"/>`;
// The favicon: the monogram on a navy tile (apple-touch-icon.png and favicon-32.png in icons/ are renders of it).
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#14213D"/><svg x="10.88" y="19.13" width="42.24" height="25.74" viewBox="0 0 1175 716">${monogram("#F3F4F8", "#FF5D7A")}</svg></svg>
`;
const ext = (href, text, cls = "") => `<a${cls ? ` class="${cls}"` : ""} href="${h(href)}" target="_blank" rel="noopener">${text}</a>`;
const CV = "uploads/raul-simpetru-cv.pdf";
const SITE = "https://raulsimpetru.github.io/";
const DESC = "Neural interfaces that read what a hand is trying to do. Research, papers and software by Raul C. Sîmpetru.";
const ROMAN = ["I", "II", "III", "IV", "V"];
const TAG = (p) => ({ "J. Neural Eng.": "JNE", "Science Advances": "Sci. Adv." }[p.venue] || p.venue);
const PUB = (p) => (p.pub === "Science" ? p.venue : p.pub === "Preprint" ? `${p.venue} preprint` : `${p.pub} ${p.venue}`);

const CSS = `
:root{
  --ground:#E9DAB9;--cell:#F7EED9;--cell-2:#F3E6C8;--card:#FBF5E6;--rule:#D9C6A2;--dash:#C9B48E;
  --ink:#2A2522;--ink-2:#4A433E;--muted:#6B625B;--accent:#B4553F;--shadow:#B96A57;--ochre:#F1D59A;--teal:#6FA39B;--sky:#C9F0DF;
  --serif:"Source Serif 4",Georgia,"Times New Roman",serif;--mono:"Geist Mono",ui-monospace,"SF Mono",Menlo,monospace;
  color-scheme:light;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--ground);color:var(--ink);font:400 18px/1.6 var(--serif);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
a{color:inherit;text-decoration-thickness:1px;text-underline-offset:3px}
a:hover{color:var(--accent)}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
img{max-width:100%;height:auto;display:block}
h1,h2,h3,h4{margin:0;font-weight:400;text-wrap:balance}
.mono{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;line-height:1.4}
.cap{display:inline-flex;align-items:center;gap:8px;width:max-content;padding:5px 10px;background:var(--ochre);border:1.5px solid var(--ink);color:var(--ink);font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;line-height:1.4}
.panel{background:var(--card);border:1.5px solid var(--ink);border-radius:4px;box-shadow:6px 6px 0 var(--shadow)}
.panel-k{background:var(--card);border:1.5px solid var(--ink);border-radius:4px;box-shadow:5px 5px 0 var(--ink)}
.lift{transition:transform .25s ease}
.lift:hover{transform:translate(-3px,-3px)}
.chip{font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;color:var(--ink);border:1.5px solid var(--ink);padding:6px 10px;border-radius:999px;background:var(--card);cursor:pointer}
.chip:hover{background:var(--ochre);color:var(--ink)}
.lk{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink);text-decoration:none;background-image:linear-gradient(var(--accent),var(--accent));background-size:0 2px;background-repeat:no-repeat;background-position:0 100%;transition:background-size .3s ease;padding-bottom:2px}
.lk:hover{background-size:100% 2px;color:var(--ink)}
.btn{min-height:48px;padding:0 20px;display:inline-flex;align-items:center;gap:10px;font:500 16px/1 var(--serif);text-decoration:none;border:1.5px solid var(--ink);border-radius:3px}
.btn.dark{background:var(--ink);color:var(--cell);box-shadow:4px 4px 0 var(--shadow)}
.btn.light{background:var(--cell);color:var(--ink);box-shadow:4px 4px 0 var(--ink)}
.btn:hover{color:inherit}

/* the frame: hairline grid with crosshairs at the corners of every row */
.page{padding:40px 24px 56px}
.frame{max-width:1296px;margin:0 auto;display:grid;grid-template-columns:80px minmax(0,1fr) 80px;gap:1px;background:var(--rule);border:1px solid var(--rule)}
.m{background:var(--cell)}
.cell{position:relative;background:var(--cell)}
.stk{display:grid;grid-template-columns:minmax(0,1fr);gap:1px;background:var(--rule)}
.x{position:absolute;z-index:3;width:11px;height:11px;pointer-events:none}
.x-tl{left:-6px;top:-6px}.x-tr{right:-6px;top:-6px}
.pad{padding:44px 40px 52px}
.tl-cell{padding:36px 48px 28px;background:var(--cell-2)}
.trail-cell{padding:36px 48px 44px;background:var(--cell-2)}
.cast-cell{padding:8px 36px}

/* bar */
.bar{display:flex;justify-content:center;padding:14px 16px}
.nv{width:100%;max-width:860px;min-height:52px;background:var(--ink);display:flex;align-items:center;gap:8px;padding:0 5px 0 18px;border-radius:3px}
.nv .name{color:var(--cell);text-decoration:none;font-size:18px;font-weight:500;white-space:nowrap;min-height:44px;display:flex;align-items:center}
.nv nav{display:flex;align-items:center;justify-content:center;flex:1;gap:2px}
.nv nav a{color:#E3D5BB;text-decoration:none;padding:0 9px;min-height:44px;display:flex;align-items:center}
.nv nav a:hover{color:#FFFFFF}
.nv .contact{margin-left:auto;height:42px;padding:0 16px;background:var(--cell);color:var(--ink);display:flex;align-items:center;gap:8px;font-size:15px;font-weight:500;text-decoration:none;border-radius:2px;white-space:nowrap}

/* hero */
.sky{position:relative;overflow:hidden;background:var(--sky)}
.hero-art{position:relative;overflow:hidden}
.cloud{position:absolute;left:0;z-index:1;animation:cloud 70s linear infinite}
.cloud.b{animation-duration:110s;animation-delay:-40s}
@keyframes cloud{from{transform:translateX(-30%)}to{transform:translateX(130%)}}
.rock{position:absolute;animation:bob 6s ease-in-out infinite alternate}
.rock.b{animation-duration:8s;animation-delay:-2s}
@keyframes bob{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-10px) rotate(2deg)}}
.hero-text{position:relative;z-index:2;display:flex;justify-content:space-between;gap:32px;padding:72px 64px 8px}
.status{margin:0;display:inline-flex;align-items:center;gap:10px;padding:7px 14px;border:1.5px solid var(--ink);border-radius:999px;background:var(--cell)}
.dot-live{width:7px;height:7px;border-radius:50%;background:var(--accent);display:inline-block;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.hero h1{margin-top:26px;font-size:clamp(46px,5.3vw,76px);line-height:1;letter-spacing:-.03em}
.hero h1 em{color:var(--accent)}
.lede{margin:22px 0 0;max-width:560px;font-size:21px;line-height:1.5;color:var(--ink-2)}
.ctas{margin-top:30px;display:flex;gap:14px;flex-wrap:wrap}
.labels{display:flex;flex-direction:column;align-items:flex-end;gap:10px;text-align:right;color:var(--ink-2);padding-top:6px}
.sq{width:7px;height:7px;background:var(--accent);display:inline-block}
.ld{animation:ld 1s cubic-bezier(.2,.7,.2,1) both}
.d1{animation-delay:.05s}.d2{animation-delay:.18s}.d3{animation-delay:.32s}.d4{animation-delay:.46s}
@keyframes ld{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.hl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px}
.hl a{display:block;text-decoration:none;color:var(--ink);padding:22px 24px}
.hl .t{margin:10px 0 0;font-size:30px;line-height:1.1;letter-spacing:-.02em}
.hl .s{margin:12px 0 0;font-size:16px;line-height:1.5;color:var(--ink-2)}
.hl b{color:var(--accent);font-weight:600}
.ticker{overflow:hidden;height:52px;display:flex;align-items:center;background:var(--ink)}
.mq{display:flex;width:max-content;animation:mq 50s linear infinite;color:#F1E4C8;font-size:12px;letter-spacing:.12em;white-space:nowrap}
.mq>span{display:flex;gap:36px;padding-right:36px;align-items:center}
.mq i{font-style:normal;color:#E08A6E}
@keyframes mq{to{transform:translateX(-50%)}}

/* section heads */
.sec-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,3.2fr) minmax(0,1fr);gap:1px;background:var(--rule)}
.sec-head>*{background:var(--cell)}
.sec-head .side{padding:20px;color:var(--ink-2)}
.sec-head .side.r{display:flex;justify-content:flex-end;text-align:right}
.sec-head h2{padding:60px 48px 56px;font-size:clamp(40px,5vw,64px);line-height:1;letter-spacing:-.025em}

/* research areas */
.areas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px}
.area{position:relative;padding:26px 24px;display:flex;flex-direction:column;gap:16px}
.area .tail{position:absolute;top:-9px;left:50%;width:16px;height:16px;margin-left:-8px;background:var(--card);border-left:1.5px solid var(--ink);border-top:1.5px solid var(--ink);transform:rotate(45deg)}
.area h3{font-size:27px;line-height:1.12;font-weight:500;letter-spacing:-.015em}
.area p{margin:0;font-size:17px;line-height:1.6;color:var(--ink-2)}
.area figure{margin:0;background:#fff;border:1.5px solid var(--ink);padding:10px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center}
.area figure img{max-width:100%;max-height:100%;object-fit:contain}
.chips{margin-top:auto;display:flex;flex-wrap:wrap;gap:6px}

/* papers: a year timeline, then four groups, each a vertical timeline of papers that open in place */
.tl-wrap{overflow-x:auto}
.tl{position:relative;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;min-width:560px}
.tl::before{content:"";position:absolute;left:0;right:0;bottom:50px;height:10px;background:var(--teal);border:1.5px solid var(--ink);border-radius:6px}
.tl-col{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center}
.tl-flags{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:8px;min-height:120px}
.tl-flag{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;color:var(--ink);background:var(--card);border:1.5px solid var(--ink);padding:6px 9px;border-radius:3px;box-shadow:3px 3px 0 var(--shadow);white-space:nowrap;transition:transform .2s ease}
.tl-flag:hover{transform:translate(-2px,-2px);color:var(--ink)}
.tl-stem{width:1.5px;height:18px;background:var(--ink)}
.tl-dot{width:16px;height:16px;border-radius:50%;background:var(--accent);border:2px solid var(--ink);margin-bottom:10px}
.tl-year{height:36px;font-size:26px;line-height:36px;letter-spacing:-.02em}
.act{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,4.2fr);gap:1px;background:var(--rule)}
.act>*{background:var(--cell)}
.act-head{padding:32px 28px}
.act-head h3{margin-top:14px;font-size:24px;line-height:1.15;font-weight:500}
.tline{list-style:none;margin:0;padding:6px 36px 6px 64px;position:relative}
.tline::before{content:"";position:absolute;left:34px;top:0;bottom:0;width:2px;background:var(--ink)}
.tline li{position:relative;padding:26px 0;border-bottom:1.5px dashed var(--dash);scroll-margin-top:24px}
.tline li:last-child{border-bottom:0}
.tline li::before{content:"";position:absolute;left:-38px;top:76px;width:14px;height:14px;border-radius:50%;background:var(--accent);border:2px solid var(--ink);box-shadow:0 0 0 4px var(--cell)}
.paper{display:grid;grid-template-columns:118px minmax(0,1fr) 44px;align-items:center;gap:24px;width:100%;text-align:left;font:inherit;color:inherit;background:transparent;border:0;padding:0;cursor:pointer}
.thumb{display:block;position:relative;width:118px;aspect-ratio:3/4}
.book{position:absolute;inset:0;perspective:700px}
.book img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;border:1.5px solid var(--ink);border-radius:3px;background:#fff}
.book .under{filter:brightness(.96)}
.leaf{position:absolute;inset:0;transform-origin:left center;transform-style:preserve-3d;transition:transform .75s cubic-bezier(.3,.8,.2,1)}
.leaf img{backface-visibility:hidden}
.leaf-back{position:absolute;inset:0;border-radius:3px;background:var(--ochre);border:1.5px solid var(--ink);transform:rotateY(180deg);backface-visibility:hidden}
.paper:hover .leaf,.paper:focus-visible .leaf,.paper[aria-expanded="true"] .leaf{transform:rotateY(-68deg)}
.badge{position:absolute;left:-8px;bottom:-8px;z-index:2;background:var(--ochre);border:1.5px solid var(--ink);padding:3px 7px;font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase}
.paper .txt{display:block;min-width:0}
.paper .meta{display:block;color:var(--accent)}
.paper .t{display:block;margin-top:6px;font-size:24px;font-weight:500;line-height:1.15;letter-spacing:-.015em;transition:color .2s ease}
.paper:hover .t{color:var(--accent)}
.paper .b{display:block;margin-top:8px;font-size:17px;line-height:1.55;color:var(--ink-2);max-width:62ch}
.chev{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--ink);border-radius:50%;background:var(--card);transition:transform .35s ease,background-color .2s ease}
.paper[aria-expanded="true"] .chev{transform:rotate(180deg);background:var(--ochre)}
.pp{display:grid;grid-template-rows:0fr;transition:grid-template-rows .5s cubic-bezier(.2,.7,.2,1)}
.pp.open{grid-template-rows:1fr}
.pp-in{min-height:0;overflow:hidden}
.pp-box{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:24px;margin:22px 8px 10px 0;padding:20px}
.pp-media{min-width:0}
.pp-fig{width:100%;height:300px;padding:14px;object-fit:contain;background:#fff;border:1.5px solid var(--ink)}
.player{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:var(--ink);border:1.5px solid var(--ink)}
.player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.player-note{margin:8px 0 0;font-size:14px;color:var(--muted)}
.pp-side{display:flex;flex-direction:column;min-width:0}
.pp-head{margin:0;font-size:15px;line-height:1.45;color:var(--ink-2)}
.pp-head b{display:block;font-size:36px;line-height:1.05;letter-spacing:-.03em;color:var(--accent);font-weight:400;margin-bottom:6px}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.pill{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;color:var(--ink);border:1.5px solid var(--ink);padding:7px 12px;border-radius:999px;background:var(--ochre);box-shadow:2px 2px 0 var(--ink);cursor:pointer}
.pill:hover{color:var(--ink);background:var(--card)}
.pp-meta{margin:auto 0 0;padding-top:16px;font-size:14px;line-height:1.5;color:var(--muted)}
.pp-meta b{color:var(--ink);font-weight:600}
.cast summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:64px;font-size:22px;font-weight:500}
.cast summary::-webkit-details-marker{display:none}
.plus{width:36px;height:36px;border:1.5px solid var(--ink);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:18px;background:var(--ochre);transition:transform .3s ease}
.cast[open] .plus{transform:rotate(45deg)}
.cast ul{list-style:none;margin:0 0 24px;padding:0;font-size:16px;line-height:1.45}
.cast li{display:grid;grid-template-columns:64px minmax(0,1fr);gap:16px;padding:12px 0;border-top:1px solid var(--rule)}
.cast li>span:first-child{font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:var(--muted);padding-top:3px}
.cast a{text-decoration-color:var(--accent)}
.cast em{display:block;font-size:14px;color:var(--muted)}

/* software and tools */
.sw{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px;align-items:stretch}
.sw figure{margin:0;overflow:hidden}
.sw figure img{width:100%;height:100%;min-height:320px;object-fit:cover}
.sw-list{display:flex;flex-direction:column;gap:28px}
.sw-card{padding:28px 28px 26px;display:flex;flex-direction:column;gap:14px}
.sw-card .logo img{height:52px;width:auto}
.sw-card p{margin:0;font-size:20px;line-height:1.45}
.sw-card .role{font-size:11px;color:var(--muted)}
.sw-card code{align-self:flex-start;font-family:var(--mono);font-size:14px;background:var(--ink);color:#F1E4C8;padding:10px 14px;border-radius:3px}
.sw-card code i{font-style:normal;color:#E08A6E}
.links{display:flex;flex-wrap:wrap;gap:18px}
.tools{display:flex;flex-direction:column;gap:36px}
.tool-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px;margin-top:18px}
.tool{padding:20px;display:flex;flex-direction:column;gap:10px}
.tool .kind{display:flex;gap:8px;align-items:center;font-size:10px;color:var(--muted)}
.tool .mcp{background:var(--sky);border:1px solid var(--ink);padding:1px 6px;border-radius:3px;color:var(--ink)}
.tool h4{font-size:20px;line-height:1.2;font-weight:600}
.tool p{margin:0;font-size:15px;line-height:1.5;color:var(--ink-2)}
.tool .links{margin-top:auto;padding-top:6px;gap:16px}

/* experience: the amphitheatre's screen shows the talk photos, then roles, milestones and the rest */
.amph{position:relative;aspect-ratio:1132/640;overflow:hidden;background:#B8C6BA}
.amph-in{position:absolute;left:-20%;top:-14%;width:140%}
.amph-in>img{width:100%;height:auto}
.scr-mask{position:absolute;inset:0;-webkit-mask:url(img/amphitheatre-screen-mask.png) 0 0/100% 100% no-repeat;mask:url(img/amphitheatre-screen-mask.png) 0 0/100% 100% no-repeat}
.scr{position:absolute;left:34.5%;top:21%;width:30.3%;height:31.6%;border:2px solid var(--ink);border-radius:4px;overflow:hidden;background:var(--ink);box-shadow:0 0 0 5px var(--card),0 0 0 6.5px var(--ink)}
.slide{position:absolute;inset:0;margin:0;opacity:0;animation:slide 14s ease-in-out infinite}
.slide img{width:100%;height:100%;object-fit:cover;filter:sepia(.16) saturate(.92) contrast(1.02)}
.slide figcaption{position:absolute;left:3.5%;top:6%;display:flex;flex-direction:column;gap:3px;max-width:68%;padding:7px 10px 8px;background:var(--ochre);border:1.5px solid var(--ink);box-shadow:3px 3px 0 var(--ink)}
.slide figcaption span{font-family:var(--mono);font-size:clamp(8px,.75vw,11px);letter-spacing:.08em;text-transform:uppercase}
.slide figcaption b{font-size:clamp(11px,1.15vw,16px);line-height:1.2;font-weight:600}
.dots{position:absolute;right:3.5%;bottom:6%;display:flex;gap:6px;padding:5px 7px;background:var(--card);border:1.5px solid var(--ink);border-radius:999px}
.dots i{display:block;width:8px;height:8px;border-radius:50%;border:1.5px solid var(--ink);background:var(--card);animation:dot 14s ease-in-out infinite}
@keyframes slide{0%{opacity:0}8%{opacity:1}46%{opacity:1}54%{opacity:0}100%{opacity:0}}
@keyframes dot{0%,4%{background:var(--card)}8%,46%{background:var(--accent)}54%,100%{background:var(--card)}}
.onscreen{padding:18px 40px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 22px;background:var(--cell-2)}
.now{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px}
.now article{padding:26px 28px 24px;display:flex;flex-direction:column;gap:10px}
.now .cap{background:var(--sky)}
.now h3{margin-top:6px;font-size:32px;line-height:1.1;font-weight:500;letter-spacing:-.015em}
.now p{margin:0;font-size:18px;color:var(--ink-2)}
.now p.mono{margin-top:10px;padding-top:14px;border-top:1.5px dashed var(--dash);display:flex;align-items:center;gap:10px;color:var(--ink);font-size:11px}
.trail-wrap{overflow-x:auto;padding:0 6px 8px 0}
.trail{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;min-width:760px}
.trail::before{content:"";position:absolute;left:0;right:0;top:31px;height:10px;background:var(--teal);border:1.5px solid var(--ink);border-radius:6px}
.yr{position:relative;z-index:1;display:flex;flex-direction:column;align-items:flex-start;gap:14px}
.yr-dot{width:20px;height:20px;border-radius:50%;background:var(--accent);border:2px solid var(--ink);margin:26px 0 0 14px;box-shadow:0 0 0 4px var(--cell-2)}
.yr-num{font-size:30px;line-height:1;letter-spacing:-.02em}
.ev{width:100%;background:var(--card);border:1.5px solid var(--ink);border-radius:4px;box-shadow:4px 4px 0 var(--ink);padding:12px 14px}
.ev.award{background:var(--ochre)}
.ev.next{background:transparent;border-style:dashed;box-shadow:none}
.ev .mono{display:flex;align-items:center;gap:6px;color:var(--muted)}
.ev-t{margin:6px 0 0;font-size:17px;line-height:1.25;font-weight:600}
.ev-s{margin:3px 0 0;font-size:14px;line-height:1.4;color:var(--muted)}
.ev-s a{color:var(--accent)}
.legend{display:flex;gap:18px;color:var(--ink-2)}
.legend span{display:inline-flex;align-items:center;gap:6px}
.lists{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px}
.lists ul{list-style:none;margin:16px 0 0;padding:0}
.lists li{padding:14px 0;border-top:1.5px dashed var(--dash)}
.lists b{display:block;font-size:18px;font-weight:600}
.lists span{font-size:15px;color:var(--muted)}

/* footer: a postcard */
.foot{padding:64px 40px 32px;background:var(--cell-2);overflow:hidden}
.postcard{position:relative;max-width:1000px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);background:var(--card);border:1.5px solid var(--ink);border-radius:4px;box-shadow:8px 8px 0 var(--shadow);transform:rotate(-1deg);transition:transform .4s cubic-bezier(.2,.7,.2,1)}
.postcard:hover{transform:rotate(0deg)}
.pc-pic{position:relative;padding:14px;min-height:360px}
.pc-pic img{width:100%;height:100%;min-height:332px;object-fit:cover;object-position:50% 78%;border:1.5px solid var(--ink)}
.pc-pic .cap{position:absolute;left:28px;bottom:28px}
.pc-back{position:relative;padding:28px 32px 30px 36px;display:flex;flex-direction:column;gap:14px}
.pc-back::before{content:"";position:absolute;left:0;top:28px;bottom:28px;width:1.5px;background:var(--ink)}
.pc-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
.pc-top h2{margin-top:10px;font-size:46px;line-height:1;letter-spacing:-.025em}
.stamp{position:relative;flex:none;width:92px;height:112px;padding:8px;background:var(--card);-webkit-mask:linear-gradient(#000,#000) content-box,radial-gradient(circle at 5px 5px,transparent 3.2px,#000 3.8px) -5px -5px/10px 10px;mask:linear-gradient(#000,#000) content-box,radial-gradient(circle at 5px 5px,transparent 3.2px,#000 3.8px) -5px -5px/10px 10px}
.stamp>span{position:relative;display:block;width:100%;height:100%;border:1.5px solid var(--ink);overflow:hidden;background:var(--sky)}
.stamp img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:72% 40%}
.stamp b{position:absolute;left:4px;bottom:4px;font:500 9px/1.2 var(--mono);letter-spacing:.08em;background:var(--card);padding:1px 4px;border:1px solid var(--ink)}
.postmark{position:absolute;left:-96px;top:30px;width:150px;height:90px;pointer-events:none}
.mail{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:6px}
.mail a{font-size:24px;color:var(--accent);text-decoration-thickness:1.5px;text-underline-offset:5px}
.mail button{min-height:40px;padding:0 14px;background:var(--ochre);border:1.5px solid var(--ink);border-radius:999px;color:var(--ink);box-shadow:3px 3px 0 var(--ink);cursor:pointer}
.pc-back address{font-style:normal;margin-top:4px}
.pc-back address span{display:block;padding:10px 0 6px;border-bottom:1.5px solid rgba(42,37,34,.35);font-size:20px}
.foot-links{max-width:1000px;margin:44px auto 0;display:flex;flex-direction:column;gap:14px;align-items:center;text-align:center}
.foot-links nav{display:flex;flex-wrap:wrap;gap:8px 22px;justify-content:center}
.foot-links a{color:var(--ink-2);text-decoration:none;font-size:16px}
.foot-links a:hover{color:var(--accent)}
.foot-links p{margin:12px 0 0;padding-top:16px;border-top:1.5px dashed var(--dash);width:100%;font-size:15px;color:var(--muted)}

@media (max-width:1080px){
  .frame{grid-template-columns:24px minmax(0,1fr) 24px}
  .paper{grid-template-columns:84px minmax(0,1fr) 44px;gap:14px}
  .thumb{width:84px}
}
@media (max-width:900px){
  .hl,.areas,.sw,.act,.now,.lists{grid-template-columns:minmax(0,1fr)}
  .area .tail,.labels,.rock{display:none}
  .pp-box{grid-template-columns:minmax(0,1fr)}
  .pp-fig{height:auto;max-height:260px}
  .tline li::before{top:56px}
  .postcard{grid-template-columns:minmax(0,1fr);transform:none}
  .postcard:hover{transform:none}
  .pc-back::before{display:none}
}
@media (max-width:760px){
  .page{padding:12px 4px}
  .frame{grid-template-columns:12px minmax(0,1fr) 12px}
  .sec-head{grid-template-columns:minmax(0,1fr)}
  .sec-head .side{display:none}
  .sec-head h2{padding:40px 20px 36px}
  .nv{flex-wrap:wrap;padding:6px 6px 6px 14px}
  .nv nav{order:3;flex-basis:100%;flex-wrap:wrap;justify-content:flex-start;gap:0 2px}
  .nv nav a{min-height:36px;padding:0 8px}
  .hero-text{padding:48px 20px 8px}
  .pad,.onscreen,.tl-cell,.trail-cell,.cast-cell{padding-left:20px;padding-right:20px}
  .act-head{padding:24px 20px 0}
  .tline{padding-left:52px}
  .tline::before{left:22px}
  .tline{padding-right:16px}
  .foot{padding:40px 16px 24px}
  .postmark{display:none}
  /* the screen is tiny at phone width: zoom in on the stage and keep only the place line on the photo */
  .amph{aspect-ratio:6/5}
  .amph-in{left:-82%;top:-27%;width:264%}
  .slide figcaption{left:3%;top:4%;max-width:none;padding:4px 7px 5px;box-shadow:2px 2px 0 var(--ink)}
  .slide figcaption span{font-size:9px}
  .slide figcaption b{display:none}
  .dots{right:3%;bottom:4%;padding:3px 5px;gap:4px}
  .dots i{width:6px;height:6px}
}
@media (max-width:560px){
  .paper{grid-template-columns:60px minmax(0,1fr) 36px;gap:12px}
  .thumb{width:60px}
  .chev{width:36px;height:36px}
  .paper .t{font-size:20px}
  .paper .b{font-size:16px}
  .tline{padding-left:40px}
  .tline::before{left:16px}
  .tline li::before{left:-30px;top:44px}
  .badge{left:-6px;bottom:-6px;font-size:9px;padding:2px 5px}
}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .ld,.cloud,.rock,.dot-live,.mq,.slide,.dots i{animation:none}
  .cloud,.mq{transform:none}
  .slide:first-of-type{opacity:1}
  .dots i:first-child{background:var(--accent)}
  .leaf,.pp,.chev,.postcard,.lift{transition:none}
}
`;

const X = `<svg class="x x-tl" viewBox="0 0 11 11" aria-hidden="true"><path d="M5.5 0v11M0 5.5h11" stroke="#C98B6E" stroke-width="1"/></svg><svg class="x x-tr" viewBox="0 0 11 11" aria-hidden="true"><path d="M5.5 0v11M0 5.5h11" stroke="#C98B6E" stroke-width="1"/></svg>`;
const ICON = {
  mail: `<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg>`,
  arrow: `<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  chev: `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6l5 5 5-5"/></svg>`,
  play: `<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10l8-5z" fill="currentColor"/></svg>`,
  talk: `<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`,
  award: `<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/></svg>`,
  next: `<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>`,
};
const secHead = (n, label, title, right) => `<div class="sec-head"><div class="side"><span class="cap">${n} · ${h(label)}</span></div><h2>${h(title)}</h2><div class="side r mono">${right}</div></div>`;

// hero
const CLOUD_A = `<svg class="cloud" aria-hidden="true" viewBox="0 0 220 60" style="top:0.5%;width:19%;height:auto"><path d="M14 52h188c8 0 12-12 2-16 2-12-12-18-22-12-4-12-22-16-32-6-8-14-34-14-42 2-12-4-24 4-22 14-14-2-26 6-22 14-8 0-10 4-8 4z" fill="#F7EED9" stroke="#2A2522" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
const CLOUD_B = `<svg class="cloud b" aria-hidden="true" viewBox="0 0 160 46" style="top:2%;width:14%;height:auto"><path d="M10 40h138c6 0 9-9 1-12 1-9-9-13-16-9-3-9-16-12-23-4-6-10-25-10-31 2-9-3-18 3-16 10-10-1-19 5-16 10-6 0-8 3-6 3z" fill="#E7DDF0" stroke="#2A2522" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
const ROCKS = `<svg class="rock" aria-hidden="true" viewBox="0 0 60 44" style="right:7%;top:262px;width:60px;height:44px"><path d="M6 14l18-10 26 4 6 12-10 14-22 6-18-8z" fill="#A994C6" stroke="#2A2522" stroke-width="1.4" stroke-linejoin="round"/><path d="M6 14l20 8 30-2M26 22l-4 18" fill="none" stroke="#2A2522" stroke-width="1.1"/></svg><svg class="rock b" aria-hidden="true" viewBox="0 0 40 52" style="right:19%;top:318px;width:34px;height:44px"><path d="M8 6l20-2 8 14-4 26-16 4-10-14z" fill="#C98B6E" stroke="#2A2522" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6l12 16 16-4M20 22l-4 26" fill="none" stroke="#2A2522" stroke-width="1.1"/></svg>`;
const venues = PAPERS.map((p) => `${p.venue} ${p.year}`).concat(["MyoGestic", "MyoGen"]);
const tickerRun = `<span>${venues.map((v) => `<span>${h(v)}</span><i>◆</i>`).join("")}</span>`;
const hero = `<div class="cell stk hero" id="top">${X}
<div class="sky">${ROCKS}
<div class="hero-text">
<div style="max-width:780px">
<p class="status mono ld d1"><span class="dot-live"></span>Dr.-Ing. defence expected December 2026</p>
<h1 class="ld d2">Neural interfaces for hand <em>control.</em></h1>
<p class="lede ld d3">I build neural interfaces that turn muscle activity into control of virtual hands, orthoses and prostheses.</p>
<div class="ctas ld d4"><a class="btn dark lift" href="#papers">Selected publications ${ICON.arrow}</a>${ext(CV, "Download CV", "btn light lift")}</div>
</div>
<div class="labels mono"><span style="display:flex;align-items:center;gap:8px"><span class="sq"></span>n-squared lab · FAU</span><span>Erlangen · Germany</span></div>
</div>
<div class="hero-art">${CLOUD_A}${CLOUD_B}<img src="img/desert-hero.webp" width="2208" height="944" fetchpriority="high" alt="Clean-line comic illustration of a pastel desert: Raul, seen from behind in a linen shirt, scarf, satchel and desert boots with a bamboo staff, stands on a dune ridge looking at a giant segmented robotic hand half-buried in the sand, a ribbon cable snaking toward him"></div>
</div>
<div class="cell pad" style="padding-top:40px;padding-bottom:44px"><div class="hl">${HIGHLIGHTS.map((x) => `<a class="panel lift" href="#paper-${x.paper}" data-open="${x.paper}"><p class="mono" style="margin:0;color:var(--muted)">${h(x.kicker)}</p><p class="t">${h(x.title)}</p><p class="s">${h(x.pre)}<b>${h(x.strong)}</b>${h(x.rest)}</p></a>`).join("")}</div></div>
<div class="cell ticker" role="note" aria-label="Published in ${h(PAPERS.map((p) => `${p.venue} ${p.year}`).join(", "))}"><div class="mq mono" aria-hidden="true">${tickerRun}${tickerRun}</div></div>
</div>`;

// research areas
const research = `<div class="cell stk" id="research">${X}
${secHead("02", "Featured work", "Research areas.", "Three landmarks")}
<div class="cell" style="background:#C3E3D5"><img src="img/research-landmarks.webp" width="2208" height="944" loading="lazy" alt="Clean-line comic desert with three landmarks joined by a ribbon cable: a stone hand wearing an electrode band, a robotic hand on a pedestal steered by a small traveller, and a tree shaped like a neuron"></div>
<div class="cell pad" style="background:var(--cell-2)"><div class="areas">${QUESTIONS.map((q, i) => `<article class="panel area" aria-labelledby="q-${i}"><span class="tail" aria-hidden="true"></span><span class="cap">${ROMAN[i]} · ${h(q.label)}</span><h3 id="q-${i}">${h(q.q)}</h3><p>${h(q.answer)}</p><figure><img src="img/fig-${q.fig}.jpg" alt="${h(q.figAlt)}" loading="lazy"></figure><div class="chips">${q.papers.map((id) => `<a class="chip" href="#paper-${id}" data-open="${id}">${h(byId[id].venue)} ${h(byId[id].year)}</a>`).join("")}</div></article>`).join("\n")}</div></div>
</div>`;

// papers
const years = [...new Set(PAPERS.map((p) => p.year))].sort();
const youtube = (href) => { const u = new URL(href); const id = u.searchParams.get("v"); return id ? { id, list: u.searchParams.get("list") ?? "" } : null; };
const pill = ([kind, , href]) => {
  const k = kind.split(" · ")[0];
  const v = /^Video/.test(k) && youtube(href);
  return v
    ? `<button type="button" class="pill play-btn" data-video="${v.id}" data-list="${v.list}" data-href="${h(href)}">${ICON.play}<span>Play ${h(k.toLowerCase())}</span></button>`
    : ext(href, `${h(kind)} ↗`, "pill");
};
const paper = (p) => `<li id="paper-${p.id}"><button type="button" class="paper" data-paper="${p.id}" aria-expanded="false" aria-controls="panel-${p.id}">
<span class="thumb"><span class="book"><img class="under" src="img/page2-${p.id}.jpg" alt="" loading="lazy"><span class="leaf"><img src="img/page-${p.id}.jpg" alt="" loading="lazy"><span class="leaf-back"></span></span></span><span class="badge">${h(TAG(p))}</span></span>
<span class="txt"><span class="mono meta">${h(p.year)} · ${h(PUB(p))}</span><span class="t">${h(p.short)}</span><span class="b">${h(p.line)}</span></span>
<span class="chev">${ICON.chev}</span>
</button>
<div class="pp" id="panel-${p.id}" inert><div class="pp-in"><div class="pp-box panel">
<div class="pp-media"><img class="pp-fig" src="img/fig-${p.id}.jpg" alt="${h(p.figAlt)}" loading="lazy"></div>
<div class="pp-side"><p class="pp-head"><b>${h(p.headline[0])}</b>${h(p.headline[1])}</p><div class="pills">${p.links.map(pill).join("")}</div><p class="pp-meta">${h(p.title)}. <span><b>${h(p.me)}</b>${h(p.others)}.</span> ${h(p.meta)}.</p></div>
</div></div></div>
</li>`;
const papers = `<div class="cell stk" id="papers">${X}
${secHead("03", "Papers", "Selected publications.", "Click a paper to open it")}
<div class="cell tl-cell"><div class="tl-wrap"><div class="tl" role="list" aria-label="Papers by year">${years.map((y) => `<div class="tl-col" role="listitem"><div class="tl-flags">${PAPERS.filter((p) => p.year === y).map((p) => `<a class="tl-flag" href="#paper-${p.id}" data-open="${p.id}">${h(TAG(p))}</a>`).join("")}</div><span class="tl-stem" aria-hidden="true"></span><span class="tl-dot" aria-hidden="true"></span><span class="tl-year">${y}</span></div>`).join("")}</div></div></div>
${ACTS.map((a, i) => `<div class="act"><div class="act-head"><span class="cap">${ROMAN[i]}</span><h3>${h(a.title)}</h3></div><div><ol class="tline">${PAPERS.filter((p) => p.act === i).map(paper).join("")}</ol></div></div>`).join("\n")}
<div class="cell cast-cell"><details class="cast"><summary>${CAST.length === 12 ? "Twelve" : CAST.length} more, as co-author<span class="plus" aria-hidden="true">+</span></summary><ul>${CAST.map(([y, t, who, href]) => `<li><span>${h(y)}</span><span>${href ? ext(href, h(t)) : h(t)}<em>${h(who)}</em></span></li>`).join("")}</ul></details></div>
</div>`;

// software and tools
const software = `<div class="cell stk" id="software">${X}
${secHead("04", "Software", "Research software.", "Open source")}
<div class="cell pad" style="background:var(--cell-2)"><div class="sw">
<figure class="panel-k"><img src="img/workshop.webp" width="1680" height="944" loading="lazy" alt="Clean-line comic workshop under a striped awning: a cloaked figure seen from behind repairs a segmented robotic hand at a workbench, a hover-glider parked beside it"></figure>
<div class="sw-list">${SOFTWARE.map((s) => `<article class="panel sw-card lift"><h3 class="logo">${ext(s.links[0][1], `<img src="${s.logo}" alt="${h(s.name)}">`)}</h3><p>${h(s.text)}</p><p class="role mono">${h(s.role)}</p>${s.install ? `<code><i>$</i> ${h(s.install)}</code>` : ""}<div class="links">${s.links.map(([l, href]) => ext(href, `${h(l)} ↗`, "lk")).join("")}</div></article>`).join("")}</div>
</div></div>
</div>`;
const tools = `<div class="cell stk" id="tools">${X}
${secHead("05", "Tools", "Smaller tools.", "github.com/RaulSimpetru")}
<div class="cell pad"><div class="tools">${TOOLS.map((g) => `<div><h3 class="cap">${h(g.label)}</h3><div class="tool-grid">${g.items.map((t) => `<article class="panel-k tool lift"><span class="kind mono">${h(t.kind)}${t.mcp ? `<span class="mcp">MCP</span>` : ""}</span><h4>${h(t.name)}</h4><p>${h(t.line)}</p><div class="links">${t.links.map(([l, href]) => ext(href, `${h(l)} ↗`, "lk")).join("")}</div></article>`).join("")}</div></div>`).join("\n")}</div></div>
</div>`;

// experience
const KIND = { talk: ["", "Talk", ICON.talk], lecture: ["", "Public lecture", ICON.talk], award: ["award", "Recognition", ICON.award], next: ["next", "Expected", ICON.next] };
const ev = ([kind, title, where, href, month]) => {
  const [cls, label, icon] = KIND[kind];
  return `<div class="ev ${cls}"><span class="mono">${icon}${h(label)}${month ? ` · ${h(month)}` : ""}</span><p class="ev-t">${h(title)}</p><p class="ev-s">${href ? ext(href, `${h(where)} ↗`) : h(where)}</p></div>`;
};
const experience = `<div class="cell stk" id="experience">${X}
${secHead("06", "Experience", "Research, teaching, talks.", ext(CV, "The full CV (PDF) ↗", "lk"))}
<div class="cell amph"><div class="amph-in">
<img src="img/amphitheatre.webp" width="1728" height="976" loading="lazy" alt="Clean-line comic amphitheatre carved into terracotta rock: a cloaked speaker stands in front of a large stone screen while an audience in cloaks, seen from behind, listens">
<div class="scr-mask"><div class="scr">${ON_SCREEN.map((s) => `<figure class="slide" style="${ON_SCREEN.indexOf(s) ? `animation-delay:-${(14 / ON_SCREEN.length) * ON_SCREEN.indexOf(s)}s` : ""}"><img src="${s.img}" alt="${h(s.alt)}" loading="lazy" style="object-position:${s.pos}"><figcaption><span>${h(s.place)}</span><b>${h(s.title)}</b></figcaption></figure>`).join("")}<span class="dots" aria-hidden="true">${ON_SCREEN.map((_, i) => `<i${i ? ` style="animation-delay:-${(14 / ON_SCREEN.length) * i}s"` : ""}></i>`).join("")}</span></div></div>
</div></div>
<div class="cell onscreen"><span class="cap">On screen</span>${ON_SCREEN.map((s) => ext(s.href, `${h(s.title)} ↗`, "lk")).join("")}</div>
<div class="cell pad" style="padding-top:40px;padding-bottom:44px"><div class="now">${NOW.map((r) => `<article class="panel"><span class="cap">Now</span><h3>${h(r.title)}</h3><p>${h(r.org)}</p><p class="mono">${r.live ? `<span class="dot-live"></span>` : ""}${h(r.note)}</p></article>`).join("")}</div></div>
<div class="cell trail-cell">
<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:8px"><h3 style="font-size:26px;font-weight:500">Talks and recognition</h3><span class="legend mono"><span>${ICON.talk}Talk</span><span>${ICON.award}Recognition</span></span></div>
<div class="trail-wrap"><div class="trail" role="list" aria-label="Talks and recognition by year">${MILESTONES.map(([y, items]) => `<div class="yr" role="listitem"><span class="yr-dot" aria-hidden="true"></span><span class="yr-num">${y}</span>${items.map(ev).join("")}</div>`).join("")}</div></div>
</div>
<div class="cell pad" style="padding-top:36px;padding-bottom:48px"><div class="lists">${FACTS.map(([k, items]) => `<div><span class="cap">${h(k)}</span><ul>${items.map(([main, sub]) => `<li><b>${h(main)}</b><span>${h(sub)}</span></li>`).join("")}</ul></div>`).join("")}</div></div>
</div>`;

// footer
const footer = `<footer class="cell foot" id="contact">${X}
<div class="postcard">
<div class="pc-pic"><img src="img/dusk-camp.webp" width="2208" height="944" loading="lazy" alt="Clean-line comic desert at dusk: a small camp with a tent and a hover-glider, a cloaked figure by a campfire, the giant robotic hand on the horizon"><span class="cap">Erlangen · Germany</span></div>
<div class="pc-back">
<div class="pc-top">
<div><span class="mono" style="color:var(--muted)">07 · Contact</span><h2>Contact</h2></div>
<div class="stamp" aria-hidden="true"><span><img src="img/desert-hero.webp" alt="" loading="lazy"><b>FAU</b></span></div>
<svg class="postmark" aria-hidden="true" viewBox="0 0 150 90"><defs><path id="pm" d="M45 45 m-30 0 a30 30 0 1 1 60 0 a30 30 0 1 1 -60 0"/></defs><circle cx="45" cy="45" r="36" fill="none" stroke="#B4553F" stroke-width="1.6" opacity=".75"/><circle cx="45" cy="45" r="22" fill="none" stroke="#B4553F" stroke-width="1.2" opacity=".75"/><text font-family="Geist Mono, monospace" font-size="7.2" letter-spacing="1.2" fill="#B4553F" opacity=".85"><textPath href="#pm">ERLANGEN · N-SQUARED LAB · FAU ·</textPath></text><text x="45" y="48" text-anchor="middle" font-family="Geist Mono, monospace" font-size="9" fill="#B4553F" opacity=".85">2026</text><path d="M84 34c10-5 20 5 30 0s20 5 30 0M84 46c10-5 20 5 30 0s20 5 30 0M84 58c10-5 20 5 30 0s20 5 30 0" fill="none" stroke="#B4553F" stroke-width="1.6" opacity=".7"/></svg>
</div>
<div class="mail"><a href="mailto:raul.simpetru@fau.de">raul.simpetru@fau.de</a><button type="button" class="mono" data-copy="raul.simpetru@fau.de">Copy address</button></div>
<address><span>Raul C. Sîmpetru</span><span>n-squared lab</span><span>FAU Erlangen-Nürnberg</span><span>Erlangen, Germany</span></address>
</div>
</div>
<div class="foot-links">
<nav aria-label="On this page"><a href="#research">Research areas</a><a href="#papers">Selected publications</a><a href="#software">Research software</a><a href="#tools">Smaller tools</a><a href="#experience">Experience</a></nav>
<nav aria-label="Elsewhere">${ext(CV, "CV (PDF)")}${ext("https://scholar.google.com/citations?user=jAHFWF8AAAAJ", "Google Scholar")}${ext("https://orcid.org/0000-0003-0455-0168", "ORCID")}${ext("https://github.com/RaulSimpetru", "GitHub")}${ext("https://www.linkedin.com/in/raulsimpetru/", "LinkedIn")}</nav>
<p>© 2026 Raul C. Sîmpetru</p>
</div>
</footer>`;

const PAGE_JS = `
// Papers open in place, one at a time; chips, timeline flags and highlight cards jump to their paper and open it.
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const figures = new Map();
const stopVideo = (panel) => {
  const media = panel.querySelector(".pp-media");
  if (figures.has(media)) media.replaceChildren(figures.get(media));
  const btn = panel.querySelector(".play-btn");
  if (btn) { btn.setAttribute("aria-pressed", "false"); btn.querySelector("span").textContent = btn.dataset.label; }
};
for (const btn of document.querySelectorAll(".play-btn")) {
  btn.dataset.label = btn.querySelector("span").textContent;
  btn.setAttribute("aria-pressed", "false");
  btn.addEventListener("click", () => {
    const panel = btn.closest(".pp");
    const media = panel.querySelector(".pp-media");
    if (btn.getAttribute("aria-pressed") === "true") return stopVideo(panel);
    if (!figures.has(media)) figures.set(media, media.firstElementChild);
    const src = "https://www.youtube-nocookie.com/embed/" + btn.dataset.video + "?autoplay=1&rel=0" + (btn.dataset.list ? "&list=" + btn.dataset.list : "");
    const player = document.createElement("div");
    player.className = "player";
    player.innerHTML = '<iframe title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    player.firstChild.src = src;
    const note = document.createElement("p");
    note.className = "player-note";
    note.innerHTML = 'Not playing? <a target="_blank" rel="noopener">Open it on YouTube ↗</a>';
    note.querySelector("a").href = btn.dataset.href;
    media.replaceChildren(player, note);
    btn.setAttribute("aria-pressed", "true");
    btn.querySelector("span").textContent = "Show the figure";
  });
}
const setOpen = (card, open) => {
  const panel = document.getElementById("panel-" + card.dataset.paper);
  if (!open) stopVideo(panel);
  card.setAttribute("aria-expanded", String(open));
  panel.classList.toggle("open", open);
  if (open) panel.removeAttribute("inert"); else panel.setAttribute("inert", "");
};
const openPaper = (id) => {
  for (const c of document.querySelectorAll(".paper[data-paper]")) setOpen(c, c.dataset.paper === id && c.getAttribute("aria-expanded") !== "true");
};
// Keep the clicked card still while a panel above it closes and its own opens.
const pin = (el) => {
  const top = el.getBoundingClientRect().top, end = performance.now() + 600;
  const step = () => { scrollBy({ top: el.getBoundingClientRect().top - top, behavior: "instant" }); if (performance.now() < end) requestAnimationFrame(step); };
  requestAnimationFrame(step);
};
for (const c of document.querySelectorAll(".paper[data-paper]")) c.addEventListener("click", () => { pin(c); openPaper(c.dataset.paper); });
for (const b of document.querySelectorAll("[data-open]")) b.addEventListener("click", (e) => {
  e.preventDefault();
  const card = document.querySelector('.paper[data-paper="' + b.dataset.open + '"]');
  if (card.getAttribute("aria-expanded") !== "true") openPaper(b.dataset.open);
  document.getElementById("paper-" + b.dataset.open).scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", "#paper-" + b.dataset.open);
});
// Copy the address.
const copy = document.querySelector("[data-copy]");
copy?.addEventListener("click", async () => {
  const label = copy.textContent;
  try { await navigator.clipboard.writeText(copy.dataset.copy); copy.textContent = "Copied"; }
  catch { getSelection().selectAllChildren(document.querySelector(".mail a")); copy.textContent = "Selected"; }
  setTimeout(() => (copy.textContent = label), 1800);
});
// A link to a paper opens it.
const hashPaper = location.hash.match(/^#paper-(\\w+)$/);
if (hashPaper && document.querySelector('.paper[data-paper="' + hashPaper[1] + '"]')) openPaper(hashPaper[1]);
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Raul C. Sîmpetru</title>
<meta name="google-site-verification" content="VmtRNw8fHQ_VhBbs_c3irGke6hFKhQJFwGw5D7xUJl0">
<meta name="description" content="${h(DESC)}">
<link rel="canonical" href="${SITE}">
<!-- link previews (WhatsApp, Signal, LinkedIn, X, Slack): title, description and a 1200x630 card -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="Raul C. Sîmpetru">
<meta property="og:url" content="${SITE}">
<meta property="og:title" content="Raul C. Sîmpetru · Neural interfaces for hand control">
<meta property="og:description" content="${h(DESC)}">
<meta property="og:image" content="${SITE}img/og-preview.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Raul C. Sîmpetru, Neural interfaces for hand control, over a comic desert with a giant robotic hand">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:creator" content="@RaulCSimpetru">
<meta name="theme-color" content="#E9DAB9">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="icon" href="favicon-32.png" sizes="32x32">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preload" as="image" href="img/desert-hero.webp" fetchpriority="high">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..700;1,8..60,300..700&display=swap">
<style>${CSS}</style>
</head>
<body>
<div class="page"><div class="frame">
<div class="m"></div><header class="cell bar"><div class="nv"><a class="name" href="#top">R. C. Sîmpetru</a><nav class="mono" aria-label="Sections"><a href="#research">Research</a><a href="#papers">Papers</a><a href="#software">Software</a><a href="#tools">Tools</a><a href="#experience">Experience</a>${ext(CV, "CV")}</nav><a class="contact" href="#contact">Contact ${ICON.mail}</a></div></header><div class="m"></div>
<main style="display:contents">
<div class="m"></div>${hero}<div class="m"></div>
<div class="m"></div>${research}<div class="m"></div>
<div class="m"></div>${papers}<div class="m"></div>
<div class="m"></div>${software}<div class="m"></div>
<div class="m"></div>${tools}<div class="m"></div>
<div class="m"></div>${experience}<div class="m"></div>
</main>
<div class="m"></div>${footer}<div class="m"></div>
</div></div>
<script>${PAGE_JS}</script>
</body>
</html>
`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.html"), html);
cpSync(join(HERE, "img"), join(OUT, "img"), { recursive: true });
cpSync(join(HERE, "icons"), OUT, { recursive: true });
writeFileSync(join(OUT, "favicon.svg"), FAVICON);
cpSync(join(HERE, "uploads"), join(OUT, "uploads"), { recursive: true }); // the CV
console.log(`public/index.html · ${(html.length / 1024).toFixed(0)} KB`);
