import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trophy, Medal, Award, Info, Edit } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { User } from "@shared/schema";
import badgesHeaderImage from "@assets/Badges_Header_1754356120920.jpg";

export default function Leaderboard() {
  const [, navigate] = useLocation();
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [isHeaderDialogOpen, setIsHeaderDialogOpen] = useState(false);
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leaderboard = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/joshuamdelozier"],
  });

  const { data: globalSettings } = useQuery({
    queryKey: ["/api/global-settings"],
  });

  // Check if user is master admin
  const isMasterAdmin = (currentUser as any)?.email === 'joshuamdelozier@gmail.com';

  // Get the current header image (fallback to default)
  const getHeaderImage = () => {
    if ((globalSettings as any)?.leaderboardHeaderImage) {
      return getImageUrl((globalSettings as any).leaderboardHeaderImage);
    }
    return badgesHeaderImage;
  };

  // Helper function to get image URL
  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('/objects/')) {
      return imagePath;
    }
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return imagePath;
  };

  // Update header image mutation
  const updateHeaderMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const response = await fetch('/api/global-settings/leaderboard-header', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headerImage: imageUrl }),
      });
      if (!response.ok) throw new Error('Failed to update header');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/global-settings"] });
      setIsHeaderDialogOpen(false);
      setHeaderImageUrl("");
      toast({
        title: "Success",
        description: "Header image updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update header image. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Badge categories based on check-in counts
  const getBadgeCategory = (checkins: number) => {
    if (checkins >= 1000) return { 
      name: "Black Hop", 
      color: "bg-black",
      imageUrl: "https://drive.google.com/uc?export=view&id=1bSj-B1ibssWVtF5dQqg-YY6WC6o8pzAg"
    };
    if (checkins >= 500) return { 
      name: "Purple Hop", 
      color: "bg-purple-600",
      imageUrl: "https://drive.google.com/uc?export=view&id=1nMdikJsgYjo6b1Sr3lAuC1cEowY4_Vo_"
    };
    if (checkins >= 250) return { 
      name: "Blue Hop", 
      color: "bg-blue-600",
      imageUrl: "https://drive.google.com/uc?export=view&id=15o8od8fae21jFNV7qvnRZs3P-AbEh9NM"
    };
    if (checkins >= 100) return { 
      name: "Green Hop", 
      color: "bg-green-600",
      imageUrl: "https://drive.google.com/uc?export=view&id=1b2AjcN0R4xB9nkATKEbzo-TbRtHuzzEo"
    };
    if (checkins >= 50) return { 
      name: "Red Hop", 
      color: "bg-red-600",
      imageUrl: "https://drive.google.com/uc?export=view&id=1lA6fv9IZ1YiijjqvnXOA7LEm0Lo7txmu"
    };
    if (checkins >= 25) return { 
      name: "Teal Hop", 
      color: "bg-teal-600",
      imageUrl: "https://drive.google.com/uc?export=view&id=1LPeFXncm_Rm8PzAokS2jHYZTjewsbgVm"
    };
    if (checkins >= 10) return { 
      name: "Orange Hop", 
      color: "bg-orange-600",
      imageUrl: "https://drive.google.com/uc?export=view&id=1qpH3CCjfX5aA-mf4fXxXf5lkdX-EaX8w"
    };
    if (checkins >= 5) return { 
      name: "Yellow Hop", 
      color: "bg-yellow-600",
      imageUrl: "https://drive.google.com/uc?export=view&id=13BoUnHyAkZQznyJ1iZuqWWLDb1tx8sOJ"
    };
    return { 
      name: "White Hop", 
      color: "bg-gray-300",
      imageUrl: "https://drive.google.com/uc?export=view&id=12o9X89jmW3BC6vqV4J4BrLaKKDNBjRQS"
    };
  };

  // Filter users with at least 100 check-ins and group by badge category
  const groupedUsers = leaderboard
    .filter(user => user.checkins >= 100)
    .reduce((groups, user) => {
      const badge = getBadgeCategory(user.checkins);
      if (!groups[badge.name]) {
        groups[badge.name] = { badge, users: [] };
      }
      groups[badge.name].users.push(user);
      return groups;
    }, {} as Record<string, { badge: { name: string; color: string; imageUrl: string }; users: User[] }>);

  // Order of badges (highest to lowest)
  const badgeOrder = ["Black Hop", "Purple Hop", "Blue Hop", "Green Hop", "Red Hop", "Teal Hop", "Orange Hop", "Yellow Hop", "White Hop"];

  // All badge information for the popup with actual badge images
  const allBadges = [
    { 
      name: "Black Hop", 
      color: "bg-black", 
      minCheckins: 1000,
      imageUrl: "https://drive.google.com/uc?export=view&id=1bSj-B1ibssWVtF5dQqg-YY6WC6o8pzAg"
    },
    { 
      name: "Purple Hop", 
      color: "bg-purple-600", 
      minCheckins: 500,
      imageUrl: "https://drive.google.com/uc?export=view&id=1nMdikJsgYjo6b1Sr3lAuC1cEowY4_Vo_"
    },
    { 
      name: "Blue Hop", 
      color: "bg-blue-600", 
      minCheckins: 250,
      imageUrl: "https://drive.google.com/uc?export=view&id=15o8od8fae21jFNV7qvnRZs3P-AbEh9NM"
    },
    { 
      name: "Green Hop", 
      color: "bg-green-600", 
      minCheckins: 100,
      imageUrl: "https://drive.google.com/uc?export=view&id=1b2AjcN0R4xB9nkATKEbzo-TbRtHuzzEo"
    },
    { 
      name: "Red Hop", 
      color: "bg-red-600", 
      minCheckins: 50,
      imageUrl: "https://drive.google.com/uc?export=view&id=1lA6fv9IZ1YiijjqvnXOA7LEm0Lo7txmu"
    },
    { 
      name: "Teal Hop", 
      color: "bg-teal-600", 
      minCheckins: 25,
      imageUrl: "https://drive.google.com/uc?export=view&id=1LPeFXncm_Rm8PzAokS2jHYZTjewsbgVm"
    },
    { 
      name: "Orange Hop", 
      color: "bg-orange-600", 
      minCheckins: 10,
      imageUrl: "https://drive.google.com/uc?export=view&id=1qpH3CCjfX5aA-mf4fXxXf5lkdX-EaX8w"
    },
    { 
      name: "Yellow Hop", 
      color: "bg-yellow-600", 
      minCheckins: 5,
      imageUrl: "https://drive.google.com/uc?export=view&id=13BoUnHyAkZQznyJ1iZuqWWLDb1tx8sOJ"
    },
    { 
      name: "White Hop", 
      color: "bg-gray-300", 
      minCheckins: 0,
      imageUrl: "https://drive.google.com/uc?export=view&id=12o9X89jmW3BC6vqV4J4BrLaKKDNBjRQS"
    }
  ];

  if (isLoading) {
    return (
      <div className="mobile-container">
        {/* Back Button - At the very top */}
        <div className="absolute top-4 left-4 z-30">
          <button 
            className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white shadow-lg"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Badges Header Image */}
        <div className="bg-white relative">
          <img 
            src={getHeaderImage()} 
            alt="Badges Header"
            className="w-full h-auto"
          />
          {isMasterAdmin && (
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 bg-black/50 text-white border-white/50 hover:bg-white hover:text-black"
              onClick={() => {
                setHeaderImageUrl((globalSettings as any)?.leaderboardHeaderImage || "");
                setIsHeaderDialogOpen(true);
              }}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit Header
            </Button>
          )}
        </div>

        <div className="px-6 py-4 bg-white border-b">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Leaderboard</h2>
          <p className="text-center text-gray-600 text-sm mt-1">Users with at least 100 check-ins</p>
        </div>

        <div className="px-6 py-4">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container pb-20">
      {/* Back Button - At the very top */}
      <div className="absolute top-4 left-4 z-30">
        <button 
          className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white shadow-lg"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Badges Header Image */}
      <div className="bg-white relative">
        <img 
          src={getHeaderImage()} 
          alt="Badges Header"
          className="w-full h-auto"
        />
        {isMasterAdmin && (
          <Button
            size="sm"
            variant="outline"
            className="absolute top-2 right-2 bg-black/50 text-white border-white/50 hover:bg-white hover:text-black"
            onClick={() => {
              setHeaderImageUrl((globalSettings as any)?.leaderboardHeaderImage || "");
              setIsHeaderDialogOpen(true);
            }}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit Header
          </Button>
        )}
      </div>

      {/* Screen Title */}
      <div className="px-6 py-4 bg-white border-b">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Leaderboard</h2>
        <p className="text-center text-gray-600 text-sm mt-1">Users with at least 100 check-ins</p>
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
            {/* See All Badges Button */}
            <div className="flex justify-center mb-6">
              <Dialog open={showAllBadges} onOpenChange={setShowAllBadges}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-hops hover:bg-hops/90 text-white">
                    <Info className="w-4 h-4" />
                    See All Badges
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>All Badge Levels</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {allBadges.map((badge) => (
                      <div key={badge.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <img 
                            src={badge.imageUrl} 
                            alt={badge.name}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              // Fallback to colored circle if image fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.className = `w-4 h-4 rounded-full ${badge.color}`;
                              (e.target as HTMLImageElement).parentNode?.appendChild(fallback);
                            }}
                          />
                          <span className="font-medium">{badge.name}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {badge.minCheckins === 0 ? "0+" : `${badge.minCheckins}+`} check-ins
                        </span>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

      {/* Header Editor Dialog */}
      <Dialog open={isHeaderDialogOpen} onOpenChange={setIsHeaderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Leaderboard Header</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="header-image">Header Image</Label>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760}
                onGetUploadParameters={async () => {
                  const response = await fetch('/api/objects/upload', {
                    method: 'POST',
                  });
                  const data = await response.json();
                  return {
                    method: 'PUT' as const,
                    url: data.uploadURL,
                  };
                }}
                onComplete={(result) => {
                  if (result.successful && result.successful.length > 0) {
                    const uploadURL = result.successful[0]?.uploadURL;
                    if (uploadURL) {
                      fetch('/api/objects/normalize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: uploadURL }),
                      })
                      .then(res => res.json())
                      .then(data => {
                        setHeaderImageUrl(data.objectPath);
                      });
                    }
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <span>📁</span>
                  <span>Upload Header Image</span>
                </div>
              </ObjectUploader>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsHeaderDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (headerImageUrl.trim()) {
                    updateHeaderMutation.mutate(headerImageUrl.trim());
                  }
                }}
                disabled={!headerImageUrl.trim() || updateHeaderMutation.isPending}
              >
                {updateHeaderMutation.isPending ? "Updating..." : "Update Header"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

            {badgeOrder.map((badgeName) => {
              const group = groupedUsers[badgeName];
              if (!group || group.users.length === 0) return null;
              
              return (
                <div key={badgeName}>
                  {/* Badge Heading */}
                  <div className="flex items-center space-x-2 mb-3">
                    <img 
                      src={group.badge.imageUrl} 
                      alt={badgeName}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        // Fallback to colored circle if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = `w-3 h-3 rounded-full ${group.badge.color}`;
                        (e.target as HTMLImageElement).parentNode?.appendChild(fallback);
                      }}
                    />
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
