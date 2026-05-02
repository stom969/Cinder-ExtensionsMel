__cinderExport = {
  id: "gocomics",
  name: "GoComics",
  version: "2.0.0",
  icon: "📰",
  description: "Read daily comic strips from GoComics.com",
  contentType: "comics",

  capabilities: {
    search: true,
    discover: true,
    download: true,
  },

  // Cache for the comic list
  _cachedList: null,

  async _getComicList() {
    if (this._cachedList) return this._cachedList;

    // URL to your comics.json – use your server or GitHub Pages URL
    const listUrl = "https://raw.githubusercontent.com/stom969/Cinder-ExtensionsMel/refs/heads/main/comics.json"; // ← change this to your actual URL

    let response = await cinder.fetch(listUrl);
    if (response.status !== 200) {
      throw new Error("Failed to load comic list: " + response.status);
    }
    this._cachedList = JSON.parse(response.data);
    return this._cachedList;
  },

  async search(query, page) {
    let allComics = await this._getComicList();
    let lowerQuery = query.toLowerCase().trim();

    let filtered = allComics;
    if (lowerQuery !== "") {
      filtered = allComics.filter(comic =>
        comic.name && comic.name.toLowerCase().includes(lowerQuery)
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
  },

  async resolve(item) {
    let today = new Date();
    let yyyy = today.getFullYear();
    let mm = (today.getMonth() + 1).toString().padStart(2, '0');
    let dd = today.getDate().toString().padStart(2, '0');
    let pageUrl = `https://www.gocomics.com/${item.id}/${yyyy}/${mm}/${dd}`;

    let response = await cinder.fetch(pageUrl, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (response.status !== 200) {
      throw new Error("Failed to load comic page: " + response.status);
    }

    let html = response.data;
    let imgMatch = html.match(/<img\s[^>]*class="img-fluid"[^>]*src="(https:\/\/[^"]+)"/i);
    if (imgMatch) return { url: imgMatch[1] };

    let fallbackMatch = html.match(/<picture[^>]*>.*?<img[^>]*src="(https:\/\/[^"]+)"/is);
    if (fallbackMatch) return { url: fallbackMatch[1] };

    throw new Error("Could not find comic image on the page.");
  }
};
