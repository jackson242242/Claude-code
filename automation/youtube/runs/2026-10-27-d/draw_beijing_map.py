#!/usr/bin/env python3
"""Code-drawn schematic map (no AI) for the MAP-FORMAT slot: Forbidden City + White Stupa Plan B.
Usage: python3 draw_beijing_map.py out.png
"""
import sys
import cairosvg

W, H = 1080, 1920
BG = "#15110d"; GRID = "#1f1913"; INK = "#f6ead3"; DIM = "#b9a98d"
ACCENT = "#e8513a"; GOLD = "#d9a441"; WALL = "#8a3b2f"; WHITE = "#eef1f4"; ROAD = "#3a2f23"
FEN = "DejaVu Sans"; FCN = "Noto Serif CJK SC"

def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

p = []
p.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
p.append(f'<rect width="{W}" height="{H}" fill="{BG}"/>')
# faint road grid
g = []
for x in range(0, W, 108): g.append(f'M{x},0 V{H}')
for y in range(0, H, 108): g.append(f'M0,{y} H{W}')
p.append(f'<path d="{" ".join(g)}" stroke="{GRID}" stroke-width="2"/>')
# a couple of thicker "ring roads"
p.append(f'<path d="M90,520 H990" stroke="{ROAD}" stroke-width="10" opacity="0.7"/>')
p.append(f'<path d="M90,1180 H990" stroke="{ROAD}" stroke-width="10" opacity="0.7"/>')
p.append(f'<path d="M700,360 V1320" stroke="{ROAD}" stroke-width="10" opacity="0.7"/>')

# header card (the hook — STAKES)
p.append(f'<rect x="50" y="110" width="980" height="210" rx="24" fill="#231b14" stroke="{ACCENT}" stroke-width="4"/>')
p.append(f'<text x="540" y="195" text-anchor="middle" font-family="{FEN}" font-weight="bold" font-size="60" fill="{INK}">Forbidden City</text>')
p.append(f'<text x="540" y="268" text-anchor="middle" font-family="{FEN}" font-weight="bold" font-size="60" fill="{ACCENT}">SOLD OUT?</text>')
p.append(f'<text x="540" y="312" text-anchor="middle" font-family="{FCN}" font-size="30" fill="{DIM}">北京 · a walk-up Plan B</text>')

# compass
p.append(f'<text x="965" y="420" text-anchor="middle" font-family="{FEN}" font-weight="bold" font-size="34" fill="{DIM}">N</text>')
p.append(f'<path d="M965,428 l-14,34 h28 Z" fill="{DIM}"/>')

# Forbidden City footprint (long N-S rectangle), lower-center
fx, fy, fw, fh = 600, 740, 150, 360
p.append(f'<rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" rx="10" fill="#2a1410" stroke="{WALL}" stroke-width="7"/>')
# a moat hint
p.append(f'<rect x="{fx-16}" y="{fy-16}" width="{fw+32}" height="{fh+32}" rx="14" fill="none" stroke="#294a5c" stroke-width="5" opacity="0.6"/>')
p.append(f'<text x="{fx+fw/2}" y="{fy+fh/2-6}" text-anchor="middle" font-family="{FEN}" font-weight="bold" font-size="30" fill="{GOLD}">Forbidden</text>')
p.append(f'<text x="{fx+fw/2}" y="{fy+fh/2+30}" text-anchor="middle" font-family="{FEN}" font-weight="bold" font-size="30" fill="{GOLD}">City</text>')
# sold-out tag on FC
p.append(f'<text x="{fx+fw/2}" y="{fy+fh+44}" text-anchor="middle" font-family="{FEN}" font-size="27" fill="{ACCENT}">✕ no same-day tickets</text>')

# White Stupa pin, NW of FC
sx, sy = 265, 690
# teardrop pin
p.append(f'<path d="M{sx},{sy+86} C{sx-58},{sy+10} {sx-44},{sy-70} {sx},{sy-70} C{sx+44},{sy-70} {sx+58},{sy+10} {sx},{sy+86} Z" fill="{ACCENT}"/>')
# white stupa icon inside the pin (dagoba: base + dome + spire)
cy = sy - 18
p.append(f'<rect x="{sx-30}" y="{cy+26}" width="60" height="18" rx="4" fill="{WHITE}"/>')          # plinth
p.append(f'<path d="M{sx-26},{cy+26} Q{sx},{cy-26} {sx+26},{cy+26} Z" fill="{WHITE}"/>')             # dome
p.append(f'<rect x="{sx-6}" y="{cy-52}" width="12" height="30" fill="{WHITE}"/>')                    # spire
p.append(f'<circle cx="{sx}" cy="{cy-56}" r="7" fill="{GOLD}"/>')                                    # finial
# stupa labels
p.append(f'<text x="{sx}" y="{sy+140}" text-anchor="middle" font-family="{FEN}" font-weight="bold" font-size="34" fill="{INK}">White Stupa · 1279</text>')
p.append(f'<text x="{sx}" y="{sy+180}" text-anchor="middle" font-family="{FCN}" font-size="28" fill="{DIM}">Miaoying Temple 妙应寺</text>')
p.append(f'<text x="{sx}" y="{sy+216}" text-anchor="middle" font-family="{FEN}" font-size="28" fill="{GOLD}">walk up · about ¥20</text>')

# dotted connector + distance
p.append(f'<path d="M{sx+58},{sy+20} C430,{sy+10} 520,760 {fx-18},820" fill="none" stroke="{DIM}" stroke-width="5" stroke-dasharray="16 14" stroke-linecap="round"/>')
p.append(f'<rect x="372" y="958" width="236" height="56" rx="12" fill="#231b14" stroke="{DIM}" stroke-width="3"/>')
p.append(f'<text x="490" y="996" text-anchor="middle" font-family="{FEN}" font-weight="bold" font-size="30" fill="{INK}">~3 km west</text>')

# brand footer (kept high enough to leave the lower third for burned subtitles)
p.append(f'<text x="540" y="1330" text-anchor="middle" font-family="{FCN}" font-size="30" fill="{DIM}">China Travel Expert · 中国古建筑</text>')

p.append('</svg>')
svg = "".join(p)
out = sys.argv[1] if len(sys.argv) > 1 else "map.png"
cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=out, output_width=W, output_height=H)
print("wrote", out)
