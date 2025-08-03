import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Plus } from "lucide-react";
import { Link, useParams } from "wouter";
import WeeklyEventCreateModal from "@/components/weekly-event-create-modal";

interface WeeklyEvent {
  id: string;
  day: string;
  brewery: string;
  event: string;
  title: string;
  details: string;
  time: string;
  logo: string;
  eventPhoto: string;
  instagram: string;
  twitter: string;
  facebook: string;
  address: string;
}

interface Brewery {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  address: string;
  city: string;
  state: string;
}

// Helper function to convert URLs to accessible format
function getImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  
  // If it's already a full URL (like Google Drive links), return as is
  if (imagePath.startsWith('http')) {
    // For Google Drive links, convert to direct image URLs
    if (imagePath.includes('drive.google.com')) {
      // Extract file ID from Google Drive share link
      const match = imagePath.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }
    return imagePath;
  }
  
  // Convert object storage path to accessible URL
  if (imagePath.startsWith('/') && imagePath.includes('uploads/')) {
    const parts = imagePath.split('/');
    const objectId = parts[parts.length - 1];
    return `/objects/uploads/${objectId}`;
  }
  
  return imagePath;
}

// Function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function WeeklyEventsDay() {
  const { day } = useParams();
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { data: weeklyEvents = [], isLoading } = useQuery<WeeklyEvent[]>({
    queryKey: [`/api/weekly-events/${day}`],
  });

  const { data: breweries = [] } = useQuery<Brewery[]>({
    queryKey: ['/api/breweries'],
  });

  const { data: currentUser } = useQuery<{role: string}>({
    queryKey: ['/api/users/joshuamdelozier'], // TODO: Make this dynamic based on actual user
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Location access denied or unavailable');
        }
      );
    } else {
      setLocationError('Geolocation not supported');
    }
  }, []);

  // Sort events by brewery distance from user's location
  const sortedEvents = userLocation ? [...weeklyEvents].sort((a, b) => {
    // Find brewery coordinates for each event
    const breweryA = breweries.find((brewery) => 
      brewery.name.toUpperCase() === a.brewery.toUpperCase()
    );
    const breweryB = breweries.find((brewery) => 
      brewery.name.toUpperCase() === b.brewery.toUpperCase()
    );
    
    if (!breweryA || !breweryB) {
      // If we can't find brewery data, put events without brewery data at the end
      if (!breweryA && !breweryB) return 0;
      if (!breweryA) return 1;
      if (!breweryB) return -1;
      return 0;
    }
    
    const distanceA = calculateDistance(
      userLocation.lat, 
      userLocation.lon, 
      parseFloat(breweryA.latitude), 
      parseFloat(breweryA.longitude)
    );
    
    const distanceB = calculateDistance(
      userLocation.lat, 
      userLocation.lon, 
      parseFloat(breweryB.latitude), 
      parseFloat(breweryB.longitude)
    );
    
    // Removed debug logging - sorting is working correctly
    
    // Sort ascending (closest first)
    return distanceA - distanceB;
  }) : weeklyEvents;

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="px-6 py-6">
          <div className="flex items-center mb-6">
            <Link href="/events">
              <Button variant="ghost" size="sm" className="mr-3">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-32"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const dayName = day ? day.charAt(0).toUpperCase() + day.slice(1) : '';

  return (
    <div className="mobile-container">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/events">
              <Button variant="ghost" size="sm" className="mr-3">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{dayName} Events</h1>
          </div>
          
          {/* Admin/Owner Create Button */}
          {currentUser && ('role' in currentUser) && (currentUser.role === 'admin' || currentUser.role === 'brewery_owner') && (
            <Button 
              className="bg-[#1a5632] hover:bg-[#1a5632]/90 text-white"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          )}
        </div>

        {/* Location Status */}
        {locationError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              {locationError} - Events shown in default order
            </p>
          </div>
        )}

        {/* Events List */}
        {sortedEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No events scheduled</h3>
            <p>Check back later for {dayName} events!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map((event, index) => {
              // Calculate distance for display
              const brewery = breweries.find((b) => b.name === event.brewery);
              const distance = userLocation && brewery ? 
                calculateDistance(
                  userLocation.lat, 
                  userLocation.lon, 
                  parseFloat(brewery.latitude), 
                  parseFloat(brewery.longitude)
                ).toFixed(1) : null;

              return (
              <Card key={event.id} className="overflow-hidden relative">
                {/* Event Photo */}
                {event.eventPhoto && (
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={getImageUrl(event.eventPhoto)} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <CardContent className="p-4">
                  {/* Distance Badge */}
                  {distance && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="outline" className="bg-white text-gray-600 text-xs">
                        {distance} mi
                      </Badge>
                    </div>
                  )}

                  {/* Brewery Logo and Name */}
                  <div className="flex items-center mb-3">
                    {event.logo && (
                      <img 
                        src={getImageUrl(event.logo)} 
                        alt={`${event.brewery} logo`}
                        className="w-8 h-8 rounded-full mr-3 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{event.title}</h3>
                      <p className="text-sm text-[#80bc04] font-medium">{event.brewery}</p>
                    </div>
                  </div>

                  {/* Event Type Badge */}
                  <div className="mb-3">
                    <Badge 
                      variant="secondary"
                      className="bg-[#1a5632] text-white"
                    >
                      {event.event}
                    </Badge>
                  </div>

                  {/* Time */}
                  <div className="mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{event.time}</span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {event.details}
                  </p>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        <WeeklyEventCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          defaultDay={day}
        />
      </div>
    </div>
  );
}