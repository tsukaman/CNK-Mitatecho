# 風雲戦国見立帖 〜千人一首〜

## プロジェクト概要

CloudNative Days / SRE Kaigi / Platform Engineering Kaigi 合同イベント（2026年5月14-15日 / 名古屋）向けの心理テスト型エンターテインメントWebアプリ。

プレーリーカード（NFC）を読み取り → 心理テスト → 戦国武将に見立てたエンジニアタイプ診断 + AI短歌生成。

## ディレクトリ構成

```
CNK-Mitatecho/
├── CLAUDE.md          # このファイル
├── PLANNING.md        # 企画書（全体仕様）
├── CHARACTERS.md      # 32人の武将キャラクター定義
├── MAPPING.md         # 96パターン→32武将のマッピング
├── SCENARIOS.md       # 6カード×Q1/Q2のシナリオ・選択肢
├── home-full.png      # ホーム画面デザイン参考
├── references/        # 参考資料
└── app/               # Next.js アプリケーション本体
    ├── src/            # ソースコード
    │   ├── app/        # Next.js App Router ページ
    │   ├── components/ # UIコンポーネント
    │   └── lib/        # データ・ユーティリティ
    ├── functions/      # Cloudflare Functions (API)
    ├── public/         # 静的アセット
    ├── schema.sql      # D1テーブル定義
    ├── wrangler.toml   # Cloudflare設定
    └── package.json
```

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router, static export) + TypeScript + Tailwind CSS 4
- **ホスティング**: Cloudflare Pages
- **API**: Cloudflare Functions (Workers)
- **データベース**: Cloudflare D1 (SQLite)
- **LLM**: OpenAI API (gpt-5-mini) / フォールバック: OpenRouter
- **パッケージマネージャ**: npm
- **ワーキングディレクトリ**: `app/` 配下で npm コマンドを実行

## 開発コマンド

```bash
# app/ ディレクトリで実行
npm run dev          # 開発サーバー (Turbopack)
npm run build        # 本番ビルド (static export → out/)
npm run type-check   # TypeScript型チェック

# Cloudflare
npx wrangler pages deploy out/   # デプロイ
npx wrangler d1 execute prairie-cnk-db --file=schema.sql  # DB初期化
```

## 体験フロー

```
カード選択(6枚) → Q1(4択) → Q2(4択・分岐) → 自由記述(SCT) → 結果表示 + 短歌 + ギャラリー → SNSシェア
```

- 96パターン (6カード × 4Q1 × 4Q2) → 32人の武将に割り当て
- 結果テキストは事前定義テンプレート + 自由回答はめ込み
- 短歌(五七五七七)はLLMがリアルタイム生成

## URL設計

- `/` — カード選択ランディング（フォールバック用）
- `/select/[card]` — Q1表示（プレーリーカードからもここに誘導）
- `/q2?t=<token>` — Q2以降（4文字英数字トークンで分岐管理）
- `/result?id=<id>` — 結果表示

## API エンドポイント

- `POST /api/submit` — 回答送信 → D1保存 + LLM短歌生成(非同期)
- `GET /api/result/[id]` — 結果取得
- `GET /api/gallery?card=[1-6]` — ギャラリー（最新2首+ランダム3首）

## コーディング規約

- 日本語コメントOK（ユーザー向けテキストは日本語）
- コンポーネントは `src/components/` に配置
- データ定義は `src/lib/` に配置
- API関数は `functions/api/` に配置（Cloudflare Functions形式）
- 和風デザイン：カスタムカラー (紅/藍/翠/金/紫/白) を使用

## 注意事項

- Cloudflare Workers は香港リージョン経由だとOpenAI APIが403になる
  - Placement Hints (`region = "aws:us-east-1"`) で回避
  - フォールバック: OpenRouter経由
- 静的エクスポート (`output: 'export'`) のためサーバーサイドレンダリングは不可
- 参考プロジェクト: `/Users/tsukaman/dev/github/cnd2-app`（CND2のCloudflare Pages実装）
