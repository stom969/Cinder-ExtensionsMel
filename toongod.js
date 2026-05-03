__cinderExport = {
  id: "toongod",
  name: "ToonGod",
  version: "1.0.1",
  icon: "🌐",
  description: "Read comics from ToonGod.org",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: true,
    manga: true,
    download: false,
    resolve: false,
  },

  BASE_URL: "https://www.toongod.org",

  // ── Search ─────────────────────────────
  async search(query, page = 0) {
    // The search URL you confirmed
    const url = `${this.BASE_URL}/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);

    const results = [];
    // Each comic is inside this container
    doc.querySelectorAll(".c-tabs-item__content").forEach((item) => {
      // Find thumbnail link (cover + URL)
      const thumbLink = item.querySelector(".tab-thumb a");
      const titleEl = item.querySelector(".post-title h3 a");

      if (!thumbLink || !titleEl) return;

      const href = thumbLink.attr("href");
      const title = titleEl.text().trim();
      const id = href.replace(this.BASE_URL, "").replace(/\/$/, ""); // e.g., /webtoon/...

      // Use data-src if present, else src
      const imgEl = thumbLink.querySelector("img");
      const cover = imgEl ? (imgEl.attr("data-src") || imgEl.attr("src")) : "";

      results.push({
        id: id,
        title: title,
        author: "",
        cover: cover,
        url: href,
        format: "manga",
      });
    });

    return results;
  },

  // ── Chapters ───────────────────────────
  async getChapters(mangaId) {
    const url = `${this.BASE_URL}${mangaId}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);

    const chapters = [];
    // Standard Madara chapter list
    doc.querySelectorAll(".version-chap li a, .wp-manga-chapter a").forEach((link) => {
      const href = link.attr("href");
      const title = link.text().trim();
      const id = href.replace(this.BASE_URL, ""); // /webtoon/.../chapter-1/
      const chapterMatch = title.match(/Chapter\s+([\d.]+)/i);
      const chapterNumber = chapterMatch ? parseFloat(chapterMatch[1]) : 0;

      chapters.push({
        id: id,
        title: title || `Chapter ${chapters.length + 1}`,
        chapterNumber: chapterNumber,
        dateUploaded: "",
        scanlator: "ToonGod",
      });
    });

    return chapters.reverse(); // oldest first
  },

  // ── Pages ──────────────────────────────
  async getPages(chapterId) {
    const url = `${this.BASE_URL}${chapterId}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);

    const pages = [];
    // Pages are inside .reading-content img (often use data-src)
    doc.querySelectorAll(".reading-content img, .page-break img").forEach((img) => {
      let src = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src");
      if (src && src.startsWith("http")) {
        pages.push({ url: src.trim() });
      }
    });

    return pages;
  },

  // ── Manga Details ──────────────────────
  async getMangaDetails(id) {
    const url = `${this.BASE_URL}${id}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) throw new Error("Failed to load details");

    const html = res.data;
    const doc = cinder.parseHTML(html);

    const title = (doc.querySelector(".post-title h1") || doc.querySelector("h1"))?.text()?.trim() || id;
    const cover = doc.querySelector(".summary_image img")?.attr("data-src") || doc.querySelector(".summary_image img")?.attr("src") || "";
    const desc = doc.querySelector(".description-summary .summary__content")?.text()?.trim() || "";
    const author = doc.querySelector(".author-content a")?.text()?.trim() || "";

    return {
      id: id,
      title: title,
      cover: cover,
      description: desc,
      author: author,
      status: "ongoing",
      genres: [],
    };
  },

  // ── Discover ───────────────────────────
  async getDiscoverSections() {
    return [
      { id: "latest", title: "Latest Updates", icon: "🆕" },
      { id: "popular", title: "Popular", icon: "🔥" },
    ];
  },

  async getDiscoverItems(sectionId, page = 0) {
    let endpoint = "/";
    if (sectionId === "latest") {
      endpoint = "/page-template/latest/"; // adjust if needed
    }
    const url = `${this.BASE_URL}${endpoint}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];
    const html = res.data;
    const doc = cinder.parseHTML(html);
    const results = [];
    doc.querySelectorAll(".c-tabs-item__content, .page-item-detail").forEach((item) => {
      const thumbLink = item.querySelector("a");
      const titleEl = item.querySelector(".post-title h3 a") || item.querySelector("h3 a");
      if (!thumbLink || !titleEl) return;
      const href = thumbLink.attr("href");
      const title = titleEl.text().trim();
      const id = href.replace(this.BASE_URL, "").replace(/\/$/, "");
      const imgEl = item.querySelector("img");
      const cover = imgEl ? (imgEl.attr("data-src") || imgEl.attr("src")) : "";
      results.push({
        id: id,
        title: title,
        author: "",
        cover: cover,
        url: href,
        format: "manga",
      });
    });
    return results;
  }
};
