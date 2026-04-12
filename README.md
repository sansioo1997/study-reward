# 学习加油站 📚✨

激励式学习打卡平台，帮助好友完成毕业设计的暖心项目。

## 功能特性

- 🔐 **口号验证** - 安全的身份验证机制
- 📝 **每日打卡** - 记录学习时长、心情和心里话
- 🐱 **互动宠物猫** - 可触摸互动，跟随心情变化
- 🎰 **打卡抽奖** - 老虎机式互动抽奖
- 📊 **打卡记录** - 完整的学习和奖励记录
- 🏆 **连续打卡奖励** - 20天连续打卡终极大奖

## 奖品设置

| 奖品类型 | 中奖率 | 内容 |
|---------|--------|------|
| 💰 现金奖励 | 75% | 20元 × 学习时长 |
| 📦 盲盒奖品 | 10% | 等待拆盲盒 |
| 🎁 自选奖品 | 5% | 500元以内心愿单 |
| 👜 终极大奖 | 连续20天必中 | 2000元包包 |

## 快速部署

### 环境要求
- Node.js 18+
- npm 9+

### 一键部署
```bash
git clone <repo-url>
cd study-reward
bash deploy.sh
```

### 手动部署
```bash
# 安装依赖
npm install
cd client && npm install

# 构建前端
cd client && npm run build
cd ..

# 启动服务
npm start
# 或指定端口
PORT=8080 npm start
```

### PM2 守护进程
```bash
npm install -g pm2
pm2 start server/index.js --name study-reward
pm2 save
pm2 startup
```

### Nginx 反向代理（可选）
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 技术栈

- **前端**: React 18 + Vite + Framer Motion
- **后端**: Node.js + Express
- **数据库**: SQLite (better-sqlite3)
- **UI风格**: 深色毛玻璃 + 渐变动画，参考 ReactBits.dev

## 项目结构

```
study-reward/
├── server/
│   ├── index.js          # Express 服务端
│   └── data/             # SQLite 数据库
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx     # 口号验证页
│   │   │   ├── HomePage.jsx     # 主页
│   │   │   └── RecordsPage.jsx  # 打卡记录
│   │   ├── components/
│   │   │   ├── CatPet.jsx       # 互动宠物猫
│   │   │   ├── CheckinModal.jsx # 打卡弹窗
│   │   │   ├── LotteryWheel.jsx # 抽奖组件
│   │   │   └── StarryBackground.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   └── styles/
│   │       └── global.css
│   └── index.html
├── deploy.sh             # 一键部署脚本
├── package.json
└── README.md
```
