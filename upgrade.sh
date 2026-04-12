#!/bin/bash
# 升级脚本 - 学习加油站
# 目标:
# 1. 拉取远程最新 main 分支代码
# 2. 更新前后端依赖并重新构建前端
# 3. 重启 Nginx 与 PM2 后端服务
# 4. 严格保护 server/data/study.db，不允许被覆盖
#
# 使用方法:
#   bash upgrade.sh

set -euo pipefail

APP_NAME="study-reward"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
CLIENT_DIR="$APP_DIR/client"
CLIENT_DIST_DIR="$CLIENT_DIR/dist"
WEB_ROOT="/var/www/${APP_NAME}"
SERVER_ENTRY="$APP_DIR/server/index.js"
DB_PATH="$APP_DIR/server/data/study.db"
DB_BACKUP_PATH="$APP_DIR/server/data/study.db.upgrade.bak"
REMOTE_NAME="${REMOTE_NAME:-origin}"
BRANCH_NAME="${BRANCH_NAME:-main}"
NGINX_SITE="/etc/nginx/sites-available/${APP_NAME}"
SERVER_PORT="3001"

echo "🔄 学习加油站 - 开始升级"
echo "================================"

if [ "$(id -u)" -ne 0 ]; then
  SUDO="sudo"
else
  SUDO=""
fi

need_cmd() {
  command -v "$1" >/dev/null 2>&1
}

require_cmd() {
  if ! need_cmd "$1"; then
    echo "❌ 缺少命令: $1"
    exit 1
  fi
}

show_failure_diagnostics() {
  echo ""
  echo "🔎 附加诊断信息:"
  echo "---- nginx -t ----"
  $SUDO nginx -t || true
  echo "---- nginx worker users ----"
  ps -eo user=,comm= | awk '$2=="nginx"{print $1}' | sort -u || true
  echo "---- systemctl status nginx ----"
  $SUDO systemctl status nginx --no-pager -l || true
  echo "---- web root permissions ----"
  ls -ld "$WEB_ROOT" || true
  echo "---- index.html permissions ----"
  ls -l "$WEB_ROOT/index.html" || true
  if need_cmd namei; then
    echo "---- index.html path permissions ----"
    namei -l "$WEB_ROOT/index.html" || true
  fi
  echo "---- nginx error.log ----"
  $SUDO tail -n 80 /var/log/nginx/error.log || true
  echo "---- pm2 status ----"
  pm2 status || true
  echo "---- pm2 logs (${APP_NAME}) ----"
  pm2 logs "$APP_NAME" --lines 40 --nostream || true
}

sync_frontend_assets() {
  if [ ! -f "$CLIENT_DIST_DIR/index.html" ]; then
    echo "❌ 前端构建产物不存在: $CLIENT_DIST_DIR/index.html"
    exit 1
  fi

  echo "📤 同步前端静态文件到 $WEB_ROOT ..."
  $SUDO mkdir -p "$WEB_ROOT"
  $SUDO rsync -a --delete "$CLIENT_DIST_DIR"/ "$WEB_ROOT"/
  $SUDO find "$WEB_ROOT" -type d -exec chmod 755 {} \;
  $SUDO find "$WEB_ROOT" -type f -exec chmod 644 {} \;
}

request_code() {
  local url="$1"
  local method="${2:-GET}"
  local body="${3:-}"

  if [ "$method" = "POST" ]; then
    curl -s -o /dev/null -w "%{http_code}" \
      -X POST \
      -H "Content-Type: application/json" \
      --data "$body" \
      "$url" || echo "000"
  else
    curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000"
  fi
}

wait_for_code() {
  local name="$1"
  local url="$2"
  local expected_a="$3"
  local expected_b="${4:-}"
  local method="${5:-GET}"
  local body="${6:-}"
  local code=""

  for attempt in 1 2 3 4 5 6 7 8; do
    code="$(request_code "$url" "$method" "$body")"
    if [ "$code" = "$expected_a" ] || { [ -n "$expected_b" ] && [ "$code" = "$expected_b" ]; }; then
      echo "✅ $name 正常 (HTTP $code)"
      return 0
    fi
    sleep 2
  done

  echo "❌ $name 检查失败，最后返回 HTTP $code"
  show_failure_diagnostics
  return 1
}

run_self_check() {
  echo "🩺 执行升级后自检..."
  wait_for_code "前端首页" "http://127.0.0.1/" "200"
  wait_for_code "后端服务" "http://127.0.0.1:${SERVER_PORT}/api/auth/verify" "200" "403" "POST" '{"passphrase":"health-check"}'
  wait_for_code "Nginx API 反代" "http://127.0.0.1/api/auth/verify" "200" "403" "POST" '{"passphrase":"health-check"}'
}

hash_file() {
  if [ -f "$1" ]; then
    sha256sum "$1" | awk '{print $1}'
  else
    echo ""
  fi
}

restore_db_if_needed() {
  if [ ! -f "$DB_BACKUP_PATH" ]; then
    return
  fi

  local current_hash
  current_hash="$(hash_file "$DB_PATH")"

  if [ ! -f "$DB_PATH" ] || [ "$current_hash" != "$DB_HASH_BEFORE" ]; then
    echo "🛡️ 检测到数据库变化，恢复备份..."
    cp "$DB_BACKUP_PATH" "$DB_PATH"
  fi
}

require_cmd git
require_cmd node
require_cmd npm
require_cmd pm2
require_cmd nginx
require_cmd sha256sum
require_cmd curl
require_cmd rsync

if [ ! -d "$APP_DIR/.git" ]; then
  echo "❌ 当前目录不是 Git 仓库: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ 检测到未提交的代码改动，请先处理后再升级"
  git status --short
  exit 1
fi

mkdir -p "$APP_DIR/server/data"

DB_HASH_BEFORE=""
if [ -f "$DB_PATH" ]; then
  echo "💾 备份数据库..."
  cp "$DB_PATH" "$DB_BACKUP_PATH"
  DB_HASH_BEFORE="$(hash_file "$DB_PATH")"
  echo "✅ 已备份数据库: $DB_BACKUP_PATH"
else
  echo "ℹ️ 未发现现有数据库，将跳过数据库备份"
fi

echo "📥 拉取远程代码..."
git fetch "$REMOTE_NAME" "$BRANCH_NAME"
git pull --ff-only "$REMOTE_NAME" "$BRANCH_NAME"

echo "📦 更新后端依赖..."
npm install

echo "📦 更新前端依赖..."
cd "$CLIENT_DIR"
npm install

echo "🔨 重新构建前端..."
npm run build

cd "$APP_DIR"

sync_frontend_assets

restore_db_if_needed

echo "♻️ 重启后端服务..."
pm2 describe "$APP_NAME" >/dev/null 2>&1 \
  && pm2 restart "$APP_NAME" --update-env \
  || pm2 start "$SERVER_ENTRY" --name "$APP_NAME"
pm2 save

echo "♻️ 重载前端服务..."
if [ -f "$NGINX_SITE" ]; then
  $SUDO nginx -t
fi
$SUDO systemctl reload nginx

restore_db_if_needed
run_self_check

echo "🧹 清理数据库备份..."
rm -f "$DB_BACKUP_PATH"

echo "================================"
echo "✅ 升级完成！"
echo ""
echo "远程分支: $REMOTE_NAME/$BRANCH_NAME"
echo "前端地址: http://服务器IP/"
echo "后端端口: 3001"
echo "数据库文件: $DB_PATH"
echo "数据库保护: 已启用备份与恢复机制"
echo ""
echo "常用命令:"
echo "  pm2 status"
echo "  pm2 logs $APP_NAME"
echo "  systemctl status nginx"
