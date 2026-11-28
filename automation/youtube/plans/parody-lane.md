# 名场面恶搞车道（P 格式，owner 2026-11-11）

> owner：用中国热播剧、偶像剧、综艺的名场面和热搜片段做蓝图，恶搞人物外形，让他们说出名场面的台词，背景用中国内地城市。

## 1. 做法
- **台词照说**：名场面的原句，中文大字 + 英文意译字幕。
- **角色是我们原创的恶搞形象**：动物或 Q 版，穿能让人认出出处的服装类型，比如穿清宫皇后装的熊猫。用 OpenAI 图像模型生成，透明底，提示词里写明 "not based on any real person"。
- **声音是新配的 AI 声音**（`scripts/tts-openai.mjs`），用表演指令演出情绪，不模仿原演员。
- **背景**：Pexels 里 slug 点名的中国内地城市实拍，竖屏裁切，地名写在底部说明里。
- **结构**：0-2.4 秒旅行情境钩子（英文）→ 角色弹出喊台词 → 结尾留一个站队问题。7-12 秒，可循环。
- **底部常驻一行**：`AI-made parody · original character · <地点>`；上传时 `meta.aiFootage=true`，AI 披露自动打开。
- **成本**：每条约 $0.05（一张图 + 一句配音），计入 OpenAI 每月 $2 上限。

## 2. 三条红线（任何情况都不做）
1. 不用 AI 生成、改造或模仿**真实演员、艺人的脸和声音**。这是肖像权问题，YouTube 也会按投诉下架。
2. 不用剧集、综艺、热搜视频的**原片段、原声、截图、海报、主题曲**。这是版权问题，会被 Content ID 认领。
3. 不恶搞政治人物，不碰政治话题；不做羞辱某个真人的内容。

## 3. 节奏
每天 1 条，占热点槽（slot c）；和热点梗题隔天交替。每周日经理会话单独统计 P 的 72 小时中位，对比其他格式决定加量还是撤掉。

## 4. 选题库（台词是广为流传的名句，发布当次确认出处写法）
| id | 出处类型 | 台词 | 旅行情境钩子 | 角色 | 背景 |
|---|---|---|---|---|---|
| p-01 | 宫斗剧 | 臣妾做不到啊！ | Friend: "Chongqing is totally walkable." | 熊猫皇后 | 重庆洪崖洞（样片已做） |
| p-02 | 宫斗剧 | 贱人就是矫情 | Tourist: "I only drink iced water." | 猫贵妃 | 成都茶馆类型层画面 |
| p-03 | 宫斗剧 | 那年杏花微雨，你说你是果郡王 | Me finding out the "5-minute walk" was 40 | 兔妃 | 西安城墙 |
| p-04 | 偶像剧 | 你失去的只是一条腿，她失去的可是爱情啊 | Friend: "It's just 6,600 steps up Mount Tai." | 柴犬女主 | 泰山照片（slug 点名） |
| p-05 | 古装剧 | 我要这天，再遮不住我眼 | Me after the smog clears over the Bund | 猴子侠客 | 上海外滩 |
| p-06 | 都市剧 | 我不要你觉得，我要我觉得 | Tour guide deciding the lunch stop | 熊猫总裁 | 广州街头 |
| p-07 | 综艺 | 我真的会谢 | Booking Forbidden City tickets at 20:01 | 鹦鹉 | 故宫 slug 片段 |
| p-08 | 古装剧 | 元芳，你怎么看？ | Two friends choosing Xi'an or Nanjing wall | 老虎官员 | 西安城墙 |
| p-09 | 宫斗剧 | 这福气给你要不要啊 | Friend offering the middle seat on a 12-hour train | 熊猫皇后 | 高铁站类型层画面 |
| p-10 | 综艺 | 淡黄的长裙，蓬松的头发 | Me dressing for Harbin at -30°C | 企鹅 | 哈尔滨冰雪（需 slug 画面） |

钩子里出现数字的（泰山台阶、哈尔滨气温）发布当次两个来源核实；核实不了就换成不带数字的说法。
