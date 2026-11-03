const { listArticles, getArticle, saveArticle, deleteArticle } = require("./_lib/blobs");
const { checkAdminSecret } = require("./_lib/auth");

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
    const slug = event.queryStringParameters && event.queryStringParameters.slug;
    const articles = await listArticles(slug);
    return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ articles }) };
  }

  if (event.httpMethod === "POST") {
    let data;
    try {
      data = JSON.parse(event.body || "{}");
    } catch (e) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid JSON" }) };
    }
    if (!data.id) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "id is required to update an article" }) };
    }
    const existing = await getArticle(data.id);
    if (!existing) {
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Article not found" }) };
    }
    const saved = await saveArticle(data);
    return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ article: saved }) };
  }

  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters && event.queryStringParameters.id;
    if (!id) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "id required" }) };
    await deleteArticle(id);
    return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers: cors, body: "Method not allowed" };
};
