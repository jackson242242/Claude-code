# TikTok + IG 起号作战手册 (2026-08-09, owner directive)

> 分工的诚实边界：**注册和发帖必须你来**（平台要手机验证+真人检验，且起号期
> 自动化发帖易被限流；更关键：API 发的帖**不能用站内音乐库**——和我们"干净母带
> + App 内热门音乐"的策略正面冲突）。我负责其余一切：内容供应链、账号规格、
> 节奏策略、数据分析、逐周调优。你每天 2-3 分钟发帖即可。

## 权限时间表（提前说清，到点我会再提醒）
| 阶段 | 需要你给的 | 说明 |
|---|---|---|
| **现在（注册）** | 无权限，只要你 10 分钟注册两个号 | 规格见下；handle 注册时验证可用性 |
| **起号期 2-4 周** | 无权限 | 你发帖；每周日把 TikTok Studio / IG Insights 截图发对话框，我出周报+调整 |
| **稳定后（可选自动化）** | IG: 转 Creator/Business + 绑 Facebook Page + Meta 开发者应用 token（`instagram_content_publish`，存环境变量）；TikTok: Content Posting API 应用审核授权 | 到时给 step-by-step；API 帖不能配站内音乐，只适合原声内容，所以自动化只做补充 |
| **永远不需要** | 你的账号密码 | 2FA/设备风控/封号风险——只走官方 token |

## 账号规格（两平台一致）
- **Handle**（owner 2026-08-10 选定）: `@yourchinatravelexpert`（TikTok ≤24 字符、
  IG ≤30 字符均合规，21 字符；两平台显示为全小写）。若注册时被占用，备选：
  `@yourchinaexpert` → `@china.travel.expert` → `@mappingchina`。
  YouTube handle 之后也可在 Studio 改成同名（@nyneighborhood → @yourchinatravelexpert）
  实现三平台统一。
- **名称**: `China Travel Expert 🧭`
- **TikTok bio** (≤80字符): `Real China, zero tourist traps 🧭 Architecture · history · food. Daily.`
- **IG bio**: 同句 + 第二行 `📍 Mapping ALL of China, one video at a time`；链接位先空着（私域定了再挂）
- **头像**: 红漆罗盘/庙檐罗盘方案（已生成候选图，老板选一）；两平台+将来 YouTube 统一
- **类别/标签**: IG Creator→Travel；TikTok 兴趣选 travel/culture/education

## 起号 14 天节奏
- **D1-2 养号**: 完善资料→关注 10-20 个 china travel/culture 大号→每天刷 30 分钟
  目标领域内容并点赞（教算法"我是谁"）→ **不发帖**
- **D3 起**: TikTok 每天 2 条（约 13:00Z 和 22:00Z 发 = 美东上午/晚黄金档）；
  IG Reels 每天 1-2 条（错开半小时）
- **首发弹药 = YouTube 已验证 top 钩子**（改造队列前 25 名，按表现排序发，
  不按时间顺序）：热干面泼油壶、铜锅清水凭什么、肉夹馍名字之谜、锅包肉为外国人
  发明、荔枝王实拍 EP1……每条都是已证明能停手指的开头
- **每条帖**: 干净母带 + App 内热门音乐（按 `Suggested sound:` 提示选风格）+
  文案首行钩子 + 3-5 tags（#chinatravel #traveltok 轴心）
- **发后 1 小时内回评论**（新号互动权重大）；**绝不**买粉/互赞群（判死刑）
- **周日数据日**: TikTok Studio 播放/完播/流量来源截图 → 我出周报和下周排片

## 内容供应链（已就绪，无需操作）
- 每日 4 条新片：干净母带 + 英文文案 + 建议音乐风格 → 自动发对话框
- 存量 120 条：`state/social-export-queue.json` 按播放量每天补 2 条；你点名优先出
- 古文化新方向内容（明起 2 文化+1 古迹+1 美食）天然适配 TikTok 猎奇/打卡/亲子三轨

## 跨平台联动（起号后）
- YouTube 频道页 + 高播放视频置顶评论互推 TikTok/IG（等 force-ssl 权限）
- 三平台同 handle 同头像；bio 链接统一指向私域阵地（老板定平台后一次挂全）

## 诚实预期
新号前两周播放量波动极大属正常；不承诺具体数字。目标：4 周内用数据找出 1-2 个
能在 TikTok 跑通的钩子类型，然后集中火力。
