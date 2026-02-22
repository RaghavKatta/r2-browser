const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Paths to scan
const TAKETWOAPP_PUBLIC = '/Users/raghavkatta/VSCODE/taketwoapp/public';
const LANDING_PUBLIC = '/Users/raghavkatta/VSCODE/taketwolanding/public';
const R2_PUBLIC_URL = 'https://pub-9b8c0c9e6b914994b596b2109f00f0e7.r2.dev';

// Serve static files from both public folders
app.use('/taketwoapp', express.static(TAKETWOAPP_PUBLIC));
app.use('/landing', express.static(LANDING_PUBLIC));
app.use(express.static('public'));

// Get all media files from a directory recursively
function getMediaFiles(dir, baseDir, urlPrefix) {
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
              lastModified: stat.mtime,
              url: `${urlPrefix}/${relativePath}`,
              type: getFileType(ext),
              source: urlPrefix.includes('landing') ? 'landing' : 'taketwoapp'
            });
          }
        }
      }
    } catch (err) {
      console.error(`Error scanning ${currentDir}:`, err.message);
    }
  }

  scan(dir);
  return results;
}

function getFileType(ext) {
  if (['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext)) return 'video';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'].includes(ext)) return 'image';
  if (['.mp3', '.wav', '.ogg', '.aac', '.m4a'].includes(ext)) return 'audio';
  return 'other';
}

// API to list all assets
app.get('/api/assets', (req, res) => {
  const taketwoappAssets = getMediaFiles(TAKETWOAPP_PUBLIC, TAKETWOAPP_PUBLIC, '/taketwoapp');
  const landingAssets = getMediaFiles(LANDING_PUBLIC, LANDING_PUBLIC, '/landing');

  // Also add known R2 CDN video paths (these are served from CDN in production)
  const r2Videos = [];
  const videoDirs = ['videos', 'landingv1/gallery/videos', 'landingv1/video'];

  for (const videoDir of videoDirs) {
    const fullPath = path.join(TAKETWOAPP_PUBLIC, videoDir);
    if (fs.existsSync(fullPath)) {
      const files = getMediaFiles(fullPath, TAKETWOAPP_PUBLIC, R2_PUBLIC_URL);
      files.forEach(f => {
        f.source = 'r2-cdn';
        f.localUrl = `/taketwoapp/${f.key}`;
      });
      r2Videos.push(...files);
    }
  }

  const allAssets = [...taketwoappAssets, ...landingAssets];

  // Group by source and folder
  const grouped = {
    taketwoapp: {},
    landing: {},
    'r2-cdn': {}
  };

  allAssets.forEach(asset => {
    const folder = path.dirname(asset.key) || 'root';
    if (!grouped[asset.source][folder]) {
      grouped[asset.source][folder] = [];
    }
    grouped[asset.source][folder].push(asset);
  });

  res.json({
    total: allAssets.length,
    bySource: {
      taketwoapp: taketwoappAssets.length,
      landing: landingAssets.length
    },
    grouped,
    assets: allAssets
  });
});

const PORT = 3333;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Asset Browser running at:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://192.168.1.15:${PORT}\n`);
  console.log(`📁 Serving taketwoapp/public: ${TAKETWOAPP_PUBLIC}`);
  console.log(`📁 Serving landing/public: ${LANDING_PUBLIC}\n`);
});
