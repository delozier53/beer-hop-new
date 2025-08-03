import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Medal, Trophy, Heart, MapPin } from "lucide-react";
import { Link } from "wouter";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import type { User, Badge, Brewery } from "@shared/schema";

const CURRENT_USER_ID = "joshuamdelozier";

export default function Profile() {
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users", CURRENT_USER_ID],
  });

  const { data: badge } = useQuery<Badge>({
    queryKey: ["/api/users", CURRENT_USER_ID, "badge"],
  });

  const { data: allBreweries = [] } = useQuery<Brewery[]>({
    queryKey: ["/api/breweries"],
  });

  const favoriteBreweries = allBreweries.filter(brewery => 
    user?.favoriteBreweries?.includes(brewery.id)
  );

  const leaderboardRank = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
  }).data?.findIndex(u => u.id === CURRENT_USER_ID) || 0;

  if (userLoading) {
    return (
      <div className="mobile-container">
        <div className="hero-banner from-amber to-hops">
          <div className="hero-overlay" />
        </div>
        <div className="px-6 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-20 bg-gray-300 rounded-full"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Hero Banner */}
      <div 
        className="hero-banner from-amber to-hops"
        style={{
          backgroundImage: `linear-gradient(rgba(245, 158, 11, 0.8), rgba(128, 188, 4, 0.8)), url('https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400')`
        }}
      >
        <div className="hero-overlay" />
      </div>

      {/* Profile Content */}
      <div className="px-6 -mt-16 relative z-10 pb-20">
        {/* Profile Photo & Info */}
        <div className="flex items-end space-x-4 mb-4">
          <img 
            src={user.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
            alt="Profile" 
            className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
          />
          <div className="flex-1 pb-2">
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
          </div>
        </div>

        {/* Stats Cards */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-hops">{user.checkins}</div>
                <div className="text-xs text-gray-600">Check-ins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent-pink">{user.favoriteBreweries?.length || 0}</div>
                <div className="text-xs text-gray-600">Favorites</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-hops">#{leaderboardRank + 1}</div>
                <div className="text-xs text-gray-600">Rank</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Badge */}
        {badge && (
          <div className="bg-gradient-to-r from-hops to-hops-dark rounded-xl p-4 mb-4 text-white">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                {badge.icon.startsWith('http') ? (
                  <img 
                    src={badge.icon} 
                    alt={badge.name}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      console.log('Badge image failed to load:', badge.icon);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `<span class="text-2xl">🏆</span>`;
                    }}
                  />
                ) : (
                  <span className="text-2xl">{badge.icon}</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold">{badge.name}</h3>
                <p className="text-sm opacity-90">{badge.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Button */}
        <Link href="/leaderboard">
          <Button className="w-full bg-hops hover:bg-hops-dark text-white mb-4">
            <Trophy className="w-4 h-4 mr-2" />
            View Leaderboard
          </Button>
        </Link>

        {/* Favorite Breweries */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Favorite Breweries</h3>
            <EditProfileDialog user={user} userId={CURRENT_USER_ID} />
          </div>

          {favoriteBreweries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No favorite breweries yet</p>
              <p className="text-sm">Explore breweries to add favorites</p>
            </div>
          ) : (
            <div className="space-y-3">
              {favoriteBreweries.map((brewery) => (
                <Link key={brewery.id} href={`/brewery/${brewery.id}`}>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <img 
                      src={brewery.image} 
                      alt={brewery.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{brewery.name}</h4>
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {brewery.city}, {brewery.state}
                      </p>
                    </div>
                    <Heart className="w-5 h-5 text-red-500" fill="currentColor" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
