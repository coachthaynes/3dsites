// Link preview tags (texts, social posts) for every Elevate Her page. Message apps only read
// these from the HTML the server sends, and need full https addresses for the image.
const SITE = "https://elevateherhoopsreport.netlify.app";
const DEFAULT_IMAGE = `${SITE}/assets/elevate-her-og.jpg`;

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function absolute(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (/^\/\//.test(url)) return `https:${url}`;
  return `${SITE}${url.startsWith("/") ? "" : "/"}${url}`;
}

// title, description, image (her photo when she has one), url (the page's own address), imageAlt.
function shareTags({ title, description, image, url, imageAlt, type = "website" }) {
  const img = absolute(image) || DEFAULT_IMAGE;
  const isDefault = img === DEFAULT_IMAGE;
  return [
    `<meta property="og:type" content="${esc(type)}">`,
    `<meta property="og:site_name" content="Elevate Her Hoops Report">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    url ? `<meta property="og:url" content="${esc(absolute(url))}">` : "",
    `<meta property="og:image" content="${esc(img)}">`,
    isDefault ? `<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">` : "",
    `<meta property="og:image:alt" content="${esc(imageAlt || title)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${esc(img)}">`,
  ].filter(Boolean).join("\n");
}

module.exports = { shareTags, absolute, SITE, DEFAULT_IMAGE };
