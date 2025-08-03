import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Play, ExternalLink, Edit, Plus, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { PodcastEpisode, User } from "@shared/schema";
import type { UploadResult } from "@uppy/core";
import podcastBanner from "@assets/BH_Podcast_Banner (5)_1754202035969.jpg";

interface EpisodeFormData {
  title: string;
  guest: string;
  business: string;
  spotifyUrl: string;
  image: string;
  releaseDate: string;
}

export default function Podcast() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: episodes = [], isLoading } = useQuery<PodcastEpisode[]>({
    queryKey: ["/api/podcast-episodes"],
  });
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/joshuamdelozier"],
  });
  
  const isMasterAdmin = user?.role === 'admin';

  const form = useForm<EpisodeFormData>({
    defaultValues: {
      title: "",
      guest: "",
      business: "",
      spotifyUrl: "",
      image: "",
      releaseDate: new Date().toISOString().split('T')[0],
    },
  });

  const createEpisodeMutation = useMutation({
    mutationFn: async (data: EpisodeFormData) => {
      // Calculate next episode number based on existing episodes
      const nextEpisodeNumber = Math.max(...episodes.map(ep => ep.episodeNumber), 0) + 1;
      
      const episodeData = {
        ...data,
        episodeNumber: nextEpisodeNumber,
        description: "", // Default empty description
        duration: "60", // Default 60 minutes
        releaseDate: data.releaseDate,
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

  const onSubmit = (data: EpisodeFormData) => {
    createEpisodeMutation.mutate(data);
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
          form.setValue("image", uploadURL);
        }
        
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
      } catch (error) {
        console.error("Error normalizing image URL:", error);
        // Fallback to using the upload URL directly
        form.setValue("image", uploadURL);
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
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
          <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-2xl font-bold">Beer Hop Podcast</h1>
            <p className="text-sm opacity-90">Stories from Local Brewers</p>
          </div>
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
        className="hero-banner"
        style={{
          backgroundImage: `url(${podcastBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="hero-overlay" />

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
                        onClick={() => setIsDialogOpen(false)}
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
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {episode.guest}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {episode.business}
                      </p>
                      <p className="text-xs text-gray-500">
                        Released {new Date(episode.releaseDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-[#ff55e1] hover:text-[#ff55e1]/80 p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSpotify(episode.spotifyUrl);
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
