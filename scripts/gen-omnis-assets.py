#!/usr/bin/env python3
import json, base64, os, ssl, time, sys
import urllib.request

API_KEY = os.environ.get("GOOGLE_API_KEY", "")
BASE = "/Users/moon/workspace/omnis/public/images/landing"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

IMAGES = [
    ("hero/hero-bg.png",
     "Dark cosmic background with nebula swirls in deep indigo and violet, tiny scattered stars, faint sacred geometry flower of life pattern overlay. Very dark moody mystical atmosphere. Wide cinematic composition. No text no people no watermarks."),
    
    ("systems/dreamspell.png",
     "Abstract artistic illustration of the Mayan Dreamspell calendar. A circular 260-day Tzolkin grid with colorful Mayan day seals arranged in concentric rings. Cosmic colors - deep purple, gold, turquoise. Dark background. Mystical and beautiful. No text."),
    
    ("systems/astrology.png",
     "Abstract artistic illustration of a natal astrology chart. A zodiac wheel with 12 house divisions, planetary glyphs scattered around. Celestial deep blue and gold color scheme. Dark background. Mystical and elegant. No text."),
    
    ("systems/human-design.png",
     "Abstract artistic illustration of a Human Design bodygraph. A geometric figure with 9 connected energy centers (triangles and squares) connected by channels. Sacred geometry vibes. Purple and gold on dark background. Mystical. No text."),
    
    ("systems/gematria.png",
     "Abstract artistic illustration of Hebrew Kabbalistic gematria. The Tree of Life Etz Chaim with 10 sefirot connected by 22 paths. Hebrew letters floating around. Gold and deep indigo. Dark mystical background. No text."),
    
    ("steps/step-01.png",
     "Clean minimal illustration of a cosmic calendar date picker. A floating date input with stars and constellation lines around it. Soft indigo and white. Dark background. Modern UI feel but mystical. No text."),
    
    ("steps/step-02.png",
     "Clean minimal illustration showing multiple wisdom systems overlapping - astrology chart, bodygraph, Mayan calendar, Tree of Life - all layered transparently. Data visualization feel. Indigo and gold. Dark background. No text."),
    
    ("steps/step-03.png",
     "Clean minimal illustration of a cosmic profile timeline. Multiple user profile cards floating with constellation connections between them. Tracking and saving concept. Soft purple glow. Dark background. No text."),
]

def gen_imagen(prompt, filename):
    """Try Imagen 4.0"""
    path = os.path.join(BASE, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key={API_KEY}"
    payload = json.dumps({
        "instances": [{"prompt": prompt}],
        "parameters": {"sampleCount": 1, "aspectRatio": "16:9" if "hero" in filename else "4:3"}
    }).encode()
    
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=90)
        data = json.loads(resp.read())
        for pred in data.get("predictions", []):
            if "bytesBase64Encoded" in pred:
                img = base64.b64decode(pred["bytesBase64Encoded"])
                with open(path, "wb") as f:
                    f.write(img)
                print(f"✓ [imagen] {filename} ({len(img)//1024}KB)")
                return True
        print(f"  [imagen] no image data for {filename}")
        return False
    except Exception as e:
        print(f"  [imagen] {filename}: {e}")
        return False

def gen_gemini(prompt, filename):
    """Fallback to Gemini flash image gen"""
    path = os.path.join(BASE, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key={API_KEY}"
    payload = json.dumps({
        "contents": [{"parts": [{"text": f"Generate an image: {prompt}"}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
    }).encode()
    
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=90)
        data = json.loads(resp.read())
        for c in data.get("candidates", []):
            for p in c.get("content", {}).get("parts", []):
                if "inlineData" in p:
                    img = base64.b64decode(p["inlineData"]["data"])
                    with open(path, "wb") as f:
                        f.write(img)
                    print(f"✓ [gemini] {filename} ({len(img)//1024}KB)")
                    return True
        print(f"  [gemini] no image for {filename}")
        return False
    except Exception as e:
        print(f"  [gemini] {filename}: {e}")
        return False

for filename, prompt in IMAGES:
    path = os.path.join(BASE, filename)
    if os.path.exists(path):
        print(f"⏭ {filename} already exists, skipping")
        continue
    
    print(f"→ Generating {filename}...")
    
    # Try imagen first, fallback to gemini
    if not gen_imagen(prompt, filename):
        time.sleep(5)
        gen_gemini(prompt, filename)
    
    time.sleep(8)  # Generous rate limit buffer

print("\nDone!")
for filename, _ in IMAGES:
    path = os.path.join(BASE, filename)
    if os.path.exists(path):
        sz = os.path.getsize(path) // 1024
        print(f"  ✓ {filename} ({sz}KB)")
    else:
        print(f"  ✗ {filename} MISSING")
