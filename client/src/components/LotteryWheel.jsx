import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAward, FiBox, FiDollarSign, FiGift, FiX } from 'react-icons/fi';
import { HiMiniSparkles } from 'react-icons/hi2';
import { api } from '../utils/api';

const PRIZE_COLORS = {
  cash: { bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', icon: FiDollarSign },
  blindbox: { bg: 'linear-gradient(135deg, #a78bfa, #7c5cfc)', icon: FiBox },
  custom: { bg: 'linear-gradient(135deg, #f472b6, #ec4899)', icon: FiGift },
  ultimate: { bg: 'linear-gradient(135deg, #fbbf24, #ef4444, #ec4899)', icon: FiAward },
};

const SLOT_ITEMS = ['💰', '📦', '🎁', '👜', '⭐', '🎉', '💎', '🌟'];
const PRIZE_PREVIEW = [
  { icon: FiDollarSign, label: '现金奖励', detail: '按学习时长解锁奖励' },
  { icon: FiBox, label: '惊喜盲盒', detail: '打开一份随机小惊喜' },
  { icon: FiGift, label: '心愿礼物', detail: '心愿单里挑一份' },
  { icon: FiAward, label: '神秘大礼', detail: '连续坚持触发彩蛋' },
];

export default function LotteryWheel({ checkinId, isWeekend, onClose }) {
  const [phase, setPhase] = useState('intro'); // intro, spinning, reveal
  const [prize, setPrize] = useState(null);
  const [error, setError] = useState('');
  const [slotValues, setSlotValues] = useState([0, 0, 0]);
  const [confettiParticles, setConfettiParticles] = useState([]);
  const spinTimers = useRef([]);

  // Generate confetti
  const fireConfetti = useCallback(() => {
    const particles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ['#fbbf24', '#f472b6', '#7c5cfc', '#34d399', '#ef4444', '#06b6d4'][Math.floor(Math.random() * 6)],
      delay: Math.random() * 0.5,
      duration: Math.random() * 1.5 + 1,
      size: Math.random() * 8 + 4,
      rotate: Math.random() * 360,
    }));
    setConfettiParticles(particles);
  }, []);

  const startSpin = useCallback(async () => {
    setPhase('spinning');
    setError('');
    
    // Start all 3 slots spinning
    const intervals = [0, 1, 2].map(i => {
      return setInterval(() => {
        setSlotValues(prev => {
          const next = [...prev];
          next[i] = (next[i] + 1) % SLOT_ITEMS.length;
          return next;
        });
      }, 80 + i * 20);
    });
    spinTimers.current = intervals;

    // Get actual prize from API
    try {
      const result = await api.lottery(checkinId);
      setPrize(result);
      
      // Stop slots one by one with delay
      const targetIdx = result.prizeType === 'cash' ? 0 
        : result.prizeType === 'blindbox' ? 1
        : result.prizeType === 'custom' ? 2
        : 3;

      // Stop slot 1
      setTimeout(() => {
        clearInterval(intervals[0]);
        setSlotValues(prev => { const n = [...prev]; n[0] = targetIdx; return n; });
      }, 1000);

      // Stop slot 2
      setTimeout(() => {
        clearInterval(intervals[1]);
        setSlotValues(prev => { const n = [...prev]; n[1] = targetIdx; return n; });
      }, 1800);

      // Stop slot 3 and reveal
      setTimeout(() => {
        clearInterval(intervals[2]);
        setSlotValues(prev => { const n = [...prev]; n[2] = targetIdx; return n; });
        setTimeout(() => {
          setPhase('reveal');
          fireConfetti();
        }, 500);
      }, 2500);

    } catch (err) {
      clearInterval(intervals[0]);
      clearInterval(intervals[1]);
      clearInterval(intervals[2]);
      setPhase('intro');
      setError(err.message || '抽奖失败，请稍后再试');
    }
  }, [checkinId, fireConfetti]);

  useEffect(() => {
    return () => spinTimers.current.forEach(t => clearInterval(t));
  }, []);

  const canClose = phase !== 'spinning';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={styles.overlay}
      onClick={(e) => {
        if (canClose && e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: 'spring', damping: 20 }}
        style={styles.container}
      >
        <button
          type="button"
          aria-label="关闭抽奖弹窗"
          onClick={onClose}
          disabled={!canClose}
          style={{
            ...styles.closeIconBtn,
            opacity: canClose ? 1 : 0.45,
            cursor: canClose ? 'pointer' : 'not-allowed',
          }}
        >
          <FiX size={18} />
        </button>

        {/* Confetti */}
        {confettiParticles.map(p => (
          <motion.div
            key={p.id}
            initial={{ 
              x: `${p.x}%`, 
              y: -20, 
              rotate: 0,
              opacity: 1 
            }}
            animate={{ 
              y: 500,
              rotate: p.rotate + 360,
              opacity: 0 
            }}
            transition={{ 
              duration: p.duration, 
              delay: p.delay,
              ease: 'easeIn'
            }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: p.size > 6 ? 2 : '50%',
              background: p.color,
              zIndex: 10,
              pointerEvents: 'none',
            }}
          />
        ))}

        <AnimatePresence mode="wait">
          {/* Intro phase */}
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={styles.phaseContent}
            >
              <div style={styles.introIconWrap}>
                <motion.div
                  animate={{ scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={styles.introIcon}
                >
                  <HiMiniSparkles size={34} />
                </motion.div>
              </div>
              <h2 style={styles.title}>
                {isWeekend ? '🔥 周末特别抽奖！' : '✨ 打卡抽奖时间！'}
              </h2>
              <p style={styles.subtitle}>
                {isWeekend 
                  ? '周末也坚持学习，运气一定超好！' 
                  : '今日打卡完成，来试试手气吧！'}
              </p>
              
              {/* Prize pool preview */}
              <div style={styles.prizePool}>
                {PRIZE_PREVIEW.map((item) => (
                  <div key={item.label} style={styles.poolItem}>
                    <div style={styles.poolItemIcon}>
                      <item.icon size={16} />
                    </div>
                    <span style={styles.poolItemTitle}>{item.label}</span>
                    <span style={styles.poolItemDetail}>{item.detail}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={startSpin}
                style={styles.spinBtn}
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  style={styles.spinBtnIcon}
                >
                  <HiMiniSparkles size={16} />
                </motion.span>
                {' '}开始抽奖
              </motion.button>

              {error && <p style={styles.errorText}>{error}</p>}
            </motion.div>
          )}

          {/* Spinning phase */}
          {phase === 'spinning' && (
            <motion.div
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.phaseContent}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
                抽奖中...
              </h3>
              <div style={styles.slotMachine}>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    style={styles.slotWindow}
                  >
                    <motion.span
                      key={slotValues[i]}
                      initial={{ y: -30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      style={{ fontSize: 48, display: 'block' }}
                    >
                      {SLOT_ITEMS[slotValues[i]]}
                    </motion.span>
                  </motion.div>
                ))}
              </div>
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 16 }}
              >
                命运的齿轮开始转动...
              </motion.p>
            </motion.div>
          )}

          {/* Reveal phase */}
          {phase === 'reveal' && prize && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              style={styles.phaseContent}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  ...styles.prizeIcon,
                  background: PRIZE_COLORS[prize.prizeType]?.bg || PRIZE_COLORS.cash.bg,
                }}
              >
                {(() => {
                  const PrizeIcon = PRIZE_COLORS[prize.prizeType]?.icon || FiGift;
                  return <PrizeIcon size={44} />;
                })()}
              </motion.div>

              <motion.h2
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                style={{
                  ...styles.prizeTitle,
                  background: PRIZE_COLORS[prize.prizeType]?.bg || PRIZE_COLORS.cash.bg,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {prize.prizeType === 'ultimate' ? '🏆 终极大奖！！！' :
                 prize.prizeType === 'custom' ? '🌟 超级幸运！' :
                 prize.prizeType === 'blindbox' ? '📦 盲盒来啦！' :
                 '💰 恭喜获奖！'}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={styles.prizeDetail}
              >
                {prize.prizeDetail}
              </motion.p>

              {prize.amount > 0 && prize.prizeType !== 'ultimate' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  style={styles.amountBadge}
                >
                  ¥{prize.amount.toFixed(0)}
                </motion.div>
              )}

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                style={styles.closeBtn}
              >
                太开心了！收下奖励 🎉
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%)',
    borderRadius: 28,
    padding: '32px 24px',
    border: '1px solid rgba(255,255,255,0.1)',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 400,
  },
  phaseContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
  },
  introIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    marginBottom: 4,
  },
  introIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    color: '#fff',
    boxShadow: '0 12px 26px rgba(124, 92, 252, 0.24)',
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  prizePool: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
    width: '100%',
  },
  poolItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    fontSize: 24,
    textAlign: 'center',
    padding: '12px 10px',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    minHeight: 96,
  },
  poolItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  poolItemTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  poolItemDetail: {
    fontSize: 11,
    lineHeight: 1.4,
    color: 'var(--text-muted)',
  },
  spinBtn: {
    marginTop: 8,
    padding: '16px 40px',
    borderRadius: 18,
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    color: '#fff',
    fontWeight: 800,
    fontSize: 18,
    boxShadow: '0 8px 30px rgba(124, 92, 252, 0.4)',
    animation: 'pulse-glow 2s infinite',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  spinBtnIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontSize: 18,
    lineHeight: 1,
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotMachine: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  slotWindow: {
    width: 80,
    height: 90,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.06)',
    border: '2px solid rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  prizeIcon: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 40px rgba(124, 92, 252, 0.4)',
  },
  prizeTitle: {
    fontSize: 24,
    fontWeight: 900,
  },
  prizeDetail: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    padding: '0 8px',
  },
  amountBadge: {
    fontSize: 36,
    fontWeight: 900,
    color: 'var(--warning)',
    textShadow: '0 2px 10px rgba(251, 191, 36, 0.3)',
    marginTop: 4,
  },
  closeBtn: {
    marginTop: 16,
    padding: '14px 32px',
    borderRadius: 16,
    background: 'linear-gradient(135deg, var(--success), #06b6d4)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    boxShadow: '0 4px 20px rgba(52, 211, 153, 0.3)',
  },
  errorText: {
    fontSize: 13,
    color: 'var(--danger)',
    textAlign: 'center',
    lineHeight: 1.5,
    marginTop: 4,
  },
};
