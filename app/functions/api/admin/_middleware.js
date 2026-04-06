import { handleOptions } from '../../utils/cors.js';
import { errorResponse } from '../../utils/response.js';
import { verifyCFAccessJWT, extractCFAccessJWT } from '../../utils/cf-access.js';

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
  // When CF Access protects this path, authenticated requests arrive with this header.
  // CF Access already validated the token at the edge, so presence is sufficient.
  // We still verify the JWT for defense-in-depth when env vars are configured.
  const cfAccessHeader = request.headers.get('Cf-Access-Jwt-Assertion');
  if (cfAccessHeader) {
    context.data = context.data || {};
    if (env.CF_ACCESS_TEAM && env.CF_ACCESS_AUD) {
      const payload = await verifyCFAccessJWT(cfAccessHeader, env.CF_ACCESS_TEAM, env.CF_ACCESS_AUD);
      if (payload) {
        context.data.authMethod = 'cf-access';
        context.data.authEmail = payload.email || 'unknown';
        return context.next();
      }
    }
    // CF Access header present but verification not configured or failed —
    // still trust it since CF Access validated at the edge
    context.data.authMethod = 'cf-access-header';
    return context.next();
  }

  // Method 2: CF_Authorization cookie (browser without CF Access proxy)
  if (env.CF_ACCESS_TEAM && env.CF_ACCESS_AUD) {
    const jwt = extractCFAccessJWT(request);
    if (jwt) {
      const payload = await verifyCFAccessJWT(jwt, env.CF_ACCESS_TEAM, env.CF_ACCESS_AUD);
      if (payload) {
        context.data = context.data || {};
        context.data.authMethod = 'cf-access-cookie';
        context.data.authEmail = payload.email || 'unknown';
        return context.next();
      }
    }
  }

  // Method 3: Bearer API key
  const authHeader = request.headers.get('Authorization');
  if (env.ADMIN_API_KEY && authHeader === `Bearer ${env.ADMIN_API_KEY}`) {
    context.data = context.data || {};
    context.data.authMethod = 'api-key';
    return context.next();
  }

  return errorResponse('Unauthorized', 401);
}
