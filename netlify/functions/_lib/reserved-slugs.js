// Illumination players are reachable at a bare root URL
// (elevateherhoopsreport.com/<slug>, see netlify.toml's trailing catch-all),
// so a player's slug must never collide with a real top-level file or
// directory name, or that static asset would shadow her page. Keep this list
// in sync with the repo's actual top-level contents.
const RESERVED_SLUGS = new Set([
  "admin-3be6507c",
  "aiyana-haynes",
  "assets",
  "data",
  "elite-questionnaire.html",
  "elite-questionnaire",
  "essential-mockup.html",
  "essential-mockup",
  "illumination-assets",
  "illumination-questionnaire.html",
  "illumination-questionnaire",
  "index.html",
  "index",
  "kennedy-jeffress",
  "madi-dashboard",
  "media",
  "netlify",
  "netlify-forms.html",
  "netlify-forms",
  "node_modules",
  "package-lock.json",
  "package.json",
  "player-questionnaire.html",
  "player-questionnaire",
  "privacy-policy.html",
  "privacy-policy",
  // route prefixes other tiers and features already own
  "players",
  "elite",
  "illumination",
  "player-photos",
  "trading-card",
  "player-graphics",
  "player-videos",
  "edit-player",
  "save-player",
  "player-login",
  "my-dashboard",
  "player-logout",
  "set-player-password",
  "player-articles",
  "players-directory.html",
  "players-directory",
]);

// Appends a suffix instead of rejecting, since this runs in the unattended
// public questionnaire path too, where a real signup should never fail.
function sanitizeSlug(slug) {
  return RESERVED_SLUGS.has(slug) ? `${slug}-player` : slug;
}

module.exports = { RESERVED_SLUGS, sanitizeSlug };
