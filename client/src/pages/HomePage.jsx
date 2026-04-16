import { useEffect, useState, useRef } from 'react';
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
  '少而定，多而惑。',
  '日日行，不怕千万里。',
  '心有所向，平凡的日子也会泛光。',
  '再小的进步，都是向前。',
  '先完成，再完美。',
  '你不是慢，你是在扎根。',
  '今日不敷衍，明日自有回答。',
  '时间会奖励持续发光的人。',
  '安静蓄力，也是一种力量。',
  '每一次开始都值得鼓掌。',
  '学会和昨天的自己比较。',
  '一点点积累，会长成很远的路。',
  '越是普通的日子，越要认真经营。',
  '不必着急看见全部答案，先写好今天这一页。',
  '把注意力放回当下，事情就会慢慢变顺。',
  '勤能补拙，静能生慧。',
  '当你没有退路时，前进就是答案。',
  '坚持不是硬扛，是一次次重新出发。',
  '今天多懂一点，明天就少慌一点。',
  '你走得稳，已经很了不起。',
  '别怕慢，怕的是停。',
  '山有顶峰，湖有彼岸，慢慢来终有回甘。',
  '认真是会发光的习惯。',
  '你现在读过的每一页，都会在未来护住你。',
  '每一个专注的小时，都在悄悄改变命运。',
  '允许自己笨拙地开始。',
  '不用一下子很厉害，先持续就很好。',
  '努力不是为了证明给别人看，是为了成全自己。',
  '心里有方向，脚下就有力量。',
  '清醒、自律、知进退。',
  '愿你手里的笔，写得出想去的远方。',
  '把犹豫变成行动，路就会展开。',
  '把一件小事做好，就是优秀的开始。',
  '所有看似不起波澜的日复一日，终会让人看到坚持的意义。',
  '你只管认真，时间自会作答。',
  '今天的专注，会成为明天的底气。',
  '去做会让未来的你感谢现在的事。',
  '风会记得每一次用力生长。',
  '现在辛苦一点，是为了以后拥有选择。',
  '保持耐心，很多好事都在来的路上。',
  '学习不是和别人赛跑，是让自己变宽阔。',
  '你并不普通，你只是还在路上。',
  '认真的人，自带光源。',
  '把今天过充实，比想很多更重要。',
  '前路未必坦荡，但你可以越来越强。',
  '只要还在走，慢一点也没关系。',
  '不负光阴，不负自己。',
  '心定下来，路就清晰了。',
  '每天进步一点，未来就会大不一样。',
  '你付出的心力，都会有痕迹。',
  '向内扎根，向上生长。',
  '先把今天做好，明天自然会来。',
  '熬得住无人问津，才等得到掌声。',
  '读书、思考、行动，答案会慢慢靠近。',
  '没有白走的路，也没有白读的书。',
  '与其等待状态，不如先做五分钟。',
  '当你开始行动，焦虑就会变小。',
  '今天认真一点，明天从容一点。',
  '不是看到了希望才坚持，是坚持了才更有希望。',
  '把每次打卡，都当成和梦想的一次碰面。',
  '愿你稳稳前进，也常常开心。',
  '先赢过分心，再去赢过难题。',
  '哪怕只学一点，也是在向上。',
  '你的每一份努力，时间都偷偷记得。',
  '保持热爱，奔赴山海。',
  '慢慢学，反而学得深。',
  '认真生活的人，终会被生活奖励。',
  '把今天的心思，放进眼前这一件事里。',
  '走得再慢，也比原地打转更接近答案。',
  '你在为更好的自己铺路。',
  '专注当下，就是最好的加速。',
  '再坚持一下，很多改变都发生在后半程。',
  '不要轻看今天，它正在决定以后。',
  '读过的句子会忘，但形成的气质不会。',
  '眼下的积累，终会变成未来的底牌。',
  '所谓幸运，不过是准备遇见机会。',
  '愿你被目标牵引，也被热爱托住。',
  '学习的意义，是让你有能力选择想要的人生。',
  '你不是在重复今天，你是在建设明天。',
  '不怕路长，只怕心散。',
  '静下来，世界会给你答案。',
  '你能抵达的地方，往往始于一个认真今天。',
  '每次没有放弃，都是在为自己加分。',
  '朝着光走，影子会在后面。',
  '愿你一步一步，把喜欢的生活走出来。',
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
  const [showMakeupCheckin, setShowMakeupCheckin] = useState(false);
  const [showLottery, setShowLottery] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  const [catMood, setCatMood] = useState('idle');
  const [quote, setQuote] = useState(() => getNextQuote());
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 430,
    height: typeof window !== 'undefined' ? window.innerHeight : 932,
  }));
  const scrollRef = useRef(null);
  const moodResetTimerRef = useRef(null);
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
              <FiMoon size={14} />
              <span>{todayChecked ? '今日记录已完成' : '继续积累今天的微光'}</span>
            </div>
            <div
              style={{
                ...styles.heroThemeBadge,
                ...(isCompactViewport ? styles.heroThemeBadgeCompact : null),
              }}
            >
              <span>{themeMeta[theme]?.icon || '🎨'}</span>
              <span>{themeMeta[theme]?.label}</span>
            </div>
          </div>
          <div
            style={{
              ...styles.heroTitleRow,
              ...(isCompactViewport ? styles.heroTitleRowCompact : null),
            }}
          >
            <div>
              <h3
                style={{
                  ...styles.heroTitle,
                  ...(isCompactViewport ? styles.heroTitleCompact : null),
                  ...(isUltraCompactViewport ? styles.heroTitleUltraCompact : null),
                }}
              >
                每一次认真打卡，都在把理想写得更清晰
              </h3>
              {!isUltraCompactViewport && (
                <p
                  style={{
                    ...styles.heroSubtitle,
                    ...(isCompactViewport ? styles.heroSubtitleCompact : null),
                  }}
                >
                  保留一点仪式感，让学习更值得期待。
                </p>
              )}
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

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
          style={{
            ...styles.quoteCard,
            ...(isCompactViewport ? styles.quoteCardCompact : null),
          }}
        >
          <div style={styles.quoteHeader}>
            <div
              style={{
                ...styles.quoteIconWrap,
                ...(isCompactViewport ? styles.quoteIconWrapCompact : null),
              }}
            >
              <HiMiniSparkles size={14} />
            </div>
            <span
              style={{
                ...styles.quoteLabel,
                ...(isCompactViewport ? styles.quoteLabelCompact : null),
              }}
            >
              今日灵感
            </span>
          </div>
          <p
            style={{
              ...styles.quoteText,
              ...(isCompactViewport ? styles.quoteTextCompact : null),
            }}
          >
            {quote}
          </p>
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
            onInteract={() => setQuote((currentQuote) => getNextQuote(currentQuote))}
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
    marginTop: 4,
    fontSize: 12,
    lineHeight: 1.45,
    color: 'var(--text-secondary)',
  },
  heroSubtitleCompact: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 1.25,
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
