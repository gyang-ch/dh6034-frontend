import { createReadStream, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const PHOTO_ROOT = path.resolve(import.meta.dirname, '../Data Pre-computing/Photographs')

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png',  '.gif': 'image/gif',
  '.webp': 'image/webp', '.bmp': 'image/bmp',
  '.heic': 'image/heic', '.heif': 'image/heif',
  '.tif': 'image/tiff',  '.tiff': 'image/tiff',
}

const PHOTOGRAPH_ROUTE = '/media/photographs'

function servePhotographs(req, res, next) {
  const raw = decodeURIComponent(req.url ?? '').replace(/^\//, '')
  if (!raw) return next()
  const safe = path.normalize(raw).replace(/^(\.\.(\/|\\|$))+/, '')
  const abs = path.resolve(PHOTO_ROOT, safe)
  if (!abs.startsWith(PHOTO_ROOT + path.sep) && abs !== PHOTO_ROOT) return next()
  let stats
  try { stats = statSync(abs) } catch { return next() }
  if (!stats.isFile()) return next()
  const ext = path.extname(abs).toLowerCase()
  res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
  res.setHeader('Content-Length', stats.size)
  res.setHeader('Cache-Control', 'public, max-age=3600')
  createReadStream(abs).pipe(res)
}

/** Vite plugin: serve the external photograph archive without relying on public/media/assignment2 */
function photographsPlugin() {
  let outDir = null

  return {
    name: 'photographs-serve',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      server.middlewares.use(PHOTOGRAPH_ROUTE, servePhotographs)
    },
    configurePreviewServer(server) {
      server.middlewares.use(PHOTOGRAPH_ROUTE, servePhotographs)
    },
    closeBundle() {
      if (!outDir) return
      rmSync(path.join(outDir, 'media', 'assignment2'), { recursive: true, force: true })
    },
  }
}

export default defineConfig({
  plugins: [tailwindcss(), react(), photographsPlugin()],
})
