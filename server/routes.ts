import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCheckInSchema, insertUserSchema, insertPodcastEpisodeSchema } from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService } from "./objectStorage";

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
      const checkIn = await storage.createCheckIn(validatedData);
      res.status(201).json(checkIn);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
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
      // Calculate next episode number on the backend
      const allEpisodes = await storage.getPodcastEpisodes();
      const nextEpisodeNumber = Math.max(...allEpisodes.map(ep => ep.episodeNumber), 0) + 1;
      
      // Validate the request body first
      const validatedData = insertPodcastEpisodeSchema.parse(req.body);
      
      // Add the calculated episode number to the validated data
      const episodeDataWithNumber = {
        ...validatedData,
        episodeNumber: nextEpisodeNumber,
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
