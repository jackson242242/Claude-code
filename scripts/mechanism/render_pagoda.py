#!/usr/bin/env python3
"""Yingxian Wooden Pagoda earthquake-survival explainer: code-drawn SVG frames -> PNG -> MP4.
Reuses helpers from the tech agent's render_svg_anim.py (easing, gong bracket primitive, arrows).
Usage: python3 render_pagoda.py <out_dir> [--preview t1,t2,...]
No footage, no AI imagery in this clip -> no synthetic-content label.
Captions (EN sentences) are NOT drawn here: they are burned by scripts/assemble-video.mjs from subs.srt,
so the drawing keeps y < 1260 free of essential content for the lower-third subtitle band.
"""
import math, os, subprocess, sys, time
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render_svg_anim import ease_out_cubic, esc, gong_path  # noqa: E402
import cairosvg  # noqa: E402

W, H, FPS = 1080, 1920, 30
DUR = 26.5
C = {
    "bg": "#15110d", "grid": "#1f1913", "wood": "#c9873d", "wood_dark": "#8a4f1c", "wood_light": "#e3a55a",
    "outline": "#3a1f08", "roof": "#5f6f7a", "roof_dark": "#3b474f", "stone": "#6b6259", "ink": "#f6ead3",
    "ink_dim": "#b9a98d", "accent": "#e8513a", "gold": "#e8b94a", "card": "#231b14", "hidden": "#5a3412",
}
FEN, FCN, FCAL = "DejaVu Sans", "Noto Serif CJK SC", "Ma Shan Zheng"

def cl(p): return min(max(p, 0.0), 1.0)
def eo(p): return ease_out_cubic(cl(p))
def window(t, t0, t1, fi=0.25, fo=0.25):
    """opacity of a phase that lives in [t0, t1) with fade in/out."""
    if t < t0 or t >= t1: return 0.0
    a_in = 1.0 if fi <= 0.01 else eo((t - t0) / fi)   # fi ~ 0 = visible from its first frame (frame 0 is the hook frame)
    a_out = 1.0 if fo <= 0.01 else eo((t1 - t) / fo)
    return min(a_in, a_out)

def text(x, y, s, fs, fill, anchor="start", font=FEN, weight="bold", op=1.0, extra=""):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{font}" font-weight="{weight}" '
            f'font-size="{fs}" fill="{fill}" opacity="{op:.3f}" {extra}>{esc(s)}</text>')

def rect(x, y, w, h, fill, sw=5, rx=0, op=1.0, stroke=None):
    return (f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{C.get(fill, fill)}" '
            f'stroke="{C.get(stroke, stroke) if stroke else C["outline"]}" stroke-width="{sw}" stroke-linejoin="round" opacity="{op:.3f}"/>')

def path(d, fill, sw=5, stroke=None, op=1.0, extra=""):
    return (f'<path d="{d}" fill="{C.get(fill, fill) if fill != "none" else "none"}" '
            f'stroke="{C.get(stroke, stroke) if stroke else C["outline"]}" stroke-width="{sw}" '
            f'stroke-linejoin="round" stroke-linecap="round" opacity="{op:.3f}" {extra}/>')

def arrow(x1, y1, x2, y2, p=1.0, col="accent", sw=10, hl=26):
    if p <= 0: return ""
    xe = x1 + (x2 - x1) * p; ye = y1 + (y2 - y1) * p
    a = math.atan2(y2 - y1, x2 - x1)
    h1 = (xe - hl * math.cos(a - 0.5), ye - hl * math.sin(a - 0.5))
    h2 = (xe - hl * math.cos(a + 0.5), ye - hl * math.sin(a + 0.5))
    return (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{xe:.1f}" y2="{ye:.1f}" stroke="{C[col]}" stroke-width="{sw}" stroke-linecap="round"/>'
            f'<polygon points="{xe:.1f},{ye:.1f} {h1[0]:.1f},{h1[1]:.1f} {h2[0]:.1f},{h2[1]:.1f}" fill="{C[col]}"/>')

def chip(t, t0, t1, num, title, cn):
    """Step chip under the brand badge: 'SECRET n/4' + EN title + CN/pinyin term."""
    op = window(t, t0, t1)
    if op <= 0: return ""
    return (f'<g opacity="{op:.3f}">'
            + rect(60, 200, 960, 112, "card", sw=3, rx=18, stroke="accent")
            + rect(60, 200, 16, 112, "accent", sw=0, rx=8)
            + text(104, 246, f"SECRET {num}/4", 30, C["accent"])
            + text(104, 292, title, 42, C["ink"])
            + text(990, 248, cn, 32, C["gold"], anchor="end", font=FCN, weight="normal")
            + '</g>')

# ---------------------------------------------------------------- tower (elevation, local coords, ground = 0, up = -y)
STOREYS = [520, 475, 430, 385, 340]
HB, EH, HID, BASE = 120, 45, 50, 30

def tower(scale, reveal=1.0, hid_hi=None, braces=None, sway=0.0, shear=0.0, joints=0.0, numbers=None, cx=540, gy=1230):
    """hid_hi / braces: per-band lists (0..1) or None. shear: px per storey (lean). numbers: per-band label alpha."""
    n = len(STOREYS)
    out = [rect(-330, -BASE, 660, BASE, "stone"), rect(-360, -8, 720, 8, "stone", sw=0)]
    y = -BASE
    for i, w in enumerate(STOREYS):
        a = eo((reveal * n - i) / 1.0)
        if a <= 0: break
        g = [rect(-w / 2, y - HB, w, HB, "wood")]
        for k in range(-2, 3):
            g.append(rect(k * (w / 5) - w / 16, y - HB + 22, w / 8, HB - 44, "wood_dark", sw=3))
        if i > 0:
            g.append(rect(-w / 2 - 34, y - 16, w + 68, 16, "wood_light", sw=3))
        ytop = y - HB
        ew = w + 190
        g.append(path(f"M {-ew/2},{ytop} Q {-ew/2+30},{ytop-6} {-w/2-40},{ytop-14} L {-w/2-10},{ytop-EH} "
                      f"L {w/2+10},{ytop-EH} L {w/2+40},{ytop-14} Q {ew/2-30},{ytop-6} {ew/2},{ytop} Z", "roof"))
        g.append(path(f"M {-w/2-10},{ytop-EH} L {w/2+10},{ytop-EH}", "none", sw=6, stroke="roof_dark"))
        y = ytop - EH
        if i < n - 1:
            hw = w - 6
            g.append(rect(-hw / 2, y - HID, hw, HID, "hidden"))
            hi = (hid_hi[i] if hid_hi else 0.0)
            if hi > 0:
                g.append(rect(-hw / 2, y - HID, hw, HID, "gold", sw=0, op=0.55 * hi))
            br = (braces[i] if braces else 0.0)
            if br > 0:
                cells = 5
                cw = hw / cells
                L = math.hypot(cw, HID)
                for c in range(cells):
                    x0 = -hw / 2 + c * cw
                    for (ax, ay, bx, by) in ((x0, y, x0 + cw, y - HID), (x0, y - HID, x0 + cw, y)):
                        out_len = L * cl(br)
                        g.append(f'<line x1="{ax:.1f}" y1="{ay:.1f}" x2="{bx:.1f}" y2="{by:.1f}" stroke="{C["ink"]}" '
                                 f'stroke-width="7" stroke-linecap="round" stroke-dasharray="{L:.1f}" stroke-dashoffset="{L - out_len:.1f}"/>')
            if joints > 0:
                for sx in (-hw / 2, hw / 2):
                    g.append(f'<circle cx="{sx:.1f}" cy="{y - HID/2:.1f}" r="{9 + 5*joints:.1f}" fill="{C["accent"]}" opacity="{0.5 + 0.5*joints:.2f}"/>')
            if numbers and numbers[i] > 0:
                g.append(f'<g opacity="{numbers[i]:.3f}"><circle cx="{hw/2 + 70:.1f}" cy="{y - HID/2:.1f}" r="34" fill="{C["gold"]}"/>'
                         + text(hw / 2 + 70, y - HID / 2 + 15, str(i + 1), 44, C["bg"], anchor="middle") + '</g>')
            y -= HID
        dx = shear * (i + 1)
        dy = 40 * (1 - a)
        out.append(f'<g opacity="{a:.3f}" transform="translate({dx:.2f},{dy:.2f})">{"".join(g)}</g>')
    if reveal >= 0.999 or eo((reveal * n - (n - 1))) >= 0.999:
        tw = STOREYS[-1] + 140
        a = eo((reveal * n - (n - 1)))
        g = [path(f"M {-tw/2},{y} Q {-tw/2+40},{y-10} {-60},{y-125} L {60},{y-125} Q {tw/2-40},{y-10} {tw/2},{y} Z", "roof_dark"),
             rect(-16, y - 250, 32, 125, "wood_dark"),
             f'<circle cx="0" cy="{y-260}" r="22" fill="{C["gold"]}" stroke="{C["outline"]}" stroke-width="4"/>',
             f'<circle cx="0" cy="{y-300}" r="12" fill="{C["gold"]}" stroke="{C["outline"]}" stroke-width="4"/>']
        out.append(f'<g opacity="{a:.3f}" transform="translate({shear*n:.2f},0)">{"".join(g)}</g>')
    return f'<g transform="translate({cx},{gy}) rotate({sway:.3f}) scale({scale})">{"".join(out)}</g>'

def ground(t, amp=0.0, y=1230):
    if amp <= 0:
        return f'<line x1="60" y1="{y}" x2="{W-60}" y2="{y}" stroke="{C["ink_dim"]}" stroke-width="4" stroke-dasharray="18 14"/>'
    pts = []
    for x in range(60, W - 59, 20):
        pts.append(f"{x},{y + amp * math.sin(x / 55.0 + t * 22):.1f}")
    return f'<polyline points="{" ".join(pts)}" fill="none" stroke="{C["accent"]}" stroke-width="5"/>'

# ---------------------------------------------------------------- phases
def phase_hook(t):
    op = window(t, 0.0, 4.0, fi=0.001, fo=0.3)
    if op <= 0: return ""
    pop = 1.0 + 0.12 * (1 - eo(t / 0.35))
    o = [f'<g opacity="{op:.3f}">']
    o.append(f'<g transform="translate(540,352) scale({pop:.3f})">' + text(0, 0, "67 m", 220, C["accent"], anchor="middle") + '</g>')
    o.append(text(540, 420, "of wood  ·  built 1056", 54, C["ink"], anchor="middle"))
    o.append(text(1010, 620, "塔", 150, C["gold"], anchor="end", font=FCAL, weight="normal", op=0.28))
    o.append(ground(t, y=1130))
    o.append(tower(0.52, reveal=0.38 + 0.62 * eo((t - 0.1) / 2.0), gy=1130))
    a2 = eo((t - 2.4) / 0.4)
    if a2 > 0:
        o.append(text(70, 900, "970", 110, C["gold"], op=a2))
        o.append(text(70, 950, "years standing", 36, C["ink_dim"], op=a2))
    o.append('</g>')
    return "".join(o)

DG = [  # dougong stack (from the tech scene JSON, scaled 0.8): (t_offset, dy, parts)
    (0.0, 0, [("rect", (-56, 0, 112, 240), "wood_dark")]),
    (0.4, 0, [("path", "M -76,0 L 76,0 L 76,-36 L 88,-36 L 88,-92 L -88,-92 L -88,-36 L -76,-36 Z", "wood")]),
    (0.8, -92, [("gong", (208, 56), "wood_light")]),
    (1.2, -148, [("rect", (-236, -56, 64, 56), "wood"), ("rect", (-32, -56, 64, 56), "wood"), ("rect", (172, -56, 64, 56), "wood")]),
    (1.6, -204, [("gong", (320, 56), "wood_light")]),
    (2.0, -320, [("rect", (-344, -48, 688, 48), "wood"), ("path", "M -416,-48 L 416,-48 L 416,-88 L 304,-120 L -304,-120 L -416,-88 Z", "roof")]),
]

def dg_part(p, fill):
    kind, d, f = p
    if kind == "rect": x, y, w, h = d; return rect(x, y, w, h, f)
    if kind == "gong": return path(gong_path(*d), f)
    return path(d, f)

def phase_dougong(t):
    op = window(t, 4.0, 10.0)
    if op <= 0: return ""
    T = t - 4.0
    o = [f'<g opacity="{op:.3f}">', chip(t, 4.0, 10.0, 1, "Interlocking brackets", "斗拱 dǒugǒng")]
    shake = eo((T - 3.2) / 0.5)
    for tier, (t0, dy, parts) in enumerate(DG):
        age = T - 0.2 - t0
        if age < 0: continue
        p = eo(age / 0.5)
        drop = 0 if tier == 0 else -220 * (1 - p)
        dx = shake * 16 * math.sin(2 * math.pi * 2.6 * (T - 3.2)) * (tier / 5.0)
        inner = "".join(dg_part(pp, pp[2]) for pp in parts)
        o.append(f'<g opacity="{eo(age/0.25):.3f}" transform="translate({540 + dx:.2f},{960 + dy + drop:.2f})">{inner}</g>')
    if shake > 0:
        # joints glow where tiers meet
        for jy in (960, 868, 812, 756, 640):
            o.append(f'<circle cx="540" cy="{jy}" r="{8 + 6*abs(math.sin(2*math.pi*2.6*(T-3.2))):.1f}" fill="{C["accent"]}" opacity="{0.9*shake:.2f}"/>')
        o.append(f'<g opacity="{shake:.3f}">' + arrow(400, 1215, 320, 1215) + arrow(680, 1215, 760, 1215)
                 + text(540, 1228, "quake", 34, C["accent"], anchor="middle") + '</g>')
    a1 = eo((T - 2.6) / 0.4)
    if a1 > 0:
        o.append(f'<g opacity="{a1:.3f}">'
                 + f'<polyline points="452,915 330,958" fill="none" stroke="{C["gold"]}" stroke-width="3"/>'
                 + f'<circle cx="452" cy="915" r="8" fill="{C["gold"]}"/>'
                 + text(70, 1000, "almost no nails", 36, C["gold"])
                 + text(70, 1046, "榫卯 sǔnmǎo · wood locks wood", 28, C["ink_dim"], font=FCN, weight="normal")
                 + '</g>')
    a2 = eo((T - 3.4) / 0.4)
    if a2 > 0:
        o.append(f'<g opacity="{a2:.3f}">'
                 + f'<polyline points="770,790 900,958" fill="none" stroke="{C["accent"]}" stroke-width="3"/>'
                 + f'<circle cx="770" cy="790" r="8" fill="{C["accent"]}"/>'
                 + text(1010, 1000, "50+ bracket types", 36, C["accent"], anchor="end")
                 + text(1010, 1046, "joints slip a little", 30, C["ink_dim"], anchor="end")
                 + '</g>')
    a3 = eo((T - 4.0) / 0.4)
    if a3 > 0:
        o.append(text(540, 400, "shaking in  →  absorbed", 46, C["ink"], anchor="middle", op=a3))
    o.append('</g>')
    return "".join(o)

def octagon(cx, cy, r, rot=math.pi / 8):
    return [(cx + r * math.cos(rot + k * math.pi / 4), cy + r * math.sin(rot + k * math.pi / 4)) for k in range(8)]

def poly_draw(pts, col, sw, prog, dash=True):
    pts = pts + [pts[0]]
    L = sum(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1))
    d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    return (f'<polyline points="{d}" fill="none" stroke="{C[col]}" stroke-width="{sw}" stroke-linejoin="round" '
            f'stroke-dasharray="{L:.1f}" stroke-dashoffset="{L*(1-cl(prog)):.1f}"/>')

def phase_rings(t):
    op = window(t, 10.0, 15.5)
    if op <= 0: return ""
    T = t - 10.0
    cx, cy = 540, 800
    push = eo((T - 3.3) / 0.5)
    pulse = 1 + 0.025 * math.sin(2 * math.pi * 1.6 * (T - 3.3)) * push
    o = [f'<g opacity="{op:.3f}">', chip(t, 10.0, 15.5, 2, "Two rings of columns", "复合筒式结构 composite tube")]
    o.append(f'<g transform="translate({cx},{cy}) scale({pulse:.4f}) translate({-cx},{-cy})">')
    Ro, Ri = 380, 185
    po, pi_ = octagon(cx, cy, Ro), octagon(cx, cy, Ri)
    p1 = eo(T / 1.1); p2 = eo((T - 1.1) / 0.9); p3 = eo((T - 2.1) / 0.6)
    o.append(path(f"M {' L '.join(f'{x:.1f},{y:.1f}' for x, y in po)} Z", "card", sw=0, op=0.9 * p1))
    o.append(poly_draw(po, "wood", 10, p1))
    if p1 > 0:
        dots = []
        for k in range(8):
            a, b = po[k], po[(k + 1) % 8]
            for f in (0.0, 1 / 3, 2 / 3):
                dots.append((a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f))
        for j, (x, y) in enumerate(dots):
            if (j + 1) / len(dots) <= p1 + 0.04:
                o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="13" fill="{C["wood_light"]}" stroke="{C["outline"]}" stroke-width="3"/>')
    if p2 > 0:
        o.append(path(f"M {' L '.join(f'{x:.1f},{y:.1f}' for x, y in pi_)} Z", "wood_dark", sw=0, op=0.9 * p2))
        o.append(poly_draw(pi_, "wood", 10, p2))
        for j, (x, y) in enumerate(pi_):
            if (j + 1) / 8 <= p2 + 0.04:
                o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="15" fill="{C["gold"]}" stroke="{C["outline"]}" stroke-width="3"/>')
    if p3 > 0:
        for k in range(8):
            (x1, y1), (x2, y2) = pi_[k], po[k]
            o.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x1 + (x2-x1)*p3:.1f}" y2="{y1 + (y2-y1)*p3:.1f}" stroke="{C["wood_dark"]}" stroke-width="6" stroke-dasharray="14 10"/>')
    o.append('</g>')
    if p1 > 0.9:
        o.append(text(cx, cy - Ro - 22, "outer ring · 外槽柱", 32, C["ink"], anchor="middle", font=FCN, op=eo((p1 - 0.9) / 0.1)))
    if p2 > 0.9:
        o.append(text(cx, cy + 12, "inner ring", 30, C["ink"], anchor="middle", op=eo((p2 - 0.9) / 0.1)))
        o.append(text(cx, cy + 50, "内槽柱", 30, C["ink"], anchor="middle", font=FCN, op=eo((p2 - 0.9) / 0.1)))
    if push > 0:
        s = push * (0.6 + 0.4 * abs(math.sin(2 * math.pi * 1.6 * (T - 3.3))))
        o.append(f'<g opacity="{push:.3f}">' + arrow(60, cy, 60 + 70 * s, cy) + arrow(1020, cy, 1020 - 70 * s, cy) + '</g>')
        o.append(text(cx, cy + Ro + 70, "both rings share every push", 40, C["accent"], anchor="middle", op=push))
    o.append('</g>')
    return "".join(o)

def phase_hidden(t):
    op = window(t, 15.5, 21.0)
    if op <= 0: return ""
    T = t - 15.5
    hi = [eo((T - 0.5 - i * 0.55) / 0.4) for i in range(4)]
    br = [eo((T - 0.7 - i * 0.55) / 0.6) for i in range(4)]
    o = [f'<g opacity="{op:.3f}">', chip(t, 15.5, 21.0, 3, "Four hidden floors", "暗层 àncéng"), ground(t)]
    o.append(tower(0.62, hid_hi=hi, braces=br, numbers=hi))
    a1 = eo(T / 0.4)
    o.append(f'<g opacity="{a1:.3f}">' + text(70, 620, "5", 110, C["ink"]) + text(70, 668, "floors outside", 32, C["ink_dim"]) + '</g>')
    a2 = eo((T - 2.9) / 0.4)
    o.append(f'<g opacity="{a2:.3f}">' + text(1010, 620, "9", 110, C["gold"], anchor="end") + text(1010, 668, "floors inside", 32, C["ink_dim"], anchor="end") + '</g>')
    a3 = eo((T - 3.4) / 0.4)
    if a3 > 0:
        o.append(text(540, 392, "diagonal struts = 4 stiff rings", 42, C["gold"], anchor="middle", op=a3))
    o.append('</g>')
    return "".join(o)

def phase_quake(t):
    op = window(t, 21.0, DUR, fo=0.001)
    if op <= 0: return ""
    T = t - 21.0
    ramp = eo(T / 1.2) * (1 - 0.6 * eo((T - 4.2) / 1.2))
    w = 2 * math.pi * 0.9 * T
    sway = 2.2 * math.sin(w) * ramp
    shear = 7 * math.sin(w - 0.9) * ramp
    jo = abs(math.sin(w)) * ramp
    o = [f'<g opacity="{op:.3f}">', chip(t, 21.0, DUR, 4, "It sways. It does not snap.", "以柔克刚 yǐ róu kè gāng"),
         ground(t, amp=9 * ramp)]
    o.append(tower(0.62, hid_hi=[0.5 * jo] * 4, braces=[1, 1, 1, 1], sway=sway, shear=shear, joints=jo))
    if ramp > 0.2:
        s = 0.5 + 0.5 * math.sin(w)
        o.append(f'<g opacity="{ramp:.3f}">' + arrow(540 - 80 * s - 320, 1200, 540 - 80 * s - 420, 1200) + arrow(540 + 80 * s + 320, 1200, 540 + 80 * s + 420, 1200) + '</g>')
    a1 = eo((T - 1.0) / 0.4)
    if a1 > 0:
        o.append(f'<g opacity="{a1:.3f}">' + text(70, 560, "joints slip,", 32, C["accent"]) + text(70, 602, "energy burns off", 32, C["accent"]) + '</g>')
    a2 = eo((T - 2.2) / 0.4)
    if a2 > 0:
        o.append(f'<g opacity="{a2:.3f}">' + text(1010, 560, "whole tower", 34, C["ink"], anchor="end") + text(1010, 604, "sways & twists", 34, C["ink"], anchor="end") + '</g>')
    a3 = eo((T - 3.6) / 0.4)
    if a3 > 0:
        o.append(f'<g opacity="{a3:.3f}">' + rect(200, 328, 680, 72, "gold", sw=0, rx=36)
                 + text(540, 378, "970 years, still standing", 38, C["bg"], anchor="middle") + '</g>')
    o.append('</g>')
    return "".join(o)

def push(t, t0, t1, inner, cx=540, cy=800):
    k = 1.0 + 0.045 * cl((t - t0) / max(0.01, (t1 - t0)))
    return f'<g transform="translate({cx},{cy}) scale({k:.4f}) translate({-cx},{-cy})">{inner}</g>'

def frame_svg(t):
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
         f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/>']
    g = [f'M{x},0 V{H}' for x in range(0, W, 90)] + [f'M0,{y} H{W}' for y in range(0, H, 90)]
    o.append(f'<path d="{" ".join(g)}" stroke="{C["grid"]}" stroke-width="2"/>')
    o += [push(t, 0, 4.0, phase_hook(t), cy=700), push(t, 4.0, 10.0, phase_dougong(t)), push(t, 10.0, 15.5, phase_rings(t)),
          push(t, 15.5, 21.0, phase_hidden(t)), push(t, 21.0, DUR, phase_quake(t))]
    o.append('</svg>')
    return "".join(o)

def render_one(args):
    i, t, p = args
    cairosvg.svg2png(bytestring=frame_svg(t).encode("utf-8"), write_to=p, output_width=W, output_height=H)
    return i

def main():
    out_dir = sys.argv[1]
    fdir = os.path.join(out_dir, "frames"); os.makedirs(fdir, exist_ok=True)
    if "--preview" in sys.argv:
        ts = [float(x) for x in sys.argv[sys.argv.index("--preview") + 1].split(",")]
        jobs = [(k, t, os.path.join(out_dir, f"preview_{t:05.2f}.png")) for k, t in enumerate(ts)]
    else:
        n = int(DUR * FPS)
        jobs = [(i, i / FPS, os.path.join(fdir, f"f_{i:05d}.png")) for i in range(n)]
    t0 = time.time()
    with Pool(os.cpu_count()) as pool:
        for _ in pool.imap_unordered(render_one, jobs, chunksize=6): pass
    dt = time.time() - t0
    print(f"rendered {len(jobs)} frames in {dt:.1f}s ({dt/len(jobs)*1000:.0f} ms/frame)")
    if "--preview" in sys.argv: return
    mp4 = os.path.join(out_dir, "pagoda_anim_1080x1920.mp4")
    t1 = time.time()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(fdir, "f_%05d.png"),
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS), "-movflags", "+faststart", mp4], check=True)
    print(f"encoded {mp4} in {time.time()-t1:.1f}s; total {time.time()-t0:.1f}s")

if __name__ == "__main__":
    main()
