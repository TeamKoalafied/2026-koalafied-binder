# Getting started

How to run this site, change it, and put it live. If you just want to know
what to type into `content.js`, skip to [README.md](README.md) — that's the
content guide. This page is the surrounding stuff.

---

## What you're working on

Two pages, built from the same content:

| Page | What it is |
|---|---|
| `index.html` | the interactive binder — the thing people visit |
| `print.html` | the same writing as A4 sheets, with a Print / Save as PDF button |

Both read **`content.js`**. Write a section once and it shows up in both.

There is **no build step, no `npm install`, no tests, no linter.** You edit a
file, you save it, you refresh the browser. That's the whole workflow.

---

## Run it

### The fast way: just open it

Double-click `index.html`. That's it — it opens in your browser and works.

This isn't a fallback, it's a deliberate design goal: the site never uses
`fetch()` so it runs straight off your hard drive with no server at all.

### The proper way: the preview server on port 6996

From the project folder:

```bash
python3 -m http.server 6996
```

Then open **<http://localhost:6996>** (and `/print.html` for the paper
version). Stop it with `Ctrl-C`.

Both ways show the identical site, so use whichever you like. Reach for the
server when you want to:

- **Check it on your phone.** Get your laptop's address with
  `ipconfig getifaddr en0`, then on your phone (same Wi-Fi) visit
  `http://THAT-ADDRESS:6996`. Worth doing — the nav and the contents menu
  behave differently on a narrow screen.
- Check `robots.txt` / `sitemap.xml`, which only make sense over `http://`.
- Have a URL you can paste to someone on the same network.

> In Claude Code the same server is preconfigured — start the `binder`
> launch config instead of typing the command.

### The edit loop

1. Open `content.js` in any text editor.
2. Change something. Save.
3. Refresh the browser.

No rebuild, no restart — not even if you're running the server, since it just
serves files off disk.

---

## What to edit

**`content.js` is the only file most people ever touch.** It holds the team
details, the hero, the sponsor list and every section.
[README.md](README.md) explains the shape of a section and the media
components you can put in one.

Everything else, roughly:

| File | What it's for |
|---|---|
| `content.js` | **all the words and images** — start here |
| `assets/img/` | the pictures |
| `index.html` / `print.html` | near-empty shells, plus hand-written page metadata (see below) |
| `assets/css/binder.css` | colours, type, spacing — the design tokens live at the top |
| `assets/css/print.css` | paper-only layout |
| `assets/js/binder.js` | builds the interactive page from `content.js` |
| `assets/js/print.js` | builds the A4 sheets from `content.js` |
| `scripts/` | occasional helper scripts, see below |

If you change how a **media component** works, remember there are *two*
renderers — `binder.js` and `print.js` — and both need the change, or the
print version silently drops it.

---

## Adding images

Put them in `assets/img/` and point at them from `content.js`.

- Any format is fine (`.webp`, `.png`, `.jpg`).
- Aim for **1400–1600px wide**. Bigger just makes the page slow.
- **Views that sit in the same set must be exactly the same pixel size.** The
  Main View highlights and the Iterations slider crossfade one image on top of
  another, so if the dimensions differ the picture jumps.

---

## Scripts you might need to run

All optional, all occasional. Run them from the project folder.

| If you changed… | Run | Needs |
|---|---|---|
| the robot name, tagline, accent colour, or hero image | `scripts/make-og.sh` | Chrome |
| `assets/img/logo.svg` | `python3 scripts/split-logo.py` | — |
| nothing — you just have a CAD screenshot with a white background | `python3 scripts/remove-bg.py in.png out.webp` | Pillow + numpy |

**`make-og.sh`** regenerates `assets/img/og-cover.png`, the little preview card
that shows up when the link is pasted into Discord or a group chat. It reads
`content.js`, so it picks up the new name automatically — you just have to
remember to run it, and to commit the PNG.

**`split-logo.py`** regenerates the two logo layers the header mark is built
from (the gear ring spins, the koala doesn't). `logo.svg` stays the file you
edit; the other two are generated and shouldn't be hand-edited.

---

## Renaming the robot, or rolling to a new season

This is the one genuinely annoying job, because the page title, the description
and the link-preview tags are **written out by hand** in both HTML files rather
than coming from `content.js`. That's on purpose: Google and Discord read the
file without running any JavaScript, so those values have to physically be in
the HTML.

To rename the robot:

1. `content.js` → `team.robot`.
2. `index.html` — it appears **7 times** (page title, description, the
   `og:` tags, the JSON-LD block, the ASCII comment at the top, and the
   `<noscript>` block).
3. `print.html` — **4 times**.
4. Run `scripts/make-og.sh` and commit the new PNG.

Rolling the season is the same job plus more, since the live address is
`2026.teamkoalafied.com` — the year is in the domain. `2026` appears 18 times
in `index.html` and 9 times in `print.html`, and a new domain also means
editing `CNAME`, `robots.txt` and `sitemap.xml`.

Quickest way to catch them all:

```bash
grep -n "LEMON LAUNCHER" index.html print.html content.js
grep -n "2026" index.html print.html
```

Also update the `<noscript>` list in `index.html` if you added or removed
sections — it mirrors the section list by hand.

---

## Publishing

It's a GitHub Pages site served from `main` / root. **Pushing to `main`
publishes it**, usually within a minute or two. There's no deploy step and no
staging site, so preview locally before you push.

Setting it up from scratch: Settings → Pages → Source: *Deploy from a branch* →
`main` / root. The custom domain lives in `CNAME`, with a DNS record pointing
at GitHub.

---

## When something breaks

**The page says "Binder could not load".**
`content.js` has a syntax error — almost always a missing comma or an unclosed
bracket. Open the browser console (⌥⌘I on Mac, F12 on Windows) and it names
the exact line.

**A section is missing from the PDF but fine on the website.**
It has `print: false` set in `content.js`.

**An image doesn't show up.**
Check the path in `content.js` matches the real filename, capitals and all —
the live server is case-sensitive even though your Mac isn't. So
`Intake.webp` will work locally and break once it's pushed.

**Images jump around when switching views.**
Those views aren't the same pixel dimensions. Re-export them at a matched size.

**The link preview shows the old robot.**
Re-run `scripts/make-og.sh`, commit the PNG, and bear in mind Discord and
iMessage cache previews for a while.

**Port 6996 is already in use.**
An old server is still running. `pkill -f "http.server 6996"`, or just use a
different number.
