__cinderExport = {
  id: "literotica",
  name: "Literotica",
  version: "1.0.3",
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

  // ── Chapters (split story into parts) ──
  async getChapters(mangaId) {
    const url = `${this.BASE_URL}${mangaId}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const doc = cinder.parseHTML(res.data);
    const contentEl = doc.querySelector('._introduction-wrap_86nfw_1');
    if (!contentEl) return [];

    const fullText = contentEl.text().trim();
    const title = doc.querySelector("h1")?.text()?.trim() || "Story";

    // Split text into chunks of ~2000 characters for readability
    const chunkSize = 2000;
    const chapters = [];
    
    for (let i = 0; i < fullText.length; i += chunkSize) {
      const chunk = fullText.substring(i, i + chunkSize);
      chapters.push({
        id: `part-${Math.floor(i / chunkSize) + 1}`,
        title: `${title} (Part ${Math.floor(i / chunkSize) + 1})`,
        chapterNumber: Math.floor(i / chunkSize) + 1,
        dateUploaded: "",
        scanlator: "",
      });
    }

    // Store the full text for later retrieval in getPages
    this._currentStoryText = fullText;

    return chapters;
  },

  // ── Pages (generate text images) ───────
  async getPages(chapterId) {
    if (!this._currentStoryText) return [];

    const chunkSize = 2000;
    const partNum = parseInt(chapterId.replace("part-", "")) || 1;
    const start = (partNum - 1) * chunkSize;
    const chunk = this._currentStoryText.substring(start, start + chunkSize);

    // Use a placeholder service to generate a text image
    // Since we can't easily render text to images in Cinder's sandbox,
    // we'll encode the text chunk as a data URL with proper formatting
    
    const base64 = btoa(unescape(encodeURIComponent(chunk)));
    const dataUrl = `data:text/plain;base64,${base64}`;
    
    return [{ url: dataUrl }];
  }
};
