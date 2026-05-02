__cinderExport = {
  id: "gocomics-manga-test2",
  name: "GoComics Manga Test 2",
  version: "1.0.0",
  icon: "📰",
  description: "Tests manga reader with placehold.co",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: false,
    manga: true,
    download: false,
    resolve: false,
  },

  async search(query, page = 0) {
    return [
      {
        id: "test-comic",
        title: "Test Comic (Manga Reader 2)",
        cover: "https://placehold.co/150x200/cccccc/000000?text=Test",
        format: "manga",
      }
    ];
  },

  async getMangaDetails(id) {
    return {
      id: id,
      title: "Test Comic",
      cover: "https://placehold.co/150x200/cccccc/000000?text=Test",
      description: "A test comic",
      author: "Test Author",
      status: "ongoing",
      genres: [],
    };
  },

  async getChapters(mangaId) {
    return [
      {
        id: "chapter-1",
        title: "Chapter 1",
        chapterNumber: 1,
        dateUploaded: "2025-05-01",
        scanlator: "Test",
      },
      {
        id: "chapter-2",
        title: "Chapter 2",
        chapterNumber: 2,
        dateUploaded: "2025-05-02",
        scanlator: "Test",
      },
    ];
  },

  async getPages(chapterId) {
    return [
      {
        url: "https://placehold.co/800x600/00ff00/white?text=Chapter+" + chapterId,
      }
    ];
  }
};
