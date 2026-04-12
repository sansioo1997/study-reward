const express = require('express');
const initSqlJs = require('sql.js');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'study.db');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db;

async function initDB() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    study_hours REAL NOT NULL,
    mood TEXT NOT NULL,
    message TEXT,
    is_weekend INTEGER DEFAULT 0,
    created_at TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS prizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checkin_id INTEGER NOT NULL,
    prize_type TEXT NOT NULL,
    prize_detail TEXT,
    amount REAL,
    created_at TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS streak (
    id INTEGER PRIMARY KEY,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    total_days INTEGER DEFAULT 0,
    total_hours REAL DEFAULT 0,
    ultimate_prize_claimed INTEGER DEFAULT 0
  )`);

  const rows = db.exec('SELECT COUNT(*) FROM streak WHERE id = 1');
  const count = rows[0]?.values[0]?.[0] || 0;
  if (count === 0) {
    db.run('INSERT INTO streak (id, current_streak, max_streak, total_days, total_hours, ultimate_prize_claimed) VALUES (1, 0, 0, 0, 0, 0)');
  }

  saveDB();
  console.log('📊 Database initialized');
}

function saveDB() {
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    console.error('DB save error:', e.message);
  }
}

function queryAll(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
  } catch (e) {
    console.error('Query error:', sql, e.message);
    return [];
  }
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function runSql(sql, params = []) {
  try {
    db.run(sql, params);
    saveDB();
    const res = db.exec('SELECT last_insert_rowid()');
    return { lastInsertRowid: res[0]?.values[0]?.[0] || 0 };
  } catch (e) {
    console.error('Run error:', sql, e.message);
    throw e;
  }
}

function getNow() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000);
}

function getToday() {
  return getNow().toISOString().split('T')[0];
}

function getNowStr() {
  return getNow().toISOString().replace('T', ' ').slice(0, 19);
}

// ==================== AUTH ====================
const SECRET_KEY = 'study_reward_2026_secret_key_x9k2m_v3';
const PASSPHRASE_HASH = crypto.createHmac('sha256', SECRET_KEY).update('淡淡的顺顺的').digest('hex');
const validTokens = new Map();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function authMiddleware(req, res, next) {
  const now = Date.now();
  for (const [t, exp] of validTokens) {
    if (now > exp) validTokens.delete(t);
  }
  const token = req.headers['x-auth-token'];
  if (!token || !validTokens.has(token)) {
    return res.status(401).json({ error: '未授权访问' });
  }
  next();
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.post('/api/auth/verify', (req, res) => {
  try {
    const { passphrase } = req.body;
    const inputHash = crypto.createHmac('sha256', SECRET_KEY).update(passphrase || '').digest('hex');
    
    if (inputHash === PASSPHRASE_HASH) {
      const token = generateToken();
      validTokens.set(token, Date.now() + 7 * 24 * 60 * 60 * 1000);
      return res.json({ success: true, token });
    }
    
    setTimeout(() => {
      res.status(403).json({ success: false, error: '口号不正确' });
    }, 1000 + Math.random() * 1000);
  } catch (e) {
    console.error('Auth error:', e);
    res.status(500).json({ error: '验证失败' });
  }
});

app.get('/api/checkin/today', authMiddleware, (req, res) => {
  try {
    const today = getToday();
    const checkin = queryOne('SELECT * FROM checkins WHERE date = ?', [today]);
    const prize = checkin ? queryOne('SELECT * FROM prizes WHERE checkin_id = ?', [checkin.id]) : null;
    res.json({ checkin, prize, date: today });
  } catch (e) {
    console.error('Today error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/stats', authMiddleware, (req, res) => {
  try {
    const streak = queryOne('SELECT * FROM streak WHERE id = ?', [1]);
    const recentCheckins = queryAll('SELECT * FROM checkins ORDER BY date DESC LIMIT 30');
    const today = getToday();
    const todayCheckin = queryOne('SELECT * FROM checkins WHERE date = ?', [today]);
    
    res.json({
      streak: streak || { current_streak: 0, max_streak: 0, total_days: 0, total_hours: 0, ultimate_prize_claimed: 0 },
      recentCheckins,
      todayCheckin: !!todayCheckin,
      today
    });
  } catch (e) {
    console.error('Stats error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/checkin', authMiddleware, (req, res) => {
  try {
    const { studyHours, mood, message } = req.body;
    const now = getNow();
    const today = getToday();
    const dayOfWeek = now.getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6) ? 1 : 0;

    const existing = queryOne('SELECT * FROM checkins WHERE date = ?', [today]);
    if (existing) {
      return res.status(400).json({ error: '今天已经打卡过了哦！' });
    }

    const hours = Number(studyHours);
    if (!hours || hours <= 0 || hours > 24) {
      return res.status(400).json({ error: '学习时长不合理' });
    }

    const result = runSql(
      'INSERT INTO checkins (date, study_hours, mood, message, is_weekend, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [today, hours, mood, message || '', isWeekend, getNowStr()]
    );

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const yesterdayCheckin = queryOne('SELECT * FROM checkins WHERE date = ?', [yesterday]);
    const streak = queryOne('SELECT * FROM streak WHERE id = ?', [1]);

    const newStreak = yesterdayCheckin ? (streak?.current_streak || 0) + 1 : 1;
    const newMax = Math.max(newStreak, streak?.max_streak || 0);
    
    runSql(
      'UPDATE streak SET current_streak = ?, max_streak = ?, total_days = total_days + 1, total_hours = total_hours + ? WHERE id = 1',
      [newStreak, newMax, hours]
    );

    res.json({
      success: true,
      checkinId: result.lastInsertRowid,
      isWeekend,
      streak: newStreak,
      totalDays: (streak?.total_days || 0) + 1,
      totalHours: (streak?.total_hours || 0) + hours
    });
  } catch (e) {
    console.error('Checkin error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/lottery', authMiddleware, (req, res) => {
  try {
    const { checkinId } = req.body;
    
    const checkin = queryOne('SELECT * FROM checkins WHERE id = ?', [checkinId]);
    if (!checkin) {
      return res.status(400).json({ error: '打卡记录不存在' });
    }
    
    const existingPrize = queryOne('SELECT * FROM prizes WHERE checkin_id = ?', [checkinId]);
    if (existingPrize) {
      return res.status(400).json({ error: '已经抽过奖了', prize: existingPrize });
    }

    const streak = queryOne('SELECT * FROM streak WHERE id = ?', [1]);
    
    let prizeType, prizeDetail, amount;
    
    if ((streak?.current_streak || 0) >= 20 && !streak?.ultimate_prize_claimed) {
      prizeType = 'ultimate';
      prizeDetail = '神秘大礼已解锁！连续打卡20天达成，值得被好好庆祝。';
      amount = 2000;
      runSql('UPDATE streak SET ultimate_prize_claimed = 1 WHERE id = 1');
    } else {
      const rand = Math.random() * 100;
      
      if (rand < 5) {
        prizeType = 'custom';
        prizeDetail = '自选奖品！500元以内心愿单任你填！';
        amount = 500;
      } else if (rand < 15) {
        prizeType = 'blindbox';
        prizeDetail = '盲盒奖品！等待拆开惊喜盲盒！';
        amount = 0;
      } else {
        prizeType = 'cash';
        const hrs = Number(checkin.study_hours) || 1;
        const multiplier = 1 + Math.random() * 0.5;
        amount = 20 * hrs * multiplier;
        prizeDetail = '现金奖励 ' + Math.round(amount) + ' 元！(20元 x ' + hrs + '小时 x 幸运系数' + multiplier.toFixed(2) + ')';
      }
    }

    runSql(
      'INSERT INTO prizes (checkin_id, prize_type, prize_detail, amount, created_at) VALUES (?, ?, ?, ?, ?)',
      [checkinId, prizeType, prizeDetail, amount, getNowStr()]
    );

    res.json({ prizeType, prizeDetail, amount, streak: streak?.current_streak || 0 });
  } catch (e) {
    console.error('Lottery error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/records', authMiddleware, (req, res) => {
  try {
    const records = queryAll(`
      SELECT c.*, p.prize_type, p.prize_detail, p.amount as prize_amount
      FROM checkins c
      LEFT JOIN prizes p ON c.id = p.checkin_id
      ORDER BY c.date DESC
    `);
    res.json({ records });
  } catch (e) {
    console.error('Records error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Static files (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Database: ${DB_PATH}`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});
