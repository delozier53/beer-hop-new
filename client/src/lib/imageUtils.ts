/**
 * Converts a Google Drive sharing link to a direct image URL
 * @param url - The Google Drive sharing URL
 * @returns The direct image URL or the original URL if not a Google Drive link
 */
export function convertGoogleDriveImageUrl(url: string): string {
  if (!url) return url;
  
  // Check if it's a Google Drive sharing link
  const driveMatch = url.match(/https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  
  if (driveMatch && driveMatch[1]) {
    // Convert to direct access URL
    return `https://drive.google.com/uc?id=${driveMatch[1]}`;
  }
  
  // Return original URL if not a Google Drive link
  return url;
}