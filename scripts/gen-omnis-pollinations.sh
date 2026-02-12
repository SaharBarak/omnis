#!/bin/bash
BASE="/Users/moon/workspace/omnis/public/images/landing"
mkdir -p "$BASE/hero" "$BASE/systems" "$BASE/steps"

gen() {
  local file="$1"
  local prompt="$2"
  local w="$3"
  local h="$4"
  local encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$prompt'))")
  echo "→ $file..."
  curl -sL -o "$BASE/$file" "https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&nologo=true&seed=$RANDOM" 
  local sz=$(stat -f%z "$BASE/$file" 2>/dev/null || echo 0)
  if [ "$sz" -gt 1000 ]; then
    echo "  ✓ $(( sz / 1024 ))KB"
  else
    echo "  ✗ failed (${sz} bytes)"
  fi
}

gen "hero/hero-bg.png" \
  "Dark cosmic background nebula swirls deep indigo violet tiny scattered stars faint sacred geometry flower of life pattern overlay very dark moody mystical atmosphere cinematic no text no people no watermarks" \
  1920 1080

gen "systems/dreamspell.png" \
  "Abstract artistic Mayan Dreamspell calendar circular 260-day Tzolkin grid colorful Mayan day seals concentric rings cosmic purple gold turquoise dark background mystical beautiful no text" \
  600 400

gen "systems/astrology.png" \
  "Abstract artistic natal astrology chart zodiac wheel 12 house divisions planetary glyphs celestial deep blue gold dark background mystical elegant no text" \
  600 400

gen "systems/human-design.png" \
  "Abstract artistic Human Design bodygraph geometric figure 9 connected energy centers triangles squares channels sacred geometry purple gold dark background mystical no text" \
  600 400

gen "systems/gematria.png" \
  "Abstract artistic Hebrew Kabbalistic Tree of Life Etz Chaim 10 sefirot 22 paths Hebrew letters gold deep indigo dark mystical background no text" \
  600 400

gen "steps/step-01.png" \
  "Clean minimal cosmic calendar date picker floating date input stars constellation lines soft indigo white dark background modern UI mystical no text" \
  400 300

gen "steps/step-02.png" \
  "Clean minimal multiple wisdom systems overlapping astrology chart bodygraph Mayan calendar Tree of Life layered transparent data visualization indigo gold dark background no text" \
  400 300

gen "steps/step-03.png" \
  "Clean minimal cosmic profile timeline multiple user cards floating constellation connections tracking saving soft purple glow dark background no text" \
  400 300

echo ""
echo "=== Results ==="
for f in hero/hero-bg.png systems/dreamspell.png systems/astrology.png systems/human-design.png systems/gematria.png steps/step-01.png steps/step-02.png steps/step-03.png; do
  if [ -f "$BASE/$f" ] && [ $(stat -f%z "$BASE/$f") -gt 1000 ]; then
    echo "  ✓ $f ($(( $(stat -f%z "$BASE/$f") / 1024 ))KB)"
  else
    echo "  ✗ $f MISSING"
  fi
done
