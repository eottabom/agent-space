// node-pty prebuilt spawn-helper 실행 권한 복원
// Windows 는 ConPTY 를 사용하므로 spawn-helper 가 없어 스킵한다.
const { platform, arch } = process

if (platform === 'win32') {
    process.exit(0)
}

const { execSync } = require('child_process')
const path = require('path')

// arm64 머신에서는 arm64, 그 외엔 x64 바이너리를 사용한다
const archs = arch === 'arm64' ? ['arm64', 'x64'] : ['x64']

for (const a of archs) {
    const helperPath = path.join(
        __dirname,
        '..',
        'node_modules',
        'node-pty',
        'prebuilds',
        `${platform}-${a}`,
        'spawn-helper',
    )
    try {
        execSync(`chmod +x "${helperPath}"`)
    } catch {
        // 해당 아키텍처 바이너리가 없으면 무시
    }
}
