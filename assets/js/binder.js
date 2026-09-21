/* ============================================================
   Technical Binder — renderer
   Reads window.BINDER_CONTENT and builds the page.
   No dependencies, no build step.
   ============================================================ */

(function () {
  'use strict';

  var C = window.BINDER_CONTENT;

  /* ---- helpers ------------------------------------------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Escape first, then allow **bold** and `code`.
  function fmt(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  // True when a carousel's items carry more than one distinct tag, i.e. when
  // the tags actually distinguish something rather than repeating one label.
  function mixedTags(items) {
    var seen = [];
    items.forEach(function (it) {
      if (it.tag && seen.indexOf(it.tag) < 0) seen.push(it.tag);
    });
    return seen.length > 1;
  }

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  /* ---- sliding tab indicators ----------------------------
     Both tab strips on the page — the nav's category links and a Main
     View's pill rail — mark the current item with one element that
     slides, instead of styling the item itself. `moveIndicator` writes
     the active item's box into CSS vars on the strip; the indicator is
     absolutely positioned against the strip, so offsetLeft/offsetTop are
     already relative to it and stay correct when the rail is scrolled.

     Every strip registers itself so `syncStrips` can re-measure after a
     resize or a late webfont swap, either of which changes tab widths. */

  var STRIPS = [];

  function registerStrip(strip, getActive) {
    STRIPS.push([strip, getActive]);
  }

  function moveIndicator(strip, active) {
    if (!strip) return;
    if (!active) { strip.classList.remove('has-active'); return; }
    // A hidden strip (the nav below 940px) measures zero — leave the last
    // known box in place and wait for the resize that reveals it.
    if (!active.offsetWidth) return;
    strip.style.setProperty('--indicator-x', active.offsetLeft + 'px');
    strip.style.setProperty('--indicator-y', active.offsetTop + 'px');
    strip.style.setProperty('--indicator-w', active.offsetWidth + 'px');
    strip.style.setProperty('--indicator-h', active.offsetHeight + 'px');
    strip.classList.add('has-active');
  }

  function syncStrips() {
    STRIPS.forEach(function (s) { moveIndicator(s[0], s[1]()); });
    // A rail that fits has nothing to pan, so it can claim touch gestures
    // for scrubbing; one that overflows must stay scrollable. A solo rail
    // has nothing to scrub either, so it never takes the gesture.
    document.querySelectorAll('.hl-pills:not(.is-solo)').forEach(function (rail) {
      rail.style.touchAction = rail.scrollWidth > rail.clientWidth ? '' : 'none';
    });
  }

  // Bring the selected tab into view on a rail too narrow to show them all.
  function keepInView(strip, tab) {
    if (strip.scrollWidth <= strip.clientWidth) return;
    var left = tab.offsetLeft;
    var right = left + tab.offsetWidth;
    if (left < strip.scrollLeft) strip.scrollLeft = left - 4;
    else if (right > strip.scrollLeft + strip.clientWidth) {
      strip.scrollLeft = right - strip.clientWidth + 4;
    }
  }

  function fail(msg) {
    document.body.innerHTML =
      '<div class="boom"><h2>Binder could not load</h2><p>' + esc(msg) + '</p>' +
      '<p style="margin-top:10px;color:var(--ink-3)">Check <code>content.js</code> ' +
      'for a syntax error — a missing comma or bracket will do this. ' +
      'Open your browser console for the exact line.</p></div>';
  }

  /* ---- nav ----------------------------------------------- */

  function externalLinkIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>';
  }

  function renderNav(numbered) {
    var t = C.team;
    var links = C.categories.map(function (cat) {
      var first = numbered.find(function (s) { return s.category === cat.id; });
      if (!first) return '';
      return '<a href="#' + esc(first.id) + '" data-cat="' + esc(cat.id) + '">' + esc(cat.label) + '</a>';
    }).join('') +
      (t.cad ? '<a class="nav-external" href="' + esc(t.cad) + '" target="_blank" rel="noopener" aria-label="CAD (opens in a new tab)" title="CAD (opens in a new tab)">' +
        'Onshape' + externalLinkIcon() + '</a>' : '');

    var nav = el(
      '<header class="nav">' +
        '<div class="nav-in wrap">' +
          '<a class="wordmark" href="#top">' +
            (t.logo ? '<img class="wordmark-mark" src="' + esc(t.logo) + '" alt="">' : '') +
            '<span class="wordmark-a">' + esc(t.number) + '</span>' +
            '<span class="wordmark-b">' + esc(t.name) + '</span>' +
            '<span class="wordmark-tag"><b>' + esc(t.season) + '</b> Binder</span>' +
          '</a>' +
          '<nav class="nav-links"><span class="nav-indicator" aria-hidden="true"></span>' + links + '</nav>' +
          '<div class="nav-tools">' +
            (t.website ? '<a class="icon-btn" href="' + esc(t.website) + '" target="_blank" rel="noopener" ' +
              'aria-label="Main team site (opens in a new tab)" title="Main team site (opens in a new tab)">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg></a>' : '') +
            '<a class="icon-btn" href="print.html" aria-label="Print version" title="Print version">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M6 9V2.5h12V9M6 17.5H4a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 4 9.5h16a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-2"/>' +
              '<path d="M6 14h12v7.5H6z"/></svg></a>' +
            '<button class="icon-btn nav-menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="menu-panel" aria-label="Contents — jump to a section" title="Contents">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</header>');

    var groups = C.categories.map(function (cat) {
      var rows = numbered.filter(function (s) { return s.category === cat.id; })
        .map(function (s) {
          return '<a href="#' + esc(s.id) + '"><span>' + pad(s.n) + '</span><span>' + esc(s.title) + '</span></a>';
        }).join('');
      return rows ? '<div class="menu-group">' + esc(cat.label) + '</div>' + rows : '';
    }).join('');

    var panel = el('<div class="menu-panel" id="menu-panel" hidden>' + groups + '</div>');

    document.body.insertBefore(panel, document.body.firstChild);
    document.body.insertBefore(nav, document.body.firstChild);

    var mb = document.getElementById('menu-btn');
    mb.addEventListener('click', function () {
      var open = panel.hidden;
      panel.hidden = !open;
      mb.setAttribute('aria-expanded', String(open));
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) { panel.hidden = true; mb.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---- hero ---------------------------------------------- */

  // Two sponsor moments, matching the main site's quiet banner: one right
  // under the hero (no label), one near the footer (labelled). Both use the
  // same row markup/logo size — see the comment on .sponsors in binder.css.
  function sponsorRow() {
    return '<div class="sponsor-banner-row">' +
      C.sponsors.map(function (s) {
        return '<img class="sponsor-logo" src="' + esc(s.logo) + '" alt="' + esc(s.name) + '" loading="lazy">';
      }).join('') +
      '</div>';
  }

  // Quiet strip right under the hero.
  function renderSponsorBanner() {
    if (!Array.isArray(C.sponsors) || !C.sponsors.length) return '';
    return '<div class="sponsors sponsors-hero"><div class="sponsors-label">Thank you to our sponsors</div>' + sponsorRow() + '</div>';
  }

  // Fuller "thank you" section, labelled, near the footer.
  function renderSponsors() {
    if (!Array.isArray(C.sponsors) || !C.sponsors.length) return '';
    return '<div class="sponsors-label">Thank you to our sponsors</div>' + sponsorRow();
  }

  function renderHero(numbered) {
    var t = C.team, h = C.hero;
    var byId = {};
    numbered.forEach(function (s) { byId[s.id] = s; });

    function rail(side) {
      var items = h.callouts.filter(function (c) { return c.side === side; })
        .map(function (c) {
          var s = byId[c.id];
          var name = s ? s.title : c.id;
          return '<a class="callout" href="#' + esc(c.id) + '" data-co="' + esc(c.id) + '">' +
                   '<span class="callout-name">' + esc(name) + '</span>' +
                   '<span class="callout-blurb">' + fmt(c.blurb) + '</span>' +
                 '</a>';
        }).join('');
      return '<div class="hero-rail hero-rail-' + side[0] + '">' + items + '</div>';
    }

    var dots = h.callouts.map(function (c) {
      return '<span class="hero-dot" data-dot="' + esc(c.id) + '" style="left:' + c.x + '%;top:' + c.y + '%"></span>';
    }).join('');

    // One frame per system that has an `hl` image, stacked on top of the
    // full-robot frame and crossfaded on hover by that system's rail label
    // (wired in wireHero) — same mechanism as a section's Main View, just
    // triggered by hover instead of a pill click.
    var highlightable = h.callouts.filter(function (c) { return c.hl; });
    var frames = '<img class="hero-frame is-on" data-hero-view="full" src="' + esc(h.image) + '" alt="' + esc(h.alt) + '">' +
      highlightable.map(function (c) {
        return '<img class="hero-frame" data-hero-view="' + esc(c.id) + '" src="' + esc(c.hl.src) +
               '" alt="' + esc(c.hl.alt) + '" loading="lazy">';
      }).join('');

    return '<section class="hero" id="top">' +
      '<div class="wrap">' +
        '<div class="hero-meta">' +
          '<p class="eyebrow">Team ' + esc(t.number) + ' · ' + esc(t.name) + ' · ' + esc(t.season) + '</p>' +
          '<h1 class="hero-title">' + esc(t.robot) + '</h1>' +
          '<p class="hero-sub">' + fmt(t.tagline) + '</p>' +
        '</div>' +
        '<div class="hero-stage">' +
          '<svg class="hero-lines" aria-hidden="true"></svg>' +
          rail('left') +
          '<div class="hero-figure">' + frames + dots + '</div>' +
          rail('right') +
        '</div>' +
        renderSponsorBanner() +
      '</div>' +
    '</section>';
  }

  // Draw leader lines from each label to its dot. Re-run on resize.
  function layoutHero() {
    var stage = document.querySelector('.hero-stage');
    var svg = document.querySelector('.hero-lines');
    if (!stage || !svg) return;

    var box = stage.getBoundingClientRect();
    if (box.width < 900) { svg.innerHTML = ''; return; }

    svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    svg.setAttribute('width', box.width);
    svg.setAttribute('height', box.height);

    var paths = '';
    C.hero.callouts.forEach(function (c) {
      var dot = stage.querySelector('[data-dot="' + c.id + '"]');
      var lab = stage.querySelector('[data-co="' + c.id + '"]');
      if (!dot || !lab) return;

      var d = dot.getBoundingClientRect();
      var l = lab.getBoundingClientRect();
      var dx = d.left + d.width / 2 - box.left;
      var dy = d.top + d.height / 2 - box.top;
      var right = c.side === 'left';                 // left rail exits to the right
      var ax = (right ? l.right + 8 : l.left - 8) - box.left;
      var ay = l.top + l.height / 2 - box.top;
      var mx = ax + (dx - ax) * 0.34;

      paths += '<path d="M ' + ax + ' ' + ay + ' L ' + mx + ' ' + ay + ' L ' + dx + ' ' + dy + '" data-line="' + c.id + '"/>';
    });
    svg.innerHTML = paths;
  }

  function wireHero() {
    // A callout's rail label doubles as the "highlight a system" control:
    // hovering (or focusing) it lights its dot/line and, when that system
    // has an `hl` frame, crossfades the hero image to it — same crossfade
    // a section's Main View pills do, just triggered by hover instead of a
    // click, and keyed by id instead of index.
    var heroFrames = document.querySelectorAll('.hero-frame');
    document.querySelectorAll('.callout').forEach(function (a) {
      var id = a.getAttribute('data-co');
      var hasFrame = !!document.querySelector('.hero-frame[data-hero-view="' + id + '"]');
      function set(on) {
        var dot = document.querySelector('[data-dot="' + id + '"]');
        var line = document.querySelector('[data-line="' + id + '"]');
        if (dot) dot.classList.toggle('is-lit', on);
        if (line) line.style.opacity = on ? '1' : '';
        if (hasFrame) {
          var view = on ? id : 'full';
          heroFrames.forEach(function (f) { f.classList.toggle('is-on', f.getAttribute('data-hero-view') === view); });
        }
      }
      a.addEventListener('mouseenter', function () { set(true); });
      a.addEventListener('mouseleave', function () { set(false); });
      a.addEventListener('focus', function () { set(true); });
      a.addEventListener('blur', function () { set(false); });
    });

    // Size the hero image box to the tallest frame so switching highlights
    // never shifts the page — same trick every other crossfade block uses.
    var stage = document.querySelector('.hero-figure');
    var frames = document.querySelectorAll('.hero-frame');
    var ar = 0;
    frames.forEach(function (img) {
      function take() {
        if (!img.naturalWidth) return;
        var r = img.naturalWidth / img.naturalHeight;
        if (!ar || r < ar) ar = r;
        stage.style.setProperty('--ar', ar.toFixed(4));
      }
      img.complete ? take() : img.addEventListener('load', take);
    });

    var full = document.querySelector('.hero-frame[data-hero-view="full"]');
    if (full && !full.complete) full.addEventListener('load', layoutHero);
    layoutHero();

    var pending;
    window.addEventListener('resize', function () {
      clearTimeout(pending);
      pending = setTimeout(layoutHero, 120);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutHero);
  }

  /* ---- media blocks -------------------------------------- */

  // key -> the content block that produced it, filled in by mediaBlock().
  var BLOCKS = {};

  function figure(src, alt, caption, cls) {
    return '<figure class="' + (cls || '') + '">' +
      '<div class="frame"><img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy"></div>' +
      (caption ? '<figcaption>' + esc(caption) + '</figcaption>' : '') +
    '</figure>';
  }

  // Every block type can carry an optional `label` — rendered the same way
  // "Features" is, so "Prototyping", "Alternate View" etc. all look uniform.
  function blockLabel(b) {
    return b.label ? '<h3 class="block-label">' + esc(b.label) + '</h3>' : '';
  }

  function mediaBlock(b, key) {
    BLOCKS[key] = b;

    if (b.type === 'image') {
      return '<div class="media-block">' + blockLabel(b) + figure(b.src, b.alt, b.caption) + '</div>';
    }

    if (b.type === 'figures') {
      var cols = b.cols || 2;
      return '<div class="media-block">' + blockLabel(b) +
        '<div class="figs figs-' + cols + '">' +
          b.items.map(function (it) {
            return figure(it.src, it.alt, it.caption, it.wide ? 'wide' : '');
          }).join('') +
        '</div>' +
      '</div>';
    }

    if (b.type === 'compare') {
      return '<div class="media-block">' + blockLabel(b) +
        '<figure class="compare" data-compare="' + key + '">' +
          '<div class="compare-stage">' +
            '<img src="' + esc(b.after.src) + '" alt="' + esc(b.after.alt) + '" loading="lazy">' +
            '<div class="compare-top"><img src="' + esc(b.before.src) + '" alt="' + esc(b.before.alt) + '" loading="lazy"></div>' +
            '<span class="compare-tag compare-tag-l">' + esc(b.before.tag) + '</span>' +
            '<span class="compare-tag compare-tag-r">' + esc(b.after.tag) + '</span>' +
            '<div class="compare-bar"><span class="compare-grip">↔</span></div>' +
            '<input class="compare-range" type="range" min="0" max="100" value="50" step="0.5" ' +
              'aria-label="Compare ' + esc(b.before.tag) + ' with ' + esc(b.after.tag) + '">' +
          '</div>' +
          (b.caption ? '<figcaption>' + esc(b.caption) + '</figcaption>' : '') +
        '</figure>' +
      '</div>';
    }

    if (b.type === 'highlight') {
      var frames = b.views.map(function (v, i) {
        return '<img class="' + (i === 0 ? 'is-on' : '') + '" src="' + esc(v.src) +
               '" alt="' + esc(v.alt) + '"' + (i ? ' loading="lazy"' : '') + '>';
      }).join('');
      var pills = b.views.map(function (v, i) {
        return '<button class="pill" type="button" role="tab" id="' + key + '-t' + i + '" ' +
               'aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? '0' : '-1') + '">' +
               esc(v.tag) + '</button>';
      }).join('');
      return '<div class="media-block">' + blockLabel(b) +
        '<figure class="hl" data-hl="' + key + '">' +
          '<div class="hl-stage" role="tabpanel" aria-labelledby="' + key + '-t0">' + frames + '</div>' +
          '<div class="hl-pills' + (b.views.length < 2 ? ' is-solo' : '') +
               '" role="tablist" aria-label="' + esc(b.label || 'Views') + '">' +
            '<span class="pill-indicator" aria-hidden="true"></span>' + pills +
          '</div>' +
          (b.caption ? '<figcaption>' + esc(b.caption) + '</figcaption>' : '') +
        '</figure>' +
      '</div>';
    }

    if (b.type === 'iterations') {
      var frames = b.versions.map(function (v, i) {
        return '<img class="iter-frame' + (i === 0 ? ' is-on' : '') + '" src="' + esc(v.src) +
               '" alt="' + esc(v.alt) + '">';
      }).join('');
      return '<div class="media-block">' + blockLabel(b) +
        '<figure class="iters" data-iters="' + key + '">' +
          '<div class="iters-stage"><span class="iter-badge">' + esc(b.versions[0].tag) + '</span>' + frames + '</div>' +
          '<div class="iters-ctl">' +
            '<button class="step-btn" data-step="-1" type="button" aria-label="Previous version">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>' +
            '<input class="iter-range" type="range" min="0" max="' + (b.versions.length - 1) + '" value="0" step="1" ' +
              'aria-label="' + esc(b.label || 'Iteration') + '">' +
            '<button class="step-btn" data-step="1" type="button" aria-label="Next version">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></button>' +
          '</div>' +
          '<p class="iter-note"><b>' + esc(b.versions[0].tag) + '</b><span>' + fmt(b.versions[0].note) + '</span></p>' +
        '</figure>' +
      '</div>';
    }

    if (b.type === 'carousel') {
      var multi = b.items.length > 1;
      // A tag only earns its line when it tells two kinds of photo apart. If
      // every item carries the same one it just restates the block's label
      // above, so it is dropped (see mixedTags, shared with print.js).
      var showTags = mixedTags(b.items);
      var items = b.items.map(function (it) {
        var cap = (showTags && it.tag ? '<b>' + esc(it.tag) + '</b>' : '') + fmt(it.caption || '');
        return '<div class="carousel-item">' +
          '<div class="carousel-frame"><img src="' + esc(it.src) + '" alt="' + esc(it.alt) + '" loading="lazy"></div>' +
          (cap ? '<p class="carousel-cap">' + cap + '</p>' : '') +
        '</div>';
      }).join('');
      var arrow = function (dir, label) {
        var d = dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7';
        return '<button class="carousel-nav carousel-' + (dir < 0 ? 'prev' : 'next') + '" type="button" aria-label="' + label + '" disabled>' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg></button>';
      };
      return '<div class="media-block">' + blockLabel(b) +
        '<figure class="carousel' + (multi ? '' : ' is-single') + '" data-carousel="' + key + '">' +
          '<div class="carousel-track">' + items + '</div>' +
          (multi ? arrow(-1, 'Previous image') + arrow(1, 'Next image') : '') +
        '</figure>' +
      '</div>';
    }

    if (b.type === 'video') {
      return '<div class="media-block">' + blockLabel(b) +
        '<figure class="video-embed">' +
          '<div class="video-frame">' +
            '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(b.youtube) +
              '" title="' + esc(b.title || 'Embedded video') +
              '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>' +
          '</div>' +
          (b.caption ? '<figcaption>' + esc(b.caption) + '</figcaption>' : '') +
        '</figure>' +
      '</div>';
    }

    return '';
  }

  /* ---- sections ------------------------------------------ */

  function featureList(items) {
    return '<ul class="feat">' + items.map(function (f) {
      var kids = (f.children && f.children.length)
        ? '<ul>' + f.children.map(function (k) { return '<li>' + fmt(k) + '</li>'; }).join('') + '</ul>'
        : '';
      return '<li>' + fmt(f.text) + kids + '</li>';
    }).join('') + '</ul>';
  }

  function renderSection(s) {
    var cat = C.categories.find(function (c) { return c.id === s.category; });
    var blocks = s.media || [];

    // The first media block is the section's "primary" view (a Main View
    // highlight, or a compare slider for Block Model) — it pins beside the
    // title and Features on wide screens. Anything after it (a carousel, an
    // iteration slider) runs full width below, unpinned — bundling those
    // into the pinned column made the column almost always taller than
    // Features, which left it nothing to pin against.
    var primary = blocks.length ? mediaBlock(blocks[0], s.id + '-0') : '';
    var rest = blocks.slice(1).map(function (b, i) {
      return mediaBlock(b, s.id + '-' + (i + 1));
    }).join('');

    var feats = (s.features && s.features.length)
      ? '<div class="features"><h3 class="block-label">Features</h3>' + featureList(s.features) + '</div>' : '';

    // Text comes before the image in the HTML — on narrow screens (and for
    // screen readers, which follow DOM order rather than the CSS below) the
    // heading still reads before its illustrative image. CSS `order` is what
    // moves the image to the left of the text on wide screens.
    var text = '<div class="sec-text">' +
        '<p class="eyebrow">' + esc(cat ? cat.label : '') + ' · ' + pad(s.n) + '</p>' +
        '<h2 class="sec-title">' + esc(s.title) + '</h2>' +
        '<p class="sec-thesis">' + fmt(s.thesis) + '</p>' +
        feats +
      '</div>';

    var primaryRow = (primary || text)
      ? '<div class="sec-primary">' + text + primary + '</div>' : '';

    return '<section class="sec" id="' + esc(s.id) + '"><div class="wrap">' +
      primaryRow +
      (rest ? '<div class="sec-media">' + rest + '</div>' : '') +
    '</div></section>';
  }

  /* ---- interactions -------------------------------------- */

  function wireCompare(root) {
    root.querySelectorAll('[data-compare]').forEach(function (fig) {
      var stage = fig.querySelector('.compare-stage');
      var range = fig.querySelector('.compare-range');
      function set() { stage.style.setProperty('--pos', range.value + '%'); }
      range.addEventListener('input', set);
      set();

      // Native <input type="range"> on touch browsers only drags once the
      // touch starts on the (invisible, full-height) thumb itself — a touch
      // that starts anywhere else on the track just jumps once and doesn't
      // follow the finger. Drive the value from pointer position instead so
      // a drag tracks continuously once it starts (the CSS narrows where a
      // touch can start it, near the divider, so the rest of the image is
      // still free to scroll).
      var dragging = false;
      function valueAt(clientX) {
        var rect = stage.getBoundingClientRect();
        var pct = ((clientX - rect.left) / rect.width) * 100;
        return Math.max(0, Math.min(100, pct));
      }
      function move(clientX) {
        range.value = valueAt(clientX);
        set();
        range.dispatchEvent(new Event('input', { bubbles: true }));
      }
      range.addEventListener('pointerdown', function (e) {
        dragging = true;
        range.setPointerCapture(e.pointerId);
        move(e.clientX);
        e.preventDefault(); // belt-and-suspenders alongside touch-action: none below
      });
      range.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        move(e.clientX);
        e.preventDefault();
      });
      function stop(e) {
        if (!dragging) return;
        dragging = false;
        if (range.hasPointerCapture && range.hasPointerCapture(e.pointerId)) {
          range.releasePointerCapture(e.pointerId);
        }
      }
      range.addEventListener('pointerup', stop);
      range.addEventListener('pointercancel', stop);
    });
  }

  function wireHighlights(root) {
    root.querySelectorAll('[data-hl]').forEach(function (fig) {
      var key = fig.getAttribute('data-hl');
      var block = BLOCKS[key];
      if (!block) return;

      var stage = fig.querySelector('.hl-stage');
      var frames = fig.querySelectorAll('.hl-stage img');
      var rail = fig.querySelector('.hl-pills');
      var pills = [].slice.call(fig.querySelectorAll('.pill'));
      var current = 0;
      var dragging = false;

      // Match the stage to the tallest view so switching never shifts the page.
      var ar = 0;
      frames.forEach(function (img) {
        function take() {
          if (!img.naturalWidth) return;
          var r = img.naturalWidth / img.naturalHeight;
          if (!ar || r < ar) ar = r;
          stage.style.setProperty('--ar', ar.toFixed(4));
        }
        img.complete ? take() : img.addEventListener('load', take);
      });

      function show(i, focus) {
        current = i;
        frames.forEach(function (f, j) { f.classList.toggle('is-on', j === i); });
        pills.forEach(function (p, j) {
          p.setAttribute('aria-selected', String(j === i));
          p.tabIndex = j === i ? 0 : -1;
          if (j === i && focus) p.focus();
        });
        stage.setAttribute('aria-labelledby', key + '-t' + i);
        if (!dragging) keepInView(rail, pills[i]);
        moveIndicator(rail, pills[i]);
      }

      registerStrip(rail, function () { return pills[current]; });
      wireRailDrag();

      /* Press and drag along the rail to scrub through the views, the way
         a segmented control behaves — the indicator follows the cursor and
         the render crossfades live, so comparing two subsystems is one
         gesture instead of two clicks. The views are still tabs, not a
         range: this only borrows a slider's feel, not its semantics.

         Touch is the awkward case. A rail wider than its container has to
         stay scrollable, so there we leave the browser's pan alone and let
         taps do the work; syncStrips keeps touch-action in step with
         whether the rail currently overflows. */
      function wireRailDrag() {
        if (pills.length < 2) return;

        // Hit-test in the rail's own content coordinates: offsetLeft is fixed
        // regardless of scroll, so one rect per move covers every pill.
        function indexAt(clientX) {
          var box = rail.getBoundingClientRect();
          var x = clientX - box.left - rail.clientLeft + rail.scrollLeft;
          for (var i = 0; i < pills.length; i++) {
            if (x >= pills[i].offsetLeft && x <= pills[i].offsetLeft + pills[i].offsetWidth) return i;
          }
          // Past either end, hold the nearest view rather than losing track.
          return x < pills[0].offsetLeft ? 0 : pills.length - 1;
        }

        // Suppressing selectstart for the duration of the gesture, rather than
        // preventDefault-ing pointerdown, keeps the browser's native focus
        // behaviour intact — including not raising a focus ring on a click.
        function blockSelect(ev) { ev.preventDefault(); }

        function end(e) {
          if (!dragging) return;
          dragging = false;
          rail.classList.remove('is-dragging');
          fig.classList.remove('is-dragging');
          if (e && e.pointerId != null && rail.hasPointerCapture(e.pointerId)) {
            rail.releasePointerCapture(e.pointerId);
          }
          document.removeEventListener('selectstart', blockSelect);
          keepInView(rail, pills[current]);
          // A drag can land on a tab other than the one the pointer went down
          // on, which is where the browser left focus — move it, or the arrow
          // keys would step from the wrong place.
          pills[current].focus({ preventScroll: true });
        }

        rail.addEventListener('pointerdown', function (e) {
          if (e.button) return;
          if (e.pointerType === 'touch' && rail.scrollWidth > rail.clientWidth) return;
          // Without this, dragging off the rail starts selecting the page
          // text underneath and the gesture ends holding a blue smear.
          document.addEventListener('selectstart', blockSelect);
          dragging = true;
          rail.classList.add('is-dragging');
          fig.classList.add('is-dragging');
          rail.setPointerCapture(e.pointerId);
          show(indexAt(e.clientX));
        });
        rail.addEventListener('pointermove', function (e) {
          if (dragging) show(indexAt(e.clientX));
        });
        rail.addEventListener('pointerup', end);
        rail.addEventListener('pointercancel', end);
      }

      pills.forEach(function (p, i) {
        p.addEventListener('click', function () { show(i); });
        p.addEventListener('keydown', function (e) {
          var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (d) { e.preventDefault(); show((i + d + pills.length) % pills.length, true); }
          else if (e.key === 'Home') { e.preventDefault(); show(0, true); }
          else if (e.key === 'End') { e.preventDefault(); show(pills.length - 1, true); }
        });
      });
    });
  }

  function wireIterations(root) {
    root.querySelectorAll('[data-iters]').forEach(function (fig) {
      var block = BLOCKS[fig.getAttribute('data-iters')];
      if (!block) return;

      var stage = fig.querySelector('.iters-stage');
      var frames = fig.querySelectorAll('.iter-frame');
      var badge = fig.querySelector('.iter-badge');
      var range = fig.querySelector('.iter-range');
      var note = fig.querySelector('.iter-note');
      var btns = fig.querySelectorAll('.step-btn');

      // Size the stage to the tallest frame so nothing jumps between versions.
      var ar = 0;
      frames.forEach(function (img) {
        function take() {
          if (!img.naturalWidth) return;
          var r = img.naturalWidth / img.naturalHeight;
          if (!ar || r < ar) ar = r;          // narrowest ratio = tallest box
          stage.style.setProperty('--ar', ar.toFixed(4));
        }
        img.complete ? take() : img.addEventListener('load', take);
      });

      function show(i) {
        i = Math.max(0, Math.min(block.versions.length - 1, i));
        range.value = i;
        frames.forEach(function (f, j) { f.classList.toggle('is-on', j === i); });
        var v = block.versions[i];
        badge.textContent = v.tag;
        note.innerHTML = '<b>' + esc(v.tag) + '</b><span>' + fmt(v.note) + '</span>';
        btns[0].disabled = i === 0;
        btns[1].disabled = i === block.versions.length - 1;
      }

      range.addEventListener('input', function () { show(Number(range.value)); });
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          show(Number(range.value) + Number(b.getAttribute('data-step')));
        });
      });
      show(0);
    });
  }

  // Fixed-height photo carousel — Prototyping and Alternate View images
  // combined into one strip. As many items show side by side as fit; the
  // arrows page the strip sideways rather than swap a single image, and
  // each item's own frame is a fixed height (not aspect-matched) so mixed
  // portrait/landscape photos sit flush in a row.
  /* Lay a carousel photo to the row height at its own aspect ratio, so the
     strip keeps a single clean baseline without cropping anything.

     In a multi-photo strip the ratio is clamped, so one panorama can't run
     away with the row and a tall shot can't collapse to a sliver — those two
     are the only ones centre-cropped. A lone photo has no row to keep in
     step with, so it is always shown whole. */
  function setRatio(img, single) {
    if (!img.naturalWidth || !img.naturalHeight) return;
    var r = img.naturalWidth / img.naturalHeight;
    if (!single) r = Math.min(2, Math.max(0.62, r));
    img.parentNode.style.setProperty('--ar', r.toFixed(4));
  }

  function wireCarousels(root) {
    root.querySelectorAll('[data-carousel]').forEach(function (fig) {
      var track = fig.querySelector('.carousel-track');
      var prev = fig.querySelector('.carousel-prev');
      var next = fig.querySelector('.carousel-next');

      // Every photo needs its ratio, including the single-item carousels
      // that fall out below before any paging is wired.
      var single = fig.classList.contains('is-single');
      fig.querySelectorAll('img').forEach(function (img) {
        if (img.complete) setRatio(img, single);
        else img.addEventListener('load', function () { setRatio(img, single); });
      });

      if (!prev || !next) return; // single item — nothing to page

      function update() {
        var max = track.scrollWidth - track.clientWidth;
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= max - 2;
      }

      function step(dir) {
        var item = track.querySelector('.carousel-item');
        var gap = 14;
        var amount = item ? item.getBoundingClientRect().width + gap : track.clientWidth * 0.9;
        track.scrollBy({ left: dir * amount, behavior: 'smooth' });
      }

      prev.addEventListener('click', function () { step(-1); });
      next.addEventListener('click', function () { step(1); });
      track.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);

      // Widths aren't final until images/fonts load — recheck after.
      update();
      fig.querySelectorAll('img').forEach(function (img) {
        if (!img.complete) img.addEventListener('load', update);
      });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
    });
  }

  // Click any content image to see it enlarged against a dimmed backdrop.
  // One overlay, reused for every image — figures, Main View, Iterations,
  // Carousel, hero. The Compare slider is deliberately excluded: its
  // draggable range input already owns clicks on that image, and a click
  // there means "move the wipe," not "enlarge."
  function wireLightbox(root) {
    var box = el(
      '<div class="lightbox" id="lightbox" hidden>' +
        '<button class="lightbox-close" type="button" aria-label="Close">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
        '<figure><img id="lightbox-img" src="" alt=""><figcaption id="lightbox-cap"></figcaption></figure>' +
      '</div>');
    document.body.appendChild(box);

    var img = box.querySelector('#lightbox-img');
    var cap = box.querySelector('#lightbox-cap');
    var closeBtn = box.querySelector('.lightbox-close');
    var opener = null;

    function captionFor(src) {
      var item = src.closest('.carousel-item');
      if (item) {
        var c1 = item.querySelector('.carousel-cap');
        return c1 ? c1.innerHTML : esc(src.alt || '');
      }
      var fig = src.closest('figure');
      if (fig) {
        var c2 = fig.querySelector('figcaption, .iter-note');
        if (c2) return c2.innerHTML;
      }
      return esc(src.alt || '');
    }

    function open(src, opts) {
      opener = (opts && opts.opener) || document.activeElement;
      img.src = src.currentSrc || src.src;
      img.alt = src.alt || '';
      cap.innerHTML = captionFor(src);
      box.hidden = false;
      requestAnimationFrame(function () { box.classList.add('is-open'); });
      document.documentElement.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function close() {
      box.classList.remove('is-open');
      document.documentElement.style.overflow = '';
      var done = function () { box.hidden = true; img.src = ''; box.removeEventListener('transitionend', done); };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) done();
      else box.addEventListener('transitionend', done);
      if (opener && opener.focus) opener.focus();
    }

    root.addEventListener('click', function (e) {
      var target = e.target.closest('img');
      if (!target || !root.contains(target)) return;
      if (target.closest('.compare-stage')) return; // owned by the drag slider
      if (target.classList.contains('sponsor-logo')) return; // sponsors never enlarge
      open(target, { opener: target.closest('button, a') || null });
    });

    box.addEventListener('click', function (e) {
      if (e.target === img) return; // clicking the image itself doesn't close
      close();
    });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !box.hidden) close();
    });
  }

  function wireScrollSpy(numbered) {
    var navLinks = document.querySelector('.nav-links');
    registerStrip(navLinks, function () { return navLinks.querySelector('a.is-active'); });

    var catOf = {};
    numbered.forEach(function (s) { catOf[s.id] = s.category; });

    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });

      var active = numbered.map(function (s) { return s.id; }).find(function (id) { return seen[id]; });
      document.querySelectorAll('.nav-links a').forEach(function (a) {
        a.classList.toggle('is-active', !!active && a.getAttribute('data-cat') === catOf[active]);
      });
      moveIndicator(navLinks, navLinks.querySelector('a.is-active'));
    }, { rootMargin: '-42% 0px -52% 0px' });

    document.querySelectorAll('.sec').forEach(function (s) { io.observe(s); });
  }

  /* ---- boot ---------------------------------------------- */

  function boot() {
    if (!C || !C.team || !Array.isArray(C.sections) || !C.sections.length) {
      return fail('content.js did not define window.BINDER_CONTENT with a non-empty "sections" list.');
    }

    var t = C.team;
    document.title = t.number + ' — ' + t.season + ' Technical Binder';
    var root = document.documentElement;
    if (t.accent) root.style.setProperty('--accent', t.accent);

    // Number sections in document order, like a printed binder.
    var numbered = C.sections.map(function (s, i) {
      var c = Object.create(s); c.n = i + 1; return c;
    });

    renderNav(numbered);

    var main = document.getElementById('binder');
    main.innerHTML =
      renderHero(numbered) +
      numbered.map(renderSection).join('');

    var sponsorsEl = document.getElementById('sponsors');
    if (sponsorsEl) sponsorsEl.innerHTML = renderSponsors();

    document.getElementById('foot').innerHTML =
      '<span>Team ' + esc(t.number) + ' · ' + esc(t.name) + '</span>' +
      '<span>' + esc(t.season) + ' Technical Binder</span>' +
      '<a href="print.html">Print version →</a>';

    wireHero();
    wireCompare(main);
    wireHighlights(main);
    wireIterations(main);
    wireCarousels(main);
    wireLightbox(main);
    wireScrollSpy(numbered);

    // Place every tab indicator on its current tab, then enable the slide
    // transition a frame later so none of them animate in from zero width.
    // Webfonts land after this and resize the tabs, so re-measure then too.
    requestAnimationFrame(function () {
      syncStrips();
      requestAnimationFrame(function () {
        document.querySelectorAll('.hl-pills, .nav-links').forEach(function (n) {
          n.classList.add('is-ready');
        });
      });
    });
    window.addEventListener('resize', syncStrips);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncStrips);

    // Sections are built after the browser has already tried to honour a
    // #hash, so jump to it ourselves once the anchor actually exists.
    if (location.hash.length > 1) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
