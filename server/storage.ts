import { db } from "./db";
import { 
  users, 
  breweries, 
  checkIns, 
  events, 
  podcastEpisodes, 
  badges, 
  specialEvents,
  weeklyEvents,
  verificationCodes,
  globalSettings,
  settings,
  type User,
  type Brewery,
  type CheckIn,
  type Event,
  type PodcastEpisode,
  type Badge,
  type SpecialEvent,
  type WeeklyEvent,
  type VerificationCode,
  type InsertUser,
  type InsertCheckIn,
  type InsertPodcastEpisode,
  type InsertSpecialEvent,
  type InsertWeeklyEvent,
} from "@shared/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export class Storage {
  // ---------- Users ----------
  async getUser(id: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return null;
    }
  }

  async createUser(data: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(data).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
      return result[0] || null;
    } catch (error) {
      console.error("Error updating user:", error);
      return null;
    }
  }

  async getLeaderboard(): Promise<User[]> {
    try {
      return await db.select().from(users).orderBy(desc(users.checkins));
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return [];
    }
  }

  async getUserBadge(userId: string): Promise<Badge | null> {
    try {
      const user = await this.getUser(userId);
      if (!user) return null;

      const allBadges = await db.select().from(badges).orderBy(desc(badges.minCheckins));
      
      for (const badge of allBadges) {
        if (user.checkins >= badge.minCheckins) {
          return badge;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error getting user badge:", error);
      return null;
    }
  }

  // ---------- Breweries ----------
  async getBreweries(): Promise<Brewery[]> {
    try {
      return await db.select().from(breweries);
    } catch (error) {
      console.error("Error getting breweries:", error);
      return [];
    }
  }

  async getBrewery(id: string): Promise<Brewery | null> {
    try {
      const result = await db.select().from(breweries).where(eq(breweries.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error getting brewery:", error);
      return null;
    }
  }

  async updateBrewery(id: string, updates: Partial<Brewery>): Promise<Brewery | null> {
    try {
      const result = await db.update(breweries).set(updates).where(eq(breweries.id, id)).returning();
      return result[0] || null;
    } catch (error) {
      console.error("Error updating brewery:", error);
      return null;
    }
  }

  // ---------- Check-ins ----------
  async createCheckIn(data: InsertCheckIn): Promise<CheckIn> {
    try {
      // Create the check-in
      const result = await db.insert(checkIns).values(data).returning();
      
      // Update user's check-in count
      await db.update(users)
        .set({ checkins: sql`${users.checkins} + 1` })
        .where(eq(users.id, data.userId));
      
      // Update brewery's check-in count
      await db.update(breweries)
        .set({ checkins: sql`${breweries.checkins} + 1` })
        .where(eq(breweries.id, data.breweryId));
      
      return result[0];
    } catch (error) {
      console.error("Error creating check-in:", error);
      throw error;
    }
  }

  async canUserCheckIn(userId: string, breweryId: string): Promise<{ canCheckIn: boolean; timeRemaining?: number }> {
    try {
      // Check for recent check-ins at this brewery (24-hour cooldown)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentCheckIn = await db.select()
        .from(checkIns)
        .where(
          and(
            eq(checkIns.userId, userId),
            eq(checkIns.breweryId, breweryId),
            gte(checkIns.createdAt, twentyFourHoursAgo)
          )
        )
        .limit(1);

      if (recentCheckIn.length > 0) {
        const lastCheckIn = recentCheckIn[0];
        const timeRemaining = Math.max(0, 24 * 60 * 60 - (Date.now() - lastCheckIn.createdAt.getTime()) / 1000);
        return { canCheckIn: false, timeRemaining };
      }

      return { canCheckIn: true };
    } catch (error) {
      console.error("Error checking if user can check in:", error);
      return { canCheckIn: false };
    }
  }

  async getUserCheckIns(userId: string): Promise<CheckIn[]> {
    try {
      return await db.select().from(checkIns).where(eq(checkIns.userId, userId)).orderBy(desc(checkIns.createdAt));
    } catch (error) {
      console.error("Error getting user check-ins:", error);
      return [];
    }
  }

  // ---------- Events ----------
  async getEvents(): Promise<Event[]> {
    try {
      return await db.select().from(events).orderBy(desc(events.date));
    } catch (error) {
      console.error("Error getting events:", error);
      return [];
    }
  }

  async getEvent(id: string): Promise<Event | null> {
    try {
      const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error getting event:", error);
      return null;
    }
  }

  // ---------- Special Events ----------
  async getSpecialEvents(): Promise<SpecialEvent[]> {
    try {
      return await db.select().from(specialEvents).orderBy(desc(specialEvents.createdAt));
    } catch (error) {
      console.error("Error getting special events:", error);
      return [];
    }
  }

  async getSpecialEvent(id: string): Promise<SpecialEvent | null> {
    try {
      const result = await db.select().from(specialEvents).where(eq(specialEvents.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error getting special event:", error);
      return null;
    }
  }

  async createSpecialEvent(data: InsertSpecialEvent & { ownerId: string }): Promise<SpecialEvent> {
    try {
      const result = await db.insert(specialEvents).values(data).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating special event:", error);
      throw error;
    }
  }

  async updateSpecialEvent(id: string, updates: Partial<SpecialEvent>): Promise<SpecialEvent | null> {
    try {
      const result = await db.update(specialEvents).set(updates).where(eq(specialEvents.id, id)).returning();
      return result[0] || null;
    } catch (error) {
      console.error("Error updating special event:", error);
      return null;
    }
  }

  async deleteSpecialEvent(id: string): Promise<boolean> {
    try {
      const result = await db.delete(specialEvents).where(eq(specialEvents.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting special event:", error);
      return false;
    }
  }

  // ---------- Weekly Events ----------
  async getWeeklyEvents(): Promise<WeeklyEvent[]> {
    try {
      return await db.select().from(weeklyEvents).orderBy(weeklyEvents.day);
    } catch (error) {
      console.error("Error getting weekly events:", error);
      return [];
    }
  }

  async getWeeklyEventsByDay(day: string): Promise<WeeklyEvent[]> {
    try {
      const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
      return await db.select().from(weeklyEvents).where(eq(weeklyEvents.day, capitalizedDay));
    } catch (error) {
      console.error("Error getting weekly events by day:", error);
      return [];
    }
  }

  async createWeeklyEvent(data: InsertWeeklyEvent): Promise<WeeklyEvent> {
    try {
      const result = await db.insert(weeklyEvents).values(data).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating weekly event:", error);
      throw error;
    }
  }

  async updateWeeklyEvent(id: string, updates: Partial<WeeklyEvent>): Promise<WeeklyEvent | null> {
    try {
      const result = await db.update(weeklyEvents).set(updates).where(eq(weeklyEvents.id, id)).returning();
      return result[0] || null;
    } catch (error) {
      console.error("Error updating weekly event:", error);
      return null;
    }
  }

  async deleteWeeklyEvent(id: string): Promise<boolean> {
    try {
      const result = await db.delete(weeklyEvents).where(eq(weeklyEvents.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting weekly event:", error);
      return false;
    }
  }

  // ---------- Podcast Episodes ----------
  async getPodcastEpisodes(): Promise<PodcastEpisode[]> {
    try {
      return await db.select().from(podcastEpisodes).orderBy(desc(podcastEpisodes.releaseDate));
    } catch (error) {
      console.error("Error getting podcast episodes:", error);
      return [];
    }
  }

  async createPodcastEpisode(data: InsertPodcastEpisode & { episodeNumber: number }): Promise<PodcastEpisode> {
    try {
      const result = await db.insert(podcastEpisodes).values(data).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating podcast episode:", error);
      throw error;
    }
  }

  async updatePodcastEpisode(id: string, updates: Partial<PodcastEpisode>): Promise<PodcastEpisode | null> {
    try {
      const result = await db.update(podcastEpisodes).set(updates).where(eq(podcastEpisodes.id, id)).returning();
      return result[0] || null;
    } catch (error) {
      console.error("Error updating podcast episode:", error);
      return null;
    }
  }

  async deletePodcastEpisode(id: string): Promise<boolean> {
    try {
      const result = await db.delete(podcastEpisodes).where(eq(podcastEpisodes.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting podcast episode:", error);
      return false;
    }
  }

  // ---------- Verification Codes ----------
  async createVerificationCode(email: string, code: string): Promise<VerificationCode> {
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      const result = await db.insert(verificationCodes).values({
        email,
        code,
        expiresAt,
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating verification code:", error);
      throw error;
    }
  }

  async getValidVerificationCode(email: string, code: string): Promise<VerificationCode | null> {
    try {
      const result = await db.select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.email, email),
            eq(verificationCodes.code, code),
            eq(verificationCodes.isUsed, false),
            gte(verificationCodes.expiresAt, new Date())
          )
        )
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error getting valid verification code:", error);
      return null;
    }
  }

  async markVerificationCodeAsUsed(id: string): Promise<void> {
    try {
      await db.update(verificationCodes).set({ isUsed: true }).where(eq(verificationCodes.id, id));
    } catch (error) {
      console.error("Error marking verification code as used:", error);
      throw error;
    }
  }

  async cleanupExpiredVerificationCodes(): Promise<void> {
    try {
      await db.delete(verificationCodes).where(sql`${verificationCodes.expiresAt} < NOW()`);
    } catch (error) {
      console.error("Error cleaning up expired verification codes:", error);
    }
  }

  // ---------- Global Settings ----------
  async getGlobalSettings(): Promise<Record<string, any>> {
    try {
      const result = await db.select().from(globalSettings);
      const settings: Record<string, any> = {};
      
      for (const setting of result) {
        settings[setting.key] = setting.value;
      }
      
      return settings;
    } catch (error) {
      console.error("Error getting global settings:", error);
      return {};
    }
  }

  async updateGlobalSetting(key: string, value: any): Promise<void> {
    try {
      await db.insert(globalSettings)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: globalSettings.key,
          set: { value, updatedAt: new Date() }
        });
    } catch (error) {
      console.error("Error updating global setting:", error);
      throw error;
    }
  }

  // ---------- Podcast Header ----------
  async getPodcastHeaderImage(): Promise<string | null> {
    try {
      const result = await db.select()
        .from(settings)
        .where(eq(settings.key, 'podcast_header_image'))
        .limit(1);
      return result[0]?.value || null;
    } catch (error) {
      console.error("Error getting podcast header image:", error);
      return null;
    }
  }

  async setPodcastHeaderImage(headerImage: string): Promise<void> {
    try {
      await db.insert(settings)
        .values({ key: 'podcast_header_image', value: headerImage, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: headerImage, updatedAt: new Date() }
        });
    } catch (error) {
      console.error("Error setting podcast header image:", error);
      throw error;
    }
  }
}

export const storage = new Storage();