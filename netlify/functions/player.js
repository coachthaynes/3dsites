const { getPlayer, incrementViews, listArticles } = require("./_lib/blobs");
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
  if (player.tier === "premium" || player.tier === "elite") {
    // Premium/Elite players have their own dedicated static site; this
    // dynamic template is only for Essential-tier players.
    return { statusCode: 404, body: "Player not found" };
  }
  try {
    await incrementViews(slug);
  } catch (e) {
    // never fail the page load over a view-count write
  }
  let articles = [];
  try {
    articles = (await listArticles(slug)).filter((a) => a.published);
  } catch (e) {
    // never fail the page load over the news feed
  }
  const html = renderEssentialPlayer(player, articles);
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" },
    body: html,
  };
};
