// Shared helpers for the Illumination media functions (hero video, highlight
// clips, photos, etc. for Illumination tier players), ported into the main
// Elevate Her Hoops Report site so they live in one deploy with everything
// else. Player records themselves live in _lib/blobs.js, same as every
// other tier - these helpers are asset storage only.
import { getStore } from "@netlify/blobs";
import { randomBytes } from "node:crypto";

// Netlify functions cap a request at 6 MB, and binary bodies are base64
// encoded in transit (about 30% bigger), so the real ceiling for raw bytes
// is closer to 4.5 MB. On a slow upload connection a 4 MB chunk can also
// miss the function's execution time limit before it finishes arriving.
// 1 MB keeps every chunk comfortably clear of both ceilings; longer videos
// just mean more chunks, not bigger, riskier ones.
export const CHUNK_SIZE = 1 * 1024 * 1024;
export const MAX_FILE = 1536 * 1024 * 1024; // 1.5 GB
// "nil" and "editorial" are kept only so assets already tagged with them
// keep validating; new uploads use the unified "photo" role instead, since
// the live Illumination page shows one Photo Gallery with no NIL/Editorial
// distinction at all.
export const ROLES = ["hero", "highlight", "film", "poster", "portrait", "nil", "editorial", "photo", "kit"] as const;
export type Role = (typeof ROLES)[number];

export interface Asset {
  id: string;
  slug: string;
  name: string;
  type: string;
  size: number;
  chunks: number;
  chunkSize: number;
  title: string;
  role: Role;
  layout: "" | "tall" | "wide";
  live: boolean;
  order: number;
  status: "uploading" | "ready";
  created: string;
}

// This site's deploys don't go through Netlify's own build pipeline, so the
// zero-config getStore(name) never picks up deploy context automatically.
// Fall back to explicit site ID and token, matching _lib/blobs.js.
const SITE_ID = process.env.BLOBS_SITE_ID || process.env.SITE_ID;
const TOKEN = process.env.BLOBS_TOKEN;
function store(name: string) {
  if (SITE_ID && TOKEN) return getStore({ name, siteID: SITE_ID, token: TOKEN, consistency: "strong" });
  return getStore({ name, consistency: "strong" });
}
export const catalog = () => store("madi-catalog");
export const media = () => store("madi-media");

// Same stores, eventual consistency: skips the extra hop to origin that
// "strong" forces on every single read. Once an asset's chunks are written
// and its status flips to "ready" nothing writes to that id again, so a
// public read (the Illumination site's media feed and the actual video/
// photo bytes behind it) never needs the freshly-written guarantee "strong"
// exists for - it was only ever needed on the dashboard's own read-after-
// write admin flows, which keep using catalog()/media() above unchanged.
function storeFast(name: string) {
  if (SITE_ID && TOKEN) return getStore({ name, siteID: SITE_ID, token: TOKEN });
  return getStore({ name });
}
export const catalogFast = () => storeFast("madi-catalog");
export const mediaFast = () => storeFast("madi-media");

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers }
  });
export const fail = (message: string, status = 400) => json({ error: message }, status);

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const newId = () => Date.now().toString(36) + randomBytes(6).toString("hex");

// Same admin login as the rest of the dashboard (X-Admin-Secret against
// ADMIN_API_SECRET) - these media endpoints used to have their own separate
// password, now they just check the one everything else already checks.
export function adminAuthed(req: Request) {
  const provided = req.headers.get("x-admin-secret") || "";
  const expected = process.env.ADMIN_API_SECRET || "";
  return Boolean(expected) && provided === expected;
}

/* ---------- Catalog access ---------- */
export async function listAssets(slug: string): Promise<Asset[]> {
  const cat = catalog();
  const { blobs } = await cat.list({ prefix: `asset/${slug}/` });
  const assets = await Promise.all(blobs.map(b => cat.get(b.key, { type: "json" })));
  return (assets.filter(Boolean) as Asset[]).sort((a, b) => a.order - b.order || a.created.localeCompare(b.created));
}
export async function listAssetsFast(slug: string): Promise<Asset[]> {
  const cat = catalogFast();
  const { blobs } = await cat.list({ prefix: `asset/${slug}/` });
  const assets = await Promise.all(blobs.map(b => cat.get(b.key, { type: "json" })));
  return (assets.filter(Boolean) as Asset[]).sort((a, b) => a.order - b.order || a.created.localeCompare(b.created));
}

export const assetKey = (slug: string, id: string) => `asset/${slug}/${id}`;
export async function getAsset(slug: string, id: string): Promise<Asset | null> {
  return catalog().get(assetKey(slug, id), { type: "json" });
}
export async function getAssetFast(slug: string, id: string): Promise<Asset | null> {
  return catalogFast().get(assetKey(slug, id), { type: "json" });
}
export async function saveAsset(a: Asset) {
  await catalog().setJSON(assetKey(a.slug, a.id), a);
}

export async function deleteAssetData(a: Asset) {
  const m = media();
  await Promise.all(Array.from({ length: a.chunks }, (_, n) => m.delete(`${a.id}/${n}`)));
  await catalog().delete(assetKey(a.slug, a.id));
}

/* Media ids are global; this index lets /madi-media/:id find its asset record. */
export async function indexMedia(id: string, slug: string) {
  await catalog().setJSON(`media/${id}`, { slug });
}
export async function lookupMedia(id: string): Promise<Asset | null> {
  const ref = await catalog().get(`media/${id}`, { type: "json" }) as { slug: string } | null;
  return ref ? getAsset(ref.slug, id) : null;
}
// Public read path (madi-media.mts): eventual consistency. Called once per
// byte-range request a video player makes, so this is the hottest of these
// reads by far.
export async function lookupMediaFast(id: string): Promise<Asset | null> {
  const ref = await catalogFast().get(`media/${id}`, { type: "json" }) as { slug: string } | null;
  return ref ? getAssetFast(ref.slug, id) : null;
}
export async function unindexMedia(id: string) {
  await catalog().delete(`media/${id}`);
}
