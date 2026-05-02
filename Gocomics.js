__cinderExport = {
  id: "gocomics",
  name: "GoComics",
  version: "1.0.0",
  icon: "📰",
  description: "Read daily comic strips from GoComics.com",
  contentType: "comics",

  capabilities: {
    search: true,
    discover: true,
    download: false,
    resolve: true,
    searchDownloads: false,   // explicitly hide “Search Downloads”
  },

  // URL where the full comic list is hosted
  LIST_URL: "https://raw.githubusercontent.com/stom969/Cinder-ExtensionsMel/refs/heads/main/comics.json",

  async _fetchList() {
    const res = await cinder.fetch(this.LIST_URL);
    if (res.status !== 200) {
      throw new Error(`Failed to load comic list (status ${res.status})`);
    }
    return JSON.parse(res.data);
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
      id: c.slug,                                    // ← only ID, no URL
      title: c.name,
      author: "",
      cover: `https://avatar.amuniversal.com/feature_avatars/recommendation?feature=${c.slug}`,
      // NO url field
      format: "comics",
    }));
  },

  async resolve(item) {
    // item.id is the slug (e.g. "calvinandhobbes")
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const pageUrl = `https://www.gocomics.com/${item.id}/${y}/${m}/${d}`;

    const res = await cinder.fetch(pageUrl, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) {
      throw new Error("Failed to load comic page");
    }

    const html = res.data;
    // Find the comic image URL
    let match = html.match(/<img\s[^>]*class="img-fluid"[^>]*src="(https:\/\/[^"]+)"/i)
                || html.match(/<picture[^>]*>.*?<img[^>]*src="(https:\/\/[^"]+)"/is);
    if (match) return { url: match[1] };
    throw new Error("Could not find comic image");
  }
};
