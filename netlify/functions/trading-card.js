const { tradingCardsStore } = require("./_lib/blobs");

function slugFromPath(path) {
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
    return { statusCode: 400, body: "Missing slug" };
  }

  const store = tradingCardsStore();
  const entry = await store.getWithMetadata(slug, { type: "text" });
  if (!entry || !entry.data) {
    return { statusCode: 404, body: "Trading card not found" };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": (entry.metadata && entry.metadata.contentType) || "image/png",
      "Cache-Control": "public, max-age=60",
    },
    body: entry.data,
    isBase64Encoded: true,
  };
};
