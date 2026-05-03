__cinderExport = {
  id: "batcave",
  name: "BatCave Diag",
  version: "1.0.1",
  icon: "🦇",
  description: "Diagnostic – shows chapter info",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: true,
    manga: true,
    download: false,
    resolve: false,
  },

  BASE_URL: "https://batcave.biz",

  async search(query, page = 0) {
    const url = `${this.BASE_URL}/search/${encodeURIComponent(query)}`;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) return [];
    const doc = cinder.parseHTML(res.data);
    const results = [];
    doc.querySelectorAll(".readed.d-flex.short").forEach((card) => {
      const titleLink = card.querySelector("h2.readed__title a");
      const img = card.querySelector("a.readed__img img");
      if (!titleLink) return;
      const href = titleLink.attr("href");
      const title = titleLink.text().trim();
      const cover = img ? (img.attr("src") || img.attr("data-src")) : "";
      if (title && href) {
        results.push({
          id: href,
          title: title,
          cover: cover.startsWith("/") ? this.BASE_URL + cover : cover,
          format: "manga",
        });
      }
    });
    return results;
  },

  async getChapters(mangaId) {
    const url = `${this.BASE_URL}${mangaId}`;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);

    // Count how many chapter items we find
    const chapterItems = doc.querySelectorAll(".cl__item");
    const fullstoryChapters = doc.querySelectorAll(".comix__fullstory-chapters .cl__item");
    const anyLink = doc.querySelectorAll("a[href*='/reader/']");

    // Return diagnostic info as fake chapters
    return [
      {
        id: "diag1",
        title: `.cl__item count: ${chapterItems.length}`,
        chapterNumber: 0,
        dateUploaded: "",
        scanlator: "",
      },
      {
        id: "diag2",
        title: `.comix__fullstory-chapters .cl__item: ${fullstoryChapters.length}`,
        chapterNumber: 0,
        dateUploaded: "",
        scanlator: "",
      },
      {
        id: "diag3",
        title: `Reader links found: ${anyLink.length}`,
        chapterNumber: 0,
        dateUploaded: "",
        scanlator: "",
      },
    ];
  },

  async getPages(chapterId) {
    return [{ url: "https://placehold.co/800x600/00ff00/white?text=Diag" }];
  },

  async getMangaDetails(id) {
    return { id, title: "Diag", cover: "", description: "", author: "", status: "ongoing", genres: [] };
  },

  async getDiscoverSections() {
    return [{ id: "latest", title: "Latest", icon: "🆕" }];
  },

  async getDiscoverItems(sectionId, page = 0) {
    return await this.search("", page);
  }
};
