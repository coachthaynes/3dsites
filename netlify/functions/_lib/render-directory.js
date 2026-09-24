const CSS = require("./directory-css");

function esc(s) {
  if (s === undefined || s === null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderDirectory(players) {
  const published = (players || []).filter((p) => p.status !== "draft" && p.playerName);
  const middleburgLinks = published
    .map((p) => `          <a href="players/${esc(p.slug)}">${esc(p.playerName)} &#8599;</a>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Player Directory, Elevate Her Hoops Report</title>
<meta name="description" content="Public high schools with girls varsity basketball programs in Duval, Clay, and St. Johns counties, Florida. Player profiles go live here as they join Elevate Her.">
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
    <div class="display">Girls Varsity Basketball, Duval, Clay, And St. Johns Counties</div>
    <p>A working directory of public high schools with girls varsity basketball programs across three Northeast Florida counties. As players join Elevate Her, their profile goes live under their school, like Aiyana Haynes and Kennedy Jeffress at Middleburg below.</p>
    <div class="data-note">
      <strong>About this page.</strong> School names are pulled from official district sources and cross checked against FHSAA and MaxPreps. We are not publishing individual student roster names here. Each school links out to its own public MaxPreps team page. Any player name listed under a school has signed up for an Elevate Her package.
    </div>
    <div class="county-nav">
      <a class="county-pill" href="#duval">Duval County, 17 Schools</a>
      <a class="county-pill" href="#clay">Clay County, 7 Schools</a>
      <a class="county-pill" href="#stjohns">St. Johns County, 8 Schools</a>
    </div>
  </div>
</div>

<section class="county" id="duval">
  <div class="wrap">
    <div class="county-head">
      <div class="display">Duval County</div>
      <span class="county-count mono">17 schools</span>
    </div>
    <p class="county-intro">Jacksonville area public high schools.</p>
    <div class="school-grid">
      <div class="school-card"><span class="school-name">Andrew Jackson High School</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/andrew-jackson-tigers/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Atlantic Coast High School</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/atlantic-coast-stingrays/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Baldwin Middle-Senior High School</span><a class="school-link" href="https://www.maxpreps.com/fl/baldwin/baldwin-indians/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Edward H. White High School</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/ed-white-commanders/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Englewood High School</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/englewood-rams/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">First Coast High School</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/first-coast-buccaneers/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Duncan U. Fletcher High School</span><a class="school-link" href="https://www.maxpreps.com/fl/neptune-beach/fletcher-senators/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Mandarin High School</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/mandarin-mustangs/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Paxon School for Advanced Studies</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/paxon-school-for-advanced-studies-golden-eagles/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">William M. Raines High School</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/raines-vikings/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Jean Ribault High School</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/ribault-trojans/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Riverside High School</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/riverside-generals/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Sandalwood High School</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/sandalwood-mighty-saints/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Stanton College Preparatory School</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/stanton-blue-devils/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Terry Parker High School</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/parker-braves/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Westside High School</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/westside-wolverines/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Samuel W. Wolfson High School</span><a class="school-link" href="https://www.maxpreps.com/fl/jacksonville/wolfson-wolfpack/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
    </div>
  </div>
</section>

<section class="county" id="clay">
  <div class="wrap">
    <div class="county-head">
      <div class="display">Clay County</div>
      <span class="county-count mono">7 schools</span>
    </div>
    <p class="county-intro">Green Cove Springs, Middleburg, and Orange Park area public high schools.</p>
    <div class="school-grid">
      <div class="school-card"><span class="school-name">Clay High School</span><a class="school-link" href="https://www.maxpreps.com/fl/green-cove-springs/clay-blue-devils/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Fleming Island High School</span><a class="school-link" href="https://www.maxpreps.com/fl/orange-park/fleming-island-golden-eagles/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Keystone Heights Junior/Senior High School</span><a class="school-link" href="https://www.maxpreps.com/fl/keystone-heights/keystone-heights-indians/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>

      <div class="school-card has-live" style="grid-column: span 1;">
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
          <span class="school-name">Middleburg High School</span>
          <a class="school-link" href="https://www.maxpreps.com/fl/middleburg/middleburg-broncos/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a>
        </div>
        <div class="live-block">
          <a href="aiyana-haynes.html">Aiyana Haynes &#8599;</a>
          <a href="kennedy-jeffress.html">Kennedy Jeffress &#8599;</a>
${middleburgLinks}
        </div>
      </div>

      <div class="school-card"><span class="school-name">Oakleaf High School</span><a class="school-link" href="https://www.maxpreps.com/fl/orange-park/oakleaf-knights/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Orange Park High School</span><a class="school-link" href="https://www.maxpreps.com/fl/orange-park/orange-park-raiders/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Ridgeview High School</span><a class="school-link" href="https://www.maxpreps.com/fl/orange-park/ridgeview-panthers/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
    </div>
  </div>
</section>

<section class="county" id="stjohns">
  <div class="wrap">
    <div class="county-head">
      <div class="display">St. Johns County</div>
      <span class="county-count mono">8 schools</span>
    </div>
    <p class="county-intro">St. Augustine and Ponte Vedra area public high schools.</p>
    <div class="school-grid">
      <div class="school-card"><span class="school-name">Allen D. Nease High School</span><a class="school-link" href="https://www.maxpreps.com/fl/ponte-vedra/nease-panthers/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Bartram Trail High School</span><a class="school-link" href="https://www.maxpreps.com/fl/st-johns/bartram-trail-bears/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Beachside High School</span><a class="school-link" href="https://www.maxpreps.com/fl/st-johns/beachside-barracudas/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Creekside High School</span><a class="school-link" href="https://www.maxpreps.com/fl/st-johns/creekside-knights/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Pedro Menendez High School</span><a class="school-link" href="https://www.maxpreps.com/fl/st-augustine/menendez-falcons/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Ponte Vedra High School</span><a class="school-link" href="https://www.maxpreps.com/fl/ponte-vedra/ponte-vedra-sharks/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">St. Augustine High School</span><a class="school-link" href="https://www.maxpreps.com/fl/st-augustine/st-augustine-yellow-jackets/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
      <div class="school-card"><span class="school-name">Tocoi Creek High School</span><a class="school-link" href="https://www.maxpreps.com/fl/st-augustine/tocoi-creek-toros/basketball/girls/" target="_blank" rel="noopener">Team page &#8599;</a></div>
    </div>
  </div>
</section>

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
