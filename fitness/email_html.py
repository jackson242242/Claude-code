#!/usr/bin/env python3
"""把 plan.py 的每日卡片转成邮件 HTML。

用法：
    python3 fitness/email_html.py              # 今天
    python3 fitness/email_html.py --tomorrow   # 明天（晚间预告用）
    python3 fitness/email_html.py --date 2026-09-01
输出：stdout 第一行 = 建议邮件主题；空行后 = HTML 正文。
"""
import html
import re
import subprocess
import sys
from pathlib import Path


def md_to_html(md: str) -> str:
    out = []
    for line in md.split("\n"):
        e = html.escape(line)
        e = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", e)
        e = re.sub(r"(?<!\*)\*([^*]+?)\*(?!\*)", r"<i>\1</i>", e)
        if line.startswith("# "):
            out.append(f'<h2 style="margin:12px 0 6px">{e[2:]}</h2>')
        elif line.startswith("### "):
            out.append(f'<h3 style="margin:14px 0 4px;color:#1a56db">{e[4:]}</h3>')
        elif line.startswith("> "):
            out.append(f'<div style="border-left:3px solid #f59e0b;padding-left:8px;color:#92400e">{e[5:]}</div>')
        elif line.startswith("- "):
            out.append(f'<div style="margin-left:14px">• {e[2:]}</div>')
        elif re.match(r"^\d+\. ", line):
            out.append(f'<div style="margin-left:14px">{e}</div>')
        elif not line.strip():
            out.append('<div style="height:6px"></div>')
        else:
            out.append(f"<div>{e}</div>")
    return ('<div style="font-family:-apple-system,Helvetica,Arial,sans-serif;'
            'font-size:15px;line-height:1.55;color:#111">' + "\n".join(out) + "</div>")


def subject_of(md: str) -> str:
    """从卡片抽一行主题：第X周周N · 训练/休息 · 热量。"""
    first = md.split("\n", 1)[0]
    m = re.search(r"第 (\d+)/26 周 · (周.) · \d{4}-\d{2}-\d{2}（第 (\d+)/182 天）", first)
    head = f"第{m.group(1)}周{m.group(2)} Day{m.group(3)}" if m else "健身计划"
    if "强制减载" in md or "饮食休整" in md.split("###")[0]:
        head += " ⚠️减载周"
    tm = re.search(r"### 训练 ([A-D]) · (\S+)", md)
    what = f"训练{tm.group(1)} {tm.group(2)}" if tm else (
        "主动恢复" if "主动恢复" in md else "休息日")
    km = re.search(r"今天吃什么 · (\d+) kcal｜蛋白 (\d+)g", md)
    kcal = f"{km.group(1)}kcal/蛋白{km.group(2)}g" if km else ""
    return f"【健身】{head} · {what} · {kcal}".rstrip(" ·")


def main() -> int:
    here = Path(__file__).resolve().parent
    md = subprocess.run(
        [sys.executable, str(here / "plan.py"), *sys.argv[1:]],
        capture_output=True, text=True, check=True,
    ).stdout
    print(subject_of(md))
    print()
    print(md_to_html(md))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BrokenPipeError:
        raise SystemExit(0)
