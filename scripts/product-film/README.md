# Product film

Section 2 of the bento home (docs/redesign/BENTO_SITE.md, "Product film").
Real screens of the running app, one camera move per shot, rendered with
Remotion. A standalone package: it is not a workspace and adds nothing to
the app's dependencies.

1. Run the app (`npx next dev -p 3200`).
2. Capture the screens at 2x into `public/`:
   `node capture.mjs public http://localhost:3200`
   (`CHROME_PATH` overrides the Chrome binary.)
3. `npm ci`, then `npm run render:mp4` and `npm run render:webm`.
4. Copy `out/product-film.{mp4,webm}` to `public/videos/redesign/` in the app
   and a frame-0 still to `public/images/redesign/product-film-poster.webp`.
   Re-encode the MP4 to `yuv420p` with `-movflags +faststart` if the render
   reports full-range colour.

Shots, timings and captions live in `src/ProductFilm.tsx`. Captions follow
the site's copy rules.
