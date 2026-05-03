__cinderExport = {
  id: "batcave",
  name: "BatCave",
  version: "1.0.2",
  icon: "🦇",
  description: "Read comics from batcave.biz",
  contentType: "manga",

  //love love
  
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

    const doc = cinder.parseHTML(res.data);
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
        cover: cover.startsWith("/") ? this.BASE_URL + cover : cover,
        format: "manga",
      });
    });
    return results;
  },

  // ── Chapters (extract JSON-LD with regex) ─
  async getChapters(mangaId) {
    const url = `${this.BASE_URL}${mangaId}`;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) return [];

    const html = res.data;

    // Find the script block containing "ComicSeries"
    const seriesRegex = /<script type="application\/ld\+json">([\s\S]*?@type"\s*:\s*"ComicSeries"[\s\S]*?)<\/script>/;
    const match = html.match(seriesRegex);
    if (!match) return [];

    let data;
    try {
      data = JSON.parse(match[1]);
    } catch (e) {
      return [];
    }

    // Locate the ComicSeries node
    const graph = data["@graph"] || [];
    const seriesNode = graph.find(node => node["@type"] === "ComicSeries");
    if (!seriesNode || !seriesNode.hasPart || !seriesNode.hasPart.itemListElement) return [];

    const chapters = seriesNode.hasPart.itemListElement.map(el => {
      const issue = el.item;
      const id = issue.url.replace(this.BASE_URL, ""); // /reader/33758/246752
      return {
        id: id,
        title: issue.name,
        chapterNumber: parseInt(issue.issueNumber, 10) || 0,
        dateUploaded: "",
        scanlator: "BatCave",
      };
    }).reverse(); // oldest first

    return chapters;
  },

  // ── Pages ──────────────────────────────
  async getPages(chapterId) {
    const url = `${this.BASE_URL}${chapterId}`;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) return [];

    const doc = cinder.parseHTML(res.data);
    const pages = [];
    doc.querySelectorAll("img.reader__item").forEach(img => {
      const src = img.attr("src");
      if (src && src.startsWith("http")) pages.push({ url: src.trim() });
    });
    return pages;
  },

  // ── Manga Details ──────────────────────
  async getMangaDetails(id) {
    const url = `${this.BASE_URL}${id}`;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) throw new Error("Failed");

    const doc = cinder.parseHTML(res.data);
    const title = doc.querySelector("h1")?.text()?.trim() || id;
    const img = doc.querySelector(".page__poster img");
    const cover = img ? (img.attr("src") || img.attr("data-src")) : "";
    const desc = doc.querySelector(".page__text.full-text")?.text()?.trim() || "";

    return {
      id, title,
      cover: cover.startsWith("/") ? this.BASE_URL + cover : cover,
      description: desc,
      author: "",
      status: "ongoing",
      genres: [],
    };
  },

  // ── Discover ───────────────────────────
  async getDiscoverSections() {
    return [{ id: "latest", title: "Latest Updates", icon: "🆕" }];
  },
  async getDiscoverItems(sectionId, page = 0) {
    const url = this.BASE_URL;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) return [];
    const doc = cinder.parseHTML(res.data);
    const results = [];
    doc.querySelectorAll(".readed.d-flex.short").forEach(card => {
      const titleLink = card.querySelector("h2.readed__title a");
      const img = card.querySelector("a.readed__img img");
      if (!titleLink) return;
      const href = titleLink.attr("href");
      const title = titleLink.text().trim();
      const cover = img ? (img.attr("src") || img.attr("data-src")) : "";
      results.push({
        id: href,
        title,
        cover: cover.startsWith("/") ? this.BASE_URL + cover : cover,
        format: "manga",
      });
    });
    return results;
  }
};
