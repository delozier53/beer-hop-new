import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Link } from "wouter";
import type { Event } from "@shared/schema";

interface EventWithBrewery extends Event {
  brewery: {
    name: string;
    id: string;
  } | null;
}

export default function Events() {
  const { data: events = [], isLoading } = useQuery<EventWithBrewery[]>({
    queryKey: ["/api/events"],
  });

  const formatEventDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="hero-banner from-amber to-orange-500">
          <div className="hero-overlay" />
          <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-2xl font-bold">Special Events</h1>
            <p className="text-sm opacity-90">Discover brewery events near you</p>
          </div>
        </div>
        <div className="px-6 py-6 space-y-4">
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
      {/* Hero Banner */}
      <div 
        className="hero-banner from-amber to-orange-500"
        style={{
          backgroundImage: `linear-gradient(rgba(245, 158, 11, 0.7), rgba(251, 146, 60, 0.7)), url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400')`
        }}
      >
        <div className="hero-overlay" />
        <div className="absolute bottom-4 left-4 text-white">
          <h1 className="text-2xl font-bold">Special Events</h1>
          <p className="text-sm opacity-90">Discover brewery events near you</p>
        </div>
      </div>

      <div className="px-6 py-6">
        <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>

        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No events scheduled</p>
            <p className="text-sm">Check back soon for upcoming brewery events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Link key={event.id} href={`/event/${event.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex">
                    <img 
                      src={event.image} 
                      alt={event.name}
                      className="w-24 h-24 object-cover"
                    />
                    <div className="flex-1 p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {event.name}
                      </h3>
                      <p className="text-sm text-amber font-medium mb-1">
                        {event.brewery?.name || 'Unknown Brewery'}
                      </p>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span className="mr-3">{formatEventDate(event.date)}</span>
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{event.startTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={event.ticketRequired ? "default" : "secondary"}
                          className={event.ticketRequired ? "bg-amber text-white" : "bg-green-100 text-green-800"}
                        >
                          {event.ticketRequired ? "Ticketed Event" : "Free Event"}
                        </Badge>
                        <div className="flex items-center text-xs text-gray-500">
                          <Users className="w-3 h-3 mr-1" />
                          <span>{event.attendees} attending</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
