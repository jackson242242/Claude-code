# SkyEmpire（暂名）— 航空霸业式网页手游

手机浏览器优先的回合制航空公司经营游戏（M1 核心循环版）。
立项计划见 `../docs/airline-tycoon-plan.md`，前后端契约见 `CONTRACT.md`。

## 目录
- `api/` — FastAPI 后端 + 纯函数模拟引擎（端口 8001）
- `web/` — Next.js 前端（端口 3001）
- `data/` — 共享事实源：城市表、2026 现役机型表、机型真实照片清单

## 启动
```bash
# 后端
python3 -m venv airline-game/api/.venv
airline-game/api/.venv/bin/pip install -r airline-game/api/requirements.txt
cd airline-game/api && .venv/bin/uvicorn app.main:app --reload --port 8001

# 前端
cd airline-game/web && npm install && npm run dev   # http://localhost:3001
```

## 测试
```bash
cd airline-game/api && .venv/bin/python -m pytest
cd airline-game/web && npm run lint && npm run typecheck && npm test && npm run build
```

## 素材与署名
机型照片来自 Wikimedia Commons 的真实摄影作品（运行时直链 + 加载失败剪影降级），
作者与许可证见 `data/aircraft-images.json` 及游戏内「图片来源与署名」页。
