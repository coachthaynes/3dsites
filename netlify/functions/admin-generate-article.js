const { getPlayer, saveArticle } = require("./_lib/blobs");
const { checkAdminSecret } = require("./_lib/auth");
const { generateArticle } = require("./_lib/generate-article");
const { fetchMaxPrepsStats } = require("./_lib/maxpreps-scrape");

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
  if (!checkAdminSecret(event)) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { slug, useMaxPreps } = body;
  if (!slug) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "slug is required" }) };
  }

  const player = await getPlayer(slug);
  if (!player) {
    return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Player not found" }) };
  }

  let externalStats = null;
  let maxPrepsAttempted = false;
  if (useMaxPreps && player.maxpreps) {
    maxPrepsAttempted = true;
    externalStats = await fetchMaxPrepsStats(player.maxpreps);
  }

  let article;
  try {
    article = await generateArticle(player, externalStats);
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
  }

  const saved = await saveArticle({
    playerSlug: slug,
    headline: article.headline,
    body: article.body,
    statsUsed: article.statsUsed,
    published: false,
  });

  return {
    statusCode: 200,
    headers: { ...cors, "Content-Type": "application/json" },
    body: JSON.stringify({
      article: saved,
      maxPrepsAttempted,
      maxPrepsFoundStats: Boolean(externalStats),
    }),
  };
};
