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

  const target = new URL(`/.netlify/functions/illumination?slug=${encodeURIComponent(slug)}`, req.url);
  return fetch(target, { headers: req.headers });
};

export const config: Config = { path: "/*" };
