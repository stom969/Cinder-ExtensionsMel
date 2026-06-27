// Nyaa.si (TorBox) — Cinder JavaScript Extension
// Searches Nyaa.si's RSS feed and routes magnets through TorBox via Cinder's debrid layer.
//
// INSTALL:
//   Settings → Download Sources → Add → Paste JSON (paste repo entry below), OR
//   drop this file somewhere public and point Cinder at it via a repo.json.
//
// SETTINGS (configured in-app after install):
//   • TorBox API Key  — from https://torbox.app/settings (stored in secure store)
//   • Category        — Nyaa category filter (default: "3_1" = Literature – English)
//   • Trusted Only    — toggle to show only trusted/official uploads (default: off)

class NyaaTorBoxSource {
  // ── Identity ────────────────────────────────────────────────────────────────
  id          = "nyaa-torbox";
  name        = "Nyaa.si (TorBox)";
  version     = "1.0.0";
  icon        = "magnet-outline";
  description = "Search Nyaa.si and download via TorBox debrid";
  contentType = "books"; // manga/LN torrents are ebook-adjacent; adjust if needed

  capabilities = {
    search:          false, // this is a download source, not a metadata source
    discover:        false,
    download:        true,  // appears as a download source on book detail pages
    resolve:         true,  // we do a second step to get the TorBox download URL
    searchDownloads: true,  // also shown in the "Search Downloads" flow
    manga:           false,
  };

  // ── Settings ────────────────────────────────────────────────────────────────
  getSettings() {
    return [
      {
        id:          "apiKey",
        label:       "TorBox API Key",
        type:        "text",
        placeholder: "Paste your TorBox API key",
        secure:      true,
      },
      {
        id:           "category",
        label:        "Nyaa Category",
        type:         "select",
        defaultValue: "3_1",
        options: [
          { label: "Literature – English-translated", value: "3_1" },
          { label: "Literature – Non-English",        value: "3_2" },
          { label: "Literature – Raw",                value: "3_3" },
          { label: "All Literature",                  value: "3_0" },
          { label: "All Categories",                  value: "0_0" },
        ],
      },
      {
        id:           "trustedOnly",
        label:        "Trusted / Official uploads only",
        type:         "toggle",
        defaultValue: false,
      },
    ];
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async _getApiKey() {
    const stored = await cinder.secureStore.get("apiKey");
    if (!stored) throw new Error("TorBox API key not set. Go to Settings → Nyaa.si (TorBox) to add it.");
    return stored;
  }

  _buildNyaaUrl(query, page = 1) {
    const category    = cinder.store.get("category")    || "3_1";
    const trustedOnly = cinder.store.get("trustedOnly") || false;
    const filter      = trustedOnly ? "2" : "0"; // 0=no filter, 2=trusted only

    const params = new URLSearchParams({
      page: "rss",
      q:    query,
      c:    category,
      f:    filter,
      p:    String(page),
    });

    return `https://nyaa.si/?${params.toString()}`;
  }

  _parseRSS(xml) {
    const doc   = cinder.parseXML(xml);
    const items = doc.querySelectorAll("item");
    const results = [];

    items.forEach((item) => {
      const title    = item.querySelector("title")?.textContent?.trim()        || "";
      const link     = item.querySelector("link")?.textContent?.trim()         || ""; // nyaa page URL
      const magnet   = item.querySelector("magnet")?.textContent?.trim()
                    || item.querySelector("torrent > link")?.textContent?.trim()
                    || "";
      const infoHash = item.querySelector("infoHash")?.textContent?.trim()     || "";
      const seeders  = item.querySelector("seeders")?.textContent?.trim()      || "0";
      const sizeRaw  = item.querySelector("size")?.textContent?.trim()         || "";
      const pubDate  = item.querySelector("pubDate")?.textContent?.trim()      || "";

      // Prefer the magnet tag; fall back to constructing one from the infoHash
      let magnetLink = magnet;
      if (!magnetLink && infoHash) {
        magnetLink = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}`
          + "&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce"
          + "&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce"
          + "&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce";
      }

      if (!magnetLink) return; // skip entries we can't do anything with

      results.push({
        id:       infoHash || link,
        title,
        url:      magnetLink,  // handed to TorBox via Cinder's debrid layer
        seeders:  parseInt(seeders, 10) || 0,
        size:     sizeRaw,
        date:     pubDate,
        source:   "Nyaa.si",
        // store the nyaa page link as metadata for the resolve step
        _pageUrl: link,
      });
    });

    return results;
  }

  // ── Core: search used by the "Search Downloads" flow ────────────────────────
  //
  // Cinder calls this with the book title (and optionally author).
  // We search Nyaa's RSS, parse it, and return download result objects.
  // Because type=debrid, Cinder will pass the magnet URL to TorBox automatically
  // when the user taps a result — no extra work needed for the debrid hand-off.
  //
  // The `resolve()` method below is called only if the user needs a direct URL
  // (e.g. for a non-debrid fallback). In practice, with TorBox configured in
  // Cinder, the debrid layer intercepts the magnet before resolve() is reached.

  async search(query, page = 1) {
    const url = this._buildNyaaUrl(query, page);
    cinder.log(`[nyaa-torbox] Searching: ${url}`);

    const res = await cinder.fetch(url, {
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
      timeout: 20000,
    });

    if (!res || !res.data) throw new Error("No response from Nyaa.si");

    const results = this._parseRSS(res.data);
    cinder.log(`[nyaa-torbox] Got ${results.length} results`);
    return results;
  }

  // ── Resolve: called when user taps a result and no debrid is configured ─────
  //
  // If the user has TorBox set up in Cinder (Settings → Debrid Service), Cinder
  // handles magnet → download link automatically and never calls resolve().
  // This fallback manually calls the TorBox API using the stored API key from
  // this extension's settings, useful if someone wants explicit control.

  async resolve(item) {
    const apiKey = await this._getApiKey();
    const magnet = item.url;

    cinder.log(`[nyaa-torbox] Resolving via TorBox: ${item.title}`);

    // Step 1: Add the magnet to TorBox as a WebDL request
    const addRes = await cinder.fetch("https://api.torbox.app/v1/api/torrents/createtorrent", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        magnet,
        name:       item.title,
        seed:       1,
        allow_zip:  false,
      }),
      timeout: 30000,
    });

    const addData = JSON.parse(addRes.data);
    if (!addData.success) {
      throw new Error(`TorBox add failed: ${addData.detail || "Unknown error"}`);
    }

    const torrentId = addData.data?.torrent_id;
    if (!torrentId) throw new Error("TorBox did not return a torrent ID");

    // Step 2: Request a download link for the torrent
    // TorBox may need a moment to cache; retry a few times
    let downloadUrl = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 3000));
      }

      const linkRes = await cinder.fetch(
        `https://api.torbox.app/v1/api/torrents/requestdl?token=${apiKey}&torrent_id=${torrentId}&file_id=0&zip_link=false`,
        { timeout: 30000 }
      );

      const linkData = JSON.parse(linkRes.data);
      if (linkData.success && linkData.data) {
        downloadUrl = linkData.data;
        break;
      }

      cinder.log(`[nyaa-torbox] Not ready yet (attempt ${attempt + 1}/5): ${linkData.detail}`);
    }

    if (!downloadUrl) {
      throw new Error(
        "TorBox is still caching this torrent. Wait a moment and try again, or check your TorBox dashboard."
      );
    }

    cinder.log(`[nyaa-torbox] Resolved: ${downloadUrl}`);
    return { url: downloadUrl };
  }
}

__cinderExport = new NyaaTorBoxSource();
