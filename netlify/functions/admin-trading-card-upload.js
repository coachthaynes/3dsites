const { tradingCardsStore } = require("./_lib/blobs");
const { checkAdminSecret } = require("./_lib/auth");

// Netlify functions cap request bodies around 6MB; stay well under that
// once the base64 encoding overhead and JSON wrapper are counted.
const MAX_BASE64_LENGTH = 4 * 1024 * 1024; // ~3MB of actual image data

// POST /admin-trading-card-upload { slug, contentType, dataBase64 }
//   Publishes a player's trading card, generated client side on the admin
//   dashboard's Trading Cards tab, so it has a stable URL to download or
//   email later instead of needing to be regenerated every time.
// GET  /admin-trading-card-upload
//   Lists which players already have a published card, and when, so the
//   dashboard can show that state after a reload.
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

  const store = tradingCardsStore();

  if (event.httpMethod === "GET") {
    const { blobs } = await store.list();
    const cards = await Promise.all(
      blobs.map(async (b) => {
        const entry = await store.getWithMetadata(b.key, { type: "text" });
        return entry && entry.metadata ? { slug: b.key, publishedAt: entry.metadata.publishedAt || null } : null;
      })
    );
    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ cards: cards.filter(Boolean) }),
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method not allowed" };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { slug, contentType, dataBase64 } = data;
  if (!slug || !dataBase64) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "slug and dataBase64 are required" }) };
  }
  if (dataBase64.length > MAX_BASE64_LENGTH) {
    return { statusCode: 413, headers: cors, body: JSON.stringify({ error: "Card image is too large" }) };
  }
  if (!/^image\//.test(contentType || "")) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Only image uploads are allowed" }) };
  }

  const publishedAt = new Date().toISOString();
  await store.set(slug, dataBase64, { metadata: { contentType, publishedAt } });

  return {
    statusCode: 200,
    headers: { ...cors, "Content-Type": "application/json" },
    body: JSON.stringify({ url: `/trading-card/${slug}`, publishedAt }),
  };
};
