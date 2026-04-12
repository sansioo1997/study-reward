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
  const { theme, cycleTheme, themeMeta } = useTheme();

  useEffect(() => {
    loadRecords();
  }, []);

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
      <div style={styles.header}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          style={styles.backBtn}
        >
          <FiArrowLeft size={16} />
          <span>返回</span>
        </motion.button>
        <div style={styles.headerTitleWrap}>
          <div style={styles.headerIconWrap}>
            <FiLayers size={16} />
          </div>
          <h2 style={styles.headerTitle}>打卡记录</h2>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={cycleTheme}
          style={styles.backBtn}
          aria-label="切换配色主题"
        >
          <span>{themeMeta[theme]?.icon || '🎨'}</span>
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={styles.heroCard}
      >
        <div style={styles.heroRow}>
          <div style={styles.heroBadge}>
            <HiMiniSparkles size={14} />
            <span>记录你的努力轨迹</span>
          </div>
          <div style={styles.heroTheme}>{themeMeta[theme]?.label}</div>
        </div>
        <h3 style={styles.heroTitle}>每一次打卡、每一份奖励，都会被认真收藏。</h3>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={styles.summaryRow}
      >
        <div className="glass-card" style={styles.summaryCard}>
          <div style={styles.summaryIconWrap}>
            <FiClock size={15} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>总学习</span>
          <span style={{ fontSize: 22, fontWeight: 800 }} className="gradient-text">
            {totalHours.toFixed(1)}h
          </span>
        </div>
        <div className="glass-card" style={styles.summaryCard}>
          <div style={styles.summaryIconWrap}>
            <FiCalendar size={15} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>打卡次数</span>
          <span style={{ fontSize: 22, fontWeight: 800 }} className="gradient-text">
            {records.length}
          </span>
        </div>
        <div className="glass-card" style={styles.summaryCard}>
          <div style={styles.summaryIconWrap}>
            <FiGift size={15} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>总奖励</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--warning)' }}>
            ¥{totalPrize.toFixed(0)}
          </span>
        </div>
      </motion.div>

      {/* Records List */}
      <div style={styles.listContainer}>
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
                border: record.is_weekend ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={styles.recordHeader}>
                <div style={styles.recordDate}>
                  <span style={styles.dateDay}>
                    {record.date.split('-')[2]}
                  </span>
                  <span style={styles.dateMonth}>
                    {record.date.split('-')[1]}月
                  </span>
                  {record.is_weekend === 1 && (
                    <span style={styles.weekendBadge}>周末</span>
                  )}
                </div>

                <div style={styles.recordInfo}>
                  <div style={styles.recordMain}>
                    <div style={styles.recordTopRow}>
                      <span style={{ fontSize: 24 }}>{MOOD_EMOJIS[record.mood] || '😊'}</span>
                      <span style={styles.hoursText}>{record.study_hours}h</span>
                    </div>
                    <div style={styles.recordMeta}>
                      <FiClock size={12} />
                      <span>{record.created_at?.slice(11, 16) || '已记录'}</span>
                    </div>
                  </div>
                  <div style={styles.recordRight}>
                    {record.prize_type && (
                      <span style={{
                        ...styles.prizeTag,
                        color: PRIZE_TAGS[record.prize_type]?.color,
                        background: PRIZE_TAGS[record.prize_type]?.bg,
                      }}>
                        {PRIZE_TAGS[record.prize_type]?.label}
                        {record.prize_amount && record.prize_type !== 'ultimate' ? ` ¥${record.prize_amount}` : ''}
                      </span>
                    )}

                    {!record.prize_type && (
                      <span style={styles.pendingTag}>待抽奖</span>
                    )}
                    <div style={styles.chevronWrap}>
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
                    style={styles.expandedContent}
                  >
                    {record.message && (
                      <p style={styles.messageText}>💬 {record.message}</p>
                    )}
                    {record.prize_detail && (
                      <p style={styles.prizeDetailText}>{record.prize_detail}</p>
                    )}
                    {!record.prize_type && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLotteryRecord(record);
                        }}
                        style={styles.reopenLotteryBtn}
                      >
                        <FiRefreshCcw size={14} />
                        补抽这次奖励
                      </button>
                    )}
                    <p style={styles.timeText}>
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
  headerTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
  },
  heroCard: {
    margin: '0 20px 16px',
    padding: '16px 18px',
  },
  heroRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
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
  heroTheme: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
  },
  heroTitle: {
    fontSize: 16,
    lineHeight: 1.55,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    padding: '0 20px 16px',
  },
  summaryCard: {
    padding: '12px 8px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
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
  listContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px',
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
  recordHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  recordDate: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 44,
    gap: 2,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--primary-light)',
  },
  dateMonth: {
    fontSize: 11,
    color: 'var(--text-muted)',
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
  recordMeta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  hoursText: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  recordRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  prizeTag: {
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 8,
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
  expandedContent: {
    overflow: 'hidden',
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  messageText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: 8,
  },
  prizeDetailText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 8,
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
  timeText: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
};
