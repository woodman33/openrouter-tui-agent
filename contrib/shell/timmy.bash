# TIMMY shell integration (bash) — context follows you into the terminal.
# source this from ~/.bashrc:  source /path/to/openrouter-tui/contrib/shell/timmy.bash

# chpwd equivalent: PROMPT_COMMAND detects studio/<project> and loads context
timmy_chpwd() {
  local dir="$PWD"
  if [[ "$dir" == */studio/* ]]; then
    local proj="${dir#*studio/}"
    proj="${proj%%/*}"
    if [[ "$TIMMY_PROJECT" != "$proj" ]]; then
      export TIMMY_PROJECT="$proj"
      local idx="$dir/PROJECT.md"
      if [[ -f "$idx" ]]; then
        echo "⛁ TIMMY project: $proj"
        head -4 "$idx" | tail -3 | sed 's/^/  /'
      fi
    fi
  else
    unset TIMMY_PROJECT
  fi
}
PROMPT_COMMAND="timmy_chpwd;${PROMPT_COMMAND}"

# magic space + cmd buffer ergonomics
bind 'Space: magic-space'
HISTCONTROL=ignoredups
HISTSIZE=5000
HISTFILESIZE=5000
bind '"\C-r": reverse-search-history'
