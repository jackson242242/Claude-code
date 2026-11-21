#!/usr/bin/env python3
"""Great Wall rammed-earth explainer: code-drawn SVG frames -> PNG -> MP4 (the diagram middle only).

A wall cross-section is built inside a pair of wooden formwork boards (版筑 banzhu): earth is
packed in one thin layer at a time (夯土 hangtu), a few reed/tamarisk fascine bands appear among
the layers (desert sections, 芦苇/柽柳), and finally a thin brick skin is laid on the outer face
(明代包砖 — the Ming addition, mostly near Beijing). A length read-out at the end makes the point:
of ~21,196 km surveyed, the brick-and-stone Ming wall is only ~8,852 km, so most of the Wall is
earth, not brick.

No footage, no AI imagery in this clip; the real Great Wall open/close shots are concatenated by
scripts/assemble-video.mjs via --clips. EN sentence captions are burned by assemble-video from
subs.srt, so the drawing keeps y < 1260 free of essential content for the lower-third band.

Usage: python3 -I render_rammed_earth.py <out_dir> [--preview t1,t2,...]
"""
import math, os, subprocess, sys, time
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render_svg_anim import ease_out_cubic, esc  # noqa: E402
import cairosvg  # noqa: E402

W, H, FPS = 1080, 1920, 30
DUR = 24.0
C = {
    "bg": "#171009", "grid": "#231810", "ink": "#f4ead6", "ink_dim": "#bda886",
    "earth": "#9c6b34", "earth_dk": "#7a4f22", "earth_lt": "#b5823f",
    "reed": "#b24a2c", "reed_lt": "#d9693f",
    "board": "#4a3418", "board_edge": "#caa05a",
    "brick": "#8a9199", "brick_dk": "#5f666e", "brick_edge": "#aeb6bf",
    "accent": "#e8a33a", "gold": "#f0b429", "card": "#241a10", "outline": "#0c0905",
}
FEN, FCN = "DejaVu Sans", "Noto Serif CJK SC"

# wall cross-section geometry (bottom-up)
BY = 1150          # ground / bottom of wall
LX, RX = 372, 708  # inner faces of the earth core (width 336)
CW = RX - LX
LH = 30            # one tamped layer
NL = 18            # earth layers -> top at BY - NL*LH = 610
TOPY = BY - NL * LH
REED_LAYERS = {4, 9, 14}   # 1-based layer indices drawn as reed/tamarisk fascine bands

APPEAR0 = 2.0      # first layer lands
STEP = 0.60        # seconds between layers  (layer 18 ~ t 12.2)
REED_T = 13.6      # reeds get highlighted + labelled
BRICK_T = 18.0     # brick skin rises on the outer face
STAT_T = 21.0      # length read-out


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


def layer_y(k):
    """top-left y of layer k (1-based from the bottom)."""
    return BY - k * LH


def ground():
    o = [rect(LX - 60, BY, CW + 120, 14, "earth_dk", sw=0, op=1.0)]
    o.append(f'<line x1="120" y1="{BY+14}" x2="{W-120}" y2="{BY+14}" stroke="{C["ink_dim"]}" stroke-width="3" stroke-dasharray="16 12" opacity="0.6"/>')
    return "".join(o)


def boards(t):
    """two vertical formwork planks that hold the earth while it is tamped."""
    op = window(t, 0.3, DUR, fi=0.5, fo=0.001)
    if op <= 0:
        return ""
    top = TOPY - 20
    h = BY - top
    o = ['<g opacity="%.3f">' % op,
         rect(LX - 30, top, 26, h, "board", sw=3, stroke="board_edge"),
         rect(RX + 4, top, 26, h, "board", sw=3, stroke="board_edge")]
    # tie-beam across the top of the boards
    o.append(rect(LX - 34, top - 10, CW + 72, 14, "board", sw=3, stroke="board_edge"))
    o.append('</g>')
    # side label for the formwork
    la = eo((t - 1.0) / 0.6)
    if la > 0:
        o.append(side_label(LX - 30, top + 90, 70, 430, "版筑  bǎnzhù", "formwork", la, side="left"))
    return "".join(o)


def side_label(ax, ay, lx_off, ly, cn, en, op, side="left"):
    """a short label card off to one side with a leader line to (ax,ay)."""
    if side == "left":
        lx = 70
        tx = 90
        anchor = "start"
        mid = 150
    else:
        lx = W - 70
        tx = W - 90
        anchor = "end"
        mid = W - 150
    leader = (f'<polyline points="{ax:.0f},{ay:.0f} {mid},{ly-16} {lx},{ly-16}" fill="none" '
              f'stroke="{C["accent"]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>'
              f'<circle cx="{ax:.0f}" cy="{ay:.0f}" r="7" fill="{C["accent"]}"/>')
    return (f'<g opacity="{op:.3f}">{leader}'
            f'{text(tx, ly - 24, cn, 40, "accent", anchor=anchor, font=FCN)}'
            f'{text(tx, ly + 14, en, 30, "ink_dim", anchor=anchor)}</g>')


def layers(t):
    o = []
    placed = 0
    for k in range(1, NL + 1):
        ta = APPEAR0 + (k - 1) * STEP
        a = window(t, ta, DUR, fi=0.4, fo=0.001)
        if a <= 0:
            continue
        placed = k
        y = layer_y(k)
        rise = (1 - eo((t - ta) / 0.4)) * 16
        is_reed = k in REED_LAYERS
        reed_hot = is_reed and t >= REED_T
        fill = ("reed_lt" if reed_hot else "reed") if is_reed else ("earth_lt" if k % 2 else "earth")
        o.append(rect(LX, y - rise, CW, LH - 3, fill, sw=2, stroke="earth_dk", op=a))
        # tamp marks on the freshest earth layer
        if not is_reed and t - ta < 0.6:
            for mx in range(1, 6):
                xx = LX + CW * mx / 6
                o.append(f'<line x1="{xx:.0f}" y1="{y-rise-6:.0f}" x2="{xx:.0f}" y2="{y-rise+6:.0f}" stroke="{C["earth_dk"]}" stroke-width="2" opacity="{a*0.6:.3f}"/>')
    # reed label once the fascine bands are highlighted
    rl = window(t, REED_T, DUR, fi=0.5, fo=0.001)
    if rl > 0 and REED_LAYERS:
        ky = layer_y(max(REED_LAYERS)) + LH / 2
        o.append(side_label(LX, ky, 70, 620, "芦苇·柽柳", "reeds", rl, side="left"))
    return "".join(o), placed


def bricks(t):
    """a thin brick skin laid on the outer (right) face — the Ming addition."""
    op = window(t, BRICK_T, DUR, fi=0.5, fo=0.001)
    if op <= 0:
        return ""
    o = []
    bw, bh = 44, 20
    bx = RX + 34
    rows = NL * LH // bh
    for r in range(rows):
        ta = BRICK_T + 0.08 * r
        a = window(t, ta, DUR, fi=0.3, fo=0.001)
        if a <= 0:
            continue
        y = BY - (r + 1) * bh
        off = (r % 2) * 6
        o.append(rect(bx + off, y, bw, bh - 3, "brick" if r % 2 else "brick_dk", sw=2, stroke="brick_edge", op=a))
    lb = window(t, BRICK_T + 0.6, DUR, fi=0.5, fo=0.001)
    if lb > 0:
        o.append(side_label(bx + bw, BY - rows * bh * 0.72, 70, 940, "明代包砖", "brick skin", lb, side="right"))
    return "".join(o)


def topcard(t):
    """top card: a layer counter while building, then the length read-out at the end."""
    o = []
    building = window(t, 1.2, STAT_T, fi=0.5, fo=0.35)
    placed = sum(1 for k in range(1, NL + 1) if t >= APPEAR0 + (k - 1) * STEP)
    if building > 0:
        o = [f'<g opacity="{building:.3f}">',
             rect(330, 150, 420, 150, "card", sw=3, rx=22, stroke="earth_dk"),
             text(452, 240, f"{placed}", 90, "ink", anchor="middle"),
             text(534, 240, "layers", 44, "accent", anchor="start"),
             text(540, 284, "EARTH, TAMPED ONE AT A TIME", 25, "ink_dim", anchor="middle"),
             '</g>']
    stat = window(t, STAT_T, DUR, fi=0.5, fo=0.001)
    if stat > 0:
        o = [f'<g opacity="{stat:.3f}">',
             rect(150, 140, 780, 230, "card", sw=3, rx=24, stroke="accent"),
             text(540, 210, "THE GREAT WALL, SURVEYED", 30, "ink_dim", anchor="middle"),
             text(300, 290, "21,196 km", 60, "ink", anchor="middle"),
             text(300, 336, "total, all eras", 28, "ink_dim", anchor="middle"),
             text(760, 290, "8,852 km", 60, "gold", anchor="middle"),
             text(760, 336, "Ming brick + stone", 28, "accent", anchor="middle"),
             '</g>']
    return "".join(o)


def frame_svg(t):
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
         f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/>']
    g = [f'M{x},0 V{H}' for x in range(0, W, 90)] + [f'M0,{y} H{W}' for y in range(0, H, 90)]
    o.append(f'<path d="{" ".join(g)}" stroke="{C["grid"]}" stroke-width="2"/>')
    o.append(ground())
    o.append(boards(t))
    lay, _ = layers(t)
    o.append(lay)
    o.append(bricks(t))
    o.append(topcard(t))
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
    mp4 = os.path.join(out_dir, "rammed_earth_1080x1920.mp4")
    t1 = time.time()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(fdir, "f_%05d.png"),
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
                    "-movflags", "+faststart", mp4], check=True)
    print(f"encoded {mp4} in {time.time()-t1:.1f}s; total {time.time()-t0:.1f}s")


if __name__ == "__main__":
    main()
