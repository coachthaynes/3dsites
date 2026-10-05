const crypto = require("crypto");
const { tradingCardPortraitsStore } = require("./_lib/blobs");
const { checkAdminSecret } = require("./_lib/auth");
const { removePhotoBackground } = require("./_lib/remove-photo-background");

// Netlify functions cap request bodies around 6MB; stay well under that
// once the base64 encoding overhead and JSON wrapper are counted.
const MAX_BASE64_LENGTH = 4 * 1024 * 1024; // ~3MB of actual image data

// POST /admin-remove-photo-background { slug, contentType, dataBase64 }
//   Cuts the background out of a player's photo for use on her trading
//   card. Caches the result per player, keyed by a hash of the exact
//   photo sent in, so re-opening the Trading Cards tab doesn't call the
//   (metered) Gemini image API again for a photo it has already processed.
exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  if (!checkAdminSecret(event)) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };
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
    return { statusCode: 413, headers: cors, body: JSON.stringify({ error: "Photo is too large" }) };
  }
  if (!/^image\//.test(contentType || "")) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Only image uploads are allowed" }) };
  }

  const sourceHash = crypto.createHash("sha256").update(dataBase64).digest("hex");
  const store = tradingCardPortraitsStore();
  const existing = await store.getWithMetadata(slug, { type: "text" });
  if (existing && existing.metadata && existing.metadata.sourceHash === sourceHash) {
    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ dataBase64: existing.data, contentType: existing.metadata.contentType, cached: true }),
    };
  }

  let result;
  try {
    result = await removePhotoBackground(dataBase64, contentType);
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
  }

  await store.set(slug, result.dataBase64, {
    metadata: { contentType: result.contentType, sourceHash, processedAt: new Date().toISOString() },
  });

  return {
    statusCode: 200,
    headers: { ...cors, "Content-Type": "application/json" },
    body: JSON.stringify({ dataBase64: result.dataBase64, contentType: result.contentType, cached: false }),
  };
};
