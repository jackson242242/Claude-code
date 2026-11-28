#!/usr/bin/env python3
"""Roof-beasts counting explainer: code-drawn SVG frames -> PNG -> MP4 (the diagram middle only).
A row of ridge-figure silhouettes on a palace roof ridge appears one by one, 1 -> 10; a leading
immortal (qifeng xianren) heads the line and is NOT counted. The tenth beast (hangshi / 行什)
is highlighted gold at the end — it sits on only one roof in China (the Hall of Supreme Harmony).

No footage, no AI imagery in this clip; the real Forbidden City open/close shots are concatenated
by scripts/assemble-video.mjs via --clips. EN sentence captions are burned by assemble-video from
subs.srt, so the drawing keeps y < 1260 free of essential content for the lower-third band; the
drawing itself only shows the counter, the small per-figure numbers and the 行什 label.

Usage: python3 -I render_roof_beasts.py <out_dir> [--preview t1,t2,...]
"""
import math, os, subprocess, sys, time
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render_svg_anim import ease_out_cubic, esc  # noqa: E402
import cairosvg  # noqa: E402

W, H, FPS = 1080, 1920, 30
DUR = 24.0
C = {
    "bg": "#0d1420", "grid": "#152133", "ink": "#eaf2ff", "ink_dim": "#9fb3cc",
    "roof": "#2f4a6b", "roof_dark": "#1b2d45", "roof_light": "#3f608a",
    "ridge": "#101a2a", "ridge_tile": "#20324c",
    "beast": "#0b1016", "beast_edge": "#33465f", "beast_lit": "#e8c33a",
    "immortal": "#c98a2b", "immortal_edge": "#f0b429",
    "accent": "#f0b429", "gold": "#f0b429", "card": "#131f30", "outline": "#0a0f17",
}
FEN, FCN = "DejaVu Sans", "Noto Serif CJK SC"

# 10 ridge-figure names (front -> back is the real order behind the immortal).
BEASTS = ["dragon", "phoenix", "lion", "seahorse", "heavenly horse",
          "suanni", "yanyu", "xiezhi", "douniu", "hangshi"]

N = 10
APPEAR0 = 3.0          # first beast appears
STEP = 1.55            # seconds between beasts
HILITE = APPEAR0 + (N - 1) * STEP + 0.6   # when the 10th gets highlighted (~17.0)

# ridge geometry: front (eave, lower-right) -> back (upper-left)
FX, FY = 892, 1052     # immortal stands here (front)
BX, BY = 196, 566      # last beast (back)


def cl(p): return min(max(p, 0.0), 1.0)
def eo(p): return ease_out_cubic(cl(p))


def lerp(a, b, f): return a + (b - a) * f


def slot_xy(k):
    """k=0 immortal (front) .. k=N beasts queued behind. Evenly along the ridge."""
    f = k / (N + 0.2)
    return lerp(FX, BX, f), lerp(FY, BY, f)


def scale_for(k):
    """figures shrink slightly toward the back for depth."""
    return 1.08 - 0.34 * (k / (N + 0.2))


def text(x, y, s, fs, fill, anchor="start", font=FEN, weight="bold", op=1.0, extra=""):
    return (f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" font-family="{font}" font-weight="{weight}" '
            f'font-size="{fs}" fill="{C.get(fill, fill)}" opacity="{op:.3f}" {extra}>{esc(s)}</text>')


def rect(x, y, w, h, fill, sw=5, rx=0, op=1.0, stroke=None):
    return (f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{C.get(fill, fill)}" '
            f'stroke="{C.get(stroke, stroke) if stroke else C["outline"]}" stroke-width="{sw}" stroke-linejoin="round" opacity="{op:.3f}"/>')


def path(d, fill, sw=5, stroke=None, op=1.0):
    return (f'<path d="{d}" fill="{C.get(fill, fill) if fill != "none" else "none"}" '
            f'stroke="{C.get(stroke, stroke) if stroke else C["outline"]}" stroke-width="{sw}" '
            f'stroke-linejoin="round" stroke-linecap="round" opacity="{op:.3f}"/>')


def window(t, t0, t1, fi=0.3, fo=0.3):
    if t < t0 or t >= t1:
        return 0.0
    a_in = 1.0 if fi <= 0.01 else eo((t - t0) / fi)
    a_out = 1.0 if fo <= 0.01 else eo((t1 - t) / fo)
    return min(a_in, a_out)


def roof(op=1.0):
    """a sloped palace roof: the ridge line (figures stand on it) with the roof plane below it."""
    o = []
    # roof plane below the ridge (parallelogram), tiled
    dx, dy = 86, 150          # offset from ridge down to eave
    o.append(path(f"M {FX},{FY} L {BX},{BY} L {BX+dx},{BY+dy} L {FX+dx},{FY+dy} Z", "roof", sw=0, op=op))
    # tile lines down the slope
    for g in range(0, 15):
        f = g / 14
        x0, y0 = lerp(FX, BX, f), lerp(FY, BY, f)
        o.append(path(f"M {x0:.1f},{y0:.1f} L {x0+dx},{y0+dy}", "none", sw=2, stroke="roof_dark", op=op * 0.7))
    # lower (front) eave band
    o.append(path(f"M {FX+dx},{FY+dy} L {BX+dx},{BY+dy}", "none", sw=10, stroke="roof_light", op=op))
    # the ridge itself (thick), figures stand on top of this
    o.append(path(f"M {FX+26},{FY+14} L {BX+22},{BY+12}", "none", sw=34, stroke="ridge", op=op))
    o.append(path(f"M {FX+26},{FY+14} L {BX+22},{BY+12}", "none", sw=10, stroke="ridge_tile", op=op * 0.8))
    return "".join(o)


def beast(x, y, s, lit=False, op=1.0):
    """a crouching ridge-beast silhouette facing downslope (to the lower-right)."""
    col = "beast_lit" if lit else "beast"
    edge = "accent" if lit else "beast_edge"
    sw = 4 if lit else 3
    o = []
    # haunch (raised rear, upslope/left)
    o.append(f'<ellipse cx="{x-18*s:.1f}" cy="{y-30*s:.1f}" rx="{20*s:.1f}" ry="{24*s:.1f}" '
             f'fill="{C[col]}" stroke="{C[edge]}" stroke-width="{sw}" opacity="{op:.3f}"/>')
    # crouched body
    o.append(f'<ellipse cx="{x+2*s:.1f}" cy="{y-24*s:.1f}" rx="{30*s:.1f}" ry="{19*s:.1f}" '
             f'fill="{C[col]}" stroke="{C[edge]}" stroke-width="{sw}" opacity="{op:.3f}"/>')
    # front legs down to the ridge
    o.append(path(f"M {x+22*s:.1f},{y-20*s:.1f} L {x+24*s:.1f},{y:.1f}", "none", sw=6*s, stroke=col, op=op))
    o.append(path(f"M {x+8*s:.1f},{y-16*s:.1f} L {x+6*s:.1f},{y:.1f}", "none", sw=6*s, stroke=col, op=op))
    # head (front, raised)
    o.append(f'<circle cx="{x+30*s:.1f}" cy="{y-44*s:.1f}" r="{13*s:.1f}" '
             f'fill="{C[col]}" stroke="{C[edge]}" stroke-width="{sw}" opacity="{op:.3f}"/>')
    # two ears / horns
    o.append(path(f"M {x+24*s:.1f},{y-54*s:.1f} l {4*s:.1f},{-13*s:.1f} l {7*s:.1f},{9*s:.1f} Z", col, sw=2, stroke=edge, op=op))
    o.append(path(f"M {x+34*s:.1f},{y-55*s:.1f} l {5*s:.1f},{-12*s:.1f} l {6*s:.1f},{10*s:.1f} Z", col, sw=2, stroke=edge, op=op))
    # curled tail up from the rear
    o.append(path(f"M {x-34*s:.1f},{y-30*s:.1f} q {-18*s:.1f},{-18*s:.1f} {2*s:.1f},{-40*s:.1f}", "none", sw=7*s, stroke=col, op=op))
    return "".join(o)


def immortal(x, y, s, op=1.0):
    """the leading immortal riding a bird (qifeng xianren) — distinct, gold, not counted."""
    o = []
    col, edge = "immortal", "immortal_edge"
    # bird body
    o.append(f'<ellipse cx="{x:.1f}" cy="{y-26*s:.1f}" rx="{34*s:.1f}" ry="{20*s:.1f}" '
             f'fill="{C[col]}" stroke="{C[edge]}" stroke-width="4" opacity="{op:.3f}"/>')
    # bird tail fan (behind, upslope)
    o.append(path(f"M {x-30*s:.1f},{y-26*s:.1f} l {-30*s:.1f},{-10*s:.1f} l {4*s:.1f},{16*s:.1f} l {-24*s:.1f},{8*s:.1f} l {28*s:.1f},{6*s:.1f} Z",
                  col, sw=3, stroke=edge, op=op))
    # bird head/neck forward
    o.append(path(f"M {x+30*s:.1f},{y-34*s:.1f} q {18*s:.1f},{-4*s:.1f} {20*s:.1f},{-22*s:.1f}", "none", sw=8*s, stroke=col, op=op))
    o.append(f'<circle cx="{x+50*s:.1f}" cy="{y-58*s:.1f}" r="{8*s:.1f}" fill="{C[col]}" stroke="{C[edge]}" stroke-width="3" opacity="{op:.3f}"/>')
    # legs
    o.append(path(f"M {x-6*s:.1f},{y-8*s:.1f} L {x-8*s:.1f},{y:.1f}", "none", sw=5*s, stroke=col, op=op))
    o.append(path(f"M {x+12*s:.1f},{y-8*s:.1f} L {x+14*s:.1f},{y:.1f}", "none", sw=5*s, stroke=col, op=op))
    # seated human figure on top
    o.append(f'<circle cx="{x-2*s:.1f}" cy="{y-58*s:.1f}" r="{10*s:.1f}" fill="{C[col]}" stroke="{C[edge]}" stroke-width="3" opacity="{op:.3f}"/>')
    o.append(path(f"M {x-2*s:.1f},{y-48*s:.1f} L {x-2*s:.1f},{y-28*s:.1f}", "none", sw=10*s, stroke=col, op=op))
    return "".join(o)


def counter(t):
    """top counter card: how many beasts placed so far, out of 10."""
    placed = sum(1 for k in range(1, N + 1) if t >= APPEAR0 + (k - 1) * STEP)
    op = window(t, 1.2, DUR, fi=0.5, fo=0.001)
    if op <= 0:
        return ""
    gold = placed >= N and t >= HILITE
    o = [f'<g opacity="{op:.3f}">',
         rect(360, 150, 360, 150, "card", sw=3, rx=22, stroke="accent" if gold else "ridge_tile"),
         text(540, 236, f"{placed}", 92, "beast_lit" if gold else "ink", anchor="middle"),
         text(620, 236, "/ 10", 48, "accent", anchor="start"),
         text(540, 282, "RIDGE BEASTS", 28, "ink_dim", anchor="middle"),
         '</g>']
    return "".join(o)


def scene(t):
    o = [f'<g>', roof(op=1.0)]
    # immortal leads from the start
    ox, oy = slot_xy(0)
    o.append(immortal(ox, oy, scale_for(0), op=window(t, 0.6, DUR, fi=0.6, fo=0.001)))
    oi = eo((t - 1.6) / 0.6)
    if oi > 0:
        o.append(text(ox, oy - 100, "仙人", 30, "immortal_edge", anchor="middle", font=FCN, weight="normal", op=oi))
        o.append(text(ox, oy - 66, "leads — not counted", 26, "ink_dim", anchor="middle", op=oi))
    # beasts 1..10 appear one by one
    for k in range(1, N + 1):
        ta = APPEAR0 + (k - 1) * STEP
        a = window(t, ta, DUR, fi=0.45, fo=0.001)
        if a <= 0:
            continue
        x, y = slot_xy(k)
        s = scale_for(k)
        lit = (k == N and t >= HILITE)
        # pop-in rise
        rise = (1 - eo((t - ta) / 0.45)) * 26
        o.append(beast(x, y - rise, s, lit=lit, op=a))
        # small number above
        nb = eo((t - ta) / 0.5)
        if nb > 0:
            ncol = "beast_lit" if lit else "accent"
            o.append(text(x, y - 74 * s - rise, f"{k}", 30 if not lit else 40, ncol, anchor="middle", op=nb))
    # highlight the 10th: gold ring + 行什 label
    hl = window(t, HILITE, DUR, fi=0.5, fo=0.001)
    if hl > 0:
        x, y = slot_xy(N)
        pulse = 0.5 + 0.5 * math.sin((t - HILITE) * 4)
        o.append(f'<circle cx="{x:.1f}" cy="{y-34:.1f}" r="{52}" fill="none" stroke="{C["accent"]}" '
                 f'stroke-width="5" opacity="{hl * (0.5 + 0.4 * pulse):.3f}"/>')
        o.append(rect(548, 372, 482, 150, "card", sw=3, rx=18, op=hl, stroke="accent"))
        o.append(text(580, 432, "#10  行什  hangshi", 46, "beast_lit", font=FCN, weight="bold", op=hl))
        o.append(text(580, 484, "on no other roof in China", 34, "ink", op=hl))
    o.append('</g>')
    return "".join(o)


def frame_svg(t):
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
         f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/>']
    g = [f'M{x},0 V{H}' for x in range(0, W, 90)] + [f'M0,{y} H{W}' for y in range(0, H, 90)]
    o.append(f'<path d="{" ".join(g)}" stroke="{C["grid"]}" stroke-width="2"/>')
    o.append(counter(t))
    o.append(scene(t))
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
    mp4 = os.path.join(out_dir, "roof_beasts_1080x1920.mp4")
    t1 = time.time()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(fdir, "f_%05d.png"),
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
                    "-movflags", "+faststart", mp4], check=True)
    print(f"encoded {mp4} in {time.time()-t1:.1f}s; total {time.time()-t0:.1f}s")


if __name__ == "__main__":
    main()
