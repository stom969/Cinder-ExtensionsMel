__cinderExport = {
  id: "gocomics",
  name: "GoComics",
  version: "1.0.3",
  icon: "📰",
  description: "Read daily comic strips from GoComics.com",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: true,
    manga: true,
    download: false,
    resolve: false,
  },

  // Your comics.json list URL
  LIST_URL: "https://raw.githubusercontent.com/stom969/Cinder-ExtensionsMel/refs/heads/main/comics.json",

  _listCache: null,

  async _fetchList() {
    if (this._listCache) return this._listCache;
    const res = await cinder.fetch(this.LIST_URL);
    if (res.status !== 200) throw new Error("Failed to load comic list");
    this._listCache = JSON.parse(res.data);
    return this._listCache;
  },

  // ── Search ─────────────────────────────
  async search(query, page = 0) {
    const all = await this._fetchList();
    const q = query.toLowerCase().trim();
    let filtered = all;
    if (q) {
      filtered = all.filter(c => c.name && c.name.toLowerCase().includes(q));
    }
    const pageSize = 20;
    const start = page * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    return paged.map(c => ({
      id: c.slug,
      title: c.name,
      author: "",
      cover: `https://featureassets.gocomics.com/assets/recommendation_avatars/${c.slug}.png`,
      format: "manga",
    }));
  },

  // ── Discover ───────────────────────────
  async getDiscoverSections() {
    return [
      { id: "all", title: "All Comics", icon: "📚" },
    ];
  },

  async getDiscoverItems(sectionId, page = 0) {
    return await this.search("", page);
  },

  // ── Manga Details ──────────────────────
  async getMangaDetails(id) {
    return {
      id: id,
      title: id.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      cover: `https://featureassets.gocomics.com/assets/recommendation_avatars/${id}.png`,
      description: "",
      author: "",
      status: "ongoing",
      genres: [],
    };
  },

  // ── Chapters (last 30 days) ────────────
  async getChapters(mangaId) {
    const chapters = [];
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
      const date = new Date(y, m, d - daysAgo);
      const yy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateStr = `${yy}-${mm}-${dd}`;
      chapters.push({
        id: `${mangaId}/${yy}/${mm}/${dd}`,
        title: dateStr,
        chapterNumber: daysAgo,
        dateUploaded: date.toISOString().split('T')[0],
        scanlator: "GoComics",
      });
    }
    return chapters.reverse();
  },

  // ── Pages (return image URL directly) ──
  async getPages(chapterId) {
    const pageUrl = `https://www.gocomics.com/${chapterId}`;

    const pageRes = await cinder.fetchBrowser(pageUrl);
    if (pageRes.status !== 200) throw new Error("Failed to load comic page");

    const doc = cinder.parseHTML(pageRes.data);

    let img = doc.querySelector('img[class*="Comic-module"][class*="comic__image"]');
    if (!img) img = doc.querySelector('img[src*="featureassets.gocomics.com"]');
    if (!img) {
      const allImgs = doc.querySelectorAll('img');
      for (let i = 0; i < allImgs.length; i++) {
        const src = allImgs[i].attr('src');
        if (src && (src.includes('featureassets') || src.includes('comic'))) {
          img = allImgs[i];
          break;
        }
      }
    }
    if (!img) throw new Error("Could not find comic image");

    const imageUrl = img.attr('src');
    if (!imageUrl) throw new Error("Image URL not found");

    return [{ url: imageUrl }];
  }
};
