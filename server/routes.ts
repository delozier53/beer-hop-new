import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCheckInSchema, insertUserSchema, insertPodcastEpisodeSchema, insertSpecialEventSchema, insertWeeklyEventSchema } from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService } from "./objectStorage";
import { sendVerificationCode, generateVerificationCode } from "./emailService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Users
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id/badge", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const badge = await storage.getUserBadge(req.params.id);
      res.json(badge);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id/favorites", async (req, res) => {
    try {
      const { breweryId } = req.body;
      const user = await storage.getUser(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const favorites = user.favoriteBreweries || [];
      const isFavorite = favorites.includes(breweryId);
      
      const updatedFavorites = isFavorite 
        ? favorites.filter(id => id !== breweryId)
        : [...favorites, breweryId];

      const updatedUser = await storage.updateUser(req.params.id, {
        favoriteBreweries: updatedFavorites
      });

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      const updatedUser = await storage.updateUser(req.params.id, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Breweries
  app.get("/api/breweries", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      console.log('Getting breweries...');
      let breweries = await storage.getBreweries();
      console.log(`Retrieved ${breweries.length} breweries`);
      
      // Sort by distance if location provided
      if (lat && lng) {
        const userLat = parseFloat(lat as string);
        const userLng = parseFloat(lng as string);
        
        breweries = breweries.map(brewery => ({
          ...brewery,
          distance: calculateDistance(
            userLat, 
            userLng, 
            parseFloat(brewery.latitude || '0'), 
            parseFloat(brewery.longitude || '0')
          )
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
      
      res.json(breweries);
    } catch (error) {
      console.error('Error in /api/breweries:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/breweries/:id", async (req, res) => {
    try {
      const brewery = await storage.getBrewery(req.params.id);
      if (!brewery) {
        return res.status(404).json({ message: "Brewery not found" });
      }
      res.json(brewery);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/breweries/:id", async (req, res) => {
    try {
      const updates = req.body;
      console.log("Updating brewery", req.params.id, "with data:", updates);
      
      const updatedBrewery = await storage.updateBrewery(req.params.id, updates);
      
      if (!updatedBrewery) {
        return res.status(404).json({ message: "Brewery not found" });
      }

      console.log("Updated brewery result:", updatedBrewery);
      res.json(updatedBrewery);
    } catch (error) {
      console.error("Error updating brewery:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Object Storage endpoints
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/objects/normalize", async (req, res) => {
    try {
      const { url } = req.body;
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(url);
      res.json({ objectPath });
    } catch (error) {
      console.error("Error normalizing object path:", error);
      res.status(500).json({ error: "Failed to normalize object path" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      
      // Special handling for podcast header - provide fallback
      if (req.path.includes('uploads/test-header') || req.path.includes('podcast-header')) {
        console.log("Podcast header missing, providing fallback");
        const fallbackUrl = "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=400";
        return res.redirect(302, fallbackUrl);
      }
      
      res.status(404).json({ message: "Object not found" });
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Check-ins
  app.post("/api/checkins", async (req, res) => {
    try {
      const validatedData = insertCheckInSchema.parse(req.body);
      
      // Check if user can check in (24-hour cooldown)
      const checkResult = await storage.canUserCheckIn(validatedData.userId, validatedData.breweryId);
      
      if (!checkResult.canCheckIn) {
        const hours = Math.floor((checkResult.timeRemaining || 0) / 3600);
        const minutes = Math.floor(((checkResult.timeRemaining || 0) % 3600) / 60);
        
        return res.status(400).json({ 
          message: "Check-in cooldown active", 
          timeRemaining: checkResult.timeRemaining,
          friendlyTimeRemaining: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
        });
      }
      
      const checkIn = await storage.createCheckIn(validatedData);
      res.status(201).json(checkIn);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check if user can check in at a brewery
  app.get("/api/checkins/can-checkin/:userId/:breweryId", async (req, res) => {
    try {
      const { userId, breweryId } = req.params;
      const checkResult = await storage.canUserCheckIn(userId, breweryId);
      res.json(checkResult);
    } catch (error) {
      console.error("Can check-in error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id/checkins", async (req, res) => {
    try {
      const checkIns = await storage.getUserCheckIns(req.params.id);
      res.json(checkIns);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Events
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      const eventsWithBreweries = await Promise.all(
        events.map(async (event) => {
          const brewery = await storage.getBrewery(event.breweryId);
          return {
            ...event,
            brewery: brewery ? { name: brewery.name, id: brewery.id } : null
          };
        })
      );
      res.json(eventsWithBreweries);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Special Events
  app.get("/api/special-events", async (req, res) => {
    try {
      const events = await storage.getSpecialEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/special-events/:id", async (req, res) => {
    try {
      const event = await storage.getSpecialEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Special event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/special-events", async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get user to check permissions
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check permissions: master admin or brewery owner
      const isMasterAdmin = user.role === 'admin';
      const isBreweryOwner = user.role === 'brewery_owner';
      
      if (!isMasterAdmin && !isBreweryOwner) {
        return res.status(403).json({ message: "Not authorized to create events" });
      }

      // Validate the request body
      const validatedData = insertSpecialEventSchema.parse(req.body);
      
      // Add the owner ID to the event data
      const eventDataWithOwner = {
        ...validatedData,
        ownerId: userId,
      };
      
      const event = await storage.createSpecialEvent(eventDataWithOwner);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating special event:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/special-events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      const userId = req.headers['x-user-id'] as string; // Simple user identification
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get the event to check ownership
      const event = await storage.getSpecialEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Special event not found" });
      }

      // Get user to check admin status
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check permissions: master admin or event owner
      const isMasterAdmin = user.role === 'admin';
      const isEventOwner = event.ownerId === userId;
      
      if (!isMasterAdmin && !isEventOwner) {
        return res.status(403).json({ message: "Not authorized to edit this event" });
      }

      // Update the event
      const updatedEvent = await storage.updateSpecialEvent(eventId, req.body);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating special event:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/special-events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get the event to check ownership
      const event = await storage.getSpecialEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Special event not found" });
      }

      // Get user to check permissions
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check permissions: master admin or event owner
      const isMasterAdmin = user.role === 'admin';
      const isEventOwner = event.ownerId === userId;
      
      if (!isMasterAdmin && !isEventOwner) {
        return res.status(403).json({ message: "Not authorized to delete this event" });
      }

      // Delete the event
      const success = await storage.deleteSpecialEvent(eventId);
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting special event:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Weekly Events routes
  app.get("/api/weekly-events", async (req, res) => {
    try {
      // Disable caching to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const events = await storage.getWeeklyEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching weekly events:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/weekly-events/:day", async (req, res) => {
    try {
      // Disable caching to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const events = await storage.getWeeklyEventsByDay(req.params.day);
      res.json(events);
    } catch (error) {
      console.error("Error fetching weekly events for day:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/weekly-events", async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get user to check permissions
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check permissions: master admin or brewery owner
      const isMasterAdmin = user.role === 'admin';
      const isBreweryOwner = user.role === 'brewery_owner';
      
      if (!isMasterAdmin && !isBreweryOwner) {
        return res.status(403).json({ message: "Not authorized to create weekly events" });
      }

      // Validate the request body
      const validatedData = insertWeeklyEventSchema.parse(req.body);
      
      const event = await storage.createWeeklyEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating weekly event:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/weekly-events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get user to check permissions
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check permissions: master admin or brewery owner
      const isMasterAdmin = user.role === 'admin';
      const isBreweryOwner = user.role === 'brewery_owner';
      
      if (!isMasterAdmin && !isBreweryOwner) {
        return res.status(403).json({ message: "Not authorized to edit weekly events" });
      }

      // Validate the request body
      const validatedData = insertWeeklyEventSchema.parse(req.body);
      
      const updatedEvent = await storage.updateWeeklyEvent(eventId, validatedData);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Weekly event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating weekly event:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/weekly-events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get user to check permissions
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check permissions: master admin or brewery owner
      const isMasterAdmin = user.role === 'admin';
      const isBreweryOwner = user.role === 'brewery_owner';
      
      if (!isMasterAdmin && !isBreweryOwner) {
        return res.status(403).json({ message: "Not authorized to delete weekly events" });
      }

      // Delete the event
      const success = await storage.deleteWeeklyEvent(eventId);
      if (!success) {
        return res.status(404).json({ message: "Weekly event not found" });
      }

      res.json({ message: "Weekly event deleted successfully" });
    } catch (error) {
      console.error("Error deleting weekly event:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Object storage upload endpoint for event images
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Object storage download endpoint for event images
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof (await import("./objectStorage")).ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Global settings endpoints
  app.get("/api/global-settings", async (req, res) => {
    try {
      const settings = await storage.getGlobalSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching global settings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/global-settings/events-header", async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get user to check admin status
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { headerImageUrl } = req.body;
      if (!headerImageUrl) {
        return res.status(400).json({ message: "Header image URL required" });
      }

      await storage.updateGlobalSetting('eventsHeaderImage', headerImageUrl);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating events header:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const brewery = await storage.getBrewery(event.breweryId);
      const eventWithBrewery = {
        ...event,
        brewery: brewery ? { name: brewery.name, id: brewery.id } : null
      };
      
      res.json(eventWithBrewery);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Podcast Episodes
  app.get("/api/podcast-episodes", async (req, res) => {
    try {
      const episodes = await storage.getPodcastEpisodes();
      res.json(episodes);
    } catch (error) {
      console.error("Error fetching podcast episodes:", error);
      res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/podcast-episodes", async (req, res) => {
    try {
      // Use episode number from request, or calculate if not provided
      let episodeNumber = req.body.episodeNumber;
      if (!episodeNumber) {
        const allEpisodes = await storage.getPodcastEpisodes();
        episodeNumber = Math.max(...allEpisodes.map(ep => ep.episodeNumber), 0) + 1;
      }
      
      // Validate the request body first
      const validatedData = insertPodcastEpisodeSchema.parse(req.body);
      
      // Add the episode number to the validated data
      const episodeDataWithNumber = {
        ...validatedData,
        episodeNumber: episodeNumber,
      };
      
      const episode = await storage.createPodcastEpisode(episodeDataWithNumber);
      res.status(201).json(episode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating podcast episode:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/podcast-episodes/:id", async (req, res) => {
    try {
      // For updates, we need to include episodeNumber if provided
      const updateSchema = insertPodcastEpisodeSchema.extend({
        episodeNumber: z.number().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      const episode = await storage.updatePodcastEpisode(req.params.id, validatedData);
      if (!episode) {
        return res.status(404).json({ message: "Episode not found" });
      }
      res.json(episode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating podcast episode:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/podcast-episodes/:id", async (req, res) => {
    try {
      const success = await storage.deletePodcastEpisode(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Episode not found" });
      }
      res.json({ message: "Episode deleted successfully" });
    } catch (error) {
      console.error("Error deleting podcast episode:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Event image processing endpoint
  app.put("/api/event-images", async (req, res) => {
    try {
      const { imageUrl } = req.body;
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // For now, just return the imageUrl as the objectPath since we're using a simplified object storage
      // The image upload was already successful, we just need to normalize the path
      let objectPath = imageUrl;
      
      // If it's a Google Storage URL, normalize it to our object path format
      if (imageUrl.startsWith("https://storage.googleapis.com/")) {
        const url = new URL(imageUrl);
        objectPath = url.pathname;
      }

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error processing event image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Global podcast header image
  app.get("/api/podcast/header", async (req, res) => {
    try {
      const headerImage = await storage.getPodcastHeaderImage();
      res.json({ headerImage });
    } catch (error) {
      console.error("Error fetching podcast header:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/podcast/header", async (req, res) => {
    try {
      const { headerImage } = req.body;
      await storage.setPodcastHeaderImage(headerImage);
      res.json({ message: "Header image updated successfully", headerImage });
    } catch (error) {
      console.error("Error updating podcast header:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Authentication Routes
  app.post("/api/auth/send-code", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      // Cleanup expired codes before creating new one
      await storage.cleanupExpiredVerificationCodes();
      
      // Generate and send verification code
      const code = generateVerificationCode();
      const verificationCode = await storage.createVerificationCode(email, code);
      
      const emailSent = await sendVerificationCode(email, code);
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification email" });
      }

      res.json({ message: "Verification code sent to your email" });
    } catch (error) {
      console.error("Error sending verification code:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required" });
      }

      // Check if verification code is valid
      const validCode = await storage.getValidVerificationCode(email, code);
      
      if (!validCode) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }

      // Mark code as used
      await storage.markVerificationCodeAsUsed(validCode.id);

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      
      if (existingUser) {
        // Existing user - return user data
        res.json({ 
          user: existingUser,
          isNewUser: false 
        });
      } else {
        // New user - they need to complete profile
        res.json({ 
          email,
          isNewUser: true 
        });
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/complete-profile", async (req, res) => {
    try {
      const { email, username, name, location } = req.body;
      
      if (!email || !username || !name) {
        return res.status(400).json({ message: "Email, username, and name are required" });
      }

      // Check if username is already taken
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken" });
      }

      // Create new user
      const newUser = await storage.createUser({
        username,
        name,
        email,
        location: location || null,
        profileImage: null,
        headerImage: null,
        role: "user",
        checkins: 0,
        favoriteBreweries: [],
        latitude: null,
        longitude: null
      });

      res.json({ 
        user: newUser,
        isNewUser: false 
      });
    } catch (error) {
      console.error("Error completing profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}
