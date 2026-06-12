# SkyEmpire 路线图与状态（跨会话记忆 · 每轮 /airline-cycle 读写）

> 会话失忆，本文件 + CONTRACT.md + 计划文档（docs/airline-tycoon-plan.md）= 项目记忆。
> 每轮只做一个条目（bounded diff），完成打勾并写一行证据（commit/测试数）。

## 已完成
- [x] **M1 核心循环**（2026-06-12，commit 633ca00）：纯函数引擎 42 测全绿 +
  手机优先前端 19 测全绿（SVG 地图/大圆弧/五 tab/真实机型照片卡片）；
  e2e 实测建局→买机→开航→结算 OK；主项目门禁复验无恙（164FE）。

## 待办（按序取最上面一条可做的）
- [ ] **M2.1 AI 对手**：3 家 AI 航司（含名称/总部），份额模型替换引擎常数
  `SHARE_BASE`——同航线按运力与票价分客源；AI 每回合按简单策略开航线/加运力；
  前端地图淡色显示对手航线 + 财务 tab 显示市场份额。
- [ ] **M2.2 slot 谈判**：城市 slot 上限进 cities.json；新命令 `negotiateSlot`
  （成功率 = f(城市余量, 出价)，冷却 1 回合）；开航线消耗 slot。
- [ ] **M2.3 舱位与服务**：航线配置头等/商务/经济比例 + 服务等级，
  影响票价系数与需求；季报分舱位显示。
- [ ] **M2.4 胜负判定**：2046 年底结算（20 年/80 回合）：利润+乘客+份额计分
  vs AI 排名；胜利/失败结算画面。
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
