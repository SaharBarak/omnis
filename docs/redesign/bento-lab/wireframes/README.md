# Bento reel wireframes (greyscale)

Five layout studies extracted from a bento-hero reel on Instagram
(`instagram.com/reel/Dd9RmqIs0iu`, 9.3 s, 1080×1920). The reel alternates a
colour-coded wireframe with the finished design built on it. Only the
wireframes are kept here, re-rendered in greyscale, as composition references
for BENTO_HERO_LAB.md. They are internal reference material, not site assets.

| File | Layout |
|---|---|
| `reel-01-studio.png` | Headline top-left with inline avatar row, wide media right; date-picker card left, big media centre with stat card |
| `reel-02-apparel.png` | Large notched media top-left holding the headline; stats row; right column of text cards |
| `reel-03-game.png` | Full-width display headline; three-panel media strip; CTA pill and arrow; tall media right with signup card |
| `reel-04-generative.png` | Headline with inline pills; media and card grid below; tall media right |
| `reel-05-notched-media.png` | One dominant media card, notched bottom-left for the headline and top-right for nav; stat card with arrow notch; second media with caption inset. **Basis of `/lab/bento-v2`.** |

`contact-sheet.png` shows all five.

## Greyscale key

| Reel colour | Meaning | Grey |
|---|---|---|
| white | page | 255 |
| blue | media placeholder (crossed) | 236 |
| yellow | card surface | 214 |
| red | text block | 46 |
| grey pill | control | 150 |

## Reproduce

The pipeline lives in `scripts/wireframe-extract/`. The crop box and the colour
key are per-reel data, passed in, never edited into the scripts.

```bash
# 1. frames → distinct layouts (prints groups; frames 87–278 are the stable ones)
scripts/wireframe-extract/run.sh reel.mp4 /tmp/reel-work docs/redesign/bento-lab/wireframes 108,713,972,1207 \
  scripts/wireframe-extract/palette.reel-bento.json

# 2. trim the kept groups to the card, then map to greyscale at 2×
python3 -I scripts/wireframe-extract/trim.py /tmp/reel-work/distinct/L24_108.png ...
python3 -I scripts/wireframe-extract/greyscale.py scripts/wireframe-extract/palette.reel-bento.json \
  /tmp/reel-work/distinct docs/redesign/bento-lab/wireframes 2 L24_108.png=reel-01-studio.png ...
```

The reel itself is not committed. Downloading it needs an Instagram session
(`yt-dlp --cookies-from-browser chrome <url>`).
