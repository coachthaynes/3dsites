const { getPlayerPublic } = require("./_lib/blobs");
const { renderIlluminationSite } = require("./_lib/render-illumination");

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

  const player = await getPlayerPublic(slug);
  if (!player || player.tier !== "elite") {
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/html" },
      body: "<!DOCTYPE html><html><body style=\"background:#0a0a0a;color:#f5f5f3;font-family:sans-serif;padding:60px;text-align:center;\"><h1>Not found</h1></body></html>",
    };
  }

  // Elite now renders on the same template as Illumination (same site, the
  // only difference is who uploads her media: a family uploads her own
  // photo/clip through the questionnaire for Elite, a professional shoot
  // gets uploaded through the Illumination tab for Illumination). No
  // approval gate here, unlike illumination.js - Elite has always been
  // self serve and live the moment her tier is set, and that doesn't change
  // just because the page design did.
  //
  // Her uploaded media loads client side from the same Illumination media
  // library as any other player's (madi-site.mts doesn't check tier), so an
  // Elite player who's never had anything uploaded there yet would show
  // nothing. Her questionnaire's own single photo/clip fields fill that gap
  // as the same kind of local-fallback media an Illumination player gets
  // from a converted hand built page, shown until the library has
  // something to replace it with.
  let renderPlayer = player;
  if (!player.localMedia) {
    const photos = toUrlList(player.playerPhoto).slice(0, 15);
    const videos = toUrlList(player.playerVideo).slice(0, 4);
    if (photos.length || videos.length) {
      renderPlayer = Object.assign({}, player, {
        localMedia: {
          poster: photos[0] || "",
          portrait: photos[0] || "",
          hero: videos.slice(0, 1).map((url) => ({ url, type: guessVideoType(url) })),
          film: videos.slice(0, 1).map((url) => ({ url, type: guessVideoType(url) })),
          photos: photos.map((url) => ({ url })),
        },
      });
    }
  }

  const html = renderIlluminationSite(renderPlayer);

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" },
    body: html,
  };
};
