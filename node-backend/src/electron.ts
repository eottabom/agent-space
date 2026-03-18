import { app, BrowserWindow, shell } from 'electron'
import { startServer } from './index'

const WINDOW_WIDTH = 1440
const WINDOW_HEIGHT = 900

let mainWindow: BrowserWindow | null = null

function createWindow(port: number): void {
    mainWindow = new BrowserWindow({
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        title: 'Agent Space',
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
    const port = await startServer()
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
