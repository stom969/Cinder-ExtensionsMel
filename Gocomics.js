__cinderExport = {
  id: "gocomics",
  name: "GoComics",
  version: "1.3.0",
  icon: "📰",
  description: "Read daily comic strips from GoComics.com",
  contentType: "manga",   // ← treat it as manga to get chapter list

  capabilities: {
    search: true,
    discover: true,
    manga: true,           // ← this enables getChapters / getPages
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
      id: c.slug,           // this will be the "manga ID"
      title: c.name,
      author: "",
      cover: `https://avatar.amuniversal.com/feature_avatars/recommendation?feature=${c.slug}`,
      format: "manga",      // must be "manga" because contentType is manga
    }));
  },

  // ── Manga Details ──────────────────────
  async getMangaDetails(id) {
    // `id` is the comic slug (e.g. "calvinandhobbes")
    // Return basic info. This won’t be shown in full detail unless needed,
    // but Cinder expects it.
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

  // ── Chapters (recent dates) ───────────
  async getChapters(mangaId) {
    // `mangaId` is the comic slug
    // Build a list of the last 30 days as chapters
    const chapters = [];
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();     // 0-indexed
    const d = now.getDate();

    for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
      const date = new Date(y, m, d - daysAgo);
      const yy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateStr = `${yy}-${mm}-${dd}`;

      // Use the date string as the chapter ID (combined with the slug)
      const chapterId = `${mangaId}/${yy}/${mm}/${dd}`;
      chapters.push({
        id: chapterId,
        title: dateStr,
        chapterNumber: 0,     // not really used, but required
        dateUploaded: date.toISOString().split('T')[0],
        scanlator: "GoComics", // optional
      });
    }

    // Return in chronological order (oldest first for manga reader)
    return chapters.reverse();
  },

  // ── Pages (single comic image) ─────────
  async getPages(chapterId) {
    // chapterId is like "calvinandhobbes/2025/05/02"
    // Build the full GoComics page URL
    const pageUrl = `https://www.gocomics.com/${chapterId}`;

    const res = await cinder.fetch(pageUrl, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) {
      throw new Error("Failed to load comic page");
    }

    const html = res.data;

    // Try to find the comic image
    let imgMatch = html.match(/<img\s[^>]*class="img-fluid"[^>]*src="(https:\/\/[^"]+)"/i)
                || html.match(/<picture[^>]*>.*?<img[^>]*src="(https:\/\/[^"]+)"/is)
                || html.match(/<img[^>]*src="(https:\/\/[^"]+)"[^>]*>/i);

    if (!imgMatch) {
      throw new Error("Could not find comic image");
    }

    // Return a single page
    return [{ url: imgMatch[1] }];
  }
};
