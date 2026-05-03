__cinderExport = {
  id: "batcave-test",
  name: "Batcave ConnTest",
  version: "2.0.0",
  icon: "🦇",
  description: "Tests batcave.biz connectivity",
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
    let result = "";

    // Try regular fetch first
    try {
      const res1 = await cinder.fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
      });
      if (res1.status === 200) {
        const doc1 = cinder.parseHTML(res1.data);
        const title1 = doc1.querySelector("title")?.text()?.trim() || "no title";
        const links1 = doc1.querySelectorAll("a").length;
        result = `fetch OK: Title="${title1}" | Links: ${links1}`;
      } else {
        result = `fetch status: ${res1.status}`;
      }
    } catch (e) {
      result = `fetch error: ${e.message}`;
    }

    // If regular fetch didn't give 200, try fetchBrowser
    if (!result.includes("fetch OK")) {
      try {
        const res2 = await cinder.fetchBrowser(url);
        if (res2.status === 200) {
          const doc2 = cinder.parseHTML(res2.data);
          const title2 = doc2.querySelector("title")?.text()?.trim() || "no title";
          const links2 = doc2.querySelectorAll("a").length;
          result += ` | fetchBrowser OK: Title="${title2}" | Links: ${links2}`;
        } else {
          result += ` | fetchBrowser status: ${res2.status}`;
        }
      } catch (e) {
        result += ` | fetchBrowser error: ${e.message}`;
      }
    }

    return [{
      id: "diag",
      title: result,
      cover: "",
      format: "manga",
    }];
  },

  async getMangaDetails(id) { return { id, title:"Diag", cover:"", description:"", author:"", status:"ongoing", genres:[] }; },
  async getChapters(mangaId) { return [{ id:"diag", title:"Diag", chapterNumber:0, dateUploaded:"", scanlator:"" }]; },
  async getPages(chapterId) { return [{ url: "https://placehold.co/800x600/00ff00/white?text=Diag" }]; }
};
