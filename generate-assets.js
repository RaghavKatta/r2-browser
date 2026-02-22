// Run this locally to generate assets.json for Vercel deployment
const fs = require('fs');
const path = require('path');

// For Vercel: only landing assets (bundled in repo)
// For local dev: server.js serves both taketwoapp and landing
const LANDING_PUBLIC = path.join(__dirname, 'public', 'landing');

function getFileType(ext) {
  if (['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext)) return 'video';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'].includes(ext)) return 'image';
  if (['.mp3', '.wav', '.ogg', '.aac', '.m4a'].includes(ext)) return 'audio';
  return 'other';
}

function getMediaFiles(dir, baseDir, urlPrefix, source) {
  const results = [];
  const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.mp4', '.webm', '.mov', '.mp3', '.wav', '.ogg'];

  function scan(currentDir) {
    try {
      const files = fs.readdirSync(currentDir);
      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          scan(filePath);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (validExtensions.includes(ext)) {
            const relativePath = path.relative(baseDir, filePath);
            results.push({
              key: relativePath,
              name: file,
              size: stat.size,
              url: `${urlPrefix}/${relativePath}`,
              type: getFileType(ext),
              source
            });
          }
        }
      }
    } catch (err) {
      console.error(`Error scanning ${currentDir}:`, err.message);
    }
  }

  if (fs.existsSync(dir)) {
    scan(dir);
  } else {
    console.warn(`Directory not found: ${dir}`);
  }

  return results;
}

// Generate assets (landing only for Vercel deployment)
console.log('Scanning directories...');

const landingAssets = getMediaFiles(LANDING_PUBLIC, LANDING_PUBLIC, '/landing', 'landing');

const data = {
  total: landingAssets.length,
  bySource: {
    taketwoapp: 0,
    landing: landingAssets.length
  },
  assets: landingAssets
};

fs.writeFileSync(path.join(__dirname, 'public', 'assets.json'), JSON.stringify(data, null, 2));

console.log(`✅ Generated assets.json with ${landingAssets.length} assets`);
console.log(`   - Landing: ${landingAssets.length}`);
console.log(`\nNote: TakeTwo App assets available on local server only (too large for GitHub)`);
