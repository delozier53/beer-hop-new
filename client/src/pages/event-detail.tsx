import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit, Calendar, Clock, Ticket, Users } from "lucide-react";
import { useParams, useLocation } from "wouter";
import type { Event } from "@shared/schema";

interface EventWithBrewery extends Event {
  brewery: {
    name: string;
    id: string;
  } | null;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: event, isLoading } = useQuery<EventWithBrewery>({
    queryKey: ["/api/events", id],
  });

  const formatEventDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const handleBuyTickets = () => {
    // Mock ticket purchasing flow
    alert('Redirecting to ticket purchase...');
  };

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="h-64 bg-gray-300 animate-pulse relative">
          <button 
            className="absolute top-4 left-4 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white"
            onClick={() => navigate("/events")}
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

  if (!event) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container pb-20">
      <div className="relative">
        {/* Full Size Event Image */}
        <div 
          className="h-64 bg-cover bg-center relative"
          style={{ 
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${event.image}')`
          }}
        >
          <button 
            className="absolute top-4 left-4 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white"
            onClick={() => navigate("/events")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <p className="text-amber-200">{event.brewery?.name}</p>
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Event Details */}
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{formatEventDate(event.date)}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>{event.startTime} - {event.endTime}</span>
              </div>
            </div>

            <Card className="mb-4 border-amber bg-amber/5">
              <CardContent className="p-4">
                <h3 className="font-semibold text-amber-dark mb-2">Event Description</h3>
                <p className="text-amber-dark text-sm">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* Ticket Button */}
            {event.ticketRequired && (
              <Button 
                className="w-full bg-amber hover:bg-amber-dark text-white py-4 text-lg mb-6"
                onClick={handleBuyTickets}
              >
                <Ticket className="w-5 h-5 mr-2" />
                Buy Tickets - ${event.ticketPrice}
              </Button>
            )}

            {/* Extra Photos */}
            {event.photos.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Event Photos</h3>
                <div className="grid grid-cols-2 gap-3">
                  {event.photos.map((photo, index) => (
                    <img 
                      key={index}
                      src={photo} 
                      alt={`Event photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Attendees */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Attendees</h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{event.attendees} people attending</span>
                  </div>
                </div>
                
                {/* Sample attendee avatars */}
                <div className="flex -space-x-2">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40" 
                    alt="Attendee" 
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1494790108755-2616b612b47c?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40" 
                    alt="Attendee" 
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40" 
                    alt="Attendee" 
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                  <div className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                    +{Math.max(0, event.attendees - 3)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
