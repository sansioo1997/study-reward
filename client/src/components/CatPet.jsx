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
  wink: {
    frames: [
      { face: '(=^_~=)', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   给你眨眼' },
      { face: '(=^_－=)☆', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   收到暗号啦' },
    ],
    msgs: ['偷偷给你一个 wink', '我在给你加油哦', '收到猫咪暗号没？'],
    anim: { rotate: [0, -4, 4, 0], y: [0, -5, 0] },
  },
  cheer: {
    frames: [
      { face: '(=•̀ω•́=)و', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   冲呀冲呀' },
      { face: '(=ง •̀_•́)ง', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   我来助威' },
    ],
    msgs: ['打起精神来！', '今天也稳稳前进', '你离目标更近啦'],
    anim: { y: [0, -14, 0], scale: [1, 1.06, 1] },
  },
  stretch: {
    frames: [
      { face: '(=^-ω-^=)~', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   伸个懒腰' },
      { face: '(=￣ω￣=)', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   松松肩膀' },
    ],
    msgs: ['陪你一起拉伸一下', '放松一下再继续', '稳稳地学，也要稳稳地歇'],
    anim: { x: [0, -6, 6, 0], y: [0, -4, 0] },
  },
  purr: {
    frames: [
      { face: '(=˘ω˘=)~♡', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   呼噜呼噜' },
      { face: '(=①ω①=)', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   超满足喵' },
    ],
    msgs: ['呼噜呼噜陪着你', '安静努力也很棒', '认真时最迷人啦'],
    anim: { scale: [1, 1.04, 1], y: [0, -3, 0] },
  },
  guard: {
    frames: [
      { face: '(=•̀ㅅ•́=)', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   巡逻中...' },
      { face: '(=•̀д•́=)', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   替你站岗' },
    ],
    msgs: ['学习区安全，继续前进', '我来守着你的专注', '今天不让懒惰靠近'],
    anim: { x: [0, -5, 5, 0], rotate: [0, -2, 2, 0] },
  },
  focus: {
    frames: [
      { face: '(=•̀ᴗ•́=)', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   专注模式' },
      { face: '(=•̀ω•́=)✎', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   认真喵喵' },
    ],
    msgs: ['我陪你一起进入状态', '先做眼前这一小步', '专注五分钟也很厉害'],
    anim: { scale: [1, 1.03, 1], y: [0, -4, 0] },
  },
  wish: {
    frames: [
      { face: '(=ˊᗜˋ=)', body: '   ☆\n  /ᐠ｡ꞈ｡ᐟ\\\n   许个愿吧' },
      { face: '(=ˊᵕˋ=)☆', body: '   ✨\n  /ᐠ｡ꞈ｡ᐟ\\\n   好运加一' },
    ],
    msgs: ['把愿望悄悄放进口袋', '今天也会有好消息', '努力和好运都在路上'],
    anim: { y: [0, -11, 0], scale: [1, 1.05, 1] },
  },
  bounce: {
    frames: [
      { face: '(=^･ω･^=)੭', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   弹弹弹!' },
      { face: '(=^･o･^=)੭', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   跳一下~' },
    ],
    msgs: ['给你一点元气弹跳', '轻轻一跳，烦恼飞掉', '猫猫弹跳加持中'],
    anim: { y: [0, -18, 0, -8, 0], scale: [1, 1.05, 0.98, 1.03, 1] },
  },
  cozy: {
    frames: [
      { face: '(=˘⌣˘=)', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   暖暖陪伴' },
      { face: '(=´ω｀=)', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   软软守候' },
    ],
    msgs: ['慢慢来也很棒', '你可以温柔但坚定', '今天也要照顾好自己'],
    anim: { y: [0, -5, 0], scale: [1, 1.02, 1] },
  },
  salute: {
    frames: [
      { face: '(=｀ω´=)ゞ', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   猫式敬礼' },
      { face: '(=•̀ω•́=)ゝ', body: '  /ᐠ｡ꞈ｡ᐟ\\\n   收到任务' },
    ],
    msgs: ['收到，继续努力', '向坚持的你敬礼', '任务已确认，前进喵'],
    anim: { rotate: [0, -3, 3, 0], y: [0, -8, 0] },
  },
};

const TOUCH_POOL = ['happy', 'love', 'paw', 'excited', 'proud', 'cuddle', 'shy', 'peek', 'snack', 'wink', 'cheer', 'stretch', 'purr', 'guard', 'focus', 'wish', 'bounce', 'cozy', 'salute'];
const INTERACTION_SCENES = [
  { mood: 'happy', message: '你一摸我就开心到冒泡啦' },
  { mood: 'love', message: '今天先给你一个爱心贴贴' },
  { mood: 'paw', message: '肉球签到成功，喵!' },
  { mood: 'excited', message: '检测到认真学习的人类靠近中' },
  { mood: 'proud', message: '今天的你值得一枚小奖章' },
  { mood: 'cuddle', message: '来，给努力的你一个抱抱' },
  { mood: 'shy', message: '你突然摸我，我会害羞啦' },
  { mood: 'peek', message: '巡逻的猫猫发现你在努力' },
  { mood: 'snack', message: '今日奖励是一份鱼干鼓励' },
  { mood: 'angel', message: '好运小天使猫猫已上线' },
  { mood: 'wink', message: '给你一个悄悄加油的眨眼' },
  { mood: 'cheer', message: '这一局，我押你一定能行' },
  { mood: 'stretch', message: '先松松肩膀，再继续冲刺' },
  { mood: 'purr', message: '呼噜声里全是对你的夸奖' },
  { mood: 'guard', message: '别担心，我替你守住专注' },
  { mood: 'focus', message: '现在是认真发光时间' },
  { mood: 'wish', message: '悄悄许愿，今天会有收获' },
  { mood: 'bounce', message: '给你补一颗元气弹跳球' },
  { mood: 'cozy', message: '慢一点，也是在向前走' },
  { mood: 'salute', message: '向今天没放弃的你敬礼' },
  { mood: 'happy', message: '喵喵认定你是今日最佳努力家' },
  { mood: 'love', message: '认真学习的人最值得被偏爱' },
  { mood: 'paw', message: '本猫宣布这次摸摸非常合格' },
  { mood: 'excited', message: '听见梦想靠近的声音啦' },
  { mood: 'proud', message: '请收下猫猫颁发的闪亮认证' },
  { mood: 'cuddle', message: '再坚持一下，我就继续贴贴你' },
  { mood: 'shy', message: '你夸我可爱，我会更害羞的' },
  { mood: 'peek', message: '偷看一眼，发现你还在努力' },
  { mood: 'snack', message: '奖励加餐是鼓励和小鱼干' },
  { mood: 'angel', message: '愿你今天也顺顺利利' },
  { mood: 'wink', message: '秘密提示：你真的进步了' },
  { mood: 'cheer', message: '打起精神，下一步就会更顺' },
  { mood: 'stretch', message: '伸个懒腰，继续慢慢变强' },
  { mood: 'purr', message: '我在这里陪你稳定输出' },
  { mood: 'guard', message: '已经把拖延挡在门外啦' },
  { mood: 'focus', message: '这一分钟，先只做好一件事' },
  { mood: 'wish', message: '把今天的期待交给时间发芽' },
  { mood: 'bounce', message: '轻轻一跳，烦躁都弹走啦' },
  { mood: 'cozy', message: '你不用很急，也能很坚定' },
  { mood: 'salute', message: '为今天继续出发的你鼓掌' },
  { mood: 'happy', message: '好耶，又收获一次温柔互动' },
  { mood: 'love', message: '猫猫觉得你今天特别发光' },
  { mood: 'paw', message: '送你一枚软乎乎的肉球印章' },
  { mood: 'excited', message: '前方发现好运和成果正在靠近' },
  { mood: 'proud', message: '你认真起来的样子很值得骄傲' },
  { mood: 'cuddle', message: '学习也要被好好抱一抱' },
  { mood: 'wink', message: '悄悄说，你比昨天更棒了' },
  { mood: 'focus', message: '继续保持，这股劲头很好' },
  { mood: 'guard', message: '猫猫站岗中，请放心专注' },
  { mood: 'wish', message: '把这次摸摸变成今天的小幸运' },
];
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

  const showRandomMsg = useCallback((m, overrideMessage) => {
    const cat = CATS[m || curMood] || CATS.idle;
    setMsg(overrideMessage || cat.msgs[Math.floor(Math.random() * cat.msgs.length)]);
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

    let scene;
    if (nextTapCount % 21 === 0) scene = { mood: 'angel', message: '连续贴贴成就达成，送你一圈好运光环' };
    else if (nextTapCount % 16 === 0) scene = { mood: 'spin', message: '猫猫开心到原地转圈圈啦' };
    else if (nextTapCount % 12 === 0) scene = { mood: 'roll', message: '奖励你一只打滚庆祝的猫猫' };
    else if (nextTapCount % 9 === 0) scene = { mood: 'love', message: '今天的坚持值得一大团爱心' };
    else {
      const randomOffset = Math.floor(Math.random() * INTERACTION_SCENES.length);
      scene = INTERACTION_SCENES[(nextTapCount + randomOffset) % INTERACTION_SCENES.length];
    }

    const nextMood = scene?.mood || TOUCH_POOL[Math.floor(Math.random() * TOUCH_POOL.length)];

    setCurMood(nextMood);
    showRandomMsg(nextMood, scene?.message);
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
