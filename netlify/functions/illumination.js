const { getPlayer } = require("./_lib/blobs");
const { renderIlluminationSite } = require("./_lib/render-illumination");

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

  // Media (hero video, portrait, photos) loads client side straight from the
  // Madi Visuals dashboard, so no server side fetch is needed here.
  const html = renderIlluminationSite(player);

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" },
    body: html,
  };
};
