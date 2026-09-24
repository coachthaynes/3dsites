const { getStore } = require("@netlify/blobs");
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
  listPlayers,
  getPlayer,
  savePlayer,
  deletePlayer,
};
