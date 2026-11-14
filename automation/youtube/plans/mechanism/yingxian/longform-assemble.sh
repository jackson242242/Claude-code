#!/bin/bash
# 60 s narrated sample, 16:9 1920x1080: the cold open of the explainer over its first-minute visuals.
# Visuals: slug-named Pexels photo (pxp-15955261), CC BY Commons photos (title names Fogong), code-drawn diagrams.
# Audio: ElevenLabs Rachel VO (vo-60s.mp3, 65 s) + el-docu-underscore-04 bed at low gain.
set -euo pipefail
cd "$(dirname "$0")"
P=..
F=/usr/share/fonts/opentype/inter/InterDisplay-Black.otf
FB=/usr/share/fonts/opentype/inter/Inter-Bold.otf
S01=$P/dl/pexels/pxp-15955261.jpg
DG=$P/dl/commons/ccby-2.jpg          # corner dougong (CC BY 3.0)
PAN=$P/dl/commons/ccby-4.jpg         # panoramio portrait (CC BY 3.0)
GATE=$P/dl/commons/ccby-3.jpg        # gate (CC BY 2.0)
[ -s "$DG" ] && file "$DG" | grep -q image || DG=$S01
[ -s "$PAN" ] && file "$PAN" | grep -q image || PAN=$P/dl/commons/ccby-1.jpg   # fallback: "Fogong Pagoda 1.jpg" CC BY 2.0 (768x1024)
mkdir -p seg; rm -f seg/*.mp4
V="-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 -an"
lower() { # lower-third box text: $1 text $2 y
  echo "drawtext=fontfile=$FB:text='$1':fontcolor=white:fontsize=46:x=80:y=$2:box=1:boxcolor=0x15110d@0.75:boxborderw=18"
}
big() { # big headline: $1 text $2 x $3 y $4 color $5 size
  echo "drawtext=fontfile=$F:text='$1':fontcolor=$4:fontsize=$5:x=$2:y=$3:shadowcolor=black@0.85:shadowx=5:shadowy=5"
}
kb() { # Ken Burns on a still: $1 img $2 seconds $3 zoom-per-frame $4 vertical anchor (0..1) $5 extra filters $6 out
  n=$(python3 -c "print(int(round($2*30)))")
  ffmpeg -y -loglevel error -loop 1 -i "$1" -t "$2" -vf "scale=1920:-2,crop=1920:1080:0:(ih-1080)*$4,zoompan=z='1+$3*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$n:s=1920x1080:fps=30,setsar=1$5" $V "$6"
}
# A 0-12.9 s: the tower, push-in. "Yingxian, Shanxi · 1056" then "almost no nails"
kb "$S01" 12.9 0.0004 0.2 ",$(lower 'Yingxian, Shanxi · finished 1056' 940):enable='lt(t,8)',$(big 'ALMOST NO NAILS' 80 120 0xF2B134 96):enable='gt(t,9.2)'" seg/01.mp4
# B 12.9-19.0: sway animation, "a quake that lasted seven days"
ffmpeg -y -loglevel error -ss 1.0 -t 6.1 -i $P/diagrams/sway.mp4 -vf "$(lower '“a large earthquake lasting for seven days” — China Daily, 2025' 940):enable='gt(t,0.8)'" $V seg/02.mp4
# C 19.0-31.0: 1926 shells, b/w dougong close-up
kb "$DG" 12.0 0.0007 0.45 ",hue=s=0.15,eq=contrast=1.15:brightness=-0.05,vignette=PI/4,$(big '1926' 80 120 white 120),$(big '200+ SHELLS' 80 250 0xE8513A 96),$(lower 'it caught fire · it burned out · it stayed up' 940):enable='gt(t,7.2)'" seg/03.mp4
# D 31.0-37.3: colour returns, Guinness card
kb "$PAN" 6.3 0.0006 0.6 ",$(big 'TALLEST WOODEN PAGODA ON EARTH' 80 120 0xF2B134 64),$(lower 'Guinness World Records · certified September 2016' 940)" seg/04.mp4
# E 37.3-43.1: map zoom
ffmpeg -y -loglevel error -ss 0.6 -t 5.8 -i $P/diagrams/map.mp4 $V seg/05.mp4
# F 43.1-47.4: the question, over the section still
ffmpeg -y -loglevel error -loop 1 -t 4.3 -i $P/diagrams/section_still.png -vf "scale=1920:1080,drawtext=fontfile=$F:text='HOW?':fontcolor=0xE8513A:fontsize=150:x=80:y=890:box=1:boxcolor=0x15110d@0.9:boxborderw=24" $V seg/06.mp4
# G 47.4-52.6: dougong build-up, "a joint designed to slip"
ffmpeg -y -loglevel error -ss 0.6 -t 5.2 -i $P/diagrams/dougong.mp4 -vf "$(lower '1 · a joint designed to slip' 940):enable='gt(t,2.5)'" $V seg/07.mp4
# H 52.6-56.9: section, column rings → "a tower inside a tower"
ffmpeg -y -loglevel error -ss 4.9 -t 4.3 -i $P/diagrams/section.mp4 -vf "$(lower '2 · a tower inside a tower' 940):enable='gt(t,1.2)'" $V seg/08.mp4
# I 56.9-61.2: hidden floors
ffmpeg -y -loglevel error -ss 2.6 -t 4.3 -i $P/diagrams/section.mp4 -vf "$(lower '3 · four floors visitors never see' 940):enable='gt(t,0.3)'" $V seg/09.mp4
# J 61.2-65.5: brand card over the tower
kb "$S01" 4.3 -0.0005 0.85 ",$(big 'CHINA TRAVEL EXPERT' 80 120 white 72),$(lower 'Let’s take it apart.' 940)" seg/10.mp4
for i in 01 02 03 04 05 06 07 08 09 10; do echo "file '$i.mp4'"; done > seg/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i seg/list.txt -c copy seg/video.mp4
# audio: VO + bed (-18 dB), fade out
ffmpeg -y -loglevel error -i seg/video.mp4 -i vo-60s.mp3 -i /home/user/Claude-code/automation/youtube/assets/music/el-docu-underscore-04.mp3 \
  -filter_complex "[2:a]volume=0.12,afade=t=out:st=61:d=4[m];[1:a]volume=1.4[v];[v][m]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -shortest sample-60s.mp4
ffprobe -v error -show_entries format=duration:stream=width,height,codec_name -of default=nw=1 sample-60s.mp4
