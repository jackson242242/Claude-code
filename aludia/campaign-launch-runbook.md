# Aludia — 第一个 Campaign 开机手册（2026-07-19）

> 前提四件套完成后（Business Suite 绑定 ✚ Pixel 验证 ✚ offer 数字 ✚
> 至少 1 条按新公式拍的 Reels），照本手册 20 分钟开机。
> 每一步都是 Ads Manager 里的实际点击路径。

## 0. 开机前自检（缺一不投）
- [ ] Events Manager 里能看到 PageView / ViewContent / Purchase 测试事件
- [ ] 广告账户绑的是**你自己的** BM；支付方式已添加
- [ ] 选定 1 条素材：organic 表现最好的 Reels（竖版原片，别加边框）
- [ ] AOV × 毛利算出**可承受 CPA**（例：AOV $60 × 毛利 60% = 保本 CPA $36）

## 1. Campaign 设置（10 分钟）
1. Ads Manager → 创建 → 目标选 **销量 Sales**
2. 开 **Advantage+ 购物 campaign**（有就选；没有选手动 → 1 个 ad set 宽泛）
3. 预算：**$50/天**（campaign 级）；地区 US；其余定向全留空（宽泛）——
   2026 年的定向就是创意本身，别手动缩受众
4. 命名规范：`ALD-Sales-YYYYMMDD`（广告层：`ALD-<素材名>-v1`）

## 2. 广告层（5 分钟 × 3 条）
- 3 条广告同 campaign：素材可先用同一条 Reels，**primary text 用
  ADS.md §5 文案库的 3 条各一**（这就是最小可行 A/B）
- Headline / description 同库；CTA 按钮 **Shop Now**
- 落地页：产品集合页（不是首页）+ UTM：
  `?utm_source=ig&utm_medium=paid&utm_campaign=ald-sales-1`
- **⚠️ 音频合规（2026-07-20 补）**：organic 用的趋势原声/版权曲不能直接
  拿来投广告——投放版素材需替换为 Meta 免版税音乐库的曲子（Ads Manager
  上传时用"音频库"选曲，或导出无音轨版再配）
- 开启"标准优化"（Advantage+ 创意增强可开，先不开音乐替换）

## 3. 开机后 7 天纪律（最重要的一节）
- **前 7 天什么都不动**——学习期内每次修改都重置学习。会看到 CPA 波动、
  某天为 0、某天爆高，全部正常
- 每天只做一件事：截图当日数据发聊天（花费/展示/CTR/加购/购买），
  我来判读；**改不改、何时改，由数据说话**（判定规则 ADS.md §3）
- 7 天后第一次复盘：CTR < 0.8% → 换素材 hook；CTR 好转化差 → 看落地页
  和价格；CPA ≤ 目标 → 每 2–3 天 +20% 预算
- 预算红线：测试期总预算封顶 $350（7 天）；第一周结束若 0 转化且
  CTR < 0.5%，暂停并回炉创意——**止损也是纪律**

## 4. 与 organic 的配合
- 广告素材永远从 organic 赢家里选（"查"字机制每周指认赢家）
- 广告评论区照样 1 小时内回复——付费流量的评论权重同样喂 organic 推流
- 第一单来了：截图订单（隐去隐私）做 Story"first order 🥹"——转化
  素材反哺内容
