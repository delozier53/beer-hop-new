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
    // Check if we're returning from external navigation on page load
    const checkExternalNavigation = () => {
      const wasExternalNavigation = sessionStorage.getItem('external-nav');
      if (wasExternalNavigation) {
        setShowBackButton(true);
        // Auto-hide after 15 seconds for website links
        setTimeout(() => {
          setShowBackButton(false);
          sessionStorage.removeItem('external-nav');
          sessionStorage.removeItem('return-url');
        }, 15000);
      }
    };

    // Check immediately when component mounts
    checkExternalNavigation();

    // Also check when user returns from external app (for app links)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkExternalNavigation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
      // Navigate back to the main app screen
      setLocation('/');
    }
  };

  if (!showBackButton) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm shadow-md hover:bg-white border border-gray-200 ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Beer Hop
    </Button>
  );
}