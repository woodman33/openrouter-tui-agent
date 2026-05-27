#!/usr/bin/env bash
# Tmux Operator Workspace layout - AgentOps Room Zero
tmux new-session -d -s agentops -n monitor
tmux send-keys -t agentops:monitor.0 'founder-terminal' C-m
tmux split-window -h -t agentops:monitor.0
tmux send-keys -t agentops:monitor.1 'abtop' C-m
tmux attach -t agentops
