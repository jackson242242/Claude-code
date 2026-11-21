#!/usr/bin/env python3
"""Sticky-rice mortar explainer (arch-M-04): code-drawn SVG frames -> PNG -> MP4 (the diagram middle only).

Four steps, 24 s, 1080x1920:
  1  ingredients  brick + slaked lime + sticky-rice soup mix into one mortar
  2  chemistry    plain lime mortar (coarse, gappy calcium-carbonate crystals) vs +amylopectin
                  (finer, denser crystals) - the finding of Zhejiang University, Accounts of
                  Chemical Research 2010 (doi 10.1021/ar9001944); sampled from e.g. Nanjing's wall
  3  the wall     brick courses with the rice-lime mortar in the joints
  4  honest read-out  ~1,500-year-old technique; better water resistance / less shrinkage, but its
                  strength is only "average" (National Geographic quoting a researcher). No
                  "beats concrete" claim anywhere.

No footage and no AI imagery in this clip; the real Nanjing/Xi'an wall open/close shots are
concatenated by scripts/assemble-video.mjs via --clips. EN sentence captions are burned in from
subs.srt, so every essential element stays above y = 1260.

Usage: python3 -I render_rice_mortar.py <out_dir> [--preview t1,t2,...]
"""
import math, os, random, subprocess, sys, time
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render_svg_anim import ease_out_cubic, esc  # noqa: E402
import cairosvg  # noqa: E402

W, H, FPS = 1080, 1920, 30
DUR = 24.0
C = {
    "bg": "#10161a", "grid": "#18222a", "ink": "#f4ead6", "ink_dim": "#aab6bd",
    "brick": "#a4553a", "brick_dk": "#6f3524", "brick_edge": "#c9805f",
    "lime": "#e9e4d6", "lime_dk": "#bdb6a2", "rice": "#f7f1dc", "rice_dk": "#c9bf9a",
    "bowl": "#6d7b86", "bowl_dk": "#46525b",
    "crys": "#8fb4c9", "crys_dk": "#4e7186", "crys_hot": "#f0b429",
    "gap": "#07090b", "accent": "#e8a33a", "gold": "#f0b429", "card": "#1a252d", "outline": "#05080a",
}
FEN, FCN = "DejaVu Sans", "Noto Serif CJK SC"

T_ING, T_CHEM, T_WALL, T_STAT = 1.4, 7.0, 15.0, 20.5


def cl(p): return min(max(p, 0.0), 1.0)
def eo(p): return ease_out_cubic(cl(p))
def lerp(a, b, f): return a + (b - a) * f


def window(t, t0, t1, fi=0.3, fo=0.3):
    if t < t0 or t >= t1:
        return 0.0
    a_in = 1.0 if fi <= 0.01 else eo((t - t0) / fi)
    a_out = 1.0 if fo <= 0.01 else eo((t1 - t) / fo)
    return min(a_in, a_out)


def text(x, y, s, fs, fill, anchor="start", font=FEN, weight="bold", op=1.0):
    return (f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" font-family="{font}" font-weight="{weight}" '
            f'font-size="{fs}" fill="{C.get(fill, fill)}" opacity="{op:.3f}">{esc(s)}</text>')


def rect(x, y, w, h, fill, sw=4, rx=0, op=1.0, stroke=None):
    return (f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{C.get(fill, fill)}" '
            f'stroke="{C.get(stroke, stroke) if stroke else C["outline"]}" stroke-width="{sw}" stroke-linejoin="round" opacity="{op:.3f}"/>')


def poly(pts, fill, sw=3, op=1.0, stroke=None):
    p = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    return (f'<polygon points="{p}" fill="{C.get(fill, fill)}" stroke="{C.get(stroke, stroke) if stroke else C["outline"]}" '
            f'stroke-width="{sw}" stroke-linejoin="round" opacity="{op:.3f}"/>')


def header(t, n, cn, en, t0, t1):
    a = window(t, t0, t1, fi=0.4, fo=0.3)
    if a <= 0:
        return ""
    return (f'<g opacity="{a:.3f}">' + rect(90, 130, 900, 150, "card", sw=3, rx=24, stroke="accent")
            + f'<circle cx="170" cy="205" r="42" fill="{C["accent"]}"/>'
            + text(170, 224, str(n), 56, "outline", anchor="middle")
            + text(240, 205, cn, 44, "accent", font=FCN) + text(240, 252, en, 32, "ink") + '</g>')


# ---------- step 1: ingredients -> mortar -------------------------------------------------
def step1(t):
    a = window(t, T_ING, T_CHEM, fi=0.3, fo=0.4)
    if a <= 0:
        return ""
    o = [f'<g opacity="{a:.3f}">']
    items = [(250, "brick", "BRICK"), (540, "lime", "SLAKED LIME"), (830, "rice", "STICKY-RICE SOUP")]
    for k, (cx, kind, lab) in enumerate(items):
        p = eo((t - T_ING - 0.4 - 0.45 * k) / 0.5)
        if p <= 0:
            continue
        cy = lerp(560, 640, p)
        if kind == "brick":
            o.append(rect(cx - 90, cy - 50, 180, 100, "brick", sw=4, rx=6, stroke="brick_edge", op=p))
            o.append(f'<line x1="{cx-90}" y1="{cy}" x2="{cx+90}" y2="{cy}" stroke="{C["brick_dk"]}" stroke-width="3" opacity="{p:.3f}"/>')
        elif kind == "lime":
            o.append(poly([(cx - 105, cy + 55), (cx - 40, cy - 30), (cx, cy - 55), (cx + 45, cy - 25), (cx + 105, cy + 55)], "lime", op=p, stroke="lime_dk"))
        else:
            o.append(f'<path d="M{cx-100},{cy-20} H{cx+100} A100,85 0 0 1 {cx-100},{cy-20} Z" fill="{C["bowl"]}" stroke="{C["outline"]}" stroke-width="4" opacity="{p:.3f}"/>')
            o.append(f'<ellipse cx="{cx}" cy="{cy-20}" rx="100" ry="18" fill="{C["rice"]}" stroke="{C["rice_dk"]}" stroke-width="3" opacity="{p:.3f}"/>')
        o.append(text(cx, cy + 135, lab, 27, "ink_dim", anchor="middle", op=p))
    # plus signs
    for px in (395, 685):
        pp = eo((t - T_ING - 1.0) / 0.4)
        if pp > 0:
            o.append(text(px, 660, "+", 70, "accent", anchor="middle", op=pp))
    # arrow + result
    r = eo((t - T_ING - 2.6) / 0.6)
    if r > 0:
        o.append(f'<path d="M540,860 V930" stroke="{C["accent"]}" stroke-width="8" stroke-linecap="round" opacity="{r:.3f}"/>'
                 f'<polygon points="505,925 575,925 540,975" fill="{C["accent"]}" opacity="{r:.3f}"/>')
        o.append(f'<g opacity="{r:.3f}">' + rect(300, 1010, 480, 130, "card", sw=4, rx=26, stroke="gold")
                 + text(540, 1075, "ONE MORTAR", 44, "ink", anchor="middle")
                 + text(540, 1118, "used in Ming city walls", 28, "ink_dim", anchor="middle") + '</g>')
    o.append('</g>')
    return "".join(o)


# ---------- step 2: crystals, plain vs +amylopectin ---------------------------------------
def crystals(seed, n, size, jitter, x0, y0, w, h):
    rnd = random.Random(seed)
    out = []
    cols = max(1, int(math.sqrt(n * w / h)))
    rows = max(1, int(math.ceil(n / cols)))
    cw, ch = w / cols, h / rows
    for i in range(n):
        gx, gy = i % cols, i // cols
        cx = x0 + (gx + 0.5) * cw + rnd.uniform(-jitter, jitter) * cw
        cy = y0 + (gy + 0.5) * ch + rnd.uniform(-jitter, jitter) * ch
        s = size * rnd.uniform(0.8, 1.15)
        k = rnd.randint(5, 7)
        r0 = rnd.uniform(0, math.tau)
        pts = [(cx + s * rnd.uniform(0.7, 1.15) * math.cos(r0 + j * math.tau / k),
                cy + s * rnd.uniform(0.7, 1.15) * math.sin(r0 + j * math.tau / k)) for j in range(k)]
        out.append((rnd.random(), pts))
    return out


_COARSE = crystals(7, 12, 34, 0.30, 90, 560, 430, 520)
_FINE = crystals(11, 60, 21, 0.10, 560, 560, 430, 520)


def step2(t):
    a = window(t, T_CHEM, T_WALL, fi=0.3, fo=0.4)
    if a <= 0:
        return ""
    o = [f'<g opacity="{a:.3f}">']
    for x0, title, sub in ((90, "PLAIN LIME", "coarse crystals, gaps"), (560, "+ RICE SOUP", "finer, denser crystals")):
        o.append(rect(x0, 560, 430, 520, "gap", sw=4, rx=18, stroke="crys_dk"))
        o.append(text(x0 + 215, 1135, title, 32, "ink", anchor="middle"))
        o.append(text(x0 + 215, 1175, sub, 26, "ink_dim", anchor="middle"))
    for side, data, grow0 in ((0, _COARSE, T_CHEM + 0.5), (1, _FINE, T_CHEM + 2.0)):
        for rnk, pts in data:
            g = eo((t - grow0 - rnk * 2.2) / 0.5)
            if g <= 0:
                continue
            cx = sum(p[0] for p in pts) / len(pts)
            cy = sum(p[1] for p in pts) / len(pts)
            sp = [(cx + (x - cx) * g, cy + (y - cy) * g) for x, y in pts]
            o.append(poly(sp, "crys" if side else "crys_dk", sw=2, stroke="crys_dk" if side else "outline"))
    # chemistry tag (between header and panels)
    tag = eo((t - T_CHEM - 0.2) / 0.4)
    o.append(text(540, 340, "AMYLOPECTIN (rice starch) shapes the calcium carbonate", 29, "ink_dim", anchor="middle", op=tag))
    o.append(text(540, 382, "Zhejiang University, 2010", 29, "accent", anchor="middle", op=tag))
    o.append('</g>')
    return "".join(o)


# ---------- step 3: the wall --------------------------------------------------------------
def step3(t):
    a = window(t, T_WALL, T_STAT, fi=0.3, fo=0.4)
    if a <= 0:
        return ""
    o = [f'<g opacity="{a:.3f}">']
    bx0, by_bot = 200, 1130
    bw, bh, gap, rows, cols = 150, 62, 12, 8, 5
    for r in range(rows):
        ta = T_WALL + 0.3 + 0.18 * r
        p = eo((t - ta) / 0.35)
        if p <= 0:
            continue
        y = by_bot - (r + 1) * (bh + gap)
        off = (r % 2) * (bw + gap) / 2
        # joint (mortar) strip under this course
        jt = eo((t - (T_WALL + 3.0 + 0.1 * r)) / 0.3)
        o.append(rect(bx0 - 10, y + bh, cols * (bw + gap) + (bw + gap) / 2 - 10, gap + 3, "gold" if jt > 0 else "lime_dk", sw=0, op=p))
        for c in range(cols):
            x = bx0 + c * (bw + gap) + off
            o.append(rect(x, y, bw, bh, "brick" if (r + c) % 2 else "brick_dk", sw=3, rx=4, stroke="brick_edge", op=p))
    lab = eo((t - (T_WALL + 3.4)) / 0.5)
    if lab > 0:
        o.append(f'<g opacity="{lab:.3f}">'
                 f'<polyline points="{bx0 + 5 * (bw + gap) + 20},{by_bot - 4 * (bh + gap) + bh + 6} 960,{by_bot - 4 * (bh + gap) + bh + 6} 960,505" fill="none" stroke="{C["gold"]}" stroke-width="4"/>'
                 + text(990, 455, "RICE-LIME", 34, "gold", anchor="end") + text(990, 495, "JOINTS", 34, "gold", anchor="end")
                 + '</g>')
    cap = eo((t - (T_WALL + 1.2)) / 0.5)
    o.append(text(540, 340, "Binds the bricks of Nanjing's Ming wall", 31, "ink", anchor="middle", op=cap))
    o.append(text(540, 385, "sampled in the 2010 study", 28, "ink_dim", anchor="middle", op=cap))
    o.append('</g>')
    return "".join(o)


# ---------- step 4: honest read-out -------------------------------------------------------
def step4(t):
    a = window(t, T_STAT, DUR, fi=0.4, fo=0.001)
    if a <= 0:
        return ""
    o = [f'<g opacity="{a:.3f}">', rect(110, 340, 860, 780, "card", sw=4, rx=30, stroke="accent"),
         text(540, 430, "STICKY-RICE MORTAR", 38, "ink_dim", anchor="middle")]
    p1 = eo((t - T_STAT - 0.4) / 0.5)
    o.append(text(540, 560, "~1,500 years", 84, "gold", anchor="middle", op=p1))
    o.append(text(540, 612, "old technique", 32, "ink_dim", anchor="middle", op=p1))
    p2 = eo((t - T_STAT - 1.2) / 0.5)
    o.append(text(540, 730, "Water-resistant, shrinks less", 38, "ink", anchor="middle", op=p2))
    p3 = eo((t - T_STAT - 2.0) / 0.5)
    o.append(text(540, 850, "Strength: only “average”", 44, "accent", anchor="middle", op=p3))
    o.append(text(540, 900, "(a researcher, National Geographic)", 26, "ink_dim", anchor="middle", op=p3))
    p4 = eo((t - T_STAT - 2.8) / 0.5)
    o.append(text(540, 1030, "So: real — but not a miracle.", 38, "ink", anchor="middle", op=p4))
    o.append('</g>')
    return "".join(o)


def frame_svg(t):
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
         f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/>']
    g = [f'M{x},0 V{H}' for x in range(0, W, 90)] + [f'M0,{y} H{W}' for y in range(0, H, 90)]
    o.append(f'<path d="{" ".join(g)}" stroke="{C["grid"]}" stroke-width="2"/>')
    o.append(header(t, 1, "糯米灰浆", "Brick + lime + rice soup", T_ING, T_CHEM))
    o.append(header(t, 2, "淀粉结晶", "Starch reshapes the crystals", T_CHEM, T_WALL))
    o.append(header(t, 3, "城墙砖缝", "It goes into the joints", T_WALL, T_STAT))
    o.append(step1(t))
    o.append(step2(t))
    o.append(step3(t))
    o.append(step4(t))
    intro = window(t, 0.0, T_ING, fi=0.3, fo=0.3)
    if intro > 0:
        o.append(f'<g opacity="{intro:.3f}">' + rect(120, 520, 840, 360, "card", sw=4, rx=30, stroke="accent")
                 + text(540, 640, "Ming walls", 56, "ink_dim", anchor="middle")
                 + text(540, 740, "held by RICE", 96, "gold", anchor="middle")
                 + text(540, 820, "糯米灰浆", 54, "accent", anchor="middle", font=FCN) + '</g>')
    o.append('</svg>')
    return "".join(o)


def render_one(args):
    i, t, p = args
    cairosvg.svg2png(bytestring=frame_svg(t).encode("utf-8"), write_to=p, output_width=W, output_height=H)
    return i


def main():
    out_dir = sys.argv[1]
    fdir = os.path.join(out_dir, "frames")
    os.makedirs(fdir, exist_ok=True)
    if "--preview" in sys.argv:
        ts = [float(x) for x in sys.argv[sys.argv.index("--preview") + 1].split(",")]
        jobs = [(k, t, os.path.join(out_dir, f"preview_{t:05.2f}.png")) for k, t in enumerate(ts)]
    else:
        n = int(DUR * FPS)
        jobs = [(i, i / FPS, os.path.join(fdir, f"f_{i:05d}.png")) for i in range(n)]
    t0 = time.time()
    with Pool(os.cpu_count()) as pool:
        for _ in pool.imap_unordered(render_one, jobs, chunksize=6):
            pass
    dt = time.time() - t0
    print(f"rendered {len(jobs)} frames in {dt:.1f}s ({dt/len(jobs)*1000:.0f} ms/frame)")
    if "--preview" in sys.argv:
        return
    mp4 = os.path.join(out_dir, "rice_mortar_1080x1920.mp4")
    t1 = time.time()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(fdir, "f_%05d.png"),
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
                    "-movflags", "+faststart", mp4], check=True)
    print(f"encoded {mp4} in {time.time()-t1:.1f}s; total {time.time()-t0:.1f}s")


if __name__ == "__main__":
    main()
