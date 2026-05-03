__cinderExport = {
  id: "batcave-test",
  name: "Batcave Mini",
  version: "1.0.1",
  icon: "🦇",
  description: "Minimal test",
  contentType: "manga",
  capabilities: {
    search: true,
    discover: false,
    manga: true,
    download: false,
    resolve: false,
  },
  async search(query, page) {
    return [{
      id: "test",
      title: "Batcave Hardcoded Result",
      cover: "",
      format: "manga",
    }];
  },
  async getMangaDetails(id) { return { id, title:"Test", cover:"", description:"", author:"", status:"ongoing", genres:[] }; },
  async getChapters(mangaId) { return [{ id:"ch1", title:"Chapter 1", chapterNumber:1, dateUploaded:"", scanlator:"" }]; },
  async getPages(chapterId) { return [{ url: "https://placehold.co/800x600/00ff00/white?text=OK" }]; }
};
