__cinderExport = {
  id: "gocomics-working",
  name: "GoComics Test Conversion",
  version: "2.0.0",
  icon: "📰",
  description: "Tests base64 conversion of placeholder",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: true,
    manga: true,
    download: false,
    resolve: false,
  },

  LIST_URL: "https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/comics.json",

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
    for (let daysAgo = 0; daysAgo < 5; daysAgo++) {  // just 5 for speed
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
    // Use the placeholder image for testing conversion
    const imageUrl = "https://placehold.co/800x600/00ff00/white?text=Conversion+Works";

    // Fetch the image
    const imageRes = await cinder.fetch(imageUrl, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (imageRes.status !== 200) throw new Error("Failed to download image: " + imageRes.status);

    // Convert binary data to base64
    let base64;
    try {
      // If data is a string, it might already be base64 or we need to handle binary string
      if (typeof imageRes.data === "string") {
        // Try to convert binary string to base64
        base64 = btoa(unescape(encodeURIComponent(imageRes.data)));
      } else {
        // Assume it's an ArrayBuffer or Uint8Array
        base64 = btoa(String.fromCharCode(...new Uint8Array(imageRes.data)));
      }
    } catch (e) {
      // If conversion fails, fallback: return the original URL
      return [{ url: imageUrl }];
    }

    const contentType = imageRes.headers?.["content-type"] || "image/png";
    const dataUrl = `data:${contentType};base64,${base64}`;
    return [{ url: dataUrl }];
  }
};
