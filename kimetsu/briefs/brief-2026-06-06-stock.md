# 成片 Brief — 2026-06-06 (stock / 合法素材样片)

> 对标频道：**@TheDragonHashira**（鬼灭/柱主题 AMV 式 Shorts）——仅作**风格对标**，不发布到该频道。
> 本片走**免版税/CC 可商用素材**路线（老板选定），发布目的地＝**你自己的频道**（暂不发，先出片+文案）。

## ⚠️ 诚实前置
- 免版税库（Pexels 等）多为**实拍/摄影**素材 → 本片是**氛围 motivational edit**，**不是动画 edit**。
  想要"真·动画观感"且合法 → 走 **AI 原创**（`generate-broll.mjs`，需 `OPENAI_API_KEY`）。
- 因此**不要把本片标成 "Demon Slayer 片段"**（会误导 + 名不副实）。定位为"原创氛围/燃向 anime-style edit"。

## 选题 & 情绪
- **主题**：恐惧 → 点燃 → 暴雨 → 独行 → 破晓 → 平静（"带着怕前行"的勇气弧）。
- **为什么**：对标频道的"柱/燃"情绪，但用**普世意象**（雪/火/雷/雾/曙光/水）承载，零版权、跨文化。

## 听歌情绪曲线 → 叙事结构（≈39.5s，9:16）
| 段 | 时间 | 画面（stock 意象） | 情绪/故事 |
|----|------|------------------|-----------|
| intro | 0–7 | 夜雪 | 恐惧、孤独（冷开场） |
| 起 | 7–14 | 余烬/火星 | "点燃自己"——决心的火苗 |
| 推进 | 14–21 | 夜空闪电 | 外部压力/雷，不退 |
| 转 | 21–28 | 雾中独行剪影 | 一个人往前走 |
| 副歌 | 28–35 | 山间金色破晓 | 释放、希望 |
| 收尾 | 35–39.5 | 黎明水面 | 平静、回味 |

## 分镜 / EDL
见 `manifest-2026-06-06-stock.json`（6 段 ×7s + 0.5s 交叉淡入淡出 + 自动封面）。
图文字幕（双语，内心独白）：怕过→点燃自己→雷里没退→一个人往前→天亮了→勇敢是带着怕前行。

## 素材清单（合法）
- **视频**：`stock-2026-06-06.json` 的 6 条 Pexels 查询（雪/余烬/闪电/雾中剪影/破晓/水面）。
  取素材：`node scripts/fetch-stock.mjs --queries kimetsu/briefs/stock-2026-06-06.json --outdir kimetsu/assets/2026-06-06`
  （需 `PEXELS_API_KEY` + 放行 api.pexels.com 及 Pexels CDN；Pexels 许可：免费可商用、免署名）。
- **音乐**：用**可商用**曲（Pixabay Music / YouTube Audio Library / CapCut 商用授权），存到
  `kimetsu/assets/2026-06-06/tone.m4a`（当前是占位正弦音，**务必替换**）。选"暗→燃→释放"情绪曲线的曲。
- **字体**：可选放手写体到 `kimetsu/assets/fonts/`，否则系统中文字体兜底。

## SEO / GEO（按平台）
- **YouTube Shorts**：Title `He set his heart ablaze 🔥 | anime-style edit #shorts`；Tags `anime,edit,amv,shorts,motivation,courage,aesthetic`；Desc 写情绪文案 + "original atmospheric edit, royalty-free footage (Pexels), music: <曲名/来源>"。
- **TikTok**：`#anime #edit #amv #motivation #fyp #aesthetic`；hook 文案="他怕过，可他点燃了自己。"
- **小红书**：标题"燃向｜带着怕前行的人最帅"；标签 `#燃向剪辑 #anime #治愈 #motivation`；避违禁词。
- **诚实**：不标 "Demon Slayer 原片"。可写 "anime-style / inspired mood"。

## 粗糙感设计（年轻梵高）
1. 手写体字幕（放一个手写 ttf）。2. 不追求踩满拍，留 1–2 处"呼吸"。3. 末句口语化、第一人称真诚。

## 改脚本 / 替换素材
- 任一 Pexels 查询取不到理想镜头 → 换近义词（如 "embers" → "sparks fire dark"）。
- 想更"燃" → 把 transition 去掉走硬切，或副歌段缩短单段 dur 提速。

## 发布前合规检查单
- [x] 画面＝免版税可商用（Pexels）/ 占位待替换 — 替换后即合规
- [ ] 音乐＝可商用（**当前占位音，必须替换**）
- [x] 无鬼灭原片、无血腥/政治/敏感、无真人八卦
- [x] 文案不误导（不谎称 Demon Slayer 片段）
- [x] 三平台标签各自合规
- [ ] 字幕无错别字 / 保留手作感
