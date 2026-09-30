const { getSchoolColors } = require("./school-colors");

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function firstName(name) {
  return String(name || "").trim().split(/\s+/)[0] || "";
}
function lastName(name) {
  const parts = String(name || "").trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}
function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const letters = parts.map((p) => p[0].toUpperCase()).join("").slice(0, 3);
  return letters || "EH";
}

const SEASONS = [
  { key: "Freshman", label: "Freshman" },
  { key: "Sophomore", label: "Sophomore" },
  { key: "Junior", label: "Junior" },
  { key: "Senior", label: "Senior" },
];
const STAT_COLS = ["PPG", "Rebounds", "Steals", "Blocks", "Assists", "TotalPoints"];

function seasonRows(p) {
  return SEASONS.map((s) => {
    const cells = STAT_COLS.map((c) => p[`stat${s.key}${c}`] || "");
    return { label: s.label, cells, hasAny: cells.some(Boolean) };
  }).filter((r) => r.hasAny);
}

function quickStats(p) {
  const rows = seasonRows(p);
  const latest = rows[rows.length - 1];
  if (!latest) return [];
  const [ppg, rebounds, steals, blocks, assists] = latest.cells;
  return [
    { value: ppg, label: "PPG" },
    { value: rebounds, label: "Rebounds" },
    { value: steals, label: "Steals" },
    { value: assists, label: "Assists" },
    { value: blocks, label: "Blocks" },
  ].filter((s) => s.value);
}

function seasonCallout(p) {
  const rows = seasonRows(p);
  const latest = rows[rows.length - 1];
  if (!latest) return null;
  const [, rebounds, steals, , , totalPoints] = latest.cells;
  const items = [
    totalPoints ? { value: totalPoints, label: `Total Points, ${esc(latest.label)} Season` } : null,
    rebounds ? { value: rebounds, label: "Rebounds Per Game" } : null,
    steals ? { value: steals, label: "Steals Per Game" } : null,
  ].filter(Boolean);
  return items.length ? items : null;
}

function offerRows(p) {
  return String(p.currentOffers || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function accoladeRows(p) {
  return String(p.message || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function youTubeEmbed(url) {
  const m = String(url || "").match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function linkRow(url, label) {
  if (!url) return "";
  return `<a class="link-row" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} <svg viewBox="0 0 24 24"><use href="#extIcon"></use></svg></a>`;
}

function renderIlluminationSite(player, feed) {
  const colors = getSchoolColors(player.highSchool);
  const name = player.playerName || "";
  const fn = firstName(name);
  const ln = lastName(name);
  const school = player.highSchool || "";
  const gradYear = player.gradYear || "";
  const poster = (feed && feed.poster) || (feed && feed.portrait) || "";
  const portrait = (feed && feed.portrait) || poster;
  const heroPhoto = poster || portrait;
  const galleryPhotos = ((feed && feed.photos) || []).slice(0, 15);
  const galleryUrls = galleryPhotos.map((p) => p.large || p.src).filter(Boolean);
  const onCourtPhoto = galleryUrls.find((u) => u !== heroPhoto) || heroPhoto;
  const recruitPhoto = galleryUrls.slice().reverse().find((u) => u !== heroPhoto && u !== onCourtPhoto) || heroPhoto;
  const filmClips = ((feed && feed.film) || []).slice(0, 4);
  const kit = (feed && feed.kit) || [];

  const stats = quickStats(player);
  const callout = seasonCallout(player);
  const rows = seasonRows(player);
  const offers = offerRows(player);
  const accolades = accoladeRows(player);
  const tags = [player.tag1, player.tag2, player.tag3].filter(Boolean);
  if (tags.length === 0 && player.position) tags.push(player.position);
  const badgeFront = player.jerseyNumber || initials(name);
  const badgeBack = initials(name);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(name)}${player.jerseyNumber ? ` #${esc(player.jerseyNumber)}` : ""} | ${esc(player.position || "Recruiting Profile")}${gradYear ? `, Class of ${esc(gradYear)}` : ""}</title>
<meta name="description" content="Recruiting profile for ${esc(name)}${gradYear ? `, ${esc(gradYear)}` : ""} ${esc(player.position || "player")} at ${esc(school)}. Vitals, season stats, highlight film, and contact information.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": ${JSON.stringify(name)},
  "jobTitle": "Basketball ${esc(player.position || "Player")}",
  "affiliation": ${JSON.stringify(school)}
}
</script>

<style>
  :root{
    --black:#0a0a0c; --black-deep:#050506; --panel:#141417; --panel-2:#1b1b1f;
    --line:rgba(255,255,255,0.12); --white:#FFFFFF; --dim:rgba(255,255,255,0.66);
    --red:${colors.accent}; --red-deep:${colors.accentDark}; --ball:#e8863a;
    --eh-teal:#00F5D4; --eh-magenta:#FF2E93;
    color-scheme: dark;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;}
  body{background:var(--black);color:var(--white);font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
  .side-pad{padding-left:max(20px, env(safe-area-inset-left,0px));padding-right:max(20px, env(safe-area-inset-right,0px));}
  img{max-width:100%;display:block;}
  [hidden]{display:none!important;}
  a{color:inherit;text-decoration:none;}
  .display{font-family:'Anton',sans-serif;font-weight:400;line-height:0.98;text-transform:uppercase;letter-spacing:0.01em;text-wrap:balance;}
  .mono{font-family:'IBM Plex Mono',ui-monospace,monospace;}
  .wrap{max-width:1160px;margin:0 auto;}
  .rule{height:1px;background:var(--line);width:100%;}
  .eyebrow{font-family:'IBM Plex Mono',monospace;color:var(--red);font-weight:600;font-size:12.5px;letter-spacing:0.16em;text-transform:uppercase;}
  :root{ scroll-behavior:smooth; }
  @media (prefers-reduced-motion:reduce){ :root{scroll-behavior:auto;} }
  .logo-icon{display:block;width:100%;height:100%;}
  .progress{position:fixed;top:0;left:0;height:3px;width:0%;background:linear-gradient(90deg,var(--red),var(--ball));z-index:80;transition:width .08s linear;}
  nav{position:sticky;top:0;z-index:60;background:rgba(5,5,6,0.9);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line);}
  .nav-inner{max-width:1160px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:64px;gap:18px;}
  .brand{font-family:'Anton',sans-serif;font-size:19px;letter-spacing:0.01em;text-transform:uppercase;color:var(--white);white-space:nowrap;}
  .brand .num{color:var(--red);}
  .nav-links{display:flex;gap:24px;overflow-x:auto;scrollbar-width:none;}
  .nav-links::-webkit-scrollbar{display:none;}
  .nav-links a{color:var(--dim);transition:color .2s;white-space:nowrap;text-transform:uppercase;font-size:12px;letter-spacing:0.06em;font-weight:700;}
  .nav-links a:hover,.nav-links a:focus-visible{color:var(--white);}
  @media (max-width:760px){ .nav-links{display:none;} }
  .btn{display:inline-block;padding:15px 26px;font-weight:700;font-size:13px;border-radius:4px;font-family:'IBM Plex Mono',monospace;letter-spacing:0.05em;text-transform:uppercase;border:2px solid transparent;transition:all .2s;white-space:nowrap;cursor:pointer;}
  .btn.primary{background:var(--red);color:var(--white);}
  .btn.primary:hover{background:var(--red-deep);transform:translateY(-1px);}
  .btn.outline{border-color:rgba(255,255,255,0.35);color:var(--white);background:transparent;}
  .btn.outline:hover{border-color:var(--white);background:rgba(255,255,255,0.08);}
  .hero-photo{width:100%;aspect-ratio:3/4;overflow:hidden;background:#000;}
  .hero-photo img{width:100%;height:100%;object-fit:cover;object-position:center top;}
  @media (min-width:760px){ .hero-photo{aspect-ratio:16/8;} }
  .hero-body{padding:36px 0 0;}
  .hero-body h1{font-size:clamp(42px,8vw,84px);color:var(--white);margin:12px 0 0;}
  .hero-body h1 .num{color:var(--red);}
  .hero-sub{margin:12px 0 0;font-size:17px;color:var(--dim);}
  .hero-tags{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px;}
  .tag{border:1.5px solid var(--red);color:var(--red);border-radius:4px;padding:9px 16px;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;font-family:'IBM Plex Mono',monospace;}
  .hero-cta{margin-top:28px;display:flex;gap:14px;flex-wrap:wrap;align-items:center;}
  .hero-ball-holder{width:56px;height:56px;flex-shrink:0;}
  #heroBall{width:100%;height:100%;display:block;}
  .quick-stats{display:grid;grid-template-columns:repeat(3,1fr);margin-top:40px;border-top:1px solid var(--line);}
  .quick-stat{text-align:center;padding:30px 10px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);}
  .quick-stat:nth-child(3n){border-right:none;}
  .quick-stat .num{font-family:'Anton',sans-serif;font-size:clamp(30px,5vw,44px);color:var(--white);line-height:1;}
  .quick-stat .label{margin-top:8px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;color:var(--dim);}
  section{padding:70px 0;position:relative;z-index:2;}
  .section-head{margin-bottom:36px;max-width:64ch;}
  .section-head .display{font-size:clamp(28px,4.2vw,46px);color:var(--white);}
  .section-head p{color:var(--dim);margin-top:10px;font-size:15px;line-height:1.6;}
  [data-reveal]{opacity:1;transform:none;transition:opacity .7s ease, transform .7s cubic-bezier(.2,.7,.2,1);}
  [data-reveal].pending{opacity:0;transform:translateY(28px);}
  @media (prefers-reduced-motion:reduce){ [data-reveal].pending{opacity:1;transform:none;} }
  [data-tilt]{transform-style:preserve-3d;will-change:transform;transition:transform .35s cubic-bezier(.2,.7,.2,1);}
  .about-copy p{color:var(--dim);font-size:16px;line-height:1.8;margin:0 0 16px;}
  .vitals-table{border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-top:34px;}
  .vitals-head{background:var(--red);color:var(--white);font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:0.03em;padding:12px 18px;text-transform:uppercase;}
  .vitals-row{display:flex;justify-content:space-between;padding:14px 18px;border-top:1px solid var(--line);font-size:14.5px;}
  .vitals-row span:first-child{color:var(--dim);}
  .vitals-row span:last-child{font-weight:700;color:var(--white);}
  .accolade-list{display:flex;flex-direction:column;gap:12px;}
  .accolade-item{display:flex;align-items:flex-start;gap:14px;border:1px solid var(--line);border-radius:10px;padding:16px 18px;font-size:15px;font-weight:600;color:var(--white);line-height:1.5;}
  .accolade-mark{color:var(--red);font-size:17px;line-height:1.4;flex-shrink:0;}
  .feature-card{border:1px solid var(--line);border-radius:12px;padding:30px 28px;margin-bottom:20px;}
  .feature-card h3{font-size:clamp(26px,4vw,36px);margin:8px 0 12px;color:var(--white);}
  .feature-card p{color:var(--dim);font-size:15.5px;line-height:1.7;margin:0;max-width:60ch;}
  .full-photo{width:100%;aspect-ratio:16/10;overflow:hidden;border-radius:12px;margin-top:30px;border:1px solid var(--line);}
  .full-photo img{width:100%;height:100%;object-fit:cover;}
  .stat-callout{border-radius:14px;padding:36px 30px;background:linear-gradient(165deg,var(--red),var(--red-deep));}
  .stat-callout .big-stat{padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.25);}
  .stat-callout .big-stat:last-child{border-bottom:none;}
  .stat-callout .big-num{font-family:'Anton',sans-serif;font-size:clamp(34px,6vw,54px);color:var(--white);line-height:1;}
  .stat-callout .big-label{margin-top:6px;font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.85);}
  .stats-table{width:100%;border-collapse:collapse;margin-top:40px;font-size:14px;}
  .stats-table th{text-align:left;font-family:'Anton',sans-serif;font-weight:400;letter-spacing:0.02em;text-transform:uppercase;color:var(--dim);font-size:12px;padding:12px 10px;border-bottom:1px solid var(--line);}
  .stats-table td{padding:14px 10px;border-bottom:1px solid var(--line);font-weight:600;}
  .stats-table td:first-child, .stats-table th:first-child{font-weight:700;color:var(--white);}
  .stats-table{display:block;overflow-x:auto;white-space:nowrap;}
  .video-frame{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:10px;overflow:hidden;border:1px solid var(--line);}
  .video-frame iframe,.video-frame video{position:absolute;inset:0;width:100%;height:100%;border:0;object-fit:cover;}
  .video-block{margin-bottom:36px;}
  .photo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
  .photo-grid a{border-radius:10px;overflow:hidden;border:1px solid var(--line);display:block;}
  .photo-grid img{aspect-ratio:3/4;object-fit:cover;transition:transform .5s ease;}
  .photo-grid a:hover img{transform:scale(1.06);}
  @media (max-width:860px){ .photo-grid{grid-template-columns:repeat(3,1fr);} }
  @media (max-width:560px){ .photo-grid{grid-template-columns:repeat(2,1fr);} }
  .recruit-copy p{color:var(--dim);font-size:16px;line-height:1.8;margin:0 0 18px;max-width:70ch;}
  .offer-list{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 10px;}
  .offer-tag{border:1px solid var(--red);color:var(--white);background:rgba(227,30,36,0.1);border-radius:999px;padding:9px 16px;font-size:13px;font-weight:700;}
  .ncaa-id{font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:var(--dim);margin-top:14px;}
  .recruit-photo{max-width:340px;border-radius:12px;overflow:hidden;border:1px solid var(--line);margin-top:34px;}
  .recruit-photo img{aspect-ratio:4/5;object-fit:cover;}
  .recruit-caption{margin-top:10px;color:var(--dim);font-size:13px;font-family:'IBM Plex Mono',monospace;letter-spacing:0.04em;text-transform:uppercase;}
  .contact-card{border:1px solid var(--line);border-radius:12px;padding:30px 28px;max-width:520px;}
  .contact-block{padding:14px 0;}
  .contact-block + .contact-block{border-top:1px solid var(--line);}
  .contact-block .who{font-weight:700;color:var(--white);font-size:14.5px;margin-bottom:8px;}
  .contact-block .row{display:flex;justify-content:space-between;gap:12px;font-size:14px;color:var(--dim);padding:4px 0;}
  .contact-block .row span:last-child{color:var(--white);font-weight:600;}
  .link-rows{display:flex;flex-direction:column;gap:10px;}
  .link-row{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--line);border-radius:10px;padding:16px 20px;font-weight:700;font-size:15px;transition:border-color .2s, background .2s;}
  .link-row:hover{border-color:var(--red);background:rgba(227,30,36,0.06);}
  .link-row svg{width:16px;height:16px;fill:var(--dim);}
  footer{padding:50px 0 40px;border-top:1px solid var(--line);}
  .footer-eh-credit{display:flex;align-items:center;gap:14px;padding:18px 20px;margin-bottom:24px;border:1px solid rgba(0,245,212,0.25);border-radius:12px;background:rgba(0,245,212,0.05);}
  .footer-eh-credit .logo-icon-wrap{width:34px;height:34px;flex-shrink:0;}
  .eh-credit-title{font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:0.08em;text-transform:uppercase;color:var(--eh-teal);font-weight:700;}
  .eh-credit-sub{color:var(--dim);font-size:13px;margin-top:4px;}
  @media (max-width:560px){ .footer-eh-credit{flex-direction:column;text-align:center;} }
  .foot-bottom{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;color:var(--dim);font-size:12.5px;}
  .scroll-badge{position:fixed;right:22px;bottom:22px;width:60px;height:60px;perspective:700px;z-index:70;opacity:0;pointer-events:none;transition:opacity .4s ease;border:none;background:transparent;padding:0;cursor:pointer;}
  .scroll-badge.visible{opacity:1;pointer-events:auto;}
  .coin{width:100%;height:100%;position:relative;transform-style:preserve-3d;}
  .coin-face{position:absolute;inset:0;border-radius:50%;backface-visibility:hidden;display:flex;align-items:center;justify-content:center;background:var(--panel);box-shadow:0 10px 28px rgba(0,0,0,0.5), 0 0 0 2px var(--red) inset;font-family:'Anton',sans-serif;font-size:20px;color:var(--white);}
  .coin-face.back{transform:rotateY(180deg);box-shadow:0 10px 28px rgba(0,0,0,0.5), 0 0 0 2px var(--ball) inset;}
  @media (max-width:640px){ .scroll-badge{width:50px;height:50px;right:14px;bottom:14px;} }
  :focus-visible{outline:2px solid var(--red);outline-offset:2px;}
</style>
</head>
<body>

<svg style="display:none" aria-hidden="true">
  <symbol id="extIcon" viewBox="0 0 24 24"><path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z"/></symbol>
  <symbol id="ehLogo" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="88" fill="none" stroke="#00F5D4" stroke-width="9"/>
    <path d="M16 66 Q100 18 184 66" fill="none" stroke="#00F5D4" stroke-width="9" stroke-linecap="round"/>
    <path d="M20 138 Q100 188 180 132" fill="none" stroke="#00F5D4" stroke-width="9" stroke-linecap="round"/>
    <path d="M64 44 Q40 100 64 156 Q124 132 124 100 Q124 68 64 44 Z" fill="none" stroke="#FF2E93" stroke-width="9" stroke-linejoin="round"/>
    <line x1="56" y1="86" x2="120" y2="86" stroke="#FF2E93" stroke-width="7" stroke-linecap="round"/>
    <line x1="56" y1="100" x2="120" y2="100" stroke="#FF2E93" stroke-width="7" stroke-linecap="round"/>
    <line x1="56" y1="114" x2="120" y2="114" stroke="#FF2E93" stroke-width="7" stroke-linecap="round"/>
    <line x1="130" y1="30" x2="130" y2="170" stroke="#FF2E93" stroke-width="9" stroke-linecap="round"/>
    <line x1="156" y1="44" x2="156" y2="156" stroke="#FF2E93" stroke-width="9" stroke-linecap="round"/>
    <line x1="130" y1="100" x2="184" y2="100" stroke="#FF2E93" stroke-width="7" stroke-linecap="round"/>
  </symbol>
</svg>

<div class="progress" id="progress"></div>

<nav class="side-pad">
  <div class="nav-inner">
    <a href="#top" class="brand">${esc(name).toUpperCase()}${player.jerseyNumber ? ` <span class="num">#${esc(player.jerseyNumber)}</span>` : ""}</a>
    <div class="nav-links">
      <a href="#about">About</a>
      ${accolades.length ? '<a href="#accolades">Accolades</a>' : ""}
      ${rows.length ? '<a href="#stats">Stats</a>' : ""}
      ${filmClips.length ? '<a href="#highlights">Highlights</a>' : ""}
      <a href="#recruiting">Recruiting</a>
      <a href="#contact">Contact</a>
    </div>
  </div>
</nav>

<div id="top">
  ${heroPhoto ? `<div class="hero-photo"><img src="${esc(heroPhoto)}" alt="${esc(name)}" loading="eager"></div>` : ""}
  <div class="wrap side-pad hero-body">
    <div class="eyebrow">${esc(school)}${gradYear ? ` &bull; Class Of ${esc(gradYear)}` : ""}</div>
    <h1 class="display">${esc(fn).toUpperCase()}${ln ? `<br>${esc(ln).toUpperCase()}` : ""} ${player.jerseyNumber ? `<span class="num">${esc(player.jerseyNumber)}</span>` : ""}</h1>
    <p class="hero-sub">${[player.position, school].filter(Boolean).map(esc).join(", ")}.</p>
    ${tags.length ? `<div class="hero-tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
    <div class="hero-cta">
      ${filmClips.length ? '<a class="btn primary" href="#highlights">Watch Highlights</a>' : ""}
      <a class="btn outline" href="#follow">All Links</a>
      <div class="hero-ball-holder"><canvas id="heroBall" aria-hidden="true"></canvas></div>
    </div>
    ${stats.length ? `<div class="quick-stats">${stats.map((s) => `<div class="quick-stat"><div class="num">${esc(s.value)}</div><div class="label">${esc(s.label)}</div></div>`).join("")}</div>` : ""}
  </div>
</div>

<section id="about" class="side-pad">
  <div class="wrap">
    <div class="section-head" data-reveal><div class="display">About ${esc(fn)}</div></div>
    <div class="about-copy" data-reveal>
      ${player.aboutParagraph1 ? `<p>${esc(player.aboutParagraph1)}</p>` : ""}
      ${player.aboutParagraph2 ? `<p>${esc(player.aboutParagraph2)}</p>` : ""}
      ${!player.aboutParagraph1 && !player.aboutParagraph2 ? `<p>${esc(fn)} plays ${esc(player.position || "basketball")} for ${esc(school)}, class of ${esc(gradYear)}.</p>` : ""}
    </div>
    <div class="vitals-table" data-reveal>
      <div class="vitals-head">Vitals</div>
      ${[["Height", player.height], ["Weight", player.weight], ["Position", player.position], ["School", school], ["Wingspan", player.wingspan], ["Standing Vertical", player.standingVertical], ["Shoe Size", player.shoeSize], ["GPA", player.gpa], ["Graduation Year", gradYear]]
        .filter(([, v]) => v)
        .map(([k, v]) => `<div class="vitals-row"><span>${esc(k)}</span><span>${esc(v)}</span></div>`)
        .join("")}
    </div>
  </div>
</section>

${accolades.length ? `<section id="accolades" class="side-pad" style="padding-top:0;">
  <div class="wrap">
    <div class="section-head" data-reveal><div class="display">Accolades</div></div>
    <div class="accolade-list" data-reveal>
      ${accolades.map((a) => `<div class="accolade-item"><span class="accolade-mark">&#9733;</span><span>${esc(a)}</span></div>`).join("")}
    </div>
  </div>
</section>` : ""}

${player.skill1Title || player.skill2Title || onCourtPhoto ? `<section class="side-pad" style="padding-top:0;">
  <div class="wrap">
    <div class="section-head" data-reveal><div class="display">On The Court</div><p>What defines her game.</p></div>
    ${player.skill1Title ? `<div class="feature-card" data-reveal data-tilt><div class="eyebrow">Identity</div><h3 class="display">${esc(player.skill1Title)}</h3><p>${esc(player.skill1Body)}</p></div>` : ""}
    ${player.skill2Title ? `<div class="feature-card" data-reveal data-tilt><div class="eyebrow">Signature</div><h3 class="display">${esc(player.skill2Title)}</h3><p>${esc(player.skill2Body)}</p></div>` : ""}
    ${onCourtPhoto ? `<div class="full-photo" data-reveal><img src="${esc(onCourtPhoto)}" alt="${esc(name)}" loading="lazy"></div>` : ""}
  </div>
</section>` : ""}

${rows.length ? `<section id="stats" class="side-pad">
  <div class="wrap">
    <div class="section-head" data-reveal><div class="display">Season Stats</div><p>Per game averages by season.</p></div>
    ${callout ? `<div class="stat-callout" data-reveal data-tilt>${callout.map((c) => `<div class="big-stat"><div class="big-num">${esc(c.value)}</div><div class="big-label">${esc(c.label)}</div></div>`).join("")}</div>` : ""}
    <table class="stats-table" data-reveal>
      <thead><tr><th>Season</th><th>PPG</th><th>Rebounds</th><th>Steals</th><th>Blocks</th><th>Assists</th><th>PPS</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${esc(r.label)}</td>${r.cells.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
    <p style="margin-top:14px;color:var(--dim);font-size:13px;">PPS is total points scored that season.</p>
  </div>
</section>` : ""}

${filmClips.length ? `<section id="highlights" class="side-pad">
  <div class="wrap">
    <div class="section-head" data-reveal><div class="display">Highlight Film</div><p>Playable right here, no need to leave the page.</p></div>
    ${filmClips.map((clip) => {
      const embed = youTubeEmbed(clip.url);
      const frame = embed
        ? `<iframe src="${esc(embed)}" title="${esc(name)} highlight film" allow="autoplay; encrypted-media" allowfullscreen loading="lazy"></iframe>`
        : `<video controls playsinline ${poster ? `poster="${esc(poster)}"` : ""}><source src="${esc(clip.url)}" type="${esc(clip.type)}"></video>`;
      return `<div class="video-block" data-reveal><div class="video-frame">${frame}</div></div>`;
    }).join("")}
  </div>
</section>` : ""}

${galleryUrls.length ? `<section class="side-pad">
  <div class="wrap">
    <div class="section-head" data-reveal><div class="display">More Photos</div><p>A few more looks from this season.</p></div>
    <div class="photo-grid">
      ${galleryUrls.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener" data-reveal><img src="${esc(u)}" alt="${esc(name)}" loading="lazy"></a>`).join("")}
    </div>
  </div>
</section>` : ""}

<section id="recruiting" class="side-pad">
  <div class="wrap">
    <div class="section-head" data-reveal><div class="display">Recruiting</div></div>
    <div class="recruit-copy" data-reveal>
      <p>${esc(name)} is a ${gradYear ? `${esc(gradYear)} ` : ""}${esc(player.position || "player")} at ${esc(school)}.</p>
      ${offers.length ? `<div class="eyebrow">Current Offers</div><div class="offer-list">${offers.map((o) => `<span class="offer-tag">${esc(o)}</span>`).join("")}</div>` : ""}
      ${player.ncaaId ? `<div class="ncaa-id">NCAA ID# ${esc(player.ncaaId)}</div>` : ""}
    </div>
    ${recruitPhoto ? `<div class="recruit-photo" data-reveal><img src="${esc(recruitPhoto)}" alt="${esc(name)}" loading="lazy"></div><div class="recruit-caption">${esc(school)}</div>` : ""}
  </div>
</section>

<section id="contact" class="side-pad">
  <div class="wrap">
    <div class="section-head" data-reveal><div class="display">Contact</div></div>
    <div class="contact-card" data-reveal data-tilt>
      ${player.playerPhone || player.playerEmail ? `<div class="contact-block">
        ${player.playerPhone ? `<div class="row"><span>Player Phone</span><span>${esc(player.playerPhone)}</span></div>` : ""}
        ${player.playerEmail ? `<div class="row"><span>Player Email</span><span>${esc(player.playerEmail)}</span></div>` : ""}
      </div>` : ""}
      ${player.guardianName || player.guardianPhone ? `<div class="contact-block">
        <div class="who">Parent Contact${player.guardianName ? `, ${esc(player.guardianName)}` : ""}</div>
        ${player.guardianPhone ? `<div class="row"><span>Phone</span><span>${esc(player.guardianPhone)}</span></div>` : ""}
      </div>` : ""}
      ${player.coachName || player.coachPhone || player.coachEmail ? `<div class="contact-block">
        <div class="who">Coach Contact${player.coachName ? `, ${esc(player.coachName)}` : ""}</div>
        ${player.coachPhone ? `<div class="row"><span>Phone</span><span>${esc(player.coachPhone)}</span></div>` : ""}
        ${player.coachEmail ? `<div class="row"><span>Email</span><span>${esc(player.coachEmail)}</span></div>` : ""}
      </div>` : ""}
    </div>
  </div>
</section>

<section id="follow" class="side-pad" style="padding-top:0;">
  <div class="wrap">
    <div class="section-head" data-reveal><div class="display">Follow Along And Watch More Film</div></div>
    <div class="link-rows" data-reveal>
      ${linkRow(player.instagram, "Instagram")}
      ${linkRow(player.twitter, "X, Twitter")}
      ${linkRow(player.youtube, "YouTube")}
      ${linkRow(player.fieldlevel, "Field Level")}
      ${linkRow(player.hudl, "Hudl")}
      ${linkRow(player.maxpreps, "Max Preps")}
      ${linkRow(player.prepgirlshoops, "Prep Girl Hoops")}
      ${kit.map((k) => linkRow(k.download || k.url, k.title || "Marketing Kit")).join("")}
      ${player.playerEmail ? `<a class="link-row" href="mailto:${esc(player.playerEmail)}">Email ${esc(fn)} <svg viewBox="0 0 24 24"><use href="#extIcon"></use></svg></a>` : ""}
    </div>
  </div>
</section>

<section id="news" style="display:none;padding-top:0;" class="side-pad" data-news-section>
  <div class="wrap">
    <div class="section-head"><div class="display">Latest News</div></div>
    <div id="newsFeed" style="display:grid;gap:16px;"></div>
  </div>
</section>
<script>
(function(){
  fetch('/player-articles?slug=${esc(player.slug)}')
    .then(function(r){ return r.json(); })
    .then(function(res){
      var articles = res.articles || [];
      if(articles.length === 0) return;
      var section = document.querySelector('[data-news-section]');
      var feed = document.getElementById('newsFeed');
      feed.innerHTML = articles.map(function(a){
        var paras = String(a.body || '').split(/\\n\\n+/).map(function(p){
          return '<p style="margin-bottom:10px;line-height:1.5;">' + p.replace(/</g,'&lt;') + '</p>';
        }).join('');
        return '<div style="border:1px solid rgba(255,255,255,0.12);padding:20px 22px;border-radius:10px;">' +
          '<h4 style="margin-bottom:10px;">' + String(a.headline || '').replace(/</g,'&lt;') + '</h4>' + paras +
        '</div>';
      }).join('');
      section.style.display = '';
    })
    .catch(function(){});
})();
</script>

<footer class="side-pad">
  <div class="wrap">
    <div class="footer-eh-credit">
      <span class="logo-icon-wrap"><svg class="logo-icon" viewBox="0 0 200 200"><use href="#ehLogo"></use></svg></span>
      <div>
        <div class="eh-credit-title">Elevate Her Illumination Profile</div>
        <div class="eh-credit-sub">A player website, professional photos, and season film, built by Elevate Her.</div>
      </div>
    </div>
    <div class="rule"></div>
    <div class="foot-bottom" style="margin-top:20px;">
      <div>&copy; ${new Date().getFullYear()} ${esc(name)}. All rights reserved.</div>
      <div class="mono">${esc(player.position || "Player")}${player.jerseyNumber ? ` No ${esc(player.jerseyNumber)}` : ""}</div>
    </div>
  </div>
</footer>

<button class="scroll-badge" id="scrollBadge" type="button" aria-label="Scroll to the next section">
  <div class="coin" id="badgeCoin">
    <div class="coin-face front">${esc(badgeFront)}</div>
    <div class="coin-face back">${esc(badgeBack)}</div>
  </div>
</button>

<script>
(function(){
  "use strict";
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var progress = document.getElementById('progress');
  function onScroll(){
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    if(progress) progress.style.width = pct + '%';
  }
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if(!reduceMotion && 'IntersectionObserver' in window){
    revealEls.forEach(function(el){ el.classList.add('pending'); });
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.remove('pending');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.15, rootMargin:'0px 0px -8% 0px'});
    revealEls.forEach(function(el){ io.observe(el); });
  }

  if(!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches){
    var tiltEls = Array.prototype.slice.call(document.querySelectorAll('[data-tilt]'));
    tiltEls.forEach(function(el){
      var raf = null, rect = null;
      function move(e){
        if(!rect) rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rx = (0.5 - py) * 6;
        var ry = (px - 0.5) * 7;
        if(raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function(){
          el.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(0)';
        });
      }
      function reset(){ rect = null; el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'; }
      el.addEventListener('pointerenter', function(){ rect = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', reset);
    });
  }

  var badge = document.getElementById('scrollBadge');
  var badgeCoin = document.getElementById('badgeCoin');
  var heroEl = document.getElementById('top');
  var badgeAngle = 0, lastScrollY = window.scrollY;

  if(badge && badgeCoin){
    if('IntersectionObserver' in window && heroEl){
      var badgeIo = new IntersectionObserver(function(entries){
        var heroShown = entries[0].isIntersecting;
        badge.classList.toggle('visible', !heroShown);
      }, {threshold:0.1});
      badgeIo.observe(heroEl);
    } else {
      badge.classList.add('visible');
    }

    function updateBadgeSpin(){
      var y = window.scrollY;
      var delta = y - lastScrollY;
      lastScrollY = y;
      badgeAngle += delta * 0.35 + (reduceMotion ? 0 : 0.12);
      badgeCoin.style.transform = 'rotateY(' + badgeAngle.toFixed(1) + 'deg)';
    }
    document.addEventListener('scroll', updateBadgeSpin, {passive:true});

    if(!reduceMotion){
      (function idleSpin(){
        badgeAngle += 0.12;
        badgeCoin.style.transform = 'rotateY(' + badgeAngle.toFixed(1) + 'deg)';
        requestAnimationFrame(idleSpin);
      })();
    }

    var jumpTargets = Array.prototype.slice.call(document.querySelectorAll('section[id], footer'));
    badge.addEventListener('click', function(){
      var y = window.scrollY + 80;
      var next = jumpTargets.find(function(el){ return el.offsetTop > y; });
      if(next){
        next.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block:'start'});
      } else {
        window.scrollTo({top:0, behavior: reduceMotion ? 'auto' : 'smooth'});
      }
    });
  }

  var ballCanvas = document.getElementById('heroBall');
  if(ballCanvas && window.THREE && !reduceMotion){
    try {
      var renderer = new THREE.WebGLRenderer({canvas:ballCanvas, alpha:true, antialias:true});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
      camera.position.set(0, 0, 3.4);

      var hemi = new THREE.HemisphereLight(0xffffff, 0x1a0a0a, 1.0);
      scene.add(hemi);
      var key = new THREE.DirectionalLight(0xffffff, 0.8);
      key.position.set(2, 3, 3);
      scene.add(key);

      var texCanvas = document.createElement('canvas');
      texCanvas.width = 256; texCanvas.height = 256;
      var ctx = texCanvas.getContext('2d');
      ctx.fillStyle = '#e8863a';
      ctx.fillRect(0,0,256,256);
      ctx.strokeStyle = '#1a0a05';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0,128); ctx.lineTo(256,128); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(128,0); ctx.lineTo(128,256); ctx.stroke();
      ctx.beginPath(); ctx.arc(0,128,110,-1,1); ctx.stroke();
      ctx.beginPath(); ctx.arc(256,128,110,Math.PI-1,Math.PI+1); ctx.stroke();
      var texture = new THREE.CanvasTexture(texCanvas);

      var ballGeo = new THREE.SphereGeometry(1, 32, 32);
      var ballMat = new THREE.MeshStandardMaterial({map:texture, roughness:0.55, metalness:0.05});
      var ball = new THREE.Mesh(ballGeo, ballMat);
      scene.add(ball);

      function size(){
        var s = ballCanvas.clientWidth || 56;
        renderer.setSize(s, s, false);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
      }
      size();
      window.addEventListener('resize', size);

      var visible = true;
      if('IntersectionObserver' in window){
        var ballIo = new IntersectionObserver(function(entries){
          visible = entries[0].isIntersecting;
          if(visible && !raf){ raf = requestAnimationFrame(tick); }
        });
        ballIo.observe(ballCanvas);
      }

      var raf = null;
      function tick(){
        if(!visible){ raf = null; return; }
        ball.rotation.y += 0.015;
        ball.rotation.x += 0.006;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    } catch(err){
      ballCanvas.style.display = 'none';
    }
  }
})();
</script>

</body>
</html>
`;
}

module.exports = { renderIlluminationSite };
