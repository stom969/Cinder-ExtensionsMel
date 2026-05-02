__cinderExport = {
  id: "gocomics-manga-test",
  name: "GoComics Manga Test",
  version: "1.0.0",
  icon: "📰",
  description: "Tests manga reader with placeholder image",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: false,
    manga: true,
    download: false,
    resolve: false,
  },

  async search(query, page = 0) {
    // Return a single fake comic for testing
    return [
      {
        id: "test-comic",
        title: "Test Comic (Manga Reader)",
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
      description: "A test comic",
      author: "Test Author",
      status: "ongoing",
      genres: [],
    };
  },

  async getChapters(mangaId) {
    // Return 2 fake chapters
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
    // Return a placeholder image (real HTTP URL, not data URL)
    return [
      {
        url: "https://via.placeholder.com/800x600/00ff00/ffffff?text=Chapter+" + chapterId,
      }
    ];
  }
};
