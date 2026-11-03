const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");
const seed = require("../../../data/players.json");

const SITE_ID = process.env.BLOBS_SITE_ID || process.env.SITE_ID;
const TOKEN = process.env.BLOBS_TOKEN;

function makeStore(name) {
  // Zero-config getStore(name) relies on deploy context Netlify injects
  // automatically for functions built through its own build pipeline.
  // This site's deploys don't go through that path, so it never shows
  // up; fall back to explicit manual configuration when available.
  // consistency: "strong" avoids reads (list/get right after a save)
  // missing a write that only just happened.
  if (SITE_ID && TOKEN) {
    return getStore({ name, siteID: SITE_ID, token: TOKEN, consistency: "strong" });
  }
  return getStore({ name, consistency: "strong" });
}

// Same store, but eventual consistency: skips the extra hop to origin that
// "strong" forces and reads from Netlify's edge cache instead. Only safe for
// reads that don't immediately follow their own write (a public page render
// doesn't care that an admin edit from 10 seconds ago hasn't propagated yet,
// especially once the response itself is already cached for 60s).
function makeStoreFast(name) {
  if (SITE_ID && TOKEN) {
    return getStore({ name, siteID: SITE_ID, token: TOKEN });
  }
  return getStore({ name });
}

function playersStore() {
  return makeStore("players");
}

function submissionsStore() {
  return makeStore("submissions");
}

function photosStore() {
  return makeStore("photos");
}

function graphicsStore() {
  return makeStore("graphics");
}

// Essential (free) tier's single self-uploaded highlight clip. Metadata is
// one JSON entry per upload id; the raw bytes are chunked across several
// entries (<id>/<n>) so an upload fits inside the function payload limit,
// same reasoning the Visual-Dashboard's media uploader documents for its own chunking.
function highlightVideoAssetsStore() {
  return makeStore("highlight-video-assets");
}

function highlightVideoChunksStore() {
  return makeStore("highlight-video-chunks");
}

function tradingCardsStore() {
  return makeStore("trading-cards");
}

function viewsStore() {
  return makeStore("views");
}

function articlesStore() {
  return makeStore("articles");
}

async function listArticles(slug) {
  const store = articlesStore();
  const { blobs } = await store.list();
  const articles = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  const all = articles.filter(Boolean);
  const filtered = slug ? all.filter((a) => a.playerSlug === slug) : all;
  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getArticle(id) {
  const store = articlesStore();
  return store.get(id, { type: "json" });
}

async function saveArticle(article) {
  if (!article.id) article.id = crypto.randomUUID();
  const store = articlesStore();
  const existing = await store.get(article.id, { type: "json" });
  const merged = Object.assign({}, existing || {}, article);
  if (!merged.createdAt) merged.createdAt = new Date().toISOString();
  await store.setJSON(merged.id, merged);
  return merged;
}

async function deleteArticle(id) {
  const store = articlesStore();
  await store.delete(id);
}

async function incrementViews(slug) {
  const store = viewsStore();
  const current = (await store.get(slug, { type: "json" })) || 0;
  const next = current + 1;
  await store.setJSON(slug, next);
  return next;
}

async function getViews(slug) {
  const store = viewsStore();
  return (await store.get(slug, { type: "json" })) || 0;
}

async function listPlayers() {
  const store = playersStore();
  const { blobs } = await store.list();
  if (blobs.length === 0) {
    // first run: seed from the bundled data/players.json
    for (const p of seed.players) {
      await store.setJSON(p.slug, p);
    }
    return seed.players;
  }
  const players = await Promise.all(
    blobs.map((b) => store.get(b.key, { type: "json" }))
  );
  return players.filter(Boolean);
}

async function getPlayer(slug) {
  const store = playersStore();
  let player = await store.get(slug, { type: "json" });
  if (!player) {
    // fall back to seed on a cold, unseeded store
    const seeded = seed.players.find((p) => p.slug === slug);
    if (seeded) {
      await store.setJSON(slug, seeded);
      player = seeded;
    }
  }
  return player;
}

// Read-only variant for public page renders (illumination.js, elite.js,
// player.js): eventual consistency instead of strong, so it doesn't pay the
// strong-consistency origin round trip on every visitor. Never writes the
// seed fallback back either, since a public read has no business performing
// a first-time write; an unseeded store surfaces as the page's own 404 path
// the same way a missing player normally does.
async function getPlayerPublic(slug) {
  const store = makeStoreFast("players");
  const player = await store.get(slug, { type: "json" });
  if (player) return player;
  return seed.players.find((p) => p.slug === slug) || null;
}

async function savePlayer(player) {
  if (!player.slug) throw new Error("player.slug is required");
  const store = playersStore();
  const existing = await store.get(player.slug, { type: "json" });
  const merged = Object.assign({}, existing || {}, player);
  if (!merged.editToken) {
    merged.editToken = crypto.randomBytes(18).toString("base64url");
  }
  await store.setJSON(player.slug, merged);
  return merged;
}

async function deletePlayer(slug) {
  const store = playersStore();
  await store.delete(slug);
}

module.exports = {
  playersStore,
  submissionsStore,
  photosStore,
  graphicsStore,
  highlightVideoAssetsStore,
  highlightVideoChunksStore,
  tradingCardsStore,
  viewsStore,
  incrementViews,
  getViews,
  articlesStore,
  listArticles,
  getArticle,
  saveArticle,
  deleteArticle,
  listPlayers,
  getPlayer,
  getPlayerPublic,
  savePlayer,
  deletePlayer,
};
