const crypto = require("crypto");

function checkAdminSecret(event) {
  const provided = event.headers["x-admin-secret"] || event.headers["X-Admin-Secret"];
  const expected = process.env.ADMIN_API_SECRET;
  return Boolean(expected) && provided === expected;
}

function checkPlayerToken(player, token) {
  return Boolean(player) && Boolean(player.editToken) && Boolean(token) && player.editToken === token;
}

// Session signing key: a dedicated SESSION_SECRET if set, otherwise reuse the
// existing admin secret so this doesn't require yet another manual env var.
function sessionSecret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_API_SECRET || "";
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !password) return false;
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(String(password), salt, 64).toString("hex");
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function createSessionCookie(slug) {
  const secret = sessionSecret();
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${slug}.${expires}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const value = `${payload}.${sig}`;
  return `eh_session=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

function clearSessionCookie() {
  return `eh_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function verifySessionCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const match = /(?:^|;\s*)eh_session=([^;]+)/.exec(cookieHeader);
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [slug, expiresStr, sig] = parts;
  const payload = `${slug}.${expiresStr}`;
  const expected = crypto.createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Date.now() > Number(expiresStr)) return null;
  return slug;
}

module.exports = {
  checkAdminSecret,
  checkPlayerToken,
  hashPassword,
  verifyPassword,
  createSessionCookie,
  clearSessionCookie,
  verifySessionCookie,
};
