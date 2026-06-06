# 鬼灭混剪工作流 · 一页开机清单 (kimetsu/SETUP.md)

老板照这个清单走一遍即可让"每日自动产片"跑起来。详细规则见 `PLAYBOOK.md`。

## A. 三条每日 Routine（只有你能在网页建；agent 建不了）
去 **claude.ai/code/routines → New routine**，建三条 daily，Prompt 直接填命令：

| # | Prompt | 建议触发时间 | 作用 |
|---|--------|------------|------|
| 1 | `/thomas-research` | daily 06:00 | 选曲候选(授权状态)+情绪选题+行业信号 |
| 2 | `/alex-cut`        | daily 09:00 | 出分镜+文案+manifest，**自动渲染成片**，投递给你 |
| 3 | `/minji-ops`       | daily 11:00 | 发布排期(最佳时间)+种草+Calendar 提醒 |

- 顺序要 Thomas→Alex→Minji（错开时间即可）。分支只推 `claude/` 前缀。
- Routines 每日有运行上限且吃订阅额度，三条都开更快吃，按需取舍。

## B. 素材（决定能不能出"真成片"）——三选一
- **C 路线·最安全（推荐，需 key）：** 配 `OPENAI_API_KEY` → Alex 自动生成**原创氛围画面**出片，绕开鬼灭版权。
- **A 路线·自备素材：** 把片段 + 商用安全音乐放进 `kimetsu/assets/<日期>/`（见 `assets/README.md`），Alex 直接剪。
- **原片转化式二创：** 自担下架风险（PLAYBOOK §2）。
> 字体想要"手写感"：放一个 `.ttf` 到 `kimetsu/assets/fonts/`，否则用系统中文字体兜底。

## C. 凭据（按需，放**环境变量**，绝不贴聊天）
| 想要的能力 | 加什么 | 网络放行 |
|-----------|--------|---------|
| AI 原创画面出片（推荐） | `OPENAI_API_KEY` | `api.openai.com` |
| YouTube 自动上传（可选） | `YT_CLIENT_ID`/`YT_CLIENT_SECRET`/`YT_REFRESH_TOKEN` | `*.googleapis.com` |
| 投递/提醒/图文卡 | 无需新增（Drive/Gmail/Calendar/Canva 已连） | — |
> 当前默认路径（投递+提醒、ffmpeg 剪辑）**不配任何 key 也能跑**——只是画面要你自备（A 路线）。

## D. 发布（如实）
- **TikTok / 小红书：无公开发布 API → 手动发**（Alex 渲染好 + Minji 排期提醒 → 你一键发）。
- **YouTube：** 配齐 C 表的 YT 凭据后可自动上传（要我再加上传脚本）。
- 不保证涨粉/流量数字；漏斗只记真实数据（PLAYBOOK §1）。

## E. 自检（可选，本地验证引擎）
```bash
npm install                      # 装依赖（含 ffmpeg-static）
npm run render -- --manifest kimetsu/briefs/manifest-2026-06-06.json --out /tmp/test.mp4
```
出 9:16 mp4 即引擎正常（该 manifest 指向示例占位素材）。
