const { saveIlluminationQueueItem, getPlayer } = require("./_lib/blobs");
const { checkMadiSecret } = require("./_lib/auth");

// Receives notice from the Madi Visuals dashboard that a player's design is
// ready. This never publishes anything by itself, it only drops the item
// into a review queue. A human has to approve it from the Illumination tab
// before it counts as ready to build into a live site.
exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Madi-Secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method not allowed" };
  }
  if (!checkMadiSecret(event)) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { slug, playerName, previewUrl } = data;
  if (!slug || !previewUrl) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "slug and previewUrl are required" }) };
  }

  const existingPlayer = await getPlayer(slug);
  const item = await saveIlluminationQueueItem({
    slug,
    playerName: playerName || (existingPlayer && existingPlayer.playerName) || slug,
    previewUrl,
    status: "pending",
    receivedAt: new Date().toISOString(),
  });

  return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ item }) };
};
