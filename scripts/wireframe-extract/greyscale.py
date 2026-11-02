"""Re-render colour-coded wireframes as greyscale wireframes.

usage: python3 -I greyscale.py <palette.json> <src-dir> <out-dir> <scale> <in.png=out.png>...

palette.json maps semantic classes to [centroid rgb, target grey, detail gain].
Each pixel goes to its nearest class; the class sets the grey, and the pixel's
deviation from the centroid's luminance is kept (times the gain), so crosses,
labels and anti-aliasing survive.
"""
import json
import os
import sys

from PIL import Image


def luma(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def load_palette(path):
    with open(path) as f:
        return [(tuple(rgb), grey, gain, luma(rgb)) for rgb, grey, gain in json.load(f).values()]


def converter(palette):
    cache = {}

    def to_grey(p):
        if p not in cache:
            _, grey, gain, l0 = min(palette, key=lambda e: sum((a - b) ** 2 for a, b in zip(p, e[0])))
            cache[p] = max(0, min(255, round(grey + (luma(p) - l0) * gain)))
        return cache[p]

    return to_grey


def convert(src, dst, scale, to_grey):
    im = Image.open(src).convert("RGB")
    out = Image.new("L", im.size)
    out.putdata([to_grey(p) for p in im.get_flattened_data()] if hasattr(im, "get_flattened_data") else [to_grey(p) for p in im.getdata()])
    if scale != 1:
        out = out.resize((im.width * scale, im.height * scale), Image.LANCZOS)
    out.save(dst, optimize=True)


if __name__ == "__main__":
    palette_path, src_dir, dst_dir, scale = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
    os.makedirs(dst_dir, exist_ok=True)
    to_grey = converter(load_palette(palette_path))
    for pair in sys.argv[5:]:
        name, out_name = pair.split("=")
        convert(os.path.join(src_dir, name), os.path.join(dst_dir, out_name), scale, to_grey)
        print(out_name)
