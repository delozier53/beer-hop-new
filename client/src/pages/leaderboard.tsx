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
          <div className="space-y-3">
            {leaderboard.map((user) => (
              <div key={user.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <img 
                  src={user.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"} 
                  alt="User" 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{user.name}</h4>
                  <p className="text-sm text-gray-600">{user.checkins} check-ins</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
