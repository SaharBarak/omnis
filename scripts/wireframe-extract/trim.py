"""Trim a captured wireframe to its card frame, in place.

usage: python3 -I trim.py <png>...

The card's outer margin is near-white; video bleed outside it is not. Keeps
the longest run of rows whose left and right edges are mostly near-white.
"""
import sys

from PIL import Image

EDGE = 12
WHITE = 225


def inside(px, width, y):
    edge = [px[x, y] for x in range(min(EDGE, width))] + [px[x, y] for x in range(max(0, width - EDGE), width)]
    return sum(1 for p in edge if min(p) > WHITE) >= len(edge) * 0.5


def longest_run(flags):
    best, start = (0, 0), None
    for i, flag in enumerate(flags + [False]):
        if flag and start is None:
            start = i
        elif not flag and start is not None:
            if i - start > best[1] - best[0]:
                best = (start, i)
            start = None
    return best


for path in sys.argv[1:]:
    im = Image.open(path).convert("RGB")
    px = im.load()
    top, bottom = longest_run([inside(px, im.width, y) for y in range(im.height)])
    im.crop((0, top, im.width, bottom)).save(path)
    print(path, top, bottom)
