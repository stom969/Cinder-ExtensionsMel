const https = require('https');
const fs = require('fs');
const path = require('path');

const GOCOMICS_URL = 'https://www.gocomics.com/comics/a-to-z';
const OUTPUT_FILE = path.join(process.env.GITHUB_WORKSPACE, 'comics.json');

/**
 * Fetches the GoComics page and extracts the comic list.
 */
async function fetchComicList() {
  return new Promise((resolve, reject) => {
    https.get(GOCOMICS_URL, {
      headers: {
        'User-Agent': 'CinderScript/1.0 (Comic List Updater)'
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch page: ${res.statusCode}`));
          return;
        }

        try {
          // Find the embedded JSON array
          const marker = '[{"name":"';
          const startIdx = data.indexOf(marker);
          
          if (startIdx === -1) {
            reject(new Error('Could not find comic data marker in page'));
            return;
          }

          // Find matching closing bracket
          let bracketCount = 0;
          let endIdx = startIdx;
          
          for (let i = startIdx; i < data.length; i++) {
            const char = data[i];
            if (char === '[') bracketCount++;
            if (char === ']') {
              bracketCount--;
              if (bracketCount === 0) {
                endIdx = i;
                break;
              }
            }
          }

          const jsonString = data.substring(startIdx, endIdx + 1);
          const comics = JSON.parse(jsonString);
          
          // Extract only the fields we need (name, slug, featureId)
          const simplifiedComics = comics.map(comic => ({
            name: comic.name,
            slug: comic.slug,
            featureId: comic.featureId
          }));

          resolve(simplifiedComics);
        } catch (e) {
          reject(new Error(`Failed to parse comic data: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('Fetching GoComics list...');
  
  try {
    const comics = await fetchComicList();
    console.log(`Found ${comics.length} comics`);
    
    // Write to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(comics, null, 2), 'utf8');
    console.log(`Updated ${OUTPUT_FILE}`);
    
    // Log some stats
    console.log('Sample comics:');
    comics.slice(0, 5).forEach(comic => {
      console.log(`  - ${comic.name} (${comic.slug})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
