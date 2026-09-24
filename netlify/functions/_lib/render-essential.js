const CSS = require("./essential-css");

function esc(s) {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label, value) {
  if (!value) return "";
  return `<div class="vitals-row"><span>${esc(label)}</span><span>${esc(value)}</span></div>`;
}

function seasonRow(label, p, key) {
  const ppg = p[`stat${key}PPG`];
  const reb = p[`stat${key}Rebounds`];
  const stl = p[`stat${key}Steals`];
  const blk = p[`stat${key}Blocks`];
  const ast = p[`stat${key}Assists`];
  const pts = p[`stat${key}TotalPoints`];
  if (![ppg, reb, stl, blk, ast, pts].some(Boolean)) return "";
  return `<tr><td>${label}</td><td>${esc(ppg)}</td><td>${esc(reb)}</td><td>${esc(stl)}</td><td>${esc(blk)}</td><td>${esc(ast)}</td><td>${esc(pts)}</td></tr>`;
}

function linkPill(label, url) {
  if (!url) return "";
  const href = /^https?:|^mailto:/i.test(url) ? url : `https://${url}`;
  return `<a class="link-pill" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)} &nbsp; &#8599;</a>`;
}

function renderEssentialPlayer(p) {
  const name = p.playerName || "Player";
  const upper = name.toUpperCase();
  const school = p.highSchool || "Middleburg High School";
  const team = "Middleburg Lady Broncos";
  const tagLine = [p.position, p.gradYear ? `Class of ${p.gradYear}` : ""].filter(Boolean).join(", ");

  const vitalsRows = [
    row("Jersey Number", p.jerseyNumber),
    row("High School", school),
    row("Position", p.position),
    row("Class Of", p.gradYear),
    row("Height", p.height),
    row("Weight", p.weight),
    row("Wingspan", p.wingspan),
    row("Standing Reach", p.standingReach),
    row("Shoe Size", p.shoeSize),
    row("GPA", p.gpa),
    row("SAT", p.sat),
    row("ACT", p.act),
    row("Dual Enrollment", p.dualEnrollment),
  ].filter(Boolean).join("\n");

  const hasTesting = [p.standingVertical, p.maxVertical, p.benchDeadliftSquat, p.laneAgility, p.shuttleRun, p.threeQtrSprint].some(Boolean);
  const testingRows = [
    row("Standing Vertical", p.standingVertical),
    row("Max Vertical", p.maxVertical),
    row("Bench / Squat / Deadlift", p.benchDeadliftSquat),
    row("Lane Agility", p.laneAgility),
    row("Shuttle Run (3/4 Court)", p.shuttleRun),
    row("Three Qtr Sprint", p.threeQtrSprint),
  ].filter(Boolean).join("\n");

  const seasonRows = [
    seasonRow("Freshman", p, "Freshman"),
    seasonRow("Sophomore", p, "Sophomore"),
    seasonRow("Junior", p, "Junior"),
    seasonRow("Senior", p, "Senior"),
  ].filter(Boolean).join("\n");

  const hasOffers = p.currentOffers || p.ncaaId;
  const hasContact = p.playerPhone || p.playerEmail || p.guardianName || p.guardianPhone || p.guardianEmail;

  const links = [
    linkPill("MaxPreps", p.maxpreps),
    linkPill("Hudl", p.hudl),
    linkPill("Field Level", p.fieldlevel),
    linkPill("Prep Girls Hoops", p.prepgirlshoops),
    linkPill("Instagram", p.instagram),
    linkPill("X / Twitter", p.twitter),
    linkPill("YouTube", p.youtube),
    `<a class="link-pill" href="players-directory.html">Elevate Her Hoops &nbsp; &#8599;</a>`,
    p.coachEmail ? linkPill("Email Coach", `mailto:${p.coachEmail}`) : "",
  ].filter(Boolean).join("\n");

  const heroCta = p.maxpreps
    ? `<a class="btn primary" href="${esc(p.maxpreps)}" target="_blank" rel="noopener">View On MaxPreps</a>`
    : "";

  const photoBlock = p.playerPhoto
    ? `<div class="wrap"><div class="record-photo" style="max-width:420px;margin:28px auto 0;border:1px solid var(--line);overflow:hidden;"><img src="${esc(p.playerPhoto)}" alt="${esc(name)}" style="width:100%;display:block;"></div></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(name)} | Middleburg Lady Broncos</title>
<meta name="description" content="${esc(name)}, Middleburg Lady Broncos. Full stats and film on MaxPreps.">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(name)} | Middleburg Lady Broncos">
<meta property="og:description" content="${esc(name)}, Middleburg Lady Broncos.">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>

<nav>
  <div class="wrap">
    <div class="nav-name">${esc(upper)}</div>
    <div class="nav-links">
      <a href="#about">About</a>
      <a href="#links">Links</a>
      <a href="players-directory.html">Elevate Her Hoops</a>
    </div>
  </div>
</nav>

<div class="hero" id="top">
  <div class="hero-eyebrow">${esc(team)}</div>
  <h1 class="display">${esc(upper)}</h1>
  <p class="hero-sub">${tagLine ? esc(tagLine) : "Full stats, game film, and season updates are on the way."}</p>
  <div class="hero-cta">
    ${heroCta}
    <a class="btn ghost" href="#links">All Links</a>
  </div>
</div>

<section id="about">
  <div class="wrap">
    <div class="section-head">
      <div class="display">About</div>
      <p>${p.message ? esc(p.message) : "Check back soon for her full bio, stats, and highlight film."}</p>
    </div>
    <div class="vitals">
      <div class="vitals-title">Player Info</div>
      ${vitalsRows || row("Team", team)}
    </div>
  </div>
</section>

${hasTesting ? `<section id="testing" style="background:var(--panel);border-top:1px solid var(--line);border-bottom:1px solid var(--line);">
  <div class="wrap">
    <div class="section-head">
      <div class="display">Athletic Testing</div>
    </div>
    <div class="vitals">
      <div class="vitals-title">Measurables</div>
      ${testingRows}
    </div>
  </div>
</section>` : ""}

${seasonRows ? `<section id="stats">
  <div class="wrap">
    <div class="section-head">
      <div class="display">Season Stats</div>
    </div>
    <div class="table-wrap" style="border:1px solid var(--line);overflow-x:auto;">
      <table class="stats" style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr>
          <th style="padding:14px;text-align:left;">Season</th><th style="padding:14px;">PPG</th><th style="padding:14px;">Rebounds</th><th style="padding:14px;">Steals</th><th style="padding:14px;">Blocks</th><th style="padding:14px;">Assists</th><th style="padding:14px;">Total Points</th>
        </tr></thead>
        <tbody>${seasonRows}</tbody>
      </table>
    </div>
  </div>
</section>` : ""}

${hasOffers ? `<section id="recruiting" style="background:var(--panel);border-top:1px solid var(--line);border-bottom:1px solid var(--line);">
  <div class="wrap">
    <div class="section-head">
      <div class="display">College Interest</div>
    </div>
    <div class="vitals">
      <div class="vitals-title">Recruiting</div>
      ${row("Current Offers", p.currentOffers)}
      ${row("NCAA ID", p.ncaaId)}
    </div>
  </div>
</section>` : ""}

${photoBlock}

${hasContact ? `<section id="contact">
  <div class="wrap">
    <div class="section-head">
      <div class="display">Contact</div>
    </div>
    <div class="contact-card">
      <h4>Player</h4>
      ${p.playerPhone ? `<div class="contact-row"><span>Phone </span>${esc(p.playerPhone)}</div>` : ""}
      ${p.playerEmail ? `<div class="contact-row"><span>Email </span>${esc(p.playerEmail)}</div>` : ""}
      ${p.guardianName ? `<div class="rule" style="margin:16px 0;"></div><h4>Parent / Guardian, ${esc(p.guardianName)}</h4>` : ""}
      ${p.guardianPhone ? `<div class="contact-row"><span>Phone </span>${esc(p.guardianPhone)}</div>` : ""}
      ${p.guardianEmail ? `<div class="contact-row"><span>Email </span>${esc(p.guardianEmail)}</div>` : ""}
    </div>
  </div>
</section>` : ""}

<section id="coach" style="background:var(--panel);border-top:1px solid var(--line);border-bottom:1px solid var(--line);">
  <div class="wrap">
    <div class="section-head">
      <div class="display">Coach Contact</div>
      <p>Reach the Middleburg Lady Broncos coaching staff.</p>
    </div>
    <div class="contact-card">
      <h4>${esc(p.coachName || "Tenise Haynes")}</h4>
      ${p.coachPhone ? `<div class="contact-row"><span>Phone </span>${esc(p.coachPhone)}</div>` : ""}
      ${p.coachEmail ? `<div class="contact-row"><span>Email </span>${esc(p.coachEmail)}</div>` : ""}
    </div>
  </div>
</section>

<footer id="links">
  <div class="wrap">
    <div class="section-head">
      <div class="display" style="font-size:clamp(24px,3.4vw,34px);">Links</div>
    </div>
    <div class="links-grid">
      ${links}
    </div>
    <div class="rule" style="margin-bottom:24px;"></div>
    <div class="foot-bottom">
      <div><span class="brand">${esc(name)}</span> &middot; ${esc(team)}</div>
    </div>
  </div>
</footer>

</body>
</html>
`;
}

module.exports = { renderEssentialPlayer };
