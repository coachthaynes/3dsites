const CSS = require("./essential-css");
const { getSchoolColors, getSchoolInitials, getSchoolLogo } = require("./school-colors");

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

function renderEssentialPlayer(p, articles) {
  const name = p.playerName || "Player";
  const upper = name.toUpperCase();
  const school = p.highSchool || "Middleburg High School";
  const schoolColors = getSchoolColors(school);
  const schoolLogo = getSchoolLogo(school);
  const schoolBadge = schoolLogo
    ? `<img class="school-logo-img" src="${esc(schoolLogo)}" alt="${esc(school)} logo">`
    : `<span class="school-badge">${esc(getSchoolInitials(school))}</span>`;
  const team = /middleburg/i.test(school) ? "Middleburg Lady Broncos" : `${school} Girls Basketball`;
  const tagLine = [p.position, p.gradYear ? `Class of ${p.gradYear}` : ""].filter(Boolean).join(", ");

  const vitalsRows = [
    row("Jersey Number", p.jerseyNumber),
    `<div class="vitals-row"><span>High School</span><span>${schoolBadge} ${esc(school)}</span></div>`,
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

  const links = [
    linkPill("MaxPreps", p.maxpreps),
    linkPill("Hudl", p.hudl),
    linkPill("Field Level", p.fieldlevel),
    linkPill("Prep Girls Hoops", p.prepgirlshoops),
    linkPill("Instagram", p.instagram),
    linkPill("X / Twitter", p.twitter),
    linkPill("YouTube", p.youtube),
    `<a class="link-pill" href="players-directory.html">Elevate Her Hoops &nbsp; &#8599;</a>`,
  ].filter(Boolean).join("\n");

  const heroCta = p.maxpreps
    ? `<a class="btn primary" href="${esc(p.maxpreps)}" target="_blank" rel="noopener">View On MaxPreps</a>`
    : "";

  const photoCard = p.playerPhoto
    ? `<div class="photo-card"><img src="${esc(p.playerPhoto)}" alt="${esc(name)}"></div>`
    : "";

  const statsCard = seasonRows
    ? `<div class="table-wrap">
      <div class="vitals-title">Season Stats</div>
      <table>
        <thead><tr>
          <th>Season</th><th>PPG</th><th>Rebounds</th><th>Steals</th><th>Blocks</th><th>Assists</th><th>Total Points</th>
        </tr></thead>
        <tbody>${seasonRows}</tbody>
      </table>
    </div>`
    : "";

  const vitalsCard = `<div class="vitals">
      <div class="vitals-title">Player Info</div>
      ${vitalsRows || row("Team", team)}
    </div>`;

  const testingCard = hasTesting
    ? `<div class="vitals">
      <div class="vitals-title">Measurables</div>
      ${testingRows}
    </div>`
    : "";

  const recruitingCard = hasOffers
    ? `<div class="vitals">
      <div class="vitals-title">Recruiting</div>
      ${row("Current Offers", p.currentOffers)}
      ${row("NCAA ID", p.ncaaId)}
    </div>`
    : "";

  const contactCard = `<div class="contact-card">
      <h4>Contact</h4>
      <p style="color:var(--gray);font-size:13.5px;line-height:1.6;margin-bottom:6px;">To protect ${esc(name.split(" ")[0] || name)}'s privacy, contact details are shared by request only. Tell us who you are and we will send the information directly to you once approved.</p>
      ${p.playerName ? `<div class="contact-row"><span>Player </span>${esc(name)}, phone and email on request</div>` : ""}
      ${p.guardianName ? `<div class="contact-row"><span>Parent / Guardian </span>${esc(p.guardianName)}, phone and email on request</div>` : ""}
      <div class="contact-row"><span>${esc(p.coachName || "Tenise Haynes")} </span>Phone and email on request</div>
      <form class="request-form" name="essential-contact-request" method="POST" data-netlify="true" netlify-honeypot="website" id="contactForm">
        <input type="hidden" name="form-name" value="essential-contact-request">
        <input type="hidden" name="subject" value="Contact request for ${esc(name)}">
        <p class="hp"><label>Leave this empty <input name="website"></label></p>
        <div><label for="reqName">Your Name</label><input name="name" id="reqName" required></div>
        <div><label for="reqWho">Who You Are</label><input name="organization" id="reqWho" placeholder="College coach, media, business"></div>
        <div><label for="reqEmail">Email</label><input type="email" name="email" id="reqEmail" required></div>
        <div><label for="reqPhone">Phone</label><input type="tel" name="phone" id="reqPhone"></div>
        <div><label for="reqReason">Reason For Your Request</label><textarea name="reason" id="reqReason" required placeholder="Recruiting interest, interview request, partnership idea"></textarea></div>
        <button type="submit" class="btn primary" style="width:100%;border:none;">Send Request</button>
        <p id="contactStatus" style="margin-top:2px;font-size:12.5px;color:var(--red);min-height:1.4em;"></p>
      </form>
    </div>`;

  const coachCard = "";

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
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style>
<style>:root{--red:${schoolColors.accent};--red-dark:${schoolColors.accentDark};}</style>
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
  <div class="hero-eyebrow">${schoolBadge} ${esc(team)}</div>
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
    <div class="box-row">
      ${[photoCard, statsCard, vitalsCard, testingCard, recruitingCard].filter(Boolean).join("\n")}
    </div>
  </div>
</section>

${(articles || []).length ? `<section id="news">
  <div class="wrap">
    <div class="section-head">
      <div class="display">Latest News</div>
    </div>
    <div class="box-row">
      ${articles.map((a) => `<div class="contact-card">
        <h4>${esc(a.headline)}</h4>
        ${String(a.body || "").split(/\n\n+/).map((para) => `<p style="font-size:14px;color:#d5d5d5;margin-bottom:10px;line-height:1.5;">${esc(para)}</p>`).join("\n")}
      </div>`).join("\n")}
    </div>
  </div>
</section>` : ""}

<section id="contact" style="background:var(--panel);border-top:1px solid var(--line);border-bottom:1px solid var(--line);">
  <div class="wrap">
    <div class="section-head">
      <div class="display">Contact</div>
      <p>Reach ${esc(name)} or the ${esc(team)} coaching staff.</p>
    </div>
    <div class="box-row">
      ${[contactCard, coachCard].filter(Boolean).join("\n")}
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
      <div><a href="/player-login" style="color:var(--gray);">Player Login</a></div>
    </div>
  </div>
</footer>

<script>
(function(){
  var contactForm = document.getElementById('contactForm');
  var contactStatus = document.getElementById('contactStatus');
  if(!contactForm) return;
  contactForm.addEventListener('submit', function(e){
    e.preventDefault();
    var data = new FormData(contactForm);
    contactStatus.style.color = 'var(--red)';
    contactStatus.textContent = 'Sending...';
    fetch('/', { method: 'POST', body: new URLSearchParams(data).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      .then(function(res){
        if(!res.ok) throw new Error('failed');
        contactForm.reset();
        contactStatus.textContent = 'Request received. We will review it and email you directly.';
      })
      .catch(function(){
        var skip = ['form-name', 'subject', 'website'];
        var lines = [];
        data.forEach(function(v, k){ if(skip.indexOf(k) === -1) lines.push(k + ': ' + v); });
        var subject = data.get('subject') || 'Contact request';
        location.href = 'mailto:coachthaynes@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\\n'));
      });
  });
})();
</script>

</body>
</html>
`;
}

module.exports = { renderEssentialPlayer };
