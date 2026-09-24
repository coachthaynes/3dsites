const { getPlayer } = require("./_lib/blobs");
const { renderEssentialPlayer } = require("./_lib/render-essential");

exports.handler = async (event) => {
  const slug = event.queryStringParameters && event.queryStringParameters.slug;
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
