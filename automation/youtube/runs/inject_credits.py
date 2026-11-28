#!/usr/bin/env python3
"""Insert 'Footage: Pexels — <urls>' into a slot meta.json description,
placed between the disclosure/sources block and the final hashtag line."""
import json, sys, os

slot_dir = sys.argv[1]
meta_p = os.path.join(slot_dir, "meta.json")
cred_p = os.path.join(slot_dir, "final.mp4.credits.json")

meta = json.load(open(meta_p))
creds = json.load(open(cred_p))
seen, urls = set(), []
for e in creds:
    u = e.get("sourceUrl")
    if u and u not in seen:
        seen.add(u); urls.append(u)

if not urls:
    print("no urls"); sys.exit(0)

footage = ("Footage: Pexels — royalty-free stock illustrating the subject, "
           "not any specific person or workshop —\n" + "\n".join(urls))

desc = meta["description"]
lines = desc.split("\n")
# find the hashtag line (starts with '#Shorts')
idx = next((i for i, l in enumerate(lines) if l.strip().startswith("#Shorts")), None)
if idx is None:
    lines.append(""); lines.append(footage); idx = len(lines)
else:
    lines[idx:idx] = [footage, ""]
meta["description"] = "\n".join(lines)
json.dump(meta, open(meta_p, "w"), ensure_ascii=False, indent=2)
print(f"injected {len(urls)} footage urls into {meta_p}")
print("description length:", len(meta["description"]))
