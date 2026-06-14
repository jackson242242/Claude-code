# 总览 — 现在的框架长什么样（Flowchart + 说明）

> 文档现在有 7 份，这是把它们串成**一个系统**的总图。先看图，再看说明，最后按"读法"跳到细节。
> 配套：[`FRAMEWORK.md`](./FRAMEWORK.md)（脊梁）· [`COURSE-DESIGN.md`](./COURSE-DESIGN.md) · [`ENGAGEMENT.md`](./ENGAGEMENT.md) · [`ECONOMY-AND-GAMES.md`](./ECONOMY-AND-GAMES.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md) · [`MONETIZATION.md`](./MONETIZATION.md) · [`curriculum/`](./curriculum/)

---

## 图 1 · 核心闭环（每日飞轮）—— 产品怎么转起来

> 一句话：**学得越懂 → 游戏玩得越好 → 金币越多 → 排名越高 → 越想回来 → 又去学。** "想赢钱"被导向"去学"。

```mermaid
flowchart TD
    Open["📱 每天打开<br/>触屏 app"] --> Learn["📚 学主线课程<br/>3 分钟知识点(原子)"]
    Learn --> XP["⭐ XP 掌握度"]
    Learn --> Coins1["💰 金币(学习赚)"]
    Learn -. "学过的概念 = 招式" .-> Games["🎮 每日市场 + 游戏厅<br/>学得越懂玩得越好"]
    Games --> Coins2["💰 金币(玩游戏赚)"]

    XP --> Mascot["🥚→🐣→🦤 mascot 成长"]
    XP --> Unlock["🔓 解锁更深内容<br/>门禁:造出作品才过"]
    Mascot --> Zoo["🦤🐼🦒🦅 我的动物园<br/>每领域一只"]

    Coins1 --> Wealth["🏆 财富榜 + 称号 + 装扮商店<br/>(未来:兑换商店)"]
    Coins2 --> Wealth

    Wealth --> Pull["🔔 钩子:通知/邮件/feed<br/>streak + 护盾"]
    Zoo --> Pull
    Unlock --> Pull
    Pull --> Open

    classDef main fill:#fde68a,stroke:#b45309,color:#000;
    classDef hook fill:#bfdbfe,stroke:#1e40af,color:#000;
    class Learn,XP,Unlock main;
    class Games,Coins1,Coins2,Wealth,Mascot,Zoo,Pull hook;
```

**说明：** 黄色 = **主菜（学习）**，蓝色 = **钩子（mascot/游戏/金币/榜单/通知）**。
钩子的唯一职责是"把人吸引进来、拉回来"，所有箭头最终都汇回 **学主线课程**。
这张图就是 `FRAMEWORK.md` §0 主次原则 + `ECONOMY-AND-GAMES.md` §0 因果链的可视化。

---

## 图 2 · 分层架构 —— 框架由哪几层叠成

```mermaid
flowchart TB
    subgraph L1["① 价值层 — 为什么这么做"]
      direction LR
      V1["主次原则<br/>学习=主菜·游戏=钩子"]
      V2["亮模式 kid-safe<br/>不操纵·不卖惨·零赌博"]
    end
    subgraph L2["② 内容层 — 教什么(内容即数据)"]
      direction LR
      C1["OS→学院→Track→章→Mission→原子(3min)"]
      C2["概念依赖图 DAG + 间隔重复 SRS"]
    end
    subgraph L3["③ 进阶层 — 怎么由浅入深"]
      direction LR
      P1["L0小学低→L1→L2高中→L3本科→L4研究生"]
      P2["建造优先<br/>每级造出真东西才解锁"]
    end
    subgraph L4["④ 动力层 — 怎么留住人"]
      direction LR
      E1["Hook模型·streak+护盾·badge"]
      E2["财富榜联赛·激励 feed"]
    end
    subgraph L5["⑤ 经济层 — 金币怎么转"]
      direction LR
      M1["双货币:XP掌握度(不可花) / 金币财富(可花)"]
      M2["赚:学+玩 · 花:装扮/护盾/未来商店"]
    end
    subgraph L6["⑥ 平台·商业层 — 跑在哪/怎么挣钱"]
      direction LR
      T1["touchscreen-only·Expo/RN·FastAPI+Postgres"]
      T2["freemium 订阅 + 家庭版·无广告"]
    end
    L1 --> L2 --> L3 --> L4 --> L5 --> L6
```

**说明：** 上层管"为什么/教什么"，下层管"怎么留人/怎么挣钱"。
**越往下越要服务越往上**——经济层(⑤)和动力层(④)都不能稀释内容层(②)的学习深度(这是①价值层的铁律)。

---

## 图 3 · 内容与进阶 —— 一个领域怎么从小学长到研究生

```mermaid
flowchart LR
    subgraph Span["同一条螺旋:小学 → 研究生"]
      direction TB
      A0["L0 小学低<br/>三个罐子分钱"] --> A1["L1 小学高/初中<br/>自己的预算表"]
      A1 --> A2["L2 高中<br/>搭分散投资组合"]
      A2 --> A3["L3 本科<br/>给真公司做 DCF"]
      A3 --> A4["L4 研究生<br/>建 LBO 模型/回测策略"]
    end
    Atom["原子(3min)<br/>一个概念·多变体反复喂·SRS复习"] -.组成.-> A0
    Build["每级:作品即门禁<br/>先造再懂"] -.贯穿.-> Span
```

**说明：** 不是"儿童版+成人版"两个产品，而是**一根螺旋**：承重概念(如 TVM)在每一级以更深的形态 + 更硬的作品反复出现。
最小单位是 **3 分钟一个的原子**，像学语言一样多种方式反复喂(见 `COURSE-DESIGN.md`)。

---

## 图 4 · 双货币 —— XP 和金币各管一摊

```mermaid
flowchart TD
    LearnAct["学习行为<br/>完成 mission · SRS 复习"] --> XP2["⭐ XP 掌握度"]
    LearnAct --> CoinA["💰 金币"]
    PlayAct["玩游戏(技能/知识)"] --> CoinB["💰 金币"]

    XP2 --> Grow["mascot 成长 · L0-L4 等级 · 永不清零"]
    XP2 -. "不能花·不能被游戏刷" .-> Pure["保护掌握度的纯洁"]

    CoinA --> Bank["金币身家(永久)"]
    CoinB --> Bank
    Bank --> Week["本周金币 → 财富榜(每周一重置比赛)"]
    Bank --> Sink["花:装扮/护盾/称号外框<br/>(未来:兑换商店)"]
    Sink -. "红线:买不到学习内容/游戏胜利" .-> NoP2W["杜绝 pay-to-win"]
```

**说明：** **XP = 掌握度**(只升级、不可花、不能被游戏刷)；**金币 = 财富**(学和玩都能赚、可花在纯装饰)。
两套分开，既满足"赚钱当 leader"，又不让游戏污染"学到多深"。详见 `ECONOMY-AND-GAMES.md` §1。

---

## 图 5 · 文档地图 —— 7 份文档怎么咬合

```mermaid
flowchart LR
    OV["OVERVIEW.md<br/>(本文·总图)"] --> F["FRAMEWORK.md<br/>脊梁/总纲"]
    F --> CD["COURSE-DESIGN.md<br/>怎么设计深课"]
    F --> EN["ENGAGEMENT.md<br/>留存引擎"]
    F --> EC["ECONOMY-AND-GAMES.md<br/>金币 + 游戏"]
    F --> AR["ARCHITECTURE.md<br/>可行性·内容即数据·SRS"]
    F --> MO["MONETIZATION.md<br/>盈利"]
    CD --> CU["curriculum/money-and-markets.md<br/>领域大纲"]
    CU --> PE["modules/private-equity.md<br/>深度样板"]
    EN -. "复用护栏/联赛/badge" .-> EC
    AR -. "内容即数据 schema" .-> EC
    AR -. "内容即数据 schema" .-> CU
```

---

## 怎么读（按角色跳转）

| 你想搞清楚… | 看这张图 + 这份文档 |
|------------|---------------------|
| 产品整体怎么转 | 图 1 · `FRAMEWORK.md` |
| 教什么、教多深、什么顺序 | 图 3 · `COURSE-DESIGN.md` + `curriculum/` |
| 怎么让人每天回来 | 图 1/图 4 · `ENGAGEMENT.md` + `ECONOMY-AND-GAMES.md` |
| 技术能不能做、怎么扩 | 图 2 · `ARCHITECTURE.md` |
| 怎么挣钱 | 图 2 底层 · `MONETIZATION.md` |
| 一份深度内容长什么样 | `curriculum/modules/private-equity.md` |

---

## 现状一句话

**设计层已成体系**（7 份文档 + 一个深度样板模块），**尚未写一行产品代码**——这符合"先把内容/框架做深，再上工程"的节奏。
下一步候选见 `ECONOMY-AND-GAMES.md` §11 / `FRAMEWORK.md` §10（最强验证点 = 先做「每日市场」可玩样板）。
