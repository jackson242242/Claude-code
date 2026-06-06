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

  "clips": [                                                 // 按顺序硬切；总时长=各 dur 之和（目标 35–45s）
    { "src": "kimetsu/assets/2026-06-06/c1.mp4", "in": 2.0, "dur": 4.5 },
    { "src": "kimetsu/assets/2026-06-06/c2.mp4", "in": 0,   "dur": 5.0 }
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

## 约束与行为
- `clips` 至少 1 段；每段需 `src`（文件须存在）+ 正的 `dur`。
- 总时长落在 30–50s 外会**警告但仍渲染**（甜区 35–45s，见 PLAYBOOK §5）。
- 有 `texts` 但无可用字体时用系统 CJK 兜底；字幕带黑色描边以保证可读（手作感）。
- 缺音频会**警告并出静音片**（歌是这套混剪的灵魂，正常都应配乐）。
- 找不到 clip/音频/字体会**清晰报错并退出**，告诉你缺什么——不静默失败。
