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
  tapListUrl: text("tap_list_url"),
  podcastEpisode: text("podcast_episode"),
  checkins: integer("checkins").notNull().default(0),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull().default("0.0"),
  ownerId: varchar("owner_id"),
  bannerImage: text("banner_image"), // Custom banner image for each brewery
  bannerLink: text("banner_link"), // Link URL for the banner
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

export const specialEvents = pgTable("special_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  company: text("company").notNull(),
  event: text("event").notNull(),
  details: text("details").notNull(),
  time: text("time").notNull(),
  date: text("date").notNull(),
  address: text("address").notNull(),
  taproom: boolean("taproom").notNull().default(false),
  logo: text("logo"),
  location: text("location"),
  rsvpRequired: boolean("rsvp_required").notNull().default(false),
  ticketLink: text("ticket_link"),
  ownerId: varchar("owner_id"), // User ID of event owner
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Verification codes for email authentication
export const verificationCodes = pgTable("verification_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Global settings for app configuration
export const globalSettings = pgTable("global_settings", {
  key: text("key").primaryKey(),
  value: json("value").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
  releaseDate: z.string().transform(str => {
    // Parse date as local date to avoid timezone conversion issues
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day);
  }),
  episodeNumber: z.number(), // Required field - user should provide episode number
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
});

export const insertSpecialEventSchema = createInsertSchema(specialEvents).omit({
  id: true,
  createdAt: true,
});

export const insertVerificationCodeSchema = createInsertSchema(verificationCodes).omit({
  id: true,
  createdAt: true,
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

export type SpecialEvent = typeof specialEvents.$inferSelect;
export type InsertSpecialEvent = z.infer<typeof insertSpecialEventSchema>;

export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;

// Global settings table for app-wide configuration
export const weeklyEvents = pgTable("weekly_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  day: text("day").notNull(), // Monday, Tuesday, etc.
  brewery: text("brewery").notNull(),
  event: text("event").notNull(),
  title: text("title").notNull(),
  details: text("details").notNull(),
  time: text("time").notNull(),
  logo: text("logo"),
  eventPhoto: text("event_photo"),
  instagram: text("instagram"),
  twitter: text("twitter"),
  facebook: text("facebook"),
  address: text("address").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: varchar("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWeeklyEventSchema = createInsertSchema(weeklyEvents).omit({
  id: true,
  createdAt: true,
});

export type WeeklyEvent = typeof weeklyEvents.$inferSelect;
export type InsertWeeklyEvent = z.infer<typeof insertWeeklyEventSchema>;
export type Setting = typeof settings.$inferSelect;
