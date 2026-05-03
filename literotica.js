__cinderExport = {
  id: "literotica",
  name: "Literotica",
  version: "3.0.0",
  icon: "📖",
  description: "Read stories from Literotica.com",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: false,
    manga: true,
    download: false,
    resolve: false,
  },

  BASE_URL: "https://www.literotica.com",
  SEARCH_URL: "https://search.literotica.com",

  _storyChunks: [],

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

  async getChapters(mangaId) {
    const url = `${this.BASE_URL}${mangaId}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const doc = cinder.parseHTML(res.data);
    const contentEl = doc.querySelector("[class*='introduction']");
    if (!contentEl) return [];

    const fullText = contentEl.text().trim();
    const title = doc.querySelector("h1")?.text()?.trim() || "Story";

    // Split into chunks of ~500 characters for small, reliable SVGs
    const chunkSize = 500;
    this._storyChunks = [];
    const chapters = [];

    for (let i = 0; i < fullText.length; i += chunkSize) {
      const chunk = fullText.substring(i, i + chunkSize);
      this._storyChunks.push(chunk);
      chapters.push({
        id: `page-${i}`,
        title: `${title} (Page ${Math.floor(i / chunkSize) + 1})`,
        chapterNumber: Math.floor(i / chunkSize) + 1,
        dateUploaded: "",
        scanlator: "",
      });
    }

    return chapters;
  },

  async getPages(chapterId) {
    const startIdx = parseInt(chapterId.replace("page-", ""));
    const pageIndex = Math.floor(startIdx / 500);  // chunkSize is 500
    if (pageIndex < 0 || pageIndex >= this._storyChunks.length) return [];

    const text = this._storyChunks[pageIndex];
    const escapedText = this._escapeXml(text);

    // Build a simple SVG with <tspan> lines (max 60 chars per line)
    const lines = this._wrapText(escapedText, 60);
    let y = 40;
    const lineHeight = 24;
    const tspanElements = lines.map(line => {
      const tspan = `<tspan x="20" dy="${y === 40 ? 0 : lineHeight}">${line}</tspan>`;
      y += lineHeight;
      return tspan;
    }).join('');

    const svgHeight = Math.max(200, y + 40);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${svgHeight}">
      <rect width="100%" height="100%" fill="#1a1a2e"/>
      <text font-family="monospace" font-size="16" fill="#e0e0e0" xml:space="preserve">
        ${tspanElements}
      </text>
    </svg>`;

    const base64 = btoa(unescape(encodeURIComponent(svg)));
    // Add a timestamp to bust any caching
    return [{ url: `data:image/svg+xml;base64,${base64}?ts=${Date.now()}` }];
  },

  // Helper: wrap text into lines of maxLen characters
  _wrapText(text, maxLen) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = "";

    for (const word of words) {
      if (word.length > maxLen) {
        // If a single word is longer than maxLen, split it forcibly
        if (currentLine) {
          lines.push(currentLine);
          currentLine = "";
        }
        for (let i = 0; i < word.length; i += maxLen) {
          lines.push(word.substring(i, i + maxLen));
        }
      } else if ((currentLine + " " + word).trim().length > maxLen) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = (currentLine + " " + word).trim();
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length ? lines : [text]; // fallback
  },

  // Helper: escape XML special characters
  _escapeXml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
};
