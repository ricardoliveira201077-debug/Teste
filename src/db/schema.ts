import { pgTable, text, timestamp, integer, serial, jsonb } from "drizzle-orm/pg-core";

// Cache de buscas no RuTracker
export const searchCache = pgTable("search_cache", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  resultsJson: jsonb("results_json").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cache de magnet links
export const magnetCache = pgTable("magnet_cache", {
  id: serial("id").primaryKey(),
  torrentId: text("torrent_id").notNull().unique(),
  magnetLink: text("magnet_link").notNull(),
  infoHash: text("info_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cache de IMDB ID -> título
export const imdbCache = pgTable("imdb_cache", {
  id: serial("id").primaryKey(),
  imdbId: text("imdb_id").notNull().unique(),
  title: text("title").notNull(),
  year: text("year"),
  type: text("type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
