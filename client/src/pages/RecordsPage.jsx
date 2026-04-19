import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiGift,
  FiLayers,
  FiRefreshCcw,
} from 'react-icons/fi';
import { HiMiniSparkles } from 'react-icons/hi2';
import { api } from '../utils/api';
import LotteryWheel from '../components/LotteryWheel';
import { useTheme } from '../utils/theme';

const PRIZE_TAGS = {
  cash: { label: '现金', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  blindbox: { label: '盲盒', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  custom: { label: '自选', color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
  ultimate: { label: '神秘大礼', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

const GIFT_STATUS_TAGS = {
  '待发货': { color: '#f59e0b', bg: 'rgba(245,158,11,0.16)' },
  '发货中': { color: '#60a5fa', bg: 'rgba(96,165,250,0.16)' },
  '已完成': { color: '#34d399', bg: 'rgba(52,211,153,0.16)' },
};

const MOOD_EMOJIS = {
  happy: '😊',
  fighting: '😤',
  thinking: '🤔',
  tired: '😫',
  calm: '😌',
  excited: '🥳',
  anxious: '😰',
  fulfilled: '💪',
};

export default function RecordsPage({ onBack }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [lotteryRecord, setLotteryRecord] = useState(null);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 430,
    height: typeof window !== 'undefined' ? window.innerHeight : 932,
  }));
  const { theme, cycleTheme, themeMeta } = useTheme();

  useEffect(() => {
    loadRecords();
  }, []);

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

  const isCompactViewport = viewport.width <= 390 || viewport.height <= 780;

  const loadRecords = async () => {
    try {
      const data = await api.getRecords();
      setRecords(data.records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLotteryClose = async () => {
    setLotteryRecord(null);
    setSelectedRecord(null);
    await loadRecords();
  };

  // Calculate total stats
  const totalHours = records.reduce((sum, r) => sum + r.study_hours, 0);
  const totalPrize = records.reduce((sum, r) => {
    if (r.prize_type === 'ultimate') return sum;
    return sum + (r.prize_amount || 0);
  }, 0);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={{ ...styles.header, ...(isCompactViewport ? styles.headerCompact : null) }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          style={{ ...styles.backBtn, ...(isCompactViewport ? styles.backBtnCompact : null) }}
        >
          <FiArrowLeft size={16} />
          <span>返回</span>
        </motion.button>
        <div style={{ ...styles.headerTitleWrap, ...(isCompactViewport ? styles.headerTitleWrapCompact : null) }}>
          <div style={{ ...styles.headerIconWrap, ...(isCompactViewport ? styles.headerIconWrapCompact : null) }}>
            <FiLayers size={16} />
          </div>
          <h2 style={{ ...styles.headerTitle, ...(isCompactViewport ? styles.headerTitleCompact : null) }}>打卡记录</h2>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={cycleTheme}
          style={{ ...styles.backBtn, ...(isCompactViewport ? styles.backBtnCompact : null) }}
          aria-label="切换配色主题"
        >
          <span>{themeMeta[theme]?.icon || '🎨'}</span>
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ ...styles.heroCard, ...(isCompactViewport ? styles.heroCardCompact : null) }}
      >
        <div style={{ ...styles.heroRow, ...(isCompactViewport ? styles.heroRowCompact : null) }}>
          <div style={{ ...styles.heroBadge, ...(isCompactViewport ? styles.heroBadgeCompact : null) }}>
            <HiMiniSparkles size={14} />
            <span>记录你的努力轨迹</span>
          </div>
          <div style={{ ...styles.heroTheme, ...(isCompactViewport ? styles.heroThemeCompact : null) }}>{themeMeta[theme]?.label}</div>
        </div>
        <h3 style={{ ...styles.heroTitle, ...(isCompactViewport ? styles.heroTitleCompact : null) }}>
          每一次打卡、每一份奖励，都会被认真收藏。
        </h3>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ ...styles.summaryRow, ...(isCompactViewport ? styles.summaryRowCompact : null) }}
      >
        <div className="glass-card" style={{ ...styles.summaryCard, ...(isCompactViewport ? styles.summaryCardCompact : null) }}>
          <div style={{ ...styles.summaryIconWrap, ...(isCompactViewport ? styles.summaryIconWrapCompact : null) }}>
            <FiClock size={15} />
          </div>
          <span style={{ fontSize: isCompactViewport ? 11 : 13, color: 'var(--text-muted)' }}>总学习</span>
          <span style={{ fontSize: isCompactViewport ? 18 : 22, fontWeight: 800 }} className="gradient-text">
            {totalHours.toFixed(1)}h
          </span>
        </div>
        <div className="glass-card" style={{ ...styles.summaryCard, ...(isCompactViewport ? styles.summaryCardCompact : null) }}>
          <div style={{ ...styles.summaryIconWrap, ...(isCompactViewport ? styles.summaryIconWrapCompact : null) }}>
            <FiCalendar size={15} />
          </div>
          <span style={{ fontSize: isCompactViewport ? 11 : 13, color: 'var(--text-muted)' }}>打卡次数</span>
          <span style={{ fontSize: isCompactViewport ? 18 : 22, fontWeight: 800 }} className="gradient-text">
            {records.length}
          </span>
        </div>
        <div className="glass-card" style={{ ...styles.summaryCard, ...(isCompactViewport ? styles.summaryCardCompact : null) }}>
          <div style={{ ...styles.summaryIconWrap, ...(isCompactViewport ? styles.summaryIconWrapCompact : null) }}>
            <FiGift size={15} />
          </div>
          <span style={{ fontSize: isCompactViewport ? 11 : 13, color: 'var(--text-muted)' }}>总奖励</span>
          <span style={{ fontSize: isCompactViewport ? 18 : 22, fontWeight: 800, color: 'var(--warning)' }}>
            ¥{totalPrize.toFixed(0)}
          </span>
        </div>
      </motion.div>

      {/* Records List */}
      <div style={{ ...styles.listContainer, ...(isCompactViewport ? styles.listContainerCompact : null) }}>
        {loading ? (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}
          >
            加载中...
          </motion.div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={styles.emptyIconWrap}>
              <FiLayers size={24} />
            </div>
            <p>还没有打卡记录</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>开始你的第一次打卡吧！</p>
          </div>
        ) : (
          records.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
              className="glass-card"
              style={{
                ...styles.recordCard,
                ...(isCompactViewport ? styles.recordCardCompact : null),
                border: record.is_weekend ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ ...styles.recordHeader, ...(isCompactViewport ? styles.recordHeaderCompact : null) }}>
                <div style={{ ...styles.recordDate, ...(isCompactViewport ? styles.recordDateCompact : null) }}>
                  <span style={{ ...styles.dateDay, ...(isCompactViewport ? styles.dateDayCompact : null) }}>
                    {record.date.split('-')[2]}
                  </span>
                  <span style={{ ...styles.dateMonth, ...(isCompactViewport ? styles.dateMonthCompact : null) }}>
                    {record.date.split('-')[1]}月
                  </span>
                  {record.is_weekend === 1 && (
                    <span style={styles.weekendBadge}>周末</span>
                  )}
                </div>

                <div style={styles.recordInfo}>
                  <div style={styles.recordMain}>
                    <div style={{ ...styles.recordTopRow, ...(isCompactViewport ? styles.recordTopRowCompact : null) }}>
                      <span style={{ fontSize: isCompactViewport ? 20 : 24 }}>{MOOD_EMOJIS[record.mood] || '😊'}</span>
                      <span style={{ ...styles.hoursText, ...(isCompactViewport ? styles.hoursTextCompact : null) }}>{record.study_hours}h</span>
                    </div>
                    <div style={{ ...styles.recordMeta, ...(isCompactViewport ? styles.recordMetaCompact : null) }}>
                      <FiClock size={12} />
                      <span>{record.created_at?.slice(11, 16) || '已记录'}</span>
                    </div>
                  </div>
                  <div style={styles.recordRight}>
                    {record.prize_type && (
                      <div style={styles.tagGroup}>
                        <span style={{
                          ...styles.prizeTag,
                          ...(isCompactViewport ? styles.prizeTagCompact : null),
                          color: PRIZE_TAGS[record.prize_type]?.color,
                          background: PRIZE_TAGS[record.prize_type]?.bg,
                        }}>
                          {PRIZE_TAGS[record.prize_type]?.label}
                          {record.prize_amount && record.prize_type !== 'ultimate' ? ` ¥${record.prize_amount}` : ''}
                        </span>
                        {record.gift_status && ['blindbox', 'custom', 'ultimate'].includes(record.prize_type) && (
                          <span style={{
                            ...styles.statusTag,
                            ...(isCompactViewport ? styles.prizeTagCompact : null),
                            color: GIFT_STATUS_TAGS[record.gift_status]?.color || '#94a3b8',
                            background: GIFT_STATUS_TAGS[record.gift_status]?.bg || 'rgba(148,163,184,0.16)',
                          }}>
                            {record.gift_status}
                          </span>
                        )}
                      </div>
                    )}

                    {!record.prize_type && (
                      <span style={{ ...styles.pendingTag, ...(isCompactViewport ? styles.prizeTagCompact : null) }}>待抽奖</span>
                    )}
                    <div style={{ ...styles.chevronWrap, ...(isCompactViewport ? styles.chevronWrapCompact : null) }}>
                      {selectedRecord?.id === record.id ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {selectedRecord?.id === record.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ ...styles.expandedContent, ...(isCompactViewport ? styles.expandedContentCompact : null) }}
                  >
                    {record.message && (
                      <p style={{ ...styles.messageText, ...(isCompactViewport ? styles.messageTextCompact : null) }}>💬 {record.message}</p>
                    )}
                    {record.prize_detail && (
                      <p style={{ ...styles.prizeDetailText, ...(isCompactViewport ? styles.messageTextCompact : null) }}>{record.prize_detail}</p>
                    )}
                    {record.gift_status && ['blindbox', 'custom', 'ultimate'].includes(record.prize_type) && (
                      <p style={{ ...styles.statusText, ...(isCompactViewport ? styles.messageTextCompact : null) }}>
                        礼物进度：{record.gift_status}
                      </p>
                    )}
                    {!record.prize_type && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLotteryRecord(record);
                        }}
                        style={{ ...styles.reopenLotteryBtn, ...(isCompactViewport ? styles.reopenLotteryBtnCompact : null) }}
                      >
                        <FiRefreshCcw size={14} />
                        补抽这次奖励
                      </button>
                    )}
                    <p style={{ ...styles.timeText, ...(isCompactViewport ? styles.timeTextCompact : null) }}>
                      打卡时间: {record.created_at}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
        <div style={{ height: 40 }} />
      </div>

      <AnimatePresence>
        {lotteryRecord && (
          <LotteryWheel
            checkinId={lotteryRecord.id}
            isWeekend={lotteryRecord.is_weekend === 1}
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
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    paddingTop: 'calc(var(--safe-top) + 16px)',
  },
  headerCompact: {
    padding: '12px 16px',
    paddingTop: 'calc(var(--safe-top) + 12px)',
  },
  backBtn: {
    minWidth: 48,
    padding: '9px 14px',
    borderRadius: 14,
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: 14,
    border: '1px solid var(--border)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: 'var(--shadow)',
  },
  backBtnCompact: {
    padding: '8px 12px',
    borderRadius: 12,
    fontSize: 13,
    gap: 6,
  },
  headerTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleWrapCompact: {
    gap: 6,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--c-primary-bg)',
    color: 'var(--primary-light)',
  },
  headerIconWrapCompact: {
    width: 28,
    height: 28,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
  },
  headerTitleCompact: {
    fontSize: 16,
  },
  heroCard: {
    margin: '0 20px 16px',
    padding: '16px 18px',
  },
  heroCardCompact: {
    margin: '0 16px 10px',
    padding: '12px 14px',
  },
  heroRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  heroRowCompact: {
    marginBottom: 8,
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 999,
    background: 'var(--c-primary-bg)',
    color: 'var(--primary-light)',
    fontSize: 11,
    fontWeight: 700,
  },
  heroBadgeCompact: {
    padding: '5px 9px',
    fontSize: 10,
  },
  heroTheme: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
  },
  heroThemeCompact: {
    fontSize: 10,
  },
  heroTitle: {
    fontSize: 16,
    lineHeight: 1.55,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  heroTitleCompact: {
    fontSize: 14,
    lineHeight: 1.35,
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    padding: '0 20px 16px',
  },
  summaryRowCompact: {
    gap: 8,
    padding: '0 16px 10px',
  },
  summaryCard: {
    padding: '12px 8px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  summaryCardCompact: {
    padding: '9px 6px',
    gap: 3,
  },
  summaryIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary-light)',
    background: 'var(--c-primary-bg)',
    marginBottom: 4,
  },
  summaryIconWrapCompact: {
    width: 26,
    height: 26,
    borderRadius: 10,
    marginBottom: 2,
  },
  listContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px',
  },
  listContainerCompact: {
    padding: '0 16px',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary-light)',
    background: 'var(--c-primary-bg)',
    marginBottom: 16,
  },
  recordCard: {
    padding: '15px 16px',
    marginBottom: 10,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  recordCardCompact: {
    padding: '12px 13px',
    marginBottom: 8,
  },
  recordHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  recordHeaderCompact: {
    gap: 10,
  },
  recordDate: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 44,
    gap: 2,
  },
  recordDateCompact: {
    minWidth: 38,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--primary-light)',
  },
  dateDayCompact: {
    fontSize: 19,
  },
  dateMonth: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  dateMonthCompact: {
    fontSize: 10,
  },
  weekendBadge: {
    fontSize: 9,
    padding: '1px 6px',
    borderRadius: 6,
    background: 'rgba(251,191,36,0.2)',
    color: 'var(--warning)',
    fontWeight: 700,
    marginTop: 2,
  },
  recordInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  recordMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  recordTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  recordTopRowCompact: {
    gap: 6,
  },
  recordMeta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  recordMetaCompact: {
    fontSize: 10,
  },
  hoursText: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  hoursTextCompact: {
    fontSize: 14,
  },
  recordRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  tagGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  prizeTag: {
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 8,
  },
  statusTag: {
    fontSize: 11,
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: 8,
  },
  prizeTagCompact: {
    fontSize: 11,
    padding: '3px 8px',
    borderRadius: 7,
  },
  pendingTag: {
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 8,
    color: '#7dd3fc',
    background: 'rgba(125,211,252,0.14)',
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    background: 'rgba(255,255,255,0.05)',
  },
  chevronWrapCompact: {
    width: 24,
    height: 24,
    borderRadius: 8,
  },
  expandedContent: {
    overflow: 'hidden',
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  expandedContentCompact: {
    marginTop: 10,
    paddingTop: 10,
  },
  messageText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: 8,
  },
  messageTextCompact: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 7,
  },
  prizeDetailText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 8,
    fontWeight: 700,
  },
  reopenLotteryBtn: {
    marginBottom: 10,
    padding: '10px 14px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  reopenLotteryBtnCompact: {
    marginBottom: 8,
    padding: '8px 12px',
    borderRadius: 10,
    fontSize: 12,
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  timeTextCompact: {
    fontSize: 10,
  },
};
