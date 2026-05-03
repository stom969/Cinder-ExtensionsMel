__cinderExport = {
  id: "literotica",
  name: "Literotica",
  version: "1.0.5",
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

  _currentChunks: [],

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

  // ── Chapters (split text into chunks) ──
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

    // Split into ~1500 character chunks for readable pages
    const chunkSize = 1500;
    this._currentChunks = [];
    const chapters = [];

    for (let i = 0; i < fullText.length; i += chunkSize) {
      const chunk = fullText.substring(i, i + chunkSize);
      this._currentChunks.push(chunk);
      chapters.push({
        id: `chunk-${i}`,
        title: `${title} (Page ${Math.floor(i / chunkSize) + 1})`,
        chapterNumber: Math.floor(i / chunkSize) + 1,
        dateUploaded: "",
        scanlator: "",
      });
    }

    return chapters;
  },

  // ── Pages (generate text images) ───────
  async getPages(chapterId) {
    const index = this._currentChunks.findIndex((_, i) => `chunk-${i * 1500}` === chapterId);
    if (index === -1) return [];

    const text = this._currentChunks[index];

    // Use a text-to-image service to render the text
    // We'll use a simple approach: create an SVG with the text and convert to a data URL
    const lines = text.split('\n');
    const svgLines = lines.map((line, i) => 
      `<tspan x="20" dy="${i === 0 ? 30 : 25}">${this._escapeXml(line)}</tspan>`
    ).join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${1200 + lines.length * 25}">
      <rect width="100%" height="100%" fill="#1a1a2e"/>
      <text font-family="Georgia, serif" font-size="18" fill="#e0e0e0" xml:space="preserve">
        ${svgLines}
      </text>
    </svg>`;

    // Convert SVG to base64 data URL
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    return [{ url: dataUrl }];
  },

  // Helper to escape XML special characters
  _escapeXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
};
