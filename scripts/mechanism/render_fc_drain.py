#!/usr/bin/env python3
"""Forbidden City drainage explainer: code-drawn SVG frames -> PNG -> MP4 (the diagram middle only).
Reuses easing/esc from render_svg_anim.py. No footage, no AI imagery in this clip; the real
Forbidden City open/close clips are concatenated by scripts/assemble-video.mjs via --clips.
Captions (EN sentences) are NOT drawn here: they are burned by assemble-video.mjs from subs.srt,
so the drawing keeps y < 1260 free of essential content for the lower-third subtitle band.
A side cross-section builds up over 4 steps: sloped ground -> dragon-head spouts ->
underground culverts -> Inner Golden Water River & moat, with water droplets flowing through.
Usage: python3 -I render_fc_drain.py <out_dir> [--preview t1,t2,...]
"""
import math, os, subprocess, sys, time
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render_svg_anim import ease_out_cubic, esc  # noqa: E402
import cairosvg  # noqa: E402

W, H, FPS = 1080, 1920, 30
DUR = 26.0
C = {
    "bg": "#0d1420", "grid": "#152133", "ink": "#eaf2ff", "ink_dim": "#9fb3cc",
    "stone": "#c7bfae", "stone_dark": "#7d725f", "stone_light": "#e4ddcc",
    "roof": "#b4452f", "roof_dark": "#7c2d1e", "outline": "#0a0f17",
    "water": "#3fa9d6", "water_deep": "#1f6f99", "water_light": "#8fdcff",
    "soil": "#20150f", "soil_line": "#4a3524", "culvert": "#16212e",
    "accent": "#f0b429", "gold": "#f0b429", "card": "#131f30",
}
FEN, FCN = "DejaVu Sans", "Noto Serif CJK SC"


def cl(p): return min(max(p, 0.0), 1.0)
def eo(p): return ease_out_cubic(cl(p))


def window(t, t0, t1, fi=0.25, fo=0.25):
    if t < t0 or t >= t1:
        return 0.0
    a_in = 1.0 if fi <= 0.01 else eo((t - t0) / fi)
    a_out = 1.0 if fo <= 0.01 else eo((t1 - t) / fo)
    return min(a_in, a_out)


def text(x, y, s, fs, fill, anchor="start", font=FEN, weight="bold", op=1.0, extra=""):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{font}" font-weight="{weight}" '
            f'font-size="{fs}" fill="{C.get(fill, fill)}" opacity="{op:.3f}" {extra}>{esc(s)}</text>')


def rect(x, y, w, h, fill, sw=5, rx=0, op=1.0, stroke=None):
    return (f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{C.get(fill, fill)}" '
            f'stroke="{C.get(stroke, stroke) if stroke else C["outline"]}" stroke-width="{sw}" stroke-linejoin="round" opacity="{op:.3f}"/>')


def path(d, fill, sw=5, stroke=None, op=1.0, extra=""):
    return (f'<path d="{d}" fill="{C.get(fill, fill) if fill != "none" else "none"}" '
            f'stroke="{C.get(stroke, stroke) if stroke else C["outline"]}" stroke-width="{sw}" '
            f'stroke-linejoin="round" stroke-linecap="round" opacity="{op:.3f}" {extra}/>')


def arrow(x1, y1, x2, y2, p=1.0, col="accent", sw=10, hl=24):
    if p <= 0:
        return ""
    xe = x1 + (x2 - x1) * p
    ye = y1 + (y2 - y1) * p
    a = math.atan2(y2 - y1, x2 - x1)
    h1 = (xe - hl * math.cos(a - 0.5), ye - hl * math.sin(a - 0.5))
    h2 = (xe - hl * math.cos(a + 0.5), ye - hl * math.sin(a + 0.5))
    return (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{xe:.1f}" y2="{ye:.1f}" stroke="{C[col]}" stroke-width="{sw}" stroke-linecap="round"/>'
            f'<polygon points="{xe:.1f},{ye:.1f} {h1[0]:.1f},{h1[1]:.1f} {h2[0]:.1f},{h2[1]:.1f}" fill="{C[col]}"/>')


def chip(t, t0, t1, num, title, cn):
    op = window(t, t0, t1)
    if op <= 0:
        return ""
    return (f'<g opacity="{op:.3f}">'
            + rect(60, 150, 960, 116, "card", sw=3, rx=18, stroke="accent")
            + rect(60, 150, 16, 116, "accent", sw=0, rx=8)
            + text(104, 198, f"STEP {num}/4", 30, "accent")
            + text(104, 246, title, 42, "ink")
            + text(990, 200, cn, 34, "gold", anchor="end", font=FCN, weight="normal")
            + '</g>')


# ---------------------------------------------------------------- geometry of the cross-section
# Ground line slopes from north (left, high) to south (right, low). Terrace sits mid-left,
# culvert runs underground to the right, river/moat basin at far right.
GY_L, GY_R = 980, 1120           # ground y at left (north, high) and right (south, low)
GX_L, GX_R = 90, 990


def ground_y(x):
    f = (x - GX_L) / (GX_R - GX_L)
    return GY_L + (GY_R - GY_L) * f


def slope_path():
    return f"M {GX_L},{GY_L:.1f} L {GX_R},{GY_R:.1f}"


def droplet(x, y, r, op=1.0, col="water"):
    return (f'<path d="M {x:.1f},{y - r:.1f} C {x + r:.1f},{y - r*0.1:.1f} {x + r*0.7:.1f},{y + r:.1f} {x:.1f},{y + r:.1f} '
            f'C {x - r*0.7:.1f},{y + r:.1f} {x - r:.1f},{y - r*0.1:.1f} {x:.1f},{y - r:.1f} Z" '
            f'fill="{C[col]}" opacity="{op:.3f}"/>')


def terrace(op=1.0):
    """three-tier marble terrace on the left, drawn as stacked steps; returns svg string."""
    o = []
    base_x, base_y = 150, 980
    tiers = [(300, 56), (240, 52), (182, 50)]
    y = base_y
    x = base_x
    for i, (w, h) in enumerate(tiers):
        o.append(rect(x, y - h, w, h, "stone", sw=4, op=op, stroke="stone_dark"))
        o.append(rect(x, y - h, w, 8, "stone_light", sw=0, op=op))
        x += 26
        y -= h
    # a small hall silhouette on top
    tx, tw = x - 6, 150
    o.append(rect(tx, y - 70, tw, 70, "stone_dark", sw=4, op=op))
    o.append(path(f"M {tx-24},{y-70:.1f} L {tx+tw+24},{y-70:.1f} L {tx+tw-6},{y-112:.1f} L {tx+6},{y-112:.1f} Z",
                  "roof", sw=4, op=op, stroke="roof_dark"))
    return "".join(o), base_x, base_y, tiers


def spout(x, y, gush=0.0, op=1.0):
    """a dragon-head spout jutting from the terrace edge; gush 0..1 draws a water stream."""
    o = [path(f"M {x:.1f},{y:.1f} l 34,-6 l 8,10 l -10,8 l -30,0 Z", "stone_light", sw=3, op=op, stroke="stone_dark"),
         f'<circle cx="{x+30:.1f}" cy="{y:.1f}" r="4" fill="{C["outline"]}" opacity="{op:.3f}"/>']
    if gush > 0:
        n = int(6 * gush) + 1
        for k in range(n):
            dy = (y + 8) + k * 16 + 10 * gush
            o.append(droplet(x + 38 + k * 6, dy, 7 - k * 0.4, op=op * (1 - k / (n + 2)), col="water_light"))
    return "".join(o)


# ---------------------------------------------------------------- phases
def flow_drops(t, tstart, path_pts, col="water", n=7, speed=0.55, r=9, op=1.0):
    """animate n droplets travelling along a polyline path_pts over time."""
    if t < tstart:
        return ""
    out = []
    segs = []
    total = 0.0
    for i in range(len(path_pts) - 1):
        (x1, y1), (x2, y2) = path_pts[i], path_pts[i + 1]
        L = math.hypot(x2 - x1, y2 - y1)
        segs.append((x1, y1, x2, y2, L))
        total += L
    for k in range(n):
        ph = ((t - tstart) * speed + k / n) % 1.0
        d = ph * total
        acc = 0.0
        for (x1, y1, x2, y2, L) in segs:
            if acc + L >= d:
                f = (d - acc) / max(L, 0.01)
                out.append(droplet(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f, r, op=op, col=col))
                break
            acc += L
    return "".join(out)


def phase_slope(t):
    op = window(t, 0.0, 6.0, fi=0.001, fo=0.3)
    if op <= 0:
        return ""
    o = [f'<g opacity="{op:.3f}">', chip(t, 0.0, 6.0, 1, "The ground is tilted", "北高南低")]
    # soil block under the slope
    o.append(path(f"{slope_path()} L {GX_R},1240 L {GX_L},1240 Z", "soil", sw=0))
    o.append(path(slope_path(), "none", sw=7, stroke="soil_line"))
    # north / south markers
    a = eo((t - 0.4) / 0.5)
    if a > 0:
        o.append(text(GX_L + 14, GY_L - 20, "N · high", 34, "ink", op=a))
        o.append(text(GX_R - 14, GY_R - 20, "S · low", 34, "ink", anchor="end", op=a))
        o.append(arrow(260, GY_L - 70, 820, ground_y(820) - 70, p=eo((t - 1.0) / 1.2), col="accent", sw=8))
    # rolling droplets down the slope
    pts = [(GX_L + 40, ground_y(GX_L + 40) - 16), (GX_R - 40, ground_y(GX_R - 40) - 16)]
    o.append(flow_drops(t, 1.2, pts, n=6, speed=0.5, r=11, op=min(1.0, (t - 1.2) / 0.6) if t > 1.2 else 0))
    a2 = eo((t - 3.4) / 0.5)
    if a2 > 0:
        o.append(text(540, 760, "the north end sits higher", 40, "gold", anchor="middle", op=a2))
        o.append(text(540, 812, "rain runs off on its own", 32, "ink_dim", anchor="middle", op=a2))
    o.append('</g>')
    return "".join(o)


def phase_spouts(t):
    op = window(t, 6.0, 12.0)
    if op <= 0:
        return ""
    T = t - 6.0
    o = [f'<g opacity="{op:.3f}">', chip(t, 6.0, 12.0, 2, "Dragon-head spouts", "螭首 chīshǒu")]
    ter, bx, by, tiers = terrace(op=1.0)
    o.append(path(f"M {GX_L},{GY_L:.1f} L {GX_R},{GY_R:.1f} L {GX_R},1240 L {GX_L},1240 Z", "soil", sw=0, op=0.5))
    o.append(ter)
    # spouts on each tier edge, gushing
    gush = eo((T - 0.8) / 1.0)
    edges = []
    y = by
    x = bx
    for i, (w, h) in enumerate(tiers):
        sx = x + w
        sy = y - h + h * 0.5
        o.append(spout(sx, sy, gush=gush, op=1.0))
        edges.append((sx + 40, sy + 10))
        x += 26
        y -= h
    a2 = eo((T - 2.6) / 0.5)
    if a2 > 0:
        o.append(text(1015, 470, "dragon heads line", 42, "ink", anchor="end", op=a2))
        o.append(text(1015, 520, "every terrace edge", 42, "ink", anchor="end", op=a2))
        o.append(text(1015, 570, 'they "spit" the rain', 40, "gold", anchor="end", op=a2))
    a3 = eo((T - 4.2) / 0.5)
    if a3 > 0:
        o.append(text(540, 1180, "water leaves the platform fast", 36, "ink_dim", anchor="middle", op=a3))
    o.append('</g>')
    return "".join(o)


def phase_culvert(t):
    op = window(t, 12.0, 18.5)
    if op <= 0:
        return ""
    T = t - 12.0
    o = [f'<g opacity="{op:.3f}">', chip(t, 12.0, 18.5, 3, "Hidden underground culverts", "暗沟 àngōu")]
    # surface line
    o.append(path(f"M {GX_L},960 L {GX_R},1020", "none", sw=6, stroke="soil_line"))
    o.append(path(f"M {GX_L},960 L {GX_R},1020 L {GX_R},1240 L {GX_L},1240 Z", "soil", sw=0))
    # a buried culvert channel (dashed) running down-right, revealed
    rev = eo(T / 1.4)
    cx0, cy0, cx1, cy1 = 150, 1055, 980, 1120
    xr = cx0 + (cx1 - cx0) * rev
    yr = cy0 + (cy1 - cy0) * rev
    o.append(f'<path d="M {cx0},{cy0} L {xr:.1f},{yr:.1f}" fill="none" stroke="{C["culvert"]}" stroke-width="54" stroke-linecap="round"/>')
    o.append(f'<path d="M {cx0},{cy0} L {xr:.1f},{yr:.1f}" fill="none" stroke="{C["water_deep"]}" stroke-width="30" stroke-linecap="round" opacity="0.7"/>')
    o.append(f'<path d="M {cx0},{cy0} L {cx1},{cy1}" fill="none" stroke="{C["ink_dim"]}" stroke-width="2" stroke-dasharray="12 12" opacity="0.6"/>')
    # inlet from surface into the culvert
    o.append(arrow(240, 980, 220, 1040, p=eo((T - 1.0) / 0.6), col="water", sw=8))
    # flowing water through the culvert
    o.append(flow_drops(t, 13.6, [(cx0, cy0), (cx1, cy1)], col="water_light", n=8, speed=0.6, r=9,
                        op=min(1.0, (T - 1.6) / 0.6) if T > 1.6 else 0))
    a2 = eo((T - 2.6) / 0.5)
    if a2 > 0:
        o.append(rect(250, 560, 580, 150, "card", sw=3, rx=16, op=a2, stroke="accent"))
        o.append(text(540, 626, "~13 km", 86, "accent", anchor="middle", op=a2))
        o.append(text(540, 684, "of channels run underground", 34, "ink", anchor="middle", op=a2))
    o.append('</g>')
    return "".join(o)


def phase_river(t):
    op = window(t, 18.5, DUR, fo=0.001)
    if op <= 0:
        return ""
    T = t - 18.5
    o = [f'<g opacity="{op:.3f}">', chip(t, 18.5, DUR, 4, "Into the river, out the moat", "内金水河 → 护城河")]
    # culvert from left feeding a basin on the right
    o.append(f'<path d="M 120,1000 L 640,1070" fill="none" stroke="{C["culvert"]}" stroke-width="48" stroke-linecap="round"/>')
    # basin (the Inner Golden Water River) then moat
    rise = eo((T - 1.2) / 2.0)
    basin_top = 1150 - 150 * rise
    o.append(path("M 620,1060 Q 760,1060 820,1150 L 980,1150 L 980,1240 L 620,1240 Z", "water_deep", sw=0))
    o.append(rect(620, basin_top, 360, 1240 - basin_top, "water", sw=0, op=0.85))
    # ripple line on the water surface
    rip = []
    for x in range(620, 981, 16):
        rip.append(f"{x},{basin_top + 6 * math.sin(x / 40.0 + T * 5):.1f}")
    o.append(f'<polyline points="{" ".join(rip)}" fill="none" stroke="{C["water_light"]}" stroke-width="4" opacity="0.8"/>')
    o.append(flow_drops(t, 19.0, [(140, 1004), (640, 1074)], col="water_light", n=7, speed=0.6, r=9,
                        op=min(1.0, T / 0.5)))
    a1 = eo((T - 0.6) / 0.5)
    if a1 > 0:
        o.append(text(800, basin_top - 24, "内金水河", 40, "water_light", anchor="middle", font=FCN, weight="normal", op=a1))
        o.append(text(800, basin_top - 70, "Golden Water River → moat", 32, "ink", anchor="middle", op=a1))
    a2 = eo((T - 3.4) / 0.5)
    if a2 > 0:
        o.append(rect(150, 470, 780, 150, "card", sw=3, rx=16, op=a2, stroke="accent"))
        o.append(text(540, 536, "2016: modern Beijing flooded.", 40, "ink", anchor="middle", op=a2))
        o.append(text(540, 590, "This 600-year-old system drained.", 40, "gold", anchor="middle", op=a2))
    o.append('</g>')
    return "".join(o)


def frame_svg(t):
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
         f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/>']
    g = [f'M{x},0 V{H}' for x in range(0, W, 90)] + [f'M0,{y} H{W}' for y in range(0, H, 90)]
    o.append(f'<path d="{" ".join(g)}" stroke="{C["grid"]}" stroke-width="2"/>')
    o += [phase_slope(t), phase_spouts(t), phase_culvert(t), phase_river(t)]
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
    mp4 = os.path.join(out_dir, "fc_drain_1080x1920.mp4")
    t1 = time.time()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(fdir, "f_%05d.png"),
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
                    "-movflags", "+faststart", mp4], check=True)
    print(f"encoded {mp4} in {time.time()-t1:.1f}s; total {time.time()-t0:.1f}s")


if __name__ == "__main__":
    main()
