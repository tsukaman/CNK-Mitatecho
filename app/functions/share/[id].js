/**
 * /share/[id] — SNSシェア用リンクのランディング
 *
 * - Twitter/Facebook等のクローラ: og:image に人物OGP画像を指す HTML を読む
 * - 人間のブラウザ: meta refresh で即座に /result?id=xxx に遷移
 *
 * Pages Functions はデフォルトで静的優先のため、/share/[id] をファイルで定義することで
 * 動的 HTML を返せる。
 */

const BASE_URL = 'https://cnk-mitatecho.pages.dev';

const CHARACTER_SLUG = {
  1: '01-oda-nobunaga',
  2: '02-toyotomi-hideyoshi',
  3: '03-tokugawa-ieyasu',
  4: '04-shibata-katsuie',
  5: '05-niwa-nagahide',
  6: '06-maeda-toshiie',
  7: '07-sassa-narimasa',
  8: '08-mori-ranmaru',
  9: '09-hachisuka-masakatsu',
  10: '10-kato-kiyomasa',
  11: '11-fukushima-masanori',
  12: '12-yamauchi-kazutoyo',
  13: '13-honda-tadakatsu',
  14: '14-sakai-tadatsugu',
  15: '15-sakakibara-yasumasa',
  16: '16-ii-naomasa',
  17: '17-hattori-hanzo',
  18: '18-nohime',
  19: '19-oichi',
  20: '20-yodo-dono',
  21: '21-go',
  22: '22-chiyo',
  23: '23-matsu',
  24: '24-odai',
  25: '25-takenaka-hanbei',
  26: '26-akechi-mitsuhide',
  27: '27-ishida-mitsunari',
  28: '28-sen-no-rikyu',
  29: '29-matsuo-basho',
  30: '30-imagawa-yoshimoto',
  31: '31-saito-dosan',
  32: '32-kuroda-nagamasa',
};

const CHARACTER_NAME = {
  1: '織田信長', 2: '豊臣秀吉', 3: '徳川家康', 4: '柴田勝家', 5: '丹羽長秀',
  6: '前田利家', 7: '佐々成政', 8: '森蘭丸', 9: '蜂須賀正勝', 10: '加藤清正',
  11: '福島正則', 12: '山内一豊', 13: '本多忠勝', 14: '酒井忠次', 15: '榊原康政',
  16: '井伊直政', 17: '服部半蔵', 18: '濃姫', 19: 'お市の方', 20: '淀殿',
  21: '江', 22: '千代', 23: 'まつ', 24: '於大の方', 25: '竹中半兵衛',
  26: '明智光秀', 27: '石田三成', 28: '千利休', 29: '松尾芭蕉', 30: '今川義元',
  31: '斎藤道三', 32: '黒田長政',
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml({ id, characterId, characterName, ogImage }) {
  const resultUrl = `${BASE_URL}/result?id=${encodeURIComponent(id)}`;
  const title = characterName
    ? `我は【${escapeHtml(characterName)}】なり ── 風雲戦国見立帖`
    : '風雲戦国見立帖 〜千人一首〜';
  const description = '戦国武将に見立てたエンジニアタイプ診断 + AIがあなたに詠む短歌一首。クラウドネイティブ会議2026。';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${escapeHtml(description)}" />

<meta property="og:type" content="article" />
<meta property="og:site_name" content="風雲戦国見立帖 〜千人一首〜" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(resultUrl)}" />
<meta property="og:image" content="${escapeHtml(ogImage)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(ogImage)}" />

<link rel="canonical" href="${escapeHtml(resultUrl)}" />
<meta http-equiv="refresh" content="0; url=${escapeHtml(resultUrl)}" />
</head>
<body>
<p>見立帖を開いています... <a href="${escapeHtml(resultUrl)}">自動で遷移しない場合はこちら</a></p>
<script>location.replace(${JSON.stringify(resultUrl)});</script>
</body>
</html>`;
}

export async function onRequestGet(context) {
  const { params, env } = context;
  const id = params.id;

  const defaultOg = `${BASE_URL}/cnk-icon.png`;

  let characterId = null;
  try {
    const row = await env.DB.prepare(
      `SELECT character_id FROM answers WHERE id = ? AND is_hidden = 0`,
    ).bind(id).first();
    if (row) characterId = row.character_id;
  } catch (err) {
    console.error('share lookup error:', err);
  }

  const slug = characterId && CHARACTER_SLUG[characterId];
  const characterName = characterId && CHARACTER_NAME[characterId];
  const ogImage = slug
    ? `${BASE_URL}/ogp/characters/${slug}.png`
    : defaultOg;

  const html = buildHtml({ id, characterId, characterName, ogImage });

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
