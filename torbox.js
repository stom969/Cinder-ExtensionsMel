var TorBoxSource = {};

TorBoxSource.id = "torbox-my-library";
TorBoxSource.name = "TorBox - My Library";
TorBoxSource.version = "1.0.0";
TorBoxSource.icon = "cloud-upload-outline";
TorBoxSource.description = "Search and download files from your personal TorBox library.";
TorBoxSource.contentType = "books";
TorBoxSource.capabilities = {
    search: true,
    discover: false,
    download: false,
    resolve: true,      // This extension 'resolves' items to a download URL
};

TorBoxSource.search = async function (query, page) {
    try {
        // 1. Get your API key from the app's secure storage
        const apiKey = await __cinder.getSecureValue("torbox_api_key");
        if (!apiKey) {
            throw new Error("TorBox API key not configured. Please add it in the extension settings.");
        }

        // 2. Call the TorBox API with the correct header
        const response = await fetch("https://api.torbox.app/v1/api/torrents/mylist", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`TorBox API Error: ${response.status}`);
        }

        const data = await response.json();
        let torrents = data.data || [];

        // 3. Filter results based on the search query
        if (query && query.trim() !== "") {
            const lowerQuery = query.toLowerCase();
            torrents = torrents.filter(torrent => 
                torrent.name && torrent.name.toLowerCase().includes(lowerQuery)
            );
        }

        // 4. Format the results for Cinder
        return torrents.map(torrent => ({
            id: torrent.id.toString(),
            title: torrent.name || "Untitled",
            // Ensure the download URL is absolute
            url: torrent.download_url || "",
            size: torrent.size || 0,
            seeders: torrent.seeders || 0,
            // This field tells Cinder to use resolve() to get the final download
            resolve: true
        }));

    } catch (error) {
        console.error("TorBox search error:", error);
        return [];
    }
};

TorBoxSource.resolve = async function (item) {
    // This function is called when a user selects an item.
    // It returns the direct download URL.
    return { url: item.url };
};

// Expose the source to Cinder
__cinderExport = TorBoxSource;
