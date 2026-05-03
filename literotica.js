__cinderExport = {
  id: "literotica",
  name: "Literotica",
  version: "3.0.1",
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
    if (res.status !== 200) {
      this._storyChunks = ["Error: Failed to load page (status " + res.status + ")"];
      return [{ id: "page-0", title: "Error", chapterNumber: 1, dateUploaded: "", scanlator: "" }];
    }

    const doc = cinder.parseHTML(res.data);
    const contentEl = doc.querySelector("[class*='introduction']");

    if (contentEl) {
      const fullText = contentEl.text().trim();
      const title = doc.querySelector("h1")?.text()?.trim() || "Story";
      const chunkSize = 500;
      this._storyChunks = [];

      for (let i = 0; i < fullText.length; i += chunkSize) {
        this._storyChunks.push(fullText.substring(i, i + chunkSize));
      }

      const chapters = [];
      for (let i = 0; i < this._storyChunks.length; i++) {
        chapters.push({
          id: `page-${i * chunkSize}`,
          title: `${title} (Page ${i + 1})`,
          chapterNumber: i + 1,
          dateUploaded: "",
          scanlator: "",
        });
      }
      return chapters;
    }

    // If the content element wasn't found, use a diagnostic dummy text
    const htmlSnippet = res.data.substring(0, 500);
    this._storyChunks = ["Could not find story content. HTML snippet: " + htmlSnippet];
    return [{ id: "page-0", title: "Diag", chapterNumber: 1, dateUploaded: "", scanlator: "" }];
  },

  async getPages(chapterId) {
    const startIdx = parseInt(chapterId.replace("page-", ""));
    const pageIndex = Math.floor(startIdx / 500);
    if (pageIndex < 0 || pageIndex >= this._storyChunks.length) return [];

    const text = this._storyChunks[pageIndex];
    const escapedText = this._escapeXml(text);

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
    return [{ url: `data:image/svg+xml;base64,${base64}?ts=${Date.now()}` }];
  },

  _wrapText(text, maxLen) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = "";

    for (const word of words) {
      if (word.length > maxLen) {
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
    return lines.length ? lines : [text];
  },

  _escapeXml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
};
