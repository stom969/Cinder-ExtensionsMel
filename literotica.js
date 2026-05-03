__cinderExport = {
  id: "literotica",
  name: "Literotica",
  version: "2.0.0",
  icon: "📖",
  description: "Read stories from Literotica.com (EPUB upload)",
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
    // 1. Fetch the story page
    const pageRes = await cinder.fetch(item.url, {
      headers: { "User-Agent": "CinderApp/1.0" }
    });
    if (pageRes.status !== 200) throw new Error("Failed to load story page");

    const doc = cinder.parseHTML(pageRes.data);
    const title = doc.querySelector("h1")?.text()?.trim() || "Untitled";
    const author = doc.querySelector('a[href*="/authors/"]')?.text()?.trim() || "Unknown";

    let contentHtml = "";
    const contentEl = doc.querySelector("[class*='introduction']");
    if (contentEl) {
      contentHtml = contentEl.html() || contentEl.text();
    } else {
      const paragraphs = doc.querySelectorAll("p");
      paragraphs.forEach(p => {
        contentHtml += "<p>" + p.text().trim() + "</p>";
      });
    }

    if (!contentHtml) throw new Error("No story content found");

    // 2. Build the EPUB file (raw bytes)
    const epubBytes = this._buildEpub(title, author, contentHtml);

    // 3. Upload to file.io to get a direct download URL
    const uploadUrl = "https://file.io";
    const boundary = "----CinderUpload" + Math.random().toString(36).substring(2);
    const body = this._multipartBody(boundary, "file", title.replace(/[^a-z0-9]/gi, "_") + ".epub", epubBytes, "application/epub+zip");

    const uploadRes = await cinder.fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data; boundary=" + boundary,
      },
      body: body,
    });

    if (uploadRes.status === 200) {
      const json = JSON.parse(uploadRes.data);
      if (json.link) {
        return { url: json.link };
      }
    }

    // 4. Fallback: if upload fails, try a data URL (may not work, but attempt)
    const base64 = btoa(String.fromCharCode(...new Uint8Array(epubBytes)));
    return { url: "data:application/epub+zip;base64," + base64 };
  },

  _multipartBody(boundary, fieldName, fileName, fileBytes, mimeType) {
    const encoder = new TextEncoder();
    const parts = [];

    parts.push(encoder.encode("--" + boundary + "\r\n"));
    parts.push(encoder.encode("Content-Disposition: form-data; name=\"" + fieldName + "\"; filename=\"" + fileName + "\"\r\n"));
    parts.push(encoder.encode("Content-Type: " + mimeType + "\r\n\r\n"));
    parts.push(fileBytes);
    parts.push(encoder.encode("\r\n--" + boundary + "--\r\n"));

    // Concatenate all parts into a single Uint8Array
    let totalLength = 0;
    for (const p of parts) totalLength += p.length;
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const p of parts) {
      result.set(p, offset);
      offset += p.length;
    }
    return result;
  },

  _buildEpub(title, author, bodyHtml) {
    const mimetype = "application/epub+zip";
    const container = '<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>';
    const opf = `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${this._escapeXml(title)}</dc:title><dc:creator>${this._escapeXml(author)}</dc:creator><dc:language>en</dc:language><dc:identifier id="bookid">${Date.now()}</dc:identifier></metadata><manifest><item id="html" href="content.html" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="html"/></spine></package>`;
    const content = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${this._escapeXml(title)}</title></head><body>${bodyHtml}</body></html>`;

    const files = {
      "mimetype": mimetype,
      "META-INF/container.xml": container,
      "content.opf": opf,
      "content.html": content
    };

    const zipParts = [];
    let offset = 0;
    const fileEntries = [];

    for (const [name, data] of Object.entries(files)) {
      const nameBytes = this._strToBytes(name);
      const dataBytes = this._strToBytes(data);
      const header = this._createLocalFileHeader(nameBytes, dataBytes);
      zipParts.push(header);
      zipParts.push(dataBytes);
      fileEntries.push({ nameBytes, dataBytes, offset, header });
      offset += header.length + dataBytes.length;
    }

    const centralDir = [];
    let centralOffset = offset;
    for (const entry of fileEntries) {
      const cdHeader = this._createCentralDirectoryHeader(entry.nameBytes, entry.dataBytes, entry.offset);
      centralDir.push(cdHeader);
      offset += cdHeader.length;
    }
    const centralDirBytes = new Uint8Array(centralDir.flat());

    const eocd = this._createEOCD(fileEntries.length, centralDirBytes.length, centralOffset);

    const totalSize = zipParts.flat().length + centralDirBytes.length + eocd.length;
    const zipArray = new Uint8Array(totalSize);
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
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, 0, true);
    view.setUint32(18, dataBytes.length, true);
    view.setUint32(22, dataBytes.length, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    header.set(nameBytes, 30);
    return header;
  },

  _createCentralDirectoryHeader(nameBytes, dataBytes, localOffset) {
    const header = new Uint8Array(46 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint16(14, 0, true);
    view.setUint32(16, 0, true);
    view.setUint32(20, dataBytes.length, true);
    view.setUint32(24, dataBytes.length, true);
    view.setUint16(28, nameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, localOffset, true);
    header.set(nameBytes, 46);
    return header;
  },

  _createEOCD(numEntries, cdSize, cdOffset) {
    const eocd = new Uint8Array(22);
    const view = new DataView(eocd.buffer);
    view.setUint32(0, 0x06054b50, true);
    view.setUint16(4, 0, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, numEntries, true);
    view.setUint16(10, numEntries, true);
    view.setUint32(12, cdSize, true);
    view.setUint32(16, cdOffset, true);
    view.setUint16(20, 0, true);
    return eocd;
  },

  _strToBytes(str) {
    return new TextEncoder().encode(str);
  },

  _escapeXml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
};
