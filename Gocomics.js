__cinderExport = {
  id: "gocomics",
  name: "GoComics Resolve",
  version: "4.0.0",
  icon: "📰",
  description: "Test with resolve capability",
  contentType: "comics",

  capabilities: {
    search: true,
    discover: true,
    download: false,   // we don't have a direct download URL
    resolve: true,     // we will fetch the actual image later
  },

  async search(query, page) {
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
      filtered = LIST.filter(c => c.name.toLowerCase().includes(lowerQuery));
    }

    let pageSize = 20;
    let start = page * pageSize;
    let paged = filtered.slice(start, start + pageSize);

    return paged.map(comic => ({
      id: "https://www.gocomics.com/" + comic.slug,   // page URL – resolve will fetch this
      title: comic.name,
      author: "",
      cover: "https://avatar.amuniversal.com/feature_avatars/recommendation?feature=" + comic.slug,
      format: "comics"
      // NO url field – because download: false
    }));
  },

  // Resolve: called when the user taps a search result
  async resolve(item) {
    // For now, return a test image.
    // Later we'll fetch the comic from item.id (the page URL).
    return {
      url: "https://via.placeholder.com/800x600.png?text=Working+Search"
    };
  }
};__cinderExport = {
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
