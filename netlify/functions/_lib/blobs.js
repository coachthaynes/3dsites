const { getStore } = require("@netlify/blobs");
const seed = require("../../../data/players.json");

function playersStore() {
  return getStore("players");
}

function submissionsStore() {
  return getStore("submissions");
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
  listPlayers,
  getPlayer,
  savePlayer,
  deletePlayer,
};
