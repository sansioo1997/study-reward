import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiGift, FiPlus, FiSave, FiShield, FiTrash2, FiTruck } from 'react-icons/fi';
import { api } from '../utils/api';

const GIFT_STATUS_OPTIONS = ['待发货', '发货中', '已完成'];
const PRIZE_MODE_OPTIONS = [
  { value: 'random', label: '随机策略', desc: '保持当前随机抽奖逻辑' },
  { value: 'cash', label: '固定现金', desc: '每次抽奖都发固定现金金额' },
  { value: 'blindbox', label: '必中盲盒', desc: '每次抽奖都开出盲盒' },
  { value: 'custom', label: '必中自选奖品', desc: '每次抽奖都开出自选奖品' },
];
const PRIZE_LABELS = {
  custom: '自选奖品',
  blindbox: '盲盒',
  ultimate: '神秘大礼',
};

export default function AdminPage({ onExit }) {
  const [inspirationItems, setInspirationItems] = useState([]);
  const [preferredId, setPreferredId] = useState('');
  const [saving, setSaving] = useState(false);
  const [prizeMode, setPrizeMode] = useState('random');
  const [cashAmount, setCashAmount] = useState('');
  const [savingPrizeConfig, setSavingPrizeConfig] = useState(false);
  const [prizeConfigMessage, setPrizeConfigMessage] = useState('');
  const [prizeConfigError, setPrizeConfigError] = useState('');
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inspirationData, prizeConfigData, giftsData] = await Promise.all([
        api.getAdminInspiration(),
        api.getAdminPrizeConfig(),
        api.getAdminGifts(),
      ]);
      setInspirationItems(inspirationData.items || []);
      setPreferredId(inspirationData.preferredId || '');
      setPrizeMode(prizeConfigData.mode || 'random');
      setCashAmount(prizeConfigData.cashAmount ? String(prizeConfigData.cashAmount) : '');
      setGifts(giftsData.gifts || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch(console.error);
  }, []);

  const giftSummary = useMemo(() => {
    return GIFT_STATUS_OPTIONS.reduce((acc, status) => {
      acc[status] = gifts.filter((item) => (item.gift_status || '待发货') === status).length;
      return acc;
    }, {});
  }, [gifts]);

  const handleSaveInspiration = async () => {
    setSaving(true);
    try {
      const cleanItems = inspirationItems
        .map((item) => ({ ...item, text: item.text.trim() }))
        .filter((item) => item.text);
      const safePreferredId = cleanItems.some((item) => item.id === preferredId)
        ? preferredId
        : (cleanItems[0]?.id || '');
      const data = await api.updateAdminInspiration(cleanItems, safePreferredId);
      setInspirationItems(data.items || []);
      setPreferredId(data.preferredId || '');
    } finally {
      setSaving(false);
    }
  };

  const handleAddInspiration = () => {
    const id = `local-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    setInspirationItems((items) => [...items, { id, text: '' }]);
    if (!preferredId) {
      setPreferredId(id);
    }
  };

  const handleChangeInspiration = (id, text) => {
    setInspirationItems((items) => items.map((item) => (item.id === id ? { ...item, text } : item)));
  };

  const handleRemoveInspiration = (id) => {
    setInspirationItems((items) => {
      const next = items.filter((item) => item.id !== id);
      if (preferredId === id) {
        setPreferredId(next[0]?.id || '');
      }
      return next;
    });
  };

  const handleUpdateGift = async (id, giftStatus) => {
    const data = await api.updateAdminGiftStatus(id, giftStatus);
    setGifts((items) => items.map((item) => (item.id === id ? { ...item, ...data.gift } : item)));
  };

  const handleSavePrizeConfig = async () => {
    setPrizeConfigError('');
    setPrizeConfigMessage('');

    if (prizeMode === 'cash') {
      const amount = Number(cashAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setPrizeConfigError('请先填写大于 0 的固定现金金额');
        return;
      }
    }

    setSavingPrizeConfig(true);
    try {
      const data = await api.updateAdminPrizeConfig(
        prizeMode,
        prizeMode === 'cash' ? Number(cashAmount) : null
      );
      setPrizeMode(data.mode || 'random');
      setCashAmount(data.cashAmount ? String(data.cashAmount) : '');
      setPrizeConfigMessage('奖品设置已保存');
    } catch (e) {
      setPrizeConfigError(e.message || '保存失败');
    } finally {
      setSavingPrizeConfig(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button type="button" onClick={onExit} style={styles.headerBtn}>
          <FiArrowLeft size={16} />
          <span>退出后台</span>
        </button>
        <div style={styles.titleWrap}>
          <FiShield size={16} />
          <span>管理后台</span>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={styles.card}>
        <div style={styles.cardHead}>
          <div>
            <h2 style={styles.cardTitle}>灵感池配置</h2>
            <p style={styles.cardDesc}>所有灵感都由管理员维护，并可指定一条作为主页默认优先展示。</p>
          </div>
        </div>
        <div style={styles.inspirationList}>
          {inspirationItems.map((item, index) => (
            <div key={item.id} style={styles.inspirationCard}>
              <div style={styles.inspirationTop}>
                <label style={styles.radioWrap}>
                  <input
                    type="radio"
                    name="preferred-inspiration"
                    checked={preferredId === item.id}
                    onChange={() => setPreferredId(item.id)}
                  />
                  <span>默认展示 {index + 1}</span>
                </label>
                <button type="button" onClick={() => handleRemoveInspiration(item.id)} style={styles.deleteBtn}>
                  <FiTrash2 size={14} />
                  <span>删除</span>
                </button>
              </div>
              <textarea
                value={item.text}
                onChange={(e) => handleChangeInspiration(item.id, e.target.value)}
                maxLength={240}
                rows={3}
                style={styles.textarea}
                placeholder="输入灵感内容"
              />
              <div style={styles.itemFooter}>
                <span style={styles.counter}>{item.text.length}/240</span>
              </div>
            </div>
          ))}
        </div>
        <div style={styles.cardFooter}>
          <button type="button" onClick={handleAddInspiration} style={styles.secondaryActionBtn}>
            <FiPlus size={15} />
            <span>新增灵感</span>
          </button>
          <button type="button" onClick={handleSaveInspiration} style={{ ...styles.primaryBtn, opacity: saving ? 0.6 : 1 }}>
            <FiSave size={15} />
            <span>{saving ? '保存中...' : '保存配置'}</span>
          </button>
        </div>
        {preferredId ? (
          <p style={styles.savedTip}>
            当前默认展示：
            {inspirationItems.find((item) => item.id === preferredId)?.text || '未找到对应灵感'}
          </p>
        ) : (
          <p style={styles.savedTip}>当前未设置默认展示灵感</p>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="glass-card" style={styles.card}>
        <div style={styles.cardHead}>
          <div>
            <h2 style={styles.cardTitle}>奖品设置</h2>
            <p style={styles.cardDesc}>可指定固定现金金额、必中盲盒或必中自选奖品；不设置时保留当前随机策略。</p>
          </div>
        </div>
        <div style={styles.prizeModeList}>
          {PRIZE_MODE_OPTIONS.map((option) => (
            <label key={option.value} style={styles.prizeModeCard}>
              <div style={styles.radioWrap}>
                <input
                  type="radio"
                  name="prize-mode"
                  checked={prizeMode === option.value}
                  onChange={() => {
                    setPrizeMode(option.value);
                    setPrizeConfigError('');
                    setPrizeConfigMessage('');
                  }}
                />
                <span>{option.label}</span>
              </div>
              <span style={styles.prizeModeDesc}>{option.desc}</span>
            </label>
          ))}
        </div>
        {prizeMode === 'cash' && (
          <div style={styles.cashInputWrap}>
            <span style={styles.cashLabel}>固定现金金额</span>
            <input
              type="number"
              min="1"
              step="1"
              value={cashAmount}
              onChange={(e) => {
                setCashAmount(e.target.value);
                setPrizeConfigError('');
                setPrizeConfigMessage('');
              }}
              placeholder="输入固定现金金额"
              style={styles.cashInput}
            />
          </div>
        )}
        {prizeConfigError ? <p style={styles.errorText}>{prizeConfigError}</p> : null}
        {prizeConfigMessage ? <p style={styles.successText}>{prizeConfigMessage}</p> : null}
        <div style={styles.cardFooter}>
          <span style={styles.savedTip}>
            当前策略：
            {prizeMode === 'cash'
              ? `固定现金 ¥${cashAmount || '--'}`
              : (PRIZE_MODE_OPTIONS.find((item) => item.value === prizeMode)?.label || '随机策略')}
          </span>
          <button type="button" onClick={handleSavePrizeConfig} style={{ ...styles.primaryBtn, opacity: savingPrizeConfig ? 0.6 : 1 }}>
            <FiSave size={15} />
            <span>{savingPrizeConfig ? '保存中...' : '保存奖品设置'}</span>
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={styles.summaryRow}>
        {GIFT_STATUS_OPTIONS.map((status) => (
          <div key={status} className="glass-card" style={styles.summaryCard}>
            <div style={styles.summaryLabel}>{status}</div>
            <div style={styles.summaryValue}>{giftSummary[status] || 0}</div>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={styles.card}>
        <div style={styles.cardHead}>
          <div>
            <h2 style={styles.cardTitle}>礼物状态</h2>
            <p style={styles.cardDesc}>仅展示需要跟进的礼物类奖品。</p>
          </div>
        </div>

        {loading ? (
          <p style={styles.emptyText}>加载中...</p>
        ) : gifts.length === 0 ? (
          <p style={styles.emptyText}>暂时没有礼物记录</p>
        ) : (
          <div style={styles.giftList}>
            {gifts.map((gift) => (
              <div key={gift.id} style={styles.giftCard}>
                <div style={styles.giftTop}>
                  <div style={styles.giftMeta}>
                    <span style={styles.giftType}>
                      <FiGift size={14} />
                      <span>{PRIZE_LABELS[gift.prize_type] || gift.prize_type}</span>
                    </span>
                    <span style={styles.giftDate}>{gift.date || '未知日期'}</span>
                  </div>
                  <span style={styles.giftAmount}>{gift.amount ? `¥${gift.amount}` : '实物奖品'}</span>
                </div>
                <p style={styles.giftDetail}>{gift.prize_detail || '暂无说明'}</p>
                <div style={styles.giftBottom}>
                  <span style={styles.giftRecord}>
                    <FiTruck size={14} />
                    <span>记录 #{gift.id}</span>
                  </span>
                  <select
                    value={gift.gift_status || '待发货'}
                    onChange={(e) => handleUpdateGift(gift.id, e.target.value)}
                    style={styles.select}
                  >
                    {GIFT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

const styles = {
  page: {
    height: '100%',
    padding: 'calc(var(--safe-top) + 16px) 16px calc(var(--safe-bottom) + 20px)',
    position: 'relative',
    zIndex: 1,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  headerBtn: {
    padding: '10px 14px',
    borderRadius: 14,
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  titleWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--text-primary)',
    fontSize: 15,
    fontWeight: 800,
  },
  card: {
    padding: '16px 14px',
    marginBottom: 12,
  },
  cardHead: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  cardDesc: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 1.5,
    color: 'var(--text-muted)',
  },
  textarea: {
    width: '100%',
    resize: 'vertical',
    minHeight: 110,
    padding: '14px 14px',
    borderRadius: 16,
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontSize: 14,
    lineHeight: 1.6,
  },
  inspirationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  inspirationCard: {
    padding: '12px',
    borderRadius: 16,
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.04)',
  },
  inspirationTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  radioWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontWeight: 700,
  },
  deleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: 'none',
    background: 'transparent',
    color: 'var(--danger)',
    fontSize: 12,
    fontWeight: 700,
  },
  itemFooter: {
    marginTop: 8,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  cardFooter: {
    marginTop: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  counter: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontWeight: 700,
  },
  primaryBtn: {
    padding: '11px 14px',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    color: '#fff',
    fontSize: 13,
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  secondaryActionBtn: {
    padding: '11px 14px',
    borderRadius: 14,
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  savedTip: {
    marginTop: 10,
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
    color: 'var(--danger)',
    lineHeight: 1.5,
    fontWeight: 700,
  },
  successText: {
    marginTop: 10,
    fontSize: 12,
    color: 'var(--success, #34d399)',
    lineHeight: 1.5,
    fontWeight: 700,
  },
  prizeModeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  prizeModeCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '12px',
    borderRadius: 16,
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.04)',
  },
  prizeModeDesc: {
    fontSize: 12,
    lineHeight: 1.5,
    color: 'var(--text-muted)',
  },
  cashInputWrap: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cashLabel: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontWeight: 700,
  },
  cashInput: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 14,
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 700,
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 12,
  },
  summaryCard: {
    padding: '12px 8px',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 700,
  },
  summaryValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: 900,
    color: 'var(--text-primary)',
  },
  giftList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  giftCard: {
    padding: '12px',
    borderRadius: 16,
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.04)',
  },
  giftTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  giftMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  giftType: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: 'var(--text-primary)',
    fontSize: 13,
    fontWeight: 800,
  },
  giftDate: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 700,
  },
  giftAmount: {
    fontSize: 12,
    fontWeight: 800,
    color: 'var(--primary-light)',
  },
  giftDetail: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 1.55,
    color: 'var(--text-secondary)',
  },
  giftBottom: {
    marginTop: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  giftRecord: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: 'var(--text-muted)',
    fontSize: 11,
    fontWeight: 700,
  },
  select: {
    minWidth: 96,
    padding: '8px 10px',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontWeight: 700,
  },
  emptyText: {
    padding: '24px 0',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: 13,
  },
};
