const { checkAdminSecret } = require("./_lib/auth");
const { fetchMaxPrepsSchedule } = require("./_lib/maxpreps-scrape");

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  if (!checkAdminSecret(event)) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method not allowed" };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid JSON" }) };
  }
  if (!data.maxprepsUrl) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "maxprepsUrl is required" }) };
  }

  const games = await fetchMaxPrepsSchedule(data.maxprepsUrl);
  return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ games }) };
};
