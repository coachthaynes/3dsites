// The owner's personal name never appears on a public page or email. Any saved coach contact that
// is hers shows as the Elevate Her Team instead.
const TEAM = "Elevate Her Team";
const TEAM_EMAIL = "elevateherhoopsreport@gmail.com";
const isOwner = (s) => /\btenise\b|coachthaynes/i.test(String(s || ""));
function publicCoachName(name) { return !name || isOwner(name) ? TEAM : name; }
function publicCoachEmail(email) { return isOwner(email) ? TEAM_EMAIL : email || ""; }
module.exports = { publicCoachName, publicCoachEmail, TEAM, TEAM_EMAIL };
