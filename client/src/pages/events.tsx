import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, ExternalLink, Edit, Plus } from "lucide-react";
import { Link } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";
import { CreateSpecialEventModal } from "@/components/CreateSpecialEventModal";

// Helper function to format date from YYYY-MM-DD to "Month Day, Year"
function formatEventDate(dateString: string): string {
  // If already in the correct format (contains comma and year), return as is
  if (dateString.includes(',') && dateString.includes('20')) {
    return dateString;
  }
  
  // Parse the date string as YYYY-MM-DD without timezone issues
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `${monthNames[month - 1]} ${day}, ${year}`;
  }
  
  return dateString;
}

// Helper function to convert object storage paths to proper URLs
function getImageUrl(imagePath: string): string {
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
}
import { useToast } from "@/hooks/use-toast";
import type { Event, SpecialEvent } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

interface EventWithBrewery extends Event {
  brewery: {
    name: string;
    id: string;
  } | null;
}

export default function Events() {
  const [selectedTab, setSelectedTab] = useState<"special" | "weekly">("special");
  const [showHeaderEdit, setShowHeaderEdit] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: events = [], isLoading } = useQuery<EventWithBrewery[]>({
    queryKey: ["/api/events"],
  });

  const { data: specialEvents = [], isLoading: isLoadingSpecial } = useQuery<SpecialEvent[]>({
    queryKey: ["/api/special-events"],
  });

  // Get header image from global settings
  const { data: globalSettings } = useQuery({
    queryKey: ["/api/global-settings"],
  });

  // Get current user to check admin status
  const { data: currentUser } = useQuery<any>({
    queryKey: ['/api/users/joshuamdelozier'], // Hardcoded for demo
  });

  // Sort special events chronologically (earliest first)
  const sortedSpecialEvents = [...specialEvents].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  const formatEventDate = (dateString: string): string => {
    // If already in the correct format (contains comma and year), return as is
    if (dateString.includes(',') && dateString.includes('20')) {
      return dateString;
    }
    
    // Parse the date string as YYYY-MM-DD without timezone issues
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      return `${monthNames[month - 1]} ${day}, ${year}`;
    }
    
    return dateString;
  };

  // Check if user is master admin (only joshuamdelozier@gmail.com) or brewery owner
  const isMasterAdmin = currentUser?.email === 'joshuamdelozier@gmail.com';
  const isBreweryOwner = currentUser?.role === 'brewery_owner';
  const canCreateEvents = isMasterAdmin || isBreweryOwner;

  // Header image upload functions
  const handleGetUploadParameters = async () => {
    const response = await fetch('/api/objects/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const headerUpdateMutation = useMutation({
    mutationFn: async (headerImageUrl: string) => {
      const response = await fetch('/api/global-settings/events-header', {
        method: 'PUT',
        headers: {
          'x-user-id': 'joshuamdelozier',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ headerImageUrl }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update header');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/global-settings"] });
      toast({
        title: "Header updated",
        description: "Events header image has been updated for all users.",
      });
      setShowHeaderEdit(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update header image.",
        variant: "destructive",
      });
    },
  });

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      if (uploadedFile.uploadURL) {
        // Convert the upload URL to an object path
        const objectPath = convertUploadUrlToObjectPath(uploadedFile.uploadURL);
        headerUpdateMutation.mutate(objectPath);
      }
    }
  };

  const convertUploadUrlToObjectPath = (uploadUrl: string): string => {
    try {
      const url = new URL(uploadUrl);
      const pathParts = url.pathname.split('/');
      const objectId = pathParts[pathParts.length - 1];
      return `/objects/uploads/${objectId}`;
    } catch (error) {
      return uploadUrl;
    }
  };

  // Get the header image from global settings or use default
  const headerImageUrl = (globalSettings as any)?.eventsHeaderImage || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400';

  if (isLoading || isLoadingSpecial) {
    return (
      <div className="mobile-container">
        {/* Header image without text overlay */}
        <div className="relative">
          <div 
            className="w-full h-48"
            style={{
              backgroundImage: `url('${headerImageUrl}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          {isMasterAdmin && (
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2 bg-white/90 hover:bg-white"
              onClick={() => setShowHeaderEdit(!showHeaderEdit)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit Header
            </Button>
          )}
          
          {showHeaderEdit && isMasterAdmin && (
            <div className="absolute top-12 right-2 bg-white rounded-lg shadow-lg p-4 min-w-48">
              <h3 className="font-semibold mb-2">Update Header Image</h3>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="w-full bg-[#ff55e1] hover:bg-[#ff55e1]/90 text-white"
              >
                <span>Upload New Header</span>
              </ObjectUploader>
              <Button
                size="sm"
                variant="ghost"
                className="w-full mt-2"
                onClick={() => setShowHeaderEdit(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
        
        <div className="px-6 py-6 space-y-4">
          <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
          
          {/* Full-width Toggle Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <Button
              variant={selectedTab === "special" ? "default" : "outline"}
              onClick={() => setSelectedTab("special")}
              className={`w-full ${selectedTab === "special" ? "bg-[#80bc04] hover:bg-[#80bc04]/90 text-white" : ""}`}
            >
              Special Events
            </Button>
            <Button
              variant={selectedTab === "weekly" ? "default" : "outline"}
              onClick={() => setSelectedTab("weekly")}
              className={`w-full ${selectedTab === "weekly" ? "bg-[#80bc04] hover:bg-[#80bc04]/90 text-white" : ""}`}
            >
              Weekly Events
            </Button>
          </div>
          
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
      {/* Header image without text overlay */}
      <div className="relative">
        <div 
          className="w-full h-48"
          style={{
            backgroundImage: `url('${headerImageUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        {isMasterAdmin && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 bg-white/90 hover:bg-white"
            onClick={() => setShowHeaderEdit(!showHeaderEdit)}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit Header
          </Button>
        )}
        
        {showHeaderEdit && isMasterAdmin && (
          <div className="absolute top-12 right-2 bg-white rounded-lg shadow-lg p-4 min-w-48">
            <h3 className="font-semibold mb-2">Update Header Image</h3>
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={10485760}
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="w-full bg-[#ff55e1] hover:bg-[#ff55e1]/90 text-white"
            >
              <span>Upload New Header</span>
            </ObjectUploader>
            <Button
              size="sm"
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setShowHeaderEdit(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
      
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Upcoming Events</h2>
          {canCreateEvents && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#80bc04] hover:bg-[#80bc04]/90 text-white"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Event
            </Button>
          )}
        </div>
        
        {/* Full-width Toggle Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <Button
            variant={selectedTab === "special" ? "default" : "outline"}
            onClick={() => setSelectedTab("special")}
            className={`w-full ${selectedTab === "special" ? "bg-[#80bc04] hover:bg-[#80bc04]/90 text-white" : ""}`}
          >
            Special Events
          </Button>
          <Button
            variant={selectedTab === "weekly" ? "default" : "outline"}
            onClick={() => setSelectedTab("weekly")}
            className={`w-full ${selectedTab === "weekly" ? "bg-[#80bc04] hover:bg-[#80bc04]/90 text-white" : ""}`}
          >
            Weekly Events
          </Button>
        </div>

        {selectedTab === "special" ? (
          // Special Events Display
          specialEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No special events scheduled</p>
              <p className="text-sm">Check back soon for upcoming special events</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedSpecialEvents.map((event) => (
                <Link key={event.id} href={`/special-event/${event.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    {/* Large photo display */}
                    {event.logo && (
                      <div className="w-full h-48 overflow-hidden">
                        <img 
                          src={getImageUrl(event.logo)} 
                          alt={event.event}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Hide image if it fails to load
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        {event.event}
                      </h3>
                      <p className="text-sm text-[#80bc04] font-medium mb-2">
                        {event.company}
                      </p>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="mr-3">{event.location || event.address}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className="mr-3">{formatEventDate(event.date)}</span>
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={event.rsvpRequired ? "default" : "secondary"}
                          className={event.rsvpRequired ? "bg-[#ff55e1] text-white" : "bg-green-100 text-green-800"}
                        >
                          {event.rsvpRequired ? "RSVP Required" : "Open Event"}
                        </Badge>
                        {event.ticketLink && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(event.ticketLink!, '_blank');
                            }}
                            className={event.rsvpRequired ? "bg-[#ff55e1] hover:bg-[#ff55e1]/90 text-white border-[#ff55e1]" : ""}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Tickets
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )
        ) : (
          // Weekly Events Display - Day of week buttons
          <div className="space-y-3">
            {[
              'Monday',
              'Tuesday', 
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday'
            ].map((day) => (
              <Button
                key={day}
                variant="outline"
                className="w-full h-14 text-lg font-medium bg-[#1a5632] hover:bg-[#1a5632]/90 border-[#1a5632] text-white justify-center px-6"
                onClick={() => {
                  window.location.href = `/weekly-events/${day.toLowerCase()}`;
                }}
              >
                {day}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Create Special Event Modal */}
      <CreateSpecialEventModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </div>
  );
}
