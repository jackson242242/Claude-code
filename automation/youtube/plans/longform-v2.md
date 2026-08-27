# 长视频 v2 格式圣经《China Travel Expert Longform》(2026-08-27, owner 直令)
> 对标 @GoldenSeniorsLiving 模式：明显 AI 但高播放的英文解说长视频。
> 10-15 分钟 · 每 4 天一条（首发 2026-08-28 周五 15:00Z）· **全英文，零中文**。
> 研究来源：2026-08-27 workflow 四路网研合成（数据面附录待 Data API 补跑）。

## 1. 格式公式（逐分钟骨架）
**核心**：英文 AI 解说倒计时清单片，11-13 分钟（~1,700-2,000 词 @150wpm），
8-12 个条目。过 8 分钟中插广告线；10-15 分钟段 40-50% 完播即为优秀。
| 时间 | 节拍 |
|---|---|
| 0:00-0:20 | 冷开场：预告一个中段条目+具体数字（"Number 6 alone saves you $80 on day one"）+承诺片尾 bonus tip |
| 0:20-0:45 | 留存桥：这片给谁看/能带走什么/一句可信度（"we track China entry rules and prices every week"）/3 秒订阅请求 |
| 0:45-6:00 | 倒计时 N→中点。每条目 60-90 秒模板：惊人论断→具体细节（真实店名/USD+RMB 双币价格/App 名）→地图或图卡→一个可执行技巧→开环预告下一条。永远留一个开环 |
| ~6:00-6:20 | 中段再钩：预告还剩什么（"the visa mistake at #2 is the one most people get wrong"）+评论提问（"which city are you flying into?"） |
| 6:20-11:00 | 冲向 #1，逐条升级，#1 必须真是最强 |
| 11:00-12:00 | 兑现开头承诺的 bonus tip |
| 12:00-12:30 | 收尾：明确指向下一条视频/歌单（session 信号）+订阅 CTA |

## 2. 解说风格
- 温暖第一人称"懂中国的朋友"人设，全系列声音一致；~150wpm 沉稳低语速
- 签名动作：**每条目算美元账**（"taxi from Pudong runs $28; the Maglev is $7 and faster"）
- 硬规则①：**绝不虚构亲历**（不说 "I did this last spring"）——用 "travelers
  consistently report" / 研究口径；虚构亲历既不诚实又是平台去真实性信号
- 硬规则②：每稿 TTS 冷听 QA（1.0x+1.25x），中文专名给注音拼写
  （Chongqing→"Chong-ching" 等），防"Pete Moss"式念崩
- ElevenLabs 英文纪录片声线；expressive 设置沿用 elevenlabs-tts.mjs 默认

## 3. 画面策略（60-90 秒必换层）
每条目：定场库存镜头（Pexels/Pixabay 中国城市/高铁/美食/古建充足）→
地图动画/路线飞线 → 2-3 个细节镜头 → **原创信息图卡**（价格对比卡/清单卡/
"Verified Aug 2026"戳）。App 类话题加录屏（Alipay/Trip.com/12306）——
最强的"非模板"原创信号。AI 生成画面只做抽象转场，**绝不用 AI 画面冒充真实地点**。
章节：手动 chapters，每条目一章，0:00 起（+18-22% AVD 且每章名都是 SEO 面）。

## 4. 标题/封面公式
标题 40-60 字符，关键词前置：
- "[N] China Travel Mistakes to Avoid in 2026 (Do NOT Skip #3)"
- "China Visa-Free 2026: [N] Rules Nobody Explains"
- "How to Pay in China as a Tourist ([N] Things to Set Up First)"
封面模板（全系列统一识别）：深海军蓝底+一个饱和强调色（中国红）+
图标化主体（地标剪影+警示三角/红叉/价签）+3-5 词补充文字（"$7 vs $28"），
不用人脸。封面走 OpenAI 生成（generate-asset.mjs 16:9 → 1280x720 ≤2MB）。

## 5. 首发排播（每 4 天，15:00Z）
| # | 日期 | 选题 | 信心 |
|---|---|---|---|
| L01 | 08-28 | China Visa-Free in 2026: Every Rule, Who Qualifies, Mistakes That Void It | 高需求高契合；**制作时必须核 60 天内官方信源** |
| L02 | 09-01 | 15 Mistakes First-Time Visitors to China Always Make | 高（常青+对标爆款同构） |
| L03 | 09-05 | How to Pay in China (Alipay/WeChat Pay/Cash Myth) | 高（录屏=最强原创信号） |
| L04 | 09-09 | China on $50 a Day: Real 2026 Prices | 中高（美元账签名格式） |
| 备选 | | 高铁全解 / 10 被跳过城市 / 防坑防骗(保护性口吻) / 20 必吃菜 | 中 |
- **VPN/网络话题**：不做独立视频（政治擦边灰区），只在 L02 里 60 秒中性提及
- **红线不变**：政府/台湾/新疆/香港评论永不碰
- L01-L04 数据复盘（观看时长曲线/CTR/搜索流量占比）后定 L05+

## 6. 平台合规（2025-07-15 YouTube 去真实性政策）
AI 解说本身合规；死的是"模板 AI 声+通用素材+零附加值"。我们的护城河（每条必做）：
①脚本含可验证的原创研究（价格/日期/规则引用+日期戳）②鲜明编辑视角
（专家人设+美元账+Verified 戳）③分层画面（库存+地图+录屏+原创图卡，
绝不通铺泛用 b-roll）④解说逐字原创。描述里如实标注 AI narration。

## 7. 生产管线（每 4 天的 run 加做，或独立触发）
1. 选题（上表顺序）→ WebSearch 深研（价格/规则全部双源+60 天内官方源）
2. 英文稿 1,700-2,000 词按 §1 骨架；TTS 注音表；冷听 QA
3. `node scripts/elevenlabs-tts.mjs`（英文纪录片声线）→ vo.mp3
4. `node scripts/assemble-video.mjs --audio vo.mp3 --format 16x9 --seg-seconds 5
   --pace fast --style clean --badge "CHINA TRAVEL EXPERT"` + 图卡/地图段
   （图卡 drawtext/PIL 生成 PNG 插入；录屏段后续版本）
5. 缩略图 generate-asset.mjs（§4 模板）→ ≤2MB
6. 上传 categoryId 19, defaultLanguage en, chapters 进描述, 15:00Z publishAt
7. 状态写回 published.json（slot: L）+ RUNLOG；歌单《China Travel Guides》
- 字幕：不烧录（靠 YouTube 自动字幕）；成本：EL 字符 ~9-11k/条——若配额不足，
  run 里如实降级为"脚本+分镜完成待配音"并报告
