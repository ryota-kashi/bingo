const { contextBridge, ipcRenderer } = require('electron');

// レンダラープロセスに安全にAPIを公開
contextBridge.exposeInMainWorld('electronAPI', {
    // 景品データ
    loadPrizes: () => ipcRenderer.invoke('prizes:load'),
    savePrizes: (prizes) => ipcRenderer.invoke('prizes:save', prizes),

    // 画像操作
    openImageDialog: () => ipcRenderer.invoke('dialog:openImage'),
    copyImage: (srcPath, fileName) => ipcRenderer.invoke('image:copy', srcPath, fileName),
    saveResizedImage: (base64Data, fileName) => ipcRenderer.invoke('image:saveResized', base64Data, fileName),
    deleteImage: (fileName) => ipcRenderer.invoke('image:delete', fileName),

    // パス取得
    getImagesPath: () => ipcRenderer.invoke('path:images'),

    // 画面切り替え
    navigateToBingo: () => ipcRenderer.invoke('navigate:bingo'),
    navigateToAdmin: () => ipcRenderer.invoke('navigate:admin'),
});
