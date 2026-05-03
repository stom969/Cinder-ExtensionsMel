__cinderExport = {
  id: "literotica",
  name: "Literotica",
  version: "1.0.1",
  icon: "📖",
  description: "Read stories from Literotica.com",
  contentType: "books",

  capabilities: {
    search: true,
    discover: true,
    download: true,
    resolve: false,
    manga: false,
  },

  BASE_URL: "https://www.literotica.com",
  SEARCH_URL: "https://search.literotica.com",

  // ── Search ─────────────────────────────
  async search(query, page = 0) {
    const url = `${this.SEARCH_URL}/?query=${encodeURIComponent(query)}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const doc = cinder.parseHTML(res.data);
    const results = [];

    doc.querySelectorAll(".panel.ai_gJ").forEach((card) => {
      const titleEl = card.querySelector("h4");
      const linkEl = card.querySelector("a.ai_ii");
      const authorEl = card.querySelector("a.ai_il span.ai_im");

      if (!titleEl || !linkEl) return;

      const href = linkEl.attr("href");
      const title = titleEl.text().trim();
      const author = authorEl ? authorEl.text().trim() : "Unknown";

      results.push({
        id: href.replace(this.BASE_URL, ""),
        title: title,
        author: author,
        cover: "",
        url: `${this.BASE_URL}${href}`,
        format: "books",
      });
    });

    return results;
  },

  // ── Resolve (fetch story text as downloadable file) ─
  async resolve(item) {
    const url = item.id.startsWith("http") ? item.id : `${this.BASE_URL}${item.id}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) throw new Error("Failed to load story");

    const doc = cinder.parseHTML(res.data);
    const contentEl = doc.querySelector('._introduction-wrap_86nfw_1');
    if (!contentEl) throw new Error("Could not find story content");

    const title = doc.querySelector("h1")?.text()?.trim() || "Story";
    const text = contentEl.text().trim();

    // Convert to base64 for download
    const base64 = btoa(unescape(encodeURIComponent(text)));
    const dataUrl = `data:text/plain;base64,${base64}`;

    return { url: dataUrl };
  },

  // ── Discover ───────────────────────────
  async getDiscoverSections() {
    return [
      { id: "latest", title: "Latest Stories", icon: "🆕" },
    ];
  },

  async getDiscoverItems(sectionId, page = 0) {
    return await this.search("", page);
  }
};
