# TikTok 草稿箱模式开通教程 (2026-08-12)

> 效果：每天的成片自动出现在你 TikTok 的收件箱/草稿里，你打开 App →
> 加热门音乐 + 粘贴文案 → 发布，每条 ~30 秒。
> 注意：TikTok 开发者控制台界面常改版——任何一步和描述对不上，截图发对话框，
> 我实时带你走。

## 你要做的（一次性，约 15 分钟 + 平台处理时间）
1. **注册开发者账号**：浏览器开 developers.tiktok.com → Login（用注册
   @chinatravelexpertz 的那个 TikTok 账号登录最省事）→ 完成开发者注册
2. **创建应用**：控制台 → Manage apps → Connect an app →
   App 名称写 `CTE Draft Uploader`，用途描述照抄：
   *"Uploads my own channel's finished videos to my own account's inbox as
   drafts for manual review and posting."*
3. **添加产品**：在应用里 Add products → 勾 **Login Kit** 和
   **Content Posting API**。Content Posting API 的设置里如果有
   Direct Post / Upload 选项，**只需要 Upload（草稿/收件箱）**，不要申请
   Direct Post（那个要严格审计，我们不需要）
4. **Redirect URI**：Login Kit 设置里要求填回调地址 → 填 `https://example.com/cb`
   （只是接收授权码用，页面打不开没关系）。如果控制台要求"验证 URL 属性/域名
   所有权"，截图发我——那一步有别的绕法（沙盒模式）
5. **沙盒（如果出现 Sandbox 选项）**：创建 Sandbox → Target users 添加你自己的
   @chinatravelexpertz —— 沙盒模式对"只操作自己账号"完全够用，且不用等正式审核
6. **拿两把钥匙**：应用页面上的 **Client Key** 和 **Client Secret** →
   存到 Claude 环境的 Variables 里（和 YouTube 密钥同一个地方）：
   - `TIKTOK_CLIENT_KEY`
   - `TIKTOK_CLIENT_SECRET`
   **不要发在对话框里**
7. **授权自己的账号**（需要我配合，两步）：
   a. 告诉我"钥匙已放"，我跑 `tiktok-oauth-helper.mjs` 生成授权链接发你
   b. 你在浏览器打开链接 → 登录批准 → 浏览器跳到 example.com（404 正常）→
      把地址栏里 `code=` 后面那串复制发我 → 我换成长效 refresh token，
      你把它存为 `TIKTOK_REFRESH_TOKEN`
8. 完成。之后每天例行 run 渲染完成片就自动推草稿。

## 我这边已就绪
- `scripts/tiktok-oauth-helper.mjs`（授权链接 + 换 token）
- `scripts/tiktok-draft-upload.mjs`（推送草稿 + 状态确认；≤64MB 单块上传，
  我们的母带都在 35MB 内）
- 例行 run 接线：检测到 TIKTOK_* 环境变量即自动启用（playbook 6c）
- 诚实注记：本沙盒访问不了 TikTok 文档站，脚本按 2026 初 v2 规范写成——
  你密钥就位后的第一次推送就是实测，报错我原样排查，不瞎猜

## 发布时你仍要做的（这步 API 替代不了，也是策略上最值的一步）
打开 TikTok 收件箱草稿 → **加热门音源**（按弹药包 `Suggested sound:` 提示搜风格）
→ 粘贴文案 → 发布。热门音源只有 App 内发帖能用，这是 TikTok 的授权规则。
