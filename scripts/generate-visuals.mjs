#!/usr/bin/env node
/**
 * generate-visuals.mjs — synthesize dynamic, copyright-safe b-roll ENTIRELY with ffmpeg.
 * No network, no API key, no copyrighted footage: procedural energy/plasma/fractal/
 * lightning/ember shots, each color-graded (glow + vignette + contrast) and opening on a
 * quick white flash so hard cuts land like beat hits. This is the "always works" visual
 * source for the 鬼灭 factory when stock/AI are unavailable.
 *
 * Usage:
 *   node scripts/generate-visuals.mjs --outdir kimetsu/assets/<date> [--w 720] [--h 1280]
 * Writes c1..cN.mp4 (durations baked in) ready to reference from a manifest.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const ffmpeg = createRequire(import.meta.url)('ffmpeg-static');
const args = parseArgs(process.argv.slice(2));
const outdir = args.outdir || 'kimetsu/assets/visuals';
const W = +args.w || 720;
const H = +args.h || 1280;
if (!existsSync(outdir)) mkdirSync(outdir, { recursive: true });

// Common cinematic grade + white-flash-in, appended to every look. One in → one out.
const GRADE =
  'format=rgb24,split[a][b];[b]gblur=sigma=14[g];[a][g]blend=all_mode=screen,' +
  'eq=contrast=1.2:saturation=1.45:brightness=0.02,vignette=PI/4.5,' +
  'fade=t=in:st=0:d=0.1:color=white,format=yuv420p';

const geq = (r, g, b) => `geq=r='${r}':g='${g}':b='${b}'`;
const R = `hypot(X-${W / 2}\\,Y-${H / 2})`; // distance from center (escaped comma for geq)

// Each clip: a distinct animated "look" + duration. Mostly geq fields (math → motion).
const clips = [
  { src: `nullsrc=s=${W}x${H}:r=30`, look: geq('40+80*sin(X/50+T*1.5)', '12+18*sin(Y/40+T)', '8+14*sin((X+Y)/60+T)'), dur: 3.5 }, // ember (hook bg)
  { src: `mandelbrot=s=${W}x${H}:r=30`, look: null, dur: 2.6 }, // fractal zoom (already colorful)
  { src: `nullsrc=s=${W}x${H}:r=30`, look: geq('120+120*sin(X/30+T*3)', '30+45*sin(Y/25+T*3.3)', '10+15*sin(X/40+T*2)'), dur: 2.4 }, // fire
  { src: `nullsrc=s=${W}x${H}:r=30`, look: geq('10+20*sin(X/50+T)', '80+120*sin(Y/30+T*2.5)', '120+130*sin((X+Y)/40+T*2)'), dur: 2.6 }, // electric blue
  { src: `life=s=${Math.round(W / 2)}x${Math.round(H / 2)}:r=30:ratio=0.4:mold=8:life_color=0xff7a18:death_color=0x0a0a12`, look: `scale=${W}:${H}`, dur: 2.4 }, // organic embers
  { src: `nullsrc=s=${W}x${H}:r=30`, look: geq(`60+90*sin(${R}/25-T*6)`, '20', `95+90*sin(${R}/25-T*6)`), dur: 2.6 }, // purple radial pulse
  { src: `cellauto=s=${W}x${H}:r=30:rule=30`, look: 'format=gray,pseudocolor=preset=magma', dur: 2.4 }, // automata texture
  { src: `nullsrc=s=${W}x${H}:r=30`, look: geq('15+20*sin(X/40+T)', '110+120*sin((X+Y)/45+T*2)', '90+90*sin(Y/40+T*1.5)'), dur: 2.6 }, // teal plasma
  { src: `nullsrc=s=${W}x${H}:r=30`, look: `${geq('128+120*sin(X/35+T*2)', '20', '128+120*sin(Y/35+T*2)')},rgbashift=rh=8:bh=-8`, dur: 2.4 }, // magenta glitch
  { src: `nullsrc=s=${W}x${H}:r=30`, look: geq('128+127*sin(X/40+3*sin(Y/80+T)+T*2)', '30', '128+127*sin(Y/40+3*sin(X/80+T))'), dur: 2.6 }, // swirl
  { src: `nullsrc=s=${W}x${H}:r=30`, look: geq(`180+70*sin(${R}/15-T*10)`, `150+90*sin(${R}/15-T*10)`, '40'), dur: 2.4 }, // gold burst (climax)
  { src: `gradients=s=${W}x${H}:c0=0x07201c:c1=0xf0b429:d=3:speed=0.05`, look: null, dur: 2.8 }, // calm resolve
  { src: `gradients=s=${W}x${H}:c0=0x05060a:c1=0x1a2433:d=4:speed=0.03`, look: null, dur: 3.3 }, // dark end card
];

let ok = 0;
clips.forEach((c, i) => {
  const out = join(outdir, `c${i + 1}.mp4`);
  const vf = (c.look ? c.look + ',' : '') + GRADE;
  try {
    execFileSync(ffmpeg, ['-y', '-f', 'lavfi', '-i', c.src, '-vf', vf, '-t', String(c.dur), '-r', '30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', out], { stdio: ['ignore', 'ignore', 'ignore'] });
    console.log(`✓ c${i + 1}.mp4 (${c.dur}s)`);
    ok += 1;
  } catch (e) {
    console.error(`✗ c${i + 1} failed: ${e.message.split('\n')[0]}`);
  }
});
console.log(`Done: ${ok}/${clips.length} clips in ${outdir}`);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) if (argv[i].startsWith('--')) { out[argv[i].slice(2)] = argv[i + 1]; i += 1; }
  return out;
}
