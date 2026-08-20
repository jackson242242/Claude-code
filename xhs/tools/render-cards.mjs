#!/usr/bin/env node
// 小红书图文卡片渲染器：cards.json -> PNG（1080x1440，3:4 小红书竖版）
// 用法：node xhs/tools/render-cards.mjs xhs/daily/2026-08-20.cards.json
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, basename, resolve } from 'node:path'

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const W = 1080, H = 1440

const specPath = process.argv[2]
if (!specPath) { console.error('usage: render-cards.mjs <cards.json>'); process.exit(1) }
const spec = JSON.parse(readFileSync(specPath, 'utf8'))
const outDir = spec.outDir || join(dirname(specPath), basename(specPath).replace(/\.cards\.json$/, ''))
mkdirSync(outDir, { recursive: true })

const ACCENT = spec.accent || '#8FBFB8'
const XHS_ID = spec.xhsId || ''

// 极简 markdown：**粗体**、`高亮`、空行分段
const inline = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/`(.+?)`/g, '<em>$1</em>')
  .replace(/\n/g, '<br>')

const blocks = (body = []) => body.map((b) => {
  if (typeof b === 'string') return `<p>${inline(b)}</p>`
  if (b.type === 'lead') return `<p class="lead">${inline(b.text)}</p>`
  if (b.type === 'stat') return `<div class="stat"><span class="stat-k">${inline(b.label)}</span><span class="stat-v">${inline(b.value)}</span></div>`
  if (b.type === 'quote') return `<blockquote>${inline(b.text)}</blockquote>`
  if (b.type === 'gap') return `<div class="gap"></div>`
  return `<p>${inline(b.text ?? '')}</p>`
}).join('\n')

const coverHtml = (c) => `
  <div class="cover">
    <div class="content center">
    ${c.kicker ? `<div class="kicker">${inline(c.kicker)}</div>` : ''}
    <h1>${inline(c.title)}</h1>
    ${c.sub ? `<div class="sub">${inline(c.sub)}</div>` : ''}
    ${c.stats ? `<div class="cover-stats">${c.stats.map(s => `<div class="cs"><div class="cs-v">${inline(s.value)}</div><div class="cs-k">${inline(s.label)}</div></div>`).join('')}</div>` : ''}
    </div>FOOTER
  </div>`

const bodyHtml = (c) => `
  <div class="page">
    ${c.num || c.heading ? `<div class="head">${c.num ? `<span class="num">${inline(c.num)}</span>` : ''}${c.heading ? `<h2>${inline(c.heading)}</h2>` : ''}</div>` : ''}
    <div class="content"><div class="body">${blocks(c.body)}</div></div>
    FOOTER
  </div>`

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&family=Noto+Serif+SC:wght@400;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px}
body{background:#fff;font-family:'Noto Sans SC','WenQuanYi Zen Hei',sans-serif;color:#141414;
  -webkit-font-smoothing:antialiased;position:relative;overflow:hidden}
.page,.cover{width:100%;height:100%;padding:88px 84px 118px;display:flex;flex-direction:column}
.content{flex:1;display:flex;flex-direction:column}
.content.center{justify-content:center}
.foot{display:flex;justify-content:space-between;align-items:baseline;padding-top:34px;
  font-size:26px;color:#9A9A9A;letter-spacing:.05em}
.kicker{font-size:30px;font-weight:500;letter-spacing:.18em;color:${ACCENT};margin-bottom:36px}
.cover h1{font-size:92px;line-height:1.22;font-weight:900;letter-spacing:-.01em}
.cover .sub{margin-top:38px;font-size:34px;line-height:1.6;color:#565656;font-weight:400}
.cover-stats{margin-top:76px;display:flex;gap:64px;border-top:3px solid #141414;padding-top:40px}
.cs-v{font-size:72px;font-weight:900;line-height:1}
.cs-k{margin-top:14px;font-size:26px;color:#666}
.head{display:flex;align-items:flex-start;gap:24px;margin-bottom:52px}
.num{flex:none;display:inline-flex;align-items:center;justify-content:center;min-width:62px;height:62px;
  background:#141414;color:#fff;font-size:34px;font-weight:700;border-radius:14px;padding:0 16px}
h2{font-size:56px;line-height:1.3;font-weight:900;letter-spacing:-.005em;padding-top:2px}
.body{display:flex;flex-direction:column;justify-content:flex-start}
.body p{font-family:'Noto Serif SC','WenQuanYi Zen Hei',serif;font-size:36px;line-height:1.85;margin-bottom:34px;color:#1c1c1c}
.body p:last-child{margin-bottom:0}
.body b{font-weight:700;color:#000;background:linear-gradient(transparent 62%, ${ACCENT}66 62%)}
.body em{font-style:normal;color:${ACCENT};font-weight:700}
.lead{font-family:'Noto Sans SC',sans-serif !important;font-size:40px !important;font-weight:700;line-height:1.7 !important}
blockquote{border-left:8px solid ${ACCENT};padding:8px 0 8px 30px;margin:8px 0 34px;
  font-family:'Noto Sans SC',sans-serif;font-size:40px;line-height:1.6;font-weight:700}
.stat{display:flex;align-items:baseline;justify-content:space-between;border-bottom:2px solid #E6E6E6;padding:22px 0}
.stat-k{font-size:34px;color:#555}
.stat-v{font-size:52px;font-weight:900}
.gap{height:28px}
`

const foot = (i) => `<div class="foot"><span>${String(i + 1).padStart(2, '0')} / ${String(spec.cards.length).padStart(2, '0')}</span>${XHS_ID ? `<span>小红书号：${XHS_ID}</span>` : ''}</div>`

const cards = spec.cards
const outFiles = []
cards.forEach((c, i) => {
  const html = `<!doctype html><html lang="zh"><head><meta charset="utf-8"><style>${CSS}</style></head><body>
${(c.type === 'cover' ? coverHtml(c) : bodyHtml(c)).replace('FOOTER', foot(i))}
</body></html>`
  const tmp = join(outDir, `.card-${i + 1}.html`)
  writeFileSync(tmp, html)
  const out = join(outDir, `card-${String(i + 1).padStart(2, '0')}.png`)
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    `--window-size=${W},${H}`, '--force-device-scale-factor=1',
    '--virtual-time-budget=9000', '--default-background-color=ffffffff',
    `--screenshot=${out}`, `file://${resolve(tmp)}`,
  ], { stdio: ['ignore', 'ignore', 'pipe'] })
  rmSync(tmp)
  outFiles.push(out)
  console.log('✓', out)
})
console.log(`\n${outFiles.length} cards -> ${outDir}`)
