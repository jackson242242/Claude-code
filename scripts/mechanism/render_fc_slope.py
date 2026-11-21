#!/usr/bin/env python3
"""arch-M-09: 'The Forbidden City isn't flat - and that's the point.' (26 s, code-drawn).
Side section, north (left) to south (right), VERTICAL SCALE EXAGGERATED (tagged on screen):
the ground tilts from flat to its real fall -> rain rolls south -> water leaves into the moat ->
caveat card (dense walls weaken the self-draining effect).
Numbers only from plans/mechanism/forbidden-city-drainage/longform-script.md ledger F4/F6/F7:
north gate 46.05 m, Meridian Gate 44.28 m, 'less than 2 m over ~960 m'. No footage, no AI imagery.
Captions are burned by assemble-video.mjs; nothing essential is drawn below y=1260.
Reuses the palette/helpers of render_fc_drain.py.
Usage: python3 -I render_fc_slope.py <out_dir> [--preview t1,t2,...]
"""
import os, subprocess, sys, time
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render_fc_drain import (C, W, H, FPS, FCN, text, rect, path, droplet, window, eo, cl, arrow)  # noqa: E402
import cairosvg  # noqa: E402

DUR = 26.0
XN, XS = 110, 900            # north / south ends of the palace ground
Y_FLAT = 880                 # ground level before the tilt
DROP = 230                   # exaggerated fall (px) north -> south once tilted
MOAT_X0, MOAT_X1 = 920, 1040


def tilt(t):
    return eo((t - 4.0) / 2.5)


def ground_y(x, t):
    """y of the ground surface at x (north high, south low)."""
    k = tilt(t)
    f = (min(max(x, XN), XS) - XN) / (XS - XN)
    return Y_FLAT - DROP / 2 * k + DROP * k * f


def chip(t, t0, t1, num, title, cn):
    op = window(t, t0, t1)
    if op <= 0:
        return ""
    return (f'<g opacity="{op:.3f}">' + rect(60, 150, 960, 116, "card", sw=3, rx=18, stroke="accent")
            + rect(60, 150, 16, 116, "accent", sw=0, rx=8) + text(104, 198, f"STEP {num}/3", 30, "accent")
            + text(104, 246, title, 42, "ink") + text(990, 200, cn, 34, "gold", anchor="end", font=FCN, weight="normal") + '</g>')


def hall(x, w, h, t, roof="roof"):
    y = ground_y(x + w / 2, t)
    return (rect(x, y - h, w, h, "stone_dark", sw=4)
            + path(f"M {x-26},{y-h} L {x+w+26},{y-h} L {x+w-14},{y-h-48} L {x+14},{y-h-48} Z", roof, sw=4, stroke="roof_dark"))


def ground_svg(t):
    yn, ys = ground_y(XN, t), ground_y(XS, t)
    o = [path(f"M 0,{yn:.1f} L {XN},{yn:.1f} L {XS},{ys:.1f} L {MOAT_X0},{ys:.1f} L {MOAT_X0},{ys+70:.1f} "
              f"L {MOAT_X1},{ys+70:.1f} L {MOAT_X1},{ys:.1f} L {W},{ys:.1f} L {W},1250 L 0,1250 Z", "soil", sw=4, stroke="soil_line")]
    o.append(path(f"M {XN},{yn:.1f} L {XS},{ys:.1f}", "none", sw=10, stroke="stone_light"))
    # moat water
    o.append(rect(MOAT_X0 + 4, ys + 26, MOAT_X1 - MOAT_X0 - 8, 42, "water_deep", sw=0))
    # gates and halls riding the slope
    o.append(hall(XN + 10, 120, 110, t))
    o.append(hall(330, 150, 150, t))
    o.append(hall(560, 130, 120, t))
    o.append(hall(XS - 140, 130, 120, t))
    return "".join(o)


def labels(t):
    a = eo((t - 4.5) / 1.0)
    if a <= 0:
        return ""
    yn, ys = ground_y(XN, t), ground_y(XS, t)
    o = [f'<g opacity="{a:.3f}">',
         rect(70, yn - 300, 330, 96, "card", sw=3, rx=14, stroke="accent"),
         text(90, yn - 262, "North gate", 30, "ink_dim"),
         text(90, yn - 222, "46.05 m", 40, "gold"),
         rect(610, ys - 330, 400, 96, "card", sw=3, rx=14, stroke="accent"),
         text(630, ys - 292, "Meridian Gate (south)", 30, "ink_dim"),
         text(630, ys - 252, "44.28 m", 40, "gold"),
         text(540, 1225, "vertical scale exaggerated", 26, "ink_dim", anchor="middle", weight="normal"),
         '</g>']
    return "".join(o)


def rain(t, op):
    o = []
    for k in range(30):
        x = 60 + (k * 97) % 960
        y = 300 + (t * 560 + k * 137) % 420
        o.append(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x-8:.0f}" y2="{y+34:.0f}" stroke="{C["water_light"]}" '
                 f'stroke-width="4" opacity="{0.5*op:.2f}"/>')
    return "".join(o)


def runoff(t, op):
    """droplets sliding north -> south along the surface, dropping into the moat."""
    o = []
    for k in range(16):
        ph = (t * 0.32 + k / 16.0) % 1.0
        x = XN + 20 + (MOAT_X0 + 40 - XN - 20) * ph
        if x <= XS:
            y = ground_y(x, t) - 12
        else:
            y = ground_y(XS, t) - 12 + (x - XS) * 1.6
        o.append(droplet(x, y, 10, op=op * (0.55 + 0.45 * (1 - ph)), col="water_light"))
    return "".join(o)


def frame_svg(t):
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
         f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/>']
    gl = [f'M{x},0 V{H}' for x in range(0, W, 90)] + [f'M0,{y} H{W}' for y in range(0, H, 90)]
    o.append(f'<path d="{" ".join(gl)}" stroke="{C["grid"]}" stroke-width="2"/>')
    a = window(t, 0.0, 3.6, 0.2, 0.3)
    if a > 0:
        o.append(f'<g opacity="{a:.3f}">' + rect(60, 150, 960, 170, "card", sw=3, rx=18, stroke="accent")
                 + text(540, 225, "The Forbidden City", 50, "ink", anchor="middle")
                 + text(540, 288, "isn't flat", 54, "gold", anchor="middle") + '</g>')
    o.append(chip(t, 3.6, 9.5, 1, "Higher north, lower south", "北高南低"))
    o.append(chip(t, 9.5, 16.5, 2, "Rain rolls south", "雨水南流"))
    o.append(chip(t, 16.5, DUR, 3, "Out through the moat", "汇入护城河"))
    o.append(ground_svg(t))
    o.append(labels(t))
    # N / S compass arrow
    ca = eo((t - 4.0) / 1.0)
    if ca > 0:
        o.append(f'<g opacity="{ca:.3f}">' + arrow(380, 360, 700, 360, 1.0, sw=8, hl=22)
                 + text(350, 372, "N", 34, "ink", anchor="end") + text(730, 372, "S", 34, "ink") + '</g>')
    if 9.5 <= t < 22.5:
        r = cl((t - 9.5) / 0.6) * (1 if t < 21 else cl((22.5 - t) / 1.5))
        o.append(rain(t, r * (1 if t < 16.5 else 0.5)))
        o.append(runoff(t, r))
    if t >= 16.5:
        b = eo((t - 17.0) / 0.8) * (1 - eo((t - 21.6) / 0.5))
        if b > 0:
            o.append(f'<g opacity="{b:.3f}">' + rect(130, 430, 820, 150, "card", sw=3, rx=16, stroke="accent")
                     + text(540, 495, "Less than 2 m of fall", 44, "gold", anchor="middle")
                     + text(540, 550, "over about 960 m", 38, "ink", anchor="middle") + '</g>')
        c = eo((t - 22.0) / 0.8)
        if c > 0:
            o.append(f'<g opacity="{c:.3f}">' + rect(130, 430, 820, 150, "card", sw=3, rx=16, stroke="accent")
                     + text(540, 495, "Caveat: dense walls weaken", 38, "ink", anchor="middle")
                     + text(540, 550, "this self-draining effect", 38, "ink", anchor="middle") + '</g>')
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
    mp4 = os.path.join(out, "fc_slope_1080x1920.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(fdir, "f_%05d.png"),
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
                    "-movflags", "+faststart", mp4], check=True)
    print(f"encoded {mp4}; total {time.time()-t0:.1f}s")


if __name__ == "__main__":
    main()
