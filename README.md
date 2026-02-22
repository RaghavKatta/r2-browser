# R2 Asset Browser

A simple local asset browser for viewing and managing media files from multiple project directories.

## Features

- Browse all images, videos, and audio files from multiple source directories
- Filter by type (images/videos/audio) or source
- Search by filename
- Click to view fullscreen
- Copy URLs
- Download files
- Network accessible

## Setup

```bash
npm install
npm start
```

Open http://localhost:3333

## Configuration

Edit `server.js` to change the source directories:

```js
const TAKETWOAPP_PUBLIC = '/path/to/your/public';
const LANDING_PUBLIC = '/path/to/another/public';
```

## Network Access

The server listens on `0.0.0.0:3333` so you can access it from other devices on your network.
