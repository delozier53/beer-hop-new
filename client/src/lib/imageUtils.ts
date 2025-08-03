/**
 * Converts a Google Drive sharing link to a direct image URL
 * @param url - The Google Drive sharing URL or null
 * @returns The direct image URL or the original URL if not a Google Drive link
 */
export function convertGoogleDriveImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  // Check if it's a Google Drive sharing link (handles both share_link and drive_link formats)
  const driveMatch = url.match(/https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  
  if (driveMatch && driveMatch[1]) {
    // Convert to direct access URL using the thumbnail format which works better for images
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w200-h200`;
  }
  
  // Return original URL if not a Google Drive link
  return url;
}