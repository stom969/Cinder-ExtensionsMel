__cinderExport = {
  id: "literotica",
  name: "Literotica",
  version: "1.0.2",
  icon: "📖",
  description: "Read stories from Literotica.com",
  contentType: "manga",

  //love me like you do

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
    // Fetch the story and store it
    const url = `${this.BASE_URL}${mangaId}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const doc = cinder.parseHTML(res.data);
    const contentEl = doc.querySelector("._introduction-wrap_86nfw_1");
    if (!contentEl) return [];

    this._storyText = contentEl.text().trim();

    return [
      {
        id: "chapter-1",
        title: "Chapter 1",
        chapterNumber: 1,
        dateUploaded: "",
        scanlator: "",
      }
    ];
  },

  async getPages(chapterId) {
    if (!this._storyText) {
      return [{ url: "https://placehold.co/800x600/ff0000/white?text=No+text" }];
    }

    // Escape XML special characters in the story text
    var escaped = this._storyText;
    escaped = escaped.replace(/&/g, "&amp;");
    escaped = escaped.replace(/</g, "&lt;");
    escaped = escaped.replace(/>/g, "&gt;");
    escaped = escaped.replace(/"/g, "&quot;");

    // Create an SVG with the text
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="' + (1200 + this._storyText.length) + '">';
    svg += '<rect width="100%" height="100%" fill="#1a1a2e"/>';
    svg += '<foreignObject width="100%" height="100%">';
    svg += '<div xmlns="http://www.w3.org/1999/xhtml" style="color:#e0e0e0;font-family:Georgia;font-size:18px;padding:20px;white-space:pre-wrap;">';
    svg += escaped;
    svg += '</div></foreignObject></svg>';

    var base64 = btoa(unescape(encodeURIComponent(svg)));
    return [{ url: "data:image/svg+xml;base64," + base64 }];
  }
};
