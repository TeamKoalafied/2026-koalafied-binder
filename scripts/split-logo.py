#!/usr/bin/env python3
"""Splits assets/img/logo.svg into the two layers the nav mark stacks.

logo-gear.svg  the teal sprocket ring (+ its navy tooth shadows)
logo-core.svg  everything else: yellow disc, koala, 6996/FRC banners

Both are written with the same square viewBox centred on the gear's axis, so
stacking them reproduces logo.svg exactly and the gear layer can be spun with
transform-origin: 50% 50%. See "Nav mark" in README.md.

Run after re-exporting logo.svg:  python3 scripts/split-logo.py
"""

import math
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "img", "logo.svg")

# The artwork is drawn back to front, so the gear is simply the first paths
# laid down — ring halves, tooth shadows, ring shading — minus the two navy
# banner plates that sit on top of it. Indices, not colours: the koala face is
# the same teal as the ring. EXPECT_FILLS below makes a re-export that shifts
# these fail loudly instead of splitting in the wrong place.
GEAR = [0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
EXPECT_FILLS = {
    0: "#44A5A7", 1: "#44a5a7", 2: "#252636", 3: "#272838",
    12: "#44A5A7", 13: "#3B667A", 14: "#3E6A7B", 15: "#FECF02",
}

# Gear axis in source viewBox units, measured from the rendered alpha bbox of
# the ring alone; rotating about it holds the centre to ~1px across a sweep.
CX, CY, R = 560.0, 555.5, 560.0
VIEWBOX = "%g %g %g %g" % (CX - R, CY - R, R * 2, R * 2)

# The artwork only drew ring where the banners would not cover it, so the ring
# is a C with two arcs missing — fine at rest, but they swing into view once it
# turns. The teeth repeat every 45 degrees, so a copy rotated by 90 lands tooth
# on tooth (measured: 2.8px mean radial mismatch, the best of any angle that
# covers both gaps) and each gap can be patched from it. Clipping the copy to
# just the gaps keeps the tooth shadows single rather than doubling them over
# the ring that is already there. Angles are degrees clockwise from +x, read
# off a render of the ring; PAD overlaps the seams so they cannot hairline.
GAPS = [(32.0, 82.5), (212.5, 264.0)]
PHI = 90.0
PAD = 0.75


def fill_of(path):
    m = re.search(r'\bfill="([^"]*)"', path)
    return m.group(1) if m else None


# Inkscape writes 6 decimals. The mark is drawn at 26px from a 1120-unit
# viewBox, so 2 decimals is already ~1e-4 px of error — invisible, and it takes
# roughly a third off the file. Only coordinates are touched, never structure.
NUM = re.compile(r"-?\d+\.\d+(?:[eE][-+]?\d+)?")


def shorten(m):
    v = round(float(m.group()), 2)
    return ("%.2f" % v).rstrip("0").rstrip(".") or "0"


def clean(path):
    """Drop the Inkscape/sodipodi editor attributes; they need namespaces we
    do not declare, and an undeclared prefix makes the file fail to parse."""
    path = re.sub(r'\s+(?:inkscape|sodipodi):[\w-]+="[^"]*"', "", path)
    for attr in ("d", "transform"):
        path = re.sub(
            r'(\b%s=")([^"]*)(")' % attr,
            lambda m: m.group(1) + NUM.sub(shorten, m.group(2)) + m.group(3),
            path,
        )
    return path


def wedge(a0, a1):
    """Pie sector from the gear axis out past the teeth, covering a0..a1."""
    a0, a1 = a0 - PAD, a1 + PAD
    rad = R * 1.4
    x0 = CX + rad * math.cos(math.radians(a0))
    y0 = CY + rad * math.sin(math.radians(a0))
    x1 = CX + rad * math.cos(math.radians(a1))
    y1 = CY + rad * math.sin(math.radians(a1))
    large = 1 if (a1 - a0) % 360 > 180 else 0
    return "M%.2f %.2f L%.2f %.2f A%.2f %.2f 0 %d 1 %.2f %.2f Z" % (
        CX, CY, x0, y0, rad, rad, large, x1, y1)


def write(name, paths, title, seamless=False):
    body = "\n".join(clean(p) for p in paths)
    out = os.path.join(ROOT, "assets", "img", name)
    with open(out, "w") as f:
        # xlink is only declared on the seamless file, which is the only one
        # that uses <use>; both href spellings go out so pre-12 Safari, which
        # predates SVG2's plain href, still resolves the ring.
        f.write('<svg xmlns="http://www.w3.org/2000/svg"%s viewBox="%s">\n'
                "<title>%s</title>\n"
                % (' xmlns:xlink="http://www.w3.org/1999/xlink"' if seamless else "",
                   VIEWBOX, title))
        if seamless:
            ref = 'href="#ring" xlink:href="#ring"'
            f.write(
                "<defs>\n"
                '<clipPath id="gaps"><path d="%s"/></clipPath>\n'
                '<g id="ring">%s</g>\n'
                "</defs>\n"
                "<use %s/>\n"
                '<g clip-path="url(#gaps)"><use %s '
                'transform="rotate(%g %g %g)"/></g>\n'
                % (" ".join(wedge(*g) for g in GAPS), body, ref, ref, PHI, CX, CY))
        else:
            f.write(body + "\n")
        f.write("</svg>\n")
    print("wrote %s (%d paths, %.0f KB)" % (name, len(paths), os.path.getsize(out) / 1024))


def main():
    with open(SRC) as f:
        svg = f.read()

    paths = re.findall(r"<path\b.*?/>", svg, re.S)
    if len(paths) != 138:
        sys.exit("logo.svg has %d paths, expected 138 — re-check GEAR." % len(paths))

    for i, want in EXPECT_FILLS.items():
        got = fill_of(paths[i])
        if got != want:
            sys.exit("path %d is fill=%s, expected %s — logo.svg changed, "
                     "re-derive GEAR before splitting." % (i, got, want))

    gear = [paths[i] for i in GEAR]
    core = [p for i, p in enumerate(paths) if i not in GEAR]
    write("logo-gear.svg", gear, "Gear ring", seamless=True)
    write("logo-core.svg", core, "Koala mark")


if __name__ == "__main__":
    main()
