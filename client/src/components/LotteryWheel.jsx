import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAward, FiBox, FiCheckCircle, FiDollarSign, FiGift, FiX } from 'react-icons/fi';
import {
  HiMiniBanknotes,
  HiMiniCube,
  HiMiniGift,
  HiMiniSparkles,
  HiMiniStar,
  HiMiniTrophy,
} from 'react-icons/hi2';
import { api } from '../utils/api';

const PRIZE_COLORS = {
  cash: { bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', icon: FiDollarSign },
  blindbox: { bg: 'linear-gradient(135deg, var(--primary), var(--accent))', icon: FiBox },
  custom: { bg: 'linear-gradient(135deg, var(--accent), #ec4899)', icon: FiGift },
  ultimate: { bg: 'linear-gradient(135deg, #fbbf24, var(--accent), var(--primary))', icon: FiAward },
};

const SLOT_ITEMS = [
  { icon: HiMiniBanknotes, color: '#f59e0b' },
  { icon: HiMiniCube, color: 'var(--primary)' },
  { icon: HiMiniGift, color: 'var(--accent)' },
  { icon: HiMiniTrophy, color: '#f97316' },
  { icon: HiMiniStar, color: '#fbbf24' },
  { icon: HiMiniSparkles, color: 'var(--primary-light)' },
  { icon: FiGift, color: 'var(--accent)' },
  { icon: FiAward, color: 'var(--warning)' },
];
const PRIZE_PREVIEW = [
  { icon: FiDollarSign, label: '现金奖励', detail: '认真学习就有机会解锁' },
  { icon: FiBox, label: '惊喜盲盒', detail: '拆开一份今日好心情' },
  { icon: FiGift, label: '心愿礼物', detail: '让小愿望被温柔实现' },
  { icon: FiAward, label: '神秘大礼', detail: '坚持越久，越容易触发彩蛋' },
];
const SPIN_STAGES = ['好运校准中', '奖励池转动中', '马上揭晓', '结果生成中'];

export default function LotteryWheel({ checkinId, isWeekend, onClose }) {
  const [phase, setPhase] = useState('intro');
  const [prize, setPrize] = useState(null);
  const [error, setError] = useState('');
  const [slotValues, setSlotValues] = useState([0, 0, 0]);
  const [confettiParticles, setConfettiParticles] = useState([]);
  const [spinStage, setSpinStage] = useState(SPIN_STAGES[0]);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 430,
    height: typeof window !== 'undefined' ? window.innerHeight : 932,
  }));
  const spinTimers = useRef([]);

  const fireConfetti = useCallback(() => {
    const particles = Array.from({ length: 44 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ['var(--warning)', 'var(--accent)', 'var(--primary)', 'var(--success)', '#f97316', '#38bdf8'][Math.floor(Math.random() * 6)],
      delay: Math.random() * 0.45,
      duration: Math.random() * 1.3 + 1.1,
      size: Math.random() * 8 + 4,
      rotate: Math.random() * 360,
    }));
    setConfettiParticles(particles);
  }, []);

  const startSpin = useCallback(async () => {
    setPhase('spinning');
    setError('');
    setSpinStage(SPIN_STAGES[0]);

    const intervals = [0, 1, 2].map((i) => setInterval(() => {
      setSlotValues((prev) => {
        const next = [...prev];
        next[i] = (next[i] + 1) % SLOT_ITEMS.length;
        return next;
      });
    }, 85 + i * 25));
    spinTimers.current = intervals;

    try {
      const result = await api.lottery(Number(checkinId));
      setPrize(result);

      const targetIdx = result.prizeType === 'cash' ? 0
        : result.prizeType === 'blindbox' ? 1
        : result.prizeType === 'custom' ? 2
        : 3;

      setSpinStage(SPIN_STAGES[1]);

      setTimeout(() => {
        clearInterval(intervals[0]);
        setSpinStage('第一格落位');
        setSlotValues((prev) => {
          const next = [...prev];
          next[0] = targetIdx;
          return next;
        });
      }, 1000);

      setTimeout(() => {
        clearInterval(intervals[1]);
        setSpinStage('第二格落位');
        setSlotValues((prev) => {
          const next = [...prev];
          next[1] = targetIdx;
          return next;
        });
      }, 1750);

      setTimeout(() => {
        clearInterval(intervals[2]);
        setSpinStage(SPIN_STAGES[2]);
        setSlotValues((prev) => {
          const next = [...prev];
          next[2] = targetIdx;
          return next;
        });
        setTimeout(() => {
          setSpinStage(SPIN_STAGES[3]);
          setPhase('reveal');
          fireConfetti();
        }, 420);
      }, 2450);
    } catch (err) {
      intervals.forEach((timer) => clearInterval(timer));
      setPhase('intro');
      setSpinStage(SPIN_STAGES[0]);
      setError(err.message || '抽奖失败，请稍后再试');
    }
  }, [checkinId, fireConfetti]);

  useEffect(() => () => spinTimers.current.forEach((timer) => clearInterval(timer)), []);

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

  const canClose = phase !== 'spinning';
  const isCompactViewport = viewport.width <= 390 || viewport.height <= 780;

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
      <div style={styles.overlayGlowLeft} />
      <div style={styles.overlayGlowRight} />

      <motion.div
        initial={{ scale: 0.86, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
        transition={{ type: 'spring', damping: 20 }}
        style={{ ...styles.container, ...(isCompactViewport ? styles.containerCompact : null) }}
      >
        <div style={styles.panelGlow} />
        <div style={styles.panelOrbit} />

        <button
          type="button"
          aria-label="关闭抽奖弹窗"
          onClick={onClose}
          disabled={!canClose}
          style={{
            ...styles.closeIconBtn,
            ...(isCompactViewport ? styles.closeIconBtnCompact : null),
            opacity: canClose ? 1 : 0.45,
            cursor: canClose ? 'pointer' : 'not-allowed',
          }}
        >
          <FiX size={18} />
        </button>

        {confettiParticles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ x: `${particle.x}%`, y: -20, rotate: 0, opacity: 1 }}
            animate={{ y: 520, rotate: particle.rotate + 360, opacity: 0 }}
            transition={{ duration: particle.duration, delay: particle.delay, ease: 'easeIn' }}
            style={{
              position: 'absolute',
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size > 6 ? 2 : '50%',
              background: particle.color,
              zIndex: 10,
              pointerEvents: 'none',
            }}
          />
        ))}

        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ ...styles.phaseContent, ...(isCompactViewport ? styles.phaseContentCompact : null) }}
            >
              <div style={{ ...styles.topBadge, ...(isCompactViewport ? styles.topBadgeCompact : null) }}>
                <HiMiniSparkles size={14} />
                <span>{isWeekend ? '周末加码好运' : '今日幸运时刻'}</span>
              </div>

              <div style={{ ...styles.introIconWrap, ...(isCompactViewport ? styles.introIconWrapCompact : null) }}>
                <motion.div
                  animate={{ scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ ...styles.introIcon, ...(isCompactViewport ? styles.introIconCompact : null) }}
                >
                  <HiMiniSparkles size={30} />
                </motion.div>
              </div>

              <h2 style={{ ...styles.title, ...(isCompactViewport ? styles.titleCompact : null) }}>{isWeekend ? '周末特别抽奖' : '打卡抽奖时间'}</h2>
              <p style={{ ...styles.subtitle, ...(isCompactViewport ? styles.subtitleCompact : null) }}>
                {isWeekend ? '周末也坚持学习，奖励池已经悄悄偏向你。' : '今天的努力已存档，来收下属于你的好运吧。'}
              </p>

              <div style={{ ...styles.prizePool, ...(isCompactViewport ? styles.prizePoolCompact : null) }}>
                {PRIZE_PREVIEW.map((item) => (
                  <div key={item.label} style={{ ...styles.poolItem, ...(isCompactViewport ? styles.poolItemCompact : null) }}>
                    <div style={{ ...styles.poolItemIcon, ...(isCompactViewport ? styles.poolItemIconCompact : null) }}>
                      <item.icon size={16} />
                    </div>
                    <span style={{ ...styles.poolItemTitle, ...(isCompactViewport ? styles.poolItemTitleCompact : null) }}>{item.label}</span>
                    <span style={{ ...styles.poolItemDetail, ...(isCompactViewport ? styles.poolItemDetailCompact : null) }}>{item.detail}</span>
                  </div>
                ))}
              </div>

              <motion.button whileTap={{ scale: 0.94 }} onClick={startSpin} style={{ ...styles.spinBtn, ...(isCompactViewport ? styles.spinBtnCompact : null) }}>
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  style={styles.spinBtnIcon}
                >
                  <HiMiniSparkles size={16} />
                </motion.span>
                <span>开始抽奖</span>
              </motion.button>

              {error && <p style={styles.errorText}>{error}</p>}
            </motion.div>
          )}

          {phase === 'spinning' && (
            <motion.div
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ ...styles.phaseContent, ...(isCompactViewport ? styles.phaseContentCompact : null) }}
            >
              <div style={{ ...styles.topBadge, ...(isCompactViewport ? styles.topBadgeCompact : null) }}>
                <HiMiniSparkles size={14} />
                <span>{spinStage}</span>
              </div>

              <h3 style={{ ...styles.spinningTitle, ...(isCompactViewport ? styles.spinningTitleCompact : null) }}>幸运转盘运转中</h3>

              <div style={{ ...styles.slotMachineWrap, ...(isCompactViewport ? styles.slotMachineWrapCompact : null) }}>
                <div style={styles.slotMachineGlow} />
                <div style={{ ...styles.slotMachine, ...(isCompactViewport ? styles.slotMachineCompact : null) }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      style={{ ...styles.slotWindow, ...(isCompactViewport ? styles.slotWindowCompact : null) }}
                      animate={{
                        y: [0, i % 2 === 0 ? -4 : 4, 0],
                        boxShadow: [
                          '0 0 0 rgba(255,255,255,0)',
                          '0 0 20px rgba(255,255,255,0.08)',
                          '0 0 0 rgba(255,255,255,0)',
                        ],
                      }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.12 }}
                    >
                      <motion.span
                        key={slotValues[i]}
                        initial={{ y: -36, opacity: 0, scale: 0.86 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        style={styles.slotIcon}
                      >
                        {(() => {
                          const SlotIcon = SLOT_ITEMS[slotValues[i]].icon;
                          return <SlotIcon size={isCompactViewport ? 34 : 40} color={SLOT_ITEMS[slotValues[i]].color} />;
                        })()}
                      </motion.span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div style={{ ...styles.progressDots, ...(isCompactViewport ? styles.progressDotsCompact : null) }}>
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    animate={{ opacity: [0.25, 1, 0.25], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.18 }}
                    style={styles.progressDot}
                  />
                ))}
              </div>

              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ ...styles.spinningHint, ...(isCompactViewport ? styles.spinningHintCompact : null) }}
              >
                好运会一点点停在正确的位置
              </motion.p>
            </motion.div>
          )}

          {phase === 'reveal' && prize && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              style={{ ...styles.phaseContent, ...(isCompactViewport ? styles.phaseContentCompact : null) }}
            >
              <div style={{ ...styles.topBadge, ...(isCompactViewport ? styles.topBadgeCompact : null) }}>
                <FiCheckCircle size={14} />
                <span>奖励已解锁</span>
              </div>

              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{
                  ...styles.prizeIcon,
                  ...(isCompactViewport ? styles.prizeIconCompact : null),
                  background: PRIZE_COLORS[prize.prizeType]?.bg || PRIZE_COLORS.cash.bg,
                }}
              >
                {(() => {
                  const PrizeIcon = PRIZE_COLORS[prize.prizeType]?.icon || FiGift;
                  return <PrizeIcon size={isCompactViewport ? 38 : 44} />;
                })()}
              </motion.div>

              <motion.h2 initial={{ y: 20 }} animate={{ y: 0 }} style={{ ...styles.prizeTitle, ...(isCompactViewport ? styles.prizeTitleCompact : null) }}>
                {prize.prizeType === 'ultimate' ? '神秘大礼已揭晓'
                  : prize.prizeType === 'custom' ? '心愿奖励已命中'
                  : prize.prizeType === 'blindbox' ? '惊喜盲盒到手'
                  : '现金奖励已到账'}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ ...styles.prizeDetail, ...(isCompactViewport ? styles.prizeDetailCompact : null) }}
              >
                {prize.prizeDetail}
              </motion.p>

              {prize.amount > 0 && prize.prizeType !== 'ultimate' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  style={{ ...styles.amountBadge, ...(isCompactViewport ? styles.amountBadgeCompact : null) }}
                >
                  <span style={{ ...styles.amountUnit, ...(isCompactViewport ? styles.amountUnitCompact : null) }}>¥</span>
                  <span>{prize.amount}</span>
                </motion.div>
              )}

              <motion.button whileTap={{ scale: 0.95 }} onClick={onClose} style={{ ...styles.closeBtn, ...(isCompactViewport ? styles.closeBtnCompact : null) }}>
                <FiGift size={16} />
                <span>收下奖励</span>
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
    background: 'rgba(10, 10, 26, 0.72)',
    backdropFilter: 'blur(8px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    overflow: 'hidden',
  },
  overlayGlowLeft: {
    position: 'absolute',
    left: -120,
    bottom: -80,
    width: 240,
    height: 240,
    borderRadius: '50%',
    background: 'var(--c-orb1)',
    filter: 'blur(50px)',
    pointerEvents: 'none',
  },
  overlayGlowRight: {
    position: 'absolute',
    right: -100,
    top: -60,
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: 'var(--c-orb2)',
    filter: 'blur(46px)',
    pointerEvents: 'none',
  },
  container: {
    width: '100%',
    maxWidth: 388,
    background: 'linear-gradient(180deg, var(--c-card-solid) 0%, rgba(255,255,255,0.03) 100%)',
    borderRadius: 28,
    padding: '30px 24px',
    border: '1px solid var(--c-border)',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 420,
    boxShadow: 'var(--c-shadow-lg)',
    backdropFilter: 'blur(24px)',
  },
  containerCompact: {
    maxWidth: 360,
    borderRadius: 24,
    padding: '24px 18px',
    minHeight: 380,
  },
  panelGlow: {
    position: 'absolute',
    inset: 'auto auto -80px -40px',
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: 'var(--c-gradient2)',
    filter: 'blur(34px)',
    opacity: 0.7,
    pointerEvents: 'none',
  },
  panelOrbit: {
    position: 'absolute',
    top: 12,
    right: 20,
    width: 72,
    height: 72,
    borderRadius: '50%',
    border: '1px dashed rgba(255,255,255,0.08)',
    pointerEvents: 'none',
  },
  phaseContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
    position: 'relative',
    zIndex: 1,
  },
  phaseContentCompact: {
    gap: 10,
  },
  topBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    borderRadius: 999,
    background: 'var(--c-primary-bg)',
    color: 'var(--primary-light)',
    fontSize: 11,
    fontWeight: 700,
    border: '1px solid var(--c-border)',
  },
  topBadgeCompact: {
    padding: '6px 10px',
    fontSize: 10,
  },
  introIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--c-border)',
    marginBottom: 2,
  },
  introIconWrapCompact: {
    width: 72,
    height: 72,
    borderRadius: 24,
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
    boxShadow: '0 12px 26px var(--c-glow)',
  },
  introIconCompact: {
    width: 50,
    height: 50,
    borderRadius: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    marginTop: 4,
    color: 'var(--text-primary)',
  },
  titleCompact: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 1.45,
  },
  prizePool: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
    marginTop: 6,
    marginBottom: 10,
    width: '100%',
  },
  prizePoolCompact: {
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  poolItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    textAlign: 'center',
    padding: '12px 10px',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--c-border)',
    minHeight: 98,
    backdropFilter: 'blur(10px)',
  },
  poolItemCompact: {
    padding: '10px 8px',
    borderRadius: 16,
    minHeight: 88,
    gap: 4,
  },
  poolItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: 'var(--c-primary-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary-light)',
  },
  poolItemIconCompact: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  poolItemTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  poolItemTitleCompact: {
    fontSize: 12,
  },
  poolItemDetail: {
    fontSize: 11,
    lineHeight: 1.45,
    color: 'var(--text-muted)',
  },
  poolItemDetailCompact: {
    fontSize: 10,
    lineHeight: 1.35,
  },
  spinBtn: {
    marginTop: 8,
    padding: '15px 36px',
    borderRadius: 18,
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    color: '#fff',
    fontWeight: 800,
    fontSize: 17,
    boxShadow: '0 10px 32px var(--c-glow)',
    animation: 'pulse-glow 2s infinite',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  spinBtnCompact: {
    marginTop: 6,
    padding: '13px 28px',
    borderRadius: 16,
    fontSize: 15,
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
    border: '1px solid var(--c-border)',
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text-primary)',
    fontSize: 18,
    lineHeight: 1,
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconBtnCompact: {
    top: 14,
    right: 14,
    width: 34,
    height: 34,
  },
  spinningTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginTop: 2,
  },
  spinningTitleCompact: {
    fontSize: 19,
  },
  slotMachineWrap: {
    width: '100%',
    position: 'relative',
    marginTop: 8,
    padding: '18px 14px',
    borderRadius: 24,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--c-border)',
    overflow: 'hidden',
  },
  slotMachineWrapCompact: {
    marginTop: 6,
    padding: '14px 10px',
    borderRadius: 20,
  },
  slotMachineGlow: {
    position: 'absolute',
    inset: 'auto 10% -40px 10%',
    height: 80,
    background: 'var(--c-gradient2)',
    filter: 'blur(24px)',
    opacity: 0.7,
  },
  slotMachine: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  slotMachineCompact: {
    gap: 10,
  },
  slotWindow: {
    width: 82,
    height: 94,
    borderRadius: 18,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))',
    border: '1px solid rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
  slotWindowCompact: {
    width: 70,
    height: 82,
    borderRadius: 16,
  },
  slotIcon: {
    fontSize: 48,
    display: 'block',
    filter: 'drop-shadow(0 4px 14px rgba(255,255,255,0.18))',
  },
  progressDots: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  progressDotsCompact: {
    marginTop: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
  },
  spinningHint: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginTop: 4,
  },
  spinningHintCompact: {
    fontSize: 12,
    marginTop: 2,
  },
  prizeIcon: {
    width: 102,
    height: 102,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 16px 44px var(--c-glow)',
  },
  prizeIconCompact: {
    width: 88,
    height: 88,
  },
  prizeTitle: {
    fontSize: 24,
    fontWeight: 900,
    background: 'linear-gradient(135deg, var(--text-primary), var(--primary-light), var(--accent))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  prizeTitleCompact: {
    fontSize: 21,
  },
  prizeDetail: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    padding: '0 8px',
  },
  prizeDetailCompact: {
    fontSize: 13,
    lineHeight: 1.45,
    padding: '0 4px',
  },
  amountBadge: {
    display: 'inline-flex',
    alignItems: 'flex-start',
    gap: 3,
    padding: '10px 18px',
    borderRadius: 999,
    fontSize: 34,
    fontWeight: 900,
    color: 'var(--warning)',
    textShadow: '0 2px 10px rgba(251, 191, 36, 0.3)',
    marginTop: 4,
    background: 'rgba(251,191,36,0.1)',
    border: '1px solid rgba(251,191,36,0.22)',
  },
  amountBadgeCompact: {
    padding: '8px 15px',
    fontSize: 28,
  },
  amountUnit: {
    fontSize: 18,
    marginTop: 6,
  },
  amountUnitCompact: {
    fontSize: 16,
    marginTop: 4,
  },
  closeBtn: {
    marginTop: 16,
    padding: '14px 30px',
    borderRadius: 16,
    background: 'linear-gradient(135deg, var(--success), #06b6d4)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    boxShadow: '0 4px 20px rgba(52, 211, 153, 0.3)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  closeBtnCompact: {
    marginTop: 12,
    padding: '12px 24px',
    borderRadius: 14,
    fontSize: 14,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: 'var(--danger)',
    textAlign: 'center',
    lineHeight: 1.5,
    marginTop: 4,
  },
};
