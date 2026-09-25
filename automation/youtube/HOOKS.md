# HOOKS.md — 钩子学习库（owner 2026-09-20 直令：每条用能引发讨论的钩子 → 发完分析 → 沉淀这里 → 下一条先学这里）

> **每天的 run 必须先读本文件再写第 1 条字幕**，收工时跑
> `NODE_USE_ENV_PROXY=1 node scripts/hook-ledger.mjs` 自动更新下半部分实测数据。
> 上半部分（铁律 + 模板库）是人写的，只有拿到新结论才手动改。

## 铁律
1. **第 1 条字幕 = 钩子 = 标题**，三者同一句话，0-3 秒内说完。
2. **必须 discussion-worthy**：观众看完这一句要能"想回一句"。判据三选一——
   **能不同意**（观点）/ **要做选择**（二选一）/ **被推翻认知**（他原本以为的错了）。
   只是"知道了一个事实"= 不合格（我们 274 条 0 评论就是这么来的）。
3. 必须含数字/价格/倍数（HOOK v4 不变）——数字给讨论提供**可争论的锚**。
4. 钩子里的每个数字当次双源核实；不确定就换选题，不许模糊化蒙混。
5. 一条只争一件事。钩子里塞两个论点 = 观众一个都不回。

## 模板库（按讨论强度排序，括号内为实测代号）
### A. DEBATE 观点分裂（最强，必然有人反对）
- "X is the most overrated stop in <city>. Here's where locals go instead."
- "Skip <famous site>. The one 20 minutes away is better and free."
- "<City A> beats <City B> for first-timers — and it's not close."
### B. CHOICE 二选一（逼站队，回复成本最低）
- "$240 train or $28 raft — which trip are you booking?"
- "Street food stall or hotel breakfast in China? Pick one."
### C. MISCONCEPTION 认知推翻（"我一直以为…"）
- "Everyone thinks you need cash in China. You need neither cash nor a card."
- "You don't need a visa for <N> days. Most travellers still book one."
### D. STAKES 利害（会痛，所以会问）
- "This one mistake voids your visa-free entry."
- "Book the wrong train seat and you stand for 5 hours."
### E. PRICE-SHOCK 价格反差（引发"真的假的/我那边不是这样"）
- "Switzerland's famous train: $290. Same view in China: $25."
### F. INSIDER 内行信息（引发"还有哪里？"）
- "Locals never queue here — they enter from the north gate."
### ❌ PLAIN-FACT 纯知识卡（禁止单独使用）
- "苏绣一根丝线劈成 48 股" —— 无可回复点。要用必须改写成 A-F 之一：
  "Machine embroidery costs 1/50 of this. Can you tell them apart?"

## 收尾必须承接钩子
钩子提出的争论，最后一条字幕要把话筒递出去（either-or 提问 / "tell me I'm wrong"），
并由 `scripts/youtube-comment.mjs` 把同一个问题发成第一条评论。

## 每条视频上传后写入账本
run 自动执行；若某条钩子是**新写法**（不属 A-F），在 RUNLOG 标 `HOOK-NEW:<描述>`，
连续 3 条同写法 ×基准 ≥1.3 则由人（我）在本文件模板库新增一类。


<!-- AUTO:BEGIN — rewritten by scripts/hook-ledger.mjs, do not hand-edit below -->
## 📊 实测排行（2026-09-25，近 30 天、满 3 天的 84 条；baseline 中位数 279 播放）

| 钩子类型 | 条数 | 均播放 | 相对基准 | 点赞率 | 评论 |
|---|---|---|---|---|---|
| INSIDER | 1 | 962 | ×3.45 | 0.62% | 0 |
| STAKES | 2 | 560 | ×2.01 | 0.54% | 0 |
| SPECTACLE-FACT | 34 | 405 | ×1.45 | 0.72% | 3 |
| PLAIN-FACT | 39 | 374 | ×1.34 | 0.7% | 2 |
| DEBATE | 1 | 369 | ×1.32 | 0.54% | 0 |
| PRICE-SHOCK | 6 | 241 | ×0.86 | 0.48% | 0 |
| MISCONCEPTION | 1 | 114 | ×0.41 | 0% | 0 |

**下一条用**：STAKES / SPECTACLE-FACT / PLAIN-FACT
**避免**：PLAIN-FACT（无可回复点）

## 📒 近期逐条账本（新→旧）

| 日期 | 播放 | ×基准 | 赞 | 评 | 类型 | 钩子原文 |
|---|---|---|---|---|---|---|
| 2026-09-24d | 198 | ×0.71 | 1 | 0 | SPECTACLE-FACT | 561 km of road, open barely 4 months a year. I'm your China Trav |
| 2026-09-24c | 269 | ×0.96 | 2 | 0 | PLAIN-FACT | This fried pork got its own government office. I'm your China Tr |
| 2026-09-24a | 79 | ×0.28 | 0 | 0 | PLAIN-FACT | China's finest green tea is fried by bare hands. I'm your China  |
| 2026-09-23d | 87 | ×0.31 | 2 | 0 | SPECTACLE-FACT | China's biggest lake sits 3,260 metres above the sea. I'm your C |
| 2026-09-23c | 132 | ×0.47 | 1 | 0 | PLAIN-FACT | You can book China's bullet trains with just a passport. I'm you |
| 2026-09-23a | 135 | ×0.48 | 0 | 0 | PRICE-SHOCK | A 10 km taxi ride costs about $27 in New York. I'm your China Tr |
| 2026-09-22d | 414 | ×1.48 | 6 | 0 | SPECTACLE-FACT | China's newest bullet train hit 453 km/h in tests. I'm your Chin |
| 2026-09-22c | 23 | ×0.08 | 0 | 0 | SPECTACLE-FACT | China blocks 10 apps you use every day. I'm your China Travel Ex |
| 2026-09-22a | 105 | ×0.38 | 1 | 0 | SPECTACLE-FACT | China spent 1,700 years faking jade with fire. I'm your China Tr |
| 2026-09-21d | 73 | ×0.26 | 0 | 0 | SPECTACLE-FACT | Three cities, 2,600 km, one bullet-train trip. I'm your China Tr |
| 2026-09-21c | 924 | ×3.31 | 3 | 0 | STAKES | Don't visit China during Golden Week, October 1 to 7. I'm your C |
| 2026-09-21a | 157 | ×0.56 | 0 | 0 | SPECTACLE-FACT | The world's longest dragon dance ran 6,500 meters. I'm your Chin |
| 2026-09-20d | 396 | ×1.42 | 2 | 0 | SPECTACLE-FACT | One road loop: 2,800 km across northwest China. I'm your China T |
| 2026-09-20c | 85 | ×0.30 | 0 | 0 | SPECTACLE-FACT | This beef cut is under 1% of the whole cow. I'm your China Trave |
| 2026-09-20a | 796 | ×2.85 | 3 | 0 | SPECTACLE-FACT | China's bullet train: 6 cents a kilometer. I'm your China Travel |
| 2026-09-19d | 955 | ×3.42 | 2 | 1 | SPECTACLE-FACT | A perfect soup dumpling has exactly 18 folds. I'm your China Tra |
| 2026-09-19c | 364 | ×1.30 | 2 | 0 | PRICE-SHOCK | A full week in China — from $300. I'm your China Travel Expert |
| 2026-09-19a | 124 | ×0.44 | 2 | 0 | SPECTACLE-FACT | Zero nails. Over 1,000 years standing. I'm your China Travel Exp |
| 2026-09-18d | 56 | ×0.20 | 0 | 0 | SPECTACLE-FACT | Suzhou once had over 200 private gardens. I'm your China Travel  |
| 2026-09-18c | 196 | ×0.70 | 1 | 0 | SPECTACLE-FACT | The Great Wall is 21,196 km long. I'm your China Travel Expert |
| 2026-09-18a | 154 | ×0.55 | 1 | 0 | PRICE-SHOCK | Shanghai's river cruise: $17. Locals pay 30 cents. I'm your Chin |
| 2026-09-17d | 115 | ×0.41 | 0 | 0 | SPECTACLE-FACT | In 1990, this Shanghai skyline was farmland. I'm your China Trav |
| 2026-09-17c | 894 | ×3.20 | 2 | 0 | SPECTACLE-FACT | Only 30% of a cow makes this hotpot. I'm your China Travel Exper |
| 2026-09-17a | 45 | ×0.16 | 0 | 0 | PRICE-SHOCK | One Chinese teapot sold for $2 million. I'm your China Travel Ex |
| 2026-09-16d | 79 | ×0.28 | 0 | 0 | SPECTACLE-FACT | Bike 13.7 km atop a 650-year-old wall. I'm your China Travel Exp |
| 2026-09-16c | 77 | ×0.28 | 0 | 0 | SPECTACLE-FACT | China has canal towns 1,300 years old. I'm your China Travel Exp |
| 2026-09-16a | 74 | ×0.27 | 0 | 0 | SPECTACLE-FACT | One silk thread, split 48 ways. I'm your China Travel Expert |
| 2026-09-15d | 521 | ×1.87 | 2 | 0 | PRICE-SHOCK | The view on China's ¥20 bill is a real place. I'm your China Tra |
| 2026-09-15c | 265 | ×0.95 | 2 | 0 | PRICE-SHOCK | Switzerland's Glacier Express: about $240. I'm your China Travel |
| 2026-09-15a | 465 | ×1.67 | 3 | 0 | SPECTACLE-FACT | China fired plain stone into "jade" — at 1,300°C. I'm your China |
| 2026-09-14d | 135 | ×0.48 | 3 | 0 | PLAIN-FACT | This is the world’s longest man-made river. |
| 2026-09-14c | 208 | ×0.75 | 4 | 0 | PLAIN-FACT | This garden is built to feel endless. |
| 2026-09-14a | 553 | ×1.98 | 4 | 0 | SPECTACLE-FACT | Europe spent 1,000 years trying to copy this. |
| 2026-09-13d | 477 | ×1.71 | 3 | 0 | SPECTACLE-FACT | The world's longest sea crossing runs 55 km. |
| 2026-09-13c | 661 | ×2.37 | 4 | 0 | SPECTACLE-FACT | The world's oldest noodles are 4,000 years old. |
| 2026-09-13a | 353 | ×1.27 | 2 | 0 | SPECTACLE-FACT | One cocoon unwinds into 900 metres of silk thread. |
| 2026-09-12d | 74 | ×0.27 | 0 | 0 | SPECTACLE-FACT | Beijing to Shanghai: 1,318 km in about 4.5 hours. |
| 2026-09-12c | 114 | ×0.41 | 0 | 0 | MISCONCEPTION | Here's how tourists actually pay in China in 2026. |
| 2026-09-12a | 95 | ×0.34 | 0 | 0 | PRICE-SHOCK | This Chinese tea costs $1.2 million a kilo. |
| 2026-09-11d | 969 | ×3.47 | 7 | 1 | SPECTACLE-FACT | China's bullet trains now cover over 50,000 km. |
<!-- AUTO:END -->
