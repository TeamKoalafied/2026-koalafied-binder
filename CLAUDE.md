# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, dependency-free technical binder site for FRC team 6996 Koalafied. No build step, no package manager, no tests, no linter. Deployed via GitHub Pages from `main` / root (custom domain in `CNAME`). `README.md` is the authoritative content-editing guide for the team; read it before changing the content schema.

## Running locally

The site works by opening `index.html` directly (`file://`), which is a hard requirement — see below. For previewing, `.claude/launch.json` defines a `binder` config (`python3 -m http.server 4996`); use `preview_start` with name `binder`. The print version is at `/print.html`.

`scripts/remove-bg.py input.png [output.webp]` strips flat white backgrounds from CAD screenshots (needs Pillow + numpy).

`scripts/make-og.sh` regenerates `assets/img/og-cover.png` (the link-preview card) by screenshotting `scripts/og-card.html` in headless Chrome at 1200×630. That card reads `content.js`, so it follows the robot name, tagline, accent and hero render automatically — re-run the script and commit the PNG after changing any of them. Keep the output PNG/JPEG, never WebP: some link previewers won't load WebP.

## Architecture

- **`content.js`** holds all content as `window.BINDER_CONTENT = {...}`: `team`, `hero` (image + callouts), `categories`, `sponsors`, `sections`. It's a script, not a `.json` fetched at runtime, so the site works without a server. Never switch to `fetch()`/ES modules for this reason.
- **Two independent renderers read the same content object:**
  - `assets/js/binder.js` → `index.html` (interactive web page)
  - `assets/js/print.js` → `print.html` (A4 sheets, uses `binder.css` + `print.css`)
  
  Both are plain ES5 IIFEs that build HTML strings (`esc()` escapes, then `fmt()` allows `**bold**` and `` `code` ``). The HTML files are near-empty shells.
- **Media block types** are dispatched by `b.type` in `mediaBlock()` (binder.js) and `flatten()` (print.js). README documents `highlight`, `carousel`, `iterations`, `compare`; the renderers also support `image` and `figures`. Adding or changing a block type means updating **both** renderers — print.js flattens every interactive block into static figures.
- **binder.js flow:** `boot()` numbers sections by array order → `renderNav` / `renderHero` / `renderSection` → `wire*` functions attach behavior (`wireCompare`, `wireHighlights`, `wireIterations`, `wireCarousels`, `wireLightbox`, `wireScrollSpy`). Interactive blocks register their config in the `BLOCKS` map keyed by a data attribute so wiring code can look them up.
- **Section layout:** the first media block renders beside the feature list; the rest go full width below (`renderSection`).
- **Hero:** callout `x`/`y` are percentages over the hero image; `layoutHero()` redraws SVG leader lines from DOM positions on load/resize. Callout `id` must match a section `id`. Optional `hl` images crossfade on hover/focus.
- **Sections** with `print: false` are excluded from print.html.
- **Head metadata is hand-kept, and deliberately duplicated.** Title, description, Open Graph tags and the `schema.org` JSON-LD block live literally in `index.html` and `print.html`, *not* in `content.js`, because search and preview crawlers read the files without running scripts. Same reason for the `<noscript>` block in each `<body>`, which mirrors the section list by hand. Renaming the robot or rolling the season means editing all of these — `README.md` has the checklist. `print.html` is `noindex` with its canonical pointed at `/`, since it is the same words as the web version.
- **Absolute URLs** in the meta tags and JSON-LD are hardcoded to `https://2026.teamkoalafied.com/` (matching `CNAME`) — crawlers can't resolve a relative `og:image`. A domain change touches `CNAME`, both HTML heads, `robots.txt` and `sitemap.xml`.
- **Theming:** design tokens are CSS custom properties in `:root` of `assets/css/binder.css`; `--accent` is overridden at runtime from `team.accent`. Honor the existing `prefers-reduced-motion` handling when adding transitions.

## Image conventions

Images live in `assets/img/` (~1400–1600px wide). All views within one `highlight` or `iterations` set must share identical pixel dimensions — they are same-camera CAD renders crossfaded on top of each other, not overlays.
