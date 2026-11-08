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
6. **同龄才比、样本够才下结论、POV 句式只给第一人称画面（2026-10-17，POV 8 周计划）**：
   - 钩子只在**同龄**比（48h / 72h ±6h，看 postmortem 的 EQUAL-AGE 段），同时对比两条基线：
     近 28 天同龄中位、固定的 09-15..09-30 同龄中位（后者要 Analytics API 开通才算得出，
     没开就注明"仅一条基线"）。postmortem 标了 LOW-REACH DAY（外部对照组信号）的样本不算。
   - **n≥6 条干净样本之前，任何类型都不叫"已验证"，也不叫"避免"。** 下方 AUTO 区
     "已验证（≥3 条）""避免"的标签在 hook-ledger.mjs 改代码前只作参考。
     例：现在"MISCONCEPTION 偏弱"只有 n=3，**没有被证明**。
   - **"POV:" 和 "Would you…?" 句式只用于 F1/F2**（第一人称画面）。账本里配航拍/风景
     库存的这类标题只拿到个位数到二十几播放。F3/F4 改用 "X or Y — which?" 形式。
7. **人称、地名、数字的诚实（2026-10-17）**：
   - "I / my / we" 只用在老板自己拍的素材（F1）上；库存/授权素材只用 "you"。
     固定品牌句 "I'm your China Travel Expert" 不算亲身经历，保留。
   - 地名只说在素材 slug / Commons 文件名点了名的片段上（pov-library 的 `placeSpeakable`）；
     px-39312225 只能说 "Great Wall"，不说哪一段。
   - 速度、台阶数、距离、路线等数字，只有来源覆盖到**这个片段或这个地点**才写；否则不写。

## 古建筑版例句（2026-10-19 起全部槽位都是古建筑；数字发布当次重核，来源见 plans/architecture-facts.md）
（以下全部取自 queue 里已核验的 `arch-*` 选题和价格研究；新写法照这个句型，数字一律当次重核。）
- DEBATE："Forbidden City's 9,999 rooms? Surveys count 8,886. What counts?"（arch-01）/
  "Real or rebuilt? Is this pagoda still 'ancient'? Tell me I'm wrong."（格式建议 R6，年份当次核）
- STAKES："No same-day tickets: Forbidden City releases them 7 days ahead, 20:00."（arch-02）
- PRICE-SHOCK（F3）："Versailles: €35. The Forbidden City: ¥60 — under €8."（arch-06）/
  诚实反差也做："Rome's Colosseum: $20. Xi'an's Terracotta Army: $18. Same price — which?"（价格研究 07）
- CHOICE（F4 写成 "X or Y — which?"，不用 "Would you…?"）："Walking Dubrovnik's walls: $45.
  Xi'an's 13.7 km Ming wall: $8. Which wall?"（价格研究 05，仅夏季价）
- INSIDER（还缺样本）："Count the roof beasts: only one building in China has 10."（arch-04）
- MISCONCEPTION（偏弱，少用）："The Forbidden City opened in 1420. Its biggest hall? Built 1695."（arch-05）

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
  一周内两条 1.1M + 0.7M 播放，见 state/competitors.md）**——2026-10-19 起 "Would you…?"
  只配 F1/F2 第一人称画面（铁律 6）；F4 把同样的选择写成 "X or Y — which?"：
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
- INSIDER 的样本从 F1 的 R-07 来（owner-recuts.json）。
### G. POV 第一人称（2026-10-17；只用于 F1/F2，[verify] = 发布当次双源核实后才填，填不了就删掉那半句）
- F1（老板素材重剪，钩子见 plans/owner-recuts.json）：
  "Stairs or SLIDE down the Great Wall?"（R-01；票价两源核实后可改成
  "Would you pay ¥[verify] to slide down the Great Wall?"）/
  "Forbidden City sold out? Tickets drop 7 days ahead — here's Plan B on foot"（R-02）/
  "5 am city or 6:30 am mountains — which do you wake up to?"（R-04；时间只取自文件元数据）
- F2（授权 POV，只用 `placeSpeakable`）：
  "POV: Hong Kong's double-decker tram — HK$[verify] for this view. Would you ride it?"（**只在 cityScope = approved 时用**——城市 POV 未获批前 F2 只用非城市片段；香港只做旅游）/
  "Window seat on a D-train: misty hills, small villages. Train or plane?"（**只配 wm-c02**：
  画面就是雾山和村庄；wm-c01 是城市和工地，不配这句；不写时速）/
  "POV: temple steps in Dali's old town. Keep climbing or turn back?"（不写台阶数）
- F3（价格卡）："Mutianyu toboggan: ¥[verify]. A US alpine coaster: $[verify]. Which would you ride?"
  （**不配老板的慕田峪镜头**：那些镜头 10-22 发 R-01，与它成对的 R-08 永远不能再发，
  任何老板镜头 8 周内也不能复用。只能配 slug 写明 Mutianyu 的 Pexels 片段（10-17 为 0 条）
  或 MAP-FORMAT；都没有就不做这条）
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
## 📊 实测排行（2026-11-08，近 30 天、满 3 天的 79 条；baseline 中位数 34 播放）

| 钩子类型 | 讨论型? | 条数 | 均播放 | 相对基准 | 点赞率 | 评论 | 评/千播 |
|---|---|---|---|---|---|---|---|
| DEBATE | ✅ | 3 | 231 | ×6.78 | 0.29% | 0 | 0 |
| PRICE-SHOCK | ✅ | 16 | 176 | ×5.17 | 0.32% | 1 | 0.36 |
| CHOICE | ✅ | 7 | 161 | ×4.74 | 0.27% | 0 | 0 |
| SPECTACLE-FACT | ❌ 数字锚而已 | 27 | 136 | ×4 | 0.41% | 0 | 0 |
| PLAIN-FACT | ❌ 数字锚而已 | 23 | 124 | ×3.65 | 0.49% | 0 | 0 |
| STAKES | ✅ | 1 ⚠️样本不足 | 113 | ×3.32 | 1.77% | 0 | 0 |
| MISCONCEPTION | ✅ | 2 ⚠️样本不足 | 55 | ×1.62 | 1.82% | 0 | 0 |

**今日三槽依次用（a / c / d）**：DEBATE / PRICE-SHOCK / CHOICE
**已验证（≥3 条且 ≥×1.0）**：DEBATE / PRICE-SHOCK / CHOICE
**补样本（<3 条，必须排进去才学得到）**：INSIDER(0) / STAKES(1) / MISCONCEPTION(2)
**避免**：SPECTACLE-FACT / PLAIN-FACT 永远不是钩子类型（数字只能放进讨论型钩子里）
**非讨论型配额**：近 7 天已用 18/3（每天 ≤1，仅限 slot d 路线超级数字，且收尾仍须 either-or）；讨论型 6/24 — **超额，本周剩余全部讨论型**

## 📒 近期逐条账本（新→旧）

| 日期 | 播放 | ×基准 | 赞 | 评 | 类型 | 钩子原文 |
|---|---|---|---|---|---|---|
| 2026-11-07d | 46 | ×1.35 | 0 | 0 | SPECTACLE-FACT | POV: you're walking Xi'an — capital to 13 dynasties. {\fs13}I'm  |
| 2026-11-07c | 3 | ×0.09 | 0 | 0 | SPECTACLE-FACT | No nails. No glue. These brackets held Chinese roofs up for 1,00 |
| 2026-11-07b | 11 | ×0.32 | 0 | 0 | PLAIN-FACT | No country eats pork like China. {\fs13}I'm your China Travel Ex |
| 2026-11-07a | 918 | ×27.00 | 3 | 0 | PRICE-SHOCK | Versailles Passport this winter: about $28. {\fs13}I'm your Chin |
| 2026-11-06b | 166 | ×4.88 | 1 | 0 | SPECTACLE-FACT | The world eats 120 billion instant-noodle servings a year. {\fs1 |
| 2026-11-06d | 5 | ×0.15 | 1 | 0 | PLAIN-FACT | Sticky-rice soup in the mortar? Real - but no miracle. {\fs13}I' |
| 2026-11-06c | 9 | ×0.26 | 1 | 0 | SPECTACLE-FACT | The world's tallest wooden pagoda is nearly 970 years old. {\fs1 |
| 2026-11-06a | 7 | ×0.21 | 1 | 0 | SPECTACLE-FACT | The Forbidden City opened in 1420. Its biggest hall? 1697. {\fs1 |
| 2026-11-05d | 3 | ×0.09 | 1 | 0 | PRICE-SHOCK | Machu Picchu costs about $40. The Great Wall? About $6. {\fs13}I |
| 2026-11-05c | 11 | ×0.32 | 1 | 0 | SPECTACLE-FACT | Xi'an beats Beijing for first-timers: 13 dynasties. {\fs13}I'm y |
| 2026-11-05b | 2 | ×0.06 | 1 | 0 | SPECTACLE-FACT | 45,000 McDonald's worldwide. Around 500,000 hotpot spots in Chin |
| 2026-11-05a | 3 | ×0.09 | 1 | 0 | CHOICE | First China stop: Shanghai or Guangzhou? |
| 2026-11-04d | 9 | ×0.26 | 0 | 0 | SPECTACLE-FACT | 24 drums once kept Beijing's time - one survives. {\fs13}I'm you |
| 2026-11-04c | 6 | ×0.18 | 0 | 0 | PRICE-SHOCK | Potala Palace: ~$14 this winter. Alhambra: ~$24. {\fs13}I'm your |
| 2026-11-04a | 6 | ×0.18 | 0 | 0 | SPECTACLE-FACT | Built in 961, and it leans 2.3 metres. {\fs13}I'm your China Tra |
| 2026-11-03d | 11 | ×0.32 | 0 | 0 | PLAIN-FACT | Most of the Great Wall isn't brick. {\fs13}I'm your China Travel |
| 2026-11-03c | 13 | ×0.38 | 0 | 0 | SPECTACLE-FACT | A Nepali architect built Beijing's White Stupa in 1279. {\fs13}I |
| 2026-11-03a | 10 | ×0.29 | 0 | 0 | CHOICE | 51,000 carvings, or more than 100,000? {\fs13}I'm your China Tra |
| 2026-11-02d | 5 | ×0.15 | 0 | 0 | SPECTACLE-FACT | 9,999 rooms? Every survey counts fewer. {\fs13}I'm your China Tr |
| 2026-11-02c | 2 | ×0.06 | 1 | 0 | SPECTACLE-FACT | 63 tonnes of Ming bronze - silent for 66 years. {\fs13}I'm your  |
| 2026-11-02a | 8 | ×0.24 | 0 | 0 | SPECTACLE-FACT | Count the roof beasts. Only one hall in China has all 10. {\fs13 |
| 2026-11-01d | 7 | ×0.21 | 0 | 0 | SPECTACLE-FACT | Temple of Heaven's park opens at 6:30 - the halls wait till 8. { |
| 2026-11-01c | 20 | ×0.59 | 0 | 0 | PRICE-SHOCK | Vatican Museums: €25 online. The Forbidden City today: ¥40. {\fs |
| 2026-11-01a | 2 | ×0.06 | 0 | 0 | SPECTACLE-FACT | Xi'an's Ming wall loops 13.74 km. {\fs13}I'm your China Travel E |
| 2026-10-31d | 5 | ×0.15 | 0 | 0 | SPECTACLE-FACT | Sticky-rice soup holds up this 600-year-old wall {\fs12}I'm your |
| 2026-10-31c | 2 | ×0.06 | 0 | 0 | PLAIN-FACT | This whole village is shaped like an ox {\fs12}I'm your China Tr |
| 2026-10-31a | 15 | ×0.44 | 0 | 0 | SPECTACLE-FACT | POV: a park nearly 4x the Forbidden City {\fs12}I'm your China T |
| 2026-10-30d | 5 | ×0.15 | 0 | 0 | PLAIN-FACT | Picture an apartment block made entirely of earth. |
| 2026-10-30c | 7 | ×0.21 | 0 | 0 | PLAIN-FACT | The Forbidden City only lets you walk one way. |
| 2026-10-30a | 7 | ×0.21 | 0 | 0 | PLAIN-FACT | When modern Beijing floods, this palace drains itself. |
| 2026-10-29d | 47 | ×1.38 | 1 | 0 | SPECTACLE-FACT | In 1582, they moved this whole tower 1,000 metres. {\fs13}I'm yo |
| 2026-10-29c | 25 | ×0.74 | 0 | 0 | SPECTACLE-FACT | Forbidden City Sold Out? Your Plan B Is a 700-Year-Old Beijing W |
| 2026-10-29a | 70 | ×2.06 | 2 | 0 | SPECTACLE-FACT | Two Chinese cliffs. 150,000 carved Buddhas between them. {\fs13} |
| 2026-10-28d | 5 | ×0.15 | 0 | 0 | PRICE-SHOCK | Tower of London: £37. China's Great Wall: ¥40. {\fs13}I'm your C |
| 2026-10-28c | 30 | ×0.88 | 0 | 0 | PLAIN-FACT | This marble bridge looks ordinary at noon. {\fs13}I'm your China |
| 2026-10-28a | 12 | ×0.35 | 0 | 0 | CHOICE | Bike it or walk it — Xi'an's 13.7 km Ming wall? {\fs13}I'm your  |
| 2026-10-27d | 8 | ×0.24 | 0 | 0 | PLAIN-FACT | Forbidden City tickets? None sold on the day. {\fs13}I'm your Ch |
| 2026-10-27c | 51 | ×1.50 | 0 | 0 | PRICE-SHOCK | London's St Paul's: about $35 to walk in. {\fs13}I'm your China  |
| 2026-10-27a | 10 | ×0.29 | 0 | 0 | CHOICE | Packed earth or concrete — which wall lasts 600 years? |
| 2026-10-26d | 17 | ×0.50 | 1 | 0 | SPECTACLE-FACT | POV: you're inside Nanjing's Chaotian Palace — 600 years old, an |
<!-- AUTO:END -->
