#!/bin/bash
# 一键部署脚本 - 学习加油站
# 目标:
# 1. 前端通过 Nginx 启动在 80 端口
# 2. 后端保持默认 3001 端口
# 3. 自动安装依赖并使用 PM2 守护后端
#
# 使用方法:
#   bash deploy.sh

set -euo pipefail

APP_NAME="study-reward"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
CLIENT_DIR="$APP_DIR/client"
CLIENT_DIST_DIR="$CLIENT_DIR/dist"
WEB_ROOT="/var/www/${APP_NAME}"
SERVER_ENTRY="$APP_DIR/server/index.js"
SERVER_PORT="3001"
NGINX_SITE="/etc/nginx/sites-available/${APP_NAME}"
NGINX_SITE_LINK="/etc/nginx/sites-enabled/${APP_NAME}"
NGINX_TEMPLATE="$APP_DIR/nginx.study-reward.conf.example"

echo "🚀 学习加油站 - 部署开始"
echo "================================"

if [ "$(id -u)" -ne 0 ]; then
  SUDO="sudo"
else
  SUDO=""
fi

need_cmd() {
  command -v "$1" >/dev/null 2>&1
}

install_curl() {
  if need_cmd curl; then
    echo "✅ curl 已安装"
    return
  fi

  echo "📦 安装 curl..."
  $SUDO apt-get update
  $SUDO apt-get install -y curl
}

install_rsync() {
  if need_cmd rsync; then
    echo "✅ rsync 已安装"
    return
  fi

  echo "📦 安装 rsync..."
  $SUDO apt-get update
  $SUDO apt-get install -y rsync
}

show_failure_diagnostics() {
  echo ""
  echo "🔎 附加诊断信息:"
  echo "---- nginx -t ----"
  $SUDO nginx -t || true
  echo "---- systemctl status nginx ----"
  $SUDO systemctl status nginx --no-pager -l || true
  echo "---- pm2 status ----"
  pm2 status || true
  echo "---- pm2 logs (${APP_NAME}) ----"
  pm2 logs "$APP_NAME" --lines 40 --nostream || true
}

render_nginx_config() {
  if [ ! -f "$NGINX_TEMPLATE" ]; then
    echo "❌ 未找到 Nginx 模板文件: $NGINX_TEMPLATE"
    exit 1
  fi

  sed \
    -e "s|__CLIENT_DIST_DIR__|$WEB_ROOT|g" \
    -e "s|__SERVER_PORT__|$SERVER_PORT|g" \
    "$NGINX_TEMPLATE" | $SUDO tee "$NGINX_SITE" >/dev/null
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
  echo "🩺 执行部署后自检..."
  wait_for_code "前端首页" "http://127.0.0.1/" "200"
  wait_for_code "后端服务" "http://127.0.0.1:${SERVER_PORT}/api/auth/verify" "200" "403" "POST" '{"passphrase":"health-check"}'
  wait_for_code "Nginx API 反代" "http://127.0.0.1/api/auth/verify" "200" "403" "POST" '{"passphrase":"health-check"}'
}

install_nodejs() {
  if need_cmd node && need_cmd npm; then
    echo "✅ Node.js $(node -v)"
    echo "✅ npm $(npm -v)"
    return
  fi

  echo "📦 安装 Node.js 18..."
  $SUDO apt-get update
  $SUDO apt-get install -y curl ca-certificates gnupg
  curl -fsSL https://deb.nodesource.com/setup_18.x | $SUDO -E bash -
  $SUDO apt-get install -y nodejs

  echo "✅ Node.js $(node -v)"
  echo "✅ npm $(npm -v)"
}

install_nginx() {
  if need_cmd nginx; then
    echo "✅ Nginx 已安装"
    return
  fi

  echo "📦 安装 Nginx..."
  $SUDO apt-get update
  $SUDO apt-get install -y nginx
}

install_pm2() {
  if need_cmd pm2; then
    echo "✅ PM2 已安装"
    return
  fi

  echo "📦 安装 PM2..."
  $SUDO npm install -g pm2
}

install_nodejs
install_nginx
install_pm2
install_curl
install_rsync

echo "📦 安装后端依赖..."
cd "$APP_DIR"
npm install

echo "📦 安装前端依赖..."
cd "$CLIENT_DIR"
npm install

echo "🔨 构建前端..."
npm run build

sync_frontend_assets

echo "📁 创建数据目录..."
mkdir -p "$APP_DIR/server/data"

echo "⚙️ 配置 Nginx..."
render_nginx_config

if [ -f /etc/nginx/sites-enabled/default ]; then
  $SUDO rm -f /etc/nginx/sites-enabled/default
fi

$SUDO ln -sf "$NGINX_SITE" "$NGINX_SITE_LINK"
$SUDO nginx -t
$SUDO systemctl enable nginx
$SUDO systemctl restart nginx

echo "🚀 启动后端服务..."
cd "$APP_DIR"
pm2 describe "$APP_NAME" >/dev/null 2>&1 \
  && pm2 restart "$APP_NAME" --update-env \
  || pm2 start "$SERVER_ENTRY" --name "$APP_NAME"

pm2 save
run_self_check

echo "================================"
echo "✅ 部署完成！"
echo ""
echo "前端地址: http://服务器IP/"
echo "前端端口: 80 (由 Nginx 提供)"
echo "后端端口: $SERVER_PORT"
echo "API 代理: /api -> http://127.0.0.1:$SERVER_PORT"
echo ""
echo "常用命令:"
echo "  pm2 status"
echo "  pm2 logs $APP_NAME"
echo "  pm2 restart $APP_NAME"
echo "  systemctl status nginx"
echo ""
echo "🔑 口号: 淡淡的顺顺的"
