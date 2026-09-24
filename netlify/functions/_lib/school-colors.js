// Real school colors, researched per school (not guessed). Each entry's
// colors are an accent + a darker shade of the same color for hover states,
// picked from that school's actual palette for contrast against a black page.
// Middleburg (the default) matches this project's existing red/black brand.

const SCHOOLS = [
  {
    aliases: ["middleburg"],
    name: "Middleburg High School",
    colors: { accent: "#d0202c", accentDark: "#8c0f18" },
  },
  {
    aliases: ["clay high", "clay senior"],
    name: "Clay High School",
    colors: { accent: "#1c4fd8", accentDark: "#123a9e" },
  },
  {
    aliases: ["fleming island"],
    name: "Fleming Island High School",
    colors: { accent: "#d9a91b", accentDark: "#a37f14" },
  },
  {
    aliases: ["keystone heights"],
    name: "Keystone Heights Junior/Senior High School",
    colors: { accent: "#2b4fc4", accentDark: "#1c3689" },
  },
  {
    aliases: ["oakleaf"],
    name: "Oakleaf High School",
    colors: { accent: "#d4af17", accentDark: "#a3830e" },
  },
  {
    aliases: ["orange park"],
    name: "Orange Park High School",
    colors: { accent: "#e0672b", accentDark: "#a34a1d" },
  },
  {
    aliases: ["ridgeview"],
    name: "Ridgeview High School",
    colors: { accent: "#24438f", accentDark: "#172e63" },
  },
  {
    aliases: ["andrew jackson"],
    name: "Andrew Jackson High School",
    colors: { accent: "#c62828", accentDark: "#8e1c1c" },
  },
  {
    aliases: ["atlantic coast"],
    name: "Atlantic Coast High School",
    colors: { accent: "#c1521c", accentDark: "#8a3a14" },
  },
  {
    aliases: ["baldwin"],
    name: "Baldwin Middle-Senior High School",
    colors: { accent: "#b1272b", accentDark: "#7c1b1e" },
  },
  {
    aliases: ["edward h. white", "edward h white", "ed white"],
    name: "Edward H. White High School",
    colors: { accent: "#1f7a3d", accentDark: "#145128" },
  },
  {
    aliases: ["englewood"],
    name: "Englewood High School",
    colors: { accent: "#c9a227", accentDark: "#8f7319" },
  },
  {
    aliases: ["first coast"],
    name: "First Coast High School",
    colors: { accent: "#2f6fd6", accentDark: "#1f4b95" },
  },
  {
    aliases: ["duncan u. fletcher", "duncan fletcher", "fletcher"],
    name: "Duncan U. Fletcher High School",
    colors: { accent: "#6a2c91", accentDark: "#481d63" },
  },
  {
    aliases: ["mandarin"],
    name: "Mandarin High School",
    colors: { accent: "#d97a1f", accentDark: "#9c5714" },
  },
  {
    aliases: ["paxon"],
    name: "Paxon School for Advanced Studies",
    colors: { accent: "#2541a8", accentDark: "#172c6e" },
  },
  {
    aliases: ["william m. raines", "william raines", "raines"],
    name: "William M. Raines High School",
    colors: { accent: "#9e1b32", accentDark: "#6b1322" },
  },
  {
    aliases: ["jean ribault", "ribault"],
    name: "Jean Ribault High School",
    colors: { accent: "#5b9bd5", accentDark: "#3b6ea3" },
  },
  {
    aliases: ["riverside"],
    name: "Riverside High School",
    colors: { accent: "#7fc41c", accentDark: "#588a13" },
  },
  {
    aliases: ["sandalwood"],
    name: "Sandalwood High School",
    colors: { accent: "#2f5fa8", accentDark: "#1f4275" },
  },
  {
    aliases: ["stanton"],
    name: "Stanton College Preparatory School",
    colors: { accent: "#2648b0", accentDark: "#182f79" },
  },
  {
    aliases: ["terry parker"],
    name: "Terry Parker High School",
    colors: { accent: "#b3272c", accentDark: "#7c1b1f" },
  },
  {
    aliases: ["westside"],
    name: "Westside High School",
    colors: { accent: "#a63232", accentDark: "#732323" },
  },
  {
    aliases: ["samuel w. wolfson", "samuel wolfson", "wolfson"],
    name: "Samuel W. Wolfson High School",
    colors: { accent: "#d1262c", accentDark: "#8f1a1e" },
  },
  {
    aliases: ["allen d. nease", "allen nease", "nease"],
    name: "Allen D. Nease High School",
    colors: { accent: "#2f8f4e", accentDark: "#1f6136" },
  },
  {
    aliases: ["bartram trail"],
    name: "Bartram Trail High School",
    colors: { accent: "#2a4d8f", accentDark: "#1b3260" },
  },
  {
    aliases: ["beachside"],
    name: "Beachside High School",
    colors: { accent: "#6fbf3a", accentDark: "#4c8527" },
  },
  {
    aliases: ["creekside"],
    name: "Creekside High School",
    colors: { accent: "#b8262c", accentDark: "#801a1f" },
  },
  {
    aliases: ["pedro menendez", "menendez"],
    name: "Pedro Menendez High School",
    colors: { accent: "#c5a028", accentDark: "#927619" },
  },
  {
    aliases: ["ponte vedra"],
    name: "Ponte Vedra High School",
    colors: { accent: "#4fa8d8", accentDark: "#35748f" },
  },
  {
    aliases: ["st. augustine", "st augustine", "saint augustine"],
    name: "St. Augustine High School",
    colors: { accent: "#7a1f2b", accentDark: "#551620" },
  },
  {
    aliases: ["tocoi creek"],
    name: "Tocoi Creek High School",
    colors: { accent: "#c1591f", accentDark: "#8a3f15" },
  },
];

const DEFAULT_COLORS = SCHOOLS[0].colors; // Middleburg red/black

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/high school|senior high|junior\/senior|school for advanced studies/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSchoolColors(highSchool) {
  const normalized = normalize(highSchool);
  if (!normalized) return DEFAULT_COLORS;
  for (const school of SCHOOLS) {
    for (const alias of school.aliases) {
      const normalizedAlias = normalize(alias);
      if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
        return school.colors;
      }
    }
  }
  return DEFAULT_COLORS;
}

module.exports = { getSchoolColors, SCHOOLS };
