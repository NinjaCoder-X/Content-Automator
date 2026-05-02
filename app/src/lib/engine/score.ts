/**
 * Virality score (1–100). Computed from the generated content fields.
 * Each axis is bounded 0–100 and contributes a weighted slice of the total.
 *
 * Weights: hook 35%, emotion 25%, retention 25%, shareability 15%.
 */

export type ScoreBreakdown = {
  hook: number;
  emotion: number;
  retention: number;
  shareability: number;
  total: number;
};

const HOOK_TRIGGERS = [
  "stop",
  "nobody",
  "if you",
  "i wish",
  "warning",
  "the truth",
  "secret",
  "hidden",
  "this is why",
  "watch this",
  "you're not",
  "you are not",
  "99%",
  "doctors",
  "rich",
  "broke",
  "shocked",
  "lying",
];

const EMOTION_WORDS = [
  "shock",
  "broke",
  "rich",
  "scared",
  "angry",
  "love",
  "hate",
  "wish",
  "regret",
  "stuck",
  "trapped",
  "freedom",
  "ruin",
  "win",
  "lose",
  "secret",
  "lie",
  "truth",
  "panic",
  "alone",
  "powerful",
  "weak",
];

const SHARE_TRIGGERS = [
  "save this",
  "tag a friend",
  "comment",
  "share",
  "send this",
  "follow",
  "dm",
  "tag the",
  "tag your",
];

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function countMatches(text: string, list: string[]): number {
  const lower = text.toLowerCase();
  let n = 0;
  for (const w of list) if (lower.includes(w)) n += 1;
  return n;
}

export function scoreHook(hook: string): number {
  const len = hook.trim().length;
  // Sweet spot: 25–70 chars
  let lengthScore = 100;
  if (len < 15) lengthScore = 35;
  else if (len < 25) lengthScore = 65;
  else if (len > 90) lengthScore = 55;
  else if (len > 70) lengthScore = 80;

  const triggers = countMatches(hook, HOOK_TRIGGERS);
  const triggerScore = Math.min(100, triggers * 35 + 20);

  const punchy = /[?!.]/.test(hook) ? 12 : 0;
  return clamp(lengthScore * 0.5 + triggerScore * 0.45 + punchy);
}

export function scoreEmotion(text: string): number {
  const matches = countMatches(text, EMOTION_WORDS);
  const density = matches / Math.max(1, text.split(/\s+/).length / 25);
  return clamp(40 + density * 35 + matches * 4);
}

export function scoreRetention(script: string, loopEnding: string): number {
  const words = script.split(/\s+/).filter(Boolean).length;
  // Sweet spot: 25–50 words for a 10-15s reel
  let lengthScore = 100;
  if (words < 18) lengthScore = 50;
  else if (words < 25) lengthScore = 75;
  else if (words > 70) lengthScore = 55;
  else if (words > 50) lengthScore = 80;

  const hasLoop = loopEnding && loopEnding.trim().length > 0 ? 25 : 0;
  const callback = /replay|loop|watch.*from the start|read.*line|first frame|first line/i.test(
    loopEnding,
  )
    ? 15
    : 0;
  const curiosityGap = /(?:why|how|secret|hidden|truth|nobody|reason)/i.test(
    script,
  )
    ? 12
    : 0;
  return clamp(lengthScore * 0.55 + hasLoop + callback + curiosityGap);
}

export function scoreShareability(
  caption: string,
  hashtagCount: number,
): number {
  const triggers = countMatches(caption, SHARE_TRIGGERS);
  const cta = triggers >= 1 ? 40 : 10;
  const tagBonus = Math.min(40, hashtagCount * 5);
  const length = caption.length;
  const lengthBonus = length > 30 && length < 220 ? 18 : 6;
  return clamp(cta + tagBonus + lengthBonus);
}

export function computeScore(input: {
  hook: string;
  script: string;
  loopEnding: string;
  caption: string;
  hashtags: string[];
}): ScoreBreakdown {
  const h = scoreHook(input.hook);
  const e = scoreEmotion(`${input.hook} ${input.script}`);
  const r = scoreRetention(input.script, input.loopEnding);
  const s = scoreShareability(input.caption, input.hashtags.length);
  const total = clamp(h * 0.35 + e * 0.25 + r * 0.25 + s * 0.15);
  return { hook: h, emotion: e, retention: r, shareability: s, total };
}
