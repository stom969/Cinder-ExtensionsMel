__cinderExport = {
  id: "gocomics",
  name: "GoComics",
  version: "1.0.1",
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

  LIST_URL: "https://raw.githubusercontent.com/stom969/Cinder-ExtensionsMel/refs/heads/main/comics.json",

  _listCache: null,

  async _fetchList() {
    if (this._listCache) return this._listCache;
    const res = await cinder.fetch(this.LIST_URL);
    if (res.status !== 200) throw new Error("Failed to load comic list");
    this._listCache = JSON.parse(res.data);
    return this._listCache;
  },

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

  async getDiscoverSections() {
    return [
      { id: "popular", title: "Popular Comics", icon: "🔥" },
      { id: "all", title: "All Comics", icon: "📚" },
    ];
  },

  async getDiscoverItems(sectionId, page = 0) {
    return await this.search("", page);
  },

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

  async getPages(chapterId) {
    const pageUrl = `https://www.gocomics.com/${chapterId}`;
    const res = await cinder.fetch(pageUrl, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) throw new Error("Failed to load comic page");

    const html = res.data;
    const doc = cinder.parseHTML(html);

    let imageUrl = null;

    // 1. Try class pattern
    let img = doc.querySelector('img[class*="Comic-module"][class*="comic__image"]');
    if (img) imageUrl = img.attr('src');

    // 2. Fallback: featureassets
    if (!imageUrl) {
      img = doc.querySelector('img[src*="featureassets.gocomics.com"]');
      if (img) imageUrl = img.attr('src');
    }

    // 3. Last resort
    if (!imageUrl) {
      const allImgs = doc.querySelectorAll('img');
      for (let i = 0; i < allImgs.length; i++) {
        const src = allImgs[i].attr('src');
        if (src && (src.includes('featureassets') || src.includes('comic'))) {
          imageUrl = src;
          break;
        }
      }
    }

    if (!imageUrl) throw new Error("Could not find comic image");

    // ── Fetch the image and convert to data URL ─────
    const imageRes = await cinder.fetch(imageUrl, {
      headers: {
        "User-Agent": "CinderApp/1.0",
        "Referer": pageUrl,                     // essential for GoComics CDN
      }
    });
    if (imageRes.status !== 200) throw new Error("Failed to download comic image");

    // Convert the binary data to base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imageRes.data)));
    const contentType = imageRes.headers?.["content-type"] || "image/png";
    const dataUrl = `data:${contentType};base64,${base64}`;

    return [{ url: dataUrl }];
  }
};
