// ------------------------------------
// お宝キャッチゲーム（Phaser.js）
// 画像は assets/images/ に入れてください
// ------------------------------------

const W = 600;
const H = 600;
const GAME_TIME = 60;

// アイテム画像と得点
const ITEM_DATA = [
  { key: "meat", file: "meat.png", score: 10 },
  { key: "coin", file: "coin.png", score: 20 },
  { key: "cat",  file: "cat.png",  score: 50 },
  { key: "fish", file: "fish.png", score: 15 },
  { key: "gem",  file: "gem.png",  score: 30 }
];

class CatchGame extends Phaser.Scene {
  constructor() {
    super("CatchGame");
  }

  // 画像を読み込む
  preload() {
    this.load.image("background", "assets/images/background.png");
    this.load.image("player", "assets/images/player.png");

    ITEM_DATA.forEach(item => {
      this.load.image(item.key, `assets/images/${item.file}`);
    });
  }

  // 最初の画面を作る
  create() {
    this.background = this.add.image(W / 2, H / 2, "background")
      .setDisplaySize(W, H);

    this.player = this.physics.add.image(W / 2, H - 75, "player");
    this.player.setDisplaySize(90, 70);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(90, 65);

    this.items = this.physics.add.group();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("A,D");

    this.score = 0;
    this.timeLeft = GAME_TIME;
    this.playing = false;

    this.scoreText = this.add.text(16, 14, "SCORE: 0", {
      fontSize: "24px", color: "#ffffff", fontStyle: "bold",
      stroke: "#263238", strokeThickness: 4
    }).setDepth(10);

    this.timeText = this.add.text(W - 16, 14, `TIME: ${GAME_TIME}`, {
      fontSize: "24px", color: "#ffffff", fontStyle: "bold",
      stroke: "#263238", strokeThickness: 4
    }).setOrigin(1, 0).setDepth(10);

    this.message = this.add.text(W / 2, H / 2, "お宝キャッチ\n\nENTERでスタート", {
      fontSize: "32px", color: "#ffffff", align: "center",
      fontStyle: "bold", stroke: "#263238", strokeThickness: 6
    }).setOrigin(0.5).setDepth(20);

    this.input.keyboard.on("keydown-ENTER", () => {
      if (!this.playing) this.startGame();
    });

    // アイテムをキャッチしたときの処理
    this.physics.add.overlap(this.player, this.items, (player, item) => {
      if (!this.playing) return;
      this.score += item.getData("score");
      this.scoreText.setText(`SCORE: ${this.score}`);
      item.destroy();
    });
  }

  // ゲーム開始・再スタート
  startGame() {
    this.score = 0;
    this.timeLeft = GAME_TIME;
    this.playing = true;
    this.scoreText.setText("SCORE: 0");
    this.timeText.setText(`TIME: ${GAME_TIME}`);
    this.message.setVisible(false);
    this.items.clear(true, true);

    // 1秒ごとに残り時間を減らす
    this.timeEvent?.remove();
    this.timeEvent = this.time.addEvent({
      delay: 1000,
      repeat: GAME_TIME - 1,
      callback: () => {
        this.timeLeft--;
        this.timeText.setText(`TIME: ${this.timeLeft}`);
        if (this.timeLeft <= 0) this.endGame();
      }
    });

    // 一定間隔でアイテムを落とす
    this.dropEvent?.remove();
    this.dropEvent = this.time.addEvent({
      delay: 700,
      callback: () => this.dropItem(),
      loop: true
    });
  }

  // ランダムなアイテムを落とす
  dropItem() {
    if (!this.playing) return;

    const data = Phaser.Utils.Array.GetRandom(ITEM_DATA);
    const x = Phaser.Math.Between(35, W - 35);
    const item = this.items.create(x, -30, data.key);

    item.setDisplaySize(42, 42);
    item.setVelocityY(Phaser.Math.Between(180, 300));
    item.setData("score", data.score);
    item.setData("itemKey", data.key);
    item.setCollideWorldBounds(false);
  }

  // 毎フレームの処理
  update() {
    if (!this.playing) return;

    // 左右移動
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;

    if (left) this.player.setVelocityX(-360);
    else if (right) this.player.setVelocityX(360);
    else this.player.setVelocityX(0);

    // 画面下まで落ちたアイテムを削除
    this.items.getChildren().forEach(item => {
      if (item.y > H + 40) item.destroy();
    });
  }

  // ゲーム終了
  endGame() {
    this.playing = false;
    this.player.setVelocityX(0);
    this.items.setVelocityY(0);
    this.dropEvent?.remove();

    this.message.setText(
      `ゲーム終了！\n\nスコア：${this.score}\n\nENTERで再スタート`
    );
    this.message.setVisible(true);
  }
}

const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: "game",
  backgroundColor: "#34495e",
  physics: {
    default: "arcade",
    arcade: { debug: false }
  },
  scene: CatchGame
};

new Phaser.Game(config);
