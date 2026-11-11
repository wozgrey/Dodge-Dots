// ==================================================
// お宝キャッチゲーム（Phaser.js）
// 画像：assets/images/ に配置
// BGM ：assets/sounds/bgm.mp3 に配置
// 操作：← → または A・D キー
// ==================================================


// ---------- ゲーム全体の設定 ----------

const W = 600;                 // ゲーム画面の横幅
const H = 600;                 // ゲーム画面の高さ
const GAME_TIME = 60;          // 制限時間（秒）
const BGM_VOLUME = 0.3;        // BGM音量（0.0～1.0）

// アイテムの画像名と得点
const ITEM_DATA = [
  { key: "meat", file: "meat.png", score: 10 }, // 肉：10点
  { key: "coin", file: "coin.png", score: 20 }, // コイン：20点
  { key: "cat",  file: "cat.png",  score: 50 }, // 猫：50点
  { key: "fish", file: "fish.png", score: 15 }, // 魚：15点
  { key: "gem",  file: "gem.png",  score: 30 }  // 宝石：30点
];


// ---------- ゲーム本体 ----------

class CatchGame extends Phaser.Scene {

  // シーンの名前を登録
  constructor() {
    super("CatchGame");
  }


  // ---------- 画像・音声の読み込み ----------

  preload() {
    // 背景画像を読み込む
    this.load.image("background", "assets/images/background.png");

    // プレイヤー画像を読み込む
    this.load.image("player", "assets/images/player.png");

    // 5種類のアイテム画像をまとめて読み込む
    ITEM_DATA.forEach(item => {
      this.load.image(item.key, `assets/images/${item.file}`);
    });

    // BGMを読み込む（この名前をあとで再生に使う）
    this.load.audio("bgm", "assets/sounds/bgm.mp3");
  }


  // ---------- ゲーム画面の作成 ----------

  create() {
    // 背景を画面中央に置き、画面サイズに合わせる
    this.background = this.add.image(W / 2, H / 2, "background")
      .setDisplaySize(W, H);

    // プレイヤーを画面下部に配置する
    this.player = this.physics.add.image(W / 2, H - 75, "player");
    this.player.setDisplaySize(90, 70);       // 表示サイズ
    this.player.setCollideWorldBounds(true);  // 画面外に出ない設定
    this.player.body.setSize(90, 65);         // 当たり判定の大きさ

    // 落下アイテムを管理するグループ
    this.items = this.physics.add.group();

    // キーボード入力を取得する
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("A,D");

    // BGMをループ再生する音声として準備する
    this.bgm = this.sound.add("bgm", {
      loop: true,                 // 最後まで流れたら最初に戻る
      volume: BGM_VOLUME           // 初期音量
    });

    // ゲームの状態を初期化する
    this.score = 0;               // 現在のスコア
    this.timeLeft = GAME_TIME;    // 残り時間
    this.playing = false;         // ゲーム中かどうか

    // スコア表示を作る
    this.scoreText = this.add.text(16, 14, "SCORE: 0", {
      fontSize: "24px", color: "#ffffff", fontStyle: "bold",
      stroke: "#263238", strokeThickness: 4
    }).setDepth(10);

    // 残り時間表示を作る
    this.timeText = this.add.text(W - 16, 14, `TIME: ${GAME_TIME}`, {
      fontSize: "24px", color: "#ffffff", fontStyle: "bold",
      stroke: "#263238", strokeThickness: 4
    }).setOrigin(1, 0).setDepth(10);

    // スタート画面のメッセージを作る
    this.message = this.add.text(W / 2, H / 2, "お宝キャッチ\n\nENTERでスタート", {
      fontSize: "32px", color: "#ffffff", align: "center",
      fontStyle: "bold", stroke: "#263238", strokeThickness: 6
    }).setOrigin(0.5).setDepth(20);

    // ENTERキーを押したらゲームを開始する
    this.input.keyboard.on("keydown-ENTER", () => {
      if (!this.playing) this.startGame();
    });

    // プレイヤーとアイテムが重なったときの処理
    this.physics.add.overlap(this.player, this.items, (player, item) => {
      if (!this.playing) return;                 // ゲーム中以外は無視
      this.score += item.getData("score");       // アイテムの点数を加算
      this.scoreText.setText(`SCORE: ${this.score}`); // スコア表示を更新
      item.destroy();                            // 取ったアイテムを消す
    });
  }


  // ---------- ゲーム開始・再スタート ----------

  startGame() {
    this.score = 0;                         // スコアをリセット
    this.timeLeft = GAME_TIME;              // 時間をリセット
    this.playing = true;                    // ゲーム中にする
    this.scoreText.setText("SCORE: 0");      // スコア表示を戻す
    this.timeText.setText(`TIME: ${GAME_TIME}`); // 時間表示を戻す
    this.message.setVisible(false);         // メッセージを隠す
    this.items.clear(true, true);           // 前回のアイテムを削除

    // BGMが再生中なら一度止める
    if (this.bgm.isPlaying) this.bgm.stop();

    // ENTERキーを押したタイミングでBGMを再生する
    // ユーザー操作後の再生なのでブラウザの自動再生制限に対応しやすい
    this.bgm.play();

    // 前回の残り時間タイマーがあれば削除
    this.timeEvent?.remove();

    // 1秒ごとに残り時間を減らすタイマー
    this.timeEvent = this.time.addEvent({
      delay: 1000,                           // 1秒間隔
      repeat: GAME_TIME - 1,                 // 合計60回
      callback: () => {
        this.timeLeft--;                     // 残り時間を1減らす
        this.timeText.setText(`TIME: ${this.timeLeft}`); // 表示を更新
        if (this.timeLeft <= 0) this.endGame(); // 0なら終了
      }
    });

    // 前回のアイテム生成タイマーがあれば削除
    this.dropEvent?.remove();

    // 0.7秒ごとにアイテムを落とすタイマー
    this.dropEvent = this.time.addEvent({
      delay: 700,                            // 0.7秒間隔
      callback: () => this.dropItem(),       // アイテム生成処理
      loop: true                             // 繰り返す
    });
  }


  // ---------- アイテムを落とす ----------

  dropItem() {
    if (!this.playing) return;               // ゲーム中以外は作らない

    // 5種類からランダムに1つ選ぶ
    const data = Phaser.Utils.Array.GetRandom(ITEM_DATA);

    // アイテムの出現位置をランダムに決める
    const x = Phaser.Math.Between(35, W - 35);

    // 画面の上からアイテムを作る
    const item = this.items.create(x, -30, data.key);

    item.setDisplaySize(42, 42);             // アイテムの表示サイズ
    item.setVelocityY(Phaser.Math.Between(180, 300)); // 落下速度
    item.setData("score", data.score);       // 得点をアイテムに保存
    item.setData("itemKey", data.key);       // 種類を保存
    item.setCollideWorldBounds(false);       // 画面外で止めない
  }


  // ---------- 毎フレームの処理 ----------

  update() {
    if (!this.playing) return;               // ゲーム中以外は処理しない

    // 左矢印またはAキーが押されているか確認
    const left = this.cursors.left.isDown || this.keys.A.isDown;

    // 右矢印またはDキーが押されているか確認
    const right = this.cursors.right.isDown || this.keys.D.isDown;

    // 左右キーに応じてプレイヤーを移動
    if (left) this.player.setVelocityX(-360);       // 左へ移動
    else if (right) this.player.setVelocityX(360);  // 右へ移動
    else this.player.setVelocityX(0);               // キーを離したら停止

    // 画面の下まで落ちたアイテムを削除
    this.items.getChildren().forEach(item => {
      if (item.y > H + 40) item.destroy();
    });
  }


  // ---------- ゲーム終了 ----------

  endGame() {
    this.playing = false;                    // ゲーム中フラグを解除
    this.player.setVelocityX(0);             // プレイヤーを停止
    this.items.setVelocityY(0);              // アイテムを停止
    this.dropEvent?.remove();                // アイテム生成を止める

    // BGMを停止する
    this.bgm.stop();

    // 最終スコアと再スタート方法を表示
    this.message.setText(
      `ゲーム終了！\n\nスコア：${this.score}\n\nENTERで再スタート`
    );
    this.message.setVisible(true);           // メッセージを表示
  }
}


// ---------- Phaser.jsの設定 ----------

const config = {
  type: Phaser.AUTO,                 // WebGLかCanvasを自動選択
  width: W,                          // ゲーム画面の横幅
  height: H,                         // ゲーム画面の高さ
  parent: "game",                    // index.html内の表示場所
  backgroundColor: "#34495e",        // 背景色

  // 物理エンジンの設定
  physics: {
    default: "arcade",               // Arcade Physicsを使用
    arcade: { debug: false }         // 当たり判定の線を表示しない
  },

  scene: CatchGame                   // 使用するゲームシーン
};

// Phaser.jsのゲームを起動する
new Phaser.Game(config);
