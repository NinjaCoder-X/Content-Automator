/**
 * Niche-specific knowledge banks used by the deterministic content engine.
 * The engine combines these primitives with stochastic templates to produce
 * fresh, viral-style scripts every call without needing an external LLM.
 */

export const NICHES = [
  "motivation",
  "money",
  "fitness",
  "psychology",
  "tech",
] as const;
export type Niche = (typeof NICHES)[number];

export const PLATFORMS = ["instagram", "youtube", "facebook"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const NICHE_LABELS: Record<Niche, string> = {
  motivation: "Motivation",
  money: "Money / Finance",
  fitness: "Fitness",
  psychology: "Psychology",
  tech: "Tech facts",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram Reels",
  youtube: "YouTube Shorts",
  facebook: "Facebook Reels",
};

/**
 * Patterns for the first 1–2 seconds. Designed to maximize curiosity gap.
 * `{X}` will be replaced with a niche-specific noun, `{Y}` with an adjective.
 */
export const HOOK_PATTERNS: string[] = [
  "Stop scrolling. {X} is lying to you.",
  "If you keep doing {X}, you'll stay broke.",
  "Nobody talks about this {X} secret.",
  "I wish I knew this about {X} at 18.",
  "This 5-second {X} hack changed everything.",
  "You're not lazy. {X} is rigged against you.",
  "The richest people use this {X} trick daily.",
  "99% of people get {X} completely wrong.",
  "Watch this before you do {X} again.",
  "Your {X} is sabotaging your future.",
  "The truth about {X} they don't want you to see.",
  "{Y} people do this with {X} every morning.",
  "I tested {X} for 30 days. The result shocked me.",
  "There is a hidden rule in {X}. It's brutal.",
  "Doctors hate this 1-minute {X} fix.",
  "Read this twice. {X} is not what you think.",
];

export const LOOP_ENDINGS: string[] = [
  "Watch from the start — you missed the real twist.",
  "Replay the first line. It hits different now.",
  "Save this. You'll need it tomorrow.",
  "If you read this far, you already know the answer.",
  "Most people stop at second 3. The point is at second 11.",
  "The clue was in the first frame. Replay.",
  "Now go back and read line one — it changes everything.",
  "Loop it. The hook becomes the proof.",
];

export type NicheBank = {
  topics: string[]; // shortform topic ideas
  nouns: string[]; // for {X}
  adjectives: string[]; // for {Y}
  facts: string[]; // educational lines
  reveals: string[]; // surprising twists
  ctas: string[]; // calls to action
  emojis: string[];
  hashtags: string[];
  stockQueries: string[]; // search terms for stock footage
};

export const NICHE_DATA: Record<Niche, NicheBank> = {
  motivation: {
    topics: [
      "the 5am rule everyone gets wrong",
      "the only mindset shift that matters",
      "why discipline beats motivation",
      "the 1% rule for daily growth",
      "what nobody tells you about consistency",
      "the comfort zone trap",
      "why most goals fail by February",
      "the underdog mindset of top 1%",
    ],
    nouns: [
      "your morning routine",
      "your goals",
      "your discipline",
      "your habits",
      "your mindset",
      "your hustle",
      "your routine",
    ],
    adjectives: ["successful", "elite", "high-performing", "ruthless", "calm"],
    facts: [
      "Your environment writes your future, not your willpower.",
      "Consistency for 90 days outperforms intensity for 9 days.",
      "Top performers default to systems, not motivation.",
      "Identity comes before action. You become what you repeat.",
      "Discomfort is a signal you're growing, not failing.",
    ],
    reveals: [
      "It was never about working harder. It was about working narrower.",
      "The bottleneck wasn't discipline. It was clarity.",
      "Most people quit two days before the breakthrough.",
      "The 'lucky' ones stacked tiny wins for 1000 days straight.",
    ],
    ctas: [
      "Comment GROW and I'll send the framework.",
      "Save this as a reminder.",
      "Follow for the next 1% rule.",
      "Tag the friend who needs this.",
    ],
    emojis: ["🔥", "💪", "🧠", "⚡", "🎯", "🚀"],
    hashtags: [
      "#motivation",
      "#mindset",
      "#discipline",
      "#growth",
      "#selfimprovement",
      "#successmindset",
      "#1percentbetter",
      "#dailyhabits",
    ],
    stockQueries: [
      "person running at sunrise",
      "macbook on a clean desk",
      "neon city at night",
      "hand writing in journal",
      "athlete tying shoes close-up",
    ],
  },
  money: {
    topics: [
      "the 50/30/20 budget hack",
      "what banks don't want you to know",
      "compound interest in 15 seconds",
      "why your salary won't make you rich",
      "the rich tax loophole",
      "the 3 income streams everyone needs",
      "the credit card mistake costing you thousands",
      "how to save your first $10k",
    ],
    nouns: [
      "your savings",
      "your credit score",
      "your paycheck",
      "your portfolio",
      "your bills",
      "your bank",
    ],
    adjectives: ["wealthy", "self-made", "frugal", "smart", "broke"],
    facts: [
      "$200/month at 9% becomes $397k in 30 years.",
      "The top 1% spends 28% of income on assets, not stuff.",
      "Inflation is a 3% pay cut every year you don't invest.",
      "Most millionaires drive cars older than 5 years.",
      "Pay yourself first. The rest is leftover, not budget.",
    ],
    reveals: [
      "Your first job isn't to make money. It's to keep what you make.",
      "The wealthy don't earn more. They protect more.",
      "Time in the market beats timing the market — every single year.",
      "The fastest way to be rich is to look poor for 5 years.",
    ],
    ctas: [
      "Comment WEALTH and I'll DM the spreadsheet.",
      "Save this so future you doesn't pay full price.",
      "Follow for the next money rule the rich use.",
    ],
    emojis: ["💸", "💰", "📈", "🏦", "💎", "🧾"],
    hashtags: [
      "#money",
      "#finance",
      "#investing",
      "#personalfinance",
      "#wealth",
      "#financialfreedom",
      "#moneytips",
      "#savings",
    ],
    stockQueries: [
      "stack of dollar bills close-up",
      "stock chart on phone screen",
      "person counting cash",
      "ATM machine at night",
      "luxury car parked in driveway",
    ],
  },
  fitness: {
    topics: [
      "the 1 ab move that beats sit-ups",
      "why cardio isn't burning fat",
      "the protein rule everyone breaks",
      "5-minute fat-burn routine",
      "the squat mistake wrecking your knees",
      "why you can't lose belly fat",
      "the morning ritual that builds muscle",
      "rest days actually grow muscle",
    ],
    nouns: [
      "your workout",
      "your form",
      "your diet",
      "your recovery",
      "your routine",
    ],
    adjectives: ["shredded", "athletic", "lean", "explosive", "exhausted"],
    facts: [
      "Muscle grows during recovery, not the workout itself.",
      "1g of protein per lb of bodyweight is the floor — not the ceiling.",
      "Sleeping 6 hours cuts muscle synthesis by ~18%.",
      "Walking 10k steps daily burns more fat than 30-min HIIT.",
      "Form > weight. Always.",
    ],
    reveals: [
      "The reason you're stuck isn't effort. It's your tempo.",
      "Belly fat is hormonal, not abdominal. Train sleep first.",
      "You don't need more reps. You need slower negatives.",
      "Hydration alone can drop 3 lbs of bloat in a week.",
    ],
    ctas: [
      "Comment SHRED and I'll send the 4-week plan.",
      "Save this so you stop skipping leg day.",
      "Follow for the next form fix.",
    ],
    emojis: ["💪", "🏋️", "🔥", "🥩", "🧊", "🏃"],
    hashtags: [
      "#fitness",
      "#gym",
      "#workout",
      "#fitnesstips",
      "#fatloss",
      "#muscle",
      "#bodybuilding",
      "#healthylifestyle",
    ],
    stockQueries: [
      "person lifting dumbbells",
      "treadmill close-up",
      "healthy meal prep containers",
      "athlete stretching outdoors",
      "barbell on gym floor",
    ],
  },
  psychology: {
    topics: [
      "the dark psychology of small talk",
      "why your brain lies during decisions",
      "the 7-second rule of first impressions",
      "manipulation tactics you use without knowing",
      "the bystander effect explained",
      "why we love what hurts us",
      "the psychology of FOMO in 15 seconds",
      "the spotlight effect — nobody notices",
    ],
    nouns: [
      "your brain",
      "your decisions",
      "your memory",
      "your bias",
      "your habits",
    ],
    adjectives: ["smart", "naive", "anxious", "overconfident", "manipulated"],
    facts: [
      "We make 35,000 decisions a day — most before we're awake.",
      "Cognitive bias makes you trust confidence over competence.",
      "Your brain edits memories every time you recall them.",
      "Silence in conversation triggers compliance after 4 seconds.",
      "The Zeigarnik effect: open loops keep your brain hooked.",
    ],
    reveals: [
      "It wasn't your decision. It was the framing.",
      "Your brain prefers the wrong answer if it sounds simpler.",
      "You feel watched because of the spotlight effect — nobody is.",
      "What feels like intuition is just pattern bias.",
    ],
    ctas: [
      "Comment MIND and I'll send the cheat sheet.",
      "Save this. You'll catch yourself doing it.",
      "Follow for the next bias they use on you.",
    ],
    emojis: ["🧠", "🎭", "🪞", "🧩", "👁️", "💭"],
    hashtags: [
      "#psychology",
      "#mindhack",
      "#humanbehavior",
      "#mentalhealth",
      "#facts",
      "#brainfacts",
      "#selfawareness",
      "#cognitivebias",
    ],
    stockQueries: [
      "human eye macro shot",
      "silhouette in fog",
      "dominoes falling",
      "brain MRI scan",
      "person looking in mirror",
    ],
  },
  tech: {
    topics: [
      "the iPhone setting that ruins your battery",
      "why your wifi is slow at 8pm",
      "AI is replacing this job in 2026",
      "the hidden chrome trick saving 4 hours/week",
      "your phone is listening — proof inside",
      "the password mistake hackers love",
      "why USB-C is winning",
      "the 1995 web rule that still runs everything",
    ],
    nouns: [
      "your phone",
      "your laptop",
      "your wifi",
      "your password",
      "your AI",
    ],
    adjectives: ["smart", "exposed", "obsolete", "secret", "vulnerable"],
    facts: [
      "Your phone wakes up 2,617 times a day — even in your pocket.",
      "62% of breaches start with a reused password.",
      "AI image gen renders 40% faster on M-chip Macs vs Intel.",
      "Browser tabs eat ~150MB each, even idle.",
      "TLS 1.3 handshake takes 1 round trip — old TLS took 4.",
    ],
    reveals: [
      "It's not your wifi. It's the channel — change it to 6 or 11.",
      "It's not 'AI' that took the job. It's the spreadsheet macro.",
      "Your data isn't sold once. It's resold 4× a day.",
      "The fix was a settings toggle — nobody told you.",
    ],
    ctas: [
      "Comment TECH and I'll send the settings guide.",
      "Save this. You'll need it during the next outage.",
      "Follow for the next hidden setting.",
    ],
    emojis: ["📱", "🤖", "💻", "🔒", "🛰️", "⚙️"],
    hashtags: [
      "#tech",
      "#techfacts",
      "#ai",
      "#cybersecurity",
      "#technology",
      "#geek",
      "#techtips",
      "#shorts",
    ],
    stockQueries: [
      "person typing on laptop",
      "code on monitor close-up",
      "phone screen unlocking",
      "server room blinking lights",
      "AI brain illustration",
    ],
  },
};

export const PLATFORM_HASHTAG_BASE: Record<Platform, string[]> = {
  instagram: ["#reels", "#explore", "#instagram", "#viral", "#fyp"],
  youtube: ["#shorts", "#youtubeshorts", "#viralshorts", "#youtube", "#trending"],
  facebook: ["#facebookreels", "#viral", "#shorts", "#explore", "#trending"],
};

export const SCENE_MOTIONS: string[] = [
  "Slow zoom-in on subject",
  "Quick cut to text overlay",
  "Punch-in (90% → 100%) on the speaker",
  "Whip pan from left to right",
  "Smooth dolly toward the object",
  "Beat-synced cut on the third word",
  "Static wide shot, hold for 1.5s",
  "Rack focus from foreground to background",
  "Crash zoom on the surprise frame",
  "Match cut to next scene",
];

export const SCENE_DURATIONS = [1.2, 1.5, 1.8, 2.0, 2.4, 2.8];
