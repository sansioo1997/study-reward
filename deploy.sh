#!/bin/bash
# 一键部署脚本 - 学习加油站
# 使用方法: bash deploy.sh

set -e

echo "🚀 学习加油站 - 部署开始"
echo "================================"

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js (v18+)"
    echo "   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "   sudo apt-get install -y nodejs"
    exit 1
fi

echo "✅ Node.js $(node -v)"

# 2. 安装依赖
echo "📦 安装后端依赖..."
npm install

echo "📦 安装前端依赖..."
cd client && npm install

# 3. 构建前端
echo "🔨 构建前端..."
npm run build
cd ..

# 4. 创建数据目录
mkdir -p server/data

# 5. 启动服务
echo "================================"
echo "✅ 部署完成！"
echo ""
echo "启动命令:"
echo "  npm start"
echo ""
echo "或使用 PM2 守护进程:"
echo "  npm install -g pm2"
echo "  pm2 start server/index.js --name study-reward"
echo "  pm2 save"
echo "  pm2 startup"
echo ""
echo "默认端口: 3001"
echo "设置端口: PORT=8080 npm start"
echo ""
echo "🌐 访问: http://your-server-ip:3001"
echo "🔑 口号: 淡淡的顺顺的"
