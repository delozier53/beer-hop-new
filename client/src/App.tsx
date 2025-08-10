import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { LocationPermissionDialog } from "@/components/LocationPermissionDialog";
import { BackButton } from "@/components/BackButton";
import Welcome from "@/pages/welcome";
import Profile from "@/pages/profile";
import Breweries from "@/pages/breweries";
import BreweryDetail from "@/pages/brewery-detail";
import Podcast from "@/pages/podcast";
import Events from "@/pages/events";
import EventDetail from "@/pages/event-detail";
import SpecialEventDetail from "@/pages/special-event-detail";
import WeeklyEventsDay from "@/pages/weekly-events-day";
import Leaderboard from "@/pages/leaderboard";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  console.log('Router state:', { isAuthenticated, isLoading, user });

  // Show location permission dialog after user authenticates
  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      // Check if we've already asked for permission for this specific user
      const hasAskedForLocation = localStorage.getItem(`location-permission-asked-${user.id}`);
      if (!hasAskedForLocation) {
        // Delay showing the dialog slightly to let the user see they've logged in
        const timer = setTimeout(() => {
          setShowLocationDialog(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Show Terms and Privacy pages even when not authenticated
  return (
    <div className="relative">
      <BackButton />
      <Switch>
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        {!isAuthenticated ? (
          <Route path="*" component={Welcome} />
        ) : (
          <>
            <Route path="/" component={Profile} />
            <Route path="/breweries" component={Breweries} />
            <Route path="/brewery/:id" component={BreweryDetail} />
            <Route path="/podcast" component={Podcast} />
            <Route path="/events" component={Events} />
            <Route path="/event/:id" component={EventDetail} />
            <Route path="/special-event/:id" component={SpecialEventDetail} />
            <Route path="/weekly-events/:day" component={WeeklyEventsDay} />
            <Route path="/leaderboard" component={Leaderboard} />
            <Route component={NotFound} />
          </>
        )}
      </Switch>
      {isAuthenticated && <BottomNavigation />}
      
      {/* Location Permission Dialog */}
      {user && (
        <LocationPermissionDialog 
          open={showLocationDialog}
          onOpenChange={(open) => {
            setShowLocationDialog(open);
            // Mark that we've asked for permission when dialog is closed
            if (!open) {
              localStorage.setItem(`location-permission-asked-${user.id}`, 'true');
            }
          }}
          onPermissionGranted={() => {
            localStorage.setItem(`location-permission-asked-${user.id}`, 'true');
          }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
