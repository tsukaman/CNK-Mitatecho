import { callOpenAIWithProxy } from './openai-proxy.js';
import { CHARACTER_DATA } from './character-data.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 短歌のゆるいバリデーション
 * - 5行構成であること
 * - 各行がそれっぽい文字数であること（漢字混じりなので厳密な音数は不問）
 * - 説明文や余計なテキストが混じっていないこと
 */
export function validatePoem(poem) {
  const lines = poem.split('\n').filter(l => l.trim().length > 0);

  // 5行構成チェック
  if (lines.length < 4 || lines.length > 6) {
    return { valid: false, reason: `行数が${lines.length}行（期待: 5行）` };
  }

  // 各行の文字数チェック（漢字は1文字で2-3音になりうるので幅を持たせる）
  // 五(3-8文字) 七(4-10文字) 五(3-8文字) 七(4-10文字) 七(4-10文字)
  const expectedRange = [
    [2, 10], [3, 12], [2, 10], [3, 12], [3, 12],
  ];
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const len = lines[i].trim().length;
    const [min, max] = expectedRange[i] || [2, 12];
    if (len < min || len > max) {
      return { valid: false, reason: `${i + 1}行目が${len}文字（期待: ${min}-${max}文字）` };
    }
  }

  // 明らかに散文的な内容を弾く（句読点が多い、括弧書きの説明など）
  if (poem.includes('。') && (poem.match(/。/g) || []).length > 1) {
    return { valid: false, reason: '散文的な内容（句点が多い）' };
  }

  return { valid: true };
}

/**
 * Generate a tanka (短歌) based on diagnosis result and user input.
 * Retries up to MAX_RETRIES times on failure. Updates D1 with the generated poem.
 */
export async function generatePoem({ env, id, character_id, free_text, q1_choice_text, q2_choice_text, q2_choice_type, sct_template }) {
  const character = CHARACTER_DATA[character_id];
  if (!character) return;

  const apiKey = env.OPENAI_API_KEY || null;

  // Build context section from diagnosis answers
  const contextLines = [];
  if (q1_choice_text) contextLines.push(`第一問の選択: 「${q1_choice_text}」`);
  if (q2_choice_text) contextLines.push(`第二問の選択: 「${q2_choice_text}」（${q2_choice_type || ''}）`);
  if (sct_template) contextLines.push(`問いかけ: ${sct_template}`);
  const answerContext = contextLines.length > 0
    ? `\n【診断での回答】\n${contextLines.join('\n')}\n`
    : '';

  const prompt = `あなたは「風雲戦国見立帖 〜千人一首〜」の専属歌人です。
テックカンファレンスで戦国武将に見立てられたエンジニアに、その人だけの短歌を一首贈ります。

【見立ての人物】${character.name}（${character.title}）
「${character.quote}」
${character.trait}
【史実の逸話】${character.lore}
${answerContext}
【参加者の自由回答】
「${free_text}」

＜作歌の掟＞
1. 五七五七七（5-7-5-7-7）の31音。多少の字余り（+1音程度）は許容
2. 参加者の自由回答のキーワードや気持ちを歌の中に必ず織り込む
3. 史実の逸話（固有名詞・エピソード）を歌に織り込み、その人物ならではの一首にする
4. 戦国の情景・言葉とテック用語を「見立て」で重ねる（例: デプロイ→出陣、バグ→敵、コード→刀）
5. 読んで「クスッ」と笑え、同時にエンジニアとしての共感が湧く一首に
6. 前置き・解説は一切不要。短歌のみを5行で出力

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

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await callOpenAIWithProxy({
        apiKey,
        body: {
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: '戦国×テックの短歌を詠む歌人。五七五七七の短歌のみを5行で出力。前置き・説明・注釈は一切付けない。',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 150,
          temperature: 0.85,
        },
        env,
      });

      if (!response.ok) {
        lastError = new Error(`LLM API error: ${response.status}`);
        console.error(`Poem generation attempt ${attempt}/${MAX_RETRIES} failed:`, response.status);
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        break;
      }

      const data = await response.json();
      const poem = data.choices?.[0]?.message?.content?.trim();

      if (!poem) {
        lastError = new Error('Empty poem response');
        console.error(`Poem generation attempt ${attempt}/${MAX_RETRIES}: empty response`);
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        break;
      }

      // 短歌バリデーション
      const validation = validatePoem(poem);
      if (!validation.valid) {
        lastError = new Error(`Invalid poem: ${validation.reason}`);
        console.warn(`Poem generation attempt ${attempt}/${MAX_RETRIES}: ${validation.reason}`);
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        break; // 最終試行でバリデーション失敗なら保存しない（散文・注釈混入を防ぐ）
      }

      // Save to D1
      await env.DB.prepare(
        `UPDATE answers SET poem = ?, poem_status = 'completed' WHERE id = ?`
      ).bind(poem, id).run();
      return;

    } catch (err) {
      lastError = err;
      console.error(`Poem generation attempt ${attempt}/${MAX_RETRIES} error:`, err);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  // 全試行失敗 — DB の poem_status を failed に更新して UI 側で失敗表示を可能にする
  console.error(`Poem generation failed after ${MAX_RETRIES} attempts:`, lastError);
  try {
    await env.DB.prepare(
      `UPDATE answers SET poem_status = 'failed' WHERE id = ?`
    ).bind(id).run();
  } catch (dbErr) {
    console.error('Failed to mark poem_status=failed:', dbErr);
  }
}
