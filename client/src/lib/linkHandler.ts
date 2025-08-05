/**
 * Smart link handler that attempts to open links in their native apps
 * Falls back to opening in a new browser tab if native app is not available
 */

interface NativeAppMapping {
  domain: string;
  appScheme: string;
  webFallback?: boolean;
}

// Common native app mappings
const NATIVE_APP_MAPPINGS: NativeAppMapping[] = [
  { domain: 'instagram.com', appScheme: 'instagram://user?username=' },
  { domain: 'www.instagram.com', appScheme: 'instagram://user?username=' },
  { domain: 'facebook.com', appScheme: 'fb://profile/' },
  { domain: 'www.facebook.com', appScheme: 'fb://profile/' },
  { domain: 'twitter.com', appScheme: 'twitter://user?screen_name=' },
  { domain: 'x.com', appScheme: 'twitter://user?screen_name=' },
  { domain: 'tiktok.com', appScheme: 'tiktok://user/' },
  { domain: 'www.tiktok.com', appScheme: 'tiktok://user/' },
  { domain: 'youtube.com', appScheme: 'youtube://' },
  { domain: 'www.youtube.com', appScheme: 'youtube://' },
  { domain: 'youtu.be', appScheme: 'youtube://' },
  { domain: 'linkedin.com', appScheme: 'linkedin://' },
  { domain: 'www.linkedin.com', appScheme: 'linkedin://' },
  { domain: 'spotify.com', appScheme: 'spotify:' },
  { domain: 'open.spotify.com', appScheme: 'spotify:' },
  { domain: 'apple.com', appScheme: 'https://' }, // Apple Music/App Store links work best with https
  { domain: 'apps.apple.com', appScheme: 'https://' },
  { domain: 'music.apple.com', appScheme: 'music://' },
];

/**
 * Attempts to extract username/handle from social media URLs
 */
function extractSocialHandle(url: string, domain: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove leading slash and split by /
    const parts = pathname.substring(1).split('/');
    
    if (parts.length > 0 && parts[0]) {
      // For most social platforms, the username is the first part of the path
      return parts[0];
    }
    
    return '';
  } catch {
    return '';
  }
}

/**
 * Converts web URLs to native app URLs when possible
 */
function buildNativeUrl(webUrl: string, mapping: NativeAppMapping): string {
  try {
    const urlObj = new URL(webUrl);
    
    // Special handling for different platforms
    if (mapping.domain.includes('instagram.com')) {
      const handle = extractSocialHandle(webUrl, mapping.domain);
      return handle ? `instagram://user?username=${handle}` : `instagram://`;
    }
    
    if (mapping.domain.includes('facebook.com')) {
      const handle = extractSocialHandle(webUrl, mapping.domain);
      return handle ? `fb://profile/${handle}` : `fb://`;
    }
    
    if (mapping.domain.includes('twitter.com') || mapping.domain.includes('x.com')) {
      const handle = extractSocialHandle(webUrl, mapping.domain);
      return handle ? `twitter://user?screen_name=${handle}` : `twitter://`;
    }
    
    if (mapping.domain.includes('tiktok.com')) {
      const handle = extractSocialHandle(webUrl, mapping.domain);
      return handle ? `tiktok://user/${handle}` : `tiktok://`;
    }
    
    if (mapping.domain.includes('youtube.com') || mapping.domain.includes('youtu.be')) {
      // YouTube URLs can be complex, try to preserve the path
      const pathname = urlObj.pathname;
      const search = urlObj.search;
      return `youtube://${pathname}${search}`;
    }
    
    if (mapping.domain.includes('spotify.com')) {
      // Convert Spotify web URLs to app URLs
      const pathname = urlObj.pathname;
      return `spotify:${pathname.replace(/\//g, ':')}`;
    }
    
    if (mapping.domain.includes('linkedin.com')) {
      // LinkedIn app URLs are complex, keep as web URL
      return webUrl;
    }
    
    if (mapping.domain.includes('apple.com')) {
      // Apple links work best as HTTPS
      return webUrl;
    }
    
    // Default: try to preserve the path
    return `${mapping.appScheme}${urlObj.pathname}${urlObj.search}`;
    
  } catch {
    // If URL parsing fails, return the original
    return webUrl;
  }
}

/**
 * Smart link opener that tries native app first, falls back to web
 */
export function openSmartLink(url: string): void {
  if (!url) {
    console.log('openSmartLink called with empty URL');
    return;
  }
  
  console.log('openSmartLink called with URL:', url);
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    // Special handling for Instagram URLs
    if (domain.includes('instagram.com')) {
      const pathname = urlObj.pathname;
      const handle = pathname.split('/').filter(part => part.length > 0)[0];
      
      if (handle) {
        const instagramAppUrl = `instagram://user?username=${handle}`;
        console.log('Attempting to open Instagram app with:', instagramAppUrl);
        
        // Try to open Instagram app
        window.location.href = instagramAppUrl;
        
        // Fallback to web version after a short delay
        setTimeout(() => {
          window.open(url, '_blank', 'noopener,noreferrer');
        }, 500);
        
        return;
      }
    }
    
    // Special handling for other social media
    if (domain.includes('facebook.com')) {
      const pathname = urlObj.pathname;
      const handle = pathname.split('/').filter(part => part.length > 0)[0];
      
      if (handle) {
        const fbAppUrl = `fb://profile/${handle}`;
        console.log('Attempting to open Facebook app with:', fbAppUrl);
        window.location.href = fbAppUrl;
        setTimeout(() => {
          window.open(url, '_blank', 'noopener,noreferrer');
        }, 500);
        return;
      }
    }
    
    // Special handling for Spotify
    if (domain.includes('spotify.com')) {
      const pathname = urlObj.pathname;
      const spotifyAppUrl = `spotify:${pathname.replace(/\//g, ':')}`;
      console.log('Attempting to open Spotify app with:', spotifyAppUrl);
      window.location.href = spotifyAppUrl;
      setTimeout(() => {
        window.open(url, '_blank', 'noopener,noreferrer');
      }, 500);
      return;
    }
    
    // For all other URLs, just open in new tab
    console.log('Opening in new tab:', url);
    window.open(url, '_blank', 'noopener,noreferrer');
    
  } catch (error) {
    console.error('Error opening smart link:', error);
    // Fallback to basic window.open
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Simple wrapper for backward compatibility
 */
export function openLink(url: string): void {
  openSmartLink(url);
}