# kimetsu/assets/ — 源素材投放区（owner 维护）

渲染引擎（`scripts/render-mashup.mjs`）从这里读取素材。**本目录除本 README 外被 .gitignore 忽略**——
源素材可能很大且可能含版权内容，不进仓库。

## 怎么放
按日期建子目录，放当天的素材：
```
kimetsu/assets/2026-06-06/
  clip1.mp4   clip2.mp4 ...   # 视频片段（owner 按 PLAYBOOK §2 合规备料）
  song.m4a                     # 商用安全/免版税背景音乐（默认走选项 A）
kimetsu/assets/fonts/
  handwritten.ttf              # 可选：手写感中文字体；不放则用系统 CJK 字体兜底
```

## 版权（重要，见 PLAYBOOK §2）
- **音乐默认走商用安全曲库 / 免版税**；用原版热门歌＝高 Content ID/下架风险，仅 owner 明确接受时用。
- **画面**：转化式二创、短片段、加图文解说；不整段搬运。**法律责任主体是账号持有人。**
- 这些文件**不提交进仓库**——你本地/Drive 备料，渲染产物也只在本地 `kimetsu/briefs/out/`（同样被忽略）。

## 字体
- 中文字幕需要 CJK 字体。不指定 `fontFile` 时引擎自动用系统 `WenQuanYi Zen Hei` 兜底。
- 想要"中学生手写感"，放一个手写体 `.ttf` 到 `kimetsu/assets/fonts/`，并在 manifest 的 `fontFile` 指向它。
