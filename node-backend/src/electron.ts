import path from 'path'
import { app, BrowserWindow, nativeImage, shell } from 'electron'
import { startServer } from './index'

const WINDOW_WIDTH = 1440
const WINDOW_HEIGHT = 900
// 개발 시 고정 포트 — 디버깅 편의를 위해 항상 같은 포트를 사용한다.
// 패키징 배포 시 0 을 지정하면 OS 가 빈 포트를 자동 할당한다 (포트 충돌 없음).
const DEV_PORT = 3000
const PACKAGED_PORT = 0

let mainWindow: BrowserWindow | null = null

function resolveAppIconPath(): string {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'frontend', 'dist', 'favicon.png')
    }

    return path.resolve(__dirname, '../../frontend/public/favicon.png')
}

function createWindow(port: number): void {
    const appIcon = nativeImage.createFromPath(resolveAppIconPath())

    if (process.platform === 'darwin' && !appIcon.isEmpty()) {
        app.dock.setIcon(appIcon)
    }

    mainWindow = new BrowserWindow({
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        title: 'Agent Space',
        icon: appIcon.isEmpty() ? undefined : appIcon,
        webPreferences: {
            // 로컬 서버에서 로드하므로 Node.js 접근은 불필요
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    mainWindow.loadURL(`http://localhost:${port}`)

    // 외부 링크는 기본 브라우저로 열기
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url)
        return { action: 'deny' }
    })

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

app.whenReady().then(async () => {
    const port = await startServer(app.isPackaged ? PACKAGED_PORT : DEV_PORT)
    createWindow(port)

    // macOS: 독 아이콘 클릭 시 윈도우 재생성
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow(port)
        }
    })
}).catch(err => {
    console.error('[Electron] 서버 시작 실패:', err)
    app.quit()
})

// macOS 외 플랫폼: 모든 윈도우 닫히면 앱 종료
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
