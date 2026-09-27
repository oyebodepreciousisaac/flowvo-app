#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
skill = ROOT / "SKILL.md"

if not skill.exists():
    raise SystemExit("ERROR: SKILL.md not found")

text = skill.read_text(encoding="utf-8")
if not text.startswith("---\n"):
    raise SystemExit("ERROR: missing YAML frontmatter")

front = text.split("---\n", 2)
if len(front) < 3:
    raise SystemExit("ERROR: malformed frontmatter")
meta = front[1]
for key in ("name:", "description:"):
    if not re.search(rf"^{re.escape(key)}", meta, flags=re.M):
        raise SystemExit(f"ERROR: missing frontmatter field {key}")

lines = len(text.splitlines())
if lines >= 500:
    raise SystemExit(f"ERROR: SKILL.md is {lines} lines; keep it under 500 lines")

for ref in re.findall(r'`(references/[^`]+)`', text):
    if not (ROOT / ref).exists():
        raise SystemExit(f"ERROR: referenced file missing: {ref}")

print(f"OK: {skill.relative_to(ROOT)} ({lines} lines)")
for p in sorted((ROOT / "references").glob("*.md")):
    print(f"OK: {p.relative_to(ROOT)}")
print("Validation passed.")
