#!/usr/bin/env python3
"""arch-M-10: 'About 13 km of the Forbidden City's drains are underground.' (28 s, code-drawn).
Child #3 of M-Long #2 (Forbidden City drainage). Side cross-section, schematic (tagged on screen):
open courtyard ditch -> covered underground channel -> Inner Golden Water River (top-down inset:
bow-shaped, 5 marble bridges) -> moat -> end card.
Numbers only from plans/mechanism/forbidden-city-drainage/longform-script.md ledger:
F8/F9 (~15 km of ancient ditches, ~13 km underground), F10 (river -> moat), F11 (5 bridges),
F4 (moat 52 m wide). The '3x a year' dredging line (F21) is deliberately NOT drawn (medium).
No footage, no AI imagery. Captions are burned by assemble-video.mjs; nothing is drawn below y=1260.
Reuses the palette/helpers of render_fc_drain.py.
Usage: python3 -I render_fc_drain_child.py <out_dir> [--preview t1,t2,...]
"""
import math, os, subprocess, sys, time
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render_fc_drain import (C, W, H, FPS, FCN, text, rect, path, droplet, window, eo, cl, arrow)  # noqa: E402
import cairosvg  # noqa: E402

DUR = 28.0
GY = 700                       # ground surface (courtyard paving)
DITCH_X0, DITCH_X1 = 150, 230  # open ditch
CUL_Y0, CUL_Y1 = 840, 900      # culvert top / bottom
CUL_X1 = 700                   # culvert outfall
RIV_X0, RIV_X1 = 700, 830      # Inner Golden Water River (section)
MOAT_X0, MOAT_X1 = 880, 1040   # moat (section)
T1, T2, T3, T4, T5 = 3.4, 9.0, 15.0, 21.0, 25.5


def chip(t, t0, t1, num, title, cn):
    op = window(t, t0, t1)
    if op <= 0:
        return ""
    return (f'<g opacity="{op:.3f}">' + rect(60, 150, 960, 116, "card", sw=3, rx=18, stroke="accent")
            + rect(60, 150, 16, 116, "accent", sw=0, rx=8) + text(104, 198, f"STEP {num}/4", 30, "accent")
            + text(104, 246, title, 42, "ink") + text(990, 200, cn, 34, "gold", anchor="end", font=FCN, weight="normal") + '</g>')


def section(t):
    """ground, ditch, culvert, river and moat basins; parts fade in by step."""
    o = []
    # soil block with cut-outs for ditch / river / moat
    o.append(path(f"M 0,{GY} L {DITCH_X0},{GY} L {DITCH_X0},{GY+60} L {DITCH_X1},{GY+60} L {DITCH_X1},{GY} "
                  f"L {RIV_X0},{GY} L {RIV_X0},{GY+120} L {RIV_X1},{GY+120} L {RIV_X1},{GY} "
                  f"L {MOAT_X0},{GY} L {MOAT_X0},{GY+170} L {MOAT_X1},{GY+170} L {MOAT_X1},{GY} L {W},{GY} "
                  f"L {W},1000 L 0,1000 Z", "soil", sw=4, stroke="soil_line"))
    o.append(path(f"M 0,{GY} L {DITCH_X0},{GY} M {DITCH_X1},{GY} L {RIV_X0},{GY} M {RIV_X1},{GY} L {MOAT_X0},{GY} "
                  f"M {MOAT_X1},{GY} L {W},{GY}", "none", sw=10, stroke="stone_light"))
    # halls on the courtyard
    for x, w, h in [(260, 150, 130), (470, 130, 110)]:
        o.append(rect(x, GY - h, w, h, "stone_dark", sw=4))
        o.append(path(f"M {x-24},{GY-h} L {x+w+24},{GY-h} L {x+w-12},{GY-h-44} L {x+12},{GY-h-44} Z", "roof", sw=4, stroke="roof_dark"))
    # culvert (step 2+): shaft from the ditch down, then a covered channel to the river
    a = eo((t - T2) / 1.0)
    if a > 0:
        o.append(f'<g opacity="{a:.3f}">'
                 + path(f"M {DITCH_X0+20},{GY+60} L {DITCH_X0+20},{CUL_Y1} L {CUL_X1},{CUL_Y1} L {CUL_X1},{CUL_Y0} "
                        f"L {DITCH_X1-20},{CUL_Y0} L {DITCH_X1-20},{GY+60} Z", "culvert", sw=5, stroke="stone")
                 + path(f"M {CUL_X1},{CUL_Y0} L {CUL_X1},{GY+120}", "none", sw=0) + '</g>')
    # water levels
    lv = eo((t - T1) / 2.0)
    o.append(rect(DITCH_X0 + 4, GY + 60 - 26 * lv, DITCH_X1 - DITCH_X0 - 8, 26 * lv, "water", sw=0))
    rv = eo((t - T3) / 2.0)
    o.append(rect(RIV_X0 + 4, GY + 120 - 50 - 30 * rv, RIV_X1 - RIV_X0 - 8, 50 + 30 * rv, "water_deep", sw=0))
    mv = eo((t - T4) / 2.0)
    o.append(rect(MOAT_X0 + 4, GY + 170 - 90 - 20 * mv, MOAT_X1 - MOAT_X0 - 8, 90 + 20 * mv, "water_deep", sw=0))
    # under-ground tag
    if a > 0:
        o.append(text(440, 960, "underground", 30, "ink_dim", anchor="middle", weight="normal", op=a))
    return "".join(o)


def labels(t):
    o = []
    a1 = eo((t - T1 - 0.6) / 0.8)
    if a1 > 0:
        o.append(f'<g opacity="{a1:.3f}">' + rect(60, 330, 380, 96, "card", sw=3, rx=14, stroke="accent")
                 + text(80, 370, "Open ditch", 32, "ink") + text(80, 410, "明沟", 30, "gold", font=FCN, weight="normal")
                 + arrow(190, 430, 190, GY + 20, 1.0, sw=6, hl=18) + '</g>')
    a2 = eo((t - T2 - 0.6) / 0.8)
    if a2 > 0:
        o.append(f'<g opacity="{a2:.3f}">' + rect(300, 1040, 480, 110, "card", sw=3, rx=14, stroke="accent")
                 + text(500, 1088, "Covered channels", 34, "ink", anchor="middle")
                 + text(690, 1088, "暗沟", 32, "gold", font=FCN, weight="normal")
                 + text(540, 1132, "≈13 km underground", 36, "gold", anchor="middle") + '</g>')
    a3 = eo((t - T3 - 0.4) / 0.8)
    if a3 > 0:
        o.append(f'<g opacity="{a3:.3f}">' + rect(560, 330, 460, 96, "card", sw=3, rx=14, stroke="accent")
                 + text(580, 370, "Inner Golden Water River", 30, "ink")
                 + text(580, 410, "内金水河", 30, "gold", font=FCN, weight="normal")
                 + arrow(765, 430, 765, GY + 30, 1.0, sw=6, hl=18) + '</g>')
    a4 = eo((t - T4 - 0.4) / 0.8)
    if a4 > 0:
        o.append(f'<g opacity="{a4:.3f}">' + rect(800, 500, 225, 96, "card", sw=3, rx=14, stroke="accent")
                 + text(815, 540, "Moat", 32, "ink") + text(910, 540, "护城河", 30, "gold", font=FCN, weight="normal")
                 + text(815, 580, "52 m wide", 32, "gold")
                 + arrow(960, 600, 960, GY + 40, 1.0, sw=6, hl=18) + '</g>')
    return "".join(o)


def rain(t, op):
    o = []
    for k in range(26):
        x = 60 + (k * 97) % 960
        y = 300 + (t * 560 + k * 137) % 360
        o.append(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x-8:.0f}" y2="{y+34:.0f}" stroke="{C["water_light"]}" '
                 f'stroke-width="4" opacity="{0.45*op:.2f}"/>')
    return "".join(o)


def flow(t):
    """droplets: surface -> ditch (step 1), ditch -> culvert -> river (2+), river -> moat (4)."""
    o = []
    if t >= T1:
        a = cl((t - T1) / 0.6)
        for k in range(6):
            ph = (t * 0.5 + k / 6.0) % 1.0
            x = 560 - (560 - DITCH_X1) * ph
            o.append(droplet(x, GY - 12, 10, op=a * 0.9, col="water_light"))
    if t >= T2:
        a = cl((t - T2 - 0.5) / 0.6)
        pts = [(DITCH_X0 + 40, GY + 50), (DITCH_X0 + 40, CUL_Y1 - 30), (CUL_X1 - 10, CUL_Y1 - 30), (RIV_X0 + 30, GY + 60)]
        seg = [math.dist(pts[i], pts[i + 1]) for i in range(3)]
        L = sum(seg)
        for k in range(12):
            d = ((t * 0.28 + k / 12.0) % 1.0) * L
            i = 0
            while i < 2 and d > seg[i]:
                d -= seg[i]; i += 1
            f = min(d / seg[i], 1.0)
            x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f
            y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f
            o.append(droplet(x, y, 10, op=a, col="water_light"))
    if t >= T4:
        a = cl((t - T4 - 0.3) / 0.6)
        o.append(arrow(RIV_X1 - 20, GY + 40, MOAT_X0 + 40, GY + 40, eo((t - T4) / 1.2), col="water_light", sw=10, hl=26))
        o.append(text(855, GY - 40, "out", 28, "ink_dim", anchor="middle", weight="normal", op=a))
    return "".join(o)


def bridges_inset(t):
    """top-down inset: bow-shaped river with 5 parallel bridges (step 3 only)."""
    a = window(t, T3 + 0.8, T4, 0.6, 0.4)
    if a <= 0:
        return ""
    o = [f'<g opacity="{a:.3f}">', rect(80, 1000, 920, 250, "card", sw=3, rx=16, stroke="accent")]
    # bow-shaped river (seen from above)
    o.append(path("M 130,1090 Q 540,1250 950,1090", "none", sw=40, stroke="water_deep"))
    o.append(path("M 130,1090 Q 540,1250 950,1090", "none", sw=8, stroke="water"))
    for k in range(5):
        x = 420 + k * 60
        y = 1090 + 160 * 0.5 * (1 - ((x - 540) / 410) ** 2) * 0.98
        o.append(rect(x - 16, y - 40, 32, 80, "stone_light", sw=3, rx=4, stroke="stone_dark"))
    o.append(text(110, 1045, "From above: 5 marble bridges", 30, "ink"))
    o.append(text(970, 1045, "schematic", 24, "ink_dim", anchor="end", weight="normal"))
    o.append('</g>')
    return "".join(o)


def frame_svg(t):
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
         f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/>']
    gl = [f'M{x},0 V{H}' for x in range(0, W, 90)] + [f'M0,{y} H{W}' for y in range(0, H, 90)]
    o.append(f'<path d="{" ".join(gl)}" stroke="{C["grid"]}" stroke-width="2"/>')
    a = window(t, 0.0, T1, 0.2, 0.3)
    if a > 0:
        o.append(f'<g opacity="{a:.3f}">' + rect(60, 150, 960, 200, "card", sw=3, rx=18, stroke="accent")
                 + text(540, 230, "About 13 km of drains", 50, "ink", anchor="middle")
                 + text(540, 305, "you can't see", 58, "gold", anchor="middle") + '</g>')
    o.append(chip(t, T1, T2, 1, "Rain runs into open ditches", "明沟"))
    o.append(chip(t, T2, T3, 2, "Then dives underground", "暗沟"))
    o.append(chip(t, T3, T4, 3, "Into the palace river", "内金水河"))
    o.append(chip(t, T4, T5, 4, "Out to the moat", "护城河"))
    o.append(section(t))
    if t < T5:
        o.append(labels(t))
    if T1 <= t < T4 + 1.5:
        r = cl((t - T1) / 0.6) * (1 if t < T4 else cl((T4 + 1.5 - t) / 1.5))
        o.append(rain(t, r))
    o.append(flow(t))
    o.append(bridges_inset(t))
    tag = eo((t - T1) / 1.0)
    if tag > 0 and t < T5:
        o.append(text(1020, 300, "schematic, not to scale", 24, "ink_dim", anchor="end", weight="normal", op=tag))
    e = eo((t - T5) / 0.8)
    if e > 0:
        o.append(f'<g opacity="{e:.3f}">' + rect(60, 150, 960, 116, "card", sw=3, rx=18, stroke="accent")
                 + text(540, 226, "The drains you walk over", 44, "ink", anchor="middle") + '</g>')
        o.append(f'<g opacity="{e:.3f}">' + rect(130, 1010, 820, 210, "card", sw=3, rx=16, stroke="accent")
                 + text(540, 1075, "≈15 km of old drains", 44, "gold", anchor="middle")
                 + text(540, 1130, "≈13 km of them underground", 38, "ink", anchor="middle")
                 + text(540, 1185, "Palace Museum figures (2016)", 28, "ink_dim", anchor="middle", weight="normal") + '</g>')
    o.append('</svg>')
    return "".join(o)


def render_one(a):
    i, t, p = a
    cairosvg.svg2png(bytestring=frame_svg(t).encode("utf-8"), write_to=p, output_width=W, output_height=H)
    return i


def main():
    out = sys.argv[1]; fdir = os.path.join(out, "frames"); os.makedirs(fdir, exist_ok=True)
    prev = "--preview" in sys.argv
    if prev:
        ts = [float(x) for x in sys.argv[sys.argv.index("--preview") + 1].split(",")]
        jobs = [(k, t, os.path.join(out, f"preview_{t:05.2f}.png")) for k, t in enumerate(ts)]
    else:
        jobs = [(i, i / FPS, os.path.join(fdir, f"f_{i:05d}.png")) for i in range(int(DUR * FPS))]
    t0 = time.time()
    with Pool(os.cpu_count()) as pool:
        for _ in pool.imap_unordered(render_one, jobs, chunksize=6): pass
    print(f"rendered {len(jobs)} frames in {time.time()-t0:.1f}s")
    if prev: return
    mp4 = os.path.join(out, "fc_drain_child_1080x1920.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(fdir, "f_%05d.png"),
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
                    "-movflags", "+faststart", mp4], check=True)
    print(f"encoded {mp4}; total {time.time()-t0:.1f}s")


if __name__ == "__main__":
    main()
