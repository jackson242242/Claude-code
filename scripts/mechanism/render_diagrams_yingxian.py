#!/usr/bin/env python3
"""Code-drawn 16:9 diagrams for the Yingxian pagoda explainer (no footage, no AI imagery).

python3 render_diagrams.py all   -> diagrams/<name>.mp4 (+ <name>_still.png) for:
  map        : China outline (Natural Earth 110m via world-atlas npm) zooming to Shanxi / Yingxian
  section    : schematic elevation, 5 visible storeys + 4 hidden levels, two column rings
  dougong    : bracket set built up piece by piece (column, cap block, arm, blocks, beam)
  sway       : tower rocking under a seismic wave vs a rigid tower cracking
All clips 1920x1080, 30 fps. Schematic, not to scale (said on screen).
"""
import json, math, os, subprocess, sys, time
from multiprocessing import Pool
import cairosvg

W, H, FPS = 1920, 1080, 30
S = dict(bg="#15110d", grid="#1f1913", wood="#c9873d", wood_dark="#8a4f1c", wood_light="#e3a55a",
         outline="#3a1f08", roof="#5f6f7a", roof_dark="#3b474f", ink="#f6ead3", ink_dim="#b9a98d",
         accent="#e8513a", amber="#f2b134", card="#231b14", land="#2a2219", land_hi="#4a3826", sea="#0f1a22")
FONT = "Inter"
FONT_CN = "Noto Serif CJK SC"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "diagrams")

def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
def ease(p): p = min(max(p, 0.0), 1.0); return 1 - (1 - p) ** 3
def clamp(p): return min(max(p, 0.0), 1.0)

def head(bg=S["bg"]):
    g = " ".join([f"M{x},0 V{H}" for x in range(0, W, 96)] + [f"M0,{y} H{W}" for y in range(0, H, 96)])
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
            f'<rect width="{W}" height="{H}" fill="{bg}"/><path d="{g}" stroke="{S["grid"]}" stroke-width="2"/>')

def text(x, y, s, size=40, fill=S["ink"], anchor="start", weight="bold", font=FONT, op=1.0):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{font}" font-weight="{weight}" '
            f'font-size="{size}" fill="{fill}" opacity="{op:.3f}">{esc(s)}</text>')

def title_block(t1, t2, sub="", op=1.0, x=80, y=110):
    out = text(x, y, t1, 56, op=op) + text(x, y + 62, t2, 56, S["accent"], op=op)
    if sub: out += text(x, y + 112, sub, 30, S["ink_dim"], weight="normal", op=op)
    return out

def footer(s, op=1.0):
    return text(W - 80, H - 40, s, 24, S["ink_dim"], "end", "normal", op=op)

# ---------------------------------------------------------------- map
def load_china():
    topo = json.load(open(os.path.join(HERE, "dl/npm/package/countries-110m.json")))
    sc, tr = topo["transform"]["scale"], topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0; pts = []
        for dx, dy in arc:
            x += dx; y += dy
            pts.append((x * sc[0] + tr[0], y * sc[1] + tr[1]))
        arcs.append(pts)
    def ring(idxs):
        out = []
        for i in idxs:
            a = arcs[i] if i >= 0 else arcs[~i][::-1]
            out.extend(a if not out else a[1:])
        return out
    polys = []
    for g in topo["objects"]["countries"]["geometries"]:
        if g.get("properties", {}).get("name") == "China":
            if g["type"] == "Polygon":
                polys.append(ring(g["arcs"][0]))
            else:
                for p in g["arcs"]:
                    polys.append(ring(p[0]))
    return polys

CITIES = {"Beijing": (116.40, 39.90), "Datong": (113.30, 40.08), "Yingxian": (113.19, 39.55), "Xi'an": (108.94, 34.34), "Shanghai": (121.47, 31.23)}

def map_frame(t, polys, dur=7.0):
    # view: lon/lat box; start whole China, end Shanxi north
    p = ease((t - 1.0) / 4.0)
    box0 = (72.0, 16.0, 136.0, 54.0)   # lon0 lat0 lon1 lat1
    box1 = (108.5, 36.5, 118.5, 42.5)
    lon0 = box0[0] + (box1[0] - box0[0]) * p; lon1 = box0[2] + (box1[2] - box0[2]) * p
    lat0 = box0[1] + (box1[1] - box0[1]) * p; lat1 = box0[3] + (box1[3] - box0[3]) * p
    # keep aspect: fit box in 1920x1080 with lat scale ~ cos(38°)
    k = math.cos(math.radians(38))
    bw, bh = (lon1 - lon0) * k, (lat1 - lat0)
    scale = min(W / bw, H / bh) * 0.92
    cx, cy = (lon0 + lon1) / 2, (lat0 + lat1) / 2
    def P(lon, lat): return (W / 2 + (lon - cx) * k * scale, H / 2 - (lat - cy) * scale)
    out = [head(S["sea"])]
    for poly in polys:
        d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in (P(a, b) for a, b in poly)) + " Z"
        out.append(f'<path d="{d}" fill="{S["land_hi"]}" stroke="{S["ink_dim"]}" stroke-width="2"/>')
    for name, (lon, lat) in CITIES.items():
        x, y = P(lon, lat)
        if not (0 <= x <= W and 0 <= y <= H): continue
        big = name == "Yingxian"
        r = 14 if big else 9
        fill = S["accent"] if big else S["ink"]
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{fill}" stroke="{S["bg"]}" stroke-width="3"/>')
        if big:
            pulse = 20 + 30 * ((t * 1.2) % 1)
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{pulse:.1f}" fill="none" stroke="{S["accent"]}" stroke-width="4" opacity="{1 - (t * 1.2) % 1:.2f}"/>')
        if p > 0.5 or not big:
            out.append(text(x + 22, y + 12, name, 40 if big else 30, fill))
    out.append(title_block("Yingxian, Shanxi", "northern China", "schematic map · Natural Earth outline"))
    if p > 0.8:
        out.append(text(80, H - 80, "about 85 km south of Datong", 36, S["ink"], op=ease((p - 0.8) / 0.2)))
    out.append(footer("China Travel Expert · diagram drawn by us"))
    out.append("</svg>")
    return "".join(out)

# ---------------------------------------------------------------- section
def pagoda_elevation(cx, base_y, scale=1.0, lean_deg=0.0, show_hidden=0.0, show_cols=0.0, mono=False, op=1.0):
    """Schematic elevation: podium, 5 storeys with eaves, 4 hidden mezzanines (amber), spire."""
    g = [f'<g opacity="{op:.3f}" transform="rotate({lean_deg:.2f} {cx} {base_y})">']
    wood = S["ink_dim"] if mono else S["wood"]; dark = S["roof_dark"] if mono else S["wood_dark"]; roof = S["roof"]
    y = base_y
    # podium
    pw = 520 * scale; ph = 50 * scale
    g.append(f'<rect x="{cx - pw / 2}" y="{y - ph}" width="{pw}" height="{ph}" fill="{S["roof_dark"]}" stroke="{S["outline"]}" stroke-width="4"/>')
    y -= ph
    widths = [460, 420, 380, 340, 300]
    sh = 88 * scale; hh = 34 * scale
    for i, w in enumerate(widths):
        w *= scale
        # visible storey body
        g.append(f'<rect x="{cx - w / 2}" y="{y - sh}" width="{w}" height="{sh}" fill="{wood}" stroke="{S["outline"]}" stroke-width="4"/>')
        # columns (two rings) drawn as lines
        if show_cols > 0:
            for k in (-0.44, -0.3, 0.3, 0.44):
                g.append(f'<line x1="{cx + k * w:.1f}" y1="{y - sh + 6}" x2="{cx + k * w:.1f}" y2="{y - 6}" stroke="{dark}" stroke-width="7" opacity="{show_cols:.2f}"/>')
            for k in (-0.12, 0.12):
                g.append(f'<line x1="{cx + k * w:.1f}" y1="{y - sh + 6}" x2="{cx + k * w:.1f}" y2="{y - 6}" stroke="{S["accent"]}" stroke-width="7" opacity="{show_cols:.2f}"/>')
        # balcony rail
        g.append(f'<rect x="{cx - w / 2 - 18 * scale}" y="{y - sh - 10 * scale}" width="{w + 36 * scale}" height="{10 * scale}" fill="{dark}"/>')
        y -= sh + 10 * scale
        # eave
        ew = w + 120 * scale
        g.append(f'<path d="M{cx - ew / 2},{y} L{cx + ew / 2},{y} L{cx + w / 2 - 20 * scale},{y - 34 * scale} L{cx - w / 2 + 20 * scale},{y - 34 * scale} Z" fill="{roof}" stroke="{S["outline"]}" stroke-width="4"/>')
        y -= 34 * scale
        if i < 4:
            # hidden mezzanine
            hw = w - 40 * scale
            fill = S["amber"] if show_hidden > 0 else dark
            g.append(f'<rect x="{cx - hw / 2}" y="{y - hh}" width="{hw}" height="{hh}" fill="{fill}" stroke="{S["outline"]}" stroke-width="4" opacity="{0.35 + 0.65 * show_hidden:.2f}"/>')
            if show_hidden > 0:
                # diagonal braces
                n = 6
                for j in range(n):
                    x0 = cx - hw / 2 + j * hw / n; x1 = x0 + hw / n
                    g.append(f'<path d="M{x0:.1f},{y} L{x1:.1f},{y - hh} M{x0:.1f},{y - hh} L{x1:.1f},{y}" stroke="{S["outline"]}" stroke-width="3" opacity="{show_hidden:.2f}"/>')
            y -= hh
    # top roof + spire
    tw = widths[-1] * scale + 60 * scale
    g.append(f'<path d="M{cx - tw / 2},{y} L{cx + tw / 2},{y} L{cx},{y - 90 * scale} Z" fill="{roof}" stroke="{S["outline"]}" stroke-width="4"/>')
    g.append(f'<line x1="{cx}" y1="{y - 90 * scale}" x2="{cx}" y2="{y - 170 * scale}" stroke="{S["amber"]}" stroke-width="8"/>')
    for k in range(5):
        g.append(f'<circle cx="{cx}" cy="{y - 100 * scale - k * 14 * scale}" r="{10 * scale - k}" fill="none" stroke="{S["amber"]}" stroke-width="3"/>')
    g.append("</g>")
    return "".join(g), y - 170 * scale

def section_frame(t, dur=9.0):
    out = [head()]
    sh = ease((t - 2.5) / 0.8); sc = ease((t - 5.0) / 0.8)
    body, top = pagoda_elevation(1250, 1000, 1.0, 0, sh, sc)
    out.append(body)
    out.append(title_block("5 storeys outside.", "9 levels inside.", "schematic elevation · not to scale"))
    # labels
    if t > 0.8:
        a = ease((t - 0.8) / 0.5)
        out.append(text(80, 420, "67.31 m tall", 44, S["ink"], op=a))
        out.append(text(80, 470, "base 30.27 m across", 30, S["ink_dim"], weight="normal", op=a))
        out.append(text(80, 540, "built 1056 · Liao dynasty", 30, S["ink_dim"], weight="normal", op=a))
    if sh > 0:
        out.append(f'<rect x="80" y="620" width="40" height="40" fill="{S["amber"]}" opacity="{sh:.2f}"/>')
        out.append(text(140, 652, "4 hidden levels, braced like trusses", 36, S["amber"], op=sh))
    if sc > 0:
        out.append(f'<rect x="80" y="700" width="40" height="40" fill="{S["accent"]}" opacity="{sc:.2f}"/>')
        out.append(text(140, 732, "inner ring: 8 columns", 36, S["accent"], op=sc))
        out.append(f'<rect x="80" y="760" width="40" height="40" fill="{S["wood_dark"]}" opacity="{sc:.2f}"/>')
        out.append(text(140, 792, "outer ring: 24 columns", 36, S["ink"], op=sc))
        out.append(text(80, 860, "a tube inside a tube", 30, S["ink_dim"], weight="normal", op=sc))
    out.append(footer("China Travel Expert · diagram drawn by us"))
    out.append("</svg>")
    return "".join(out)

# ---------------------------------------------------------------- dougong
def gong_path(half, h):
    r = h * 0.55
    return (f"M {-half},{-h} L {half},{-h} L {half},{-h + r} Q {half},0 {half - r},0 "
            f"L {-half + r},0 Q {-half},0 {-half},{-h + r} Z")

DG_STEPS = [
    (0.8, "column", "柱 zhù", [("rect", -60, 0, 120, 320, "wood_dark")]),
    (2.4, "cap block (ludou)", "栌斗 lǔdǒu", [("path", "M -80,0 L 80,0 L 80,-40 L 95,-40 L 95,-100 L -95,-100 L -95,-40 L -80,-40 Z", "wood")]),
    (4.0, "bow-shaped arm (gong)", "拱 gǒng", [("gong", 230, 60, "wood_light")]),
    (5.6, "small blocks (sandou)", "散斗 sǎndǒu", [("rect", -265, -60, 70, 60, "wood"), ("rect", -35, -60, 70, 60, "wood"), ("rect", 195, -60, 70, 60, "wood")]),
    (7.2, "longer arm, more blocks", "慢拱 màngǒng", [("gong", 330, 60, "wood_light")]),
    (8.8, "beam + eave sit on top", "梁 liáng", [("rect", -420, -70, 840, 70, "wood_dark"), ("path", "M -520,-70 L 520,-70 L 440,-130 L -440,-130 Z", "roof")]),
]
DG_DY = [0, 0, -100, -160, -220, -280]

def shape(part, op=1.0):
    k = part[0]
    if k == "rect":
        _, x, y, w, h, f = part
        return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{S[f]}" stroke="{S["outline"]}" stroke-width="5" stroke-linejoin="round"/>'
    if k == "path":
        _, d, f = part
        return f'<path d="{d}" fill="{S[f]}" stroke="{S["outline"]}" stroke-width="5" stroke-linejoin="round"/>'
    if k == "gong":
        _, half, h, f = part
        return f'<path d="{gong_path(half, h)}" fill="{S[f]}" stroke="{S["outline"]}" stroke-width="5" stroke-linejoin="round"/>'

def dougong_frame(t, dur=11.0):
    out = [head()]
    ox, oy = 1250, 760
    out.append(f'<line x1="700" y1="{oy + 320}" x2="1800" y2="{oy + 320}" stroke="{S["ink_dim"]}" stroke-width="4" stroke-dasharray="18 14"/>')
    cur = -1
    for i, (t0, cap, cn, parts) in enumerate(DG_STEPS):
        if t < t0: break
        cur = i; age = t - t0
        p = ease(age / 0.55); drop = -220 * (1 - p); a = ease(age / 0.25)
        out.append(f'<g opacity="{a:.3f}" transform="translate({ox},{oy + DG_DY[i] + drop:.1f})">{"".join(shape(q) for q in parts)}</g>')
    out.append(title_block("The joint that slips:", "dougong", "no metal nails in the joints"))
    out.append(text(360, 172, "斗拱", 56, S["accent"], font=FONT_CN))
    for i in range(cur + 1):
        t0, cap, cn, _ = DG_STEPS[i]
        a = ease((t - t0) / 0.4); yy = 330 + i * 70
        col = S["accent"] if i == cur else S["ink"]
        out.append(text(80, yy, f"{i + 1}. {cap}", 36, col, op=a))
        out.append(text(640, yy, cn, 30, S["ink_dim"], weight="normal", font=FONT_CN, op=a))
    if t > 10.0:
        a = ease((t - 10.0) / 0.5)
        out.append(text(80, 860, "Under shaking, the pieces rotate and rub —", 34, S["amber"], op=a))
        out.append(text(80, 905, "and that friction eats the energy.", 34, S["amber"], op=a))
    out.append(footer("China Travel Expert · diagram drawn by us"))
    out.append("</svg>")
    return "".join(out)

# ---------------------------------------------------------------- sway
def sway_frame(t, dur=9.0):
    out = [head()]
    quake = clamp((t - 1.5) / 0.3) * (1 - clamp((t - 7.5) / 1.0))
    # ground with wave
    pts = []
    for x in range(0, W + 1, 20):
        y = 1000 + 14 * quake * math.sin(x / 60 + t * 14)
        pts.append(f"{x},{y:.1f}")
    out.append(f'<path d="M{" L".join(pts)} L{W},{H} L0,{H} Z" fill="{S["roof_dark"]}"/>')
    # wooden pagoda (left) sways
    lean = 4.0 * quake * math.sin(t * 7)
    body, _ = pagoda_elevation(620, 1000, 0.82, lean, 0, 0)
    out.append(body)
    # rigid stone tower (right): rectangle, cracks appear
    rx, rw, rh = 1320, 230, 760
    tilt = 1.2 * quake * math.sin(t * 7 + 0.4)
    out.append(f'<g transform="rotate({tilt:.2f} {rx + rw / 2} 1000)"><rect x="{rx}" y="{1000 - rh}" width="{rw}" height="{rh}" fill="{S["ink_dim"]}" stroke="{S["outline"]}" stroke-width="4"/>')
    for k in range(1, 9):
        out.append(f'<line x1="{rx}" y1="{1000 - k * rh / 9:.0f}" x2="{rx + rw}" y2="{1000 - k * rh / 9:.0f}" stroke="{S["outline"]}" stroke-width="2"/>')
    cr = clamp((t - 3.5) / 1.5)
    if cr > 0:
        L = 420 * cr
        out.append(f'<path d="M{rx + 40},{1000 - 120} l 30,-60 l -20,-70 l 45,-80 l -15,-90 l 35,-{max(0, L - 300):.0f}" fill="none" stroke="{S["accent"]}" stroke-width="7" stroke-linecap="round" opacity="{cr:.2f}"/>')
    out.append("</g>")
    out.append(title_block("Flexible vs rigid", "same quake, two towers", "schematic animation · not a simulation"))
    out.append(text(620, 1050, "timber frame: rocks, rubs, recovers", 32, S["amber"], "middle"))
    out.append(text(rx + rw / 2, 1050, "stiff masonry: cracks", 32, S["ink"], "middle"))
    if t > 5.5:
        a = ease((t - 5.5) / 0.5)
        out.append(text(80, 420, "Shaking-table tests of", 36, S["ink"], op=a))
        out.append(text(80, 466, "pagoda models: damping", 36, S["ink"], op=a))
        out.append(text(80, 512, "ratio above 0.1, and it", 36, S["ink"], op=a))
        out.append(text(80, 558, "rises as shaking grows.", 36, S["ink"], op=a))
    out.append(text(W - 80, 60, "China Travel Expert · diagram drawn by us", 24, S["ink_dim"], "end", "normal"))
    out.append("</svg>")
    return "".join(out)

SCENES = {"map": (map_frame, 7.0), "section": (section_frame, 9.0), "dougong": (dougong_frame, 11.0), "sway": (sway_frame, 9.0)}
_polys = None

def render_one(args):
    name, i, t, path = args
    global _polys
    fn, _ = SCENES[name]
    if name == "map":
        if _polys is None: _polys = load_china()
        svg = fn(t, _polys)
    else:
        svg = fn(t)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=path, output_width=W, output_height=H)

def render(name):
    fn, dur = SCENES[name]
    fd = os.path.join(OUT, name + "_frames"); os.makedirs(fd, exist_ok=True)
    n = int(dur * FPS)
    jobs = [(name, i, i / FPS, os.path.join(fd, f"f_{i:05d}.png")) for i in range(n)]
    t0 = time.time()
    with Pool(os.cpu_count()) as pool:
        list(pool.imap_unordered(render_one, jobs, chunksize=8))
    mp4 = os.path.join(OUT, name + ".mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(fd, "f_%05d.png"),
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4], check=True)
    subprocess.run(["cp", os.path.join(fd, f"f_{n - 1:05d}.png"), os.path.join(OUT, name + "_still.png")])
    print(f"{name}: {n} frames in {time.time() - t0:.1f}s -> {mp4}")

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    names = sys.argv[1:] or ["all"]
    if names == ["all"]: names = list(SCENES)
    for n in names: render(n)
