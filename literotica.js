__cinderExport = {
  id: "literotica",
  name: "Literotica",
  version: "1.0.0",
  icon: "📖",
  description: "Read stories from Literotica.com",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: true,
    manga: true,
    download: false,
    resolve: false,
  },

  BASE_URL: "https://www.literotica.com",
  SEARCH_URL: "https://search.literotica.com",

  // ── Search ─────────────────────────────
  async search(query, page = 0) {
    const url = `${this.SEARCH_URL}/?query=${encodeURIComponent(query)}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const doc = cinder.parseHTML(res.data);
    const results = [];

    doc.querySelectorAll(".panel.ai_gJ").forEach((card) => {
      const titleEl = card.querySelector("h4");
      const linkEl = card.querySelector("a.ai_ii");
      const authorEl = card.querySelector("a.ai_il span.ai_im");
      const snippetEl = card.querySelector(".ai_ij p");

      if (!titleEl || !linkEl) return;

      const href = linkEl.attr("href");
      const title = titleEl.text().trim();
      const author = authorEl ? authorEl.text().trim() : "Unknown";

      results.push({
        id: href.replace(this.BASE_URL, ""),
        title: title,
        author: author,
        cover: "",
        format: "manga",
      });
    });

    return results;
  },

  // ── Chapters (single chapter) ──────────
  async getChapters(mangaId) {
    return [
      {
        id: mangaId,
        title: "Read Story",
        chapterNumber: 1,
        dateUploaded: "",
        scanlator: "",
      }
    ];
  },

  // ── Pages (story text) ────────────────
  async getPages(chapterId) {
    const url = `${this.BASE_URL}${chapterId}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const doc = cinder.parseHTML(res.data);

    // Find the story content
    const contentEl = doc.querySelector('._introduction-wrap_86nfw_1');
    if (!contentEl) return [];

    const text = contentEl.text().trim();
    if (!text) return [];

    // Convert text to base64 data URL for display
    const base64 = btoa(unescape(encodeURIComponent(text)));
    return [{ url: `data:text/plain;base64,${base64}` }];
  },

  // ── Manga Details ──────────────────────
  async getMangaDetails(id) {
    const url = `${this.BASE_URL}${id}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) throw new Error("Failed");

    const doc = cinder.parseHTML(res.data);
    const title = doc.querySelector("h1")?.text()?.trim() || id;
    const author = doc.querySelector('a[href*="/authors/"]')?.text()?.trim() || "";

    return {
      id: id,
      title: title,
      cover: "",
      description: "",
      author: author,
      status: "complete",
      genres: [],
    };
  },

  // ── Discover ───────────────────────────
  async getDiscoverSections() {
    return [
      { id: "latest", title: "Latest Stories", icon: "🆕" },
      { id: "top", title: "Top Rated", icon: "⭐" },
    ];
  },

  async getDiscoverItems(sectionId, page = 0) {
    let url;
    if (sectionId === "top") {
      url = `${this.BASE_URL}/stories/top-rated`;
    } else {
      url = `${this.BASE_URL}/stories/new`;
    }
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const doc = cinder.parseHTML(res.data);
    const results = [];

    doc.querySelectorAll(".panel.ai_gJ").forEach((card) => {
      const titleEl = card.querySelector("h4");
      const linkEl = card.querySelector("a.ai_ii");
      const authorEl = card.querySelector("a.ai_il span.ai_im");

      if (!titleEl || !linkEl) return;

      results.push({
        id: linkEl.attr("href").replace(this.BASE_URL, ""),
        title: titleEl.text().trim(),
        author: authorEl ? authorEl.text().trim() : "Unknown",
        cover: "",
        format: "manga",
      });
    });

    return results;
  }
};
