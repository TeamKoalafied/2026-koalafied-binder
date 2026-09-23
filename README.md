# 6996 Koalafied — Technical Binder

Interactive team technical binder inspired by Team 4414, plus a print/PDF version at `print.html`.

**New here?** [GETTING-STARTED.md](GETTING-STARTED.md) covers running it
locally, the scripts, and publishing. This page is the content guide — what to
write in `content.js`.

---

## Structure

Each section contains:

- a one-line **thesis** (the summary under the title)
- a **feature list** (bullets, with optional sub-bullets)
- a stack of **media components**, chosen from the standard types below

The section's first media block (its Main View, or the compare slider for
Block Model) renders beside the feature list, side by side. Anything after
that — a carousel, a version slider — runs full width below. On narrow
screens everything stacks, media first.

---

## Editing content

**`content.js` is the only file most people need to touch.** It is plain JSON
with one line of JavaScript wrapped around the top — that wrapper is what lets
the site work by double-clicking, with no server.

It also has a copy/paste block near the top (`STANDARD MEDIA COMPONENTS`) with a blank starting point
for each of the four types below.

### Adding a section

Add an object to the `sections` array. Order in the array = order on the page,
and section numbers (01, 02, …) are assigned automatically.

```js
{
  id: "hopper",              // must be unique; becomes the #anchor link
  category: "mechanical",
  title: "Hopper",
  thesis: "One sentence on what it is and why it's built this way.",
  features: [
    { text: "Top-level bullet", children: ["Sub-bullet", "Another sub-bullet"] },
    { text: "Bullet with no children" }
  ],
  media: [ /* see below */ ]
}
```

`features` is optional — use `[]` and the block disappears.

In any text you can write `**bold**` and `` `code` ``.

### The media components

Every section is built from a combination of media components. The **first block in the list is the one paired
with Features** (see Structure above).

**1. Main view** (`highlight`) — the primary image, almost always first in
the list. Give it one view and it's a plain picture; give it two or more and
pill buttons appear to crossfade between them, isolating a sub-system. This
is the "press a button to highlight a part of a mechanism" feature — see
below for how to make the images for it. Each view's optional `note` only
appears in the print version's captions; `alt` is optional and defaults to
the tag.

```js
{ type: "highlight", label: "Main View", views: [
    { tag: "Full Assembly", src: "…", note: "What you're looking at." },
    { tag: "Gearbox",       src: "…", note: "What this part does." }
]}
```

**2. Carousel** (`carousel`) — Prototyping and Alternate View photos,
combined into one fixed-height strip. As many items show side by side as
fit the width; arrows page the strip sideways when there isn't room for all
of them (and disappear entirely when there's nothing to page). Photos keep
their own proportions — they're laid to one shared row height, so a portrait
and a landscape shot sit in the same clean band without being cropped or
padded out.

Each item's `tag` is optional — use it to mark which images are which when
you mix different kinds of photo in one carousel (e.g. `"Alternate View"`
vs. `"Prototyping"`). **A tag only appears when the carousel holds more than
one distinct tag.** If every item says `"Prototyping"` it just repeats the
block's own label, so it's left off — set different tags, or none at all.

```js
{ type: "carousel", label: "Prototyping", items: [
    { tag: "Alternate View", src: "…", alt: "…", caption: "How the gearbox works" },
    { tag: "Prototyping",    src: "…", alt: "…", caption: "Early linkage prototype" }
]}
```

**3. Version slider** (`iterations`) — a scrubber that steps through
prototype versions, V1 → Vn, with a note per version on what changed and why.

```js
{ type: "iterations", label: "Iterations", versions: [
    { tag: "V1", src: "…", alt: "…", note: "What changed and why." }
]}
```

**4. Compare** (`compare`) — a draggable before/after wipe.

```js
{ type: "compare", label: "…", caption: "…",
    before: { src: "…", alt: "…", tag: "Before" },
    after:  { src: "…", alt: "…", tag: "After" } }
```

### Hero callouts

`hero.callouts` positions the labelled pins on the robot render. `x` and `y`
are percentages across the hero image (0–100 from the top-left). `side` picks
which column the label sits in. `id` must match a section `id` so the pin
links to it.

To reposition a pin, nudge `x`/`y` and reload — the leader lines redraw
themselves.


```js
{ id: "turret", side: "right", x: 49, y: 36, blurb: "…",
  hl: { src: "assets/img/hero-hl-turret.webp", alt: "…" } }
```

### Team details

`team.robot` is the huge word on the hero. `team.accent` recolours the whole site.

### Swapping a letter for a picture

`team.robotGlyph` turns one letter of the robot name into an image — this
season, the **O** in LEMON is a lemon slice:

```js
robotGlyph: { letter: "O", at: 1, src: "assets/img/lemon-half.svg" },
```

`at` picks which one when the letter shows up more than once (`at: 2` is the
second). It applies to the hero, the print cover and the link-preview card, so
re-run `scripts/make-og.sh` after changing it.

Delete the line and the name goes back to plain text — same if the letter isn't
in the name, so a new robot next season won't inherit the lemon. The letter is
still there invisibly, so the heading reads correctly aloud and copies as the
real name.

Making your own: draw it square, and expect it to be tinted nothing — it's
shown as-is at roughly the cap height of the title.

### The nav mark

The little logo in the header is stacked from two files so the gear ring can
turn with the page — scroll to the bottom and it has made two full rotations;
scroll back up and it unwinds. The koala, the yellow disc and the 6996/FRC
banners stay upright.

Both files are generated from `logo.svg`, so that stays the one you edit:

```
python3 scripts/split-logo.py
```

It writes `logo-gear.svg` (the ring) and `logo-core.svg` (everything else),
which `team.logoGear` / `team.logoCore` point at. If you re-export the logo and
the script stops with a "logo.svg changed" error, the paths have moved and the
`GEAR` list at the top of the script needs re-deriving.

The logo never drew ring behind the two banners, so the ring is really a C with
two bites out of it. The script fills those in from the opposite side of the
gear — otherwise the bites rotate into view and the spin looks broken. The
banners still cover the filled-in part, so the logo at rest is unchanged.

Delete those two lines from `content.js` and the nav quietly falls back to the
single `logo` image, no gear. The favicon, the print cover and the link-preview
card all use `logo.svg` either way.

Readers who have asked their system for reduced motion get the mark static.

To resize the mark, change `--mark` near the top of `assets/css/binder.css`
(and `--nav-h` with it — the bar needs to stay taller than the logo). Phones
get smaller values from the `max-width: 600px` block lower down.

### The contents menu

The ☰ button opens a full-screen list of every section, at any width. The
gear from the logo drifts behind it. Escape, the ✕, tapping a section or
tapping the space beside the list all close it.

The print version, the team site and the Onshape link sit at the bottom of that
list as well as in the header, which is how they stay reachable on a phone
where the header's links are hidden. The bar itself stays see-through until you
scroll, then picks up a blur and a hairline.

---

## Highlighting a part of a mechanism

**All the work is in taking good CAD screenshots — the code just crossfades between images.**

Each view is the *same render, from the same camera*, with everything ghosted
to translucent white except the part being highlighted. Because the renderer
draws it, occlusion stays correct: a highlighted gear behind a ghosted plate
still sits behind it. (A transparent-PNG overlay on top of one base image
*doesn't* have this property — a highlighted part behind something would
incorrectly draw in front — which is why this isn't done that way.)

### Exporting the images

1. For each mechanism, create a named view in OnShape so every screenshot is consistent. Roughly square views work best.
2. Take a screenshot with minimal padding around the mechanism.
3. Select what you want to highlight and use the 'isolate feature'.
4. Take another screenshot in the exact same position (works well on mac with Cmd-shift-5 and using the window feature — the size and position is preserved between subsequent screenshots). Every screenshot must be the same size — don't approximate!
5. Repeat with other parts you want to isolate.
6. Remove the white backgrounds of the images — no good process for this yet.


## Images

Images go in the `assets/img` folder.

- Any format works (`.webp`, `.png`, `.jpg`) — just point `src` at the file if
  you do rename something.
- Aim for ~1400–1600px wide. Bigger just slows the page down.
- All views within one Main View or Iterations set should share the same
  pixel dimensions so switching between them doesn't jump the page.

---

## Publishing

Any static host works. For GitHub Pages:

1. Push this repo to GitHub.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `root`.
3. It'll be live at `https://<user>.github.io/<repo>/` in a minute or two.

For a custom domain add a `CNAME` file containing the
domain and point a DNS record at GitHub.

---

## File map

```
index.html            web version
print.html            paged A4 version, has a Print / Save as PDF button
content.js            all content lives here
assets/css/binder.css site styles and design tokens
assets/css/print.css  paper layout
assets/js/common.js   helpers shared by both renderers
assets/js/binder.js   renders content.js into the page
assets/js/print.js    renders content.js into A4 sheets
assets/img/           images
assets/img/logo.svg   team logo (vector) — favicon, print cover, link preview
assets/img/logo-gear.svg  generated: the gear ring the nav mark spins
assets/img/logo-core.svg  generated: the rest of the mark, stays upright
```
