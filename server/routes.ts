// server/routes.ts — CLEAN REWRITE
import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";

import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { requireAuth } from "./auth.js";
import {
  insertCheckInSchema,
  insertPodcastEpisodeSchema,
  insertSpecialEventSchema,
  insertWeeklyEventSchema,
} from "@shared/schema";

import {
  sendVerificationCode,
  generateVerificationCode,
} from "./emailService";

export async function registerRoutes(app: Express): Promise<Server> {
  // ---------- Health ----------
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  });

  // ---------- Users ----------
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id/badge", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const badge = await storage.getUserBadge(req.params.id);
      res.json(badge);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/leaderboard", async (_req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id/favorites", async (req, res) => {
    try {
      const { breweryId } = req.body;
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const favorites = user.favoriteBreweries || [];
      const updatedFavorites = favorites.includes(breweryId)
        ? favorites.filter((id: string) => id !== breweryId)
        : [...favorites, breweryId];

      const updatedUser = await storage.updateUser(req.params.id, {
        favoriteBreweries: updatedFavorites,
      });

      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const updatedUser = await storage.updateUser(req.params.id, req.body);
      if (!updatedUser) return res.status(404).json({ message: "User not found" });
      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ---------- Breweries ----------
  app.get("/api/breweries", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      let breweries = await storage.getBreweries();

      if (lat && lng) {
        const userLat = parseFloat(lat as string);
        const userLng = parseFloat(lng as string);
        breweries = breweries
          .map((b: any) => ({
            ...b,
            distance: calculateDistance(
              userLat,
              userLng,
              parseFloat(b.latitude || "0"),
              parseFloat(b.longitude || "0")
            ),
          }))
          .sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
      }

      res.json(breweries);
    } catch (err) {
      console.error("Error in /api/breweries:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/breweries/:id", async (req, res) => {
    try {
      const brewery = await storage.getBrewery(req.params.id);
      if (!brewery) return res.status(404).json({ message: "Brewery not found" });
      res.json(brewery);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/breweries/:id", async (req, res) => {
    try {
      const updated = await storage.updateBrewery(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Brewery not found" });
      res.json(updated);
    } catch (err) {
      console.error("Error updating brewery:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Master admin banner update
  app.put("/api/breweries/:id/banner", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) return res.status(401).json({ message: "User ID required" });

      const user = await storage.getUser(userId);
      if (!user || user.email !== "joshuamdelozier@gmail.com") {
        return res.status(403).json({ message: "Master admin access required" });
      }

      const { bannerImageUrl, bannerLinkUrl } = req.body;
      if (!bannerImageUrl) {
        return res.status(400).json({ message: "Banner image URL required" });
      }

      const brewery = await storage.updateBrewery(req.params.id, {
        bannerImage: bannerImageUrl,
        bannerLink: bannerLinkUrl || null,
      });

      res.json({ success: true, brewery });
    } catch (err) {
      console.error("Error updating brewery banner:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ---------- Object Storage (single definitions only) ----------
  app.post("/api/objects/upload", async (_req, res) => {
    try {
      const s = new ObjectStorageService();
      const uploadURL = await s.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (err) {
      console.error("Error getting upload URL:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/objects/normalize", async (req, res) => {
    try {
      const { url } = req.body || {};
      const s = new ObjectStorageService();
      const objectPath = s.normalizeObjectEntityPath(url);
      res.json({ objectPath });
    } catch (err) {
      console.error("Error normalizing object path:", err);
      res.status(500).json({ error: "Failed to normalize object path" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const s = new ObjectStorageService();
      const file = await s.getObjectEntityFile(req.path);
      s.downloadObject(file, res);
    } catch (err) {
      console.error("Error serving object:", err);
      if (req.path.includes("uploads/test-header") || req.path.includes("podcast-header")) {
        const fallbackUrl =
          "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=400";
        return res.redirect(302, fallbackUrl);
      }
      res.status(404).json({ message: "Object not found" });
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    try {
      const s = new ObjectStorageService();
      const file = await s.searchPublicObject(req.params.filePath);
      if (!file) return res.status(404).json({ error: "File not found" });
      s.downloadObject(file, res);
    } catch (err) {
      console.error("Error searching for public object:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ---------- Check-ins ----------
  app.post("/api/checkins", async (req, res) => {
    try {
      const data = insertCheckInSchema.parse(req.body);
      const check = await storage.canUserCheckIn(data.userId, data.breweryId);
      if (!check.canCheckIn) {
        const hours = Math.floor((check.timeRemaining || 0) / 3600);
        const minutes = Math.floor(((check.timeRemaining || 0) % 3600) / 60);
        return res.status(400).json({
          message: "Check-in cooldown active",
          timeRemaining: check.timeRemaining,
          friendlyTimeRemaining: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
        });
      }
      const created = await storage.createCheckIn(data);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      console.error("Check-in error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/checkins/can-checkin/:userId/:breweryId", async (req, res) => {
    try {
      const { userId, breweryId } = req.params;
      const result = await storage.canUserCheckIn(userId, breweryId);
      res.json(result);
    } catch (err) {
      console.error("Can check-in error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id/checkins", async (req, res) => {
    try {
      const checkIns = await storage.getUserCheckIns(req.params.id);
      res.json(checkIns);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ---------- Events ----------
  app.get("/api/events", async (_req, res) => {
    try {
      const events = await storage.getEvents();
      const withBreweries = await Promise.all(
        events.map(async (e: any) => {
          const b = await storage.getBrewery(e.breweryId);
          return { ...e, brewery: b ? { name: b.name, id: b.id } : null };
        })
      );
      res.json(withBreweries);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) return res.status(404).json({ message: "Event not found" });
      const brewery = await storage.getBrewery(event.breweryId);
      res.json({ ...event, brewery: brewery ? { name: brewery.name, id: brewery.id } : null });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ---------- Special Events ----------
  app.get("/api/special-events", async (_req, res) => {
    try {
      const events = await storage.getSpecialEvents();
      res.json(events);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/special-events/:id", async (req, res) => {
    try {
      const event = await storage.getSpecialEvent(req.params.id);
      if (!event) return res.status(404).json({ message: "Special event not found" });
      res.json(event);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/special-events", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) return res.status(401).json({ message: "User ID required" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "User not found" });

      const isMasterAdmin = user.email === "joshuamdelozier@gmail.com";
      const isBreweryOwner = user.role === "brewery_owner";
      if (!isMasterAdmin && !isBreweryOwner) {
        return res.status(403).json({ message: "Not authorized to create events" });
      }

      const data = insertSpecialEventSchema.parse(req.body);
      const created = await storage.createSpecialEvent({ ...data, ownerId: userId });
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      console.error("Error creating special event:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/special-events/:id", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) return res.status(401).json({ message: "User ID required" });

      const event = await storage.getSpecialEvent(req.params.id);
      if (!event) return res.status(404).json({ message: "Special event not found" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "User not found" });

      const isMasterAdmin = user.email === "joshuamdelozier@gmail.com";
      const isOwner = event.ownerId === userId;
      if (!isMasterAdmin && !isOwner) {
        return res.status(403).json({ message: "Not authorized to edit this event" });
      }

      const updated = await storage.updateSpecialEvent(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Event not found" });
      res.json(updated);
    } catch (err) {
      console.error("Error updating special event:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/special-events/:id", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) return res.status(401).json({ message: "User ID required" });

      const event = await storage.getSpecialEvent(req.params.id);
      if (!event) return res.status(404).json({ message: "Special event not found" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "User not found" });

      const isMasterAdmin = user.email === "joshuamdelozier@gmail.com";
      const isOwner = event.ownerId === userId;
      if (!isMasterAdmin && !isOwner) {
        return res.status(403).json({ message: "Not authorized to delete weekly events" });
      }

      const ok = await storage.deleteSpecialEvent(req.params.id);
      if (!ok) return res.status(404).json({ message: "Event not found" });
      res.json({ message: "Event deleted successfully" });
    } catch (err) {
      console.error("Error deleting special event:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ---------- Weekly Events ----------
  app.get("/api/weekly-events", async (_req, res) => {
    try {
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });
      const events = await storage.getWeeklyEvents();
      res.json(events);
    } catch (err) {
      console.error("Error fetching weekly events:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/weekly-events/:day", async (req, res) => {
    try {
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });
      const events = await storage.getWeeklyEventsByDay(req.params.day);
      res.json(events);
    } catch (err) {
      console.error("Error fetching weekly events for day:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/weekly-events", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) return res.status(401).json({ message: "User ID required" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "User not found" });

      const isMasterAdmin = user.email === "joshuamdelozier@gmail.com";
      const isBreweryOwner = user.role === "brewery_owner";
      if (!isMasterAdmin && !isBreweryOwner) {
        return res.status(403).json({ message: "Not authorized to create weekly events" });
      }

      const data = insertWeeklyEventSchema.parse(req.body);
      const created = await storage.createWeeklyEvent(data);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      console.error("Error creating weekly event:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/weekly-events/:id", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) return res.status(401).json({ message: "User ID required" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "User not found" });

      const isMasterAdmin = user.email === "joshuamdelozier@gmail.com";
      const isBreweryOwner = user.role === "brewery_owner";
      if (!isMasterAdmin && !isBreweryOwner) {
        return res.status(403).json({ message: "Not authorized to edit weekly events" });
      }

      const data = insertWeeklyEventSchema.parse(req.body);
      const updated = await storage.updateWeeklyEvent(req.params.id, data);
      if (!updated) return res.status(404).json({ message: "Weekly event not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      console.error("Error updating weekly event:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/weekly-events/:id", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) return res.status(401).json({ message: "User ID required" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "User not found" });

      const isMasterAdmin = user.email === "joshuamdelozier@gmail.com";
      const isBreweryOwner = user.role === "brewery_owner";
      if (!isMasterAdmin && !isBreweryOwner) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete weekly events" });
      }

      const ok = await storage.deleteWeeklyEvent(req.params.id);
      if (!ok) return res.status(404).json({ message: "Weekly event not found" });
      res.json({ message: "Weekly event deleted successfully" });
    } catch (err) {
      console.error("Error deleting weekly event:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ---------- Profile Images (object ACL) ----------
  app.put("/api/profile-images", async (req, res) => {
    try {
      const { profileImageURL, userId } = req.body || {};
      if (!profileImageURL || !userId) {
        return res.status(400).json({ error: "profileImageURL and userId are required" });
      }
      const s = new ObjectStorageService();
      const objectPath = await s.trySetObjectEntityAclPolicy(profileImageURL, {
        owner: userId,
        visibility: "public",
      });
      res.status(200).json({ objectPath });
    } catch (err) {
      console.error("Error setting profile image:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ---------- Global Settings ----------
  app.get("/api/global-settings", async (_req, res) => {
    try {
      const settings = await storage.getGlobalSettings();
      res.json(settings);
    } catch (err) {
      console.error("Error fetching global settings:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/global-settings/events-header", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) return res.status(401).json({ message: "User ID required" });

      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { headerImageUrl } = req.body || {};
      if (!headerImageUrl) {
        return res.status(400).json({ message: "Header image URL required" });
      }

      await storage.updateGlobalSetting("eventsHeaderImage", headerImageUrl);
      res.json({ success: true });
    } catch (err) {
      console.error("Error updating events header:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/global-settings/podcast-banner", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) return res.status(401).json({ message: "User ID required" });

      const user = await storage.getUser(userId);
      if (!user || user.email !== "joshuamdelozier@gmail.com") {
        return res.status(403).json({ message: "Master admin access required" });
      }

      const { bannerImageUrl, bannerLinkUrl } = req.body || {};
      if (!bannerImageUrl || !bannerLinkUrl) {
        return res
          .status(400)
          .json({ message: "Banner image URL and link URL required" });
      }

      await storage.updateGlobalSetting("podcastBannerImage", bannerImageUrl);
      await storage.updateGlobalSetting("podcastBannerLink", bannerLinkUrl);
      res.json({ success: true });
    } catch (err) {
      console.error("Error updating podcast banner:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/global-settings/events-banner", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) return res.status(401).json({ message: "User ID required" });

      const user = await storage.getUser(userId);
      if (!user || user.email !== "joshuamdelozier@gmail.com") {
        return res.status(403).json({ message: "Master admin access required" });
      }

      const { bannerImageUrl, bannerLinkUrl } = req.body || {};
      if (!bannerImageUrl || !bannerLinkUrl) {
        return res
          .status(400)
          .json({ message: "Banner image URL and link URL required" });
      }

      await storage.updateGlobalSetting("eventsBannerImage", bannerImageUrl);
      await storage.updateGlobalSetting("eventsBannerLink", bannerLinkUrl);
      res.json({ success: true });
    } catch (err) {
      console.error("Error updating events banner:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/global-settings/leaderboard-header", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) return res.status(401).json({ message: "User ID required" });

      const user = await storage.getUser(userId);
      if (!user || user.email !== "joshuamdelozier@gmail.com") {
        return res.status(403).json({ message: "Master admin access required" });
      }

      const { headerImage } = req.body || {};
      if (!headerImage) {
        return res.status(400).json({ message: "Header image URL required" });
      }

      await storage.updateGlobalSetting("leaderboardHeaderImage", headerImage);
      res.json({ success: true });
    } catch (err) {
      console.error("Error updating leaderboard header:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ---------- Podcast ----------
  app.get("/api/podcast-episodes", async (_req, res) => {
    try {
      const episodes = await storage.getPodcastEpisodes();
      res.json(episodes);
    } catch (err) {
      console.error("Error fetching podcast episodes:", err);
      res
        .status(500)
        .json({
          message: "Internal server error",
          error: err instanceof Error ? err.message : String(err),
        });
    }
  });

  app.post("/api/podcast-episodes", async (req, res) => {
    try {
      let episodeNumber = req.body?.episodeNumber;
      if (!episodeNumber) {
        const all = await storage.getPodcastEpisodes();
        episodeNumber = Math.max(...all.map((ep: any) => ep.episodeNumber), 0) + 1;
      }

      const data = insertPodcastEpisodeSchema.parse(req.body);
      const created = await storage.createPodcastEpisode({
        ...data,
        episodeNumber,
      });
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      console.error("Error creating podcast episode:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/podcast-episodes/:id", async (req, res) => {
    try {
      const updateSchema = insertPodcastEpisodeSchema.extend({
        episodeNumber: z.number().optional(),
      });
      const data = updateSchema.parse(req.body);
      const updated = await storage.updatePodcastEpisode(req.params.id, data);
      if (!updated) return res.status(404).json({ message: "Episode not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      console.error("Error updating podcast episode:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/podcast-episodes/:id", async (req, res) => {
    try {
      const ok = await storage.deletePodcastEpisode(req.params.id);
      if (!ok) return res.status(404).json({ message: "Episode not found" });
      res.json({ message: "Episode deleted successfully" });
    } catch (err) {
      console.error("Error deleting podcast episode:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Process event image path (normalize/allow google storage)
  app.put("/api/event-images", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) return res.status(401).json({ message: "User ID required" });

      const { imageUrl } = req.body || {};
      if (!imageUrl) return res.status(400).json({ error: "imageUrl required" });

      let objectPath = imageUrl;
      if (imageUrl.startsWith("https://storage.googleapis.com/")) {
        const u = new URL(imageUrl);
        objectPath = u.pathname;
      }
      res.status(200).json({ objectPath });
    } catch (err) {
      console.error("Error processing event image:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Podcast header
  app.get("/api/podcast/header", async (_req, res) => {
    try {
      const headerImage = await storage.getPodcastHeaderImage();
      res.json({ headerImage });
    } catch (err) {
      console.error("Error fetching podcast header:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/podcast/header", async (req, res) => {
    try {
      const { headerImage } = req.body || {};
      await storage.setPodcastHeaderImage(headerImage);
      res.json({ message: "Header image updated successfully", headerImage });
    } catch (err) {
      console.error("Error updating podcast header:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ---------- Authentication ----------
  app.post("/api/auth/send-code", async (req, res) => {
    try {
      const raw = String(req.body?.email || "");
      const email = raw.trim().toLowerCase();
      if (!email) return res.status(400).json({ message: "email required" });

      await storage.cleanupExpiredVerificationCodes();
      const code = generateVerificationCode();
      await storage.createVerificationCode(email, code);

      console.log("[send-code] route using emailService SMTP path");
      const ok = await sendVerificationCode(email, code);
      if (!ok) return res.status(500).json({ message: "Failed to send verification email" });

      return res.json({ message: "Verification code sent to your email" });
    } catch (err: any) {
      console.error("[send-code] route error", err?.message || String(err));
      return res.status(500).json({ message: "Internal server error" });
    }
  });


  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const code = String(req.body?.code || "").trim();
      if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required" });
      }

      console.log(`[verify-code] email=${email} code="${code}" len=${code.length}`);

      const valid = await storage.getValidVerificationCode(email, code);
      if (!valid) {
        return res
          .status(400)
          .json({ message: "Invalid or expired verification code" });
      }

      await storage.markVerificationCodeAsUsed(valid.id);

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.json({ user: existingUser, isNewUser: false });
      }
      return res.json({ email, isNewUser: true });
    } catch (err) {
      console.error("[verify-code] error", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/complete-profile", async (req, res) => {
    try {
      const { email, username, profileImageUrl } = req.body || {};
      if (!email || !username) {
        return res.status(400).json({ message: "Email and username are required" });
      }

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username is already taken" });
      }

      const newUser = await storage.createUser({
        username,
        name: username,
        email: String(email).trim().toLowerCase(),
        location: null,
        profileImage: profileImageUrl || null,
        headerImage: null,
        role: "user",
        checkins: 0,
        favoriteBreweries: [],
        latitude: null,
        longitude: null,
      });

      return res.json({ user: newUser, isNewUser: false });
    } catch (err) {
      console.error("[complete-profile] error", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// ------------ helpers ------------
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}
