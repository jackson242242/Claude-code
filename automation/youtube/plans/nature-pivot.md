# 山野转向 2026-09-26：走出大城市 → 小城市 + 山川地貌

> owner 直令：「中国旅游专家这个提案要开始转一下方向去小城市，不再是去大城市什么的，
> 去山里，沙漠里，风景很好的地方，什么地貌，特别的自然风光的。」
> 本文件 = 转向的执行依据：数据、素材真值表、槽位、钩子规则、验收。playbook 的
> NATURE-FIRST 块引用这里；config.yaml pillars 已改；queue.json `nat-*` 已入列。

## 1. 为什么这个方向有数据支撑（不只是老板偏好）
- **竞品扫描（首次真跑，state/competitors.md 2026-09-26）**：近 7 天 China 相关 Shorts
  播放前 25 里 **9 条是山/村/地貌**；第 1 名 = 张家界七星山山路（2.9M，赞率 3.2%）；
  同一句钩子 "Would you walk this mountain path for free?" 两条 1.1M + 0.7M；
  "China's most beautiful village" 634k；"village on a mountain slope" 428k。
- **我们自己的数据**：slot d 路线（本来就是山野）是全频道最强槽——独库 561 km ×3.52、
  塔里木沙漠公路 446 km、青甘环线；而本周 LOSER 全是城市/手艺知识卡（龙井 ×0.30、
  仿玉 ×0.45、苏州园林 ×0.17）。
- 结论：山野不是新赌注，是把已验证最强的那条腿变成主腿。

## 2. 素材真值表（2026-09-26 实测 Pexels，slug 含地名才算"可指认"）
指认规则不变：只有 slug 里带地名的片/图才能说 "this is X"；否则只能类型层措辞或 MAP-FORMAT。

### 2a. 有可指认 **视频**（直接用 assemble 默认视频通道）
| 地点 | 查询词（照抄） | 命中 |
|---|---|---|
| 张掖七彩丹霞 | `zhangye danxia` | 19/20 ⚠️ 09-25/26 用 "Zhangye" 单词查失败，词不对 |
| 桂林/阳朔/漓江喀斯特 | `yangshuo karst` · `guilin li river` · `china karst mountains` | 16/18 · 11/17 · 13/16 |
| 茶卡盐湖 | `chaka salt lake` | 2（+ 图片补） |
| 壶口瀑布 | `hukou waterfall yellow river` | 2（+ 图片补） |
| 乐山大佛（崖壁） | `leshan giant buddha` | 6+ |
| 朱家角水乡 | `wuzhen water town`（返回的是朱家角！只能说朱家角） | 18/20 |
| 大理古城 | `dali ancient town` | 2（+ 图片补） |
| 长江三峡 | `china village mountains` 里有 xiling-gorge · `yangtze` | 1-2 |

### 2b. 只有可指认 **照片**（用 `assemble-video.mjs --photos only|fill`，Ken-Burns 动态）
张家界/武陵源 29/30 · 黄山 23/30 · 九寨沟 22/30 · 西江千户苗寨 15/30 · 凤凰 13/29 ·
青海湖 11/30 · 华山 11/30 · 天门山 10/28 · 长白山天池 10/30 · 元阳梯田 9/30 ·
龙脊梯田 8/30 · 恩施大峡谷 8/29 · 石林 7/30 · 三峡 7/30 · 呼伦贝尔 5/29 ·
赛里木湖 4/30 · 虎跳峡 4/30 · 婺源 4/30 · 塔克拉玛干 3/29 · 鸣沙山月牙泉 3/28 ·
泸沽湖 3/30 · 喀纳斯 2/29 · 梅里雪山 2/30 · 宏村 2/29 · 额济纳胡杨 2/30。

### 2c. 视频、照片都没有 → 只能 MAP-FORMAT / 老板实拍
武当山 · 梵净山 · 万峰林 · 独库公路 · 郭亮挂壁公路 · 稻城亚丁（1 张）· 平遥（1 张）·
巴丹吉林 · 雅丹 · 火焰山 · 荔波 · 武夷山 · 泰山 · 那拉提。
→ 这些是**老板出行实拍**最值钱的地方：一趟 10-20 分钟竖拍 = 3-5 条别人做不出来的片。

### 2d. 明确的陷阱
- "rice terraces" 视频全是越南/泰国 Sapa —— 绝不能配元阳/龙脊的指认文案。
- "tibet landscape" 混有印度拉达克（slug 含 ladakh）—— 逐条剔。
- "inner mongolia grassland" 多为蒙古国 —— 只能类型层。
- "china desert dunes" 返回秘鲁 Huacachina —— 沙漠只能 MAP-FORMAT 或类型层。

## 3. 槽位（覆盖 CULTURE-FIRST 的"主题"，保留 Q4 的"栏目"）
| 槽 | 内容 | 备注 |
|---|---|---|
| a 13:00 | `china-nature` 一地一数一争论 | 周三/日 China Price Check（自然行程定价，中国不便宜也照说）；周五 Expert Opinions = DEBATE |
| c 20:00 | China Trip Planner 2-3×/周（山野搜索意图） | 其余天 `small-town` 古镇小城；温泉/美食只在小城或山谷场景 |
| d 23:00 | `china-route` 不变 | 已是山野槽、最强槽 |
| 文化 | ≤1/周，且必须在小城或山野里 | 不再做单独手艺卡 / 大城市古迹卡 |
大城市只做出发点（"one hour from Shanghai"）或价格对照。大城市选题已 `paused-bigcity-2026-09-26`（可逆）。

## 4. 钩子：owner 问"有没有做完后分析数据去微调"——诚实答案
- **分析确实每天在跑**（postmortem + hook-ledger，AUTO 区日期连续），
  **但微调是坏的**：旧排行榜把"播放高于中位数"的数字卡（SPECTACLE-FACT/PLAIN-FACT）
  也列进"下一条用"，于是 09-21..26 的 22 条里 16 条仍是数字卡，讨论型每类只有 1-2 条样本
  ——**等于没学到东西**。同时首评种子通道自 09-14 起一直 403（token 缺 force-ssl），
  "把争论递给评论区"的后半截根本没在运行；周一竞品扫描 09-02 建立后从未跑过（今天首跑）。
- **已修（本次提交）**：
  1. `scripts/hook-ledger.mjs` 只推荐讨论型；`今日三槽依次用（a/c/d）` 是**指派**；
     样本 <3 的类型强制排进去补样本；非讨论型每天 ≤1（仅 slot d 路线超级数字）、每周 ≤3，
     AUTO 区打印配额；新增"评/千播"列。
  2. playbook 步骤 0 改成按指派执行，不再是"从榜单里挑"。
  3. 竞品扫描加山野查询词；非周一但文件 >8 天也要跑。
  4. HOOKS.md 加山野版 A-F 例句（直接照竞品验证过的句式）。
- **老板必须做**：重新铸 refresh token 带 `youtube.force-ssl`（否则首评通道永远死）。

## 5. 只有老板能做（按影响排序）
1. **去小城/山里时竖拍 10-20 分钟**（3-10 秒一条）—— §2c 那些地方没有任何库存素材。
2. **重铸 YouTube token 带 force-ssl**（5 分钟，OAuth Playground 三个 scope）。
3. YAL 音乐 6 首（路径 A），或每天 Studio 里 Add Sound（路径 B）。

## 6. 验收（两周，10-10 复盘）
- 讨论型六类每类样本 ≥3（AUTO 区可见）；非讨论型 ≤3/周。
- ≥1 条山野 Short >1,000 播放；频道评论数 >0（前提：force-ssl）。
- nat-* 前 12 条全部发出且每条 credits.json slug 通过指认检查。
