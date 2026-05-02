__cinderExport = {
  id: "gocomics",
  name: "GoComics Tiny",
  version: "3.0.0",
  icon: "📰",
  description: "Tiny test with 5 comics",
  contentType: "comics",

  capabilities: {
    search: true,
    discover: true,
    download: true,
  },

  async search(query, page) {
    // Tiny list, right inside the function
    const LIST = [
      { name: "Calvin and Hobbes", slug: "calvinandhobbes" },
      { name: "Garfield", slug: "garfield" },
      { name: "Peanuts", slug: "peanuts" },
      { name: "Doonesbury", slug: "doonesbury" },
      { name: "Big Nate", slug: "bignate" }
    ];

    let lowerQuery = query.toLowerCase().trim();
    let filtered = LIST;
    if (lowerQuery !== "") {
      filtered = LIST.filter(comic =>
        comic.name.toLowerCase().includes(lowerQuery)
      );
    }

    let pageSize = 20;
    let start = page * pageSize;
    let paged = filtered.slice(start, start + pageSize);

    return paged.map(comic => ({
      id: comic.slug,
      title: comic.name,
      author: "",
      cover: "https://avatar.amuniversal.com/feature_avatars/recommendation?feature=" + comic.slug,
      url: "https://www.gocomics.com/" + comic.slug,
      format: "comics"
    }));
  }
};
