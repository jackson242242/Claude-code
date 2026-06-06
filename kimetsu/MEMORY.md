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

## 1. 待办 / 进行中
- [ ] 老板在 web 建 3 条 routine（Thomas 06:00 → Alex 09:00 → Minji 11:00 建议）。
- [ ] 第一轮试跑：Thomas 给选曲候选+情绪选题 → Alex 出第一份分镜+文案 → Minji 出排期。
- [ ] 老板用免费工具试剪第一条，验证成片包是否"可直接执行"，回填体感反馈。
- [ ] 沉淀情绪选题库 / 商用替代曲库 / 钩子库（见 PLAYBOOK §8 Backlog）。

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
