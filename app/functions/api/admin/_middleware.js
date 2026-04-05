import { handleOptions } from '../../utils/cors.js';
import { errorResponse } from '../../utils/response.js';
import { verifyCFAccessJWT, extractCFAccessJWT } from '../../utils/cf-access.js';

/**
 * Admin API middleware: centralized authentication for all /api/admin/* endpoints.
 * Supports two auth methods:
 *   1. Cloudflare Access JWT (when CF_ACCESS_TEAM and CF_ACCESS_AUD are configured)
 *   2. Bearer API key (ADMIN_API_KEY, for CLI and fallback)
 */
export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleOptions();
  }

  // Method 1: Cloudflare Access JWT
  if (env.CF_ACCESS_TEAM && env.CF_ACCESS_AUD) {
    const jwt = extractCFAccessJWT(request);
    if (jwt) {
      const payload = await verifyCFAccessJWT(jwt, env.CF_ACCESS_TEAM, env.CF_ACCESS_AUD);
      if (payload) {
        // Authenticated via CF Access — attach identity info
        context.data = context.data || {};
        context.data.authMethod = 'cf-access';
        context.data.authEmail = payload.email || 'unknown';
        return context.next();
      }
    }
  }

  // Method 2: Bearer API key
  const authHeader = request.headers.get('Authorization');
  if (env.ADMIN_API_KEY && authHeader === `Bearer ${env.ADMIN_API_KEY}`) {
    context.data = context.data || {};
    context.data.authMethod = 'api-key';
    return context.next();
  }

  return errorResponse('Unauthorized', 401);
}
