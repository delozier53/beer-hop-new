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

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

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
          <h1 className="text-xl font-bold">Check-in Leaderboard</h1>
          <div className="w-10"></div>
        </div>

        {/* Top 3 */}
        {topThree.length >= 3 && (
          <div className="flex justify-center items-end space-x-4 mb-6">
            {/* 2nd Place */}
            <div className="text-center">
              <img 
                src={topThree[1]?.profileImage || "https://images.unsplash.com/photo-1494790108755-2616b612b47c?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"} 
                alt="2nd place" 
                className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-gray-300 object-cover"
              />
              <div className="bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded-full font-semibold">2nd</div>
              <div className="text-sm font-medium mt-1">{topThree[1]?.name}</div>
              <div className="text-xs opacity-90">{topThree[1]?.checkins} check-ins</div>
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <img 
                src={topThree[0]?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"} 
                alt="1st place" 
                className="w-16 h-16 rounded-full mx-auto mb-2 border-4 border-yellow-300 object-cover"
              />
              <div className="bg-yellow-400 text-yellow-900 text-sm px-3 py-1 rounded-full font-bold">1st</div>
              <div className="text-base font-bold mt-1">{topThree[0]?.name}</div>
              <div className="text-sm opacity-90">{topThree[0]?.checkins} check-ins</div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <img 
                src={topThree[2]?.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"} 
                alt="3rd place" 
                className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-amber object-cover"
              />
              <div className="bg-amber text-white text-xs px-2 py-1 rounded-full font-semibold">3rd</div>
              <div className="text-sm font-medium mt-1">{topThree[2]?.name}</div>
              <div className="text-xs opacity-90">{topThree[2]?.checkins} check-ins</div>
            </div>
          </div>
        )}
      </div>

      {/* Rest of Leaderboard */}
      <div className="px-6 py-4">
        {remaining.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No additional rankings</p>
            <p className="text-sm">Start checking in to climb the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {remaining.map((user, index) => (
              <div key={user.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                  <span>{index + 4}</span>
                </div>
                <img 
                  src={user.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"} 
                  alt="User" 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{user.name}</h4>
                  <p className="text-sm text-gray-600">{user.location}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-amber">{user.checkins}</div>
                  <div className="text-xs text-gray-500">check-ins</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
