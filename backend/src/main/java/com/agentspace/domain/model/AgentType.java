package com.agentspace.domain.model;

public enum AgentType {

    CLAUDE("claude", "--dangerously-skip-permissions", "--verbose"),
    CODEX("codex", "--full-auto", "--debug"),
    GEMINI("gemini", "--yolo", "--debug"),
    BASH("/bin/bash", "", "-x");

    private final String command;
    private final String autoApproveFlag;
    private final String debugFlag;

    AgentType(String command, String autoApproveFlag, String debugFlag) {
        this.command = command;
        this.autoApproveFlag = autoApproveFlag;
        this.debugFlag = debugFlag;
    }

    public String command() {
        return command;
    }

    public String autoApproveFlag() {
        return autoApproveFlag;
    }

    public String debugFlag() {
        return debugFlag;
    }

    /**
     * 실행 시 항상 포함되는 기본 인자.
     * bash는 프로필을 로드해야 터미널 테마가 적용된다.
     */
    public String[] defaultArgs() {
        return switch (this) {
            case BASH -> new String[]{"-l"};
            default -> new String[0];
        };
    }

    public static AgentType from(String value) {
        try {
            return valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return BASH;
        }
    }
}
