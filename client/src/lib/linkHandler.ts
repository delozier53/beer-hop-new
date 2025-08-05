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
        
        // Mark that we're navigating externally
        sessionStorage.setItem('external-nav', 'true');
        
        // Try multiple approaches for better compatibility
        let appOpened = false;
        
        // Use a more reliable method to try opening the app
        try {
          // Create a hidden iframe to attempt app opening
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = instagramAppUrl;
          document.body.appendChild(iframe);
          
          // Clean up iframe after a short delay
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 100);
          
          console.log('Attempted Instagram app opening via iframe');
        } catch (e) {
          console.log('Instagram app opening failed:', e);
        }
        
        // Set up fallback to web version
        const fallbackTimer = setTimeout(() => {
          console.log('Instagram app timeout - opening web version');
          window.open(url, '_blank', 'noopener,noreferrer');
        }, 2000);
        
        // Listen for visibility change (user switched to app)
        const handleVisibilityChange = () => {
          if (document.hidden) {
            console.log('Page hidden - Instagram app likely opened');
            clearTimeout(fallbackTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Also clear timer if user comes back to page quickly (app didn't open)
        setTimeout(() => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }, 3000);
        
        // Clean up listener
        setTimeout(() => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }, 2000);
        
        return;
      }
    }
    
    // Special handling for Facebook (mobile-optimized)
    if (domain.includes('facebook.com') || domain.includes('fb.com')) {
      // Mark that we're navigating externally
      sessionStorage.setItem('external-nav', 'true');
      
      const pathname = urlObj.pathname;
      console.log('Mobile Facebook URL pathname:', pathname);
      
      // Extract handle from various Facebook URL formats
      let handle = '';
      if (pathname.includes('/profile.php')) {
        // Handle format: facebook.com/profile.php?id=123456
        const urlParams = new URLSearchParams(urlObj.search);
        handle = urlParams.get('id') || '';
      } else {
        // Handle format: facebook.com/username
        const pathParts = pathname.split('/').filter(part => part.length > 0);
        handle = pathParts[0] || '';
      }
      
      if (handle) {
        // Mobile Facebook app URL scheme
        const fbAppUrl = handle.match(/^\d+$/) ? `fb://profile/${handle}` : `fb://page/${handle}`;
        console.log('Attempting mobile Facebook app with:', fbAppUrl);
        
        try {
          // For mobile, direct window.location.href works best
          window.location.href = fbAppUrl;
          console.log('Mobile Facebook app opening triggered');
        } catch (e) {
          console.log('Mobile Facebook app opening failed:', e);
        }
        
        return;
      } else {
        console.log('Could not extract Facebook handle from mobile URL');
        return;
      }
    }
    
    // Special handling for Spotify
    if (domain.includes('spotify.com')) {
      console.log('Attempting to open Spotify URL:', url);
      
      // Extract the episode/track/show ID from the URL
      const pathname = urlObj.pathname;
      let spotifyAppUrl = '';
      
      // Handle different Spotify URL formats
      if (pathname.includes('/episode/')) {
        const episodeId = pathname.split('/episode/')[1]?.split('?')[0];
        spotifyAppUrl = `spotify:episode:${episodeId}`;
      } else if (pathname.includes('/track/')) {
        const trackId = pathname.split('/track/')[1]?.split('?')[0];
        spotifyAppUrl = `spotify:track:${trackId}`;
      } else if (pathname.includes('/show/')) {
        const showId = pathname.split('/show/')[1]?.split('?')[0];
        spotifyAppUrl = `spotify:show:${showId}`;
      } else {
        // Fallback to path conversion
        spotifyAppUrl = `spotify:${pathname.replace(/\//g, ':')}`;
      }
      
      console.log('Generated Spotify app URL:', spotifyAppUrl);
      
      // Use the most direct approach that bypasses popups
      try {
        // Method 1: Try direct window.location assignment (works on many mobile browsers)
        setTimeout(() => {
          window.location.assign(spotifyAppUrl);
        }, 10);
        
        console.log('Attempted direct location assignment to Spotify app');
        
      } catch (e) {
        console.log('Direct assignment failed, trying alternative:', e);
        
        // Method 2: Create and programmatically click a link
        try {
          const a = document.createElement('a');
          a.href = spotifyAppUrl;
          a.style.display = 'none';
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          
          // Add to DOM temporarily
          document.body.appendChild(a);
          
          // Simulate user click
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          
          a.dispatchEvent(clickEvent);
          
          // Clean up
          setTimeout(() => {
            if (document.body.contains(a)) {
              document.body.removeChild(a);
            }
          }, 100);
          
          console.log('Attempted programmatic click method');
          
        } catch (e2) {
          console.log('All methods failed:', e2);
        }
      }
      
      return;
    }
    
    // For all other URLs, just open in new tab
    console.log('Opening in new tab:', url);
    // Mark that we're navigating externally for non-app links too
    sessionStorage.setItem('external-nav', 'true');
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