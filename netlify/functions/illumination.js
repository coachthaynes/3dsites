const { getPlayer } = require("./_lib/blobs");
const { renderIlluminationSite } = require("./_lib/render-illumination");

function slugFromPath(path) {
  // /illumination/aiyana-haynes -> aiyana-haynes
  const segments = (path || "").split("/").filter(Boolean);
  return segments[segments.length - 1] || "";
}

exports.handler = async (event) => {
  // The ?slug=:splat redirect target doesn't always carry the slug through
  // reliably, same as player.js and photo.js already work around; fall back
  // to reading it out of the original request path when that happens.
  const qsSlug = event.queryStringParameters && event.queryStringParameters.slug;
  const slug = qsSlug && qsSlug !== ":splat" ? qsSlug : slugFromPath(event.path);
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
