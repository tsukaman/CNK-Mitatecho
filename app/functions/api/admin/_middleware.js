import { handleOptions } from '../../utils/cors.js';
import { errorResponse } from '../../utils/response.js';
import { verifyCFAccessJWT } from '../../utils/cf-access.js';

function extractCookieJWT(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/CF_Authorization=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * CSRF 対策: state-changing リクエスト (POST/PATCH/DELETE/PUT) で
 * Origin / Referer が期待値と一致するかを検証する。
 * Cookie 認証経路で外部サイトから状態変更を踏ませる攻撃を防ぐ。
 * Bearer 認証 (CLI) は Cookie を伴わないため対象外。
 */
function checkSameOrigin(request, env) {
  const method = request.method;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;

  const expected = (env.ADMIN_ORIGIN || 'https://cnk-mitatecho.pages.dev').replace(/\/$/, '');
  const origin = request.headers.get('Origin');
  if (origin) return origin === expected;

  // Origin 不在時は Referer で代替
  const referer = request.headers.get('Referer') || '';
  return referer.startsWith(expected + '/') || referer === expected;
}

/**
 * Admin API middleware: centralized authentication for all /api/admin/* endpoints.
 * Supports three auth methods (checked in order):
 *   1. Cf-Access-Jwt-Assertion header (set by CF Access proxy after authentication)
 *   2. CF_Authorization cookie JWT verification (fallback)
 *   3. Bearer API key (ADMIN_API_KEY, for CLI)
 */
export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleOptions();
  }

  // Method 1: Cf-Access-Jwt-Assertion header
  // ヘッダの存在だけでは信頼しない。クライアントから偽造可能なため、
  // 必ず CF_ACCESS_TEAM / CF_ACCESS_AUD で署名検証を行う。
  // 検証失敗・env 未設定時は後続の認証方式（cookie / bearer）にフォールスルー。
  const cfAccessHeader = request.headers.get('Cf-Access-Jwt-Assertion');
  if (cfAccessHeader && env.CF_ACCESS_TEAM && env.CF_ACCESS_AUD) {
    const payload = await verifyCFAccessJWT(cfAccessHeader, env.CF_ACCESS_TEAM, env.CF_ACCESS_AUD);
    if (payload) {
      if (!checkSameOrigin(request, env)) {
        return errorResponse('Forbidden: origin check failed', 403);
      }
      context.data = context.data || {};
      context.data.authMethod = 'cf-access';
      context.data.authEmail = payload.email || 'unknown';
      return context.next();
    }
  }

  // Method 2: CF_Authorization cookie
  // Method 1 のヘッダ検証とは独立させる。無効ヘッダ付きで正規 cookie を持つ
  // ケースでも cookie 側で認可できるよう、ここでは cookie のみを参照する。
  if (env.CF_ACCESS_TEAM && env.CF_ACCESS_AUD) {
    const cookieJwt = extractCookieJWT(request);
    if (cookieJwt) {
      const payload = await verifyCFAccessJWT(cookieJwt, env.CF_ACCESS_TEAM, env.CF_ACCESS_AUD);
      if (payload) {
        if (!checkSameOrigin(request, env)) {
          return errorResponse('Forbidden: origin check failed', 403);
        }
        context.data = context.data || {};
        context.data.authMethod = 'cf-access-cookie';
        context.data.authEmail = payload.email || 'unknown';
        return context.next();
      }
    }
  }

  // Method 3: Bearer API key
  // CLI からの呼び出しを想定。Bearer はブラウザから自動送出されないため
  // CSRF リスクがなく、Origin チェックの対象外とする。
  const authHeader = request.headers.get('Authorization');
  if (env.ADMIN_API_KEY && authHeader === `Bearer ${env.ADMIN_API_KEY}`) {
    context.data = context.data || {};
    context.data.authMethod = 'api-key';
    return context.next();
  }

  return errorResponse('Unauthorized', 401);
}
