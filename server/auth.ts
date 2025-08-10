// server/auth.ts  — REPLACE
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage.js";

declare global {
  namespace Express {
    interface Request { user?: { id: string; email?: string | null; role?: string } }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // For now, we'll use the x-user-id header for authentication
    // This is a simplified auth system for the demo
    const userId = req.headers["x-user-id"] as string;
    
    if (!userId) {
      return res.status(401).json({ error: "User ID required in x-user-id header" });
    }

    // Verify the user exists in our system
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (e: any) {
    console.error("Auth check failed:", e);
    res.status(401).json({ error: "Auth check failed", details: String(e) });
  }
}
