import { authed, getPlayer as getMadiPlayer, fail, json } from "./_lib/madi-core.mts";
import { getPlayer, saveIlluminationQueueItem } from "./_lib/blobs.js";

// POST /api/notify-illumination { slug }
// Tells Elevate Her Hoops Report that this player's design is ready for review.
// Now that the dashboard lives in the same site, this writes straight into the
// Illumination review queue instead of calling out over HTTP. This never
// publishes anything by itself, it only queues the item for the coach to
// approve from the Illumination tab before her site goes live.
export default async (req: Request) => {
  if (!authed(req)) return fail("Sign in required", 401);
  if (req.method !== "POST") return fail("Method not allowed", 405);

  const body = await req.json().catch(() => null);
  const slug = String(body?.slug || "").trim().toLowerCase();
  if (!slug) return fail("slug is required");

  const madiPlayer = await getMadiPlayer(slug);
  if (!madiPlayer) return fail("Unknown player", 404);

  const previewUrl = `${new URL(req.url).origin}/illumination/${encodeURIComponent(slug)}`;
  const existingPlayer = await getPlayer(slug);
  const item = await saveIlluminationQueueItem({
    slug,
    playerName: madiPlayer.name || (existingPlayer && existingPlayer.playerName) || slug,
    previewUrl,
    status: "pending",
    receivedAt: new Date().toISOString(),
  });

  return json({ item });
};

export const config = { path: "/api/notify-illumination" };
