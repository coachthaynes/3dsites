const { graphicsStore } = require("./_lib/blobs");
const { checkAdminSecret } = require("./_lib/auth");

// Netlify functions cap request bodies around 6MB; stay well under that
// once the base64 encoding overhead and JSON wrapper are counted.
const MAX_BASE64_LENGTH = 6 * 1024 * 1024; // ~4.5MB of actual file data

function sanitizeFilename(name) {
  return String(name || "file")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(-120);
}

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

  const store = graphicsStore();

  if (event.httpMethod === "GET") {
    const slug = event.queryStringParameters && event.queryStringParameters.slug;
    if (!slug) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "slug required" }) };
    const { blobs } = await store.list({ prefix: `${slug}/` });
    const files = await Promise.all(
      blobs.map(async (b) => {
        const meta = await store.getMetadata(b.key);
        return {
          key: b.key,
          filename: (meta && meta.metadata && meta.metadata.filename) || b.key.split("/").pop(),
          contentType: meta && meta.metadata && meta.metadata.contentType,
          uploadedAt: meta && meta.metadata && meta.metadata.uploadedAt,
        };
      })
    );
    files.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));
    return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ files }) };
  }

  if (event.httpMethod === "POST") {
    let data;
    try {
      data = JSON.parse(event.body || "{}");
    } catch (e) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid JSON" }) };
    }
    const { slug, filename, contentType, dataBase64 } = data;
    if (!slug || !dataBase64) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "slug and dataBase64 are required" }) };
    }
    if (dataBase64.length > MAX_BASE64_LENGTH) {
      return { statusCode: 413, headers: cors, body: JSON.stringify({ error: "File is too large. Please use a smaller file (under ~4.5MB)." }) };
    }
    if (!/^(image\/|application\/pdf)/.test(contentType || "")) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Only image or PDF uploads are allowed" }) };
    }
    const key = `${slug}/${Date.now()}-${sanitizeFilename(filename)}`;
    await store.set(key, dataBase64, {
      metadata: { contentType, filename: sanitizeFilename(filename), uploadedAt: new Date().toISOString() },
    });
    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ key, url: `/player-graphics/${key}` }),
    };
  }

  if (event.httpMethod === "DELETE") {
    const key = event.queryStringParameters && event.queryStringParameters.key;
    if (!key) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "key required" }) };
    await store.delete(key);
    return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers: cors, body: "Method not allowed" };
};
