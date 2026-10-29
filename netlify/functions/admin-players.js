const { listPlayers, savePlayer, deletePlayer, getPlayer, getViews } = require("./_lib/blobs");
const { checkAdminSecret } = require("./_lib/auth");
const { sanitizeSlug } = require("./_lib/reserved-slugs");

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Secret",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  if (!checkAdminSecret(event)) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  if (event.httpMethod === "GET") {
    const players = await listPlayers();
    const withViews = await Promise.all(
      players.map(async (p) => Object.assign({}, p, { views: await getViews(p.slug) }))
    );
    return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ players: withViews }) };
  }

  if (event.httpMethod === "POST") {
    let data;
    try {
      data = JSON.parse(event.body || "{}");
    } catch (e) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid JSON" }) };
    }

    // Moves a player to a new slug instead of the usual create-or-update,
    // since the slug doubles as her record's storage key. Her photo and
    // highlight clip are stored at independent, already-issued URLs (not
    // slug-prefixed lookups), so only the player record itself needs to
    // move; nothing else has to be touched. The old slug is freed up, so
    // whatever served it before (typically a netlify.toml redirect to the
    // new slug) is responsible for keeping the old link working.
    if (data.action === "rename") {
      const oldSlug = String(data.slug || "").trim();
      const requestedSlug = String(data.newSlug || "").trim();
      if (!oldSlug || !requestedSlug) {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "slug and newSlug are required" }) };
      }
      const newSlug = sanitizeSlug(slugify(requestedSlug));
      if (!newSlug) {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "newSlug is invalid" }) };
      }
      if (newSlug === oldSlug) {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "newSlug matches the current slug" }) };
      }
      const player = await getPlayer(oldSlug);
      if (!player) {
        return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Player not found" }) };
      }
      if (await getPlayer(newSlug)) {
        return { statusCode: 409, headers: cors, body: JSON.stringify({ error: "A player already uses that slug" }) };
      }
      const renamed = Object.assign({}, player, {
        slug: newSlug,
        id: newSlug,
        playerName: data.playerName ? String(data.playerName).trim() : player.playerName,
      });
      await savePlayer(renamed);
      await deletePlayer(oldSlug);
      return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ player: renamed }) };
    }

    // Moves a player from Essential to Elite. The tier flip alone would
    // leave her Elite page looking empty: Essential's single highlight clip
    // lives in a differently named field (highlightVideo) than Elite's
    // multi clip list (playerVideo), so copy it across under the new name.
    // Her photo needs no migration - elite.js already treats a lone
    // playerPhoto string as a one item list, same field name either way.
    if (data.action === "upgradeToElite") {
      const slug = String(data.slug || "").trim();
      if (!slug) {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "slug is required" }) };
      }
      const player = await getPlayer(slug);
      if (!player) {
        return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Player not found" }) };
      }
      const upgraded = Object.assign({}, player, { tier: "elite" });
      if (player.highlightVideo && !(Array.isArray(player.playerVideo) && player.playerVideo.length)) {
        upgraded.playerVideo = [player.highlightVideo];
      }
      await savePlayer(upgraded);
      return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ player: upgraded }) };
    }

    if (!data.slug && data.playerName) data.slug = sanitizeSlug(slugify(data.playerName));
    if (!data.slug) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "playerName or slug required" }) };
    if (!data.id) data.id = data.slug;
    const saved = await savePlayer(data);
    return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ player: saved }) };
  }

  if (event.httpMethod === "DELETE") {
    const slug = event.queryStringParameters && event.queryStringParameters.slug;
    if (!slug) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "slug required" }) };
    await deletePlayer(slug);
    return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers: cors, body: "Method not allowed" };
};
