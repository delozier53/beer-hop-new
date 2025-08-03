import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { Link, useParams } from "wouter";

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

export default function WeeklyEventsDay() {
  const { day } = useParams();
  
  const { data: weeklyEvents = [], isLoading } = useQuery<WeeklyEvent[]>({
    queryKey: [`/api/weekly-events/${day}`],
  });

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
        <div className="flex items-center mb-6">
          <Link href="/events">
            <Button variant="ghost" size="sm" className="mr-3">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{dayName} Events</h1>
        </div>

        {/* Events List */}
        {weeklyEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No events scheduled</h3>
            <p>Check back later for {dayName} events!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {weeklyEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
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
                    <div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}