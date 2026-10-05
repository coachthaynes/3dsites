const { checkAdminSecret } = require("./_lib/auth");
const { generateProfileContent } = require("./_lib/generate-profile-content");
const { fetchMaxPrepsCareerStats } = require("./_lib/maxpreps-scrape");

// Takes whatever is currently typed into the admin's player form (not a
// saved player record), so this can be used on a brand new player that
// hasn't been saved yet, the same way the MaxPreps stat and schedule pullers
// already work from the raw form fields rather than a stored slug.
exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method not allowed" };
  }
  if (!checkAdminSecret(event)) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { player, useMaxPreps, useWebSearch } = body;
  if (!player || !player.playerName) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "player.playerName is required" }) };
  }

  let externalStats = null;
  let maxPrepsAttempted = false;
  if (useMaxPreps && player.maxpreps) {
    maxPrepsAttempted = true;
    externalStats = await fetchMaxPrepsCareerStats(player.maxpreps);
  }

  let content;
  try {
    content = await generateProfileContent(player, { externalStats, useWebSearch: Boolean(useWebSearch) });
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
  }

  return {
    statusCode: 200,
    headers: { ...cors, "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      maxPrepsAttempted,
      maxPrepsFoundStats: Boolean(externalStats && externalStats.length),
    }),
  };
};
