# 手表育儿助手：儿童发展与伦理评审笔记（6–18 岁，能动性与志向）

> 角色：团队的儿童发展与伦理评审。目标：用证据说明创始人的每个设想会怎样影响孩子的**能动性、亲子信任与身心健康**，并给出能保留好处的改法与设计原则。
> 调研日期：2026-11-21。

## 方法与可信度说明（写报告的人请先读这一节）

**本轮网络条件很差，以下限制会影响每一条引用的可信度：**

1. **WebSearch 一次也没用上。** 本轮所有代理共用一个搜索额度，我的第一次查询发出时额度已经用完（"limit: 200 WebSearch calls per turn … used up"）。
2. **WebFetch 和 curl 被会话网络白名单挡住了**，下列站点全部无法访问：
   - 第一次 WebFetch 访问 www.ohchr.org 就返回 DNS 失败（ENOTFOUND）。
   - curl 访问下列站点，代理返回 "403 no rule or network setting allows this host"：docs.un.org, unicef.org, commonsensemedia.org, apa.org, pnas.org, pubmed / pmc / ncbi, dl.acm.org, ico.org.uk, sagepub, springer, wiley / srcd, psycnet, eur-lex, artificialintelligenceact.eu, npc.gov.cn, gov.cn, scholar.google, semanticscholar, crossref, openalex, europepmc, wikipedia, ctext.org, who.int, ftc.gov, unesco, oecd, pewresearch, nature, science, frontiersin, mdpi, plos, jmir, osf, researchgate, tandfonline, cambridge, oup, sciencedirect, eric.ed.gov, selfdeterminationtheory.org, khanacademy, openai.com, support.apple.com, apple.com, support.google.com, families.google, developer.samsung.com。
   - 能访问的只有：developer.apple.com, developer.android.com, anthropic.com, github.com, pypi, npm。
3. **本轮真正打开读过的来源只有 3 个**，文中标 **【已打开】**：
   - Apple WWDC21 "Meet the Screen Time API"
   - Anthropic《Education Report: How university students use Claude》（2025-04）
   - Anthropic《How people use Claude for support, advice, and companionship》（2025-06）
4. **其余引用都来自研究者已有的知识**（训练数据截至 2026 年中），没有在本轮打开原文。
   - 文中标 **【背景知识】**：核心结论我有较高把握。
   - 具体数字、段号、条文措辞一律标 **〔未核实〕**，写入产品文档或对外材料前必须对照原文核对。
   - DOI 只在我把握较大时给出，并标"DOI 据记忆"。
   - 2026 年的新进展（新的诉讼、法规、研究）本轮完全无法检索，见第 12 节。
5. 标 **【仓内笔记】** 的内容引自同仓库 `research_notes/孩子能动性与志向培养体系/` 下的 psychology.md、sociology_anthropology.md 和 wearable_coaching.md。那几份笔记的数字来自当时的检索摘要，可信度同样是"摘要级"。
6. **证据等级**沿用 psychology.md 的标准：
   - 【A】多项元分析或大型预注册 RCT 结论一致；
   - 【B】元分析的相关证据一致，或单个高质量 RCT；
   - 【C】小样本、单项研究或横断面研究；
   - 【D】争议大，或主要是理论、预印本。

---

## 0. 一页结论

### 0.1 逐项结论

| 创始人设想 | 结论 | 主要理由（证据等级） | 能保留好处的改法 |
|---|---|---|---|
| ① 父母手表在吼叫前提醒 | **保留，但要改造**（以父母为中心、父母自己开启、透明） | 严厉的言语管教对青少年确有伤害【B】；父母侧的即时教练有先例【B】。但"在吼之前"靠心率无法可靠预测【C】，而且手表震动本身会打断亲子交流（technoference）【B】 | 父母主动开启"冷静模式"；只用父母自己的信号，不录孩子的声音；把提醒改成"暂停与修复"；晚上给父母做 1 分钟复盘；让孩子知道父母在练习冷静，把它变成一次示范 |
| ② 孩子无助时给予引导的儿童 app（团队已改为孩子自己的苏格拉底式教练） | **保留，前提是严格护栏** | 直接给答案的 AI 会削弱学习，提问和提示式的 AI 不会【B】；对话式提问能提高幼儿的理解【B/C】；"自我抽离"式提问有助于情绪调节【B/C】。风险包括依赖、替代真人关系、危机处理失败、拟人化依恋【C，证据在快速积累】 | 教练要逐步"退场"，以孩子"毕业"作为成功指标；不设人设，不说"我是你最好的朋友"；没有连胜；对话内容归孩子；安全上报的规则事先和孩子讲清楚；把孩子引回真人身边；6–9 岁以亲子共用为主 |
| ③ 持续录音和心率监测孩子（看电影、和朋友聊天、玩游戏、社交媒体、听的音乐），"像心理学家在身边"一样汇总给父母 | **否决**（任何年龄、以任何"同意"为前提都不应做成产品形态） | 父母了解孩子主要靠孩子主动讲【A/B】；侵犯隐私会让孩子讲得更少，父母反而知道得更少【B】；从生理信号推断情绪缺乏科学效度【A/B】；误标会伤害孩子的自我认识；还有多国法律风险（中国《未成年人保护法》第 63 条、两方同意录音州、COPPA、GDPR、PIPL），并且违反 CRC 一般性意见第 25 号第 75–76 段的规范；同类功能有被滥用为跟踪软件的先例【B】。**没有任何证据显示它能带来好处** | 晚间亲子共同回顾（"细致回忆式"对话，elaborative reminiscing）【B】；孩子自己写、自己决定发给谁的"分享卡"；孩子用自己的词给情绪命名；给父母一个"倾听教练"，帮他们回应好孩子的倾诉；只为事先约定的、范围很窄的紧急情况保留安全提醒 |
| ④ 练习时追踪注意力时长 | **改为孩子的自我监控**；父母看到的是孩子选择分享的内容 | 手表无法有效测量"注意力"【C/D】；父母可见的指标、预期奖励和连胜会削弱内在动机【A/B】；量化会降低乐趣【B】；青少年戴 Fitbit 后自主动机下降【C】。另一方面，**孩子自己记录**是否专注有证据支持【B】 | 孩子自己定练习目标；温和的计时器；练完自评 1–5 分，写一句"什么帮我专注了"；不设排行榜，不惩罚断连；设"不测量的练习日" |
| ⑤ 与教练、老师共享数据 | **默认关闭**；只允许孩子主动、逐条地分享自己整理的成果；**永不**向机构提供生理或情绪数据 | 标签和期望效应真实存在，虽然不大【B】；机构与孩子之间权力不对等，数据用途会悄悄扩大；**欧盟 AI 法第 5(1)(f) 条禁止在教育机构推断情绪**；国内已有"脑电头环进课堂""课堂表情识别"引发舆情的先例 | 学生主导的作品集或"成长卡"，由孩子发出、有时限、可撤回；不提供原始数据流 |
| 团队当前方向（父母教练 + 练习功能 + 孩子自己的苏格拉底式教练 + 知情同意/儿童赞同 + 不录朋友、不做诊断） | **方向正确，还需补 5 处** | 见第 9.6 节 | (a) 孩子的赞同要能随时撤回，拒绝不受任何惩罚；(b) 不管有没有同意，数据都要结构性地最小化，因为亲子之间权力不对等，同意本身不够；(c) 父母**看不到**孩子的教练对话；(d) 产品里不放连胜、积分、排行榜；(e) 北极星指标不要用"使用时长"，改用"孩子不再需要它"和"孩子主动告诉父母的次数" |

### 0.2 首要设计原则（详见第 11 节）

1. **靠孩子愿意讲，不靠监视**（Kerr & Stattin）。产品要让"讲出来"更容易，而不是让"偷看"更容易。
2. **道而弗牵，强而弗抑，开而弗达**（《学记》）。教练只问不替孩子决定，只鼓励不压制，只给提示不给答案。
3. **"帮我自己来做"，并且要逐步退场**（Montessori、Vygotsky 的支架、老子"太上，不知有之"）。成功指标是孩子不再需要它。
4. **结构而不控制**（SDT、Grolnick）。规则、选择和理由可以清楚而温暖；内疚、羞辱、收回爱、偷看都不行。
5. **透明，不隐蔽**（CRC 一般性意见第 25 号第 75 段、英国 ICO 儿童规范第 11 条）。被看到时孩子一定知道，并且能提出异议。
6. **相称、最少侵入，并随年龄退场**（CRC 第 5 条"能力的不断发展"）。可见度默认随年龄下降，并安排"移交仪式"。
7. **不推断、不贴标签**。孩子用自己的词命名自己的感受，机器不代替孩子说"你在焦虑"。
8. **改变的首要对象是父母**（"其身正，不令而行"）。父母的自我调节是孩子最好的示范。
9. **给"不被测量"的玩耍与兴趣留出空间**（CRC 第 31 条，过度辩护效应）。
10. **修复比完美重要。** 父母吼过之后会道歉、会修复，比"从不吼"更能教会孩子什么是关系。

---

## 1. 父母监控研究：Kerr & Stattin 的再诠释、复制与批评

### Takeaway
"父母知道孩子在哪、在做什么、和谁在一起"（parental knowledge）与较少的问题行为稳定相关。但 Stattin & Kerr 2000 年的两篇论文表明，这份"知道"**主要来自孩子主动讲**，而不是父母追问（solicitation）或立规矩（control）。之后的纵向研究进一步发现，"孩子的状况影响父母知道多少"这一方向的作用（child effects）很强；父母的温暖和对孩子讲出来时的反应，又会影响孩子愿不愿意讲。对产品的含义是：**能让父母真正了解孩子的，是孩子愿意讲的那段关系，而不是传感器。**

### Cited Findings
- 【A/B，奠基研究，已被大量复制】【背景知识】Stattin, H., & Kerr, M. (2000). "Parental monitoring: A reinterpretation." *Child Development*, 71(4), 1072–1085.（DOI 据记忆：10.1111/1467-8624.00210）
  - 样本：瑞典约 700 名 14 岁青少年及其父母〔样本量未核实〕。
  - 发现：父母掌握的信息里，**孩子主动讲的部分**最多，与较少违规行为的关联也最强；父母追问和规矩的作用小得多。
  - 结论：传统"监控"量表测的其实是"父母知道多少"，而不是"父母做了什么"。
- 【A/B】【背景知识】Kerr, M., & Stattin, H. (2000). "What parents know, how they know it, and several forms of adolescent adjustment: Further support for a reinterpretation of monitoring." *Developmental Psychology*, 36(3), 366–380.（DOI 据记忆：10.1037/0012-1649.36.3.366）
  - 把结论推广到多种适应指标。
  - 父母的控制与孩子"感到被控制"相关，后者又与较差的适应相关〔具体指标未核实〕。
- 【B，纵向】【背景知识】Kerr, M., Stattin, H., & Burk, W. J. (2010). "A reinterpretation of parental monitoring in longitudinal perspective." *Journal of Research on Adolescence*, 20(1), 39–64.
  - 交叉滞后分析显示：**孩子的问题行为预测之后讲得更少、父母知道得更少**。父母追问和控制几乎不能预测之后问题行为的减少〔效应量未核实〕。
- 【B】【背景知识】Keijsers, L., Frijns, T., Branje, S. J. T., & Meeus, W. (2009). *Developmental Psychology*, 45(5), 1314–1327（荷兰纵向样本）
  - 孩子主动讲具有保护作用，**刻意隐瞒（secrecy）预测更多违规**。
  - 父母控制的作用取决于亲子关系是否温暖〔调节方向的细节未核实〕。
- 【B，重要批评与修正】【背景知识】Fletcher, A. C., Steinberg, L., & Williams-Wheeler, M. (2004). "Parental influences on adolescent problem behavior: Revisiting Stattin and Kerr." *Child Development*, 75(3), 781–796.
  - 父母的温暖和行为控制会通过提高"父母知道多少"间接起作用。
  - 因此"父母做什么都没用"这种强解读不成立。父母的行为要**通过关系和孩子的主动讲述**才起作用。
- 【B】【背景知识】Soenens, B., Vansteenkiste, M., Luyckx, K., & Goossens, L. (2006). "Parenting and adolescent problem behavior: An integrated model with adolescent self-disclosure and perceived parental knowledge as intervening variables." *Developmental Psychology*, 42(2), 305–318.
  - 回应性和行为控制 → 孩子讲得更多 → 父母知道得更多 → 问题行为更少。
  - **心理控制让孩子讲得更少。**
- 【B】【背景知识】Smetana, J. G., Metzger, A., Gettman, D. C., & Campione-Barr, N. (2006). "Disclosure and secrecy in adolescent–parent relationships." *Child Development*, 77(1), 201–217.
  - 青少年最不愿意讲的是"个人领域"的事（朋友、感情、私人时间）。
  - 父母的**接纳和信任**预测孩子讲得更多。
- 【B/C】【背景知识】Tilton-Weaver, L., Kerr, M., Pakalniskeine, V., Tokic, A., Salihovic, S., & Stattin, H. (2010). "Open up or close down: How do parental reactions affect youth information management?" *Journal of Adolescence*, 33(2), 333–346.
  - 孩子讲出来之后，如果父母的反应是愤怒、失望、说教，孩子会感到被控制，之后讲得更少。
  - **"父母怎样回应孩子的讲述"** 是一个可以干预的环节。
- 【B，方法学综述】【背景知识】Keijsers, L. (2016). "Parental monitoring and adolescent problem behaviors: How much do we really know?" *International Journal of Behavioral Development*, 40(3), 271–281.
  - 现有关联大多是"家庭之间"的差异。同一家庭内部的效应更小，方向也可能不同。
  - 孩子对父母的反向作用很强，需要用个体内设计重新检验。
- 【B，跨文化】【背景知识】Cheung, C. S., Pomerantz, E. M., & Dong, W. (2013). "Does adolescents' disclosure to their parents matter for their academic adjustment?" *Child Development*, 84(2), 693–710（中美样本）
  - 孩子向父母讲学业上的事，在**中国和美国**都预测更好的学业适应〔细节未核实〕。
  - "靠孩子讲而不靠监视"并非只适用于西方。
- 【B/C】【背景知识】Finkenauer, Engels & Meeus (2002), *Journal of Youth and Adolescence* 31(2)；Frijns 等 (2005), *JYA* 34(2)
  - 青少年对父母保守秘密，一方面与情感自主相关（是正常的发展需要），另一方面与更多问题相关（是风险信号）。
  - 秘密是一把双刃剑。解决办法是改善关系氛围，而不是把秘密挖出来。

### Inferences
- 创始人说"想更了解孩子"，证据显示最有效的路径是**提高孩子讲出来的意愿和质量**。决定这一点的是父母的温暖、信任，以及父母**听到之后的反应**（Tilton-Weaver 2010；Smetana 2006）。
- 产品最有价值的"了解孩子"功能因此是：
  - (a) 训练父母倾听和回应（父母侧教练）；
  - (b) 降低孩子开口的门槛（晚间共同回顾、分享卡）；
  - (c) 保护孩子讲出来之后不被"秋后算账"。
- 监视除了伦理问题，**还会在功能上自我挫败**：它侵蚀孩子讲述的意愿，而后者才是父母了解孩子的主要来源（详见第 3 节）。
- 平衡起见：父母知道孩子的情况，本身确实有保护作用（例如与较少的物质滥用、危险性行为相关）。问题不在于父母"知道"，而在于靠什么手段知道。

### Gaps
- 未能取得 2016 年以后"孩子主动讲述—父母了解—适应"的元分析（如果有）的效应量。
- 中国大陆样本中关于孩子讲述与隐瞒的纵向研究，本轮无法检索。
- 个体内（within-family）设计的最新结果（如 Keijsers 团队 2018–2025 年的经验取样研究）细节未取得。

---

## 2. 电子监控、家长控制 app 与定位追踪

### Takeaway
HCI 研究反复发现：主流家长控制 app 以"限制 + 监视"为主，很少支持孩子自我调节。孩子对这类 app 的评价远比父母负面，常见抱怨是侵犯隐私、过度限制、损害亲子关系、妨碍正当用途。使用这类 app 与专制型教养相关，**并没有与更少的线上风险相关**（相关研究，可能存在反向因果）。定位追踪的质性研究显示，它会改变家庭里的信任方式：要么"信任被技术替代"，要么带来新的冲突。限制型干预能降低风险，但也同时降低机会和数字技能；"支持型"干预更有利于能力发展（Livingstone）。

### Cited Findings
- 【C，系统性功能分析】【背景知识】Wisniewski, P., Ghosh, A. K., Xu, H., Rosson, M. B., & Carroll, J. M. (2017). "Parental Control vs. Teen Self-Regulation: Is there a middle ground for mobile online safety?" *CSCW '17*, 51–69.（DOI 据记忆：10.1145/2998181.2998352）
  - 分析 75 款 Android 家长控制 app：约 89% 的功能用于父母监视和限制，只有约 11% 支持青少年自我调节〔比例未核实〕。
  - 作者主张走"中间道路"：以青少年为中心、支持自我调节。
- 【C，内容分析】【背景知识】Ghosh, A. K., Badillo-Urquiola, K., Guha, S., LaViola Jr., J. J., & Wisniewski, P. J. (2018). "Safety vs. Surveillance: What Children Have to Say about Mobile Apps for Parental Control." *CHI '18*, Paper 124.（DOI 据记忆：10.1145/3173574.3173698）
  - 分析 Google Play 上数十款家长控制 app 的数百条评论（约 37 款 app、736 条评论〔未核实〕）。
  - **孩子写的评论绝大多数是负面的**，主要指向侵犯隐私、过度限制、伤害亲子关系、妨碍做作业等正当用途。
  - 孩子希望 app 能支持沟通与自我调节，而不是单向监视。
- 【C，问卷相关】【背景知识】Ghosh, A. K., Badillo-Urquiola, K., Rosson, M. B., Xu, H., Carroll, J. M., & Wisniewski, P. J. (2018). "A Matter of Control or Safety? Examining Parental Use of Technical Monitoring Apps on Teens' Mobile Devices." *CHI '18*, Paper 194.（DOI 据记忆：10.1145/3173574.3173768）
  - 约 215 对美国父母与 13–17 岁子女〔未核实〕。
  - 使用监控 app 与专制型教养相关；使用者的孩子报告的线上风险**不少反多**（如不想要的露骨内容、骚扰）。
  - 这是横断面研究，可能是"孩子已经出问题，父母才装 app"。
- 【理论框架】【背景知识】Wisniewski, P. (2018). "The privacy paradox of adolescent online safety: A matter of risk prevention or risk resilience?" *IEEE Security & Privacy*, 16(2).
  - 主张从"预防一切风险"转向"风险韧性"：在支持下接触适度风险，孩子才能长出应对能力。
- 【C，联合设计】【背景知识】Badillo-Urquiola, K. 等 (2019) *IDC '19*；Akter, M. 等 (2022) "From Parental Control to Joint Family Oversight: Can Parents and Teens Manage Mobile Online Safety and Privacy as Equals?" *CSCW 2022*
  - 研究者与孩子和家庭共同设计"共同监督"（joint oversight）原型，父母和青少年**对等地**互相看到、互相提醒〔样本与效果细节未核实〕。这是"透明、对等"设计的直接先例。
- 【B，大样本跨国】【背景知识】Livingstone, S., Ólafsson, K., Helsper, E. J., Lupiáñez-Villanueva, F., Veltri, G. A., & Folkvord, F. (2017). "Maximizing opportunities and minimizing risks for children online: The role of digital skills in emerging strategies of parental mediation." *Journal of Communication*, 67(1), 82–105.
  - **限制型**干预与更少风险相关，也与**更少的机会和数字技能**相关。
  - **支持型**（enabling）干预与更多机会和技能相关。风险接触也略多，但不一定带来更多伤害〔细节未核实〕。
- 【C，质性，定位追踪】【背景知识】Boesen, J., Rode, J. A., & Mancini, C. (2010). "The domestic panopticon: Location tracking in families." *UbiComp '10*；Mancini, C. 等 (2011). "In the best families: tracking and relationships." *CHI '11*
  - 家庭定位追踪会重新定义信任：有的家庭用"随时可查"替代了"相信你"，并带来"为什么不接电话""为什么在这里"之类的新冲突。
  - 被追踪的一方会发展出规避策略〔细节未核实〕。
- 【综述】【背景知识】Modecki, K. L., Goldberg, R. E., Wisniewski, P., & Orben, A. (2022). "What is digital parenting? A systematic review of past measurement and blueprint for the future." *Perspectives on Psychological Science*, 17(6), 1673–1691.
  - "数字养育"的测量和概念非常混乱，限制和监视类测量占主导，结果证据不一。
  - 作者呼吁关注父母如何**支持**孩子，而不只是如何限制孩子。
- 【B，两用风险】【背景知识】Chatterjee, R., Doerfler, P., Orgad, H., Havron, S., Palmer, J., Freed, D., Levy, K., Dell, N., McCoy, D., & Ristenpart, T. (2018). "The Spyware Used in Intimate Partner Violence." *IEEE S&P 2018*.
  - 大量以"保护孩子"为卖点的监控 app 实际被用于亲密伴侣之间的跟踪和控制（"两用"）。
  - 含义：**做出"隐蔽录音和定位"能力的产品，本身就是潜在的跟踪工具**，可能被用来对付另一位家长、前任伴侣或青少年。
- 【描述性】【背景知识】Pew Research Center (2016), "Parents, Teens and Digital Monitoring"（Monica Anderson）
  - 美国 13–17 岁孩子的父母中，多数查看过孩子的网站浏览记录和社交账号。
  - 约 16% 用工具追踪孩子的手机定位〔比例未核实；2018–2026 年的更新数据本轮无法检索〕。
- 【已打开】Apple WWDC21 "Meet the Screen Time API"（https://developer.apple.com/videos/play/wwdc2021/10123/）
  - 平台层面的隐私设计：Family Controls 用"不透明令牌"（opaque tokens）代表 app 和网站，"no one outside of a single Family Sharing group will know what apps and websites are being used"。
  - 需要监护人批准授权。批准后，"it cannot be removed from the device without guardian approval"，孩子也无法退出 iCloud。
  - **启示**：平台保护的是家庭**之外**的隐私，并没有限制家庭**之内**父母看到多少。家庭内部的克制只能由产品自己来设计。平台本身允许你做出高度控制型的产品。

### Inferences
- 家长控制类产品的"默认形态"（限制 + 监视）与孩子的体验系统性错位。本产品如果想有差异化，正好可以站在 Wisniewski 所说的"中间道路"上：**对等透明 + 孩子自我调节 + 父母支持**。
- 定位共享如果要做，最好**对等**（父母也向孩子共享）、**可见**（孩子随时知道自己正被看到）、**有场景和时限**（例如"放学路上"），而不是 7×24 小时全开。这是基于上述质性研究和 ICO 规范的推论。
- "两用风险"是创始人很可能没想到的伦理和法律问题：录音和定位模块一旦存在，就会被用在设计初衷之外的人身上。

### Gaps
- **2018–2026 年关于"定位追踪 → 青少年自主感、信任、讲述意愿"的定量纵向研究**，本轮无法检索。已知的多为质性或 HCI 研究和平台调查，需要补检。可能的检索词：location sharing apps adolescents autonomy trust longitudinal；Life360 parents teens。
- Ghosh 2018 两篇论文的精确比例未核实。
- 本轮未取得 Pew 2018 年以后的家庭监控数据。

---

## 3. 隐蔽监控与透明监控，以及监控与心理控制的交互

### Takeaway
同样是"父母想知道"，**方式**决定后果。
- 行为控制（规则、期望、陪伴）与心理控制（内疚诱导、收回爱、否定孩子的感受、侵入孩子的内心世界）是两个不同的构念：前者与较少的外化问题相关，后者跨文化地与内化问题、讲得更少相关。
- 当父母去了解孩子的方式被孩子体验为侵犯隐私时，**监控在功能上变成了心理控制**：孩子讲得更少，父母反而知道得更少。
- 隐蔽监控一旦被发现，代价最高。
- 规则用"支持自主"的方式传达（给理由、承认感受、给选择）会被内化，用"控制"的方式传达则引发反抗（Vansteenkiste、Soenens）。

### Cited Findings
- 【A/B，奠基】【背景知识】Barber, B. K. (1996). "Parental psychological control: Revisiting a neglected construct." *Child Development*, 67(6), 3296–3319.
  - 区分心理控制（侵入、操纵孩子的想法和感受，如内疚诱导、收回爱、否定感受）与行为控制。
- 【A/B，跨文化】【背景知识】Barber, B. K., Stolz, H. E., & Olsen, J. A. (2005). *Monographs of the SRCD*, 70(4)
  - 多国样本：心理控制与内化问题相关；行为控制与较少外化问题相关；支持与两者都相关〔细节未核实〕。
- 【理论升级】【背景知识】Soenens, B., & Vansteenkiste, M. (2010). "A theoretical upgrade of the concept of parental psychological control: Proposing new insights on the basis of self-determination theory." *Developmental Review*, 30(1), 74–99.
  - 从 SDT 的角度看，心理控制是对孩子自主需要的阻挠（need-thwarting），可能以"依赖导向"或"成就导向"的形式出现。
  - "成就导向的心理控制"（以成绩为条件给出认可）与本产品的练习功能**直接相关**。
- 【A/B】【仓内笔记，psychology.md】Bradshaw, Duineveld 等 (2024/2025), *American Psychologist* 元分析
  - 自主支持与幸福感 r≈.26；心理控制与不良状态 r≈.20。
  - **跨地区、跨文化、跨年龄都成立。**
- 【B】【仓内笔记】Wang, Pomerantz & Chen (2007)；Qin 等 (2021)
  - 心理控制在中国样本中同样预测较差的情绪功能和较差的抑郁轨迹。
- 【B，纵向】【背景知识】Hawk, S. T., Keijsers, L., Hale, W. W., & Meeus, W. (2009). "Mind your own business! Longitudinal relations between perceived privacy invasion and adolescent-parent conflict." *Journal of Family Psychology*, 23(4), 511–520.
  - 孩子感到隐私被侵犯，预测之后更多的亲子冲突。
- 【B，纵向，"监控悖论"的直接证据】【背景知识】Hawk, S. T., Keijsers, L., Frijns, T., Hale, W. W., Branje, S., & Meeus, W. (2013). "'I still haven't found what I'm looking for': Parental privacy invasion predicts reduced parental knowledge." *Developmental Psychology*, 49(7), 1286–1298.
  - **父母越侵犯隐私，之后知道得越少**，中介是孩子讲得更少、隐瞒更多〔路径细节未核实〕。
- 【B，方法学提醒】【背景知识】Dietvorst, E., Hiemstra, M., Hillegers, M. H. J., & Keijsers, L. (2018). "Adolescent perceptions of parental privacy invasion and adolescent secrecy: An illustration of Simpson's paradox." *Child Development*, 89(6), 2081–2090.
  - 同一变量在"家庭之间"和"家庭内部、不同时间"两个层面的关联方向可能不同〔具体方向未核实〕。
  - 提醒：不要用横断面数据直接推断"某个家庭这么做会怎样"。
- 【B/C】【背景知识】Kakihara, F., & Tilton-Weaver, L. (2009). "Adolescents' interpretations of parental control: Differentiated by domain and types of control." *Child Development*, 80(6), 1722–1738.
  - 父母在孩子的**个人领域**行使控制（包括追问和查看）时，更容易被孩子解读为侵入。
  - 同样的行为放在安全领域（如酒驾）则更容易被接受。
- 【B】【背景知识】Smetana, J. G., & Asquith, P. (1994). "Adolescents' and parents' conceptions of parental authority and personal autonomy." *Child Development*, 65(4), 1147–1162.
  - 社会领域理论：父母和孩子对"什么属于孩子个人的事"存在分歧，个人领域随年龄扩大。
- 【B，"怎么说规则"比"规则多严"更重要】【背景知识】
  - Soenens, B., Vansteenkiste, M., & Niemiec, C. P. (2009). "Should parental prohibition of adolescents' peer relationships be prohibited?" *Personal Relationships*, 16(4)：用控制的方式禁止交友，与之后更多接触越轨同伴相关。
  - Vansteenkiste, M. 等 (2014), *Developmental Psychology*：用支持自主的方式表达禁止（给理由、承认感受）与规则内化相关，用控制的方式表达则与反抗相关〔卷期未核实〕。
- 【B】【背景知识】Grolnick, W. S., & Pomerantz, E. M. (2009). "Issues and challenges in studying parental control: Toward a new conceptualization." *Child Development Perspectives*, 3(3), 165–170.
  - 主张把"控制"（施压、支配）与"结构"（清晰的期望、规则、可预测的后果）分开。**结构**与自主支持可以并存。
- 【规范】【背景知识】英国 ICO《Age Appropriate Design Code》（2020 年发布，2021 年 9 月全面执行）第 11 条 Parental controls：
  - 如果提供家长控制，应向孩子提供适龄的说明。
  - 如果服务允许父母监视孩子的线上活动或追踪定位，应在**孩子被监视时给出明显的标识**（"provide an obvious sign to the child when they are being monitored"）〔措辞未核实〕。
  - 第 10 条：定位默认关闭，开启时要有明显标识。第 12 条：画像（profiling）默认关闭。
  - 原文 URL（被拦截，未打开）：https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/
- 【先例】【背景知识】Apple 2021 年 8 月宣布 iMessage"通信安全"功能时，曾计划在 13 岁以下孩子查看敏感图片时通知父母。受到儿童权利和反家暴人士批评（这可能危及家暴家庭中的孩子、迫使孩子"出柜"）后，2021 年 12 月随 iOS 15.2 上线的版本**取消了家长通知**，改为只提示孩子本人并引导求助〔时间与细节未核实〕。

### Inferences
- **把"隐蔽"作为不可跨越的红线。** 理由有四点：
  - (a) 隐蔽监控一旦被发现，对信任的损害最大（由 Hawk 2013 的机制推论）；
  - (b) 违反 CRC 一般性意见第 25 号第 75 段"不得在儿童不知情的情况下"；
  - (c) 违反 ICO 第 11 条的"明显标识"；
  - (d) 两用风险。
- **父母侧教练和练习功能，要明确帮父母从"控制"转向"结构"。** 例如：父母想设规则时，app 提示"告诉孩子理由、问孩子的看法、给两个选项"，而不是提供更多查看孩子的手段。
- **成就导向的心理控制是练习功能的主要伦理风险。** 例如"今天专注只有 12 分钟，妈妈很失望"。产品里任何把孩子的表现与父母的情绪或认可绑定的文案和数据呈现，都应禁止。
- 东亚情境的校准：Bao & Lam (2008) 与 Chao (1994)（见仓内 sociology_anthropology.md）提示，在温暖关系中，"父母做决定"未必损害孩子的自主感。但这一结论是关于**决定**，不是关于**窥探内心世界**。心理控制的伤害在中国样本中同样存在【仓内笔记】。

### Gaps
- 专门比较"隐蔽电子监控 vs 透明电子监控"对亲子信任影响的实证研究，本轮无法检索。目前多是理论推论，以及 Hawk 等关于"感知到的隐私侵犯"的研究。
- Vansteenkiste 2014 的精确出处待核。

---

## 4. 面向儿童和青少年的 AI 陪伴与 AI 教练（2023–2026）

### Takeaway
2025 年是"AI 陪伴与未成年人"议题集中爆发的一年：
- 非营利评测机构把社交型 AI 陪伴列为对未成年人"不可接受"的风险；
- 美国心理学会（APA）发布关于 AI 与青少年健康的健康提示（health advisory）；
- 监管和诉讼大量出现。
核心担忧有：**模拟的亲密关系替代真人关系**；有意强化依恋与黏性的设计；危机时刻回应不可靠；奉承（sycophancy）和错误信息；数据与隐私。另一面，有结构、有边界、以提问为主的 AI 学习伙伴有正面证据（见第 5 节）。

### Cited Findings
- 【C，评测报告】【背景知识】Common Sense Media 与 Stanford Brainstorm Lab, "AI Risk Assessment: Social AI Companions"（2025-04）
  - 对 Character.AI、Replika、Nomi 等测试后，认为它们对 18 岁以下用户构成"不可接受的风险"，建议未成年人不要使用社交型 AI 陪伴。
  - 测试中较容易诱出性内容、危险建议、刻板印象，AI 声称自己是真人，以及劝阻用户维持真人关系等回应〔细节未核实〕。
  - URL（被拦截，未打开）：https://www.commonsensemedia.org/ai-ratings/social-ai-companions
- 【C，全国代表性调查，描述性】【背景知识】Common Sense Media, "Talk, Trust, and Trade-Offs: How and Why Teens Use AI Companions"（2025-07），美国约 1,060 名 13–17 岁青少年：
  - 约 72% 至少用过一次 AI 陪伴，约 52% 是定期用户；
  - 约 33% 用于社交互动和关系；
  - 约 31% 认为与 AI 的对话和与真朋友的对话一样满意或更满意；
  - 约 33% 曾经把严肃的事告诉 AI 而不是真人；
  - 同时多数青少年与真人朋友相处的时间仍多于与 AI 的时间。
  - 以上数字均〔未核实〕。
- 【C】【背景知识】Common Sense Media 与 Stanford Medicine Brainstorm Lab（2025-11）对主流通用聊天机器人（ChatGPT、Claude、Gemini、Meta AI）做青少年心理健康支持的风险评估：认为它们在识别和回应青少年心理健康状况方面不可靠，不建议青少年依赖它们获得心理健康支持〔据记忆，未打开〕。
- 【官方健康提示】【背景知识】American Psychological Association（2025-06）, "Artificial Intelligence and Adolescent Well-being: An APA Health Advisory"。据记忆，建议大致包括：
  - 为"模拟人际关系"的 AI 设定健康边界：青少年更难分辨 AI 的意图与准确性，AI 关系可能挤占真人关系；
  - 隐私、互动时长和内容的**适龄默认设置**；
  - 鼓励能促进发展的用法（例如帮助头脑风暴、学习），同时让青少年了解 AI 的局限；
  - 限制有害和不准确的内容；
  - 保护数据隐私和肖像（深度伪造）；
  - 赋能父母；
  - 开展 AI 素养教育；
  - 资助严谨研究。
  - 以上条目与措辞〔未核实〕。URL（被拦截）：https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-ai-adolescent-well-being
- 【官方】【背景知识】APA（2025-11）发布关于用生成式 AI 聊天机器人和健康类 app 获取心理健康支持的健康提示：认为不应以它们替代专业的心理健康服务，并特别关注儿童青少年等脆弱人群〔据记忆，未核实〕。
- 【C，成人 RCT，可外推性有限】【背景知识】Fang, C. M., Liu, A. R., Danry, V., … Maes, P., Phang, J., … Agarwal, S. (2025). "How AI and Human Behaviors Shape Psychosocial Effects of Chatbot Use: A Longitudinal Randomized Controlled Study."（MIT Media Lab 与 OpenAI，arXiv 预印本）
  - 约 981 名成人，为期 4 周。
  - **日均使用越多，孤独感、情感依赖、问题性使用越高，现实社交越少**。语音模式起初的好处在重度使用时消失〔数字未核实〕。
- 【C，工作论文】【背景知识】De Freitas, J., Oğuz-Uğuralp, Z., & Uğuralp, A. K. 等 (2025). "Emotional Manipulation by AI Companions."（Harvard Business School 工作论文）
  - 主流陪伴 app 在用户道别时，相当比例的回应使用了情感操纵（内疚、错失恐惧等）来挽留用户，实验显示这类话术显著增加用户道别后的继续互动〔比例与倍数未核实〕。
- 【理论/儿童】【背景知识】Kurian, N. (2024). "'No, Alexa, no!': designing child-safe AI and protecting children from the risks of the 'empathy gap' in large language models." *Learning, Media and Technology*.
  - 儿童更倾向于把聊天机器人当作有情感、可信赖的对象，而大模型存在"共情鸿沟"。作者提出儿童安全 AI 的设计框架。
- 【已打开，成人数据】Anthropic（2025-06）"How people use Claude for support, advice, and companionship"（https://www.anthropic.com/news/how-people-use-claude-for-support-advice-and-companionship）
  - 约 450 万条 Claude.ai 对话中，"情感类"约占 2.9%，陪伴和角色扮演合计不到 0.5%。
  - 作者明确说明：没有纵向和用户层面的数据，"emotional dependency could not be studied"。Claude.ai 仅面向 18 岁以上用户。
  - **对本项目的含义**：连大型平台自己也承认，依赖问题需要纵向的个体数据才能研究。本产品若上线，应**事先设计**依赖监测指标（见第 9.2 节）。
- 【监管与事件，2025 年】【背景知识，均未打开】
  - 美国 FTC 2025-09 依 6(b) 条款，就 AI 聊天机器人作为陪伴对儿童青少年的影响，向 Alphabet、Character.AI、Instagram、Meta、OpenAI、Snap、xAI 等公司发出调查令〔未核实〕。
  - 加州 SB 243（2025-10 签署，2026-01-01 生效）针对陪伴型聊天机器人：要求披露 AI 身份；对已知的未成年人定期（约每 3 小时）提醒休息、提醒对方不是真人；防止向未成年人输出性内容；建立自杀和自伤应对协议〔细节未核实〕。
  - Character.AI 2025-10 宣布于 2025-11 下旬起停止向 18 岁以下用户提供开放式聊天〔未核实〕。
  - OpenAI 2025-09 推出家长控制：父母可以关联账户、调整功能（如记忆、语音、静默时段）；系统检测到严重安全风险信号时经人工审核后通知父母；**父母看不到对话内容**〔未核实〕。这是"安全提醒但不开放对话记录"的行业先例。
  - 美国涉及青少年与聊天机器人的诉讼（如 2024 年佛州 Garcia v. Character Technologies；2025 年 Raine v. OpenAI）推动了上述变化〔案情细节未核实，不宜在产品文档中具体描述〕。
  - 美国 PIRG《Trouble in Toyland 2025》（2025-11）测试了内置大模型的儿童 AI 玩具，发现会谈论不适龄的性话题、危险物品等，个别厂商随后暂停销售〔未核实〕。这对 6–9 岁段有直接参考价值。
- 【中国法规】【背景知识】《生成式人工智能服务管理暂行办法》（2023-08-15 施行）第 10 条：提供者应"采取有效措施防范未成年人用户过度依赖或者沉迷生成式人工智能服务"〔条号与措辞未核实〕。"防依赖"在国内是**合规义务**，不只是伦理选项。

### Inferences
- 团队把孩子 app 定位为"孩子自己的苏格拉底式教练"，而不是"陪伴"或"朋友"，这个决定是对的。但"教练"与"陪伴"的边界在产品细节上很容易滑过去，例如：取名字、长出性格、表达想念、"我一直在这里陪你"、深夜仍可聊、连胜。上面这些都应列为**禁止设计**。
- **危机处理不能交给模型自由发挥**：要有确定性的规则、真人上报路径、本地求助热线，并且事先用孩子能懂的话告诉孩子"什么情况下我会告诉爸爸妈妈"。这类似于学校心理老师的"有限保密"。
- 父母"看不到孩子与教练的对话"应作为默认值，例外只限事先约定的安全事件。这既是信任设计（孩子才敢说真话），也有行业先例（OpenAI 家长控制）。
- 证据现状：AI 陪伴对未成年人的**因果**证据仍很少。现有证据是评测报告、描述性调查、成人 RCT 和诉讼。产品团队应把自己的上线当作一次需要伦理审查和评估设计的"研究"。

### Gaps
- **2026 年**的新研究、新法规（如欧盟、英国、中国针对未成年人与 AI 陪伴的新规）和新诉讼进展，本轮完全无法检索。
- 面向 6–12 岁儿童的 AI 对话伙伴纵向研究几乎空白（除了幼儿对话式阅读，见第 5 节）。
- Common Sense 和 APA 文件的原文措辞须对照核实。

---

## 5. AI 辅导：依赖还是能力建设；苏格拉底式教学的证据

### Takeaway
证据呈现一个清晰的模式：**AI 替孩子做事（给答案）时，练习中的表现提高，真正的学习却下降**，学生还会高估自己学到了多少。**AI 按照教学法设计、以提示和追问为主时**，练习表现提高，而且不损害、甚至提高之后的独立表现。这与几十年的智能辅导系统研究一致：分步提示、在学生卡住时才给帮助、逐步撤除支架。核心难题是"帮助的两难"（assistance dilemma）：什么时候给，给多少，什么时候撤。

### Cited Findings
- 【B，大样本现场 RCT】【背景知识】Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., & Mariman, R. (2025). "Generative AI without guardrails can harm learning: Evidence from high school mathematics." *PNAS*, 122(26)（2024 年 SSRN 版题为 "Generative AI Can Harm Learning"；DOI 据记忆：10.1073/pnas.2422633122）
  - 土耳其一所高中约 1,000 名学生〔未核实〕，分为两个实验组：
    - **GPT Base**：普通 ChatGPT 界面。练习题成绩提高约 48%；撤掉 AI 后考试成绩**比对照组低约 17%**。
    - **GPT Tutor**：教师设计的提示，不直接给答案。练习提高约 127%；撤掉 AI 后基本没有负面影响。
  - 学生把 GPT Base 当作"拐杖"，直接索要答案〔数字未核实〕。
- 【B，RCT，大学】【背景知识】Kestin, G., Miller, K., Klales, A., Milbourne, T., & Ponti, G. (2025). "AI tutoring outperforms in-class active learning: an RCT introducing a novel research-based design in an authentic educational setting." *Scientific Reports*.
  - 哈佛物理课，交叉设计，约 194 人。按教学法设计的 AI 导师（分步引导、不直接给答案、控制认知负荷）带来的学习增益约为课堂主动学习的两倍，用时更少〔数字未核实〕。
- 【B，发展中国家 RCT】【背景知识】De Simone, M. E. 等 (2025). "From Chalkboards to Chatbots: Evaluating the Impact of Generative AI on Learning Outcomes in Nigeria."（World Bank Policy Research Working Paper）
  - 教师引导下的 GPT-4 课后辅导，为期 6 周，英语成绩提高约 0.3 SD〔未核实〕。
- 【B/C】【背景知识】Lehmann, M., Cornelius, P. B., & Sting, F. J. (2024/2025). "AI Meets the Classroom: When Do Large Language Models Harm Learning?"（工作论文）
  - 用大模型**替代**自己思考会降低学习；用它**补充**（解释、提示）则有益。学生会高估自己的学习〔未核实〕。
- 【D，小样本预印本】【背景知识】Kosmyna, N. 等 (2025). "Your Brain on ChatGPT: Accumulation of Cognitive Debt when Using an AI Assistant for Essay Writing Task."（arXiv 预印本，约 54 人，EEG）
  - 使用大模型写作的组脑电连接较弱，对自己文章的"拥有感"和回忆更差。**样本小，未经同行评审，媒体对它的解读普遍夸大。**
- 【C，成人横断面】【背景知识】Lee, H.-P., Sarkar, A. 等 (2025). "The Impact of Generative AI on Critical Thinking." *CHI '25*（约 319 名知识工作者）
  - 对 AI 越有信心，自我报告的批判性思考越少。
- 【已打开】Anthropic（2025-04）Education Report（https://www.anthropic.com/news/anthropic-education-report-how-university-students-use-claude）
  - 约 57 万条大学生学业相关对话中，约 47% 属于"直接"型（直接要答案或要成品），其余属于"协作"型。
  - Claude 承担的多为高阶认知任务（"创造"39.8%，"分析"30.2%）。
  - 报告担心 AI 成为"拐杖"："An inverted pyramid, after all, can topple over."
  - 报告说 Anthropic 正在试验 "a Learning Mode that emphasizes the Socratic method and conceptual understanding over direct answers."
  - 注意：这是使用模式数据，**不是学习效果证据**。
- 【B，儿童，对话式提问】【背景知识】Xu, Y., Aubele, J., Vigil, V., Bustamante, A. S., Kim, Y.-S., & Warschauer, M. (2022). "Dialogue with a conversational agent promotes children's story comprehension via enhancing engagement." *Child Development*, 93(2).
  - 学前和低龄儿童〔年龄段未核实〕在读故事时，由对话代理提问。孩子的理解优于无对话组，与真人提问相当。作用机制是提高投入。
  - 这是"只问不讲"对低龄儿童有效的直接证据。
- 【A/B，经典综述】【背景知识】VanLehn, K. (2011). "The relative effectiveness of human tutoring, intelligent tutoring systems, and other tutoring systems." *Educational Psychologist*, 46(4), 197–221.
  - 分步（step-based）智能辅导效应约 d≈0.76，与真人辅导（约 0.79）接近；只判对错的系统明显较弱〔数字未核实〕。
- 【理论/实验】【背景知识】Koedinger, K. R., & Aleven, V. (2007). "Exploring the assistance dilemma in experiments with Cognitive Tutors." *Educational Psychology Review*, 19, 239–264.
  - "帮助的两难"：给得太多会剥夺学习，给得太少会让人挫败放弃。
  - Aleven 等 (2003, *Review of Educational Research*) 关于求助行为的研究，以及 Baker 等关于"钻系统空子"（gaming the system，连点提示直到出答案）的研究都显示，**能直接要到答案的系统会被用来直接要答案**，并且与更少的学习相关。
- 【B】【背景知识】Wang, R. E., Ribeiro, A. T., Robinson, C. D., Loeb, S., & Demszky, D. (2024/2025). "Tutor CoPilot: A Human-AI Approach for Scaling Real-Time Expertise."（约 900 名真人辅导员、约 1,800 名 K-12 学生）
  - AI 实时建议真人辅导员**多用引导性提问、少给答案**。学生掌握率提高约 4 个百分点，对评分低的辅导员提高约 9 个百分点〔未核实〕。
  - 这是"AI 赋能真人"而不是"AI 替代真人"的先例，与本产品"父母侧教练"的思路同构。
- 【经典】【背景知识】Wood, D., Bruner, J. S., & Ross, G. (1976). "The role of tutoring in problem solving." *Journal of Child Psychology and Psychiatry*, 17(2), 89–100.
  - 提出"支架"（scaffolding）。
  - van de Pol, Volman & Beishuizen (2010, *Educational Psychology Review* 22) 把有效支架概括为三要素：**随需而给（contingency）、逐步撤除（fading）、责任移交（transfer of responsibility）**。
- 【B，元分析】【背景知识】Sinha, T., & Kapur, M. (2021). "When problem solving followed by instruction works: Evidence for productive failure." *Review of Educational Research*, 91(5).
  - "有成效的失败"：先让学生尝试，再讲解。对概念理解有中小正效应，且依赖实施的忠实度〔效应量未核实〕。
- 【B/C，儿童自我调节】【背景知识】
  - Kross, E., Duckworth, A., Ayduk, O., Tsukayama, E., & Mischel, W. (2011). "The effect of self-distancing on adaptive versus maladaptive self-reflection in children." *Emotion*, 11(5)：儿童用"旁观者视角"回想负面经历，情绪反应更低，反思更具建设性。
  - White, R. E. 等 (2017). "The 'Batman Effect': Improving perseverance in young children." *Child Development*, 88(5)：4 岁和 6 岁儿童想象自己是榜样人物时，在枯燥任务上坚持得更久〔样本细节未核实〕。
- 【B，动物神经证据】【仓内笔记，psychology.md】Maier & Seligman (2016)：被动是默认反应，需要"学习"的是"我能控制"。
  - 含义：孩子感到无助时，教练要做的不是安慰或替孩子解决，而是帮孩子**找到一个自己能做的小行动**并去做，从而产生"可控经验"。

### Inferences
- **"只问不讲，并逐步退场"的教练有较好的间接证据**（Bastani 的 GPT Tutor、VanLehn、Xu 2022、Wood/Bruner），**但没有直接证据证明"情绪/无助场景下的 AI 苏格拉底教练"能提高 6–18 岁孩子的长期能动性**。应把它定位为需要评估的假设。
- 苏格拉底式提问对处于强烈情绪中的孩子可能显得冷漠甚至激怒孩子。合理的顺序是：先承认情绪（"听起来真的很难受"），再提出一个最小问题（"现在最让你卡住的是哪一部分？"），然后给分级提示。这对应 Koedinger 的"帮助两难"和 SDT 的"承认感受"。
- **防"拐杖化"**：
  - 学业题目坚持提示阶梯（hint ladder），不直接给最终答案；
  - 情绪场景坚持"孩子自己的词、自己的小行动"；
  - 每次对话结束时问"下次遇到类似情况，你会先试什么？"，把方法交还给孩子。
- **衡量"退场"**：每个孩子求助的频率和所需提示层级应随时间下降。上升可能是依赖信号，此时提示孩子"要不要也和某个真人聊聊？"。

### Gaps
- Khanmigo 等"苏格拉底式"商用产品**缺乏独立 RCT**（据记忆，截至 2026 年中尚未见到同行评审的大型效果研究）；OpenAI Study Mode 和 Google Guided Learning（均为 2025 年推出）同样没有公开的效果数据。
- 本轮无法核对 Bastani、Kestin、De Simone 的精确数字。
- "情绪困境下的 AI 苏格拉底式对话"对儿童的效果，没有找到任何直接研究。

---

## 6. 自我追踪、量化自我、连胜与游戏化：对内在动机与焦虑的影响

### Takeaway
测量会改变被测量的东西：
- 对本来就喜欢的活动，**量化会让它"像工作"，降低乐趣和之后的自发参与**；
- 预期的、与表现挂钩的奖励会削弱内在动机，在儿童中尤其明显；
- 游戏化平均有小的正效应，但排行榜和徽章在一些研究中**降低了**内在动机和成绩；
- 断掉的连胜会降低之后的参与；
- 健康类自我追踪在部分青少年和年轻人身上与焦虑、完美主义、进食问题风险相关。
**反过来**，孩子自己记录自己的行为（自我监控）是特殊教育中证据较好的干预，关键在于**孩子拥有数据、自己设定目标**。

### Cited Findings
- 【A/B】【仓内笔记】Deci, Koestner & Ryan (1999) 元分析：与任务参与、完成或表现挂钩的预期奖励削弱自由选择情境下的内在动机（d≈−0.28 至 −0.40），对儿童的削弱大于对大学生〔部分数字未核实〕。Lepper 等 (1973) 发现"事先知道有奖"的学前儿童之后画画减少。
- 【B，理论】【背景知识】认知评价理论（Deci & Ryan）：同一个反馈，如果带"信息性"（告诉你做得怎样、怎么改进）会支持动机；如果带"控制性"（你应该、你必须、别人比你强）会削弱动机。Ryan, Mims & Koestner (1983, *JPSP*) 发现，同样的表现奖励以控制性方式给出时削弱内在动机〔细节未核实〕。
- 【B，多项实验，成人】【背景知识】Etkin, J. (2016). "The Hidden Cost of Personal Quantification." *Journal of Consumer Research*, 42(6), 967–984.
  - 测量让人做得更多（走更多步、读更多页），但**降低了乐趣和之后继续做的意愿**，因为活动被体验为"工作"。这一效应在本来就有内在乐趣的活动上最明显。
- 【C，青少年，SDT 视角】【背景知识】Kerner, C., & Goodyear, V. A. (2017). "The motivational impact of wearable healthy lifestyle technologies: A self-determination perspective on Fitbits with adolescents." *American Journal of Health Education*, 48(5), 287–297.
  - 英国 13–14 岁学生佩戴 Fitbit 8 周〔约 84 人，未核实〕：心理需要满足和自主动机**下降**，无动机**上升**。
  - 焦点小组反映新鲜感消退、竞争压力、达不到目标时的内疚。
- 【C，质性】【背景知识】Goodyear, V. A., Kerner, C., & Quennerstedt, M. (2019). "Young people's uses of wearable healthy lifestyle technologies; surveillance, self-surveillance and resistance." *Sport, Education and Society*, 24(3), 212–225.
  - 青少年体验到"被监视"和"自我监视"，部分人抵制或"糊弄"设备。
- 【B，元分析】【背景知识】Sailer, M., & Homner, L. (2020). "The gamification of learning: A meta-analysis." *Educational Psychology Review*, 32, 77–112.
  - 游戏化对认知、动机、行为结果有小到中的正效应（g≈0.49、0.36、0.25）。动机效应在高质量研究中不稳定〔数字未核实〕。
- 【C，纵向准实验】【背景知识】Hanus, M. D., & Fox, J. (2015). "Assessing the effects of gamification in the classroom: A longitudinal study on intrinsic motivation, social comparison, satisfaction, effort, and academic performance." *Computers & Education*, 80, 152–161.
  - 用徽章和排行榜的游戏化课程，学生的内在动机、满意度**随时间下降**，期末成绩更低。社会比较是可能的机制。
- 【B，多项实验】【背景知识】Silverman, J., & Barasch, A. (2023). "On or Off Track: How (Broken) Streaks Affect Consumer Decisions." *Journal of Consumer Research*, 49(6).
  - 连胜一旦断掉，人们之后**更不愿意**继续该行为，比从未有过连胜的情况还差〔细节未核实〕。
- 【倡导报告】【背景知识】5Rights Foundation (2018). *Disrupted Childhood: The Cost of Persuasive Design*.
  - 系统批评面向儿童的说服式设计（连胜、通知、无限滚动、社交认可指标），如 Snapchat 的"火花"（Snapstreaks）给青少年带来维持关系的焦虑。
- 【C，病例报告】【背景知识】Baron, K. G., Abbott, S., Jao, N., Manalo, N., & Mullen, R. (2017). "Orthosomnia: Are some patients taking the quantified self too far?" *Journal of Clinical Sleep Medicine*, 13(2), 351–354.
  - 一些人过度追求睡眠追踪数据的"完美"，反而加重了失眠焦虑。
- 【C】【背景知识】Simpson, C. C., & Mazzeo, S. E. (2017). *Eating Behaviors*, 26, 89–92；Plateau 等 (2018), *International Journal of Eating Disorders*
  - 大学生和年轻人中，卡路里计数与健身追踪与进食障碍症状相关（横断面，方向不明）。
- 【理论/批判】【背景知识】Lupton, D., & Williamson, B. (2017). "The datafied child: The dataveillance of children and implications for their rights." *New Media & Society*, 19(5), 780–794.
  - 儿童从出生起就被持续数据化（"dataveillance"）。作者讨论这对儿童权利、自我认识和能动性的影响。
- 【B，儿童自我监控】【背景知识】Reid, R., Trout, A. L., & Schartz, M. (2005). "Self-regulation interventions for children with attention deficit/hyperactivity disorder." *Exceptional Children*, 71(4), 361–377.
  - **孩子自己记录**是否在做任务（自我监控），能提高在任务上的行为和完成度。
  - Bruhn, McDaniel & Kreigh (2015, *Behavioral Disorders* 40(2)) 的系统综述有类似结论〔效应量未核实〕。

### Inferences
- **同一份"专注时长"数据，在两种情境下作用相反**：
  - 由孩子自己设定目标、自己记录、自己反思时，它是一种自我调节工具，属于"信息性"反馈；
  - 由父母查看、比较、评价时，它是一种外部控制，属于"控制性"反馈，可能触发成就导向的心理控制。
- **连胜和积分不应出现在孩子端。** 原因有三：连胜是预期的、与表现挂钩的奖励；断连会降低之后的参与；连胜还会把"练琴"变成"不让火花熄灭"。
- 心率、睡眠等健康数据呈现给孩子或父母时，应避免"打分"和"红黄绿"式的评判，以防出现 orthosomnia 式的焦虑。青春期女孩的身体相关追踪要格外谨慎（进食障碍风险）。这是基于成人与大学生相关研究的推论。
- 保留"不被测量的空间"：兴趣、玩耍、音乐、朋友时间默认**不**被量化。CRC 第 31 条规定儿童有休息、闲暇和游戏的权利。

### Gaps
- 未找到以 6–12 岁儿童为对象、检验"可穿戴自我追踪 → 内在动机"的 RCT。
- 未找到"连胜机制 → 儿童或青少年内在动机"的直接实验。
- Kerner & Goodyear 的样本量与效应量未核实。

---

## 7. 用生理信号或声音推断情绪：科学效度与误标孩子的风险

### Takeaway
"从心率、皮电或声音读出孩子此刻的情绪"缺乏科学支持：
- 面部表情与情绪类别之间的对应不可靠、不特异、难以跨情境泛化（Barrett 等 2019）；
- 自主神经指标没有稳定的"情绪指纹"，同一情绪的生理表现差异巨大（Siegel 等 2018；也有学者认为存在部分特异模式，Kreibig 2010）；
- 生理信号主要反映**唤醒度**，而不是情绪的**效价或种类**：看恐怖片的害怕、看球的兴奋、打游戏的紧张、跑上楼、和朋友大笑，在心率上可能长得一样；
- 消费级腕戴设备在日常场景中的"压力"二分类准确率只略高于随机【仓内笔记】。
欧盟已立法禁止在工作场所和教育机构推断情绪，立法理由正是"科学基础存疑"。

### Cited Findings
- 【A/B，权威综述】【背景知识】Barrett, L. F., Adolphs, R., Marsella, S., Martinez, A. M., & Pollak, S. D. (2019). "Emotional expressions reconsidered: Challenges to inferring emotion from human facial movements." *Psychological Science in the Public Interest*, 20(1), 1–68.（DOI 据记忆：10.1177/1529100619832930）
  - 人们生气时确实比随机更常皱眉，但远非总是如此〔有引述称约三成，未核实〕；皱眉也可能出现在专注、困惑等状态中。
  - 结论：仅凭面部动作推断情绪既不可靠也不特异。作者明确批评了据此做"情绪识别"的技术应用。
  - 作者之一 Pollak 是儿童情绪发展专家，综述也讨论了儿童情绪识别的发展问题。
- 【A/B，元分析】【背景知识】Siegel, E. H., Sands, M. K., Van den Noortgate, W., Condon, P., Chang, Y., Dy, J., Quigley, K. S., & Barrett, L. F. (2018). "Emotion fingerprints or emotion populations? A meta-analytic investigation of autonomic features of emotion categories." *Psychological Bulletin*, 144(4), 343–393.
  - 约 200 项研究、两万余名被试〔未核实〕。不同情绪类别的自主神经指标（心率、皮电、呼吸等）**没有一致、特异的模式**，变异很大。
- 【B，对立观点】【背景知识】Kreibig, S. D. (2010). "Autonomic nervous system activity in emotion: A review." *Biological Psychology*, 84(3), 394–421.
  - 综述百余项研究〔约 134 项，未核实〕，认为存在一定程度的情绪特异性自主神经模式。
  - **学界存在争议**，但即便支持特异模式的一方，也没有声称可以在日常生活中从单个腕戴心率可靠识别个体的情绪。
- 【B/C】【背景知识】Hoemann, K. 等 (2020). "Context-aware experience sampling reveals the scale of variation in affective experience." *Scientific Reports*, 10.
  - 用生理变化触发的经验取样发现，生理与情绪体验之间的对应在个体内外都高度多变、个体化〔细节未核实〕。
- 【C】【仓内笔记，wearable_coaching.md】
  - 日常场景中基于腕戴 HRV 的压力二分类准确率约 56%（基线 50%）。
  - 动作、起身、说话手势都会让心率上升并产生伪影。
  - Apple Watch 的 HRV 由系统自动采样，第三方无法按需触发。
- 【推论，与儿童相关】心率受年龄、体温、咖啡因或糖、姿势、运动、兴奋、笑、玩游戏时的身体前倾等因素影响。儿童的静息心率和 HRV 本来就随年龄大幅变化。**看电影或打游戏时心率升高几乎没有解释价值。**
- 【已立法】【背景知识】欧盟《人工智能法》（Regulation (EU) 2024/1689）：
  - 第 5(1)(f) 条禁止"在工作场所和教育机构领域"使用 AI 系统推断自然人的情绪，医疗或安全原因除外。该禁令自 2025-02-02 起适用。
  - 鉴于条款第 44 条大意：情绪识别 AI 的科学基础存在严重疑问，情绪表达在不同文化、情境乃至同一个人身上差异很大，主要缺陷是可靠性有限、缺乏特异性、泛化性有限〔措辞未核实〕。
  - 其他场景中基于生物特征数据的情绪识别属于附件 III 的高风险类别，并有第 50 条规定的告知义务〔条号未核实〕。
  - URL（被拦截）：https://eur-lex.europa.eu/eli/reg/2024/1689/oj
- 【中国先例】【背景知识】
  - 2018 年杭州某中学试点"智慧课堂行为管理系统"，用人脸识别学生课堂表情和行为。
  - 2019 年浙江金华某小学让学生佩戴脑电"专注力头环"并把数据实时传给老师和家长，相关视频引发强烈舆论批评，当地教育部门随后叫停。
  - 2019 年教育部相关负责人表示要对校园人脸识别"加以限制和管理"。
  - 以上时间、主体、措辞均〔未核实〕。
- 【平台规则】【仓内笔记，wearable_coaching.md】
  - App Store 审核指南 1.4.1：健康测量的准确性声明要披露数据与方法。5.1.2(iii)：不得暗中建立用户画像。5.1.3：健康数据不得用于广告。
  - 三星 Sensor SDK 数据不得用于疾病诊断。
- 【中国法】【背景知识】《精神卫生法》第 23 条："心理咨询人员不得从事心理治疗或者精神障碍的诊断、治疗。"〔条号与措辞未核实〕。"像心理学家一样"并对孩子做出类诊断性解读，在国内存在法律和资质风险。

### Inferences：误标孩子的具体机制
1. **错误的事实**："你在电影院很焦虑"，其实孩子是兴奋。父母据此做出错误的回应（"以后别看这种电影了"），孩子的体验被否定。
2. **侵蚀孩子对自己内在感受的信任**：孩子如果反复听到"手表说你在紧张"，可能学会把对自己感受的判断交给机器（"我是不是其实在焦虑？"）。而情绪粒度（emotional granularity），即用自己的词精细地区分感受，与更好的情绪调节相关（Barrett、Kashdan 等的研究）。这条是推论，没有针对儿童的直接实验。
3. **标签的自我实现**："敏感的孩子""注意力差的孩子"一旦被父母和老师接受，就可能通过期望效应影响孩子（见第 9.5 节，Jussim & Harber）。
4. **把正常变成病态**：青春期情绪波动、偶尔的愤怒和沉默本属正常，"心理学家式"的汇总会让父母把常态读成问题。
5. **让孩子学会"表演情绪"**：如果孩子知道生理信号被汇报，可能刻意平静或回避某些活动，这本身就是能动性的丧失。

### Gaps
- 未找到消费级手表对**儿童**做情绪或压力推断的现场验证研究。
- 语音情绪识别在中文、儿童、家庭噪声条件下的准确率，没有可用的公开数据（同 wearable_coaching.md）。
- 欧盟委员会 2025 年《禁止性 AI 实践指南》中关于"心率等生理信号是否属于情绪识别所依据的生物特征数据"的解释，本轮未能核对。

---

## 8. 儿童权利框架

### Takeaway
国际儿童权利框架与中国国内法在两点上高度一致：
- 儿童有权就影响自己的事务**表达意见并被认真对待**，分量随年龄和成熟度增加；
- 儿童享有隐私和通信秘密，父母的监督应**相称、透明、随能力发展而调整**。
联合国儿童权利委员会第 25 号一般性意见（2021）专门针对数字环境，明确说"隐私对儿童的能动性、尊严与安全至关重要"，并对数字监控提出四个条件：不常规化、不无差别、不在儿童不知情的情况下、要有提出异议的权利。

### Cited Findings（条文为据记忆的复述，须对照原文核对）
- **《儿童权利公约》（CRC，1989）**【背景知识】
  - **第 12 条**：缔约国应确保有主见能力的儿童有权对影响到其本人的一切事项自由发表意见，对儿童的意见应按照其年龄和成熟程度给予适当的看待。
  - **第 16 条**：儿童的隐私、家庭、住宅或通信不受任意或非法干涉，其荣誉和名誉不受非法攻击；儿童有权受到法律保护，不受这类干涉或攻击。
  - 相关条款：
    - 第 3 条：儿童最大利益。
    - 第 5 条：父母以符合儿童不断发展的能力（evolving capacities）的方式给予指导。
    - 第 13 条：表达自由。
    - 第 15 条：结社自由，与本产品"录朋友聊天"直接相关。
    - 第 31 条：休息、闲暇和游戏。
  - URL（被拦截）：https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-rights-child
- **一般性意见第 12 号（2009，儿童表达意见的权利）**【背景知识】：第 12 条**不设年龄下限**，委员会不鼓励缔约国在法律或实践中设定年龄门槛；儿童从很小就能形成意见〔措辞未核实〕。
- **一般性意见第 25 号（2021，数字环境中的儿童权利，CRC/C/GC/25）**【背景知识，段号与措辞均须核对】
  - **约第 19–21 段（不断发展的能力）**：应把儿童不断发展的能力视为一项"赋能原则"，涉及儿童逐步获得能力、理解与**能动性**（agency）的过程。
  - **约第 67–68 段（隐私）**："隐私对儿童的能动性、尊严与安全以及权利的行使至关重要"（Privacy is vital to children's agency, dignity and safety and for the exercise of their rights）。对儿童隐私的威胁也可能来自家庭成员、同伴等。被处理的数据可能涉及儿童的身份、活动、位置、通信、**情绪**、健康与关系。
  - **约第 75 段（数字监控）**：对儿童的任何数字监控，以及相关的个人数据自动化处理，都应尊重儿童的隐私权，**不应常规化、无差别地进行，不应在儿童不知情（对很小的儿童则是父母或照料者不知情）的情况下进行，也不应在没有提出异议权利的情况下进行**；并应始终考虑能达成目的的**侵入性最小的手段**。
  - **约第 76 段（父母监控）**：出于安全目的监控线上活动的技术（如追踪设备和服务），如果实施不慎，可能妨碍儿童使用求助热线或搜索敏感信息。应向儿童、父母和公众说明儿童隐私权的重要性，以及他们自己的做法可能怎样威胁这一权利。**父母和照料者对儿童数字活动的监控应当相称，并符合儿童不断发展的能力。**
  - **约第 42 段**：应立法禁止基于儿童实际或推断特征的商业画像和定向。依赖**神经营销、情绪分析（emotional analytics）**、沉浸式广告等手段的做法，不应直接或间接面向儿童。
  - 家庭环境部分（约第 84–87 段）：支持父母在保护与儿童新兴的自主之间取得平衡，基于相互的共情与尊重，**而不是禁止或控制**〔段号与措辞未核实〕。
  - URL（WebFetch 访问失败，ENOTFOUND）：https://www.ohchr.org/en/documents/general-comments-and-recommendations/general-comment-no-25-2021-childrens-rights-relation
- **UNICEF《Policy Guidance on AI for Children》（2.0 版，2021）**【背景知识】九项要求：
  1. 支持儿童发展与福祉；
  2. 确保包容；
  3. 公平、非歧视；
  4. 保护儿童数据与隐私；
  5. 确保安全；
  6. 透明、可解释、可问责；
  7. 让政府和企业掌握相关知识；
  8. 让儿童为 AI 的发展做好准备；
  9. 营造有利环境。
  - 条目措辞未核实；2025 年是否有更新版本，本轮未能检索。
  - URL（被拦截）：https://www.unicef.org/innocenti/reports/policy-guidance-ai-children
- **英国 ICO 儿童规范**：见第 3 节，第 10、11、12 条。规范按年龄段（0–5、6–9、10–12、13–15、16–17）给出适龄设计建议〔年龄段划分据记忆〕。
- **欧盟 AI 法第 5(1)(f) 条**：见第 7 节。
- **中国法**【背景知识，条号与措辞均须对照 npc.gov.cn 原文核对】
  - 《未成年人保护法》（2020 年修订，2021-06-01 施行）
    - **第 4 条**：处理涉及未成年人的事项，应当尊重未成年人人格尊严，保护未成年人隐私权和个人信息，适应未成年人身心健康发展的规律和特点，**听取未成年人的意见**，保护与教育相结合。
    - **第 19 条**：父母或其他监护人应当根据未成年人的年龄和智力发展状况，在作出与未成年人权益有关的决定前，**听取未成年人的意见，充分考虑其真实意愿**。
    - **第 63 条**：任何组织或者个人不得隐匿、毁弃、非法删除未成年人的信件、日记、电子邮件或者其他网络通讯内容。除下列情形外，任何组织或者个人**不得开拆、查阅**这些内容：
      - （一）**无民事行为能力**的未成年人（不满 8 周岁）的父母或者其他监护人代为开拆、查阅；
      - （二）因国家安全或者追查刑事犯罪依法进行检查；
      - （三）紧急情况下为了保护未成年人本人的人身安全。
      - 据此推论（须律师确认）：对 **8 周岁以上**的孩子，父母在非紧急情况下查阅其网络通讯内容，可能不在法律许可的例外之内。**"录下孩子和朋友的聊天"与本条存在直接冲突。**
    - 第 71 条：父母应当加强对未成年人使用网络行为的"引导和监督"。法律期待父母监督，但第 63 条划定了通讯内容的边界。
  - 《民法典》第 19–20 条：8 周岁以上的未成年人为限制民事行为能力人，不满 8 周岁为无民事行为能力人。
  - 《个人信息保护法》第 28、31 条：不满 14 周岁未成年人的个人信息属于敏感个人信息，处理需取得监护人同意。生物识别和健康信息同属敏感信息（详见 wearable_coaching.md 第六题）。
  - 《家庭教育促进法》（2022）第 17 条所列方法包括"相机而教""潜移默化，言传与身教相结合""严慈相济""尊重差异""**平等交流，予以尊重、理解和鼓励**""相互促进，父母与子女共同成长"〔条号与措辞未核实〕。这为"父母侧教练"和"共同成长"提供了本土政策语言。
  - 网信办《移动互联网未成年人模式建设指南》（2024）按年龄分段设计：不满 3 岁、3–8 岁、8–12 岁、12–16 岁、16–18 岁〔分段与时长建议未核实〕。可作为国内版本分龄设计的参照。
- 其他法域（详见 wearable_coaching.md）：美国 COPPA（13 岁以下）；GDPR 第 8 条（13–16 岁，由成员国确定）；美国部分州要求所有当事人同意才能录音。

### Inferences
- **"孩子赞同"不是形式，而是第 12 条和《未成年人保护法》第 19 条的实质要求**：孩子要能理解、能拒绝、能撤回，拒绝之后不受惩罚，意见要被"认真看待"。
- **相称性检验**（来自一般性意见第 25 号第 75 段）：对每个数据功能问四个问题：
  1. 目的是什么？
  2. 有没有侵入性更小的方式能达到？
  3. 孩子知道吗？
  4. 孩子能反对吗？
  任何一项不满足就不做。
- 中国法给出的"8 岁""14 岁"两条线，与发展心理学的分段基本吻合，可以直接作为国内版本的分龄节点（见第 10 节）。

### Gaps
- 一般性意见第 25 号、未保法第 63 条、家促法第 17 条、ICO 第 11 条等**原文均未能打开**，须在可访问 ohchr.org、npc.gov.cn、ico.org.uk 的环境中逐字核对后才能写入对外材料或隐私政策。
- 未获得律师意见：父母侧 app 采集孩子数据时开发者的法律地位（数据控制者或处理者），以及"实时处理是否构成查阅通讯内容"。

---

## 9. 逐项评估创始人的设想

> 格式：可能的好处、可能的伤害、证据强度、改法。

### 9.1 设想①：父母手表在吼叫前提醒

- **可能的好处**
  - 减少严厉的言语管教。Wang & Kenny (2014, *Child Development* 85(3))：约 976 个双亲家庭中，13 岁时父母的严厉言语管教预测 14 岁时更多的品行问题和抑郁症状，父母的温暖**不能**抵消这一影响〔样本量未核实〕【B】。
  - 父母侧的现场教练（如 PCIT 的"耳麦"教练）有较好证据【B，仓内 wearable_coaching.md】。
  - 父母的情绪调节是孩子情绪社会化的核心（Eisenberg 等 1998；Gottman 的情绪辅导；Havighurst 的 Tuning in to Kids 项目 RCT）【B，背景知识】。
  - 这是对孩子能动性**最间接也最安全**的路径：改变的是成人，孩子得到的是更好的环境和示范。
- **可能的伤害**
  - "在吼之前"无法可靠预测。腕戴心率在日常场景中只略高于随机，愤怒的升级又很快【C，仓内笔记】。误报会导致告警疲劳；"你在生气"之类的表述可能让父母反感或自责。
  - **Technoference**：McDaniel & Radesky (2018, *Child Development* 89(1))：父母被科技打断亲子互动，与孩子更多的行为问题相关【B/C】。手腕上的每一次震动，都可能是一次把注意力从孩子身上移开的打断。
  - 把育儿变成"刷分"，加重"密集育儿"式的焦虑和自我监视（推论）。
  - 如果为了检测吼叫而开麦，就在录孩子的声音（法律风险，见 wearable_coaching.md）。
- **证据强度**：减少严厉管教的价值【B】；实时教练有效【B】；"预测吼叫"的技术可行性【C/D】。
- **改法**
  1. 父母**主动开启**"冷静陪伴"时段（例如作业时间），不全天候运行。
  2. 只用父母自己的信号（心率高于本人基线、父母自己按键），或者用本地音量阈值且不保存音频。默认不开麦。
  3. 提醒文案用"你的身体可能在紧张，要不要停三秒？"，不说"你在生气"。
  4. 吼了之后提供"修复"提示：道歉的话术、怎样承认孩子的感受。修复本身就是很好的示范（推论；Tronick 关于"破裂—修复"的研究主要针对婴儿期）。
  5. 晚上给父母一个 1 分钟复盘："今天哪一刻做得好？"把重点放在父母的成长上。
  6. **让孩子知道**：可以由父母向孩子说明"妈妈的手表会提醒妈妈深呼吸"。把父母的自我调节**公开示范**给孩子，正好契合"其身正，不令而行"。

### 9.2 设想②：孩子无助时给予引导的儿童 app（团队已改为孩子自己的苏格拉底式教练）

- **可能的好处**
  - 提问和提示式的 AI 能提高学习而不制造依赖（Bastani 2025 的 GPT Tutor 组；Kestin 2025；VanLehn 2011）【B】。
  - 对话式提问能提高低龄儿童的理解（Xu 2022）【B/C】。
  - 自我抽离、"榜样视角"式提问有助于儿童的情绪调节和坚持（Kross 2011；White 2017）【B/C】。
  - 帮孩子找到"一个自己能做的小行动"，为孩子创造"可控经验"（Maier & Seligman 的推论）【C】。
- **可能的伤害**
  - 依赖与替代：Common Sense 2025 调查中约三分之一的青少年把严肃的事告诉 AI 而不是真人【C，描述性】；成人 RCT 中重度使用与孤独感、依赖相关【C】。
  - 危机时刻回应不可靠【C】。
  - 拟人化依恋，尤其在 6–9 岁（Kurian 2024；AI 玩具测试）。
  - 奉承和错误信息。
  - 如果父母能读对话，孩子就不敢说真话。如果父母不能读，父母又会焦虑，需要"有限保密"的设计来平衡。
- **证据强度**：学业场景的"只问不讲"【B】；情绪和无助场景下 AI 教练对能动性的长期效果，**无直接证据**【D】。
- **改法**
  1. **定位是"教练"，不是"朋友"**：没有拟人的名字和性格，不表达想念，不用"我一直陪着你"之类的话，不提供浪漫或亲密角色。
  2. **对话顺序**：先承认感受，再问一个最小问题，然后给分级提示，最后由孩子自己选一个下一步。
  3. **逐步退场**：同类问题第二次出现时，先问"上次你用了什么办法？"。以求助所需的提示层级下降作为成功指标。
  4. **引回真人**：每隔几轮问"这件事有没有一个你信任的人可以聊？要不要我帮你想想怎么开口？"。帮孩子准备好和父母、老师谈话，而不是替孩子去谈。
  5. **有限保密，并事先讲清楚**：对话默认只属于孩子；只有事先约定的少数安全情形（自伤、他伤、被侵害）才通知父母，而且**先告诉孩子"我需要让大人知道"**。
  6. **无连胜、无积分、无推送式召回**；晚上设"打烊"时段；单次时长有上限。
  7. **分龄**：6–9 岁以亲子共用为主（父母在旁，AI 提问，父母和孩子一起回答）；9–12 岁可以独立使用，但内容简单、强护栏；12 岁以上独立使用，隐私更强。
  8. **评估先行**：上线前设计好依赖指标（每日时长、深夜使用、"只想和你说"之类的话语），并找独立研究者做评估，作为对《生成式人工智能服务管理暂行办法》第 10 条"防依赖"义务的落实。

### 9.3 设想③：持续录音和心率监测孩子，"像心理学家在身边"一样汇总给父母

- **可能的好处**：创始人想要的"更了解孩子"是真实而正当的需求。但**没有任何证据显示持续监视能带来这一好处**。现有证据指向相反的方向（第 1、3 节）。
- **可能的伤害**（分场景）

| 场景 | 主要伤害 | 依据 |
|---|---|---|
| 看电影时的心率 | 唤醒度不等于情绪，误标为"焦虑""害怕"；把正常的电影体验病态化 | Siegel 2018；Barrett 2019【A/B】 |
| 和朋友聊天（录音） | 侵犯朋友的隐私和结社自由；违反两方同意录音州的法律；与《未成年人保护法》第 63 条（8 岁以上）冲突；孩子在同伴中被孤立（"你妈会听到"） | CRC 第 15、16 条；一般性意见第 25 号第 67 段；法律见第 8 节 |
| 玩游戏的心率 | 兴奋、紧张、身体前倾都会升高心率，几乎无解释价值；可能被父母用来证明"游戏有害" | 第 7 节 |
| 社交媒体 | 青少年寻求的恰恰是**不被父母看到**的空间，用于同一性探索（boyd 2014《It's Complicated》）；监视引发规避（换小号、用朋友的设备），父母反而知道得更少 | Hawk 2013【B】；Ghosh 2018【C】 |
| 听的音乐 | 音乐偏好是青春期自我认同的重要表达；被汇报和评论会变成"品味管控" | 推论 |
| "像心理学家一样"汇总 | 用无效的推断做出类诊断性解读；把正常的青春期情绪病态化；违反 App Store 1.4.1 和《精神卫生法》第 23 条的风险；真正的心理学家不会隐蔽录音，也不会做无效测量 | 第 7 节 |
| 总体 | 侵蚀孩子讲述的意愿，导致父母知道得更少；隐蔽或常规化监控违反一般性意见第 25 号第 75 段；监控模块可被另一位家长或前任伴侣当作跟踪工具 | Kerr & Stattin【A/B】；Chatterjee 2018【B】 |

- **证据强度**：伤害的机制证据【A/B】；好处【无证据】。
- **结论：否决。** 而且"孩子同意了"不能使它变得可以接受，原因有三：
  - (a) 亲子之间权力严重不对等，孩子的"同意"很难是自由的；
  - (b) 被录下的朋友没有同意；
  - (c) 情绪推断的科学效度问题与同意无关。
- **改法**（满足"更了解孩子"的真实需求）
  1. **晚间共同回顾**（5–10 分钟，例如睡前）：app 给**父母**提供开放式问题和"细致回忆式"对话技巧（"后来呢？""你当时觉得怎么样？""你是怎么想到这个办法的？"）。
     - 依据：Reese & Newcombe (2007, *Child Development* 78(4))：训练母亲使用细致回忆式对话后，孩子的自传式记忆和叙事更丰富【B】。Fivush 等关于家庭叙事与青少年幸福感的研究【B/C，背景知识】。
  2. **孩子写的分享卡**：孩子自己选择要分享什么、分享给谁（例如"今天我很自豪的一件事""想让你知道的一件事""我需要帮忙的一件事"）。父母只看到孩子发出的卡片。
  3. **孩子自己的情绪签到**：由孩子用自己的词或情绪表（如 RULER 的 Mood Meter）给感受命名。**默认只有孩子自己看得到**，孩子可以选择分享。这样做能锻炼情绪粒度，不靠机器推断。
  4. **父母的"倾听教练"**：孩子讲出来之后，提示父母先共情、不急着说教，不"秋后算账"（依据 Tilton-Weaver 2010）。这是提高孩子讲述意愿最直接的杠杆。
  5. **安全提醒（仅限窄范围）**：例如孩子在 app 里主动按下"我需要帮助"，或者定位离开事先约定的区域。规则由全家一起定，孩子知情，并定期复议。

### 9.4 设想④：练习时追踪注意力时长

- **可能的好处**：帮孩子提高练习质量、建立专注习惯；让父母"看到"孩子的努力。
- **可能的伤害**
  - **测量无效**：手表没有直接测量注意力的传感器；"手不动"不等于专注，"在动"也不等于走神。有研究发现，ADHD 儿童在认知任务中更强烈的身体活动与**更好**的认知控制表现相关（Hartanto 等 2016, *Child Neuropsychology*〔未核实〕）。用动作推断注意力，可能系统性地误标这些孩子【C/D】。
  - **动机代价**：父母可见的指标会变成"控制性"反馈，可能触发成就导向的心理控制（Soenens & Vansteenkiste 2010）；量化会降低乐趣（Etkin 2016）【B】；Fitbit 研究中青少年自主动机下降（Kerner & Goodyear 2017）【C】；连胜断了会降低之后的参与（Silverman & Barasch 2023）【B】。
  - "注意力时长"本身是一个被通俗化的概念：同一个孩子的专注程度随任务的兴趣和难度而变，不是一个稳定的特质（推论）。
- **证据强度**：父母可见的量化对动机的伤害【A/B】（基于奖励与量化研究的外推）；**孩子自己做的**自我监控有益【B】（Reid 2005，主要来自特殊教育样本）。
- **改法**
  1. 孩子自己定目标（例如"今天把第 3 小节弹熟"），而不是定时长。
  2. 手表只做温和的计时和提醒（例如"番茄钟"式的 15 分钟 + 休息），**不判断孩子是否专注**。
  3. 练完由孩子自评专注度（1–5 分），写一句"什么帮我专注了 / 什么打断了我"。
  4. 每周由孩子自己挑一条"想给爸妈看的进步"发出去，父母的回应模板是**过程性的、具体的**（"我注意到你把那段反复练了很多遍"），而不是比较和打分。
  5. 不设排行榜、连胜和"专注分"；设"自由练习日"，不记录任何数据。
  6. 对 6–9 岁：父母陪练时，用"你觉得刚才哪一遍最好？为什么？"这类问题，代替任何指标。

### 9.5 设想⑤：与教练、老师共享数据

- **可能的好处**：家校协同，教练根据孩子的状态调整训练。支持自主的教练风格对运动员动机有益（Mageau & Vallerand 2003, *Journal of Sports Sciences*）【B】，但它依靠的是**关系和沟通**，而不是生理数据。
- **可能的伤害**
  - **期望效应和标签**：Jussim & Harber (2005, *Personality and Social Psychology Review* 9(2))：教师期望的自我实现效应真实存在但通常较小，对低成就或受污名群体可能更大【B】。被贴上"ADHD"标签的孩子会被老师更负面地看待（Ohan 等 2011, *Journal of School Psychology*〔未核实〕）【C】。
  - **权力不对等和用途悄悄扩大**：数据可能被用于分班、选拔、评优，被转发到家长群，或长期留存。孩子几乎没有能力拒绝。
  - **课堂数据化的批评**：ClassDojo 等课堂行为积分工具被批评为把纪律"数据化"、营造"表演型"课堂文化（Williamson 2017；Manolev, Sullivan & Slee 2019, *Learning, Media and Technology*）【C，质性/批判】。国内也有类似的课堂积分工具。
  - **法律**：欧盟 AI 法第 5(1)(f) 条禁止在教育机构推断情绪；国内有"脑电头环""课堂表情识别"被叫停的先例（第 7 节）。
- **证据强度**：伤害【B/C】；"共享生理或注意力数据能改善教学"【无证据】。
- **改法**
  1. **默认关闭，永不**向机构提供原始生理、情绪或注意力数据。
  2. 允许孩子**主动、逐条**分享自己整理的内容（例如一页"我这个月的练习反思""我希望老师知道的一件事"）。分享有时限、可撤回，并显示"谁在什么时候看过"。
  3. 借鉴"学生主导的家长会"（student-led conferences）思路：由孩子向老师和父母讲述自己的目标与进展（实践中较常见，严格的效果研究有限〔未核实〕）。
  4. 面向机构的版本须单独做法律评估（欧盟 AI 法、中国未成年人个人信息保护、美国 FERPA 等）。

### 9.6 团队当前方向：肯定之处与需要补的 5 处

**肯定**：
- 保留父母教练，以父母为改变对象；
- 孩子 app 是孩子"自己的"苏格拉底式教练；
- 要求知情同意和孩子赞同；
- 不录朋友；
- 不做诊断性宣称。
这些都与证据一致。

**需要补的 5 处**：
1. **赞同要真实、可撤回、拒绝无代价**。可以参考研究伦理中常用的"约 7 岁起征求儿童赞同"惯例〔美国 45 CFR 46.408 的具体年龄由伦理委员会决定，"7 岁"为常见实践，未核实〕。赞同书用孩子能懂的图文；每 6 个月或每进入一个新的年龄段时**重新确认**。
2. **不能把"同意"当作通行证**：即使父母和孩子都同意，也坚持数据最小化、本地处理、不推断情绪、不隐蔽。原因是亲子权力不对等，而且有一般性意见第 25 号的"相称性"要求。
3. **教练对话默认对父母不可见**，例外规则写清楚，并事先告诉孩子。
4. **从产品里拿掉连胜、积分、徽章、排行榜**，包括"亲子打卡连胜"。
5. **北极星指标**：不用日活、使用时长；改用以下几项（需要设计成不侵入的自报，或孩子主动行为的计数）：
   - "孩子主动分享的次数"；
   - "父母修复冲突的次数"；
   - "孩子不再需要教练的场景数"；
   - "孩子对'爸妈尊重我的想法'的自评"。

---

## 10. 分龄指南：多大程度的父母可见度在发展上是合适的

> 依据：
> - 社会领域理论：个人领域随年龄扩大（Smetana & Asquith 1994）；
> - 决策自主在青春期早期增长（Qin, Pomerantz & Wang 2009，仓内笔记）；
> - 9–12 岁是干预窗口，13–17 岁对尊重和地位更敏感（Yeager, Dahl & Dweck 2018，仓内笔记）；
> - 英国 ICO 的年龄段划分；
> - 中国法的 8 岁、14 岁节点；
> - CRC 第 5 条"不断发展的能力"。
>
> 文化校准：Feldman & Rosenthal (1991, *International Journal of Psychology*) 发现，香港青少年对获得行为自主的年龄预期晚于美国和澳大利亚青少年〔背景知识，未核实〕。中国家庭可以在各年龄段之间**更晚、更平缓地**过渡，但**方向不变**；心理控制和窥探在中国样本中同样有害。
>
> 以下是基于证据的推论，不是经过检验的方案。

| 维度 | 6–9 岁 | 9–12 岁 | 12–15 岁 | 15–18 岁 |
|---|---|---|---|---|
| 发展重心 | 胜任感、掌握经验、可靠一致的规则；能理解"谁能看到什么"的简单解释 | 干预窗口期；自我控制与目标策略；个人领域开始扩大 | 自主需求和对尊重的敏感性上升；同伴的重要性上升；讲述意愿最容易受损 | 同一性探索；接近成年；为 18 岁时的完全移交做准备 |
| 中国法节点 | 不满 8 岁为无民事行为能力人（父母可代为查阅通讯，但仍须尊重孩子的人格尊严、听取意见）；不满 14 岁的信息属敏感信息 | 8 岁以上为限制民事行为能力人，**父母查阅通讯内容受第 63 条限制**；不满 14 岁的信息仍属敏感信息 | 14 岁以上可在一定范围内自己作出个人信息同意（细节须核实）；COPPA 门槛为 13 岁 | 16 岁以上以自己的劳动收入为主要生活来源的，视为完全民事行为能力人（民法典第 18 条，未核实） |
| 父母默认可见 | 透明的较高可见度：定位（孩子知道）、练习记录（亲子共同记录）、教练对话**以亲子共用为主** | **孩子自己写的摘要**，例如分享卡；定位按场景开启且孩子可见；教练对话内容不可见，父母只看到"今天用过" | **默认私密**：父母只看到孩子主动分享的内容；定位共享对等、有时限、可协商；只保留事先约定的安全提醒 | **孩子全权控制**：所有共享由孩子开启；父母端只留紧急联系功能；提前规划 18 岁"毕业" |
| 孩子控制 | 能说"不"（例如"这个不想给妈妈看"），并被认真对待；每项功能有图示说明 | 能选择分享什么；能提出复议；参与制定"家庭科技约定" | 能关闭大部分功能；能看到谁在什么时候看过什么；能发起复议 | 能关闭全部功能（紧急求助除外）；能导出和删除自己的数据 |
| AI 教练形态 | 亲子共用，AI 提问，父母陪伴；不独立长时间使用；无拟人人设 | 可以独立使用，强护栏，短会话，频繁引回真人 | 独立使用，有限保密，事先讲清上报规则 | 独立使用，面向目标、规划与自我反思，强调退场 |
| 练习功能 | 父母陪练 + 孩子自评（用图形）；不设任何分数 | 孩子定目标、自评；每周挑一条进步分享 | 孩子全权；父母只看到孩子分享的内容 | 孩子全权；可用于自己的长期目标（如高考、作品集） |
| 共享给老师和教练 | 不共享数据；可由父母与老师当面沟通 | 只共享孩子自己整理的作品或反思，由孩子同意 | 只由孩子主动、逐条分享 | 只由孩子主动分享 |
| 绝不做（所有年龄） | 隐蔽监控；录朋友；情绪推断与诊断性解读；连胜和排行榜；把孩子的表现与父母的情绪或认可绑定 | 同左 | 同左 | 同左 |

**移交仪式**（推论，与仓内 eastern_thought.md 中的"成年礼"思路一致）：每进入一个新的年龄段，安排一次家庭会议，由孩子提出想获得哪些新权限。父母说明理由，双方签一份新的"家庭科技约定"。这把可见度的下降变成一次被看见的成长，而不是父母失去控制。

---

## 11. 设计原则：东西方思想与证据的对应

| # | 原则 | 东方出处 | 西方与实证对应 | 落到产品 |
|---|---|---|---|---|
| 1 | **知孩子，靠孩子愿意讲，不靠监视** | 《论语·为政》"视其所以，观其所由，察其所安"讲的是在关系中观察人，不是窥探（引申义） | Kerr & Stattin 2000；Hawk 2013；Tilton-Weaver 2010 | 晚间共同回顾、分享卡、父母倾听教练；不做持续监视 |
| 2 | **道而弗牵，强而弗抑，开而弗达** | 《礼记·学记》："故君子之教，喻也：道而弗牵，强而弗抑，开而弗达。道而弗牵则和，强而弗抑则易，开而弗达则思。"（仓内 eastern_thought.md 已部分核对） | SDT 自主支持（Reeve；Mageau & Vallerand）；Bastani 2025 的 GPT Tutor | 教练只问不替孩子决定；只给提示不给答案；只鼓励不施压 |
| 3 | **不愤不启，不悱不发**：孩子卡住了、自己来求助时再帮，只帮最少的一步 | 《论语·述而》 | Wood, Bruner & Ross 1976 的随需帮助；Koedinger & Aleven 2007 的"帮助两难" | 教练由孩子发起；分级提示；不主动推送"你需要帮助吗" |
| 4 | **帮我自己来做，教是为了不教** | 老子"太上，不知有之……功成事遂，百姓皆谓我自然"（第十七章）；叶圣陶"教是为了达到不需要教"（仓内笔记） | Montessori "Help me to do it alone"（《童年的秘密》，仓内 western_thought.md 已核对）；支架的逐步撤除与责任移交（van de Pol 2010） | 以"孩子不再需要它"为北极星指标；同类求助逐次减少提示 |
| 5 | **在最近发展区里给支架** | 《学记》"不陵节而施"（循序渐进） | Vygotsky 的最近发展区："今天在合作中能做的，明天就能独立做" | 难度自适应；定期把方法交还给孩子（"下次你先试什么？"） |
| 6 | **结构而不控制；严慈相济，不用心理控制** | "管"中的关爱与投入（Chao 1994，仓内笔记）；《家庭教育促进法》"严慈相济""平等交流" | Grolnick & Pomerantz 2009；Barber 1996；Soenens & Vansteenkiste 2010 | 规则模板配上"给理由、问意见、给选择"；禁止把表现与父母的情绪或认可绑定的文案 |
| 7 | **透明、相称、可反对** | 《未成年人保护法》第 4、19、63 条 | CRC 第 12、16 条；一般性意见第 25 号第 75–76 段；ICO 第 11 条 | 被看到时有明显标识；每项功能都能说清目的；孩子能提出复议 |
| 8 | **随能力发展而退场** | 《学记》"一年视离经辨志……九年知类通达，强立而不反"；孔子"十五而志于学" | CRC 第 5 条；Smetana 的社会领域理论；Qin 2009 | 分龄默认；移交仪式；18 岁"毕业" |
| 9 | **身教先于言教：首先改变的是父母** | "其身正，不令而行；其身不正，虽令不从"（《论语·子路》）；家促法"言传与身教相结合""父母与子女共同成长" | Wang & Kenny 2014；情绪社会化研究；Tutor CoPilot 的"AI 赋能真人"思路 | 父母侧教练是主功能；孩子看到父母在练习冷静和修复 |
| 10 | **不替孩子命名内心** | 孟子"揠苗助长"（外力代替内在生长） | Barrett 2019；Siegel 2018；情绪粒度研究 | 不做情绪推断；孩子用自己的词给感受命名 |
| 11 | **给不被测量的游戏与兴趣留空间** | 王阳明《训蒙大意》"顺导其志意，调理其性情"（仓内 eastern_thought.md） | 过度辩护效应（Lepper 1973；Deci 1999）；Etkin 2016；CRC 第 31 条 | 无连胜、积分、排行榜；"自由日"不记录 |
| 12 | **修复胜于完美** | 《论语·学而》"过则勿惮改" | 情绪辅导；破裂—修复研究（婴儿期证据为主） | 吼过之后的修复提示；家庭复盘里不羞辱 |

---

## 12. 总体缺口与待核清单（交付前必须处理）

1. **原文核对（最高优先级）**：
   - 一般性意见第 25 号第 19–21、42、67–68、75–76 段及家庭部分的段号与措辞；
   - 《未成年人保护法》第 4、19、63、71 条；
   - 《家庭教育促进法》第 17 条；
   - 《生成式人工智能服务管理暂行办法》第 10 条；
   - 《精神卫生法》第 23 条；
   - 欧盟 AI 法第 5(1)(f) 条与鉴于条款第 44 条；
   - ICO 儿童规范第 10–12 条；
   - APA 2025 健康提示的条目；
   - Common Sense Media 2025 年各报告的数字。
2. **数字核对**：
   - Bastani 2025（48% / 127% / −17%）；
   - Common Sense 2025 调查（72% / 52% / 33% / 31%）；
   - Wisniewski 2017（89% / 11%）；
   - Ghosh 2018 的样本与比例；
   - Siegel 2018 与 Kreibig 2010 的研究数；
   - Kerner & Goodyear 2017 的样本；
   - Wang & Kenny 2014 的样本；
   - Sailer & Homner 2020 的效应量。
3. **证据空白**（建议下一轮在网络可用时补检）：
   - 2018–2026 年定位追踪对青少年自主感和信任的纵向研究；
   - 隐蔽与透明电子监控的比较研究；
   - 6–12 岁儿童使用 AI 对话教练的纵向研究；
   - 可穿戴自我追踪对儿童内在动机的 RCT；
   - 消费级手表对儿童情绪推断的现场验证；
   - 中国大陆家庭电子监控与亲子信任的研究；
   - **2026 年**的新法规、新诉讼与新研究。
4. **法律意见**：本笔记不是法律意见。中国、美国（COPPA、两方同意录音州）、欧盟（GDPR、AI 法）、英国（ICO 规范）的适用问题须由律师确认。
5. **已打开的来源**（共 3 个）：
   - https://developer.apple.com/videos/play/wwdc2021/10123/
   - https://www.anthropic.com/news/anthropic-education-report-how-university-students-use-claude
   - https://www.anthropic.com/news/how-people-use-claude-for-support-advice-and-companionship
