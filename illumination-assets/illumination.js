/* Elevate Her · Illumination package renderer.
   Reads window.SITE (from site.js) and builds the page. Media comes from the
   Madi Visuals dashboard when SITE.media.dashboard is set, with the files in
   media/ as a fallback. Shared by every Illumination site: edit site.js, not this file. */
(function () {
  const S = window.SITE;
  if (!S) { document.body.innerHTML = "<p style='padding:40px'>site.js is missing.</p>"; return; }
  const P = S.player;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function youtubeEmbedUrl(url) {
    if (!url) return "";
    const patterns = [
      /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
      /youtube\.com\/watch\?[^#]*v=([a-zA-Z0-9_-]{6,})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
    ];
    for (const re of patterns) {
      const m = String(url).match(re);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
    }
    return "";
  }
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const toDate = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
  const fullName = `${P.first} ${P.last}`;
  const approver = S.contact.approver;

  /* ---------- Theme and meta ---------- */
  const root = document.documentElement.style;
  if (S.theme?.accent) root.setProperty("--accent", S.theme.accent);
  if (S.theme?.accent2) root.setProperty("--accent-2", S.theme.accent2);
  if (S.theme?.glow) root.setProperty("--accent-glow", S.theme.glow);
  document.title = `${fullName} #${P.number}`;
  const desc = `${fullName}, #${P.number} ${P.position.toLowerCase()} for the ${P.team}, Class of ${P.classYear}. Highlights, stats, film, NIL partnerships and licensed photos.`;
  $('meta[name="description"]').content = desc;
  $('meta[property="og:title"]').content = `${fullName} #${P.number} | ${P.team}`;
  $('meta[property="og:description"]').content = desc;

  /* ---------- Simple bindings ---------- */
  const binds = {
    number: P.number, team: P.team, first: P.first, last: P.last, bio: S.bio,
    testingNote: S.testingNote, academicsNote: S.academicsNote,
    scheduleTitle: S.schedule.title, scheduleNote: S.schedule.note, nilIntro: S.nil.intro
  };
  $$("[data-bind]").forEach(el => { el.textContent = binds[el.dataset.bind] ?? ""; });
  $("#name").setAttribute("aria-label", fullName);
  $("#brand").innerHTML = `${esc(P.first[0])}<em>.</em>${esc(P.last)} <em>#${esc(P.number)}</em>`;
  $("#meta").innerHTML = [`<b>#${esc(P.number)}</b>`, esc(P.position), esc(P.school), `Class of <b>${esc(P.classYear)}</b>`].map(t => `<span>${t}</span>`).join("");
  $("#portraitTag").innerHTML = esc(P.program).replace(" ", "<br>");
  $("#portraitImg").alt = `${fullName} portrait`;
  $("#footLeft").textContent = `${fullName} #${P.number} · ${P.team} · Class of ${P.classYear}`;
  $("#facts").innerHTML = [
    ["Jersey", `#${P.number}`], ["Position", P.position], ["Class", P.classYear],
    ["Height", P.height], ["School", P.schoolShort || P.school], ["Location", P.location]
  ].map(([k, v]) => `<div class="fact"><dt>${esc(k)}</dt><dd>${esc(v || "TBD")}</dd></div>`).join("");

  /* ---------- Stats ---------- */
  const st = S.stats;
  const tile = t => `<div class="stat${t.hot ? " hot" : ""}"><div class="v"${t.count ? ` data-count="${esc(t.v)}"` : ""}>${esc(t.v)}</div><div class="l">${esc(t.l)}</div></div>`;
  let statsHtml = `
    <p class="eyebrow fade">Season stats</p>
    <h2 class="fade">${esc(st.seasonLabel)} <span class="lit">Season</span></h2>`;
  if (st.total) statsHtml += `<div class="total fade"><span class="v" data-count="${esc(st.total.v)}">${esc(st.total.v)}</span><p>${esc(st.total.text)}</p></div>`;
  statsHtml += `<div class="bigstats fade">${st.averages.map(tile).join("")}</div>`;
  if (st.table) {
    statsHtml += `<div class="table-wrap fade"><table><caption class="sr">Per game averages by season</caption>
      <thead><tr><th scope="col">Per game</th>${st.table.columns.map(c => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
      <tbody>${st.table.rows.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(v => v === "" || v == null ? `<td class="soon">Upcoming</td>` : `<td class="now">${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  if (st.splits) {
    statsHtml += `<div class="subhead fade"><h3>${esc(st.splits.title)}</h3><small>${esc(st.splits.source || "")}</small></div>
      <div class="bigstats fade" style="margin-top:18px">${st.splits.tiles.map(tile).join("")}</div>
      <div class="split fade">${st.splits.meters.map(m => `<div class="meter"><div class="row"><span class="pct">${esc(m.pct)}%</span><span class="att">${esc(m.made)} of ${esc(m.att)}</span></div><div class="bar"><i data-w="${esc(m.pct)}"></i></div><div class="lbl">${esc(m.label)}</div></div>`).join("")}</div>`;
  }
  $("#statsWrap").innerHTML = statsHtml;

  /* ---------- Measurables, testing, academics ---------- */
  const chips = list => list.map(c => `<div class="chip${c.v && !c.pending ? " set" : ""}"><div class="k">${esc(c.k)}</div><div class="v${!c.v || c.pending ? " pending" : ""}">${esc(c.v || "Pending")}</div></div>`).join("");
  $("#measurables").innerHTML = chips(S.measurables);
  $("#testing").innerHTML = chips(S.testing);
  $("#academics").innerHTML = chips(S.academics);

  /* ---------- Film links ---------- */
  const arrow = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M9 7h8v8"/></svg>`;
  $("#filmLinks").innerHTML = S.film.links.map(l => l.url
    ? `<a class="link" href="${esc(l.url)}" target="_blank" rel="noopener"><div><b>${esc(l.name)}</b><span>${esc(l.desc)}</span></div>${arrow}</a>`
    : `<a class="link pending" aria-disabled="true"><div><b>${esc(l.name)}</b><span>Link coming soon</span></div>${arrow}</a>`).join("");

  /* ---------- NIL ---------- */
  $("#nilRules").innerHTML = S.nil.rules.map(r => `<li>${esc(r)}</li>`).join("");
  $("#mailFallback").href = `mailto:${S.contact.email}?subject=${encodeURIComponent("NIL opportunity for " + fullName)}`;

  /* ---------- Contact (private, by request) ---------- */
  const lock = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
  $("#contactIntro").textContent = `To protect ${P.first}'s privacy, contact details are shared by request only. Tell us who you are and ${approver} will review your request and send the information directly to you once it is approved.`;
  $("#contactCards").innerHTML = S.contact.people.map(c => `<div class="card fade"><div class="role">${esc(c.role)}</div><div class="who">${esc(c.who)}</div><span class="lock">${lock}${esc(c.detail)}</span></div>`).join("");
  $('#contactForm input[name="subject"]').value = `Contact request for ${fullName}`;

  /* ---------- Hero video availability ---------- */
  const heroVideo = $("#heroVideo"), filmVideo = $("#filmVideo");
  let heroFailed = false;
  const noVideo = () => { heroFailed = true; document.body.classList.add("no-video"); };

  /* ---------- Full game film: uploaded clip, else a YouTube embed, else "coming soon" ---------- */
  const filmFrame = filmVideo.closest(".player-frame");
  let filmYoutubeIframe = null;
  function showFilmYoutube(embedUrl) {
    if (!filmYoutubeIframe) {
      filmYoutubeIframe = document.createElement("iframe");
      filmYoutubeIframe.title = `${fullName} full game film`;
      filmYoutubeIframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      filmYoutubeIframe.allowFullscreen = true;
      filmYoutubeIframe.loading = "lazy";
      filmFrame.appendChild(filmYoutubeIframe);
    }
    filmYoutubeIframe.src = embedUrl;
    filmVideo.style.display = "none";
    $("#filmPh").style.display = "none";
  }
  function hideFilmYoutube() {
    if (filmYoutubeIframe) filmYoutubeIframe.remove();
    filmYoutubeIframe = null;
  }
  // style.display is set directly rather than toggling .hidden: the .ph
  // placeholder's own CSS (display: grid, a class selector) outranks the
  // browser's built in [hidden] { display: none }, so .hidden alone leaves
  // it visibly stuck on screen even once marked hidden.
  const noFilm = () => {
    if (filmYoutubeIframe) return; // a YouTube embed already stands in for it
    filmVideo.style.display = "none";
    $("#filmPh").style.display = "";
  };
  const filmYoutubeEmbedUrl = youtubeEmbedUrl(S.film.youtubeUrl);
  if (filmYoutubeEmbedUrl) showFilmYoutube(filmYoutubeEmbedUrl);
  function watchSources(video, onFail) {
    const last = video.querySelector("source:last-of-type");
    if (last) last.addEventListener("error", onFail);
    video.addEventListener("error", onFail);
  }
  watchSources(heroVideo, noVideo);
  watchSources(filmVideo, noFilm);
  // Catches failures that happened before this script ran. Waits so a browser that
  // skips the first source (mp4) and moves on to webm is not mistaken for a failure.
  const dead = v => v.error || (v.networkState === 3 && v.readyState === 0);
  setTimeout(() => { if (dead(heroVideo)) noVideo(); if (dead(filmVideo)) noFilm(); }, 2500);
  function setSources(video, list, poster, onFail) {
    video.innerHTML = list.map(s => `<source src="${esc(s.url)}"${s.type ? ` type="${esc(s.type)}"` : ""}>`).join("");
    // The hero never shows a poster image: it plays straight to video, no
    // picture before it. The film player keeps its poster as before.
    if (poster && video !== heroVideo) video.poster = poster;
    watchSources(video, onFail);
    video.load();
  }

  const sound = $("#sound");
  sound.addEventListener("click", () => {
    heroVideo.muted = !heroVideo.muted;
    if (!heroVideo.muted) heroVideo.play().catch(() => {});
    sound.textContent = heroVideo.muted ? "Sound off" : "Sound on";
    sound.setAttribute("aria-pressed", String(!heroVideo.muted));
  });

  /* ---------- Hero: static, nav shows once scrolled past it ---------- */
  const hero = $("#top"), nav = $("#nav");
  function syncNav() {
    nav.classList.toggle("show", scrollY > hero.offsetHeight - 80);
  }
  let navTicking = false;
  addEventListener("scroll", () => {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(() => { syncNav(); navTicking = false; });
  }, { passive: true });
  syncNav();

  /* ---------- Reveal on view + count up ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      $$("[data-w]", e.target).forEach(b => b.style.width = b.dataset.w + "%");
      $$("[data-count]", e.target).forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.01, rootMargin: "0px 0px -10% 0px" });
  function countUp(el) {
    if (reduce || el.dataset.done) return;
    el.dataset.done = 1;
    const end = parseFloat(el.dataset.count), dec = (el.dataset.count.split(".")[1] || "").length;
    const t0 = performance.now(), dur = 1400;
    (function step(now) {
      const k = ease(clamp((now - t0) / dur));
      el.textContent = (end * k).toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- Cursor light ---------- */
  const glow = $("#glow");
  if (!reduce && matchMedia("(pointer: fine)").matches) {
    addEventListener("pointermove", e => {
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      glow.style.opacity = scrollY > hero.offsetHeight ? "1" : "0";
    }, { passive: true });
    document.addEventListener("pointermove", e => {
      const c = e.target.closest?.(".card");
      if (!c) return;
      const b = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - b.left) + "px");
      c.style.setProperty("--my", (e.clientY - b.top) + "px");
    }, { passive: true });
  }

  /* ---------- Schedule ---------- */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const gamesEl = $("#games");
  let next = null;
  S.schedule.games.forEach(g => {
    const d = toDate(g.date);
    const past = d < today;
    if (!past && !next) next = g;
    const li = document.createElement("li");
    li.className = "game" + (past ? " past" : "") + (g === next ? " next" : "") + (g.tag ? " special" : "");
    const pre = g.loc === "Home" ? "vs" : g.loc === "Away" ? "at" : "";
    const res = g.result ? `<span class="res ${g.result.trim()[0].toUpperCase() === "W" ? "w" : "l"}">${esc(g.result)}</span>` : "";
    li.innerHTML = `
      <div class="d">${MONTHS[d.getMonth()]} ${d.getDate()}<small>${DAYS[d.getDay()]}</small></div>
      <div><div class="o" ${g.tag ? `data-tag="${esc(g.tag)}"` : ""}>${pre ? `<em>${pre}</em>` : ""}${esc(g.opp)}</div>
        <div class="t">${esc(g.time)}${g.note ? ` · ${esc(g.note)}` : ""}${g.site ? ` · at ${esc(g.site)}` : ""}</div></div>
      <div class="r"><span class="pill ${g.loc.toLowerCase()}">${esc(g.loc)}</span>${res}</div>`;
    gamesEl.appendChild(li);
  });
  if (next) {
    const d = toDate(next.date);
    const days = Math.round((d - today) / 864e5);
    const place = next.loc === "Home" ? P.school : next.site ? `at ${next.site}` : next.loc === "Away" ? "Away game" : "Location TBD";
    const box = $("#nextGame");
    box.hidden = false;
    box.innerHTML = `
      <div class="when"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]} · ${DAYS[d.getDay()]}</span></div>
      <div><div class="lbl">Next game</div><div class="opp">${next.loc === "Home" ? "vs " : next.loc === "Away" ? "at " : ""}${esc(next.opp)}</div>
        <div class="info">${esc(next.time)}${next.note ? ` · ${esc(next.note)}` : ""} · ${esc(place)}</div></div>
      <div class="countdown">${days === 0 ? "Today" : days === 1 ? "Tomorrow" : days}${days > 1 ? "<small>days away</small>" : ""}</div>`;
  } else if (!S.schedule.games.length) {
    gamesEl.outerHTML = `<div class="empty-note fade"><b>Schedule coming soon</b>Check back when the season is set.</div>`;
  }

  /* ---------- Writeups ---------- */
  const list = $("#writeupList");
  const fmtDate = iso => { if (!iso) return ""; const d = toDate(iso); return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };
  if (!S.writeups.length) {
    list.innerHTML = `<div class="empty-note fade"><b>Writeups coming soon</b>Reporters and scouts: use the contact request below to set up an interview or evaluation.</div>`;
  }
  S.writeups.forEach(w => {
    const el = document.createElement(w.url ? "a" : "button");
    el.className = "card writeup fade";
    if (w.url) { el.href = w.url; el.target = "_blank"; el.rel = "noopener"; } else { el.type = "button"; }
    el.innerHTML = `
      <div class="kind"><span>${esc(w.kind || "Article")}</span><time>${fmtDate(w.date)}</time></div>
      <h3>${esc(w.title)}</h3>
      ${w.excerpt ? `<blockquote>${esc(w.excerpt)}</blockquote>` : ""}
      <div class="src"><span>${esc(w.source || "")}</span><span>${w.url ? "Read article" : "Read writeup"}</span></div>`;
    if (!w.url) el.addEventListener("click", () => {
      $("#readerKind").textContent = w.kind || "Writeup";
      $("#readerTitle").textContent = w.title;
      $("#readerMeta").textContent = [w.source, fmtDate(w.date)].filter(Boolean).join(" · ");
      $("#readerBody").innerHTML = (w.body || [w.excerpt || ""]).map(p => `<p>${esc(p)}</p>`).join("");
      $("#reader").classList.add("open");
      $("#readerClose").focus();
    });
    list.appendChild(el);
  });
  const closeReader = () => $("#reader").classList.remove("open");
  $("#readerClose").addEventListener("click", closeReader);
  $("#reader").addEventListener("click", e => { if (e.target.id === "reader") closeReader(); });

  /* ---------- Photo vault ---------- */
  const gallery = $("#gallery");
  function renderGallery(photos) {
    gallery.innerHTML = "";
    photos.forEach(ph => {
      const fig = document.createElement("figure");
      fig.className = "shot fade in " + (ph.size || "");
      fig.style.margin = 0;
      fig.dataset.use = ph.use;
      const src = ph.thumb || ph.src;
      fig.innerHTML = `
        <div class="empty"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/></svg>Photo coming soon</div>
        <img src="${esc(src)}" alt="${esc(fullName)}, ${esc(ph.title)}" loading="lazy">`;
      const img = fig.querySelector("img");
      img.addEventListener("error", () => {
        if (ph.thumb && img.src !== new URL(ph.src, location.href).href) { img.src = ph.src; return; }
        img.remove(); fig.style.cursor = "default"; fig.dataset.missing = 1;
      });
      fig.addEventListener("click", () => {
        if (fig.dataset.missing) return;
        $("#lbImg").src = ph.large || ph.src;
        $("#lbImg").alt = img.alt;
        $("#lbTitle").textContent = ph.title;
        $("#lbUse").textContent = ph.use === "nil" ? "NIL Ready: licensed partner use with a signed agreement" : "Editorial: media and recruiting use only";
        const dl = $("#lbDownload");
        dl.href = ph.download || ph.src;
        dl.setAttribute("download", `${P.first}_${P.last}_${(ph.title || "photo").replace(/\s+/g, "_")}`);
        $("#lightbox").classList.add("open");
        $("#lbClose").focus();
      });
      gallery.appendChild(fig);
    });
    applyFilter();
  }
  let filter = "all";
  function applyFilter() { $$(".shot").forEach(s => s.style.display = (filter === "all" || s.dataset.use === filter) ? "" : "none"); }
  $$(".filters button").forEach(b => b.addEventListener("click", () => {
    filter = b.dataset.filter;
    $$(".filters button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    applyFilter();
  }));
  renderGallery((S.photos || []).map(p => ({ ...p, src: p.url || "media/photos/" + p.file })));
  const closeLb = () => $("#lightbox").classList.remove("open");
  $("#lbClose").addEventListener("click", closeLb);
  $("#lightbox").addEventListener("click", e => { if (e.target.id === "lightbox") closeLb(); });
  addEventListener("keydown", e => { if (e.key === "Escape") { closeLb(); closeReader(); } });

  $$(".fade").forEach(el => io.observe(el));

  /* ---------- Highlight clips (up to 4 separate videos) ---------- */
  function renderHighlights(list) {
    const box = $("#highlights");
    if (!box) return;
    if (!list || !list.length) {
      box.innerHTML = `<div class="player-frame small"><div class="ph">Highlight clips coming soon.</div></div>`;
      return;
    }
    box.innerHTML = list.map(h => `
      <div class="player-frame small">
        <video playsinline preload="metadata" controls>
          <source src="${esc(h.url)}"${h.type ? ` type="${esc(h.type)}"` : ""}>
        </video>
      </div>`).join("");
  }
  renderHighlights([]);

  /* ---------- Madi Visuals dashboard media ----------
     Pulls everything Madi has marked live for this player. Anything not in the
     dashboard keeps using the local media/ files. */
  async function loadDashboardMedia() {
    const m = S.media;
    if (!m?.dashboard || !m.slug) return;
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`${m.dashboard.replace(/\/$/, "")}/api/sites/${encodeURIComponent(m.slug)}`, { signal: ctrl.signal });
      if (!res.ok) return;
      const data = await res.json();
      if (data.hero?.length) {
        heroFailed = false;
        document.body.classList.remove("no-video");
        setSources(heroVideo, data.hero, data.poster, noVideo);
        heroVideo.play().catch(() => {});
      } else {
        noVideo();
      }
      // No fallback to data.hero here: that is the muted teaser loop at the
      // top of the page, not a real game recording, so reusing it here would
      // show a hero clip labeled as full game film instead of honestly
      // saying none has been uploaded yet.
      if (data.film?.length) {
        hideFilmYoutube();
        filmVideo.style.display = "";
        $("#filmPh").style.display = "none";
        setSources(filmVideo, data.film, data.poster, noFilm);
      } else {
        const dashboardFilmEmbed = youtubeEmbedUrl(data.filmYoutubeUrl);
        if (dashboardFilmEmbed) showFilmYoutube(dashboardFilmEmbed);
      }
      if (data.highlights?.length) renderHighlights(data.highlights);
      if (data.portrait) {
        let img = $("#portraitImg");
        if (!img) { img = document.createElement("img"); $(".portrait").prepend(img); }
        img.alt = `${fullName} portrait`;
        img.onerror = null;
        img.onload = () => { const ph = $(".portrait .ph"); if (ph) ph.style.display = "none"; };
        img.src = data.portrait;
      }
      if (data.poster) $('meta[property="og:image"]').content = data.poster;
      if (data.photos?.length) renderGallery(data.photos);
    } catch (e) { /* dashboard unreachable: local media stays in place */ }
  }
  loadDashboardMedia();

  /* ---------- Forms (Netlify Forms; email fallback) ---------- */
  function wireForm(form, status, done, subject) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      try {
        const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(form)).toString() });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        $('#contactForm input[name="subject"]').value = `Contact request for ${fullName}`;
        status.textContent = done;
      } catch (err) {
        const skip = ["form-name", "subject", "company-url", "website"];
        const body = [...new FormData(form)].filter(([k]) => !skip.includes(k)).map(([k, v]) => `${k}: ${v}`).join("\n");
        location.href = `mailto:${S.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
    });
  }
  wireForm($("#nilForm"), $("#formStatus"), `Thank you. ${approver} will review your inquiry and be in touch soon.`, `NIL opportunity for ${fullName}`);
  wireForm($("#contactForm"), $("#contactStatus"), `Request received. ${approver} will review it and email you directly.`, `Contact request for ${fullName}`);

  syncNav();
})();
