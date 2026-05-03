__cinderExport = {
  id: "gocomics",
  name: "GoComics",
  version: "1.0.0",
  icon: "📰",
  description: "Read daily comic strips from GoComics.com",
  contentType: "manga",

  //love love
  
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
      cover: `https://avatar.amuniversal.com/feature_avatars/recommendation?feature=${c.slug}`,
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
      cover: `https://avatar.amuniversal.com/feature_avatars/recommendation?feature=${id}`,
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

  // ── Pages (fetchBrowser to get image) ─
  async getPages(chapterId) {
    const pageUrl = `https://www.gocomics.com/${chapterId}`;

    // 1. Fetch the comic page using fetchBrowser
    const pageRes = await cinder.fetchBrowser(pageUrl);
    if (pageRes.status !== 200) throw new Error("Failed to load comic page");

    const doc = cinder.parseHTML(pageRes.data);

    // Find the comic image
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

    // 2. Fetch the image using fetchBrowser with Referer
    const imgRes = await cinder.fetchBrowser(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": pageUrl,
      }
    });
    if (imgRes.status !== 200) throw new Error("Failed to download image");

    // 3. Convert to base64 data URL
    let base64;
    if (typeof imgRes.data === "string") {
      base64 = btoa(unescape(encodeURIComponent(imgRes.data)));
    } else {
      base64 = btoa(String.fromCharCode(...new Uint8Array(imgRes.data)));
    }

    const contentType = imgRes.headers?.["content-type"] || "image/png";
    const dataUrl = `data:${contentType};base64,${base64}`;
    return [{ url: dataUrl }];
  }
};
