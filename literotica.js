__cinderExport = {
  id: "literotica",
  name: "Literotica",
  version: "1.0.4",
  icon: "�",
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

  // ── Manga Details ──────────────────────
  async getMangaDetails(id) {
    return {
      id: id,
      title: id.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      cover: "",
      description: "",
      author: "",
      status: "complete",
      genres: [],
    };
  },

  // ── Chapters (single chapter for testing) ─
  async getChapters(mangaId) {
    return [
      {
        id: "part-1",
        title: "Chapter 1",
        chapterNumber: 1,
        dateUploaded: "",
        scanlator: "",
      }
    ];
  },

  // ── Pages (placeholder test) ──────────
  async getPages(chapterId) {
    return [{ url: "https://placehold.co/800x1200/1a1a2e/e0e0e0?text=Test+Page" }];
  }
};
