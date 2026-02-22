// Run this locally to generate assets.json for Vercel deployment
const fs = require('fs');
const path = require('path');

// Local paths for scanning
const TAKETWOAPP_PUBLIC = '/Users/raghavkatta/VSCODE/taketwoapp/public';
const LANDING_PUBLIC = path.join(__dirname, 'public', 'landing');

// Production URLs - assets served from live sites
const TAKETWOAPP_URL = 'https://trytaketwo.app';

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

// Generate assets
console.log('Scanning directories...');

// TakeTwo App assets → served from trytaketwo.app
const taketwoappAssets = getMediaFiles(TAKETWOAPP_PUBLIC, TAKETWOAPP_PUBLIC, TAKETWOAPP_URL, 'taketwoapp');

// Landing assets → served from this repo (/landing/)
const landingAssets = getMediaFiles(LANDING_PUBLIC, LANDING_PUBLIC, '/landing', 'landing');

const allAssets = [...taketwoappAssets, ...landingAssets];

const data = {
  total: allAssets.length,
  bySource: {
    taketwoapp: taketwoappAssets.length,
    landing: landingAssets.length
  },
  assets: allAssets
};

fs.writeFileSync(path.join(__dirname, 'public', 'assets.json'), JSON.stringify(data, null, 2));

console.log(`✅ Generated assets.json with ${allAssets.length} assets`);
console.log(`   - TakeTwo App (${TAKETWOAPP_URL}): ${taketwoappAssets.length}`);
console.log(`   - Landing (local): ${landingAssets.length}`);
