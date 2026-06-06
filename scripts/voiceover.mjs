#!/usr/bin/env node
/**
 * voiceover.mjs — free AI narration via edge-tts (Microsoft Edge TTS). No API key.
 * Harvested from the MoneyPrinterTurbo approach: edge-tts also emits word-synced
 * subtitles, so we get narration audio + an SRT/VTT in one call — no whisper needed.
 *
 * Output: an mp3 narration track + (optional) a synced .vtt you can burn via the
 * render engine's manifest `subtitlesFile`, or mix under the music via `voiceover`.
 *
 * Prerequisites:
 *   1. `pip install edge-tts` (already light; no key).
 *   2. Network access to speech.platform.bing.com. NOTE: this is BLOCKED in the
 *      Claude Code web sandbox (403) — run this on your own machine or in an
 *      environment where that host is allowlisted.
 *
 * Usage:
 *   node scripts/voiceover.mjs --text "他输了无数次，但他从没认输。" \
 *     --voice zh-CN-YunxiNeural --out kimetsu/assets/<date>/vo.mp3 --srt kimetsu/assets/<date>/vo.vtt
 *   (or --textfile script.txt)
 *
 * Good voices: zh-CN-YunxiNeural (male, energetic), zh-CN-XiaoxiaoNeural (female, warm),
 *              zh-CN-YunjianNeural (male, sports/passion), en-US-GuyNeural, en-US-AriaNeural.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, statSync, readFileSync } from 'node:fs';

const args = parseArgs(process.argv.slice(2));
const text = args.textfile ? readFileSync(args.textfile, 'utf8') : args.text;
if (!text || !args.out) fail('Usage: --text "..." (or --textfile f) --out vo.mp3 [--voice zh-CN-YunxiNeural] [--srt vo.vtt]');
const voice = args.voice || 'zh-CN-YunxiNeural';

const cli = ['-m', 'edge_tts', '--voice', voice, '--text', text, '--write-media', args.out];
if (args.srt) cli.push('--write-subtitles', args.srt);

try {
  execFileSync('python3', cli, { stdio: ['ignore', 'ignore', 'pipe'] });
} catch (e) {
  fail(`edge-tts failed: ${e.message.split('\n')[0]}\nIs edge-tts installed (pip install edge-tts) and speech.platform.bing.com reachable?`);
}
// edge-tts can exit 0 yet write an empty file when the endpoint is blocked — check size.
if (!existsSync(args.out) || statSync(args.out).size === 0) {
  fail(
    'No audio produced (output is empty).\nThe edge-tts endpoint (speech.platform.bing.com) is\n' +
      'unreachable here — it is 403-blocked in the Claude Code web sandbox. Run this on your own\n' +
      'machine, or allowlist that host in the environment network settings. See kimetsu/SETUP.md §C.',
  );
}
console.log(`✓ Narration: ${args.out}${args.srt ? `  + subtitles: ${args.srt}` : ''}  (voice=${voice})`);
console.log('  Mix it under the music via manifest "voiceover", and/or burn the .vtt via "subtitlesFile".');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) if (argv[i].startsWith('--')) { out[argv[i].slice(2)] = argv[i + 1]; i += 1; }
  return out;
}
function fail(msg) { console.error(msg); process.exit(1); }
