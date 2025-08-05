import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { convertGoogleDriveImageUrl } from "@/lib/imageUtils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ObjectUploader } from "@/components/ObjectUploader";
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
  Save,
  Upload,
  Plus
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { openSmartLink } from "@/lib/linkHandler";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import type { Brewery, User, CheckIn } from "@shared/schema";
import defaultBannerImage from "../assets/default-brewery-banner.jpg";



// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
}

// Get user's current location
function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location access is required for check-ins. Please use a browser that supports location services.'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve, 
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Please allow location access in your browser settings to check in at breweries.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Unable to determine your location. Please check your device\'s location settings.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'));
            break;
          default:
            reject(new Error('Unable to access your location. Please ensure location services are enabled.'));
            break;
        }
      }, 
      {
        enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    });
  });
}

export default function BreweryDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [notes, setNotes] = useState("");
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerLinkUrl, setBannerLinkUrl] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    hours: "",
    policies: "",
    image: "",
    logo: "",
    website: "",
    facebook: "",
    instagram: "",
    x: "",
    threads: "",
    tiktok: "",
    tapListUrl: ""
  });

  const { data: brewery, isLoading } = useQuery<Brewery>({
    queryKey: ["/api/breweries", id],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users", currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Check if user can check in at this brewery
  const { data: canCheckInData } = useQuery<{ canCheckIn: boolean; timeRemaining?: number }>({
    queryKey: ["/api/checkins/can-checkin", currentUser?.id, id],
    enabled: !!id && !!currentUser?.id,
    refetchInterval: 60000, // Refetch every minute to update countdown
  });

  const checkInMutation = useMutation({
    mutationFn: async (breweryId: string) => {
      const response = await apiRequest("/api/checkins", "POST", {
        userId: currentUser?.id,
        breweryId,
        notes: null
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/breweries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checkins/can-checkin", currentUser?.id, id] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] }); // Update leaderboard
      toast({
        title: "Check-in successful!",
        description: "Your brewery visit has been recorded.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      if (errorMessage.includes("Check-in cooldown active")) {
        // Extract friendly time remaining from error
        const match = errorMessage.match(/(\d+h \d+m|\d+m)/);
        const timeRemaining = match ? match[0] : "24 hours";
        toast({
          title: "Check-in cooldown active",
          description: `Please wait ${timeRemaining} before checking in again at this brewery.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check-in failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const favoriteMutation = useMutation({
    mutationFn: async (breweryId: string) => {
      const response = await apiRequest(`/api/users/${currentUser?.id}/favorites`, "PUT", {
        breweryId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id] });
      toast({
        title: "Favorites updated",
        description: "Your favorite breweries have been updated.",
      });
    }
  });

  const updateBreweryMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest(`/api/breweries/${id}`, "PUT", {
        ...updates,
        socialLinks: {
          website: updates.website || null,
          facebook: updates.facebook || null,
          instagram: updates.instagram || null,
          x: updates.x || null,
          threads: updates.threads || null,
          tiktok: updates.tiktok || null
        }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Brewery updated!",
        description: "Brewery information has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/breweries", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/breweries"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update brewery. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Helper function to get banner image (default or custom)
  const getBannerImage = (brewery: Brewery): string => {
    if (brewery.bannerImage) {
      // If it's a custom uploaded image (object storage path)
      if (brewery.bannerImage.startsWith('/objects/')) {
        return brewery.bannerImage;
      }
      // If it's the default asset path
      if (brewery.bannerImage.startsWith('/assets/')) {
        return defaultBannerImage;
      }
      return brewery.bannerImage;
    }
    // Default banner
    return defaultBannerImage;
  };

  // Banner image upload handlers
  const handleBannerImageUpload = async () => {
    try {
      const response = await fetch("/api/objects/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload URL:", error);
      throw error;
    }
  };

  const handleBannerImageUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      
      try {
        // First normalize the URL
        const normalizeResponse = await fetch("/api/objects/normalize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: uploadURL }),
        });
        
        let finalImagePath = uploadURL || "";
        if (normalizeResponse.ok) {
          const normalizeData = await normalizeResponse.json();
          finalImagePath = normalizeData.objectPath || uploadURL || "";
        }
        
        setBannerImageUrl(finalImagePath);
        
        toast({
          title: "Success",
          description: "Banner image uploaded successfully! Don't forget to add a link URL and save.",
        });
      } catch (error) {
        console.error("Error uploading banner image:", error);
        toast({
          title: "Error",
          description: "Failed to upload banner image. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Banner save mutation
  const saveBannerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/breweries/${id}/banner`, "PUT", {
        bannerImageUrl,
        bannerLinkUrl,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Brewery banner updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/breweries", id] });
      setIsBannerDialogOpen(false);
      setBannerImageUrl("");
      setBannerLinkUrl("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update banner. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get user location on component mount
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const position = await getCurrentPosition();
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError(null);
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationError(error instanceof Error ? error.message : 'Unable to get location');
      }
    };

    getUserLocation();
  }, []);

  // Function to retry location access
  const retryLocationAccess = async () => {
    try {
      const position = await getCurrentPosition();
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setLocationError(null);
      toast({
        title: "Location access granted!",
        description: "You can now check in at breweries.",
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError(error instanceof Error ? error.message : 'Unable to get location');
    }
  };

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
        

      </div>

      {/* Brewery Logo - Overlapping position like profile photo */}
      {brewery.logo && (
        <div className="relative -mt-12 mb-3 flex justify-center">
          <img 
            src={convertGoogleDriveImageUrl(brewery.logo)} 
            alt={`${brewery.name} logo`}
            className="w-24 h-24 rounded-lg object-cover border-4 border-white shadow-lg bg-white"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="px-6 py-3">
        {/* Brewery Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{brewery.name}</h1>
            {/* Logo displayed in banner, removed circle image and craft brewery label */}
          </div>
          <div className="flex items-center space-x-2">
            {/* Edit Button - Only visible for master admin (joshuamdelozier@gmail.com) and brewery owners */}
            {(currentUser?.email === 'joshuamdelozier@gmail.com' || user?.id === brewery.ownerId) && (
              <Button
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-800"
                onClick={() => {
                  if (brewery) {
                    setEditFormData({
                      name: brewery.name,
                      address: brewery.address,
                      city: brewery.city,
                      state: brewery.state,
                      zipCode: brewery.zipCode,
                      phone: brewery.phone || "",
                      hours: brewery.hours || "",
                      policies: brewery.policies || "",
                      image: brewery.image || "",
                      logo: brewery.logo || "",
                      website: brewery.socialLinks?.website || "",
                      facebook: brewery.socialLinks?.facebook || "",
                      instagram: brewery.socialLinks?.instagram || "",
                      x: brewery.socialLinks?.x || "",
                      threads: brewery.socialLinks?.threads || "",
                      tiktok: brewery.socialLinks?.tiktok || "",
                      tapListUrl: brewery.tapListUrl || ""
                    });
                    setIsEditDialogOpen(true);
                  }
                }}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
            <button 
              className={`p-2 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
              onClick={() => favoriteMutation.mutate(brewery.id)}
              disabled={favoriteMutation.isPending}
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Brewery Banner - 500x100 positioned between name and check-in button */}
        {brewery.bannerImage || brewery.bannerLink ? (
          <div className="mb-6 relative">
            <div 
              className="w-full cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              style={{ 
                aspectRatio: '5/1', // 500x100 aspect ratio
                maxHeight: '100px'
              }}
              onClick={() => {
                if (brewery.bannerLink) {
                  openSmartLink(brewery.bannerLink);
                }
              }}
            >
              <img 
                src={getBannerImage(brewery)} 
                alt="Brewery Banner"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback to default banner
                  e.currentTarget.src = defaultBannerImage;
                }}
              />
            </div>
            {currentUser?.email === 'joshuamdelozier@gmail.com' && (
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 bg-black/50 text-white border-white/50 hover:bg-white hover:text-black"
                onClick={(e) => {
                  e.stopPropagation();
                  // Pre-populate with current values
                  setBannerImageUrl(brewery.bannerImage || "");
                  setBannerLinkUrl(brewery.bannerLink || "");
                  setIsBannerDialogOpen(true);
                }}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit Banner
              </Button>
            )}
          </div>
        ) : currentUser?.email === 'joshuamdelozier@gmail.com' ? (
          <div className="mb-6">
            <div 
              className="w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow flex items-center justify-center cursor-pointer"
              style={{ 
                aspectRatio: '5/1',
                maxHeight: '100px'
              }}
              onClick={() => {
                setBannerImageUrl("");
                setBannerLinkUrl("");
                setIsBannerDialogOpen(true);
              }}
            >
              <div className="text-center text-gray-500">
                <Plus className="w-6 h-6 mx-auto mb-1" />
                <p className="text-sm">Add Banner Ad</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Banner Editor Dialog */}
        <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit {brewery.name} Banner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="banner-image">Banner Image (500x100 recommended)</Label>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760}
                  onGetUploadParameters={handleBannerImageUpload}
                  onComplete={handleBannerImageUploadComplete}
                  buttonClassName="w-full mt-2"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Banner Image
                </ObjectUploader>
              </div>
              <div>
                <Label htmlFor="banner-link">Banner Link URL</Label>
                <Input
                  id="banner-link"
                  type="url"
                  placeholder="https://example.com"
                  value={bannerLinkUrl}
                  onChange={(e) => setBannerLinkUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              {bannerImageUrl && bannerLinkUrl && (
                <Button
                  onClick={() => saveBannerMutation.mutate()}
                  disabled={saveBannerMutation.isPending}
                  className="w-full"
                >
                  {saveBannerMutation.isPending ? "Saving..." : "Save Banner"}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Location Error Warning */}
        {locationError && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 mb-2">{locationError}</p>
                <Button 
                  size="sm"
                  onClick={retryLocationAccess}
                  className="bg-[#80bc04] hover:bg-[#80bc04]/90 text-white"
                >
                  Enable Location Access
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 space-y-3">
          {/* Check In Button - Full Width */}
          <Button 
            className={`w-full text-white ${
              canCheckInData?.canCheckIn === false 
                ? "bg-gray-400 hover:bg-gray-500 cursor-not-allowed" 
                : "bg-green-600 hover:bg-green-700"
            }`}
            onClick={() => {
              if (canCheckInData?.canCheckIn === false) {
                const hours = Math.floor((canCheckInData.timeRemaining || 0) / 3600);
                const minutes = Math.floor(((canCheckInData.timeRemaining || 0) % 3600) / 60);
                const timeRemaining = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                toast({
                  description: `Please wait ${timeRemaining} before checking in again.`,
                  variant: "destructive",
                });
                return;
              }

              // Check geolocation before allowing check-in
              if (!userLocation) {
                toast({
                  description: "Unable to determine your location. Please enable location services and try again.",
                  variant: "destructive",
                });
                return;
              }

              // Calculate distance between user and brewery
              const breweryLat = parseFloat(brewery.latitude || '0');
              const breweryLng = parseFloat(brewery.longitude || '0');
              const distance = calculateDistance(
                userLocation.lat, 
                userLocation.lng, 
                breweryLat, 
                breweryLng
              );

              // Check if user is within 0.1 miles (geofence)
              if (distance > 0.1) {
                toast({
                  description: "Check in when you arrive",
                  variant: "destructive",
                });
                return;
              }

              checkInMutation.mutate(brewery.id);
            }}
            disabled={checkInMutation.isPending}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {checkInMutation.isPending 
              ? "Checking in..." 
              : canCheckInData?.canCheckIn === false 
                ? "Check In Again Tomorrow" 
                : "Check In"
            }
          </Button>
          
          {/* Second Row - View Taplist and Take Notes */}
          <div className="grid grid-cols-2 gap-3">
            {/* View Taplist Button - Only show if URL exists */}
            {brewery.tapListUrl ? (
              <Button 
                className="bg-pink-600 hover:bg-pink-700 text-white"
                onClick={() => brewery.tapListUrl && openSmartLink(brewery.tapListUrl)}
              >
                View Taplist
              </Button>
            ) : (
              <div></div>
            )}
            
            {/* Take Notes Button */}
            <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="text-white hover:opacity-90"
                  style={{ backgroundColor: '#004121' }}
                >
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
          <Button 
            variant="ghost" 
            className="text-hops text-sm font-medium mt-1 p-0"
            onClick={() => {
              const address = `${brewery.address}, ${brewery.city}, ${brewery.state} ${brewery.zipCode}`;
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
              openSmartLink(mapsUrl);
            }}
          >
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
            <h3 className="font-semibold mb-2">Policies</h3>
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
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const url = brewery.socialLinks.website;
                  if (url) {
                    console.log('Website button clicked. Opening:', url);
                    sessionStorage.setItem('external-nav', 'true');
                    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
                    if (!newWindow) {
                      console.error('Popup blocked or window.open failed');
                      // Fallback: try direct navigation
                      window.location.href = url;
                    } else {
                      console.log('New window opened successfully');
                    }
                  }
                }}
                className="w-12 h-12 rounded-full bg-hops hover:bg-hops-dark text-white flex items-center justify-center transition-colors"
              >
                <Globe className="w-6 h-6" />
              </button>
            )}
            {brewery.socialLinks.facebook && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const url = brewery.socialLinks.facebook;
                  if (url) {
                    console.log('Facebook button clicked. URL:', url);
                    sessionStorage.setItem('external-nav', 'true');
                    try {
                      // Extract Facebook handle/ID from URL
                      const fbUrl = new URL(url);
                      const pathname = fbUrl.pathname;
                      console.log('Facebook pathname:', pathname);
                      
                      let handle = '';
                      if (pathname.includes('/profile.php')) {
                        const urlParams = new URLSearchParams(fbUrl.search);
                        handle = urlParams.get('id') || '';
                      } else {
                        const pathParts = pathname.split('/').filter(part => part.length > 0);
                        handle = pathParts[0] || '';
                      }
                      
                      if (handle) {
                        const fbAppUrl = handle.match(/^\d+$/) ? `fb://profile/${handle}` : `fb://page/${handle}`;
                        console.log('Opening Facebook app ONLY with URL:', fbAppUrl);
                        
                        // Only try to open the Facebook app - no browser fallback
                        window.location.href = fbAppUrl;
                      } else {
                        console.log('Could not extract Facebook handle from URL');
                      }
                    } catch (error) {
                      console.error('Facebook URL parsing failed:', error);
                    }
                  }
                }}
                className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
              >
                <Facebook className="w-6 h-6" />
              </button>
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
                <div className="flex-1">
                  <h3 className="font-semibold">Beer Hop Podcast</h3>
                  <p className="text-sm opacity-90">{brewery.podcastEpisode}</p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-none"
                  onClick={() => openSmartLink(brewery.podcastUrl!)}
                >
                  Listen on Spotify
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Brewery Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Brewery</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editFormData.address}
                onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={editFormData.zipCode}
                  onChange={(e) => setEditFormData({...editFormData, zipCode: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Textarea
                id="hours"
                value={editFormData.hours}
                onChange={(e) => setEditFormData({...editFormData, hours: e.target.value})}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="policies">Policies</Label>
              <Textarea
                id="policies"
                value={editFormData.policies}
                onChange={(e) => setEditFormData({...editFormData, policies: e.target.value})}
                rows={4}
                placeholder="Enter brewery policies, hours, rules, etc."
              />
            </div>
            

            
            <div>
              <Label htmlFor="tapListUrl">Tap List URL</Label>
              <Input
                id="tapListUrl"
                value={editFormData.tapListUrl}
                onChange={(e) => setEditFormData({...editFormData, tapListUrl: e.target.value})}
                placeholder="https://example.com/taplist or embed URL"
              />
            </div>
            
            <div>
              <Label htmlFor="image">Header Image</Label>
              <div className="space-y-2">
                <Input
                  id="image"
                  value={editFormData.image}
                  onChange={(e) => setEditFormData({...editFormData, image: e.target.value})}
                  placeholder="Current image URL or upload new..."
                />
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760}
                  onGetUploadParameters={async () => {
                    const response = await apiRequest("/api/objects/upload", "POST", {});
                    const data = await response.json();
                    return {
                      method: "PUT" as const,
                      url: data.uploadURL,
                    };
                  }}
                  onComplete={async (result) => {
                    if (result.successful && result.successful[0]) {
                      const uploadURL = result.successful[0].uploadURL;
                      try {
                        // Convert the upload URL to an object path using the objectStorage service
                        const response = await apiRequest("/api/objects/normalize", "POST", { url: uploadURL });
                        const data = await response.json();
                        setEditFormData({...editFormData, image: data.objectPath});
                        toast({
                          title: "Header image uploaded!",
                          description: "Your brewery header image has been uploaded successfully.",
                        });
                      } catch (error) {
                        console.error("Error normalizing upload URL:", error);
                        // Fallback to direct URL
                        setEditFormData({...editFormData, image: uploadURL || ""});
                        toast({
                          title: "Header image uploaded!",
                          description: "Your brewery header image has been uploaded successfully.",
                        });
                      }
                    }
                  }}
                  buttonClassName="w-full bg-hops hover:bg-hops/90 text-white border-0"
                >
                  Upload Header Image
                </ObjectUploader>
              </div>
            </div>
            
            <div>
              <Label htmlFor="logo">Brewery Logo</Label>
              <div className="space-y-2">
                <Input
                  id="logo"
                  value={editFormData.logo}
                  onChange={(e) => setEditFormData({...editFormData, logo: e.target.value})}
                  placeholder="Current logo URL or upload new..."
                />
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760}
                  onGetUploadParameters={async () => {
                    const response = await apiRequest("/api/objects/upload", "POST", {});
                    const data = await response.json();
                    return {
                      method: "PUT" as const,
                      url: data.uploadURL,
                    };
                  }}
                  onComplete={async (result) => {
                    if (result.successful && result.successful[0]) {
                      const uploadURL = result.successful[0].uploadURL;
                      try {
                        // Convert the upload URL to an object path using the objectStorage service
                        const response = await apiRequest("/api/objects/normalize", "POST", { url: uploadURL });
                        const data = await response.json();
                        setEditFormData({...editFormData, logo: data.objectPath});
                        toast({
                          title: "Logo uploaded!",
                          description: "Your brewery logo has been uploaded successfully.",
                        });
                      } catch (error) {
                        console.error("Error normalizing upload URL:", error);
                        // Fallback to direct URL
                        setEditFormData({...editFormData, logo: uploadURL || ""});
                        toast({
                          title: "Logo uploaded!",
                          description: "Your brewery logo has been uploaded successfully.",
                        });
                      }
                    }
                  }}
                  buttonClassName="w-full bg-hops hover:bg-hops/90 text-white border-0"
                >
                  Upload Logo
                </ObjectUploader>
              </div>
            </div>
            
            <div className="space-y-4">
              <Label className="text-base font-semibold">Social Media Links</Label>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={editFormData.website}
                  onChange={(e) => setEditFormData({...editFormData, website: e.target.value})}
                  placeholder="https://brewery-website.com"
                />
              </div>
              
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={editFormData.facebook}
                  onChange={(e) => setEditFormData({...editFormData, facebook: e.target.value})}
                  placeholder="https://facebook.com/brewery"
                />
              </div>
              
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={editFormData.instagram}
                  onChange={(e) => setEditFormData({...editFormData, instagram: e.target.value})}
                  placeholder="https://instagram.com/brewery"
                />
              </div>
              
              <div>
                <Label htmlFor="x">X (Twitter)</Label>
                <Input
                  id="x"
                  value={editFormData.x}
                  onChange={(e) => setEditFormData({...editFormData, x: e.target.value})}
                  placeholder="https://x.com/brewery"
                />
              </div>
              
              <div>
                <Label htmlFor="threads">Threads</Label>
                <Input
                  id="threads"
                  value={editFormData.threads}
                  onChange={(e) => setEditFormData({...editFormData, threads: e.target.value})}
                  placeholder="https://threads.net/@brewery"
                />
              </div>
              
              <div>
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  value={editFormData.tiktok}
                  onChange={(e) => setEditFormData({...editFormData, tiktok: e.target.value})}
                  placeholder="https://tiktok.com/@brewery"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => updateBreweryMutation.mutate(editFormData)}
                disabled={updateBreweryMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {updateBreweryMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
