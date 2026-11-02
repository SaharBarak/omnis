"""Group consecutive video frames into distinct layouts.

usage: python3 -I distinct.py <frames-dir> <out-dir> <x0,y0,x1,y1> [threshold]

Crops every frame to the overlay box, compares a 96x54 greyscale thumbnail with
the previous frame, and starts a new group when the mean absolute difference
exceeds the threshold. Saves the middle frame of each group as LNN_<frame>.png
and prints: group, first frame, last frame, length.
"""
import os
import sys

from PIL import Image, ImageChops, ImageStat


def main(src, out, box, threshold=12.0):
    os.makedirs(out, exist_ok=True)
    prev, groups, run = None, [], []
    for name in sorted(os.listdir(src)):
        small = Image.open(os.path.join(src, name)).convert("L").crop(box).resize((96, 54))
        changed = prev is None or ImageStat.Stat(ImageChops.difference(small, prev)).mean[0] > threshold
        if changed and run:
            groups.append(run)
            run = []
        run.append(name)
        prev = small
    groups.append(run)
    for i, group in enumerate(groups):
        mid = group[len(group) // 2]
        Image.open(os.path.join(src, mid)).convert("RGB").crop(box).save(os.path.join(out, f"L{i:02d}_{mid}"))
        print(i, group[0], group[-1], len(group))


if __name__ == "__main__":
    box = tuple(int(v) for v in sys.argv[3].split(","))
    main(sys.argv[1], sys.argv[2], box, float(sys.argv[4]) if len(sys.argv) > 4 else 12.0)
