# Aludia — Meta 广告 Playbook (ADS.md)

> `/aludia-daily` Phase B 的执行手册。agent **没有 Meta Ads Manager 权限**，
> 所有 Ads Manager 内操作由老板执行；agent 负责分析数据、给出明确指令、
> 准备广告素材与文案。诚实原则：不编数字、不保证 ROAS。

## 0. 数据进来的方式（老板任选其一，越靠前越好）
1. **聊天粘贴**：Ads Manager 界面截图或直接把数字打出来（花费/展示/点击/加购/购买）
2. **CSV 导出**：Ads Manager → Reports → Export，存到 Google Drive 文件夹
   `Aludia Ads Exports`（agent 每轮用 Drive 搜索读取最新一份）
3. 什么都没有 → Phase B 走"筹备清单"（§2），不做假分析

## 1. 预算与目标测算（等 BRAND.md 补全 AOV/毛利后立即算出）
- 可承受 CPA = AOV × 毛利率 ×（1 − 目标利润率）。测试期允许 CPA ≈ 保本线。
- 珠宝电商 2025–26 参考区间（仅作 sanity check，不作承诺）：
  CPM $15–40 · CTR 1–2.5% · 电商转化率 1.5–3% · 保本后目标 ROAS 2–3×。
- **起步建议**：$20–50/天，跑满 7 天再评估（学习期需要 ~50 次转化/周才出稳态，
  小预算下学习期更长——这是提前说清楚的物理限制，不是话术）。

## 2. 冷启动筹备清单（每轮推进一格，完成打勾）
- [ ] Meta Business Suite + 商务管理平台建好，IG @aludia_jewelry 与 FB 主页绑定
      （📬 操作指引已交付 → briefs/2026-07-04.md Phase B，等老板执行）
- [ ] 网站装 Meta Pixel + Conversions API（Shopify 应用一键装），验证 Purchase 事件
- [ ] 商品目录（Catalog）同步，开 Advantage+ 目录广告的前提
- [ ] 首个 Campaign：**销售目标 · Advantage+ 或 1 个宽泛受众 CBO**，
      3–5 条素材（用每日循环产出的 Reels/图），$20–50/天
- [ ] Pixel 积累 ≥ 一定数据后：加再营销（网站访客/IG 互动 30–180 天）
- [ ] UTM 规范：`utm_source=ig|fb&utm_medium=paid&utm_campaign=<名>`，方便对账

## 3. 每轮分析动作（有数据时）
1. 按 campaign/ad set/ad 三层看：花费、CPM、CTR、CPC、CPA/ROAS、频次
2. **判定规则（默认，老板可改）**：
   - 花费 > 2× 可承受 CPA 且 0 购买 → 建议关停该 ad set
   - CPA ≤ 目标且 ≥3 单 → 建议 +20% 预算（每 2–3 天一次，避免重置学习期）
   - CTR < 0.8% → 素材问题，回传 Phase A 换 hook；CTR 高但不转化 → 落地页问题
   - 频次 > 3 且 CPA 恶化 → 素材疲劳，换新
3. 输出写进当日 brief：**逐条"在 Ads Manager 里做什么"**（老板照做即可），
   附下一轮想验证的一个假设。

## 5. 首个 Campaign 文案库 v1（2026-07-05 备好；产品信息到位后出 v2 精准版）
**Primary text（3 选 1 或轮换测试）：**
1. Fine jewelry made to be worn every day — and loved for years. Designed in
   New York, delivered to your door with care. ✨
2. The piece you'll reach for every single morning. Elegant, everyday
   jewelry from a small New York studio — shop the collection.
3. Gift-ready, heart-approved. Every Aludia order ships from New York
   beautifully wrapped — because the moment matters as much as the piece.

**Headline（3 选 1）：**
1. Everyday Fine Jewelry, Made in NY
2. Your New Signature Piece Awaits
3. Elegant Jewelry, Wrapped With Love

**Description（2 选 1）：**
1. Free-to-browse collection. Ships from New York.
2. Small brand. Big sparkle. Shop Aludia New York.

> 使用规则：首轮 1 campaign / 1 ad set（宽泛受众）/ 3 ads——三条 primary
> text 各配最强的 Reels 素材跑对比；CTR 最低的一条 5–7 天后换掉。

## 6. Agency vs 自投决策框架（2026-07-19 老板问询后定稿）
**结论**：月投 < $3–5k 阶段自投（Advantage+ 已自动化投放技术，创意即定向；
健康 agency 费率 10–20% 只在 $5k+/月成立）。地基（Pixel/目录/AOV/网站/
邮件承接）未打好前，谁投都是亏——广告只放大漏斗现状。
**若用 agency 的自保清单**：
1. 必须投在**自己的** BM/广告账户（Pixel/受众/学习历史归自己）——最大的坑
2. 要 Ads Manager 只读权限看实时数据，不收 PDF 报告
3. 合同 ≤1 个月；设置费 ≤ 首月服务费
4. 问清每月新素材条数与拍摄责任（答"你提供素材"= 只剩自动化部分）
5. 问业绩口径（ROAS/CPA）；只谈曝光触达的淘汰
6. 必问两句："费用含不含广告费？投在谁的账户里？"
**升级时机**：自投 4–6 周拿到真实 CPA 后，月预算 ≥$3–5k 且时间成为
瓶颈时再谈——届时手握数据，谈判地位不同。
**2026-07-19 老板确认**：该 agency 报价 = $50/天纯广告费 + 服务费另收
→ 费率 30–100%，裁决：**不用，自投**。省下的服务费两个去处：加预算
（$50→$70/天）或买 UGC creator 创意（$150–300/条，第三方试戴视角）。

## 4. 免费流量（预算外的每日动作，写进 brief 的老板清单）
- Reels 是免费流量主引擎：每天 1 条、hook 用调研库、发布后 1 小时内回评论
- IG SEO：昵称含 "jewelry"、bio 关键词、帖子文案前 125 字符含搜索词
- Pinterest（珠宝强平台）：每日循环可顺手产出 Pin 版设计（Canva 一键 resize）
- 邮件：网站弹窗收邮箱（首单折扣）→ agent 起草欢迎流/弃购流（Gmail 草稿）
