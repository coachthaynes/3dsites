const { shareTags } = require("./share-tags");
const CSS = require("./directory-css");
const { getSchoolLogo, getSchoolInitials } = require("./school-colors");

function esc(s) {
  if (s === undefined || s === null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function playerCard(p) {
  const school = p.highSchool || "";
  const schoolLogo = getSchoolLogo(school);
  const badge = schoolLogo
    ? `<img class="school-logo-img" src="${esc(schoolLogo)}" alt="${esc(school)} logo">`
    : `<span class="school-badge">${esc(getSchoolInitials(school))}</span>`;
  return `      <a class="player-card" href="players/${esc(p.slug)}">
        ${badge}
        <span class="player-info">
          <span class="player-name">${esc(p.playerName)}</span>
          <span class="player-school">${esc(school || "School not set yet")}</span>
        </span>
      </a>`;
}

function renderDirectory(players) {
  const published = (players || []).filter(
    (p) => p.status !== "draft" && p.playerName && p.tier !== "elite" && p.tier !== "illumination"
  );
  published.sort((a, b) => a.playerName.localeCompare(b.playerName));

  const playerGrid = published.length
    ? `<section class="player-directory">
  <div class="wrap">
    <div class="player-grid">
${published.map(playerCard).join("\n")}
    </div>
  </div>
</section>`
    : `<section class="player-directory">
  <div class="wrap">
    <div class="empty-note">Players will show up here as they join Elevate Her.</div>
  </div>
</section>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Player Directory, Elevate Her Hoops Report</title>
<meta name="description" content="Girls varsity basketball players from across Florida, each linked to her own Elevate Her recruiting profile.">
${shareTags({ title: "Player Directory | Elevate Her Hoops Report", description: "Girls basketball players from across Florida, each linked to her own Elevate Her recruiting profile.", url: "/players-directory.html" })}
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏀</text></svg>">

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
      <path d="M64 58 L64 142"/>
      <path d="M64 58 L98 58"/>
      <path d="M64 100 L92 100"/>
      <path d="M64 142 L98 142"/>
      <path d="M120 58 L120 142"/>
      <path d="M148 58 L148 142"/>
      <path d="M120 100 L148 100"/>
    </g>
  </symbol>
</svg>

<nav>
  <div class="nav-inner">
    <a href="index.html" class="brand">
      <span class="logo-icon-wrap"><svg class="logo-icon" viewBox="0 0 200 200"><use href="#ehLogo"></use></svg></span>
      <span class="brand-text">
        <span class="brand-name">Elevate Her</span>
        <span class="brand-sub">Hoops Report</span>
      </span>
    </a>
    <div class="nav-links" id="navLinks">
      <a href="index.html#players">Players</a>
      <a href="index.html#pricing">Pricing</a>
      <a href="index.html#how-it-works">How It Works</a>
      <a href="index.html#about">About</a>
    </div>
    <div class="nav-right">
      <a class="btn primary small" href="index.html#pricing">Sign Up</a>
      <button type="button" class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false" aria-controls="navLinks">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
</nav>

<div class="wrap">
  <div class="page-head">
    <div class="eyebrow">Player Directory</div>
    <div class="display">Girls Varsity Basketball Players</div>
    <p>A directory of every player using Elevate Her, from across Florida. Tap a name to see her full recruiting profile.</p>
    <div class="data-note">
      <strong>About this page.</strong> Every player listed here has signed up for an Elevate Her package. Each card shows her school, with a team logo when we have one on file.
    </div>
  </div>
</div>

${playerGrid}

<footer>
  <div class="wrap">
    <div class="rule" style="margin-bottom:22px;"></div>
    <div class="foot-bottom">
      <div><a href="index.html">&larr; Back to Elevate Her Hoops Report</a></div>
      <div><a href="privacy-policy.html">Privacy Policy</a></div>
    </div>
  </div>
</footer>

<script>
(function(){
  "use strict";
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if(!navToggle || !navLinks) return;
  function closeMobileNav(){
    navLinks.classList.remove('mobile-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
  }
  function toggleMobileNav(){
    var open = navLinks.classList.toggle('mobile-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  navToggle.addEventListener('click', toggleMobileNav);
  navLinks.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeMobileNav);
  });
  window.addEventListener('resize', function(){
    if(window.innerWidth > 760) closeMobileNav();
  });
})();
</script>

</body>
</html>
`;
}

module.exports = { renderDirectory };
