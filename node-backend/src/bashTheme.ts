/**
 * Bash 에이전트용 커스텀 테마 (rcfile).
 * 서버 시작 시 임시 디렉터리에 bashrc 파일을 생성하고,
 * agentResolver 에서 --rcfile 옵션으로 참조한다.
 */
import { writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'

const BASHRC = `# AgentSpace Bash Theme
# ─────────────────────────────────────────
# Source user login environment for PATH, env vars, aliases
[ -r /etc/profile ] && . /etc/profile 2>/dev/null
for _f in "$HOME/.bash_profile" "$HOME/.bash_login" "$HOME/.profile"; do
    [ -r "$_f" ] && . "$_f" 2>/dev/null && break
done
unset _f

# ── AgentSpace prompt theme ─────────────
__as_git() { git symbolic-ref --short HEAD 2>/dev/null; }

__as_prompt() {
    local e=$?
    local b; b=$(__as_git)
    local g=""
    [ -n "$b" ] && g=" \\[\\e[38;5;243m\\]on \\[\\e[38;5;114m\\]$b\\[\\e[0m\\]"
    local s="\\[\\e[38;5;141m\\]\\$\\[\\e[0m\\]"
    [ $e -ne 0 ] && s="\\[\\e[38;5;204m\\]\\$\\[\\e[0m\\]"
    PS1="\\[\\e[38;5;117m\\]\\w\\[\\e[0m\\]$g $s "
}

PROMPT_COMMAND=__as_prompt
`

export const BASHRC_PATH = path.join(tmpdir(), 'agentspace-bashrc')

try {
    writeFileSync(BASHRC_PATH, BASHRC, { mode: 0o644 })
} catch {
    // temp dir 쓰기 실패 시 기존 -l 폴백
}
