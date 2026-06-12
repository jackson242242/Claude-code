# Alexandra Huang — Art Portfolio

A standalone, zero-dependency static portfolio site (single `index.html` + images).
Not part of the Matchday26 app — just open `index.html` in a browser, or serve the
folder from any static host (GitHub Pages, Render static site, Netlify…).

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
