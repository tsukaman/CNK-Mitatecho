/**
 * Cloudflare Access JWT verification utility.
 * Verifies tokens issued by Cloudflare Zero Trust.
 */

// Cache for public keys (in-memory, per Worker instance)
// teamName をキーにしてマルチテナント運用時の混線を防ぐ
const publicKeyCache = new Map();

/**
 * Fetch Cloudflare Access public keys.
 */
async function getPublicKeys(teamName) {
  const now = Date.now();
  const cached = publicKeyCache.get(teamName);
  if (cached && now < cached.expiry) {
    return cached.keys;
  }

  const certsUrl = `https://${teamName}.cloudflareaccess.com/cdn-cgi/access/certs`;
  const response = await fetch(certsUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch CF Access certs: ${response.status}`);
  }

  const { keys } = await response.json();
  publicKeyCache.set(teamName, { keys, expiry: now + 5 * 60 * 1000 }); // 5 min cache
  return keys;
}

/**
 * Import a JWK public key for RS256 verification.
 */
async function importPublicKey(jwk) {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

/**
 * Base64url decode to Uint8Array.
 */
function base64urlDecode(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/**
 * Verify a Cloudflare Access JWT.
 * Returns the decoded payload if valid, null otherwise.
 */
export async function verifyCFAccessJWT(token, teamName, expectedAud) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode header to find key ID
    const header = JSON.parse(new TextDecoder().decode(base64urlDecode(headerB64)));
    if (header.alg !== 'RS256') return null;

    // Decode payload
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    // Check audience
    if (expectedAud) {
      const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!aud.includes(expectedAud)) return null;
    }

    // Check issuer
    const expectedIssuer = `https://${teamName}.cloudflareaccess.com`;
    if (payload.iss !== expectedIssuer) return null;

    // Fetch and verify with public keys
    const keys = await getPublicKeys(teamName);
    const matchingKey = keys.find((k) => k.kid === header.kid);
    if (!matchingKey) return null;

    const publicKey = await importPublicKey(matchingKey);
    const signatureData = base64urlDecode(signatureB64);
    const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signatureData,
      signedData
    );

    return valid ? payload : null;
  } catch (err) {
    console.error('CF Access JWT verification error:', err);
    return null;
  }
}

/**
 * Extract CF Access JWT from request (cookie or header).
 */
export function extractCFAccessJWT(request) {
  // Try header first
  const headerJwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (headerJwt) return headerJwt;

  // Try cookie
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/CF_Authorization=([^;]+)/);
  return match ? match[1] : null;
}
