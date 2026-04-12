import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBookOpen,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit3,
  FiHeart,
  FiSend,
} from 'react-icons/fi';
import { api } from '../utils/api';

const MOODS = [
  { emoji: '😊', label: '开心', value: 'happy' },
  { emoji: '😤', label: '奋斗', value: 'fighting' },
  { emoji: '🤔', label: '思考', value: 'thinking' },
  { emoji: '😫', label: '疲惫', value: 'tired' },
  { emoji: '😌', label: '平静', value: 'calm' },
  { emoji: '🥳', label: '激动', value: 'excited' },
  { emoji: '😰', label: '焦虑', value: 'anxious' },
  { emoji: '💪', label: '充实', value: 'fulfilled' },
];

const HOUR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

export default function CheckinModal({ onClose, onComplete, catMood, setCatMood }) {
  const [step, setStep] = useState(1); // 1: hours, 2: mood, 3: message, 4: confirm
  const [studyHours, setStudyHours] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update cat mood based on selected mood
  useEffect(() => {
    if (selectedMood) {
      const moodMap = {
        happy: 'happy',
        fighting: 'excited',
        thinking: 'idle',
        tired: 'sleepy',
        calm: 'idle',
        excited: 'super_excited',
        anxious: 'sleepy',
        fulfilled: 'love',
      };
      setCatMood(moodMap[selectedMood] || 'happy');
    }
  }, [selectedMood, setCatMood]);

  const handleSubmit = async () => {
    if (!studyHours || !selectedMood) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.checkin(studyHours, selectedMood, message);
      onComplete(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={styles.sheet}
      >
        {/* Handle */}
        <div style={styles.handle} />

        {/* Progress */}
        <div style={styles.progress}>
          {[1, 2, 3].map(s => (
            <div
              key={s}
              style={{
                ...styles.progressDot,
                background: step >= s ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                width: step === s ? 24 : 8,
              }}
            />
          ))}
        </div>

        <div style={styles.stepMeta}>
          <div style={styles.stepMetaIcon}>
            {step === 1 ? <FiClock size={14} /> : step === 2 ? <FiHeart size={14} /> : <FiEdit3 size={14} />}
          </div>
          <span style={styles.stepMetaText}>步骤 {step} / 3</span>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Study Hours */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              style={styles.stepContent}
            >
              <h3 style={styles.stepTitle}>
                <FiBookOpen size={18} />
                <span>今日学习时长</span>
              </h3>
              <p style={styles.stepSubtitle}>选择或输入你今天学了多久</p>
              
              <div style={styles.hourGrid}>
                {HOUR_OPTIONS.map(h => (
                  <motion.button
                    key={h}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setStudyHours(h)}
                    style={{
                      ...styles.hourBtn,
                      background: studyHours === h 
                        ? 'linear-gradient(135deg, var(--primary), var(--accent))'
                        : 'rgba(255,255,255,0.06)',
                      border: studyHours === h 
                        ? '1px solid var(--primary-light)'
                        : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <span style={{ fontSize: 20, fontWeight: 800 }}>{h}</span>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>小时</span>
                  </motion.button>
                ))}
              </div>

              {/* Custom input */}
              <div style={styles.customHourRow}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>自定义：</span>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={studyHours || ''}
                  onChange={(e) => setStudyHours(Number(e.target.value))}
                  placeholder="0.5~24"
                  style={styles.customInput}
                />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>小时</span>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                disabled={!studyHours}
                onClick={() => setStep(2)}
                style={{ ...styles.nextBtn, opacity: studyHours ? 1 : 0.4 }}
              >
                <span>下一步</span>
                <FiChevronRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Mood */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              style={styles.stepContent}
            >
              <h3 style={styles.stepTitle}>
                <FiHeart size={18} />
                <span>今日心情</span>
              </h3>
              <p style={styles.stepSubtitle}>选一个表情代表你的心情，小猫会跟着变哦</p>
              
              <div style={styles.moodGrid}>
                {MOODS.map(m => (
                  <motion.button
                    key={m.value}
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setSelectedMood(m.value)}
                    style={{
                      ...styles.moodBtn,
                      background: selectedMood === m.value
                        ? 'rgba(124, 92, 252, 0.2)'
                        : 'rgba(255,255,255,0.04)',
                      border: selectedMood === m.value
                        ? '2px solid var(--primary)'
                        : '2px solid transparent',
                      transform: selectedMood === m.value ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    <span style={{ fontSize: 32 }}>{m.emoji}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{m.label}</span>
                  </motion.button>
                ))}
              </div>

              <div style={styles.btnRow}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setStep(1)} style={styles.backBtn}>
                  <FiChevronLeft size={16} />
                  <span>返回</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  disabled={!selectedMood}
                  onClick={() => setStep(3)}
                  style={{ ...styles.nextBtn, flex: 1, opacity: selectedMood ? 1 : 0.4 }}
                >
                  <span>下一步</span>
                  <FiChevronRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Message + Confirm */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              style={styles.stepContent}
            >
              <h3 style={styles.stepTitle}>
                <FiEdit3 size={18} />
                <span>写点心里话</span>
              </h3>
              <p style={styles.stepSubtitle}>可选，给自己的一段话或今日感想</p>
              
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="今天的收获、遇到的困难、想说的话..."
                maxLength={500}
                style={styles.textarea}
                rows={4}
              />

              {/* Summary */}
              <div className="glass-card" style={styles.summary}>
                <div style={styles.summaryRow}>
                  <span>⏱️ 学习时长</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{studyHours} 小时</span>
                </div>
                <div style={styles.summaryRow}>
                  <span>💭 今日心情</span>
                  <span>{MOODS.find(m => m.value === selectedMood)?.emoji} {MOODS.find(m => m.value === selectedMood)?.label}</span>
                </div>
              </div>

              {error && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>{error}</p>}

              <div style={styles.btnRow}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setStep(2)} style={styles.backBtn}>
                  <FiChevronLeft size={16} />
                  <span>返回</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    ...styles.submitBtn,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? (
                    '提交中...'
                  ) : (
                    <>
                      <FiSend size={15} />
                      <span>确认打卡</span>
                    </>
                  )}
                </motion.button>
              </div>
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
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 430,
    background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%)',
    borderRadius: '24px 24px 0 0',
    padding: '12px 20px 32px',
    paddingBottom: 'calc(var(--safe-bottom) + 32px)',
    maxHeight: '85vh',
    overflowY: 'auto',
    border: '1px solid rgba(255,255,255,0.08)',
    borderBottom: 'none',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    background: 'rgba(255,255,255,0.2)',
    margin: '0 auto 16px',
  },
  progress: {
    display: 'flex',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
    alignItems: 'center',
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s',
  },
  stepMeta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    marginBottom: 8,
    padding: '6px 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  stepMetaIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
  },
  stepMetaText: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontWeight: 700,
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 800,
    textAlign: 'center',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepSubtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    marginBottom: 4,
  },
  hourGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 8,
  },
  hourBtn: {
    padding: '12px 4px',
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    transition: 'all 0.2s',
    color: '#fff',
  },
  customHourRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  customInput: {
    width: 80,
    padding: '8px 12px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  moodGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10,
  },
  moodBtn: {
    padding: '12px 4px',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 14,
    lineHeight: 1.6,
    resize: 'none',
  },
  summary: {
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  btnRow: {
    display: 'flex',
    gap: 10,
    marginTop: 4,
  },
  nextBtn: {
    padding: '14px 24px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    width: '100%',
    transition: 'opacity 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backBtn: {
    padding: '14px 18px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: 14,
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  submitBtn: {
    flex: 1,
    padding: '14px 24px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, var(--success), #06b6d4)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    boxShadow: '0 4px 20px rgba(52, 211, 153, 0.3)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
};
