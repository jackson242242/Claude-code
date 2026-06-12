# SkyEmpire 路线图与状态（跨会话记忆 · 每轮 /airline-cycle 读写）

> 会话失忆，本文件 + CONTRACT.md + 计划文档（docs/airline-tycoon-plan.md）= 项目记忆。
> 每轮只做一个条目（bounded diff），完成打勾并写一行证据（commit/测试数）。

## 已完成
- [x] **M1 核心循环**（2026-06-12，commit 633ca00）：纯函数引擎 42 测全绿 +
  手机优先前端 19 测全绿（SVG 地图/大圆弧/五 tab/真实机型照片卡片）；
  e2e 实测建局→买机→开航→结算 OK；主项目门禁复验无恙（164FE）。
- [x] **M2.1 AI 对手**（2026-06-12，/airline-cycle 首轮）：份额竞争模型
  （w=fareMult^elasticity + 背景 W_BG=11/9，无竞争时份额仍 0.45，4 条平衡验收原样过）；
  3 家确定性 AI（极光太平洋/皇家子午线/沙丘猎鹰）每季扩容 1.08×、每 4 回合开新线+中文播报；
  前端对手淡色弧 + 市场份额面板。api 52 测 + web 23 测全绿；e2e 4 回合实测
  竞争压价生效、AI 各扩至 3 线。注意：nyc/lhr demandIndex 并列 10，按城市表稳定序
  破平局 → 三家 AI 第 4 回合都开向纽约（可在 M5.3 平衡轮调整）。

- [x] **M2.2 slot 谈判**（2026-06-12，f151a0e/6a5c8bb+api）：City.slotCapacity；
  确定性 negotiateSlot（冷却/池满/现金三段校验，成本 slotFee×800×(1+占用率)）；
  玩家航线两端占持有 slot、AI 占池且满池顺延；前端 SlotBadge+谈判按钮+开航门槛。
  api 67 测 + web 31 测全绿；e2e 实测无 slot 被拒→谈判→开航成功。

- [x] **M2.3 舱位与服务**（2026-06-12，/airline-cycle）：三舱占地模型（商务 2.5×/头等
  5× 经济占地，floor 换算）+ 分舱需求拆分（88/9/3，纯经济舱旁路保 M2.2 一致）+
  服务等级（竞争权重 ±15%、每客服务成本 $12/25/45）；前端舱位编辑器+分舱季报。
  api 93 测 + web 51 测全绿；e2e 实测 787-9 高端配置利润 2.5×。

- [x] **M2.4 胜负判定**（2026-06-12，/airline-cycle）：GAME_LENGTH_TURNS=80，
  终局按最终季 marketShare 排名（并列玩家优先、AI 按名册序），lifetime 累计利润/乘客；
  前端胜利「称霸蓝天」/失败名次画面 + 第 N/80 季进度。api 124 测 + web 60 测全绿。

## 待办（按序取最上面一条可做的）
- [ ] **M3.1 事件系统接入**：CONTRACT §「GameEvent schema」落地（见计划文档 §4.3）
  ——引擎修正器叠加与到期消退、回合抽取、前端「世界新闻播报」UI 与季报联动。
- [ ] **M3.2 静态事件库**：手写 ~40 条（油价/灾害/赛事/政策/流行病），
  data/events-static.json，权重抽取 + 单测。
- [ ] **M4.1 NewsProvider 抽象**：api/app/providers/（base + mock + GDELT 免费源），
  注册表模式同主仓库 backend/app/providers。
- [ ] **M4.2 LLM 结构化管道**：Claude API 把新闻转 GameEvent（Pydantic 强校验 +
  效果封顶），受保护 ingest 端点 + GitHub Actions 6h cron（仿 site-health.yml）。
- [ ] **M4.3 事件池接回合**：待生效池→新回合抽取生效，管道断了回落静态库（游戏无感）。
- [ ] **M5.1 存档持久化**：PG（schema.sql 先行）/JSON 文件双模式，匿名 id 续局。
- [ ] **M5.2 Render 部署**：render.yaml 加 web+api 双服务；上线冒烟。
- [ ] **M5.3 平衡性工具**：快进模拟 N 局脚本，调 balance.py 常数不改代码。
- [ ] **素材本地化**（待老板把 upload.wikimedia.org/commons.wikimedia.org 加进环境
  网络白名单）：下载 13 张机型照片进仓库、逐张校验（含 737 MAX 10 那张未确认文件名的）、
  补全精确作者署名。

## 红线（每轮必守）
- 门禁：api `pytest` ＋ web `lint/typecheck/test/build` 全绿才算完成；
  根项目 `npm run typecheck` 不得被波及。
- 改 API/经济模型先改 `CONTRACT.md`，再改代码。
- 不碰 `airline-game/` 以外的业务代码；不动 PROJECTS.md 等台账文件（总管职责）。
- 素材必须真实飞机摄影 + 可商用授权 + 署名可追溯；加载失败必须优雅降级。
- 本分支 `claude/airline-tycoon-dynamic-events-ps9if8` 是项目主线，不与其他分支互并。
