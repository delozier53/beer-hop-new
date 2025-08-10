import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import Welcome from "@/pages/Welcome";
import Profile from "@/pages/Profile";
import Breweries from "@/pages/Breweries";
import BreweryDetail from "@/pages/BreweryDetail";
import Events from "@/pages/Events";
import Podcast from "@/pages/Podcast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 2 * 60 * 1000,
    },
  },
});

function AppRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hops flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Beer Hop...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Welcome />;
  }

  return (
    <div className="relative">
      <Switch>
        <Route path="/" component={Profile} />
        <Route path="/breweries" component={Breweries} />
        <Route path="/brewery/:id" component={BreweryDetail} />
        <Route path="/events" component={Events} />
        <Route path="/podcast" component={Podcast} />
        <Route>
          <div className="mobile-container">
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600">Page not found</p>
            </div>
          </div>
        </Route>
      </Switch>
      <BottomNavigation />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster />
    </QueryClientProvider>
  );
}