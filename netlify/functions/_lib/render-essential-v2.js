const { getSchoolLogo, getSchoolInitials } = require("./school-colors");

function esc(s) {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function infoRow(label, value) {
  if (!value) return "";
  return `<div class="info-row"><span>${esc(label)}</span><span>${esc(value)}</span></div>`;
}

function seasonStats(p, key) {
  const ppg = p[`stat${key}PPG`];
  const reb = p[`stat${key}Rebounds`];
  const stl = p[`stat${key}Steals`];
  const blk = p[`stat${key}Blocks`];
  const ast = p[`stat${key}Assists`];
  const pts = p[`stat${key}TotalPoints`];
  if (![ppg, reb, stl, blk, ast, pts].some(Boolean)) return null;
  return { ppg, reb, stl, blk, ast, pts };
}

function seasonTableRow(label, stats) {
  if (!stats) return "";
  return `<tr><td>${esc(label)}</td><td>${esc(stats.ppg)}</td><td>${esc(stats.reb)}</td><td>${esc(stats.stl)}</td><td>${esc(stats.blk)}</td><td>${esc(stats.ast)}</td><td>${esc(stats.pts)}</td></tr>`;
}

function filmLink(label, url) {
  if (!url) return "";
  const href = /^https?:|^mailto:/i.test(url) ? url : `https://${url}`;
  return `<a class="film-link" href="${esc(href)}" target="_blank" rel="noopener"><span class="dot"></span>${esc(label)} &#8599;</a>`;
}

const CSS = `
  :root{
    --violet:#1E1035;
    --violet-deep:#150a28;
    --panel:#241640;
    --panel-2:#2c1a4d;
    --line:rgba(255,255,255,0.12);
    --white:#FFFFFF;
    --dim:rgba(255,255,255,0.68);
    --magenta:#FF2E93;
    --magenta-deep:#c81f70;
    --teal:#00F5D4;
    color-scheme: dark;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;}
  body{
    background:var(--violet);color:var(--white);font-family:'Poppins',sans-serif;
    -webkit-font-smoothing:antialiased;overflow-x:hidden;
    padding-left:max(20px, env(safe-area-inset-left,0px));
    padding-right:max(20px, env(safe-area-inset-right,0px));
  }
  a{color:inherit;text-decoration:none;}
  img{max-width:100%;}
  .display{font-family:'Fredoka',sans-serif;font-weight:600;line-height:1.05;text-wrap:balance;}
  .mono{font-family:'IBM Plex Mono',ui-monospace,monospace;}
  .wrap{max-width:1120px;margin:0 auto;}
  .rule{height:1px;background:var(--line);width:100%;}
  .eyebrow{font-family:'IBM Plex Mono',monospace;color:var(--teal);font-weight:600;font-size:12.5px;letter-spacing:0.14em;text-transform:uppercase;}
  :root{ scroll-behavior:smooth; }
  @media (prefers-reduced-motion:reduce){ :root{scroll-behavior:auto;} }
  .logo-icon{display:block;width:100%;height:100%;}

  nav{
    position:sticky;top:0;z-index:60;margin:0 -20px;padding:0 20px;
    background:rgba(21,10,40,0.86);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    border-bottom:1px solid var(--line);
  }
  .nav-inner{max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:62px;gap:18px;flex-wrap:wrap;}
  .brand{display:flex;align-items:center;gap:10px;}
  .brand .logo-icon-wrap{width:30px;height:30px;flex-shrink:0;}
  .brand-text{display:flex;flex-direction:column;line-height:1.1;}
  .brand-name{font-family:'Fredoka',sans-serif;font-weight:700;font-size:15px;color:var(--white);}
  .brand-sub{font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--teal);}
  .nav-links{display:flex;align-items:center;gap:18px;font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:0.04em;text-transform:uppercase;color:var(--dim);}
  .nav-links a:hover{color:var(--teal);}
  .btn{display:inline-block;padding:11px 20px;font-weight:700;font-size:12.5px;border-radius:999px;border:2px solid transparent;transition:all .2s;white-space:nowrap;}
  .btn.primary{background:var(--magenta);color:var(--white);}
  .btn.primary:hover{background:var(--magenta-deep);}
  .btn.ghost{border-color:var(--line);color:var(--white);}
  .btn.ghost:hover{border-color:var(--teal);color:var(--teal);}

  .school-chip{display:inline-flex;align-items:center;gap:8px;}
  .school-logo-img{width:22px;height:22px;object-fit:contain;border-radius:6px;}
  .school-badge{
    display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;
    background:rgba(0,245,212,0.14);color:var(--teal);font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;
  }

  .hero{position:relative;padding:40px 0 0;}
  .hero-grid{display:grid;grid-template-columns:1.05fr 0.95fr;gap:40px;align-items:center;}
  @media (max-width:860px){
    .hero-grid{grid-template-columns:1fr;}
    .photo-frame{width:100%;max-width:380px;margin:0 auto;}
  }
  .hero-eyebrow{margin-bottom:10px;}
  .hero h1{font-size:clamp(38px,5.2vw,58px);margin:0;color:var(--white);}
  .hero-sub{color:var(--dim);font-size:15.5px;margin-top:14px;line-height:1.65;max-width:46ch;}
  .hero-tags{display:flex;gap:9px;flex-wrap:wrap;margin-top:22px;}
  .tag{border:1.5px solid var(--teal);color:var(--teal);border-radius:999px;padding:6px 13px;font-size:11px;font-weight:700;font-family:'IBM Plex Mono',monospace;}
  .hero-cta{margin-top:26px;display:flex;gap:12px;flex-wrap:wrap;}

  .photo-frame{
    position:relative;border-radius:24px;overflow:hidden;aspect-ratio:4/5;
    box-shadow:0 30px 70px rgba(0,0,0,0.45);
    background:linear-gradient(155deg, var(--panel-2), var(--violet-deep));
  }
  .photo-frame img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
  .photo-frame .fallback-icon{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}

  .statstrip{margin-top:50px;background:var(--panel);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
  .statstrip .grid{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);text-align:center;}
  .stat-item{padding:26px 8px;border-left:1px solid var(--line);}
  .stat-item:first-child{border-left:none;}
  .stat-num{font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:clamp(24px,3.2vw,34px);color:var(--white);}
  .stat-label{font-size:10.5px;letter-spacing:0.06em;text-transform:uppercase;color:var(--dim);margin-top:6px;}

  section{padding:64px 0;}
  .section-head{margin-bottom:34px;max-width:64ch;}
  .section-head .display{font-size:clamp(24px,3.4vw,34px);color:var(--white);}
  .section-head p{color:var(--dim);margin-top:10px;font-size:14.5px;}

  .box-row{display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:20px;}

  .film-links{display:flex;gap:14px;flex-wrap:wrap;}
  .film-link{
    display:flex;align-items:center;gap:10px;border:1px solid var(--line);background:var(--panel);
    border-radius:14px;padding:16px 22px;font-weight:700;font-size:14px;transition:border-color .2s, transform .2s;
  }
  .film-link:hover{border-color:var(--teal);color:var(--teal);transform:translateY(-3px);}
  .film-link .dot{width:8px;height:8px;border-radius:50%;background:var(--magenta);flex-shrink:0;}

  .card{border:1px solid var(--line);background:var(--panel);border-radius:20px;padding:26px;}
  .card h4{margin:0 0 14px;font-family:'Fredoka',sans-serif;font-size:15px;}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
  @media (max-width:700px){ .info-grid{grid-template-columns:1fr;} }
  .info-row{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--line);font-size:13.5px;}
  .info-row:last-child{border-bottom:none;}
  .info-row span:first-child{color:var(--dim);}
  .info-row span:last-child{font-weight:700;color:var(--white);font-family:'IBM Plex Mono',monospace;text-align:right;}

  .accolade-list{list-style:none;margin:0;padding:0;}
  .accolade-list li{
    display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid var(--line);font-size:14.5px;line-height:1.5;
  }
  .accolade-list li:last-child{border-bottom:none;}
  .accolade-list .star{
    width:30px;height:30px;border-radius:50%;flex-shrink:0;background:rgba(0,245,212,0.12);
    display:flex;align-items:center;justify-content:center;color:var(--teal);font-size:14px;
  }

  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{text-align:left;color:var(--dim);font-size:10.5px;letter-spacing:0.06em;text-transform:uppercase;padding:0 10px 12px;font-weight:600;}
  td{padding:10px;border-top:1px solid var(--line);font-family:'IBM Plex Mono',monospace;}
  td:first-child, th:first-child{padding-left:0;font-family:'Poppins',sans-serif;}

  .contact-row{display:flex;gap:8px;font-size:13.5px;padding:6px 0;color:var(--dim);}
  .contact-row span{color:var(--white);font-weight:600;}

  footer{padding:50px 0 40px;border-top:1px solid var(--line);}
  .links-grid{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:28px;}
  .foot-bottom{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;color:var(--dim);font-size:13px;}
  footer a{color:var(--teal);}
  :focus-visible{outline:2px solid var(--teal);outline-offset:2px;}
`;

function renderEssentialPlayerV2(p, articles) {
  const name = p.playerName || "Player";
  const school = p.highSchool || "Middleburg High School";
  const schoolLogo = getSchoolLogo(school);
  const schoolBadge = schoolLogo
    ? `<img class="school-logo-img" src="${esc(schoolLogo)}" alt="${esc(school)} logo">`
    : `<span class="school-badge">${esc(getSchoolInitials(school))}</span>`;
  const team = /middleburg/i.test(school) ? "Middleburg Lady Broncos" : `${school} Girls Basketball`;
  const tagLine = [p.position, school, p.gradYear ? `Class of ${p.gradYear}` : ""].filter(Boolean).join(", ");

  const seasons = [
    ["Senior", seasonStats(p, "Senior")],
    ["Junior", seasonStats(p, "Junior")],
    ["Sophomore", seasonStats(p, "Sophomore")],
    ["Freshman", seasonStats(p, "Freshman")],
  ];
  const latestSeason = seasons.find(([, s]) => s);
  const statStrip = latestSeason && (latestSeason[1].ppg || latestSeason[1].reb || latestSeason[1].ast)
    ? `<div class="statstrip">
      <div class="grid">
        <div class="stat-item"><div class="stat-num mono">${esc(latestSeason[1].ppg || "-")}</div><div class="stat-label">PPG</div></div>
        <div class="stat-item"><div class="stat-num mono">${esc(latestSeason[1].reb || "-")}</div><div class="stat-label">Rebounds</div></div>
        <div class="stat-item"><div class="stat-num mono">${esc(latestSeason[1].ast || "-")}</div><div class="stat-label">Assists</div></div>
      </div>
    </div>`
    : "";

  const seasonRows = seasons.map(([label, s]) => seasonTableRow(label, s)).filter(Boolean).reverse().join("\n");
  const statsCard = seasonRows
    ? `<div class="card">
      <h4>Season Stats</h4>
      <table>
        <thead><tr><th>Season</th><th>PPG</th><th>Reb</th><th>Stl</th><th>Blk</th><th>Ast</th><th>Pts</th></tr></thead>
        <tbody>${seasonRows}</tbody>
      </table>
    </div>`
    : "";

  const vitalsRows = [
    infoRow("Jersey Number", p.jerseyNumber),
    infoRow("Position", p.position),
    infoRow("Class Of", p.gradYear),
    infoRow("Height", p.height),
    infoRow("Weight", p.weight),
    infoRow("Wingspan", p.wingspan),
    infoRow("Standing Reach", p.standingReach),
    infoRow("Shoe Size", p.shoeSize),
    infoRow("GPA", p.gpa),
    infoRow("SAT", p.sat),
    infoRow("ACT", p.act),
    infoRow("Dual Enrollment", p.dualEnrollment),
  ].filter(Boolean).join("\n");

  const hasTesting = [p.standingVertical, p.maxVertical, p.benchDeadliftSquat, p.laneAgility, p.shuttleRun, p.threeQtrSprint].some(Boolean);
  const testingRows = [
    infoRow("Standing Vertical", p.standingVertical),
    infoRow("Max Vertical", p.maxVertical),
    infoRow("Bench / Squat / Deadlift", p.benchDeadliftSquat),
    infoRow("Lane Agility", p.laneAgility),
    infoRow("Shuttle Run (3/4 Court)", p.shuttleRun),
    infoRow("Three Qtr Sprint", p.threeQtrSprint),
  ].filter(Boolean).join("\n");

  const hasOffers = p.currentOffers || p.ncaaId;
  const hasContact = p.playerPhone || p.playerEmail || p.guardianName || p.guardianPhone || p.guardianEmail;

  const filmLinks = [
    filmLink("MaxPreps", p.maxpreps),
    filmLink("Hudl", p.hudl),
    filmLink("Field Level", p.fieldlevel),
    filmLink("Prep Girls Hoops", p.prepgirlshoops),
    filmLink("Instagram", p.instagram),
    filmLink("X, Twitter", p.twitter),
    filmLink("YouTube", p.youtube),
  ].filter(Boolean).join("\n");

  const heroCta = p.maxpreps
    ? `<a class="btn primary" href="${esc(p.maxpreps)}" target="_blank" rel="noopener">View On MaxPreps</a>`
    : filmLinks
      ? `<a class="btn primary" href="#film">Watch Her Film</a>`
      : "";

  const accoladeLines = String(p.message || "").split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const accoladesCard = accoladeLines.length
    ? `<div class="card">
      <ul class="accolade-list">
        ${accoladeLines.map((line) => `<li><span class="star">&#9733;</span>${esc(line)}</li>`).join("\n")}
      </ul>
    </div>`
    : `<div class="card"><p style="color:var(--dim);margin:0;font-size:14.5px;">Check back soon for her accolades and awards.</p></div>`;

  const contactCard = hasContact
    ? `<div class="card">
      <h4>Player</h4>
      ${p.playerPhone ? `<div class="contact-row">Phone <span>${esc(p.playerPhone)}</span></div>` : ""}
      ${p.playerEmail ? `<div class="contact-row">Email <span>${esc(p.playerEmail)}</span></div>` : ""}
      ${p.guardianName ? `<div class="rule" style="margin:16px 0;"></div><h4>Parent / Guardian, ${esc(p.guardianName)}</h4>` : ""}
      ${p.guardianPhone ? `<div class="contact-row">Phone <span>${esc(p.guardianPhone)}</span></div>` : ""}
      ${p.guardianEmail ? `<div class="contact-row">Email <span>${esc(p.guardianEmail)}</span></div>` : ""}
    </div>`
    : "";

  const coachCard = `<div class="card">
      <h4>${esc(p.coachName || "Tenise Haynes")}</h4>
      ${p.coachPhone ? `<div class="contact-row">Phone <span>${esc(p.coachPhone)}</span></div>` : ""}
      ${p.coachEmail ? `<div class="contact-row">Email <span>${esc(p.coachEmail)}</span></div>` : ""}
    </div>`;

  const linkPills = [
    filmLinks,
    `<a class="film-link" href="players-directory.html"><span class="dot"></span>Elevate Her Hoops &#8599;</a>`,
    p.coachEmail ? `<a class="film-link" href="mailto:${esc(p.coachEmail)}"><span class="dot"></span>Email Coach &#8599;</a>` : "",
  ].filter(Boolean).join("\n");

  const recruitingCard = hasOffers
    ? `<div class="card">
      <h4>Recruiting</h4>
      ${infoRow("Current Offers", p.currentOffers)}
      ${infoRow("NCAA ID", p.ncaaId)}
    </div>`
    : "";

  const photoFrame = p.playerPhoto
    ? `<img src="${esc(p.playerPhoto)}" alt="${esc(name)}">`
    : `<div class="fallback-icon">
        <svg viewBox="0 0 100 100" width="96" height="96" aria-hidden="true">
          <defs>
            <linearGradient id="phGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#00F5D4"/>
              <stop offset="1" stop-color="#FF2E93"/>
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#phGrad)" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="55" cy="18" r="8.5" fill="url(#phGrad)" stroke="none"/>
            <path d="M55 27 L50 55"/>
            <path d="M50 55 L38 68 L46 90"/>
            <path d="M50 55 L58 72 L70 86"/>
            <path d="M53 30 L66 18 L76 4"/>
            <path d="M53 32 L40 40 L34 46"/>
            <circle cx="80" cy="2" r="7" fill="url(#phGrad)" stroke="none"/>
          </g>
        </svg>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(name)} | ${esc(team)}</title>
<meta name="description" content="${esc(name)}, ${esc(team)}. Full stats and film on MaxPreps.">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(name)} | ${esc(team)}">
<meta property="og:description" content="${esc(name)}, ${esc(team)}.">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Poppins:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>

<svg style="display:none" aria-hidden="true">
  <symbol id="ehLogo" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="88" fill="none" stroke="#00F5D4" stroke-width="9"/>
    <path d="M16 66 Q100 18 184 66" fill="none" stroke="#00F5D4" stroke-width="9" stroke-linecap="round"/>
    <path d="M20 138 Q100 188 180 132" fill="none" stroke="#00F5D4" stroke-width="9" stroke-linecap="round"/>
    <g fill="none" stroke="#FF2E93" stroke-width="16" stroke-linecap="round" stroke-linejoin="round">
      <path d="M64 58 L64 142"/><path d="M64 58 L98 58"/><path d="M64 100 L92 100"/><path d="M64 142 L98 142"/>
      <path d="M120 58 L120 142"/><path d="M148 58 L148 142"/><path d="M120 100 L148 100"/>
    </g>
  </symbol>
</svg>

<nav>
  <div class="nav-inner">
    <a href="players-directory.html" class="brand">
      <span class="logo-icon-wrap"><svg class="logo-icon" viewBox="0 0 200 200"><use href="#ehLogo"></use></svg></span>
      <span class="brand-text">
        <span class="brand-name">Elevate Her</span>
        <span class="brand-sub">Hoops Report</span>
      </span>
    </a>
    <div class="nav-links">
      <a href="#about">Accolades</a>
      <a href="#links">Links</a>
      <a href="/player-login">Player Login</a>
    </div>
  </div>
</nav>

<div class="hero" id="top">
  <div class="wrap">
    <div class="hero-grid">
      <div>
        <div class="eyebrow hero-eyebrow school-chip">${schoolBadge} Player Profile</div>
        <h1 class="display">${esc(name)}</h1>
        <p class="hero-sub">${tagLine ? esc(tagLine) : "Full stats, game film, and season updates are on the way."}</p>
        <div class="hero-tags">
          <span class="tag">${esc(team)}</span>
        </div>
        <div class="hero-cta">
          ${heroCta}
          <a class="btn ghost" href="#links">All Links</a>
        </div>
      </div>
      <div class="photo-frame">
        ${photoFrame}
      </div>
    </div>
  </div>
</div>

${statStrip}

${filmLinks ? `<section id="film">
  <div class="wrap">
    <div class="section-head">
      <div class="eyebrow">Game Film</div>
      <div class="display">Watch Her Play</div>
    </div>
    <div class="film-links">
      ${filmLinks}
    </div>
  </div>
</section>` : ""}

<section id="about">
  <div class="wrap">
    <div class="section-head">
      <div class="eyebrow">Accolades</div>
      <div class="display">Rankings And Recognition</div>
      <p>${p.message ? "" : "Check back soon for her full bio, stats, and highlight film."}</p>
    </div>
    <div class="box-row">
      ${accoladesCard}
      ${statsCard}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head">
      <div class="eyebrow">Recruiting Info</div>
      <div class="display">Everything A Coach Needs In One Place</div>
    </div>
    <div class="info-grid">
      <div class="card">${vitalsRows}</div>
      ${testingRows ? `<div class="card">${testingRows}</div>` : ""}
    </div>
    ${recruitingCard ? `<div style="margin-top:20px;">${recruitingCard}</div>` : ""}
  </div>
</section>

${(articles || []).length ? `<section id="news">
  <div class="wrap">
    <div class="section-head">
      <div class="eyebrow">Latest News</div>
      <div class="display">Recent Updates</div>
    </div>
    <div class="box-row">
      ${articles.map((a) => `<div class="card">
        <h4>${esc(a.headline)}</h4>
        ${String(a.body || "").split(/\n\n+/).map((para) => `<p style="font-size:14px;color:var(--dim);margin-bottom:10px;line-height:1.5;">${esc(para)}</p>`).join("\n")}
      </div>`).join("\n")}
    </div>
  </div>
</section>` : ""}

<section style="background:var(--panel);border-top:1px solid var(--line);border-bottom:1px solid var(--line);">
  <div class="wrap">
    <div class="section-head">
      <div class="eyebrow">Contact</div>
      <div class="display">Reach ${esc(name)}</div>
      <p>Or the ${esc(team)} coaching staff.</p>
    </div>
    <div class="box-row">
      ${[contactCard, coachCard].filter(Boolean).join("\n")}
    </div>
  </div>
</section>

<footer id="links">
  <div class="wrap">
    <div class="section-head">
      <div class="eyebrow">Links</div>
      <div class="display" style="font-size:clamp(24px,3.4vw,34px);">Find Her Everywhere</div>
    </div>
    <div class="links-grid">
      ${linkPills}
    </div>
    <div class="rule" style="margin-bottom:24px;"></div>
    <div class="foot-bottom">
      <div><span class="brand-name">${esc(name)}</span> &middot; ${esc(team)}</div>
      <div><a href="/player-login">Player Login</a></div>
    </div>
  </div>
</footer>

</body>
</html>
`;
}

module.exports = { renderEssentialPlayerV2 };
