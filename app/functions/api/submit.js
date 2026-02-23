import { handleOptions } from '../utils/cors.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { sanitizeText } from '../utils/sanitizer.js';
import { getCharacterId } from '../utils/mapping.js';
import { generatePoem } from '../utils/poem-generator.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { card, q1, q2, free_text, x_account, ogp_include, q1_choice_text, q2_choice_text, q2_choice_type, sct_template } = body;

    // Validation
    if (!Number.isInteger(card) || card < 1 || card > 6) {
      return errorResponse('card must be 1-6', 400);
    }
    if (!Number.isInteger(q1) || q1 < 1 || q1 > 4) {
      return errorResponse('q1 must be 1-4', 400);
    }
    if (!Number.isInteger(q2) || q2 < 1 || q2 > 4) {
      return errorResponse('q2 must be 1-4', 400);
    }
    if (typeof free_text !== 'string' || free_text.trim().length === 0) {
      return errorResponse('free_text is required', 400);
    }
    if (free_text.length > 200) {
      return errorResponse('free_text must be 200 chars or less', 400);
    }

    // Validate x_account if provided
    let sanitizedXAccount = null;
    if (x_account && typeof x_account === 'string' && x_account.trim().length > 0) {
      const trimmed = x_account.trim();
      if (trimmed.length > 50) {
        return errorResponse('x_account must be 50 chars or less', 400);
      }
      sanitizedXAccount = sanitizeText(trimmed);
    }

    const ogpFlag = ogp_include ? 1 : 0;

    // Determine character
    const character_id = getCharacterId(card, q1, q2);
    if (!character_id) {
      return errorResponse('Invalid card/q1/q2 combination', 400);
    }

    // Generate ID
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);

    // Sanitize free text
    const sanitized_text = sanitizeText(free_text);

    // Save to D1
    await env.DB.prepare(
      `INSERT INTO answers (id, card_id, q1, q2, free_text, character_id, x_account, ogp_include, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(id, card, q1, q2, sanitized_text, character_id, sanitizedXAccount, ogpFlag).run();

    // Generate poem asynchronously (non-blocking, update DB after)
    generatePoem({
      env, id, character_id, free_text: sanitized_text,
      q1_choice_text: typeof q1_choice_text === 'string' ? q1_choice_text.slice(0, 100) : '',
      q2_choice_text: typeof q2_choice_text === 'string' ? q2_choice_text.slice(0, 100) : '',
      q2_choice_type: typeof q2_choice_type === 'string' ? q2_choice_type.slice(0, 50) : '',
      sct_template: typeof sct_template === 'string' ? sct_template.slice(0, 200) : '',
    }).catch((err) => {
      console.error('Poem generation failed:', err);
    });

    return successResponse({ id, character_id });
  } catch (err) {
    console.error('Submit error:', err);
    return errorResponse('Internal server error', 500);
  }
}
