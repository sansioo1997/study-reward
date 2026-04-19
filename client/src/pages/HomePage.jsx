import { useEffect, useMemo, useState, useRef } from 'react';
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
} from 'react-icons/fi';
import { HiMiniSparkles } from 'react-icons/hi2';
import CatPet from '../components/CatPet';
import CheckinModal from '../components/CheckinModal';
import LotteryWheel from '../components/LotteryWheel';
import { useTheme } from '../utils/theme';

function getNextQuote(items, currentQuote, preferredId) {
  const normalized = Array.isArray(items)
    ? items
        .map((item) => ({
          id: String(item?.id || '').trim(),
          text: String(item?.text || '').trim(),
        }))
        .filter((item) => item.text)
    : [];
  if (normalized.length === 0) return '';

  const preferredText =
    normalized.find((item) => item.id && item.id === preferredId)?.text ||
    normalized[0].text;

  if (!currentQuote) return preferredText;

  const candidates = normalized.map((item) => item.text).filter((quote) => quote !== currentQuote);
  const pool = candidates.length > 0 ? candidates : normalized.map((item) => item.text);
  return pool[Math.floor(Math.random() * pool.length)] || preferredText;
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
  const [showMakeupCheckin, setShowMakeupCheckin] = useState(false);
  const [showLottery, setShowLottery] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  const [catMood, setCatMood] = useState('idle');
  const [quote, setQuote] = useState('');
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 430,
    height: typeof window !== 'undefined' ? window.innerHeight : 932,
  }));
  const scrollRef = useRef(null);
  const moodResetTimerRef = useRef(null);
  const { theme, cycleTheme, themeMeta } = useTheme();

  const dateInfo = formatDate();
  const todayChecked = stats?.todayCheckin;
  const inspirationItems = useMemo(
    () => (Array.isArray(stats?.inspirationItems) ? stats.inspirationItems : []),
    [stats?.inspirationItems]
  );
  const preferredInspirationId = String(stats?.preferredInspirationId || '').trim();
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

  useEffect(() => () => clearTimeout(moodResetTimerRef.current), []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncViewport = () => {
      const visualViewport = window.visualViewport;
      setViewport({
        width: Math.round(visualViewport?.width || window.innerWidth || 430),
        height: Math.round(visualViewport?.height || window.innerHeight || 932),
      });
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('resize', syncViewport);

    return () => {
      window.removeEventListener('resize', syncViewport);
      window.visualViewport?.removeEventListener('resize', syncViewport);
    };
  }, []);

  useEffect(() => {
    setQuote(getNextQuote(inspirationItems, '', preferredInspirationId));
  }, [inspirationItems, preferredInspirationId]);

  const isCompactViewport = viewport.width <= 390 || viewport.height <= 780;
  const isUltraCompactViewport = viewport.width <= 375 || viewport.height <= 720;

  const holdCelebrationMood = (nextMood, duration = 14000) => {
    clearTimeout(moodResetTimerRef.current);
    setCatMood(nextMood);
    moodResetTimerRef.current = setTimeout(() => {
      setCatMood('idle');
    }, duration);
  };

  const handleCheckinComplete = (result) => {
    setCheckinResult({
      ...result,
      checkinId: Number(result?.checkinId),
    });
    setShowCheckin(false);
    setShowMakeupCheckin(false);
    holdCelebrationMood(result.isWeekend ? 'super_excited' : 'happy', result.isWeekend ? 18000 : 14000);
    refreshStats();
    // Auto show lottery after a delay
    setTimeout(() => {
      setShowLottery(true);
    }, 1500);
  };

  const handleLotteryClose = () => {
    setShowLottery(false);
    holdCelebrationMood(checkinResult?.isWeekend ? 'super_excited' : 'happy', checkinResult?.isWeekend ? 12000 : 9000);
    refreshStats();
  };

  return (
    <div style={styles.page} ref={scrollRef}>
      <div
        style={{
          ...styles.scrollContainer,
          ...(isCompactViewport ? styles.scrollContainerCompact : null),
          ...(isUltraCompactViewport ? styles.scrollContainerUltraCompact : null),
        }}
      >
        {/* Header */}
        <div
          style={{
            ...styles.header,
            ...(isCompactViewport ? styles.headerCompact : null),
          }}
        >
          <div
            style={{
              ...styles.headerMain,
              ...(isCompactViewport ? styles.headerMainCompact : null),
            }}
          >
            <div
              style={{
                ...styles.dateBadge,
                ...(isCompactViewport ? styles.dateBadgeCompact : null),
              }}
            >
              <HiMiniSparkles size={14} />
              <span>今日学习手账</span>
            </div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                ...styles.dateText,
                ...(isCompactViewport ? styles.dateTextCompact : null),
                ...(isUltraCompactViewport ? styles.dateTextUltraCompact : null),
              }}
            >
              {dateInfo.month}月{dateInfo.day}日 · 周{dateInfo.weekDay}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                ...styles.yearText,
                ...(isCompactViewport ? styles.yearTextCompact : null),
              }}
            >
              {dateInfo.year}
            </motion.p>
          </div>
          <div
            style={{
              ...styles.headerActions,
              ...(isCompactViewport ? styles.headerActionsCompact : null),
            }}
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={cycleTheme}
              style={{
                ...styles.recordBtn,
                ...(isCompactViewport ? styles.recordBtnCompact : null),
              }}
              aria-label="切换配色主题"
            >
              <span>{themeMeta[theme]?.icon || '🎨'}</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setShowMakeupCheckin(true);
                clearTimeout(moodResetTimerRef.current);
                setCatMood('focus');
              }}
              style={{
                ...styles.recordBtn,
                ...(isCompactViewport ? styles.recordBtnCompact : null),
              }}
              aria-label="补卡"
              title="补卡"
            >
              <FiCalendar size={18} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate('records')}
              style={{
                ...styles.recordBtn,
                ...(isCompactViewport ? styles.recordBtnCompact : null),
              }}
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
          style={{
            ...styles.heroCard,
            ...(isCompactViewport ? styles.heroCardCompact : null),
            ...(isUltraCompactViewport ? styles.heroCardUltraCompact : null),
          }}
        >
          <div style={styles.heroGlow} />
          <div
            style={{
              ...styles.heroTopRow,
              ...(isCompactViewport ? styles.heroTopRowCompact : null),
            }}
          >
            <div
              style={{
                ...styles.heroLabel,
                ...(isCompactViewport ? styles.heroLabelCompact : null),
              }}
            >
              <HiMiniSparkles size={14} />
              <span>今日灵感</span>
            </div>
          </div>
          <div
            style={{
              ...styles.heroTitleRow,
              ...(isCompactViewport ? styles.heroTitleRowCompact : null),
            }}
          >
            <div>
              <p
                style={{
                  ...styles.heroSubtitle,
                  ...(isCompactViewport ? styles.heroSubtitleCompact : null),
                }}
              >
                {quote || '请联系管理员配置今日灵感'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            ...styles.statsRow,
            ...(isCompactViewport ? styles.statsRowCompact : null),
          }}
        >
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="glass-card"
                style={{
                  ...styles.statCard,
                  ...(isCompactViewport ? styles.statCardCompact : null),
                }}
              >
                <div
                  style={{
                    ...styles.statIconWrap,
                    ...(isCompactViewport ? styles.statIconWrapCompact : null),
                    color: item.accent,
                  }}
                >
                  <Icon size={16} />
                </div>
                <span
                  style={{
                    ...styles.statValue,
                    ...(isCompactViewport ? styles.statValueCompact : null),
                  }}
                >
                  {item.value}
                </span>
                <span
                  style={{
                    ...styles.statLabel,
                    ...(isCompactViewport ? styles.statLabelCompact : null),
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* Total days progress to ultimate prize */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card"
          style={{
            ...styles.streakCard,
            ...(isCompactViewport ? styles.streakCardCompact : null),
          }}
        >
          <div style={styles.streakHeader}>
            <div style={styles.streakTitleWrap}>
              <div style={styles.streakIconWrap}>
                <FiGift size={14} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700 }}>神秘大礼进度</span>
            </div>
            <span style={styles.streakCount}>{stats?.streak?.total_days || 0}/25天</span>
          </div>
          <div style={styles.progressBar}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(((stats?.streak?.total_days || 0) / 25) * 100, 100)}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              style={styles.progressFill}
            />
          </div>
          <div style={styles.streakFooter}>
            <p style={{ fontSize: isCompactViewport ? 10 : 11, color: 'var(--text-muted)' }}>累计打卡25天解锁神秘大礼</p>
            <span style={styles.streakRemain}>
              {(stats?.streak?.total_days || 0) >= 25 ? '已达成目标' : `还差 ${Math.max(25 - (stats?.streak?.total_days || 0), 0)} 天`}
            </span>
          </div>
        </motion.div>

        {/* Cat Pet Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          style={{
            ...styles.catArea,
            ...(isCompactViewport ? styles.catAreaCompact : null),
            ...(isUltraCompactViewport ? styles.catAreaUltraCompact : null),
          }}
        >
          <CatPet
            mood={catMood}
            onInteract={() => {
              setQuote((currentQuote) => getNextQuote(inspirationItems, currentQuote, preferredInspirationId));
            }}
          />
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            ...styles.actionArea,
            ...(isCompactViewport ? styles.actionAreaCompact : null),
          }}
        >
          {todayChecked ? (
            <div
              style={{
                ...styles.checkedContainer,
                ...(isCompactViewport ? styles.checkedContainerCompact : null),
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                style={{
                  ...styles.checkedBadge,
                  ...(isCompactViewport ? styles.checkedBadgeCompact : null),
                }}
              >
                <FiCheckCircle size={16} />
                <span>今日已打卡</span>
              </motion.div>
              <p
                style={{
                  fontSize: isCompactViewport ? 12 : 13,
                  color: 'var(--text-secondary)',
                  marginTop: isCompactViewport ? 6 : 8,
                }}
              >
                明天继续加油哦！
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setShowMakeupCheckin(true);
                  clearTimeout(moodResetTimerRef.current);
                  setCatMood('focus');
                }}
                style={{
                  ...styles.makeupBtn,
                  ...(isCompactViewport ? styles.makeupBtnCompact : null),
                }}
              >
                <span>补卡</span>
              </motion.button>
            </div>
          ) : (
            <div style={styles.actionButtons}>
              <motion.button
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  setShowCheckin(true);
                  clearTimeout(moodResetTimerRef.current);
                  setCatMood('excited');
                }}
                style={{
                  ...styles.checkinBtn,
                  ...(isCompactViewport ? styles.checkinBtnCompact : null),
                  ...(isUltraCompactViewport ? styles.checkinBtnUltraCompact : null),
                }}
              >
                <div
                  style={{
                    ...styles.checkinBtnIcon,
                    ...(isCompactViewport ? styles.checkinBtnIconCompact : null),
                  }}
                >
                  <FiBookOpen size={18} />
                </div>
                <span
                  style={{
                    ...styles.checkinBtnText,
                    ...(isCompactViewport ? styles.checkinBtnTextCompact : null),
                  }}
                >
                  开始打卡
                </span>
                <span
                  style={{
                    ...styles.checkinBtnSub,
                    ...(isCompactViewport ? styles.checkinBtnSubCompact : null),
                  }}
                >
                  记录今天的努力
                </span>
                <div
                  style={{
                    ...styles.checkinBtnArrow,
                    ...(isCompactViewport ? styles.checkinBtnArrowCompact : null),
                  }}
                >
                  <FiArrowRight size={16} />
                </div>
                <div style={styles.btnShine} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setShowMakeupCheckin(true);
                  clearTimeout(moodResetTimerRef.current);
                  setCatMood('focus');
                }}
              style={{
                  ...styles.makeupBtn,
                  ...(isCompactViewport ? styles.makeupBtnCompact : null),
              }}
            >
                <span>补卡</span>
              </motion.button>
            </div>
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
        {showMakeupCheckin && (
          <CheckinModal
            mode="makeup"
            onClose={() => { setShowMakeupCheckin(false); setCatMood('idle'); }}
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
    minHeight: '100dvh',
    position: 'relative',
    zIndex: 1,
  },
  scrollContainer: {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 18px',
    paddingTop: 'max(calc(var(--safe-top) + 12px), 20px)',
    paddingBottom: 'calc(var(--safe-bottom) + 12px)',
  },
  scrollContainerCompact: {
    padding: '10px 16px 12px',
    paddingTop: 'max(calc(var(--safe-top) + 10px), 16px)',
  },
  scrollContainerUltraCompact: {
    padding: '8px 14px 10px',
    paddingTop: 'max(calc(var(--safe-top) + 8px), 14px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexShrink: 0,
  },
  headerCompact: {
    marginBottom: 8,
  },
  headerMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  headerMainCompact: {
    gap: 4,
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
  dateBadgeCompact: {
    padding: '4px 8px',
    fontSize: 10,
    gap: 5,
  },
  headerActions: {
    display: 'flex',
    gap: 8,
  },
  headerActionsCompact: {
    gap: 6,
  },
  dateText: {
    fontSize: 24,
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  dateTextCompact: {
    fontSize: 21,
    lineHeight: 1.15,
  },
  dateTextUltraCompact: {
    fontSize: 19,
  },
  yearText: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  yearTextCompact: {
    fontSize: 11,
    marginTop: 0,
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
  recordBtnCompact: {
    width: 38,
    height: 38,
    borderRadius: 12,
    fontSize: 16,
  },
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    padding: '12px 14px 11px',
    marginBottom: 8,
    flexShrink: 0,
  },
  heroCardCompact: {
    padding: '10px 12px 10px',
    marginBottom: 6,
  },
  heroCardUltraCompact: {
    padding: '9px 11px 9px',
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
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
    position: 'relative',
    zIndex: 1,
  },
  heroTopRowCompact: {
    gap: 7,
    marginBottom: 6,
  },
  heroLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 9px',
    flex: 1,
    minWidth: 0,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: 11,
    fontWeight: 600,
  },
  heroLabelCompact: {
    padding: '4px 8px',
    fontSize: 10,
  },
  heroThemeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    color: 'var(--text-muted)',
    fontSize: 11,
    fontWeight: 700,
  },
  heroThemeBadgeCompact: {
    fontSize: 10,
    gap: 5,
  },
  heroTitleRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    position: 'relative',
    zIndex: 1,
  },
  heroTitleRowCompact: {
    gap: 0,
  },
  heroTitle: {
    fontSize: 16,
    lineHeight: 1.3,
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  heroTitleCompact: {
    fontSize: 14,
    lineHeight: 1.2,
  },
  heroTitleUltraCompact: {
    fontSize: 13,
  },
  heroSubtitle: {
    marginTop: 0,
    fontSize: 17,
    lineHeight: 1.65,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  heroSubtitleCompact: {
    fontSize: 15,
    lineHeight: 1.55,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 8,
    flexShrink: 0,
  },
  statsRowCompact: {
    gap: 6,
    marginBottom: 6,
  },
  statCard: {
    padding: '8px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    minHeight: 76,
  },
  statCardCompact: {
    padding: '7px 6px',
    minHeight: 68,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.08)',
  },
  statIconWrapCompact: {
    width: 24,
    height: 24,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 19,
    fontWeight: 800,
    background: 'linear-gradient(135deg, var(--text-primary), var(--primary-light))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  statValueCompact: {
    fontSize: 17,
  },
  statLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  statLabelCompact: {
    fontSize: 9,
  },
  streakCard: {
    padding: '10px 12px',
    marginBottom: 8,
    flexShrink: 0,
  },
  streakCardCompact: {
    padding: '8px 10px',
    marginBottom: 6,
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
    padding: '10px 12px',
    marginBottom: 6,
    flexShrink: 0,
  },
  quoteCardCompact: {
    padding: '8px 10px',
    marginBottom: 4,
  },
  quoteHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  quoteIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 10,
    background: 'var(--c-primary-bg)',
    color: 'var(--primary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteIconWrapCompact: {
    width: 22,
    height: 22,
    borderRadius: 8,
  },
  quoteLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-muted)',
  },
  quoteLabelCompact: {
    fontSize: 11,
  },
  quoteText: {
    fontSize: 12.5,
    lineHeight: 1.4,
    color: 'var(--text-secondary)',
    fontWeight: 500,
    paddingLeft: 2,
  },
  quoteTextCompact: {
    fontSize: 11.5,
    lineHeight: 1.3,
  },
  catArea: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 4,
    minHeight: 170,
    flex: '1 1 auto',
    alignItems: 'center',
    minWidth: 0,
  },
  catAreaCompact: {
    minHeight: 156,
    marginBottom: 0,
  },
  catAreaUltraCompact: {
    minHeight: 146,
  },
  actionArea: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 'auto',
    flexShrink: 0,
  },
  actionButtons: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  actionAreaCompact: {
    paddingTop: 0,
  },
  checkedContainer: {
    textAlign: 'center',
    flexShrink: 0,
  },
  checkedContainerCompact: {
    paddingBottom: 2,
  },
  makeupBtn: {
    marginTop: 10,
    minWidth: 110,
    padding: '9px 16px',
    borderRadius: 14,
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 700,
    boxShadow: 'var(--shadow)',
  },
  makeupBtnCompact: {
    marginTop: 8,
    minWidth: 96,
    padding: '8px 14px',
    borderRadius: 12,
    fontSize: 12,
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
  checkedBadgeCompact: {
    padding: '8px 18px',
    borderRadius: 13,
    fontSize: 14,
    gap: 7,
  },
  checkinBtn: {
    position: 'relative',
    width: '100%',
    maxWidth: 288,
    padding: '12px 18px',
    borderRadius: 18,
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    boxShadow: '0 12px 32px var(--c-glow)',
  },
  checkinBtnCompact: {
    maxWidth: 260,
    padding: '10px 16px',
    borderRadius: 16,
    gap: 2,
  },
  checkinBtnUltraCompact: {
    maxWidth: 248,
    padding: '9px 14px',
    borderRadius: 15,
  },
  checkinBtnIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.14)',
    marginBottom: 1,
  },
  checkinBtnIconCompact: {
    width: 26,
    height: 26,
    borderRadius: 10,
    marginBottom: 0,
  },
  checkinBtnText: {
    fontSize: 15,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '0.05em',
  },
  checkinBtnTextCompact: {
    fontSize: 14,
  },
  checkinBtnSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  checkinBtnSubCompact: {
    fontSize: 9,
  },
  checkinBtnArrow: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 28,
    height: 28,
    borderRadius: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.14)',
  },
  checkinBtnArrowCompact: {
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
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
