const { getPlayer } = require("./_lib/blobs");
const { renderEssentialPlayer } = require("./_lib/render-essential");

function slugFromPath(path) {
  // /players/nyla-parsons -> nyla-parsons
  const segments = (path || "").split("/").filter(Boolean);
  return segments[segments.length - 1] || "";
}

exports.handler = async (event) => {
  const qsSlug = event.queryStringParameters && event.queryStringParameters.slug;
  const slug = qsSlug && qsSlug !== ":splat" ? qsSlug : slugFromPath(event.path);
  if (!slug) {
    return { statusCode: 400, body: "Missing slug" };
  }
  const player = await getPlayer(slug);
  if (!player) {
    return { statusCode: 404, body: "Player not found" };
  }
  const html = renderEssentialPlayer(player);
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" },
    body: html,
  };
};
