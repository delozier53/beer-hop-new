import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  const { isAuthenticated, isLoading } = useAuth();

function AppRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hops flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading Beer Hop...</p>
        </div>
      </div>
    );
  }

      <BottomNavigation />
          </div>
        </Route>
}
});

export default App;
      <Router />
      <Toaster />