#!/usr/bin/env python3
"""arch-M-08: 'Those dragon heads on the Forbidden City terraces are drain spouts.' (24 s, code-drawn).
Side section of a three-tier marble terrace: rain lands on the stone -> water runs to the edge ->
dragon-head spouts (chishou) throw it clear of the base -> the footing stays dry.
Reuses the palette/helpers of render_fc_drain.py. No footage, no AI imagery. Captions are burned by
assemble-video.mjs; nothing essential below y=1260. Count line says only 'more than a thousand' (ledger F16).
Usage: python3 -I render_fc_spouts.py <out_dir> [--preview t1,t2,...]
"""
import math, os, subprocess, sys, time
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render_fc_drain import (C, W, H, FPS, FCN, text, rect, path, droplet, window, eo, cl)  # noqa: E402
import cairosvg  # noqa: E402

DUR = 24.0
GROUND = 1200
TIERS = [(820, 100), (660, 100), (500, 100)]   # (width, height) bottom -> top
CX = 540


def chip(t, t0, t1, num, title, cn):
    op = window(t, t0, t1)
    if op <= 0:
        return ""
    return (f'<g opacity="{op:.3f}">' + rect(60, 150, 960, 116, "card", sw=3, rx=18, stroke="accent")
            + rect(60, 150, 16, 116, "accent", sw=0, rx=8) + text(104, 198, f"STEP {num}/3", 30, "accent")
            + text(104, 246, title, 42, "ink") + text(990, 200, cn, 34, "gold", anchor="end", font=FCN, weight="normal") + '</g>')


def tier_geom():
    out, y = [], GROUND
    for w, h in TIERS:
        out.append((CX - w / 2, y - h, w, h)); y -= h
    return out, y   # y = top surface of the top tier


def terrace_svg():
    g, top = tier_geom()
    o = []
    for x, y, w, h in g:
        o.append(rect(x, y, w, h, "stone", sw=4, stroke="stone_dark"))
        o.append(rect(x, y, w, 8, "stone_light", sw=0))
    hx, hw = CX - 170, 340
    o.append(rect(hx, top - 150, hw, 150, "stone_dark", sw=4))
    o.append(path(f"M {hx-50},{top-150} L {hx+hw+50},{top-150} L {hx+hw-20},{top-240} L {hx+20},{top-240} Z", "roof", sw=4, stroke="roof_dark"))
    o.append(rect(0, GROUND, W, 40, "soil", sw=0))
    return "".join(o)


def spout_pts():
    g, _ = tier_geom()
    pts = []
    for x, y, w, h in g:
        pts.append((x, y + h - 14, -1)); pts.append((x + w, y + h - 14, 1))
    return pts


def spout_svg(x, y, d, op=1.0):
    s = d
    return (path(f"M {x:.1f},{y:.1f} l {34*s},-8 l {14*s},12 l {-12*s},12 l {-36*s},-2 Z", "stone_light", sw=3, stroke="stone_dark", op=op)
            + f'<circle cx="{x+30*s:.1f}" cy="{y:.1f}" r="4" fill="{C["outline"]}" opacity="{op:.3f}"/>')


def rain(t, op):
    o = []
    for k in range(34):
        x = 40 + (k * 97) % 1000
        y = (180 + (t * 520 + k * 131) % 800)
        if y < 430 + (0 if 300 < x < 780 else 0):
            pass
        o.append(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x-8:.0f}" y2="{y+34:.0f}" stroke="{C["water_light"]}" stroke-width="4" opacity="{0.55*op:.2f}"/>')
    return "".join(o)


def frame_svg(t):
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
         f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/>']
    gl = [f'M{x},0 V{H}' for x in range(0, W, 90)] + [f'M0,{y} H{W}' for y in range(0, H, 90)]
    o.append(f'<path d="{" ".join(gl)}" stroke="{C["grid"]}" stroke-width="2"/>')
    # title card
    a = window(t, 0.0, 3.0, 0.2, 0.3)
    if a > 0:
        o.append(f'<g opacity="{a:.3f}">' + rect(60, 150, 960, 170, "card", sw=3, rx=18, stroke="accent")
                 + text(540, 225, "Forbidden City dragon heads", 46, "ink", anchor="middle")
                 + text(540, 285, "are not decoration", 46, "gold", anchor="middle") + '</g>')
    o.append(terrace_svg())
    # steps
    o.append(chip(t, 3.0, 9.0, 1, "Rain lands on marble", "雨落台基"))
    o.append(chip(t, 9.0, 17.0, 2, "Spouts throw it clear", "螭首排水"))
    o.append(chip(t, 17.0, DUR, 3, "The footing stays dry", "基座不积水"))
    if 3.0 <= t < 17.5:
        o.append(rain(t, min(1.0, (t - 3.0) / 0.6) * (1 if t < 16 else cl((17.5 - t) / 1.5))))
    g, top = tier_geom()
    # water sheet on each tier surface 3..9 s
    sheet = eo((t - 4.0) / 2.5) * (1 - eo((t - 15.5) / 1.5))
    if sheet > 0:
        for x, y, w, h in g:
            o.append(f'<rect x="{x+10:.0f}" y="{y-6:.0f}" width="{w-20:.0f}" height="8" fill="{C["water"]}" opacity="{0.8*sheet:.2f}"/>')
    # spouts appear 9 s, gush 10 s
    sp = eo((t - 9.0) / 1.0)
    if sp > 0:
        for (x, y, d) in spout_pts():
            o.append(spout_svg(x, y, d, op=sp))
        gush = cl((t - 10.0) / 1.2) * (1 - eo((t - 20.0) / 2.0) * 0.6)
        if gush > 0:
            for (x, y, d) in spout_pts():
                for k in range(7):
                    ph = (t * 1.6 + k / 7.0) % 1.0
                    dx = d * (40 + 130 * ph)
                    dy = -8 + 300 * ph * ph
                    yy = y + dy
                    if yy < GROUND:
                        o.append(droplet(x + dx, yy, 7, op=gush * (1 - ph * 0.5), col="water_light"))
    # splash zone marker on ground away from the footing (17 s)
    b = eo((t - 17.0) / 1.0)
    if b > 0:
        g0 = g[0]
        for side, xx in ((-1, g0[0] - 10), (1, g0[0] + g0[2] + 10)):
            o.append(f'<ellipse cx="{xx:.0f}" cy="{GROUND+4}" rx="48" ry="10" fill="{C["water"]}" opacity="{0.8*b:.2f}"/>')
        o.append(f'<g opacity="{b:.2f}">' + rect(120, 1212, 840, 44, "card", sw=0, rx=10)
                 + text(540, 1243, "Water lands away from the marble base", 30, "ink", anchor="middle") + '</g>')
    c = eo((t - 19.5) / 1.0)
    if c > 0:
        o.append(f'<g opacity="{c:.2f}">' + rect(150, 470, 780, 150, "card", sw=3, rx=16, stroke="accent")
                 + text(540, 536, "Palace Museum: spouts number", 38, "ink", anchor="middle")
                 + text(540, 588, "more than a thousand", 44, "gold", anchor="middle") + '</g>')
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
    mp4 = os.path.join(out, "fc_spouts_1080x1920.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(fdir, "f_%05d.png"),
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
                    "-movflags", "+faststart", mp4], check=True)
    print(f"encoded {mp4}; total {time.time()-t0:.1f}s")


if __name__ == "__main__":
    main()
