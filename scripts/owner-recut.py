#!/usr/bin/env python3
"""Render an owner POV recut (format F1) from automation/youtube/plans/owner-recuts.json.

Usage:
  python3 -I scripts/owner-recut.py --id R-01 --out /path/recut.mp4 [--music <bed|path>] [--music-start S]
                                    [--force] [--frames] [--dry-run] [--date YYYY-MM-DD] [--plan <json>]
  python3 -I scripts/owner-recut.py --list [--date YYYY-MM-DD]

What it does (port of the 2026-10-17 recut test renderer):
  - trims + concatenates segments of the owner's committed 1080x1920 masters
  - hides the OLD burned-in subtitles under a feathered, blurred, darkened band (per source:
    y 840-1228, or y 740-1228 for the Guangzhou master); the alpha mask is drawn with ffmpeg at runtime
  - burns NEW English cues on the band (ASS/libass), a "POV" pill and per-shot place labels
  - replaces the audio with a calm music bed (default from the plan; --music overrides), two-pass
    loudnorm to about -14 LUFS
  - writes <out>.credits.json (owner file + in/out per shot, credits.json-compatible array) and
    <out>.recut.json (render report: music, loudness, checks, meta hints)

Gates (refuses with exit code 2):
  - any segment overlapping an exclusion range of its source (faces, old titles, unconfirmed shots, end fades);
    --force does NOT override this
  - a place label not allowed for that source/time range (honesty gate); --force does NOT override this
  - status other than 'ready' (needs-owner-confirmation / needs-price) unless --force; a forced render is
    marked uploadable:false
Warnings (render continues): a segment reusing an owner shot published in the last 8 weeks.

Only the Python standard library + ffmpeg/ffprobe are used. Run with python3 -I.
"""
import argparse
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DEFAULT_PLAN = REPO / "automation/youtube/plans/owner-recuts.json"
MUSIC_DIR = REPO / "automation/youtube/assets/music"
INTER_DIR = Path("/usr/share/fonts/opentype/inter")
# The 9 legacy beds are AI-generated (vidIQ generate_music) — see the uploader's synthetic-media rule.
LEGACY_AI_BEDS = {
    "cinema-orient-01", "cpop-groove-01", "guzheng-calm-01", "lofi-chill-01", "lofi-upbeat-01",
    "oriental-edm-01", "underscore-docu-01", "underscore-docu-02", "underscore-docu-03",
}
EPS = 1e-6


class Refuse(Exception):
    pass


def log(msg):
    sys.stderr.write(msg + "\n")


def run(args, capture=False):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0:
        tail = (r.stderr or "").strip().splitlines()[-15:]
        raise RuntimeError(f"{args[0]} failed ({r.returncode}):\n" + "\n".join(tail))
    return r


def probe_duration(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)])
    return float(r.stdout.strip())


def load_plan(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def find_recut(plan, rid):
    for r in plan.get("recuts", []):
        if r.get("id") == rid:
            return r
    raise Refuse(f"unknown recut id {rid!r}; known: {', '.join(r['id'] for r in plan.get('recuts', []))}")


def overlaps(a0, a1, b0, b1):
    return a0 < b1 - EPS and a1 > b0 + EPS


def parse_date(s):
    return dt.date.fromisoformat(s)


# ---------------------------------------------------------------- validation
def validate(plan, recut, force, today):
    """Return (segments with resolved source info, total duration, warnings). Raise Refuse on a gate."""
    sources = plan.get("sources", {})
    root = REPO / plan.get("footageRoot", "automation/youtube/runs/owner-footage")
    status = recut.get("status")
    warnings = []
    if status != "ready":
        if not force:
            raise Refuse(f"{recut['id']} has status '{status}' — not rendered. Resolve it in owner-recuts.json "
                         f"(notes: {'; '.join(recut.get('notes', []))}) or pass --force for a NOT-FOR-UPLOAD preview.")
        warnings.append(f"--force: status '{status}' rendered as a preview; uploadable=false")
    segs = recut.get("segments") or []
    if not segs:
        raise Refuse(f"{recut['id']} has no segments")
    durations = {}
    resolved = []
    reuse_weeks = int(plan.get("rules", {}).get("reuseWeeks", 8))
    for i, s in enumerate(segs, 1):
        key = s.get("src")
        if key not in sources:
            raise Refuse(f"segment {i}: unknown source {key!r}")
        src = sources[key]
        path = root / src["file"]
        if not path.is_file():
            raise Refuse(f"segment {i}: master not found: {path}")
        if key not in durations:
            durations[key] = probe_duration(path)
        a, b = float(s["in"]), float(s["out"])
        if not (0 <= a < b <= durations[key] + EPS):
            raise Refuse(f"segment {i} ({key} {a}-{b}): in/out outside 0-{durations[key]:.2f} s or empty")
        for ex in src.get("exclusions", []):
            if overlaps(a, b, float(ex["from"]), float(ex["to"])):
                raise Refuse(f"segment {i} ({src['file']} {a}-{b} s) overlaps exclusion {ex['from']}-{ex['to']} s "
                             f"[{ex.get('kind')}: {ex.get('why')}] — refused (no override)")
        label = s.get("label")
        if label:
            rules = [r for r in src.get("labels", []) if overlaps(a, b, float(r["from"]), float(r["to"]))]
            if not rules or any(label not in r.get("allowed", []) for r in rules):
                allowed = sorted({x for r in rules for x in r.get("allowed", [])})
                raise Refuse(f"segment {i}: label {label!r} is not allowed over {src['file']} {a}-{b} s "
                             f"(allowed: {allowed or 'none — never name this footage'})")
        for u in src.get("uses", []):
            try:
                d = parse_date(u["date"])
            except (KeyError, ValueError):
                continue
            free = d + dt.timedelta(weeks=reuse_weeks)
            if today < free and overlaps(a, b, float(u.get("in", 0)), float(u.get("out", 1e9))):
                warnings.append(f"reuse: segment {i} ({key} {a}-{b}) overlaps {u.get('what') or u.get('videoId')} "
                                f"published {u['date']}; 8-week rule frees it on {free.isoformat()}")
        resolved.append({"i": i, "key": key, "src": src, "path": path, "in": a, "out": b, "label": label})
    total = round(sum(s["out"] - s["in"] for s in resolved), 3)
    for c in recut.get("cues", []):
        st = float(c["start"])
        en = total if c.get("end") is None else float(c["end"])
        if not (0 <= st < en <= total + 0.05):
            raise Refuse(f"cue {c!r}: timing outside 0-{total} s")
        if "__" in c.get("text", "") and not force:
            raise Refuse(f"cue has a placeholder ({c['text']!r}); fill the verified number first")
    return resolved, total, warnings


def earliest_date(plan, recut):
    sources = plan.get("sources", {})
    weeks = int(plan.get("rules", {}).get("reuseWeeks", 8))
    best = None
    for s in recut.get("segments", []):
        for u in sources.get(s.get("src"), {}).get("uses", []):
            if overlaps(float(s["in"]), float(s["out"]), float(u.get("in", 0)), float(u.get("out", 1e9))):
                d = parse_date(u["date"]) + dt.timedelta(weeks=weeks)
                best = d if best is None or d > best else best
    return best


# ---------------------------------------------------------------- music
def resolve_music(plan, recut, music_arg, start_arg):
    render = plan.get("render", {})
    name = music_arg or recut.get("music") or render.get("defaultMusic")
    if not name:
        raise Refuse("no music bed: set render.defaultMusic or pass --music")
    p = Path(name)
    if not p.is_file():
        cand = [MUSIC_DIR / name, MUSIC_DIR / f"{name}.mp3"]
        p = next((c for c in cand if c.is_file()), None)
        if p is None:
            raise Refuse(f"music bed {name!r} not found (looked in {MUSIC_DIR}); "
                         f"el-* beds must be decrypted first (scripts/music-vault.mjs decrypt)")
    bed = render.get("musicBeds", {}).get(p.name, {})
    start = float(start_arg) if start_arg is not None else float(recut.get("musicStart", bed.get("start", 0.0)))
    ai = None
    manifest = MUSIC_DIR / "manifest.json"
    if manifest.is_file():
        try:
            m = json.load(open(manifest, encoding="utf-8"))
            entries = m if isinstance(m, list) else m.get("tracks", m)
            items = entries.values() if isinstance(entries, dict) else entries
            for e in items:
                if isinstance(e, dict) and Path(str(e.get("file") or e.get("name") or e.get("id") or "")).stem == p.stem:
                    if "aiGenerated" in e:
                        ai = bool(e["aiGenerated"])
        except (OSError, ValueError, AttributeError):
            pass
    if ai is None and p.stem in LEGACY_AI_BEDS:
        ai = True
    return p, start, ai


# ---------------------------------------------------------------- ASS
def ass_ts(t):
    t = max(0.0, t)
    cs = int(round(t * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def ass_color(hex_rgb):
    h = hex_rgb.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H{b}{g}{r}&".upper()


def cue_to_ass(text, hl):
    t = text.replace("\\", "").replace("{", "(").replace("}", ")")
    t = t.replace("[[", "{\\c" + hl + "}").replace("]]", "{\\c&HFFFFFF&}")
    return t.replace("\r", "").replace("\n", "\\N")


def pick_fonts():
    if (INTER_DIR / "InterDisplay-ExtraBold.otf").is_file():
        return ("Inter Display ExtraBold", "Inter Display Black", "Inter Display SemiBold", 0)
    log("warn: Inter Display not installed — falling back to DejaVu Sans Bold")
    return ("DejaVu Sans", "DejaVu Sans", "DejaVu Sans", -1)


def write_ass(path, plan, recut, segs, total):
    render = plan.get("render", {})
    bands = render.get("bands", {})
    dflt = bands.get("default", {"y": 840, "h": 388})
    cue_y = int(recut.get("cueY", dflt["y"] + dflt["h"] // 2))
    size = int(render.get("cueSize", 84))
    hl = ass_color(render.get("highlight", "#FFD84D"))
    f_cue, f_tag, f_chip, bold = pick_fonts()
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cue,{f_cue},{size},&H00FFFFFF,&H00FFFFFF,&H00141414,&H80000000,{bold},0,0,0,100,100,0,0,1,3,2,5,60,60,0,1
Style: Tag,{f_tag},50,&H00141414,&H00141414,&H00FFFFFF,&H00FFFFFF,{bold},0,0,0,100,100,1,0,3,10,0,7,0,0,0,1
Style: Chip,{f_chip},42,&H00FFFFFF,&H00FFFFFF,&H99000000,&H99000000,0,0,0,0,100,100,0,0,3,10,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    for c in recut.get("cues", []):
        st = float(c["start"])
        en = total if c.get("end") is None else float(c["end"])
        ev.append(f"Dialogue: 2,{ass_ts(st)},{ass_ts(en)},Cue,,0,0,0,,{{\\pos(540,{cue_y})}}{cue_to_ass(c['text'], hl)}")
    if recut.get("povTag", render.get("povTag", True)):
        ev.append(f"Dialogue: 1,{ass_ts(0)},{ass_ts(total)},Tag,,0,0,0,,{{\\pos(58,196)}}POV")
    # per-shot place chips; consecutive shots with the same label become one event
    t, runs = 0.0, []
    for s in segs:
        d = s["out"] - s["in"]
        if runs and runs[-1][2] == s["label"]:
            runs[-1][1] = t + d
        else:
            runs.append([t, t + d, s["label"]])
        t += d
    for a, b, label in runs:
        if label:
            safe = label.replace("{", "(").replace("}", ")").replace("\\", "")
            ev.append(f"Dialogue: 1,{ass_ts(a)},{ass_ts(b)},Chip,,0,0,0,,{{\\pos(58,282)}}{safe}")
    Path(path).write_text(head + "\n".join(ev) + "\n", encoding="utf-8")


# ---------------------------------------------------------------- render
def filter_path(p):
    s = str(p)
    for ch in ("\\", ":", "'", ",", "[", "]", ";"):
        s = s.replace(ch, "\\" + ch)
    return s


def make_mask(path, h, feather):
    expr = f"255*min(1\\,min(Y\\,H-1-Y)/{feather})"
    run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=white:s=1080x{h}",
         "-frames:v", "1", "-vf", f"format=gray,geq=lum={expr}", str(path)])


def loudnorm_measure(music, start, total, afilt, target, tp):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-ss", f"{start:.3f}", "-t", f"{total + 0.5:.3f}",
                        "-i", str(music), "-af", f"{afilt},loudnorm=I={target}:TP={tp}:LRA=11:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr)
    if r.returncode != 0 or not m:
        return None
    return json.loads(m.group(0))


def measure_output(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true",
                        "-f", "null", "-"], capture_output=True, text=True)
    out = {}
    m = re.search(r"Integrated loudness:\s*\n\s*I:\s*(-?[\d.]+) LUFS", r.stderr)
    if m:
        out["integratedLUFS"] = float(m.group(1))
    m = re.search(r"True peak:\s*\n\s*Peak:\s*(-?[\d.]+) dBFS", r.stderr)
    if m:
        out["truePeakDbfs"] = float(m.group(1))
    return out


def render(plan, recut, segs, total, music, music_start, out, tmp):
    render_cfg = plan.get("render", {})
    bands = render_cfg.get("bands", {})
    style = render_cfg.get("bandStyle", {})
    feather = int(style.get("feather", 26))
    sigma = float(style.get("sigma", 34))
    bright = float(style.get("brightness", -0.13))
    sat = float(style.get("saturation", 0.75))
    target = float(render_cfg.get("loudnessLUFS", -14))
    tp = float(render_cfg.get("truePeakDb", -1.5))
    vfade = float(render_cfg.get("videoFadeOutSec", 0.3))
    afade = float(render_cfg.get("audioFadeOutSec", 0.8))

    ass = tmp / "cues.ass"
    write_ass(ass, plan, recut, segs, total)

    files = []
    for s in segs:
        if s["path"] not in files:
            files.append(s["path"])
    args = ["ffmpeg", "-v", "error", "-y"]
    for f in files:
        args += ["-i", str(f)]
    masks = {}
    mask_inputs = []
    for s in segs:
        band = bands.get(s["src"].get("band", "default")) or bands.get("default") or {"y": 840, "h": 388}
        y, h = int(band["y"]), int(band["h"])
        if h not in masks:
            mp = tmp / f"bandmask-{h}.png"
            make_mask(mp, h, feather)
            masks[h] = mp
        mask_inputs.append((len(files) + len(mask_inputs), y, h))
        args += ["-loop", "1", "-framerate", "30", "-t", f"{s['out'] - s['in'] + 0.5:.3f}", "-i", str(masks[h])]
    ai = len(files) + len(mask_inputs)
    args += ["-ss", f"{music_start:.3f}", "-t", f"{total + 0.5:.3f}", "-i", str(music)]

    fc = []
    for i, s in enumerate(segs):
        vi = files.index(s["path"])
        mi, y, h = mask_inputs[i]
        d = s["out"] - s["in"]
        fc.append(f"[{vi}:v]trim=start={s['in']:.3f}:end={s['out']:.3f},setpts=PTS-STARTPTS,fps=30,"
                  f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,"
                  f"format=yuv420p,split[s{i}a][s{i}b]")
        fc.append(f"[s{i}b]crop=1080:{h}:0:{y},gblur=sigma={sigma},eq=brightness={bright}:saturation={sat},"
                  f"format=yuva420p[s{i}band]")
        fc.append(f"[{mi}:v]format=gray,trim=duration={d:.3f},setpts=PTS-STARTPTS[s{i}mask]")
        fc.append(f"[s{i}band][s{i}mask]alphamerge[s{i}bandA]")
        fc.append(f"[s{i}a][s{i}bandA]overlay=0:{y}:shortest=1,format=yuv420p[v{i}]")
    fc.append("".join(f"[v{i}]" for i in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=0[base]")
    fc.append(f"[base]ass=filename={filter_path(ass)},fade=t=out:st={max(0.0, total - vfade):.3f}:d={vfade},"
              f"format=yuv420p[vout]")
    afilt = (f"atrim=duration={total:.3f},asetpts=PTS-STARTPTS"
             + (",afade=t=in:d=0.25" if music_start > 0 else "")
             + f",afade=t=out:st={max(0.0, total - afade):.3f}:d={afade}")
    meas = loudnorm_measure(music, music_start, total, afilt, target, tp)
    if meas and meas.get("input_i") not in (None, "-inf"):
        ln = (f"loudnorm=I={target}:TP={tp}:LRA=11:measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:"
              f"measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}:"
              f"offset={meas['target_offset']}:linear=true")
    else:
        log("warn: loudness pass 1 failed — using single-pass loudnorm")
        ln = f"loudnorm=I={target}:TP={tp}:LRA=11"
    fc.append(f"[{ai}:a]{afilt},{ln},aresample=48000[aout]")
    args += ["-filter_complex", ";".join(fc), "-map", "[vout]", "-map", "[aout]",
             "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-profile:v", "high", "-pix_fmt", "yuv420p",
             "-r", "30", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart",
             "-t", f"{total:.3f}", str(out)]
    run(args)


def extract_frames(out, total):
    paths = []
    stem = str(out)[:-4] if str(out).lower().endswith(".mp4") else str(out)
    for k, t in enumerate([0.5, total / 2, max(0.0, total - 1.0)], 1):
        p = f"{stem}-frame{k}.jpg"
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", str(out), "-frames:v", "1", "-q:v", "3", p])
        paths.append(p)
    return paths


def rel(p):
    try:
        return str(Path(p).resolve().relative_to(REPO))
    except ValueError:
        return str(p)


# ---------------------------------------------------------------- main
def cmd_list(plan, today):
    pairs = plan.get("rules", {}).get("pairs", [])
    for r in plan.get("recuts", []):
        segs = r.get("segments", [])
        total = sum(float(s["out"]) - float(s["in"]) for s in segs)
        e = earliest_date(plan, r)
        when = "now" if e is None or e <= today else f"from {e.isoformat()}"
        pair = next((p for p in pairs if r["id"] in p), None)
        print(f"{r['id']}  {r.get('status', '?'):<25} {total:5.2f}s  {r.get('hookType') or '-':<11} "
              f"scope={r.get('cityScope', '?'):<8} reuse-ok {when:<16} "
              f"{'pair ' + '/'.join(pair) if pair else '':<12} {r.get('title', '')}")


def main():
    ap = argparse.ArgumentParser(description="Render an owner POV recut from owner-recuts.json")
    ap.add_argument("--id")
    ap.add_argument("--out")
    ap.add_argument("--music", help="bed filename/name in automation/youtube/assets/music, or a path")
    ap.add_argument("--music-start", type=float, help="seconds into the bed (default: plan musicBeds[bed].start or 0)")
    ap.add_argument("--force", action="store_true", help="render a non-ready status as a NOT-FOR-UPLOAD preview")
    ap.add_argument("--frames", action="store_true", help="also write <out>-frame1..3.jpg (0.5 s, middle, end-1 s)")
    ap.add_argument("--dry-run", action="store_true", help="validate and print the plan, do not render")
    ap.add_argument("--list", action="store_true", help="list recuts with status and earliest reuse-safe date")
    ap.add_argument("--date", help="today's date for the 8-week reuse check (default: UTC today)")
    ap.add_argument("--plan", default=str(DEFAULT_PLAN))
    ap.add_argument("--keep-temp", action="store_true")
    a = ap.parse_args()

    plan = load_plan(a.plan)
    today = parse_date(a.date) if a.date else dt.datetime.now(dt.timezone.utc).date()
    if a.list:
        cmd_list(plan, today)
        return 0
    if not a.id or (not a.out and not a.dry_run):
        ap.error("--id and --out are required (or --list / --dry-run)")
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            raise Refuse(f"{tool} not found on PATH")

    recut = find_recut(plan, a.id)
    segs, total, warnings = validate(plan, recut, a.force, today)
    music, music_start, music_ai = resolve_music(plan, recut, a.music, a.music_start)
    music_len = probe_duration(music)
    if music_start + total > music_len + EPS:
        raise Refuse(f"music {music.name} is {music_len:.1f} s; start {music_start} + {total} s runs past its end "
                     f"(use --music-start)")
    for w in warnings:
        log("warn: " + w)
    log(f"{recut['id']} [{recut.get('status')}] {total:.2f}s, {len(segs)} shots, music {music.name} from {music_start:.1f}s")
    for s in segs:
        log(f"  {s['src']['file']} {s['in']:.2f}-{s['out']:.2f}  label={s['label'] or '-'}  band={s['src'].get('band', 'default')}")
    log("  exclusion check: pass (no shot overlaps an exclusion range)")
    if a.dry_run:
        return 0

    out = Path(a.out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="owner-recut-"))
    try:
        render(plan, recut, segs, total, music, music_start, out, tmp)
        if a.keep_temp:
            log(f"temp files kept in {tmp}")
    finally:
        if not a.keep_temp:
            shutil.rmtree(tmp, ignore_errors=True)

    dur = probe_duration(out)
    loud = measure_output(out)
    frames = extract_frames(out, dur) if a.frames else []
    forced = recut.get("status") != "ready"
    credits, t = [], 0.0
    for s in segs:
        d = s["out"] - s["in"]
        credits.append({
            "query": None,
            "sourceUrl": f"owner:{rel(s['path'])}",
            "photographer": "channel owner",
            "source": "Owner",
            "kind": "owner-video",
            "file": rel(s["path"]),
            "in": s["in"],
            "out": s["out"],
            "at": round(t, 3),
            "label": s["label"],
            "recut": recut["id"],
        })
        t += d
    Path(f"{out}.credits.json").write_text(json.dumps(credits, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    report = {
        "recut": recut["id"],
        "title": recut.get("title"),
        "hookType": recut.get("hookType"),
        "status": recut.get("status"),
        "forced": forced,
        "uploadable": not forced,
        "renderedAt": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        "out": str(out),
        "durationSec": round(dur, 3),
        "sizeBytes": out.stat().st_size,
        "music": {"file": music.name, "start": music_start, "aiGenerated": music_ai},
        "loudness": loud,
        "checks": {"exclusions": "pass", "labels": "pass", "warnings": warnings},
        "cues": recut.get("cues", []),
        "frames": frames,
        "metaHints": {
            "music": music.name,
            "format": "F1",
            "footage": "owner",
            "owner": True,
            "povType": recut.get("povType", "none"),
            "aiFootage": False,
            "containsSyntheticMediaExpected": bool(music_ai),
            "placesNamed": recut.get("placesNamed", []),
            "facts": recut.get("facts", []),
            "pairWith": recut.get("pairWith"),
        },
    }
    Path(f"{out}.recut.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {out} ({dur:.2f}s, {loud.get('integratedLUFS', '?')} LUFS) + .credits.json + .recut.json"
          + (" [FORCED PREVIEW — NOT FOR UPLOAD]" if forced else ""))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Refuse as e:
        log(f"REFUSED: {e}")
        sys.exit(2)
    except RuntimeError as e:
        log(f"ERROR: {e}")
        sys.exit(1)
