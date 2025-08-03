import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { SpecialEvent } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

interface SpecialEventEditModalProps {
  event: SpecialEvent;
  isOpen: boolean;
  onClose: () => void;
}

export function SpecialEventEditModal({ event, isOpen, onClose }: SpecialEventEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    company: event.company,
    event: event.event,
    details: event.details,
    time: event.time,
    date: event.date,
    address: event.address,
    location: event.location || '',
    logo: event.logo || '',
    rsvpRequired: event.rsvpRequired,
    ticketLink: event.ticketLink || '',
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<SpecialEvent>) => {
      // Get current user ID - in a real app this would come from auth context
      const userId = 'joshuamdelozier'; // Hardcoded for demo - replace with actual auth
      
      const response = await fetch(`/api/special-events/${event.id}`, {
        method: 'PUT',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update event');
      }
      
      return response.json();
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

  const handleUploadComplete = async (result: UploadResult<any, any>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageUrl = uploadedFile.uploadURL;
      
      try {
        // Process the uploaded image with ACL policy
        const response = await fetch('/api/event-images', {
          method: 'PUT',
          headers: {
            'x-user-id': 'joshuamdelozier',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl }),
        });
        
        if (response.ok) {
          const data = await response.json();
          const normalizedPath = data.objectPath;
          
          // Update form data with the normalized object path
          handleInputChange('logo', normalizedPath);
          
          toast({
            title: "Image uploaded successfully",
            description: "Event image has been uploaded and will be saved.",
          });
        } else {
          throw new Error('Failed to process image');
        }
      } catch (error) {
        console.error('Error processing image:', error);
        toast({
          title: "Image processing failed",
          description: "Please try uploading again.",
          variant: "destructive",
        });
      }
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const userId = 'joshuamdelozier';
      
      const response = await fetch(`/api/special-events/${event.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete event');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "The special event has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/special-events'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const handleDeleteConfirm = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Special Event</DialogTitle>
          <DialogDescription>
            Update the information for this special event.
          </DialogDescription>
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
            <Label htmlFor="location">Location (Leave blank if in your taproom)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., Specific venue name"
            />
          </div>

          <div>
            <Label htmlFor="logo">Event Image</Label>
            <div className="space-y-3">
              {formData.logo && (
                <div className="w-full">
                  <img 
                    src={formData.logo} 
                    alt="Current event image"
                    className="w-full h-32 object-cover rounded-md border"
                    onError={(e) => {
                      // If image fails to load, hide it
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="w-full bg-[#ff55e1] hover:bg-[#ff55e1]/90 text-white"
              >
                <span>Upload New Image</span>
              </ObjectUploader>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rsvpRequired"
              checked={formData.rsvpRequired}
              onCheckedChange={(checked) => handleInputChange('rsvpRequired', checked)}
            />
            <Label htmlFor="rsvpRequired">RSVP Required</Label>
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

          <div className="flex justify-between pt-4">
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete Event"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                  <AlertDialogDescription className="sr-only">
                    Confirm deletion of this event
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteConfirm}>OK</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <div className="flex space-x-2">
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
          </div>
        </form>
      </DialogContent>

      {/* Custom Delete Confirmation Dialog */}
      
    </Dialog>
  );
}