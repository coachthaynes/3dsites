/* Elevate Her · Illumination site config for Kennedy Jeffress.
   Everything on the page comes from this file. Photos and videos come from the
   Visual-Dashboard (media.dashboard + media.slug), with files in media/ as a fallback.
   Keep visible text free of hyphens and dashes. */
window.SITE = {
  player: {
    first: "Kennedy",
    last: "Jeffress",
    number: "2",
    position: "Guard",
    school: "Middleburg High School",
    schoolShort: "Middleburg HS",
    location: "Middleburg, FL",
    classYear: "2029",
    height: "5'6\"",
    team: "Middleburg Lady Broncos",
    program: "Lady Broncos Basketball"
  },

  theme: { accent: "#e31b23", accent2: "#ff5a61", glow: "rgba(227, 27, 35, 0.4)" },

  media: {
    dashboard: "https://elevateherhoopsreport.com",
    slug: "kennedy-jeffress"
  },

  bio: "A fearless scorer with quick hands on defense. As a freshman Kennedy led the Lady Broncos attack, pouring in 380 points while averaging 17.3 points and 3.2 steals per game.",

  stats: {
    seasonLabel: "Freshman",
    total: { v: "380", text: "total points scored in her freshman season." },
    averages: [
      { v: "17.3", l: "Points", hot: true, count: true },
      { v: "4.1", l: "Rebounds", count: true },
      { v: "3.2", l: "Steals", hot: true, count: true },
      { v: "2.3", l: "Assists", count: true },
      { v: "0.2", l: "Blocks", count: true }
    ],
    table: {
      columns: ["Freshman", "Sophomore", "Junior", "Senior"],
      rows: [
        ["Points", "17.3", "", "", ""],
        ["Rebounds", "4.1", "", "", ""],
        ["Steals", "3.2", "", "", ""],
        ["Assists", "2.3", "", "", ""],
        ["Blocks", "0.2", "", "", ""]
      ]
    },
    splits: {
      title: "Hot start: first five games",
      source: "Source: Hudl team report",
      tiles: [
        { v: "106", l: "Points", hot: true },
        { v: "21.2", l: "Points per game", hot: true },
        { v: "148", l: "Minutes" },
        { v: "+9", l: "Plus minus" },
        { v: "41.5%", l: "Effective FG" }
      ],
      meters: [
        { pct: "38.7", made: 41, att: 106, label: "Field goals" },
        { pct: "45.5", made: 35, att: 77, label: "Two pointers" },
        { pct: "20.7", made: 6, att: 29, label: "Three pointers" },
        { pct: "60.0", made: 18, att: 30, label: "Free throws" }
      ]
    }
  },

  testingNote: "Preseason testing is scheduled for October 10. Numbers post here as soon as they are recorded.",
  measurables: [
    { k: "Height", v: "5'6\"" },
    { k: "Weight" },
    { k: "Standing reach" },
    { k: "Wingspan" },
    { k: "Shoe size" }
  ],
  testing: [
    { k: "Standing vertical", v: "Oct 10", pending: true },
    { k: "Max vertical", v: "Oct 10", pending: true },
    { k: "Bench / Dead / Squat", v: "Oct 10", pending: true },
    { k: "Lane agility", v: "Oct 10", pending: true },
    { k: "Shuttle run", v: "Oct 10", pending: true },
    { k: "Three quarter sprint", v: "Oct 10", pending: true }
  ],
  academics: [
    { k: "GPA", v: "On request", pending: true },
    { k: "SAT", v: "On request", pending: true },
    { k: "ACT", v: "On request", pending: true },
    { k: "Dual enrollment", v: "On request", pending: true },
    { k: "NCAA ID", v: "On request", pending: true },
    { k: "Current offers", v: "On request", pending: true }
  ],
  academicsNote: "College coaches can request transcripts and academic details through Coach Haynes.",

  film: {
    links: [
      { name: "Hudl", desc: "Full game film and highlights", url: "" },
      { name: "Field Level", desc: "Recruiting profile", url: "" },
      { name: "MaxPreps", desc: "Box scores and season stats", url: "" },
      { name: "YouTube", desc: "Highlights and game film", url: "" }
    ]
  },

  schedule: {
    title: "2026/27 Season Schedule",
    note: "Varsity tip times shown. Times and locations can change, so check with the school before you travel.",
    /* loc: "Home", "Away" or "TBD". Add result after each game, for example "W 54 41". */
    games: [
      { date: "2026-11-12", opp: "Beachside Preseason", loc: "Away", time: "TBD" },
      { date: "2026-11-13", opp: "Beachside Preseason", loc: "Away", time: "TBD" },
      { date: "2026-11-16", opp: "Temple Christian", loc: "Home", time: "6:00 PM", note: "Triple header" },
      { date: "2026-11-18", opp: "Tocoi Creek", loc: "Home", time: "7:30 PM", note: "JV 6:00" },
      { date: "2026-11-20", opp: "Spruce Creek", loc: "Home", time: "7:30 PM", note: "JV 6:00" },
      { date: "2026-11-25", opp: "IE Thanksgiving Tournament", loc: "TBD", time: "TBD", tag: "Tournament" },
      { date: "2026-11-26", opp: "IE Thanksgiving Tournament", loc: "TBD", time: "TBD", tag: "Tournament" },
      { date: "2026-12-01", opp: "Duval Charter", loc: "Home", time: "6:00 PM", note: "Triple header" },
      { date: "2026-12-03", opp: "Beachside", loc: "Away", time: "7:30 PM", note: "JV 6:00" },
      { date: "2026-12-04", opp: "Ridgeview", loc: "Away", time: "6:00 PM" },
      { date: "2026-12-07", opp: "Bolles", loc: "Away", time: "6:00 PM", note: "Varsity only" },
      { date: "2026-12-09", opp: "Episcopal", loc: "Away", time: "7:30 PM", note: "JV 6:00" },
      { date: "2026-12-14", opp: "Clay", loc: "Home", time: "7:30 PM", note: "JV 6:00" },
      { date: "2026-12-16", opp: "Oakleaf", loc: "Away", time: "6:00 PM" },
      { date: "2027-01-05", opp: "Creekside", loc: "Away", time: "6:00 PM", note: "Varsity only" },
      { date: "2027-01-07", opp: "Fleming Island", loc: "Away", time: "6:00 PM", note: "Triple header" },
      { date: "2027-01-08", opp: "Jackson", loc: "Away", time: "6:00 PM", note: "Varsity only" },
      { date: "2027-01-11", opp: "St. Augustine", loc: "Away", time: "7:30 PM", note: "JV 6:00" },
      { date: "2027-01-12", opp: "Bartram Trail", loc: "Away", time: "7:30 PM", note: "JV 6:00" },
      { date: "2027-01-14", opp: "Nease", loc: "Home", time: "7:30 PM", note: "JV 6:00" },
      { date: "2027-01-20", opp: "FSDB", loc: "Home", time: "6:00 PM", tag: "Senior Night" },
      { date: "2027-01-22", opp: "Pedro Menendez", loc: "Away", time: "7:30 PM", note: "JV 6:00" },
      { date: "2027-01-25", opp: "Orange Park", loc: "Home", time: "5:30 PM" },
      { date: "2027-01-26", opp: "Bradford", loc: "Away", time: "6:00 PM", note: "Triple header" },
      { date: "2027-01-28", opp: "Ponte Vedra", loc: "Away", time: "6:00 PM", note: "Varsity only" }
    ]
  },

  /* Articles, scouting reports or coach evaluations. Newest first.
     Use url for an outside article, or body (a list of paragraphs) to show the full writeup here.
     { kind: "Scouting report", title: "...", source: "...", date: "2026-12-05", excerpt: "...", url: "https://..." } */
  writeups: [],

  contact: {
    approver: "Coach Haynes",
    email: "elevateherhoopsreport@gmail.com",
    people: [
      { role: "Player", who: "Kennedy Jeffress", detail: "Phone and email on request" },
      { role: "Parent or guardian", who: "Jeffress Family", detail: "Phone on request" },
      { role: "Head Coach", who: "Tenise Haynes", detail: "Phone and email on request" }
    ]
  },

  /* Local fallback photos in media/photos/ (used until the Visual-Dashboard gets an upload).
     size: "tall", "wide" or "". */
  photos: [
    { file: "portrait.jpg", title: "Studio portrait", size: "tall" },
    { file: "action_drive.jpg", title: "Drive to the rim", size: "wide" },
    { file: "ballhandling.jpg", title: "Handles", size: "" },
    { file: "jumper.jpg", title: "Pull up jumper", size: "" },
    { file: "lifestyle.jpg", title: "Lifestyle", size: "tall" },
    { file: "steal.jpg", title: "Lockdown defense", size: "" },
    { file: "brand_hold.jpg", title: "Product hold", size: "" },
    { file: "headshot.jpg", title: "Headshot", size: "" },
    { file: "celebration.jpg", title: "Bench energy", size: "wide" }
  ]
};
