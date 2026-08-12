# MUSIC.md — 背景音乐策略 v1.0 (2026-08-12, owner 全权委托)

> 起因：owner 2026-08-11 "背景音乐为什么每次都一样" + "去学习最火的旅游视频怎么
> 配乐，你来策划"。根因 = 曲库只有 3 首。本文件是音乐生产与配对的唯一权威。

## 1. 爆款研究结论（2026-08-12，vidIQ 深拆对标账号 TikTok 爆款 ×2 + 平台通识）
- **配方一致**：爆款中国游短视频 = **现代节拍 + 中国乐器点缀**（"modern electronic
  /pop beat blended with traditional Asian instrument touch"两条深拆原话都指向它）
  ——不是纯古风，也不是纯洋曲；节奏感撑节拍剪辑，民乐点缀给"中国味"
- **功能优先**："music matches the visual edits to create rhythmic satisfying
  flow"——音乐是剪辑节拍器：卡点换镜、drop 对齐 money shot / 场景 reveal
- **TikTok 特有**：热门音源本身带流量权重 → App 内选当下热门（我们的干净母带
  策略已对齐）；YouTube Shorts 对热门音源依赖低，自有曲库可控性更重要

## 2. 曲库规划（目标 10-12 首，全自有授权，绝不碰商业音乐=Content ID 红线）
| 风格代号 | 描述 | BPM | 配对支柱 | 状态 |
|---|---|---|---|---|
| oriental-edm | 现代电子+古筝笛子点缀，昂扬 | 105 | china-route 线路/旅行蒙太奇 | 2026-08-12 生成 |
| cinema-orient | 弦乐+二胡古筝渐强，中段 drop | 90 | china-culture 奇观/古建 reveal | 2026-08-12 生成 |
| cpop-groove | 华语 R&B 器乐，松弛都市 | 100 | 城市/生活/美食奖励站 | 2026-08-12 生成 |
| lofi-upbeat-01 | 存量 | ~110 | 通用备选 | 在库 |
| lofi-chill-01 | 存量 | ~90 | 通用备选 | 在库 |
| guzheng-calm-01 | 存量古筝 | slow | 文化慢节奏/例外 | 在库 |
| (待生成) emotional-piano / phonk-lite / acoustic-warm / oriental-edm-02 | 每月配额恢复后补 2-3 首（25 分/首，底线 40 分） | | | 8/29 后 |
- **yal-\*.mp3**（老板 YouTube 音频库真人曲）任何时候到货即入库，优先级最高

## 3. 配对与轮换规则（写死在每日 run）
1. **风格↔支柱映射**（上表）优先；映射内多首时选"最久未用"
2. **同一天 4 条不重曲；相邻两天同槽位不重曲**（published.json 可查上次使用）
3. **BPM 锁定剪辑**：seg-seconds ≈ 一小节时长（105BPM→2.3s / 90BPM→2.7s /
   100BPM→2.4s），镜头切换落在节拍上；drop 段对齐 转/reveal beat
4. 音量规则不变：无人声片音乐主轨 0.85；实拍片垫底 0.4-0.5
5. **月度治理**：每月配额恢复后生成 2-3 首新风格并退役使用率最高的 1 首
   （防"听腻"）；周报观察音乐×留存相关性
6. TikTok/IG：继续干净母带 + App 内热门音源；social-caption 的 `Suggested sound:`
   按上表风格给提示（如 oriental-edm 片 → 搜 "china travel epic" 类热门音源）

## 4. 生成规范（vidIQ generate_music，25 分/首）
Prompt 公式：`[风格] + [中国乐器点缀] + [情绪] + [明确 BPM] + instrumental`；
时长 60s（够 Shorts 循环裁剪）；WAV 转 192k mp3 入库 `assets/music/`，
命名 `<风格代号>-NN.mp3`；每首入库前试听抽查（下载后 ffprobe + 抽段人工听感描述）。
