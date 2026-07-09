# AEO 方案 — 让 AI 引擎发现并引用 @NYneighborhood 的内容
> 2026-07-08 · 基于双线研究（AEO 有效性证据 + Webflow 能力核实），来源见文末。
> 结论：**不需要 Webflow。** 用现有流水线零成本自动生成"频道伴侣站"，效果更好且全自动。

## 一、研究结论（证据要点）

**AEO 里真正有效的（2026 年中，有数据支撑）：**
1. **YouTube 已占 AI 助手答案的 ~25% 引用**——但 AI 引擎更爱引"视频 + 网站上的文字稿页"组合，纯 YouTube 描述权重低。标准打法 = 每支视频配一个网站文字页（transcript/摘要/FAQ）+ IndexNow 通知。
2. **复合结构化数据**（Article + FAQPage + VideoObject + Breadcrumb）引用率是单一 schema 的 2 倍；FAQPage 在相关查询里引用率 67%。
3. **新鲜度统治一切**：AI 引用的内容 50% 不超过 13 周；超过 90 天不实质更新就掉出引用池。
4. **Bing 是 ChatGPT 的地基**：ChatGPT Search 引用 87% 与 Bing 前排结果重合 → Bing Webmaster Tools + IndexNow 是必做的"管道工程"。
5. **robots.txt 要放行"检索型"爬虫**（OAI-SearchBot、Claude-SearchBot、PerplexityBot、Google-Extended）——放行者 90 天 AI 流量 +186%（行业数据，方向性参考）。
6. **llms.txt**：Anthropic/Perplexity 读、Google 明确不读；实测提升温和（~10-15%）。做，但别指望奇迹。
7. **答案前置写法**：55% 的 AI 引用取自页面前 30%；首段 150 词内给直接答案；带统计数字 +30%、带引言 +41%。

**什么保证不了（诚实边界）**：没有任何可信来源保证具体引用量/流量；成熟程序的方向性数据是 6 个月 3-6 倍引用率提升；AEO 放大好内容，不能替代好内容；76% 的 Google AI Overview 引用来自本身就排 Google 前十的页面——新站先从 Bing/Perplexity/Claude 生态吃到引用。

**Webflow 核实结果**：
- "Webflow AEO" 是官方产品（2026-04 发布），但智能 AEO 套件（引用监测+建议+执行 agent）在 **Team 档 $2,500/月起**。
- 普通 CMS 档（$23/月）只有：llms.txt 上传（还有 MIME 类型瑕疵）、schema 标记、可爬静态页——**这些我们自己 5 分钟能做且做得更好**（静态生成页 JS 体积 0-15KB vs Webflow 180-350KB，Lighthouse 95-100 vs 60-80）。
- 结论：Webflow 适合没有代码能力的团队；我们有会写代码的流水线，Webflow 是纯多余成本。

## 二、方案 A（推荐 ⭐）：流水线自动生成"频道伴侣站"

**是什么**：一个自动生成的静态网站，每支视频一个页面，由每日循环自动维护。

**每个视频页包含**：
- 首屏 150 词"直接答案"摘要（answer-first）
- 嵌入视频 + 完整文字稿（测试线含中英双语）
- 由脚本自动衍生的 3-5 条 FAQ（问答式，AI 最易摘取）
- 来源链接（脚本本来就带）、作者/About 页（E-E-A-T 信号）
- 复合 schema：Article + FAQPage + VideoObject + BreadcrumbList

**站点管道工程**：
- robots.txt 放行检索型 AI 爬虫；llms.txt + llms-full.txt；自动 sitemap.xml
- 每次发布视频 → 生成页面 → 自动部署 → **IndexNow ping Bing**
- 每日研究环节给 >90 天的页面排刷新（对齐 13 周新鲜度规律）

**老板一次性动作（约 15 分钟）**：
1. 选托管：GitHub Pages（免费，本仓库直出）或 Render 静态站（你已在用 Render）
2. （可选但推荐）买个域名 ~$12/年（自定义域对 E-E-A-T 有利；先用免费子域也能起步）
3. 注册 Bing Webmaster Tools + Google Search Console，验证站点（我给逐步指引）

**成本**：$0（+ 可选域名 $12/年）。**工期**：agent 1-2 天建成，之后全自动。

## 三、方案 B（不推荐但如实列出）：Webflow CMS $23/月
手动/半自动维护 CMS 条目，AI schema 自动生成 + llms.txt 上传。适合想要可视化编辑的场景；每支视频需要手动录入或另写 Webflow API 集成（工作量反而大于方案 A）。$2,500/月的 AEO 智能套件对 21 订阅的频道毫无性价比。

## 四、时间线与度量（诚实版）
- 月 1：建站 + 管道工程 + 存量 3 支视频页面上线
- 月 2-3：每天 3 页积累（~90 页/月），Bing AI Performance 报告开始有读数
- 月 4-6：预期开始出现 AI 引用（Perplexity/Claude/Copilot 先于 Google）
- 度量位：Bing Webmaster「AI Performance」报告 + GSC AI Overviews 展示数 + 每周一/四复盘顺带记录
- **不承诺任何具体数字**；伴侣站同时是频道的 SEO 资产（普通搜索也受益）

## 五、待老板拍板
1. 批准方案 A？
2. 托管选 GitHub Pages 还是 Render？
3. 现在买域名吗（建议：先免费子域起步，内容过 50 页再买）？

---
研究来源（节选）：Webflow 官方 AEO 公告与帮助文档、Bing Webmaster AI Performance（2026-02）、Google GenAI Performance Reports（2026-06）、Presenc AI《State of llms.txt 2026》、GlobeRunner/StackMatix/Frase 等 AEO 实证汇编、WERSM《AI Search Rewarding YouTube Creators》。完整链接在两位研究员的报告原文中。
