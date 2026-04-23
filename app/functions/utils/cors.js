// 公開系 API (submit/result/gallery/poems) 用: 任意オリジンからの閲覧を許容
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export function handleOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/**
 * 管理系 API (/api/admin/*) 用 CORS ヘッダ。
 * - Origin を ADMIN_ORIGIN で固定し `*` を返さない
 * - Allow-Credentials: true を付与して CF Access cookie を受け取れるようにする
 * - Authorization ヘッダを明示的に許可（Bearer CLI用）
 */
export function adminCorsHeaders(env) {
  const origin = (env?.ADMIN_ORIGIN || 'https://cnk-mitatecho.pages.dev').replace(/\/$/, '');
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export function handleAdminOptions(env) {
  return new Response(null, { status: 204, headers: adminCorsHeaders(env) });
}
