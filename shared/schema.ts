import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const searches = pgTable("searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  type: varchar("type", { enum: ["text", "voice", "image"] }).notNull().default("text"),
  imageUrl: text("image_url"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url").notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  reviewCount: integer("review_count").default(0),
  brand: text("brand"),
  category: text("category"),
  source: text("source").notNull(), // Amazon, eBay, etc.
  sourceUrl: text("source_url").notNull(),
  inStock: boolean("in_stock").default(true),
  searchId: varchar("search_id").references(() => searches.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  searchId: varchar("search_id").references(() => searches.id).notNull(),
  message: text("message").notNull(),
  isUser: boolean("is_user").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const filters = pgTable("filters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  searchId: varchar("search_id").references(() => searches.id).notNull(),
  minPrice: decimal("min_price", { precision: 10, scale: 2 }),
  maxPrice: decimal("max_price", { precision: 10, scale: 2 }),
  brands: jsonb("brands").$type<string[]>().default([]),
  categories: jsonb("categories").$type<string[]>().default([]),
  minRating: decimal("min_rating", { precision: 2, scale: 1 }),
  sortBy: varchar("sort_by", { enum: ["relevance", "price_low", "price_high", "rating", "newest"] }).default("relevance"),
});

export const insertSearchSchema = createInsertSchema(searches).omit({
  id: true,
  timestamp: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertFilterSchema = createInsertSchema(filters).omit({
  id: true,
});

export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searches.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertFilter = z.infer<typeof insertFilterSchema>;
export type Filter = typeof filters.$inferSelect;
