---
description: Daily multi-channel test run — one Short per active test channel (China Builds / Unreal Places / Ancient Engineering)
---
# Test channels daily run (owner 2026-10-29: try several directions until one makes a 1M-view, 1k-sub video)

Authority: `automation/youtube/plans/multi-channel-test.md` + config `multiChannel`. Reuse the main pipeline: `scripts/assemble-video.mjs` (--clips / --photos / --badge none or channel badge text), `scripts/mechanism/*`, `scripts/frame0-sheet.mjs`, `scripts/youtube-upload.mjs`, music vault (`node scripts/music-vault.mjs decrypt --all`). Setup as in youtube-cycle §0 (ffmpeg, fonts-noto-cjk, pip cairosvg pillow numpy, NODE_USE_ENV_PROXY=1).

For each channel in config `multiChannel.channels` whose `tokenEnv` env var is set (skip silently otherwise; if none set, log one line in `automation/youtube/channels/RUNLOG.md` and stop):
1. Pick today's topic: next unused line of that channel's first-week list in plans/multi-channel-test.md §5, then `automation/youtube/channels/<KEY>/queue.json` (create it; replenish with 7 researched topics when <3 remain, in the channel's direction).
2. Verify every number with 2 sources this run. A place or project may be named only over footage whose Pexels slug or Commons title names it. Frame 0 is real eye-level or POV footage, never a diagram or map. No politics, no commercial music, no AI imagery presented as real.
3. Render a 9:16 Short (T2: 15-20 s; T1: 20-35 s; T3: 60-180 s with the M structure: real open → code-drawn steps → real close). English subtitles only. Cue 1 = title = hook with a number or a human/rule detail. Close = either-or question.
4. Look at the frame-0 sheet. Upload with `YOUTUBE_REFRESH_TOKEN="$<tokenEnv>" node scripts/youtube-upload.mjs --video … --meta …` (meta.music set → AI disclosure is automatic), publishAt 14:00Z for T1, 18:00Z for T2, 22:00Z for T3.
5. Record in `automation/youtube/channels/<KEY>/published.json` and one line in `automation/youtube/channels/RUNLOG.md`. Snapshot views of the channel's last 14 videos (videos.list with the same token, 1 unit) into `automation/youtube/channels/<KEY>/snapshots.json`.
6. Commit and push to branch claude/youtube-automation-workflow-v8egf3 (rebase on conflicts, keep both sides). Never upload to the main channel from this run.
