import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Star, MapPin, Edit, Plus, Upload } from "lucide-react";
import { Link } from "wouter";
import { useLocation } from "@/hooks/use-location";
import { convertGoogleDriveImageUrl } from "@/lib/imageUtils";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { openSmartLink } from "@/lib/linkHandler";

import type { Brewery } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

interface BreweryWithDistance extends Brewery {
  distance?: number;
}

export default function Breweries() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerLinkUrl, setBannerLinkUrl] = useState("");
  const { latitude, longitude } = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is master admin
  const isMasterAdmin = currentUser?.email === 'joshuamdelozier@gmail.com';

  const { data: breweries = [], isLoading } = useQuery<BreweryWithDistance[]>({
    queryKey: ["/api/breweries", { lat: latitude, lng: longitude }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (latitude && longitude) {
        params.append('lat', latitude.toString());
        params.append('lng', longitude.toString());
      }
      
      const response = await fetch(`/api/breweries?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch breweries');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
  });

  // Get global settings for banner
  const { data: globalSettings } = useQuery({
    queryKey: ["/api/global-settings"],
    staleTime: 10 * 60 * 1000, // Cache settings for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in memory for 30 minutes
  });

  // Helper function to convert object storage paths to proper URLs
  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return '';
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Convert object storage path to accessible URL
    if (imagePath.startsWith('/') && imagePath.includes('uploads/')) {
      // Extract the object ID from the path
      const parts = imagePath.split('/');
      const objectId = parts[parts.length - 1];
      return `/objects/uploads/${objectId}`;
    }
    
    return imagePath;
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

  const handleBannerImageUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
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
          description: "Banner image uploaded successfully! Don't forget to save.",
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
      const response = await fetch("/api/global-settings/breweries-banner", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser?.id || "",
        },
        body: JSON.stringify({
          bannerImageUrl,
          bannerLinkUrl,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update banner");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Breweries banner updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/global-settings"] });
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

  const filteredBreweries = breweries.filter(brewery =>
    brewery.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brewery.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brewery.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 !== 0;
    
    return (
      <div className="flex text-amber text-xs">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-3 h-3 ${
              i < fullStars ? 'fill-current' : 
              i === fullStars && hasHalfStar ? 'fill-current opacity-50' : 
              'opacity-30'
            }`} 
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Nearby Breweries</h1>
            <div className="relative">
              <Input placeholder="Search breweries..." className="pl-10" value="" readOnly />
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex">
                <div className="w-24 h-24 bg-gray-300"></div>
                <div className="flex-1 p-4 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          {/* Breweries Banner Section - Clickable Banner Image (5:1 ratio) - positioned ABOVE the heading */}
          {(globalSettings as any)?.breweriesBannerImage ? (
            <div className="mb-4 relative">
              <div 
                className="w-full rounded-lg overflow-hidden shadow-md"
                style={{ aspectRatio: '5/1' }}
              >
                <img 
                  src={getImageUrl((globalSettings as any).breweriesBannerImage)} 
                  alt="Breweries Banner"
                  className="w-full h-full object-cover"
                />
              </div>
              {isMasterAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 bg-black/50 text-white border-white/50 hover:bg-white hover:text-black"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Pre-populate with current values
                    setBannerImageUrl((globalSettings as any)?.breweriesBannerImage || "");
                    setBannerLinkUrl((globalSettings as any)?.breweriesBannerLink || "");
                    setIsBannerDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit Banner
                </Button>
              )}
            </div>
          ) : isMasterAdmin ? (
            <div className="mb-4">
              <div 
                className="w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow flex items-center justify-center cursor-pointer"
                style={{ aspectRatio: '5/1' }}
                onClick={() => {
                  setBannerImageUrl("");
                  setBannerLinkUrl("");
                  setIsBannerDialogOpen(true);
                }}
              >
                <div className="text-center text-gray-500">
                  <Plus className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Add Banner Image</p>
                </div>
              </div>
            </div>
          ) : null}

          <h1 className="text-2xl font-bold text-gray-900 mb-4">Nearby Breweries</h1>
          
          {/* Search Box */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search breweries..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Banner Editor Dialog */}
      <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Breweries Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="banner-image">Banner Image (5:1 ratio recommended)</Label>
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
            {bannerImageUrl && (
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

      {/* Brewery List */}
      <div className="px-6 py-4 space-y-4">
        {filteredBreweries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No breweries found</p>
            {searchTerm && (
              <p className="text-sm">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          filteredBreweries.map((brewery) => (
            <Link key={brewery.id} href={`/brewery/${brewery.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex">
                  <img 
                    src={convertGoogleDriveImageUrl(brewery.logo) || `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200`} 
                    alt={brewery.name} 
                    className="w-24 h-24 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200`;
                    }}
                  />
                  <div className="flex-1 p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{brewery.name}</h3>
                    <p className="text-sm text-gray-600">
                      {brewery.city}, {brewery.state}
                    </p>
                    {brewery.distance && (
                      <div className="text-sm font-medium text-hops mt-1">
                        {brewery.distance} mi
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
