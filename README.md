# 🎲 BINGO景品くじアプリ

イベント用のビンゴ景品くじデスクトップアプリです。  
カードをクリックすると華やかな演出と共に景品が発表されます。  
景品の登録・編集・画像リサイズもアプリ内で完結できます。

---

## 📥 ダウンロード

### 方法1: ビルド済み .exe をダウンロード（推奨）

> **Node.js やコマンド操作は不要です。**

1. [**Releases**](../../releases) ページを開く
2. 最新バージョンの `BINGO景品くじ.exe` をダウンロード
3. ダブルクリックで起動！

### 方法2: ソースコードからビルド

[Node.js](https://nodejs.org/)（v18以上）が必要です。

```bash
git clone https://github.com/<your-username>/bingo.git
cd bingo
npm install
npm start        # 開発用起動
```

#### .exe をビルドする場合

```powershell
# PowerShell でビルドスクリプトを実行
.\build.ps1
```

`dist/` フォルダに `BINGO景品くじ.exe` が生成されます。

---

## ✨ 機能

### 🎲 ビンゴ画面

- 景品数に応じたカードを自動生成（1〜N枚）
- カードクリックで景品を発表
  - カード拡大アニメーション
  - 紙吹雪エフェクト
  - モーダルで景品画像・名前・説明を表示
- シャッフルによるランダム割り当て

### ⚙️ 景品管理画面

- 景品の **追加・編集・削除**
- **画像アップロード**（ファイル選択ダイアログ）
- **画像リサイズ**
  - 幅・高さを指定（px単位）
  - アスペクト比維持オプション
- データはJSON形式で自動保存

---

## ⌨️ ショートカット

| 操作         | キー       |
| ------------ | ---------- |
| ビンゴ画面   | `Ctrl + 1` |
| 景品管理画面 | `Ctrl + 2` |
| 拡大         | `Ctrl + =` |
| 縮小         | `Ctrl + -` |
| 標準サイズ   | `Ctrl + 0` |
| 全画面       | `F11`      |

---

## 📂 プロジェクト構成

```
bingo/
├── main.js            # Electronメインプロセス
├── preload.js         # IPC通信（セキュア）
├── package.json       # Electron設定・ビルドスクリプト
├── build.ps1          # ビルド用PowerShellスクリプト
│
├── bingo.html         # ビンゴ画面
├── script.js          # ビンゴ画面ロジック
├── style.css          # ビンゴ画面スタイル
│
├── admin.html         # 景品管理画面
├── admin.js           # 景品管理ロジック
├── admin.css          # 景品管理スタイル
│
├── data/
│   └── prizes.json    # 景品データ
└── images/            # 景品画像
```

---

## 🛠️ 技術スタック

| 技術                                            | 用途                 |
| ----------------------------------------------- | -------------------- |
| [Electron](https://www.electronjs.org/)         | デスクトップアプリ化 |
| [electron-builder](https://www.electron.build/) | .exe ビルド          |
| HTML / CSS / JavaScript                         | UI                   |
| Canvas API                                      | 画像リサイズ         |

---

## 🔧 カスタマイズ

### 景品データの編集

アプリ内の景品管理画面（`Ctrl + 2`）から操作できます。  
または `data/prizes.json` を直接編集することも可能です。

```json
[
  {
    "title": "景品名",
    "description": "景品の説明文",
    "image": "画像ファイル名.jpg"
  }
]
```

### タイトル・デザインの変更

- `bingo.html` 内の `<h1>` タグでタイトルを変更
- `style.css` でカラー・フォント・レイアウトを変更

---

## 📄 ライセンス

[MIT License](LICENSE)
