__cinderExport = {
  id: "toongod",
  name: "ToonGod HTML View",
  version: "2.0.0",
  icon: "🌐",
  description: "Shows raw search HTML",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: false,
    manga: true,
    download: false,
    resolve: false,
  },

  async search(query, page = 0) {
    // Fetch the search page
    const url = `https://www.toongod.org/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    const html = res.data || "";

    // Save the HTML so we can display it in the pages
    this._savedHtml = html;

    // Return one dummy manga item
    return [{
      id: "diag",
      title: `Tap to view HTML for "${query}"`,
      cover: "",
      format: "manga",
    }];
  },

  async getMangaDetails(id) {
    return {
      id: id,
      title: "HTML View",
      cover: "",
      description: "",
      author: "",
      status: "ongoing",
      genres: [],
    };
  },

  async getChapters(mangaId) {
    return [{
      id: "show-html",
      title: "Show Search HTML",
      chapterNumber: 0,
      dateUploaded: "",
      scanlator: "",
    }];
  },

  async getPages(chapterId) {
    // Convert the saved HTML to base64 for display
    const text = this._savedHtml.substring(0, 3000); // first 3000 chars
    const base64 = btoa(unescape(encodeURIComponent(text)));
    return [{ url: `data:text/plain;base64,${base64}` }];
  }
};
