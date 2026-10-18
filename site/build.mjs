// The site, Swiss editorial: bun run build → public/ (the bench figure in bench/ comes from
// figures/emg-bench/build.mjs --site=site/bench, which needs the anatomy kit and runs locally only).
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PAPERS, ACTS, QUESTIONS, CAST, SOFTWARE, FACTS } from "./data.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../public");
const h = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const byId = Object.fromEntries(PAPERS.map((p) => [p.id, p]));
const ext = (href, text, cls = "") => `<a${cls ? ` class="${cls}"` : ""} href="${h(href)}" target="_blank" rel="noopener">${text}</a>`;

const CSS = `
/* Layout: a 12-column grid with a narrow label rail (cols 1–3) and the content to its right; the hero
   and the questions break the rail on purpose, so figures sit off-centre against the text. */
:root{
  --paper:#FBFAF7;--paper-2:#F2F1EC;--ink:#14213D;--ink-2:#36415B;--muted:#68708A;--rule:#D8DAE0;--rule-strong:#14213D;
  --crimson:#B4123A;--crimson-soft:#F7E3E8;--lilac:#8E7CE8;--lilac-ink:#5B4BC4;--lilac-soft:#EEEBFC;
  --card:#FFFFFF;--band:#14213D;--on-band:#F3F4F8;--on-band-muted:#AEB6CA;--shade:rgba(10,14,24,.55);
  --display:"Schibsted Grotesk","Helvetica Neue",Arial,sans-serif;
  --text:"Source Serif 4",Georgia,"Times New Roman",serif;
  --mono:"Geist Mono",ui-monospace,"SF Mono",Menlo,monospace;
  color-scheme:light;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --paper:#0D111C;--paper-2:#141A28;--ink:#E8EBF2;--ink-2:#C3C9D7;--muted:#8D95AA;--rule:#262E42;--rule-strong:#E8EBF2;
  --crimson:#FF5D7A;--crimson-soft:#3A1520;--lilac:#A898FF;--lilac-ink:#C4B9FF;--lilac-soft:#221D3D;
  --card:#141A28;--band:#060912;--on-band:#E8EBF2;--on-band-muted:#8D95AA;--shade:rgba(0,0,0,.66);color-scheme:dark}}
:root[data-theme="dark"]{
  --paper:#0D111C;--paper-2:#141A28;--ink:#E8EBF2;--ink-2:#C3C9D7;--muted:#8D95AA;--rule:#262E42;--rule-strong:#E8EBF2;
  --crimson:#FF5D7A;--crimson-soft:#3A1520;--lilac:#A898FF;--lilac-ink:#C4B9FF;--lilac-soft:#221D3D;
  --card:#141A28;--band:#060912;--on-band:#E8EBF2;--on-band-muted:#8D95AA;--shade:rgba(0,0,0,.66);color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:400 18px/1.6 var(--text);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
a{color:inherit;text-decoration-thickness:1px;text-underline-offset:3px}
a:hover{color:var(--crimson)}
:focus-visible{outline:2px solid var(--crimson);outline-offset:3px}
img{max-width:100%;display:block}
.wrap{max-width:1320px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.inner{padding-inline:clamp(4px,3vw,40px)}
.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:clamp(16px,2.2vw,32px)}
.mono{font-family:var(--mono);font-size:12px;letter-spacing:.06em;text-transform:uppercase;line-height:1.4}
.label{color:var(--muted)}
.label.accent{color:var(--crimson)}
h1,h2,h3,h4{font-family:var(--display);color:var(--ink);text-wrap:balance;margin:0}

/* bar */
.bar{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px 32px;padding-block:22px 18px;border-bottom:1px solid var(--rule-strong)}
.bar .name{font-family:var(--display);font-weight:700;font-size:17px;letter-spacing:-.01em;text-decoration:none}
.bar nav{display:flex;flex-wrap:wrap;gap:4px 22px;font-family:var(--display);font-size:15px;font-weight:500}
.bar nav a{text-decoration:none;padding-block:6px}
.bar nav a:hover{text-decoration:underline}
.bar nav .cv{color:var(--crimson)}

/* hero */
.hero{padding-block:clamp(40px,6vw,88px) clamp(32px,4vw,56px);align-items:start;row-gap:40px}
.hero-text{grid-column:1/span 4;display:flex;flex-direction:column;gap:22px;padding-top:8px}
.hero h1{font-weight:800;font-size:clamp(44px,4.7vw,70px);line-height:.94;letter-spacing:-.045em}
.hero h1 em{font-style:normal;color:var(--crimson)}
.lede{font-size:clamp(19px,1.6vw,22px);line-height:1.5;color:var(--ink);margin:0;max-width:34ch}
.byline{display:flex;gap:20px;align-items:center;margin:0;padding-top:22px;border-top:1px solid var(--rule)}
.byline img{flex:none;width:116px;height:116px;object-fit:cover;object-position:50% 25%;border-radius:16px;box-shadow:0 0 0 1px var(--rule),0 12px 26px -18px rgba(20,33,61,.45)}
.byline p{margin:0;font-family:var(--display);font-size:14px;line-height:1.4;color:var(--ink-2)}
.wry{font-style:italic;color:var(--muted);font-size:16px;margin:0}
.hero-figure{grid-column:5/span 8;min-width:0}

/* the bench figure, fitted to the page */
.hero-figure{--anatomy-mono:var(--mono)}
.hero-figure .iso-figure{margin:0}
.hero-figure .eb-credit{position:absolute;right:20px;bottom:18px;z-index:2;font-family:var(--mono);font-size:10.5px;line-height:1;letter-spacing:.04em;color:var(--muted);text-decoration:none}
.hero-figure .eb-credit:hover{color:var(--crimson);text-decoration:underline}
.hero-figure .iso-plate{background:transparent;box-shadow:0 0 0 1px var(--rule);padding:44px 12px 40px}
@media (max-width:560px){.hero-figure .iso-plate{padding-bottom:80px}.hero-figure .eb-credit{bottom:14px}}

/* sections */
section{padding-top:clamp(80px,9vw,140px)}
.sec-head{align-items:end;row-gap:14px;padding-bottom:22px;border-bottom:1px solid var(--rule-strong)}
.sec-head .mono{grid-column:1/span 3;align-self:start;padding-top:12px}
.sec-head h2{grid-column:4/span 6;font-weight:800;font-size:clamp(38px,4.6vw,64px);line-height:.98;letter-spacing:-.04em}
.sec-head p.intro{grid-column:10/span 3;margin:0;font-size:16px;line-height:1.5;color:var(--ink-2)}

/* the three questions: cards that pin as you scroll, each settling on the last, tabs left showing */
.stack{display:flex;flex-direction:column;gap:56px;margin-top:48px}
.card{position:sticky;top:calc(24px + var(--i) * 52px);background:var(--card);border:1px solid var(--rule-strong);box-shadow:0 -12px 30px -18px rgba(20,33,61,.35)}
.card-tab{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:52px;padding:0 24px;border-bottom:1px solid var(--rule)}
.card-tab .mono{color:var(--crimson)}
.card-tab span:last-child{font-family:var(--display);font-size:15px;font-weight:600;text-align:right}
.card-body{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:40px;padding:28px 28px 32px}
.card-fig{margin:0;min-width:0}
.card-fig .frame{background:#fff;border:1px solid var(--rule);border-radius:14px;overflow:hidden}
.card-fig img{width:100%;height:440px;box-sizing:border-box;padding:22px;object-fit:contain}
.card-fig figcaption{margin-top:10px;font-family:var(--display);font-size:13px;color:var(--muted)}
.card-text{display:flex;flex-direction:column;gap:18px;min-width:0}
.card-text h3{font-weight:700;font-size:clamp(28px,2.8vw,40px);line-height:1.03;letter-spacing:-.03em}
.card-text p{margin:0;font-size:18px;line-height:1.6;color:var(--ink-2)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto}
.chip{text-align:left;font-family:var(--display);font-size:13px;font-weight:600;color:var(--ink);background:transparent;border:1px solid var(--rule-strong);padding:7px 12px;cursor:pointer}
.chip:hover{background:var(--ink);color:var(--paper)}

/* papers: an abstract timeline in four acts */
.act{row-gap:16px}
.act-head{grid-column:1/span 3;align-self:start;position:sticky;top:20px;padding-top:44px;display:flex;flex-direction:column;gap:8px}
.act-head h3{font-weight:700;font-size:24px;line-height:1.1;letter-spacing:-.02em}
.act-head p{margin:0;font-family:var(--display);font-size:13px;color:var(--muted)}
.act-list{grid-column:4/span 9;list-style:none;margin:0;padding:44px 0 0 28px;border-left:1px solid var(--rule-strong);display:grid;gap:18px}
.act-list li{position:relative}
.act-list li::before{content:"";position:absolute;left:-33px;top:62px;width:9px;height:9px;border-radius:50%;background:var(--paper);border:2px solid var(--crimson)}
.act-list li{border-bottom:1px solid var(--rule);padding-bottom:22px;scroll-margin-top:24px}
.paper{display:grid;grid-template-columns:118px minmax(0,1fr) 44px;align-items:center;gap:24px;width:100%;text-align:left;font:inherit;color:inherit;background:transparent;border:0;padding:6px 0 0;cursor:pointer}
.chev{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border:1px solid var(--rule);border-radius:50%;color:var(--ink);transition:transform .35s,border-color .2s}
.paper:hover .chev{border-color:var(--ink)}
.paper[aria-expanded="true"] .chev{transform:rotate(180deg)}
.panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .45s cubic-bezier(.2,.7,.2,1)}
.panel.open{grid-template-rows:1fr}
.panel-in{min-height:0;overflow:hidden}
.panel-box{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:28px;margin-top:20px;padding:22px;background:var(--paper-2);border-radius:14px}
.panel-media{min-width:0}
.panel-fig{width:100%;height:320px;box-sizing:border-box;padding:18px;object-fit:contain;background:#fff;border:1px solid var(--rule);border-radius:12px}
.player{position:relative;width:100%;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#0D111C}
.player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.player-note{margin:8px 0 0;font-family:var(--display);font-size:13px;color:var(--muted)}
.play-btn{cursor:pointer;background:transparent}
.play-btn[aria-pressed="true"]{background:var(--ink);color:var(--paper)}
.panel-side{display:flex;flex-direction:column;gap:16px;min-width:0}
.panel-head{margin:0;font-family:var(--display);font-size:15px;line-height:1.4;color:var(--ink-2)}
.panel-head b{display:block;font-size:34px;line-height:1.05;letter-spacing:-.03em;color:var(--crimson);margin-bottom:4px}
.pills{display:flex;flex-wrap:wrap;gap:8px}
.pill{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border:1px solid var(--rule-strong);border-radius:999px;text-decoration:none;font-family:var(--display);font-size:15px;font-weight:600;color:var(--ink);transition:background .2s,color .2s}
.pill:hover{background:var(--ink);color:var(--paper)}
.panel-meta{margin:auto 0 0;font-family:var(--display);font-size:13px;line-height:1.45;color:var(--muted)}
.panel-meta span{color:var(--ink-2)}
.paper:hover .t{color:var(--crimson)}
.thumb{display:block;position:relative;width:118px;aspect-ratio:3/4;perspective:900px}
/* the first page lifts like a page being turned and shows page two underneath */
.book{position:absolute;inset:0;perspective:700px}
.book img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;border:1px solid var(--rule);border-radius:8px;background:#fff}
.book .under{filter:brightness(.97)}
.leaf{position:absolute;inset:0;transform-origin:left center;transform-style:preserve-3d;transition:transform .75s cubic-bezier(.3,.8,.2,1)}
.leaf img{backface-visibility:hidden;box-shadow:2px 0 0 rgba(0,0,0,0)}
.leaf-back{position:absolute;inset:0;border-radius:8px;background:#ECEAE4;border:1px solid var(--rule);transform:rotateY(180deg);backface-visibility:hidden}
.paper:hover .leaf,.paper:focus-visible .leaf{transform:rotateY(-68deg)}
.paper:hover .leaf img,.paper:focus-visible .leaf img{box-shadow:12px 0 18px -10px rgba(0,0,0,.35)}
.badge{position:absolute;left:-8px;bottom:-8px;z-index:2;display:flex;flex-direction:column;background:var(--paper);border:1px solid var(--rule-strong);padding:4px 7px 5px;line-height:1.05;pointer-events:none}
.badge small{font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.badge strong{font-family:var(--display);font-size:13px;font-weight:800;letter-spacing:-.01em;color:var(--ink)}
.badge.logo{flex-direction:column;align-items:flex-start;gap:3px;padding:5px 7px;background:#fff;border-color:#C9CDD6;border-radius:6px}
.badge.logo img{height:14px;width:auto;display:block}
.badge.logo strong{color:#14213D;white-space:nowrap;font-size:12px}
.badge.sciadv{gap:0;line-height:1}
.badge.sciadv b{font-family:var(--text);font-weight:600;font-size:14px;letter-spacing:-.01em;color:#C8102E}
.paper .txt{display:block;min-width:0}
.paper .meta{display:block;color:var(--crimson)}
.paper .t{display:block;font-family:var(--display);color:var(--ink);margin:6px 0 0;font-weight:700;font-size:23px;line-height:1.15;letter-spacing:-.02em;transition:color .2s}
.paper .b{display:block;margin:8px 0 0;font-size:17px;line-height:1.55;color:var(--ink-2);max-width:62ch}
.cast{grid-column:4/span 9;margin-top:36px;border-top:1px solid var(--rule-strong)}
.cast summary{cursor:pointer;padding:16px 0;font-family:var(--display);font-weight:600;font-size:16px}
.cast ul{list-style:none;margin:0;padding:0}
.cast li{display:grid;grid-template-columns:64px minmax(0,1fr);gap:4px 18px;padding:12px 0;border-top:1px solid var(--rule);font-size:16px}
.cast li span:first-child{font-family:var(--mono);font-size:13px;color:var(--crimson);padding-top:3px}
.cast em{display:block;color:var(--muted);font-size:15px}

/* software */
.sw{row-gap:0;margin-top:0}
#software .sec-head{border-bottom:0}
.sw article{grid-column:span 6;min-width:0;padding:28px 0 8px;border-top:4px solid var(--ink)}
.sw article.crimson{border-top-color:var(--crimson)}
.sw article.lilac{border-top-color:var(--lilac)}
.sw .logo{display:flex;margin-bottom:14px}
.sw .logo a{display:inline-flex;transition:opacity .2s}
.sw .logo a:hover{opacity:.75}
.sw .logo img{height:64px;width:auto}
.sw p{margin:8px 0 0;font-size:17px;line-height:1.55;color:var(--ink-2)}
.sw .role{font-family:var(--display);font-size:13px;font-weight:600;color:var(--muted)}
.sw code{white-space:nowrap;font-family:var(--mono);font-size:13px;background:var(--lilac-soft);color:var(--lilac-ink);padding:2px 6px}
.sw .links{display:flex;flex-wrap:wrap;gap:4px 18px;margin-top:14px;font-family:var(--display);font-size:15px;font-weight:600}

/* people and places */
.people{row-gap:40px;padding-top:36px;align-items:start}
.stage-col{grid-column:1/span 6;min-width:0;display:flex;flex-direction:column;gap:28px}
.stage-photo{margin:0}
.stage-photo img{width:100%;aspect-ratio:920/545;object-fit:cover;border-radius:14px}
.stage-photo figcaption{margin-top:10px;font-family:var(--display);font-size:13px;color:var(--muted)}
.facts-list{grid-column:7/span 6;min-width:0;display:flex;flex-direction:column;gap:22px}
.facts-list dl{margin:0;border-top:1px solid var(--rule-strong)}
.facts-list dl>div{display:grid;grid-template-columns:120px minmax(0,1fr);gap:4px 20px;padding:14px 0;border-bottom:1px solid var(--rule)}
.facts-list dt{padding-top:3px}
.facts-list dd{margin:0}
.facts-list ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.facts-list li b{display:block;font-family:var(--display);font-size:16px;font-weight:600;line-height:1.35;color:var(--ink)}
.facts-list li span{display:block;font-family:var(--display);font-size:14px;line-height:1.4;color:var(--muted)}
.cv-link{font-family:var(--display);font-size:15px;font-weight:600;color:var(--crimson)}

/* contact band */
.band{margin-top:clamp(96px,10vw,160px);background:var(--band);color:var(--on-band)}
.band .wrap{padding-block:clamp(64px,8vw,104px) 36px}
.band h2{color:var(--on-band);font-weight:800;font-size:clamp(36px,5vw,72px);line-height:1;letter-spacing:-.04em;max-width:18ch;margin-top:16px}
.mail{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;margin-top:36px}
.mail span{font-family:var(--text);font-size:clamp(24px,3vw,36px);user-select:all;border-bottom:2px solid var(--crimson)}
.mail button{font-family:var(--display);font-size:14px;font-weight:600;background:transparent;color:var(--on-band);border:1px solid var(--on-band-muted);padding:8px 14px;cursor:pointer}
.mail button:hover{border-color:var(--on-band)}
.band nav{display:flex;flex-wrap:wrap;gap:6px 26px;margin-top:30px;font-family:var(--display);font-size:16px;font-weight:600}
.band nav a{text-decoration:none;padding-block:6px}
.band nav a:hover{color:#F2A7B8}
.band footer{margin-top:72px;padding-top:16px;border-top:1px solid #2B3550;font-family:var(--display);font-size:13px;color:var(--on-band-muted)}

/* narrow screens: one column, rails collapse above their content */
@media (max-width:1020px){
  .hero-text,.hero-figure{grid-column:1/-1}
  .hero-text{max-width:640px}
  .sec-head .mono,.sec-head h2,.sec-head p.intro{grid-column:1/-1}
  .card{position:relative;top:auto}
  .card-body{grid-template-columns:minmax(0,1fr)}
  .card-fig img{height:auto;max-height:420px}
  .act{row-gap:0;border-left:1px solid var(--rule-strong)}
  .act-head{grid-column:1/-1;position:static;padding:32px 0 0 28px}
  .act-list{padding-top:16px;border-left:0}
  .act-list,.cast{grid-column:1/-1}
  .sw article{grid-column:1/-1}
  .stage-col,.facts-list{grid-column:1/-1}
  .facts-list dl>div{grid-template-columns:1fr}
}
@media (max-width:560px){
  body{font-size:17px}
  .paper{grid-template-columns:84px minmax(0,1fr) 44px;gap:14px}
  .panel-box{grid-template-columns:minmax(0,1fr);padding:16px}
  .panel-fig{height:auto;max-height:260px}
  .thumb{width:84px}
  .act-head,.act-list{padding-left:18px}
  .act-list li::before{left:-23px;top:44px}
}
@media (prefers-reduced-motion:reduce){.leaf,.panel,.chev{transition:none}}
`;

// Venue badges: the publisher's or server's own logo where we have the file, otherwise the name set in type.
const LOGOS = { IEEE: "img/logo-ieee.svg", IOP: "img/logo-iop.png", Preprint: "img/logo-biorxiv.png" };
const badge = (p) =>
  p.pub === "Science"
    ? `<span class="badge logo sciadv" aria-hidden="true"><b>Science</b><b>Advances</b></span>`
    : LOGOS[p.pub]
    ? `<span class="badge logo" aria-hidden="true"><img src="${LOGOS[p.pub]}" alt="">${p.pub === "Preprint" ? "" : `<strong>${h(p.venue)}</strong>`}</span>`
    : `<span class="badge" aria-hidden="true"><small>${h(p.pub)}</small><strong>${h(p.venue)}</strong></span>`;

// "R. C. Sîmpetru, D. I. Braun and 11 more", keeping an equal-contribution note when there is one.
const authorsOf = (p) => {
  const note = (p.others.match(/\(([^)]*)\)\s*$/) || [])[1];
  const names = p.others.replace(/\([^)]*\)\s*$/, "").split(",").map((n) => n.trim()).filter(Boolean);
  const head = names.length > 2 ? `${p.me}, ${names[0]} and ${names.length - 1} more` : [p.me, ...names].join(", ");
  return note ? `${head} (${note})` : head;
};
// YouTube links become in-place players: the video id and, when the link has one, its playlist.
const youtube = (href) => { const u = new URL(href); const id = u.searchParams.get("v"); return id ? { id, list: u.searchParams.get("list") ?? "" } : null; };
const PLAY = `<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10l8-5z" fill="currentColor"></path></svg>`;
const paperCard = (p) => `<li id="paper-${p.id}"><button type="button" class="paper" data-paper="${p.id}" aria-expanded="false" aria-controls="panel-${p.id}">
<span class="thumb"><span class="book"><img class="under" src="img/page2-${p.id}.jpg" alt="" loading="lazy"><span class="leaf"><img src="img/page-${p.id}.jpg" alt="" loading="lazy"><span class="leaf-back"></span></span></span>${badge(p)}</span>
<span class="txt"><span class="mono meta">${h(p.year)}</span><span class="t">${h(p.short)}</span><span class="b">${h(p.line)}</span></span>
<span class="chev" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6l5 5 5-5"></path></svg></span>
</button>
<div class="panel" id="panel-${p.id}" inert><div class="panel-in"><div class="panel-box">
<div class="panel-media"><img class="panel-fig" src="img/fig-${p.id}.jpg" alt="${h(p.figAlt)}" loading="lazy"></div>
<div class="panel-side">
<p class="panel-head"><b>${h(p.headline[0])}</b>${h(p.headline[1])}</p>
<div class="pills">${p.links.map(([kind, label, href]) => { const k = kind.split(" · ")[0]; const v = /^Video/.test(k) && youtube(href); return v ? `<button type="button" class="pill play-btn" data-video="${v.id}" data-list="${v.list}" data-href="${h(href)}" aria-label="Play the video here">${PLAY}<span>Play ${h(k.toLowerCase())}</span></button>` : ext(href, `${h(k)} ↗`, "pill"); }).join("")}</div>
<p class="panel-meta">${h(p.title)}. <span>${h(authorsOf(p))}.</span> ${h(p.meta)}.</p>
</div>
</div></div></div>
</li>`;

const question = (q, i) => `<article class="card" style="--i:${i}" aria-labelledby="q-${i}">
<div class="card-tab"><span class="mono">0${i + 1} · ${h(q.label)}</span></div>
<div class="card-body">
<figure class="card-fig"><div class="frame"><img src="img/fig-${q.fig}.jpg" alt="${h(q.figAlt)}" loading="lazy"></div></figure>
<div class="card-text">
<h3 id="q-${i}">${h(q.q)}</h3>
<p>${h(q.answer)}</p>
<div class="chips">${q.papers.map((id) => `<button type="button" class="chip" data-open="${id}">${h(byId[id].short)} · ${h(byId[id].venue)} ${h(byId[id].year)}</button>`).join("")}</div>
</div>
</div>
</article>`;

const figure = readFileSync(join(HERE, "bench/figure.html"), "utf8");
const figureCss = readFileSync(join(HERE, "bench/figure.css"), "utf8");
const figureJs = readFileSync(join(HERE, "bench/figure.js"), "utf8");

const PAGE_JS = `
// The figure follows the page theme.
const root = document.documentElement;
const dark = matchMedia("(prefers-color-scheme: dark)");
const themed = [...document.querySelectorAll(".eb-theme")];
const apply = () => themed.forEach((el) => el.setAttribute("data-theme", root.getAttribute("data-theme") || (dark.matches ? "dark" : "light")));
apply();
dark.addEventListener("change", apply);
new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
// Papers open in place: one at a time; the question cards' buttons jump to their paper and open it.
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const figures = new Map();
const stopVideo = (panel) => {
  const media = panel.querySelector(".panel-media");
  if (figures.has(media)) media.replaceChildren(figures.get(media));
  const btn = panel.querySelector(".play-btn");
  if (btn) { btn.setAttribute("aria-pressed", "false"); btn.querySelector("span").textContent = btn.dataset.label; }
};
for (const btn of document.querySelectorAll(".play-btn")) {
  btn.dataset.label = btn.querySelector("span").textContent;
  btn.setAttribute("aria-pressed", "false");
  btn.addEventListener("click", () => {
    const panel = btn.closest(".panel");
    const media = panel.querySelector(".panel-media");
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
  const step = () => { scrollBy(0, el.getBoundingClientRect().top - top); if (performance.now() < end) requestAnimationFrame(step); };
  requestAnimationFrame(step);
};
for (const c of document.querySelectorAll(".paper[data-paper]")) c.addEventListener("click", () => { pin(c); openPaper(c.dataset.paper); });
for (const b of document.querySelectorAll("[data-open]")) b.addEventListener("click", () => {
  const card = document.querySelector('.paper[data-paper="' + b.dataset.open + '"]');
  if (card.getAttribute("aria-expanded") !== "true") openPaper(b.dataset.open);
  document.getElementById("paper-" + b.dataset.open).scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
});
// Copy the address.
const copy = document.querySelector("[data-copy]");
copy?.addEventListener("click", async () => {
  const text = copy.dataset.copy;
  try { await navigator.clipboard.writeText(text); copy.textContent = "Copied"; }
  catch { getSelection().selectAllChildren(document.querySelector(".mail span")); copy.textContent = "Selected"; }
  setTimeout(() => (copy.textContent = "Copy address"), 1800);
});
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Raul C. Sîmpetru</title>
<meta name="google-site-verification" content="VmtRNw8fHQ_VhBbs_c3irGke6hFKhQJFwGw5D7xUJl0">
<meta name="description" content="Neural interfaces that read what a hand is trying to do. Research, papers and software by Raul C. Sîmpetru.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Schibsted+Grotesk:wght@400;500;600;700;800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">
<style>${CSS}
${figureCss}</style>
</head>
<body>
<div class="wrap"><div class="inner">
<header class="bar">
<a class="name" href="#top">Raul C. Sîmpetru</a>
<nav aria-label="Sections"><a href="#questions">Research</a><a href="#papers">Papers</a><a href="#software">Software</a><a href="#people">Experience</a>${ext("https://raulsimpetru.github.io/uploads/resume.pdf", "CV", "cv")}<a href="#contact">Contact</a></nav>
</header>

<main id="top">
<div class="hero grid">
<div class="hero-text">
<h1>Neural interfaces for hand <em>control.</em></h1>
<p class="lede">I build neural interfaces that turn muscle activity into control of virtual hands, orthoses and prostheses.</p>
<div class="byline"><img src="img/portrait.jpg" alt="Raul C. Sîmpetru"><p class="wry">Self-described content creator for journals.</p></div>
</div>
<div class="hero-figure iso eb-theme" data-theme="light">${figure}</div>
</div>

<section id="questions" aria-labelledby="h-questions">
<div class="sec-head grid"><p class="mono label">Featured work</p><h2 id="h-questions">Research areas.</h2></div>
<div class="stack">${QUESTIONS.map(question).join("\n")}</div>
</section>

<section id="papers" aria-labelledby="h-papers">
<div class="sec-head grid"><p class="mono label">Papers</p><h2 id="h-papers">Selected publications.</h2></div>
${ACTS.map((a, i) => `<div class="act grid"><div class="act-head"><h3>${h(a.title)}</h3></div>
<ol class="act-list">${PAPERS.filter((p) => p.act === i).map(paperCard).join("")}</ol></div>`).join("\n")}
<div class="grid"><details class="cast"><summary>Twelve more, as co-author</summary><ul>${CAST.map(([y, t, who, href]) => `<li><span>${h(y)}</span><span>${href ? ext(href, h(t)) : h(t)}<em>${h(who)}</em></span></li>`).join("")}</ul></details></div>
</section>

<section id="software" aria-labelledby="h-software">
<div class="sec-head grid"><p class="mono label">Software</p><h2 id="h-software">Research software.</h2></div>
<div class="sw grid">${SOFTWARE.map((s) => `<article class="${s.rule}"><h3 class="logo">${ext(s.links[0][1], `<img src="${s.logo}" alt="${h(s.name)}">`)}</h3><p>${h(s.text)}</p><p class="role">${h(s.role)}${s.install ? ` · <code>${h(s.install)}</code>` : ""}</p><div class="links">${s.links.map(([l, href]) => ext(href, `${h(l)} ↗`)).join("")}</div></article>`).join("")}</div>
</section>

<section id="people" aria-labelledby="h-people">
<div class="sec-head grid"><p class="mono label">Experience</p><h2 id="h-people">Research, teaching, talks.</h2><p class="intro">${ext("https://raulsimpetru.github.io/uploads/resume.pdf", "The full CV (PDF) ↗", "cv-link")}</p></div>
<div class="people grid">
<div class="stage-col"><figure class="stage-photo"><img src="img/speaker-wide.jpg" alt="Raul C. Sîmpetru at a lectern at Georgian Technical University, presenting MyoGestic" loading="lazy"><figcaption>${ext("https://www.nsquared.tf.fau.de/2026/10/12/georgian-and-international-early-career-researchers-deliver-public-lectures-on-biomedical-engineering-at-georgian-technical-university/", "Georgian Technical University, Tbilisi, 2026 ↗")}</figcaption></figure><figure class="stage-photo"><img src="img/event-isek2026.jpg" alt="Raul C. Sîmpetru at the lectern at ISEK 2026, presenting a slide titled The neural manifold" loading="lazy" style="aspect-ratio:4/3;object-position:30% 50%"><figcaption>${ext("https://www.jyu.fi/en/events/isek-2026-congress", "ISEK 2026, Jyväskylä, June 2026 ↗")}</figcaption></figure></div>
<div class="facts-list"><dl>${FACTS.map(([k, items]) => `<div><dt class="mono label">${h(k)}</dt><dd><ul>${items.map(([main, sub, href]) => `<li><b>${h(main)}</b><span>${href ? ext(href, `${h(sub)} ↗`) : h(sub)}</span></li>`).join("")}</ul></dd></div>`).join("")}</dl></div>
</div>
</section>
</main>
</div></div>

<div class="band" id="contact"><div class="wrap"><div class="inner">
<h2>Contact</h2>
<div class="mail"><span>raul.simpetru@fau.de</span><button type="button" data-copy="raul.simpetru@fau.de">Copy address</button></div>
<nav aria-label="Elsewhere">${ext("https://raulsimpetru.github.io/uploads/resume.pdf", "CV")}${ext("https://scholar.google.com/citations?user=jAHFWF8AAAAJ", "Google Scholar")}${ext("https://orcid.org/0000-0003-0455-0168", "ORCID")}${ext("https://github.com/RaulSimpetru", "GitHub")}${ext("https://www.linkedin.com/in/raulsimpetru/", "LinkedIn")}</nav>
<footer>© 2026 Raul C. Sîmpetru</footer>
</div></div></div>

<script>${PAGE_JS}</script>
<script type="module">${figureJs.replace(/<\/(script)/gi, "<\\/$1")}</script>
</body>
</html>
`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "bench"), { recursive: true });
writeFileSync(join(OUT, "index.html"), html);
cpSync(join(HERE, "img"), join(OUT, "img"), { recursive: true });
for (const f of ["mesh.txt", "views.txt"]) cpSync(join(HERE, "bench", f), join(OUT, "bench", f)); // the rest is inlined above
cpSync(join(HERE, "../static"), OUT, { recursive: true }); // uploads/resume.pdf keeps its old URL
console.log(`public/index.html · ${(html.length / 1024).toFixed(0)} KB`);
