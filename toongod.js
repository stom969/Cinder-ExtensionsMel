__cinderExport = {
  id: "toongod",
  name: "ToonGod",
  version: "3.0.0",
  icon: "🌐",
  description: "Read comics from ToongGod.org",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: true,
    manga: true,
    download: false,
    resolve: false,
  },

  BASE_URL: "https://www.toongod.org",

  async search(query, page = 0) {
    const url = `${this.BASE_URL}/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);

    // Fallback method: find all <a> tags that link to a webtoon
    const results = [];
    const seen = {};
    const links = doc.querySelectorAll('a[href*="/webtoon/"]');
    
    links.forEach((link) => {
      const href = link.attr("href");
      // Skip non-comic links (like author, genre, etc.)
      if (!href || href.includes("/webtoon-author/") || href.includes("/webtoon-artist/") || href.includes("/webtoon-genre/") || href.includes("/webtoon-release/")) return;
      if (seen[href]) return;
      seen[href] = true;

      // Use the link text as title (might be clean, or might be just "Chapter X")
      let title = link.text().trim();
      if (!title || title.length < 3) {
        // Fallback: extract slug from URL
        const slug = href.split("/webtoon/")[1]?.split("/")[0] || "";
        title = slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      }

      // Try to find a cover image nearby
      let cover = "";
      const parent = link.parentNode?.parentNode; // go up one or two levels
      if (parent) {
        const img = parent.querySelector("img");
        if (img) cover = img.attr("data-src") || img.attr("src") || "";
      }

      const id = href.replace(this.BASE_URL, "").replace(/\/$/, "");
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

  async getChapters(mangaId) {
    const url = `${this.BASE_URL}${mangaId}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);
    const chapters = [];

    // Look for chapter links in common containers
    doc.querySelectorAll(".version-chap li a, .wp-manga-chapter a, .listing-chapters_wrap a").forEach((link) => {
      const href = link.attr("href");
      const title = link.text().trim();
      const id = href.replace(this.BASE_URL, "");
      const chNum = parseFloat((title.match(/Chapter\s+([\d.]+)/i) || [])[1]) || 0;
      chapters.push({
        id: id,
        title: title || `Chapter ${chapters.length + 1}`,
        chapterNumber: chNum,
        dateUploaded: "",
        scanlator: "ToonGod",
      });
    });

    return chapters.reverse();
  },

  async getPages(chapterId) {
    const url = `${this.BASE_URL}${chapterId}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);
    const pages = [];

    doc.querySelectorAll(".reading-content img, .page-break img, .entry-content img").forEach((img) => {
      let src = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src");
      if (src && src.startsWith("http")) {
        pages.push({ url: src.trim() });
      }
    });

    return pages;
  },

  async getMangaDetails(id) {
    const url = `${this.BASE_URL}${id}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) throw new Error("Failed");

    const html = res.data;
    const doc = cinder.parseHTML(html);
    const title = (doc.querySelector(".post-title h1") || doc.querySelector("h1"))?.text()?.trim() || id;
    const cover = doc.querySelector(".summary_image img")?.attr("data-src") || doc.querySelector(".summary_image img")?.attr("src") || "";
    const desc = doc.querySelector(".description-summary .summary__content")?.text()?.trim() || "";
    const author = doc.querySelector(".author-content a")?.text()?.trim() || "";

    return { id, title, cover, description: desc, author, status: "ongoing", genres: [] };
  },

  async getDiscoverSections() {
    return [
      { id: "latest", title: "Latest Updates", icon: "🆕" },
      { id: "popular", title: "Popular", icon: "🔥" },
    ];
  },

  async getDiscoverItems(sectionId, page = 0) {
    // Just reuse search with empty query for now
    return await this.search("", page);
  }
};
