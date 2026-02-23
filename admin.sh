#!/bin/bash
# 風雲戦国見立帖 管理CLIツール

set -euo pipefail

BASE_URL="${MITATECHO_URL:-https://cnk-mitatecho.pages.dev}"
API_KEY="${ADMIN_API_KEY:-}"

# .dev.vars から読み込み（未設定時）
if [ -z "$API_KEY" ] && [ -f "$(dirname "$0")/app/.dev.vars" ]; then
  API_KEY=$(grep '^ADMIN_API_KEY=' "$(dirname "$0")/app/.dev.vars" | cut -d= -f2-)
fi

if [ -z "$API_KEY" ]; then
  echo "エラー: ADMIN_API_KEY が設定されていません"
  echo "  export ADMIN_API_KEY=<key> または app/.dev.vars に記載してください"
  exit 1
fi

auth_header="Authorization: Bearer $API_KEY"

usage() {
  cat <<'USAGE'
風雲戦国見立帖 〜千人一首〜 管理ツール

使い方:
  ./admin.sh list [card]     投稿一覧（card: 1-6、省略で全件）
  ./admin.sh show <id>       投稿詳細
  ./admin.sh delete <id>     投稿削除
  ./admin.sh help            このヘルプ

環境変数:
  ADMIN_API_KEY   管理者APIキー（未設定時は app/.dev.vars から読み込み）
  MITATECHO_URL   APIベースURL（デフォルト: https://cnk-mitatecho.pages.dev）

例:
  ./admin.sh list            全投稿を一覧
  ./admin.sh list 1          カード1の投稿を一覧
  ./admin.sh delete abc123   ID abc123 の投稿を削除
USAGE
}

cmd_list() {
  local card="${1:-}"
  local url="$BASE_URL/api/admin/list"
  if [ -n "$card" ]; then
    url="$url?card=$card"
  fi

  local response
  response=$(curl -sf -H "$auth_header" "$url" 2>&1) || {
    echo "エラー: API呼び出しに失敗しました"
    return 1
  }

  local total
  total=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['total'])")

  if [ "$total" = "0" ]; then
    echo "投稿はありません"
    return 0
  fi

  echo "$response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
entries = data['data']['entries']
print(f'投稿数: {len(entries)}')
print('─' * 80)
for e in entries:
    nick = e.get('nickname') or '(匿名)'
    pub = '公開' if e.get('nickname_public') else '非公開'
    poem = (e.get('poem') or '(未生成)').replace('\n', ' / ')
    print(f\"ID: {e['id']}  カード: {e['card_id']}  武将: {e['character_id']}  {e['created_at']}\")
    print(f\"  名前: {nick} ({pub})  テキスト: {e['free_text']}\")
    print(f\"  短歌: {poem}\")
    print()
"
}

cmd_show() {
  local id="${1:-}"
  if [ -z "$id" ]; then
    echo "エラー: IDを指定してください"
    echo "使い方: ./admin.sh show <id>"
    return 1
  fi

  local response
  response=$(curl -sf -H "$auth_header" "$BASE_URL/api/result/$id" 2>&1) || {
    echo "エラー: 投稿が見つかりません (ID: $id)"
    return 1
  }

  echo "$response" | python3 -m json.tool
}

cmd_delete() {
  local id="${1:-}"
  if [ -z "$id" ]; then
    echo "エラー: IDを指定してください"
    echo "使い方: ./admin.sh delete <id>"
    return 1
  fi

  # 削除前に内容を表示
  echo "削除対象:"
  local list_response
  list_response=$(curl -sf -H "$auth_header" "$BASE_URL/api/admin/list" 2>&1)
  echo "$list_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
entry = next((e for e in data['data']['entries'] if e['id'] == '$id'), None)
if entry:
    nick = entry.get('nickname') or '(匿名)'
    print(f\"  ID: {entry['id']}\")
    print(f\"  名前: {nick}\")
    print(f\"  テキスト: {entry['free_text']}\")
else:
    print('  該当する投稿が見つかりません')
    sys.exit(1)
" || return 1

  echo ""
  read -p "本当に削除しますか？ (y/N): " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "キャンセルしました"
    return 0
  fi

  local response
  response=$(curl -sf -X DELETE -H "$auth_header" "$BASE_URL/api/admin/delete/$id" 2>&1) || {
    echo "エラー: 削除に失敗しました"
    return 1
  }

  echo "削除しました (ID: $id)"
}

case "${1:-help}" in
  list)   cmd_list "${2:-}" ;;
  show)   cmd_show "${2:-}" ;;
  delete) cmd_delete "${2:-}" ;;
  help|*) usage ;;
esac
