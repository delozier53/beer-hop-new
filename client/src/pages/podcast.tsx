import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Play, ExternalLink, Edit, Plus, Upload, Headphones } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";

import type { PodcastEpisode, User } from "@shared/schema";
import type { UploadResult } from "@uppy/core";
import podcastBanner from "@assets/BH_Podcast_Banner (5)_1754202035969.jpg";
import { useAuth } from "@/hooks/useAuth";

interface EpisodeFormData {
  title: string;
  guest: string;
  business: string;
  spotifyUrl: string;
  image: string;
  releaseDate: string;
  episodeNumber: number;
}

export default function Podcast() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<PodcastEpisode | null>(null);
  const [isHeaderImageDialogOpen, setIsHeaderImageDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: episodes = [], isLoading } = useQuery<PodcastEpisode[]>({
    queryKey: ["/api/podcast-episodes"],
  });
  
  // Use authenticated user from useAuth hook instead of hardcoded query

  const { data: podcastHeader } = useQuery<{ headerImage: string | null }>({
    queryKey: ["/api/podcast/header"],
  });

  const headerImage = podcastHeader?.headerImage || podcastBanner;
  
  const isMasterAdmin = user?.email === 'joshuamdelozier@gmail.com';

  const form = useForm<EpisodeFormData>({
    defaultValues: {
      title: "",
      guest: "",
      business: "",
      spotifyUrl: "",
      image: "",
      releaseDate: new Date().toISOString().split('T')[0],
      episodeNumber: (Math.max(...episodes.map(ep => ep.episodeNumber), 0) + 1),
    },
  });

  const createEpisodeMutation = useMutation({
    mutationFn: async (data: EpisodeFormData) => {
      // Use the episode number provided by the user
      const episodeData = {
        ...data,
        description: "", // Default empty description
        duration: "60", // Default 60 minutes
        releaseDate: data.releaseDate,
        episodeNumber: data.episodeNumber,
      };
      return apiRequest("POST", "/api/podcast-episodes", episodeData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Episode created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/podcast-episodes"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create episode",
        variant: "destructive",
      });
    },
  });

  const updateEpisodeMutation = useMutation({
    mutationFn: async (data: EpisodeFormData) => {
      if (!editingEpisode) throw new Error("No episode selected for editing");
      
      const episodeData = {
        ...data,
        episodeNumber: data.episodeNumber, // Use user-provided episode number
        description: editingEpisode.description || "", // Keep original description
        duration: editingEpisode.duration, // Keep original duration
        releaseDate: data.releaseDate,
      };
      return apiRequest("PUT", `/api/podcast-episodes/${editingEpisode.id}`, episodeData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Episode updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/podcast-episodes"] });
      setIsEditDialogOpen(false);
      setEditingEpisode(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update episode. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: async (episodeId: string) => {
      return apiRequest("DELETE", `/api/podcast-episodes/${episodeId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Episode deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/podcast-episodes"] });
      setIsEditDialogOpen(false);
      setEditingEpisode(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete episode. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EpisodeFormData) => {
    if (editingEpisode) {
      updateEpisodeMutation.mutate(data);
    } else {
      createEpisodeMutation.mutate(data);
    }
  };

  const handleEditEpisode = (episode: PodcastEpisode) => {
    setEditingEpisode(episode);
    
    // Format date properly to avoid timezone issues
    const releaseDate = new Date(episode.releaseDate);
    const localDateString = `${releaseDate.getFullYear()}-${String(releaseDate.getMonth() + 1).padStart(2, '0')}-${String(releaseDate.getDate()).padStart(2, '0')}`;
    
    form.reset({
      title: episode.title,
      guest: episode.guest,
      business: episode.business,
      spotifyUrl: episode.spotifyUrl,
      image: episode.image,
      releaseDate: localDateString,
      episodeNumber: episode.episodeNumber,
    });
    setIsEditDialogOpen(true);
  };

  const handleImageUpload = async () => {
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

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      
      try {
        // Normalize the upload URL to get the object path
        const response = await fetch("/api/objects/normalize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: uploadURL }),
        });
        
        if (response.ok) {
          const data = await response.json();
          form.setValue("image", data.objectPath);
        } else {
          // Fallback to using the upload URL directly
          form.setValue("image", uploadURL || "");
        }
        
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
      } catch (error) {
        console.error("Error normalizing image URL:", error);
        // Fallback to using the upload URL directly
        form.setValue("image", uploadURL || "");
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
      }
    }
  };

  const handleHeaderImageUpload = async () => {
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

  const handleHeaderImageUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
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
        
        let finalImagePath = uploadURL;
        if (normalizeResponse.ok) {
          const normalizeData = await normalizeResponse.json();
          finalImagePath = normalizeData.objectPath;
        }
        
        // Now save it as the global podcast header for ALL users
        const headerResponse = await fetch("/api/podcast/header", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ headerImage: finalImagePath }),
        });
        
        if (headerResponse.ok) {
          // Invalidate the header query to refresh the header for everyone
          queryClient.invalidateQueries({ queryKey: ["/api/podcast/header"] });
          
          setIsHeaderImageDialogOpen(false);
          
          toast({
            title: "Success",
            description: "Global podcast header updated successfully! All users will see the new header.",
          });
        } else {
          throw new Error("Failed to save global header image");
        }
      } catch (error) {
        console.error("Error updating global header image:", error);
        setIsHeaderImageDialogOpen(false);
        toast({
          title: "Error",
          description: "Failed to update global header image. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const openSpotify = (spotifyUrl: string) => {
    window.open(spotifyUrl, '_blank');
  };
  
  // Sort episodes by release date descending (most recent first)
  const sortedEpisodes = [...episodes].sort((a, b) => 
    new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="hero-banner from-purple-600 to-pink-600">
          <div className="hero-overlay" />
        </div>
        <div className="px-6 py-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container pb-20">
      {/* Hero Banner */}
      <div 
        className="hero-banner relative"
        style={{
          backgroundImage: `url(${headerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="hero-overlay" />

        {isMasterAdmin && (
          <Button
            size="sm"
            variant="outline"
            className="absolute top-4 right-4 bg-black/50 text-white border-white/50 hover:bg-white hover:text-black"
            onClick={() => setIsHeaderImageDialogOpen(true)}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit Image
          </Button>
        )}
      </div>

      {/* Episodes List */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Latest Episodes</h2>
          {isMasterAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="text-[#ff55e1] border-[#ff55e1] hover:bg-[#ff55e1] hover:text-white"
                    onClick={() => {
                      // Reset form to clean state when opening create dialog
                      form.reset({
                        title: "",
                        guest: "",
                        business: "",
                        spotifyUrl: "",
                        image: "",
                        releaseDate: new Date().toISOString().split('T')[0],
                        episodeNumber: (Math.max(...episodes.map(ep => ep.episodeNumber), 0) + 1),
                      });
                      setEditingEpisode(null);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Episode
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Episode</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="episodeNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Episode Number</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} placeholder="66" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Episode #66" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="guest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guest</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Guest name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="business"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Business/Brewery name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="spotifyUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Spotify URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://open.spotify.com/episode/..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Episode Image</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input {...field} placeholder="Image URL will appear here after upload" disabled />
                              <ObjectUploader
                                maxNumberOfFiles={1}
                                maxFileSize={5242880} // 5MB
                                onGetUploadParameters={handleImageUpload}
                                onComplete={handleUploadComplete}
                                buttonClassName="w-full bg-[#ff55e1] hover:bg-[#ff55e1]/90"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Episode Image
                              </ObjectUploader>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="releaseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Release Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          form.reset();
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createEpisodeMutation.isPending}
                        className="flex-1 bg-[#ff55e1] hover:bg-[#ff55e1]/90"
                      >
                        {createEpisodeMutation.isPending ? "Creating..." : "Create Episode"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Edit Episode Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Episode</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="episodeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Episode Number</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} placeholder="66" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Episode #66" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="guest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guest</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Guest Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="business"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Brewery/Business Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="spotifyUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spotify URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://open.spotify.com/episode/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Episode Image</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input {...field} placeholder="Image URL will appear here after upload" disabled />
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5242880} // 5MB
                            onGetUploadParameters={handleImageUpload}
                            onComplete={handleUploadComplete}
                            buttonClassName="w-full bg-[#ff55e1] hover:bg-[#ff55e1]/90"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Episode Image
                          </ObjectUploader>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="releaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col gap-2 pt-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setEditingEpisode(null);
                        form.reset();
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateEpisodeMutation.isPending}
                      className="flex-1 bg-[#ff55e1] hover:bg-[#ff55e1]/90"
                    >
                      {updateEpisodeMutation.isPending ? "Updating..." : "Update Episode"}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (editingEpisode && confirm(`Are you sure you want to delete Episode #${editingEpisode.episodeNumber}? This action cannot be undone.`)) {
                        deleteEpisodeMutation.mutate(editingEpisode.id);
                      }
                    }}
                    disabled={deleteEpisodeMutation.isPending}
                    className="w-full"
                  >
                    {deleteEpisodeMutation.isPending ? "Deleting..." : "Delete Episode"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {episodes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No podcast episodes available</p>
            <p className="text-sm">Check back soon for new episodes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEpisodes.map((episode) => (
              <Card 
                key={episode.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openSpotify(episode.spotifyUrl)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <img 
                      src={episode.image} 
                      alt={`Episode ${episode.episodeNumber} artwork`}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#ff55e1]">
                          Episode #{episode.episodeNumber}
                        </span>
                        {isMasterAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-gray-600 p-1 h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEpisode(episode);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {episode.guest}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {episode.business}
                      </p>
                      <p className="text-xs text-gray-500">
                        Released {(() => {
                          const date = new Date(episode.releaseDate);
                          // Use local date formatting to avoid timezone issues
                          return date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'UTC'
                          });
                        })()}
                      </p>
                    </div>
                    <button 
                      className="w-8 h-8 rounded-full bg-[#ff55e1] hover:bg-[#ff55e1]/90 flex items-center justify-center transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSpotify(episode.spotifyUrl);
                      }}
                      title="Listen on Spotify"
                    >
                      <Headphones className="w-4 h-4 text-white" />
                    </button>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Header Image Upload Dialog */}
      <Dialog open={isHeaderImageDialogOpen} onOpenChange={setIsHeaderImageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Header Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload a new header image for the podcast page. The image will be displayed as the banner background.
            </p>
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={10485760} // 10MB
              onGetUploadParameters={handleHeaderImageUpload}
              onComplete={handleHeaderImageUploadComplete}
              buttonClassName="w-full bg-[#ff55e1] hover:bg-[#ff55e1]/90 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Image
            </ObjectUploader>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
