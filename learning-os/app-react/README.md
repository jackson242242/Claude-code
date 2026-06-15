# Money Zoo — React + Capacitor(目标 App Store)

触屏优先的儿童财商 app(三年级+)。**React + TypeScript(Vite)** 写,**Capacitor** 包壳成原生 iOS/Android 上架。
内容用「内容即数据」(`src/data/*.json`),逻辑与内容从已验证的网页原型(`../app/`)移植而来。

## 本地运行(手机预览)
```bash
cd learning-os/app-react
npm install
npm run dev          # 浏览器 / 手机同 WiFi 预览
npm run build        # tsc 类型检查 + vite 打包到 dist/
```

## 结构
| 路径 | 作用 |
|------|------|
| `src/data/*.json` | 课程内容(内容即数据;加课=加 JSON)。`src/data/modules.ts` 汇总 |
| `src/lib/types.ts` | 严格类型:`Module / Atom / Step`(可辨识联合) |
| `src/lib/mascot.ts` | Emu 五段成长 + SVG |
| `src/lib/engine.ts` | 纯逻辑:金币/XP/streak/Leitner-SRS/解锁/`applyCompletion` |
| `src/lib/store.ts` | React hook + localStorage 持久化 |
| `src/steps/StepView.tsx` | 6 种关卡步骤:info/choice/explainback/sort/slider/grow/budget |
| `src/screens/` | Zoo(我的动物园)· ModuleScreen · Lesson |

## 加新课 / 新知识点
往 `src/data/` 加一个 JSON,加入 `src/data/modules.ts`。步骤类型已支持上面 6 种;
新玩法 = 在 `src/steps/StepView.tsx` 加一个渲染器(`Step` 联合类型会让编译器提醒你补齐)。

## 上 App Store / Play Store(需你的账号 + Mac/云构建)
```bash
npm install @capacitor/ios @capacitor/android @capacitor/preferences @capacitor/app
npm run build
npx cap add ios          # 生成原生工程(iOS 需 Mac)
npx cap add android
npx cap sync             # 每次 build 后同步 dist → 原生
npx cap open ios         # 在 Xcode 里归档、提交 App Store
```
- **苹果开发者账号 $99/年**、**Mac + Xcode 或云 Mac 构建**(Codemagic / GitHub Actions macOS)是硬门槛,代码侧已就绪。
- 安卓 Google Play $25 一次性。
- `capacitor.config.ts` 里的 `appId/appName` 是占位,上架前改。
- 因 `minAge: 8`:上架前需**儿童类目/COPPA 合规 + 隐私政策**,且内容建议**财务/教育者复核**(见 `../CONTENT-PIPELINE.md`)。

## 现状
- ✅ `npm run build` 通过(tsc + vite)。逻辑与内容沿用已验证的原型。
- ⏳ 真机视觉/手感请在你的触屏设备上确认。
- 旧网页原型 `../app/` 暂保留作参照。
