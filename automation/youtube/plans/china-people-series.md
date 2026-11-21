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
