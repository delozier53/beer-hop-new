import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Edit, 
  MapPin, 
  Heart, 
  StickyNote, 
  Clock,
  Phone,
  Globe,
  Facebook,
  Instagram,
  Headphones,
  Save
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Brewery, User, CheckIn } from "@shared/schema";

const CURRENT_USER_ID = "joshuamdelozier";

export default function BreweryDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);

  const { data: brewery, isLoading } = useQuery<Brewery>({
    queryKey: ["/api/breweries", id],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users", CURRENT_USER_ID],
  });

  const checkInMutation = useMutation({
    mutationFn: async (breweryId: string) => {
      const response = await apiRequest("POST", "/api/checkins", {
        userId: CURRENT_USER_ID,
        breweryId,
        notes: null
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", CURRENT_USER_ID] });
      queryClient.invalidateQueries({ queryKey: ["/api/breweries"] });
      toast({
        title: "Check-in successful!",
        description: "Your brewery visit has been recorded.",
      });
    },
    onError: () => {
      toast({
        title: "Check-in failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });

  const favoriteMutation = useMutation({
    mutationFn: async (breweryId: string) => {
      const response = await apiRequest("PUT", `/api/users/${CURRENT_USER_ID}/favorites`, {
        breweryId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", CURRENT_USER_ID] });
      toast({
        title: "Favorites updated",
        description: "Your favorite breweries have been updated.",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="h-56 bg-gray-300 animate-pulse relative">
          <button 
            className="absolute top-4 left-4 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white"
            onClick={() => navigate("/breweries")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!brewery) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">Brewery not found</p>
        </div>
      </div>
    );
  }

  const isFavorite = user?.favoriteBreweries?.includes(brewery.id) || false;

  return (
    <div className="mobile-container pb-20">
      {/* Hero Banner */}
      <div 
        className="relative h-56 bg-cover bg-center"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${brewery.image || `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600`}')`
        }}
      >
        <button 
          className="absolute top-4 left-4 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white"
          onClick={() => navigate("/breweries")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        {/* Logo in banner */}
        <div className="absolute bottom-4 left-4">
          <img 
            src={brewery.logo || `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200`} 
            alt={`${brewery.name} logo`}
            className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-lg"
          />
        </div>

        {/* Removed podcast button from header */}
      </div>

      <div className="px-6 py-6">
        {/* Brewery Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{brewery.name}</h1>
            {/* Logo displayed in banner, removed circle image and craft brewery label */}
          </div>
          <button 
            className={`p-2 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
            onClick={() => favoriteMutation.mutate(brewery.id)}
            disabled={favoriteMutation.isPending}
          >
            <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button 
            className="bg-amber hover:bg-amber-dark text-white"
            onClick={() => checkInMutation.mutate(brewery.id)}
            disabled={checkInMutation.isPending}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {checkInMutation.isPending ? "Checking in..." : "Check In"}
          </Button>
          
          <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brown hover:bg-brown-light text-white">
                <StickyNote className="w-4 h-4 mr-2" />
                Take Notes
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Notes for {brewery.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Add your notes about this brewery..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-32"
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsNotesDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-hops hover:bg-hops-dark text-white"
                    onClick={() => {
                      toast({
                        title: "Notes saved",
                        description: "Your brewery notes have been saved.",
                      });
                      setIsNotesDialogOpen(false);
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Notes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Hours */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Hours
            </h3>
            <div className="text-sm text-gray-600 whitespace-pre-line">
              {brewery.hours || "Hours not available"}
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Address
          </h3>
          <p className="text-gray-600">
            {brewery.address}, {brewery.city}, {brewery.state} {brewery.zipCode}
          </p>
          <Button variant="ghost" className="text-amber text-sm font-medium mt-1 p-0">
            Get Directions
          </Button>
        </div>

        {/* Phone Number */}
        {brewery.phone && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2 flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              Phone
            </h3>
            <p className="text-gray-600">{brewery.phone}</p>
          </div>
        )}

        {/* Removed About section as requested */}

        {/* Policies */}
        {brewery.policies && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Policies & Amenities</h3>
            <div className="text-sm text-gray-600 whitespace-pre-line">
              {brewery.policies}
            </div>
          </div>
        )}

        {/* Social Links - Circular Buttons */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Connect</h3>
          <div className="flex space-x-4">
            {brewery.socialLinks.website && (
              <a 
                href={brewery.socialLinks.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-hops hover:bg-hops-dark text-white flex items-center justify-center transition-colors"
              >
                <Globe className="w-6 h-6" />
              </a>
            )}
            {brewery.socialLinks.facebook && (
              <a 
                href={brewery.socialLinks.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
              >
                <Facebook className="w-6 h-6" />
              </a>
            )}
            {brewery.socialLinks.instagram && (
              <a 
                href={brewery.socialLinks.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center transition-colors"
              >
                <Instagram className="w-6 h-6" />
              </a>
            )}
            {brewery.socialLinks.x && (
              <a 
                href={brewery.socialLinks.x} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center transition-colors"
              >
                <span className="font-bold text-lg">𝕏</span>
              </a>
            )}
            {brewery.socialLinks.tiktok && (
              <a 
                href={brewery.socialLinks.tiktok} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-colors"
              >
                <span className="font-bold text-sm">TT</span>
              </a>
            )}
            {brewery.socialLinks.threads && (
              <a 
                href={brewery.socialLinks.threads} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center transition-colors"
              >
                <span className="font-bold text-sm">@</span>
              </a>
            )}
          </div>
        </div>

        {/* Photo Gallery */}
        {brewery.photos.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Photos</h3>
            <div className="flex space-x-3 overflow-x-auto pb-3">
              {brewery.photos.map((photo, index) => (
                <img 
                  key={index}
                  src={photo} 
                  alt={`${brewery.name} photo ${index + 1}`}
                  className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        {/* Podcast Episode */}
        {brewery.podcastEpisode && brewery.podcastUrl && (
          <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Headphones className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Beer Hop Podcast</h3>
                  <p className="text-sm opacity-90">{brewery.podcastEpisode}</p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-none"
                  onClick={() => window.open(brewery.podcastUrl!, '_blank')}
                >
                  Listen on Spotify
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
