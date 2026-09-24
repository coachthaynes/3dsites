function checkAdminSecret(event) {
  const provided = event.headers["x-admin-secret"] || event.headers["X-Admin-Secret"];
  const expected = process.env.ADMIN_API_SECRET;
  return Boolean(expected) && provided === expected;
}

module.exports = { checkAdminSecret };
