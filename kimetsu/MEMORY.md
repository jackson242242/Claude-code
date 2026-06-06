# 鬼灭混剪工作流 记忆 (kimetsu/MEMORY.md)

> 跨运行记忆 / 决策日志。每轮 agent**先读后写**。维护者：主控 Claude。最后更新：2026-06-06。
> 配套：`kimetsu/PLAYBOOK.md`（治理+流水线+护栏）。本项目独立于根目录 Matchday26。

## 0. 现状快照（2026-06-06）
- **项目已搭好脚手架**：3 个 agent 命令（`/thomas-research`、`/alex-cut`、`/minji-ops`，均 Sonnet）
  + `kimetsu/PLAYBOOK.md` + 本文件 + 输出目录 `research/`、`briefs/`、`ops/`。
- **渲染引擎已跑通**：`scripts/render-mashup.mjs`（ffmpeg via ffmpeg-static，无需 credential）
  + manifest schema（`kimetsu/briefs/manifest.schema.md`）+ 源素材投放区 `kimetsu/assets/`（gitignore）。
  已用合成素材验证：输出真实 1080×1920、40.0s、烧入中文字幕（libass，drawtext 在本静态构建缺失故走 ASS）、
  H.264/AAC、+faststart。`npm run render -- --manifest ... --out ...`。
- **尚未跑过真实一轮**（需 owner 备真素材到 `kimetsu/assets/<date>/`）；尚无发布数据。
- **发布路径（owner 选定）**：投递+提醒，owner 一键发。引擎=ffmpeg。所选默认**无需新 credential**
  （Drive/Gmail/Calendar/Canva 已连）。YouTube 自动上传待 owner 给 OAuth 再建；TikTok/小红书无 API，手动发。
- **定时机制**：待老板在 claude.ai/code/routines 建 3 条 daily routine（见 PLAYBOOK §7）。**agent 无法代建。**
- **硬约束（如实）**：agent 能按 owner 素材自动剪，但不能凭空变素材、不能自动发 TikTok/小红书、不保证涨粉；
  版权无法 100% 免责（默认商用曲库+转化式二创降险，残余风险归账号主体）。

## 0b. 沙箱网络现状（关键，2026-06-06 实测）
- **放行**：github.com、pypi.org（可 clone/pip）。**挡（403）**：Pexels/Pixabay、speech.platform.bing.com(edge-tts)、onrender。
- 故 fetch-stock / voiceover / generate-broll 在**本沙箱跑不通**（缺 key 或域名被挡），但脚本已建好、fails-closed，**本地或放行环境可跑**。
- **唯一在沙箱内全程可跑的视觉源** = `generate-visuals.mjs`（纯 ffmpeg，零网络）→ 已用它出过真·成片(34.6s)。
- MoneyPrinterTurbo（harry0703）：已评估。口播品类、依赖 Pexels+LLM，整体不适配动画 edit；**只摘了 edge-tts 旁白+字幕**思路 → `voiceover.mjs` + 引擎 `voiceover`/`subtitlesFile`。

## 1. 待办 / 进行中
- [x] 种草体系落地：`kimetsu/ops/seeding-kit.md`(可复制文案+社区+前60min协议+KPI) +
      `scripts/measure.mjs`(从 metrics.csv 算完播/互动/收藏/转发/涨粉转化+种草指数+杀/扩判定，已用样本验证) +
      `kimetsu/ops/metrics.csv`(模板)。衡量标准：单条 收藏≥2%&转发≥1%&完播≥70%；账号看周环比种草指数+涨粉/千。
- [x] 渲染引擎升级：图片 Ken Burns 运镜 + 可选交叉淡入淡出(xfade) + 自动封面缩略图。已测：
      38.8s=40-2×0.6 转场算式正确，运镜帧差 YAVG0.55(非零=真动)，cover.jpg 导出。
- [x] AI 原创画面线：`scripts/generate-broll.mjs`（OpenAI Images→竖版原创静图）。已测无 key 清晰报错、
      角色名黑名单拒绝（"炭治郎"被挡）。待 owner 配 `OPENAI_API_KEY` 才能真出图。
- [x] 一页开机清单 `kimetsu/SETUP.md`（Routines + 素材三选一 + 凭据按需 + 发布如实）。
- [ ] **老板动作**：在 web 建 3 条 routine（见 SETUP.md A）；选素材路线（推荐 C：配 OPENAI_API_KEY）。
- [ ] 第一轮真跑：Thomas 选曲/选题 → Alex 出分镜+文案+manifest+(生图或自备素材)自动渲染 → Minji 排期。
- [ ] 沉淀情绪选题库 / 商用替代曲库 / 钩子库（见 PLAYBOOK §10 Backlog）。

## 2. 已发布作品台账（真实数据，发一条记一条）
> 格式：日期 | 选题/情绪 | 角色 | 曲(来源/授权) | 平台 | 播放/点赞/涨粉(真实) | 复盘
- （暂无）

## 3. 选题/曲目去重记录（避免重复）
- 已用选题：（暂无）
- 已用曲目：（暂无）

## 4. 复盘与学习（每周读真实数据后更新）
- （暂无）

## 5. 关键决策日志
- 2026-06-06：确立 3-agent 流水线（Thomas→Alex→Minji），全 Sonnet；音乐默认走商用安全曲库(A)，
  原版热门(B)仅老板明确接受风险时用；画面走转化式二创+署名+合规检查单。
