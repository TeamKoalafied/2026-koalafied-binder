/* ============================================================
   Print binder — renders content.js as paged A4 sheets.
   ============================================================ */

(function () {
  'use strict';

  var C = window.BINDER_CONTENT;
  var B = window.Binder, esc = B.esc, fmt = B.fmt, pad = B.pad;

  // "Tag — note", or just the tag when there's no note.
  function tagged(tag, note) { return note ? tag + ' — ' + note : tag; }

  // Every media block flattened to plain figures — no interaction on paper.
  function flatten(section) {
    var out = [];
    (section.media || []).forEach(function (b) {
      if (b.type === 'compare') {
        out.push({ src: b.before.src, alt: b.before.alt, caption: b.before.tag });
        out.push({ src: b.after.src,  alt: b.after.alt,  caption: b.after.tag });
      } else if (b.type === 'highlight') {
        b.views.forEach(function (v) {
          out.push({ src: v.src, alt: v.alt, caption: tagged(v.tag, v.note) });
        });
      } else if (b.type === 'iterations') {
        b.versions.forEach(function (v) {
          out.push({ src: v.src, alt: v.alt, caption: tagged(v.tag, v.note) });
        });
      } else if (b.type === 'carousel') {
        var showTags = B.mixedTags(b.items);
        b.items.forEach(function (it) {
          out.push({ src: it.src, alt: it.alt, caption: showTags && it.tag ? tagged(it.tag, it.caption) : it.caption });
        });
      }
    });
    return out;
  }

  function figs(items) {
    if (!items.length) return '';
    var cols = items.length >= 5 ? 3 : 2;
    return '<div class="p-figs c' + cols + '">' + items.map(function (it) {
      return '<figure>' +
        '<div class="box"><img src="' + esc(it.src) + '" alt="' + esc(it.alt) + '"></div>' +
        (it.caption ? '<figcaption>' + esc(it.caption) + '</figcaption>' : '') +
      '</figure>';
    }).join('') + '</div>';
  }

  function sheet(inner, cls) {
    return '<div class="sheet ' + (cls || '') + '">' + inner + '</div>';
  }

  function boot() {
    if (!B.contentOk(C)) return;
    var t = C.team, h = C.hero;
    document.title = 'FRC ' + t.number + ' ' + t.name + ' — ' + t.season + ' Technical Binder (print)';
    var root = document.documentElement;
    if (t.accent) root.style.setProperty('--accent', t.accent);

    var numbered = B.numbered(C.sections);

    // Sections marked `print: false` (e.g. a video with nothing on paper)
    // don't get a sheet and don't appear in the table of contents. Section
    // numbers (used in the eyebrow) still reflect the full binder order —
    // only the printed page numbers are renumbered around the gaps.
    var printable = numbered.filter(function (s) { return s.print !== false; });
    printable.forEach(function (s, i) { s.page = i + 3; }); // cover=p1, contents=p2

    var pages = [];

    // Cover — page 1
    var byId = {};
    numbered.forEach(function (s) { byId[s.id] = s; });

    // Hero image with its callouts as a numbered legend — same labels as
    // the website's hover rail, just laid flat since paper can't hover.
    var heroBlock = '';
    if (h && h.image) {
      var dots = (h.callouts || []).map(function (c, i) {
        return '<span class="cover-hero-dot" style="left:' + c.x + '%;top:' + c.y + '%">' + (i + 1) + '</span>';
      }).join('');
      var legend = (h.callouts || []).map(function (c, i) {
        var s = byId[c.id];
        var name = s ? s.title : c.id;
        return '<div class="item"><b>' + (i + 1) + '</b><span><b>' + esc(name) + '</b> — ' + fmt(c.blurb) + '</span></div>';
      }).join('');
      heroBlock =
        '<div class="cover-hero-wrap">' +
          '<img class="cover-hero" src="' + esc(h.image) + '" alt="' + esc(h.alt || '') + '">' +
          dots +
        '</div>' +
        '<div class="cover-legend">' + legend + '</div>';
    }

    pages.push(sheet(
      '<div class="cover-head">' +
        (t.logo ? '<img class="logo" src="' + esc(t.logo) + '" alt="">' : '') +
        '<span class="n">' + esc(t.number) + '</span>' +
        '<span class="name">' + esc(t.name) + '</span>' +
        '<span class="tag">' + esc(t.season) + ' Binder</span>' +
      '</div>' +
      '<div class="cover-body">' +
        '<p class="kicker">Team ' + esc(t.number) + ' · ' + esc(t.name) + ' · ' + esc(t.season) + '</p>' +
        '<h1>' + esc(t.robot) + '</h1>' +
        '<div class="rule"></div>' +
        '<p class="sub">' + fmt(t.tagline) + '</p>' +
        heroBlock +
      '</div>', 'cover'));

    // Contents — page 2. Sections start on page 3.
    var toc = C.categories.map(function (cat) {
      var rows = printable.filter(function (s) { return s.category === cat.id; }).map(function (s) {
        return '<div class="row"><span class="n">' + pad(s.n) + '</span>' +
               '<span>' + esc(s.title) + '</span><span class="d"></span>' +
               '<span class="pg">p' + s.page + '</span></div>';
      }).join('');
      return rows ? '<div class="grp">' + esc(cat.label) + '</div>' + rows : '';
    }).join('');

    pages.push(sheet('<div class="p-toc"><h2>Contents</h2>' + toc + '</div>' +
      '<div class="p-foot"><span>' + esc(t.number) + ' · ' + esc(t.name) + '</span><span>p2</span></div>'));

    // One sheet per printable section
    printable.forEach(function (s) {
      var cat = C.categories.find(function (c) { return c.id === s.category; });

      var feats = (s.features && s.features.length)
        ? '<div class="p-cols"><div class="p-lab">Features</div>' + B.featureList(s.features, 'p-feat') + '</div>' : '';

      pages.push(sheet(
        '<div class="p-sec">' +
          '<p class="eyebrow">' + esc(cat ? cat.label : '') + ' · ' + pad(s.n) + '</p>' +
          '<h2>' + esc(s.title) + '.</h2>' +
          '<p class="thesis">' + fmt(s.thesis) + '</p>' +
          feats +
          figs(flatten(s)) +
        '</div>' +
        '<div class="p-foot"><span>' + esc(t.number) + ' · ' + esc(s.title) + '</span><span>p' + s.page + '</span></div>'));
    });

    document.getElementById('stack').innerHTML = pages.join('');
    document.getElementById('meta').innerHTML =
      '<b>' + esc(t.number) + '</b> ' + esc(t.name) + ' — ' + esc(t.season) +
      ' Technical Binder · ' + pages.length + ' pages';
    document.getElementById('print-btn').addEventListener('click', function () { window.print(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
