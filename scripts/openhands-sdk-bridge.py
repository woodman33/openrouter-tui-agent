#!/usr/bin/env python3
"""TIMMY OpenHands SDK bridge — tools execute IN-PROCESS against the seeded
workspace (LocalWorkspace), closing the headless-CLI tool-exec gap (Phase A2).
Phase C: runs inside the ephemeral runner container; reports a host-path
canary (isolation evidence) and a full patch lifecycle: generate the worktree
patch, apply it to a PRISTINE clone, and assert acceptance there — proving the
patch alone turns red→green, not container state.

stdin: {"task": str, "workspace": str, "acceptance": [str], "pristine_dir": str}
stdout: one JSON line (last line is the result envelope).
Run with the uv tool python (host engine) or /bridge.py in the runner image.
"""
import json
import os
import subprocess
import sys

req = json.load(sys.stdin)
WORK = req.get('workspace', os.environ.get('OPENHANDS_WORK_DIR', '/work'))
PRISTINE = req.get('pristine_dir', '/pristine')


def sh(cmd, cwd):
    return subprocess.run(['bash', '-c', cmd], cwd=cwd, capture_output=True)


def acceptance(cwd):
    out = []
    for t in req.get('acceptance', []):
        out.append({'cmd': t, 'code': sh(t, cwd).returncode})
    return out


def green(cwd):
    a = acceptance(cwd)
    return bool(a) and all(x['code'] == 0 for x in a)


# Isolation evidence: host-OS paths that can ONLY exist inside the container
# via a leaked host mount (macOS/Windows dirs; /home exists on bare Debian so
# it is NOT a valid canary). The adapter interprets per engine (fail closed).
host_canary = any(os.path.exists(p) for p in ('/Users', '/Applications', 'C:\\'))

from openhands.sdk import LLM, Agent, LocalWorkspace, LocalConversation
from openhands.sdk.security.confirmation_policy import NeverConfirm
from openhands.tools.preset.default import register_default_tools, get_default_tools

register_default_tools()  # terminal, file_editor, … into the registry
llm = LLM(
    model=os.environ.get('LLM_MODEL', 'ollama/qwen3.8:27b-mlx'),
    base_url=os.environ.get('LLM_BASE_URL', 'http://localhost:11434'),
    api_key=os.environ.get('LLM_API_KEY', 'ollama'),
    # ollama streaming mangles tool-call args (empty params observed);
    # non-streaming parses them correctly
    **({'stream': False} if os.environ.get('LLM_MODEL', '').startswith('ollama/') else {}),
)
agent = Agent(llm=llm, tools=get_default_tools())
conv = LocalConversation(agent=agent, workspace=LocalWorkspace(working_dir=WORK))
conv.set_confirmation_policy(NeverConfirm())  # headless: never block on confirm

result = {'ok': False, 'host_canary': host_canary}
try:
    send = getattr(conv, 'send_message', None) or getattr(conv, 'ask_agent', None)
    if send is None:
        result['note'] = 'no send_message/ask_agent on LocalConversation'
    else:
        send(req['task'])
        run = getattr(conv, 'run', None)  # send_message enqueues; run() drives the loop
        if callable(run):
            run()
        # bounded nudge loop: the agent sometimes stops after viewing; re-prompt
        # until acceptance is green or rounds exhaust (still agent-driven)
        for _ in range(3):
            if green(WORK):
                break
            send("Acceptance is still failing in the working directory. Call the "
                 "file_editor tool NOW with command str_replace, path /work/add.js, "
                 "old_string exactly \"a - b\" and new_string exactly \"a + b\". "
                 "Do not view files again. Then run the terminal tool: npm test.")
            if callable(run):
                run()
        # ---- patch lifecycle (in-container) ----
        patch = subprocess.run(['git', '-C', WORK, 'diff'],
                               capture_output=True, text=True).stdout or ''
        result['patch'] = patch
        result['work_acceptance'] = acceptance(WORK)
        pristine_acceptance = []
        patch_applied = False
        if patch.strip():
            c = subprocess.run(['git', 'clone', '-q', WORK, PRISTINE],
                               capture_output=True)
            if c.returncode == 0:
                ap = subprocess.run(['git', '-C', PRISTINE, 'apply',
                                     '--whitespace=nowarn', '-'],
                                    input=patch, capture_output=True, text=True)
                patch_applied = ap.returncode == 0
                pristine_acceptance = (acceptance(PRISTINE) if patch_applied
                                       else [{'cmd': 'git apply (pristine)', 'code': ap.returncode}])
        result['patch_applied'] = patch_applied
        result['pristine_acceptance'] = pristine_acceptance
        result['ok'] = True
except Exception as e:  # honesty clause: surface why
    result['note'] = str(e)[:300]
finally:
    try:
        conv.close()
    except Exception:
        pass
print(json.dumps(result))
