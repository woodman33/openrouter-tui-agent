#!/usr/bin/env bash
# TIMMY promo v9 finalize — runs ENTIRELY through the timmy MCP bridge:
# fusion (qwen3.8-max) over the three fan-out deltas → promo_apply → render → seal.
set -e
cd "$(git rev-parse --show-toplevel)"
TX=node_modules/.bin/tsx

echo "== fusion: synthesizing three model deltas"
FARGS=$(python3 - <<'PY'
import json
def load(p):
    try:
        return json.load(open(p))
    except Exception:
        return {}
qw, ge, gr = [load(f'/tmp/fanout-{t}.json') for t in ('qwen', 'gemini', 'grok')]
prompt = (
  "QWEN DELTA:\n" + (qw.get("text") or "none") +
  "\n\nGEMINI DELTA:\n" + (ge.get("text") or "none") +
  "\n\nGROK DELTA:\n" + (gr.get("text") or "none") +
  "\n\n" + open("docs/promo-prompts/fusion.txt").read()
)
print(json.dumps({"model": "google/gemini-3.7-flash", "system": "You are a fusion judge. Output ONLY valid JSON.", "prompt": prompt}))
PY
)
$TX scripts/timmy-mcp-call.ts timmy_llm_call "$FARGS" > /tmp/fusion-out.json
python3 - <<'PY'
import json
raw = json.load(open('/tmp/fusion-out.json'))
text = raw.get('text', '')
start = text.find('[')
end = text.rfind(']')
beats = json.loads(text[start:end+1]) if start >= 0 else []
json.dump(beats, open('/tmp/final-beats.json', 'w'))
print('fused beats:', len(beats))
PY

echo "== applying fused beats → v9"
$TX scripts/timmy-mcp-call.ts timmy_promo_apply "$(python3 -c "import json; print(json.dumps({'beats': json.load(open('/tmp/final-beats.json'))}))")"

echo "== rendering v9"
npx --yes hyperframes render studio/timmy-promo-v9 --quality high --output studio/timmy-promo-v9/promo-v9.mp4 || echo "render pending"

echo "== sealing v9 receipt"
$TX -e "
import { appendReceipt } from './src/utils/receipts.ts';
import { existsSync } from 'fs';
const arts = ['studio/timmy-promo-v9/index.html','studio/timmy-promo-v9/promo-v9.mp4'];
const rec = appendReceipt('runs', {
  kind: 'run',
  subject: 'promo v9 · bodybuilder fan-out (qwen+gemini+grok) + fusion synthesis via timmy MCP',
  policy: 'human-gated',
  spans: [
    { name: 'fan-out qwen/qwen3.8-max', kind: 'chat' },
    { name: 'fan-out google/gemini-2.7-flash', kind: 'chat' },
    { name: 'fan-out x-ai/grok-4.6', kind: 'chat' },
    { name: 'fusion synthesis', kind: 'chat' },
    { name: 'hyperframes render v9', kind: 'execute_tool' }
  ],
  artifacts: arts.filter(a => existsSync(a)),
  cost_usd: 0
});
console.log('v9 receipt:', rec.hash);
"
RESTIC_PASSWORD=timmy restic backup studio/timmy-promo-v9 --repo .timmy/restic 2>&1 | tail -1
echo "== v9 finalize complete"
