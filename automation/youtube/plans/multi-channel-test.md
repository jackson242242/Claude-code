# 多频道测试 2026-10-29：同时试几个方向，找出能出百万爆款的那一个

> owner 2026-10-29：「或者想想多做些频道做不同的方向，试出一个可以做到这个目标的为止。」
> 主频道 China Travel Expert 继续做古建筑。另开 3 个测试频道，各自一个方向，每天 1 条 Short。
> 30 天后按数据留下赢家、关掉输家，再开新方向替补，直到有一个方向出现 ≥10 万播放的视频为止。

## 1. 为什么选这三个方向（证据：10 月竞品扫描 + 百万案例评估）
| 频道 | 方向 | 证据 | 画面来源（全部授权或原创） |
|---|---|---|---|
| T1 **China Builds** | 中国现代超级工程：桥、隧道、沙漠治理、高铁、风电叶片运输。一条讲一个工程、一个数字 | 竞品扫描：风电叶片运输 1.4M、沙漠变绿 1.2M + 0.86M；大工程是中国题材里最稳的爆款类别 | Pexels slug 点名的工程视频 + 代码图解 + 地图；只讲工程事实，不谈政治、不做宣传口吻 |
| T2 **Unreal Places** | 全球"看起来像假的"真实地方，15-20 秒，一地一个钩子 | 竞品扫描："Places on Earth that seem unreal" 1.97M、1.89M、0.68M（16 秒）；范围全世界，素材最充足 | Pexels slug 点名的地点视频；地名只配点名画面；每条一个独立核实的事实，避免模板化 |
| T3 **Ancient Engineering** | 全世界古代工程怎么造的：罗马、埃及、印加、中国。机制讲解，90-180 秒 | 百万案例评估：3D_Spectra 2-3 分钟 Shorts 中位 28.3 万；所有百万频道都是"怎么造的"讲解 | 我们已有的代码图解渲染器 + slug 点名的遗址画面开头（第 0 帧必须真实） |

没选的方向：外国人反应、街头美食、Vlog。它们都需要真人出镜，或者我们没有素材。

## 2. 节奏与配额
- 每个测试频道每天 1 条 Short，主频道每天 3 条不变。
- YouTube API 每天 1 万单位，每次上传 1,600：
  - 主频道 3 条 + 测试频道 3 条 = 6 次上传，9,600 单位，会超（还有播放列表和读取）。
  - 所以测试期主频道降到每天 2 条。轮换里 F2 本来就经常缺素材，那个槽位就让出来。
  - 另外由 owner 在 Google Cloud 免费申请提高配额，批下来后恢复 3 条。
- 测试频道由一个独立的每日 routine 负责：每天 13:30 UTC，紧接主频道 routine。没有 token 的频道自动跳过，所以 owner 加好 token 就会自动开始。

## 3. 判定规则（30 天，每个频道约 30 条）
| 结果 | 做法 |
|---|---|
| 任意一条 ≥100,000 播放 | 这个方向胜出：每天 3 条，主力投入，并把胜者形状写进主频道 |
| 72 小时中位 ≥ 主频道 3 倍，或 ≥1 条 ≥20,000 | 保留，再测 30 天 |
| 72 小时中位 < 主频道 | 关闭（不删视频，只停更），开一个新方向替补 |

替补方向（按顺序）：中国自然奇景 POV 合集 → 世界最贵/最便宜对比 → 古代城市地图动画。

## 4. owner 需要做的（总共约 15 分钟，我做不了的只有这两步）
1. **建 3 个频道**。YouTube 没有建频道的 API。
   - 步骤：在 YouTube 右上角头像 → 设置 → 添加或管理频道 → 创建频道。
   - 依次填名字：China Builds、Unreal Places、Ancient Engineering。
2. **为每个频道生成 token**。
   - 用 OAuth Playground，和 8 月那次一样，切换到对应频道授权，范围是 youtube、youtube.upload、youtube.force-ssl。
   - 在 Claude 环境变量里加：YT_TOKEN_CHINABUILDS、YT_TOKEN_UNREAL、YT_TOKEN_ANCIENT。
   - 加好后不用告诉我，第二天的 routine 会自动开始。
3. 可选：在 Google Cloud 申请 YouTube Data API 配额提升。表单免费。

我能做的已经做完：方向、规则、每个频道的首周选题、routine、上传脚本复用（通过环境变量切换 token，不改代码）。

## 5. 每个测试频道的首周选题（routine 照此开工，数字当次核实）
**T1 China Builds**
- How China Moves a 90 m Wind Turbine Blade Through Mountain Roads
- China Planted a Green Belt Around the Taklamakan — 3,046 km
- The World's Highest Bridge Is 625 m Above a River（花江峡谷大桥，2025 年通车）
- A Bullet Train Line Built Across Shifting Sand（和若铁路）
- 1,000 Tunnels and Bridges on One Railway to Tibet（川藏线，只讲工程）
- China's Longest Sea Bridge: 55 km — and a Tunnel in the Middle（港珠澳大桥）
- 7 Days to Swap a Railway Bridge Overnight（转体桥，"一夜"类钩子）

**T2 Unreal Places**
- 这地方是真的？Zhangye Danxia Hills（slug 已验证 19/20）
- Lake Hillier Is Naturally Pink
- Salar de Uyuni Turns Into a Mirror Every Rainy Season
- Guilin's Karst Peaks Look Painted（slug 已验证）
- Antelope Canyon's Light Beams Last Only Weeks a Year
- Chaka Salt Lake: Walk on the Sky for ¥60（slug 已验证）
- Pamukkale's White Terraces Are Made of Mineral, Not Snow

**T3 Ancient Engineering**
- How a 1,000-Year-Old Wooden Pagoda Survives Earthquakes（应县渲染器已有）
- How the Romans Made Concrete That Heals Itself
- How the Inca Fit Stones With No Mortar
- How the Pantheon's Dome Has Stood 1,900 Years Unreinforced
- How a 1,400-Year-Old Chinese Bridge Survived Floods and a M7.2 Quake（赵州桥渲染器已有）
- How Ancient Persians Kept Ice in the Desert（Yakhchal）
- How Rammed-Earth Walls Outlast Concrete（土楼渲染器已有）
