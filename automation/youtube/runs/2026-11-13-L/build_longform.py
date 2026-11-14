#!/usr/bin/env python3
"""
Assemble the M-Long "Yingxian" explainer (16:9) from:
  - vo.mp3            (OpenAI TTS marin narration, 43 paragraph chunks)
  - img/S01-*.jpg     (the ONE slug-named Pexels photo of the pagoda)
  - scripts/mechanism/diagrams/{map,section,dougong,sway}.mp4 + *_still.png (code-drawn)
  - a music bed at -18 dB under the voice

Visual beats are keyed to the narration paragraph boundaries, which are recovered from
the TTS log's per-chunk durations plus the measured inter-chunk gap.
All text added here is ENGLISH ONLY (config longform.language: english-only).
Pattern follows plans/mechanism/yingxian/longform-assemble.sh.
"""
import json, os, re, subprocess, sys

ROOT = "/home/user/Claude-code"
RUN = f"{ROOT}/automation/youtube/runs/2026-11-13-L"
DIA = f"{ROOT}/scripts/mechanism/diagrams"
HERO = f"{RUN}/img/S01-pexels-15955261.jpg"
BED = f"{ROOT}/automation/youtube/assets/music/el-docu-underscore-04.mp3"
TTSLOG = "/tmp/claude-0/-home-user-Claude-code/bf8d9ff8-b3e2-564b-886d-05905a7cee04/scratchpad/tts.log"
SEG, TXT = f"{RUN}/seg", f"{RUN}/txt"
FB = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
FD = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
ACCENT, RED, WHITE = "0xF2B134", "0xE8513A", "white"
FPS = 30

os.makedirs(SEG, exist_ok=True); os.makedirs(TXT, exist_ok=True)
for f in os.listdir(SEG):
    os.remove(os.path.join(SEG, f))

def sh(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.returncode != 0:
        print("FFMPEG FAIL:\n", cmd, "\n", r.stderr[-1500:]); sys.exit(1)

def dur(path):
    return float(subprocess.run(
        ["ffprobe","-v","error","-show_entries","format=duration","-of","default=nw=1:nk=1",path],
        capture_output=True, text=True).stdout.strip())

# ---------- 1. paragraph timeline ----------
log = open(TTSLOG).read()
chunk = [float(x) for x in re.findall(r"ok \((\d+\.\d+)s, WER", log)]
paras = [p for p in open(f"{RUN}/voiceover.txt").read().split("\n\n") if p.strip()]
assert len(chunk) == len(paras), (len(chunk), len(paras))
VO = dur(f"{RUN}/vo.mp3")
gap = (VO - sum(chunk)) / (len(chunk) - 1)
starts, t = [], 0.0
for d in chunk:
    starts.append(t); t += d + gap
spans = [(starts[i], starts[i] + chunk[i] + (gap if i < len(chunk)-1 else 0.0)) for i in range(len(chunk))]
print(f"VO {VO:.2f}s, {len(paras)} paragraphs, gap {gap:.3f}s")

# ---------- 2. text helper ----------
_n = [0]
def tfile(s):
    _n[0] += 1
    p = f"{TXT}/t{_n[0]:03d}.txt"
    open(p, "w").write(s)
    return p

def draw(s, size, y, color=WHITE, font=FD, x="80", frm=None, to=None, box=False):
    f = f"drawtext=fontfile={font}:textfile={tfile(s)}:fontcolor={color}:fontsize={size}:x={x}:y={y}"
    f += ":box=1:boxcolor=0x15110d@0.78:boxborderw=18" if box else ":shadowcolor=black@0.85:shadowx=4:shadowy=4"
    if frm is not None or to is not None:
        a, b = frm if frm is not None else 0, to if to is not None else 99999
        f += f":enable='between(t,{a},{b})'"
    return f

def big(s, y=120, size=92, color=ACCENT, **kw):  return draw(s, size, str(y), color, FD, "80", **kw)
def low(s, y=950, size=44, **kw):                return draw(s, size, str(y), WHITE, FB, "80", box=True, **kw)
# second lower band: used on DIAGRAM beats, whose own headline occupies the top of the frame
def low2(s, y=862, size=46, color=ACCENT, **kw): return draw(s, size, str(y), color, FD, "80", box=True, **kw)

# ---------- 3. visual primitives ----------
def hero_seg(out, d, anchor=0.3, z="1+0.00035*on", grade="", extra=""):
    n = max(2, int(round(d * FPS)))
    vf = (f"scale=1920:-2,crop=1920:1080:0:(ih-1080)*{anchor}"
          f"{grade},zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=1920x1080:fps={FPS},setsar=1")
    if extra: vf += "," + extra
    sh(f'ffmpeg -y -loglevel error -loop 1 -i "{HERO}" -t {d:.3f} -vf "{vf}" '
       f'-c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -r {FPS} -an "{out}"')

def still_seg(out, d, png, z="1+0.0003*on", extra=""):
    n = max(2, int(round(d * FPS)))
    vf = (f"scale=1920:1080,zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
          f":d={n}:s=1920x1080:fps={FPS},setsar=1")
    if extra: vf += "," + extra
    sh(f'ffmpeg -y -loglevel error -loop 1 -i "{png}" -t {d:.3f} -vf "{vf}" '
       f'-c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -r {FPS} -an "{out}"')

def card_seg(out, d, extra=""):
    n = max(2, int(round(d * FPS)))
    vf = (f"scale=1920:-2,crop=1920:1080:0:(ih-1080)*0.35,boxblur=24:2,eq=brightness=-0.30:saturation=0.55,"
          f"zoompan=z='1+0.0002*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=1920x1080:fps={FPS},setsar=1")
    if extra: vf += "," + extra
    sh(f'ffmpeg -y -loglevel error -loop 1 -i "{HERO}" -t {d:.3f} -vf "{vf}" '
       f'-c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -r {FPS} -an "{out}"')

def anim_seg(out_base, d, name, ss=0.0, extra=""):
    """Play the animation from ss; if the beat is longer, hold on its final still."""
    src, png = f"{DIA}/{name}.mp4", f"{DIA}/{name}_still.png"
    avail = max(0.0, dur(src) - ss)
    outs = []
    play = min(d, avail)
    if play > 0.15:
        vf = f"scale=1920:1080,setsar=1" + ("," + extra if extra else "")
        o = f"{out_base}a.mp4"; outs.append(o)
        sh(f'ffmpeg -y -loglevel error -ss {ss:.3f} -t {play:.3f} -i "{src}" -vf "{vf}" '
           f'-c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -r {FPS} -an "{o}"')
    rest = d - play
    if rest > 0.15:
        o = f"{out_base}b.mp4"; outs.append(o)
        # shift overlay timings into the held part
        ex = re.sub(r"between\(t,([\d.]+),([\d.]+)\)",
                    lambda m: f"between(t,{max(0.0,float(m.group(1))-play):.2f},{max(0.0,float(m.group(2))-play):.2f})",
                    extra) if extra else ""
        still_seg(o, rest, png, z="1+0.00018*on", extra=ex)
    return outs

# ---------- 4. the beat plan (one entry per narration paragraph) ----------
P = [
 dict(k="hero", anchor=0.18, ov=lambda d:[low("Yingxian, Shanxi — finished 1056", frm=0.4, to=8.5),
      big("ALMOST NO NAILS", y=110, size=98, frm=9.8, to=d)]),
 dict(k="anim", src="sway", ov=lambda d:[low("“a large earthquake lasting for seven days” — China Daily, 2025", frm=0.6)]),
 dict(k="hero", anchor=0.45, grade=",hue=s=0.12,eq=contrast=1.18:brightness=-0.06,vignette=PI/4",
      ov=lambda d:[big("1926", y=110, size=130, color=WHITE), big("200+ SHELLS", y=255, size=96, color=RED),
      low("it caught fire · it burned out · it stayed up", frm=5.0)]),
 dict(k="hero", anchor=0.55, z="1.10-0.0004*on",
      ov=lambda d:[big("TALLEST WOODEN PAGODA ON EARTH", y=110, size=66),
      low("Guinness World Records · certified September 2016", frm=1.5)]),
 dict(k="still", src="section_still", ov=lambda d:[draw("HOW?", 150, "880", RED, FD, "80", box=True)]),
 dict(k="anim", src="dougong", ov=lambda d:[low("1 · a joint designed to slip", frm=1.0, to=4.6),
      low("2 · a tower inside a tower", frm=4.8, to=7.6), low("3 · four floors nobody is allowed to see", frm=7.8)]),
 dict(k="hero", anchor=0.85, z="1.09-0.0004*on",
      ov=lambda d:[big("CHINA TRAVEL EXPERT", y=110, size=72, color=WHITE), low("Let's take it apart.", frm=1.0)]),
 # CH1
 dict(k="anim", src="map", ov=lambda d:[low("Yingxian · about 85 km south of Datong", frm=1.0)]),
 dict(k="hero", anchor=0.30, ov=lambda d:[low("Sakyamuni Pagoda of Fogong Temple — the wooden tower", frm=1.0)]),
 dict(k="anim", src="section", ov=lambda d:[low("67.31 m tall · 30.27 m across the base", frm=0.8)]),
 dict(k="still", src="section_still", ov=lambda d:[low("five bright, four dark — the carpenters' phrase for it", frm=1.0)]),
 dict(k="anim", src="dougong", ov=lambda d:[low("bracket sets — 54 kinds (some surveys count 59)", frm=0.8)]),
 dict(k="hero", anchor=0.15, ov=lambda d:[low("tallest wooden pagoda in the world · Guinness, 2016", frm=0.8)]),
 # CH2
 dict(k="card", ov=lambda d:[big("THE HONEST VERSION", y=470, size=104, color=WHITE)]),
 dict(k="card", ov=lambda d:[big("“40 EARTHQUAKES”?", y=420, size=104),
      low("no heritage body and no engineering paper gives that number", y=620, frm=2.5)]),
 dict(k="card", ov=lambda d:[big("1056 – 1103", y=430, size=110, color=WHITE),
      low("seven earthquakes, in local chronicles", y=620, frm=1.2)]),
 dict(k="card", ov=lambda d:[big("THE YUAN DYNASTY", y=420, size=88, color=WHITE),
      low("one quake recorded as lasting seven days · the tower stood", y=620, frm=1.5)]),
 dict(k="anim", src="sway", ov=lambda d:[low("the Shanxi rift · 1556: the deadliest earthquake on record", frm=0.8)]),
 dict(k="hero", anchor=0.50, grade=",hue=s=0.12,eq=contrast=1.18:brightness=-0.06,vignette=PI/4",
      ov=lambda d:[big("1926", y=110, size=120, color=WHITE),
      low("Yan Xishan and Feng Yuxiang fought over the town", frm=1.0, to=11.0),
      low("the fires went out on their own", frm=11.5)]),
 dict(k="hero", anchor=0.60, ov=lambda d:[big("NOT UNDAMAGED. UN-FALLEN.", y=110, size=70),
      low("shell scars are still visible on floors 2 and 3", frm=1.0)]),
 # CH3
 dict(k="anim", src="dougong", ov=lambda d:[low("column → cap block → arm → blocks → a longer arm", frm=0.8)]),
 dict(k="still", src="dougong_still", ov=lambda d:[
      low("mortise + tenon · no metal nails, nothing glued — held by weight and friction", size=40, frm=1.0)]),
 dict(k="card", ov=lambda d:[big("THAT SOUNDS LIKE A WEAKNESS.", y=430, size=74, color=WHITE),
      big("IT'S THE POINT.", y=540, size=86, color=ACCENT, frm=1.8, to=d)]),
 dict(k="anim", src="sway", ov=lambda d:[low("a rigid joint can hold, or break — a bracket set has a third option", frm=0.8)]),
 dict(k="anim", src="sway", ov=lambda d:[low("damping ratio above 0.1 — shaking-table tests", frm=0.8)]),
 dict(k="still", src="dougong_still", ov=lambda d:[
      low("a joint designed to give — each one a shock absorber that resets", size=40, frm=1.0)]),
 # CH4
 dict(k="anim", src="section", ov=lambda d:[low("8 inner columns · 24 outer columns", frm=0.8)]),
 dict(k="anim", src="section", ov=lambda d:[low("the whole octagon works as one stiff ring", frm=0.8)]),
 dict(k="anim", src="section", ov=lambda d:[low2("the four floors nobody sees", frm=0.5),
      low("packed with diagonal braces — triangles, like a modern truss", frm=1.2)]),
 dict(k="still", src="section_still", ov=lambda d:[low("five soft storeys · four stiff belts", frm=0.8, to=10.0),
      low("the Liao carpenters got there in 1056", frm=10.5)]),
 # CH5
 dict(k="anim", src="sway", ov=lambda d:[low("stone cracks when you bend it · timber bends and comes back", frm=0.8)]),
 dict(k="anim", src="sway", ov=lambda d:[low("it moves with the earthquake instead of fighting it", frm=0.8)]),
 dict(k="hero", anchor=0.70, ov=lambda d:[big("7,400 t (REPORTED)", y=110, size=84),
      low("larch and elm — heavy enough to stay planted while it sways", frm=1.2)]),
 # CH6
 dict(k="hero", anchor=0.25, ov=lambda d:[big("CLOSED ABOVE FLOOR 1", y=110, size=80, color=RED),
      low("the upper levels have been shut for more than ten years", frm=1.2)]),
 dict(k="still", src="section_still", ov=lambda d:[
      low("2004 survey: tilted 65 cm north-east, compressed 88 cm", size=40, frm=0.8, to=9.0),
      low("column 23 leaned more than 56 cm when measured in 2015", size=40, frm=9.4)]),
 dict(k="card", ov=lambda d:[big("THE 1930s “REPAIR”", y=420, size=92),
      low("walls and braces removed on floor 2 — then the shelling, then more war", y=620, frm=2.0)]),
 dict(k="card", ov=lambda d:[big("2002: FOUR PLANS, ALL SHELVED", y=400, size=68, color=WHITE),
      low("2024: a Tsinghua team began mapping every member", y=600, frm=6.0, to=13.5),
      low("take it apart and rebuild — or correct it in place?", y=600, frm=14.0)]),
 dict(k="hero", anchor=0.40, ov=lambda d:[big("STANDING, LEANING, WAITING", y=110, size=76)]),
 # CH7
 dict(k="hero", anchor=0.45, ov=lambda d:[big("1933", y=110, size=120, color=WHITE),
      low("Liang Sicheng climbed it with a tape measure and drew it", frm=1.0)]),
 dict(k="hero", anchor=0.55, ov=lambda d:[big("1974", y=110, size=120, color=WHITE),
      low("relics and Liao printed scriptures, sealed inside the statues", frm=1.2)]),
 # CLOSE
 dict(k="hero", anchor=0.80, z="1.12-0.0005*on",
      ov=lambda d:[big("NOT BY BEING STRONG.", y=110, size=86),
      low("by being allowed to move", frm=3.0)]),
 dict(k="card", ov=lambda d:[big("DISMANTLE — OR FIX IT STANDING?", y=420, size=72, color=ACCENT),
      low("tell me which, in the comments", y=620, frm=2.0)]),
 dict(k="hero", anchor=0.20, z="1.10-0.0004*on",
      ov=lambda d:[big("NEXT: THE PAGODA AN EARTHQUAKE SPLIT IN HALF", y=110, size=54),
      low("subscribe so you don't miss it", frm=2.0)]),
]
assert len(P) == len(paras), f"plan {len(P)} vs paragraphs {len(paras)}"

# ---------- 5. render beats ----------
order = []
for i, (sp, spec) in enumerate(zip(spans, P)):
    d = sp[1] - sp[0]
    ov = ",".join(spec["ov"](d)) if spec.get("ov") else ""
    base = f"{SEG}/{i+1:03d}"
    k = spec["k"]
    if k == "hero":
        o = base + ".mp4"
        hero_seg(o, d, spec.get("anchor", 0.3), spec.get("z", "1+0.00035*on"), spec.get("grade", ""), ov)
        order.append(o)
    elif k == "still":
        o = base + ".mp4"
        still_seg(o, d, f"{DIA}/{spec['src']}.png", extra=ov)
        order.append(o)
    elif k == "card":
        o = base + ".mp4"
        card_seg(o, d, ov)
        order.append(o)
    elif k == "anim":
        order += anim_seg(base, d, spec["src"], spec.get("ss", 0.0), ov)
    print(f"  beat {i+1:2d}/{len(P)} {k:5s} {d:6.2f}s", flush=True)

# ---------- 6. concat + audio ----------
lst = f"{SEG}/list.txt"
open(lst, "w").write("".join(f"file '{os.path.basename(o)}'\n" for o in order))
sh(f'cd "{SEG}" && ffmpeg -y -loglevel error -f concat -safe 0 -i list.txt -c copy video.mp4')
vd = dur(f"{SEG}/video.mp4")
print(f"video track {vd:.2f}s vs vo {VO:.2f}s")

out = f"{RUN}/final.mp4"
sh(f'ffmpeg -y -loglevel error -i "{SEG}/video.mp4" -i "{RUN}/vo.mp3" -i "{BED}" '
   f'-filter_complex "[2:a]aloop=loop=-1:size=2e9,volume=0.11,afade=t=out:st={VO-5:.2f}:d=4.5[m];'
   f'[1:a]volume=1.0[v];[v][m]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,'
   f'loudnorm=I=-16:TP=-1.5:LRA=11[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "{out}"')
print("WROTE", out, dur(out))
