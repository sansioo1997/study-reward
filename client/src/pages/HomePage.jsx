import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowRight,
  FiAward,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiGift,
  FiLayers,
  FiMoon,
} from 'react-icons/fi';
import { HiMiniSparkles } from 'react-icons/hi2';
import CatPet from '../components/CatPet';
import CheckinModal from '../components/CheckinModal';
import LotteryWheel from '../components/LotteryWheel';
import { useTheme } from '../utils/theme';

const QUOTES = [
  '路虽远，行则将至；事虽难，做则必成。',
  '山重水复疑无路，柳暗花明又一村。',
  '长风破浪会有时，直挂云帆济沧海。',
  '千里之行，始于足下。',
  '不积跬步，无以至千里；不积小流，无以成江海。',
  '业精于勤，荒于嬉；行成于思，毁于随。',
  '真正的伟大，是在认清生活之后依然热爱它。',
  '世界以痛吻我，我却报之以歌。',
  '愿你在反复打磨的日子里，依然保有温柔与笃定。',
  '你今日埋下的每一粒种子，都会在未来长成光。',
  '请相信那些安静积累的时刻，终会把你送往更远的地方。',
  '纵有疾风起，人生不言弃。',
  '愿你的坚持被时间温柔看见，愿你的努力终有回响。',
  '苔花如米小，也学牡丹开。',
  '把今天认真过好，就是给明天最好的答案。',
];

function getNextQuote(currentQuote) {
  const candidates = QUOTES.filter((quote) => quote !== currentQuote);
  const pool = candidates.length > 0 ? candidates : QUOTES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function formatDate(d) {
  const date = d ? new Date(d) : new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = weekDays[date.getDay()];
  return { year, month, day, weekDay, isWeekend: date.getDay() === 0 || date.getDay() === 6 };
}

export default function HomePage({ stats, refreshStats, onNavigate }) {
  const [showCheckin, setShowCheckin] = useState(false);
  const [showLottery, setShowLottery] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  const [catMood, setCatMood] = useState('idle');
  const [quote, setQuote] = useState(() => getNextQuote());
  const scrollRef = useRef(null);
  const { theme, cycleTheme, themeMeta } = useTheme();

  const dateInfo = formatDate();
  const todayChecked = stats?.todayCheckin;
  const statCards = [
    {
      key: 'streak',
      icon: FiAward,
      value: stats?.streak?.current_streak || 0,
      label: '连续打卡',
      accent: 'var(--primary)',
    },
    {
      key: 'days',
      icon: FiCalendar,
      value: stats?.streak?.total_days || 0,
      label: '累计天数',
      accent: 'var(--accent)',
    },
    {
      key: 'hours',
      icon: FiClock,
      value: (stats?.streak?.total_hours || 0).toFixed(1),
      label: '总时长(h)',
      accent: 'var(--warning)',
    },
  ];

  const handleCheckinComplete = (result) => {
    setCheckinResult(result);
    setShowCheckin(false);
    setCatMood(result.isWeekend ? 'super_excited' : 'happy');
    refreshStats();
    // Auto show lottery after a delay
    setTimeout(() => {
      setShowLottery(true);
    }, 1500);
  };

  const handleLotteryClose = () => {
    setShowLottery(false);
    setCatMood('idle');
    refreshStats();
  };

  return (
    <div style={styles.page} ref={scrollRef}>
      <div style={styles.scrollContainer}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerMain}>
            <div style={styles.dateBadge}>
              <HiMiniSparkles size={14} />
              <span>今日学习手账</span>
            </div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={styles.dateText}
            >
              {dateInfo.month}月{dateInfo.day}日 · 周{dateInfo.weekDay}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={styles.yearText}
            >
              {dateInfo.year} · 当前主题 {themeMeta[theme]?.label}
            </motion.p>
          </div>
          <div style={styles.headerActions}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={cycleTheme}
              style={styles.recordBtn}
              aria-label="切换配色主题"
            >
              <span>{themeMeta[theme]?.icon || '🎨'}</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate('records')}
              style={styles.recordBtn}
            >
              <FiLayers size={18} />
            </motion.button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card"
          style={styles.heroCard}
        >
          <div style={styles.heroGlow} />
          <div style={styles.heroTopRow}>
            <div style={styles.heroLabel}>
              <FiMoon size={14} />
              <span>{todayChecked ? '今日记录已完成' : '继续积累今天的微光'}</span>
            </div>
            <div style={styles.heroThemeBadge}>
              <span>{themeMeta[theme]?.icon || '🎨'}</span>
              <span>{themeMeta[theme]?.label}</span>
            </div>
          </div>
          <div style={styles.heroTitleRow}>
            <div style={styles.heroIconWrap}>
              <FiBookOpen size={18} />
            </div>
            <div>
              <h3 style={styles.heroTitle}>每一次认真打卡，都在把理想写得更清晰</h3>
              <p style={styles.heroSubtitle}>保留一点仪式感，让学习更值得期待。</p>
            </div>
          </div>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={styles.statsRow}
        >
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="glass-card" style={styles.statCard}>
                <div style={{ ...styles.statIconWrap, color: item.accent }}>
                  <Icon size={16} />
                </div>
                <span style={styles.statValue}>{item.value}</span>
                <span style={styles.statLabel}>{item.label}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Streak progress to ultimate prize */}
        {stats?.streak?.current_streak > 0 && stats?.streak?.current_streak < 20 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
            style={styles.streakCard}
          >
            <div style={styles.streakHeader}>
              <div style={styles.streakTitleWrap}>
                <div style={styles.streakIconWrap}>
                  <FiGift size={14} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700 }}>神秘大礼进度</span>
              </div>
              <span style={styles.streakCount}>{stats.streak.current_streak}/20天</span>
            </div>
            <div style={styles.progressBar}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stats.streak.current_streak / 20) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                style={styles.progressFill}
              />
            </div>
            <div style={styles.streakFooter}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>连续打卡20天解锁神秘大礼</p>
              <span style={styles.streakRemain}>
                还差 {Math.max(20 - (stats?.streak?.current_streak || 0), 0)} 天
              </span>
            </div>
          </motion.div>
        )}

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
          style={styles.quoteCard}
        >
          <div style={styles.quoteHeader}>
            <div style={styles.quoteIconWrap}>
              <HiMiniSparkles size={14} />
            </div>
            <span style={styles.quoteLabel}>今日灵感</span>
          </div>
          <p style={styles.quoteText}>{quote}</p>
        </motion.div>

        {/* Cat Pet Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          style={styles.catArea}
        >
          <CatPet
            mood={catMood}
            onInteract={() => setQuote((currentQuote) => getNextQuote(currentQuote))}
          />
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={styles.actionArea}
        >
          {todayChecked ? (
            <div style={styles.checkedContainer}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                style={styles.checkedBadge}
              >
                <FiCheckCircle size={16} />
                <span>今日已打卡</span>
              </motion.div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                明天继续加油哦！
              </p>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setShowCheckin(true);
                setCatMood('excited');
              }}
              style={styles.checkinBtn}
            >
              <div style={styles.checkinBtnIcon}>
                <FiBookOpen size={18} />
              </div>
              <span style={styles.checkinBtnText}>开始打卡</span>
              <span style={styles.checkinBtnSub}>记录今天的努力</span>
              <div style={styles.checkinBtnArrow}>
                <FiArrowRight size={16} />
              </div>
              <div style={styles.btnShine} />
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCheckin && (
          <CheckinModal
            onClose={() => { setShowCheckin(false); setCatMood('idle'); }}
            onComplete={handleCheckinComplete}
            catMood={catMood}
            setCatMood={setCatMood}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLottery && checkinResult && (
          <LotteryWheel
            checkinId={checkinResult.checkinId}
            isWeekend={checkinResult.isWeekend}
            onClose={handleLotteryClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  page: {
    height: '100%',
    position: 'relative',
    zIndex: 1,
  },
  scrollContainer: {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 18px',
    paddingTop: 'calc(var(--safe-top) + 12px)',
    paddingBottom: 'calc(var(--safe-bottom) + 12px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  dateBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    padding: '5px 10px',
    borderRadius: 999,
    background: 'var(--c-primary-bg)',
    color: 'var(--primary-light)',
    fontSize: 11,
    fontWeight: 700,
    border: '1px solid var(--border)',
  },
  headerActions: {
    display: 'flex',
    gap: 8,
  },
  dateText: {
    fontSize: 24,
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  yearText: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  recordBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    boxShadow: 'var(--shadow)',
    color: 'var(--text-primary)',
  },
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    padding: '14px 15px 13px',
    marginBottom: 10,
  },
  heroGlow: {
    position: 'absolute',
    inset: 'auto -50px -70px auto',
    width: 180,
    height: 180,
    borderRadius: '50%',
    background: 'var(--c-gradient2)',
    filter: 'blur(20px)',
    opacity: 0.7,
    pointerEvents: 'none',
  },
  heroTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    position: 'relative',
    zIndex: 1,
  },
  heroLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 9px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: 11,
    fontWeight: 600,
  },
  heroThemeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: 'var(--text-muted)',
    fontSize: 11,
    fontWeight: 700,
  },
  heroTitleRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    position: 'relative',
    zIndex: 1,
  },
  heroIconWrap: {
    width: 34,
    height: 34,
    flexShrink: 0,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    color: '#fff',
    boxShadow: '0 10px 24px var(--c-glow)',
  },
  heroTitle: {
    fontSize: 16,
    lineHeight: 1.3,
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 1.45,
    color: 'var(--text-secondary)',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 10,
  },
  statCard: {
    padding: '10px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    minHeight: 86,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.08)',
  },
  statValue: {
    fontSize: 21,
    fontWeight: 800,
    background: 'linear-gradient(135deg, var(--text-primary), var(--primary-light))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  statLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  streakCard: {
    padding: '11px 13px',
    marginBottom: 10,
  },
  streakHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  streakIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
  },
  streakCount: {
    fontSize: 11,
    fontWeight: 800,
    color: 'var(--accent)',
  },
  progressBar: {
    height: 6,
    borderRadius: 4,
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    background: 'linear-gradient(90deg, var(--primary), var(--accent), var(--warning))',
  },
  streakFooter: {
    marginTop: 6,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  streakRemain: {
    padding: '3px 7px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--text-secondary)',
    background: 'rgba(255,255,255,0.06)',
  },
  quoteCard: {
    padding: '12px 14px',
    marginBottom: 8,
  },
  quoteHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  quoteIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    background: 'var(--c-primary-bg)',
    color: 'var(--primary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-muted)',
  },
  quoteText: {
    fontSize: 13,
    lineHeight: 1.5,
    color: 'var(--text-secondary)',
    fontWeight: 500,
    paddingLeft: 2,
  },
  catArea: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 8,
    minHeight: 170,
    flex: 1,
    alignItems: 'center',
  },
  actionArea: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  checkedContainer: {
    textAlign: 'center',
  },
  checkedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 22px',
    borderRadius: 14,
    background: 'rgba(52, 211, 153, 0.15)',
    border: '1px solid rgba(52, 211, 153, 0.3)',
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--success)',
  },
  checkinBtn: {
    position: 'relative',
    width: '100%',
    maxWidth: 320,
    padding: '14px 20px',
    borderRadius: 18,
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    boxShadow: '0 12px 32px var(--c-glow)',
  },
  checkinBtnIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.14)',
    marginBottom: 1,
  },
  checkinBtnText: {
    fontSize: 16,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '0.05em',
  },
  checkinBtnSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  checkinBtnArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 30,
    height: 30,
    borderRadius: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.14)',
  },
  btnShine: {
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    animation: 'shimmer 2s infinite',
  },
};
