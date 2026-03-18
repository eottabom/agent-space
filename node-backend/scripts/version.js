const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '../..')
const versionFilePath = path.join(rootDir, 'version.properties')
const targetFiles = [
    path.join(rootDir, 'frontend/package.json'),
    path.join(rootDir, 'frontend/package-lock.json'),
    path.join(rootDir, 'node-backend/package.json'),
    path.join(rootDir, 'node-backend/package-lock.json'),
]

function readVersionProperties() {
    const raw = fs.readFileSync(versionFilePath, 'utf8')
    const match = raw.match(/^version=(.+)$/m)
    if (!match) {
        throw new Error('version.properties 에 version 값이 없습니다.')
    }
    return match[1].trim()
}

function writeVersionProperties(version, updatedAt) {
    const lines = []

    if (updatedAt) {
        lines.push(`# updated=${updatedAt}`)
    }

    lines.push(`version=${version}`)
    fs.writeFileSync(versionFilePath, `${lines.join('\n')}\n`)
}

function bumpVersion(version, releaseType) {
    const segments = version.split('.').map((value) => Number.parseInt(value, 10))
    if (segments.length !== 3 || segments.some(Number.isNaN)) {
        throw new Error(`유효하지 않은 semver 입니다: ${version}`)
    }

    const [major, minor, patch] = segments
    if (releaseType === 'major') {
        return `${major + 1}.0.0`
    }
    if (releaseType === 'minor') {
        return `${major}.${minor + 1}.0`
    }
    if (releaseType === 'patch') {
        return `${major}.${minor}.${patch + 1}`
    }

    throw new Error(`지원하지 않는 release type 입니다: ${releaseType}`)
}

function updateJsonVersion(filePath, version) {
    const raw = fs.readFileSync(filePath, 'utf8')
    const json = JSON.parse(raw)
    json.version = version

    if (json.packages && json.packages['']) {
        json.packages[''].version = version
    }

    fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`)
}

function syncVersionFiles(version) {
    targetFiles.forEach((filePath) => updateJsonVersion(filePath, version))
}

function main() {
    const command = process.argv[2]

    if (!command) {
        throw new Error('사용법: node version.js <read|sync|bump> [patch|minor|major]')
    }

    if (command === 'read') {
        process.stdout.write(`${readVersionProperties()}\n`)
        return
    }

    if (command === 'sync') {
        const version = readVersionProperties()
        syncVersionFiles(version)
        process.stdout.write(`${version}\n`)
        return
    }

    if (command === 'bump') {
        const releaseType = process.argv[3] || 'patch'
        const currentVersion = readVersionProperties()
        const nextVersion = bumpVersion(currentVersion, releaseType)
        writeVersionProperties(nextVersion, new Date().toISOString())
        syncVersionFiles(nextVersion)
        process.stdout.write(`${nextVersion}\n`)
        return
    }

    throw new Error(`알 수 없는 명령입니다: ${command}`)
}

main()
