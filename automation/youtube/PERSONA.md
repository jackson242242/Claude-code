# PERSONA.md — 频道人设圣经 v1.0 (2026-08-09, owner directive)

> 定位：**Your China Travel Expert 🧭 你的中国旅游专家** — 面向英语观众。
> 每条视频必须有一个让观众记住的点，而这个点永远是同一个：这是位真懂中国的旅游专家。
> 本文件是元数据/文案/语言的唯一权威；youtube-cycle.md 引用本文件。

## 1. 人设核心
- 一句话：*"Real food, real streets, real prices — mapping ALL of China, zero tourist traps."*
- 记忆点签名（三件套，处处出现）：
  1. **🧭 Expert Tip** — 每条视频描述里一条可执行的旅行内行建议（视频内为倒数第二条
     字幕 cue，前缀 `★ Expert Tip:`，烧录字体无 emoji 字形故用 ★）
  2. **固定签名块**（每条描述一字不差）：
     ```
     —
     I'm mapping ALL of China — real food, real streets, real prices, zero tourist traps.
     Route guides & trip-planning drops are coming: subscribe and check the channel page.
     🧭 Your China Travel Expert | 你的中国旅游专家
     ```
  3. **🧭 图标** — 频道描述、歌单描述、置顶评论（待 force-ssl 授权）统一使用
- 诚实边界不变：不编造事实/价格/数字；不承诺流量；AI/库存素材照旧披露。

## 2. 语言规则（owner 2026-08-09：面向英语观众）
- **标题**：英文先行、事实钩子开头、≤95 字符；结尾可缀 2-6 字中文点缀（`| 热干面`）
- **描述**：英文为主体；保留一行中文原钩子（中文风味 + 中文搜索）；签名块双语
- **字幕**（今后制作）：每条 cue 英文在上为主行，中文第二行；风格照 STYLE.md v2.2
- **tags**：英文核心词库优先（见 §5），中文 ≤2-3 个
- **defaultLanguage: en**；categoryId：旅游/美食/文化=19 (Travel & Events)，教育旧片=27

## 3. 每条视频描述模板（新制作与改造通用）
1. 英文钩子行（疑问或反差事实）
2. 2-3 句英文正文（只用已核实事实）
3. `🧭 Expert Tip: …`（可执行、有据；无据时用 "Save this one for your {city} food stop."）
4. 一行中文原钩子
5. 固定签名块（§1）
6. 素材出处/AI 披露行原样保留
7. hashtag 行（恰 4-5 个）：`#Shorts #ChinaTravel` + 2 个视频专属英文 + 可选 1 个中文

## 4. TikTok / IG Reels（owner 2026-08-09）
- **每日新片**：流水线额外输出 `<slot>-clean.mp4` 干净母带（无音乐垫底——YAL/衍生
  音轨授权仅限 YouTube，不得带去别的平台）+ `social-caption.txt`（英文钩子 + 3-5 个
  tag：#chinatravel #traveltok (+#foodtok) + 专属，无 #Shorts，≤300 字符）；
  当日 4 条母带经对话框发老板，老板端上传时**在 App 内加平台热门音乐**（授权干净
  且对推荐更有利）
- **存量 120 条**：runs/ 目录存有每条的剪辑脚本+字幕 → 可忠实重渲干净母带。
  队列 `state/social-export-queue.json`（按播放量降序）；例行 run 每天顺带重渲 2 条
  发对话框；老板也可随时在对话里点名要某几条（互动会话一次可出 ~10 条）。
  注意：从 YouTube Studio 下载的成片带 YAL 音乐，**不要**直接传 TikTok/IG。
- 竖屏 9:16 1080p30 两平台通吃；字幕已烧录，无需改版式

## 5. 英文 SEO 词库（tags/标题用）
core: china travel · china travel expert · china food · chinese street food ·
china travel guide · travel china · things to do in china · china travel tips ·
china city walk; 按片补: 城市名英文 · 菜名英译 · dim sum / hotpot / noodles /
street food tour / hidden gems china

## 6. 赚流量打法（上载策略）
1. **节奏**：4 条/天 @13/16/19/22Z 不变（覆盖欧美时段）；连载 + 系列歌单 = 追剧结构
2. **钩子**：英文 fact-first（数据已证 ~4x 优于 place-first）；标题公式见 §2
3. **互动**：猜地名/猜价格格式 + either-or 提问收尾；置顶评论揭晓答案（需 force-ssl
   重授权，见 §8 owner 待办）
4. **跨平台**：TikTok/IG Reels 二次分发（§4），App 内热门音乐；主页互链
5. **SEO**：英文词库全量铺 tags/标题/描述；旅游类目 19
6. **里程碑**：500 订阅解锁社区 tab（现 35）→ 投票/预告再拉一层互动
7. **实拍优先**：老板实拍 > 库存快剪（REAL-FOOTAGE.md），真人反应是最强素材
8. **一致性**：🧭 三件套让"中国旅游专家"在每个触点重复出现

## 7. 私域转化（流量 → 自有阵地，分四步走）
- **S1 现在**：每条描述含"Route guides coming → check the channel page"，转化位就绪
- **S2 老板选一个阵地**（建议：英语受众首选**免费邮件列表**（beehiiv/Substack），
  次选 Telegram 频道）→ 链接放频道头部链接位 + About + TikTok/IG bio；
  **每条视频描述不用改**（都指向 channel page，一次挂链全量生效）
- **S3 引流磁铁**：《First-Timer's 7-Day China Route》免费 PDF（我用已核实研究库
  起草）→ 换邮箱订阅
- **S4 线路内容**：老板之后上载的旅游线路玩法 = 系列化（每城一张歌单）+ 片尾
  "full printable route → channel page"闭环
- 诚实声明：不保证转化数字；私域平台注册需老板亲自操作（涉账号所有权）

## 8. 频道层对齐（2026-08-09 执行）+ owner 待办
- 频道描述/keywords 英文先行改写（已执行，见 git log）；26 个系列歌单标题英文
  先行翻转 + 统一人设描述（已执行/配额内滚动）
- 120 条存量视频元数据分 3 天滚动改写（配额 10k/天，例行 run 需留 ~7k）：
  D1 频道+歌单+top30，D2 55 条，D3 余量；进度在 `state/metadata-retrofit-queue.json`
- **Owner 待办**：
  1. 频道名建议改为 *"Your China Travel Expert"*（现 NYNEIGHBORHOOD 与人设割裂；
     handle @nyneighborhood 可后续再议）——你一句话我就执行
  2. 私域阵地二选一（邮件列表 / Telegram）
  3. OAuth 重授权加 `youtube.force-ssl` scope（5 分钟，解锁置顶评论=猜地名揭晓+
     Expert Tip 置顶）
  4. 5 个个人歌单（KPDH/Playlist/Home cooking/Thomas soccer/Netherland trip）建议
     设为私享，频道页更聚焦（不动内容，只改可见性）——需你确认
