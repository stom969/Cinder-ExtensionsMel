__cinderExport = {
  id: "toongod",
  name: "ToonGod",
  version: "1.0.0",
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
    const url = `${this.BASE_URL}/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);

    const results = [];
    doc.querySelectorAll(".c-tabs-item__content, .search-wrap .row .col-12").forEach((item) => {
      const link = item.querySelector("a");
      const titleEl = item.querySelector(".post-title, .manga-title, h3, h4");
      const imgEl = item.querySelector("img");

      if (link && titleEl) {
        const id = link.attr("href").replace(this.BASE_URL, "").replace(/\/$/, "");
        results.push({
          id: id,
          title: titleEl.text().trim(),
          author: "",
          cover: imgEl ? imgEl.attr("src") || imgEl.attr("data-src") : "",
          url: link.attr("href"),
          format: "manga",
        });
      }
    });

    return results;
  },

  // ── Chapters ───────────────────────────
  async getChapters(mangaId) {
    const url = `${this.BASE_URL}${mangaId}`; // mangaId is like /webtoon/beyond-imagination/
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);

    const chapters = [];
    // Common Madara chapter list selectors
    const chapterItems = doc.querySelectorAll(".version-chap li, .wp-manga-chapter li, .listing-chapters_wrap li");
    chapterItems.forEach((item, idx) => {
      const link = item.querySelector("a");
      if (link) {
        const href = link.attr("href").replace(this.BASE_URL, "");
        const title = link.text().trim() || `Chapter ${idx + 1}`;
        const chapterNumber = parseFloat(title.replace("Chapter ", "")) || idx;
        chapters.push({
          id: href, // e.g., /webtoon/beyond-imagination/chapter-1/
          title: title,
          chapterNumber: chapterNumber,
          dateUploaded: "",
          scanlator: "ToonGod",
        });
      }
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
    // Look for images inside the reading area
    const images = doc.querySelectorAll(".reading-content img, .page-break img, .entry-content img");
    images.forEach((img) => {
      let src = img.attr("src") || img.attr("data-src") || img.attr("data-lazy-src");
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
    const cover = doc.querySelector(".summary_image img")?.attr("src") || "";
    const desc = doc.querySelector(".description-summary .summary__content, .manga-excerpt")?.text()?.trim() || "";
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
    // For discover, we can fetch the homepage or a listing page
    let endpoint = "";
    if (sectionId === "latest") {
      endpoint = "/?s=&post_type=wp-manga&order=latest"; // just an example
    } else {
      endpoint = "/?s=&post_type=wp-manga&order=popular";
    }
    const url = `${this.BASE_URL}${endpoint}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];
    const html = res.data;
    const doc = cinder.parseHTML(html);
    // Reuse search parsing logic
    const results = [];
    doc.querySelectorAll(".c-tabs-item__content, .page-item-detail").forEach((item) => {
      const link = item.querySelector("a");
      const titleEl = item.querySelector(".post-title, h3, h4");
      const imgEl = item.querySelector("img");
      if (link && titleEl) {
        const id = link.attr("href").replace(this.BASE_URL, "").replace(/\/$/, "");
        results.push({
          id: id,
          title: titleEl.text().trim(),
          author: "",
          cover: imgEl ? imgEl.attr("src") || imgEl.attr("data-src") : "",
          url: link.attr("href"),
          format: "manga",
        });
      }
    });
    return results;
  }
};
