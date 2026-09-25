# Functions

Backs the admin dashboard (`/admin-3be6507c/`) and the 7 Essential tier
player pages. Player data lives in Netlify Blobs, not in files, so
edits and new form submissions take effect immediately with no rebuild.

## Required environment variables

- `ADMIN_API_SECRET` — shared secret the dashboard sends as the
  `X-Admin-Secret` header on every admin API call.
- `BLOBS_SITE_ID` / `BLOBS_TOKEN` — this site's deploys don't go through
  Netlify's own build pipeline, so `@netlify/blobs`'s zero-config
  auto-detection never finds a deploy context and throws
  `MissingBlobsEnvironmentError`. These two make `_lib/blobs.js` fall
  back to explicit manual configuration instead. `BLOBS_TOKEN` is a
  Netlify Personal Access Token (User settings → Applications →
  Personal access tokens).

- `GEMINI_API_KEY` — used by `admin-generate-article.js` to call
  Google's Gemini API (free tier) and write recap articles from a
  player's stats. Get one at aistudio.google.com. Without it, article
  generation returns an error but nothing else on the site is
  affected. Untested from this environment (no outbound network
  access here) — the first real generation is the real test.
- `GEMINI_MODEL` (optional) — defaults to `gemini-2.0-flash`. Override
  if Google renames or retires that model.
- `SESSION_SECRET` (optional) — signs the player login session cookie.
  If unset, `ADMIN_API_SECRET` is reused for this instead, so it's not
  strictly required, but setting a separate one means rotating the
  admin secret doesn't also log every player out.

All of the above are set under Site configuration → Environment
variables. **Changing any of them requires a new deploy before
functions pick it up.**

## Required manual setup: form notifications

Netlify Forms doesn't expose an API to configure this, so it has to be
done once by hand:

Site configuration → Forms → Form notifications → Add notification →
Outgoing webhook, URL:

`https://elevateherhoopsreport.netlify.app/.netlify/functions/submissions-webhook`

Add it for `package-inquiry`, `player-questionnaire`, `premium-questionnaire`,
and `elite-questionnaire`. Once set, every questionnaire submission (all
three tiers) automatically creates or updates that player's record, and
every submission from any of the four forms shows up under the
dashboard's Forms tab. **This has to be added for the two new premium/elite
forms specifically, or their submissions never reach the backend at all.**

## Files

- `player.js` / `directory.js` — render an Essential player's page /
  the player directory page from Blobs data. There are two Essential page
  designs, `_lib/render-essential.js` (the original, red/black, per-school
  colored one) and `_lib/render-essential-v2.js` (the newer violet/teal/
  magenta one modeled on the Jordan Reese sample profile, no per-school
  colors, just each school's logo or a text badge). Which one a player
  gets is decided once, at creation, by `player.templateVersion` set in
  `_lib/blobs.js`'s `savePlayer()`: brand-new players are stamped `"v2"`,
  players that already existed before this was added have no
  `templateVersion` and keep rendering on the original template forever,
  even as they're edited later.
- `admin-players.js` — GET (list), POST (create or update), DELETE.
  Requires `X-Admin-Secret`.
- `submissions-webhook.js` — receives the Forms notification above.
- `submissions-list.js` — GET submissions for the dashboard. Requires
  `X-Admin-Secret`.
- `_lib/` — shared render templates, the Blobs helper, and the auth
  check. Not deployed as functions themselves.
- `player-edit.js` / `player-self-save.js` / `player-login.js` /
  `player-logout.js` / `player-set-password.js` — a player's own
  self-edit page, reachable either via a one-time token link (copied
  from the dashboard) to set a password, or afterwards at
  `/player-login` with just her email and password.
- `admin-photo-upload.js` / `photo.js` — upload and serve a player
  photo. Accepts `X-Admin-Secret`, her edit token, or her login session.
- `admin-generate-article.js` / `admin-articles.js` /
  `player-articles.js` — writes a recap article from a player's stats
  via Gemini (optionally trying her MaxPreps page first, best-effort
  only), lets the coach review/edit/publish it, and serves published
  articles publicly for her page's "Latest News" section. A player's
  `tier` field (`essential` / `premium` / `elite`) also drives the
  Fulfillment tab in the dashboard and keeps Premium/Elite records out
  of the public directory and the Essential page template, since they
  have their own dedicated static sites.
