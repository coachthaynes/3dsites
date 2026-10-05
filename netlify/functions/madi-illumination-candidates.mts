import { authed, listPlayers as listMadiPlayers, json, fail } from "./_lib/madi-core.mts";
import { listPlayers as listSitePlayers } from "./_lib/blobs.js";

// GET /api/illumination-candidates
// Illumination tier players that already exist on the main site (created by
// the Illumination questionnaire or added by hand on the admin dashboard's
// Illumination tab) but don't have a matching Madi catalog entry yet. Lets
// the Madi dashboard's Add player site dialog offer these to pick from
// instead of her slug being typed in from scratch, which is how a mismatch
// between the two records (and the Missing slug / not picked up bugs that
// come from one) happens in the first place.
export default async (req: Request) => {
  if (!authed(req)) return fail("Sign in required", 401);
  if (req.method !== "GET") return fail("Method not allowed", 405);

  const [sitePlayers, madiPlayers] = await Promise.all([listSitePlayers(), listMadiPlayers()]);
  const takenSlugs = new Set(madiPlayers.map((p) => p.slug));
  const candidates = sitePlayers
    .filter((p: any) => p.tier === "illumination" && p.slug && !takenSlugs.has(p.slug))
    .map((p: any) => ({
      slug: p.slug,
      name: p.playerName || p.slug,
      school: p.highSchool || "",
      classYear: p.gradYear || "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return json({ candidates });
};

export const config = { path: "/api/illumination-candidates" };
