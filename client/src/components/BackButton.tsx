import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

interface BackButtonProps {
  className?: string;
}

export function BackButton({ className = "" }: BackButtonProps) {
  const [, setLocation] = useLocation();
  const [showBackButton, setShowBackButton] = useState(false);

  useEffect(() => {
    // Check if we should show the Facebook-style back button
    const checkBackButtonVisibility = () => {
      // Show if we're on an external site (not our Beer Hop app)
      const currentDomain = window.location.hostname;
      const isExternalSite = !currentDomain.includes('replit.app') && 
                            !currentDomain.includes('localhost') && 
                            currentDomain !== '127.0.0.1' &&
                            !currentDomain.includes('replit.dev');
      
      // Also check if we have the external navigation flag (for when returning to app)
      const wasExternalNavigation = sessionStorage.getItem('external-nav');
      
      if (isExternalSite || wasExternalNavigation) {
        setShowBackButton(true);
        
        // Only auto-hide if we're back in the app (not on external site)
        if (!isExternalSite && wasExternalNavigation) {
          setTimeout(() => {
            setShowBackButton(false);
            sessionStorage.removeItem('external-nav');
            sessionStorage.removeItem('return-url');
          }, 15000);
        }
      }
    };

    // Check immediately when component mounts
    checkBackButtonVisibility();

    // Check when user returns from external navigation
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkBackButtonVisibility();
      }
    };

    // Check when page loads (for external sites)
    const handlePageLoad = () => {
      checkBackButtonVisibility();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('load', handlePageLoad);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('load', handlePageLoad);
    };
  }, []);

  const handleBack = () => {
    // Clear the external navigation flag
    sessionStorage.removeItem('external-nav');
    setShowBackButton(false);
    
    // Check if we have a return URL saved
    const returnUrl = sessionStorage.getItem('return-url');
    if (returnUrl) {
      sessionStorage.removeItem('return-url');
      window.location.href = returnUrl;
    } else {
      // Try to go back in browser history first
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // Navigate back to the main app screen as fallback
        const origin = window.location.origin;
        window.location.href = origin;
      }
    }
  };

  if (!showBackButton) return null;

  return (
    <div className={`fixed top-4 left-4 z-50 ${className}`}>
      <button
        onClick={handleBack}
        className="flex items-center space-x-2 bg-black/80 hover:bg-black rounded-full px-3 py-2 text-white shadow-lg backdrop-blur-sm transition-colors"
        aria-label="Back to Beer Hop"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Beer Hop OK</span>
      </button>
    </div>
  );
}