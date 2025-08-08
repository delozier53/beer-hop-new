// server/auth.ts  — REPLACE
import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "./supabase.js";

declare global {
  namespace Express {
    interface Request { user?: { id: string; email?: string | null } }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const hdr = req.header("authorization") || req.header("Authorization");
    const token = hdr?.startsWith("Bearer ") ? hdr.slice(7) : undefined;
    if (!token) return res.status(401).json({ error: "Missing Bearer token" });

    // Verify access token using the Admin client (needs SERVICE_ROLE key in env)
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: "Invalid token" });

    req.user = { id: data.user.id, email: data.user.email ?? null };
    next();
  } catch (e: any) {
    res.status(401).json({ error: "Auth check failed", details: String(e) });
  }
}
