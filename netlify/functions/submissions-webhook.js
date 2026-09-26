const { submissionsStore, savePlayer } = require("./_lib/blobs");

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Netlify sends file upload fields as {filename, type, size, url} instead
// of a plain string, so any field shaped like that needs unwrapping to
// just its url before it's usable as an <img>/<video> src.
function unwrapFileFields(data) {
  const out = {};
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (value && typeof value === "object" && typeof value.url === "string") {
      out[key] = value.url;
    } else {
      out[key] = value;
    }
  }
  return out;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // Netlify's forms notification payload nests under `payload`, but be lenient.
  const payload = body.payload || body;
  const formName = payload.form_name || payload.formName;
  const data = payload.data || {};

  if (!formName) {
    return { statusCode: 400, body: "Missing form_name" };
  }

  // archive every submission, regardless of form
  const store = submissionsStore();
  const id = `${formName}-${payload.id || Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await store.setJSON(id, {
    id,
    formName,
    data,
    createdAt: payload.created_at || new Date().toISOString(),
  });

  // any of the three player questionnaires also auto-creates/updates a
  // live player record; premium/elite forms carry their own hidden tier
  // field so those two land in the right tier straight away.
  const QUESTIONNAIRE_FORMS = ["player-questionnaire", "premium-questionnaire", "elite-questionnaire"];
  if (QUESTIONNAIRE_FORMS.includes(formName) && data.playerName) {
    const slug = slugify(data.playerName);
    await savePlayer(Object.assign({}, unwrapFileFields(data), { id: slug, slug, status: "published" }));
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
