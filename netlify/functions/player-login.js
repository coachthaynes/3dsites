const { listPlayers } = require("./_lib/blobs");
const { verifyPassword, createSessionCookie } = require("./_lib/auth");

function esc(s) {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loginPage(errorMessage) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Player Login | Elevate Her Hoops Report</title>
<meta name="robots" content="noindex, nofollow">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{ --violet:#1E1035; --panel:#241640; --line:rgba(255,255,255,0.12); --white:#FFFFFF; --dim:rgba(255,255,255,0.68); --magenta:#FF2E93; --teal:#00F5D4; }
  *{box-sizing:border-box;}
  body{margin:0;background:var(--violet);color:var(--white);font-family:'Poppins',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;}
  .card{border:1px solid var(--line);background:var(--panel);border-radius:18px;padding:32px;max-width:380px;width:100%;}
  h1{font-family:'Fredoka',sans-serif;font-size:24px;margin:0 0 6px;}
  .sub{color:var(--dim);font-size:13.5px;margin-bottom:22px;}
  .field{margin-bottom:14px;}
  label{display:block;font-size:11.5px;color:var(--dim);font-weight:600;margin-bottom:5px;}
  input{width:100%;background:#150a28;border:1px solid var(--line);border-radius:10px;padding:10px 12px;color:var(--white);font-size:14px;}
  .btn{width:100%;padding:12px;border:none;border-radius:999px;background:var(--magenta);color:var(--white);font-weight:700;font-size:14px;margin-top:8px;cursor:pointer;}
  .error{background:rgba(255,46,147,0.12);border:1px solid var(--magenta);color:var(--white);padding:10px 12px;border-radius:10px;font-size:13px;margin-bottom:16px;}
  .note{margin-top:18px;font-size:12.5px;color:var(--dim);text-align:center;}
</style>
</head>
<body>
<div class="card">
  <h1>Player Login</h1>
  <div class="sub">Sign in to edit your Elevate Her profile.</div>
  ${errorMessage ? `<div class="error">${esc(errorMessage)}</div>` : ""}
  <form method="POST" action="/player-login">
    <div class="field"><label>Email</label><input type="email" name="email" required></div>
    <div class="field"><label>Password</label><input type="password" name="password" required></div>
    <button type="submit" class="btn">Log In</button>
  </form>
  <div class="note">No password yet? Use the setup link your coach sent you to create one.</div>
</div>
</body>
</html>`;
}

function parseFormBody(event) {
  const contentType = (event.headers["content-type"] || event.headers["Content-Type"] || "").toLowerCase();
  const raw = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : (event.body || "");
  if (contentType.includes("application/json")) {
    try { return JSON.parse(raw); } catch (e) { return {}; }
  }
  const params = new URLSearchParams(raw);
  return Object.fromEntries(params.entries());
}

exports.handler = async (event) => {
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: loginPage(),
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { email, password } = parseFormBody(event);
  const players = await listPlayers();
  const player = players.find(
    (p) => p.playerEmail && email && p.playerEmail.toLowerCase() === String(email).toLowerCase()
  );

  if (!player || !verifyPassword(password, player.passwordHash)) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: loginPage("Email or password not recognized."),
    };
  }

  return {
    statusCode: 302,
    headers: {
      Location: "/my-dashboard",
      "Set-Cookie": createSessionCookie(player.slug),
    },
    body: "",
  };
};
