const fs = require("fs");
const path = require("path");
const { getSchoolColors } = require("./school-colors");

const TEMPLATE_PATH = path.join(__dirname, "illumination-index-template.html");

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
function firstName(name) {
  return String(name || "").trim().split(/\s+/)[0] || "Player";
}
function lastName(name) {
  const parts = String(name || "").trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}
function hexToRgb(hex) {
  const m = String(hex || "").replace("#", "").match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 227, g: 27, b: 35 };
}
function lighten(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c) => Math.round(c + (255 - c) * amt);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
function toRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const SEASONS = [
  { key: "Freshman", label: "Freshman" },
  { key: "Sophomore", label: "Sophomore" },
  { key: "Junior", label: "Junior" },
  { key: "Senior", label: "Senior" },
];

function seasonRows(p) {
  return SEASONS.map((s) => ({
    label: s.label,
    ppg: p[`stat${s.key}PPG`] || "",
    rebounds: p[`stat${s.key}Rebounds`] || "",
    steals: p[`stat${s.key}Steals`] || "",
    assists: p[`stat${s.key}Assists`] || "",
    blocks: p[`stat${s.key}Blocks`] || "",
    totalPoints: p[`stat${s.key}TotalPoints`] || "",
  })).filter((r) => r.ppg || r.rebounds || r.steals || r.assists || r.blocks || r.totalPoints);
}

function buildScheduleGames(player) {
  if (!Array.isArray(player.scheduleGames)) return [];
  return player.scheduleGames
    .filter((g) => g && g.date && g.opp)
    .map((g) => {
      const game = { date: g.date, opp: g.opp, loc: g.loc || "TBD", time: g.time || "TBD" };
      if (g.note) game.note = g.note;
      if (g.tag) game.tag = g.tag;
      if (g.result) game.result = g.result;
      return game;
    });
}

function buildWriteups(player) {
  if (!Array.isArray(player.writeups)) return [];
  return player.writeups
    .filter((w) => w && w.title)
    .map((w) => {
      const writeup = { kind: w.kind || "Article", title: w.title, source: w.source || "", date: w.date || "" };
      if (w.excerpt) writeup.excerpt = w.excerpt;
      if (w.url) {
        writeup.url = w.url;
      } else if (w.body) {
        writeup.body = String(w.body).split(/\r?\n\r?\n+/).map((p) => p.trim()).filter(Boolean);
      }
      return writeup;
    });
}

function offerRows(p) {
  return String(p.currentOffers || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function buildStats(player) {
  const rows = seasonRows(player);
  const latest = rows[rows.length - 1];
  const careerPoints = rows.reduce((sum, r) => sum + (parseFloat(r.totalPoints) || 0), 0);

  const stats = {
    seasonLabel: latest ? latest.label : "Upcoming",
    averages: latest
      ? [
          { v: latest.ppg || "0.0", l: "Points", hot: true, count: true },
          { v: latest.rebounds || "0.0", l: "Rebounds", count: true },
          { v: latest.steals || "0.0", l: "Steals", count: true },
          { v: latest.assists || "0.0", l: "Assists", count: true },
          { v: latest.blocks || "0.0", l: "Blocks", count: true },
        ]
      : [
          { v: "0.0", l: "Points", hot: true, count: true },
          { v: "0.0", l: "Rebounds", count: true },
          { v: "0.0", l: "Steals", count: true },
          { v: "0.0", l: "Assists", count: true },
          { v: "0.0", l: "Blocks", count: true },
        ],
    table: {
      columns: SEASONS.map((s) => s.label),
      rows: [
        ["Points", ...SEASONS.map((s) => player[`stat${s.key}PPG`] || "")],
        ["Rebounds", ...SEASONS.map((s) => player[`stat${s.key}Rebounds`] || "")],
        ["Steals", ...SEASONS.map((s) => player[`stat${s.key}Steals`] || "")],
        ["Assists", ...SEASONS.map((s) => player[`stat${s.key}Assists`] || "")],
        ["Blocks", ...SEASONS.map((s) => player[`stat${s.key}Blocks`] || "")],
        ["Total points", ...SEASONS.map((s) => player[`stat${s.key}TotalPoints`] || "")],
      ],
    },
  };
  if (careerPoints > 0) {
    stats.total = { v: String(careerPoints), text: `career points through ${rows.length} varsity season${rows.length === 1 ? "" : "s"}.` };
  }
  return stats;
}

function buildSiteConfig(player) {
  const name = player.playerName || "";
  const first = firstName(name);
  const last = lastName(name);
  const colors = getSchoolColors(player.highSchool);
  const school = player.highSchool || "";
  const gradYear = player.gradYear || "";
  const offers = offerRows(player);
  const latestStats = buildStats(player);

  return {
    player: {
      first,
      last,
      number: player.jerseyNumber || "",
      position: player.position || "Guard",
      school,
      schoolShort: school,
      location: "",
      classYear: gradYear,
      height: player.height || "",
      team: school ? `${school} Basketball` : "Her Team",
      program: school ? `${school} Basketball` : "Her Program",
    },
    theme: { accent: colors.accent, accent2: lighten(colors.accent, 0.35), glow: toRgba(colors.accent, 0.4) },
    media: { dashboard: "https://elevateherhoopsreport.com", slug: player.slug },
    bio: player.aboutParagraph1 || `${first} plays ${player.position || "basketball"} for ${school}, class of ${gradYear}.`,
    stats: latestStats,
    testingNote: "Testing numbers post here as soon as they are recorded.",
    measurables: [
      { k: "Height", v: player.height || "" },
      { k: "Wingspan", v: player.wingspan || "" },
      { k: "Shoe size", v: player.shoeSize || "" },
      { k: "Weight", v: player.weight || "" },
      { k: "Standing reach", v: "" },
    ],
    testing: [
      { k: "Standing vertical", v: player.standingVertical || "" },
      { k: "Max vertical", v: player.maxVertical || "" },
      { k: "Bench / Squat / Deadlift", v: player.benchDeadliftSquat || "" },
      { k: "Lane agility", v: player.laneAgility || "" },
      { k: "Shuttle run", v: player.shuttleRun || "" },
      { k: "Three quarter sprint", v: player.threeQtrSprint || "" },
    ],
    academics: [
      { k: "GPA", v: player.gpa || "" },
      { k: "SAT", v: player.sat || "" },
      { k: "ACT", v: player.act || "" },
      { k: "Dual enrollment", v: player.dualEnrollment || "" },
      { k: "NCAA ID", v: player.ncaaId || "" },
      { k: "Current offers", v: offers.length ? offers.join(", ") : "" },
    ],
    academicsNote: "College coaches can request transcripts and academic details through the contact request below.",
    film: {
      links: [
        { name: "Hudl", desc: "Full game film and highlights", url: player.hudl || "" },
        { name: "Field Level", desc: "Recruiting profile", url: player.fieldlevel || "" },
        { name: "MaxPreps", desc: "Box scores and season stats", url: player.maxpreps || "" },
        { name: "Prep Girls Hoops", desc: "Scouting profile", url: player.prepgirlshoops || "" },
        { name: "YouTube", desc: "Highlights and game film", url: player.youtube || "" },
      ],
    },
    schedule: {
      title: player.scheduleTitle || "Season Schedule",
      note: "Times and locations can change, so check with the school before you travel.",
      games: buildScheduleGames(player),
    },
    writeups: buildWriteups(player),
    nil: {
      intro: player.aboutParagraph2 || `${first} is open to NIL partnerships with local businesses and brands that share her values. Every opportunity is reviewed with her family.`,
      rules: [
        "Send an inquiry with the opportunity, dates and compensation.",
        "Every inquiry is reviewed with her family, who make the final decision.",
        "Following state association rules, partner content may not use school names, logos, uniforms or facilities, and deals cannot be tied to recruiting or athletic performance.",
      ],
    },
    contact: {
      approver: "Her family",
      email: "coachthaynes@gmail.com",
      people: [
        { role: "Player", who: name || "TBD", detail: "Phone and email on request" },
        { role: "Parent or guardian", who: player.guardianName || "TBD", detail: "Phone on request" },
        { role: "Head Coach", who: player.coachName || "TBD", detail: "Phone and email on request" },
      ],
    },
    photos: [],
  };
}

function renderIlluminationSite(player) {
  const site = buildSiteConfig(player);
  const name = player.playerName || "";
  const school = player.highSchool || "";
  const desc = `Recruiting profile for ${name}, #${player.jerseyNumber || ""} ${player.position || "player"} at ${school}. Vitals, season stats, highlight film, NIL partnerships and licensed photos.`;

  let html = fs.readFileSync(TEMPLATE_PATH, "utf8");
  html = html.replace('href="illumination.css"', 'href="/illumination-assets/illumination.css"');
  html = html.replace('<script src="illumination.js"></script>', '<script src="/illumination-assets/illumination.js"></script>');
  html = html.replace('<script src="site.js"></script>', `<script>window.SITE = ${JSON.stringify(site)};</script>`);
  html = html.replace("<title>Player Profile</title>", `<title>${esc(name)} #${esc(player.jerseyNumber || "")}</title>`);
  html = html.replace('<meta name="description" content="">', `<meta name="description" content="${esc(desc)}">`);
  html = html.replace('<meta property="og:title" content="">', `<meta property="og:title" content="${esc(name)} #${esc(player.jerseyNumber || "")} | ${esc(school)}">`);
  html = html.replace('<meta property="og:description" content="">', `<meta property="og:description" content="${esc(desc)}">`);
  html = html.replace('<meta property="og:image" content="media/poster.jpg">', '<meta property="og:image" content="">');
  html = html.replace(
    '<video id="heroVideo" autoplay muted loop playsinline preload="auto" poster="media/poster.jpg">\n        <source src="media/highlight.mp4" type="video/mp4">\n        <source src="media/highlight.webm" type="video/webm">\n      </video>',
    '<video id="heroVideo" autoplay muted loop playsinline preload="auto"></video>'
  );
  return html;
}

module.exports = { renderIlluminationSite };
