__cinderExport = {
  id: "literotica-epub",
  name: "Literotica EPUB",
  version: "1.2.0",
  icon: "📖",
  description: "Read stories from Literotica.com as EPUB",
  contentType: "books",

  capabilities: {
    search: true,
    discover: false,
    download: true,
    resolve: true,
    manga: false,
  },

  BASE_URL: "https://www.literotica.com",
  SEARCH_URL: "https://search.literotica.com",

  async search(query, page = 0) {
    const url = `${this.SEARCH_URL}/?query=${encodeURIComponent(query)}`;
    const res = await cinder.fetch(url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) return [];

    const doc = cinder.parseHTML(res.data);
    const results = [];

    doc.querySelectorAll(".panel.ai_gJ").forEach((card) => {
      const titleEl = card.querySelector("h4");
      const linkEl = card.querySelector("a.ai_ii");
      const authorEl = card.querySelector("a.ai_il span.ai_im");

      if (!titleEl || !linkEl) return;

      const href = linkEl.attr("href");
      const title = titleEl.text().trim();
      const author = authorEl ? authorEl.text().trim() : "Unknown";

      results.push({
        id: href.replace(this.BASE_URL, ""),
        title: title,
        author: author,
        cover: "",
        url: `${this.BASE_URL}${href}`,
        format: "books",
      });
    });

    return results;
  },

  async resolve(item) {
    // Fetch the story page
    const res = await cinder.fetch(item.url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (res.status !== 200) throw new Error("Failed to load story");

    const doc = cinder.parseHTML(res.data);
    const title = doc.querySelector("h1")?.text()?.trim() || "Untitled";
    const author = doc.querySelector('a[href*="/authors/"]')?.text()?.trim() || "Unknown";

    // Try to find story content
    let contentHtml = "";
    const contentEl = doc.querySelector("[class*='introduction']");
    if (contentEl) {
      contentHtml = contentEl.html() || contentEl.text();
    } else {
      // Fallback: capture all paragraphs
      const paragraphs = doc.querySelectorAll("p");
      paragraphs.forEach(p => {
        contentHtml += "<p>" + p.text().trim() + "</p>";
      });
    }

    if (!contentHtml) throw new Error("No story content found");

    // Build a minimal EPUB
    const epub = this._buildEpub(title, author, contentHtml);

    // Convert to data URL (EPUB is a ZIP file, we'll return it as base64)
    const base64 = btoa(String.fromCharCode(...new Uint8Array(epub)));
    return { url: "data:application/epub+zip;base64," + base64 };
  },

  _buildEpub(title, author, bodyHtml) {
    // Minimal EPUB: just the bare essentials
    const mimetype = "application/epub+zip";
    const container = '<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>';
    const opf = `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${this._escapeXml(title)}</dc:title><dc:creator>${this._escapeXml(author)}</dc:creator><dc:language>en</dc:language><dc:identifier id="bookid">${Date.now()}</dc:identifier></metadata><manifest><item id="html" href="content.html" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="html"/></spine></package>`;
    const content = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${this._escapeXml(title)}</title></head><body>${bodyHtml}</body></html>`;

    // Simple ZIP-like structure using a minimal implementation
    // Since we can't use a ZIP library, we'll structure it as a basic binary
    // This is a very simplified EPUB that should work in many readers
    const files = {
      "mimetype": mimetype,
      "META-INF/container.xml": container,
      "content.opf": opf,
      "content.html": content
    };

    // Build a simple uncompressed EPUB (not standard but some readers accept it)
    // Better: use a proper ZIP using a simple implementation
    // We'll create a minimal valid ZIP with store method (no compression)
    const zipParts = [];
    let offset = 0;
    const fileEntries = [];

    // Write local file headers and file data
    for (const [name, data] of Object.entries(files)) {
      const nameBytes = this._strToBytes(name);
      const dataBytes = this._strToBytes(data);
      const header = this._createLocalFileHeader(nameBytes, dataBytes);
      zipParts.push(header);
      zipParts.push(dataBytes);
      fileEntries.push({
        nameBytes,
        dataBytes,
        offset,
        header
      });
      offset += header.length + dataBytes.length;
    }

    // Central directory
    const centralDir = [];
    let centralOffset = offset;
    for (const entry of fileEntries) {
      const cdHeader = this._createCentralDirectoryHeader(entry.nameBytes, entry.dataBytes, entry.offset);
      centralDir.push(cdHeader);
      offset += cdHeader.length;
    }
    const centralDirBytes = centralDir.flat();

    // End of central directory
    const eocd = this._createEOCD(fileEntries.length, centralDirBytes.length, centralOffset);

    // Combine everything
    const zipArray = new Uint8Array(
      zipParts.flat().length + centralDirBytes.length + eocd.length
    );
    let pos = 0;
    for (const part of zipParts) {
      zipArray.set(part, pos);
      pos += part.length;
    }
    zipArray.set(centralDirBytes, pos);
    pos += centralDirBytes.length;
    zipArray.set(eocd, pos);

    return zipArray;
  },

  _createLocalFileHeader(nameBytes, dataBytes) {
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); // signature
    view.setUint16(4, 20, true); // version needed
    view.setUint16(6, 0, true); // flags
    view.setUint16(8, 0, true); // compression method (store)
    view.setUint16(10, 0, true); // mod time
    view.setUint16(12, 0, true); // mod date
    view.setUint32(14, 0, true); // crc32 (we'll leave zero for simplicity)
    view.setUint32(18, dataBytes.length, true); // compressed size
    view.setUint32(22, dataBytes.length, true); // uncompressed size
    view.setUint16(26, nameBytes.length, true); // filename length
    view.setUint16(28, 0, true); // extra field length
    header.set(nameBytes, 30);
    return header;
  },

  _createCentralDirectoryHeader(nameBytes, dataBytes, localOffset) {
    const header = new Uint8Array(46 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x02014b50, true); // signature
    view.setUint16(4, 20, true); // version made by
    view.setUint16(6, 20, true); // version needed
    view.setUint16(8, 0, true); // flags
    view.setUint16(10, 0, true); // compression method
    view.setUint16(12, 0, true); // mod time
    view.setUint16(14, 0, true); // mod date
    view.setUint32(16, 0, true); // crc32
    view.setUint32(20, dataBytes.length, true); // compressed size
    view.setUint32(24, dataBytes.length, true); // uncompressed size
    view.setUint16(28, nameBytes.length, true); // filename length
    view.setUint16(30, 0, true); // extra field length
    view.setUint16(32, 0, true); // file comment length
    view.setUint16(34, 0, true); // disk number start
    view.setUint16(36, 0, true); // internal file attributes
    view.setUint32(38, 0, true); // external file attributes
    view.setUint32(42, localOffset, true); // relative offset of local header
    header.set(nameBytes, 46);
    return header;
  },

  _createEOCD(numEntries, cdSize, cdOffset) {
    const eocd = new Uint8Array(22);
    const view = new DataView(eocd.buffer);
    view.setUint32(0, 0x06054b50, true); // signature
    view.setUint16(4, 0, true); // disk number
    view.setUint16(6, 0, true); // disk where CD starts
    view.setUint16(8, numEntries, true); // entries on disk
    view.setUint16(10, numEntries, true); // total entries
    view.setUint32(12, cdSize, true); // size of central directory
    view.setUint32(16, cdOffset, true); // offset of central directory
    view.setUint16(20, 0, true); // comment length
    return eocd;
  },

  _strToBytes(str) {
    return new TextEncoder().encode(str);
  },

  _escapeXml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
};
