const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const dbPath = path.join(projectRoot, 'server', 'data', 'study.db');
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(projectRoot, 'node_modules', 'sql.js', 'dist', file),
  });

  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const fmtDate = (d) => d.toISOString().split('T')[0];
  const fmtTime = (d) => d.toISOString().replace('T', ' ').slice(0, 19);

  db.run('DELETE FROM prizes');
  db.run('DELETE FROM checkins');

  const moods = ['happy', 'excited', 'love', 'proud', 'cuddle'];
  let totalHours = 0;

  for (let i = 24; i >= 1; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const date = fmtDate(d);
    const createdAt = fmtTime(new Date(d.getTime() + 12 * 60 * 60 * 1000));
    const hours = [2, 2.5, 3, 3.5, 4][(24 - i) % 5];
    const mood = moods[(24 - i) % moods.length];
    const isWeekend = [0, 6].includes(d.getDay()) ? 1 : 0;
    totalHours += hours;

    db.run(
      'INSERT INTO checkins (date, study_hours, mood, message, is_weekend, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [date, hours, mood, '神秘大礼测试数据', isWeekend, createdAt]
    );
  }

  db.run(
    'UPDATE streak SET current_streak = ?, max_streak = ?, total_days = ?, total_hours = ?, ultimate_prize_claimed = 0 WHERE id = 1',
    [24, 24, 24, totalHours]
  );

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  console.log(`Seeded 24 consecutive historical checkins, totalHours=${totalHours}. Today remains available.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
