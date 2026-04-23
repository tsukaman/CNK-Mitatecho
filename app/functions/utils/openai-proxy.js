/**
 * OpenAI API プロキシ設定
 * OpenAI直接呼び出しを最優先、失敗時にOpenRouter経由でフォールバック。
 */

const OPENROUTER_MODEL_MAPPING = {
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'gpt-4.1-mini': 'openai/gpt-4.1-mini',
  'gpt-5-mini': 'openai/gpt-5-mini',
};

// LLM 1 呼び出しあたりのタイムアウト。Cloudflare Workers の waitUntil は
// デフォルト 30s でタイムアウトするため、余裕を持って下回る値にする。
const LLM_TIMEOUT_MS = 20000;

function convertToOpenRouterModel(modelName) {
  if (modelName.includes('/')) return modelName;
  return OPENROUTER_MODEL_MAPPING[modelName] || `openai/${modelName}`;
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {Object} params
 * @param {string | null | undefined} params.apiKey - OpenAI API key. null/undefined
 *   の場合は OpenRouter のみを使う (呼び出し側は env.OPENAI_API_KEY || null を渡す)
 * @param {Object} params.body - Request body
 * @param {Object} params.env - Environment variables
 * @returns {Promise<Response>}
 */
export async function callOpenAIWithProxy({ apiKey, body, env }) {
  if (!body || !body.model) {
    throw new Error('Invalid request body: missing model');
  }

  // Method 1: Direct OpenAI API (preferred)
  // OpenRouter へのフォールバックは 403 (香港等からのリージョンブロック) と
  // ネットワーク系エラー (AbortError/TypeError) に限定する。400/401/429/500 等で
  // 自由回答文を別ベンダに流さないための情報境界制限。
  if (apiKey) {
    try {
      const response = await fetchWithTimeout(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
        LLM_TIMEOUT_MS,
      );

      if (response.ok) {
        return response;
      }

      if (response.status === 403) {
        console.warn('OpenAI 403 (region block), trying OpenRouter fallback');
        // fall through to OpenRouter
      } else {
        console.warn(`OpenAI direct failed with ${response.status}, returning as-is`);
        return response;
      }
    } catch (err) {
      // AbortError (タイムアウト) / TypeError (DNS・TLS 等のネットワーク系)
      // のみ OpenRouter に回す。それ以外の例外 (実装バグ等) は再 throw して
      // 自由回答を別ベンダに流さない。
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const isNetwork = err instanceof TypeError;
      if (!isAbort && !isNetwork) {
        console.error('OpenAI direct unexpected error, not falling back:', err);
        throw err;
      }
      console.warn('OpenAI network/timeout error, trying OpenRouter fallback:', err.message);
    }
  }

  // Method 2: OpenRouter fallback (region bypass)
  if (env?.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.startsWith('sk-or-v1-')) {
    const openRouterBody = {
      ...body,
      model: convertToOpenRouterModel(body.model),
    };

    return fetchWithTimeout(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://cnk-mitatecho.pages.dev',
          'X-Title': '風雲戦国見立帖 〜千人一首〜',
        },
        body: JSON.stringify(openRouterBody),
      },
      LLM_TIMEOUT_MS,
    );
  }

  throw new Error('No API key configured (OPENAI_API_KEY or OPENROUTER_API_KEY required)');
}
