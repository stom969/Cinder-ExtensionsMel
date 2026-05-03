__cinderExport = {
  id: "batcave",
  name: "BatCave PageDiag",
  version: "2.0.0",
  icon: "🦇",
  description: "Checks comic page HTML",
  contentType: "manga",

  capabilities: {
    search: true,
    discover: false,
    manga: true,
    download: false,
    resolve: false,
  },

  BASE_URL: "https://batcave.biz",

  async search(query, page = 0) {
    // Only run for a known comic – hardcoded for testing
    const comicPath = "/33758-batman-2025.html"; // known Batman comic
    const url = `${this.BASE_URL}${comicPath}`;
    const res = await cinder.fetchBrowser(url);
    if (res.status !== 200) {
      return [{
        id: "error",
        title: `Comic page fetch failed: ${res.status}`,
        cover: "",
        format: "manga",
      }];
    }

    const html = res.data;
    const doc = cinder.parseHTML(html);

    // Count chapter items
    const clItems = doc.querySelectorAll(".cl__item");
    const count = clItems.length;

    // Find the chapter container HTML snippet
    const chapterContainer = doc.querySelector(".comix__fullstory-chapters");
    let snippet = "";
    if (chapterContainer) {
      snippet = chapterContainer.innerHTML.substring(0, 200);
    } else {
      snippet = doc.querySelector("body")?.innerHTML?.substring(0, 200) || "no body";
    }

    // Return diagnostic results
    return [
      {
        id: "diag1",
        title: `Chapter items (.cl__item): ${count}`,
        cover: "",
        format: "manga",
      },
      {
        id: "diag2",
        title: `HTML snippet: ${snippet}`,
        cover: "",
        format: "manga",
      }
    ];
  },

  async getMangaDetails(id) { return { id, title:"Diag", cover:"", description:"", author:"", status:"ongoing", genres:[] }; },
  async getChapters(mangaId) { return [{ id:"diag", title:"Diag", chapterNumber:0, dateUploaded:"", scanlator:"" }]; },
  async getPages(chapterId) { return [{ url: "https://placehold.co/800x600/00ff00/white?text=Diag" }]; }
};
