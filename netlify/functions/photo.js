const { photosStore } = require("./_lib/blobs");

function slugFromPath(path) {
  const segments = (path || "").split("/").filter(Boolean);
  return segments[segments.length - 1] || "";
}

exports.handler = async (event) => {
  const qsSlug = event.queryStringParameters && event.queryStringParameters.slug;
  const slug = qsSlug && qsSlug !== ":splat" ? qsSlug : slugFromPath(event.path);
  if (!slug) {
    return { statusCode: 400, body: "Missing slug" };
  }

  const store = photosStore();
  const entry = await store.getWithMetadata(slug, { type: "text" });
  if (!entry || !entry.data) {
    return { statusCode: 404, body: "Photo not found" };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": (entry.metadata && entry.metadata.contentType) || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    body: entry.data,
    isBase64Encoded: true,
  };
};
