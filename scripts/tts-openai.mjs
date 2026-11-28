#!/usr/bin/env node
/**
 * Generate a voiceover MP3 from a text file via the OpenAI TTS API (contract C7).
 * Same CLI as scripts/elevenlabs-tts.mjs, so it is a drop-in fallback once the paid
 * ElevenLabs credits are gone.
 *
 * WHEN TO USE (decision D3/D4, 2026-10-17): only when config longform.voice is "openai",
 * i.e. after the owner has said yes to OpenAI narration (~$0.2 per episode). The default
 * fallback is "none" ($0: no narration). Pay per use, no subscription.
 * OpenAI's usage policy requires telling listeners the voice is AI-generated: keep the
 * "AI narration" disclosure in the description.
 *
 * Prerequisites: OPENAI_API_KEY in the environment (a secret; never paste it into chat),
 * NODE_USE_ENV_PROXY=1 in this container, ffmpeg on PATH.
 *
 * Usage:
 *   NODE_USE_ENV_PROXY=1 node scripts/tts-openai.mjs \
 *     --text-file automation/youtube/runs/<id>/voiceover.txt --out automation/youtube/runs/<id>/vo.mp3 \
 *     [--voice marin] [--model gpt-4o-mini-tts] [--instructions "<delivery notes>"] [--qa on|off]
 *
 *   --voice         OpenAI voice (default marin; cedar is the other tested option). An
 *                   ElevenLabs voice ID falls back to marin with a note.
 *   --model         gpt-4o-mini-tts (default) | tts-1 | tts-1-hd. Any other value (e.g. an
 *                   ElevenLabs model ID) falls back to gpt-4o-mini-tts.
 *   --instructions  delivery notes, gpt-4o-mini-tts only. Default: "warm documentary narrator,
 *                   about 140 words per minute, a short pause between sentences".
 *   --speed <0.25-4>  tts-1 / tts-1-hd only (measured: no effect on gpt-4o-mini-tts, whose pace
 *                   is set through --instructions).
 *   --pause-ms      gap between paragraphs (default 600).   --max-chunk  chars (default 1500).
 *   --lufs          target integrated loudness, e.g. -16 (off by default).
 *   --qa on|off     (default on) each chunk is transcribed with whisper-1 and compared with its
 *                   text; a chunk whose word error rate is over --qa-max-wer (default 0.10) is
 *                   regenerated once, then reported on stderr. About $0.05 per 8-minute script.
 *                   On by default on purpose: it catches broken audio (the 2026-10-17 ElevenLabs
 *                   take was untranscribable). A chunk whose transcription fails is reported
 *                   as "QA skipped" and the summary says "QA incomplete" (never a fake 0% WER).
 *   --stability/--similarity/--style are ElevenLabs settings: accepted and ignored, so
 *   existing commands keep working.
 *
 * Long texts are split on paragraph boundaries (sentence boundaries for oversized
 * paragraphs); each chunk's own edge silence is trimmed and a uniform pause is put between
 * paragraphs. Output: MP3, 44.1 kHz, 128 kbps, mono (the format elevenlabs-tts.mjs writes).
 * Approximate cost at OpenAI list prices: gpt-4o-mini-tts ~$0.015 per audio minute,
 * whisper-1 $0.006 per minute (printed after each run as an estimate).
 */
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const OPENAI_VOICES = ['alloy', 'ash', 'ballad', 'cedar', 'coral', 'echo', 'fable', 'marin', 'nova', 'onyx', 'sage', 'shimmer', 'verse'];
const OPENAI_MODELS = ['gpt-4o-mini-tts', 'tts-1', 'tts-1-hd'];
const SR = 24000; // OpenAI "pcm" output: 24 kHz, 16-bit, mono
const DEFAULT_VOICE = 'marin';
const DEFAULT_INSTRUCTIONS = 'warm documentary narrator, about 140 words per minute, a short pause between sentences';
// Number words for the QA transcript comparison (whisper writes digits, scripts spell them out).
const ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ');
const TENS = '_ _ twenty thirty forty fifty sixty seventy eighty ninety'.split(' ');
const ORD = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) fail('Missing OPENAI_API_KEY (add it as an environment secret; never paste it into chat).');

const args = parseArgs(process.argv.slice(2));
const textFile = args['text-file'];
const outFile = args.out;
if (!textFile || !outFile) {
  fail('Usage: node scripts/tts-openai.mjs --text-file <txt> --out <mp3> [--voice <name>] [--model <id>] [--instructions "..."] [--qa on|off]');
}
const pauseMs = Number(args['pause-ms'] ?? 600);
const maxChunk = Number(args['max-chunk'] ?? 1500);
const speed = args.speed ? Number(args.speed) : undefined;
for (const k of ['stability', 'similarity', 'style']) {
  if (args[k] !== undefined) process.stderr.write(`Note: --${k} is an ElevenLabs setting; ignored by tts-openai.\n`);
}
const model = OPENAI_MODELS.includes(args.model) ? args.model : 'gpt-4o-mini-tts';
if (args.model && !OPENAI_MODELS.includes(args.model)) process.stderr.write(`Note: model ${args.model} is not an OpenAI TTS model; using ${model}.\n`);
const requested = (args.voice || '').toLowerCase();
const voice = OPENAI_VOICES.includes(requested) ? requested : DEFAULT_VOICE;
if (requested && voice !== requested) process.stderr.write(`Note: voice "${args.voice}" is not an OpenAI voice; using ${voice}.\n`);
const instructions = model === 'gpt-4o-mini-tts' ? (args.instructions || DEFAULT_INSTRUCTIONS) : undefined;
const qa = !['off', 'false', '0', 'no'].includes(String(args.qa ?? 'on').toLowerCase());
const maxWer = Number(args['qa-max-wer'] ?? 0.1);

const text = (await readFile(textFile, 'utf8')).trim();
if (!text) fail(`Voiceover text file is empty: ${textFile}`);
const paragraphs = text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);

// ---------------------------------------------------------------- synthesis (+ QA)
const chunks = chunkParagraphs(paragraphs, maxChunk);
const pcmParts = [];
let worst = null; // worst WER over the chunks that were actually transcribed
let qaSkipped = 0; // chunks whose transcription failed (no WER known)
let ttsSeconds = 0;
let qaSeconds = 0;
for (let i = 0; i < chunks.length; i++) {
  const c = chunks[i];
  process.stderr.write(`TTS chunk ${i + 1}/${chunks.length} (${c.text.length} chars)...`);
  let pcm = await speech(c.text);
  ttsSeconds += pcm.length / SR;
  if (qa) {
    let w = await chunkWer(pcm, c.text);
    if (w !== null) qaSeconds += pcm.length / SR;
    if (w !== null && w > maxWer) {
      process.stderr.write(` WER ${(w * 100).toFixed(1)}% > ${(maxWer * 100).toFixed(0)}%, regenerating...`);
      const pcm2 = await speech(c.text);
      ttsSeconds += pcm2.length / SR;
      const w2 = await chunkWer(pcm2, c.text);
      if (w2 !== null) qaSeconds += pcm2.length / SR;
      if (w2 !== null && w2 < w) { pcm = pcm2; w = w2; }
      if (w > maxWer) process.stderr.write(`\nWARNING: chunk ${i + 1} still has WER ${(w * 100).toFixed(1)}% - listen to it before publishing.\n`);
    }
    if (w === null) {
      qaSkipped++;
      process.stderr.write(` ok (${(pcm.length / SR).toFixed(1)}s, QA skipped: transcription failed - listen to this chunk)\n`);
    } else {
      worst = Math.max(worst ?? 0, w);
      process.stderr.write(` ok (${(pcm.length / SR).toFixed(1)}s, WER ${(w * 100).toFixed(1)}%)\n`);
    }
  } else {
    process.stderr.write(` ok (${(pcm.length / SR).toFixed(1)}s)\n`);
  }
  pcmParts.push({ pcm, paraEnd: c.paraEnd });
}

// Join chunks: trim each chunk's own leading/trailing silence, then put a uniform pause
// between paragraphs so the rhythm does not depend on where the chunks were cut.
const gap = new Int16Array(Math.round((SR * pauseMs) / 1000));
const pieces = [];
for (const { pcm, paraEnd } of pcmParts) {
  pieces.push(trimSilence(pcm));
  pieces.push(paraEnd ? gap : new Int16Array(Math.round(SR * 0.25)));
}
pieces.pop();
const total = pieces.reduce((n, p) => n + p.length, 0);
const all = new Int16Array(total);
let off = 0;
for (const p of pieces) { all.set(p, off); off += p.length; }

await mkdir(dirname(outFile), { recursive: true });
const tmp = await mkdtemp(join(tmpdir(), 'tts-openai-'));
try {
  const raw = join(tmp, 'all.pcm');
  await writeFile(raw, Buffer.from(all.buffer));
  const af = args.lufs ? ['-af', `loudnorm=I=${Number(args.lufs)}:TP=-1.5:LRA=11`] : [];
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 's16le', '-ar', String(SR), '-ac', '1', '-i', raw, ...af,
    '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '128k', outFile], { encoding: 'utf8' });
  if (r.status !== 0) fail(`ffmpeg failed: ${r.stderr || r.error}`);
} finally {
  await rm(tmp, { recursive: true, force: true });
}
const cost = (ttsSeconds / 60) * 0.015 + (qaSeconds / 60) * 0.006;
const qaTxt = !qa ? ', QA off'
  : worst === null ? `, QA incomplete: no chunk could be transcribed (${qaSkipped}/${pcmParts.length}) - listen before publishing`
  : `, worst chunk WER ${(worst * 100).toFixed(1)}%${qaSkipped ? ` (QA incomplete: ${qaSkipped}/${pcmParts.length} chunk(s) not transcribed)` : ''}`;
console.log(`Wrote ${outFile} (${(total / SR).toFixed(1)}s, ${pcmParts.length} chunk(s), openai ${model}/${voice}${qaTxt}; est. cost ~$${cost.toFixed(3)})`);

// ---------------------------------------------------------------- OpenAI calls
async function speech(input, attempt = 1) {
  const body = { model, voice, input, response_format: 'pcm', ...(instructions ? { instructions } : {}), ...(speed ? { speed } : {}) };
  let res;
  try {
    res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { authorization: `Bearer ${API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (attempt <= 4) return retry(e.message);
    fail(`OpenAI request failed: ${e.message} (in this container set NODE_USE_ENV_PROXY=1)`);
  }
  if ((res.status === 429 || res.status >= 500) && attempt <= 4) return retry(`HTTP ${res.status}`);
  if (!res.ok) fail(`OpenAI TTS error ${res.status}: ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 2)).slice();
  async function retry(why) {
    const wait = 2 ** attempt * 1000;
    process.stderr.write(`\nOpenAI ${why}; retrying in ${wait / 1000}s...`);
    await new Promise((r) => setTimeout(r, wait));
    return speech(input, attempt + 1);
  }
}

/** Word error rate of one chunk against its text, or null when it could not be transcribed. */
async function chunkWer(pcm, refText, attempt = 1) {
  const form = new FormData();
  form.append('model', 'whisper-1');
  form.append('language', 'en');
  form.append('temperature', '0');
  form.append('file', new Blob([wav(pcm)], { type: 'audio/wav' }), 'chunk.wav');
  let res;
  try {
    res = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { authorization: `Bearer ${API_KEY}` }, body: form });
  } catch (e) {
    res = { ok: false, status: `network (${e.message})` };
  }
  if (!res.ok) {
    if (attempt <= 3) { await new Promise((r) => setTimeout(r, 2 ** attempt * 1000)); return chunkWer(pcm, refText, attempt + 1); }
    process.stderr.write(` (QA transcription failed: HTTP ${res.status})`);
    return null;
  }
  let hyp;
  try { ({ text: hyp } = await res.json()); } catch (e) {
    process.stderr.write(` (QA transcription unreadable: ${e.message})`);
    return null;
  }
  return wordErrorRate(normWords(refText), normWords(hyp || ''));
}

// ---------------------------------------------------------------- helpers
function chunkParagraphs(paras, max) {
  const out = [];
  let cur = '';
  const push = (paraEnd) => { if (cur.trim()) out.push({ text: cur.trim(), paraEnd }); cur = ''; };
  for (const p of paras) {
    if (p.length <= max) {
      out.push({ text: p, paraEnd: true });
      continue;
    }
    for (const s of p.split(/(?<=[.!?])\s+/)) {
      if (cur && (cur + ' ' + s).length > max) push(false);
      cur += (cur ? ' ' : '') + s;
    }
    push(true);
  }
  return out;
}

function trimSilence(pcm, thresh = 200, marginMs = 40) {
  const m = Math.round((SR * marginMs) / 1000);
  let a = 0;
  let b = pcm.length - 1;
  while (a < pcm.length && Math.abs(pcm[a]) < thresh) a++;
  while (b > a && Math.abs(pcm[b]) < thresh) b--;
  if (a >= b) return pcm;
  return pcm.slice(Math.max(0, a - m), Math.min(pcm.length, b + m));
}

function wav(pcm) {
  const h = Buffer.alloc(44);
  const len = pcm.length * 2;
  h.write('RIFF', 0); h.writeUInt32LE(36 + len, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(len, 40);
  return Buffer.concat([h, Buffer.from(pcm.buffer, pcm.byteOffset, len)]);
}

function numWords(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  return String(n);
}
function ordinal(n) {
  const w = numWords(n).split(' ');
  const last = w.pop();
  w.push(ORD[last] || (last.endsWith('y') ? last.slice(0, -1) + 'ieth' : last + 'th'));
  return w.join(' ');
}
function normWords(t) {
  return t.toLowerCase().replace(/[’‘]/g, "'")
    .replace(/(\d+)(st|nd|rd|th)\b/g, (_, d) => ordinal(Number(d)))
    .replace(/\d+/g, (d) => numWords(Number(d)))
    .replace(/xi'an/g, 'xian').replace(/[-—–]/g, ' ')
    .replace(/[^a-z' ]/g, ' ').replace(/'/g, '')
    .split(/\s+/).filter(Boolean);
}
function wordErrorRate(r, h) {
  let prev = Array.from({ length: h.length + 1 }, (_, j) => j);
  for (let i = 1; i <= r.length; i++) {
    const cur = [i];
    for (let j = 1; j <= h.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (r[i - 1] === h[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[h.length] / Math.max(1, r.length);
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
  }
  return o;
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}
