# Functions

Backs the admin dashboard (`/admin-3be6507c/`) and the 7 Essential tier
player pages. Player data lives in Netlify Blobs, not in files, so
edits and new form submissions take effect immediately with no rebuild.

## Required environment variable

- `ADMIN_API_SECRET` — shared secret the dashboard sends as the
  `X-Admin-Secret` header on every admin API call. Set under Site
  configuration → Environment variables. **Changing this value requires
  a new deploy before functions pick it up.**

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
