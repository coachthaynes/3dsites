const { graphicsStore } = require("./_lib/blobs");

function keyFromPath(path) {
  // /player-graphics/some-slug/1699999999-file.png -> some-slug/1699999999-file.png
  // Graphics keys contain their own slash (slug/filename), unlike a plain
  // slug, so this keeps everything after the route prefix rather than just
  // the last path segment.
  const marker = "/player-graphics/";
  const idx = (path || "").indexOf(marker);
  return idx === -1 ? "" : path.slice(idx + marker.length);
}

exports.handler = async (event) => {
  // The ?key=:splat redirect target doesn't always carry the key through
  // reliably, same as player.js and photo.js already work around for slug;
  // fall back to reading it out of the original request path when that
  // happens.
  const qsKey = event.queryStringParameters && event.queryStringParameters.key;
  const key = qsKey && qsKey !== ":splat" ? qsKey : keyFromPath(event.path);
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
