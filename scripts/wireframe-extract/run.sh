#!/usr/bin/env bash
# Extract greyscale wireframes from a design reel (docs/redesign/bento-lab/wireframes/README.md).
# usage: scripts/wireframe-extract/run.sh <video> <work-dir> <out-dir> <x0,y0,x1,y1> <palette.json>
# Prints the distinct layout groups; then run trim.py + greyscale.py on the groups you keep.
set -euo pipefail
video=$1 work=$2 out=$3 box=$4 palette=$5
here=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$work/frames" "$out"
ffmpeg -v error -i "$video" "$work/frames/%03d.png"
python3 -I "$here/distinct.py" "$work/frames" "$work/distinct" "$box"
echo "next: python3 -I $here/trim.py <kept pngs>; python3 -I $here/greyscale.py $palette <dir> $out 2 in.png=out.png ..."
