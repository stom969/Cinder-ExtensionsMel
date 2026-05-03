__cinderExport = {
  id: "toongod",
  name: "ToonGod Test",
  version: "1.0.0",
  icon: "🌐",
  description: "Hardcoded test – should show one result",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: false,
    manga: true,
    download: false,
    resolve: false,
  },

  async search(query, page = 0) {
    // Return a single hardcoded comic for ANY query
    return [
      {
        id: "/webtoon/test-comic/",
        title: "Test Comic (Hardcoded)",
        author: "",
        cover: "https://via.placeholder.com/150x200/cccccc/000000?text=Test",
        format: "manga",
      }
    ];
  },

  async getMangaDetails(id) {
    return {
      id: id,
      title: "Test Comic",
      cover: "https://via.placeholder.com/150x200/cccccc/000000?text=Test",
      description: "",
      author: "",
      status: "ongoing",
      genres: [],
    };
  },

  async getChapters(mangaId) {
    return [
      {
        id: "/webtoon/test-comic/chapter-1/",
        title: "Chapter 1",
        chapterNumber: 1,
        dateUploaded: "",
        scanlator: "Test",
      }
    ];
  },

  async getPages(chapterId) {
    return [{ url: "https://placehold.co/800x600/00ff00/white?text=Test+Page" }];
  }
};
