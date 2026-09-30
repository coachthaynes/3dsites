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

const SEASONS = [
  { key: "Freshman", label: "Freshman" },
  { key: "Sophomore", label: "Sophomore" },
  { key: "Junior", label: "Junior" },
  { key: "Senior", label: "Senior" },
];
const STAT_COLS = ["PPG", "Rebounds", "Steals", "Blocks", "Assists"];

function seasonRows(p) {
  return SEASONS.map((s) => {
    const cells = STAT_COLS.map((c) => p[`stat${s.key}${c}`] || "");
    return { label: s.label, cells, hasAny: cells.some(Boolean) };
  }).filter((r) => r.hasAny);
}

function latestStatStrip(p) {
  const rows = seasonRows(p);
  const latest = rows[rows.length - 1];
  if (!latest) return null;
  return [
    { value: latest.cells[0], label: "PPG" },
    { value: latest.cells[1], label: "Rebounds" },
    { value: latest.cells[2], label: "Steals" },
    { value: latest.cells[3], label: "Blocks" },
    { value: latest.cells[4], label: "Assists" },
  ].filter((s) => s.value);
}

function offerRows(p) {
  return String(p.currentOffers || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function videoSources(list) {
  return (list || []).map((s) => `<source src="${esc(s.url)}" type="${esc(s.type)}">`).join("");
}

function linkPill(url, label) {
  if (!url) return "";
  return `<a class="link-pill" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} &nbsp; &#8599;</a>`;
}

function renderIlluminationSite(player, feed) {
  const colors = getSchoolColors(player.highSchool);
  const name = player.playerName || "";
  const fn = firstName(name);
  const ln = lastName(name);
  const school = player.highSchool || "";
  const gradYear = player.gradYear || "";
  const poster = (feed && feed.poster) || (feed && feed.portrait) || "";
  const actionPhoto = (feed && feed.portrait) || poster || "";
  const heroVideoSrc = videoSources(feed && feed.hero);
  const filmClips = (feed && feed.film) || [];
  // This is the Illumination template (auto-built from Madi), not the hand-built
  // Elite template, so both NIL and editorial photos from Madi's vault show here.
  const vault = (feed && feed.photos) || [];
  const kit = (feed && feed.kit) || [];

  const statStrip = latestStatStrip(player);
  const rows = seasonRows(player);
  const offers = offerRows(player);
  const tags = [player.tag1, player.tag2, player.tag3].filter(Boolean);
  if (tags.length === 0 && player.position) tags.push(player.position);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(name)} | ${esc(school)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --black:#0a0a0a; --panel:#151515; --red:${colors.accent}; --red-dark:${colors.accentDark};
    --white:#f5f5f3; --line:#2a2a2a; --gray:#9a9a9a;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{background:var(--black);color:var(--white);font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
  .display{font-family:'Anton',sans-serif;text-transform:uppercase;letter-spacing:0.01em;line-height:0.92;}
  a{color:inherit;text-decoration:none;}
  .wrap{max-width:1100px;margin:0 auto;padding:0 28px;}
  .rule{height:1px;background:var(--line);width:100%;}
  nav{position:sticky;top:0;z-index:50;background:rgba(10,10,10,0.92);backdrop-filter:blur(6px);border-bottom:1px solid var(--line);}
  nav .wrap{display:flex;align-items:center;justify-content:space-between;height:64px;}
  .nav-name{font-family:'Anton',sans-serif;font-size:20px;letter-spacing:0.03em;text-transform:uppercase;}
  .nav-name span{color:var(--red);}
  .nav-links{display:flex;gap:26px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;}
  .nav-links a{color:var(--gray);transition:color .2s;}
  .nav-links a:hover{color:var(--white);}
  @media (max-width:640px){ .nav-links{gap:16px;font-size:11px;} }
  .hero{position:relative;display:grid;grid-template-columns:1.05fr 0.95fr;align-items:stretch;min-height:640px;border-bottom:1px solid var(--line);}
  .hero-text{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center;padding:64px 48px;}
  .hero-eyebrow{color:var(--red);font-weight:700;font-size:14px;letter-spacing:0.06em;margin-bottom:14px;}
  .hero h1{font-size:clamp(48px,7vw,92px);color:var(--white);}
  .hero h1 .num{color:var(--red);}
  .hero-sub{margin-top:18px;font-size:17px;color:var(--gray);max-width:36ch;line-height:1.5;}
  .hero-tags{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px;}
  .tag{border:1px solid var(--red);color:var(--red);padding:7px 14px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;}
  .hero-cta{margin-top:34px;display:flex;gap:14px;flex-wrap:wrap;}
  .btn{display:inline-block;padding:13px 22px;font-weight:700;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;border:1px solid var(--white);transition:all .2s;cursor:pointer;}
  .btn.primary{background:var(--red);border-color:var(--red);color:var(--white);}
  .btn.primary:hover{background:var(--red-dark);border-color:var(--red-dark);}
  .btn.ghost:hover{background:var(--white);color:var(--black);}
  .hero-photo{position:relative;overflow:hidden;background:#000;}
  .hero-photo img, .hero-photo video{width:100%;height:100%;object-fit:cover;object-position:top center;display:block;}
  .hero-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0) 24%);}
  @media (max-width:860px){
    .hero{grid-template-columns:1fr;min-height:auto;}
    .hero-photo{height:420px;order:-1;}
    .hero-photo::after{background:linear-gradient(180deg, rgba(10,10,10,0) 55%, rgba(10,10,10,1) 100%);}
    .hero-text{padding:40px 24px;}
  }
  .statstrip{background:var(--panel);border-bottom:1px solid var(--line);}
  .statstrip .wrap{display:grid;grid-template-columns:repeat(${Math.max(statStrip ? statStrip.length : 1, 1)},1fr);text-align:center;}
  .stat-item{padding:30px 10px;border-left:1px solid var(--line);}
  .stat-item:first-child{border-left:none;}
  .stat-num{font-family:'Anton',sans-serif;font-size:clamp(28px,4vw,44px);color:var(--white);}
  .stat-label{font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--gray);margin-top:4px;}
  section{padding:80px 0;position:relative;}
  .section-head{margin-bottom:44px;max-width:60ch;}
  .section-head .display{font-size:clamp(30px,4vw,46px);color:var(--white);}
  .section-head p{color:var(--gray);margin-top:12px;font-size:15px;line-height:1.6;}
  .about-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:56px;align-items:start;}
  .about-body p{color:#cfcfcf;font-size:16px;line-height:1.75;margin-bottom:16px;}
  .vitals{border:1px solid var(--line);background:var(--panel);}
  .vitals-row{display:flex;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--line);font-size:14px;}
  .vitals-row:last-child{border-bottom:none;}
  .vitals-row span:first-child{color:var(--gray);}
  .vitals-row span:last-child{font-weight:700;color:var(--white);}
  .vitals-title{padding:16px 20px;font-family:'Anton',sans-serif;letter-spacing:0.04em;background:var(--red);color:var(--white);font-size:15px;}
  @media (max-width:860px){ .about-grid{grid-template-columns:1fr;} }
  .skill-section{background:var(--panel);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
  .record-photo{border:1px solid var(--line);overflow:hidden;}
  .record-photo img{width:100%;display:block;}
  table.stats{width:100%;border-collapse:collapse;font-size:14px;}
  table.stats th, table.stats td{padding:16px 14px;text-align:center;border-bottom:1px solid var(--line);}
  table.stats th{font-family:'Anton',sans-serif;font-size:13px;letter-spacing:0.05em;color:var(--gray);text-transform:uppercase;font-weight:400;}
  table.stats td:first-child, table.stats th:first-child{text-align:left;font-weight:700;color:var(--white);}
  table.stats tbody tr:hover{background:rgba(208,32,44,0.06);}
  .table-wrap{border:1px solid var(--line);overflow-x:auto;}
  .video-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;}
  .video-frame{position:relative;width:100%;padding-top:56%;background:#000;border:1px solid var(--line);overflow:hidden;}
  .video-frame video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
  .photo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;}
  .recruit-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;}
  .offer-list{list-style:none;}
  .offer-list li{padding:16px 0;border-bottom:1px solid var(--line);font-size:16px;}
  .offer-list li:first-child{padding-top:0;}
  .contact-card{border:1px solid var(--line);background:var(--panel);padding:26px 28px;}
  .contact-card h4{font-family:'Anton',sans-serif;font-size:16px;letter-spacing:0.04em;margin-bottom:16px;}
  .contact-row{font-size:14px;color:#d5d5d5;margin-bottom:8px;}
  .contact-row span{color:var(--gray);}
  @media (max-width:860px){ .recruit-grid{grid-template-columns:1fr;} }
  footer{padding:64px 0 40px;border-top:1px solid var(--line);}
  .links-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:48px;}
  .link-pill{border:1px solid var(--line);padding:16px 18px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between;transition:all .2s;}
  .link-pill:hover{border-color:var(--red);color:var(--red);}
  .foot-bottom{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;color:var(--gray);font-size:13px;}
  .foot-bottom .brand{color:var(--white);font-weight:700;}
  @media (max-width:860px){ .links-grid{grid-template-columns:repeat(2,1fr);} }
  @media (max-width:480px){ .links-grid{grid-template-columns:1fr;} }
</style>
</head>
<body>

<nav>
  <div class="wrap">
    <div class="nav-name">${esc(name).toUpperCase()} ${player.jerseyNumber ? `<span>#${esc(player.jerseyNumber)}</span>` : ""}</div>
    <div class="nav-links">
      <a href="#about">About</a>
      ${rows.length ? '<a href="#stats">Stats</a>' : ""}
      ${filmClips.length ? '<a href="#highlights">Highlights</a>' : ""}
      <a href="#recruiting">Recruiting</a>
      <a href="#links">Links</a>
    </div>
  </div>
</nav>

<div class="hero">
  <div class="hero-text">
    <div class="hero-eyebrow">${esc(school)}${gradYear ? ` &middot; Class of ${esc(gradYear)}` : ""}</div>
    <h1 class="display">${esc(fn).toUpperCase()}${ln ? `<br>${esc(ln).toUpperCase()}` : ""} ${player.jerseyNumber ? `<span class="num">${esc(player.jerseyNumber)}</span>` : ""}</h1>
    <p class="hero-sub">${[player.position, school].filter(Boolean).map(esc).join(", ")}.</p>
    ${tags.length ? `<div class="hero-tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
    <div class="hero-cta">
      ${filmClips.length ? '<a class="btn primary" href="#highlights">Watch Highlights</a>' : ""}
      <a class="btn ghost" href="#links">All Links</a>
    </div>
  </div>
  <div class="hero-photo">
    ${heroVideoSrc ? `<video autoplay muted loop playsinline ${poster ? `poster="${esc(poster)}"` : ""}>${heroVideoSrc}</video>` : poster ? `<img src="${esc(poster)}" alt="${esc(name)}">` : ""}
  </div>
</div>

${statStrip && statStrip.length ? `<div class="statstrip"><div class="wrap">
  ${statStrip.map((s) => `<div class="stat-item"><div class="stat-num">${esc(s.value)}</div><div class="stat-label">${esc(s.label)}</div></div>`).join("")}
</div></div>` : ""}

<section id="about">
  <div class="wrap">
    <div class="about-grid">
      <div class="about-body">
        <div class="section-head" style="margin-bottom:24px;"><div class="display" style="font-size:clamp(28px,4vw,42px);">About ${esc(fn)}</div></div>
        ${player.aboutParagraph1 ? `<p>${esc(player.aboutParagraph1)}</p>` : ""}
        ${player.aboutParagraph2 ? `<p>${esc(player.aboutParagraph2)}</p>` : ""}
        ${!player.aboutParagraph1 && !player.aboutParagraph2 ? `<p style="color:var(--gray);">${esc(fn)} plays ${esc(player.position || "basketball")} for ${esc(school)}, class of ${esc(gradYear)}.</p>` : ""}
      </div>
      <div class="vitals">
        <div class="vitals-title">Vitals</div>
        ${[["Height", player.height], ["Weight", player.weight], ["Wingspan", player.wingspan], ["Shoe Size", player.shoeSize], ["Standing Vertical", player.standingVertical], ["GPA", player.gpa], ["Graduation Year", player.gradYear]]
          .filter(([, v]) => v)
          .map(([k, v]) => `<div class="vitals-row"><span>${esc(k)}</span><span>${esc(v)}</span></div>`)
          .join("")}
      </div>
    </div>
  </div>
</section>

${actionPhoto || player.skill1Title || player.skill2Title ? `<section id="game" class="skill-section">
  <div class="wrap">
    <div class="section-head"><div class="display">On The Court</div><p>What defines her game.</p></div>
    <div style="display:grid;grid-template-columns:${actionPhoto ? "1.2fr 0.8fr" : "1fr"};gap:40px;align-items:start;">
      ${player.skill1Title || player.skill2Title ? `<div>
        ${player.skill1Title ? `<div class="record-photo" style="border:none;padding:34px;background:var(--black);margin-bottom:28px;"><span style="font-family:'Anton',sans-serif;color:var(--red);font-size:15px;letter-spacing:0.08em;margin-bottom:14px;display:block;">Identity</span><h3 style="font-family:'Anton',sans-serif;font-size:26px;text-transform:uppercase;margin-bottom:12px;">${esc(player.skill1Title)}</h3><p style="color:#c8c8c8;font-size:15px;line-height:1.7;">${esc(player.skill1Body)}</p></div>` : ""}
        ${player.skill2Title ? `<div class="record-photo" style="border:none;padding:34px;background:var(--black);"><span style="font-family:'Anton',sans-serif;color:var(--red);font-size:15px;letter-spacing:0.08em;margin-bottom:14px;display:block;">Signature</span><h3 style="font-family:'Anton',sans-serif;font-size:26px;text-transform:uppercase;margin-bottom:12px;">${esc(player.skill2Title)}</h3><p style="color:#c8c8c8;font-size:15px;line-height:1.7;">${esc(player.skill2Body)}</p></div>` : ""}
      </div>` : ""}
      ${actionPhoto ? `<div class="record-photo"><img src="${esc(actionPhoto)}" alt="${esc(name)}"></div>` : ""}
    </div>
  </div>
</section>` : ""}

${rows.length ? `<section id="stats">
  <div class="wrap">
    <div class="section-head"><div class="display">Season Stats</div><p>Per game averages by season.</p></div>
    <div class="table-wrap"><table class="stats">
      <thead><tr><th>Season</th><th>PPG</th><th>Rebounds</th><th>Steals</th><th>Blocks</th><th>Assists</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${esc(r.label)}</td>${r.cells.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div>
  </div>
</section>` : ""}

${filmClips.length ? `<section id="highlights" class="skill-section">
  <div class="wrap">
    <div class="section-head"><div class="display">Highlight Film</div><p>Playable right here, no need to leave the page.</p></div>
    <div class="video-grid">
      ${filmClips.map((clip, i) => `<div class="video-frame"><video controls playsinline ${poster ? `poster="${esc(poster)}"` : ""}><source src="${esc(clip.url)}" type="${esc(clip.type)}"></video></div>`).join("")}
    </div>
  </div>
</section>` : ""}

${vault.length ? `<section id="photos">
  <div class="wrap">
    <div class="section-head"><div class="display">More Photos</div><p>A few more looks from this season.</p></div>
    <div class="photo-grid">
      ${vault.map((p) => `<a class="record-photo" href="${esc(p.large || p.src)}" target="_blank" rel="noopener" style="display:block;"><img src="${esc(p.thumb || p.src)}" alt="${esc(p.title || name)}"></a>`).join("")}
    </div>
  </div>
</section>` : ""}

<section id="recruiting">
  <div class="wrap">
    <div class="recruit-grid">
      <div>
        <div class="section-head" style="margin-bottom:24px;"><div class="display" style="font-size:clamp(28px,4vw,42px);">Recruiting</div></div>
        ${offers.length ? `<ul class="offer-list">${offers.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>` : ""}
        ${player.ncaaId ? `<div class="contact-row" style="margin-top:20px;"><span>NCAA ID </span>${esc(player.ncaaId)}</div>` : ""}
      </div>
      <div class="contact-card">
        <h4>Contact</h4>
        ${player.playerPhone ? `<div class="contact-row"><span>Player Phone </span>${esc(player.playerPhone)}</div>` : ""}
        ${player.playerEmail ? `<div class="contact-row"><span>Player Email </span>${esc(player.playerEmail)}</div>` : ""}
        ${player.coachName ? `<div class="rule" style="margin:16px 0;"></div><h4>Coach / Parent, ${esc(player.coachName)}</h4>` : ""}
        ${player.coachPhone ? `<div class="contact-row"><span>Phone </span>${esc(player.coachPhone)}</div>` : ""}
        ${player.coachEmail ? `<div class="contact-row"><span>Email </span>${esc(player.coachEmail)}</div>` : ""}
      </div>
    </div>
  </div>
</section>

<section id="news" style="display:none;" data-news-section>
  <div class="wrap">
    <div class="section-head"><div class="display" style="font-size:clamp(24px,3.4vw,34px);">Latest News</div></div>
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
        return '<div style="border:1px solid rgba(255,255,255,0.12);padding:20px 22px;border-radius:4px;">' +
          '<h4 style="margin-bottom:10px;">' + String(a.headline || '').replace(/</g,'&lt;') + '</h4>' + paras +
        '</div>';
      }).join('');
      section.style.display = '';
    })
    .catch(function(){});
})();
</script>

<footer id="links">
  <div class="wrap">
    <div class="section-head"><div class="display" style="font-size:clamp(24px,3.4vw,34px);">Follow Along And Watch More Film</div></div>
    <div class="links-grid">
      ${linkPill(player.instagram, "Instagram")}
      ${linkPill(player.twitter, "X / Twitter")}
      ${linkPill(player.youtube, "YouTube")}
      ${linkPill(player.hudl, "Hudl")}
      ${linkPill(player.fieldlevel, "Field Level")}
      ${linkPill(player.maxpreps, "MaxPreps")}
      ${linkPill(player.prepgirlshoops, "Prep Girls Hoops")}
      ${kit.map((k) => linkPill(k.download || k.url, k.title || "Marketing Kit")).join("")}
      ${player.playerEmail ? `<a class="link-pill" href="mailto:${esc(player.playerEmail)}">Email ${esc(fn)} &nbsp; &#8599;</a>` : ""}
      <a class="link-pill" href="/players-directory.html">Elevate Her Hoops &nbsp; &#8599;</a>
    </div>
    <div class="rule" style="margin-bottom:24px;"></div>
    <div class="foot-bottom">
      <div><span class="brand">${esc(name)}</span>${school ? ` &middot; ${esc(school)}` : ""}${gradYear ? ` &middot; Class of ${esc(gradYear)}` : ""}</div>
    </div>
  </div>
</footer>

</body>
</html>
`;
}

module.exports = { renderIlluminationSite };
