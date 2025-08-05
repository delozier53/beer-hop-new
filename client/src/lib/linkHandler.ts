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
  if (!url) return;
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    // Find matching native app mapping
    const mapping = NATIVE_APP_MAPPINGS.find(m => 
      domain === m.domain || domain.endsWith('.' + m.domain)
    );
    
    if (mapping) {
      const nativeUrl = buildNativeUrl(url, mapping);
      
      // Try to open in native app
      const attemptNativeOpen = () => {
        // Create a hidden iframe to attempt the native app open
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = nativeUrl;
        document.body.appendChild(iframe);
        
        // Clean up the iframe after a short delay
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 100);
      };
      
      // Set up fallback to web URL
      const fallbackTimer = setTimeout(() => {
        // If we're still here after the timeout, open web URL
        window.open(url, '_blank', 'noopener,noreferrer');
      }, 1000);
      
      // Try native app first
      attemptNativeOpen();
      
      // Listen for page visibility change to detect if native app opened
      const handleVisibilityChange = () => {
        if (document.hidden) {
          // User switched to another app, likely the native app opened
          clearTimeout(fallbackTimer);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up listener after timeout
      setTimeout(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }, 2000);
      
    } else {
      // No native app mapping, open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    
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