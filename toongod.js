__cinderExport = {
  id: "toongod",
  name: "ToonGod Diag",
  version: "3.0.0",
  icon: "🌐",
  description: "Diagnostic – shows link counts",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: false,
    manga: true,
    download: false,
    resolve: false,
  },

  BASE_URL: "https://www.toongod.org",

  async search(query, page = 0) {
    const url = `${this.BASE_URL}/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) {
      return [{
        id: "error",
        title: `Fetch failed with status ${res.status}`,
        cover: "",
        format: "manga",
      }];
    }

    const html = res.data;
    const doc = cinder.parseHTML(html);

    // Count all <a> tags
    const allLinks = doc.querySelectorAll("a");
    const totalLinks = allLinks.length;

    // Count webtoon links
    const webtoonLinks = doc.querySelectorAll('a[href*="/webtoon/"]');
    const webtoonCount = webtoonLinks.length;

    // Return one result with the counts
    return [{
      id: "diag",
      title: `Total <a>: ${totalLinks} | Webtoon <a>: ${webtoonCount}`,
      cover: "",
      format: "manga",
    }];
  },

  async getMangaDetails(id) { return { id, title:"Diag", cover:"", description:"", author:"", status:"ongoing", genres:[] }; },
  async getChapters(mangaId) { return [{ id:"diag", title:"Diag", chapterNumber:0, dateUploaded:"", scanlator:"" }]; },
  async getPages(chapterId) { return [{ url: "https://placehold.co/800x600/00ff00/white?text=Diag" }]; }
};
