// Best-effort MaxPreps stat scrape. This is genuinely experimental: we have
// no way to verify MaxPreps' live page structure while building this (no
// outbound access from the dev environment), and many stat sites render
// their numbers client-side with JavaScript that a plain server-side fetch
// never sees. Every code path here is defensive on purpose, returning null
// on anything unexpected so the caller always has a safe fallback to the
// player's own on-file stats rather than surfacing a scrape error.

const cheerio = require("cheerio");

// Many players on this site play more than one sport, and MaxPreps profiles
// can bundle several sports together. These help both scrape strategies stay
// on her basketball numbers and skip past another sport's stat block.
const BASKETBALL_PATTERN = /basketball|bball/i;
const OTHER_SPORT_PATTERN = /\b(volleyball|soccer|track|cross.?country|softball|baseball|football|golf|tennis|swim(?:ming)?|wrestling|lacrosse|field hockey|gymnastics|cheer(?:leading)?)\b/i;
const SPORT_KEY = /^sport$|^sportname$|^sportslug$|^sporttype$/i;

function objectSportTag(obj) {
  for (const k of Object.keys(obj)) {
    if (SPORT_KEY.test(k) && typeof obj[k] === "string") return obj[k];
  }
  return null;
}

function isOtherSportTag(tag) {
  return Boolean(tag) && OTHER_SPORT_PATTERN.test(tag) && !BASKETBALL_PATTERN.test(tag);
}

// cheerio's plain .text() runs adjacent block elements together with no
// space ("...APGVolleyball..."), which can quietly merge two words into one
// and break \b word boundary matching across element edges. Spacing out
// block-level elements first keeps every word intact.
function extractSpacedText($) {
  $("div, p, li, tr, td, th, br, h1, h2, h3, h4, h5, h6").after(" ");
  return $("body").text().replace(/\s+/g, " ").trim();
}

// MaxPreps (and other modern Next.js sites) stream their page data as plain
// <script>self.__next_f.push([1,"..."])</script> tags rather than the older
// __NEXT_DATA__/application-json pattern this scraper originally looked for.
// The pushed string is the real content, already present in the HTML with no
// JavaScript execution needed, just concatenated oddly. Reassembling it here
// lets the rest of this file work the same way it would against a plain
// embedded JSON blob.
function extractNextFlightText($) {
  let combined = "";
  $("script").each((_, el) => {
    const content = $(el).contents().text().trim();
    const m = /^self\.__next_f\.push\((\[[\s\S]*\])\)\s*;?$/.exec(content);
    if (!m) return;
    try {
      const parsed = JSON.parse(m[1]);
      if (Array.isArray(parsed) && typeof parsed[1] === "string") combined += parsed[1];
    } catch (e) {
      // not a clean [1, "..."] push call, skip it
    }
  });
  return combined;
}

// Finds "key": then reads one balanced {...} or [...] value starting there,
// ignoring braces/brackets inside quoted strings. Used to pull a self
// contained JSON value out of a much larger, not fully parseable blob (the
// rest of a Next.js flight payload has its own reference syntax that is not
// valid JSON, so parsing the whole thing is not an option).
function extractBalancedJsonAfterKey(text, key) {
  const marker = `"${key}":`;
  const markerAt = text.indexOf(marker);
  if (markerAt === -1) return null;
  let i = markerAt + marker.length;
  while (i < text.length && /\s/.test(text[i])) i++;
  const openChar = text[i];
  if (openChar !== "{" && openChar !== "[") return null;
  const closeChar = openChar === "{" ? "}" : "]";
  const start = i;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === openChar) depth++;
    else if (c === closeChar) {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  try {
    return JSON.parse(text.slice(start, i));
  } catch (e) {
    return null;
  }
}

const GAME_STAT_HEADER_MAP = { PPG: "ppg", RPG: "rebounds", APG: "assists", SPG: "steals", BPG: "blocks", Pts: "totalPoints" };

// Walks every group/subgroup row in a MaxPreps careerRollup (Game Stats,
// Shooting, Totals, Misc Totals all describe the same seasons from different
// angles) and merges whichever of PPG/RPG/APG/SPG/BPG/Pts each row has into
// one record per season, keyed by class year + year + team level so the
// same season found in multiple groups merges into a single entry.
function mergeCareerRollupSeasons(careerRollup) {
  if (!careerRollup || !Array.isArray(careerRollup.groups)) return [];
  const bySeason = new Map();
  for (const group of careerRollup.groups) {
    for (const subgroup of group.subgroups || []) {
      for (const row of subgroup.stats || []) {
        const key = `${row.classYear || ""}|${row.year || ""}|${row.teamLevel || ""}`;
        if (!bySeason.has(key)) {
          bySeason.set(key, {
            source: "maxpreps-json",
            label: [row.classYear, row.year].filter(Boolean).join(" ") || row.season || null,
          });
        }
        const merged = bySeason.get(key);
        for (const stat of row.stats || []) {
          const field = GAME_STAT_HEADER_MAP[stat.header];
          if (field && stat.value) merged[field] = stat.value;
        }
      }
    }
  }
  return [...bySeason.values()].filter((s) => Object.keys(s).length > 2); // more than just source+label
}

// Tries the Next.js flight format first (what MaxPreps itself actually uses
// today), returning merged per-season stats, or null if this page doesn't
// look like that shape at all so the caller can fall back to other strategies.
function tryNextFlightCareerStats($) {
  const text = extractNextFlightText($);
  if (!text) return null;
  const statsCardProps = extractBalancedJsonAfterKey(text, "statsCardProps");
  if (!statsCardProps) return null;
  const sportTab = Array.isArray(statsCardProps.sportTabs) ? statsCardProps.sportTabs[0] : null;
  if (sportTab && isOtherSportTag(objectSportTag(sportTab))) return []; // confidently a different sport
  return mergeCareerRollupSeasons(statsCardProps.careerRollup);
}

async function fetchMaxPrepsStats(maxprepsUrl) {
  if (!maxprepsUrl) return null;

  let html;
  try {
    const res = await fetch(maxprepsUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ElevateHerHoopsBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch (e) {
    return null; // network error, timeout, or blocked request - fall back silently
  }

  try {
    const $ = cheerio.load(html);

    // Strategy 0: MaxPreps' own current page format, a Next.js flight payload.
    // This function wants just the most recent season; sorting the label's
    // year text (e.g. "25-26") descending works since these are always two
    // digit years within the same century.
    const flightSeasons = tryNextFlightCareerStats($);
    if (flightSeasons && flightSeasons.length) {
      const sorted = [...flightSeasons].sort((a, b) => String(b.label || "").localeCompare(String(a.label || "")));
      return sorted[0];
    }

    // Strategy 1: many modern sites embed structured JSON in a script tag
    // (Next.js __NEXT_DATA__, JSON-LD, etc). Look for anything that smells
    // like a stat line before falling back to visible text.
    let statsFromJson = null;
    $('script[type="application/json"], script#__NEXT_DATA__, script[type="application/ld+json"]').each((_, el) => {
      if (statsFromJson) return;
      try {
        const parsed = JSON.parse($(el).contents().text());
        const found = findStatsInObject(parsed);
        if (found) statsFromJson = found;
      } catch (e) {
        // not parseable JSON, or not the shape we're looking for; keep scanning
      }
    });
    if (statsFromJson) {
      return { source: "maxpreps-json", ...statsFromJson };
    }

    // Strategy 2: fall back to scanning visible text for "12.4 PPG"-style
    // patterns. Low confidence, but better than nothing when a page happens
    // to be server-rendered.
    const bodyText = extractSpacedText($);
    const ppgMatch = bodyText.match(/([\d.]+)\s*PPG/i);
    const rebMatch = bodyText.match(/([\d.]+)\s*(?:RPG|Rebounds)/i);
    const astMatch = bodyText.match(/([\d.]+)\s*(?:APG|Assists)/i);
    if (ppgMatch || rebMatch || astMatch) {
      return {
        source: "maxpreps-text",
        ppg: ppgMatch ? ppgMatch[1] : null,
        rebounds: rebMatch ? rebMatch[1] : null,
        assists: astMatch ? astMatch[1] : null,
      };
    }

    return null;
  } catch (e) {
    return null;
  }
}

// Best-effort MaxPreps CAREER stats pull: every season it can find, not
// just the most recent one. Same caveats as the single-season scrape above,
// just applied per season instead of once.
async function fetchMaxPrepsCareerStats(maxprepsUrl) {
  if (!maxprepsUrl) return [];

  let html;
  try {
    const res = await fetch(maxprepsUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ElevateHerHoopsBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    html = await res.text();
  } catch (e) {
    return [];
  }

  try {
    const $ = cheerio.load(html);

    // Strategy 0: MaxPreps' own current page format, a Next.js flight payload.
    const flightSeasons = tryNextFlightCareerStats($);
    if (flightSeasons && flightSeasons.length) return flightSeasons;

    // Strategy 1: an array of per-season objects embedded as structured JSON.
    let seasons = [];
    $('script[type="application/json"], script#__NEXT_DATA__, script[type="application/ld+json"]').each((_, el) => {
      if (seasons.length) return;
      try {
        const parsed = JSON.parse($(el).contents().text());
        const found = findCareerStatsInObject(parsed);
        if (found && found.length) seasons = found;
      } catch (e) {
        // not parseable JSON, or not the shape we're looking for; keep scanning
      }
    });
    if (seasons.length) {
      return seasons.map((s) => ({ source: "maxpreps-json", ...s }));
    }

    // Strategy 2: scan visible text for every "12.4 PPG" occurrence. Rebounds
    // and assists are expected to follow PPG within the same season's stat
    // line, so that search only looks forward, up to wherever the next
    // season's own PPG match starts, never past it. The label is expected to
    // come before PPG, so that search only looks backward, taking the
    // closest grade or year word it finds. Keeping each search one-directional
    // like this is what stops two seasons sitting close together in the text
    // from bleeding into each other's numbers.
    const bodyText = extractSpacedText($);
    const ppgMatches = [...bodyText.matchAll(/([\d.]+)\s*PPG/gi)].slice(0, 10);
    ppgMatches.forEach((match, i) => {
      const prev = ppgMatches[i - 1];
      const next = ppgMatches[i + 1];
      const backward = prev ? prev.index + prev[0].length : Math.max(0, match.index - 60);
      const forward = next ? next.index : Math.min(bodyText.length, match.index + 120);

      // Whichever sport name sits closest before this stat line, basketball or
      // something else, is the sport it belongs to. A wider window than the
      // label search above since a sport name is more likely to be a distant
      // section heading than something sitting right next to the number.
      const sportScanStart = prev ? prev.index + prev[0].length : Math.max(0, match.index - 400);
      const sportWindow = bodyText.slice(sportScanStart, match.index);
      const lastBasketballIdx = [...sportWindow.matchAll(new RegExp(BASKETBALL_PATTERN.source, "gi"))].map((m) => m.index).pop();
      const lastOtherSportIdx = [...sportWindow.matchAll(new RegExp(OTHER_SPORT_PATTERN.source, "gi"))].map((m) => m.index).pop();
      if (lastOtherSportIdx !== undefined && (lastBasketballIdx === undefined || lastOtherSportIdx > lastBasketballIdx)) {
        return; // the closest sport mention before this stat line is not basketball, skip it
      }

      const statsWindow = bodyText.slice(match.index, forward);
      const rebMatch = statsWindow.match(/([\d.]+)\s*(?:RPG|Rebounds)/i);
      const astMatch = statsWindow.match(/([\d.]+)\s*(?:APG|Assists)/i);
      const labelMatches = [...bodyText.slice(backward, match.index).matchAll(/(Freshman|Sophomore|Junior|Senior|20\d\d-\d\d|20\d\d)/gi)];
      const label = labelMatches.length ? labelMatches[labelMatches.length - 1][1] : null;
      seasons.push({
        source: "maxpreps-text",
        label,
        ppg: match[1],
        rebounds: rebMatch ? rebMatch[1] : null,
        assists: astMatch ? astMatch[1] : null,
      });
    });
    return seasons;
  } catch (e) {
    return [];
  }
}

const LABEL_KEY = /^(season|seasonname|year|grade|gradelevel|class|classyear|level)$/i;
const STAT_KEY_PATTERN = /ppg|points.?per.?game|rebounds|assists|steals|blocks/i;
const TOTAL_POINTS_KEY = /total.?points|points.?scored/i;

function mapSeasonCandidate(item) {
  if (!item || typeof item !== "object") return null;
  const keys = Object.keys(item);
  const out = {};
  let labelKey = keys.find((k) => LABEL_KEY.test(k));
  for (const k of keys) {
    const v = item[k];
    if (typeof v !== "number" && typeof v !== "string") continue;
    if (TOTAL_POINTS_KEY.test(k)) out.totalPoints = v;
    else if (STAT_KEY_PATTERN.test(k)) out[k] = v;
  }
  if (Object.keys(out).length === 0) return null;
  out.label = labelKey ? String(item[labelKey]) : null;
  return out;
}

// Looks for an array where multiple elements each look like a season's worth
// of stats, rather than stopping at the first matching object the way the
// single-season scrape above does.
function findCareerStatsInObject(obj, depth) {
  if (!obj || typeof obj !== "object" || depth > 6) return null;
  if (Array.isArray(obj) && obj.length >= 2) {
    const mapped = obj.map(mapSeasonCandidate).filter(Boolean);
    if (mapped.length >= 2) return mapped;
  }
  for (const k of Object.keys(obj)) {
    const child = obj[k];
    if (child && typeof child === "object") {
      if (isOtherSportTag(objectSportTag(child))) continue; // a different sport's block, skip it
      const found = findCareerStatsInObject(child, (depth || 0) + 1);
      if (found) return found;
    }
  }
  return null;
}

const SCHEDULE_MONTHS = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

// Strips the words that make two names for the same school fail a plain
// substring match ("Middleburg Broncos" vs "Middleburg High School").
function stripTeamNoise(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\b(girls|boys)\b/g, "")
    .replace(/\bbasketball\b/g, "")
    .replace(/\bhigh school\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// MaxPreps' schema.org SportsEvent startDate is unreliable for the calendar
// date: it is written with a UTC offset even though the clock value in it
// is really the local wall time, so a 7:30pm game can land on the next
// day's date once read as UTC. The event description, written for humans,
// spells the real local date and time out directly ("...on Tuesday,
// November 17 @ 7:30p."), so that is parsed first and startDate is only a
// fallback for the (rare) event with no usable description.
function mapLdJsonGame(ev, ourTeamName) {
  if (!ev || ev["@type"] !== "SportsEvent") return null;
  const home = ev.homeTeam && ev.homeTeam.name;
  const away = ev.awayTeam && ev.awayTeam.name;
  if (!home && !away) return null;

  let loc = "TBD";
  let opp = "";
  const ourStripped = stripTeamNoise(ourTeamName);
  const homeStripped = stripTeamNoise(home);
  const awayStripped = stripTeamNoise(away);
  const homeIsUs = Boolean(ourStripped && homeStripped && (ourStripped.includes(homeStripped) || homeStripped.includes(ourStripped)));
  const awayIsUs = Boolean(ourStripped && awayStripped && (ourStripped.includes(awayStripped) || awayStripped.includes(ourStripped)));
  if (homeIsUs && !awayIsUs) { loc = "Home"; opp = away || ""; }
  else if (awayIsUs && !homeIsUs) { loc = "Away"; opp = home || ""; }
  else opp = [home, away].filter(Boolean).join(" vs ");
  opp = opp.replace(/\s+High School$/i, "").trim();

  let dateIso = null;
  let time = "TBD";
  const desc = typeof ev.description === "string" ? ev.description : "";
  const m = desc.match(/on\s+\w+,\s+(\w+)\s+(\d{1,2})\s*@\s*(\d{1,2}(?::\d{2})?)\s*([ap])\.?m?\.?/i);
  const startDate = ev.startDate ? new Date(ev.startDate) : null;
  const startDateValid = startDate && !isNaN(startDate.getTime());
  if (m) {
    const month = SCHEDULE_MONTHS[m[1].toLowerCase()];
    const day = parseInt(m[2], 10);
    const year = startDateValid ? startDate.getUTCFullYear() : null;
    if (month !== undefined && year) {
      dateIso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    let timePart = m[3];
    if (!timePart.includes(":")) timePart += ":00";
    time = `${timePart} ${m[4].toUpperCase()}M`;
  }
  if (!dateIso && startDateValid) dateIso = startDate.toISOString().slice(0, 10);
  if (!dateIso) return null;

  return { date: dateIso, opp, loc, time, note: "", tag: "", result: "" };
}

// MaxPreps team schedule pages carry a schema.org ProfilePage/SportsTeam
// block with a clean, well labeled event list (startDate, home/away team
// names, a human readable description) alongside whatever Next.js payload
// format the rest of the page uses. This is a far more reliable source for
// schedule data specifically than guessing at either Next.js shape, so it
// is tried before the generic JSON strategies below.
function findLdJsonSchedule($) {
  let events = null;
  let ourTeamName = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (events) return;
    let parsed;
    try {
      parsed = JSON.parse($(el).contents().text());
    } catch (e) {
      return;
    }
    const entity = (parsed && parsed.mainEntity) || parsed;
    if (entity && Array.isArray(entity.event) && entity.event.length) {
      events = entity.event;
      ourTeamName = entity.name || null;
    }
  });
  if (!events) return null;
  const mapped = events.map((ev) => mapLdJsonGame(ev, ourTeamName)).filter(Boolean);
  return mapped.length ? mapped : null;
}

// Best-effort MaxPreps schedule pull. Same caveats as the stats scraper
// above: schedule tables are usually rendered client side with JavaScript,
// so a plain server side fetch only sees this when the page happens to
// embed the schedule as structured JSON. Returns [] on anything unexpected,
// never throws, and the admin always reviews and edits the result before
// it is saved, so a wrong or partial guess here is never published as is.
async function fetchMaxPrepsSchedule(maxprepsUrl) {
  if (!maxprepsUrl) return [];

  let html;
  try {
    const res = await fetch(maxprepsUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ElevateHerHoopsBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    html = await res.text();
  } catch (e) {
    return [];
  }

  try {
    const $ = cheerio.load(html);

    // Strategy 0: same Next.js flight format the stats page uses. Pull the
    // pageProps value out of it (the stable wrapper every page on this site
    // seems to use to hand its data to the page) and search inside that with
    // the same game array finder Strategy 1 below uses, rather than guessing
    // the exact key name a schedule page keeps its games under.
    const flightText = extractNextFlightText($);
    if (flightText) {
      const pageProps = extractBalancedJsonAfterKey(flightText, "pageProps");
      if (pageProps) {
        const found = findScheduleInObject(pageProps, 0);
        if (found && found.length) return found;
      }
    }

    // Strategy 1: the schema.org event list described above.
    const ldJsonGames = findLdJsonSchedule($);
    if (ldJsonGames && ldJsonGames.length) return ldJsonGames;

    // Strategy 2: many modern sites embed structured JSON in a script tag
    // (Next.js __NEXT_DATA__, JSON-LD, etc).
    let games = [];
    $('script[type="application/json"], script#__NEXT_DATA__, script[type="application/ld+json"]').each((_, el) => {
      if (games.length) return;
      try {
        const parsed = JSON.parse($(el).contents().text());
        const found = findScheduleInObject(parsed);
        if (found && found.length) games = found;
      } catch (e) {
        // not parseable JSON, or not the shape we're looking for; keep scanning
      }
    });
    return games;
  } catch (e) {
    return [];
  }
}

// Looks for an array of objects that plausibly describe games (something
// date-like plus something opponent-like), and maps whatever it can onto
// the same shape the admin dashboard's schedule rows use. Fields it can't
// confidently map are left blank for the admin to fill in.
function findScheduleInObject(obj, depth) {
  if (!obj || typeof obj !== "object" || depth > 6) return null;
  if (Array.isArray(obj) && obj.length >= 2) {
    const mapped = obj.map(mapGameCandidate).filter(Boolean);
    if (mapped.length >= 2) return mapped;
  }
  for (const k of Object.keys(obj)) {
    const child = obj[k];
    if (child && typeof child === "object") {
      const found = findScheduleInObject(child, (depth || 0) + 1);
      if (found) return found;
    }
  }
  return null;
}

const DATE_KEY = /^(date|game.?date|eventdate|startdate)$/i;
const OPP_KEY = /^(opponent|opp|opponentname|vs|team)$/i;
const LOC_KEY = /^(location|loc|homeaway|site)$/i;
const TIME_KEY = /^(time|starttime|gametime)$/i;
const RESULT_KEY = /^(result|score|outcome)$/i;

function mapGameCandidate(item) {
  if (!item || typeof item !== "object") return null;
  const keys = Object.keys(item);
  const dateKey = keys.find((k) => DATE_KEY.test(k));
  const oppKey = keys.find((k) => OPP_KEY.test(k));
  if (!dateKey || !oppKey) return null;
  const rawDate = String(item[dateKey]);
  const parsed = new Date(rawDate);
  if (isNaN(parsed.getTime())) return null;
  const iso = parsed.toISOString().slice(0, 10);
  const locKey = keys.find((k) => LOC_KEY.test(k));
  const timeKey = keys.find((k) => TIME_KEY.test(k));
  const resultKey = keys.find((k) => RESULT_KEY.test(k));
  const rawLoc = locKey ? String(item[locKey]).toLowerCase() : "";
  const loc = rawLoc.includes("home") ? "Home" : rawLoc.includes("away") ? "Away" : "TBD";
  return {
    date: iso,
    opp: String(item[oppKey] || "").trim(),
    loc,
    time: timeKey ? String(item[timeKey]) : "TBD",
    note: "",
    tag: "",
    result: resultKey ? String(item[resultKey]) : "",
  };
}

function findStatsInObject(obj, depth) {
  if (!obj || typeof obj !== "object" || depth > 6) return null;
  const keys = Object.keys(obj);
  const statKeyPattern = /ppg|points.?per.?game|rebounds|assists|steals|blocks/i;
  if (!isOtherSportTag(objectSportTag(obj)) && keys.some((k) => statKeyPattern.test(k))) {
    const out = {};
    for (const k of keys) {
      if (statKeyPattern.test(k) && (typeof obj[k] === "number" || typeof obj[k] === "string")) {
        out[k] = obj[k];
      }
    }
    if (Object.keys(out).length > 0) return out;
  }
  for (const k of keys) {
    const child = obj[k];
    if (child && typeof child === "object") {
      if (isOtherSportTag(objectSportTag(child))) continue; // a different sport's block, skip it
      const found = findStatsInObject(child, (depth || 0) + 1);
      if (found) return found;
    }
  }
  return null;
}

module.exports = { fetchMaxPrepsStats, fetchMaxPrepsCareerStats, fetchMaxPrepsSchedule };
