import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  AnySQLiteColumn,
  index,
} from "drizzle-orm/sqlite-core";

export type Link = {
  login?: string;
  register?: string;
  documentation?: string;
  pricing?: string;
};

// Blog Schema
export const BlogTable = sqliteTable("blogs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: text("createdAt")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updatedAt")
    .notNull()
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

// Category Schema
export const CategoryTable = sqliteTable("categories", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  icon: text("icon"),
  parent: integer("parent_id").references(
    (): AnySQLiteColumn => CategoryTable.id,
    { onDelete: "cascade" },
  ),
  name: text("name").notNull().unique(),
  featured: integer("featured", { mode: "boolean" }).default(false),
  weight: integer("weight").default(0),
  createdAt: text("createdAt")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updatedAt")
    .notNull()
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

// Review Schema
export const ReviewTable = sqliteTable("reviews", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  userId: text("userId").notNull(),
  userEmail: text("userEmail").notNull(),
  state: text("state", { enum: ["pending", "approved", "rejected"] }).default(
    "pending",
  ), // Replace with enum value
  createdAt: text("createdAt")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updatedAt")
    .notNull()
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

// Site Schema
export const SiteTable = sqliteTable(
  "sites",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: text("userId").default("00000000000000000"),
    siteKey: text("siteKey").notNull().unique(),
    url: text("url").notNull(),
    name: text("name"),
    featured: integer("featured", { mode: "boolean" }).default(false),
    weight: integer("weight").default(0),
    snapshot: text("snapshot").default(""),
    description: text("description").default(""),
    pricingType: text("pricingType").default(""),
    categories: text("categories", { mode: "json" })
      .$type<string[]>()
      .default(sql`'[]'`),
    pricings: text("pricings", { mode: "json" })
      .$type<string[]>()
      .default(sql`'[]'`),
    images: text("images", { mode: "json" })
      .$type<string[]>()
      .default(sql`'[]'`),
    features: text("features", { mode: "json" })
      .$type<string[]>()
      .default(sql`'[]'`),
    usecases: text("usecases", { mode: "json" })
      .$type<string[]>()
      .default(sql`'[]'`),
    users: text("users", { mode: "json" })
      .$type<string[]>()
      .default(sql`'[]'`),
    relatedSearches: text("relatedSearches", { mode: "json" })
      .$type<string[]>()
      .default(sql`'[]'`),
    links: text("links", { mode: "json" }).$type<Link>().default({}),
    voteCount: integer("voteCount").default(0),
    metaKeywords: text("metaKeywords", { mode: "json" })
      .$type<string[]>()
      .default(sql`'[]'`),
    metaDescription: text("metaDescription").default(""),
    searchSuggestWords: text("searchSuggestWords", { mode: "json" })
      .$type<string[]>()
      .default(sql`'[]'`),
    state: text("state", { enum: ["published", "unpublished"] }).default(
      "unpublished",
    ),
    processStage: text("processStage", {
      enum: ["pending", "processing", "success", "fail"],
    }).default("pending"),
    createdAt: text("createdAt")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updatedAt")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`), // 不自动更新，避免投票导致时间更新
  },
  (table) => {
    return {
      siteKeyIndex: index("site_key").on(table.siteKey),
      nameIdx: index("name_idx").on(table.name),
      weightIdx: index("weight_idx").on(table.weight),
    };
  },
);

// Upvote Schema
export const UpvoteTable = sqliteTable(
  "upvotes",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull(),
    targetId: integer("targetId", { mode: "number" }).notNull(),
    upvoteType: text("upvoteType", { enum: ["site"] }).notNull(),
    createdAt: text("createdAt")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updatedAt")
      .notNull()
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => {
    return {
      userIdIdx: index("userId_idx").on(table.userId),
      upvoteTypeIdx: index("upvoteType_idx").on(table.upvoteType),
    };
  },
);

// Export models inferred from the tables
export type SelectBlog = typeof BlogTable.$inferSelect;
export type InsertBlog = typeof BlogTable.$inferInsert;
export type SelectCategory = typeof CategoryTable.$inferSelect;
export type InsertCategory = typeof CategoryTable.$inferInsert;
export type SelectReview = typeof ReviewTable.$inferSelect;
export type InsertReview = typeof ReviewTable.$inferInsert;
export type SelectSite = typeof SiteTable.$inferSelect;
export type InsertSite = typeof SiteTable.$inferInsert;
export type SelectUpvote = typeof UpvoteTable.$inferSelect;
export type InsertUpvote = typeof UpvoteTable.$inferInsert;
