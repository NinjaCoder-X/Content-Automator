import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const topicsTable = pgTable("topics", {
  id: serial("id").primaryKey(),
  niche: text("niche").notNull(),
  title: text("title").notNull(),
  hook: text("hook").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scriptsTable = pgTable("scripts", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").references(() => topicsTable.id),
  niche: text("niche").notNull(),
  title: text("title").notNull(),
  hook: text("hook").notNull(),
  body: text("body").notNull(),
  reveal: text("reveal").notNull(),
  loopEnding: text("loop_ending").notNull(),
  fullScript: text("full_script").notNull(),
  durationSeconds: integer("duration_seconds").notNull().default(12),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const videosTable = pgTable("videos", {
  id: serial("id").primaryKey(),
  scriptId: integer("script_id")
    .notNull()
    .references(() => scriptsTable.id),
  niche: text("niche").notNull(),
  title: text("title").notNull(),
  caption: text("caption").notNull().default(""),
  hashtags: text("hashtags").notNull().default(""),
  platform: text("platform").notNull().default("all"),
  status: text("status").notNull().default("queued"),
  voiceStyle: text("voice_style").notNull().default("energetic"),
  subtitlesEnabled: boolean("subtitles_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTopicSchema = createInsertSchema(topicsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topicsTable.$inferSelect;

export const insertScriptSchema = createInsertSchema(scriptsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scriptsTable.$inferSelect;

export const insertVideoSchema = createInsertSchema(videosTable).omit({
  id: true,
  createdAt: true,
});
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videosTable.$inferSelect;
