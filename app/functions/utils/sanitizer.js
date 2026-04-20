/**
 * 入力値のクリーンアップ。
 * HTMLエスケープは行わない（XSS は React 描画側で自動エスケープされるため）。
 * 保存時にエスケープすると表示時の再エスケープと重なり `&lt;` のような文字列が
 * DB に残る副作用があるため、ここでは制御文字の除去と trim のみ行う。
 */
export function sanitizeText(dirty) {
  if (typeof dirty !== 'string') return '';
  // 制御文字（改行・タブ・復帰は残す）を除去
  return dirty.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}
