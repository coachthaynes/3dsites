const { getPlayer, savePlayer } = require("./_lib/blobs");
const { checkPlayerToken, verifySessionCookie } = require("./_lib/auth");

// Fields a player may edit about herself. Slug, editToken, status, and her
// coach's contact info are intentionally excluded, those stay coach-controlled.
const ALLOWED_FIELDS = [
  "playerName", "jerseyNumber", "highSchool", "gradYear", "position",
  "playerPhone", "playerEmail", "guardianName", "guardianPhone", "guardianEmail",
  "gpa", "sat", "act", "dualEnrollment",
  "height", "weight", "standingReach", "wingspan", "shoeSize",
  "standingVertical", "maxVertical", "benchDeadliftSquat", "laneAgility", "shuttleRun", "threeQtrSprint",
  "statFreshmanPPG", "statFreshmanRebounds", "statFreshmanSteals", "statFreshmanBlocks", "statFreshmanAssists", "statFreshmanTotalPoints",
  "statSophomorePPG", "statSophomoreRebounds", "statSophomoreSteals", "statSophomoreBlocks", "statSophomoreAssists", "statSophomoreTotalPoints",
  "statJuniorPPG", "statJuniorRebounds", "statJuniorSteals", "statJuniorBlocks", "statJuniorAssists", "statJuniorTotalPoints",
  "statSeniorPPG", "statSeniorRebounds", "statSeniorSteals", "statSeniorBlocks", "statSeniorAssists", "statSeniorTotalPoints",
  "maxpreps", "hudl", "fieldlevel", "prepgirlshoops", "instagram", "twitter", "youtube",
  "currentOffers", "ncaaId", "playerPhoto", "message",
];

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  let slug = body.slug;
  const token = body.token;

  let player = null;
  if (slug && token) {
    player = await getPlayer(slug);
    if (!checkPlayerToken(player, token)) {
      return { statusCode: 403, body: JSON.stringify({ error: "Invalid or expired edit link" }) };
    }
  } else {
    const sessionSlug = verifySessionCookie(event.headers.cookie || event.headers.Cookie);
    if (!sessionSlug) {
      return { statusCode: 403, body: JSON.stringify({ error: "Not logged in" }) };
    }
    slug = sessionSlug;
    player = await getPlayer(slug);
    if (!player) {
      return { statusCode: 404, body: JSON.stringify({ error: "Player not found" }) };
    }
  }

  const update = { slug, id: player.id || slug };
  for (const field of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      update[field] = body[field];
    }
  }

  const saved = await savePlayer(update);
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, player: saved }),
  };
};
