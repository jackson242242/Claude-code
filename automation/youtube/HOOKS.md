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
## 📊 实测排行（2026-10-15，近 30 天、满 3 天的 81 条；baseline 中位数 106 播放）

| 钩子类型 | 讨论型? | 条数 | 均播放 | 相对基准 | 点赞率 | 评论 | 评/千播 |
|---|---|---|---|---|---|---|---|
| STAKES | ✅ | 3 | 478 | ×4.51 | 0.35% | 0 | 0 |
| PRICE-SHOCK | ✅ | 15 | 275 | ×2.59 | 0.41% | 0 | 0 |
| SPECTACLE-FACT | ❌ 数字锚而已 | 29 | 249 | ×2.35 | 0.53% | 1 | 0.14 |
| DEBATE | ✅ | 6 | 210 | ×1.98 | 0.55% | 0 | 0 |
| CHOICE | ✅ | 8 | 168 | ×1.59 | 1.56% | 0 | 0 |
| PLAIN-FACT | ❌ 数字锚而已 | 18 | 128 | ×1.21 | 0.26% | 0 | 0 |
| MISCONCEPTION | ✅ | 2 ⚠️样本不足 | 34 | ×0.32 | 1.49% | 0 | 0 |

**今日三槽依次用（a / c / d）**：STAKES / PRICE-SHOCK / DEBATE
**已验证（≥3 条且 ≥×1.0）**：STAKES / PRICE-SHOCK / DEBATE / CHOICE
**补样本（<3 条，必须排进去才学得到）**：INSIDER(0) / MISCONCEPTION(2)
**避免**：SPECTACLE-FACT / PLAIN-FACT 永远不是钩子类型（数字只能放进讨论型钩子里）
**非讨论型配额**：近 7 天已用 8/3（每天 ≤1，仅限 slot d 路线超级数字，且收尾仍须 either-or）；讨论型 10/18 — **超额，本周剩余全部讨论型**

## 📒 近期逐条账本（新→旧）

| 日期 | 播放 | ×基准 | 赞 | 评 | 类型 | 钩子原文 |
|---|---|---|---|---|---|---|
| 2026-10-14d | 456 | ×4.30 | 0 | 0 | DEBATE | A Li River cruise packs up to 200 people on one boat. Skip it. I |
| 2026-10-14c | 28 | ×0.26 | 0 | 0 | PLAIN-FACT | Nine in ten payments in China happen by phone, not card. I'm you |
| 2026-10-14a | 30 | ×0.28 | 0 | 0 | PRICE-SHOCK | Antelope Canyon: a guided tour, about $100. I'm your China Trave |
| 2026-10-13d | 20 | ×0.19 | 0 | 0 | SPECTACLE-FACT | China's longest border road runs 9,200 km. {\fs13}I'm your China |
| 2026-10-13c | 87 | ×0.82 | 1 | 0 | SPECTACLE-FACT | Climbing Mount Tai means 6,600 steps — in the dark. {\fs13}I'm y |
| 2026-10-13a | 86 | ×0.81 | 1 | 0 | MISCONCEPTION | Everyone thinks this Buddha survived by luck. {\fs13}I'm your Ch |
| 2026-10-12d | 6 | ×0.06 | 0 | 0 | PLAIN-FACT | Two ways into Tibet, and they're nothing alike. I'm your China T |
| 2026-10-12c | 20 | ×0.19 | 1 | 0 | MISCONCEPTION | You think China's famous old towns are Pingyao and Lijiang. I'm  |
| 2026-10-12a | 60 | ×0.57 | 0 | 0 | PLAIN-FACT | Book "Zhangjiajie" wrong and you'll miss the Avatar pillars. I'm |
| 2026-10-11d | 13 | ×0.12 | 0 | 0 | CHOICE | Would you drive 446 km of desert with no town, no water? I'm you |
| 2026-10-11c | 15 | ×0.14 | 0 | 0 | PLAIN-FACT | China's sold-out bullet trains still sell a ticket — to stand. I |
| 2026-10-11a | 1 | ×0.01 | 0 | 0 | PRICE-SHOCK | Switzerland's famous peak train: about $300. I'm your China Trav |
| 2026-10-10d | 13 | ×0.12 | 0 | 0 | CHOICE | Would you drive a bridge hanging 330 metres over a canyon? |
| 2026-10-10c | 45 | ×0.42 | 0 | 0 | PLAIN-FACT | Shanghai's prettiest water town is free — one metro ride away. |
| 2026-10-10a | 18 | ×0.17 | 0 | 0 | SPECTACLE-FACT | These colors look edited — they're 24 million years old. |
| 2026-10-08d | 6 | ×0.06 | 0 | 0 | CHOICE | East for a 3 AM sunrise, or north for the aurora? |
| 2026-10-08c | 31 | ×0.29 | 0 | 0 | DEBATE | Skip Dali's old town. Locals ride the lake — 130 km. |
| 2026-10-08a | 43 | ×0.41 | 0 | 0 | PRICE-SHOCK | China's ¥20 note shows a fisherman who quit in 2008. |
| 2026-10-07d | 94 | ×0.89 | 1 | 0 | CHOICE | 492 painted caves by day, or desert stars by night? |
| 2026-10-07c | 15 | ×0.14 | 0 | 0 | PLAIN-FACT | Fly to China's top park — and get turned away at the gate. |
| 2026-10-07a | 101 | ×0.95 | 0 | 0 | PRICE-SHOCK | Zhangjiajie: $33. Yosemite: $35. Almost the same. |
| 2026-10-06d | 85 | ×0.80 | 0 | 0 | CHOICE | 99 bends to Heaven's Gate, or 24 wartime switchbacks — which wou |
| 2026-10-06c | 41 | ×0.39 | 0 | 0 | PRICE-SHOCK | A Venice gondola is $97 for 30 minutes. Yangshuo's bamboo raft?  |
| 2026-10-06a | 78 | ×0.74 | 0 | 0 | SPECTACLE-FACT | Miss Huangshan's last cable car and it's 10,000 steps down — in  |
| 2026-10-05d | 90 | ×0.85 | 1 | 0 | SPECTACLE-FACT | Everyone drives the Qinghai-Gansu loop in 7 days. Too fast. I'm  |
| 2026-10-05c | 83 | ×0.78 | 0 | 0 | PRICE-SHOCK | Lijiang charges ¥50 to enter its old town. Dali's is free. I'm y |
| 2026-10-05a | 67 | ×0.63 | 0 | 0 | SPECTACLE-FACT | 41,000 tickets a day — and it still sells out by morning. I'm yo |
| 2026-10-04d | 106 | ×1.00 | 0 | 0 | PLAIN-FACT | Rush China's highest highway and it'll put you on oxygen. I'm yo |
| 2026-10-04c | 211 | ×1.99 | 2 | 0 | DEBATE | Skip Wuzhen's 190-yuan ticket. I'm your China Travel Expert. |
| 2026-10-04a | 79 | ×0.75 | 0 | 0 | PRICE-SHOCK | The Great Wall costs about $20 to visit yourself. I'm your China |
| 2026-10-03d | 239 | ×2.25 | 1 | 0 | DEBATE | Everyone books the Yunnan package tour. Skip it. I'm your China  |
| 2026-10-03c | 54 | ×0.51 | 0 | 0 | PLAIN-FACT | Petra costs seventy dollars. The Great Wall? Six. I'm your China |
| 2026-10-03a | 90 | ×0.85 | 0 | 0 | SPECTACLE-FACT | Travel 2,000 km for the Rainbow Mountains — and see grey? I'm yo |
| 2026-10-02d | 485 | ×4.58 | 5 | 0 | SPECTACLE-FACT | 99 hairpin bends in 11 kilometers. I'm your China Travel Expert. |
| 2026-10-02c | 47 | ×0.44 | 0 | 0 | MISCONCEPTION | You think Jiuzhaigou's lakes are Photoshopped. I'm your China Tr |
| 2026-10-02a | 125 | ×1.18 | 1 | 0 | CHOICE | Guilin or Zhangjiajie for your first China trip? I'm your China  |
| 2026-10-01d | 171 | ×1.61 | 0 | 0 | DEBATE | Everyone drives the G318 to Tibet. Skip it. I'm your China Trave |
| 2026-10-01c | 66 | ×0.62 | 0 | 0 | SPECTACLE-FACT | Bolivia's sky mirror costs a 60-to-80-dollar tour. I'm your Chin |
| 2026-10-01a | 61 | ×0.58 | 0 | 0 | SPECTACLE-FACT | Huangshan is in cloud 200 days a year. I'm your China Travel Exp |
| 2026-09-30d | 60 | ×0.57 | 0 | 0 | PLAIN-FACT | I'm your China Travel Expert. |
<!-- AUTO:END -->
