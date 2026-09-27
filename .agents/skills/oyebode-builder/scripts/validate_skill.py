#!/usr/bin/env python3
import json, sys
from pathlib import Path
root = Path(__file__).resolve().parents[1]
text = (root/'SKILL.md').read_text(encoding='utf-8')
lines = text.splitlines()
errors=[]
if not text.startswith('---\n'): errors.append('Missing YAML frontmatter.')
else:
    parts=text.split('---',2)
    front=parts[1] if len(parts)>1 else ''
    for key in ('name:','description:'):
        if key not in front: errors.append(f'Missing frontmatter field: {key}')
for ref in (root/'references').glob('*.md'):
    if ref.stat().st_size == 0: errors.append(f'Empty reference: {ref.name}')
for p in ['evals/evals.json','evals/trigger-evals.json']:
    if not (root/p).exists(): errors.append(f'Missing {p}')
evals=json.loads((root/'evals/evals.json').read_text())
triggers=json.loads((root/'evals/trigger-evals.json').read_text())
if len(evals.get('evals',[]))<3: errors.append('Need at least 3 substantive evals.')
if len(triggers)!=20: errors.append('Need exactly 20 trigger evals.')
if len(lines)>=500: errors.append(f'SKILL.md is {len(lines)} lines; keep it below 500 when practical.')
if errors:
    print('VALIDATION FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('VALIDATION PASSED')
print('SKILL.md lines:',len(lines))
print('references:',len(list((root/'references').glob('*.md'))))
print('skill evals:',len(evals['evals']))
print('trigger evals:',len(triggers))
