# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run build` — compress gifs + render `dist/`
- `npm run watch` — rebuild on changes to `g/` or `src/`

No tests, linter, or CI beyond Netlify's deploy.

## Architecture

Personal gif collection, built by a single `build.js` script and deployed to Netlify. Also a PWA (manifest + service worker).

Content flow:
- Raw `.gif` files live in `/g/` at repo root. Dropping a new gif in `/g/` is the entire "add a gif" workflow — no index, no registry.
- `build.js` globs `./g/*.gif`, runs each through `gifsicle` (`-O3 --lossy=80`) into `dist/g/`, and also generates a static 96x96-fit first-frame thumbnail into `dist/t/` (`gifsicle -O3 --lossy=80 --resize-fit 96x96 '#0'`). Then renders `dist/index.html` + `dist/gifs.json` from inline template literals and copies `src/manifest.json`, `src/sw.js`, and the icons to `dist/`.
- `dist/gifs.json` is the public JSON feed consumed by the companion [Alfred workflow](https://github.com/starzonmyarmz/gifz-alfred-workflow). Shape is `[{keywords, url, thumb}, ...]` — keep it stable.
- Filename slug = display text. Hyphens become spaces for `keywords` / `alt`. Name files kebab-case (e.g. `andy-hits-computer.gif`).
- Compression is incremental: gifs whose source mtime is older than the output are skipped. First build takes ~40s on 59 gifs; subsequent builds are near-instant unless something changed.

`gifsicle` binary ships via the `gifsicle` npm package (postinstall downloads a prebuilt binary per platform). `build.js` has a guard that re-runs the install script if the binary is missing — this matters locally if `ignore-scripts=true` is set in npm config.

Netlify: build command `npm run build`, publish dir `dist`. Node version pinned via `.nvmrc` (22).
