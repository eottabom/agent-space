/**
 * Zsh 에이전트용 커스텀 테마 (ZDOTDIR).
 * 서버 시작 시 임시 디렉터리에 .zshrc 파일을 생성하고,
 * agentResolver 에서 ZDOTDIR 환경 변수로 참조한다.
 */
import { writeFileSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'

const ZSHRC = `# AgentSpace Zsh Theme
# ─────────────────────────────────────────
# Source user login environment for PATH, env vars, aliases
[ -r /etc/zprofile ] && . /etc/zprofile 2>/dev/null
for _f in "$HOME/.zprofile" "$HOME/.zshrc"; do
    [ -r "$_f" ] && . "$_f" 2>/dev/null
done
unset _f

# ── AgentSpace prompt theme ─────────────
autoload -Uz vcs_info
precmd() { vcs_info }
zstyle ':vcs_info:git:*' formats '%b'

setopt PROMPT_SUBST
PROMPT='%F{117}%~%f%(1V. %F{243}on %F{114}%1v%f.) %(?.%F{141}.%F{204})$%f '

precmd() {
    vcs_info
    if [[ -n \${vcs_info_msg_0_} ]]; then
        psvar[1]=\${vcs_info_msg_0_}
    else
        psvar[1]=
    fi
}
`

export const ZSH_ZDOTDIR = path.join(tmpdir(), 'agentspace-zsh')
const ZSHRC_PATH = path.join(ZSH_ZDOTDIR, '.zshrc')

try {
    mkdirSync(ZSH_ZDOTDIR, { recursive: true })
    writeFileSync(ZSHRC_PATH, ZSHRC, { mode: 0o644 })
} catch {
    // temp dir 쓰기 실패 시 기존 폴백
}
