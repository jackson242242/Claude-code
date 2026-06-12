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

- [x] **M3.1+M3.2 动态事件系统与静态库**（2026-06-12，/airline-cycle）：事件引擎
  （确定性种子抽取 EVENT_CHANCE=0.45、效果同 target 相乘夹紧 [0.25,4]、到期消退、
  可注入事件池保旧测精确）+ 42 条中文静态事件（28 minor/14 major，油价/灾害/赛事/
  政策/疫情/经济/扩建/劳资/碳税，全数过 schema 校验）；前端 EventTicker 药丸条+
  效果弹层。api 180 测 + web 83 测全绿；e2e 8 回合实测抽取/叠加/消退正常。

- [x] **M4.1–M4.3 新闻管道**（2026-06-12，/airline-cycle）：NewsProvider 注册表
  （mock+GDELT 免费源）→ Claude Haiku 结构化（裸 httpx、引擎同套校验、id/source/
  sourceUrl 服务端强制）→ 鉴权 ingest 端点（503/403/200 矩阵实测）→ 待生效池
  （JSON 持久化、去重、14 天修剪）→ 回合抽取新闻优先 + seen_news_ids 防重复；
  任何环节失败回落静态库。api 229 测全绿。ops/news-ingest.yml cron 模板就绪
  （**待老板**：部署后复制进默认分支 workflows + 配 INGEST_URL/INGEST_TOKEN/
  ANTHROPIC_API_KEY）。

- [x] **M5.1 存档持久化**（2026-06-12）：Memory/JsonFile/Postgres 三模式存储抽象
  （schema.sql 先行、全状态 round-trip 保真、写失败降级内存、env 自动选择）；
  4 条 PG 测试待 DATABASE_URL 环境自动启用。api 248 测全绿。
- [x] **M5.3 平衡性工具 + 首轮大调参**（2026-06-12）：scripts/balance_sim.py
  （5 策略×3 总部×N 局确定性快进，0.6s 出表）。首跑揪出三层结构问题并修复：
  ① AI 无上限复利扩张（增长 1.08→1.05、单线封顶 3200、开新线 4→6 回合、
  初始运力 2200→1600、极光票价 0.9→0.95）；② 持有成本过重（租率 2.75%→1.7%、
  折旧 1.25%→0.95%、总部/管理开销下调、公里票价 +10%）；③ 全额机场费压垮短途
  （AIRPORT_FEE_FACTOR=0.55）。调参后：纽约 budget 累计 +552M / narrowbody +308M、
  伦敦 budget 存活；AI 主场（东京/伦敦/迪拜）= 困难模式（如实保留）。
  **遗留观察**（后续迭代）：widebody-premium 策略选址差仍亏损；静态策略 20 年
  夺冠（份额第一）难度偏高——真人扩张流可达 9.9% 份额但需更强纪律。

## V2 待办（老板 2026-06-12 18:33 指示：画面更吸引、耐玩不重复、打破原作限制）
> 法务裁决（已在回复中向老板说明）：真实航司品牌与真人名人语音不可用——
> AI 航司用地域风格鲜明的虚构品牌；语音用原创搞笑虚构角色 + 浏览器 TTS。
- [x] **V2.1–V2.5 全部完成**（2026-06-12，老板当晚指示当晚交付）：
  ① 世界版图 95 城全球开局（可搜索 HQ 选择器，中英文/国家过滤，需求排序）；
  ② 机队 19 型（含 E175/737-800/A330-300/777-200ER/747-8i/A380 经典二手，低价高油耗）；
  ③ 图库 19 机型照 + 24 城地标天际线（Commons CC+署名，渐变占位降级）；
  ④ Web Audio 程序化「航司休息室×现代策略」配乐（零素材零版权，🔊 开关持久化）
  + 三位原创虚构顾问 TTS 配音（金满堂/飞天妹/云淡风，季报轮播+major 事件播报，
  🗣 独立开关）——法务红线落实：无真人名人、无真实航司商标；
  ⑤ 事件库 42→57 条（15 条新城市地域事件）。
  api 248 测 + web 123 测 + lint/typecheck/build 全绿；平衡无回归（纽约三策略
  盈利、东京因可达目的地增多转为可活）。

## 待办（按序取最上面一条可做的）
- [ ] **M5.2 Render 部署（只剩老板 4 次点击）**：agent 侧全部就绪（2026-06-13）——
  ① 本分支 render.yaml 已改为 SkyEmpire 专属蓝图（INGEST_TOKEN generateValue、
  API URL fromService 自动接线、前端容忍裸 host）；② 新闻 cron workflow 已由
  GitHub API 直接落到默认分支（64920d1）。**老板**：Render → New+ → Blueprint →
  本仓库 → 本分支 → Apply（提示时粘 ANTHROPIC_API_KEY 或留空）；部署完把
  GitHub Secrets INGEST_URL（完整端点 URL）/INGEST_TOKEN（从 skyempire-api
  Environment 页复制）配上即激活新闻管道。
- [ ] **素材本地化（白名单已开，下个会话执行）**：老板已加 wikimedia 两域名
  （2026-06-12 23:17 确认；对新会话生效，本会话实测仍 403）。下个会话开场即做：
  下载 43 张图（19 机型+24 城市）进 web/public、逐张校验、manifests 改本地路径、
  补全署名。建议老板顺手把 `*.onrender.com` 也加进白名单，部署后我才能亲自跑
  线上冒烟（否则只能老板自己点开网址验证）。

## 红线（每轮必守）
- 门禁：api `pytest` ＋ web `lint/typecheck/test/build` 全绿才算完成；
  根项目 `npm run typecheck` 不得被波及。
- 改 API/经济模型先改 `CONTRACT.md`，再改代码。
- 不碰 `airline-game/` 以外的业务代码；不动 PROJECTS.md 等台账文件（总管职责）。
- 素材必须真实飞机摄影 + 可商用授权 + 署名可追溯；加载失败必须优雅降级。
- 本分支 `claude/airline-tycoon-dynamic-events-ps9if8` 是项目主线，不与其他分支互并。
