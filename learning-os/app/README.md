# Money Zoo — 可玩切片(记账预算)

第一个**真能跑、触屏优先、可离线、可装主屏(PWA)**的垂直切片:
记账预算(三年级版)整模块 + Emu 养成 + 金币 + streak + SRS 复习。内容用「内容即数据」(`content/*.json`)。

## 本地运行(需 http,不能直接双击 file://)
```bash
cd learning-os/app
python3 -m http.server 8080    # 或: npx serve -l 8080
# 手机和电脑同一 WiFi → 浏览器开 http://<电脑IP>:8080
# iPhone/iPad:Safari 打开 → 分享 → 添加到主屏幕(就像 app)
```

## 文件
| 文件 | 作用 |
|------|------|
| `index.html` / `styles.css` | 触屏 UI 外壳 |
| `app.js` | 引擎:状态/金币/XP/streak/SRS/关卡播放器 |
| `mascot.js` | Emu 5 个成长形态(可编程 SVG:蛋→成年) |
| `content/budgeting.json` | 记账预算课程(内容即数据;改它=改课,不改代码) |
| `manifest.webmanifest` / `sw.js` | PWA:可安装 + 离线 |

## 加新课 / 新知识点
往 `content/` 加一个 JSON,step 类型已支持:`info / choice / explainback / sort / slider / budget`。
新玩法 = 在 `app.js` 加一个 step 渲染器。

## 到 production 的下一步(需要你的账号)
- **线上 URL(Web/PWA):** 把 `app/` 作为静态站点部署(Netlify / Vercel / Render Static / GitHub Pages 任一)。今天就能上线,无需苹果账号。
- **上 App Store / Play Store(原生):** 用 Expo/RN 包壳 → 苹果开发者 $99/年 + Google $25 + EAS 云构建。内容 JSON 可原样搬过去。
- **专家复核:** 上线给真实孩子前,财务/教育者过一遍内容(见 `../CONTENT-PIPELINE.md`)。

## 现状
- ✅ 逻辑/内容/语法已用 Node 校验通过。
- ⏳ 真机视觉与手感请在你的触屏设备上体验(见上面运行步骤)。
