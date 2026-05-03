__cinderExport = {
  id: "batcave-test",
  name: "Batcave Test",
  version: "1.0.0",
  icon: "🦇",
  description: "Tests if batcave.biz is reachable",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: false,
    manga: true,
    download: false,
    resolve: false,
  },

  async search(query, page = 0) {
    const url = "https://batcave.biz/";
    let res;
    // Try regular fetch first, fallback to fetchBrowser
    try {
      res = await cinder.fetch(url, { headers: { "User-Agent": "CinderApp/1.0" } });
    } catch (e) {
      // If fetch fails, try fetchBrowser
      try {
        res = await cinder.fetchBrowser(url);
      } catch (e2) {
        return [{ id: "err", title: "Both fetch methods failed", cover: "", format: "manga" }];
      }
    }

    if (res.status !== 200) {
      return [{ id: "err", title: `Status: ${res.status}`, cover: "", format: "manga" }];
    }

    const doc = cinder.parseHTML(res.data);
    const title = doc.querySelector("title")?.text()?.trim() || "no title";
    const links = doc.querySelectorAll("a").length;

    return [{
      id: "diag",
      title: `Title: ${title} | Links: ${links}`,
      cover: "",
      format: "manga",
    }];
  },

  async getMangaDetails(id) { return { id, title:"Diag", cover:"", description:"", author:"", status:"ongoing", genres:[] }; },
  async getChapters(mangaId) { return [{ id:"diag", title:"Diag", chapterNumber:0, dateUploaded:"", scanlator:"" }]; },
  async getPages(chapterId) { return [{ url: "https://placehold.co/800x600/00ff00/white?text=Diag" }]; }
};
