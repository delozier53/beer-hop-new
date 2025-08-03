import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, ExternalLink, ArrowLeft, Edit } from "lucide-react";
import { Link, useParams } from "wouter";
import { SpecialEventEditModal } from "@/components/special-event-edit-modal";
import type { SpecialEvent } from "@shared/schema";

// Helper function to format date from YYYY-MM-DD to "Month Day, Year"
function formatEventDate(dateString: string): string {
  try {
    // If already in the correct format (contains comma), return as is
    if (dateString.includes(',')) {
      return dateString;
    }
    
    // Parse the date string as YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return dateString; // Return original if parsing fails
  }
}

export default function SpecialEventDetail() {
  const { id } = useParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const { data: event, isLoading } = useQuery<SpecialEvent>({
    queryKey: [`/api/special-events/${id}`],
  });

  // Get current user - in a real app this would come from auth context
  const { data: currentUser } = useQuery<any>({
    queryKey: ['/api/users/joshuamdelozier'], // Hardcoded for demo
  });

  // Check if user can edit this event
  const canEdit = currentUser && event && (
    currentUser.role === 'admin' || // Master admin
    event.ownerId === currentUser.id // Event owner
  );

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="px-6 py-6 space-y-4">
          <div className="animate-pulse">
            <div className="w-full h-64 bg-gray-300 rounded mb-4"></div>
            <div className="h-6 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mobile-container">
        <div className="px-6 py-6 text-center">
          <h2 className="text-xl font-bold mb-4">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
          <Link href="/events">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container pb-20">
      <div className="px-6 py-6">
        {/* Header with Back Button and Edit Button */}
        <div className="flex justify-between items-center mb-4">
          <Link href="/events">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
          
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="border-[#80bc04] text-[#80bc04] hover:bg-[#80bc04] hover:text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Event
            </Button>
          )}
        </div>

        <Card className="overflow-hidden">
          {/* Full Event Photo - shows complete image regardless of dimensions */}
          {event.logo && (
            <div className="w-full">
              <img 
                src={event.logo} 
                alt={event.event}
                className="w-full h-auto"
              />
            </div>
          )}
          
          <CardContent className="p-6">
            {/* Event Name */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {event.event}
            </h1>
            
            {/* Company */}
            <p className="text-lg text-[#80bc04] font-semibold mb-4">
              {event.company}
            </p>

            {/* Date and Time */}
            <div className="flex items-center text-gray-700 mb-3">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="mr-4 font-medium">{formatEventDate(event.date)}</span>
              <Clock className="w-5 h-5 mr-2" />
              <span className="font-medium">{event.time}</span>
            </div>

            {/* Location */}
            <div className="flex items-start text-gray-700 mb-4">
              <MapPin className="w-5 h-5 mr-2 mt-0.5" />
              <div>
                <p className="font-medium">
                  {event.location || event.address}
                </p>
                {event.location && event.address && event.location !== event.address && (
                  <p className="text-sm text-gray-600">
                    {event.address}
                  </p>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge 
                variant={event.rsvpRequired ? "default" : "secondary"}
                className={event.rsvpRequired ? "bg-[#ff55e1] text-white" : "bg-green-100 text-green-800"}
              >
                {event.rsvpRequired ? "RSVP Required" : "Open Event"}
              </Badge>
              
              {event.taproom && (
                <Badge className="bg-[#80bc04] text-white">
                  Taproom Event
                </Badge>
              )}
            </div>

            {/* Event Details */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Event Details</h3>
              <div className="prose prose-sm text-gray-700 whitespace-pre-wrap">
                {event.details}
              </div>
            </div>

            {/* Ticket Link */}
            {event.ticketLink && (
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="bg-[#ff55e1] hover:bg-[#ff55e1]/90 text-white"
                  onClick={() => window.open(event.ticketLink!, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get Tickets
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Modal */}
        {event && (
          <SpecialEventEditModal
            event={event}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}