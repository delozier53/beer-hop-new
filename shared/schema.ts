import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  location: text("location"),
  profileImage: text("profile_image"),
  headerImage: text("header_image"),
  role: text("role").notNull().default("user"), // 'user', 'admin', 'brewery_owner'
  checkins: integer("checkins").notNull().default(0),
  favoriteBreweries: json("favorite_breweries").$type<string[]>().notNull().default([]),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const breweries = pgTable("breweries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  image: text("image"),
  logo: text("logo"),
  type: text("type").notNull().default("Craft Brewery"),
  hours: text("hours"),
  policies: text("policies"),
  socialLinks: json("social_links").$type<{
    facebook?: string;
    instagram?: string;
    website?: string;
    x?: string;
    tiktok?: string;
    threads?: string;
  }>().notNull().default({}),
  phone: text("phone"),
  podcastUrl: text("podcast_url"),
  photos: json("photos").$type<string[]>().notNull().default([]),
  slideshowPhotos: json("slideshow_photos").$type<string[]>().notNull().default([]),
  tapListUrl: text("tap_list_url"),
  podcastEpisode: text("podcast_episode"),
  checkins: integer("checkins").notNull().default(0),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull().default("0.0"),
  ownerId: varchar("owner_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const checkIns = pgTable("check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  breweryId: varchar("brewery_id").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  breweryId: varchar("brewery_id").notNull(),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  image: text("image").notNull(),
  photos: json("photos").$type<string[]>().notNull().default([]),
  ticketRequired: boolean("ticket_required").notNull().default(false),
  ticketPrice: decimal("ticket_price", { precision: 8, scale: 2 }),
  attendees: integer("attendees").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const podcastEpisodes = pgTable("podcast_episodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  episodeNumber: integer("episode_number").notNull(),
  title: text("title").notNull(),
  guest: text("guest").notNull(),
  business: text("business").notNull(),
  duration: text("duration").notNull(),
  releaseDate: timestamp("release_date").notNull(),
  spotifyUrl: text("spotify_url").notNull(),
  image: text("image").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  minCheckins: integer("min_checkins").notNull(),
  maxCheckins: integer("max_checkins"),
  nextBadgeAt: integer("next_badge_at"),
  icon: text("icon").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBrewerySchema = createInsertSchema(breweries).omit({
  id: true,
  createdAt: true,
});

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertPodcastEpisodeSchema = createInsertSchema(podcastEpisodes).omit({
  id: true,
  createdAt: true,
}).extend({
  releaseDate: z.string().transform(str => new Date(str)),
  episodeNumber: z.number().optional(), // Make optional for creation, backend will provide
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Brewery = typeof breweries.$inferSelect;
export type InsertBrewery = z.infer<typeof insertBrewerySchema>;

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type PodcastEpisode = typeof podcastEpisodes.$inferSelect;
export type InsertPodcastEpisode = z.infer<typeof insertPodcastEpisodeSchema>;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

// Global settings table for app-wide configuration
export const settings = pgTable("settings", {
  key: varchar("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Setting = typeof settings.$inferSelect;
