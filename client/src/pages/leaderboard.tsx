import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

export default function Leaderboard() {
  const [, navigate] = useLocation();

  const { data: leaderboard = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
  });

  // Badge categories based on check-in counts
  const getBadgeCategory = (checkins: number) => {
    if (checkins >= 1000) return { name: "Black Hop", color: "bg-black" };
    if (checkins >= 500) return { name: "Purple Hop", color: "bg-purple-600" };
    if (checkins >= 250) return { name: "Blue Hop", color: "bg-blue-600" };
    if (checkins >= 100) return { name: "Green Hop", color: "bg-green-600" };
    if (checkins >= 50) return { name: "Red Hop", color: "bg-red-600" };
    if (checkins >= 25) return { name: "Teal Hop", color: "bg-teal-600" };
    if (checkins >= 10) return { name: "Orange Hop", color: "bg-orange-600" };
    if (checkins >= 5) return { name: "Yellow Hop", color: "bg-yellow-600" };
    return { name: "White Hop", color: "bg-gray-300" };
  };

  // Filter users with at least 10 check-ins and group by badge category
  const groupedUsers = leaderboard
    .filter(user => user.checkins >= 10)
    .reduce((groups, user) => {
      const badge = getBadgeCategory(user.checkins);
      if (!groups[badge.name]) {
        groups[badge.name] = { badge, users: [] };
      }
      groups[badge.name].users.push(user);
      return groups;
    }, {} as Record<string, { badge: { name: string; color: string }; users: User[] }>);

  // Order of badges (highest to lowest)
  const badgeOrder = ["Black Hop", "Purple Hop", "Blue Hop", "Green Hop", "Red Hop", "Teal Hop", "Orange Hop", "Yellow Hop", "White Hop"];

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="bg-gradient-to-r from-amber to-hops p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <button 
              className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Check-in Leaderboard</h1>
            <div className="w-10"></div>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-white/20 rounded"></div>
            <div className="h-16 bg-white/20 rounded"></div>
            <div className="h-16 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container pb-20">
      <div className="bg-gradient-to-r from-amber to-hops p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <button 
            className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-black">Leaderboard</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Screen Title */}
      <div className="px-6 py-4 bg-white border-b">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Badge Rankings</h2>
        <p className="text-center text-gray-600 text-sm mt-1">Users with at least 10 check-ins</p>
      </div>

      {/* All Users */}
      <div className="px-6 py-4">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No rankings available</p>
            <p className="text-sm">Start checking in to appear on the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {badgeOrder.map((badgeName) => {
              const group = groupedUsers[badgeName];
              if (!group || group.users.length === 0) return null;
              
              return (
                <div key={badgeName}>
                  {/* Badge Heading */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${group.badge.color}`}></div>
                    <h3 className="text-lg font-bold text-gray-800">{badgeName}</h3>
                  </div>
                  
                  {/* Users in this badge category */}
                  <div className="space-y-3 ml-5">
                    {group.users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <img 
                          src={user.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"} 
                          alt="User" 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-hops font-medium">{user.checkins} check-ins</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
