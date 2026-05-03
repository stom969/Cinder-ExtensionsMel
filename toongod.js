__cinderExport = {
  id: "toongod",
  name: "ToonGod MobUA",
  version: "6.0.0",
  icon: "🌐",
  description: "Tests mobile User-Agent",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: false,
    manga: true,
    download: false,
    resolve: false,
  },

  async search(query, page = 0) {
    const url = "https://www.toongod.org/?s=stepmother&post_type=wp-manga";
    const res = await cinder.fetchBrowser(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
      }
    });
    if (res.status !== 200) {
      return [{ id: "err", title: `Status: ${res.status}`, cover: "", format: "manga" }];
    }
    const doc = cinder.parseHTML(res.data);
    const cards = doc.querySelectorAll(".c-tabs-item__content");
    const links = doc.querySelectorAll("a");
    const titleEl = doc.querySelector("title");
    const pageTitle = titleEl ? titleEl.text().trim() : "no title";
    return [{
      id: "diag",
      title: `Cards: ${cards.length} | Links: ${links.length} | Title: ${pageTitle}`,
      cover: "",
      format: "manga",
    }];
  },

  async getMangaDetails(id) { return { id, title:"Diag", cover:"", description:"", author:"", status:"ongoing", genres:[] }; },
  async getChapters(mangaId) { return [{ id:"diag", title:"Diag", chapterNumber:0, dateUploaded:"", scanlator:"" }]; },
  async getPages(chapterId) { return [{ url: "https://placehold.co/800x600/00ff00/white?text=Diag" }]; }
};
