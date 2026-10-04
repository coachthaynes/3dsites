// Shared helpers for the Madi Visuals dashboard functions, ported into the
// main Elevate Her Hoops Report site so the dashboard and the Illumination
// sites it feeds live in one deploy.
import { getStore } from "@netlify/blobs";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

// Netlify functions cap a request at 6 MB, and binary bodies are base64
// encoded in transit (about 30% bigger), so the real ceiling for raw bytes
// is closer to 4.5 MB. On a slow upload connection a 4 MB chunk can also
// miss the function's execution time limit before it finishes arriving.
// 1 MB keeps every chunk comfortably clear of both ceilings; longer videos
// just mean more chunks, not bigger, riskier ones.
export const CHUNK_SIZE = 1 * 1024 * 1024;
export const MAX_FILE = 1536 * 1024 * 1024; // 1.5 GB
export const ROLES = ["hero", "film", "poster", "portrait", "nil", "editorial", "kit"] as const;
export type Role = (typeof ROLES)[number];

export interface Player {
  slug: string;
  name: string;
  siteUrl?: string;
  school?: string;
  classYear?: string;
  created: string;
}

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

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers }
  });
export const fail = (message: string, status = 400) => json({ error: message }, status);

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const newId = () => Date.now().toString(36) + randomBytes(6).toString("hex");

/* ---------- Auth: one shared dashboard password, signed session tokens ---------- */
function secret() {
  const s = process.env.DASHBOARD_SECRET || process.env.DASHBOARD_PASSWORD;
  if (!s) throw new Error("DASHBOARD_PASSWORD is not set");
  return s;
}
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function checkPassword(given: string) {
  const real = process.env.DASHBOARD_PASSWORD || "";
  const a = Buffer.from(given || ""), b = Buffer.from(real);
  return real.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

export function issueToken(days = 14) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + days * 864e5 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function authed(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now(); } catch { return false; }
}

/* ---------- Catalog access ---------- */
export async function listPlayers(): Promise<Player[]> {
  const cat = catalog();
  const { blobs } = await cat.list({ prefix: "player/" });
  const players = await Promise.all(blobs.map(b => cat.get(b.key, { type: "json" })));
  return (players.filter(Boolean) as Player[]).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPlayer(slug: string): Promise<Player | null> {
  return catalog().get(`player/${slug}`, { type: "json" });
}

export async function listAssets(slug: string): Promise<Asset[]> {
  const cat = catalog();
  const { blobs } = await cat.list({ prefix: `asset/${slug}/` });
  const assets = await Promise.all(blobs.map(b => cat.get(b.key, { type: "json" })));
  return (assets.filter(Boolean) as Asset[]).sort((a, b) => a.order - b.order || a.created.localeCompare(b.created));
}

export const assetKey = (slug: string, id: string) => `asset/${slug}/${id}`;
export async function getAsset(slug: string, id: string): Promise<Asset | null> {
  return catalog().get(assetKey(slug, id), { type: "json" });
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
export async function unindexMedia(id: string) {
  await catalog().delete(`media/${id}`);
}
