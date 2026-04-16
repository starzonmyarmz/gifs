const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const gifsicle = path.join(__dirname, 'node_modules', 'gifsicle', 'vendor', 'gifsicle')

if (!fs.existsSync(gifsicle)) {
  console.log('fetching gifsicle binary...')
  const installScript = path.join(__dirname, 'node_modules', 'gifsicle', 'lib', 'install.js')
  const r = spawnSync(process.execPath, [installScript], { stdio: 'inherit' })
  if (r.status !== 0 || !fs.existsSync(gifsicle)) {
    throw new Error('gifsicle install failed')
  }
}

const ROOT = __dirname
const SRC_GIFS = path.join(ROOT, 'g')
const SRC_ASSETS = path.join(ROOT, 'src')
const DIST = path.join(ROOT, 'dist')
const DIST_GIFS = path.join(DIST, 'g')
const DIST_THUMBS = path.join(DIST, 't')

const PASSTHROUGH = ['manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png']

const titlize = (name) => name.replace(/-/g, ' ')

const listGifs = () =>
  fs.readdirSync(SRC_GIFS)
    .filter((f) => f.endsWith('.gif'))
    .sort()

const isFresh = (src, dest) => {
  if (!fs.existsSync(dest)) return false
  return fs.statSync(src).mtimeMs <= fs.statSync(dest).mtimeMs
}

const compressGif = (file) => {
  const src = path.join(SRC_GIFS, file)
  const dest = path.join(DIST_GIFS, file)
  if (isFresh(src, dest)) return false
  const result = spawnSync(gifsicle, ['-O3', '--lossy=80', '-o', dest, src], { stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`gifsicle failed on ${file}`)
  return true
}

const buildThumb = (file) => {
  const src = path.join(SRC_GIFS, file)
  const dest = path.join(DIST_THUMBS, file)
  if (isFresh(src, dest)) return false
  const resize = spawnSync(gifsicle, ['--resize-fit', '96x96', '--colors', '255', src, '#0'])
  if (resize.status !== 0) throw new Error(`gifsicle resize failed on ${file}`)
  const w = resize.stdout.readUInt16LE(6)
  const h = resize.stdout.readUInt16LE(8)
  const x = Math.floor((96 - w) / 2)
  const y = Math.floor((96 - h) / 2)
  const pad = spawnSync(
    gifsicle,
    ['-O3', '--lossy=80', '--logical-screen', '96x96', '--position', `${x},${y}`, '--transparent=255', '--background=255', '-o', dest],
    { input: resize.stdout }
  )
  if (pad.status !== 0) throw new Error(`gifsicle thumb failed on ${file}`)
  return true
}

const renderIndex = (names) => {
  const imgs = names
    .map((n) => `  <img src="g/${n}.gif" alt="${titlize(n)}" loading="lazy">`)
    .join('\n')
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Gifz</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#eb1e8a">
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/icon-192.png">
    <style>
      * { box-sizing: border-box; }
      body {
        display: grid;
        display: grid-lanes;
        font-family: helvetica, arial, sans-serif;
        gap: 8px;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        margin: 0.5rem;
      }
      img { display: block; object-fit: contain; max-width: 100%; }
      img:hover { cursor: pointer; }
      .animate {
        animation: fade 2s 2s forwards;
        background: #fff;
        border-radius: 100px;
        box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.35);
        bottom: 2rem;
        color: #222;
        left: 2rem;
        opacity: 1;
        padding: 1rem;
        pointer-events: none;
        position: fixed;
        right: 2rem;
        text-align: center;
      }
      @keyframes fade { to { opacity: 0; } }
    </style>
  </head>
  <body>
${imgs}

    <div id="toast"></div>

    <script>
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
      }

      document.addEventListener('click', ({target}) => {
        if (!target.closest('img')) return
        const toast = document.getElementById('toast')
        navigator.clipboard.writeText(target.src).then(
          () => { toast.innerText = '🎉 Copied gif url!' },
          () => { toast.innerText = '🥺 Something went wrong.' }
        )
        toast.classList.remove('animate')
        void toast.offsetWidth
        toast.classList.add('animate')
      })
    </script>
  </body>
</html>
`
}

const renderFeed = (names) =>
  JSON.stringify(
    names.map((n) => ({ keywords: titlize(n), url: `g/${n}.gif`, thumb: `t/${n}.gif` })),
    null,
    2
  ) + '\n'

const build = () => {
  fs.mkdirSync(DIST_GIFS, { recursive: true })
  fs.mkdirSync(DIST_THUMBS, { recursive: true })

  const files = listGifs()
  let compressed = 0
  let thumbed = 0
  for (const file of files) {
    if (compressGif(file)) compressed++
    if (buildThumb(file)) thumbed++
  }

  const names = files.map((f) => path.parse(f).name)
  fs.writeFileSync(path.join(DIST, 'index.html'), renderIndex(names))
  fs.writeFileSync(path.join(DIST, 'gifs.json'), renderFeed(names))

  for (const asset of PASSTHROUGH) {
    fs.copyFileSync(path.join(SRC_ASSETS, asset), path.join(DIST, asset))
  }

  console.log(`built ${files.length} gifs (${compressed} re-compressed, ${thumbed} thumbs)`)
}

const watch = () => {
  build()
  console.log('watching g/ and src/ ...')
  const schedule = (() => {
    let pending = null
    return () => {
      if (pending) return
      pending = setTimeout(() => {
        pending = null
        try { build() } catch (e) { console.error(e.message) }
      }, 100)
    }
  })()
  fs.watch(SRC_GIFS, schedule)
  fs.watch(SRC_ASSETS, { recursive: true }, schedule)
}

if (process.argv.includes('--watch')) watch()
else build()
