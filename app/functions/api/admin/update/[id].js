import { successResponse, errorResponse } from '../../../utils/response.js';
import { sanitizeText } from '../../../utils/sanitizer.js';

// 認証は _middleware.js で一元処理

export async function onRequestPatch(context) {
  const { env, params, request } = context;

  try {
    const { id } = params;
    if (!id || typeof id !== 'string') {
      return errorResponse('Invalid id', 400);
    }

    // レコード存在確認
    const existing = await env.DB.prepare(
      'SELECT id FROM answers WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return errorResponse('Record not found', 404);
    }

    const body = await request.json();
    const updates = [];
    const binds = [];

    // 編集可能フィールドのみ受け付ける
    if (body.free_text !== undefined) {
      const text = sanitizeText(String(body.free_text)).slice(0, 200);
      if (!text) {
        return errorResponse('free_text must not be empty', 400);
      }
      updates.push('free_text = ?');
      binds.push(text);
    }

    if (body.nickname !== undefined) {
      const nick = body.nickname ? sanitizeText(String(body.nickname)).slice(0, 30) : null;
      updates.push('nickname = ?');
      binds.push(nick);
    }

    if (body.nickname_public !== undefined) {
      const pub = body.nickname_public ? 1 : 0;
      updates.push('nickname_public = ?');
      binds.push(pub);
    }

    if (body.poem !== undefined) {
      const poem = body.poem ? sanitizeText(String(body.poem)).slice(0, 200) : null;
      updates.push('poem = ?');
      binds.push(poem);
    }

    if (updates.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    binds.push(id);
    await env.DB.prepare(
      `UPDATE answers SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...binds).run();

    // 更新後のレコードを返す
    const updated = await env.DB.prepare(
      `SELECT id, card_id, free_text, character_id, nickname, nickname_public, poem, is_hidden, created_at
       FROM answers WHERE id = ?`
    ).bind(id).first();

    return successResponse(updated);
  } catch (err) {
    console.error('Admin update error:', err);
    return errorResponse('Internal server error', 500);
  }
}
