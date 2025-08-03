import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCheckInSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

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
      
      const badge = await storage.getUserBadge(user.checkins);
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
      let breweries = await storage.getBreweries();
      
      // Sort by distance if location provided
      if (lat && lng) {
        const userLat = parseFloat(lat as string);
        const userLng = parseFloat(lng as string);
        
        breweries = breweries.map(brewery => ({
          ...brewery,
          distance: calculateDistance(
            userLat, 
            userLng, 
            parseFloat(brewery.latitude), 
            parseFloat(brewery.longitude)
          )
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
      
      res.json(breweries);
    } catch (error) {
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
      const updatedBrewery = await storage.updateBrewery(req.params.id, updates);
      
      if (!updatedBrewery) {
        return res.status(404).json({ message: "Brewery not found" });
      }

      res.json(updatedBrewery);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
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
