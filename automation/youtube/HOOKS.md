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
- 山野版："Skip Wuzhen's ¥190 ticket — this water town is free to enter." /
  "China's biggest Miao village: 1,000 stilt houses for ¥90 — real, or a theme park? Tell me I'm wrong."
### B. CHOICE 二选一（逼站队，回复成本最低）
- "$240 train or $28 raft — which trip are you booking?"
- "Street food stall or hotel breakfast in China? Pick one."
- **山野版（2026-09-26 竞品实测：同一句 "Would you walk this mountain path for free?"
  一周内两条 1.1M + 0.7M 播放，见 state/competitors.md）**：
  "Would you walk this path for $30? 3,000 stone pillars, one ticket." /
  "99 hairpin bends or the world's longest cable car — which way up Tianmen?" /
  "Guilin or Zhangjiajie for your first China trip? Pick one."
### C. MISCONCEPTION 认知推翻（"我一直以为…"）
- "Everyone thinks you need cash in China. You need neither cash nor a card."
- "You don't need a visa for <N> days. Most travellers still book one."
- 山野版："Everyone thinks China's parks are cheap. Zhangjiajie costs the same as Yosemite." /
  "This 'forest' is a 270-million-year-old sea floor."
### D. STAKES 利害（会痛，所以会问）
- "This one mistake voids your visa-free entry."
- "Book the wrong train seat and you stand for 5 hours."
### E. PRICE-SHOCK 价格反差（引发"真的假的/我那边不是这样"）
- "Switzerland's famous train: $290. Same view in China: $25."
- 山野版："Antelope Canyon: a $90 tour. China's rainbow hills: $10 at the gate." /
  "Bolivia's salt flat: a $150 tour. China's mirror of the sky: ¥60 and a bullet train."
- 实测注意（n=7，×0.82）：**小差价没人回**（$27 vs $7 打车 ×0.52）；要 ≥4 倍、且是观众
  自己付过的东西（按摩 $25 vs $120 ×4.11）。
### F. INSIDER 内行信息（引发"还有哪里？"）
- "Locals never queue here — they enter from the north gate."
### ❌ PLAIN-FACT / SPECTACLE-FACT 纯知识卡（不是钩子类型）
- "苏绣一根丝线劈成 48 股" —— 无可回复点。要用必须改写成 A-F 之一：
  "Machine embroidery costs 1/50 of this. Can you tell them apart?"
- **2026-09-26 复盘（owner："hook 做得不足"）**：09-20 建库后 6 天，22 条里 16 条仍是
  SPECTACLE-FACT/PLAIN-FACT（数字 + 无争论点），讨论型每类只攒到 1-2 条样本，
  等于没学到东西。根因：旧排行榜把"播放高于中位数"的数字卡也列进"下一条用"。
  已改：脚本只推荐讨论型；`今日三槽依次用` 是**指派**不是菜单；样本 <3 的类型必须排进去
  补样本；非讨论型每天 ≤1（只限 slot d 路线超级数字）、每周 ≤3，AUTO 区打印配额。
- 数字卡唯一合法用法：做 A-F 钩子里的**锚**（"3,000 pillars" 放进 "Would you walk…"）。

## 收尾必须承接钩子
钩子提出的争论，最后一条字幕要把话筒递出去（either-or 提问 / "tell me I'm wrong"），
并由 `scripts/youtube-comment.mjs` 把同一个问题发成第一条评论。

## 每条视频上传后写入账本
run 自动执行；若某条钩子是**新写法**（不属 A-F），在 RUNLOG 标 `HOOK-NEW:<描述>`，
连续 3 条同写法 ×基准 ≥1.3 则由人（我）在本文件模板库新增一类。


<!-- AUTO:BEGIN — rewritten by scripts/hook-ledger.mjs, do not hand-edit below -->
## 📊 实测排行（2026-10-01，近 30 天、满 3 天的 84 条；baseline 中位数 243 播放）

| 钩子类型 | 讨论型? | 条数 | 均播放 | 相对基准 | 点赞率 | 评论 | 评/千播 |
|---|---|---|---|---|---|---|---|
| INSIDER | ✅ | 1 ⚠️样本不足 | 962 | ×3.96 | 0.62% | 0 | 0 |
| CHOICE | ✅ | 2 ⚠️样本不足 | 462 | ×1.9 | 1.95% | 0 | 0 |
| SPECTACLE-FACT | ❌ 数字锚而已 | 36 | 408 | ×1.68 | 0.74% | 3 | 0.2 |
| STAKES | ✅ | 4 | 403 | ×1.66 | 0.5% | 0 | 0 |
| PRICE-SHOCK | ✅ | 10 | 384 | ×1.58 | 0.44% | 0 | 0 |
| DEBATE | ✅ | 3 | 320 | ×1.32 | 0.62% | 0 | 0 |
| PLAIN-FACT | ❌ 数字锚而已 | 27 | 233 | ×0.96 | 0.83% | 0 | 0 |
| MISCONCEPTION | ✅ | 1 ⚠️样本不足 | 114 | ×0.47 | 0% | 0 | 0 |

**今日三槽依次用（a / c / d）**：STAKES / PRICE-SHOCK / DEBATE
**已验证（≥3 条且 ≥×1.0）**：STAKES / PRICE-SHOCK / DEBATE
**补样本（<3 条，必须排进去才学得到）**：MISCONCEPTION(1) / INSIDER(1) / CHOICE(2)
**避免**：SPECTACLE-FACT / PLAIN-FACT 永远不是钩子类型（数字只能放进讨论型钩子里）
**非讨论型配额**：近 7 天已用 12/3（每天 ≤1，仅限 slot d 路线超级数字，且收尾仍须 either-or）；讨论型 9/21 — **超额，本周剩余全部讨论型**

## 📒 近期逐条账本（新→旧）

| 日期 | 播放 | ×基准 | 赞 | 评 | 类型 | 钩子原文 |
|---|---|---|---|---|---|---|
| 2026-09-30d | 22 | ×0.09 | 1 | 0 | PLAIN-FACT | I'm your China Travel Expert. |
| 2026-09-30c | 91 | ×0.37 | 0 | 0 | PLAIN-FACT | I'm your China Travel Expert. |
| 2026-09-30a | 165 | ×0.68 | 0 | 0 | PLAIN-FACT | I'm your China Travel Expert. |
| 2026-09-29d | 60 | ×0.25 | 0 | 0 | PLAIN-FACT | I'm your China Travel Expert. |
| 2026-09-29c | 146 | ×0.60 | 0 | 0 | PLAIN-FACT | I'm your China Travel Expert. |
| 2026-09-29a | 127 | ×0.52 | 3 | 0 | PLAIN-FACT | I'm your China Travel Expert. |
| 2026-09-28d | 19 | ×0.08 | 0 | 0 | STAKES | You don't need a dozen flights to see China's northwest. I'm you |
| 2026-09-28c | 895 | ×3.68 | 17 | 0 | CHOICE | China's biggest Miao village — real place, or a theme park? I'm  |
| 2026-09-28a | 29 | ×0.12 | 1 | 0 | CHOICE | Would you walk a trail across 3,000 stone pillars? I'm your Chin |
| 2026-09-27d | 465 | ×1.91 | 1 | 0 | STAKES | China to Europe by rail? The wheels don't fit. I'm your China Tr |
| 2026-09-27c | 199 | ×0.82 | 2 | 0 | DEBATE | Skip Wuzhen — ¥150 just to get in. I'm your China Travel Expert. |
| 2026-09-27a | 334 | ×1.37 | 1 | 0 | PRICE-SHOCK | One canyon: $95. One: $13. I'm your China Travel Expert. |
| 2026-09-26d | 267 | ×1.10 | 0 | 0 | PLAIN-FACT | China paved a road across shifting sand. I'm your China Travel E |
| 2026-09-26c | 86 | ×0.35 | 0 | 0 | PLAIN-FACT | Everyone says: bring cash to China. I'm your China Travel Expert |
| 2026-09-26a | 968 | ×3.98 | 3 | 0 | PRICE-SHOCK | One bowl: $3. One: $300. I'm your China Travel Expert. |
| 2026-09-25d | 151 | ×0.62 | 0 | 0 | SPECTACLE-FACT | One desert cave hid 50,000 manuscripts for 900 years. I'm your C |
| 2026-09-25c | 943 | ×3.88 | 5 | 0 | PRICE-SHOCK | A one-hour massage in China: about $25. I'm your China Travel Ex |
| 2026-09-25a | 393 | ×1.62 | 2 | 0 | DEBATE | Skip Badaling — 10 million tourists a year. I'm your China Trave |
| 2026-09-24d | 849 | ×3.49 | 7 | 0 | SPECTACLE-FACT | 561 km of road, open barely 4 months a year. I'm your China Trav |
| 2026-09-24c | 583 | ×2.40 | 2 | 0 | PLAIN-FACT | This fried pork got its own government office. I'm your China Tr |
| 2026-09-24a | 135 | ×0.56 | 0 | 0 | PLAIN-FACT | China's finest green tea is fried by bare hands. I'm your China  |
| 2026-09-23d | 111 | ×0.46 | 3 | 0 | SPECTACLE-FACT | China's biggest lake sits 3,260 metres above the sea. I'm your C |
| 2026-09-23c | 152 | ×0.63 | 1 | 0 | PLAIN-FACT | You can book China's bullet trains with just a passport. I'm you |
| 2026-09-23a | 147 | ×0.60 | 1 | 0 | PRICE-SHOCK | A 10 km taxi ride costs about $27 in New York. I'm your China Tr |
| 2026-09-22d | 435 | ×1.79 | 6 | 0 | SPECTACLE-FACT | China's newest bullet train hit 453 km/h in tests. I'm your Chin |
| 2026-09-22c | 28 | ×0.12 | 0 | 0 | SPECTACLE-FACT | China blocks 10 apps you use every day. I'm your China Travel Ex |
| 2026-09-22a | 106 | ×0.44 | 1 | 0 | SPECTACLE-FACT | China spent 1,700 years faking jade with fire. I'm your China Tr |
| 2026-09-21d | 74 | ×0.30 | 0 | 0 | SPECTACLE-FACT | Three cities, 2,600 km, one bullet-train trip. I'm your China Tr |
| 2026-09-21c | 931 | ×3.83 | 4 | 0 | STAKES | Don't visit China during Golden Week, October 1 to 7. I'm your C |
| 2026-09-21a | 158 | ×0.65 | 0 | 0 | SPECTACLE-FACT | The world's longest dragon dance ran 6,500 meters. I'm your Chin |
| 2026-09-20d | 395 | ×1.63 | 2 | 0 | SPECTACLE-FACT | One road loop: 2,800 km across northwest China. I'm your China T |
| 2026-09-20c | 85 | ×0.35 | 0 | 0 | SPECTACLE-FACT | This beef cut is under 1% of the whole cow. I'm your China Trave |
| 2026-09-20a | 804 | ×3.31 | 3 | 0 | SPECTACLE-FACT | China's bullet train: 6 cents a kilometer. I'm your China Travel |
| 2026-09-19d | 956 | ×3.93 | 2 | 1 | SPECTACLE-FACT | A perfect soup dumpling has exactly 18 folds. I'm your China Tra |
| 2026-09-19c | 365 | ×1.50 | 2 | 0 | PRICE-SHOCK | A full week in China — from $300. I'm your China Travel Expert |
| 2026-09-19a | 124 | ×0.51 | 2 | 0 | SPECTACLE-FACT | Zero nails. Over 1,000 years standing. I'm your China Travel Exp |
| 2026-09-18d | 56 | ×0.23 | 0 | 0 | SPECTACLE-FACT | Suzhou once had over 200 private gardens. I'm your China Travel  |
| 2026-09-18c | 196 | ×0.81 | 1 | 0 | SPECTACLE-FACT | The Great Wall is 21,196 km long. I'm your China Travel Expert |
| 2026-09-18a | 160 | ×0.66 | 1 | 0 | PRICE-SHOCK | Shanghai's river cruise: $17. Locals pay 30 cents. I'm your Chin |
| 2026-09-17d | 115 | ×0.47 | 0 | 0 | SPECTACLE-FACT | In 1990, this Shanghai skyline was farmland. I'm your China Trav |
<!-- AUTO:END -->
