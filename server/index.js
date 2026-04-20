const express = require('express');
const initSqlJs = require('sql.js');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOW_RECORD_DELETE = process.env.NODE_ENV !== 'production';

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'study.db');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db;

function ensureColumn(tableName, columnName, definition) {
  const columns = queryAll(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

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
    gift_status TEXT,
    created_at TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
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

  ensureColumn('prizes', 'gift_status', 'TEXT');
  db.run(`
    UPDATE prizes
    SET gift_status = '待发货'
    WHERE gift_status IS NULL
      AND prize_type IN ('blindbox', 'custom', 'ultimate')
  `);

  recalculateStreak();
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

function getSetting(key, fallbackValue = null) {
  const row = queryOne('SELECT value FROM app_settings WHERE key = ?', [key]);
  return row?.value ?? fallbackValue;
}

function setSetting(key, value) {
  const existing = queryOne('SELECT key FROM app_settings WHERE key = ?', [key]);
  if (existing) {
    runSql('UPDATE app_settings SET value = ? WHERE key = ?', [value, key]);
  } else {
    runSql('INSERT INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
  }
}

function normalizeInspirationItems(rawValue) {
  if (!rawValue) return [];
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => {
        if (typeof item === 'string') {
          const text = item.trim();
          return text ? { id: `legacy-${index + 1}`, text } : null;
        }
        const text = String(item?.text || '').trim();
        const id = String(item?.id || '').trim() || `item-${index + 1}`;
        return text ? { id, text } : null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getInspirationConfig() {
  let items = normalizeInspirationItems(getSetting('inspiration_items', '[]'));
  let preferredId = String(getSetting('preferred_inspiration_id', '') || '').trim();

  // Backward compatibility: migrate old single inspiration into the new list structure.
  if (items.length === 0) {
    const legacyValue = String(getSetting('today_inspiration', '') || '').trim();
    if (legacyValue) {
      items = [{ id: 'legacy-1', text: legacyValue }];
      preferredId = 'legacy-1';
      setSetting('inspiration_items', JSON.stringify(items));
      setSetting('preferred_inspiration_id', preferredId);
    }
  }

  if (preferredId && !items.some((item) => item.id === preferredId)) {
    preferredId = items[0]?.id || '';
  }

  return { items, preferredId };
}

function saveInspirationConfig(items, preferredId) {
  setSetting('inspiration_items', JSON.stringify(items));
  setSetting('preferred_inspiration_id', preferredId || '');
  // Keep legacy key aligned for compatibility with any old reads.
  const preferredText = items.find((item) => item.id === preferredId)?.text || items[0]?.text || '';
  setSetting('today_inspiration', preferredText);
}

function getPrizeConfig() {
  let mode = String(getSetting('prize_mode', 'random') || 'random').trim();
  if (!['random', 'cash', 'blindbox', 'custom'].includes(mode)) {
    mode = 'random';
  }

  const rawCashAmount = String(getSetting('prize_cash_amount', '') || '').trim();
  const parsedCashAmount = Number(rawCashAmount);
  const cashAmount =
    rawCashAmount && Number.isFinite(parsedCashAmount) && parsedCashAmount > 0
      ? Math.round(parsedCashAmount)
      : null;

  return { mode, cashAmount };
}

function savePrizeConfig(mode, cashAmount) {
  const safeMode = ['random', 'cash', 'blindbox', 'custom'].includes(mode) ? mode : 'random';
  const safeCashAmount =
    safeMode === 'cash' && Number.isFinite(Number(cashAmount)) && Number(cashAmount) > 0
      ? String(Math.round(Number(cashAmount)))
      : '';

  setSetting('prize_mode', safeMode);
  setSetting('prize_cash_amount', safeCashAmount);
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

function isValidDateString(value) {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const t = new Date(`${value}T00:00:00+08:00`).getTime();
  return Number.isFinite(t);
}

function isWeekendDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00+08:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function diffDays(dateA, dateB) {
  const dayMs = 24 * 60 * 60 * 1000;
  const a = new Date(`${dateA}T00:00:00+08:00`).getTime();
  const b = new Date(`${dateB}T00:00:00+08:00`).getTime();
  return Math.round((b - a) / dayMs);
}

function recalculateStreak() {
  const checkins = queryAll('SELECT date, study_hours FROM checkins ORDER BY date ASC');
  const existingStreak = queryOne('SELECT * FROM streak WHERE id = 1');

  if (checkins.length === 0) {
    runSql(
      'UPDATE streak SET current_streak = 0, max_streak = 0, total_days = 0, total_hours = 0, ultimate_prize_claimed = 0 WHERE id = 1'
    );
    return;
  }

  let currentRun = 1;
  let maxRun = 1;

  for (let i = 1; i < checkins.length; i += 1) {
    const gap = diffDays(checkins[i - 1].date, checkins[i].date);
    if (gap === 1) {
      currentRun += 1;
    } else {
      currentRun = 1;
    }
    maxRun = Math.max(maxRun, currentRun);
  }

  let tailRun = 1;
  for (let i = checkins.length - 1; i > 0; i -= 1) {
    const gap = diffDays(checkins[i - 1].date, checkins[i].date);
    if (gap === 1) {
      tailRun += 1;
    } else {
      break;
    }
  }

  const totalHours = checkins.reduce((sum, item) => sum + (Number(item.study_hours) || 0), 0);
  const latestDate = checkins[checkins.length - 1].date;
  const gapToToday = diffDays(latestDate, getToday());
  const currentStreak = gapToToday <= 1 ? tailRun : 0;
  // Ultimate prize is based on TOTAL days now; once claimed it should never be reset.
  const ultimatePrizeClaimed = existingStreak?.ultimate_prize_claimed || 0;

  runSql(
    'UPDATE streak SET current_streak = ?, max_streak = ?, total_days = ?, total_hours = ?, ultimate_prize_claimed = ? WHERE id = 1',
    [currentStreak, maxRun, checkins.length, totalHours, ultimatePrizeClaimed]
  );
}

// ==================== AUTH ====================
const SECRET_KEY = 'study_reward_2026_secret_key_x9k2m_v3';
const PASSPHRASE_HASH = crypto.createHmac('sha256', SECRET_KEY).update('淡淡的顺顺的').digest('hex');
const validTokens = new Map();
const ADMIN_PASSPHRASE = process.env.ADMIN_PASSPHRASE || '我与我将重生';
const ADMIN_PASSPHRASE_HASH = crypto.createHmac('sha256', SECRET_KEY).update(ADMIN_PASSPHRASE).digest('hex');
const adminTokens = new Map();

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

function adminAuthMiddleware(req, res, next) {
  const now = Date.now();
  for (const [t, exp] of adminTokens) {
    if (now > exp) adminTokens.delete(t);
  }
  const token = req.headers['x-admin-token'];
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ error: '未授权访问管理后台' });
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

app.post('/api/admin/auth/verify', (req, res) => {
  try {
    const { passphrase } = req.body;
    const inputHash = crypto.createHmac('sha256', SECRET_KEY).update(passphrase || '').digest('hex');

    if (inputHash === ADMIN_PASSPHRASE_HASH) {
      const token = generateToken();
      adminTokens.set(token, Date.now() + 7 * 24 * 60 * 60 * 1000);
      return res.json({ success: true, token });
    }

    setTimeout(() => {
      res.status(403).json({ success: false, error: '管理员口令不正确' });
    }, 600 + Math.random() * 600);
  } catch (e) {
    console.error('Admin auth error:', e);
    res.status(500).json({ error: '管理员验证失败' });
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
    const inspirationConfig = getInspirationConfig();
    const preferredText =
      inspirationConfig.items.find((item) => item.id === inspirationConfig.preferredId)?.text ||
      inspirationConfig.items[0]?.text ||
      '';
    
    res.json({
      streak: streak || { current_streak: 0, max_streak: 0, total_days: 0, total_hours: 0, ultimate_prize_claimed: 0 },
      recentCheckins,
      todayCheckin: !!todayCheckin,
      today,
      todayInspiration: preferredText,
      inspirationItems: inspirationConfig.items,
      preferredInspirationId: inspirationConfig.preferredId,
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
    if (!hours || hours <= 0 || hours > 12) {
      return res.status(400).json({ error: '小样 又想钻我漏洞' });
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

// Make-up checkin (backfill) for any past date (including today if not checked-in yet).
// Rule: if the date already has a checkin, it cannot be backfilled.
app.post('/api/checkin/makeup', authMiddleware, (req, res) => {
  try {
    const { date, studyHours, mood, message } = req.body;

    if (!isValidDateString(date)) {
      return res.status(400).json({ error: '补卡日期不合法' });
    }

    // Disallow future dates
    if (diffDays(date, getToday()) < 0) {
      return res.status(400).json({ error: '不能补未来的日期' });
    }

    const existing = queryOne('SELECT * FROM checkins WHERE date = ?', [date]);
    if (existing) {
      return res.status(409).json({ error: '该日期已打卡，不能补卡' });
    }

    const hours = Number(studyHours);
    if (!hours || hours <= 0 || hours > 12) {
      return res.status(400).json({ error: '小样 又想钻我漏洞' });
    }

    const isWeekend = isWeekendDate(date) ? 1 : 0;
    let insertedId = 0;
    try {
      runSql(
        'INSERT INTO checkins (date, study_hours, mood, message, is_weekend, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [date, hours, mood, message || '', isWeekend, getNowStr()]
      );
      // Use a deterministic lookup by date to get the id. `last_insert_rowid()` is not always reliable in sql.js.
      const inserted = queryOne('SELECT id FROM checkins WHERE date = ?', [date]);
      insertedId = Number(inserted?.id) || 0;
    } catch (e) {
      // Unique constraint safety net
      if ((e.message || '').includes('UNIQUE') || (e.message || '').includes('unique')) {
        return res.status(409).json({ error: '该日期已打卡，不能补卡' });
      }
      throw e;
    }

    if (!Number.isFinite(insertedId) || insertedId <= 0) {
      return res.status(500).json({ error: '补卡创建失败，请重试' });
    }

    // Backfills can affect streak gaps; recalculate based on full history.
    recalculateStreak();
    const streak = queryOne('SELECT * FROM streak WHERE id = ?', [1]);

    res.json({
      success: true,
      checkinId: insertedId,
      date,
      isWeekend,
      streak: streak?.current_streak || 0,
      totalDays: streak?.total_days || 0,
      totalHours: streak?.total_hours || 0,
    });
  } catch (e) {
    console.error('Makeup checkin error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Lightweight existence query for a given date (optional frontend pre-check).
app.get('/api/records/by-date', authMiddleware, (req, res) => {
  try {
    const date = String(req.query.date || '');
    if (!isValidDateString(date)) {
      return res.status(400).json({ error: '日期不合法' });
    }
    const record = queryOne('SELECT * FROM checkins WHERE date = ?', [date]);
    res.json({ record });
  } catch (e) {
    console.error('Record by date error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/lottery', authMiddleware, (req, res) => {
  try {
    const { checkinId } = req.body;

    let effectiveCheckinId = Number(checkinId);
    let checkin = null;

    if (Number.isFinite(effectiveCheckinId) && effectiveCheckinId > 0) {
      checkin = queryOne('SELECT * FROM checkins WHERE id = ?', [effectiveCheckinId]);
    }

    // Fallback to today's latest unclaimed checkin when the client carries an empty or stale id.
    if (!checkin) {
      const fallbackCheckin = queryOne(`
        SELECT c.*
        FROM checkins c
        LEFT JOIN prizes p ON c.id = p.checkin_id
        WHERE c.date = ? AND p.id IS NULL
        ORDER BY c.id DESC
        LIMIT 1
      `, [getToday()]);

      if (fallbackCheckin) {
        checkin = fallbackCheckin;
        effectiveCheckinId = Number(fallbackCheckin.id);
      }
    }

    if (!checkin) {
      return res.status(400).json({ error: '打卡记录不存在' });
    }
    
    const existingPrize = queryOne('SELECT * FROM prizes WHERE checkin_id = ?', [effectiveCheckinId]);
    if (existingPrize) {
      return res.status(400).json({ error: '已经抽过奖了', prize: existingPrize });
    }

    const streak = queryOne('SELECT * FROM streak WHERE id = ?', [1]);
    const prizeConfig = getPrizeConfig();
    
    let prizeType, prizeDetail, amount, giftStatus = null;
    
    if ((streak?.total_days || 0) >= 25 && !streak?.ultimate_prize_claimed) {
      prizeType = 'ultimate';
      prizeDetail = '神秘大礼已解锁！累计打卡25天达成，值得被好好庆祝。';
      amount = 2000;
      giftStatus = '待发货';
      runSql('UPDATE streak SET ultimate_prize_claimed = 1 WHERE id = 1');
    } else {
      if (prizeConfig.mode === 'custom') {
        prizeType = 'custom';
        prizeDetail = '自选奖品！500元以内心愿单任你填！';
        amount = 500;
        giftStatus = '待发货';
      } else if (prizeConfig.mode === 'blindbox') {
        prizeType = 'blindbox';
        prizeDetail = '盲盒奖品！等待拆开惊喜盲盒！';
        amount = 0;
        giftStatus = '待发货';
      } else if (prizeConfig.mode === 'cash') {
        prizeType = 'cash';
        amount = Math.max(1, Math.round(Number(prizeConfig.cashAmount) || 0));
        prizeDetail = '固定现金奖励 ' + amount + ' 元已解锁，今天的认真很值得。';
      } else {
        const rand = Math.random() * 100;

        if (rand < 10) {
          prizeType = 'custom';
          prizeDetail = '自选奖品！500元以内心愿单任你填！';
          amount = 500;
          giftStatus = '待发货';
        } else if (rand < 25) {
          prizeType = 'blindbox';
          prizeDetail = '盲盒奖品！等待拆开惊喜盲盒！';
          amount = 0;
          giftStatus = '待发货';
        } else {
          prizeType = 'cash';
          const hrs = Number(checkin.study_hours) || 1;
          const multiplier = 1 + Math.random() * 0.8;
          amount = Math.max(1, Math.round(25 * hrs * multiplier));
          prizeDetail = '现金奖励 ' + amount + ' 元已解锁，今天的认真很值得。';
        }
      }
    }

    runSql(
      'INSERT INTO prizes (checkin_id, prize_type, prize_detail, amount, gift_status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [effectiveCheckinId, prizeType, prizeDetail, amount, giftStatus, getNowStr()]
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
      SELECT c.*, p.prize_type, p.prize_detail, p.amount as prize_amount, p.gift_status
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

app.get('/api/admin/inspiration', adminAuthMiddleware, (req, res) => {
  try {
    const config = getInspirationConfig();
    res.json(config);
  } catch (e) {
    console.error('Admin inspiration get error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/admin/inspiration', adminAuthMiddleware, (req, res) => {
  try {
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const items = rawItems
      .map((item, index) => {
        const text = String(item?.text || '').trim();
        const id = String(item?.id || '').trim() || `admin-${index + 1}-${Date.now()}`;
        return text ? { id, text } : null;
      })
      .filter(Boolean);

    if (items.some((item) => item.text.length > 240)) {
      return res.status(400).json({ error: '单条灵感最多 240 个字符' });
    }

    let preferredId = String(req.body?.preferredId || '').trim();
    if (preferredId && !items.some((item) => item.id === preferredId)) {
      return res.status(400).json({ error: '默认优先展示项不存在' });
    }
    if (!preferredId && items.length > 0) {
      preferredId = items[0].id;
    }

    saveInspirationConfig(items, preferredId);
    res.json({ success: true, items, preferredId });
  } catch (e) {
    console.error('Admin inspiration update error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/prize-config', adminAuthMiddleware, (req, res) => {
  try {
    res.json(getPrizeConfig());
  } catch (e) {
    console.error('Admin prize config get error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/admin/prize-config', adminAuthMiddleware, (req, res) => {
  try {
    const mode = String(req.body?.mode || 'random').trim();
    const cashAmount = req.body?.cashAmount;

    if (!['random', 'cash', 'blindbox', 'custom'].includes(mode)) {
      return res.status(400).json({ error: '奖品策略不合法' });
    }

    if (mode === 'cash') {
      const amount = Number(cashAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: '固定现金金额必须大于 0' });
      }
    }

    savePrizeConfig(mode, cashAmount);
    res.json({ success: true, ...getPrizeConfig() });
  } catch (e) {
    console.error('Admin prize config update error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/gifts', adminAuthMiddleware, (req, res) => {
  try {
    const gifts = queryAll(`
      SELECT
        p.id,
        p.checkin_id,
        p.prize_type,
        p.prize_detail,
        p.amount,
        p.gift_status,
        p.created_at,
        c.date,
        c.study_hours,
        c.mood,
        c.message
      FROM prizes p
      LEFT JOIN checkins c ON c.id = p.checkin_id
      WHERE p.prize_type IN ('blindbox', 'custom', 'ultimate')
      ORDER BY p.created_at DESC, p.id DESC
    `);
    res.json({ gifts });
  } catch (e) {
    console.error('Admin gifts error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/admin/gifts/:id/status', adminAuthMiddleware, (req, res) => {
  try {
    const giftId = Number(req.params.id);
    const giftStatus = String(req.body?.giftStatus || '').trim();
    const ALLOWED_GIFT_STATUSES = ['待发货', '发货中', '已完成'];

    if (!Number.isFinite(giftId) || giftId <= 0) {
      return res.status(400).json({ error: '礼物 ID 无效' });
    }
    if (!ALLOWED_GIFT_STATUSES.includes(giftStatus)) {
      return res.status(400).json({ error: '礼物状态不合法' });
    }

    const gift = queryOne('SELECT * FROM prizes WHERE id = ?', [giftId]);
    if (!gift || !['blindbox', 'custom', 'ultimate'].includes(gift.prize_type)) {
      return res.status(404).json({ error: '礼物记录不存在' });
    }

    runSql('UPDATE prizes SET gift_status = ? WHERE id = ?', [giftStatus, giftId]);
    const updated = queryOne('SELECT * FROM prizes WHERE id = ?', [giftId]);
    res.json({ success: true, gift: updated });
  } catch (e) {
    console.error('Admin gift status update error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/records/:id', authMiddleware, (req, res) => {
  try {
    if (!ALLOW_RECORD_DELETE) {
      return res.status(403).json({ error: '线上环境不支持删除记录' });
    }

    const recordId = Number(req.params.id);
    if (!Number.isFinite(recordId) || recordId <= 0) {
      return res.status(400).json({ error: '记录 ID 无效' });
    }

    const record = queryOne('SELECT * FROM checkins WHERE id = ?', [recordId]);
    if (!record) {
      return res.status(404).json({ error: '打卡记录不存在' });
    }

    runSql('DELETE FROM prizes WHERE checkin_id = ?', [recordId]);
    runSql('DELETE FROM checkins WHERE id = ?', [recordId]);
    recalculateStreak();

    res.json({ success: true, deletedId: recordId });
  } catch (e) {
    console.error('Delete record error:', e);
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
