# 6996 Koalafied — Technical Binder

Interactive team technical binder inspired by Team 4414, plus a print/PDF version at `print.html`.

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
below for how to make the images for it.

```js
{ type: "highlight", label: "Main View", views: [
    { tag: "Full Assembly", src: "…", alt: "…" },
    { tag: "Gearbox",       src: "…", alt: "…" }
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
assets/js/binder.js   renders content.js into the page
assets/js/print.js    renders content.js into A4 sheets
assets/img/           images
assets/img/logo.svg   team logo (vector) — nav mark, favicon and print cover
```
