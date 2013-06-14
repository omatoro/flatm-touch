/*
 * main.js
 */

/*
 * contant
 */
var SCREEN_WIDTH    = 680;              // スクリーン幅
var SCREEN_HEIGHT   = 960;              // スクリーン高さ
var SCREEN_CENTER_X = SCREEN_WIDTH/2;   // スクリーン幅の半分
var SCREEN_CENTER_Y = SCREEN_HEIGHT/2;  // スクリーン高さの半分

var PIECE_NUM_X     = 5;                // ピースの列数
var PIECE_NUM_Y     = 5;                // ピースの行数
var PIECE_NUM       = PIECE_NUM_X*PIECE_NUM_Y;  // ピース数
var PIECE_OFFSET_X  = 68;
var PIECE_OFFSET_Y  = 240;
var PIECE_WIDTH     = 135;
var PIECE_HEIGHT    = 135;
var BETWEEN         = 1;

var FONT_FAMILY_FLAT= "'Quicksand' 'Helvetica-Light' 'Meiryo' sans-serif";  // フラットデザイン用フォント

// アセット
var ASSETS = {
    "bgm":      "./sounds/sound.mp3",
    "pinponSE": "./sounds/yTTBV.mp3",
    "booSE":    "./sounds/jxDYu.mp3",
    "clearSE":  "./sounds/72Ss5.mp3",
};


/**
 * OverRide
 */
(function() {

    tm.app.FlatButton = tm.createClass({
        superClass: tm.app.Shape,

        init: function(param) {
            param.$safe({
                width: 300,
                height: 100,
                bgColor: "rgb(180, 180, 180)",
                text: "ABC",
                fontSize: 50,
                fontFamily: "Quicksand 'ＭＳ Ｐゴシック' 'MS PGothic' sans-serif",
            });

            this.superInit(param.width, param.height);

            this.canvas.clearColor(param.bgColor);

            this.setInteractive(true);
            this.setBoundingType("rect");

            this.label = tm.app.Label(param.text).addChildTo(this);
            this.label.setFontSize(param.fontSize).setFontFamily(param.fontFamily).setAlign("center").setBaseline("middle");
        },
    });

})();



/*
 * main
 */
tm.main(function() {
    // アプリケーションセットアップ
    var app = tm.app.CanvasApp("#world");       // 生成
    app.resize(SCREEN_WIDTH, SCREEN_HEIGHT);    // サイズ(解像度)設定
    app.fitWindow();                            // 自動フィッティング有効
    app.background = "rgba(250, 250, 250, 1.0)";// 背景色

    // ローディング
    var loading = tm.app.LoadingScene({
        width: SCREEN_WIDTH,    // 幅
        height: SCREEN_HEIGHT,  // 高さ
        assets: ASSETS,         // アセット
        nextScene: TitleScene,  // ローディング完了後のシーン
        nextScene: GameScene,   
    });
    app.replaceScene( loading );    // シーン切り替え

    // 実行
    app.run();
});

/*
 * ゲームシーン
 */
tm.define("GameScene", {
    superClass: "tm.app.Scene",

    init: function() {
        this.superInit();
        // bgm 再生
        tm.asset.AssetManager.get("bgm").play();

        var self = this;

        // カレント数
        self.currentNumber = 1;

        // ピースグループ
        this.pieceGroup = tm.app.CanvasElement();
        this.addChild(this.pieceGroup);

        // 数字配列
        var nums = [].range(1, PIECE_NUM+1);  // 1~25
        nums.shuffle(); // シャッフル

        // ピースを作成
        for (var i=0; i<PIECE_NUM_Y; ++i) {
            for (var j=0; j<PIECE_NUM_X; ++j) {
                // 数値
                var number = nums[ i*PIECE_NUM_X+j ];
                // ピースを生成してピースグループに追加
                var piece = Piece(number).addChildTo(this.pieceGroup);
                // 座標を設定
                piece.x = j * (PIECE_WIDTH  + BETWEEN) + PIECE_OFFSET_X;
                piece.y = i * (PIECE_HEIGHT + BETWEEN) + PIECE_OFFSET_Y;
                // タッチ時のイベントリスナーを登録
                piece.onpointingstart = function() {
                    // 正解かどうかの判定
                    if (this.number === self.currentNumber) {
                        // クリアかどうかの判定
                        if (self.currentNumber === PIECE_NUM) {
                            // リザルト画面に遷移
                            self.app.replaceScene(ResultScene({
                                time: self.timerLabel.text,
                            }));
                            // クリア SE 再生
                            tm.asset.AssetManager.get("clearSE").clone().play();
                        }
                        // 正解 SE 再生
                        tm.asset.AssetManager.get("pinponSE").clone().play();
                        self.currentNumber += 1;// インクリメント
                        this.disable();         // ボタン無効
                    }
                    else {
                        // 不正解 SE 再生
                        tm.asset.AssetManager.get("booSE").clone().play();
                    }
                };
            }
        }

        // タイマーラベル
        this.timerLabel = tm.app.Label("").addChildTo(this);
        this.timerLabel
            .setPosition(100, 160)
            .setFillStyle("#444")
            .setAlign("left")
            .setBaseline("bottom")
            .setFontFamily(FONT_FAMILY_FLAT)
            .setFontSize(128);

        // タイトルボタン
        var titleButtonWidth  = SCREEN_WIDTH/2;
        var titleBtn = tm.app.FlatButton({
            width: titleButtonWidth,
            height: 100,
            text: "TITLE",
            bgColor: "#888",
            fontFamily: FONT_FAMILY_FLAT,
            fontSize: 56,
        }).addChildTo(this);
        titleBtn.position.set(titleButtonWidth/2, 903);
        titleBtn.onpointingend = function() {
            self.app.replaceScene(TitleScene());
        };
        // リスタートボタン
        var restartButtonWidth  = SCREEN_WIDTH/2;
        var restartBtn = tm.app.FlatButton({
            width: restartButtonWidth -1,
            height: 100,
            text: "RESTART",
            bgColor: "#888",
            fontFamily: FONT_FAMILY_FLAT,
            fontSize: 56,
        }).addChildTo(this);
        restartBtn.position.set(titleButtonWidth + restartButtonWidth/2 + 1, 903);
        restartBtn.onpointingend = function() {
            self.app.replaceScene(GameScene());
        };
    },

    onenter: function(e) {
        e.app.pushScene(CountdownScene());
        this.onenter = null;
    },

    update: function(app) {
        // タイマー更新
        var time = ((app.frame/app.fps)*1000)|0;
        var timeStr = time + "";
        this.timerLabel.text = timeStr.replace(/(\d)(?=(\d\d\d)+$)/g, "$1.");
    }
});


/*
 * ピースクラス
 */
tm.define("Piece", {
    superClass: "tm.app.Shape",

    init: function(number) {
        this.superInit(PIECE_WIDTH, PIECE_HEIGHT);
        // 数値をセット
        this.number = number;

        this.setInteractive(true);
        this.setBoundingType("rect");

        var angle = tm.util.Random.randint(0, 360);
        this.canvas.clearColor("hsl({0}, 80%, 70%)".format(angle));

        this.label = tm.app.Label(number).addChildTo(this);
        this.label
            .setFontSize(56)
            .setFontFamily(FONT_FAMILY_FLAT)
            .setAlign("center")
            .setBaseline("middle");
        },

    disable: function() {
        this.setInteractive(false);

        var self = this;
        this.tweener
            .clear()
            .to({scaleX:0}, 100)
            .call(function() {
                self.canvas.clearColor("rgb(100, 100, 100)");
            }.bind(this))
            .to({scaleX:1, alpha:0.5}, 100)
    }
});

tm.define("CountdownScene", {
    superClass: "tm.app.Scene",

    init: function() {
        this.superInit();
        var self = this;

        var filter = tm.app.Shape(SCREEN_WIDTH, SCREEN_HEIGHT).addChildTo(this);
        filter.origin.set(0, 0);
        filter.canvas.clearColor("rgba(250, 250, 250, 1.0)");

        var label = tm.app.Label(3).addChildTo(this);
        label
            .setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y)
            .setFillStyle("#888")
            .setFontFamily(FONT_FAMILY_FLAT)
            .setFontSize(512)
            .setAlign("center")
            .setBaseline("middle");

        label.tweener
            .set({
                scaleX: 0.5,
                scaleY: 0.5,
                text: 3
            })
            .scale(1)
            .set({
                scaleX: 0.5,
                scaleY: 0.5,
                text: 2
            })
            .scale(1)
            .set({
                scaleX: 0.5,
                scaleY: 0.5,
                text: 1
            })
            .scale(1)
            .call(function() {
                self.app.frame = 0;
                self.app.popScene();
            });
    },
});

tm.define("TitleScene", {
    superClass: "tm.app.Scene",

    init: function() {
        this.superInit();

        this.fromJSON({
            children: [
                {
                    type: "Label", name: "titleLabel",
                    text: "FlaTM Touch",
                    x: SCREEN_CENTER_X,
                    y: 200,
                    fillStyle: "#444",
                    fontSize: 60,
                    fontFamily: FONT_FAMILY_FLAT,
                    align: "center",
                    baseline: "middle",
                },
                {
                    type: "Label", name: "nextLabel",
                    text: "TOUCH START",
                    x: SCREEN_CENTER_X,
                    y: 650,
                    fillStyle: "#444",
                    fontSize: 26,
                    fontFamily: FONT_FAMILY_FLAT,
                    align: "center",
                    baseline: "middle",
                }
            ]
        });
        
        this.nextLabel.tweener
            .fadeOut(500)
            .fadeIn(1000)
            .setLoop(true);
    },
    onpointingstart: function() {
        this.app.replaceScene(GameScene());
    },
});

tm.define("ResultScene", {
    superClass: "tm.app.Scene",

    init: function(param) {
        this.superInit();

        this.fromJSON({
            children: [
                {
                    type: "Label", name: "timeLabel",
                    x: SCREEN_CENTER_X,
                    y: 320,
                    fillStyle: "#888",
                    fontSize: 128,
                    fontFamily: FONT_FAMILY_FLAT,
                    text: "99.999",
                    align: "center",
                },
                {
                    type: "FlatButton", name: "tweetButton",
                    init: [
                        {
                            text: "TWEET",
                            bgColor: "hsl(240, 80%, 70%)",
                        }
                    ],
                    x: SCREEN_CENTER_X-160,
                    y: 650,
                },
                {   
                    type: "FlatButton", name: "backButton",
                    init: [
                        {
                            text: "BACK",
                            bgColor: "hsl(240, 0%, 70%)",
                        }
                    ],
                    x: SCREEN_CENTER_X+160,
                    y: 650,
                },
            ]
        });

        this.timeLabel.text = param.time;
        
        var self = this;
        // tweet ボタン
        this.tweetButton.onclick = function() {
            var twitterURL = tm.social.Twitter.createURL({
                type    : "tweet",
                text    : "tmlib.js チュートリアルゲームです. Time: {time}".format(param),
                hashtags: "tmlib,javascript,game",
                url     : "http://tmlife.net/?p=9781", // or window.document.location.href
            });
            window.open(twitterURL);
        };
        // back ボタン
        this.backButton.onpointingstart = function() {
            self.app.replaceScene(TitleScene());
        };
    },
});





