const { getPlayer } = require("./_lib/blobs");
const { renderEliteSite } = require("./_lib/render-elite");

function slugFromPath(path) {
  // /elite/kennedy-jeffress -> kennedy-jeffress
  const segments = (path || "").split("/").filter(Boolean);
  return segments[segments.length - 1] || "";
}

function toUrlList(value) {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr
    .map((v) => (v && typeof v === "object" ? v.url : v))
    .filter((u) => typeof u === "string" && u);
}

function guessVideoType(url) {
  const ext = String(url).split(".").pop().toLowerCase();
  if (ext === "webm") return "video/webm";
  if (ext === "mov") return "video/quicktime";
  return "video/mp4";
}

exports.handler = async (event) => {
  // The ?slug=:splat redirect target doesn't always carry the slug through
  // reliably, same as player.js and photo.js already work around; fall back
  // to reading it out of the original request path when that happens.
  const qsSlug = event.queryStringParameters && event.queryStringParameters.slug;
  const slug = qsSlug && qsSlug !== ":splat" ? qsSlug : slugFromPath(event.path);
  if (!slug) {
    return { statusCode: 400, headers: { "Content-Type": "text/plain" }, body: "Missing slug" };
  }

  const player = await getPlayer(slug);
  if (!player || player.tier !== "elite") {
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/html" },
      body: "<!DOCTYPE html><html><body style=\"background:#0a0a0a;color:#f5f5f3;font-family:sans-serif;padding:60px;text-align:center;\"><h1>Not found</h1></body></html>",
    };
  }

  // Elite is self serve: built straight from what she uploaded on her own
  // questionnaire, no designer or approval step in the way, up to 15 photos
  // and 4 videos (highlights and full game footage both fit in that cap).
  const photos = toUrlList(player.playerPhoto).slice(0, 15);
  const videos = toUrlList(player.playerVideo).slice(0, 4);
  const poster = photos[0] || "";
  const feed = {
    portrait: poster,
    poster,
    heroPhotos: photos.slice(1, 4),
    photos: photos.map((url) => ({ src: url, thumb: url, large: url })),
    film: videos.map((url) => ({ url, type: guessVideoType(url) })),
  };

  const html = renderEliteSite(player, feed);

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" },
    body: html,
  };
};
