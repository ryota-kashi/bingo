// ==== 景品データの読み込み =====================
// Electron環境ではJSONファイルから読み込み、通常のブラウザ環境ではフォールバック用データを使用
let originalPrizes = [];
let imagesBasePath = '';

// フォールバック用：Electron外で動作する場合のデフォルト景品データ
const fallbackPrizes = [
    { title: "キッチンバサミ", description: "新潟・燕三条エリアの職人が作る、切れ味抜群のキッチンばさみです。", image: "hasami2.jpg" },
    { title: "iPhone 17 Pro シルバー", description: "今話題の最新スマホです。512GBで容量も文句無し！", image: "iPhone17pro2.jpg" },
    { title: "箱根小涌園 天悠", description: "箱根で話題の高級旅館です。2名様平休日1泊2食付となってます。", image: "hakone2.jpg" },
    { title: "ロボット掃除機 SwitchBot", description: "吸引＋水拭きができるロボット掃除機です。最大70日間ゴミを捨てなくても大丈夫！", image: "robot2.jpg" },
    { title: "AirPods Pro 3", description: "好きな音楽を思う存分楽しめます。", image: "Airpods2.jpg" },
    { title: "ReFa BEAUTECH DRYER", description: "見た目からは想像できないパワフルさと、独自のテクノロジーで、ドライヤーの常識を鮮やかに覆します。", image: "ReFa2.jpg" },
    { title: "くらしのセゾン水回り3点クリーニング", description: "浴室・洗面・トイレの水回り3点をプロの手でピカピカに！", image: "souji2.jpg" },
    { title: "ヤーマン ミーゼ 美顔器", description: "お家でエステサロン級の体験ができます。", image: "mise2.jpg" },
    { title: "ノンフライヤー", description: "余分な油を落として、美味しく揚げ物を食べられます。", image: "simplus2.jpg" },
    { title: "IH炊飯ジャー 5.5合", description: "ごはんのおいしさはもちろん、ベビーごはんも。お手入れもしやすいです。", image: "IH2.jpg" },
    { title: "ふとん乾燥機 ", description: "オゾン発生量UPで強力消臭＆除菌にも対応！", image: "futon2.jpg" },
    { title: "BAKUNE", description: "血行を促進し、疲労回復することで健康的な毎日を支える機能性パジャマです。", image: "BAKUNE2.jpg" },
    { title: "SIXPAD Power Gun Pocket", description: "マッサージに行かなくても、全身お家でケアできます。", image: "Gun2.jpg" },
    { title: "nishikawa もちもちブランケット", description: "おうちでこもりたくなるようなあたたかいブランケットです。", image: "blanket2.jpg" },
    { title: "simplus シュレッダー", description: "場所をとらないスリムタイプで、すぐに処理ができます。", image: "Shredder2.jpg" },
];
// =====================================

let prizes = [];
const container = document.getElementById("card-container");
const resultEl = document.getElementById("result");


function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initGame() {
    // 景品をシャッフル
    prizes = shuffle([...originalPrizes]);
    container.innerHTML = "";
    resultEl.textContent = "";

    // カード枚数は景品数に合わせる
    const cardCount = prizes.length;

    for (let i = 0; i < cardCount; i++) {
        const card = document.createElement("button");
        card.className = "card";
        card.type = "button";
        card.innerHTML = `<span class="card-number">${i + 1}</span>`;
        card.dataset.index = i;

        card.addEventListener("click", () => handleCardClick(card));

        container.appendChild(card);
    }

    // 説明文を景品数に合わせて更新
    const descEl = document.getElementById("description");
    if (descEl) {
        descEl.innerHTML = `当選された方は、下の <strong>1〜${cardCount}</strong> のカードから好きな番号を1つ選んでクリックしてください。<br>`;
    }
}

function handleCardClick(card) {
    if (card.disabled) return;

    const index = Number(card.dataset.index);
    const prize = prizes[index];
    if (!prize) return;

    const cards = Array.from(container.querySelectorAll(".card"));

    // 景品名をすぐに表示せず、空にしておく
    resultEl.textContent = "";

    // 他カードを少し暗く
    cards.forEach(c => {
        if (c !== card && !c.disabled) {
            c.classList.add("card-dimmed");
        }
    });

    // 選ばれたカードを拡大
    card.classList.add("card-selected");
    card.disabled = true;


    // 少し間をおいて、画像モーダル + コンフェッティ
    setTimeout(() => {
        openPrizeModal(prize, index + 1, card);
        launchConfetti();
        // 他カードの暗転を戻す
        cards.forEach(c => c.classList.remove("card-dimmed"));
    }, 800); 
}

// 画像パスを解決する関数
function resolveImagePath(imageName) {
    if (!imageName) return '';
    if (imagesBasePath) {
        // Electron環境: imagesフォルダのフルパスを使用
        return `file://${imagesBasePath}/${imageName}`;
    }
    // 通常のブラウザ環境: 相対パス
    return imageName;
}

// モーダル表示関数
function openPrizeModal(prize, cardNumber, card) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";

    const modal = document.createElement("div");
    modal.className = "modal";

    const imageSrc = resolveImagePath(prize.image);

    modal.innerHTML = `
        <div class="modal-inner">
            <div class="modal-title">🌟 BINGO GRAND PRIZE！ 🌟</div>
            <div class="modal-sub">おめでとうございます！🎉 あなたの選んだ${cardNumber}番の景品は...</div>
            <div class="modal-divider"></div>

            <div class="modal-image-big">
                ${
                    imageSrc
                        ? `<img src="${imageSrc}" alt="${prize.title}">`
                        : `<span style="font-size:18px; opacity:0.7; color:#4b5563;">景品画像は準備中です</span>`
                }
            </div>

            <div class="modal-prize-title">【${prize.title}】</div>
            <div class="modal-prize-desc">🎉 ${prize.description || "豪華景品！"}</div>
            <div class="modal-note">※景品の受け渡しはスタッフの案内に従ってください。</div>

            <div class="modal-actions">
                <button class="modal-close-btn" type="button">景品を確定する！</button>
            </div>
        </div>
    `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    const applyPrizeLabel = () => {
        if (!card) return;
        if (!card.dataset.labeled) {
            // カード番号を景品名に書き換え
            card.innerHTML = `<span class="card-prize">${prize.title}</span>`;
            card.dataset.labeled = "true";
            card.classList.remove("card-selected");
            card.style.transform = '';

            // モーダルが閉じた後に #result に景品名を確定表示
            resultEl.textContent = `🎁 ${prize.title} が当たりました！`; 
        }
    };

    const closeBtn = modal.querySelector(".modal-close-btn");
    closeBtn.addEventListener("click", () => {
        applyPrizeLabel();
        document.body.removeChild(backdrop);
    });

    // 背景クリックでも閉じるように
    backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
            applyPrizeLabel();
            document.body.removeChild(backdrop);
        }
    });
}

// コンフェッティ（紙吹雪）アニメーション
function launchConfetti() {
    const count = 180;
    const colors = ["#0099FF", "#40b4ff", "#e91e63", "#ffc107", "#e0f2ff"]; 

    for (let i = 0; i < count; i++) {
        const piece = document.createElement("div");
        piece.className = "confetti-piece";

        const startLeft = Math.random() * 100; // vw
        const xMove = (Math.random() - 0.5) * 300; 

        piece.style.left = startLeft + "vw";
        piece.style.background = colors[i % colors.length];
        piece.style.animationDuration = 2.0 + Math.random() * 2.5 + "s"; 
        piece.style.animationDelay = Math.random() * 0.5 + "s";
        piece.style.setProperty("--x-move", xMove + "px");
        piece.style.transform = "rotate(" + (Math.random() * 360) + "deg";

        document.body.appendChild(piece);

        piece.addEventListener("animationend", () => {
            piece.remove();
        });
    }
}

// --- 起動処理 ---
async function startApp() {
    // Electron環境かどうかを判定
    if (window.electronAPI) {
        // Electron環境: JSONファイルから景品を読み込み
        try {
            imagesBasePath = await window.electronAPI.getImagesPath();
            const loaded = await window.electronAPI.loadPrizes();
            if (loaded && loaded.length > 0) {
                originalPrizes = loaded;
            } else {
                originalPrizes = fallbackPrizes;
            }
        } catch (err) {
            console.error('景品データの読み込みに失敗しました:', err);
            originalPrizes = fallbackPrizes;
        }

        // ナビゲーションバーを表示
        const navBar = document.getElementById('nav-bar');
        if (navBar) {
            navBar.style.display = 'flex';
            const adminBtn = document.getElementById('btn-go-admin');
            if (adminBtn) {
                adminBtn.addEventListener('click', () => {
                    window.electronAPI.navigateToAdmin();
                });
            }
        }

        // 設定（タイトル）を読み込んで反映
        try {
            const settings = await window.electronAPI.loadSettings();
            if (settings && settings.appTitle) {
                const titleEl = document.getElementById('app-title-display');
                if (titleEl) {
                    titleEl.textContent = settings.appTitle;
                }
                // ドキュメントタイトルも更新
                document.title = `${settings.appTitle} - BINGO景品くじ`;
            }
        } catch (settingsErr) {
            console.error('設定の読み込みに失敗しました:', settingsErr);
        }
    } else {
        // 通常のブラウザ環境: フォールバックデータを使用
        originalPrizes = fallbackPrizes;
    }

    initGame();
}

// アプリ開始
startApp();