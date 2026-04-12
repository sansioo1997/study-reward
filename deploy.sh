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
SERVER_ENTRY="$APP_DIR/server/index.js"
SERVER_PORT="3001"
NGINX_SITE="/etc/nginx/sites-available/${APP_NAME}"
NGINX_SITE_LINK="/etc/nginx/sites-enabled/${APP_NAME}"

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

echo "📦 安装后端依赖..."
cd "$APP_DIR"
npm install

echo "📦 安装前端依赖..."
cd "$CLIENT_DIR"
npm install

echo "🔨 构建前端..."
npm run build

echo "📁 创建数据目录..."
mkdir -p "$APP_DIR/server/data"

echo "⚙️ 配置 Nginx..."
$SUDO tee "$NGINX_SITE" >/dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root $CLIENT_DIST_DIR;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:$SERVER_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

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
