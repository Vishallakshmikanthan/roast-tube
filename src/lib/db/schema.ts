import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  googleSub: text("google_sub").notNull().unique(),
  displayName: text("display_name").notNull(), // first name only is shown in battles
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}); // no email stored for privacy

export const analyses = pgTable(
  "analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stats: jsonb("stats").notNull(), // Stats (numbers only)
    tz: text("tz").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(), // now + 30d
  },
  (t) => ({
    byUser: index("analyses_user_idx").on(t.userId, t.createdAt),
  })
);

export const roasts = pgTable(
  "roasts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    analysisId: uuid("analysis_id")
      .notNull()
      .references(() => analyses.id, { onDelete: "cascade" }),
    persona: text("persona").notNull(),
    lang: text("lang").notNull(), // en | tanglish | hinglish
    heat: text("heat").notNull(), // mild | medium | max
    content: jsonb("content").notNull(), // RoastContent
    degraded: boolean("degraded").notNull().default(false),
    slug: text("slug").notNull().unique(), // nanoid(10)
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (t) => ({
    combo: uniqueIndex("roasts_combo_uq").on(
      t.analysisId,
      t.persona,
      t.lang,
      t.heat
    ),
  })
);

export const battles = pgTable("battles", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // nanoid(8), invite code
  creatorUserId: uuid("creator_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  creatorAnalysisId: uuid("creator_analysis_id")
    .notNull()
    .references(() => analyses.id, { onDelete: "cascade" }),
  opponentUserId: uuid("opponent_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  opponentAnalysisId: uuid("opponent_analysis_id").references(
    () => analyses.id,
    { onDelete: "set null" }
  ),
  status: text("status").notNull().default("pending"), // pending | accepted | done | declined | expired
  persona: text("persona").notNull(),
  lang: text("lang").notNull(),
  heat: text("heat").notNull(),
  result: jsonb("result"),
  slug: text("slug").unique(),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // invite valid 48h, result kept 30d
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  roastId: uuid("roast_id").references(() => roasts.id, {
    onDelete: "cascade",
  }),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
