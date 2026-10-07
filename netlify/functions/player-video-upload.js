const crypto = require("crypto");
const { getPlayer, highlightVideoAssetsStore, highlightVideoChunksStore } = require("./_lib/blobs");
const { checkPlayerToken, verifySessionCookie, checkAdminSecret } = require("./_lib/auth");

// One self-uploaded highlight clip for Essential (free) tier players, who
// aren't in the Visual-Dashboard and don't get the Elite questionnaire's Netlify Forms
// upload. Arrives in small chunks so it stays under the function payload
// limit regardless of the clip's total size; /player-video.mts serves the
// finished file back out with byte-range support for playback.
const ALLOWED_TYPE = /^video\/(mp4|webm|quicktime)$/;
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_VIDEO_SIZE = 80 * 1024 * 1024; // 80MB: one trimmed highlight clip, not a full game

function json(data, status) {
  return {
    statusCode: status || 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(data),
  };
}
function fail(message, status) {
  return json({ error: message }, status || 400);
}

async function authorizePlayer(event, body) {
  const slug = body.slug;
  if (!slug) return null;
  if (checkAdminSecret(event)) {
    // Admin may be uploading before a brand-new player's first save, so
    // don't require the record to already exist, same as admin-photo-upload.
    const player = await getPlayer(slug);
    return player || { slug };
  }
  const player = await getPlayer(slug);
  if (!player) return null;
  if (checkPlayerToken(player, body.token)) return player;
  const sessionSlug = verifySessionCookie(event.headers.cookie || event.headers.Cookie);
  if (sessionSlug && sessionSlug === slug) return player;
  return null;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return fail("Method not allowed", 405);
  }
  const action = (event.queryStringParameters || {}).action;

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return fail("Invalid JSON");
  }

  const player = await authorizePlayer(event, body);
  if (!player) {
    return fail("Unauthorized", 401);
  }
  if (player.tier === "elite" || player.tier === "illumination") {
    return fail("This uploader is only for free Essential profiles.");
  }

  const assets = highlightVideoAssetsStore();

  if (action === "start") {
    const { contentType, size, name } = body;
    if (!ALLOWED_TYPE.test(contentType || "")) {
      return fail("Please upload an MP4, MOV, or WEBM video file.");
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_VIDEO_SIZE) {
      return fail(`Video must be under ${Math.round(MAX_VIDEO_SIZE / (1024 * 1024))}MB. Trim it to one highlight clip and try again.`);
    }
    const id = crypto.randomUUID();
    const chunks = Math.ceil(size / CHUNK_SIZE);
    const asset = {
      id,
      slug: player.slug,
      type: contentType,
      size,
      chunks,
      chunkSize: CHUNK_SIZE,
      name: String(name || "highlight").slice(0, 160),
      status: "uploading",
      created: new Date().toISOString(),
    };
    await assets.setJSON(id, asset);
    return json({ id, chunkSize: CHUNK_SIZE, chunks });
  }

  if (action === "chunk") {
    const { id, n, dataBase64 } = body;
    const asset = await assets.get(id, { type: "json" });
    if (!asset || asset.slug !== player.slug || asset.status !== "uploading") {
      return fail("Upload not found", 404);
    }
    if (!Number.isInteger(n) || n < 0 || n >= asset.chunks) {
      return fail("Bad chunk number");
    }
    const buf = Buffer.from(dataBase64 || "", "base64");
    const expected = n === asset.chunks - 1 ? asset.size - n * asset.chunkSize : asset.chunkSize;
    if (buf.length !== expected) {
      return fail(`Chunk ${n} should be ${expected} bytes, got ${buf.length}`);
    }
    await highlightVideoChunksStore().set(`${id}/${n}`, buf);
    return json({ ok: true });
  }

  if (action === "finish") {
    const { id } = body;
    const asset = await assets.get(id, { type: "json" });
    if (!asset || asset.slug !== player.slug) {
      return fail("Upload not found", 404);
    }
    const { blobs } = await highlightVideoChunksStore().list({ prefix: `${id}/` });
    if (blobs.length !== asset.chunks) {
      return fail(`Upload incomplete: ${blobs.length} of ${asset.chunks} pieces arrived`, 409);
    }
    asset.status = "ready";
    await assets.setJSON(id, asset);
    return json({ id, url: "/player-videos/" + id });
  }

  return fail("Unknown action", 404);
};
