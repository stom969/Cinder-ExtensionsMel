__cinderExport = {
  id: "toongod",
  name: "ToonGod",
  version: "2.0.0",
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
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);

    const results = [];
    const seen = {};

    // Find all links to webtoons (comic detail pages)
    const allLinks = doc.querySelectorAll('a[href*="/webtoon/"]');
    
    allLinks.forEach((link) => {
      const href = link.attr("href");
      // Skip non‑comic links (author, genre, release pages)
      if (!href || href.match(/\/(webtoon-author|webtoon-artist|webtoon-genre|webtoon-release)\//)) return;
      if (seen[href]) return;
      seen[href] = true;

      // Extract the slug from the URL
      const slugMatch = href.match(/\/webtoon\/([^/]+)/);
      if (!slugMatch) return;
      const slug = slugMatch[1];

      // Use the link text if it looks like a title, otherwise use the slug
      let title = link.text().trim();
      if (!title || title.length < 3 || title.match(/^Chapter \d+/i)) {
        title = slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      }

      // Try to find a cover image nearby (go up the DOM tree a bit)
      let cover = "";
      let parent = link.parentNode;
      for (let i = 0; i < 5; i++) {
        if (!parent) break;
        const img = parent.querySelector("img");
        if (img) {
          cover = img.attr("data-src") || img.attr("src") || "";
          if (cover) break;
        }
        parent = parent.parentNode;
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

  // ── Chapters ───────────────────────────
  async getChapters(mangaId) {
    const url = `${this.BASE_URL}${mangaId}`;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);
    const chapters = [];

    doc.querySelectorAll(".version-chap li a, .wp-manga-chapter a, .listing-chapters_wrap a").forEach((link) => {
      const href = link.attr("href");
      const title = link.text().trim();
      const id = href.replace(this.BASE_URL, "");
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

    doc.querySelectorAll(".reading-content img, .page-break img, .entry-content img").forEach((img) => {
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
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) throw new Error("Failed");

    const html = res.data;
    const doc = cinder.parseHTML(html);
    const title = (doc.querySelector(".post-title h1") || doc.querySelector("h1"))?.text()?.trim() || id;
    const cover = doc.querySelector(".summary_image img")?.attr("data-src") || doc.querySelector(".summary_image img")?.attr("src") || "";
    const desc = doc.querySelector(".description-summary .summary__content")?.text()?.trim() || "";
    const author = doc.querySelector(".author-content a")?.text()?.trim() || "";

    return { id, title, cover, description: desc, author, status: "ongoing", genres: [] };
  },

  // ── Discover ───────────────────────────
  async getDiscoverSections() {
    return [
      { id: "latest", title: "Latest Updates", icon: "🆕" },
      { id: "popular", title: "Popular", icon: "🔥" },
    ];
  },

  async getDiscoverItems(sectionId, page = 0) {
    const url = this.BASE_URL;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) return [];

    const html = res.data;
    const doc = cinder.parseHTML(html);
    const results = [];
    const seen = {};

    doc.querySelectorAll('a[href*="/webtoon/"]').forEach((link) => {
      const href = link.attr("href");
      if (!href || href.match(/\/(webtoon-author|webtoon-artist|webtoon-genre|webtoon-release)\//)) return;
      if (seen[href]) return;
      seen[href] = true;

      const slugMatch = href.match(/\/webtoon\/([^/]+)/);
      if (!slugMatch) return;
      const slug = slugMatch[1];
      let title = link.text().trim();
      if (!title || title.length < 3 || title.match(/^Chapter \d+/i)) {
        title = slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      }

      let cover = "";
      let parent = link.parentNode;
      for (let i = 0; i < 5; i++) {
        if (!parent) break;
        const img = parent.querySelector("img");
        if (img) {
          cover = img.attr("data-src") || img.attr("src") || "";
          if (cover) break;
        }
        parent = parent.parentNode;
      }

      const id = href.replace(this.BASE_URL, "").replace(/\/$/, "");
      results.push({ id, title, author: "", cover, url: href, format: "manga" });
    });

    return results;
  }
};
