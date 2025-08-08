import {
  type User,
  type InsertUser,
  type Brewery,
  type InsertBrewery,
  type CheckIn,
  type InsertCheckIn,
  type Event,
  type InsertEvent,
  type PodcastEpisode,
  type InsertPodcastEpisode,
  type Badge,
  type InsertBadge, // (kept import parity with schema even if not directly used here)
  type SpecialEvent,
  type InsertSpecialEvent, // (kept for parity)
  type WeeklyEvent,
  type InsertWeeklyEvent,
  type VerificationCode,
  type InsertVerificationCode, // (kept for parity)
  users,
  breweries,
  checkIns,
  events,
  podcastEpisodes,
  badges,
  settings,
  specialEvents,
  weeklyEvents,
  verificationCodes,
} from "@shared/schema";

import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

// ===== CSV BREWERIES LOADER =====
async function loadBreweriesFromCSV(): Promise<Brewery[]> {
  try {
    // Allow overriding via env; default to the known asset path
    const csvEnv = process.env.BREWERIES_CSV ?? "attached_assets/breweries_rows_1754194005930.csv";
    const csvPath = path.isAbsolute(csvEnv) ? csvEnv : path.join(process.cwd(), csvEnv);

    console.log("Loading breweries CSV from:", csvPath);
    if (!fs.existsSync(csvPath)) {
      console.error("CSV file does not exist at:", csvPath);
      return [];
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const records = parseCSVContent(csvContent);
    console.log(`Total parsed CSV records: ${records.length}`);

    const out: Brewery[] = [];
    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      const name = record.name || "";
      const address = record.address || "";
      const hours = record.hours || "";
      const about = record.about || "";
      const policies = record.policies || "";
      const instagram = record.instagram || "";
      const facebook = record.facebook || "";
      const x = record.x || "";
      const tiktok = record.tiktok || "";
      const threads = record.threads || "";
      const website = record.website || "";
      const phone = record.phone || "";
      const podcastUrl = record.podcast || "";

      const latitude = record.latitude || "35.4676";
      const longitude = record.longitude || "-97.5164";

      const addressParts = address.split(",");
      let city = "Unknown";
      let state = "OK";
      let zipCode = "";

      if (addressParts.length >= 2) {
        const lastPart = addressParts[addressParts.length - 1].trim();
        const m = lastPart.match(/([A-Z]{2})\s+(\d{5})/);
        if (m) {
          state = m[1];
          zipCode = m[2];
          city = addressParts[addressParts.length - 2]?.trim() || "Unknown";
        }
      }

      const brewery: Brewery = {
        id: String(i + 1),
        name,
        address: addressParts[0]?.trim() || address,
        city,
        state,
        zipCode,
        latitude,
        longitude,
        image: record.banner_image_url || null,
        logo: record.image_url || null,
        type: "Craft Brewery",
        hours,
        policies,
        socialLinks: {
          facebook: facebook || undefined,
          instagram: instagram || undefined,
          website: website || undefined,
          x: x || undefined,
          tiktok: tiktok || undefined,
          threads: threads || undefined,
        },
        phone,
        podcastUrl,
        photos: [],
        tapListUrl: null,
        podcastEpisode: podcastUrl ? "Featured Episode" : null,
        checkins: Math.floor(Math.random() * 200) + 10,
        rating: (3.5 + Math.random() * 1.5).toFixed(1),
        ownerId: null,
        createdAt: new Date(),
        bannerImage: null,
        bannerLink: null,
      };

      if (brewery.name?.trim()) out.push(brewery);
    }

    return out;
  } catch (error) {
    console.error("Error loading breweries from CSV:", error);
    return [];
  }
}

// ===== CSV HELPERS =====
function parseCSVContent(csvContent: string): any[] {
  const records: any[] = [];
  let position = 0;
  let currentRow: string[] = [];
  let insideQuotes = false;
  let currentField = "";
  let headers: string[] = [];
  let isFirstRow = true;

  while (position < csvContent.length) {
    const char = csvContent[position];

    if (char === '"') {
      if (insideQuotes && csvContent[position + 1] === '"') {
        currentField += '"';
        position += 2;
        continue;
      } else {
        insideQuotes = !insideQuotes;
        position++;
        continue;
      }
    }

    if (!insideQuotes && char === ",") {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if (!insideQuotes && (char === "\n" || char === "\r")) {
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());

        if (isFirstRow) {
          headers = currentRow;
          isFirstRow = false;
        } else if (currentRow.length === headers.length) {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header.trim()] = currentRow[index] || "";
          });
          if (obj.name && obj.name.trim()) {
            records.push(obj);
          }
        }

        currentRow = [];
        currentField = "";
      }
    } else {
      currentField += char;
    }

    position++;
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (!isFirstRow && currentRow.length === headers.length) {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = currentRow[index] || "";
      });
      if (obj.name && obj.name.trim()) {
        records.push(obj);
      }
    }
  }

  console.log(`Parsed ${records.length} valid brewery records from CSV`);
  return records;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// ===== INTERFACE =====
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  getLeaderboard(): Promise<User[]>;

  // Breweries
  getBreweries(): Promise<Brewery[]>;
  getBrewery(id: string): Promise<Brewery | undefined>;
  createBrewery(brewery: InsertBrewery): Promise<Brewery>;
  updateBrewery(id: string, brewery: Partial<Brewery>): Promise<Brewery | undefined>;

  // Check-ins
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  getUserCheckIns(userId: string): Promise<CheckIn[]>;
  getBreweryCheckIns(breweryId: string): Promise<CheckIn[]>;
  canUserCheckIn(
    userId: string,
    breweryId: string
  ): Promise<{ canCheckIn: boolean; timeRemaining?: number }>;
  getUserLatestCheckInAtBrewery(
    userId: string,
    breweryId: string
  ): Promise<CheckIn | null>;

  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Podcast Episodes
  getPodcastEpisodes(): Promise<PodcastEpisode[]>;
  getPodcastEpisode(id: string): Promise<PodcastEpisode | undefined>;
  createPodcastEpisode(episode: InsertPodcastEpisode): Promise<PodcastEpisode>;
  updatePodcastEpisode(
    id: string,
    updates: Partial<PodcastEpisode>
  ): Promise<PodcastEpisode | undefined>;
  deletePodcastEpisode(id: string): Promise<boolean>;

  // Badges
  getBadges(): Promise<Badge[]>;
  getUserBadge(userId: string): Promise<Badge | undefined>;

  // Global podcast header image
  getPodcastHeaderImage(): Promise<string | null>;
  setPodcastHeaderImage(imageUrl: string): Promise<void>;

  // Global Settings
  getGlobalSettings(): Promise<Record<string, any>>;
  updateGlobalSetting(key: string, value: any): Promise<void>;

  // Verification Codes
  createVerificationCode(email: string, code: string): Promise<VerificationCode>;
  getValidVerificationCode(
    email: string,
    code: string
  ): Promise<VerificationCode | null>;
  markVerificationCodeAsUsed(id: string): Promise<void>;
  cleanupExpiredVerificationCodes(): Promise<void>;

  // Special Events
  getSpecialEvents(): Promise<SpecialEvent[]>;
  getSpecialEvent(id: string): Promise<SpecialEvent | undefined>;
  updateSpecialEvent(
    id: string,
    updates: Partial<SpecialEvent>
  ): Promise<SpecialEvent | undefined>;

  // Weekly Events
  getWeeklyEvents(): Promise<WeeklyEvent[]>;
  getWeeklyEventsByDay(day: string): Promise<WeeklyEvent[]>;
  createWeeklyEvent(event: InsertWeeklyEvent): Promise<WeeklyEvent>;
  updateWeeklyEvent(
    id: string,
    updates: Partial<WeeklyEvent>
  ): Promise<WeeklyEvent | undefined>;
  deleteWeeklyEvent(id: string): Promise<boolean>;
}

// ===== GENERIC CSV PARSE =====
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split(/\r?\n/);
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || "";
    });
    return obj;
  });
}

// ===== USERS CSV LOADER =====
function loadUsersFromCSV(): User[] {
  try {
    const csvPath = path.join(process.cwd(), "attached_assets", "Users_1754189261860.csv");

    if (!fs.existsSync(csvPath)) {
      console.log("CSV file not found, using fallback users");
      return getFallbackUsers();
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const csvUsers = parseCSV(csvContent);

    const usedIds = new Set<string>();
    const usedEmails = new Set<string>();
    const usedUsernames = new Set<string>();

    const out: User[] = csvUsers
      .filter((u) => u.email && u.username)
      .filter((csvUser) => {
        if (usedEmails.has(csvUser.email)) return false;
        usedEmails.add(csvUser.email);
        return true;
      })
      .map((csvUser, index) => {
        let id = csvUser.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
        if (usedIds.has(id)) id = `${id}_${index}`;
        usedIds.add(id);

        let username = csvUser.username;
        if (usedUsernames.has(username)) username = `${username}_${index}`;
        usedUsernames.add(username);

        let profileImage = csvUser.photo;
        if (profileImage?.includes("drive.google.com")) {
          const fileId = profileImage.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
          if (fileId) profileImage = `https://drive.google.com/uc?id=${fileId}`;
        }

        const checkins = parseInt(csvUser.checkins) || 0;
        const breweryIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
        let favoriteBreweries: string[] = [];

        if (checkins > 0) {
          const numFavorites = Math.min(Math.floor(checkins / 30) + 1, 4);
          const shuffled = [...breweryIds].sort(() => Math.random() - 0.5);
          favoriteBreweries = shuffled.slice(0, numFavorites);
        }

        let role: User["role"] = "user";
        if (csvUser.master_admin === "TRUE") role = "admin";
        else if (csvUser.brewery_owner === "TRUE") role = "brewery_owner";

        const user: User = {
          id,
          email: csvUser.email,
          username,
          name: username,
          profileImage: profileImage || null,
          headerImage: null,
          location: "Oklahoma City, OK",
          role,
          checkins,
          favoriteBreweries,
          latitude: "35.4676",
          longitude: "-97.5164",
          createdAt: new Date(),
        };
        return user;
      });

    console.log(`Loaded ${out.length} authentic users from CSV`);
    return out;
  } catch (error) {
    console.error("Error loading CSV:", error);
    return getFallbackUsers();
  }
}

// ===== PODCAST CSV LOADER =====
function loadPodcastEpisodesFromCSV(): PodcastEpisode[] {
  try {
    const csvPath = path.join(process.cwd(), "attached_assets", "Podcast_1754201259440.csv");
    if (!fs.existsSync(csvPath)) {
      console.log("Podcast CSV file not found");
      return [];
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.trim().split(/\r?\n/);

    const out: PodcastEpisode[] = [];
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        // columns: rowId, episodeNumberRaw, visible, episode, date, guest, brewery, breweryShort, description, listenLink, photo
        const [
          /*rowId*/, episodeNumberRaw, visibleRaw, episodeTitle, date,
          guest, brewery, /*breweryShort*/, description, listenLink, photo,
        ] = values;

        const visible = String(visibleRaw).toLowerCase() === "true";
        if (!visible) continue;

        let imageUrl = photo || "";
        if (imageUrl.includes("drive.google.com")) {
          const fileId = imageUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
          if (fileId) imageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
        }

        const episodeNumber = Number(episodeNumberRaw) || out.length + 1;
        const releaseDate = (() => {
          const d = new Date(date || "2023-01-01");
          return isNaN(d.getTime()) ? new Date("2023-01-01") : d;
        })();

        const ep: PodcastEpisode = {
          id: `episode-${episodeNumber}`,
          title: episodeTitle || `Episode #${episodeNumber}`,
          description: description || "",
          episodeNumber,
          guest: guest || "",
          business: brewery || "",
          duration: "60",
          releaseDate,
          spotifyUrl: listenLink || "",
          image: imageUrl,
          createdAt: new Date(),
        };

        out.push(ep);
      } catch (e) {
        console.error(`Error parsing podcast line ${i + 1}:`, e);
      }
    }

    return out;
  } catch (error) {
    console.error("Error loading podcast episodes from CSV:", error);
    return [];
  }
}

// ===== BADGES CSV LOADER =====
function loadBadgesFromCSV(): Badge[] {
  try {
    const csvPath = path.join(process.cwd(), "attached_assets", "Badges1_1754190437299.csv");
    if (!fs.existsSync(csvPath)) {
      console.log("Badge CSV file not found, using fallback badges");
      return getFallbackBadges();
    }
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const csvBadges = parseCSV(csvContent);

    const out: Badge[] = csvBadges
      .filter((b: any) => b.rank && b.badge_no)
      .map((csvBadge: any, index: number) => {
        let icon = csvBadge.badge_icon;
        if (icon?.includes("drive.google.com")) {
          const fileId = icon.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
          if (fileId) icon = `https://lh3.googleusercontent.com/d/${fileId}`;
        }

        const minCheckins = parseInt(csvBadge.min_checkins) || 0;
        const maxCheckins = csvBadge.max_checkins ? parseInt(csvBadge.max_checkins) : null;
        const nextBadgeAt = csvBadge.next_badge_at ? parseInt(csvBadge.next_badge_at) : null;

        const b: Badge = {
          id: `badge${index + 1}`,
          name: csvBadge.rank,
          description: csvBadge.badge_no,
          minCheckins,
          maxCheckins,
          nextBadgeAt,
          icon,
        };
        return b;
      });

    console.log(`Loaded ${out.length} badges from CSV`);
    return out;
  } catch (error) {
    console.error("Error loading badges CSV:", error);
    return getFallbackBadges();
  }
}

function getFallbackBadges(): Badge[] {
  return [
    {
      id: "1",
      name: "White Hop",
      description: "Badge 1",
      minCheckins: 1,
      maxCheckins: 4,
      nextBadgeAt: 5,
      icon: "🍺",
    },
    {
      id: "2",
      name: "Yellow Hop",
      description: "Badge 2",
      minCheckins: 5,
      maxCheckins: 9,
      nextBadgeAt: 10,
      icon: "🏅",
    },
  ];
}

function getFallbackUsers(): User[] {
  return [
    {
      id: "user1",
      username: "alexthompson",
      name: "Alex Thompson",
      email: "alex@example.com",
      profileImage:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      headerImage: null,
      location: "Oklahoma City, OK",
      role: "user",
      checkins: 24,
      favoriteBreweries: ["1", "3", "5"],
      latitude: "35.4676",
      longitude: "-97.5164",
      createdAt: new Date(),
    },
    {
      id: "user2",
      username: "sarahbeer",
      name: "Sarah Beer",
      email: "sarah@example.com",
      profileImage:
        "https://images.unsplash.com/photo-1494790108755-2616b612b5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      headerImage: null,
      location: "Tulsa, OK",
      role: "user",
      checkins: 18,
      favoriteBreweries: ["2", "4"],
      latitude: "36.1540",
      longitude: "-95.9928",
      createdAt: new Date(),
    },
    {
      id: "user3",
      username: "mikehops",
      name: "Mike Hops",
      email: "mike@example.com",
      profileImage:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      headerImage: null,
      location: "Norman, OK",
      role: "user",
      checkins: 31,
      favoriteBreweries: ["1", "6"],
      latitude: "35.2226",
      longitude: "-97.4395",
      createdAt: new Date(),
    },
  ];
}

// ===== IN-MEMORY STORAGE =====
export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private breweries = new Map<string, Brewery>();
  private checkIns = new Map<string, CheckIn>();
  private events = new Map<string, Event>();
  private podcastEpisodes = new Map<string, PodcastEpisode>();
  private badges = new Map<string, Badge>();
  private specialEvents = new Map<string, SpecialEvent>();
  private globalSettings = new Map<string, any>();
  private verificationCodes = new Map<string, VerificationCode>();
  private weeklyEvents = new Map<string, WeeklyEvent>();

  constructor() {
    void this.initializeData();
  }

  private async initializeData() {
    // badges
    for (const b of loadBadgesFromCSV()) this.badges.set(b.id, b);

    // breweries
    const brews = await loadBreweriesFromCSV();
    console.log(`Loaded ${brews.length} breweries from CSV (mem)`);
    for (const br of brews) this.breweries.set(br.id, br);

    // podcast episodes (CSV)
    const csvEps = loadPodcastEpisodesFromCSV();
    for (const ep of csvEps) this.podcastEpisodes.set(ep.id, ep);

    // sample event
    const sampleEvents: Event[] = [
      {
        id: "1",
        name: "Craft Beer Tasting",
        description:
          "Exclusive craft beer tasting featuring seasonal brews. Flight of 5 beers and cheese pairings.",
        breweryId: "1",
        date: new Date("2024-03-22T19:00:00"),
        startTime: "7:00 PM",
        endTime: "9:00 PM",
        image:
          "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?auto=format&fit=crop&w=800&h=600",
        photos: [],
        ticketRequired: true,
        ticketPrice: "25.00",
        attendees: 24,
        createdAt: new Date(),
      },
    ];
    for (const e of sampleEvents) this.events.set(e.id, e);

    // users
    for (const u of loadUsersFromCSV()) this.users.set(u.id, u);
  }

  // Users
  async getUser(id: string) {
    return this.users.get(id);
  }
  async getUserByEmail(email: string) {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      email: insertUser.email,
      name: insertUser.name,
      location: insertUser.location ?? null,
      profileImage: insertUser.profileImage ?? null,
      headerImage: insertUser.headerImage ?? null,
      role: insertUser.role ?? "user",
      checkins: insertUser.checkins ?? 0,
      favoriteBreweries: (insertUser.favoriteBreweries as string[]) ?? [],
      latitude: insertUser.latitude ?? null,
      longitude: insertUser.longitude ?? null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id: string, updates: Partial<User>) {
    const u = this.users.get(id);
    if (!u) return undefined;
    const updated = { ...u, ...updates };
    this.users.set(id, updated);
    return updated;
  }
  async getLeaderboard(): Promise<User[]> {
    return Array.from(this.users.values())
      .filter((u) => (u.checkins ?? 0) > 0)
      .sort((a, b) => (b.checkins ?? 0) - (a.checkins ?? 0));
  }

  // Breweries
  async getBreweries() {
    if (this.breweries.size === 0) {
      const list = await loadBreweriesFromCSV();
      for (const b of list) this.breweries.set(b.id, b);
    }
    return Array.from(this.breweries.values());
  }
  async getBrewery(id: string) {
    return this.breweries.get(id);
  }
  async createBrewery(insert: InsertBrewery): Promise<Brewery> {
    const id = randomUUID();
    const brewery: Brewery = {
      id,
      name: insert.name,
      address: insert.address,
      city: insert.city,
      state: insert.state,
      zipCode: insert.zipCode,
      latitude: insert.latitude ?? null,
      longitude: insert.longitude ?? null,
      image: insert.image ?? null,
      logo: insert.logo ?? null,
      type: insert.type ?? "Craft Brewery",
      hours: insert.hours ?? null,
      policies: insert.policies ?? null,
      phone: insert.phone ?? null,
      podcastUrl: insert.podcastUrl ?? null,
      socialLinks: (insert.socialLinks as any) ?? {},
      photos: (insert.photos as string[]) ?? [],
      tapListUrl: insert.tapListUrl ?? null,
      podcastEpisode: insert.podcastEpisode ?? null,
      checkins: insert.checkins ?? 0,
      rating: insert.rating ?? "0.0",
      ownerId: insert.ownerId ?? null,
      createdAt: new Date(),
      bannerImage: insert.bannerImage ?? null,
      bannerLink: insert.bannerLink ?? null,
    };
    this.breweries.set(id, brewery);
    return brewery;
  }
  async updateBrewery(id: string, updates: Partial<Brewery>) {
    const b = this.breweries.get(id);
    if (!b) return undefined;
    const updated = { ...b, ...updates };
    this.breweries.set(id, updated);
    return updated;
  }

  // Check-ins
  async createCheckIn(insert: InsertCheckIn): Promise<CheckIn> {
    const id = randomUUID();
    const ci: CheckIn = {
      id,
      userId: insert.userId,
      breweryId: insert.breweryId,
      notes: insert.notes ?? null,
      createdAt: new Date(),
    };
    this.checkIns.set(id, ci);

    const u = this.users.get(insert.userId);
    if (u) {
      u.checkins = (u.checkins ?? 0) + 1;
      this.users.set(u.id, u);
    }
    const b = this.breweries.get(insert.breweryId);
    if (b) {
      b.checkins = (b.checkins ?? 0) + 1;
      this.breweries.set(b.id, b);
    }
    return ci;
  }
  async getUserCheckIns(userId: string) {
    return Array.from(this.checkIns.values()).filter((c) => c.userId === userId);
  }
  async getBreweryCheckIns(breweryId: string) {
    return Array.from(this.checkIns.values()).filter((c) => c.breweryId === breweryId);
  }
  async canUserCheckIn(userId: string, breweryId: string) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = Array.from(this.checkIns.values())
      .filter((c) => c.userId === userId && c.breweryId === breweryId && c.createdAt >= cutoff)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (recent.length === 0) return { canCheckIn: true };
    const last = recent[0];
    const nextAllowed = new Date(last.createdAt.getTime() + 24 * 60 * 60 * 1000);
    const timeRemaining = Math.max(0, nextAllowed.getTime() - Date.now());
    return { canCheckIn: false, timeRemaining: Math.ceil(timeRemaining / 1000) };
  }
  async getUserLatestCheckInAtBrewery(userId: string, breweryId: string) {
    const list = Array.from(this.checkIns.values())
      .filter((c) => c.userId === userId && c.breweryId === breweryId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return list[0] || null;
  }

  // Events
  async getEvents() {
    return Array.from(this.events.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  async getEvent(id: string) {
    return this.events.get(id);
  }
  async createEvent(insert: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const ev: Event = {
      id,
      name: insert.name,
      description: insert.description,
      breweryId: insert.breweryId,
      date: insert.date,
      startTime: insert.startTime,
      endTime: insert.endTime,
      image: insert.image,
      photos: (insert.photos as string[]) ?? [],
      ticketRequired: insert.ticketRequired ?? false,
      ticketPrice: insert.ticketPrice ?? null,
      attendees: insert.attendees ?? 0,
      createdAt: new Date(),
    };
    this.events.set(id, ev);
    return ev;
  }
  async updateEvent(id: string, updates: Partial<Event>) {
    const ev = this.events.get(id);
    if (!ev) return undefined;
    const updated = { ...ev, ...updates };
    this.events.set(id, updated);
    return updated;
  }
  async deleteEvent(id: string) {
    return this.events.delete(id);
  }

  // Podcast Episodes
  async getPodcastEpisodes() {
    return Array.from(this.podcastEpisodes.values()).sort(
      (a, b) => b.episodeNumber - a.episodeNumber
    );
  }
  async getPodcastEpisode(id: string) {
    return this.podcastEpisodes.get(id);
  }
  async createPodcastEpisode(insert: InsertPodcastEpisode): Promise<PodcastEpisode> {
    const id = randomUUID();
    const ep: PodcastEpisode = {
      id,
      episodeNumber: insert.episodeNumber!, // assume validated upstream
      title: insert.title,
      guest: insert.guest,
      business: insert.business,
      duration: insert.duration,
      releaseDate: insert.releaseDate,
      spotifyUrl: insert.spotifyUrl,
      image: insert.image,
      description: insert.description ?? null,
      createdAt: new Date(),
    };
    this.podcastEpisodes.set(id, ep);
    return ep;
  }
  async updatePodcastEpisode(
    id: string,
    updates: Partial<PodcastEpisode>
  ): Promise<PodcastEpisode | undefined> {
    const ep = this.podcastEpisodes.get(id);
    if (!ep) return undefined;
    const updated = { ...ep, ...updates };
    this.podcastEpisodes.set(id, updated);
    return updated;
  }
  async deletePodcastEpisode(id: string): Promise<boolean> {
    return this.podcastEpisodes.delete(id);
  }

  // Global podcast header image
  async getPodcastHeaderImage(): Promise<string | null> {
    return this.globalSettings.get("podcast_header_image") ?? null;
  }
  async setPodcastHeaderImage(imageUrl: string): Promise<void> {
    this.globalSettings.set("podcast_header_image", imageUrl);
  }

  // Badges
  async getBadges() {
    return Array.from(this.badges.values()).sort((a, b) => a.minCheckins - b.minCheckins);
  }
  async getUserBadge(userId: string) {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    const list = await this.getBadges();
    return list
      .sort((a, b) => b.minCheckins - a.minCheckins)
      .find(
        (badge) =>
          (user.checkins ?? 0) >= badge.minCheckins &&
          (badge.maxCheckins === null || (user.checkins ?? 0) <= badge.maxCheckins)
      );
  }

  // Global Settings
  async getGlobalSettings(): Promise<Record<string, any>> {
    return Object.fromEntries(this.globalSettings.entries());
  }
  async updateGlobalSetting(key: string, value: any): Promise<void> {
    this.globalSettings.set(key, value);
  }

  // Special Events (mem)
  async getSpecialEvents(): Promise<SpecialEvent[]> {
    const loaded = await loadSpecialEventsFromCSV();
    for (const ev of loaded) {
      const id = ev.id ?? randomUUID();
      this.specialEvents.set(id, { ...ev, id, createdAt: ev.createdAt ?? new Date() });
    }
    return Array.from(this.specialEvents.values());
  }
  async getSpecialEvent(id: string) {
    return this.specialEvents.get(id);
  }
  async updateSpecialEvent(id: string, updates: Partial<SpecialEvent>) {
    const ev = this.specialEvents.get(id);
    if (!ev) return undefined;
    const updated = { ...ev, ...updates };
    this.specialEvents.set(id, updated);
    return updated;
  }

  // Weekly Events (mem)
  async getWeeklyEvents(): Promise<WeeklyEvent[]> {
    return Array.from(this.weeklyEvents.values());
  }
  async getWeeklyEventsByDay(day: string): Promise<WeeklyEvent[]> {
    const d = day.charAt(0).toUpperCase() + day.slice(1);
    return Array.from(this.weeklyEvents.values()).filter((e) => e.day === d);
  }
  async createWeeklyEvent(event: InsertWeeklyEvent): Promise<WeeklyEvent> {
    const id = randomUUID();
    const w: WeeklyEvent = {
      id,
      day: event.day,
      brewery: event.brewery,
      event: event.event,
      title: event.title,
      details: event.details,
      time: event.time,
      logo: event.logo ?? null,
      eventPhoto: event.eventPhoto ?? null,
      instagram: event.instagram ?? null,
      twitter: event.twitter ?? null,
      facebook: event.facebook ?? null,
      address: event.address,
      createdAt: new Date(),
    };
    this.weeklyEvents.set(id, w);
    return w;
  }
  async updateWeeklyEvent(
    id: string,
    updates: Partial<WeeklyEvent>
  ): Promise<WeeklyEvent | undefined> {
    const w = this.weeklyEvents.get(id);
    if (!w) return undefined;
    const updated = { ...w, ...updates };
    this.weeklyEvents.set(id, updated);
    return updated;
  }
  async deleteWeeklyEvent(id: string): Promise<boolean> {
    return this.weeklyEvents.delete(id);
  }

  // Verification Codes (mem)
  async createVerificationCode(email: string, code: string): Promise<VerificationCode> {
    const id = randomUUID();
    const rec: VerificationCode = {
      id,
      email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: false,
      createdAt: new Date(),
    };
    this.verificationCodes.set(id, rec);
    return rec;
  }
  async getValidVerificationCode(
    email: string,
    code: string
  ): Promise<VerificationCode | null> {
    const now = new Date();
    const found = Array.from(this.verificationCodes.values()).find(
      (c) => c.email === email && c.code === code && !c.isUsed && now < c.expiresAt
    );
    return found ?? null;
  }
  async markVerificationCodeAsUsed(id: string): Promise<void> {
    const rec = this.verificationCodes.get(id);
    if (rec) {
      rec.isUsed = true;
      this.verificationCodes.set(id, rec);
    }
  }
  async cleanupExpiredVerificationCodes(): Promise<void> {
    const now = new Date();
    for (const [id, rec] of this.verificationCodes.entries()) {
      if (rec.expiresAt < now) this.verificationCodes.delete(id);
    }
  }
}

// ===== DB STORAGE =====
import { db } from "./db";
import { eq, and, gte, lt, desc, sql } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    let [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) {
      await this.initializeUsersIfEmpty();
      [user] = await db.select().from(users).where(eq(users.id, id));
    }
    return user || undefined;
  }
  private async initializeUsersIfEmpty(): Promise<void> {
    const existing = await db.select().from(users);
    if (existing.length === 0) {
      try {
        const csvUsers = loadUsersFromCSV();
        if (csvUsers.length > 0) {
          console.log(`Loading ${csvUsers.length} users from CSV`);
          await db.insert(users).values(csvUsers as any);
        }
      } catch (e) {
        console.error("Error loading users CSV:", e);
      }
    }
  }
  async getUserByEmail(email: string) {
    const [u] = await db.select().from(users).where(eq(users.email, email));
    return u || undefined;
  }
  async createUser(insert: InsertUser) {
    const [u] = await db.insert(users).values([insert]).returning();
    return u;
  }
  async updateUser(id: string, updates: Partial<User>) {
    const [u] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return u || undefined;
  }
  async getLeaderboard(): Promise<User[]> {
    await this.initializeUsersIfEmpty();
    // Return top 100 by checkins (no arbitrary floor)
    const top = await db.select().from(users).orderBy(desc(users.checkins)).limit(100);
    return top;
  }
  async getUserCheckIns(userId: string) {
    return await db.select().from(checkIns).where(eq(checkIns.userId, userId));
  }
  async getUserLatestCheckInAtBrewery(userId: string, breweryId: string) {
    const [ci] = await db
      .select()
      .from(checkIns)
      .where(and(eq(checkIns.userId, userId), eq(checkIns.breweryId, breweryId)))
      .orderBy(desc(checkIns.createdAt))
      .limit(1);
    return ci || null;
  }
  async createCheckIn(insert: InsertCheckIn) {
    const [ci] = await db.insert(checkIns).values(insert).returning();
    await db.update(users).set({ checkins: sql`${users.checkins} + 1` }).where(eq(users.id, insert.userId));
    await db
      .update(breweries)
      .set({ checkins: sql`${breweries.checkins} + 1` })
      .where(eq(breweries.id, insert.breweryId));
    return ci;
  }
  async canUserCheckIn(userId: string, breweryId: string) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await db
      .select()
      .from(checkIns)
      .where(and(eq(checkIns.userId, userId), eq(checkIns.breweryId, breweryId), gte(checkIns.createdAt, cutoff)))
      .orderBy(desc(checkIns.createdAt))
      .limit(1);
    if (recent.length === 0) return { canCheckIn: true };
    const last = recent[0];
    const nextAllowed = new Date(last.createdAt.getTime() + 24 * 60 * 60 * 1000);
    const timeRemaining = Math.max(0, nextAllowed.getTime() - Date.now());
    return { canCheckIn: false, timeRemaining: Math.ceil(timeRemaining / 1000) };
  }
  async getBreweryCheckIns(breweryId: string) {
    return await db.select().from(checkIns).where(eq(checkIns.breweryId, breweryId));
  }

  // Breweries
  private breweriesInitialized = false;
  async getBreweries(): Promise<Brewery[]> {
    if (!this.breweriesInitialized) {
      const existing = await db.select().from(breweries);
      if (existing.length === 0) {
        const csvBrews = await loadBreweriesFromCSV();
        if (csvBrews.length > 0) {
          await db.insert(breweries).values(csvBrews as any);
          this.breweriesInitialized = true;
          return csvBrews;
        }
      }
      this.breweriesInitialized = true;
      return existing;
    }
    return await db.select().from(breweries);
  }
  async getBrewery(id: string) {
    const [b] = await db.select().from(breweries).where(eq(breweries.id, id));
    return b || undefined;
  }
  async createBrewery(insert: InsertBrewery) {
    const withDefaults: InsertBrewery = {
      ...insert,
      bannerImage: insert.bannerImage ?? null,
      bannerLink: insert.bannerLink ?? null,
    };
    const [b] = await db.insert(breweries).values([withDefaults]).returning();
    return b;
  }
  async updateBrewery(id: string, updates: Partial<Brewery>) {
    const [b] = await db.update(breweries).set(updates).where(eq(breweries.id, id)).returning();
    return b || undefined;
  }

  // Events
  async getEvents() {
    return await db.select().from(events);
  }
  async getEvent(id: string) {
    const [e] = await db.select().from(events).where(eq(events.id, id));
    return e || undefined;
  }
  async createEvent(insert: InsertEvent) {
    const [e] = await db.insert(events).values([insert]).returning();
    return e;
  }
  async updateEvent(id: string, updates: Partial<Event>) {
    const [e] = await db.update(events).set(updates).where(eq(events.id, id)).returning();
    return e || undefined;
  }
  async deleteEvent(id: string) {
    const res = await db.delete(events).where(eq(events.id, id));
    return (res.rowCount ?? 0) > 0;
  }

  // Podcast Episodes
  private podcastEpisodesInitialized = false;
  async getPodcastEpisodes(): Promise<PodcastEpisode[]> {
    if (!this.podcastEpisodesInitialized) {
      const existing = await db.select().from(podcastEpisodes);
      if (existing.length === 0) {
        const csv = loadPodcastEpisodesFromCSV();
        if (csv.length > 0) {
          await db.insert(podcastEpisodes).values(csv as any);
          this.podcastEpisodesInitialized = true;
          return csv;
        }
      }
      this.podcastEpisodesInitialized = true;
      return existing;
    }
    return await db.select().from(podcastEpisodes);
  }
  async getPodcastEpisode(id: string) {
    const [ep] = await db.select().from(podcastEpisodes).where(eq(podcastEpisodes.id, id));
    return ep || undefined;
  }
  async createPodcastEpisode(insert: InsertPodcastEpisode) {
    const [ep] = await db.insert(podcastEpisodes).values(insert).returning();
    return ep;
  }
  async updatePodcastEpisode(
    id: string,
    updates: Partial<PodcastEpisode>
  ): Promise<PodcastEpisode | undefined> {
    const [ep] = await db
      .update(podcastEpisodes)
      .set(updates)
      .where(eq(podcastEpisodes.id, id))
      .returning();
    return ep || undefined;
  }
  async deletePodcastEpisode(id: string): Promise<boolean> {
    const res = await db.delete(podcastEpisodes).where(eq(podcastEpisodes.id, id));
    return (res.rowCount ?? 0) > 0;
  }

  // Global podcast header image
  async getPodcastHeaderImage(): Promise<string | null> {
    const [row] = await db.select().from(settings).where(eq(settings.key, "podcast_header_image"));
    if (!row?.value) {
      const fallback = "/objects/uploads/podcast-header-fallback";
      await this.setPodcastHeaderImage(fallback);
      return fallback;
    }
    return row.value;
  }
  async setPodcastHeaderImage(imageUrl: string): Promise<void> {
    await db
      .insert(settings)
      .values({ key: "podcast_header_image", value: imageUrl, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: imageUrl, updatedAt: new Date() },
      });
  }

  // Badges
  private badgesInitialized = false;
  async getBadges(): Promise<Badge[]> {
    if (!this.badgesInitialized) {
      const existing = await db.select().from(badges);
      if (existing.length === 0) {
        const csv = loadBadgesFromCSV();
        if (csv.length > 0) {
          await db.insert(badges).values(csv as any);
          this.badgesInitialized = true;
          return csv;
        }
      }
      this.badgesInitialized = true;
      return existing;
    }
    return await db.select().from(badges);
  }
  async getUserBadge(userId: string): Promise<Badge | undefined> {
    const [u] = await db.select().from(users).where(eq(users.id, userId));
    if (!u) return undefined;
    const all = await this.getBadges();
    return all
      .sort((a, b) => b.minCheckins - a.minCheckins)
      .find(
        (b) => (u.checkins ?? 0) >= b.minCheckins && (b.maxCheckins == null || (u.checkins ?? 0) <= b.maxCheckins)
      );
  }

  // Global Settings
  async getGlobalSettings(): Promise<Record<string, any>> {
    const rows = await db.select().from(settings);
    return rows.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, any>);
  }
  async updateGlobalSetting(key: string, value: any): Promise<void> {
    await db
      .insert(settings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      });
  }

  // Special Events
  async getSpecialEvents(): Promise<SpecialEvent[]> {
    let rows = await db.select().from(specialEvents);
    if (rows.length === 0) {
      const csv = await loadSpecialEventsFromCSV();
      if (csv.length > 0) {
        await db.insert(specialEvents).values(csv);
        rows = await db.select().from(specialEvents);
      }
    }
    return rows;
  }
  async getSpecialEvent(id: string) {
    const [row] = await db.select().from(specialEvents).where(eq(specialEvents.id, id));
    return row || undefined;
  }
  async updateSpecialEvent(
    id: string,
    updates: Partial<SpecialEvent>
  ): Promise<SpecialEvent | undefined> {
    const [row] = await db.update(specialEvents).set(updates).where(eq(specialEvents.id, id)).returning();
    return row || undefined;
  }

  // Weekly Events
  async getWeeklyEvents(): Promise<WeeklyEvent[]> {
    let rows = await db.select().from(weeklyEvents);
    if (rows.length === 0) {
      const csv = await loadWeeklyEventsFromCSV();
      if (csv.length > 0) {
        await db.insert(weeklyEvents).values(csv);
        rows = await db.select().from(weeklyEvents);
      }
    }
    return rows;
  }
  async getWeeklyEventsByDay(day: string): Promise<WeeklyEvent[]> {
    await this.getWeeklyEvents();
    const cap = day.charAt(0).toUpperCase() + day.slice(1);
    const rows = await db.select().from(weeklyEvents).where(eq(weeklyEvents.day, cap));
    return rows;
  }
  async createWeeklyEvent(event: InsertWeeklyEvent): Promise<WeeklyEvent> {
    const [row] = await db.insert(weeklyEvents).values(event).returning();
    return row;
  }
  async updateWeeklyEvent(
    id: string,
    updates: Partial<WeeklyEvent>
  ): Promise<WeeklyEvent | undefined> {
    const [row] = await db.update(weeklyEvents).set(updates).where(eq(weeklyEvents.id, id)).returning();
    return row || undefined;
  }
  async deleteWeeklyEvent(id: string): Promise<boolean> {
    const res = await db.delete(weeklyEvents).where(eq(weeklyEvents.id, id));
    return (res.rowCount ?? 0) > 0;
  }

  // Verification Codes
  async createVerificationCode(email: string, code: string) {
    const [row] = await db
      .insert(verificationCodes)
      .values({
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isUsed: false,
      })
      .returning();
    return row;
  }
  async getValidVerificationCode(
    email: string,
    code: string
  ): Promise<VerificationCode | null> {
    const [row] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.email, email),
          eq(verificationCodes.code, code),
          eq(verificationCodes.isUsed, false),
          gte(verificationCodes.expiresAt, new Date())
        )
      );
    return row || null;
  }
  async markVerificationCodeAsUsed(id: string): Promise<void> {
    await db.update(verificationCodes).set({ isUsed: true }).where(eq(verificationCodes.id, id));
  }
  async cleanupExpiredVerificationCodes(): Promise<void> {
    await db.delete(verificationCodes).where(lt(verificationCodes.expiresAt, new Date()));
  }
}

// ===== SPECIAL + WEEKLY EVENTS CSV LOADER (robust) =====

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// If these types live elsewhere, keep the imports you already have.
// type SpecialEvent = { ... }
// type InsertWeeklyEvent = { ... }

// ---- helpers ----
function truthy(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "y";
}

function emptyToNull<T extends string | null | undefined>(v: T): T | null {
  if (typeof v !== "string") return v ?? null;
  return v.trim() === "" ? null : (v as T);
}

function stripBOM(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/**
 * General CSV parser that returns array of records keyed by header names.
 * - Handles RFC4180-ish rules: quotes, "" escape, CRLF/CR newlines.
 * - Trims header names; preserves internal field whitespace.
 * - Ignores completely empty rows.
 */
function parseCSVRecords(csvRaw: string): Record<string, string>[] {
  const csv = stripBOM(csvRaw);
  const out: Record<string, string>[] = [];

  let pos = 0;
  let insideQuotes = false;
  let field = "";
  let row: string[] = [];

  let headers: string[] | null = null;

  const pushRow = () => {
    // Push current field into the row
    row.push(field);
    field = "";

    // Ignore completely empty rows
    const hasContent = row.some((f) => f.trim().length > 0);
    if (!hasContent) {
      row = [];
      return;
    }

    if (!headers) {
      headers = row.map((h) => h.trim());
    } else {
      const record: Record<string, string> = {};
      for (let i = 0; i < headers.length; i++) {
        record[headers[i]] = row[i] ?? "";
      }
      out.push(record);
    }

    row = [];
  };

  while (pos < csv.length) {
    const ch = csv[pos];

    if (ch === '"') {
      if (insideQuotes) {
        // check for escaped quote
        if (csv[pos + 1] === '"') {
          field += '"';
          pos += 2;
          continue;
        } else {
          insideQuotes = false;
          pos++;
          continue;
        }
      } else {
        insideQuotes = true;
        pos++;
        continue;
      }
    }

    if (!insideQuotes) {
      if (ch === ",") {
        // field separator
        row.push(field);
        field = "";
        pos++;
        continue;
      }

      if (ch === "\r" || ch === "\n") {
        // end of record
        pushRow();

        // consume CRLF
        if (ch === "\r" && csv[pos + 1] === "\n") pos++;
        pos++;
        continue;
      }
    }

    // regular char
    field += ch;
    pos++;
  }

  // flush last row (EOF without newline)
  if (field.length > 0 || row.length > 0) pushRow();

  if (!headers) {
    // no content
    return [];
  }

  return out;
}

// ===== SPECIAL EVENTS =====
function parseSpecialEventsCSV(csvContent: string): Record<string, string>[] {
  // Build on the generic parser and filter out rows missing required fields.
  const records = parseCSVRecords(csvContent);
  const filtered = records.filter(
    (r) => (r.Company ?? "").trim() && (r.Event ?? "").trim()
  );
  console.log(
    `Parsed ${filtered.length} valid special event records from CSV (of ${records.length} rows with headers).`
  );
  return filtered;
}

export async function loadSpecialEventsFromCSV(): Promise<SpecialEvent[]> {
  try {
    const csvPath = path.join(
      process.cwd(),
      "attached_assets/Special Events_1754235280994.csv"
    );
    if (!fs.existsSync(csvPath)) {
      console.error("Special events CSV file does not exist at:", csvPath);
      return [];
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const records = parseSpecialEventsCSV(csvContent);

    const out: SpecialEvent[] = records.map((r) => ({
      id: randomUUID(),
      company: r.Company ?? "",
      event: r.Event ?? "",
      details: r.Details ?? "",
      time: r.Time ?? "",
      date: r.Date ?? "",
      address: r.Address ?? "",
      taproom: truthy(r.Taproom),
      logo: emptyToNull(r.Logo),
      location: emptyToNull(r.Location),
      rsvpRequired: truthy(r["RSVP Required"]),
      ticketLink: emptyToNull(r["Ticket Link"]),
      ownerId: emptyToNull(r.OwnerId),
      createdAt: new Date(),
    }));

    console.log(`Loaded ${out.length} special events from CSV`);
    return out;
  } catch (error) {
    console.error("Error loading special events from CSV:", error);
    return [];
  }
}

// ===== WEEKLY EVENTS =====
function parseWeeklyEventsCSV(csvContent: string): Record<string, string>[] {
  // Reuse generic parser; weekly rows can be less strictly validated.
  return parseCSVRecords(csvContent);
}

export async function loadWeeklyEventsFromCSV(): Promise<InsertWeeklyEvent[]> {
  try {
    const csvPath = path.join(
      process.cwd(),
      "attached_assets/Weekly Events_1754244359224.csv"
    );
    if (!fs.existsSync(csvPath)) {
      console.error("Weekly events CSV file does not exist at:", csvPath);
      return [];
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const records = parseWeeklyEventsCSV(csvContent);
    console.log(`Total parsed weekly events CSV records: ${records.length}`);

    const out: InsertWeeklyEvent[] = records
      .filter((r) => Object.values(r).some((v) => (v ?? "").trim() !== ""))
      .map((r) => ({
        day: r.Day ?? "",
        brewery: r.Brewery ?? "",
        event: r.Event ?? "",
        title: r.Title ?? "",
        details: r.Details ?? "",
        time: r.Time ?? "",
        logo: emptyToNull(r.Logo),
        eventPhoto: emptyToNull(r["Event Photo"]),
        instagram: emptyToNull(r.Instagram),
        twitter: emptyToNull(r.Twitter),
        facebook: emptyToNull(r.Facebook),
        address: r.Address ?? "",
      }));

    console.log(`Loaded ${out.length} weekly events from CSV`);
    return out;
  } catch (error) {
    console.error("Error loading weekly events from CSV:", error);
    return [];
  }
}

// ===== EXPORT A STORAGE =====
export const storage = new DatabaseStorage();
