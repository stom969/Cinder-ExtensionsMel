__cinderExport = {
  id: "gocomics",
  name: "GoComics Debug",
  version: "2.0.0",
  icon: "📰",
  description: "Debug version — should show Calvin and Hobbes",
  contentType: "comics",

  capabilities: {
    search: true,
    discover: true,
    download: true,
  },

  async search(query, page) {
    // Always return this, no matter what
    return [
      {
        id: "calvinandhobbes",
        title: "Calvin and Hobbes (Debug)",
        author: "",
        cover: "https://avatar.amuniversal.com/feature_avatars/recommendation?feature=calvinandhobbes",
        url: "https://www.gocomics.com/calvinandhobbes",
        format: "comics"
      }
    ];
  },

  async resolve(item) {
    return { url: "https://via.placeholder.com/800x600.png?text=Test" };
  }
};
