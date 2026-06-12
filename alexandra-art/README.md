# Alexandra Huang — Art Portfolio

A standalone, zero-dependency static portfolio site (single `index.html` + images).
Not part of the Matchday26 app — just open `index.html` in a browser.

No header at all: the only chrome is a dock of five hand-drawn SVG characters
(Pikachu, Tanjiro, Sakuragi, Doraemon, Totoro — original chibi interpretations,
no copyrighted art). Four are category filters, Totoro toggles the music.
The gallery itself is Tyler Hobbs-style: warm cream background, scattered
asymmetric grid with generous whitespace, square-cornered images with no card
chrome, and small tracked-uppercase captions.

## Live URL (Render static site)
`render.yaml` defines a `alexandra-art` static site (rootDir `alexandra-art/`).
It goes live once this lands on the branch the Render Blueprint reads (the
deploy/default branch) and the Blueprint sync is approved in the Render
dashboard — the URL appears there as `https://alexandra-art-<suffix>.onrender.com`.

## Adding a new work
1. Drop the image into `works/` (web-friendly: ≤1600px on the long side, JPG).
2. Add one line to the `WORKS` array at the top of the `<script>` in `index.html`:
   ```js
   { src: 'works/my-new-piece.jpg', title: 'My new piece', cat: 'Sketchbook' },
   ```
3. Categories are defined in `CATEGORIES` (currently: Sketchbook / Studies /
   Visual Notes). Add a new name there and use it in `cat` to create a new category.

## Music
The ♪ button plays a gentle generative "music box" loop built with the Web Audio
API — no audio file, no copyright worries. To use a real track instead, put e.g.
`music.mp3` in this folder and set `const MUSIC_SRC = 'music.mp3';` in `index.html`.
