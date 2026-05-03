__cinderExport = {
  id: "toongod",
  name: "ToonGod InlineDiag",
  version: "5.0.0",
  icon: "🌐",
  description: "Diagnostic – shows info in title",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: false,
    manga: true,
    download: false,
    resolve: false,
  },

  async search(query, page = 0) {
    // Always search for "stepmother" (known to exist)
    const url = "https://www.toongod.org/?s=stepmother&post_type=wp-manga";
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) {
      return [{
        id: "error",
        title: `Status: ${res.status}`,
        cover: "",
        format: "manga",
      }];
    }

    const html = res.data;
    const doc = cinder.parseHTML(html);

    // Count container cards
    const cards = doc.querySelectorAll(".c-tabs-item__content");
    const cardCount = cards.length;

    // Total links
    const allLinks = doc.querySelectorAll("a");
    const totalLinks = allLinks.length;

    // Page title
    const titleEl = doc.querySelector("title");
    const pageTitle = titleEl ? titleEl.text().trim() : "no title";

    return [{
      id: "diag",
      title: `Cards: ${cardCount} | Links: ${totalLinks} | Title: ${pageTitle}`,
      cover: "",
      format: "manga",
    }];
  },

  async getMangaDetails(id) { return { id, title:"Diag", cover:"", description:"", author:"", status:"ongoing", genres:[] }; },
  async getChapters(mangaId) { return [{ id:"diag", title:"Diag", chapterNumber:0, dateUploaded:"", scanlator:"" }]; },
  async getPages(chapterId) { return [{ url: "https://placehold.co/800x600/00ff00/white?text=Diag" }]; }
};
