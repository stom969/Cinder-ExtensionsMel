__cinderExport = {
  id: "toongod",
  name: "ToonGod BrowserFetch",
  version: "5.0.0",
  icon: "🌐",
  description: "Tests fetchBrowser",
  contentType: "manga",

  //love is temporary, memories are forever

  capabilities: {
    search: true,
    discover: false,
    manga: true,
    download: false,
    resolve: false,
  },

  async search(query, page = 0) {
    const url = `https://www.toongod.org/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
    let res;
    try {
      // Try the browser-powered fetch
      res = await cinder.fetchBrowser(url);
    } catch (e) {
      return [{
        id: "error",
        title: `fetchBrowser error: ${e.message}`,
        cover: "",
        format: "manga",
      }];
    }
    
    const status = res.status;
    const length = res.data ? res.data.length : 0;
    return [{
      id: "diag",
      title: `BrowserFetch Status: ${status} | Length: ${length}`,
      cover: "",
      format: "manga",
    }];
  },

  async getMangaDetails(id) { return { id, title:"Diag", cover:"", description:"", author:"", status:"ongoing", genres:[] }; },
  async getChapters(mangaId) { return [{ id:"diag", title:"Diag", chapterNumber:0, dateUploaded:"", scanlator:"" }]; },
  async getPages(chapterId) { return [{ url: "https://placehold.co/800x600/00ff00/white?text=Diag" }]; }
};
