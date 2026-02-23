# 風雲戦国見立帖 〜千人一首〜

> ⚔ 汝の心に宿る戦国の魂、見定めん

クラウドネイティブ会議（CloudNative Days / SRE Kaigi / Platform Engineering Kaigi 合同イベント、2026年5月14-15日 / 名古屋）向けの心理テスト型エンターテインメントWebアプリ。

プレーリーカード（NFC）をかざして心理テストに回答すると、あなたにぴったりの戦国武将エンジニアタイプが診断され、AIがあなただけの短歌を詠みます。

## 体験フロー

```
カード選択（6枚）→ 第一問（4択）→ 第二問（4択・分岐）→ 自由記述 → 結果発表 + AI短歌 + ギャラリー → SNSシェア
```

- 96パターン（6カード × 4Q1 × 4Q2）→ 32人の戦国武将に見立て
- 心理学の投影法（P-Fスタディ・TAT・SCT）をベースにした設問設計
- 短歌（五七五七七）はLLMがリアルタイム生成

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 15 (App Router, static export) + TypeScript + Tailwind CSS 4 |
| ホスティング | Cloudflare Pages |
| API | Cloudflare Functions (Workers) |
| データベース | Cloudflare D1 (SQLite) |
| AI短歌生成 | OpenAI API (gpt-4o-mini) / フォールバック: OpenRouter |

## 開発

```bash
cd app/
npm install
npm run dev          # 開発サーバー (localhost:3000)
npm run build        # 本番ビルド (static export → out/)
npm run type-check   # TypeScript型チェック
```

ローカルでAPIをテストする場合：

```bash
cd app/
npx wrangler pages dev out/   # Wrangler開発サーバー (localhost:8788)
```

環境変数は `app/.dev.vars` に設定：

```
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-v1-...
ADMIN_API_KEY=...
```

## デプロイ

```bash
cd app/
npm run build
npx wrangler pages deploy out/ --project-name=cnk-mitatecho
```

## ライセンス

本プロジェクトはクラウドネイティブ会議の企画として開発されています。
