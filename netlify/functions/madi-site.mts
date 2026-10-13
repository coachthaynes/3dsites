import type { Context } from "@netlify/functions";
import { listAssets, getPlayer, SLUG, type Asset } from "./_lib/madi-core.mts";

// GET /api/sites/:slug  public media feed read by the player's Illumination site.
// Only assets switched to Live in the Visual-Dashboard are included. Player sites live on other
// domains, so this one endpoint allows cross origin reads.
export default async (req: Request, context: Context) => {
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const slug = context.params.slug;
  const player = SLUG.test(slug) ? await getPlayer(slug) : null;
  if (!player) return Response.json({ error: "Unknown player" }, { status: 404, headers: cors });

  const origin = new URL(req.url).origin;
  const file = (a: Asset) => `${origin}/madi-media/${a.id}`;
  const img = (a: Asset, w: number) => `${origin}/.netlify/images?url=${encodeURIComponent(`/madi-media/${a.id}`)}&w=${w}&q=80`;
  const live = (await listAssets(slug)).filter(a => a.live && a.status === "ready");
  const newest = (role: string) => live.filter(a => a.role === role).sort((x, y) => y.created.localeCompare(x.created));
  // .mov (video/quicktime) uploads are common from iPhones. Chrome and
  // Firefox never even attempt a <source type="video/quicktime">, so this
  // used to relabel it as video/mp4 to get them to try - but the actual
  // bytes are still QuickTime, and madi-media.mts truthfully reports
  // video/quicktime as the Content-Type regardless of that label. Claiming
  // mp4 for a file that isn't can make a stricter browser reject it outright
  // even when the underlying codec would have played fine, which is likely
  // why some highlight clips played in one browser and not another. Leaving
  // the type off entirely (rather than mislabeling it) makes every browser
  // fetch and probe the actual content instead of trusting a label that
  // doesn't match what the server sends.
  const videoType = (a: Asset) => a.type === "video/quicktime" ? "" : a.type;
  // One source per video format, newest first; mp4 listed before webm so Safari picks it.
  const sources = (role: string) => {
    const seen = new Set<string>();
    return newest(role).filter(a => !seen.has(a.type) && seen.add(a.type))
      .sort((x, y) => (x.type === "video/webm" ? 1 : 0) - (y.type === "video/webm" ? 1 : 0))
      .map(a => ({ url: file(a), type: videoType(a) }));
  };
  const poster = newest("poster")[0];
  const portrait = newest("portrait")[0];
  // Each highlight clip is its own separate video, unlike hero/film where
  // multiple uploads are alternate formats of one video, so this keeps one
  // file per clip (newest first) instead of deduping down to one per type.
  const highlights = newest("highlight").slice(0, 4).map(a => ({
    url: file(a),
    type: videoType(a),
  }));

  const feed = {
    player: { slug: player.slug, name: player.name },
    updated: new Date().toISOString(),
    hero: sources("hero"),
    highlights,
    film: sources("film"),
    filmYoutubeUrl: player.filmYoutubeUrl || "",
    poster: poster ? file(poster) : null,
    portrait: portrait ? file(portrait) : null,
    photos: live.filter(a => a.role === "nil" || a.role === "editorial" || a.role === "photo").map(a => ({
      title: a.title, use: a.role, size: a.layout,
      src: file(a), thumb: img(a, 900), large: file(a), download: `${file(a)}?download=1`
    })),
    kit: live.filter(a => a.role === "kit").map(a => ({ title: a.title, type: a.type, url: file(a), download: `${file(a)}?download=1` }))
  };
  return Response.json(feed, { headers: { ...cors, "Cache-Control": "public, max-age=60" } });
};

export const config = { path: "/api/sites/:slug" };
