__cinderExport = {
  id: "literotica",
  name: "Literotica Test",
  version: "1.0.2",
  icon: "📖",
  description: "Diagnostic test",
  contentType: "books",

  capabilities: {
    search: true,
    discover: true,
    download: true,
    resolve: true,
    manga: false,
  },

  BASE_URL: "https://www.literotica.com",
  SEARCH_URL: "https://search.literotica.com",

  async search(query, page = 0) {
    return [
      {
        id: "/s/my-fantasy-sharing-you",
        title: "My Fantasy: Sharing You",
        author: "csljr1j",
        cover: "",
        url: "https://www.literotica.com/s/my-fantasy-sharing-you",
        format: "books",
      }
    ];
  },

  async resolve(item) {
    // Test 1: Return hardcoded text first
    const testText = "This is a test story. If you can read this, the book reader works.";
    const base64 = btoa(unescape(encodeURIComponent(testText)));
    return { url: `data:text/plain;base64,${base64}` };
  }
};
