__cinderExport = {
  id: "literotica",
  name: "Literotica",
  version: "1.0.4",
  icon: "📖",
  description: "Read stories from Literotica.com",
  contentType: "manga",

  //love me as I am

  capabilities: {
    search: true,
    discover: true,
    manga: true,
    download: false,
    resolve: false,
  },

  BASE_URL: "https://www.literotica.com",
  SEARCH_URL: "https://search.literotica.com",

  _storyText: "",

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
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) {
      this._storyText = "ERROR: Page fetch failed (status " + res.status + ")";
      return [{ id: "chapter-1", title: "Chapter 1", chapterNumber: 1, dateUploaded: "", scanlator: "" }];
    }

    const doc = cinder.parseHTML(res.data);
    
    // Try to find content
    let contentEl = doc.querySelector("[class*='introduction']");
    if (!contentEl) {
      // Try getting all paragraphs as fallback
      const paragraphs = doc.querySelectorAll("p");
      this._storyText = "Found " + paragraphs.length + " paragraphs. ";
      if (paragraphs.length > 0) {
        this._storyText += "First paragraph: " + paragraphs[0].text().trim().substring(0, 100);
      } else {
        this._storyText += "Page HTML length: " + res.data.length;
      }
    } else {
      const text = contentEl.text().trim();
      this._storyText = "Content found! Length: " + text.length + " chars. Preview: " + text.substring(0, 100);
    }

    return [{ id: "chapter-1", title: "Chapter 1", chapterNumber: 1, dateUploaded: "", scanlator: "" }];
  },

  async getPages(chapterId) {
    const displayText = this._storyText || "No text stored";

    // Create a small diagnostic image
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200">' +
      '<rect width="100%" height="100%" fill="#1a1a2e"/>' +
      '<text x="20" y="40" font-family="monospace" font-size="14" fill="#00ff00">' +
      displayText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
      '</text></svg>';

    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return [{ url: "data:image/svg+xml;base64," + base64 }];
  }
};
