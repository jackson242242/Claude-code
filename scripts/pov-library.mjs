#!/usr/bin/env node
/**
 * Read the licensed first-person (POV) footage library and print clips ready for
 * `scripts/assemble-video.mjs --clips <json>`.
 *
 *   node scripts/pov-library.mjs list [--usable] [--china] [--no-city]
 *        [--orientation portrait|landscape] [--json] [--seconds 4] [--crop] [--weak] [--audit]
 *        [--library automation/youtube/assets/pov-library.json]
 *   node scripts/pov-library.mjs blocked [--json]     # the refused YouTube-origin Commons files
 *
 * Filters
 *   --usable       usable === true and pov === 'yes' (weak POV is never "usable")
 *   --china        chinaIdentifiable, or a readFilters.chinaByTitle id (the D-train windows)
 *   --no-city      readFilters.nonCity ids only (the subset used while city POV is not approved)
 *   --orientation  portrait | landscape
 *   --weak         also read the weakPov section (excluded by default; not counted as POV)
 *   --audit        also list AVOID-flagged and blocked entries (never use them; for audits only)
 * Always (unless --audit): entries with an 'AVOID' flag (Tiananmen) and the blocked YouTube-origin
 * Commons files are dropped.
 *
 * Output
 *   default  a table: id, orientation, duration, speakable place, POV type, mood
 *   --json   a --clips-ready JSON array. Each entry has the assembler fields
 *            { id, in, out, label? , cx? } plus provenance: libraryId, place, placeSpeakable,
 *            sayOnly, cxHint, orientation, duration, povType, mood, sourceUrl, license,
 *            attribution, photographer, flags.
 *            id: Pexels "px-<n>"; Commons "wm:File:<title>".
 *            in/out: a --seconds window (default 4) starting at 15% of the clip (the first of the
 *            3 verified frames at 15/50/85%).
 *            label = placeSpeakable (omitted when null: say no place).
 *            cxHint = 0.5 for landscape sources (centre = vanishing point of forward motion; not
 *            checked per clip). --crop copies it into cx, which makes --fit auto cover-crop
 *            instead of framing the 16:9 clip over a blurred fill.
 *   A summary line goes to stderr.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_LIBRARY = resolve(REPO, 'automation/youtube/assets/pov-library.json');

const fail = (msg) => {
  process.stderr.write(`pov-library: ${msg}\n`);
  process.exit(2);
};

const BOOL_FLAGS = new Set(['usable', 'china', 'no-city', 'json', 'crop', 'weak', 'audit', 'help']);
const VALUE_FLAGS = new Set(['orientation', 'seconds', 'library']);

const parseArgs = (argv) => {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      out._.push(a);
      continue;
    }
    const [k, inline] = a.slice(2).split(/=(.*)/s, 2);
    if (BOOL_FLAGS.has(k)) out[k] = true;
    else if (VALUE_FLAGS.has(k)) {
      const v = inline ?? argv[(i += 1)];
      if (v === undefined) fail(`--${k} needs a value`);
      out[k] = v;
    } else fail(`unknown flag --${k}`);
  }
  return out;
};

const isAvoid = (e) => (e.flags || []).some((f) => /^AVOID\b/i.test(String(f)));

const commonsTitle = (e) => String(e.title || '').replace(/^File:/, '');

const blockedSet = (lib) => {
  const files = lib.commonsBlocked_youtubeOrigin?.files || [];
  const set = new Set();
  for (const f of files) {
    if (f.sourceUrl) set.add(f.sourceUrl);
    if (f.title) set.add(String(f.title).replace(/^File:/, ''));
  }
  return set;
};

const isBlocked = (e, blocked) =>
  blocked.has(e.sourceUrl) ||
  (e.source === 'Wikimedia Commons' && blocked.has(commonsTitle(e))) ||
  /youtube/i.test(String(e.origin || ''));

const round1 = (x) => Math.round(x * 10) / 10;

const clipWindow = (duration, seconds) => {
  const d = Number(duration) || seconds;
  const len = Math.min(seconds, Math.max(0.5, d - 0.2));
  const start = Math.max(0, Math.min(d * 0.15, d - len - 0.1));
  return { in: round1(start), out: round1(Math.min(start + len, d - 0.1)) };
};

const toClip = (e, { seconds, crop, sayOnlyIds, sayOnly }) => {
  const isCommons = e.source === 'Wikimedia Commons';
  const id = isCommons ? `wm:File:${commonsTitle(e)}` : e.id;
  const landscape = e.orientation === 'landscape';
  const cxHint = landscape ? 0.5 : null;
  const label = e.placeSpeakable || null;
  return {
    id,
    ...clipWindow(e.duration, seconds),
    ...(label ? { label } : {}),
    ...(crop && cxHint !== null ? { cx: cxHint } : {}),
    libraryId: e.id,
    source: e.source,
    place: e.place ?? null,
    placeSpeakable: e.placeSpeakable ?? null,
    ...(sayOnlyIds.has(e.id) ? { sayOnly } : {}),
    cxHint,
    orientation: e.orientation ?? null,
    duration: e.duration ?? null,
    povType: e.povType ?? null,
    mood: e.mood ?? null,
    verifyNote: e.verifyNote ?? null,
    sourceUrl: e.sourceUrl,
    license: e.license ?? null,
    attribution: e.attribution ?? null,
    photographer: e.photographer ?? null,
    flags: e.flags || [],
  };
};

const pad = (s, n) => {
  const t = String(s ?? '-');
  return t.length >= n ? `${t.slice(0, n - 1)}… ` : t.padEnd(n + 1);
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || 'list';
  if (args.help) {
    process.stdout.write(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
    return;
  }
  const libPath = args.library ? resolve(args.library) : DEFAULT_LIBRARY;
  let lib;
  try {
    lib = JSON.parse(readFileSync(libPath, 'utf8'));
  } catch (err) {
    fail(`cannot read ${libPath}: ${err.message}`);
  }
  const blocked = blockedSet(lib);

  if (cmd === 'blocked') {
    const files = lib.commonsBlocked_youtubeOrigin?.files || [];
    if (args.json) process.stdout.write(`${JSON.stringify(files, null, 2)}\n`);
    else {
      process.stdout.write(`${lib.commonsBlocked_youtubeOrigin?.why || ''}\n`);
      for (const f of files) process.stdout.write(`- ${f.title} (${f.license}, ${f.artist || '?'})\n`);
    }
    process.stderr.write(`${files.length} blocked YouTube-origin Commons files (never used)\n`);
    return;
  }
  if (cmd !== 'list') fail(`unknown command '${cmd}' (use list | blocked)`);

  const orientation = args.orientation;
  if (orientation && !['portrait', 'landscape'].includes(orientation)) fail('--orientation must be portrait or landscape');
  const seconds = args.seconds !== undefined ? Number(args.seconds) : 4;
  if (!(seconds > 0)) fail('--seconds must be a positive number');

  const rf = lib.readFilters || {};
  const chinaByTitle = new Set(rf.chinaByTitle?.ids || []);
  const nonCity = new Set(rf.nonCity?.ids || []);
  if (args['no-city'] && nonCity.size === 0) fail('readFilters.nonCity.ids is missing from the library');

  const pool = [...(lib.clips || []), ...(lib.commons || []), ...(args.weak ? lib.weakPov || [] : [])];
  let dropped = 0;
  const picked = pool.filter((e) => {
    if (!args.audit && (isAvoid(e) || isBlocked(e, blocked))) {
      dropped += 1;
      return false;
    }
    if (args.usable && !(e.usable === true && e.pov === 'yes')) return false;
    if (args.china && !(e.chinaIdentifiable === true || chinaByTitle.has(e.id))) return false;
    if (args['no-city'] && !nonCity.has(e.id)) return false;
    if (orientation && e.orientation !== orientation) return false;
    return true;
  });

  const filters = ['usable', 'china', 'no-city', 'weak', 'audit'].filter((k) => args[k]);
  if (orientation) filters.push(`orientation=${orientation}`);
  process.stderr.write(
    `${picked.length} clip(s) [${filters.join(', ') || 'no filters'}] from ${pool.length} entries; ` +
      `${dropped} AVOID/blocked dropped\n`,
  );

  const opts = { seconds, crop: Boolean(args.crop), sayOnlyIds: chinaByTitle, sayOnly: rf.chinaByTitle?.say || null };
  if (args.json) {
    process.stdout.write(`${JSON.stringify(picked.map((e) => toClip(e, opts)), null, 2)}\n`);
    return;
  }
  process.stdout.write(`${pad('id', 13)}${pad('orient', 10)}${pad('dur', 5)}${pad('say', 17)}${pad('pov', 34)}mood\n`);
  for (const e of picked) {
    const say = e.placeSpeakable || (chinaByTitle.has(e.id) ? `(${rf.chinaByTitle?.say || 'no place'})` : '(no place)');
    const warn = isAvoid(e) ? ' [AVOID]' : isBlocked(e, blocked) ? ' [BLOCKED]' : '';
    process.stdout.write(
      `${pad(e.id, 13)}${pad(e.orientation, 10)}${pad(round1(Number(e.duration) || 0), 5)}${pad(say, 17)}` +
        `${pad(e.povType || e.verifyNote, 34)}${e.mood || ''}${warn}\n`,
    );
  }
};

main();
