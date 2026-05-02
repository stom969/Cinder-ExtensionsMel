__cinderExport = {
  id: "gocomics",
  name: "GoComics",
  version: "1.0.0",
  icon: "📰",
  description: "Read daily comic strips from GoComics.com",
  contentType: "comics",

  capabilities: {
    search: true,
    discover: true,
    download: false,   // we'll get the image via resolve
    resolve: true,
  },

  // ── Search ──────────────────────────────────────
  async search(query, page) {
    // Fetch the A‑Z page (contains all comics)
    const response = await cinder.fetch("https://www.gocomics.com/comics/a-to-z", {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (response.status !== 200) {
      cinder.warn("Failed to fetch A‑Z page, status:", response.status);
      return [];
    }

    const html = response.data;

    // Find the big JSON array embedded in the page
    const startMarker = '[{"name":"';
    const startIdx = html.indexOf(startMarker);
    if (startIdx === -1) {
      cinder.warn("Could not find comic data in the page");
      return [];
    }

    // Find the matching closing bracket
    let bracketCount = 0;
    let endIdx = startIdx;
    for (let i = startIdx; i < html.length; i++) {
      const ch = html[i];
      if (ch === '[') bracketCount++;
      if (ch === ']') {
        bracketCount--;
        if (bracketCount === 0) {
          endIdx = i;
          break;
        }
      }
    }

    const jsonStr = html.substring(startIdx, endIdx + 1);
    let allComics;
    try {
      allComics = JSON.parse(jsonStr);
    } catch (e) {
      cinder.warn("Failed to parse comic list:", e.message);
      return [];
    }

    // Filter by search query
    const lowerQuery = query.toLowerCase().trim();
    let filtered = allComics;
    if (lowerQuery) {
      filtered = allComics.filter(c =>
        c.name && c.name.toLowerCase().includes(lowerQuery)
      );
    }

    // Paginate (20 per page)
    const pageSize = 20;
    const start = page * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    // Convert to Cinder’s expected format
    return paged.map(comic => ({
      id: comic.slug,                              // we'll use slug as ID
      title: comic.name,
      author: "",
      cover: `https://avatar.amuniversal.com/feature_avatars/recommendation?feature=${comic.slug}`,
      url: `https://www.gocomics.com/${comic.slug}`, // detail page URL (resolve will fetch)
      format: "comics"
    }));
  },

  // ── Resolve (get today’s comic image) ──────────
  async resolve(item) {
    // item.id is the comic slug (e.g. "calvinandhobbes")
    const today = new Date();
    const y = today.getFullYear();
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    const d = today.getDate().toString().padStart(2, '0');
    const pageUrl = `https://www.gocomics.com/${item.id}/${y}/${m}/${d}`;

    const response = await cinder.fetch(pageUrl, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (response.status !== 200) {
      throw new Error("Failed to load comic page: " + response.status);
    }

    const html = response.data;

    // Try to find the comic image using common selectors
    let imgMatch = html.match(/<img\s[^>]*class="img-fluid"[^>]*src="(https:\/\/[^"]+)"/i);
    if (imgMatch) return { url: imgMatch[1] };

    // Fallback: look inside a <picture> tag
    imgMatch = html.match(/<picture[^>]*>.*?<img[^>]*src="(https:\/\/[^"]+)"/is);
    if (imgMatch) return { url: imgMatch[1] };

    throw new Error("Could not find comic image on the page.");
  }
};__cinderExport = {
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
