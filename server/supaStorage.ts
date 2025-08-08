// server/supaStorage.ts
import type { Response } from "express";
import { Readable } from "node:stream";
import { supabaseAdmin } from "./supabase";

const need = (k: keyof NodeJS.ProcessEnv): string => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
};

const BUCKET = need("SUPABASE_STORAGE_BUCKET");

// Signed URL for client to upload directly
export async function createSignedUploadUrl(path: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);
  if (error) throw error;
  return data; // { signedUrl, path, token }
}

export async function createSignedGetUrl(path: string, expiresInSec = 900) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSec);
  if (error) throw error;
  return data.signedUrl;
}

export function publicUrl(path: string) {
  return supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Streams an object from Supabase Storage to the Express response.
 * Works whether Supabase returns a Node stream, a Web stream, or a Blob.
 */
export async function streamObject(path: string, res: Response) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(path);
  if (error || !data) {
    return res.status(404).json({ message: "Object not found" });
  }

  // Default content type if you don't store metadata
  res.setHeader("Content-Type", "application/octet-stream");

  const anyData = data as any;

  // Case 1: Node Readable stream (has .pipe)
  if (typeof anyData.pipe === "function") {
    anyData.pipe(res);
    return;
  }

  // Case 2: Web ReadableStream (Blob/Response-like)
  if (typeof anyData.stream === "function") {
    const nodeStream = Readable.fromWeb(anyData.stream());
    nodeStream.pipe(res);
    return;
  }

  // Case 3: Blob with arrayBuffer()
  if (typeof anyData.arrayBuffer === "function") {
    const buf = Buffer.from(await anyData.arrayBuffer());
    res.end(buf);
    return;
  }

  // Fallback: unsupported type
  res.status(500).json({ message: "Unsupported download data type" });
}
