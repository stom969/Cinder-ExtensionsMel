__cinderExport = {
  id: "gocomics",
  name: "GoComics Resolve",
  version: "1.0.0",
  icon: "📰",
  description: "Resolve test – should show a red dot",
  contentType: "comics",

  capabilities: {
    search: true,
    discover: false,
    download: false,
    resolve: true,
  },

  LIST_URL: "https://raw.githubusercontent.com/stom969/Cinder-ExtensionsMel/refs/heads/main/comics.json",

  async _fetchList() {
    const res = await cinder.fetch(this.LIST_URL);
    if (res.status !== 200) throw new Error("List fetch failed");
    return JSON.parse(res.data);
  },

  async search(query, page = 0) {
    const all = await this._fetchList();
    const q = query.toLowerCase().trim();
    let filtered = all;
    if (q) filtered = all.filter(c => c.name && c.name.toLowerCase().includes(q));
    const pageSize = 20;
    const start = page * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    return paged.map(c => ({
      id: c.slug,
      title: c.name,
      author: "",
      cover: `https://avatar.amuniversal.com/feature_avatars/recommendation?feature=${c.slug}`,
      // NO url field
      format: "comics",
    }));
  },

  async resolve(item) {
    // Return a hardcoded red pixel as data URL – no network needed
    return {
      url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    };
  }
};
