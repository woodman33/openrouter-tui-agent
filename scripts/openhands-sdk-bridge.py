#!/usr/bin/env python3
"""TIMMY OpenHands SDK bridge — tools execute IN-PROCESS against the seeded
workspace (LocalWorkspace), closing the headless-CLI tool-exec gap (Phase A2).
stdin: {"task": str, "workspace": str} · stdout: one JSON line.
Run with the uv tool python: ~/.local/share/uv/tools/openhands/bin/python
"""
import json
import os

from openhands.sdk import LLM, Agent, LocalWorkspace, LocalConversation
from openhands.sdk.security.confirmation_policy import NeverConfirm
from openhands.tools.preset.default import register_default_tools, get_default_tools

req = json.load(__import__('sys').stdin)
register_default_tools()  # terminal, file_editor, … into the registry
llm = LLM(
    model=os.environ.get('LLM_MODEL', 'ollama/qwen3.8:27b-mlx'),
    base_url=os.environ.get('LLM_BASE_URL', 'http://localhost:11434'),
    api_key=os.environ.get('LLM_API_KEY', 'ollama'),
)
agent = Agent(llm=llm, tools=get_default_tools())
conv = LocalConversation(agent=agent, workspace=LocalWorkspace(working_dir=req['workspace']))
conv.set_confirmation_policy(NeverConfirm())  # headless: never block on confirm
try:
    send = getattr(conv, 'send_message', None) or getattr(conv, 'ask_agent', None)
    if send is None:
        print(json.dumps({'ok': False, 'note': 'no send_message/ask_agent on LocalConversation'}))
    else:
        send(req['task'])
        run = getattr(conv, 'run', None)  # send_message enqueues; run() drives the loop
        if callable(run):
            run()
        print(json.dumps({'ok': True}))
except Exception as e:  # honesty clause: surface why
    print(json.dumps({'ok': False, 'note': str(e)[:300]}))
finally:
    try:
        conv.close()
    except Exception:
        pass
