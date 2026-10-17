# MUSIC.md — 背景音乐策略 v2.0 (2026-10-17)

> 本文件是音乐来源、授权、配对、披露、署名的唯一权威（owner 2026-08-11 全权委托音乐策略）。
> v2.0 起因：owner 2026-10-17 "9 条生成配乐质量差" + "全是航拍，没有第一人称 POV 感"。
> 机器可读清单 = `assets/music/manifest.json`（每首：source / license / attribution / style / bpm /
> aiGenerated / vault / provenance）。本文件与 manifest 冲突时以 manifest 的授权字段为准，并修正本文件。

## 1. 来源与授权 Sources & licences

| 来源 | 文件 | 存放 | 授权 | AI 生成? | 描述署名 (§6) |
|---|---|---|---|---|---|
| **旧 vidIQ 生成床** (legacy) | 9 首：`cinema-orient-01` `cpop-groove-01` `guzheng-calm-01` `lofi-chill-01` `lofi-upbeat-01` `oriental-edm-01` `underscore-docu-01/02/03` | 明文，已入库（历史） | vidIQ `generate_music` 输出，owner 的 vidIQ 方案，用于本频道视频（vidIQ 条款 2026-10-17 未重读） | **是** | `(AI-generated, vidIQ)` |
| **ElevenLabs 曲库** `el-*` | 10 首（§2） | **只存密文** `assets/music-vault/<name>.mp3.enc`；明文 `assets/music/el-*.mp3` 被 `assets/music/.gitignore` 忽略（§4） | ElevenLabs 付费期商用（含变现 YouTube）——**前提是 2026-10-17 账户确为付费方案，owner 尚未确认**（见下方待办）；付费期内生成的输出在取消订阅后仍可商用；付费方案无需署名；**不得**把输出作为曲库/目录提供给第三方（"Music Libraries & Repositories" 条款 → 仓库公开，所以加密）；不得用于电影/电视/电台 | **是** | `(AI-generated, ElevenLabs)` |
| **Wikimedia Commons** `wc-*` | 9 首授权已通过，**2026-10-17 尚未下载**（§2b） | 明文可提交（CC BY / CC0 允许再分发）——根 `.gitignore` 不忽略 `*.mp3`，`assets/music/.gitignore` 只忽略 `el-*.mp3` | 只收 CC0 / PD / CC BY 3.0 / 4.0，且上传者是作者本人或来自官方来源；**拒收** CC BY-SA / NC / ND | 否（真人创作；Tea Roots 为虚拟乐器制作，非 AI） | 曲名 + 作者 + manifest 里的**完整 attribution 行** |
| **owner YouTube 音频库** `yal-*` | 目前 0 首 | 明文（到货时） | YouTube Audio Library 条款：**只能用于 YouTube**（社媒母带必须去掉）；部分曲目要求署名（以音频库显示为准）。未核实：据报道音频库曲目不能用于 Studio 从长视频剪出的 Shorts | 否 | `"<title>" — <artist> (YouTube Audio Library)` |

授权证据与限制（不要删）：
- **ElevenLabs**（2026-10-17 生成，flow `9w5ReZxR7o3JISOREMPX`，模型 eleven_music_v2_5，instrumental=true）：
  条款原文来自官方页面的搜索摘录（代理挡住 elevenlabs.io，未能直接打开）：help center "Content generated
  during a paid subscription can be used commercially, and indefinitely"；Music Terms 按方案的 "Media Rights"
  授权，并要求遵守发布平台的 AI 内容披露政策。**owner 待办**：在 ElevenLabs 后台确认 2026-10-17 时账户是付费
  方案，并保存当期发票（API key 没有 user_read 权限，代理无法核实）。如果当时其实是 Free 方案，这 10 首只能
  非商用且必须署 "Created in collaboration with ElevenLabs" → 立即停用。每首的 node / generation id 写在
  manifest `provenance`，遇到 Content ID 认领时作为原创证明。取消订阅**之后**生成的音乐不能商用 → 取消后不再生成。
- **Commons**：每首入库前重读文件页 extmetadata（LicenseShortName / Artist / Credit）与 wikitext；
  `Guzheng Morning`（Antti Luode）**不收**：授权只来自作者的 Reddit 帖子，文件来源是一个 Google Drive 链接，
  无 VRT 票据，出处太弱。CC BY 曲偶有第三方误认领 Content ID → 附授权页链接申诉。
- 社媒母带（TikTok / Reels）仍按 config `output.socialExports` 出**无音乐干净母带**；若某版本带了我们的床：
  yal-* 绝不可以；el-* 可以（是我们自己的视频）但按该平台规则标注 AI 内容；wc-* 可以但署名写进文案。
- 硬规则不变：绝不用商业/流行音乐进管线（Content ID）；绝不下载别人的 YouTube/TikTok 音频。

## 2. 曲库 Library（2026-10-17）

| 文件 (assets/music/) | 来源 | 风格 | BPM | 长度 | 用途 (§5) |
|---|---|---|---|---|---|
| el-pov-walk-groove-01 | ElevenLabs | chill indie/lo-fi 步行律动 + 琵琶 | 95 | 60 s | **F2 首选** |
| el-acoustic-journey-01 | ElevenLabs | 原声吉他 + 葫芦丝 公路感 | 100 | 60 s | **F1 首选** |
| el-mountain-calm-01 | ElevenLabs | 空灵 pad + 箫，无鼓（待耳听确认） | 70 | 60 s | **F4 首选** |
| el-street-funk-01 | ElevenLabs | slap bass + 二胡 riff，小镇街头 | 110 | 60 s | F3 |
| el-hype-pluck-01 | ElevenLabs | phonk-lite/house + 拨弦 hook | 128 | 60 s | F3（价格冲击） |
| el-docu-underscore-04 | ElevenLabs | 平静纪录片垫底，钢琴 + 古筝 | 80 | 120 s | L |
| el-docu-underscore-05 | ElevenLabs | 好奇/轻快纪录片垫底，拨奏 + 笛子 | 105 | 120 s | L |
| el-silk-road-drums-01 | ElevenLabs | 沙漠手鼓 + 拨弦 | 100 | 60 s | 非 POV（F3/F4 沙漠） |
| el-cinema-reveal-02 | ElevenLabs | 弦乐 + 太鼓 + 二胡，~5 s 处重击 | 90 | 60 s | 非 POV（F4 reveal） |
| el-oriental-edm-02 | ElevenLabs | 现代电子 + 古筝笛子（EDM） | 105 | 60 s | 非 POV（F3/F4） |
| guzheng-calm-01 | vidIQ (旧) | 古筝/笛 ambient，0-17 s 安静前奏 | slow | 86 s | F4 / owner 重剪备用 |
| lofi-chill-01 | vidIQ (旧) | lofi | ~90 | 86 s | 备用 |
| lofi-upbeat-01 | vidIQ (旧) | lofi-chill-01 提速 18% | ~110 | 73 s | 备用 |
| cpop-groove-01 | vidIQ (旧) | 华语 R&B 器乐 | 100 | 58 s | 备用（F3） |
| oriental-edm-01 | vidIQ (旧) | 电子 + 民乐（有 drop） | 105 | 61 s | 非 POV 备用 |
| cinema-orient-01 | vidIQ (旧) | 弦乐 + 二胡古筝（中段 drop） | 90 | 60 s | 非 POV 备用 |
| underscore-docu-01/02/03 | vidIQ (旧) | 纪录片垫底 ~3 min | — | ~175 s | L 备用 |

- 旧 vidIQ 床 = owner 评价低 → 只作**备用**（某格式首选被轮换规则用完、或 vault 解密失败时）。
- 10 首 el-* **都还没人耳听过**：首次使用前抽听（有无人声、mountain-calm 是否真无鼓、cinema-reveal 重击位置）。
  oriental-edm-02 / mountain-calm-01 最后 ~3 s 淡出（不能无缝循环，结尾前裁掉或让它当结尾）；
  cinema-reveal-02 结尾不淡出 → 结尾加 fade-out；hype-pluck-01、silk-road-drums-01 开头即满音量。

### 2b. Commons 曲 `wc-*` —— 授权已通过，**音频尚未下载**

**状态 2026-10-17（诚实记录）：** MediaWiki API 可达，12:49Z 重读了 10 个文件页的 extmetadata + wikitext
（LicenseShortName / Artist / Credit / 模板 / 来源）；但 `upload.wikimedia.org` 对本出口 IP 返回 HTTP 429
（"Too many requests"，Retry-After 600 s）——12:49Z 与 12:59Z 两次尝试均失败，15 分钟预算用完，**0 首下载**
（同日 06:01-08:04Z 也全部 429）。所以库里目前**没有** wc-* 文件；§5 里的 wc 曲在下载入库前跳过，用同格式的 el-* 曲。

授权复核结果（9 首接受；上传者不是作者本人时，来源必须是作者官方发布）：

| 拟定文件 | 曲目 / 作者 | 授权 | Commons 文件页 | 风格 | 依据 |
|---|---|---|---|---|---|
| wc-travel-light-01 | Travel Light — Jason Shaw (Audionautix) | CC BY 3.0 | File:Audionautix-com-ccby-travellight.mp3 | 明快原声吉他（F2） | ToBeFree 自官网 audionautix.com 上传，作者署名声明 + "signed release form" |
| wc-acoustic-meditation-01 | Acoustic Meditation — Jason Shaw | CC BY 3.0 | File:Audionautix-com-ccby-acousticmeditation2.mp3 | 慢、平静民谣吉他（F1） | 同上 |
| wc-green-leaves-01 | Green Leaves — Jason Shaw | CC BY 3.0 | File:Audionautix-com-ccby-greenleaves.mp3 | 平静上扬（F4） | 同上 |
| wc-paper-wings-01 | Paper Wings — Jason Shaw | CC BY 3.0 | File:Audionautix-com-ccby-paperwings.mp3 | 慢、温暖（F4） | 同上 |
| wc-second-nature-01 | Second Nature — Jason Shaw | CC BY 3.0 | File:Audionautix-com-ccby-secondnature.mp3 | 中速放松（F1 车窗/骑行） | 同上 |
| wc-solo-acoustic-3-01 | Solo Acoustic #3 — Jason Shaw | CC BY 3.0 | File:Audionautix-com-ccby-soloacoustic3.mp3 | 独奏吉他（L） | 同上 |
| wc-cool-steel-breeze-01 | Cool Steel Breeze — Jason Shaw | CC BY 3.0 | File:Audionautix-com-ccby-coolsteelbreeze.mp3 | 轻快（F2） | 同上 |
| wc-death-valley-waltz-01 | Death Valley Waltz — Lucas Gonze | CC0 | File:Lucas_Gonze_-_01_-_Death_Valley_Waltz.ogg | 独奏吉他华尔兹 | 来源 = 作者本人 FMA 发布（Ghost Solos），{{Licencereview}} 已复核 |
| wc-tea-roots-01 | Tea Roots — Kevin MacLeod (incompetech.com) | CC BY 3.0 | File:Tea_Roots_(ISRC_USUAN1100472).mp3 | 雷鬼 + 二胡，73 BPM，虚拟乐器 | Fæ 自 incompetech.com 官方上传；仅作中国味备选 |
| ~~Guzheng Morning~~ — Antti Luode | — | CC BY 3.0 | File:Guzheng_Morning_(Antti_Luode).mp3 | — | **拒收**：出处太弱（§1） |

入库时 `--attribution` 原样使用（Audionautix 7 首把曲名替换进同一格式）：
- Audionautix：`Music: "<Title>" by Jason Shaw (Audionautix), licensed under CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/) - source: https://commons.wikimedia.org/wiki/File:<file> - converted to MP3/edited for this video - required credit: "music by audionautix.com"`
- Lucas Gonze：`Music: "Death Valley Waltz" by Lucas Gonze - CC0 1.0 (public domain dedication, no attribution required) - https://commons.wikimedia.org/wiki/File:Lucas_Gonze_-_01_-_Death_Valley_Waltz.ogg`
- Kevin MacLeod：`Music: "Tea Roots" by Kevin MacLeod (incompetech.com), licensed under CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/) - source: https://commons.wikimedia.org/wiki/File:Tea_Roots_(ISRC_USUAN1100472).mp3 - converted to MP3/edited for this video - required credit: "Tea Roots Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 3.0"`

下次重试（换一天；不是每日 run 的必做步骤）：先用 API 重读授权
（`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|sha1|extmetadata&titles=File:<file>`，
带描述性 `User-Agent`，如 `CHINATRAVEL-music-ingest/1.0 (https://github.com/jackson242242/Claude-code)`），
再 `curl -fL -A "$UA" -o <dir>/<file> "<imageinfo url>"` 并核对 sha1；429 时按 Retry-After（≥60 s）暂停，总共 ≤15 分钟。
然后 `node scripts/ingest-music.mjs --in <file> --prefix wc --name <slug> --style <style> --mood <m>
--source "Wikimedia Commons" --license "<CC BY 3.0 | CC0>" --title "<Title>" --artist "<Artist>" --attribution "<上面的行>"
--sourceUrl <文件页>`，`git add` 即可（wc-* 不被忽略，不需要 `-f`），并把本表"状态"改成已入库。

## 3. AI 披露 AI disclosure（决定 D1）

YouTube Help（answer/14328491）把"合成生成音乐"列为需要 altered/synthetic 披露的例子。我们现有的床
**全部是 AI 生成**（9 首旧 vidIQ + 10 首 ElevenLabs）。规则：
1. 每次上传的 `meta.json` 必须写 `"music"`：本片用到的床文件名（字符串或数组；无音乐写 `"none"`）。
2. `scripts/youtube-upload.mjs` **自动**决定 `status.containsSyntheticMedia`：任一音乐在 manifest 中
   `aiGenerated: true`、或是 9 首旧床之一、或含 AI 画面（`meta.aiFootage`）、或 `--synthetic` → `true`。
   `meta.music` 缺失或不认识 → 警告并按 `true` 处理（fail-safe）。`aiFootage: true` 却显式写
   `containsSyntheticMedia: false` → 上传前中止。
3. 真人曲（`yal-*`、`wc-*`）本身不触发披露；同片里只要还有一首 AI 床，仍为 `true`。
4. 描述署名也要诚实写 "AI-generated"（§6）。
5. 旧视频回填（`scripts/apply-synthetic-flag.mjs`）：2026-10-17 13:13Z 一次测试误跑，**最新 35 条已标为 AI 合成内容**（标注属实：都用了 AI 配乐；记录在 `state/synthetic-flag-queue.json`）。其余 291 条等 owner 决定（D4）。脚本现在必须加 `--apply` 才会写入，routine 永不运行它。

## 4. 加密曲库 Vault workflow（决定 D2）

仓库是**公开**的：ElevenLabs 条款禁止把输出做成对外曲库，公开文件也可能被陌生人登记进 Content ID。所以：
- **每次 run 开始（任何渲染之前）**：`node scripts/music-vault.mjs decrypt --all`
  → 把 `assets/music-vault/*.mp3.enc` 解密到 `assets/music/el-*.mp3`（已被 git 忽略）。
  需要环境变量 `YOUTUBE_CLIENT_ID`（routine 已有）。退出码 2 = 变量缺失；3 = GCM 校验失败（密钥不对或文件损坏）；
  4 = **拒绝写明文**：写入前用 `git check-ignore` 确认目标路径被忽略，未被忽略（或无法检查）就不写，并删除该路径上
  与密文一致的旧明文（可随时重新解密）——防止 routine 最后的 `git add automation/youtube/` 把明文推上公开仓库。
  解密失败**不停更**：当天改用 wc-* / 旧床，并在日报里写明。
- 两个忽略文件必须和密文**同一个 commit** 提交、永不删改其中规则：`assets/music/.gitignore`（`el-*.mp3`、`*.tmp-*`）
  与 `assets/music-vault/.gitignore`（`*.tmp-*`，写入中途崩溃留下的临时文件 `<name>.tmp-<pid>`）。
- `node scripts/music-vault.mjs list` 查看曲库与明文是否已就位（不需要密钥）。
- **绝不** `git add -f` 任何 `el-*.mp3`；不把明文 el-* 发到聊天或任何共享位置。渲染出的视频本身可以发布（自用）。
- 新 ElevenLabs 曲（仅限取消订阅前、用已付额度、owner 确认余额后）：`ingest-music.mjs --prefix el …` →
  `node scripts/music-vault.mjs encrypt --in automation/youtube/assets/music/el-<name>.mp3`（`--in` 相对当前目录，
  routine 在仓库根目录运行；同时把 manifest 的 `vault` 改为 true）→ 只提交 `.enc` + manifest。
- 密钥 = scrypt(`YOUTUBE_CLIENT_ID`, "chinatravel-music-vault-v1", 32)，AES-256-GCM。若 OAuth client 更换：
  先用旧值解密（`OLD_ID=… node scripts/music-vault.mjs decrypt --all --key-env OLD_ID`），再用新值逐首 `encrypt`。
  诚实说明：OAuth client ID 不是强机密（会出现在授权链接里），加密的目的是"不在公开仓库里提供可直接下载的曲库"，
  不是对抗拿到 client ID 的人。若 owner 以后把仓库改为私有，流程不变。

## 5. 按格式配乐 + POV 声音规则 Per-format pairing & POV audio

| 格式 | 首选（按序轮换，选最久未用） | 音乐音量 | 说明 |
|---|---|---|---|
| **F1** owner 素材 | 现场声为主；el-acoustic-journey-01 / wc Acoustic Meditation / wc Second Nature | 保留原声时 ≤0.3；音轨已被替换的旧成片（owner-recut）用平静床 0.85 | 不用 EDM drop；SFX off |
| **F2** 授权 POV | el-pov-walk-groove-01 / wc Travel Light / wc Cool Steel Breeze | 有原声 0.3-0.4（`--keep-audio 0.6 --music-volume 0.35`）；无原声 0.6-0.7 | 不用 EDM drop；`--sfx none` |
| **F3** 价格卡 | el-street-funk-01 / el-hype-pluck-01（备用 cpop-groove-01） | 0.6-0.7 | 可卡点 |
| **F4** 自然 | el-mountain-calm-01 / wc Green Leaves / wc Paper Wings（备用 guzheng-calm-01） | 0.6-0.8 | Guzheng Morning 不收（§1） |
| **L** 指南 | el-docu-underscore-04/05 / wc Solo Acoustic #3（备用 underscore-docu-01..03） | 垫底（旁白下） | 按章节换曲，不循环 |

wc-* 曲在下载入库（§2b）之前跳过，用同一行的 el-* 曲；旧床只作备用（§7）。

POV 规则（F1/F2 硬规则）：
1. **现场声优先**：保留素材/owner 原声（`--keep-audio`），音乐只垫底。
2. **F1/F2 不用 EDM drop、不用重鼓床**：oriental-edm-01/02、cinema-orient-01、cinema-reveal-02、
   silk-road-drums-01 只用于非 POV 片（F3/F4）。POV 片按脚步/自然动作剪，不按 drop 剪。
3. 保留任何原声前**逐段检查**店铺/街头艺人/商业音乐，有就静音那段（`--clips` JSON 每段的 `"mute": [[t1,t2]]`）
   ——Content ID 红线。
4. F1/F2 关掉 SFX pop（`--sfx none`）。
5. owner 旧成片重剪（音频里已混有旧音乐）：整轨替换为平静床 0.85（`scripts/owner-recut.py`），不用 EDM drop；
   原始文件到了以后：用现场原声，音乐 ≤0.3 或不要。guzheng-calm-01 从 17 s 起用（前奏太安静）。

## 6. 描述署名 Credit lines（每条描述，hashtags 之前，每首一行）

- 旧 vidIQ 床：`🎵 Music: <title> (AI-generated, vidIQ)` —— 例：`🎵 Music: Lofi Chill 01 (AI-generated, vidIQ)`
- ElevenLabs：`🎵 Music: <title> (AI-generated, ElevenLabs)` —— 例：`🎵 Music: POV Walk Groove 01 (AI-generated, ElevenLabs)`
- Commons：`🎵 Music: "<title>" by <artist>`，下一行原样贴 manifest 的 `attribution`（含授权链接、来源页、
  "converted to MP3/edited"；Audionautix 曲必须含 `music by audionautix.com`）。CC0 曲可只写第一行，但仍建议写来源。
- YouTube 音频库：`🎵 Music: "<title>" — <artist> (YouTube Audio Library)` + 音频库要求的署名文字（如有）。
- `<title>` 一律取 manifest 的 `title`；绝不写成商业歌曲名，绝不提我们没嵌入的热门歌。

## 7. 轮换与节拍 Rotation & beat lock

1. 同一天不重曲；相邻两天同槽位不重曲；滚动 3 天内同曲 ≤2 次（查 published.json 的 `meta.music` / lanes）。
2. 在 §5 该格式的首选列表内选"最久未用"；首选全被规则排除时才用备用（旧 vidIQ 床）。
3. 卡点（非 POV 片）：`--seg-seconds` ≈ 一小节 = 240 / BPM：70→3.4 s，80→3.0，90→2.7，95→2.5，100→2.4，
   105→2.3，110→2.2，128→1.9。BPM 是生成时的提示目标，不是实测值——以耳朵为准。

## 8. Add Sound 列表 / 热门音源

- 清单：`automation/youtube/state/add-sound-list.md`（2026-10-17 调研，带日期与证据；约 6 周后过期）。
  **owner 必须先在 Shorts "Add sound" 搜索里确认该音源存在**，不存在就跳过。
- 热门标签歌只能在 YouTube App 创建 Short 时添加（API 上传后无法再加；Studio Editor 只提供音频库曲）。
  要用热门音源的 Short：渲染**无音乐**版本交给 owner 在 App 里上传 + Add sound，不走 API 上传。
- 管线永远不嵌入这些歌。是否允许 owner 手动添加平台授权的商业歌，由 owner 决定（与"禁止商业音乐"硬规则的关系）。
- v2.0 起不再每天逐条提示 ADD SOUND（计划 §9）；owner 需要时查清单即可。

## 9. 新曲入库 Adding tracks

- `node scripts/ingest-music.mjs --in <file> --prefix el|wc|yal|vq --style <code> --bpm <n> --mood <m>
  --source "…" --license "…" --attribution "…" --title "…" --artist "…" [--name <slug>] [--ai-generated true|false]
  [--provenance '<json>'] [--sourceUrl <url>]` → loudnorm −16 LUFS、192k mp3、写 manifest（`aiGenerated`，`vault: false`）。
  `--ai-generated` 只接受 `true` / `false`；`--prefix el|vq` 拒绝 `--ai-generated false`（AI 曲必须披露，D1）。
  文件名的 `-NN` 后缀总会保留（只截短前面的部分，上限 40 字符）。
- el-* 入库后立刻 `music-vault.mjs encrypt`（§4）。wc-* 入库前重读授权（§1），可明文提交（`git add` 即可，不需 `-f`）。
- 每首首用前抽听；新床加进 §2 与 §5。

## 10. v2.0 删除的规则 Removed in v2.0

- **每月 vidIQ 生成音乐：删除**（vidIQ 余额底线 40；2026-09 曾被月度生成烧到 0）。不再生成 vidIQ 床；v1 §4 生成规范作废。
- "oriental-edm → 线路/航拍地貌 reveal" 配对删除（不再航拍开场，POV 优先）。
- "yal-* 永远优先" 删除（库里没有 yal-*；yal-* 只能用于 YouTube）。
- `(royalty-free bed)` 署名删除 → §6 按来源署名并写明 AI-generated。
- v1.0（2026-08-12）的调研结论"现代节拍 + 中国乐器点缀"仍适用于非 POV 的 F3/F4，不适用于 F1/F2。
