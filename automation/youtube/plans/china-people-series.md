# 《How Chinese People Really Live》系列 + 每日长视频（owner 2026-11-21）

> owner：每天至少 3 条短视频 + 1 条长视频；提高质量；音乐更多样；要有像真人的配音；
> 内容学别人做的采访中国人，让外国人了解中国人怎么想、怎么生活、品性如何、人与人之间平时做什么。

## 1. 诚实边界：我们不能"假装采访"
我没法上街采访真人。编造受访者、编造他们说的话，等于造假，也违反频道的铁律。所以分两条路：
- **现在就做（A 路）：有来源的"中国人怎么想"讲解。** 每条讲一个生活习惯或观念，依据是公开的调查和统计（国家统计局、Pew、Ipsos、高校研究、主流媒体报道），加上中国社交媒体上公开的普遍说法（转述，不引用个人、不点名）。画面用授权的中国日常生活实拍。旁白明确是讲解，不冒充采访。
- **有了才做（B 路）：真采访。** 只有 owner 或合作者真的拍到采访素材（受访者同意出镜）才发，标 `fmt:F1`。
- **不做**：AI 生成的"路人"假装被采访；用别人频道的采访片段。

## 2. 配音（"像真人的声音"）
- 所有 A 路长视频、以及每天至少 1 条 Short，用 AI 旁白：`scripts/tts-openai.mjs`，声音 marin，指令 "warm, curious storyteller talking to one friend, natural pauses, about 145 words per minute"。
- 文稿写给耳朵听：短句、口语、每段一个具体的人或场景细节，不用清单腔。
- 描述里照常写 "AI narration"。ElevenLabs 还有额度时可用 Rachel。
- 预算：每条长视频约 $0.15-0.2，每天一条约 $5-6/月；`openaiUsdPerMonth` 上调到 8，硬停 10。仍在 owner 定的每月 $0-9 内。

## 3. 音乐
- 每条视频从全部曲库（19 首）里按"最久未用"选，同一天不重复，同一首 7 天内最多用 2 次。
- 有旁白的片子音乐压到 0.12-0.18，只做垫底。
- vidIQ 额度每月 29 日恢复后，余额 ≥100 时生成 2 首新曲（生活感：轻快原声、温暖钢琴），入库并加密。

## 4. 每日长视频（L-daily，15:00Z）
- 4-6 分钟，16:9，A 路讲解。周五仍按原排期发搜索指南或机制讲解，那天不另做 L-daily。
- 结构：0-20 秒一个外国人常有的疑问或误解 → 3 个小节，每节一个有来源的事实 + 一个生活场景 → 结尾一个问题请观众对比自己国家。
- 素材关：≥2.5 分钟 slug 能证明在中国的生活实拍（街头、菜市场、广场舞、早餐摊、地铁、公园、家庭聚餐），不够就换题。
- 事实关：每个数字两个来源，写进描述。不谈政治、政府、民族宗教争议。说"很多人""调查显示"，不说"中国人都"。
- 质量闸门（防模板化）：每条必须有至少 3 个独立来源的事实和 1 个具体场景；经理会话每周抽查 2 条。
- 砍掉规则：连续 14 条 L-daily 的 7 天播放中位 <30，降为每周 3 条。

## 5. 每天 Short 的搭配（至少 3 条）
- a：古建筑或机制（照日历）。
- c：热点梗 / 恶搞名场面（隔天交替，照 0e、0f）。
- d：**《Chinese Life in 30s》**，当天 L-daily 的 30 秒精华版，带旁白，结尾提示看完整版。

## 6. 首批 14 个选题（每条发布当次核实来源）
1. Why Chinese people ask "Have you eaten?" instead of "How are you?"
2. Why grandparents raise so many Chinese kids
3. What "face" (mianzi) really means in daily life
4. Why Chinese friends fight to pay the bill
5. Square dancing: why thousands of retirees dance outdoors every night
6. Why hot water is the answer to everything
7. What a normal Chinese breakfast looks like, city by city
8. Why Chinese people rarely say "I love you" out loud
9. Red envelopes: who gives, who gets, how much
10. Why everyone naps after lunch
11. How Chinese families decide a baby's name
12. The gaokao: one exam that shapes a whole family's year
13. Why Chinese parks are full of people at 6 am
14. What "guanxi" is, and what it isn't

## 7. 纪录短片方向（owner 2026-11-21 追加：学"一条"的拍法，多角度讲中国）
> owner 口述里的"医调"按"一条"（一条视频）理解：安静、克制、以人和细节为主的纪录短片风格。

**学什么（只学形式，不搬内容）**
- 一个具体的人、一个具体的地方或一件具体的东西开头，不从大道理开头。
- 旁白少而准，留白多；镜头时间长（每个 5-8 秒），不做快剪。
- 字幕简洁，白字小号；音乐轻，接近环境声。
- 每条只回答一个问题。

**每日长视频按星期轮换五个栏目**
| 星期 | 栏目 | 讲什么 |
|---|---|---|
| 周一 | Chinese Life | §6 的生活与观念选题 |
| 周二 | Made in China, Sold Everywhere | 中国品牌怎么崛起、为什么出海 |
| 周三 | Ordinary People | 普通人的一天：外卖骑手、早餐摊主、乡村教师、广场舞领队（依据公开报道和统计，不虚构具体个人） |
| 周四 | From Factory to Phone | 中国外贸三十年：代工厂 → 自有品牌 → 跨境电商 |
| 周六 | Who Needs Care | 老龄化、留守儿童、山区教育与医疗这些需要被关注的群体和项目 |
| 周日 | 当周表现最好栏目的第二集 | |

**首批选题（每个数字发布当次两个来源核实）**
- 品牌出海：
  - How BYD went from batteries to outselling everyone in EVs
  - Why Pop Mart's Labubu sold out worldwide
  - How Shein ships a new dress in days
  - Anker: the charger brand Americans don't know is Chinese
  - How DJI came to make most of the world's drones
  - Why Chinese milk tea chains are opening abroad
- 外贸：
  - Yiwu: the one city that supplies the world's small goods
  - What a "factory to your door" order actually travels through
  - From making for others to selling under their own name
  - How a village in China learned to sell on Amazon
- 老龄化与关爱：
  - What China's aging looks like in one community canteen
  - Who looks after grandma when the kids work in the city
  - Left-behind children: what the numbers say and what is being tried
  - A mountain school with fewer than 20 pupils
  - Universities for the elderly: why they have waiting lists
- 普通人：
  - A day in the life of a food-delivery rider
  - The 4 am breakfast stall
  - A village doctor's round

**规则**
- **不编造人物和原话。** "普通人"栏目讲的是这类人的典型一天，依据公开报道和统计，旁白说 "a typical rider" 而不是虚构的某个人；引用真人原话必须有出处并注明。真采访只用 owner 或合作者拍的、受访者同意的素材。
- **品牌**：只讲有来源的事实；不代言，不暗示赞助，不谈股价和投资；批评要有出处且适度。不用品牌广告片和宣传片素材，画面用类型层实拍（工厂、港口、门店街景）和代码画的图表。
- **社会议题**：只讲事实、数据和正在做的事，尊重当事群体，不消费苦难，不出现未成年人可辨认的脸。不评论政府和政策好坏，不做中美对立叙事；关税等只作为背景事实一句带过。
- **画面不够诚实就换题**，照 §4 的素材关。
