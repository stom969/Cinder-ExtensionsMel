// TorBox Library — Cinder Download Source Extension
// Searches your TorBox library and filters to ebook formats only.
// Checks both the torrent name AND its file list so folder-based
// torrents (movies, TV) are correctly excluded.

var EBOOK_EXTENSIONS = [".epub", ".pdf", ".mobi", ".azw", ".azw3", ".cbz", ".cbr"];

function hasEbookExtension(name) {
    if (!name) return false;
    var lower = String(name).toLowerCase();
    for (var i = 0; i < EBOOK_EXTENSIONS.length; i++) {
        if (lower.endsWith(EBOOK_EXTENSIONS[i])) return true;
    }
    return false;
}

function torrentIsEbook(item) {
    // Check top-level name first (single-file torrents)
    if (hasEbookExtension(item.name)) return true;

    // Check files array (multi-file / folder torrents)
    var files = item.files;
    if (Array.isArray(files)) {
        for (var i = 0; i < files.length; i++) {
            var fileName = (files[i] && (files[i].name || files[i].short_name || files[i].path)) || "";
            if (hasEbookExtension(fileName)) return true;
        }
    }

    return false;
}

__cinderExport = {
    id: "torbox-library",
    name: "TorBox Library",
    version: "1.2.0",
    icon: "cloud-download-outline",
    description: "Search your TorBox downloads — ebooks only (epub, pdf, mobi, cbz)",
    contentType: "books",

    capabilities: {
        search: false,
        discover: false,
        download: true,
        resolve: true,
        searchDownloads: true,
        manga: false,
    },

    getSettings: function () {
        return [
            {
                id: "apiKey",
                label: "TorBox API Key",
                type: "text",
                placeholder: "Paste your TorBox API key",
                secure: true,
            },
        ];
    },

    search: async function (query) {
        var apiKey = cinder.secureStore.get("apiKey");
        if (!apiKey) throw new Error("TorBox API key not set — go to Settings → TorBox Library");

        var res = await cinder.fetch(
            "https://api.torbox.app/v1/api/torrents/mylist?bypass_cache=true",
            {
                headers: { Authorization: "Bearer " + apiKey },
                timeout: 15000,
            }
        );

        var data = JSON.parse(res.data);
        if (!data.success) throw new Error("TorBox error: " + (data.detail || "unknown"));

        var all = data.data || [];
        var q = query ? query.toLowerCase() : "";
        var results = [];

        for (var i = 0; i < all.length; i++) {
            var item = all[i];

            // Skip anything that isn't an ebook format
            if (!torrentIsEbook(item)) continue;

            // Filter by query if provided
            var name = item.name || "";
            if (q && name.toLowerCase().indexOf(q) === -1) continue;

            results.push({
                id:     String(item.id),
                title:  name,
                url:    String(item.id),
                size:   item.size,
                date:   item.created_at,
                source: "TorBox",
            });
        }

        cinder.log("[torbox-library] " + results.length + " ebook results for: " + query);
        return results;
    },

    resolve: async function (item) {
        var apiKey = cinder.secureStore.get("apiKey");
        if (!apiKey) throw new Error("TorBox API key not set");

        var res = await cinder.fetch(
            "https://api.torbox.app/v1/api/torrents/requestdl"
                + "?token=" + encodeURIComponent(apiKey)
                + "&torrent_id=" + item.url
                + "&file_id=0"
                + "&zip_link=false",
            { timeout: 30000 }
        );

        var data = JSON.parse(res.data);
        if (!data.success || !data.data) {
            throw new Error("TorBox resolve failed: " + (data.detail || "unknown"));
        }

        return { url: data.data };
    },
};
