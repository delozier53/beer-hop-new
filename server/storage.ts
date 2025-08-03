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
  type InsertBadge
} from "@shared/schema";
import { randomUUID } from "crypto";
import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';

async function loadBreweriesFromCSV(): Promise<Brewery[]> {
  try {
    const csvPath = path.join(process.cwd(), 'attached_assets/breweries_rows_1754194005930.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV properly handling multi-line quoted fields
    const records = parseCSVContent(csvContent);
    console.log(`Total parsed CSV records: ${records.length}`);
    
    const breweries = [];
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const index = i;
      
      // Parse brewery data from record with authentic coordinates
      const name = record.name || '';
      const address = record.address || '';
      const hours = record.hours || '';
      const about = record.about || '';
      const policies = record.policies || '';
      const instagram = record.instagram || '';
      const facebook = record.facebook || '';
      const x = record.x || '';
      const tiktok = record.tiktok || '';
      const threads = record.threads || '';
      const website = record.website || '';
      const phone = record.phone || '';
      const podcastUrl = record.podcast || '';
      
      // Use authentic latitude and longitude from CSV
      const latitude = record.latitude || "35.4676"; // Fallback to OKC center
      const longitude = record.longitude || "-97.5164";
      
      // Extract city and state from address
      const addressParts = address.split(',');
      let city = 'Unknown';
      let state = 'OK';
      let zipCode = '';
      
      if (addressParts.length >= 2) {
        const lastPart = addressParts[addressParts.length - 1].trim();
        const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5})/);
        if (stateZipMatch) {
          state = stateZipMatch[1];
          zipCode = stateZipMatch[2];
          city = addressParts[addressParts.length - 2]?.trim() || 'Unknown';
        }
      }
      
      const brewery = {
        id: (index + 1).toString(),
        name,
        address: addressParts[0]?.trim() || address,
        city,
        state,
        zipCode,
        latitude,
        longitude,
        image: record.banner_image_url || `https://images.unsplash.com/photo-${1570000000000 + index}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600`,
        logo: record.image_url || `https://images.unsplash.com/photo-${1570000000000 + index}?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200`,
        type: "Craft Brewery",
        about: about || `${name} is a craft brewery dedicated to creating exceptional beers in the heart of Oklahoma.`,
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
        podcastEpisode: podcastUrl ? `Featured Episode` : null,
        checkins: Math.floor(Math.random() * 200) + 10,
        rating: (3.5 + Math.random() * 1.5).toFixed(1),
        ownerId: null,
        createdAt: new Date()
      };
      
      if (brewery.name && brewery.name.trim()) {
        breweries.push(brewery);
      } else {
        console.log(`Skipped brewery at index ${i}: name="${name}", record:`, Object.keys(record));
      }
    }
    
    return breweries;
  } catch (error) {
    console.error('Error loading breweries from CSV:', error);
    return [];
  }
}

// Robust CSV parser that handles quoted multi-line fields
function parseCSVContent(csvContent: string): any[] {
  const records: any[] = [];
  let position = 0;
  let currentRow: string[] = [];
  let insideQuotes = false;
  let currentField = '';
  let headers: string[] = [];
  let isFirstRow = true;

  while (position < csvContent.length) {
    const char = csvContent[position];
    
    if (char === '"') {
      if (insideQuotes && csvContent[position + 1] === '"') {
        // Handle escaped quotes
        currentField += '"';
        position += 2;
        continue;
      } else {
        insideQuotes = !insideQuotes;
        position++;
        continue;
      }
    }

    if (!insideQuotes && char === ',') {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (!insideQuotes && (char === '\n' || char === '\r')) {
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        
        if (isFirstRow) {
          headers = currentRow;
          isFirstRow = false;
        } else if (currentRow.length === headers.length) {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header.trim()] = currentRow[index] || '';
          });
          if (obj.name && obj.name.trim()) {
            records.push(obj);
          }
        }
        
        currentRow = [];
        currentField = '';
      }
    } else {
      currentField += char;
    }
    
    position++;
  }

  // Handle the last field if file doesn't end with newline
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (!isFirstRow && currentRow.length === headers.length) {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = currentRow[index] || '';
      });
      if (obj.name && obj.name.trim()) {
        records.push(obj);
      }
    }
  }

  console.log(`Parsed ${records.length} valid brewery records from CSV`);
  return records;
}

// Enhanced CSV line parser that properly handles quoted fields with commas and newlines
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Handle escaped quotes
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// Get coordinates for Oklahoma cities/locations
async function geocodeAddress(address: string): Promise<{lat: string, lng: string}> {
  // Extract city from address for major Oklahoma cities
  const cityMap: Record<string, {lat: string, lng: string}> = {
    'tulsa': { lat: "36.1540", lng: "-95.9928" },
    'oklahoma city': { lat: "35.4676", lng: "-97.5164" },
    'okc': { lat: "35.4676", lng: "-97.5164" },
    'norman': { lat: "35.2226", lng: "-97.4395" },
    'broken arrow': { lat: "36.0526", lng: "-95.7969" },
    'lawton': { lat: "34.6036", lng: "-98.3959" },
    'edmond': { lat: "35.6528", lng: "-97.4781" },
    'moore': { lat: "35.3395", lng: "-97.4867" },
    'midwest city': { lat: "35.4495", lng: "-97.3967" },
    'enid': { lat: "36.3956", lng: "-97.8784" },
    'stillwater': { lat: "36.1156", lng: "-97.0594" },
    'muskogee': { lat: "35.7479", lng: "-95.3697" },
    'bartlesville': { lat: "36.7473", lng: "-95.9808" },
    'owasso': { lat: "36.2695", lng: "-95.8547" },
    'shawnee': { lat: "35.3273", lng: "-96.9253" },
    'ardmore': { lat: "34.1742", lng: "-97.1436" },
    'ponca city': { lat: "36.7063", lng: "-97.0859" },
    'duncan': { lat: "34.5023", lng: "-97.9578" },
    'del city': { lat: "35.4418", lng: "-97.4408" },
    'mcalester': { lat: "34.9332", lng: "-95.7697" },
    'tahlequah': { lat: "35.9151", lng: "-94.9700" },
    'durant': { lat: "33.9937", lng: "-96.3711" },
    'bethany': { lat: "35.5151", lng: "-97.6311" },
    'ada': { lat: "34.7745", lng: "-96.6783" },
    'el reno': { lat: "35.5323", lng: "-97.9551" },
    'weatherford': { lat: "35.5262", lng: "-98.7062" },
    'yukon': { lat: "35.5067", lng: "-97.7625" },
    'claremore': { lat: "36.3126", lng: "-95.6160" },
    'chickasha': { lat: "35.0526", lng: "-97.9364" },
    'miami': { lat: "36.8773", lng: "-94.8775" },
    'altus': { lat: "34.6381", lng: "-99.3340" },
    'guymon': { lat: "36.6828", lng: "-101.4816" },
    'sand springs': { lat: "36.1398", lng: "-96.1089" },
    'poteau': { lat: "35.0540", lng: "-94.6238" }
  };

  // Extract city name from address
  const addressLower = address.toLowerCase();
  for (const [city, coords] of Object.entries(cityMap)) {
    if (addressLower.includes(city)) {
      return coords;
    }
  }
  
  // Default to Oklahoma City center for unmatched addresses
  return {
    lat: "35.4676",
    lng: "-97.5164"
  };
}

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

  // Badges
  getBadges(): Promise<Badge[]>;
  getUserBadge(checkins: number): Promise<Badge | undefined>;
}

// CSV processing functions
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const user: any = {};
    
    headers.forEach((header, index) => {
      user[header] = values[index] || '';
    });
    
    return user;
  });
}



function loadUsersFromCSV(): User[] {
  try {
    const csvPath = path.join(process.cwd(), 'attached_assets', 'Users_1754189261860.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('CSV file not found, using fallback users');
      return getFallbackUsers();
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvUsers = parseCSV(csvContent);
    
    const users = csvUsers
      .filter(user => user.email && user.username) // Load ALL users from CSV
      .map((csvUser, index) => {
        // Create deterministic ID from email to ensure consistency across restarts
        const id = csvUser.email ? 
          csvUser.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : 
          `user${index + 1}`;
        
        let profileImage = csvUser.photo;
        if (profileImage && profileImage.includes('drive.google.com')) {
          const fileId = profileImage.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
          if (fileId) {
            profileImage = `https://drive.google.com/uc?id=${fileId}`;
          }
        }
        
        const checkins = parseInt(csvUser.checkins) || 0;
        const breweryIds = ['1', '2', '3', '4', '5', '6', '7', '8'];
        let favoriteBreweries: string[] = [];
        
        if (checkins > 0) {
          const numFavorites = Math.min(Math.floor(checkins / 20) + 1, 3);
          const shuffled = [...breweryIds].sort(() => Math.random() - 0.5);
          favoriteBreweries = shuffled.slice(0, numFavorites);
        }
        
        return {
          id,
          email: csvUser.email,
          username: csvUser.username || `User${index + 1}`,
          name: csvUser.username || `User${index + 1}`,
          profileImage: profileImage || null,
          location: 'Oklahoma City, OK',
          checkins,
          favoriteBreweries,
          latitude: "35.4676",
          longitude: "-97.5164", 
          createdAt: new Date()
        };
      });
    
    console.log(`Loaded ${users.length} users from CSV`);
    return users;
  } catch (error) {
    console.error('Error loading CSV:', error);
    return getFallbackUsers();
  }
}

function loadBadgesFromCSV(): Badge[] {
  try {
    const csvPath = path.join(process.cwd(), 'attached_assets', 'Badges1_1754190437299.csv');
    if (!fs.existsSync(csvPath)) {
      console.log('Badge CSV file not found, using fallback badges');
      return getFallbackBadges();
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvBadges = parseCSV(csvContent);
    
    const badges = csvBadges
      .filter(badge => badge.rank && badge.badge_no)
      .map((csvBadge, index) => {
        // Convert Google Drive links to direct image URLs  
        let icon = csvBadge.badge_icon;
        if (icon && icon.includes('drive.google.com')) {
          const fileId = icon.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
          if (fileId) {
            // Use Google's image hosting service for better compatibility
            icon = `https://lh3.googleusercontent.com/d/${fileId}`;
          }
        }
        
        // Debug log for first badge
        if (index === 0) {
          console.log('Badge image conversion:', { 
            original: csvBadge.badge_icon, 
            converted: icon 
          });
        }
        
        const minCheckins = parseInt(csvBadge.min_checkins) || 0;
        const maxCheckins = csvBadge.max_checkins ? parseInt(csvBadge.max_checkins) : null;
        const nextBadgeAt = csvBadge.next_badge_at ? parseInt(csvBadge.next_badge_at) : null;
        
        return {
          id: `badge${index + 1}`,
          name: csvBadge.rank,
          description: csvBadge.badge_no,
          minCheckins,
          maxCheckins,
          nextBadgeAt,
          icon
        };
      });
    
    console.log(`Loaded ${badges.length} badges from CSV`);
    return badges;
  } catch (error) {
    console.error('Error loading badges CSV:', error);
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
      icon: "🍺"
    },
    {
      id: "2", 
      name: "Yellow Hop",
      description: "Badge 2",
      minCheckins: 5,
      maxCheckins: 9,
      nextBadgeAt: 10,
      icon: "🏅"
    }
  ];
}

function getFallbackUsers(): User[] {
  return [
    {
      id: "user1",
      username: "alexthompson",
      name: "Alex Thompson",
      email: "alex@example.com",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      location: "Oklahoma City, OK",
      checkins: 24,
      favoriteBreweries: ["1", "3", "5"],
      latitude: "35.4676",
      longitude: "-97.5164",
      createdAt: new Date()
    },
    {
      id: "user2", 
      username: "sarahbeer",
      name: "Sarah Beer",
      email: "sarah@example.com",
      profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      location: "Tulsa, OK",
      checkins: 18,
      favoriteBreweries: ["2", "4"],
      latitude: "36.1540",
      longitude: "-95.9928",
      createdAt: new Date()
    },
    {
      id: "user3",
      username: "mikehops",
      name: "Mike Hops",
      email: "mike@example.com", 
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      location: "Norman, OK",
      checkins: 31,
      favoriteBreweries: ["1", "6"],
      latitude: "35.2226",
      longitude: "-97.4395",
      createdAt: new Date()
    }
  ];
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private breweries: Map<string, Brewery>;
  private checkIns: Map<string, CheckIn>;
  private events: Map<string, Event>;
  private podcastEpisodes: Map<string, PodcastEpisode>;
  private badges: Map<string, Badge>;

  constructor() {
    this.users = new Map();
    this.breweries = new Map();
    this.checkIns = new Map();
    this.events = new Map();
    this.podcastEpisodes = new Map();
    this.badges = new Map();
    
    this.initializeData().catch(console.error);
  }

  private async initializeData() {
    // Initialize badges from CSV
    const badgesList = loadBadgesFromCSV();
    badgesList.forEach(badge => this.badges.set(badge.id, badge));

    // Initialize breweries from CSV with authentic coordinates - ALL breweries
    const breweriesList = await loadBreweriesFromCSV();
    console.log(`Loaded ${breweriesList.length} authentic Oklahoma breweries from CSV`);
    breweriesList.forEach(brewery => this.breweries.set(brewery.id, brewery));

    // Only authentic brewery data from CSV - no mock data

    // Initialize sample podcast episodes
    const episodes: PodcastEpisode[] = [
      {
        id: "1",
        episodeNumber: 28,
        title: "Brewing Excellence with Mike Rodriguez",
        guest: "Mike Rodriguez",
        business: "Golden Gate Brewing",
        duration: "42 min",
        releaseDate: new Date("2024-03-15"),
        spotifyUrl: "https://open.spotify.com/episode/example1",
        image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        description: "Mike Rodriguez discusses the craft brewing process and Golden Gate Brewing's commitment to quality.",
        createdAt: new Date()
      },
      {
        id: "2", 
        episodeNumber: 27,
        title: "Innovation in Craft Beer with Sarah Chen",
        guest: "Sarah Chen",
        business: "Hop Valley Brewing",
        duration: "38 min",
        releaseDate: new Date("2024-03-08"),
        spotifyUrl: "https://open.spotify.com/episode/example2",
        image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        description: "Sarah Chen shares insights on innovative brewing techniques and sustainability in craft beer.",
        createdAt: new Date()
      },
      {
        id: "3",
        episodeNumber: 26, 
        title: "Heritage and Tradition with Tom Wilson",
        guest: "Tom Wilson",
        business: "Anchor Brewing Co.",
        duration: "45 min",
        releaseDate: new Date("2024-03-01"),
        spotifyUrl: "https://open.spotify.com/episode/example3",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        description: "Tom Wilson talks about preserving brewing heritage while adapting to modern tastes.",
        createdAt: new Date()
      }
    ];

    episodes.forEach(episode => this.podcastEpisodes.set(episode.id, episode));

    // Initialize sample events
    const eventsList: Event[] = [
      {
        id: "1",
        name: "Craft Beer Tasting",
        description: "Join us for an exclusive craft beer tasting featuring our latest seasonal brews. Learn about the brewing process, taste unique flavor profiles, and meet fellow beer enthusiasts. Each ticket includes a flight of 5 beers and artisanal cheese pairings.",
        breweryId: "1",
        date: new Date("2024-03-22T19:00:00"),
        startTime: "7:00 PM",
        endTime: "9:00 PM",
        image: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        photos: [
          "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
          "https://images.unsplash.com/photo-1582037928769-181f2644ecb7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
        ],
        ticketRequired: true,
        ticketPrice: "25.00",
        attendees: 24,
        createdAt: new Date()
      },
      {
        id: "2",
        name: "Live Music Night", 
        description: "Enjoy live acoustic music while sipping on our finest craft beers. Free entry, family-friendly event.",
        breweryId: "2",
        date: new Date("2024-03-23T20:00:00"),
        startTime: "8:00 PM",
        endTime: "11:00 PM",
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        photos: [],
        ticketRequired: false,
        ticketPrice: null,
        attendees: 67,
        createdAt: new Date()
      }
    ];

    eventsList.forEach(event => this.events.set(event.id, event));

    // Initialize users from CSV
    const csvUsers = loadUsersFromCSV();
    csvUsers.forEach(user => {
      this.users.set(user.id, user);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      username: insertUser.username,
      email: insertUser.email,
      name: insertUser.name,
      location: insertUser.location || null,
      profileImage: insertUser.profileImage || null,
      checkins: insertUser.checkins || 0,
      favoriteBreweries: insertUser.favoriteBreweries || [],
      latitude: insertUser.latitude || null,
      longitude: insertUser.longitude || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getLeaderboard(): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.checkins > 0)
      .sort((a, b) => b.checkins - a.checkins);
  }

  // Breweries
  async getBreweries(): Promise<Brewery[]> {
    return Array.from(this.breweries.values());
  }

  async getBrewery(id: string): Promise<Brewery | undefined> {
    return this.breweries.get(id);
  }

  async createBrewery(insertBrewery: InsertBrewery): Promise<Brewery> {
    const id = randomUUID();
    const brewery: Brewery = { 
      id,
      name: insertBrewery.name,
      address: insertBrewery.address,
      city: insertBrewery.city,
      state: insertBrewery.state,
      zipCode: insertBrewery.zipCode,
      latitude: insertBrewery.latitude,
      longitude: insertBrewery.longitude,
      image: insertBrewery.image,
      logo: insertBrewery.logo,
      type: insertBrewery.type || "Craft Brewery",
      about: insertBrewery.about,
      hours: insertBrewery.hours,
      policies: insertBrewery.policies,
      socialLinks: insertBrewery.socialLinks || {},
      photos: insertBrewery.photos || [],
      podcastEpisode: insertBrewery.podcastEpisode || null,
      checkins: insertBrewery.checkins || 0,
      rating: insertBrewery.rating || "0.0",
      ownerId: insertBrewery.ownerId || null,
      createdAt: new Date()
    };
    this.breweries.set(id, brewery);
    return brewery;
  }

  async updateBrewery(id: string, updates: Partial<Brewery>): Promise<Brewery | undefined> {
    const brewery = this.breweries.get(id);
    if (!brewery) return undefined;
    
    const updatedBrewery = { ...brewery, ...updates };
    this.breweries.set(id, updatedBrewery);
    return updatedBrewery;
  }

  // Check-ins
  async createCheckIn(insertCheckIn: InsertCheckIn): Promise<CheckIn> {
    const id = randomUUID();
    const checkIn: CheckIn = { 
      id,
      userId: insertCheckIn.userId,
      breweryId: insertCheckIn.breweryId,
      notes: insertCheckIn.notes || null,
      createdAt: new Date()
    };
    this.checkIns.set(id, checkIn);

    // Update user check-in count
    const user = this.users.get(insertCheckIn.userId);
    if (user) {
      user.checkins += 1;
      this.users.set(user.id, user);
    }

    // Update brewery check-in count
    const brewery = this.breweries.get(insertCheckIn.breweryId);
    if (brewery) {
      brewery.checkins += 1;
      this.breweries.set(brewery.id, brewery);
    }

    return checkIn;
  }

  async getUserCheckIns(userId: string): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values()).filter(checkIn => checkIn.userId === userId);
  }

  async getBreweryCheckIns(breweryId: string): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values()).filter(checkIn => checkIn.breweryId === breweryId);
  }

  // Events
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = { 
      id,
      name: insertEvent.name,
      description: insertEvent.description,
      breweryId: insertEvent.breweryId,
      date: insertEvent.date,
      startTime: insertEvent.startTime,
      endTime: insertEvent.endTime,
      image: insertEvent.image,
      photos: insertEvent.photos || [],
      ticketRequired: insertEvent.ticketRequired || false,
      ticketPrice: insertEvent.ticketPrice || null,
      attendees: insertEvent.attendees || 0,
      createdAt: new Date()
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...updates };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  // Podcast Episodes
  async getPodcastEpisodes(): Promise<PodcastEpisode[]> {
    return Array.from(this.podcastEpisodes.values()).sort((a, b) => b.episodeNumber - a.episodeNumber);
  }

  async getPodcastEpisode(id: string): Promise<PodcastEpisode | undefined> {
    return this.podcastEpisodes.get(id);
  }

  async createPodcastEpisode(insertEpisode: InsertPodcastEpisode): Promise<PodcastEpisode> {
    const id = randomUUID();
    const episode: PodcastEpisode = { 
      id,
      episodeNumber: insertEpisode.episodeNumber,
      title: insertEpisode.title,
      guest: insertEpisode.guest,
      business: insertEpisode.business,
      duration: insertEpisode.duration,
      releaseDate: insertEpisode.releaseDate,
      spotifyUrl: insertEpisode.spotifyUrl,
      image: insertEpisode.image,
      description: insertEpisode.description || null,
      createdAt: new Date()
    };
    this.podcastEpisodes.set(id, episode);
    return episode;
  }

  // Badges
  async getBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values()).sort((a, b) => a.minCheckins - b.minCheckins);
  }

  async getUserBadge(checkins: number): Promise<Badge | undefined> {
    const badges = await this.getBadges();
    return badges
      .sort((a, b) => b.minCheckins - a.minCheckins)
      .find(badge => checkins >= badge.minCheckins && 
                    (badge.maxCheckins === null || checkins <= badge.maxCheckins));
  }
}

export const storage = new MemStorage();
