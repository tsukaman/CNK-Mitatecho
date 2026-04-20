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

function convertToOpenRouterModel(modelName) {
  if (modelName.includes('/')) return modelName;
  return OPENROUTER_MODEL_MAPPING[modelName] || `openai/${modelName}`;
}

/**
 * @param {Object} params
 * @param {string} params.apiKey - OpenAI API key
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
  // ネットワークエラーに限定する。400/401/500 等で自由回答文を別ベンダに
  // 流さないための情報境界の制限。
  if (apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return response;
      }

      if (response.status === 403) {
        console.warn('OpenAI 403 (region block), trying OpenRouter fallback');
        // fall through to OpenRouter
      } else {
        // その他の HTTP エラーはそのまま返す（OpenRouter に転送しない）
        console.warn(`OpenAI direct failed with ${response.status}, returning as-is`);
        return response;
      }
    } catch (err) {
      console.warn('OpenAI network error, trying OpenRouter fallback:', err.message);
      // fall through to OpenRouter
    }
  }

  // Method 2: OpenRouter fallback (region bypass)
  if (env?.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.startsWith('sk-or-v1-')) {
    const openRouterBody = {
      ...body,
      model: convertToOpenRouterModel(body.model),
    };

    return fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://prairie-cnk.pages.dev',
        'X-Title': 'Cloud Native Oracle',
      },
      body: JSON.stringify(openRouterBody),
    });
  }

  throw new Error('No API key configured (OPENAI_API_KEY or OPENROUTER_API_KEY required)');
}
