const { listIlluminationQueue, saveIlluminationQueueItem, getPlayer, savePlayer } = require("./_lib/blobs");
const { checkAdminSecret } = require("./_lib/auth");

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Secret",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  if (!checkAdminSecret(event)) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  if (event.httpMethod === "GET") {
    const items = await listIlluminationQueue();
    return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ items }) };
  }

  if (event.httpMethod === "POST") {
    let data;
    try {
      data = JSON.parse(event.body || "{}");
    } catch (e) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid JSON" }) };
    }
    const { slug, action } = data;
    if (!slug || !["approve", "dismiss"].includes(action)) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "slug and a valid action are required" }) };
    }
    const item = await saveIlluminationQueueItem({
      slug,
      status: action === "approve" ? "approved" : "dismissed",
      decidedAt: new Date().toISOString(),
    });

    if (action === "approve") {
      const existing = await getPlayer(slug);
      await savePlayer({
        slug,
        playerName: (existing && existing.playerName) || item.playerName,
        tier: (existing && existing.tier) || "elite",
        illuminationApproved: true,
        illuminationApprovedAt: item.decidedAt,
      });
    }

    return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ item }) };
  }

  return { statusCode: 405, headers: cors, body: "Method not allowed" };
};
