/**
 * The Viral Content Engine.
 *
 * Pipeline:
 *   topic → hook → script (hook + body + reveal + loop) → scene breakdown
 *         → caption + hashtags → virality score → final bundle
 *
 * The engine is deterministic-with-randomness: it never calls an external
 * service by default and produces fresh, niche-correct content every call.
 *
 * If process.env.OPENAI_API_KEY is set, the engine could be extended to
 * delegate to OpenAI — left as a TODO seam (see `generateWithLLM`).
 */
import {
  HOOK_PATTERNS,
  LOOP_ENDINGS,
  NICHE_DATA,
  PLATFORM_HASHTAG_BASE,
  SCENE_DURATIONS,
  SCENE_MOTIONS,
  type Niche,
  type Platform,
} from "./data";
import { computeScore, type ScoreBreakdown } from "./score";

export type Scene = {
  index: number;
  durationSec: number;
  voiceover: string;
  visualIdea: string;
  motion: string;
  stockQuery: string;
};

export type GenerateInput = {
  niche: Niche;
  platform: Platform;
  topicHint?: string;
  watermark?: boolean;
};

export type Generated = {
  niche: Niche;
  platform: Platform;
  topic: string;
  hook: string;
  script: string;
  loopEnding: string;
  breakdown: Scene[];
  caption: string;
  hashtags: string[];
  score: ScoreBreakdown;
  watermarked: boolean;
};

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function rngFromSeed(seed: number) {
  // Mulberry32 PRNG so generations vary but are reproducible if needed.
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fillTemplate(
  pattern: string,
  bank: { nouns: string[]; adjectives: string[] },
  rng: () => number,
): string {
  return pattern
    .replace("{X}", pick(bank.nouns, rng))
    .replace("{Y}", pick(bank.adjectives, rng));
}

function generateHook(niche: Niche, rng: () => number): string {
  const bank = NICHE_DATA[niche];
  const pattern = pick(HOOK_PATTERNS, rng);
  return fillTemplate(pattern, bank, rng);
}

function generateTopic(niche: Niche, hint: string | undefined, rng: () => number) {
  const bank = NICHE_DATA[niche];
  if (hint && hint.trim().length > 0) {
    return hint.trim().slice(0, 120);
  }
  return pick(bank.topics, rng);
}

function generateScript(
  niche: Niche,
  hook: string,
  topic: string,
  rng: () => number,
): { script: string; loopEnding: string } {
  const bank = NICHE_DATA[niche];
  const fact = pick(bank.facts, rng);
  const reveal = pick(bank.reveals, rng);
  const loop = pick(LOOP_ENDINGS, rng);

  // Five-beat structure tuned for 10–15 second reels.
  const beats = [
    hook,
    `Here's why: ${fact}`,
    `Most people miss it because ${topic} feels normal.`,
    reveal,
    loop,
  ];
  const script = beats.join(" ");
  return { script, loopEnding: loop };
}

function generateBreakdown(
  niche: Niche,
  hook: string,
  script: string,
  rng: () => number,
): Scene[] {
  const bank = NICHE_DATA[niche];
  // Split script into 5 roughly-equal voiceover slices.
  const sentences = script
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const slices: string[] = [];
  if (sentences.length >= 5) {
    slices.push(...sentences.slice(0, 5));
  } else {
    slices.push(hook);
    while (slices.length < 5) {
      slices.push(sentences[(slices.length - 1) % sentences.length] ?? hook);
    }
  }
  return slices.map((vo, i) => ({
    index: i,
    durationSec: SCENE_DURATIONS[i % SCENE_DURATIONS.length],
    voiceover: vo,
    visualIdea: pick(bank.stockQueries, rng),
    motion: pick(SCENE_MOTIONS, rng),
    stockQuery: pick(bank.stockQueries, rng),
  }));
}

function generateCaption(
  niche: Niche,
  topic: string,
  rng: () => number,
): string {
  const bank = NICHE_DATA[niche];
  const e1 = pick(bank.emojis, rng);
  const e2 = pick(bank.emojis, rng);
  const cta = pick(bank.ctas, rng);
  const lead = `${e1} ${capitalize(topic)} ${e2}`;
  return `${lead}\n\n${cta}\n— if this hit, follow for the next one.`;
}

function generateHashtags(
  niche: Niche,
  platform: Platform,
  rng: () => number,
): string[] {
  const base = NICHE_DATA[niche].hashtags;
  const platformTags = PLATFORM_HASHTAG_BASE[platform];
  const all = [...new Set([...base, ...platformTags])];
  // Pick 8–12 hashtags, ordered: niche first, then platform/discovery.
  const count = 8 + Math.floor(rng() * 5);
  return all.slice(0, Math.min(count, all.length));
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

function applyWatermark(g: Generated): Generated {
  const tag = "\n\n— made with AI Content Factory (free plan)";
  return {
    ...g,
    caption: g.caption + tag,
    script: g.script + " ✦",
    loopEnding: g.loopEnding,
  };
}

export function generate(input: GenerateInput): Generated {
  const seed = Date.now() ^ Math.floor(Math.random() * 1e9);
  const rng = rngFromSeed(seed);

  const topic = generateTopic(input.niche, input.topicHint, rng);
  const hook = generateHook(input.niche, rng);
  const { script, loopEnding } = generateScript(input.niche, hook, topic, rng);
  const breakdown = generateBreakdown(input.niche, hook, script, rng);
  const caption = generateCaption(input.niche, topic, rng);
  const hashtags = generateHashtags(input.niche, input.platform, rng);
  const score = computeScore({ hook, script, loopEnding, caption, hashtags });

  const out: Generated = {
    niche: input.niche,
    platform: input.platform,
    topic,
    hook,
    script,
    loopEnding,
    breakdown,
    caption,
    hashtags,
    score,
    watermarked: !!input.watermark,
  };
  return input.watermark ? applyWatermark(out) : out;
}

export type PlannerItem = {
  dayOffset: number;
  niche: Niche;
  platform: Platform;
  hook: string;
  angle: string;
  cta: string;
};

/**
 * 7-day content calendar. Rotates through the user's preferred niches
 * (or all 5 if none provided) and varies platforms day by day.
 */
export function generatePlanner(opts: {
  niches?: Niche[];
  platforms?: Platform[];
}): PlannerItem[] {
  const niches: Niche[] =
    opts.niches && opts.niches.length > 0
      ? opts.niches
      : (["motivation", "money", "fitness", "psychology", "tech"] as Niche[]);
  const platforms: Platform[] =
    opts.platforms && opts.platforms.length > 0
      ? opts.platforms
      : (["instagram", "youtube", "facebook"] as Platform[]);

  const seed = Date.now();
  const rng = rngFromSeed(seed);
  const items: PlannerItem[] = [];

  for (let day = 0; day < 7; day += 1) {
    const niche = niches[day % niches.length];
    const platform = platforms[day % platforms.length];
    const bank = NICHE_DATA[niche];
    items.push({
      dayOffset: day,
      niche,
      platform,
      hook: fillTemplate(pick(HOOK_PATTERNS, rng), bank, rng),
      angle: pick(bank.topics, rng),
      cta: pick(bank.ctas, rng),
    });
  }
  return items;
}
