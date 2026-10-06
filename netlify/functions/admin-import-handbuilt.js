// Converts a hand built player page into an editable player record (admin only).
// GET lists the available conversions and whether each is already imported.
// POST { slug } saves that record. savePlayer merges, so fields already edited in admin are kept.
const { getPlayer, savePlayer } = require("./_lib/blobs");
const { checkAdminSecret } = require("./_lib/auth");
const conversions = require("../../data/conversions");

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Secret",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (!checkAdminSecret(event)) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };
  const out = (code, data) => ({ statusCode: code, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify(data) });

  if (event.httpMethod === "GET") {
    const list = await Promise.all(conversions.map(async (c) => {
      const existing = await getPlayer(c.slug);
      return { slug: c.slug, playerName: c.playerName, tier: c.tier, imported: Boolean(existing && existing.convertedAt), url: `/illumination/${c.slug}` };
    }));
    return out(200, { conversions: list });
  }

  if (event.httpMethod === "POST") {
    let data;
    try { data = JSON.parse(event.body || "{}"); } catch (e) { return out(400, { error: "Invalid JSON" }); }
    const record = conversions.find((c) => c.slug === data.slug);
    if (!record) return out(404, { error: "No conversion for that player" });
    const existing = (await getPlayer(record.slug)) || {};
    // Keep anything already set on her record; the conversion only fills what is missing.
    const merged = {};
    for (const [k, v] of Object.entries(record)) {
      const cur = existing[k];
      if (cur === undefined || cur === null || cur === "" || (Array.isArray(cur) && !cur.length)) merged[k] = v;
    }
    const saved = await savePlayer({
      ...merged, slug: record.slug, id: existing.id || record.slug,
      tier: "illumination", illuminationApproved: true, illuminationApprovedAt: existing.illuminationApprovedAt || new Date().toISOString(),
      convertedAt: new Date().toISOString(),
    });
    return out(200, { player: { slug: saved.slug, playerName: saved.playerName }, url: `/illumination/${saved.slug}` });
  }
  return out(405, { error: "Method not allowed" });
};
