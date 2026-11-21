# 手表育儿助手——技术架构与数据设计（V0 / V1 / V2）

> 调研日期：2026-11-21。作者角色：技术架构。本文在队友笔记 `research_notes/孩子能动性与志向培养体系/wearable_coaching.md`（下称"队友笔记"）的基础上展开，不重复其中已核实的平台限制，只在需要时引用。
>
> **网络与来源说明（必读）**
> - 本次可以打开：developer.apple.com（含文档 JSON 与 WWDC 视频页）、developer.android.com、platform.claude.com、www.anthropic.com、support.claude.com、raw.githubusercontent.com。
> - 本次**被拦截**（DNS 不通）：developer.samsung.com、developers.google.com（ML Kit GenAI 各 API 详情页）、ai.google.dev（MediaPipe）、support.apple.com、www.apple.com、machinelearning.apple.com、www.gov.cn、www.cac.gov.cn、www.ftc.gov、source.android.com。若需核实这些内容，需在会话网络设置中放行这些域名。
> - WebSearch：本轮共享的搜索配额在我开始前已用尽，**本文没有做任何网页搜索**，全部来自直接打开的官方页面、队友笔记和背景知识。
> - 标注约定：
>   - 【已核实】= 本次亲自打开的官方页面（URL 列在第 11 节）；
>   - 【队友已核实】= 队友笔记中标为"已打开"的结论，本次未重开；
>   - 【背景知识·待核实】= 我的既有知识，没有找到可打开的来源，定稿前必须核对；
>   - 【推断/估算】= 基于上述事实的工程判断或带假设的估算。

---

## 0. 结论速览

**推荐架构一句话：手表 = 传感器 + 触觉 + 一瞥式界面；手机 = 大脑 + 保险箱；云端 = 加密信箱 + 无状态 LLM 网关。** 所有可在本地完成的事都在本地完成；进云端的只有（a）端到端加密后的密文，（b）孩子教练对话的文字（发给 LLM 时必须是明文，这一点无法用 E2E 解决，必须如实告知用户）。

1. **V0（4–6 周，Apple 单平台，零麦克风）**：家长手表"暂停 → 触觉呼吸 → 短语卡"、当晚反思、每周小结（本地统计）；孩子 App（iPhone/iPad）手动练习计时 + 孩子教练（云端 Claude，经自建网关 + 安全层）；向老师分享用"带密钥片段的过期链接"（服务器只见密文）。不做麦克风、不读心率、不做多设备云同步。
2. **V1（约 4–6 个月）**：Wear OS / Galaxy Watch + Android 对等；家长主动开启的"陪伴时段"本地音量提醒（不存音频）；练习自动检测"辅助确认"（SoundAnalysis / YAMNet 声音分类 + 电钢琴 MIDI + 游泳/球类 workout 导入）；老师账户 + HPKE 公钥加密分享；端到端加密多设备同步；欧盟区域；COPPA 可验证家长同意流程；外部安全审计。
3. **V2（研究 / 可选）**：心率研究版（伦理委员会批准、三星 IBI）、自训练声音模型、孩子手表（Family Setup / 独立 watchOS App）、端侧 LLM 离线教练、**中国版（独立主体、独立境内后端与密钥、境内已备案大模型）**。
4. **最大风险（详见第 9、10 节）**：
   - 孩子教练的安全（未成年人 + 开放式对话）是第一风险，且法规（COPPA/GDPR/PIPL、Anthropic 未成年人指南、App Store 1.3/5.1.4）要求的家长权利与"孩子拥有自己数据"之间存在真实冲突，需律师给出按年龄段的方案。
   - "只识别佩戴者本人大声说话"在手表上**没有可靠方法**，只能做"环境很响"的启发式提醒。
   - 钢琴时长检测：原声钢琴可做"辅助确认"，**电钢琴戴耳机时麦克风完全无效**（需 MIDI），且分类器无法区分"真弹"与"放录音"。
   - 端侧 LLM 覆盖率低：Apple 端侧模型只在 iPhone 15 Pro 及以后等设备上运行、上下文 4K；孩子常用旧设备，**必须有云端或无 LLM 的降级方案**。
   - 数据驻留：Claude 的 workspace（静态存储）目前只有 US，推理只有 us / global；Claude 不在中国大陆/香港提供服务 → 中国版必须整套替换。

---

## 1. 总体架构

### 1.1 组件与信任边界（ASCII 图）

```
 ┌──────────── 家长 ────────────┐        ┌──────────── 孩子 ────────────┐
 │ Apple Watch / Galaxy Watch   │        │ iPhone/iPad/Android 手机平板  │
 │  - 暂停按钮(复杂功能/Tile)    │        │  - 孩子教练(文字/按住说话)      │
 │  - 触觉呼吸(正念会话)         │        │  - 练习计时 + 自动检测辅助      │
 │  - 短语卡(只读,手机推送)      │        │  - 选择分享给老师/教练          │
 │  - [V1]本地音量计量(不存音频) │        │  - 本地加密库(孩子自己的密钥)   │
 │  本地: SwiftData/Room(加密)   │        └──────┬──────────────┬───────┘
 └────────┬─────────────────────┘               │TLS            │TLS(仅密文)
          │WatchConnectivity / Wear Data Layer   │               │
 ┌────────▼─────────────────────┐        ┌──────▼──────┐  ┌─────▼────────────┐
 │ 家长手机 App                  │  TLS   │ LLM 网关     │  │ 加密信箱/分享服务 │
 │  - 反思、周报(本地计算)        │──────▶ │ (无状态)     │  │ 只存密文+到期时间 │
 │  - 短语卡库、设置、同意管理     │ (可选) │ 安全分类→LLM │  │ 审计日志(无内容)  │
 │  - [可选]端侧 AFM 改写建议      │        │ →输出复核    │  └─────┬────────────┘
 │  本地加密库(家长自己的密钥)     │        └──────┬──────┘        │ 链接#密钥片段
 └──────────────────────────────┘               │               ▼
                                          Claude API(US)    老师浏览器(WebCrypto 解密)
```

- **两个"所有者"**：家长与孩子各有独立账户和独立密钥对；家庭关系（family link）只在服务器上存"谁和谁是一家、角色、出生年段"，不存内容。
- **服务器能看到的**：账户 ID、家庭关系、同意记录、分享链接元数据（创建/到期/访问时间）、密文 blob、LLM 网关的瞬时明文（处理完即丢）、安全事件元数据（类别 + 时间，不含内容，见 5.4）。
- **服务器看不到的**：练习记录、反思、周报、暂停事件、音量事件、老师分享内容（全部客户端加密）。

### 1.2 数据分级（决定每类数据能去哪）

| 级别 | 数据 | 能离开设备吗 | 存储/保留 |
|---|---|---|---|
| A 永不离开 | 原始音频帧、声音分类逐窗结果、心率原始流（研究版除外） | 否（内存环形缓冲 ≤1 秒，不落盘） | 不存储 |
| B 加密同步 | 暂停/音量事件、练习记录、反思、周报、短语卡选择 | 只以端到端密文形式 | 本地 + 云端密文；按第 6.5 节保留 |
| C 瞬时明文 | 孩子教练对话文字、（可选）家长反思改写请求 | 是，经网关发 LLM，不落库 | 网关不持久化；LLM 供应商按其条款保留（需签 DPA，见 5.3） |
| D 研究专用 | 心率/IBI、带标注的测试音频 | 仅研究版、单独知情同意、伦理批准 | 研究服务器，与产品数据物理隔离 |

---

## 2. 各功能数据流：手表 ↔ 手机 ↔ 云

### 2.1 通道能力（已核实部分）

**Apple WatchConnectivity**【已核实】
- `updateApplicationContext(_:)`：发送"当前状态"字典，**覆盖**前一个；对方不可达时也可调用，系统择机送达。→ 适合推送"当前 3 张短语卡""设置"。
- `transferUserInfo(_:)`：**保证送达**、排队、按顺序，App 被挂起后传输继续。→ 适合手表上产生的事件（暂停、音量提醒）回传手机。
- `sendMessage(_:replyHandler:errorHandler:)`：立即发送，要求对方 `isReachable`；手表端调用可在后台唤醒 iPhone App，iPhone 端调用**不会**唤醒手表 App。→ 只用于双方都在前台的交互（如手机上点"在手表上开始呼吸"）。
- `transferFile(_:metadata:)`：系统会"为性能和功耗节流"。→ V0 不需要传文件。
- `isReachable` 在手表端只在前台或高优先级后台（如 workout 会话中）为真。
- 复杂功能更新 `transferCurrentComplicationUserInfo` 每天 50 次上限；手表必须完成每个 `WKWatchConnectivityRefreshBackgroundTask`，否则耗尽后台预算导致崩溃。
- 模拟器不支持 `transferUserInfo` / `transferFile`，必须真机测试。

**Wear OS Data Layer**【已核实】
- `DataClient` 同步 `DataItem`（小数据）与 `Asset`（大对象，自动去重）；离线时可写入，连接后同步；"数据仅本 App 在其他设备上可访问"；文档明确它"用于同步而不是存储"，应自己用 Room 存一份。
- 设备间是一条由 Google Play services 管理的蓝牙加密通道；蓝牙不可用时自动经 Google Cloud 路由，且"经 Google Cloud 传输的数据是端到端加密的"。
- 两端包名与签名必须一致。
- **只能与 Android 手机通信**："If a Wear OS device is paired with an iOS device, the Data Layer API won't work."；官方建议不要把 Data Layer 当主要联网方式。
- Data Layer 属于 Google Play services → **无 GMS 的设备/地区（中国大陆）不可用**【推断，中国版需单独验证】。
- 单个 DataItem 的大小上限：本次打开的页面没有给出数字（背景知识约 100KB，【待核实】）。

### 2.2 功能 × 运行位置 × 数据（推荐方案）

| 功能 | 手表上 | 手机上 | 云端 | 通道 | 持久化的东西 |
|---|---|---|---|---|---|
| 暂停按钮 | 复杂功能/Smart Stack/Tile 一键启动；App Intents（watchOS 9+【已核实】）可接 Siri/快捷指令；Ultra 动作按钮映射【背景知识·待核实】 | 接收事件 | 无（V1 起密文同步） | transferUserInfo / DataClient | `PauseEvent{ts, 时长, 是否用卡}` |
| 触觉呼吸 | `WKExtendedRuntimeSession` 正念类型（前台最长 1 小时）【队友已核实】；`WKHapticType` 预设【队友已核实】；Wear OS 用 Vibrator + 前台 Activity【背景知识】 | 无 | 无 | — | 同上 |
| 短语卡 | 只读显示 | 家长在平静时从内容库选 3 张；内容库随 App 打包/签名下发 | 内容库静态托管（公开内容，无个人数据） | updateApplicationContext / DataClient | 卡片 ID 列表 |
| [V1] 音量提醒（仅家长开启的陪伴时段） | 本地 RMS 计量 + 门控后才跑声音分类；触觉 + "暂停？" | 校准向导、阈值设置 | 无 | 事件 transferUserInfo | `NudgeEvent{ts, 峰值档位, 家长反应}`，**无音频** |
| 当晚反思 | 可选：手表上 1–3 个快速按钮（"今天用上卡了吗"） | 30 秒复盘表单；可选"换个说法"建议：优先端侧 Apple Foundation Models，不可用时**经家长明确同意**才走云端，发送前把孩子名字替换为占位符 | 可选 LLM 网关 | — | 反思文本（加密） |
| 每周小结 | 周日复杂功能显示 1 行 | **确定性统计本地计算**（次数、趋势、一个小目标）；可选 LLM 生成叙述 | 可选 | — | 周报（加密） |
| 心率（研究版） | 研究版专用：三星 Sensor SDK IBI 或 HKWorkoutSession【队友已核实限制】 | 研究 App | 研究服务器（独立） | — | 研究数据（D 级） |
| 孩子教练 | （V2 才考虑手表） | 文字或"按住说话"→端侧转写（iOS 26 SpeechAnalyzer / Android `createOnDeviceSpeechRecognizer` API 31+【已核实】）→孩子确认文本后发送 | LLM 网关→Claude；无状态 | HTTPS | 对话只存孩子设备（加密），默认 30 天自动删除 |
| 练习记录 | [V1] 孩子手表 workout（游泳/球类） | 孩子点"开始练习"→计时；[V1] 自动检测辅助（声音/MIDI）给出"检测到 23 分钟，确认吗？" | V1 起密文同步 | — | `PracticeSession{项目, 时长, 专注标签, 来源, 孩子已确认}` |
| 分享给老师 | — | 孩子勾选要分享的记录→预览→生成链接 | 加密信箱存密文 + 到期时间 | HTTPS | 密文 blob（到期即删）+ 访问审计 |

**关键设计决定**
- V0/V1 手表**不直接联网**：所有云交互经手机。理由：Wear OS 官方功耗表把"访问网络（LTE/Wi-Fi）"列为"Very high"【已核实】；Apple 手表 App 依赖手机做重活也是官方推荐模式（WatchConnectivity 页面）。代价：家长手机不在身边时事件延迟同步（可接受，事件本来就不急）。
- 孩子手表（Family Setup，无配对 iPhone）需要独立 watchOS App 且自行联网——放到 V2。Family Setup 手表对第三方 App/HealthKit 的支持程度本次无法核实（support.apple.com 被拦截）【待核实】。

---

## 3. 端侧 ML 选项（截至 2026-11）

### 3.1 Apple

| 能力 | 平台 | 本项目用途 | 状态 |
|---|---|---|---|
| **SoundAnalysis 内置分类器** `SNClassifierIdentifier.version1` | iOS 15+/watchOS 8+（框架页标 watchOS 9.0，元数据不一致，建议最低 watchOS 10）【已核实】 | 练习检测（钢琴/音乐）、音量提醒的"是不是人声/喊叫"门控 | 可用 |
| SoundAnalysis + 自定义 Core ML（Create ML `MLSoundClassifier`） | 同上【已核实】 | V2：训练"原声钢琴 vs 录音"、特定乐器 | 需数据 |
| **SpeechAnalyzer / SpeechTranscriber**（iOS 26） | iOS/iPadOS/macOS/tvOS/visionOS 26；**无 watchOS**（含 watchOS 27 仍无）【已核实】 | 孩子"按住说话"本地转写 | 可用（中文支持需运行时查 `supportedLocales`【待核实】） |
| SFSpeechRecognizer | 无 watchOS；服务器识别有每日限额与 1 分钟上限【已核实/队友已核实】 | 不推荐（可能联网） | — |
| **Foundation Models 框架**（端侧 AFM） | 框架与 `LanguageModelSession`：iOS 26、watchOS 27；但 `SystemLanguageModel`（端侧模型）**只在 iOS/iPadOS/macOS/visionOS，不在 watchOS**【已核实】 | 家长反思改写、孩子教练离线降级（受限任务） | 设备覆盖有限 |
| **Private Cloud Compute 模型**（`PrivateCloudComputeLanguageModel`，iOS/watchOS 27） | 需"托管 entitlement 资格申请"；有**每人每日配额**，超额引导用户升级 iCloud+；需联网【已核实】 | 理论上可做孩子教练的"Apple 内"云端选项 | 不可控（配额、资格） |

**Apple Foundation Models 关键事实**【已核实，来自 "Detecting available Apple Foundation Models" 等页】
- 型号：AFM Core（30 亿参数，4–8K 上下文，端侧）、AFM Core Advanced（200 亿参数，8K，端侧，iOS 27 起在 iPhone 17 Pro/Air、iPhone 18 Pro、M4+ iPad 等）、AFM Cloud（32K，PCC 服务器）。App **不能选择**端侧型号，每台设备只有一个。
- 设备：iPhone 15 Pro、全部 iPhone 16、iPhone 17 等支持 AFM Core；**Apple Watch SE 3 / Series 9+ / Ultra 2+ 只能用 AFM Cloud，且须配对支持 Apple Intelligence 的 iPhone**。
- 可用性取决于"设备与地区是否支持 Apple Intelligence"；iOS 27 起 Apple Intelligence 默认开启且不能关闭。
- 端侧上下文 4096 token/会话（"Managing the context window" 页）；**中文约 1 字符 ≈ 1 token**，即一次会话（指令 + 历史 + 输出）总共约 4000 个汉字——对多轮教练对话很紧。
- 端侧推理"无限次"、离线可用、不支持推理（reasoning）；PCC 有每日配额、支持 3 档推理。
- 安全：端侧与 PCC 都有护栏；端侧护栏可选 `default` 或 `permissiveContentTransformations`，PCC 护栏不可配置；**护栏只对支持的语言有效**；官方建议：最高安全级别用"固定选项输入"、用 `@Generable` 枚举限制输出、加自己的 deny list、做风险评估和安全回归测试，且**每次 OS 更新模型后重跑测试**。
- 中国大陆是否提供 Apple Intelligence：本次无法打开 Apple 支持页核实【待核实；背景知识认为截至我的知识尚未上线】→ 中国版不能依赖 AFM。

### 3.2 Android / Wear OS

| 能力 | 本项目用途 | 状态 |
|---|---|---|
| **YAMNet**（AudioSet 521 类）经 MediaPipe Audio Classifier 或 LiteRT 运行 | 练习检测、喊叫门控 | 类别表【已核实】：含 `Speech`、`Child speech, kid speaking`、`Conversation`、`Shout`、`Yell`、`Children shouting`、`Screaming`、`Music`、`Musical instrument`、`Keyboard (musical)`、`Piano`、`Electric piano`、`Children playing` 等。MediaPipe 文档（ai.google.dev）被拦截，API 细节与 Wear OS 上的性能【待核实】 |
| Android `SpeechRecognizer.createOnDeviceSpeechRecognizer`（API 31+）与 `isOnDeviceRecognitionAvailable` | 孩子按住说话本地转写 | 【已核实】API 存在；中文模型是否在设备上可用取决于系统识别服务【待核实】 |
| **ML Kit GenAI（Gemini Nano，经 AICore）** | 家长/孩子端侧文本任务、离线降级 | 【已核实】：提供 Prompt/直接模型访问、Agent API（`genai-agent:1.0.0-alpha1`）、语音识别/翻译/TTS、摘要、校对、改写、图像描述、嵌入；AICore 不直接联网、不保留输入输出；适用 ML Kit GenAI 附加条款，"开发者对 API 客户端和 App 体验的安全负全责"。**支持设备列表、前台限制、配额、支持语言都在 developers.google.com（被拦截）**【待核实】；背景知识：仅部分旗舰手机，不在 Wear OS 上，App 需在前台 |
| Firebase AI Logic Hybrid | Gemini Nano 不可用时自动回落到云端 Gemini | 【已核实存在】；会引入 Google 云端作为另一个数据处理方，需单独评估 |
| Samsung Health Sensor SDK（Galaxy Watch4+） | 研究版 IBI | developer.samsung.com 被拦截；见队友笔记 |

### 3.3 钢琴练习时长能否在端侧可靠检测？

**结论：原声钢琴"孩子主动开始的练习会话 + 声音分类辅助确认"可行；"被动、全天、无需孩子知情的自动检测"既不可靠也不应该做。电钢琴走 MIDI。**【推断，需 V1 前做实验】

已核实事实：
- Apple 内置分类器"300 多类"，WWDC21 明确说乐器方面可识别键盘类、打击、弦乐、管乐，也识别人声活动；窗口时长支持 0.5–15 秒，官方建议从 ≥1 秒开始；窗口越长越准、时间定位越粗【已核实】。**具体标签名（如是否有 `piano`、`shout`、`yell`）文档页没有列出**，要在真机上打印 `knownClassifications` 确认——这是 V0 期间 1 小时就能完成的 spike。背景知识：Apple 的标签体系与 AudioSet 类似，包含 piano / keyboard_musical / speech / shout / yell / screaming 等【待核实】。
- YAMNet 明确有 `Piano`、`Electric piano`、`Keyboard (musical)`【已核实】。
- 所有计算在设备上，音频不上云（WWDC21 原话）【已核实】。

推荐算法（V1）：
1. 孩子点"开始练钢琴"→ 屏幕显示"正在听琴声（不录音）"+ 系统麦克风指示。
2. 1 秒窗口、50% 重叠；每窗取 `max(piano, keyboard_musical, electric_piano, music)` 置信度。
3. 平滑：5 秒中值滤波；"弹奏中"阈值待标定（起点 0.5）；间隔 < 45 秒的停顿合并（练习中常有停顿翻谱）。
4. 结束时给孩子看："计时 30 分钟，检测到约 23 分钟在弹奏，要改吗？"——**孩子确认后才保存**；来源字段记 `sound_assisted`。
5. 设备放在钢琴上或附近 1–2 米内；电量低于 20% 时只计时不分类。

已知失效场景（必须在 UI 与文案里诚实说明）：
- **电钢琴 + 耳机**：没有空气声音，麦克风方法完全失效 → 用 **MIDI**：Core MIDI（iOS 4.2+/watchOS 8+）与 `android.media.midi`（API 23+）【已核实】，USB 或蓝牙 MIDI 读取 note-on 事件，"最近 10 秒内有按键"即为弹奏中——这是最可靠、最隐私友好的方案（不碰麦克风）。
- 播放钢琴录音/老师示范视频、兄弟姐妹在弹：内置分类器无法区分（它只识别"声音类别"）。V2 可用自训练模型尝试"原声 vs 扬声器"，但没有把握【推断】。
- 准确率：没有任何公开的"家庭环境钢琴检测"准确率数字；验证需要**团队自有家庭/实验室、单独知情同意**录制的测试集（D 级数据），不能用用户数据。

阅读、球类（非手表）等：没有可靠传感器信号 → 计时 + 孩子自评"专注度/练了什么"。不做"朗读转写"。

### 3.4 只检测"佩戴者本人大声说话"：启发式与限制

**结论：手表麦克风无法可靠区分"是我在喊"还是"孩子/电视在喊"。只能做"环境很响的时刻"提醒，文案必须是"刚才有点响，要不要暂停一下？"，而不是"你在吼"。**【推断】

可用信号：
- 电平：`AVAudioRecorder.averagePower(forChannel:)` 返回 **dBFS（−160 到 0）**，不是声压级 SPL【已核实】；更推荐 `AVAudioEngine` 输入 tap 自算 100ms RMS。HealthKit `environmentalAudioExposure`（dBA）由系统自动采集，第三方无法控制采样时机，**不适合实时**【已核实类型说明；采样频率为推断】。
- 距离启发：自由声场中距离每加倍约衰减 6 dB【背景知识（物理常识）】。手腕到嘴约 0.3–0.6 米，孩子在 1–2 米外，在**同等音量**下本人声音约高 3–12 dB；但室内混响会缩小差距，而孩子哭喊的声功率可能远大于成人正常说话 → 差距不可依赖。
- 类别门控：电平超阈值后才运行 SoundAnalysis/YAMNet，要求"speech/shout/yell"类为主（省电 + 过滤电视音乐）。
- 个人校准：开启前让家长用平时音量说 10 秒、再用"提高嗓门"说 5 秒（手腕自然下垂），得到个人阈值；每种手表型号的麦克风增益/AGC 不同，必须按设备校准。
- 时间规则：持续 ≥2–3 秒超阈值才触发；每次会话最多 1–2 次推送（与队友笔记一致）；冷却 10 分钟。

无法解决的限制（写入"不可行"清单）：
- 没有平台 API 做"说话人分离/本人声纹"；即使自建声纹，也属于**生物识别信息**（COPPA 2025 修订、GDPR 第 9 条、PIPL 第 28 条均为敏感类别，见队友笔记）——不建议。
- 抱着孩子、孩子坐在腿上、厨房/餐厅噪音、袖子盖住手表、电视动作片：都会误报或漏报。
- watchOS 输入链路是否默认启用语音处理/AGC、能否切到"测量模式"：本次未核实【待核实】→ V1 spike 必测。
- 只能在家长主动开启的时段工作；watchOS 录音 App 在会话期间可持续后台运行【队友已核实】，并必须有明确同意和可见提示（App Review 2.5.14）【队友已核实】。Wear OS 需要 `microphone` 类型前台服务、`FOREGROUND_SERVICE_MICROPHONE` 权限和 `RECORD_AUDIO` 运行时权限【已核实】。

---

## 4. 运动练习检测（游泳 / 球类）

### 4.1 Apple Watch【已核实，除注明外】
- **游泳**：`HKWorkoutConfiguration.swimmingLocationType`（泳池/开放水域）、`lapLength`；`swimmingStrokeCount`（累计划水次数）；泳姿 `HKSwimmingStrokeStyle`（自由泳/仰泳/蛙泳/蝶泳/混合/打腿板/未知），以 `HKMetadataKeySwimmingStrokeStyle` 写在**每圈（lap）事件**上；`HKWorkoutEventType.lap` 新版有起止时间，休息应用 pause/resume 标记；`segment` 可把同泳姿的连续圈分组。
- 系统在第三方 workout 会话中是否自动生成带泳姿的 lap 事件：文档未直接说明，背景知识认为 `HKLiveWorkoutBuilder` 会收到系统检测的圈与泳姿【待核实，V1 spike】。
- 防水锁 `enableWaterLock()`：只能在**前台 + 进行中的 workout/定位会话**时开启，需 `waterResistanceRating == .wr50`，不能程序化解锁。
- **球类**：`HKWorkoutActivityType` 有 basketball、soccer、tennis、tableTennis、badminton、volleyball、baseball 等——但只提供通用指标（时长、心率、能量），**没有**投篮/挥拍计数。
- 挥拍/击球类事件：`CMBatchedSensorManager`（watchOS 10+）提供 **800 Hz 加速度计、200 Hz device motion，每秒一批**，仅 **Series 8 / Ultra 及以后**，且**必须有进行中的 HealthKit workout 会话**（WWDC23 10179 原话）。要做挥拍计数需自训练模型 → V2。
- `startMirroringToCompanionDevice()`（watchOS 10+）可把 workout 会话镜像到 iPhone（例如家长手机上实时看孩子游了几圈）——注意这会让家长"实时看见"，与"孩子知情、孩子决定分享"冲突，默认关闭【推断】。
- 一次只能运行一个 workout 会话【队友已核实】；watchOS 27 有 workout 心率采样回归报告【队友已核实】。

### 4.2 Wear OS / Galaxy Watch【已核实】
- Health Services `ExerciseClient`：`ExerciseType` 含 `SWIMMING_POOL`、`SWIMMING_OPEN_WATER`、`TENNIS`、`BASKETBALL`、`SOCCER`、`BADMINTON`、`TABLE_TENNIS`、`VOLLEYBALL`、`GOLF` 等。
- `DataType`：`SWIMMING_LAP_COUNT(_TOTAL)`、`SWIMMING_STROKES(_TOTAL)`、`REP_COUNT`、`GOLF_SHOT_COUNT`；**没有泳姿数据类型**（检索 DataType 参考页无 style 字段）。
- 能力随设备而异，必须启动时 `getCapabilitiesAsync()` 查询；全设备同一时间只允许一个 exercise，别的 App 开始会终止你的；需要前台服务（`health` 类型）+ Ongoing Activity；屏幕熄灭时数据批量下发（例如最长 150 秒一次），`BatchingMode.HEART_RATE_5_SECONDS` 可覆盖但耗电；数据用 Room 存、运动结束后再用 WorkManager 上传。
- 三星专属能力（Sensor SDK 等）：站点被拦截，见队友笔记。

### 4.3 建议
- V1：孩子（或家长代为）在手表上开始"游泳/球类练习"，结束后把**摘要**（时长、圈数、划水数、泳姿分布）写入孩子的练习记录，孩子确认后可分享给教练。不传原始传感器数据。
- 注意 App Review 5.1.3(ii)：**不得把个人健康信息存入 iCloud**【已核实】→ 从 HealthKit 读出的游泳数据不能放 CloudKit，只能放本地或我们自己的端到端加密存储。

---

## 5. 孩子教练：端侧 LLM vs 云端 LLM

### 5.1 对比

| 维度 | 端侧（Apple AFM Core / Gemini Nano） | Apple PCC（AFM Cloud） | 云端 Claude（经自建网关） |
|---|---|---|---|
| 设备覆盖 | 低：仅 Apple Intelligence 设备（iPhone 15 Pro+ 等）/ 部分 Android 旗舰；孩子常用旧机、平板 | 同 Apple Intelligence 设备 | 任意联网设备（iOS/Android/Web） |
| 上下文 | 4K（中文约 4000 字/会话） | 32K | 1M（远超需要） |
| 质量（苏格拉底式提问、计划拆解、年龄适配） | 3B 模型、无推理；适合受限模板任务 | 较强、有推理档位 | 强；可按 eval 选 Haiku/Sonnet/Opus |
| 延迟 | 无网络往返；首 token 时间未公开，需用 Xcode Foundation Models Instrument 实测 | 网络 + 排队；未公开 | 网络往返 + 首 token；流式输出；**本文没有实测数字**，需在目标地区实测 |
| 每用户成本 | 0 | 0（但用户每日配额，超额引导 iCloud+ 订阅——对儿童产品体验不可接受） | 见 5.2 |
| 安全控制 | Apple 护栏（只对支持语言有效）+ 自己的层；Gemini Nano 安全由开发者负全责 | 护栏不可配置 | 完全可控：自己的分类器、系统提示、日志策略；Anthropic 未成年人附加要求 |
| 离线 | ✅ | ❌ | ❌ |
| 一致性 | 型号随 OS 变化，App 不能选，需按版本重测 | 服务器随时更新 | 固定模型 ID，可控升级 |
| 资格 | 无 | 需申请托管 entitlement | API 账户 + 遵守 AUP |
| 中国大陆 | Apple Intelligence【待核实】/ GMS 不可用 | 同左 | **不可用**（Anthropic 支持国家列表无中国大陆/香港）【已核实】 |

**建议**：主路径用**云端 Claude + 自建安全网关**（覆盖率、一致性、安全可控性最重要）；端侧模型只做两件事：(1) 家长反思"换个说法"建议（隐私收益最大、任务受限）；(2) 孩子教练离线时的**受限模式**——用 `@Generable` 枚举/固定选项生成"下一步计划卡"，不做开放聊天。没有端侧模型的设备离线时用**无 LLM 的预写苏格拉底问题卡组**（按年龄段）。离线时不缓存待发送内容（避免联网后"意外上传"）。

### 5.2 每用户每月成本估算【估算，假设如下】

价格来自 Claude 定价页【已核实，2026-11】：
- Claude Haiku 5.5：输入 $0.10/MTok（≤100K 提示）、输出 $0.50、5 分钟缓存写 $0.125、缓存命中 $0.01
- Claude Sonnet 5.5：输入 $2、输出 $10、5 分钟缓存写 $2.50、命中 $0.10
- Claude Opus 5.5：输入 $4、输出 $20、5 分钟缓存写 $5、命中 $0.20
- `inference_geo: "us"`（仅美国推理）对全部 token 类别 ×1.1；Batch API 5 折（不适合实时对话，但可用于周报）

假设：
- 每次会话 6 轮；系统提示 + 年龄段规则 + 安全策略 3,000 token（每次会话首轮写缓存，之后命中）；每轮孩子输入 80 token、可见输出 180 token + 思考 120 token（低 effort）；历史**不缓存**按全价计（偏保守）。
- 每轮 2 次安全分类调用（输入、输出各一次），用 Haiku 5.5，每次 600 输入 + 30 输出。
- 每月 4.3 次孩子周小结：5,000 输入 + 600 输出（用主模型）。
- 中文 token 化系数不确定，结果按 ±50% 理解。

| 主模型 | 每会话 | 轻度（8 次/月） | 典型（17 次/月） | 重度（40 次/月） |
|---|---|---|---|---|
| Haiku 5.5 | ≈ $0.002 | ≈ $0.03 | ≈ $0.05 | ≈ $0.11 |
| Sonnet 5.5 | ≈ $0.036 | ≈ $0.36 | ≈ $0.69 | ≈ $1.54 |
| Opus 5.5 | ≈ $0.072 | ≈ $0.72 | ≈ $1.37 | ≈ $3.03 |

（安全分类层每会话约 $0.001，可忽略；US-only 再 ×1.1。）家长侧可选的反思改写（30 次/月 × 1,500 入 + 300 出，Sonnet 5.5）≈ $0.18/月。

**解读**：LLM 成本不是瓶颈（即使用最强档也是每孩每月几美元以内）；真正的成本在安全运营（红队、人工复核流程、合规）。模型选择应由"儿童教练 eval"（年龄适配、是否给答案而非提问、拒答率、安全误伤率）决定，不应只看价格——建议 V0 用同一套 eval 对比三档，安全分类器固定用 Haiku 5.5。

### 5.3 未成年人安全：必须做的分层

外部硬性要求【已核实】：
- Anthropic 使用政策：面向未成年人的产品须遵守"未成年人附加指南"和所有适用法律；面向用户的聊天机器人**必须在每次会话开始或界面中披露是 AI**。
- Anthropic《面向未成年人组织的指南》：应有年龄验证、内容审核与过滤、监测与上报机制、面向未成年人的安全使用教育；Anthropic 可能提供"儿童安全系统提示"，应纳入；必须遵守 COPPA 等并在网站公开声明；Anthropic 会**定期审计**，违规率高且未落实者可能被暂停账户。
- Anthropic《开发者儿童安全指南》：其一方消费产品限 18 岁以上；开发者对自身部署的风险负责；美国平台对 CSAM 有向 NCMEC 报告的法定义务。
- App Store：5.1.2(i) 与**第三方 AI**共享个人数据须明确披露并取得明确许可；1.3 Kids Category 原则上不得含第三方分析/广告（有限例外）、外链与购买需家长门；2.3.8 非 Kids Category 的 App 元数据不得暗示主要受众是儿童；5.1.1(v) 支持建账户就必须支持 App 内删除账户；4.7（涵盖 chatbots）及 4.7.5 要求提供基于"已验证或已声明年龄"的年龄限制机制【条文已核实；4.7 是否适用于 App 自有的 LLM 功能需确认】。
- 年龄信号：Apple Declared Age Range API（iOS 26，家长可设定是否共享孩子年龄段；结果是"声明"，开发者自负合规责任）；Google Play Age Signals API（beta；仅可用于提供适龄体验，禁止用于广告/画像/分析；2026-12-11 起对所有用户返回结果）【已核实】。

推荐的网关安全流水线【推断】：
1. **年龄分段产品形态**（不是同一个聊天框调参数）：
   - 6–8 岁：**不开放自由输入**——只有固定选项（"我想准备明天的钢琴课""我遇到一道难题"），输出用结构化卡片；这正是 Apple 安全文档"最高安全级别 = 固定选项输入"的做法。
   - 9–12 岁：限长自由输入 + 更严过滤 + 会话时长上限。
   - 13–18 岁：自由输入，苏格拉底式规划；仍有全部过滤层。
2. 客户端预过滤：deny list、个人信息（电话、住址、学校全名）检测并提示孩子删除。
3. 网关输入分类（Haiku 5.5，结构化输出：自伤、被虐待披露、性内容、暴力、霸凌、进食障碍、个人信息、离题）。
4. 主模型：系统提示 = 角色（"只提问、不替你做作业"）+ 年龄段规则 + Anthropic 儿童安全系统提示（若提供）+ 每次会话 AI 身份披露；处理 `stop_reason == "refusal"`。
5. 输出复核：同一分类器复核后才显示。
6. **危机协议走确定性文案**（预写、按地区的求助热线、"去找你信任的大人"），不让 LLM 生成危机回复；是否/何时通知家长必须由儿童保护专家 + 律师按年龄段事先定好并**提前告诉孩子**。
7. 日志最小化：服务器默认**不存对话内容**，只存安全事件元数据（类别、时间、年龄段）；孩子可点"举报这条"，经同意上传该段对话用于复核（加密、30 天删除）。这与 Anthropic"监测与上报机制"的要求之间需要权衡——建议律师确认"元数据 + 用户举报"是否足够。
8. Eval 与红队：中英文、按年龄段的对抗测试集；每次换模型/改提示必跑回归（Apple 文档对端侧模型也做同样要求）。
9. 其他法规（均【背景知识·待核实】）：美国加州 SB 243（陪伴型聊天机器人，2026 年起对未成年人的披露、休息提醒、自伤应对协议）、欧盟 AI Act 第 50 条透明义务、各国 AI 生成内容标识要求。

### 5.4 "孩子拥有自己的数据"与家长权利的冲突（必须让律师裁定）
- COPPA（<13 岁）：家长有权查看运营者收集的孩子个人信息并要求删除【背景知识·待核实，见队友笔记】；PIPL 第 31 条：<14 岁需监护人同意并有专门处理规则【背景知识·待核实】。
- 若孩子的教练对话经过我们服务器发给 Claude，我们就"收集"了它 → 对 <13 岁不能宣称"家长看不到"。
- 一个可行方向【推断】：内容只存在孩子设备，服务器不保留；家长的"查看权"通过"与孩子一起在孩子设备上查看"或"导出"实现；13+ 默认家长不可见；全部规则在 onboarding 中以孩子能懂的语言说明。

---

## 6. 存储与安全

### 6.1 本地存储与密钥【已核实的 API；方案为推断】
- iOS/watchOS：SwiftData（iOS 17/watchOS 10+）或 SQLite；文件保护 `FileProtectionType.complete`（watchOS 2+，锁屏时不可读写）——注意 watchOS 后台写事件时手表可能处于锁定状态，事件队列可用 `completeUntilFirstUserAuthentication`，敏感内容用 `complete`。密钥放 Keychain；设备绑定密钥用 CryptoKit `SecureEnclave`（watchOS 6+）。
- Android/Wear OS：Room + 应用层加密；**Jetpack `security-crypto`（EncryptedSharedPreferences 等）已全部弃用**，官方建议改用平台 API 与 Android Keystore 直接使用【已核实】；可用 Tink 做 AEAD/HPKE【背景知识】。
- 加密原语：CryptoKit `HPKE`（iOS 17/watchOS 10+）、AES-GCM/ChaChaPoly；Android 侧 Tink HPKE；Web 侧 WebCrypto（AES-GCM）【HPKE 平台已核实，其余背景知识】。
- 设备/App 真实性：App Attest `DCAppAttestService`（iOS 14+/watchOS 9+）；Android Play Integrity【背景知识】。用于保护 LLM 网关不被脚本滥用。

### 6.2 CloudKit vs 自建后端
| | CloudKit | 自建后端（推荐） |
|---|---|---|
| 跨平台 | 仅 Apple（家长 Apple Watch + 孩子 Android 手机的家庭无法覆盖） | ✅ |
| 分享给老师 | `CKShare` 参与者需 iCloud 账户【背景知识】；老师多用网页/Android | 过期链接 + 网页解密 |
| 加密 | `encryptedValues` 在设备端加密；**仅当用户开启"高级数据保护"时，密钥才只属于所有者和分享参与者**【已核实】；不能给已有字段加密、加密字段不能建索引、公共库不支持加密；用户重置钥匙串会导致数据永久丢失【已核实】 | 我们自己做客户端加密，服务器零知识 |
| 健康数据 | **App Review 5.1.3(ii) 禁止把个人健康信息存 iCloud**【已核实】 | 可（加密） |
| LLM 网关 | 不能做 | 必须自建 |
| 中国 | 中国区 iCloud 由境内合作方运营【背景知识·待核实】 | 可独立部署境内单元 |

结论：**自建后端**，但后端只做"身份 + 家庭关系 + 同意记录 + 密文信箱 + 分享 + LLM 网关 + 审计"，不做内容数据库。

### 6.3 端到端加密分享给老师/教练

**V0：过期分享链接（无老师账户）**【推断，常见做法】
1. 孩子选择要分享的记录 → 客户端生成随机 256 位内容密钥 K → AES-GCM 加密 → 上传密文，拿到 `shareId`。
2. 链接 = `https://share.<域名>/s/<shareId>#k=<base64url(K)>`；URL 片段（# 之后）浏览器不会发给服务器【背景知识（HTTP 规范）】，因此服务器只有密文。
3. 可选 6 位 PIN（孩子口头/另一渠道告诉老师）：最终密钥 = KDF(片段密钥, PIN)，防链接被转发后直接可读。
4. 服务器强制到期（默认 7 天，最长 30 天）：到期即删除密文；孩子可随时撤销（立即删除）；可选"最多打开 N 次"。
5. 老师打开：静态网页用 WebCrypto 解密展示；服务器记录"何时被打开"（不存 IP 或只存粗粒度）并通知孩子："王老师在周二 19:03 打开了你的分享"。
6. 内容最小化：默认只含孩子选择的条目、孩子自定昵称，不含全名、学校、照片。
7. 诚实告知：**到期/撤销无法收回已被查看或截屏的内容**。

**V1：老师账户 + 公钥加密**：老师注册生成 X25519 密钥对（私钥留在老师设备）；孩子端用 HPKE 对每条分享"封装"给老师公钥；支持持续分享（如"每周自动把钢琴练习摘要发给老师"，孩子可随时关闭）。<13 岁的分享需家长批准（COPPA 对向第三方披露的要求，见队友笔记）；中国 <14 岁需监护人同意。

### 6.4 多设备同步与密钥恢复（V1）
- 每个用户一把账户主密钥（加密各数据集的 DEK），由各设备的设备密钥封装；新设备通过已有设备扫码授权；全部设备丢失时用**恢复码**（用户自己保存）恢复——没有恢复码就无法恢复，这是零知识设计的必然代价，需在 UI 中说清楚【推断】。
- V0 不做同步：数据只在本机，换机丢失可接受（试点期）。

### 6.5 保留与删除（建议默认值）【推断，需律师确认】

| 数据 | 位置 | 默认保留 | 删除方式 |
|---|---|---|---|
| 原始音频 | 内存 ≤1 秒 | 0 | 不落盘 |
| 音量/暂停事件 | 手表→手机 | 明细 90 天，之后只保留周汇总 | 自动；家长一键全删 |
| 反思、周报 | 家长设备（V1 密文同步） | 家长自定（默认 1 年） | 一键删除；账户删除时销毁密钥（crypto-shredding） |
| 孩子教练对话 | 孩子设备 | 30 天自动删除，孩子可"置顶保留" | 孩子一键删；网关不保留 |
| LLM 供应商侧 | Anthropic | 依合同；需评估零数据保留（ZDR）等选项【背景知识·待核实】 | 合同约束 |
| 练习记录 | 孩子设备（V1 密文同步） | 孩子自定 | 同上 |
| 分享密文 | 服务器 | 到期（7–30 天） | 到期/撤销即删 |
| 同意记录 | 服务器 | 账户存续期 + 法定期限 | 法规要求的保存 |
| 审计日志 | 服务器（无内容） | 1 年（中国版按境内要求） | 到期删除 |
| 安全事件元数据 | 服务器 | 1 年 | 到期删除 |
| 账户 | 服务器 | — | App 内删除（App Review 5.1.1(v)【已核实】），30 天内完成硬删除 |

### 6.6 审计日志
- 记录：同意授予/撤回（含版本号）、分享创建/打开/到期/撤销、导出与删除请求、家庭成员变更、员工对生产系统的任何访问、安全事件元数据。
- 不记录：任何内容、音频特征、对话文本。
- 防篡改：追加写 + 哈希链（每条含上一条哈希），定期外部锚定【推断】。
- 用户可见：孩子与家长都能看到"谁在何时访问了我的分享"。
- 中国《未成年人网络保护条例》要求每年对处理未成年人个人信息做合规审计、泄露时立即启动应急预案并告知【队友笔记，背景知识·待核实】→ 审计日志与事件响应流程要从 V0 就建立。

### 6.7 数据驻留与中国版

**Claude 侧事实**【已核实】：
- 推理地域 `inference_geo` 只有 `"us"` 与 `"global"`（默认）；**workspace geo（静态存储与端点处理）目前只有 `"us"`**，创建后不能改。
- Anthropic 支持国家/地区列表中**没有中国大陆和香港**（有台湾）。
→ 欧盟用户：发给 Claude 的对话文字会出境到美国，需要 DPIA + 合法转移机制（SCC/DPF 等）【背景知识·待核实】；可评估在欧盟区域云平台上使用 Claude（如 Bedrock/Vertex 的欧盟区域）【未核实其区域与条款】。

**中国版的含义**（法律条文本次全部无法打开，均为【背景知识·待核实】）：
- 用户给出的前提"中国数据必须留在中国"需要细化：PIPL 第 40 条的境内存储义务针对关键信息基础设施运营者和处理量达到网信办规定数量的处理者；其他处理者出境需满足第 38 条（安全评估/标准合同/认证）及 2024 年《促进和规范数据跨境流动规定》等。但本产品涉及**不满十四周岁未成年人的敏感个人信息**（第 28、29、31 条：单独同意、监护人同意、专门处理规则；第 55 条：个人信息保护影响评估），且生成式 AI 服务需使用**已备案的模型**（《生成式人工智能服务管理暂行办法》），因此**实际上必须整套境内化**。
- 架构做法：**按地区分"单元"（cell）部署**——同一套代码，独立的中国单元：境内云区域、境内密钥管理、境内账户体系（手机号等实名要求待核实）、境内分享域名（需 ICP 备案；App 需 APP 备案）、境内已备案大模型替代 Claude；**单元之间不复制任何用户数据**，账户 ID 带地区前缀，跨区家庭（家长在美国、孩子在中国）默认不支持。
- 平台层面：GMS 不可用 → Wear OS Data Layer、Gemini Nano、Play Age Signals 在中国大陆不可用；Apple Intelligence/PCC 在中国大陆可用性待核实；中国主流手表是华为/小米等（HarmonyOS 等），若要覆盖需另行评估——**中国版应作为 V2 独立项目立项**。
- 可能涉及商用密码（国密 SM2/SM3/SM4）与等级保护（等保 2.0）要求【背景知识·待核实】，会影响 E2E 加密选型。

---

## 7. 手表电量与性能预算

### 7.1 已核实的耗电因素
- Wear OS 官方相对耗电表【已核实】：访问网络（LTE/Wi-Fi）**Very high**；亮屏/交互模式 High；GPS High；CPU 持续高占用 High；心率传感器 Medium；蓝牙访问其他设备 Medium；持有 wakelock Medium。建议：把同步等数据密集任务推迟到充电时；批量处理；会话要短。
- Health Services 在熄屏时批量下发数据以免唤醒主处理器；`BatchingMode` 覆盖会耗电，官方提醒"仅在绝对必要时使用"【已核实】。
- Apple：workout 会话高频心率、推动圆环、开发者反映耗电严重；extended runtime 会话 CPU 持续过高会被系统取消；最前台 App 每小时最多 4 次后台刷新【队友已核实】。WatchConnectivity 文件传输会被系统节流【已核实】。
- **没有任何官方的"每小时耗电百分比"数字**；本文下表全是目标值。

### 7.2 预算（目标值，需 V0/V1 实测）【估算】

| 场景 | 目标耗电 | 设计手段 |
|---|---|---|
| 日常待机（只有复杂功能/Tile） | ≤ 1%/天 | 不常驻后台；复杂功能由手机推送更新，每天 ≤ 10 次（远低于 50 次上限） |
| 一次暂停 + 60 秒触觉呼吸 | < 0.3%/次 | 正念会话，熄屏可继续触觉；结束即释放 |
| [V1] 30 分钟音量提醒会话 | ≤ 3%/次 | 只算 RMS（廉价）；超阈值才跑分类器；不亮屏；不联网；事件结束后批量 transferUserInfo |
| [V1] 30 分钟孩子游泳 workout | 以系统自带"体能训练"App 为基线，额外 ≤ 20% | 不加额外传感器；结束后才传摘要 |
| 手表端同步 | — | 只经手机；V1 有直接联网时只在充电 + Wi-Fi 时 |

性能：手表上 SoundAnalysis/YAMNet 的 CPU 占用未知 → 门控 + 实测；CPU 过高会导致会话被取消（Apple）或耗电（Wear OS）。
测量：Apple 用 Xcode Instruments / Organizer 能耗报告、真机长测；Wear OS 用 `adb shell dumpsys batterystats`（官方推荐）+ 电量历史解析工具【已核实命令】。V0 的"进入试点"门槛之一：上述前两行实测达标。

---

## 8. 技术栈、团队与时间线

### 8.1 技术栈
- **Apple**：Swift 6 + SwiftUI；watchOS 10+（若要用 PCC 则 watchOS/iOS 27）；WatchConnectivity；SwiftData；WidgetKit 复杂功能/Smart Stack；App Intents；WatchKit `WKExtendedRuntimeSession`（正念）；AVFAudio + SoundAnalysis（V1）；HealthKit（V1 游泳）；CoreMotion `CMBatchedSensorManager`（V2）；Core MIDI（V1）；Speech `SpeechAnalyzer`（孩子按住说话）；FoundationModels（可选）；CryptoKit（HPKE/AES-GCM/SecureEnclave）；DeviceCheck App Attest；Declared Age Range。
- **Android / Wear OS（V1）**：Kotlin + Jetpack Compose（Wear Compose）；Tiles + Complications；Wear Data Layer（DataClient/MessageClient）；Room；Health Services `ExerciseClient`；`AudioRecord` + 前台服务（microphone 类型）+ YAMNet（MediaPipe/LiteRT）；`android.media.midi`；端侧 `SpeechRecognizer`；Android Keystore + Tink；Play Integrity；Play Age Signals；ML Kit GenAI（可选）。
- **后端**：任选团队熟悉的（如 Python FastAPI 或 TypeScript），PostgreSQL（身份、家庭、同意、分享元数据、审计）、对象存储（密文 blob，带生命周期到期删除）、LLM 网关（Anthropic 官方 SDK，流式；安全分类用 Haiku 5.5；限流 + App Attest 校验）、托管 KMS；无第三方分析 SDK（尤其孩子端）；自托管、只计数的产品分析。
- **老师网页**：纯静态页面 + WebCrypto 解密，无登录（V0）。
- **内容与安全工程**：短语卡库与苏格拉底问题卡组用版本化 JSON 管理，由发展心理学顾问审校；eval/红队测试集进 CI。

### 8.2 V0 试点（4–6 周开发，之后 4–8 周试点运行）
**范围**：iPhone + Apple Watch（家长）；iPhone/iPad（孩子，建议试点年龄 10–15 岁、有自己设备，避免共享平板带来的"谁的数据"问题）；10–20 个知情同意家庭（研究式同意，必要时经伦理审查）。

| 周 | 交付 |
|---|---|
| 1 | 威胁模型、DPIA 简版、同意文案（家长版 + 孩子能懂版）；手表/手机骨架；后端骨架（Sign in with Apple、家庭关联）；真机打印 SoundAnalysis `knownClassifications`（spike） |
| 2 | 暂停 + 正念会话触觉呼吸；短语卡同步（applicationContext）；事件 transferUserInfo 回传；本地加密存储 |
| 3 | 当晚反思 + 周报（本地统计）；孩子手动练习计时与记录；LLM 网关 + 安全流水线 v1；红队集 v1（中英文、按年龄段） |
| 4 | 过期加密分享链接 + 老师网页；导出/删除/账户删除；审计日志；内部自用 |
| 5 | 儿童安全专家红队 + 修复；电量实测；TestFlight；隐私政策与 COPPA/PIPL 适用性律师意见 |
| 6 | 试点 onboarding；只计数的指标（暂停次数、卡片使用、教练会话数、分享数）；每周家长/孩子访谈 |

**团队（约 4 FTE）**：iOS/watchOS 工程师 ×1.5–2；后端 + 安全工程师 ×1；产品设计 ×0.5；儿童安全与内容负责人（发展心理学背景）×0.5；PM/研究协调 ×0.5；外部隐私律师（按小时）。

**V0 进入试点的门槛**：红队集通过率达到预设标准且危机协议 100% 走确定性文案；账户删除端到端测试通过；电量两项达标；律师书面意见。

### 8.3 V1（约 4–6 个月，6–8 FTE）
增加 Android/Wear OS 工程师 ×2、QA ×1、隐私/安全工程师 ×0.5–1、ML/数据工程师 ×1（声音检测验证）。内容：Wear OS + Android 对等；音量提醒（默认关、孩子知情）；练习自动检测辅助（声音 + MIDI + workout 导入）；老师账户与 HPKE；端到端加密多设备同步与恢复码；欧盟区域与 DPIA；COPPA 可验证家长同意；外部渗透测试与安全审计；微随机试验（MRT）框架（与队友笔记一致）。

### 8.4 V2（研究/可选）
心率研究版（与高校合作、伦理批准、三星 IBI；数据与产品隔离）；自训练声音模型（原声 vs 录音、更多乐器）；`CMBatchedSensorManager` 挥拍计数；孩子手表（独立 watchOS App / Family Setup 支持核实后）；端侧 LLM 离线教练扩展；**中国版独立立项**（独立主体、境内单元、备案模型、HarmonyOS 评估）。

---

## 9. 不可行 / 不建议清单

**今天在技术上不可行（或文档明确不支持）**
1. 在 Apple Watch 上做语音转写：SFSpeechRecognizer 与 SpeechAnalyzer 均不支持 watchOS（含 watchOS 27）【已核实】。
2. 在 Apple Watch 上运行端侧 LLM：`SystemLanguageModel` 不在 watchOS；手表只能经配对 iPhone 用 PCC（AFM Cloud）【已核实】。
3. 不开 workout 会话获得高频心率【队友已核实】。
4. 用手表麦克风可靠区分"佩戴者本人"与旁人的声音（无平台 API；声纹属生物识别，不应做）。
5. 用麦克风检测"电钢琴 + 耳机"的练习；用内置分类器区分"真弹"与"放录音"。
6. 用 CloudKit 给非 Apple 用户（多数老师）分享；把 HealthKit 来源数据存 iCloud（App Review 5.1.3(ii)）【已核实】。
7. Wear OS Data Layer 连接 iPhone；在无 Google Play services 的设备上使用 Data Layer【已核实/推断】。
8. 在中国大陆使用 Claude API（不在支持国家列表）【已核实】；把 Claude 的静态数据存放在 US 以外（workspace geo 目前只有 us）【已核实】。
9. 对发给云端 LLM 的内容做"端到端加密"：LLM 必须看到明文。E2E 只能覆盖存储与分享，不能覆盖推理——对外不能宣称"全程端到端加密"。
10. 让"过期链接"收回已被查看/截屏的内容。

**技术上可做但不建议**
1. 用心率"预测/检测"家长愤怒、对外宣称"情绪检测""预防吼叫""临床验证"【与队友笔记一致】。
2. 把亲子时间包装成 HKWorkoutSession 换取心率或后台时间。
3. 实时转写家庭对话、实时"换个说法"推送（延迟与语境错误，见队友笔记问题五）。
4. 存储任何原始音频（含"仅用于改进模型"）。
5. 被动、全天、孩子不知情的练习监测；家长端实时镜像孩子的 workout（默认）。
6. 孩子端放第三方分析/广告 SDK；把孩子数据用于训练或画像。
7. 依赖 PCC 作为孩子教练主路径（资格与每日配额不可控，超额会向孩子展示 iCloud+ 升级）。
8. 让 6–8 岁孩子与 LLM 自由聊天；让 LLM 自由生成危机回复。
9. 在 V0 做多设备同步、跨区家庭、中国版——复杂度与合规风险远超试点所需。

---

## 10. 已验证 vs 假设汇总 + 待做的验证实验

### 10.1 已验证（本次打开官方文档）
- WatchConnectivity 各 API 的语义与限制；Wear OS Data Layer 的加密、iOS 不兼容、Google Play services 依赖。
- SoundAnalysis 内置分类器（>300 类、窗口 0.5–15 秒、全部端侧）及其 watchOS 可用性；YAMNet 521 类类别表。
- SpeechAnalyzer/SpeechTranscriber 无 watchOS；Android 端侧 SpeechRecognizer（API 31）。
- Foundation Models：型号、上下文（端侧 4096）、设备表、手表仅 PCC、PCC 资格与配额、护栏与安全建议、语言处理。
- Gemini Nano/ML Kit GenAI 的能力列表与 AICore 隐私设计（设备/配额细节未能核实）。
- HealthKit 游泳（泳姿、圈、划水）、球类 workout 类型、防水锁、workout 镜像、`CMBatchedSensorManager`（800/200 Hz、Series 8/Ultra+、需 workout）。
- Wear OS Health Services：游泳/球类 ExerciseType、游泳 DataType、前台服务、批量与功耗；Wear OS 功耗表；麦克风前台服务要求。
- Claude 定价、inference_geo / workspace geo、支持国家；Anthropic AUP 的 AI 披露与未成年人条款、未成年人指南、儿童安全指南。
- App Review 1.3、2.3.8、4.7.5、5.1.1(v)、5.1.2(i)（第三方 AI）、5.1.3(ii)（iCloud 健康数据）。
- CloudKit `encryptedValues` 语义（ADP 条件）；CryptoKit HPKE/SecureEnclave、App Attest、SwiftData、Core MIDI、Android MIDI、`security-crypto` 弃用、Declared Age Range、Play Age Signals。

### 10.2 假设 / 待核实（定稿前必须处理）
- Apple 内置分类器的确切标签（piano/shout/yell 等）——真机打印 `knownClassifications`。
- 手表麦克风链路的 AGC/语音处理与测量模式；各型号 dBFS→dBA 偏差。
- 钢琴检测在真实家庭的准确率（需自有测试集）。
- 第三方游泳 workout 是否自动获得系统检测的圈与泳姿事件。
- Family Setup 手表对第三方 App/HealthKit 的支持（support.apple.com 被拦截）。
- Gemini Nano 支持设备、配额、前台限制、中文支持（developers.google.com 被拦截）；MediaPipe Audio Classifier 在 Wear OS 上的性能（ai.google.dev 被拦截）。
- 三星 Sensor SDK 分发是否需合作审批（developer.samsung.com 被拦截）。
- Apple Intelligence / SpeechTranscriber 对中文的支持与中国大陆可用性。
- 全部法律结论（COPPA、GDPR、PIPL、未成年人网络保护条例、生成式 AI 办法、加州 SB 243、EU AI Act、国密/等保）。
- Anthropic 数据保留与 ZDR 选项、欧盟区域云平台上的 Claude 可用性。
- 所有延迟与电量数字（本文没有任何实测）。

### 10.3 建议的技术 spike（V0 第 1–5 周内穿插，每个 ≤2 天）
1. 真机打印 SoundAnalysis 标签；在团队成员家中（自愿、知情）测 30 分钟钢琴练习的检测曲线（**测完即删音频，只留标注与分数**）。
2. 手表 30 分钟 RMS 计量 + 门控分类的电量与 CPU；家长本人 vs 1.5 米外他人说话的电平差分布。
3. Claude 网关在目标地区的首 token 时间与总时延（Haiku/Sonnet/Opus 各 50 次）。
4. iPhone 15 Pro 上 AFM Core 做"反思改写"的中文质量与时延（Foundation Models Instrument）。
5. WatchConnectivity 事件在手机 App 被杀/手表锁屏时的送达延迟。
6. 过期分享链接：到期删除、撤销、PIN、访问通知的端到端测试。

---

## 11. 本次打开的来源

**Apple（developer.apple.com，经文档页/JSON 打开）**
- SoundAnalysis：https://developer.apple.com/documentation/soundanalysis ；SNClassifierIdentifier.version1：https://developer.apple.com/documentation/soundanalysis/snclassifieridentifier/version1 ；SNClassifySoundRequest：https://developer.apple.com/documentation/soundanalysis/snclassifysoundrequest ；windowDuration：https://developer.apple.com/documentation/soundanalysis/snclassifysoundrequest/windowduration ；knownClassifications：https://developer.apple.com/documentation/soundanalysis/snclassifysoundrequest/knownclassifications ；Classifying Sounds in an Audio Stream：https://developer.apple.com/documentation/soundanalysis/classifying-sounds-in-an-audio-stream ；Classifying Live Audio Input with a Built-in Sound Classifier：https://developer.apple.com/documentation/soundanalysis/classifying-live-audio-input-with-a-built-in-sound-classifier
- WWDC21 "Discover built-in sound classification in SoundAnalysis"：https://developer.apple.com/videos/play/wwdc2021/10036/
- Foundation Models：https://developer.apple.com/documentation/foundationmodels ；SystemLanguageModel：https://developer.apple.com/documentation/foundationmodels/systemlanguagemodel ；contextSize：https://developer.apple.com/documentation/foundationmodels/systemlanguagemodel/contextsize ；Guardrails：https://developer.apple.com/documentation/foundationmodels/systemlanguagemodel/guardrails ；Detecting available Apple Foundation Models：https://developer.apple.com/documentation/foundationmodels/detecting-available-apple-foundation-models ；PrivateCloudComputeLanguageModel：https://developer.apple.com/documentation/foundationmodels/privatecloudcomputelanguagemodel ；Adding server-side intelligence with PCC：https://developer.apple.com/documentation/foundationmodels/adding-server-side-intelligence-with-private-cloud-compute ；Managing the context window：https://developer.apple.com/documentation/foundationmodels/managing-the-context-window ；Supporting languages and locales：https://developer.apple.com/documentation/foundationmodels/supporting-languages-and-locales-with-foundation-models ；Improving the safety of generative model output：https://developer.apple.com/documentation/foundationmodels/improving-the-safety-of-generative-model-output ；LanguageModelSession：https://developer.apple.com/documentation/foundationmodels/languagemodelsession
- Speech：https://developer.apple.com/documentation/speech/speechanalyzer ；https://developer.apple.com/documentation/speech/speechtranscriber ；https://developer.apple.com/documentation/speech/sfspeechrecognizer
- WatchConnectivity：https://developer.apple.com/documentation/watchconnectivity ；WCSession：https://developer.apple.com/documentation/watchconnectivity/wcsession （含 sendMessage、transferUserInfo、transferFile、updateApplicationContext、isReachable 子页）；Transferring data with Watch Connectivity：https://developer.apple.com/documentation/watchconnectivity/transferring-data-with-watch-connectivity
- HealthKit：https://developer.apple.com/documentation/healthkit/hkswimmingstrokestyle ；https://developer.apple.com/documentation/healthkit/hkworkoutconfiguration/swimminglocationtype ；https://developer.apple.com/documentation/healthkit/hkworkoutconfiguration/laplength ；https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/swimmingstrokecount ；https://developer.apple.com/documentation/healthkit/hkmetadatakeyswimmingstrokestyle ；https://developer.apple.com/documentation/healthkit/hkworkouteventtype/lap ；https://developer.apple.com/documentation/healthkit/hkworkouteventtype/segment ；https://developer.apple.com/documentation/healthkit/hkworkoutactivitytype ；https://developer.apple.com/documentation/healthkit/hkworkoutsession/startmirroringtocompaniondevice(completion:) ；https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/environmentalaudioexposure
- CoreMotion：https://developer.apple.com/documentation/coremotion/cmbatchedsensormanager ；WWDC23 "What's new in Core Motion"：https://developer.apple.com/videos/play/wwdc2023/10179/
- WatchKit：https://developer.apple.com/documentation/watchkit/wkinterfacedevice/enablewaterlock() ；https://developer.apple.com/documentation/watchkit/wkextendedruntimesession ；Creating independent watchOS apps：https://developer.apple.com/documentation/watchos-apps/creating-independent-watchos-apps
- AVFAudio：https://developer.apple.com/documentation/avfaudio/avaudiorecorder/averagepower(forchannel:)
- 安全与存储：https://developer.apple.com/documentation/cloudkit/ckrecord/encryptedvalues ；https://developer.apple.com/documentation/cloudkit/encrypting-user-data ；https://developer.apple.com/documentation/cloudkit/ckshare ；https://developer.apple.com/documentation/devicecheck/dcappattestservice ；https://developer.apple.com/documentation/cryptokit ；https://developer.apple.com/documentation/cryptokit/hpke ；https://developer.apple.com/documentation/cryptokit/secureenclave ；https://developer.apple.com/documentation/swiftdata ；https://developer.apple.com/documentation/foundation/fileprotectiontype/complete ；https://developer.apple.com/documentation/coremidi ；https://developer.apple.com/documentation/appintents ；Declared Age Range：https://developer.apple.com/documentation/declaredagerange
- App Review Guidelines：https://developer.apple.com/app-store/review/guidelines/

**Android（developer.android.com）**
- Data Layer：https://developer.android.com/training/wearables/data/data-layer ；Overview：https://developer.android.com/training/wearables/data/overview
- Health Services 主动数据：https://developer.android.com/health-and-fitness/guides/health-services/active-data ；ExerciseType：https://developer.android.com/reference/kotlin/androidx/health/services/client/data/ExerciseType ；DataType：https://developer.android.com/reference/kotlin/androidx/health/services/client/data/DataType
- Gemini Nano：https://developer.android.com/ai/gemini-nano ；ML Kit Agent API：https://developer.android.com/ai/gemini-nano/mlkit-agent-api
- 功耗：https://developer.android.com/training/wearables/apps/power ；音频：https://developer.android.com/training/wearables/apps/audio ；前台服务类型：https://developer.android.com/develop/background-work/services/fgs/service-types
- 安全：https://developer.android.com/jetpack/androidx/releases/security ；Play Age Signals：https://developer.android.com/google/play/age-signals/overview
- SpeechRecognizer：https://developer.android.com/reference/android/speech/SpeechRecognizer ；MIDI：https://developer.android.com/reference/android/media/midi/package-summary

**其他**
- YAMNet 类别表（tensorflow/models）：https://raw.githubusercontent.com/tensorflow/models/master/research/audioset/yamnet/yamnet_class_map.csv
- Claude 定价：https://platform.claude.com/docs/en/about-claude/pricing ；数据驻留：https://platform.claude.com/docs/en/build-with-claude/data-residency
- Anthropic 使用政策：https://www.anthropic.com/legal/aup ；支持国家：https://www.anthropic.com/supported-countries
- Anthropic 面向未成年人组织的指南：https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors ；开发者儿童安全指南：https://support.claude.com/en/articles/15591275-child-safety-guidance-for-developers

**被拦截、需放行后核实**：developer.samsung.com、developers.google.com/ml-kit/genai（含 Prompt API、语音识别等子页）、ai.google.dev（MediaPipe Audio Classifier）、support.apple.com（Apple Intelligence 语言/地区、Family Setup、iCloud 中国运营）、www.gov.cn / www.cac.gov.cn（PIPL、未成年人网络保护条例、生成式 AI 办法）、www.ftc.gov（COPPA）。
