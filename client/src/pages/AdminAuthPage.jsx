import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiLock, FiShield } from 'react-icons/fi';
import { api } from '../utils/api';

export default function AdminAuthPage({ onSuccess, onBack }) {
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passphrase.trim() || loading) return;

    setLoading(true);
    setError('');
    try {
      await api.verifyAdmin(passphrase.trim());
      onSuccess();
    } catch (err) {
      setError('管理员口令不正确');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPassphrase('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={styles.card}
      >
        <div style={styles.badge}>
          <FiShield size={14} />
          <span>管理后台</span>
        </div>
        <h1 style={styles.title}>管理员入口</h1>
        <p style={styles.subtitle}>独立入口，仅管理员可进入</p>

        <motion.form
          onSubmit={handleSubmit}
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.35 }}
          style={styles.form}
        >
          <div style={styles.inputWrap}>
            <FiLock size={16} style={styles.inputIcon} />
            <input
              ref={inputRef}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="请输入管理员口令"
              style={styles.input}
              autoComplete="off"
              autoFocus
            />
          </div>

          <button type="submit" disabled={loading || !passphrase.trim()} style={{ ...styles.primaryBtn, opacity: loading || !passphrase.trim() ? 0.5 : 1 }}>
            <span>{loading ? '验证中...' : '进入后台'}</span>
            <FiArrowRight size={16} />
          </button>
          <button type="button" onClick={onBack} style={styles.secondaryBtn}>返回用户入口</button>
        </motion.form>

        <AnimatePresence>
          {error ? (
            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={styles.error}>
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    zIndex: 1,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    padding: '24px 20px',
    textAlign: 'center',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    borderRadius: 999,
    background: 'var(--c-primary-bg)',
    color: 'var(--primary-light)',
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  inputWrap: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
  },
  input: {
    width: '100%',
    padding: '15px 18px 15px 44px',
    borderRadius: 16,
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontSize: 15,
  },
  primaryBtn: {
    padding: '15px 18px',
    borderRadius: 16,
    border: 'none',
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    color: '#fff',
    fontSize: 15,
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 12px 28px var(--c-glow)',
  },
  secondaryBtn: {
    padding: '13px 16px',
    borderRadius: 14,
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 700,
  },
  error: {
    marginTop: 14,
    color: 'var(--danger)',
    fontSize: 14,
  },
};
