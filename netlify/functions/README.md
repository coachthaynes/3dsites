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

All three are set under Site configuration → Environment variables.
**Changing any of them requires a new deploy before functions pick it
up.**

## Required manual setup: form notifications

Netlify Forms doesn't expose an API to configure this, so it has to be
done once by hand:

Site configuration → Forms → Form notifications → Add notification →
Outgoing webhook, URL:

`https://elevateherhoopsreport.netlify.app/.netlify/functions/submissions-webhook`

Add it for both `package-inquiry` and `player-questionnaire`. Once set,
every questionnaire submission automatically creates or updates that
player's live page, and every submission (either form) shows up under
the dashboard's Forms tab.

## Files

- `player.js` / `directory.js` — render an Essential player's page /
  the player directory page from Blobs data.
- `admin-players.js` — GET (list), POST (create or update), DELETE.
  Requires `X-Admin-Secret`.
- `submissions-webhook.js` — receives the Forms notification above.
- `submissions-list.js` — GET submissions for the dashboard. Requires
  `X-Admin-Secret`.
- `_lib/` — shared render templates, the Blobs helper, and the auth
  check. Not deployed as functions themselves.
