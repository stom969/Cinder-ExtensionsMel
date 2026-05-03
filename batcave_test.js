__cinderExport = {
  id: "batcave",
  name: "BatCave",
  version: "1.0.2",
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

      const href = titleLink.attr("href");
      const title = titleLink.text().trim();
      const cover = img ? (img.attr("src") || img.attr("data-src")) : "";

      results.push({
        id: href,
        title: title,
        author: "",
        cover: cover.startsWith("/") ? this.BASE_URL + cover : cover,
        url: this.BASE_URL + href,
        format: "manga",
      });
    });

    return results;
  },

  // ── Chapters (regex on raw HTML) ───────
  async getChapters(mangaId) {
    const url = `${this.BASE_URL}${mangaId}`;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) return [];

    const html = res.data;

    // Extract the window.__DATA__ object using regex
    const dataMatch = html.match(/window\.__DATA__\s*=\s*({[\s\S]+?});/);
    if (!dataMatch) {
      // If not found, show partial page in chapter title for debugging
      return [{
        id: "diag",
        title: `No __DATA__ found. HTML length: ${html.length}`,
        chapterNumber: 0,
        dateUploaded: "",
        scanlator: "",
      }];
    }

    let dataObj;
    try {
      dataObj = JSON.parse(dataMatch[1]);
    } catch (e) {
      return [{
        id: "diag",
        title: `JSON parse error: ${e.message.substring(0, 80)}`,
        chapterNumber: 0,
        dateUploaded: "",
        scanlator: "",
      }];
    }

    if (!dataObj.chapters || !dataObj.chapters.length) {
      return [{
        id: "diag",
        title: "Data found but no chapters array",
        chapterNumber: 0,
        dateUploaded: "",
        scanlator: "",
      }];
    }

    const chapters = dataObj.chapters.map((ch) => ({
      id: `/reader/${dataObj.news_id}/${ch.id}`,
      title: ch.title,
      chapterNumber: parseFloat(ch.posi) || 0,
      dateUploaded: ch.date || "",
      scanlator: "BatCave",
    }));

    return chapters.reverse();
  },

  // ── Pages ──────────────────────────────
  async getPages(chapterId) {
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
    const url = `${this.BASE_URL}${id}`;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) throw new Error("Failed to load details");

    const html = res.data;
    const doc = cinder.parseHTML(html);

    const title = doc.querySelector("h1")?.text()?.trim() || id;
    const coverImg = doc.querySelector(".page__poster img, .readed__img img");
    const cover = coverImg ? (coverImg.attr("src") || coverImg.attr("data-src")) : "";
    const desc = doc.querySelector(".page__text.full-text")?.text()?.trim() || "";

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
      results.push({
        id: href,
        title: title,
        author: "",
        cover: cover.startsWith("/") ? this.BASE_URL + cover : cover,
        url: this.BASE_URL + href,
        format: "manga",
      });
    });

    return results;
  }
};
