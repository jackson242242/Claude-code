# SkyEmpire 部署指南（Render.com）

> 状态：文档先行（M5.2）。本项目与 Matchday26 共仓库不同分支，**不要**把本分支
> 合进部署分支或默认分支；Render 直接指向本分支即可。
> 项目分支：`claude/airline-tycoon-dynamic-events-ps9if8`

## 一、两个 Render 服务（Dashboard 手动创建，无需 Blueprint）

根目录的 `render.yaml` 属于 Matchday26（另一分支的蓝图），SkyEmpire 用
**rootDir 定向**的方式独立建服务，互不干扰：

### 1. skyempire-api（Web Service · Python）
| 设置 | 值 |
|---|---|
| Repo / Branch | 本仓库 / `claude/airline-tycoon-dynamic-events-ps9if8` |
| Root Directory | `airline-game/api` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| 健康检查 | `GET /api/meta` 应返回 200 |

环境变量：
- `NEWS_PROVIDER=gdelt`（M4 上线后；默认 mock 也可先跑）
- `ANTHROPIC_API_KEY`：（老板配）Claude 结构化新闻用；不配则只有静态事件库
- `INGEST_TOKEN`：（老板配）随机长字符串，与 cron secrets 保持一致
- `EVENTS_POOL_FILE=/var/data/events-pool.json`（建议挂 Render Disk 持久化）

### 2. skyempire-web（Web Service · Node）
| 设置 | 值 |
|---|---|
| Repo / Branch | 同上 |
| Root Directory | `airline-game/web` |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start -- -p $PORT` |

环境变量：
- `NEXT_PUBLIC_API_URL=https://<skyempire-api 的域名>`

## 二、新闻管道 cron（M4，部署后启用）
1. 把 `airline-game/ops/news-ingest.yml` 复制到**默认分支**的
   `.github/workflows/`（GitHub schedule 只在默认分支生效）。
2. 仓库 Secrets 配置：`INGEST_URL=https://<skyempire-api>/api/ingest/news`、
   `INGEST_TOKEN`（与服务环境变量一致）。
3. 验证：Actions 手动 run 一次 → api 日志应出现 ingest 统计
   `{fetched, accepted, rejected}`。

## 三、上线冒烟清单
- [ ] `GET /api/meta` 200，含 12 城与 13 机型
- [ ] 前端建局→买机→谈 slot→开航→结算一回合
- [ ] 事件横幅出现静态事件（多结算几回合）
- [ ] 配好 key 后手动触发 ingest，确认新闻事件入池并在新回合被抽中
- [ ] 手机竖屏实测（地图/抽屉/季报弹层不破版）

## 四、已知限制
- 游戏存档目前在进程内存中（M5.1 做持久化前，服务重启丢局）。
- 机型照片热链 Wikimedia Commons；环境白名单开通后可本地化（见 ROADMAP）。
