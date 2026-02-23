import { handleOptions } from '../../../utils/cors.js';
import { successResponse, errorResponse } from '../../../utils/response.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;

  try {
    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!env.ADMIN_API_KEY || authHeader !== `Bearer ${env.ADMIN_API_KEY}`) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = params;
    if (!id || typeof id !== 'string') {
      return errorResponse('Invalid id', 400);
    }

    // レコード存在確認
    const existing = await env.DB.prepare(
      'SELECT id, free_text, nickname FROM answers WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return errorResponse('Record not found', 404);
    }

    // 削除実行
    await env.DB.prepare(
      'DELETE FROM answers WHERE id = ?'
    ).bind(id).run();

    return successResponse({ deleted: id });
  } catch (err) {
    console.error('Admin delete error:', err);
    return errorResponse('Internal server error', 500);
  }
}
