import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink, Edit } from "lucide-react";
import type { PodcastEpisode, User } from "@shared/schema";
import podcastBanner from "@assets/BH_Podcast_Banner (5)_1754202035969.jpg";

export default function Podcast() {
  const { data: episodes = [], isLoading } = useQuery<PodcastEpisode[]>({
    queryKey: ["/api/podcast-episodes"],
  });
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/joshuamdelozier"],
  });
  
  const isMasterAdmin = user?.role === 'admin';

  const openSpotify = (spotifyUrl: string) => {
    window.open(spotifyUrl, '_blank');
  };
  
  const handleEdit = () => {
    // Create a simple edit interface
    const newEpisodeData = prompt(
      "Enter new episode data in format: episodeNumber|title|guest|business|spotifyUrl|imageUrl\n" +
      "Example: 66|Episode #66|John Doe|Sample Brewery|https://spotify.com/episode/123|https://image.url"
    );
    
    if (newEpisodeData) {
      const [episodeNumber, title, guest, business, spotifyUrl, imageUrl] = newEpisodeData.split('|');
      
      if (episodeNumber && title && guest && business) {
        // Create new episode object
        const newEpisode = {
          episodeNumber: parseInt(episodeNumber),
          title: title.trim(),
          guest: guest.trim(),
          business: business.trim(),
          duration: "60",
          releaseDate: new Date().toISOString(),
          spotifyUrl: spotifyUrl?.trim() || "",
          image: imageUrl?.trim() || "",
          description: ""
        };
        
        // For now, just show the data that would be sent
        alert(`New episode data:\n${JSON.stringify(newEpisode, null, 2)}\n\nNote: This would be sent to the server to create the episode.`);
      } else {
        alert("Please provide at least episode number, title, guest, and business name.");
      }
    }
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
            <Button 
              size="sm"
              variant="outline"
              className="text-[#ff55e1] border-[#ff55e1] hover:bg-[#ff55e1] hover:text-white"
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
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
