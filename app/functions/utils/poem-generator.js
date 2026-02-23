import { callOpenAIWithProxy } from './openai-proxy.js';
import { CHARACTER_DATA } from './character-data.js';

/**
 * Generate a tanka (短歌) based on diagnosis result and user input.
 * Updates D1 asynchronously. Failures are silent (poem stays null).
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
戦国人物×テックエンジニアの診断結果をもとに、参加者一人ひとりに贈る短歌（五七五七七）を詠みます。

【見立ての人物】${character.name}（${character.title}）
「${character.quote}」
${character.trait}
${answerContext}
【参加者の自由回答】
「${free_text}」

以上をもとに、この参加者だけの短歌を一首詠んでください。

＜歌の心得＞
- 五七五七七（5-7-5-7-7）の31音を厳守
- 人物の名言・逸話・エンジニアとしてのキャラクターを織り込む
- 参加者の自由回答の言葉やニュアンスを必ず歌に反映させる
- 戦国とテックの世界観を行き来する「見立て」の面白さを出す
- 笑えるけど、ふと考えさせられる味わいを目指す
- 短歌のみを出力（五七五七七を改行区切りで5行）`;

  try {
    const response = await callOpenAIWithProxy({
      apiKey,
      body: {
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: '短歌（五七五七七＝31音）を詠む歌人です。必ず5-7-5-7-7の音数を守り、短歌のみを5行で出力してください。',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 150,
        temperature: 0.85,
      },
      env,
    });

    if (!response.ok) {
      console.error('LLM API error:', response.status);
      return;
    }

    const data = await response.json();
    const poem = data.choices?.[0]?.message?.content?.trim();

    if (poem) {
      await env.DB.prepare(
        `UPDATE answers SET poem = ? WHERE id = ?`
      ).bind(poem, id).run();
    }
  } catch (err) {
    console.error('Poem generation error:', err);
  }
}
