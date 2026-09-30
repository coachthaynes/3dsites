const { graphicsStore } = require("./_lib/blobs");

exports.handler = async (event) => {
  const key = event.queryStringParameters && event.queryStringParameters.key;
  if (!key) {
    return { statusCode: 400, body: "Missing key" };
  }

  const store = graphicsStore();
  const entry = await store.getWithMetadata(key, { type: "text" });
  if (!entry || !entry.data) {
    return { statusCode: 404, body: "Graphic not found" };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": (entry.metadata && entry.metadata.contentType) || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    body: entry.data,
    isBase64Encoded: true,
  };
};
