// Nyaa.si (TorBox) — Cinder Download Source Extension
// Search Nyaa.si RSS and download via TorBox debrid.
//
// SETTINGS (configure in-app after install):
//   • TorBox API Key  — from https://torbox.app/settings
//   • Category        — Nyaa category filter
//   • Trusted Only    — show only trusted/official uploads

__cinderExport = {
  id:          "nyaa-torbox",
  name:        "Nyaa.si (TorBox)",
  version:     "1.0.0",
  icon:        "magnet-outline",
  description: "Search Nyaa.si and download via TorBox debrid",
  contentType: "books",

  capabilities: {
    search:          false,
    discover:        false,
    download:        true,
    resolve:         true,
    searchDownloads: true,
    manga:           false,
  },

  getSettings: function () {
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
  },

  _buildNyaaUrl: function (query, page) {
    var category    = cinder.store.get("category")    || "3_1";
    var trustedOnly = cinder.store.get("trustedOnly") || false;
    var filter      = trustedOnly ? "2" : "0";
    var p           = page || 1;

    return "https://nyaa.si/?page=rss"
      + "&q="  + encodeURIComponent(query)
      + "&c="  + encodeURIComponent(category)
      + "&f="  + filter
      + "&p="  + p;
  },

  _parseRSS: function (xml) {
    var doc     = cinder.parseXML(xml);
    var items   = doc.querySelectorAll("item");
    var results = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];

      var title    = (item.querySelector("title")    || {}).textContent || "";
      var link     = (item.querySelector("link")     || {}).textContent || "";
      var magnet   = (item.querySelector("magnet")   || {}).textContent || "";
      var infoHash = (item.querySelector("infoHash") || {}).textContent || "";
      var seeders  = (item.querySelector("seeders")  || {}).textContent || "0";
      var sizeRaw  = (item.querySelector("size")     || {}).textContent || "";
      var pubDate  = (item.querySelector("pubDate")  || {}).textContent || "";

      title    = title.trim();
      link     = link.trim();
      magnet   = magnet.trim();
      infoHash = infoHash.trim();
      seeders  = seeders.trim();
      sizeRaw  = sizeRaw.trim();
      pubDate  = pubDate.trim();

      var magnetLink = magnet;
      if (!magnetLink && infoHash) {
        magnetLink = "magnet:?xt=urn:btih:" + infoHash
          + "&dn=" + encodeURIComponent(title)
          + "&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce"
          + "&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce";
      }

      if (!magnetLink) continue;

      results.push({
        id:       infoHash || link,
        title:    title,
        url:      magnetLink,
        seeders:  parseInt(seeders, 10) || 0,
        size:     sizeRaw,
        date:     pubDate,
        source:   "Nyaa.si",
        _pageUrl: link,
      });
    }

    return results;
  },

  search: function (query, page) {
    var self = this;
    var url  = self._buildNyaaUrl(query, page);
    cinder.log("[nyaa-torbox] Searching: " + url);

    return cinder.fetch(url, {
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
      timeout: 20000,
    }).then(function (res) {
      if (!res || !res.data) throw new Error("No response from Nyaa.si");
      var results = self._parseRSS(res.data);
      cinder.log("[nyaa-torbox] Got " + results.length + " results");
      return results;
    });
  },

  resolve: function (item) {
    var magnet = item.url;
    var title  = item.title;

    var apiKey = cinder.secureStore.get("apiKey");
    if (!apiKey) {
      throw new Error("TorBox API key not set. Go to Settings → Nyaa.si (TorBox) to add it.");
    }

    cinder.log("[nyaa-torbox] Adding to TorBox: " + title);

    return cinder.fetch("https://api.torbox.app/v1/api/torrents/createtorrent", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        magnet:    magnet,
        name:      title,
        seed:      1,
        allow_zip: false,
      }),
      timeout: 30000,
    }).then(function (addRes) {
      var addData = JSON.parse(addRes.data);
      if (!addData.success) {
        throw new Error("TorBox add failed: " + (addData.detail || "Unknown error"));
      }

      var torrentId = addData.data && addData.data.torrent_id;
      if (!torrentId) throw new Error("TorBox did not return a torrent ID");

      var attempts   = 0;
      var maxRetries = 5;
      var delay      = 3000;

      function tryGetLink() {
        return cinder.fetch(
          "https://api.torbox.app/v1/api/torrents/requestdl"
            + "?token="     + encodeURIComponent(apiKey)
            + "&torrent_id=" + torrentId
            + "&file_id=0"
            + "&zip_link=false",
          { timeout: 30000 }
        ).then(function (linkRes) {
          var linkData = JSON.parse(linkRes.data);
          if (linkData.success && linkData.data) {
            return { url: linkData.data };
          }

          attempts++;
          if (attempts >= maxRetries) {
            throw new Error(
              "TorBox is still caching this torrent. Wait a moment and try again."
            );
          }

          cinder.log("[nyaa-torbox] Not ready yet, retrying (" + attempts + "/" + maxRetries + ")");
          return new Promise(function (resolve) {
            setTimeout(resolve, delay);
          }).then(tryGetLink);
        });
      }

      return tryGetLink();
    });
  },
};
