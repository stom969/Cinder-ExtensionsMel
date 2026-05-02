__cinderExport = {
  id: "gocomics",
  name: "GoComics Test",
  version: "1.0.0",
  icon: "📰",
  description: "Test version — returns a fake comic for any search",
  contentType: "comics",

  capabilities: {
    search: true,
    discover: true,
    download: true,
  },

  async search(query, page) {
    // Log something to help debug (visible if you have Console open)
    cinder.log("Search called with query:", query);

    // Return one fake comic, no matter what you type
    return [
      {
        id: "calvinandhobbes",
        title: "Calvin and Hobbes (TEST)",
        author: "Bill Watterson",
        cover: "https://avatar.amuniversal.com/feature_avatars/recommendation?feature=calvinandhobbes",
        url: "https://www.gocomics.com/calvinandhobbes",
        format: "comics"
      }
    ];
  }
};
