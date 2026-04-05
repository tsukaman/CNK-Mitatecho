import { successResponse, errorResponse } from '../../../utils/response.js';

// 認証は _middleware.js で一元処理

export async function onRequestDelete(context) {
  const { env, params } = context;

  try {
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
