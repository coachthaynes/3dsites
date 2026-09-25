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
  if (SITE_ID && TOKEN) {
    return getStore({ name, siteID: SITE_ID, token: TOKEN });
  }
  return getStore(name);
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

async function savePlayer(player) {
  if (!player.slug) throw new Error("player.slug is required");
  const store = playersStore();
  const existing = await store.get(player.slug, { type: "json" });
  const merged = Object.assign({}, existing || {}, player);
  if (!merged.editToken) {
    merged.editToken = crypto.randomBytes(18).toString("base64url");
  }
  if (!existing && !merged.templateVersion) {
    // Brand-new players get the current Essential template going forward.
    // Existing players are left on whatever template they already have
    // (nothing, meaning the original one) so their live pages don't change.
    merged.templateVersion = "v2";
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
  savePlayer,
  deletePlayer,
};
