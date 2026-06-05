# Moodboard & Festival-Asset Workflow (design/moodboard-workflow.md)

> 如何用**外部工具**生产图片/动画/视频，并接入本仓库。
> **诚实声明：** 步骤 1–3 的生成工具在本代码环境**之外**运行（无图像/视频生成能力），需老板/设计师执行；
> 仓库侧（步骤 4，主控+实现 agent）负责把产物接入并过门禁。

## 四个情绪板方向（Sheng 简报，供检索/生成参考）
1. **球场圣殿 Stadium Cathedral** — 仪式感/百年传统。关键词：`stadium tunnel light rays dark`、`empty illuminated stadium night aerial`。基调：极深黑 + 聚光白 + 翠绿场地。
2. **球迷海洋 Fan Tide** — 集体狂喜/噪音可视化。关键词：`world cup fan crowd tifo night lights`、`sea of flags`、`goal celebration crowd`。基调：深蓝夜 + 品红焰火 + 橙暖。
3. **城市节庆 City Festival** — 街头狂欢/多元。关键词：`world cup street party city fans`、`fan zone night festival outdoor screen`。基调：城市霓虹 + 深色托底 + 每城一 accent。
4. **数字仪式 Digital Kickoff** — 体育数据美学。关键词：`sports data visualization dark ui`、`match countdown scoreboard`。基调：纯黑 + 电蓝 + 聚光绿。

## 流水线

### 步骤 0 · 自动化路径（agent + OpenAI Images）【已就绪，待权限】
让 agent 直接出图，而非只写 CSS：
- **脚本：** `scripts/generate-asset.mjs`（Node 22 内置 fetch，无新依赖）。
- **入口命令：** `/design-asset`（`.claude/commands/design-asset.md`）——agent 据 DESIGN.md 拟 prompt → 调 API 出图 → 接入组件 → 跑门禁 → 开 PR（不自动合并，主控/老板审图）。
- **用法：** `node scripts/generate-asset.mjs --prompt "..." --out public/images/hero-bg.webp --size 1536x1024 --quality medium`
- **老板需授予的两项权限（缺一即报错）：**
  1. 环境 **Network access → Custom** 放开 `api.openai.com`（或设 Full）。
  2. 环境 **Variables** 里加 `OPENAI_API_KEY`（**作密钥，别贴聊天/进仓库**）。
- **内容硬规则：** 不出真实 logo/商标（FIFA/World Cup/俱乐部徽）、不出真实球员肖像、不涉政治/法律；只出通用球场/球迷/城市/节日意象。文字压图必加深色蒙版保 WCAG AA。
- **成本/诚实：** 出图消耗老板 OpenAI 账户额度；本环境在未授权前**无法运行/测试**，授权后由 agent 或 Routine 触发。


- prompt 例：`dark cinematic stadium tunnel, one beam of light, deep teal and orange, no people, --ar 16:9 --style raw --v6`。
- 处理：`cwebp -q 85` 压成 WebP，≤200KB。
- 交付：`public/images/hero-bg.webp`。

### 步骤 2 · 动效（Confetti / 进球脉冲）
- 工具：After Effects + Bodymovin → Lottie，或 LottieFiles 编辑器。
- 配色取节日色：橙 `#FF6B35` / 品红 `#E91E8C` / 蓝 `#00C2FF` / 金 `#F0B429`。
- 交付：`public/animations/confetti.json`（≤15KB，loop=false）、`goal-pulse.json`（≤5KB）。
- 接入：`npm i lottie-react` → `<Lottie animationData={confetti} loop={false} />`，`prefers-reduced-motion` 时不渲染。

### 步骤 3 · 视频（可选 Hero 背景）
- 工具：Runway Gen-3 / Pika 1.5。
- 处理：`ffmpeg -i in.mp4 -c:v libvpx-vp9 -b:v 800k out.webm`；WebM ≤800KB + MP4 fallback ≤1.5MB。
- 交付：`public/videos/hero-loop.webm` + `.mp4`，`<video autoplay muted loop playsInline>`，reduce-motion 退化为静态图。

### 步骤 4 · 仓库侧接入（主控 + 实现 agent，本环境内）
1. 产物放入 `public/` 正确路径。
2. `globals.css` 新增节日色 token：`--color-festival-orange/magenta/blue/gold`。
3. 新增组件 `<CelebrationConfetti/>`、`<HeroVideoBackground/>`（均 reduce-motion 友好）。
4. 跑 `npm run typecheck && npm test && npm run lint` → 通过后 PR → 主控审 → 上线。

## 备注
- **纯 CSS 优先**：Hero 双径向光晕、卡片进球脉冲、轻量 confetti 都可纯 CSS 实现（见 `/tmp/preview/matchday26-festival.html`），无需等外部素材即可先上一版；图片/视频/Lottie 作为后续增强。
- 版权：不用真实球场照片；Hero 用 CSS 渐变模拟"绿场+橙看台"双色光晕。
- 内容边界：遵守 DESIGN.md / CADENCE §3——无政治/法律内容。
