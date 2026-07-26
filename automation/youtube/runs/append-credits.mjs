#!/usr/bin/env node
// Append deduped Pexels credit URLs to a meta.json description.
// Usage: node append-credits.mjs <run-dir>
// Idempotent: skips if a "Footage: Pexels" line is already present.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('Usage: node append-credits.mjs <run-dir>'); process.exit(1); }
const metaPath = join(dir, 'meta.json');
const creditsPath = join(dir, 'final.mp4.credits.json');
const meta = JSON.parse(await readFile(metaPath, 'utf8'));
if (meta.description.includes('Footage: Pexels')) {
  console.log('Credits already present — skipping.');
  process.exit(0);
}
const credits = JSON.parse(await readFile(creditsPath, 'utf8'));
const urls = [...new Set(credits.map((c) => c.sourceUrl))];
meta.description = meta.description.trimEnd() + '\n\nFootage: Pexels — ' + urls.join(' · ');
await writeFile(metaPath, JSON.stringify(meta, null, 2) + '\n');
console.log(`Appended ${urls.length} Pexels credit URLs to ${metaPath}`);
