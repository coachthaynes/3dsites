const { photosStore, getPlayer } = require("./_lib/blobs");
const { checkAdminSecret, checkPlayerToken, verifySessionCookie } = require("./_lib/auth");

// Netlify functions cap request bodies around 6MB; stay well under that
// once the base64 encoding overhead and JSON wrapper are counted.
const MAX_BASE64_LENGTH = 4 * 1024 * 1024; // ~3MB of actual image data

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

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { slug, contentType, dataBase64, token } = data;
  if (!slug || !dataBase64) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "slug and dataBase64 are required" }) };
  }

  // photoKey is "<playerSlug>-<timestamp>"; recover the player slug to check ownership
  const playerSlug = slug.replace(/-\d+$/, "");

  let authorized = checkAdminSecret(event);
  if (!authorized && token) {
    const player = await getPlayer(playerSlug);
    authorized = checkPlayerToken(player, token);
  }
  if (!authorized) {
    const sessionSlug = verifySessionCookie(event.headers.cookie || event.headers.Cookie);
    authorized = Boolean(sessionSlug) && sessionSlug === playerSlug;
  }
  if (!authorized) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };
  }
  if (dataBase64.length > MAX_BASE64_LENGTH) {
    return { statusCode: 413, headers: cors, body: JSON.stringify({ error: "Photo is too large. Please use a smaller image (under ~3MB)." }) };
  }
  if (!/^image\//.test(contentType || "")) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Only image uploads are allowed" }) };
  }

  const store = photosStore();
  await store.set(slug, dataBase64, { metadata: { contentType } });

  return {
    statusCode: 200,
    headers: { ...cors, "Content-Type": "application/json" },
    body: JSON.stringify({ url: `/player-photos/${slug}` }),
  };
};
