#!/usr/bin/env python3
"""Scene-JSON -> per-frame SVG -> PNG (cairosvg) -> MP4 (ffmpeg).

Usage: python3 render_svg_anim.py dougong_scene.json out_dir [--preview]
--preview renders only a handful of key frames (fast look-check).
Everything is code-drawn: no footage, no AI imagery -> no YouTube synthetic label needed.
"""
import json, math, os, subprocess, sys, time
from multiprocessing import Pool
import cairosvg

def ease_out_cubic(p):
    p = min(max(p, 0.0), 1.0)
    return 1 - (1 - p) ** 3

def ease_out_back(p):
    p = min(max(p, 0.0), 1.0)
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def gong_path(half, h):
    """Bow-shaped bracket arm in elevation: flat top, ends curve down-and-in (juansha)."""
    r = h * 0.55
    return (f"M {-half},{-h} L {half},{-h} L {half},{-h + r} "
            f"Q {half},0 {half - r},0 L {-half + r},0 Q {-half},0 {-half},{-h + r} Z")

def shape_svg(part, S, stroke_w=6):
    fill = S[part.get("fill", "wood")]
    out = S["outline"]
    kind = part["shape"]
    if kind == "rect":
        return (f'<rect x="{part["x"]}" y="{part["y"]}" width="{part["w"]}" height="{part["h"]}" '
                f'fill="{fill}" stroke="{out}" stroke-width="{stroke_w}" stroke-linejoin="round"/>')
    if kind == "path":
        return f'<path d="{part["d"]}" fill="{fill}" stroke="{out}" stroke-width="{stroke_w}" stroke-linejoin="round"/>'
    if kind == "gong":
        return (f'<path d="{gong_path(part["half"], part["h"])}" fill="{fill}" stroke="{out}" '
                f'stroke-width="{stroke_w}" stroke-linejoin="round"/>')
    raise ValueError(kind)

def tag_svg(step, S, ox, oy, dy, alpha):
    """Short persistent side tag (CN + pinyin) in a pre-assigned slot with a leader line."""
    tag = step.get("tag")
    if not tag:
        return ""
    ax, ay = tag["anchor"]
    ax += ox
    ay += oy + dy
    ty = tag["y"]
    if tag["side"] == "right":
        lx, anchor, mid = 1020, "end", 1020 - 40
    else:
        lx, anchor, mid = 60, "start", 60 + 40
    leader = (f'<polyline points="{ax},{ay} {mid},{ty - 14} {lx},{ty - 14}" fill="none" '
              f'stroke="{S["accent"]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>'
              f'<circle cx="{ax}" cy="{ay}" r="8" fill="{S["accent"]}"/>')
    return (f'<g opacity="{alpha:.3f}">{leader}'
            f'<text x="{lx}" y="{ty - 24}" text-anchor="{anchor}" font-family="{S["font_cn"]}" '
            f'font-size="34" fill="{S["accent"]}">{esc(step["cn"])}</text></g>')

def wrap(text, width=30):
    words, lines, cur = text.split(), [], ""
    for w in words:
        if len(cur) + len(w) + 1 > width and cur:
            lines.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    if cur: lines.append(cur)
    return lines

def caption_svg(step, scene, S, alpha, idx, total):
    """Current-step caption in a fixed card at the bottom (never overlaps the drawing)."""
    cc = scene["caption_card"]
    y, h = cc["y"], cc["h"]
    lines = wrap(step["caption"], 32)
    fs = 44 if len(lines) == 1 else 36
    out = [f'<g opacity="{alpha:.3f}"><rect x="60" y="{y}" width="960" height="{h}" rx="20" fill="{S["card"]}" stroke="{S["accent"]}" stroke-width="3"/>',
           f'<rect x="60" y="{y}" width="14" height="{h}" rx="7" fill="{S["accent"]}"/>']
    ty = y + 58
    for ln in lines:
        out.append(f'<text x="110" y="{ty}" font-family="{S["font_en"]}" font-weight="bold" font-size="{fs}" fill="{S["ink"]}">{esc(ln)}</text>')
        ty += fs + 6
    out.append(f'<text x="110" y="{y + h - 28}" font-family="{S["font_cn"]}" font-size="36" fill="{S["accent"]}">{esc(step["cn"])}</text>')
    out.append(f'<text x="990" y="{y + h - 28}" text-anchor="end" font-family="{S["font_en"]}" font-size="30" fill="{S["ink_dim"]}">{idx}/{total}</text></g>')
    return "".join(out)

def arrow_svg(a, S, ox, oy, p):
    (x1, y1), (x2, y2) = a["from"], a["to"]
    x1 += ox; y1 += oy; x2 += ox; y2 += oy
    xe = x1 + (x2 - x1) * p
    ye = y1 + (y2 - y1) * p
    ang = math.atan2(y2 - y1, x2 - x1)
    hl = 26
    hx1 = xe - hl * math.cos(ang - 0.5); hy1 = ye - hl * math.sin(ang - 0.5)
    hx2 = xe - hl * math.cos(ang + 0.5); hy2 = ye - hl * math.sin(ang + 0.5)
    return (f'<line x1="{x1}" y1="{y1}" x2="{xe:.1f}" y2="{ye:.1f}" stroke="{S["accent"]}" stroke-width="10" stroke-linecap="round"/>'
            f'<polygon points="{xe:.1f},{ye:.1f} {hx1:.1f},{hy1:.1f} {hx2:.1f},{hy2:.1f}" fill="{S["accent"]}"/>')

def frame_svg(scene, t):
    C, S = scene["canvas"], scene["style"]
    W, H = C["w"], C["h"]
    ox, oy = scene["origin"]["x"], scene["origin"]["y"]
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
             f'<rect width="{W}" height="{H}" fill="{S["bg"]}"/>']
    # subtle grid
    g = []
    for x in range(0, W, 90):
        g.append(f'M{x},0 V{H}')
    for y in range(0, H, 90):
        g.append(f'M0,{y} H{W}')
    parts.append(f'<path d="{" ".join(g)}" stroke="{S["bg_grid"]}" stroke-width="2"/>')
    # ground line
    parts.append(f'<line x1="60" y1="{oy + 300}" x2="{W - 60}" y2="{oy + 300}" stroke="{S["ink_dim"]}" stroke-width="4" stroke-dasharray="18 14"/>')
    # title (fades in over first 0.6 s)
    ta = ease_out_cubic(t / 0.6)
    T = scene["title"]
    parts.append(f'<g opacity="{ta:.3f}">'
                 f'<text x="540" y="190" text-anchor="middle" font-family="{S["font_en"]}" font-weight="bold" font-size="66" fill="{S["ink"]}">{esc(T["line1"])}</text>'
                 f'<text x="540" y="270" text-anchor="middle" font-family="{S["font_en"]}" font-weight="bold" font-size="66" fill="{S["accent"]}">{esc(T["line2"])}</text>'
                 f'<text x="540" y="340" text-anchor="middle" font-family="{S["font_cn"]}" font-size="36" fill="{S["ink_dim"]}">{esc(T["sub"])}</text></g>')
    # steps
    steps = scene["steps"]
    cur = None
    for k, st in enumerate(steps):
        if t < st["t"]:
            continue
        cur = k
        age = t - st["t"]
        nxt = steps[k + 1]["t"] if k + 1 < len(steps) else 1e9
        if st.get("kind") == "arrows":
            for i, a in enumerate(st["arrows"]):
                p = ease_out_cubic((age - i * 0.12) / 0.45)
                if p > 0:
                    parts.append(arrow_svg(a, S, ox, oy, p))
            continue
        drop = st.get("drop", 0)
        p = ease_out_cubic(age / 0.55)
        dy = st.get("dy", 0)
        offset = -drop * (1 - p)
        alpha = ease_out_cubic(age / 0.25)
        inner = "".join(shape_svg(pt, S) for pt in st["parts"])
        parts.append(f'<g opacity="{alpha:.3f}" transform="translate({ox},{oy + dy + offset:.2f})">{inner}</g>')
        if 0.55 <= age < 0.85:
            fa = 1 - (age - 0.55) / 0.3
            inner2 = "".join(shape_svg(dict(pt, fill="ink"), S, stroke_w=0) for pt in st["parts"])
            parts.append(f'<g opacity="{0.35 * fa:.3f}" transform="translate({ox},{oy + dy})">{inner2}</g>')
        # side tag appears once the part has landed and stays
        parts.append(tag_svg(st, S, ox, oy, dy, ease_out_cubic((age - 0.6) / 0.4)))
    if cur is not None:
        st = steps[cur]
        age = t - st["t"]
        parts.append(caption_svg(st, scene, S, ease_out_cubic(age / 0.3), cur + 1, len(steps)))
    # outro
    O = scene.get("outro")
    if O and t >= O["t"]:
        oa = ease_out_cubic((t - O["t"]) / 0.4)
        parts.append(f'<g opacity="{oa:.3f}"><rect x="60" y="{H - 160}" width="960" height="110" rx="20" fill="{S["accent"]}"/>'
                     f'<text x="540" y="{H - 110}" text-anchor="middle" font-family="{S["font_en"]}" font-weight="bold" font-size="40" fill="{S["ink"]}">{esc(O["text"])}</text>'
                     f'<text x="540" y="{H - 68}" text-anchor="middle" font-family="{S["font_en"]}" font-size="28" fill="{S["ink"]}">{esc(O["sub"])}</text></g>')
    parts.append('</svg>')
    return "".join(parts)

def render_one(args):
    scene, i, t, path = args
    svg = frame_svg(scene, t)
    cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=path, output_width=scene["canvas"]["w"], output_height=scene["canvas"]["h"])
    return i

def main():
    scene_path, out_dir = sys.argv[1], sys.argv[2]
    preview = "--preview" in sys.argv
    scene = json.load(open(scene_path))
    C = scene["canvas"]
    frames_dir = os.path.join(out_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)
    fps, dur = C["fps"], C["duration_s"]
    n = int(fps * dur)
    if preview:
        idx = [int(fps * (s["t"] + 1.0)) for s in scene["steps"]] + [0, n - 1]
    else:
        idx = range(n)
    jobs = [(scene, i, i / fps, os.path.join(frames_dir, f"f_{i:05d}.png")) for i in idx]
    t0 = time.time()
    with Pool(os.cpu_count()) as pool:
        for _ in pool.imap_unordered(render_one, jobs, chunksize=8):
            pass
    t_frames = time.time() - t0
    print(f"rendered {len(jobs)} frames in {t_frames:.1f}s ({t_frames / len(jobs) * 1000:.0f} ms/frame wall, {os.cpu_count()} procs)")
    if preview:
        return
    mp4 = os.path.join(out_dir, "dougong_2d_1080x1920.mp4")
    t1 = time.time()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(fps), "-i", os.path.join(frames_dir, "f_%05d.png"),
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4], check=True)
    print(f"encoded {mp4} in {time.time() - t1:.1f}s; total {time.time() - t0:.1f}s")

if __name__ == "__main__":
    main()
