const { submissionsStore } = require("./_lib/blobs");
const { checkAdminSecret } = require("./_lib/auth");

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Secret",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  if (!checkAdminSecret(event)) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };
  }
  const store = submissionsStore();
  const { blobs } = await store.list();
  const submissions = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  submissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return {
    statusCode: 200,
    headers: { ...cors, "Content-Type": "application/json" },
    body: JSON.stringify({ submissions: submissions.filter(Boolean) }),
  };
};
