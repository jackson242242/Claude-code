#!/usr/bin/env node
/**
 * Music vault (contract C8, decision D2). The repo is PUBLIC, and ElevenLabs terms forbid
 * making generated output available as a library, so el-* music is committed only as
 * AES-256-GCM ciphertext in automation/youtube/assets/music-vault/<name>.mp3.enc. The daily
 * routine decrypts at run start into automation/youtube/assets/music/<name>.mp3, where the
 * plain el-*.mp3 files are git-ignored (assets/music/.gitignore). Never commit a decrypted copy.
 *
 * Usage:
 *   node scripts/music-vault.mjs encrypt --in <mp3> [--id <name>]   (name defaults to the file's basename)
 *   node scripts/music-vault.mjs decrypt [--all | --id <name>[,<name>...]]   (no selector = --all)
 *   node scripts/music-vault.mjs list [--json]
 * Test/maintenance options: --vault-dir <dir>  --music-dir <dir>  --manifest <json>
 *   --key-env <VAR> (default YOUTUBE_CLIENT_ID; e.g. decrypt with the old variable, re-encrypt with the new one)
 *
 * Key = scrypt(YOUTUBE_CLIENT_ID (trimmed), "chinatravel-music-vault-v1", 32), N=16384 r=8 p=1.
 * File format v1: "CTMV1\n" (6-byte magic) | 12-byte random IV | 16-byte GCM tag | ciphertext;
 * the magic is the GCM additional data. The key is never printed or written anywhere.
 * encrypt also sets vault: true (+ vaultFile) on the matching assets/music/manifest.json entry.
 * decrypt FAILS CLOSED: before writing a plain copy inside this repo it runs `git check-ignore`; a
 * track whose plain path is not git-ignored (or cannot be checked) is NOT written, and an existing
 * byte-identical plain copy at such a path is removed (it is reproducible from the vault), so a broad
 * `git add` can never pick up decrypted ElevenLabs music.
 * Exit codes: 1 usage/IO, 2 key variable missing, 3 a GCM tag check failed (wrong key or corrupted file),
 * 4 refused to write plain music that is not git-ignored (fix assets/music/.gitignore: el-*.mp3).
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const MAGIC = Buffer.from('CTMV1\n', 'utf8');
const SALT = 'chinatravel-music-vault-v1';
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const IV_LEN = 12;
const TAG_LEN = 16;
const ENC_EXT = '.mp3.enc';

const argv = process.argv.slice(2);
const cmd = argv[0] && !argv[0].startsWith('--') ? argv.shift() : '';
const args = {};
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith('--')) fail(`unexpected argument: ${argv[i]}`);
  const k = argv[i].slice(2);
  args[k] = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
}

const VAULT_DIR = resolve(REPO, args['vault-dir'] || 'automation/youtube/assets/music-vault');
const MUSIC_DIR = resolve(REPO, args['music-dir'] || 'automation/youtube/assets/music');
const MANIFEST = resolve(REPO, args.manifest || join(MUSIC_DIR, 'manifest.json'));
const KEY_ENV = args['key-env'] || 'YOUTUBE_CLIENT_ID';

if (cmd === 'encrypt') encrypt();
else if (cmd === 'decrypt') decrypt();
else if (cmd === 'list') list();
else fail('Usage: node scripts/music-vault.mjs encrypt --in <mp3> [--id <name>] | decrypt [--all | --id <name>] | list [--json]');

function deriveKey() {
  const secret = (process.env[KEY_ENV] || '').trim();
  if (!secret) fail(`${KEY_ENV} is not set: the music-vault key is derived from it. Run where the routine's secrets are loaded (or pass --key-env <VAR>).`, 2);
  return scryptSync(secret, SALT, 32, SCRYPT);
}

function seal(key, plain) {
  const iv = randomBytes(IV_LEN);
  const c = createCipheriv('aes-256-gcm', key, iv, { authTagLength: TAG_LEN });
  c.setAAD(MAGIC);
  const body = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([MAGIC, iv, c.getAuthTag(), body]);
}

/** Returns the plaintext, or null when the GCM tag check fails. Throws on a malformed file. */
function open(key, sealed) {
  if (sealed.length < MAGIC.length + IV_LEN + TAG_LEN || !sealed.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error('not a music-vault v1 file (bad magic or too short)');
  }
  const iv = sealed.subarray(MAGIC.length, MAGIC.length + IV_LEN);
  const tag = sealed.subarray(MAGIC.length + IV_LEN, MAGIC.length + IV_LEN + TAG_LEN);
  const d = createDecipheriv('aes-256-gcm', key, iv, { authTagLength: TAG_LEN });
  d.setAAD(MAGIC);
  d.setAuthTag(tag);
  try {
    return Buffer.concat([d.update(sealed.subarray(MAGIC.length + IV_LEN + TAG_LEN)), d.final()]);
  } catch {
    return null;
  }
}

function encrypt() {
  if (!args.in || args.in === 'true') fail('encrypt needs --in <mp3>');
  const src = resolve(process.cwd(), args.in);
  if (!existsSync(src)) fail(`--in not found: ${args.in}`);
  const name = trackName(args.id && args.id !== 'true' ? args.id : basename(src));
  const key = deriveKey();
  const plain = readFileSync(src);
  if (!plain.length) fail(`--in is empty: ${args.in}`);
  const sealed = seal(key, plain);
  const check = open(key, sealed);
  if (!check || !check.equals(plain)) fail('internal check failed: the sealed file does not decrypt back to the input', 3);
  mkdirSync(VAULT_DIR, { recursive: true });
  const out = join(VAULT_DIR, name + ENC_EXT);
  atomicWrite(out, sealed);
  console.log(`encrypted ${rel(src)} -> ${rel(out)} (${sealed.length} bytes; plain sha256 ${sha256(plain).slice(0, 16)}…)`);
  const plainPath = join(MUSIC_DIR, name + '.mp3');
  const why = committableReason(plainPath);
  if (why && existsSync(plainPath)) console.warn(`WARNING ${rel(plainPath)} ${why}: never commit decrypted vault music (public repo); add el-*.mp3 to automation/youtube/assets/music/.gitignore.`);
  markManifest(name, out);
}

function decrypt() {
  if (!existsSync(VAULT_DIR)) fail(`vault directory not found: ${rel(VAULT_DIR)}`);
  const all = vaultNames();
  let names = all;
  if (args.id && args.id !== 'true') {
    names = args.id.split(',').map((s) => trackName(s.trim())).filter(Boolean);
    const missing = names.filter((n) => !all.includes(n));
    if (missing.length) fail(`not in the vault: ${missing.join(', ')} (have: ${all.join(', ') || 'none'})`);
  } else if (args.all !== 'true') {
    console.log('decrypt: no --id given, decrypting --all');
  }
  if (!names.length) { console.log(`vault ${rel(VAULT_DIR)} is empty; nothing to decrypt.`); return; }
  const key = deriveKey();
  mkdirSync(MUSIC_DIR, { recursive: true });
  const failed = [], refused = [];
  let written = 0, unchanged = 0;
  for (const name of names) {
    const encPath = join(VAULT_DIR, name + ENC_EXT);
    const out = join(MUSIC_DIR, name + '.mp3');
    const why = committableReason(out);
    let plain;
    try {
      plain = open(key, readFileSync(encPath));
    } catch (e) {
      failed.push(`${name}: ${e.message}`);
      continue;
    }
    if (!plain) { failed.push(`${name}: GCM tag check failed (wrong ${KEY_ENV} or corrupted file)`); continue; }
    const current = existsSync(out) && sha256(readFileSync(out)) === sha256(plain);
    if (why) {
      // Fail closed (public repo, D2): never leave decrypted vault music where git would pick it up.
      let note = '';
      if (current) { unlinkSync(out); note = '; removed the existing identical plain copy'; }
      else if (existsSync(out)) note = `; a different file already sits at ${rel(out)} (left untouched, check it)`;
      refused.push(`${name}: refusing to write plain vault music that ${why} (add el-*.mp3 to automation/youtube/assets/music/.gitignore)${note}`);
      continue;
    }
    if (current) { unchanged++; continue; }
    atomicWrite(out, plain);
    written++;
  }
  const ok = names.length - failed.length - refused.length;
  console.log(`decrypted ${ok}/${names.length} into ${rel(MUSIC_DIR)} (${written} written, ${unchanged} already current)`);
  const problems = [...refused, ...failed];
  if (problems.length) fail(`decrypt failed for ${problems.length} track(s):\n  ${problems.join('\n  ')}`, refused.length ? 4 : 3);
}

function list() {
  const names = existsSync(VAULT_DIR) ? vaultNames() : [];
  const manifest = readManifest();
  const byStem = new Map((manifest?.tracks || []).map((t) => [stem(t.file || ''), t]));
  const rows = names.map((name) => {
    const t = byStem.get(name);
    return {
      name,
      vaultFile: rel(join(VAULT_DIR, name + ENC_EXT)),
      bytes: statSync(join(VAULT_DIR, name + ENC_EXT)).size,
      plainPresent: existsSync(join(MUSIC_DIR, name + '.mp3')),
      title: t?.title ?? null,
      aiGenerated: t?.aiGenerated ?? null,
      manifestVault: t?.vault ?? null,
    };
  });
  const orphans = [...byStem.entries()].filter(([n, t]) => t.vault === true && !names.includes(n)).map(([n]) => n);
  if (args.json === 'true') { console.log(JSON.stringify({ vaultDir: rel(VAULT_DIR), tracks: rows, missingFromVault: orphans }, null, 1)); return; }
  console.log(`vault ${rel(VAULT_DIR)}: ${rows.length} track(s)`);
  for (const r of rows) console.log(`  ${r.name.padEnd(28)} ${String(r.bytes).padStart(9)} B  plain:${r.plainPresent ? 'yes' : 'no '}  ${r.title ?? '(no manifest entry)'}`);
  if (orphans.length) console.log(`  WARNING manifest says vault:true but no .enc file: ${orphans.join(', ')}`);
}

function vaultNames() {
  return readdirSync(VAULT_DIR).filter((f) => f.endsWith(ENC_EXT)).map((f) => f.slice(0, -ENC_EXT.length)).sort();
}

function trackName(s) {
  let n = basename(String(s));
  if (n.endsWith(ENC_EXT)) n = n.slice(0, -ENC_EXT.length);
  else if (extname(n)) n = n.slice(0, -extname(n).length);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(n)) fail(`invalid track name "${s}" (letters, digits, . _ - only)`);
  return n;
}

function readManifest() {
  if (!existsSync(MANIFEST)) return null;
  try { return JSON.parse(readFileSync(MANIFEST, 'utf8')); } catch (e) { fail(`cannot parse ${rel(MANIFEST)}: ${e.message}`); }
}

function markManifest(name, encPath) {
  const m = readManifest();
  if (!m) { console.warn(`WARNING no manifest at ${rel(MANIFEST)}; add an entry for ${name} (scripts/ingest-music.mjs).`); return; }
  const t = (m.tracks || []).find((x) => stem(x.file || '') === name);
  if (!t) { console.warn(`WARNING no manifest entry for ${name}; ingest it with scripts/ingest-music.mjs first.`); return; }
  t.vault = true;
  t.vaultFile = relative(join(REPO, 'automation/youtube'), encPath).split('\\').join('/');
  writeFileSync(MANIFEST, JSON.stringify(m, null, 1));
  console.log(`manifest: ${name} vault=true`);
}

/**
 * null when plainPath is outside this repo or git-ignored; otherwise a reason it could be committed.
 * git check-ignore exits 0 = ignored, 1 = not ignored, 128 = error; anything but 0 fails closed.
 */
function committableReason(plainPath) {
  const r = relative(REPO, plainPath);
  if (!r || r.startsWith('..') || isAbsolute(r)) return null;
  try {
    // No --no-index on purpose: a file already tracked in the index reads as "not ignored" (it would be committed).
    execFileSync('git', ['-C', REPO, 'check-ignore', '-q', r], { stdio: 'ignore' });
    return null;
  } catch (e) {
    return e.status === 1 ? 'is NOT git-ignored' : `cannot be checked with git check-ignore (${e.status ?? e.code ?? e.message})`;
  }
}

/** Write via a per-process temp file in the same directory (ignored by the .gitignore files), removed on error. */
function atomicWrite(path, data) {
  const tmp = `${path}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, data);
    renameSync(tmp, path);
  } finally {
    if (existsSync(tmp)) { try { unlinkSync(tmp); } catch { /* best effort */ } }
  }
}

function stem(p) { const b = basename(p); return extname(b) ? b.slice(0, -extname(b).length) : b; }
function sha256(buf) { return createHash('sha256').update(buf).digest('hex'); }
function rel(p) { const r = relative(process.cwd(), p); return r && !r.startsWith('..') ? r : p; }
function fail(msg, code = 1) { console.error(`music-vault: ${msg}`); process.exit(code); }
