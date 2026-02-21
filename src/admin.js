// ============================= //
// ====== 景品管理画面ロジック == //
// ============================= //

let prizes = [];
let editingIndex = -1; // -1 = 新規追加モード
let selectedImagePath = null; // 選択した画像のパス
let originalImageWidth = 0;
let originalImageHeight = 0;
let imagesPath = '';

// --- DOM要素 ---
const form = document.getElementById('prize-form');
const formTitle = document.getElementById('form-title');
const nameInput = document.getElementById('prize-name');
const descInput = document.getElementById('prize-desc');
const btnSubmit = document.getElementById('btn-submit');
const btnCancel = document.getElementById('btn-cancel');
const btnSelectImage = document.getElementById('btn-select-image');
const selectedFileName = document.getElementById('selected-file-name');
const previewContainer = document.getElementById('image-preview-container');
const previewImg = document.getElementById('image-preview');
const resizeWidth = document.getElementById('resize-width');
const resizeHeight = document.getElementById('resize-height');
const keepAspect = document.getElementById('keep-aspect');
const resizeInfo = document.getElementById('resize-info');
const prizeList = document.getElementById('prize-list');
const prizeCount = document.getElementById('prize-count');
const btnGoBingo = document.getElementById('btn-go-bingo');

// --- 初期化 ---
async function init() {
    imagesPath = await window.electronAPI.getImagesPath();
    prizes = await window.electronAPI.loadPrizes();
    
    // 設定（タイトル）の読み込み
    try {
        const settings = await window.electronAPI.loadSettings();
        const titleInput = document.getElementById('app-title-input');
        if (settings && settings.appTitle && titleInput) {
            titleInput.value = settings.appTitle;
        }
    } catch (err) {
        console.error('設定の読み込みに失敗しました:', err);
    }

    renderPrizeList();
    setupEventListeners();
}

// --- イベントリスナー設定 ---
function setupEventListeners() {
    // ビンゴ画面への遷移
    btnGoBingo.addEventListener('click', () => {
        window.electronAPI.navigateToBingo();
    });

    // アプリタイトルの保存
    const btnSaveSettings = document.getElementById('btn-save-settings');
    if (btnSaveSettings) {
        btnSaveSettings.addEventListener('click', async () => {
            const titleInput = document.getElementById('app-title-input');
            const newTitle = titleInput.value.trim();
            if (!newTitle) {
                showToast('タイトルを入力してください', 'error');
                return;
            }
            await window.electronAPI.saveSettings({ appTitle: newTitle });
            showToast('タイトルを保存しました ✅', 'success');
        });
    }

    // 画像選択
    btnSelectImage.addEventListener('click', handleSelectImage);

    // リサイズ幅の変更時にアスペクト比維持
    resizeWidth.addEventListener('input', () => {
        if (keepAspect.checked && originalImageWidth > 0) {
            const ratio = originalImageHeight / originalImageWidth;
            const w = parseInt(resizeWidth.value);
            if (w > 0) {
                resizeHeight.value = Math.round(w * ratio);
            }
        }
        updateResizeInfo();
    });

    // リサイズ高さの変更時にアスペクト比維持
    resizeHeight.addEventListener('input', () => {
        if (keepAspect.checked && originalImageHeight > 0) {
            const ratio = originalImageWidth / originalImageHeight;
            const h = parseInt(resizeHeight.value);
            if (h > 0) {
                resizeWidth.value = Math.round(h * ratio);
            }
        }
        updateResizeInfo();
    });

    // フォーム送信
    form.addEventListener('submit', handleSubmit);

    // キャンセル
    btnCancel.addEventListener('click', resetForm);
}

// --- 画像選択ハンドラー ---
async function handleSelectImage() {
    const filePath = await window.electronAPI.openImageDialog();
    if (!filePath) return;

    selectedImagePath = filePath;
    const fileName = filePath.split(/[/\\]/).pop();
    selectedFileName.textContent = fileName;

    // プレビュー読み込み（file://プロトコルで表示）
    previewImg.src = `file://${filePath}`;
    previewContainer.style.display = 'block';

    // 元画像のサイズを取得
    previewImg.onload = () => {
        originalImageWidth = previewImg.naturalWidth;
        originalImageHeight = previewImg.naturalHeight;
        resizeInfo.textContent = `元のサイズ: ${originalImageWidth} × ${originalImageHeight} px`;
    };
}

// --- リサイズ情報更新 ---
function updateResizeInfo() {
    const w = parseInt(resizeWidth.value);
    const h = parseInt(resizeHeight.value);
    if (w > 0 && h > 0 && originalImageWidth > 0) {
        resizeInfo.textContent = `${originalImageWidth}×${originalImageHeight} → ${w}×${h} px にリサイズ`;
    }
}

// --- Canvas APIで画像をリサイズ ---
function resizeImage(imgElement, targetWidth, targetHeight) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgElement, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
    });
}

// --- フォーム送信ハンドラー ---
async function handleSubmit(e) {
    e.preventDefault();

    const name = nameInput.value.trim();
    const desc = descInput.value.trim();

    if (!name) {
        showToast('景品名を入力してください', 'error');
        return;
    }

    let imageFileName = '';

    // 編集モードで画像変更なしの場合、既存の画像名を維持
    if (editingIndex >= 0 && !selectedImagePath) {
        imageFileName = prizes[editingIndex].image || '';
    }

    // 新しい画像が選択されている場合
    if (selectedImagePath) {
        const ext = selectedImagePath.split('.').pop().toLowerCase();
        // タイムスタンプベースのファイル名を生成
        const timestamp = Date.now();
        imageFileName = `prize_${timestamp}.${ext}`;

        const targetW = parseInt(resizeWidth.value);
        const targetH = parseInt(resizeHeight.value);

        if (targetW > 0 && targetH > 0) {
            // リサイズして保存
            const img = new Image();
            img.src = `file://${selectedImagePath}`;
            await new Promise(resolve => { img.onload = resolve; });
            const base64 = await resizeImage(img, targetW, targetH);
            // リサイズ後はJPEG
            imageFileName = `prize_${timestamp}.jpg`;
            await window.electronAPI.saveResizedImage(base64, imageFileName);
        } else {
            // そのままコピー
            await window.electronAPI.copyImage(selectedImagePath, imageFileName);
        }
    }

    const prizeData = {
        title: name,
        description: desc,
        image: imageFileName,
    };

    if (editingIndex >= 0) {
        // 編集: 古い画像を削除（新しい画像がある場合のみ）
        if (selectedImagePath && prizes[editingIndex].image) {
            await window.electronAPI.deleteImage(prizes[editingIndex].image);
        }
        prizes[editingIndex] = prizeData;
        showToast('景品を更新しました ✅', 'success');
    } else {
        // 新規追加
        prizes.push(prizeData);
        showToast('景品を追加しました ✅', 'success');
    }

    await window.electronAPI.savePrizes(prizes);
    renderPrizeList();
    resetForm();
}

// --- 編集モードに切り替え ---
function startEdit(index) {
    editingIndex = index;
    const prize = prizes[index];

    nameInput.value = prize.title;
    descInput.value = prize.description || '';
    formTitle.textContent = '景品を編集';
    btnSubmit.textContent = '✏️ 更新する';
    btnCancel.style.display = 'inline-flex';

    // 画像プレビュー表示
    if (prize.image) {
        selectedFileName.textContent = prize.image;
        previewImg.src = `file://${imagesPath}/${prize.image}`;
        previewContainer.style.display = 'block';
        previewImg.onload = () => {
            originalImageWidth = previewImg.naturalWidth;
            originalImageHeight = previewImg.naturalHeight;
            resizeInfo.textContent = `現在のサイズ: ${originalImageWidth} × ${originalImageHeight} px`;
        };
    }

    selectedImagePath = null;

    // フォームにスクロール
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- 景品削除 ---
async function deletePrize(index) {
    const prize = prizes[index];
    if (!confirm(`「${prize.title}」を削除してもよろしいですか？`)) return;

    // 画像も削除
    if (prize.image) {
        await window.electronAPI.deleteImage(prize.image);
    }

    prizes.splice(index, 1);
    await window.electronAPI.savePrizes(prizes);
    renderPrizeList();
    showToast('景品を削除しました', 'success');

    // 編集中なら解除
    if (editingIndex === index) resetForm();
}

// --- フォームリセット ---
function resetForm() {
    editingIndex = -1;
    form.reset();
    formTitle.textContent = '景品を追加';
    btnSubmit.textContent = '＋ 追加する';
    btnCancel.style.display = 'none';
    selectedImagePath = null;
    selectedFileName.textContent = '未選択';
    previewContainer.style.display = 'none';
    previewImg.src = '';
    originalImageWidth = 0;
    originalImageHeight = 0;
    resizeInfo.textContent = '';
    resizeWidth.value = '';
    resizeHeight.value = '';
}

// --- 景品リスト描画 ---
function renderPrizeList() {
    prizeCount.textContent = prizes.length;

    if (prizes.length === 0) {
        prizeList.innerHTML = '<div class="empty-message">景品が登録されていません。上のフォームから追加してください。</div>';
        return;
    }

    prizeList.innerHTML = prizes.map((prize, i) => `
        <div class="prize-item">
            <div class="prize-index">${i + 1}</div>
            <div class="prize-thumbnail">
                ${prize.image
                    ? `<img src="file://${imagesPath}/${prize.image}" alt="${prize.title}" />`
                    : '<span class="no-image">画像なし</span>'
                }
            </div>
            <div class="prize-info">
                <div class="prize-title">${escapeHtml(prize.title)}</div>
                <div class="prize-description">${escapeHtml(prize.description || '説明なし')}</div>
            </div>
            <div class="prize-actions">
                <button type="button" class="btn btn-edit btn-sm" onclick="startEdit(${i})">✏️ 編集</button>
                <button type="button" class="btn btn-danger btn-sm" onclick="deletePrize(${i})">🗑️ 削除</button>
            </div>
        </div>
    `).join('');
}

// --- HTMLエスケープ ---
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- トースト通知 ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// --- 起動 ---
init();
