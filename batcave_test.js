__cinderExport = {
  id: "batcave",
  name: "BatCave",
  version: "1.0.0",
  icon: "🦇",
  description: "Read comics from batcave.biz",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: true,
    manga: true,
    download: false,
    resolve: false,
  },

  BASE_URL: "https://batcave.biz",

  // ── Search ─────────────────────────────
  async search(query, page = 0) {
    const url = `${this.BASE_URL}/search/${encodeURIComponent(query)}`;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);

    const results = [];
    doc.querySelectorAll(".readed.d-flex.short").forEach((card) => {
      const titleLink = card.querySelector("h2.readed__title a");
      const img = card.querySelector("a.readed__img img");

      if (!titleLink) return;

      const href = titleLink.attr("href"); // e.g., "/33758-batman-2025.html"
      const title = titleLink.text().trim();
      const id = href; // Use full path as manga ID
      const cover = img ? (img.attr("src") || img.attr("data-src")) : "";

      if (title && href) {
        results.push({
          id: id,
          title: title,
          author: "",
          cover: cover.startsWith("/") ? this.BASE_URL + cover : cover,
          url: this.BASE_URL + href,
          format: "manga",
        });
      }
    });

    return results;
  },

  // ── Chapters ───────────────────────────
  async getChapters(mangaId) {
    // mangaId is the href from search, e.g., "/33758-batman-2025.html"
    const url = `${this.BASE_URL}${mangaId}`;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);
    const chapters = [];

    doc.querySelectorAll(".comix__fullstory-chapters .cl__item").forEach((item) => {
      const link = item.querySelector("h3.cl__item-title a");
      const numEl = item.querySelector(".cl__item-num");
      const dateEl = item.querySelector(".cl__item-date");

      if (!link) return;

      const href = link.attr("href"); // e.g., "/reader/33758/246752"
      const title = link.text().trim();
      const chapterNum = numEl ? numEl.text().trim().replace("#", "") : "0";
      const date = dateEl ? dateEl.text().trim() : "";

      chapters.push({
        id: href, // Use the reader URL as chapter ID
        title: title,
        chapterNumber: parseFloat(chapterNum) || 0,
        dateUploaded: date,
        scanlator: "BatCave",
      });
    });

    return chapters.reverse(); // Oldest first
  },

  // ── Pages ──────────────────────────────
  async getPages(chapterId) {
    // chapterId is the reader URL, e.g., "/reader/33758/246752"
    const url = `${this.BASE_URL}${chapterId}`;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);
    const pages = [];

    doc.querySelectorAll("img.reader__item").forEach((img) => {
      const src = img.attr("src");
      if (src && src.startsWith("http")) {
        pages.push({ url: src.trim() });
      }
    });

    return pages;
  },

  // ── Manga Details ──────────────────────
  async getMangaDetails(id) {
    // id is the comic page path, e.g., "/33758-batman-2025.html"
    const url = `${this.BASE_URL}${id}`;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) throw new Error("Failed to load details");

    const html = res.data;
    const doc = cinder.parseHTML(html);

    const title = doc.querySelector("h1")?.text()?.trim() || id;
    const coverImg = doc.querySelector(".comix__fullstory-cover img, .readed__img img");
    const cover = coverImg ? (coverImg.attr("src") || coverImg.attr("data-src")) : "";
    const desc = doc.querySelector(".comix__fullstory-desc")?.text()?.trim() || "";

    return {
      id: id,
      title: title,
      cover: cover.startsWith("/") ? this.BASE_URL + cover : cover,
      description: desc,
      author: "",
      status: "ongoing",
      genres: [],
    };
  },

  // ── Discover ───────────────────────────
  async getDiscoverSections() {
    return [
      { id: "latest", title: "Latest Updates", icon: "🆕" },
    ];
  },

  async getDiscoverItems(sectionId, page = 0) {
    // Just fetch the homepage and parse the same cards
    const url = this.BASE_URL;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);
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
          author: "",
          cover: cover.startsWith("/") ? this.BASE_URL + cover : cover,
          url: this.BASE_URL + href,
          format: "manga",
        });
      }
    });

    return results;
  }
};
