#!/usr/bin/env bash
# Screenshots scripts/og-card.html into assets/img/og-cover.png.
# Re-run after changing the robot name, tagline, accent or hero render.
# Needs Chrome. Stays PNG — some link previewers won't load WebP.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/assets/img/og-cover.png"
chrome="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

if [ ! -x "$chrome" ]; then
  echo "Chrome not found at: $chrome" >&2
  echo "Set CHROME=/path/to/chrome and re-run." >&2
  exit 1
fi

# --virtual-time-budget lets the webfonts and hero render land first.
"$chrome" \
  --headless --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 \
  --window-size=1200,630 \
  --virtual-time-budget=4000 \
  --screenshot="$out" \
  "file://$root/scripts/og-card.html" 2>/dev/null

echo "wrote $out"
sips -g pixelWidth -g pixelHeight "$out" | tail -2
echo
echo "If that is not 1200 x 630, update og:image:width / og:image:height in"
echo "index.html and print.html to match."
