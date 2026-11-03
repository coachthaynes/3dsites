import type { Context, Config } from "@netlify/edge-functions";

// Serves a player's Illumination site on her own subdomain, for example
// test-player.elevateherhoopsreport.com, once that wildcard domain is
// attached to this Netlify project. The subdomain is just the player's
// slug. Everything else (the main site, static assets, other functions,
// deploy previews) passes straight through untouched.
const BASE_DOMAIN = "elevateherhoopsreport.com";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];

  const isPlayerSubdomain =
    host !== BASE_DOMAIN &&
    host !== `www.${BASE_DOMAIN}` &&
    !host.endsWith(".netlify.app") &&
    host !== "localhost" &&
    host.endsWith(`.${BASE_DOMAIN}`);

  if (!isPlayerSubdomain || url.pathname !== "/") {
    return context.next();
  }

  const slug = host.slice(0, host.length - BASE_DOMAIN.length - 1);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return context.next();
  }

  // fetch() here would start a brand new top-level request chain rather than
  // continuing this one (Netlify's own edge function docs call this out
  // directly), which is what was silently dropping the slug for every player
  // subdomain. nextRequest() continues the same chain with a rewritten
  // request instead, so it reaches the illumination function correctly.
  const target = new URL(`/.netlify/functions/illumination?slug=${encodeURIComponent(slug)}`, req.url);
  return context.nextRequest(new Request(target, req));
};

// Scoped to exactly the one path this function ever acts on (every other
// path hits the early "not root" return above and does nothing). A blanket
// "/*" here also matched the internal rewritten target of every other
// ?field=:splat redirect on the site (/illumination/*, /elite/*, /players/*,
// and so on), running this function a second time against paths like
// /.netlify/functions/illumination that have nothing to do with subdomains,
// for no reason. Scoping it to "/" removes it from that path entirely.
export const config: Config = { path: "/" };
