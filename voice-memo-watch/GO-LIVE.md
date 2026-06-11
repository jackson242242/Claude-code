# VoiceMemoBot 上线手册(人工步骤,每步附"完成标志")

> 设计原则:每一步都有明确的**操作**和**完成标志**。完成标志通过了再做下一步,
> 这样每步做完都不需要 debug。任何一步完成标志不符,停下来把现象发给 agent,
> 不要自己猜着改。

## 第 0 步 · 前提确认(1 分钟)

**操作:** 打开 GitHub 仓库 → 分支 `claude/inspiring-dirac-j8ar6q` → 确认最新
commit 的 CI 是绿色 ✓。

**完成标志:** commit 旁是绿色对勾(backend 61 个测试全过)。

## 第 1 步 · 合并到部署分支(你的红线:合并由你执行)

**操作:** 在 GitHub 上把 `claude/inspiring-dirac-j8ar6q` 合并进部署分支
`claude/zombie-spawner-waves-2l6Vb`(开 PR → 等 CI 绿 → Merge)。

**完成标志:** PR 显示紫色 "Merged";部署分支最新 commit 包含
`voice-memo-watch/` 目录和根目录 `render.yaml` 里的 `voicememobot-api` 服务。

## 第 2 步 · Render 自动部署(等待即可,约 3–6 分钟)

**操作:** 打开 [Render Dashboard](https://dashboard.render.com) →
你的 Blueprint(读取本仓库 `render.yaml` 的那个)→ 应自动出现新服务
**voicememobot-api** 并开始构建。若没出现,点 Blueprint → "Manual Sync"。

**完成标志:** 服务状态变为 **Live**(绿色);记下它的公网地址,形如
`https://voicememobot-api-xxxx.onrender.com`。

## 第 3 步 · 线上冒烟验证(2 分钟,手机/电脑浏览器)

**操作:** 依次打开:
1. `https://<你的地址>/health` → 应显示 `{"status":"ok"}`
2. `https://<你的地址>/` → 应打开 Feed 落地页(米白底、蓝绿主色)
3. 点 ＋ → "Use demo memo" → 点一个风格 → 能听到 remix → 叠一个 🎼 库伴奏
   → 能听到鼓点/雨声垫底 → Post → Feed 里出现卡片 → 打开卡片点 ♥ 和 ⭐

**完成标志:** 上面 3 项全部符合。文件 URL 和永久链接会自动用 Render 给的域名
(代码里已接 `RENDER_EXTERNAL_URL`,无需配置)。

## 第 4 步 · 接上 Majordomo 站点监控(2 分钟)

**操作:** GitHub 仓库 → Settings → Secrets and variables → **Actions** →
**Variables** 标签 → New repository variable:
- Name: `VOICEMEMOBOT_URL`
- Value: `https://<你的地址>/health`

然后 Actions 页 → 左侧 "Majordomo site health" → Run workflow 手动跑一次。

**完成标志:** 该 workflow 运行结果为绿色 ✓(三个站点全部 ok)。此后每 30 分钟
自动探测,站点不可达会自动开 `site-down` issue 通知你,恢复自动关闭。

## 第 5 步 ·(可选)打开真 AI 生成与真转写

不做这步产品也完全可用(离线 DSP 是真实变换);做了则升级为 AI 生成:

**操作 A — 音乐生成:** [replicate.com](https://replicate.com) 注册 → Account →
API tokens → 复制 token → Render Dashboard → voicememobot-api → Environment →
`REPLICATE_API_TOKEN` = 你的 token → Save(服务自动重启)。
费用约 $0.01–0.10/次,生成 30–120 秒。

**操作 B — 语音转写:** OpenAI 平台取 API key → 同样位置加
`WHISPER_API_KEY`。(浏览器端的实时转写不需要这个,Web Speech API 免费。)

**完成标志:** 再渲染一次,Render 日志(服务页 Logs 标签)出现对
api.replicate.com / api.openai.com 的请求且无报错。

## 第 6 步 ·(可选)手表客户端分发

**Apple Watch(需要 Mac):**
1. `cd voice-memo-watch/watchos && xcodegen generate && open VoiceMemoBot.xcodeproj`
2. `AppConfig.swift` 里把 `apiBaseURL` 改成第 2 步的 https 地址
3. 自己用:选你的 iPhone+Watch 直接 Run(免费 Apple ID 即可,7 天有效期)
4. 分发他人:Apple Developer Program($99/年)→ Xcode Archive → TestFlight
   公开链接,对方 iPhone 装 TestFlight 即可安装到手表

**Android 手表:**
1. Android Studio 打开 `voice-memo-watch/wearos/`
2. `AppConfig.kt` 里把 `API_BASE_URL` 改成第 2 步的 https 地址
3. 自己用:Wear OS 模拟器或开启开发者模式的真表直接 Run
4. 分发他人:Play Console($25 一次性)→ 内部测试轨道

**完成标志:** 手表上录音 → 出 remix → 发到 Feed,网页端能看到这条帖子。

## ⚠️ 公开大规模推广前必须补的四件事(目前是"朋友圈级"live)

以上六步完成后,产品对**你和你邀请的测试者**已是可用的 production live。
但向公众开放推广前,还需要(都是真实工程,不是一键配置,需要时再叫 agent 做):

1. **持久存储** — 现在元数据在内存、文件在本地盘,Render 重新部署会清空全部
   帖子。需换 Postgres + S3/R2(改动已被隔离在 `store.py`,可控)。
2. **账号与鉴权** — 现在用户名是自由填写,任何人可冒用任何名字。
3. **限流与防滥用** — 开放的 GPU 端点会被刷,先加 rate limit 再公开。
4. **UGC 审核与举报** — 语音是个人数据;App Store/Play 上架社交类应用
   必须有拉黑/举报功能和隐私政策。
