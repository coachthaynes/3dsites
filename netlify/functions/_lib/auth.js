function checkAdminSecret(event) {
  const provided = event.headers["x-admin-secret"] || event.headers["X-Admin-Secret"];
  const expected = process.env.ADMIN_API_SECRET;
  return Boolean(expected) && provided === expected;
}

function checkPlayerToken(player, token) {
  return Boolean(player) && Boolean(player.editToken) && Boolean(token) && player.editToken === token;
}

module.exports = { checkAdminSecret, checkPlayerToken };
