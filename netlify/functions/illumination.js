const { getPlayer } = require("./_lib/blobs");
const { renderIlluminationSite } = require("./_lib/render-illumination");

const MADI_BASE = "https://madivisuals.netlify.app";

async function fetchMadiFeed(slug) {
  try {
    const res = await fetch(`${MADI_BASE}/api/sites/${encodeURIComponent(slug)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null; // Madi unreachable or player not set up there yet - render with what we have
  }
}

exports.handler = async (event) => {
  const slug = event.queryStringParameters && event.queryStringParameters.slug;
  if (!slug) {
    return { statusCode: 400, headers: { "Content-Type": "text/plain" }, body: "Missing slug" };
  }

  const player = await getPlayer(slug);
  if (!player || player.tier !== "illumination" || !player.illuminationApproved) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/html" },
      body: "<!DOCTYPE html><html><body style=\"background:#0a0a0a;color:#f5f5f3;font-family:sans-serif;padding:60px;text-align:center;\"><h1>Not live yet</h1><p>This Illumination site hasn't been approved for publishing.</p></body></html>",
    };
  }

  const feed = await fetchMadiFeed(slug);
  const html = renderIlluminationSite(player, feed);

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" },
    body: html,
  };
};
