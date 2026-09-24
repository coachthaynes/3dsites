const { listArticles } = require("./_lib/blobs");

// Public, read-only: returns only published articles for a given player,
// used to render a "Latest News" feed on her page (essential or premium).
exports.handler = async (event) => {
  const cors = { "Access-Control-Allow-Origin": "*" };
  const slug = event.queryStringParameters && event.queryStringParameters.slug;
  if (!slug) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "slug is required" }) };
  }
  const articles = (await listArticles(slug)).filter((a) => a.published);
  return {
    statusCode: 200,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
    body: JSON.stringify({ articles }),
  };
};
