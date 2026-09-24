const { getPlayer, getViews } = require("./_lib/blobs");
const { checkPlayerToken, verifySessionCookie } = require("./_lib/auth");

function esc(s) {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const FIELDS = [
  ["Player Info", [
    ["playerName", "Player Full Name", "text"],
    ["jerseyNumber", "Jersey Number", "text"],
    ["highSchool", "High School", "text"],
    ["gradYear", "Class Of (Graduation Year)", "text"],
    ["position", "Position", "text"],
  ]],
  ["Contact Information", [
    ["playerPhone", "Player Phone", "text"],
    ["playerEmail", "Player Email", "text"],
    ["guardianName", "Parent Or Guardian Name", "text"],
    ["guardianPhone", "Parent Or Guardian Phone", "text"],
    ["guardianEmail", "Parent Or Guardian Email", "text"],
  ]],
  ["Academic Info", [
    ["gpa", "GPA", "text"],
    ["sat", "SAT", "text"],
    ["act", "ACT", "text"],
    ["dualEnrollment", "Dual Enrollment", "text"],
  ]],
  ["Measurables", [
    ["height", "Height", "text"],
    ["weight", "Weight", "text"],
    ["standingReach", "Standing Reach", "text"],
    ["wingspan", "Wingspan", "text"],
    ["shoeSize", "Shoe Size", "text"],
  ]],
  ["Athletic Testing", [
    ["standingVertical", "Standing Vertical", "text"],
    ["maxVertical", "Max Vertical", "text"],
    ["benchDeadliftSquat", "Bench / Squat / Deadlift", "text"],
    ["laneAgility", "Lane Agility", "text"],
    ["shuttleRun", "Shuttle Run (3/4 Court)", "text"],
    ["threeQtrSprint", "Three Qtr Sprint", "text"],
  ]],
  ["Film & Social Links", [
    ["maxpreps", "MaxPreps", "text"],
    ["hudl", "Hudl", "text"],
    ["fieldlevel", "FieldLevel", "text"],
    ["prepgirlshoops", "Prep Girls Hoops", "text"],
    ["instagram", "Instagram", "text"],
    ["twitter", "X / Twitter", "text"],
    ["youtube", "YouTube (Highlights / Game Film)", "text"],
  ]],
  ["College Interest", [
    ["currentOffers", "Current Offers (one per line)", "textarea"],
    ["ncaaId", "NCAA ID Number", "text"],
  ]],
  ["Accolades and Awards", [
    ["message", "Accolades and Awards", "textarea"],
  ]],
];

const SEASONS = ["Freshman", "Sophomore", "Junior", "Senior"];
const STAT_COLS = [
  ["PPG", "PPG"],
  ["Rebounds", "Rebounds"],
  ["Steals", "Steals"],
  ["Blocks", "Blocks"],
  ["Assists", "Assists"],
  ["TotalPoints", "Total Points"],
];

function invalidPage(message) {
  return {
    statusCode: 403,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Edit Link Invalid</title>
<style>body{background:#150a28;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px;}
.card{border:1px solid rgba(255,255,255,0.12);background:#241640;border-radius:16px;padding:32px;max-width:420px;}</style>
</head><body><div class="card"><h2>Link Not Valid</h2><p>${esc(message)}</p></div></body></html>`,
  };
}

exports.handler = async (event) => {
  const qs = event.queryStringParameters || {};
  let slug = qs.slug;
  const token = qs.token;

  let player = null;
  let viaSession = false;

  if (slug && token) {
    player = await getPlayer(slug);
    if (!checkPlayerToken(player, token)) {
      return invalidPage("This edit link is invalid or has expired. Ask your coach for a fresh link.");
    }
  } else {
    const sessionSlug = verifySessionCookie(event.headers.cookie || event.headers.Cookie);
    if (!sessionSlug) {
      return {
        statusCode: 302,
        headers: { Location: "/player-login" },
        body: "",
      };
    }
    slug = sessionSlug;
    player = await getPlayer(slug);
    viaSession = true;
    if (!player) {
      return invalidPage("We couldn't find your player record. Ask your coach for help.");
    }
  }

  const views = await getViews(slug);
  const viewsBlock = `<div class="stat-num">${views.toLocaleString()}</div><div class="stat-label">Total page views</div>`;

  const sections = FIELDS.map(([title, fields]) => {
    const rows = fields.map(([key, label, type]) => {
      const val = esc(player[key]);
      if (type === "textarea") {
        return `<div class="form-field"><label>${esc(label)}</label><textarea id="f_${key}" rows="3">${val}</textarea></div>`;
      }
      return `<div class="form-field"><label>${esc(label)}</label><input id="f_${key}" value="${val}"></div>`;
    }).join("\n");
    return `<div class="section-title">${esc(title)}</div><div class="form-grid">${rows}</div>`;
  }).join("\n");

  const statTable = `
    <div class="section-title">Season Stats</div>
    <div class="section-sub">Leave any year blank if she hasn't played it yet.</div>
    <div class="stat-table-wrap">
      <table class="stat-table">
        <thead><tr><th>Season</th>${STAT_COLS.map(([, l]) => `<th>${esc(l)}</th>`).join("")}</tr></thead>
        <tbody>
          ${SEASONS.map((season) => `<tr><td>${season}</td>${STAT_COLS.map(([key]) => {
            const field = `stat${season}${key}`;
            return `<td><input id="f_${field}" value="${esc(player[field])}"></td>`;
          }).join("")}</tr>`).join("\n")}
        </tbody>
      </table>
    </div>`;

  const allFieldIds = [
    ...FIELDS.flatMap(([, fields]) => fields.map(([key]) => key)),
    ...SEASONS.flatMap((season) => STAT_COLS.map(([key]) => `stat${season}${key}`)),
    "playerPhoto",
  ];

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
    body: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Edit Your Page | ${esc(player.playerName || "Player")}</title>
<meta name="robots" content="noindex, nofollow">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Poppins:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  :root{ --violet:#1E1035; --violet-deep:#150a28; --panel:#241640; --panel-2:#2c1a4d;
    --line:rgba(255,255,255,0.12); --white:#FFFFFF; --dim:rgba(255,255,255,0.68);
    --magenta:#FF2E93; --teal:#00F5D4; }
  *{box-sizing:border-box;}
  body{margin:0;background:var(--violet);color:var(--white);font-family:'Poppins',sans-serif;padding:24px 16px 60px;}
  .wrap{max-width:760px;margin:0 auto;}
  h1{font-family:'Fredoka',sans-serif;font-size:26px;margin-bottom:4px;}
  .sub{color:var(--dim);font-size:14px;margin-bottom:24px;}
  .section-title{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--teal);margin:26px 0 4px;}
  .section-sub{font-size:12px;color:var(--dim);margin-bottom:4px;}
  .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;}
  @media (max-width:640px){ .form-grid{grid-template-columns:1fr;} }
  .form-field{display:flex;flex-direction:column;gap:5px;}
  .form-field label{font-size:11.5px;color:var(--dim);font-weight:600;}
  .form-field input,.form-field textarea{
    background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:9px 12px;color:var(--white);font-family:'Poppins',sans-serif;font-size:13.5px;
  }
  .stat-table-wrap{margin-top:12px;overflow-x:auto;border:1px solid var(--line);border-radius:14px;}
  table.stat-table{border-collapse:collapse;width:100%;min-width:560px;}
  table.stat-table th,table.stat-table td{padding:8px 8px;border-bottom:1px solid var(--line);text-align:left;}
  table.stat-table th{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.05em;text-transform:uppercase;color:var(--teal);font-weight:600;background:var(--panel);}
  table.stat-table td:first-child{background:var(--panel-2);font-weight:600;font-size:12.5px;}
  table.stat-table td input{width:100%;background:var(--violet-deep);border:1px solid var(--line);border-radius:8px;padding:6px 7px;color:var(--white);font-size:12.5px;font-family:'IBM Plex Mono',monospace;}
  .photo-row{display:flex;align-items:center;gap:14px;margin-top:10px;}
  #photoPreview{width:64px;height:64px;object-fit:cover;border-radius:8px;background:var(--panel-2);display:none;}
  .btn{display:inline-block;padding:12px 22px;font-weight:700;font-size:13px;letter-spacing:0.03em;border-radius:999px;border:none;cursor:pointer;}
  .btn.primary{background:var(--magenta);color:var(--white);margin-top:28px;}
  #status{margin-top:14px;font-size:13.5px;color:var(--dim);}
  .stat-card{border:1px solid var(--line);background:var(--panel);border-radius:16px;padding:20px 22px;margin-bottom:20px;}
  .stat-num{font-family:'IBM Plex Mono',monospace;font-size:32px;font-weight:700;color:var(--teal);}
  .stat-label{font-size:12.5px;color:var(--dim);margin-top:4px;}
  .upsell-card{border:1px solid var(--magenta);background:linear-gradient(135deg, rgba(255,46,147,0.12), rgba(0,245,212,0.06));border-radius:16px;padding:22px 24px;margin-bottom:28px;}
  .upsell-title{font-family:'Fredoka',sans-serif;font-size:18px;font-weight:700;margin-bottom:8px;}
  .upsell-card p{font-size:13.5px;color:var(--dim);line-height:1.5;margin:0 0 14px;}
  .upsell-btn{background:var(--magenta);color:var(--white);text-decoration:none;font-size:13px;font-weight:700;padding:11px 20px;border-radius:999px;letter-spacing:0.02em;}
</style>
</head>
<body>
<div class="wrap">
  <h1>Edit Your Page</h1>
  <div class="sub">Update your info below, then save. Changes go live on your page right away.</div>

  <div class="stat-card">${viewsBlock}</div>

  <div class="upsell-card">
    <div class="upsell-title">Want More From Your Page?</div>
    <p>Premium Profile Showcase adds a full custom player website, professional photography, and a highlight video built around your season. Ask your coach about upgrading.</p>
    <a class="upsell-btn" href="/index.html#pricing" target="_blank" rel="noopener">See Premium Details &#8599;</a>
  </div>

  <div class="stat-card">
    <div class="section-title" style="margin-top:0;">${player.passwordHash ? "Change Your Password" : "Create A Password"}</div>
    ${player.passwordHash ? "" : `<div class="section-sub">Set a password once so you can log in anytime at /player-login without needing this link again.</div>`}
    <div class="form-grid" style="margin-top:12px;">
      <div class="form-field"><label>New Password</label><input type="password" id="newPassword"></div>
      <div class="form-field"><label>Confirm Password</label><input type="password" id="confirmPassword"></div>
    </div>
    <button type="button" class="btn" id="btnSetPassword" style="margin-top:14px;background:var(--panel-2);color:var(--white);border:1px solid var(--line);">${player.passwordHash ? "Update Password" : "Create Password"}</button>
    <div id="passwordStatus" style="margin-top:10px;font-size:13px;color:var(--dim);"></div>
    ${viaSession ? `<div style="margin-top:14px;"><a href="/player-logout" style="color:var(--dim);font-size:12.5px;">Log out</a></div>` : ""}
  </div>

  <form id="editForm">
    ${sections}
    ${statTable}
    <div class="section-title">Photo</div>
    <div class="photo-row">
      <img id="photoPreview" src="${esc(player.playerPhoto || "")}" style="${player.playerPhoto ? "display:block;" : ""}">
      <input type="file" id="f_playerPhotoFile" accept="image/*">
    </div>
    <input type="hidden" id="f_playerPhoto" value="${esc(player.playerPhoto)}">
    <button type="submit" class="btn primary">Save Changes</button>
    <div id="status"></div>
  </form>
</div>
<script>
(function(){
  "use strict";
  var slug = ${JSON.stringify(slug)};
  var token = ${JSON.stringify(token)};
  var fieldIds = ${JSON.stringify(allFieldIds)};

  document.getElementById('f_playerPhotoFile').addEventListener('change', function(e){
    var file = e.target.files && e.target.files[0];
    if(!file) return;
    var status = document.getElementById('status');
    status.textContent = 'Uploading photo...';
    var reader = new FileReader();
    reader.onload = function(){
      var base64 = reader.result.split(',')[1];
      fetch('/.netlify/functions/admin-photo-upload', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ slug: slug + '-' + Date.now(), token: token, contentType: file.type, dataBase64: base64 })
      }).then(function(r){
        if(!r.ok) return r.text().then(function(t){ throw new Error(t); });
        return r.json();
      }).then(function(res){
        document.getElementById('f_playerPhoto').value = res.url;
        document.getElementById('photoPreview').src = res.url;
        document.getElementById('photoPreview').style.display = 'block';
        status.textContent = 'Photo uploaded.';
      }).catch(function(err){
        status.textContent = 'Error uploading photo: ' + err.message;
      });
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btnSetPassword').addEventListener('click', function(){
    var pwStatus = document.getElementById('passwordStatus');
    var pw = document.getElementById('newPassword').value;
    var confirm = document.getElementById('confirmPassword').value;
    if(pw.length < 6){
      pwStatus.textContent = 'Password must be at least 6 characters.';
      return;
    }
    if(pw !== confirm){
      pwStatus.textContent = 'Passwords do not match.';
      return;
    }
    pwStatus.textContent = 'Saving...';
    fetch('/set-player-password', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ slug: slug, token: token, password: pw })
    }).then(function(r){
      if(!r.ok) return r.text().then(function(t){ throw new Error(t); });
      return r.json();
    }).then(function(){
      pwStatus.textContent = 'Password saved. You can log in at /player-login from now on.';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
    }).catch(function(err){
      pwStatus.textContent = 'Error: ' + err.message;
    });
  });

  document.getElementById('editForm').addEventListener('submit', function(e){
    e.preventDefault();
    var status = document.getElementById('status');
    var data = { slug: slug, token: token };
    fieldIds.forEach(function(f){
      var el = document.getElementById('f_' + f);
      if(el) data[f] = el.value;
    });
    status.textContent = 'Saving...';
    fetch('/save-player', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    }).then(function(r){
      if(!r.ok) return r.text().then(function(t){ throw new Error(t); });
      return r.json();
    }).then(function(){
      status.textContent = 'Saved. Your page is up to date.';
    }).catch(function(err){
      status.textContent = 'Error saving: ' + err.message;
    });
  });
})();
</script>
</body>
</html>
`,
  };
};
