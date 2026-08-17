# TIMMY shell integration (zsh) — context follows you into the terminal.
# source this from ~/.zshrc:  source /path/to/timmy-tui/contrib/shell/timmy.zsh

# chpwd hook: cd into studio/<project> auto-loads its context (ICEBERG tip)
timmy_chpwd() {
  local dir="$PWD"
  case "$dir" in
    */studio/*)
      local proj="${dir#*studio/}"
      proj="${proj%%/*}"
      export TIMMY_PROJECT="$proj"
      local idx="$dir/PROJECT.md"
      [[ "$dir" != */studio/"$proj" ]] && idx="$(pwd)/PROJECT.md"
      idx="$(cd "$dir" 2>/dev/null && pwd)/PROJECT.md"
      if [[ -f "$idx" ]]; then
        print -P "%F{magenta}⛁ TIMMY project: $proj%f"
        head -4 "$idx" | tail -3 | sed 's/^/  /'
      fi
      ;;
    *)
      unset TIMMY_PROJECT
      ;;
  esac
}
autoload -U add-zsh-hook
add-zsh-hook chpwd timmy_chpwd

# magic space: space performs history expansion BEFORE executing
# (type `!gen<space>` and it expands to your last gen command)
bindkey ' ' magic-space

# cmd buffer ergonomics: richer history, no dups, ctrl-r incremental (default)
HISTSIZE=5000
SAVEHIST=5000
setopt HIST_IGNORE_ALL_DUPS HIST_REDUCE_BLANKS
bindkey '^R' history-incremental-search-backward
