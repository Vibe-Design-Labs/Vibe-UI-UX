# IntentKit / 意译

[中文](README.md) · [English](README.en.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md)

**「こんな感じにしたい」を、見て調整でき、コーディング支援 AI に渡せるデザイン仕様へ。**

[ホームページ](https://vibe-design-labs.github.io/Vibe-UI-UX/) · [スタジオを試す](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html) · [変更履歴](CHANGELOG.md)

**v0.4.1.2.1 · 75 デザイン用語 · 75 専用プレビューテンプレート · 5 ローカルレシピ系統 · MIT + OFL**

[![実際のスタジオ録画：葉のカーソル、暖色の光、クリック波紋、時間差表示](docs/media/effects.gif)](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html?item=custom-cursor)

既存レンダラーを実際に動かして録画しました。AI 生成画像ではありません。GIF は録画です。[オンラインスタジオ](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html)では操作と調整ができ、システムの動きを減らす設定も尊重します。

## IntentKit について

Vibe coding では、感覚を正確に伝えることが難しい場合があります。「軽やかに」は、ホバーで少し浮く動きなのか、縮小なのか、余白なのか。IntentKit は日常の表現を UI/UX 用語、別名、例、具体的なパラメーターにつなぎ、デザイナー、開発者、初心者の認識をそろえます。

Design Compiler の流れは **日常の表現 → 編集できる理解（Design IR）→ 検証済みレシピ → 実際のプレビュー → デザイン説明 / Agent 向け説明 / JSON** です。デザイン案を確認する道具であり、ページ全体の生成やモデルが出力した任意コードの実行はしません。

| 機能 | 現在できること |
| --- | --- |
| 用語集 | 75 件の用語、別名、定義、使いどころ、出典を検索 |
| 効果スタジオ | 75 種の対応テンプレート、パラメーター調整、説明、JSON、単一効果の共有リンク |
| Design Compiler | 軽い浮き上がり、暖色の光と浮き上がり、押下、時間差表示、波紋の 5 系統 |
| カーソル | 8 種の形、色、大きさ、追従、クリック反応と独立したスポットライト設定 |
| 言語 | 中国語・英語・日本語・韓国語・ドイツ語の画面。README は上のリンクで切り替え |
| 任意の AI 接続 | 自分の TokenDance 接続で意図を解析し、既存効果の候補を提案 |

## 最初はキーなしで試す

1. [スタジオ](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html)を開き、右上で日本語を選びます。
2. ローカル例の「カードを軽く浮かせる」を選びます。入力して「理解して生成」を押すこともできます。キー未設定ならローカルルールを使います。
3. 理解した内容を確認し、編集項目を開いて対象、トリガー、強さを修正します。既定値と推測は、入力した意図とは別に表示されます。
4. カードにカーソルを重ね、右側でパラメーターを調整します。プレビュー、説明、レシピは同じ最終値を使います。意図との矛盾が出た場合、内容を確認して現在の値を採用するか決めます。
5. コンパイル結果の **Agent 向け説明**をコーディング支援 AI に渡すか、**コンパイル JSON**を出力します。右側の従来の JSON 出力は別用途の**単一効果 JSON**です。

用語を調べるだけなら、左の検索欄で `frosted glass` や `backdrop-filter` を検索できます。**公開する各用語に対応したプレビューがあります。** スタイルは独自の材質と配置、動きは実際のアニメーション、ダッシュボードは明示したサンプルデータ、UX 原則は操作と状態を示します。汎用の代替カードは使いません。[専用プレビューの規約](docs/PREVIEW_SCENES.md)（中国語）。

![Design Compiler：理解、プレビュー、パラメーター、Agent 向け説明](docs/media/studio.png)

## AI が必要なときだけ TokenDance に接続

1. TokenDance 接続ボタンを押します。公開モデル一覧の読み込みだけではモデルを呼び出しません。
2. 認証ポップアップで新しいキーを作成するか、[TokenDance キー管理](https://tokendance.space/keys)の既存キーを入力します。認証は本人の確認後にキーを作成します。
3. 対話プロトコル対応モデルを選び、「このページのみで保存」を押します。一覧取得に失敗したら公式モデル ID を手入力できます。
4. キー設定後に「効果を探す」か「理解して生成」を押した場合のみモデルを呼び出します。TokenDance が利用料金を請求します。5 個のローカル例は接続後もモデルを使いません。
5. キー消去で接続を解除します。**キーはページのメモリーのみで、再読み込みで消えます。** アカウント機能はなく、localStorage、sessionStorage、リポジトリー、GitHub Secrets にキーを保存しません。表示言語の設定は保存できます。

GitHub Pages ではブラウザーから直接 TokenDance に接続し、ローカルサーバー版は現在のインスタンスを経由します。信頼できる環境だけでキーを入力してください。解析失敗時はローカルへ戻り、有料リクエストを自動再試行しません。実キーを使う有料の一連の動作確認は未完了です。[接続と検証範囲](docs/TOKENDANCE.md)（中国語）。

## Fork をローカルで実行

**Node.js 20 以上**が必要です。内容検証とソースの ZIP 作成には **Python 3** も使います。npm 依存関係がないため npm install は不要です。起動にキーは必要ありません。

```sh
git clone https://github.com/Vibe-Design-Labs/Vibe-UI-UX.git
cd Vibe-UI-UX
npm run dev
```

[http://localhost:4173/studio.html](http://localhost:4173/studio.html)を開きます。Fork した場合は clone の URL を自分のリポジトリーに変更します。コード編集後はサーバーを停止し、起動し直して再構築します。

静的版の検証と実行：

```sh
npm test
npm run check:content
npm run check:docs
python scripts/package-source.py
npm run build:pages
npm run preview:pages
```

静的プレビュー：[http://localhost:4174/Vibe-UI-UX/](http://localhost:4174/Vibe-UI-UX/)。公開用出力は `dist/pages/` です。python がない環境では python3 を使います。これらの処理はモデルを呼び出しません。

## 自分の GitHub Pages に公開

1. Fork し、自分のリポジトリーで Actions を有効にします。
2. **Settings → Pages → Source → GitHub Actions** を選びます。
3. **Actions → Deploy GitHub Pages → Run workflow** で初回公開を開始します。
4. 成功後に Pages 設定かデプロイ出力の実際の URL を開きます。その後は main への push で自動更新します。

相対パスなので Fork やリポジトリー配下の URL に対応します。**モデルキーや GitHub Secret は不要**で、利用者が自分の TokenDance を接続します。[公開手順](docs/GITHUB_PAGES.md)（中国語）。

## 用語・レシピ・効果を追加

[保守 skill](skills/ui-ux-content-maintainer/SKILL.md)をファイル操作ができる好きな AI に渡すか、手作業で編集します。既存テンプレートなら `content/items/` に JSON を追加します。新規レンダラーには登録表とレンダラーの変更も必要です。[レシピ保守](skills/ui-ux-content-maintainer/references/compiler-recipes.md)も参照できます。

`npm run check:content`、`npm test`、`npm run check:docs` を実行し、必要なら[フォントサブセット](docs/FONTS.md)、ZIP、Pages を再構築します。スクリプトは GPT キーやモデル利用枠を必要としません。他の AI 自体の料金は別です。[保守手順](docs/CONTENT_MAINTENANCE.md)（中国語）。

| 場所 | 役割 |
| --- | --- |
| `content/items/` | 用語、別名、翻訳、出典、レビュー状態 |
| `previews/registry.json` + `public/previews.js` | パラメーター規約とレンダラー |
| `compiler/` + `public/compiler-*.js` | IR、五言語の表現、レシピ、検証、画面 |
| `public/` | 静的ページ、スタジオ、文言、TokenDance 接続 |
| `server/worker.js` | 任意のローカル中継。Pages では不要 |
| `.github/workflows/pages.yml` | 検証、ZIP、ビルド、公開 |

## 現在の制約

- 用語本文は主に中国語と英語の草稿です。日本語・韓国語・ドイツ語の本文は英語に明示的にフォールバックします。画面の五言語対応と本文のレビュー完了は別です。
- ローカル解析は 5 系統のレシピのみ。曖昧な入力や未対応の要望を明示します。テンプレートの組み合わせ、ばね、文中の正確な数値の自動適用は未対応です。
- 構造検証は事実や翻訳の認定ではありません。草稿が残るため厳格な公開レビューはまだ通りません。取得できなかった微信記事の本文を読んだとは記録しません。
- プレビューは概念例で、実データを保存しません。実装前に出力を確認してください。動きを減らす設定、タッチ、キーボードに対応します。

[コンパイラー詳細](docs/DESIGN_COMPILER.md) · [新規 50 件と出典](docs/CONTENT_EXPANSION_2026-10-07.md) · [公開チェック](docs/RELEASE_0.4.1.2.0.md) · [五段の版番号](docs/VERSIONING.md)（詳細文書は中国語）。

## ライセンスと謝辞

コードは [MIT](LICENSE)。Ma Shan Zheng、LXGW WenKai、Caveat のフォントは **SIL OFL 1.1**。通知と再構築手順は[フォント文書](docs/FONTS.md)にあります。README の画像は実際の本プロジェクトの画面です。

初期の操作方針は Hyperknow、紙・墨・朱色・手書きの雰囲気はユーザーの参考画像を参考にしました。配置とコードは独自で、参考サイトの画像、商標、コンポーネントソースは再利用していません。出典、翻訳、再現できる効果、不具合の提案は [Issues](https://github.com/Vibe-Design-Labs/Vibe-UI-UX/issues)へ。
