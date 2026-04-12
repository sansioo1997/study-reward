import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

const CATS = {
  idle: {
    frames: [
      { face: '(=^・ω・^=)', body: '  /|____|\\\n  |      |\n   \\_◎◎_/' },
      { face: '(=^・ω・^=)', body: '  /|____|\\\n  |      |\n   \\_●●_/' },
    ],
    msgs: ['喵~', '摸摸我嘛~', '…zzZ', '🐟想吃鱼', '嗯?', '(。-ω-)'],
    anim: { y: [0, -4, 0] },
  },
  happy: {
    frames: [
      { face: '(=^▽^=)', body: '  ∧___∧\n  /     \\\n ～(  ♡  )～' },
      { face: '(=＾● ⋏ ●＾=)', body: '  ∧___∧\n  /     \\\n ～(  ♡  )～' },
    ],
    msgs: ['太棒啦喵！✨', '好开心！', '继续加油~', '你最厉害了！', '(ﾉ◕ヮ◕)ﾉ*:・ﾟ✧'],
    anim: { y: [0, -12, 0], scale: [1, 1.05, 1] },
  },
  excited: {
    frames: [
      { face: '(=ↀωↀ=)', body: '  ∧ ∧\n （ﾟ∀ﾟ）\n ⊂  ⊃\n  しωJ' },
      { face: '(=✧ω✧=)', body: '  ∧ ∧\n （✧∀✧）\n ⊂  ⊃\n  しωJ' },
    ],
    msgs: ['要打卡了吗?！', '好期待!', '冲冲冲！💨', '✨激动✨'],
    anim: { y: [0, -16, 0, -8, 0], rotate: [0, -3, 3, -3, 0] },
  },
  super_excited: {
    frames: [
      { face: 'ヾ(=`ω´=)ﾉ"', body: '  ∧∧\n (  >ω<)\n ⊂ノ  ⊃\n しωωJ' },
      { face: '☆*:.ﾟ(=´∀`)ﾉﾟ.:*☆', body: '  ∧∧\n ( °∀°)\n ⊂ノ  ⊃\n しωωJ' },
    ],
    msgs: ['周末还学习?!', '太感动了呜呜！😭', '你是最强的！！', '必须大奖！🏆'],
    anim: { y: [0, -22, 5, -22, 0], scale: [1, 1.1, 0.95, 1.08, 1], rotate: [0, -6, 6, -6, 0] },
  },
  love: {
    frames: [
      { face: '(=♡ ᆺ ♡=)', body: '  ∧___∧\n  ( ♥ω♥)\n ～♡～♡～' },
      { face: '(=˘ ᆺ ˘=)♡', body: '  ∧___∧\n  ( ˘ω˘)\n ～♡～♡～' },
    ],
    msgs: ['爱你喵~💕', '最喜欢你了！', 'mua~ 💗', '(灬ˊᵕˋ灬)♡'],
    anim: { scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] },
  },
  sleepy: {
    frames: [
      { face: '(=꒦ꈊ꒦=)', body: '  ∧___∧\n  (  -ω-) zzZ\n  /つ旦o' },
      { face: '(=- ω -=)', body: '  ∧___∧\n  (  =ω=) zzZ\n  /つ旦o' },
    ],
    msgs: ['困困…', 'zzZ…', '(눈_눈)', '要休息吗？', '呼噜呼噜…'],
    anim: { y: [0, -2, 0], rotate: [-1, 0, 1, 0, -1] },
  },
  paw: {
    frames: [
      { face: '(=^-ω-^=)ᐝ', body: '  ∧___∧\n  ( ^ω^)ﾉ�\n  /つ  つ' },
      { face: '₍˄·͈༝·͈˄₎◞ ̑̑', body: '  ∧___∧\n  ( ^ω^)و✧\n  /つ  つ' },
    ],
    msgs: ['举爪！🐾', '肉球给你看！', '嘿嘿~', '(=^・^=)∩'],
    anim: { y: [0, -8, 0], rotate: [0, 10, -10, 0] },
  },
  spin: {
    frames: [
      { face: '(=@ω@=)', body: '   ∧∧\n ～(◎ω◎)～\n   转转转~' },
      { face: '(@_@)', body: '   ∧∧\n ～(≧▽≦)～\n   好晕喵~' },
    ],
    msgs: ['转转转~🌀', '头晕了喵！', '哈哈哈！', '好好玩！'],
    anim: { rotate: [0, 360] },
  },
  proud: {
    frames: [
      { face: '( =ω=)✧', body: '  ∧___∧\n  (｀ω´)ゞ\n  /つ🏅つ' },
    ],
    msgs: ['看我多厉害！', '骄傲.jpg', '就是这么优秀！✨'],
    anim: { y: [0, -6, 0], scale: [1, 1.03, 1] },
  },
  cuddle: {
    frames: [
      { face: '(=˶ᵔ ᵕ ᵔ˶=)', body: '  ⊂⌒っ♡ω♡)っ\n   想贴贴~' },
      { face: '(=´꒳`=)', body: '  ⊂⌒っ˘ω˘)っ\n   给你抱抱' },
    ],
    msgs: ['贴贴你！', '抱抱今天的你', '靠近一点喵~', '让我蹭蹭你♡'],
    anim: { x: [0, -5, 5, -5, 0], scale: [1, 1.04, 1] },
  },
  shy: {
    frames: [
      { face: '(=⸝⸝>  <⸝⸝=)', body: '  /ᐠ｡ꞈ｡ᐟ\\\n  (  害羞  )' },
      { face: '(=⸝⸝•́ω•̀⸝⸝=)', body: '  /ᐠ｡ꞈ｡ᐟ\\\n  (  偷看你 )' },
    ],
    msgs: ['你一看我就害羞…', '不要一直盯着我啦', '喵呜，有点脸红', '你今天很好看诶'],
    anim: { y: [0, -4, 0], rotate: [0, -2, 2, 0] },
  },
  roll: {
    frames: [
      { face: '(=^･ω･^=)', body: '  ＿/￣○\n  猫猫打滚~' },
      { face: '(=≧ω≦=)', body: '  ○＿/￣\n  再滚一下!' },
    ],
    msgs: ['看我打滚！', '软乎乎翻个身~', '再摸一下就继续滚', '地板好舒服呀'],
    anim: { rotate: [0, 8, -8, 8, 0], y: [0, -4, 0] },
  },
  peek: {
    frames: [
      { face: '|ૂ•ω•` )', body: '  ┌────┐\n  | 偷偷看 |\n  └────┘' },
      { face: '|ૂ•̀ω•́ )✧', body: '  ┌────┐\n  | 发现你啦 |\n  └────┘' },
    ],
    msgs: ['我在偷偷看你学习', '认真起来的你很闪亮', '我来巡逻啦', '有没有在偷懒呀~'],
    anim: { x: [0, -6, 0, 6, 0] },
  },
  snack: {
    frames: [
      { face: '(=^･ｪ･^=)', body: '  /ᐠ｡ꞈ｡ᐟ\\\n  ૮₍ ˃ ⤙ ˂ ₎ა🐟' },
      { face: '(=^･o･^=)', body: '  /ᐠ｡ꞈ｡ᐟ\\\n  鱼干分你一半' },
    ],
    msgs: ['给你鱼干！', '学习辛苦啦，吃一口~', '请你收下今日小零食', '鱼干和夸夸都给你'],
    anim: { y: [0, -8, 0], scale: [1, 1.06, 1] },
  },
  angel: {
    frames: [
      { face: '(=˘︶˘=)', body: '    ☁\n  /ᐠ｡ꞈ｡ᐟ\\\n   小天使喵' },
      { face: '(=ˊᵕˋ=)', body: '    ✧\n  /ᐠ｡ꞈ｡ᐟ\\\n   守护你呀' },
    ],
    msgs: ['今天也被我守护着', '顺顺利利，平平安安', '愿你心里有光', '给你一份温柔好运'],
    anim: { y: [0, -10, 0], scale: [1, 1.03, 1] },
  },
};

const TOUCH_POOL = ['happy', 'love', 'paw', 'excited', 'proud', 'cuddle', 'shy', 'peek', 'snack'];
const HEART_PARTICLES = ['💕', '♡', '💗', '✨', '⭐', '🩷', '💖', '❣️', '🎀', '🫧'];
const FLOAT_PARTICLES = ['🐾', '✨', '⭐', '💫', '🎀', '🐟'];
const INTERACTION_SETTLE_MS = 9000;

export default function CatPet({ mood = 'idle', onInteract }) {
  const [curMood, setCurMood] = useState(mood);
  const [frame, setFrame] = useState(0);
  const [msg, setMsg] = useState('');
  const [showMsg, setShowMsg] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [taps, setTaps] = useState(0);
  const [paws, setPaws] = useState([]);
  const [sparkles, setSparkles] = useState([]);
  const controls = useAnimation();
  const catRef = useRef(null);
  const msgTimer = useRef(null);
  const frameTimer = useRef(null);
  const settleTimer = useRef(null);

  useEffect(() => {
    setCurMood(mood);
    clearTimeout(settleTimer.current);
  }, [mood]);

  useEffect(() => {
    const cat = CATS[curMood] || CATS.idle;
    if (cat.frames.length <= 1) return undefined;

    frameTimer.current = setInterval(() => {
      setFrame((currentFrame) => (currentFrame + 1) % cat.frames.length);
    }, 800);

    return () => clearInterval(frameTimer.current);
  }, [curMood]);

  const showRandomMsg = useCallback((m) => {
    const cat = CATS[m || curMood] || CATS.idle;
    setMsg(cat.msgs[Math.floor(Math.random() * cat.msgs.length)]);
    setShowMsg(true);
    clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setShowMsg(false), 2200);
  }, [curMood]);

  useEffect(() => {
    if (curMood !== 'idle') return undefined;

    const intervalId = setInterval(() => {
      if (Math.random() > 0.6) showRandomMsg('idle');
    }, 4000);

    return () => clearInterval(intervalId);
  }, [curMood, showRandomMsg]);

  useEffect(() => {
    const cat = CATS[curMood] || CATS.idle;
    controls.start({
      ...cat.anim,
      transition: {
        duration: curMood === 'spin' ? 0.8 : 1.8,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
      },
    });
  }, [curMood, controls]);

  useEffect(() => () => {
    clearTimeout(msgTimer.current);
    clearTimeout(settleTimer.current);
    clearInterval(frameTimer.current);
  }, []);

  const scheduleSettleBack = useCallback((targetMood = mood) => {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      setCurMood(targetMood);
    }, INTERACTION_SETTLE_MS);
  }, [mood]);

  const handleInteract = useCallback((e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const nextTapCount = taps + 1;
    setTaps(nextTapCount);

    const rect = catRef.current?.getBoundingClientRect();
    if (rect) {
      const cursorX = (e.clientX || rect.left + rect.width / 2) - rect.left;
      const cursorY = (e.clientY || rect.top + rect.height / 2) - rect.top;
      const id = Date.now() + Math.random();

      setHearts((prev) => [...prev.slice(-10), { id, x: cursorX, y: cursorY }]);
      setTimeout(() => setHearts((prev) => prev.filter((heart) => heart.id !== id)), 1200);

      if (nextTapCount % 3 === 0) {
        const pawId = id + 0.5;
        setPaws((prev) => [...prev.slice(-4), { id: pawId, x: cursorX + (Math.random() - 0.5) * 60, y: cursorY + 20 }]);
        setTimeout(() => setPaws((prev) => prev.filter((paw) => paw.id !== pawId)), 2000);
      }

      if (nextTapCount % 2 === 0) {
        const sparkleId = id + 0.8;
        setSparkles((prev) => [
          ...prev.slice(-6),
          { id: sparkleId, x: cursorX + (Math.random() - 0.5) * 40, y: cursorY - 6, char: FLOAT_PARTICLES[nextTapCount % FLOAT_PARTICLES.length] },
        ]);
        setTimeout(() => setSparkles((prev) => prev.filter((item) => item.id !== sparkleId)), 1600);
      }
    }

    let nextMood;
    if (nextTapCount % 18 === 0) nextMood = 'angel';
    else if (nextTapCount % 15 === 0) nextMood = 'spin';
    else if (nextTapCount % 11 === 0) nextMood = 'roll';
    else if (nextTapCount % 7 === 0) nextMood = 'love';
    else if (nextTapCount % 5 === 0) nextMood = 'cuddle';
    else if (nextTapCount % 4 === 0) nextMood = 'shy';
    else nextMood = TOUCH_POOL[Math.floor(Math.random() * TOUCH_POOL.length)];

    setCurMood(nextMood);
    showRandomMsg(nextMood);
    onInteract?.();
    scheduleSettleBack();
  }, [taps, showRandomMsg, onInteract, scheduleSettleBack]);

  const cat = CATS[curMood] || CATS.idle;
  const currentFrame = cat.frames[frame % cat.frames.length];

  return (
    <div style={styles.wrap} ref={catRef}>
      <motion.div
        initial={false}
        animate={{ opacity: showMsg ? 1 : 0, y: showMsg ? 0 : 8, scale: showMsg ? 1 : 0.85 }}
        transition={{ duration: 0.25 }}
        style={styles.bubble}
      >
        <span style={styles.bubbleText}>{msg}</span>
        <div style={styles.bubbleTail} />
      </motion.div>

      <motion.div
        animate={controls}
        onPointerDown={handleInteract}
        style={styles.cat}
      >
        <motion.div
          key={curMood + frame}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={styles.face}
        >
          {currentFrame.face}
        </motion.div>
        <pre style={styles.body}>{currentFrame.body}</pre>
        <div style={styles.glow} />
      </motion.div>

      <motion.p
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        style={styles.hint}
      >
        轻轻摸摸猫咪 · 已贴贴 {taps} 次
      </motion.p>

      {hearts.map((heart) => (
        <motion.span
          key={heart.id}
          initial={{ opacity: 1, scale: 0.5, x: heart.x - 12, y: heart.y - 12 }}
          animate={{ opacity: 0, scale: 1.6, y: heart.y - 65, x: heart.x - 12 + (Math.random() - 0.5) * 50 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={styles.particle}
        >
          {HEART_PARTICLES[Math.floor(Math.random() * HEART_PARTICLES.length)]}
        </motion.span>
      ))}

      {paws.map((paw) => (
        <motion.span
          key={paw.id}
          initial={{ opacity: 0.8, scale: 0 }}
          animate={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 1.8 }}
          style={{ ...styles.particle, left: paw.x, top: paw.y, fontSize: 20 }}
        >
          🐾
        </motion.span>
      ))}

      {sparkles.map((sparkle) => (
        <motion.span
          key={sparkle.id}
          initial={{ opacity: 0, scale: 0.2, x: sparkle.x, y: sparkle.y }}
          animate={{ opacity: 0.95, scale: 1.15, y: sparkle.y - 42, x: sparkle.x + (Math.random() - 0.5) * 22 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ ...styles.particle, fontSize: 15 }}
        >
          {sparkle.char}
        </motion.span>
      ))}
    </div>
  );
}

const styles = {
  wrap: {
    position: 'relative',
    width: 224,
    minHeight: 176,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  bubble: {
    position: 'absolute',
    top: -2,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2,
    background: 'var(--c-card-solid)',
    borderRadius: 16,
    padding: '7px 14px',
    maxWidth: 184,
    boxShadow: 'var(--c-shadow)',
    border: '1px solid var(--c-border)',
  },
  bubbleText: {
    fontSize: 12.5,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    color: 'var(--c-text)',
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -5,
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    width: 10,
    height: 10,
    background: 'var(--c-card-solid)',
    border: '1px solid var(--c-border)',
    borderTop: 'none',
    borderLeft: 'none',
  },
  cat: {
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    padding: '10px 0',
  },
  face: {
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: '0.02em',
    lineHeight: 1.3,
    color: 'var(--c-text)',
    textAlign: 'center',
    textShadow: '0 1px 8px var(--c-cat-glow)',
  },
  body: {
    fontSize: 11,
    lineHeight: 1.28,
    fontFamily: "'Menlo','SF Mono','Courier New',monospace",
    color: 'var(--c-text2)',
    textAlign: 'center',
    margin: 0,
    marginTop: 2,
    whiteSpace: 'pre',
  },
  glow: {
    position: 'absolute',
    width: 146,
    height: 146,
    borderRadius: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    background: 'radial-gradient(circle, var(--c-cat-glow) 0%, transparent 72%)',
    pointerEvents: 'none',
  },
  hint: {
    position: 'absolute',
    bottom: -2,
    fontSize: 10,
    color: 'var(--c-text3)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
  },
  particle: {
    position: 'absolute',
    fontSize: 16,
    pointerEvents: 'none',
    zIndex: 3,
  },
};
