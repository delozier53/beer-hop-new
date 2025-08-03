import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SpecialEvent } from "@shared/schema";

interface SpecialEventEditModalProps {
  event: SpecialEvent;
  isOpen: boolean;
  onClose: () => void;
}

export function SpecialEventEditModal({ event, isOpen, onClose }: SpecialEventEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    company: event.company,
    event: event.event,
    details: event.details,
    time: event.time,
    date: event.date,
    address: event.address,
    location: event.location || '',
    logo: event.logo || '',
    taproom: event.taproom,
    rsvpRequired: event.rsvpRequired,
    ticketLink: event.ticketLink || '',
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<SpecialEvent>) => {
      // Get current user ID - in a real app this would come from auth context
      const userId = 'joshuamdelozier'; // Hardcoded for demo - replace with actual auth
      return apiRequest(`/api/special-events/${event.id}`, {
        method: 'PUT',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/special-events'] });
      queryClient.invalidateQueries({ queryKey: [`/api/special-events/${event.id}`] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates = {
      ...formData,
      location: formData.location || null,
      logo: formData.logo || null,
      ticketLink: formData.ticketLink || null,
    };
    
    updateMutation.mutate(updates);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Special Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="event">Event Name</Label>
              <Input
                id="event"
                value={formData.event}
                onChange={(e) => handleInputChange('event', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="details">Event Details</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => handleInputChange('details', e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., Specific venue name"
            />
          </div>

          <div>
            <Label htmlFor="logo">Logo/Image URL</Label>
            <Input
              id="logo"
              value={formData.logo}
              onChange={(e) => handleInputChange('logo', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <Label htmlFor="ticketLink">Ticket Link (Optional)</Label>
            <Input
              id="ticketLink"
              value={formData.ticketLink}
              onChange={(e) => handleInputChange('ticketLink', e.target.value)}
              placeholder="https://example.com/tickets"
            />
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="taproom"
                checked={formData.taproom}
                onCheckedChange={(checked) => handleInputChange('taproom', checked)}
              />
              <Label htmlFor="taproom">Taproom Event</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rsvpRequired"
                checked={formData.rsvpRequired}
                onCheckedChange={(checked) => handleInputChange('rsvpRequired', checked)}
              />
              <Label htmlFor="rsvpRequired">RSVP Required</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="bg-[#80bc04] hover:bg-[#80bc04]/90 text-white"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}