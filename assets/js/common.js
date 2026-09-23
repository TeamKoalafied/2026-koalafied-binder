/* ============================================================
   Shared helpers for binder.js and print.js.
   Loaded after content.js and before either renderer.
   ============================================================ */

window.Binder = (function () {
  'use strict';

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

  function featureList(items, cls) {
    return '<ul class="' + cls + '">' + items.map(function (f) {
      var kids = (f.children && f.children.length)
        ? '<ul>' + f.children.map(function (k) { return '<li>' + fmt(k) + '</li>'; }).join('') + '</ul>'
        : '';
      return '<li>' + fmt(f.text) + kids + '</li>';
    }).join('') + '</ul>';
  }

  // True when a carousel's items carry more than one distinct tag, i.e. when
  // the tags actually distinguish something rather than repeating one label.
  function mixedTags(items) {
    var seen = [];
    items.forEach(function (it) {
      if (it.tag && seen.indexOf(it.tag) < 0) seen.push(it.tag);
    });
    return seen.length > 1;
  }

  // Number sections in document order, like a printed binder.
  function numbered(sections) {
    return sections.map(function (s, i) {
      var c = Object.create(s); c.n = i + 1; return c;
    });
  }

  // Returns false (and replaces the page with an explanation) when
  // content.js is missing or broken, so neither renderer half-draws.
  function contentOk(C) {
    if (C && C.team && Array.isArray(C.sections) && C.sections.length) return true;
    document.body.innerHTML =
      '<div class="boom"><h2>Binder could not load</h2>' +
      '<p>content.js did not define window.BINDER_CONTENT with a non-empty "sections" list.</p>' +
      '<p style="margin-top:10px;color:var(--ink-3)">Check <code>content.js</code> ' +
      'for a syntax error — a missing comma or bracket will do this. ' +
      'Open your browser console for the exact line.</p></div>';
    return false;
  }

  return { esc: esc, fmt: fmt, pad: pad, featureList: featureList, mixedTags: mixedTags, numbered: numbered, contentOk: contentOk };
})();
