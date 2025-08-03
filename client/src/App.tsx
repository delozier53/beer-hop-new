import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNavigation } from "@/components/bottom-navigation";
import Profile from "@/pages/profile";
import Breweries from "@/pages/breweries";
import BreweryDetail from "@/pages/brewery-detail";
import Podcast from "@/pages/podcast";
import Events from "@/pages/events";
import EventDetail from "@/pages/event-detail";
import SpecialEventDetail from "@/pages/special-event-detail";
import Leaderboard from "@/pages/leaderboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="relative">
      <Switch>
        <Route path="/" component={Profile} />
        <Route path="/breweries" component={Breweries} />
        <Route path="/brewery/:id" component={BreweryDetail} />
        <Route path="/podcast" component={Podcast} />
        <Route path="/events" component={Events} />
        <Route path="/event/:id" component={EventDetail} />
        <Route path="/special-event/:id" component={SpecialEventDetail} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route component={NotFound} />
      </Switch>
      <BottomNavigation />
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
