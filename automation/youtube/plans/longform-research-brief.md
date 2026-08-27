# 一次性任务：长视频数据面研究 (由首个 longform day 的 run 执行后删除本文件)
用 YouTube Data API (env 凭据刷 token) 完成并将结果写入
`plans/longform-research-data.md`, commit 后删除本 brief：
1. **对标解剖 @GoldenSeniorsLiving**: channels.list forHandle → statistics;
   uploads playlist 最近 50 条 → videos.list → top20 按播放(标题/时长/播放/日期),
   时长分布, 发布频率, 标题句式归纳。
2. **中国旅游英文区格局**: search.list order=viewCount publishedAfter=2025-06-01
   type=video, videoDuration=medium+long, 关键词: "china travel","china travel
   guide","first time china","is china safe","china documentary","china 4k
   walking","living in china","china surprised me","china facts","chinese food
   tour" 各 top5 → videos.list 真实播放 → top30 列表+格式/角度归纳。
3. 与 plans/longform-v2.md §5 选题对照: 数据支持/反对哪些, 建议调序则写明理由。
配额: search.list ≤15 次(1500 units), 需在当日上传全部完成后执行。
