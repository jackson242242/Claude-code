# 渲染 manifest 规格 (manifest.schema.md)

`scripts/render-mashup.mjs` 的输入。它是 **Alex 分镜表/EDL 的机器可读形态**——
Alex 每天除了写人读的 `brief-<date>.md`，还产出一份 `manifest-<date>.json`，引擎据此自动出片。

## 运行
```bash
npm run render -- --manifest kimetsu/briefs/manifest-2026-06-06.json \
  --out kimetsu/briefs/out/2026-06-06.mp4
```
- ffmpeg 来自 `ffmpeg-static` npm 包，**无需系统安装、无需 credential**。
- 引擎做：每段 clip 按 `in/dur` 裁切 → scale-to-cover 9:16 → 硬切拼接（刻意的手作感）→
  libass 烧入图文字幕 → 叠加背景音乐并尾部淡出 → 输出 H.264/AAC、`+faststart` 的 mp4。

## 字段
```jsonc
{
  "output": { "width": 1080, "height": 1920, "fps": 30 },   // 竖屏 9:16，可省（默认即此）

  "fontFile": "kimetsu/assets/fonts/handwritten.ttf",        // 可选；省略则用系统 CJK 字体兜底
  // "fontName": "WenQuanYi Zen Hei",                         // 可选；直接指定已装字体族名

  "audio": {
    "src": "kimetsu/assets/2026-06-06/song.m4a",             // 商用安全/免版税（PLAYBOOK §2）
    "fadeOut": 1.5,                                          // 尾部淡出秒数（默认 1.0）
    "gainDb": -2                                             // 音量增益 dB（可省）
  },

  "voiceover": {                                             // 可选：AI 旁白（scripts/voiceover.mjs, edge-tts, 免key）
    "src": "kimetsu/assets/2026-06-06/vo.mp3",               // 旁白音轨，自动压低音乐(ducking)后混入
    "gainDb": 2, "duckMusicDb": -9                           // 旁白增益 / 音乐被压低的 dB（默认 -9）
  },
  "subtitlesFile": "kimetsu/assets/2026-06-06/vo.vtt",       // 可选：直接烧录 SRT/VTT（如 edge-tts 产出的同步字幕）
                                                             //   有它就用它；否则用下面的 texts。粗体白字黑边、底部居中。

  "transition": { "type": "fade", "duration": 0.6 },         // 可选：全局交叉淡入淡出；省略=硬切（手作默认）
  "cover": { "at": 6 },                                      // 可选：导出 <out>.cover.jpg 缩略图（取该秒的帧）

  "clips": [                                                 // 按顺序拼接；总时长=各 dur 之和（有 transition 则减 (n-1)*duration）
    { "src": "kimetsu/assets/2026-06-06/c1.mp4", "in": 2.0, "dur": 4.5 },   // 视频：in=入点秒，scale-to-cover 9:16
    { "src": "kimetsu/assets/2026-06-06/s1.png", "dur": 5.0, "motion": "in" } // 图片：Ken Burns 运镜让静图活起来
  ],

  "texts": [                                                 // 图文字幕（屏幕文字/内心独白），可空
    {
      "content": "他从没赢过，但他没停过",                      // 支持中文；\n 换行
      "start": 1.0, "dur": 3.0,                              // 出现时间 / 持续秒数
      "size": 64,                                            // 字号（默认 56）
      "color": "white",                                      // white | yellow | black（默认 white）
      "xPct": 0.5, "yPct": 0.72                              // 位置占屏比例（默认居中、偏下 0.72）
    }
  ]
}
```

## 图片素材与运镜（AI 原创路线）
- clip 的 `src` 是图片（png/jpg/webp）时，引擎用 **Ken Burns 运镜**把静图变成有呼吸的镜头。
- `motion`：`in`(缓推，默认) | `out`(缓拉) | `left` | `right` | `none`。
- 图片建议**竖版**（如 1024×1536，`scripts/generate-broll.mjs` 默认就出这个尺寸），中心裁切到 9:16。
- 视频 clip 不吃 `motion`（自带运动）。可图片+视频混用。

## 约束与行为
- `clips` 至少 1 段；每段需 `src`（文件须存在）+ 正的 `dur`。
- 总时长落在 30–50s 外会**警告但仍渲染**（甜区 35–45s，见 PLAYBOOK §5）。
- 有 `texts` 但无可用字体时用系统 CJK 兜底；字幕带黑色描边以保证可读（手作感）。
- 缺音频会**警告并出静音片**（歌是这套混剪的灵魂，正常都应配乐）。
- 找不到 clip/音频/字体会**清晰报错并退出**，告诉你缺什么——不静默失败。
