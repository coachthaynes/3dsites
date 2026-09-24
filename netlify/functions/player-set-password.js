const { getPlayer, savePlayer } = require("./_lib/blobs");
const { checkPlayerToken, verifySessionCookie, hashPassword } = require("./_lib/auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { slug, token, password } = body;
  if (!password || String(password).length < 6) {
    return { statusCode: 400, body: JSON.stringify({ error: "Password must be at least 6 characters" }) };
  }

  // Identity can be proven either by her one-time setup token or an
  // already-active login session (changing her password once logged in).
  let effectiveSlug = null;
  if (slug && token) {
    const player = await getPlayer(slug);
    if (checkPlayerToken(player, token)) effectiveSlug = slug;
  }
  if (!effectiveSlug) {
    const sessionSlug = verifySessionCookie(event.headers.cookie || event.headers.Cookie);
    if (sessionSlug && (!slug || sessionSlug === slug)) effectiveSlug = sessionSlug;
  }
  if (!effectiveSlug) {
    return { statusCode: 403, body: JSON.stringify({ error: "Invalid or expired link" }) };
  }

  const player = await getPlayer(effectiveSlug);
  if (!player) {
    return { statusCode: 404, body: JSON.stringify({ error: "Player not found" }) };
  }
  if (!player.playerEmail) {
    return { statusCode: 400, body: JSON.stringify({ error: "Add your email in the form above and save before creating a password" }) };
  }

  await savePlayer({ slug: effectiveSlug, passwordHash: hashPassword(password) });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true }),
  };
};
