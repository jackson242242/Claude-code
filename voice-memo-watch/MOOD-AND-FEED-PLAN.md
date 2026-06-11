# 心情体验 + 健康数据音乐 + 浏览信息流 — 总体规划

> 状态:已批准方向,Phase 2 的数据库 schema 已随本文件落库(`backend/schema.sql`)。
> 老板更正(2026-06-11):信息流不只用浏览记录,健康数据也要参与打造产品。
> 据此采用**双轨设计**:长期排序画像只用浏览记录;经用户单独授权的**实时心情**
> 以"为此刻心情调谐"的方式参与信息流(只取本人最近 15 分钟快照,结构上不可能
> 形成纵向心情画像)。这是能过 Apple/Google 审核的唯一做法,边界见 §5。

## 0. 三件事与它们的正确顺序

| Phase | 内容 | 依赖 |
|---|---|---|
| 1 | 心情体验:手表读 health data → 过滤成 mood → 载入音乐 | 手表端权限 + 后端 mood 接口 |
| 2 | **数据库(先建)**:Postgres 持久化全部业务 + mood + 浏览事件 | 无 — 这就是地基 |
| 3 | 信息流:浏览记录长期画像 + 实时心情调谐(双轨)+ 市场洞察 | Phase 2 的 browse_events + mood 表 |

为什么数据库在最前:现在全部数据在内存里,重新部署即清空;mood 快照和浏览事件
都是时间序列,没有持久层就没有"分析和市场洞察"可言。

## 1. Phase 1 — 心情体验:health data → 音乐(手表独有能力)

### 1.1 采什么(只有手表有的连续数据)

| 数据点 | watchOS (HealthKit) | Wear OS (Health Services) | 用途 |
|---|---|---|---|
| 心率 HR | `HKQuantityType.heartRate` | `DataType.HEART_RATE_BPM` | 能量/激励度 (arousal) |
| 心率变异性 HRV | `heartRateVariabilitySDNN` | (部分表支持 RMSSD) | 平静/紧张度 (calm) |
| 静息心率 | `restingHeartRate` | 由历史推 | 个人基线 |
| 运动状态 | `HKWorkoutSession` 活跃与否 | `ExerciseClient` | 区分"跑步的高心率"和"紧张的高心率" |

明确**不采**:位置、睡眠详情、体温、月经周期等——与音乐无关,坚决最小化。

### 1.2 过滤管线(全部在手表上完成,这是关键设计)

原始心率样本**永不离开手表**。手表本地做四步过滤,只上传最终的 3 个数字:

```
原始 HR 样本流 (1–5s 间隔)
  │ ① 合理性夹断: 丢弃 <40 或 >210 bpm 的伪值(传感器贴合不良)
  │ ② 中值滤波: 5 点滑动中值,去毛刺
  │ ③ 窗口聚合: 取最近 5 分钟窗口的中位数 HR、RMSSD
  │ ④ 个人基线归一:
  │      energy = clamp((HR_now − HR_resting) / (HR_max_est − HR_resting), 0..1)
  │      calm   = clamp(RMSSD_now / RMSSD_personal_p75, 0..1)
  │      workout 进行中 → energy 打折 0.6(运动高心率≠情绪激动)
  ▼
MoodSnapshot { energy: 0.72, calm: 0.31, label: "energetic" }   ← 只有这个上传
```

label 由 energy×calm 四象限得出:`calm`(低能量高平静)、`energetic`(高高)、
`stressed`(高能量低平静)、`low`(低低)。

### 1.3 融入产品的四个点

1. **Mood 调音(核心)**:`RenderRequest` 增加可选 `mood: {energy, calm, label}`。
   - mock 引擎:`energy` 拉伸 tempo(0.9–1.25×)、`calm` 控制 echo 和音量包络;
     库伴奏自动选 BPM 接近当前心率的那条(75 BPM lofi vs 128 BPM edm)。
   - Replicate 引擎:label 进 prompt 条件("calm, slow, soothing" / "driving, intense")。
2. **Mood 封面**:封面色板按 label 选(calm→teal/mint,energetic→fuchsia/caramel,
   stressed→violet,low→低饱和)——可视化"这首歌是什么心情做的"。
3. **Mood 标签(发帖可选)**:发帖时可勾选"带上心情",Feed 卡片显示
   "🏃 made at 132 bpm" / "😌 calm" — 默认**不带**,opt-in。
4. **心情日记**:Me 页时间轴,我的每条 memo + 当时 mood,纯个人视图。

### 1.4 手表端实现要点

- **watchOS**:`HKHealthStore.requestAuthorization`(只读 HR/HRV/RHR);
  录音开始时启动 `HKAnchoredObjectQuery` 拉最近 5 分钟;Info.plist 加
  `NSHealthShareUsageDescription`(文案必须只说"为你的音乐调情绪")。
- **Wear OS**:`androidx.health:health-services-client` 的 `MeasureClient`
  (录音中临时订阅 HR);Manifest 加 `BODY_SENSORS` 权限 + 运行时弹窗。
- 双端都做同一套 §1.2 过滤,公式写进共享文档保持一致。
- Web 端没有传感器:提供手动心情滑杆(energy/calm 两个 slider)作为降级,
  同一个 `mood` 字段,后端无感知差异。

## 2. Phase 2 — 数据库(地基,schema 已交付)

`backend/schema.sql` 是 source of truth,要点:

- 现有业务全部持久化:users / memos / renders / posts / comments / favorites /
  follows / messages / streams(替换内存 store;`store.py` 接口不变,换实现)。
- **`mood_snapshots`**:`(user, ts, energy, calm, label, source)`——只存过滤后
  的快照;`consent_health` 不为真的用户一行都不许写(应用层 + 表约束双保险)。
- **`browse_events`**(长期排序画像的唯一燃料):
  `(id, username, post_id, event, dwell_ms, session_id, ts)`
  `event ∈ impression | play | complete | like | favorite | comment | forward | profile_visit`
- **受控隔离**:mood 在独立 `health.*` 命名空间;feed/分析角色对 health 表
  **零 SELECT 权限**,唯一入口是 `health.current_mood_for_feed(username)`
  函数——只返回本人、最近 15 分钟、且两个 consent 都为真的一条快照。
  纵向心情画像在数据库层面就做不出来。
- 文件存储同步换 S3/R2(`store.py` 内已隔离)。

## 3. Phase 3 — 信息流:双轨排序(浏览画像 × 实时心情)

### 3.1 事件采集(客户端三行代码级)

- 卡片进入视口 ≥500ms → `impression`
- 点开播放 → `play`;播完 80% → `complete`(音频产品最强的正信号)
- like/favorite/comment/forward/关注作者 → 对应事件
- 详情页停留时长 → `dwell_ms`
- 全部挂在现有 fetch 上批量上报 `POST /events`,断网丢弃不重试(尽力而为)。

### 3.2 排序公式(v1 透明加权,数据量不到不上 ML)

对候选集(关注作者新帖 + 全站最近 72h + 与我常听风格同类):

```
base  = 0.30·style_affinity      # 我对该风格的 complete 率(14 天半衰期衰减)
      + 0.25·author_affinity     # 我对该作者的历史互动(关注=保底高分)
      + 0.20·quality              # 全站 complete率 + (like+fav+comment)/impression,时间衰减
      + 0.15·recency              # exp(−age/24h)
      + 0.10·exploration          # ε-greedy:1/10 的位置随机给新作者新风格(防茧房)

score = base × (1 + 0.35·mood_match)     # 心情调谐项,仅当用户开了 mood-feed 开关
```

`mood_match`:取**本人**最近 15 分钟的 mood 快照(经 `health.current_mood_for_feed()`
这一唯一通道,见 schema),与帖子的能量画像匹配——帖子能量由其风格 BPM、作者
发帖时自愿公开的 mood_tag、音频特征(完播用户占比高的时段能量)推得。例:
我现在 stressed → calm/lofi 内容 mood_match≈1,EDM≈0;我 energetic → 反之。
长期画像(style/author affinity)**永远只来自 browse_events**;mood 只乘在
当次请求上,不写回任何画像表——这就是"参与产品但不形成健康画像"的实现。

**UI 必须透明**:Feed 顶部出现可关闭的胶囊「😌 为你此刻的心情调谐中 ×」,
用户随时一键关闭(写回 consent_mood_feed=false)。

冷启动:无历史用户 → quality + recency + exploration 三项(mood 项照常可用,
这恰好是新用户最快感到"它懂我"的钩子)。

### 3.2b 心情侧的市场洞察边界

面板上可以看:「开启 mood-feed 的用户占比」「mood 调谐开启时的完播率 vs 关闭时」
(产品 A/B 级聚合,不含任何个体 mood 值)。不可以看:任何个体/分群的情绪分布、
"压力大的用户更爱看什么"这类挖掘——那就是条款里的 data mining。

### 3.3 市场洞察(给运营/老板看的聚合面板)

每日离线聚合(SQL 物化视图即可起步):风格热度趋势、完播率排行、留存
(D1/D7 回访)、创作漏斗(录音→渲染→发帖转化)、传播系数(forward 链深度)。
全部是**聚合数**,不含个体浏览明细;mood 相关只允许 §3.2b 列出的两个
产品级聚合指标,其余一律不上面板。

### 3.4 v2(数据量上来之后才做)

- 协同过滤(隐式反馈 ALS)→ 风格/作者 embedding
- 多目标:完播 × 互动 × 新作者扶持
- 在线 A/B:`ranking_version` 写进 impression 事件即可归因

## 4. 实施顺序(每步可独立验收)

| 步 | 做什么 | 谁 |
|---|---|---|
| 1 | ✅ schema.sql(本轮已交付) | agent |
| 2 | store.py 换 Postgres 实现(接口不变,测试全保) + Render 加数据库 | agent + 你在 Render 点一下创建 Postgres |
| 3 | `POST /events` + 客户端埋点 + `GET /feed/ranked` v1 公式 | agent |
| 4 | `mood` 字段进 RenderRequest + mock/Replicate 调音 + web 手动心情滑杆 | agent |
| 5 | watchOS HealthKit / Wear OS Health Services 采集 + 本地过滤 | agent 写码,你在真表上授权测试 |
| 6 | 洞察面板(每日聚合 SQL + 简单页面) | agent |

## 5. 合规红线(不可妥协,违反会直接下架)

1. **健康数据的允许面(更正后)**:Apple(App Review 5.1.3 / HealthKit 条款)
   和 Google(Health Connect 政策)禁止健康数据用于**广告/营销/数据挖掘**。
   允许的是"为用户本人提供健康/健身相关功能"。因此 mood 可以用于:
   ① 用户自己的音乐渲染;② 自己的日记;③ 自愿公开的单条标签;
   ④ **本人 feed 的实时调谐**(明示开关 + 顶部可见胶囊 + 只取当前快照)。
   仍然绝对禁止:纵向 mood→engagement 画像、用 mood 定向广告、把 mood 卖给
   或共享给任何第三方、用 A 用户的 mood 排序 B 用户的内容。数据库层面用
   `health.current_mood_for_feed()` 唯一通道 + 角色权限把禁区焊死(见 schema)。
   **诚实预警**:即便如此,健康数据参与 feed 在 App Review 仍属灰区,审核
   文案必须把它描述为 wellness 功能("音乐随心情");若被拒,退路是把
   mood 调谐改为纯端上(手表/浏览器本地重排已拉到的 feed),零数据上传,
   功能不变——架构已为此预留(mood 项是排序最后一步的独立乘子)。
2. **GDPR/各州隐私法**:健康数据是特殊类别数据——显式同意(独立开关,
   非默认勾选)、随时撤回并删除历史、只存派生值不存原始样本。
3. **浏览事件**也要克制:90 天滚动删除、用户可一键清空自己的浏览画像、
   不卖不共享给第三方。
4. 上架文案:健康权限的用途描述只能写音乐功能,写宽了 App Review 必拒。
