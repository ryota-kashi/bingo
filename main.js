const { app, BrowserWindow, ipcMain, dialog, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// --- パス設定 ---
// 開発時はプロジェクトフォルダ、ビルド後はextraResourcesフォルダを参照
function getResourcePath(subPath) {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, subPath);
    }
    return path.join(__dirname, subPath);
}

function getDataPath() {
    return getResourcePath('data');
}

function getImagesPath() {
    return getResourcePath('images');
}

// --- 初期化: dataフォルダとimagesフォルダがなければ作成 ---
function ensureDirectories() {
    const dataDir = getDataPath();
    const imagesDir = getImagesPath();
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
}

// --- 設定（タイトルなど）の読み書き ---
function getSettingsFilePath() {
    return path.join(getDataPath(), 'settings.json');
}

function loadSettings() {
    const filePath = getSettingsFilePath();
    if (!fs.existsSync(filePath)) {
        return { appTitle: 'BINGO景品' };
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    try {
        return JSON.parse(raw);
    } catch (e) {
        return { appTitle: 'BINGO景品' };
    }
}

function saveSettings(settings) {
    const filePath = getSettingsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8');
}

// --- メインウィンドウ ---
let mainWindow;

function createWindow() {
    // PCの画面サイズを取得して、85%のサイズで起動
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const initialWidth = Math.round(screenWidth * 0.85);
    const initialHeight = Math.round(screenHeight * 0.85);

    const settings = loadSettings();

    mainWindow = new BrowserWindow({
        width: initialWidth,
        height: initialHeight,
        minWidth: 700,
        minHeight: 500,
        resizable: true,       // リサイズ可能
        maximizable: true,     // 最大化可能
        webPreferences: {
            preload: path.join(__dirname, 'src', 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        title: settings.appTitle || 'BINGO景品',
        autoHideMenuBar: false,
    });

    // ウィンドウを画面中央に配置
    mainWindow.center();

    // アプリメニュー
    const menuTemplate = [
        {
            label: '画面',
            submenu: [
                {
                    label: '🎲 ビンゴ画面',
                    accelerator: 'CmdOrCtrl+1',
                    click: () => mainWindow.loadFile(path.join('src', 'bingo.html')),
                },
                {
                    label: '⚙️ 景品管理',
                    accelerator: 'CmdOrCtrl+2',
                    click: () => mainWindow.loadFile(path.join('src', 'admin.html')),
                },
                { type: 'separator' },
                {
                    label: '終了',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => app.quit(),
                },
            ],
        },
        {
            label: '表示',
            submenu: [
                { role: 'reload', label: 'リロード' },
                { role: 'togglefullscreen', label: '全画面' },
                { type: 'separator' },
                {
                    label: '🔍 拡大',
                    accelerator: 'CmdOrCtrl+=',
                    click: () => {
                        const currentZoom = mainWindow.webContents.getZoomFactor();
                        mainWindow.webContents.setZoomFactor(Math.min(currentZoom + 0.1, 3.0));
                    },
                },
                {
                    label: '🔍 縮小',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        const currentZoom = mainWindow.webContents.getZoomFactor();
                        mainWindow.webContents.setZoomFactor(Math.max(currentZoom - 0.1, 0.3));
                    },
                },
                {
                    label: '🔍 標準サイズに戻す',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        mainWindow.webContents.setZoomFactor(1.0);
                    },
                },
                { type: 'separator' },
                { role: 'toggleDevTools', label: '開発者ツール' },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    mainWindow.loadFile(path.join('src', 'bingo.html'));
}

// --- IPC ハンドラー ---
function setupIPC() {
    // 景品データの読み込み
    ipcMain.handle('prizes:load', () => {
        return loadPrizes();
    });

    // 景品データの保存
    ipcMain.handle('prizes:save', (_event, prizes) => {
        savePrizes(prizes);
        return { success: true };
    });

    // 設定の読み込み
    ipcMain.handle('settings:load', () => {
        return loadSettings();
    });

    // 設定の保存
    ipcMain.handle('settings:save', (_event, settings) => {
        saveSettings(settings);
        // ウィンドウタイトルも即座に更新
        if (mainWindow) {
            mainWindow.setTitle(settings.appTitle || 'BINGO景品');
        }
        return { success: true };
    });

    // 画像ファイル選択ダイアログ
    ipcMain.handle('dialog:openImage', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: '景品画像を選択',
            filters: [
                { name: '画像ファイル', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
            ],
            properties: ['openFile'],
        });
        if (result.canceled || result.filePaths.length === 0) return null;
        return result.filePaths[0];
    });

    // 画像をimagesフォルダにコピー
    ipcMain.handle('image:copy', (_event, srcPath, fileName) => {
        const destPath = path.join(getImagesPath(), fileName);
        fs.copyFileSync(srcPath, destPath);
        return destPath;
    });

    // リサイズされた画像を保存（Base64データを受け取って書き込み）
    ipcMain.handle('image:saveResized', (_event, base64Data, fileName) => {
        const destPath = path.join(getImagesPath(), fileName);
        // data:image/jpeg;base64,... の形式からBase64部分を抽出
        const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        fs.writeFileSync(destPath, buffer);
        return destPath;
    });

    // 画像ファイルの削除
    ipcMain.handle('image:delete', (_event, fileName) => {
        const filePath = path.join(getImagesPath(), fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return { success: true };
    });

    // imagesフォルダのパスを取得
    ipcMain.handle('path:images', () => {
        return getImagesPath();
    });

    // 画面切り替え
    ipcMain.handle('navigate:bingo', () => {
        mainWindow.loadFile(path.join('src', 'bingo.html'));
    });

    ipcMain.handle('navigate:admin', () => {
        mainWindow.loadFile(path.join('src', 'admin.html'));
    });
}

// --- アプリ起動 ---
app.whenReady().then(() => {
    ensureDirectories();
    setupIPC();
    createWindow();
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
