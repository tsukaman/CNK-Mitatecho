#!/usr/bin/env node
/**
 * 短歌生成プロンプトのハンドテスト用サンプラー。
 * 32武将 × 3サンプル自由回答 = 96首を OpenAI API で生成し、
 * Markdown でレビュー用に出力する。
 *
 * 使い方:
 *   cd app
 *   node scripts/poem-sampler.mjs           # 全32武将を生成
 *   node scripts/poem-sampler.mjs 1,5,13    # 指定IDのみ（カンマ区切り）
 *
 * 出力: /tmp/poem-samples.md
 *
 * 環境変数: OPENAI_API_KEY (app/.dev.vars から自動読込)
 * モデル: gpt-4.1-mini (本番と同じ)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTER_DATA } from '../functions/utils/character-data.js';
import { SCENARIOS_SERVER, getPromptContext } from '../functions/utils/scenarios-server.js';
import { validatePoem } from '../functions/utils/poem-generator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, '..');

// .dev.vars 読み込み
function loadDevVars() {
  try {
    const content = readFileSync(resolve(APP_DIR, '.dev.vars'), 'utf-8');
    const lines = content.split('\n');
    const vars = {};
    for (const line of lines) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return vars;
  } catch {
    return {};
  }
}

const env = { ...loadDevVars(), ...process.env };
const apiKey = env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY not found in .dev.vars or environment');
  process.exit(1);
}

// 各武将 → 1つの代表的な (card, q1, q2) 文脈を逆引き
// mapping.js は getCharacterId 関数のみなので、全96パターン総当たりで各武将の初出を取る
const { getCharacterId } = await import('../functions/utils/mapping.js');
const characterToContext = {};
for (let card = 1; card <= 6; card++) {
  for (let q1 = 1; q1 <= 4; q1++) {
    for (let q2 = 1; q2 <= 4; q2++) {
      const cid = getCharacterId(card, q1, q2);
      if (cid && !characterToContext[cid]) {
        characterToContext[cid] = { card, q1, q2 };
      }
    }
  }
}

// サンプル自由回答（多様な入力でプロンプトの柔軟性を見る）
const FREE_TEXT_SAMPLES = [
  { label: '技術寄り', text: '本番障害で4時間ぶっ通しのデバッグ。やっと復旧した' },
  { label: '一語', text: 'ラーメン' },
  { label: '情緒', text: '今日も生きた' },
];

// poem-generator.js と同じプロンプト構築
function buildPrompt(character, freeText, ctx) {
  const contextLines = [];
  if (ctx.q1_choice_text) contextLines.push(`第一問の選択: 「${ctx.q1_choice_text}」`);
  if (ctx.q2_choice_text) contextLines.push(`第二問の選択: 「${ctx.q2_choice_text}」（${ctx.q2_choice_type || ''}）`);
  if (ctx.sct_template) contextLines.push(`問いかけ: ${ctx.sct_template}`);
  const answerContext = contextLines.length > 0
    ? `\n【診断での回答】\n${contextLines.join('\n')}\n`
    : '';

  return `あなたは「風雲戦国見立帖 〜千人一首〜」の専属歌人です。
テックカンファレンスで戦国武将に見立てられたエンジニアに、その人だけの短歌を一首贈ります。

【見立ての人物】${character.name}（${character.title}）
「${character.quote}」
${character.trait}
【史実の逸話】${character.lore}
${answerContext}
【参加者の自由回答】
「${freeText}」

＜作歌の掟＞
1. 五七五七七（5-7-5-7-7）の31音。多少の字余り（+1音程度）は許容
2. 参加者の自由回答のキーワードや気持ちを歌の中に必ず織り込む
3. 史実の逸話（固有名詞・エピソード）を歌に織り込み、その人物ならではの一首にする
4. 戦国の情景・言葉とテック用語を「見立て」で重ねる（例: デプロイ→出陣、バグ→敵、コード→刀）
5. 読んで「クスッ」と笑え、同時にエンジニアとしての共感が湧く一首に
6. 前置き・解説は一切不要。短歌のみを5行で出力
7. 出力は必ず一首（5行）のみ。複数の短歌を並べて出力してはならない

＜作例＞
例1: 織田信長 × 自由回答「ラーメン」（逸話: 楽市楽座・本能寺）
楽市の
ラーメン屋台に
火を放ち
是非に及ばず
替え玉を待つ

例2: 本多忠勝 × 自由回答「寝たい」（逸話: 蜻蛉切・57戦無傷）
蜻蛉切
触れなばバグも
真っ二つ
五十七戦
無傷で眠る

例3: 千利休 × 自由回答「TypeScript」（逸話: わび・さび・黄金の茶室批判）
型ひとつ
黄金の茶室
壊すごと
anyを断ち
わびの型残る`;
}

async function callOpenAI(prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: '戦国×テックの短歌を詠む歌人。五七五七七の短歌を「一首のみ」5行で出力。複数の短歌を並べない。前置き・説明・注釈は一切付けない。' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 120,
      temperature: 0.85,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// 引数パース
const arg = process.argv[2];
const targetIds = arg ? arg.split(',').map((s) => parseInt(s, 10)).filter((n) => n >= 1 && n <= 32) : null;
const ids = targetIds && targetIds.length > 0 ? targetIds : Array.from({ length: 32 }, (_, i) => i + 1);

console.log(`Sampling ${ids.length * FREE_TEXT_SAMPLES.length} poems across ${ids.length} characters × ${FREE_TEXT_SAMPLES.length} samples...`);

const output = [
  `# 短歌サンプル生成結果\n`,
  `生成時刻: ${new Date().toISOString()}`,
  `モデル: gpt-4.1-mini / temperature: 0.85\n`,
  `---\n`,
];

for (const cid of ids) {
  const character = CHARACTER_DATA[cid];
  if (!character) continue;
  const ctxInfo = characterToContext[cid];
  const ctx = ctxInfo ? getPromptContext(ctxInfo.card, ctxInfo.q1, ctxInfo.q2) : getPromptContext(1, 1, 1);

  output.push(`## ${cid}. ${character.name}「${character.title}」`);
  output.push(`> ${character.quote}`);
  output.push(`逸話: ${character.lore}\n`);
  if (ctxInfo) {
    output.push(`文脈(${ctxInfo.card}-${ctxInfo.q1}-${ctxInfo.q2}): ${ctx.q1_choice_text} → ${ctx.q2_choice_text}（${ctx.q2_choice_type}）\n`);
  }

  for (const sample of FREE_TEXT_SAMPLES) {
    process.stdout.write(`  [${cid}] ${sample.label}... `);
    try {
      const prompt = buildPrompt(character, sample.text, ctx);
      const poem = await callOpenAI(prompt);
      const validation = validatePoem(poem);
      const badge = validation.valid ? '✅' : `⚠️(${validation.reason})`;
      console.log(badge);
      output.push(`### ${sample.label}: 「${sample.text}」 ${badge}`);
      output.push('```');
      output.push(poem);
      output.push('```\n');
    } catch (err) {
      console.log(`❌ ${err.message}`);
      output.push(`### ${sample.label}: 「${sample.text}」 ❌ ERROR`);
      output.push(`\`\`\`\n${err.message}\n\`\`\`\n`);
    }
  }

  output.push('---\n');
}

const outPath = '/tmp/poem-samples.md';
writeFileSync(outPath, output.join('\n'));
console.log(`\nWritten to ${outPath}`);
