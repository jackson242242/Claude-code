#!/usr/bin/env python3
"""Code-drawn price card (no AI) for the F3 China Price Check slot:
Tower of London (GBP 37, about $49) vs Mutianyu Great Wall (CNY 40, about $6).
Both prices verified this run; US/other side is text only. Schematic wall motifs only.
Usage: python3 draw_price_card.py out.png
"""
import sys
import cairosvg

W, H = 1080, 1920
BG = "#15110d"; GRID = "#1f1913"; INK = "#f6ead3"; DIM = "#b9a98d"
ACCENT = "#e8513a"; GOLD = "#d9a441"; STONE = "#8f8678"; WALL = "#8a3b2f"; GREEN = "#6fae6b"

def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

p = []
p.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
p.append(f'<rect width="{W}" height="{H}" fill="{BG}"/>')
# faint grid
g = []
for x in range(0, W, 108): g.append(f'M{x},0 V{H}')
for y in range(0, H, 108): g.append(f'M0,{y} H{W}')
p.append(f'<path d="{" ".join(g)}" stroke="{GRID}" stroke-width="2"/>')

# header card (the hook — PRICE-SHOCK)
p.append(f'<rect x="50" y="110" width="980" height="220" rx="24" fill="#231b14" stroke="{ACCENT}" stroke-width="4"/>')
p.append(f'<text x="540" y="178" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="40" fill="{GOLD}">CHINA PRICE CHECK</text>')
p.append(f'<text x="540" y="246" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="56" fill="{INK}">Same idea. 8× the price?</text>')
p.append(f'<text x="540" y="300" text-anchor="middle" font-family="Noto Serif CJK SC" font-size="30" fill="{DIM}">两道城墙 · 一个贵八倍</text>')

def crenellation(x, y, w, color):
    # a simple battlement strip: rectangle with notched top
    d = [f'M{x},{y+54}']
    step = w / 7.0
    cx = x
    up = True
    d.append(f'L{x},{y+18}')
    for i in range(7):
        if up:
            d.append(f'L{cx+step*0.6},{y+18} L{cx+step*0.6},{y} L{cx+step},{y}')
        cx += step
    d.append(f'L{x+w},{y+54} Z')
    return f'<path d="{" ".join(d)}" fill="{color}"/>'

# LEFT panel — Tower of London
lx = 60
p.append(f'<rect x="{lx}" y="390" width="440" height="560" rx="20" fill="#1c1712" stroke="{STONE}" stroke-width="3"/>')
p.append(crenellation(lx+70, 440, 300, STONE))
# two tower blocks
p.append(f'<rect x="{lx+120}" y="470" width="90" height="90" fill="{STONE}"/>')
p.append(f'<rect x="{lx+300}" y="470" width="90" height="90" fill="{STONE}"/>')
p.append(f'<text x="{lx+220}" y="640" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="38" fill="{INK}">Tower of London</text>')
p.append(f'<text x="{lx+220}" y="684" text-anchor="middle" font-family="DejaVu Sans" font-size="26" fill="{DIM}">England · royal fortress</text>')
p.append(f'<text x="{lx+220}" y="810" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="130" fill="{INK}">£37</text>')
p.append(f'<text x="{lx+220}" y="880" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="46" fill="{ACCENT}">≈ $49</text>')

# RIGHT panel — Mutianyu Great Wall
rx = 580
p.append(f'<rect x="{rx}" y="390" width="440" height="560" rx="20" fill="#1c1712" stroke="{GOLD}" stroke-width="3"/>')
p.append(crenellation(rx+70, 440, 300, WALL))
# watchtower
p.append(f'<rect x="{rx+200}" y="452" width="80" height="78" fill="{WALL}"/>')
p.append(crenellation(rx+200, 436, 80, WALL))
p.append(f'<text x="{rx+220}" y="640" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="38" fill="{INK}">Great Wall</text>')
p.append(f'<text x="{rx+220}" y="684" text-anchor="middle" font-family="Noto Serif CJK SC" font-size="26" fill="{DIM}">Mutianyu 慕田峪 · Beijing</text>')
p.append(f'<text x="{rx+220}" y="810" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="130" fill="{GOLD}">¥40</text>')
p.append(f'<text x="{rx+220}" y="880" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="46" fill="{GREEN}">≈ $6</text>')

# center VS
p.append(f'<circle cx="540" cy="670" r="46" fill="#231b14" stroke="{ACCENT}" stroke-width="4"/>')
p.append(f'<text x="540" y="686" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="40" fill="{INK}">vs</text>')

# big multiple banner
p.append(f'<rect x="210" y="1000" width="660" height="150" rx="24" fill="#231b14" stroke="{GOLD}" stroke-width="4"/>')
p.append(f'<text x="540" y="1070" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="76" fill="{GOLD}">8× cheaper</text>')
p.append(f'<text x="540" y="1120" text-anchor="middle" font-family="DejaVu Sans" font-size="28" fill="{DIM}">entry only · both verified today</text>')

# brand footer (kept high; lower third left clear for burned subtitles)
p.append(f'<text x="540" y="1215" text-anchor="middle" font-family="Noto Serif CJK SC" font-size="30" fill="{DIM}">China Travel Expert · 中国古建筑</text>')

p.append('</svg>')
svg = "".join(p)
out = sys.argv[1] if len(sys.argv) > 1 else "card.png"
cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=out, output_width=W, output_height=H)
print("wrote", out)
