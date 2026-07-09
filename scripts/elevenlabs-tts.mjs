#!/usr/bin/env node
/**
 * Generate an AI voiceover MP3 from a text file via the ElevenLabs TTS API.
 *
 * Prerequisites (owner-granted; the script fails clearly without them):
 *   1. ELEVENLABS_API_KEY present in the environment (add as a secret — never in chat).
 *   2. Host `api.elevenlabs.io` on the environment's network allowlist.
 *
 * Usage:
 *   node scripts/elevenlabs-tts.mjs \
 *     --text-file automation/youtube/runs/2026-07-08-a/voiceover.txt \
 *     --out automation/youtube/runs/2026-07-08-a/vo.mp3 \
 *     [--voice 21m00Tcm4TlvDq8ikWAM] [--model eleven_multilingual_v2] \
 *     [--stability 0.45] [--similarity 0.75] [--style 0.35]
 *
 * Voice settings default to a more human, less monotone delivery (lower stability
 * = more expressive variation; style adds performance color). Raise stability
 * toward 0.7 if a voice gets too erratic.
 *
 * Long texts are split on paragraph boundaries into <=2400-char chunks (free/starter
 * tiers cap request size); the MP3 parts are concatenated in order.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  fail(
    'Missing ELEVENLABS_API_KEY.\n' +
      'Add it as an environment secret in your Claude Code environment settings ' +
      '(Variables) — do NOT paste the key into chat. Then re-run.\n' +
      'Keys: https://elevenlabs.io/app/settings/api-keys',
  );
}

const args = parseArgs(process.argv.slice(2));
const textFile = args['text-file'];
const outFile = args.out;
if (!textFile || !outFile) {
  fail('Usage: node scripts/elevenlabs-tts.mjs --text-file <txt> --out <mp3> [--voice <id>] [--model <id>]');
}
// Default voice: "Rachel" (a standard ElevenLabs premade voice).
const voiceId = args.voice || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
const modelId = args.model || 'eleven_multilingual_v2';
const voiceSettings = {
  stability: Number(args.stability ?? 0.45),
  similarity_boost: Number(args.similarity ?? 0.75),
  style: Number(args.style ?? 0.35),
  use_speaker_boost: true,
};

const text = (await readFile(textFile, 'utf8')).trim();
if (!text) fail(`Voiceover text file is empty: ${textFile}`);

const chunks = splitText(text, 2400);
const parts = [];
for (let i = 0; i < chunks.length; i++) {
  process.stderr.write(`TTS chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...\n`);
  parts.push(await tts(chunks[i]));
}

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, Buffer.concat(parts));
console.log(`Wrote ${outFile} (${(parts.reduce((n, b) => n + b.length, 0) / 1024).toFixed(0)} KiB, ${chunks.length} chunk(s), voice ${voiceId})`);

async function tts(chunk, attempt = 1) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ text: chunk, model_id: modelId, voice_settings: voiceSettings }),
    },
  );
  if (res.status >= 500 && attempt <= 4) {
    const wait = 2 ** attempt * 1000;
    process.stderr.write(`ElevenLabs ${res.status}; retrying in ${wait / 1000}s...\n`);
    await new Promise((r) => setTimeout(r, wait));
    return tts(chunk, attempt + 1);
  }
  if (!res.ok) fail(`ElevenLabs API error ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

function splitText(t, max) {
  const paras = t.split(/\n\s*\n/);
  const out = [];
  let cur = '';
  for (const p of paras) {
    if (p.length > max) {
      // Fall back to sentence-level splitting for oversized paragraphs.
      for (const s of p.split(/(?<=[.!?])\s+/)) {
        if ((cur + ' ' + s).length > max && cur) { out.push(cur.trim()); cur = ''; }
        cur += (cur ? ' ' : '') + s;
      }
    } else if ((cur + '\n\n' + p).length > max && cur) {
      out.push(cur.trim());
      cur = p;
    } else {
      cur += (cur ? '\n\n' : '') + p;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
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
