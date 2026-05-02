__cinderExport = {
  id: "gocomics",
  name: "GoComics Diag",
  version: "9.9.9",
  icon: "📰",
  description: "Diagnostic: shows page HTML",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: true,
    manga: true,
    download: false,
    resolve: false,
  },

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
      id: c.slug,
      title: c.name,
      author: "",
      cover: `https://avatar.amuniversal.com/feature_avatars/recommendation?feature=${c.slug}`,
      format: "manga",
    }));
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
    for (let daysAgo = 0; daysAgo < 5; daysAgo++) { // just 5 for testing
      const date = new Date(y, m, d - daysAgo);
      const yy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateStr = `${yy}-${mm}-${dd}`;
      const chapterId = `${mangaId}/${yy}/${mm}/${dd}`;
      chapters.push({
        id: chapterId,
        title: dateStr,
        chapterNumber: 0,
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
    // Return the HTML as a text page, encoded in base64
    const base64 = btoa(unescape(encodeURIComponent(
      `Status: ${res.status}\n\nFirst 2000 chars:\n${res.data.substring(0, 2000)}`
    )));
    return [{ url: `data:text/plain;base64,${base64}` }];
  }
};__cinderExport = {
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

  // URL where the full comic list is hosted
  LIST_URL: "https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/comics.json",

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
      id: c.slug,
      title: c.name,
      author: "",
      cover: `https://avatar.amuniversal.com/feature_avatars/recommendation?feature=${c.slug}`,
      format: "manga",
    }));
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
      const chapterId = `${mangaId}/${yy}/${mm}/${dd}`;
      chapters.push({
        id: chapterId,
        title: dateStr,
        chapterNumber: 0,
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
    if (res.status !== 200) {
      throw new Error("Failed to load comic page (status " + res.status + ")");
    }

    const html = res.data;
    const doc = cinder.parseHTML(html);

    // 1. Try the exact class pattern we saw (Comic-module...comic__image)
    let img = doc.querySelector('img[class*="Comic-module"][class*="comic__image"]');
    if (img) {
      const src = img.attr('src');
      if (src) return [{ url: src }];
    }

    // 2. Fallback: any image from featureassets.gocomics.com
    img = doc.querySelector('img[src*="featureassets.gocomics.com"]');
    if (img) {
      const src = img.attr('src');
      if (src) return [{ url: src }];
    }

    // 3. Last resort: first <img> with a valid src
    const allImgs = doc.querySelectorAll('img');
    for (let i = 0; i < allImgs.length; i++) {
      const src = allImgs[i].attr('src');
      if (src && src.startsWith('https://')) {
        return [{ url: src }];
      }
    }

    throw new Error("Could not find comic image");
  }
};__cinderExport = {
  id: "gocomics",
  name: "GoComics",
  version: "1.5.0",
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
      id: c.slug,
      title: c.name,
      author: "",
      cover: `https://avatar.amuniversal.com/feature_avatars/recommendation?feature=${c.slug}`,
      format: "manga",
    }));
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
      const chapterId = `${mangaId}/${yy}/${mm}/${dd}`;
      chapters.push({
        id: chapterId,
        title: dateStr,
        chapterNumber: 0,
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
    if (res.status !== 200) {
      throw new Error("Failed to load comic page (status " + res.status + ")");
    }

    const html = res.data;
    const doc = cinder.parseHTML(html);

    let img = doc.querySelector('.item-comic-image img');
    if (img) {
      const src = img.attr('src');
      if (src) return [{ url: src }];
    }

    img = doc.querySelector('img[src*="featureassets.gocomics.com"]');
    if (img) {
      const src = img.attr('src');
      if (src) return [{ url: src }];
    }

    img = doc.querySelector('picture img');
    if (!img) img = doc.querySelector('img');
    if (img) {
      const src = img.attr('src');
      if (src) return [{ url: src }];
    }

    throw new Error("Could not find comic image");
  }
};
