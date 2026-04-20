import { CHARACTER_DATA } from './utils/character-data.js';

const BOT_UA_PATTERN = /Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|Discordbot|TelegramBot|Googlebot|bingbot|Applebot/i;

const SITE_URL = 'https://cnk-mitatecho.pages.dev';
const SITE_TITLE = '風雲戦国見立帖 〜千人一首〜';
const SITE_DESC = '戦国武将 × エンジニアタイプ診断 + AIパーソナライズ短歌';

// TODO: OGP画像が準備できたら true に変更
const ENABLE_OGP_BOT_DETECTION = false;

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildOgpHtml({ title, description, image, url }) {
  return `<!DOCTYPE html>
<html lang="ja"><head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
</head><body></body></html>`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const ua = request.headers.get('user-agent') || '';

  if (ENABLE_OGP_BOT_DETECTION && url.pathname === '/result' && BOT_UA_PATTERN.test(ua)) {
    const id = url.searchParams.get('id');
    if (id && env.DB) {
      try {
        const row = await env.DB.prepare(
          'SELECT character_id FROM answers WHERE id = ? AND is_hidden = 0'
        ).bind(id).first();

        if (row) {
          const char = CHARACTER_DATA[row.character_id];
          if (char) {
            const title = `${char.name}「${char.title}」── ${SITE_TITLE}`;
            const html = buildOgpHtml({
              title,
              description: `あなたの見立ては「${char.name}」── ${char.title}。${SITE_DESC}`,
              image: `${SITE_URL}/ogp/char-${row.character_id}.png`,
              url: `${SITE_URL}/result?id=${id}`,
            });
            return new Response(html, {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
          }
        }
      } catch (e) {
        console.error('OGP generation error:', e);
      }
    }
  }

  const response = await context.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}
