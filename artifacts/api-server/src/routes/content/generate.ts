import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  GenerateTopicsBody,
  GenerateScriptBody,
  GenerateMetadataBody,
} from "@workspace/api-zod";

const router = Router();

const NICHE_PROMPTS: Record<string, string> = {
  facts: "mind-blowing scientific or historical facts that most people don't know",
  psychology: "psychological tricks, cognitive biases, or manipulation tactics that reveal how the human mind works",
  money: "financial secrets, wealth-building tricks, or shocking money facts that banks don't want you to know",
  tech: "tech secrets, hidden features, or shocking truths about technology and social media",
  body: "surprising facts about the human body, brain, or biology",
  dark: "dark truths about society, history, or human nature that most people prefer to ignore",
};

router.post("/generate-topics", async (req, res) => {
  const parsed = GenerateTopicsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { niche, count = 5 } = parsed.data;

  if (!NICHE_PROMPTS[niche]) {
    res.status(400).json({ error: "Invalid niche provided" });
    return;
  }

  const nichePrompt = NICHE_PROMPTS[niche];

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 2048,
    messages: [
      {
        role: "system",
        content: `You are a viral content strategist who specializes in creating short-form video content for Instagram Reels, YouTube Shorts, and TikTok. Your content focuses on ${nichePrompt}.`,
      },
      {
        role: "user",
        content: `Generate ${count} viral topic ideas for a 10-15 second reel about ${nichePrompt}.

Each topic must:
- Have a shocking or curiosity-triggering hook
- Be educational and fact-based
- Be monetization-safe
- Work for a quick reveal format

Return JSON array of objects with fields:
- title: string (the topic)
- hook: string (2-3 word hook that opens the video, e.g. "Your brain lies...", "Nobody tells you...", "Hidden by banks...")

ONLY return the JSON array, no other text.`,
      },
    ],
  });

  const rawContent = response.choices[0]?.message?.content ?? "[]";

  let topicList: Array<{ title: string; hook: string }> = [];
  try {
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    topicList = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
  } catch {
    topicList = [];
  }

  const insertedTopics = await Promise.all(
    topicList.map((t) =>
      db
        .insert(topicsTable)
        .values({ niche, title: t.title, hook: t.hook, status: "pending" })
        .returning()
        .then((rows) => rows[0])
    )
  );

  res.status(201).json(insertedTopics.filter(Boolean));
});

router.post("/generate-script", async (req, res) => {
  const parsed = GenerateScriptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { topicId, niche, title, hook } = parsed.data;

  // Validate niche to prevent prompt injection
  const allowedNiches = ["facts", "psychology", "money", "tech", "body", "dark"];
  if (!allowedNiches.includes(niche)) {
    res.status(400).json({ error: "Invalid niche provided" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const systemPrompt = `You are a viral short-form video scriptwriter. You write 8-15 second scripts for Instagram Reels, YouTube Shorts, and TikTok. Your scripts are educational, shocking, and designed to maximize watch time and replays.

Script format rules:
- Hook (1-2 lines): Shocking opening that grabs attention in 2 seconds
- Build (1-2 lines): Build tension/curiosity
- Reveal (1-2 lines): The surprising truth or fact
- Loop Ending (1 line): End that makes the viewer want to watch again

Keep total script under 150 words. Use simple, powerful language.`;

  const userPrompt = `Write a viral script for a reel about: "${title}"

Opening hook: "${hook}"
Niche: ${niche}

Return ONLY a JSON object (no markdown, no code blocks) with these exact fields:
{
  "hook": "the opening hook line",
  "body": "the build tension section",
  "reveal": "the surprising reveal",
  "loopEnding": "the loop trigger ending",
  "fullScript": "all sections combined as one flowing script",
  "durationSeconds": 12
}`;

  let fullContent = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullContent += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    let scriptData: Record<string, unknown> = {};
    try {
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      scriptData = JSON.parse(jsonMatch ? jsonMatch[0] : fullContent);
    } catch {
      scriptData = {
        hook,
        body: "The truth about this will shock you.",
        reveal: title,
        loopEnding: "But wait... there's more.",
        fullScript: fullContent,
        durationSeconds: 12,
      };
    }

    const [script] = await db
      .insert(scriptsTable)
      .values({
        topicId: topicId ?? null,
        niche,
        title,
        hook: String(scriptData.hook ?? hook),
        body: String(scriptData.body ?? ""),
        reveal: String(scriptData.reveal ?? ""),
        loopEnding: String(scriptData.loopEnding ?? ""),
        fullScript: String(scriptData.fullScript ?? fullContent),
        durationSeconds: Number(scriptData.durationSeconds ?? 12),
        status: "draft",
      })
      .returning();

    if (topicId) {
      await db
        .update(topicsTable)
        .set({ status: "scripted" })
        .where(eq(topicsTable.id, topicId));
    }

    res.write(
      `data: ${JSON.stringify({ done: true, scriptId: script?.id, script })}\n\n`
    );
  } catch (err) {
    res.write(
      `data: ${JSON.stringify({ error: "Script generation failed" })}\n\n`
    );
  } finally {
    res.end();
  }
});

router.post("/generate-metadata", async (req, res) => {
  const parsed = GenerateMetadataBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { scriptId, platform } = parsed.data;

  const [script] = await db
    .select()
    .from(scriptsTable)
    .where(eq(scriptsTable.id, scriptId));

  if (!script) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  const platformNames: Record<string, string> = {
    instagram: "Instagram Reels",
    youtube: "YouTube Shorts",
    facebook: "Facebook Reels",
    all: "Instagram Reels, YouTube Shorts, and Facebook Reels",
  };

  const platformName = platformNames[platform] ?? platform;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 512,
    messages: [
      {
        role: "system",
        content:
          "You create viral social media metadata for short-form video content. Optimize for discoverability and engagement.",
      },
      {
        role: "user",
        content: `Create metadata for this viral reel script optimized for ${platformName}:

Script: "${script.fullScript}"
Niche: ${script.niche}

Return ONLY a JSON object (no markdown):
{
  "title": "catchy video title under 60 chars",
  "caption": "engaging caption 100-150 chars with call-to-action",
  "hashtags": "10-15 relevant hashtags separated by spaces, starting with #"
}`,
      },
    ],
  });

  const rawContent = response.choices[0]?.message?.content ?? "{}";

  let metadata: { title: string; caption: string; hashtags: string } = {
    title: script.title,
    caption: script.hook,
    hashtags: `#${script.niche} #viral #facts #shorts`,
  };

  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    metadata = {
      title: String(parsed.title ?? metadata.title),
      caption: String(parsed.caption ?? metadata.caption),
      hashtags: String(parsed.hashtags ?? metadata.hashtags),
    };
  } catch {
    // keep defaults
  }

  await db
    .update(videosTable)
    .set({
      title: metadata.title,
      caption: metadata.caption,
      hashtags: metadata.hashtags,
    })
    .where(eq(videosTable.scriptId, scriptId));

  res.json(metadata);
});

export default router;
