import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiHeart, FiLock, FiMoon } from 'react-icons/fi';
import { api } from '../utils/api';
import { useTheme } from '../utils/theme';

const QUOTES = [
  "输入专属口号，开启学习之旅 ✨",
  "只有最特别的人才能进入 💫",
];

export default function AuthPage({ onSuccess }) {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);
  const { theme, cycleTheme, themeMeta } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passphrase.trim() || loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      await api.verify(passphrase.trim());
      onSuccess();
    } catch (err) {
      setError('口号不正确，再想想？');
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setPassphrase('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={cycleTheme}
        style={styles.themeBtn}
      >
        <span>{themeMeta[theme]?.icon || '🎨'}</span>
        <span>{themeMeta[theme]?.label || '切换主题'}</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="glass-card"
        style={styles.content}
      >
        <div style={styles.topPill}>
          <FiHeart size={14} />
          <span>把喜欢的生活过成答案</span>
        </div>

        {/* Logo */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={styles.logoContainer}
        >
          <span style={styles.logo}>
            <span style={styles.logoCat}>(=^・ω・^=)</span>
          </span>
        </motion.div>

        <h1 style={styles.title}>
          <span className="gradient-text">LY 加油!</span>
        </h1>
        
        <p style={styles.subtitle}>{QUOTES[0]}</p>

        <motion.form
          onSubmit={handleSubmit}
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          style={styles.form}
        >
          <div style={styles.inputWrapper}>
            <div style={styles.inputIcon}>
              <FiLock size={16} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="人生态度"
              style={styles.input}
              autoComplete="off"
              autoFocus
            />
            <div style={styles.inputGlow} />
          </div>

          <motion.button
            type="submit"
            disabled={loading || !passphrase.trim()}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            style={{
              ...styles.button,
              opacity: loading || !passphrase.trim() ? 0.5 : 1,
            }}
          >
            <span>{loading ? '验证中...' : '进入学习空间'}</span>
            {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-flex' }}
              >
                <FiMoon size={16} />
              </motion.span>
            ) : (
              <FiArrowRight size={16} />
            )}
          </motion.button>
        </motion.form>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={styles.error}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    zIndex: 1,
  },
  themeBtn: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 16px)',
    right: 16,
    zIndex: 10,
    padding: '9px 14px',
    borderRadius: 14,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow)',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    textAlign: 'center',
    padding: '26px 22px 24px',
    position: 'relative',
    overflow: 'hidden',
  },
  topPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    borderRadius: 999,
    background: 'var(--c-primary-bg)',
    color: 'var(--primary-light)',
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 18,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 76,
    height: 76,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    color: '#fff',
    boxShadow: '0 14px 32px var(--c-glow)',
  },
  logoCat: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    marginBottom: 8,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    marginBottom: 28,
    lineHeight: 1.65,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
    zIndex: 2,
  },
  input: {
    width: '100%',
    padding: '16px 20px 16px 46px',
    fontSize: 16,
    borderRadius: 18,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    transition: 'all 0.3s',
    textAlign: 'center',
    letterSpacing: '0.1em',
  },
  inputGlow: {
    position: 'absolute',
    inset: -1,
    borderRadius: 17,
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    opacity: 0.15,
    zIndex: -1,
    filter: 'blur(4px)',
  },
  button: {
    padding: '16px 24px',
    fontSize: 16,
    fontWeight: 700,
    borderRadius: 18,
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
    letterSpacing: '0.05em',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    boxShadow: '0 12px 28px var(--c-glow)',
  },
  error: {
    marginTop: 16,
    color: 'var(--danger)',
    fontSize: 14,
    fontWeight: 500,
  },
};
