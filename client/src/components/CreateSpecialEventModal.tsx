import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import type { UploadResult } from "@uppy/core";

interface CreateSpecialEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreateEventForm {
  company: string;
  event: string;
  details: string;
  time: string;
  date: string;
  address: string;
  location: string;
  rsvpRequired: boolean;
  ticketLink: string;
  logo: string;
}

export function CreateSpecialEventModal({ open, onOpenChange }: CreateSpecialEventModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CreateEventForm>({
    company: "",
    event: "",
    details: "",
    time: "",
    date: "",
    address: "",
    location: "",
    rsvpRequired: false,
    ticketLink: "",
    logo: "",
  });

  const [uploadedImagePreview, setUploadedImagePreview] = useState<string>("");

  const handleInputChange = (field: keyof CreateEventForm, value: string | boolean) => {
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

  const handleUploadComplete = (result: UploadResult<any, any>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageUrl = uploadedFile.uploadURL;
      
      // Update form data with the uploaded image URL
      setFormData(prev => ({ ...prev, logo: imageUrl }));
      setUploadedImagePreview(imageUrl);
      
      toast({
        title: "Image uploaded successfully",
        description: "Event image has been uploaded and will be saved with the event.",
      });
    }
  };

  const createEventMutation = useMutation({
    mutationFn: async (eventData: CreateEventForm) => {
      const response = await fetch('/api/special-events', {
        method: 'POST',
        headers: {
          'x-user-id': 'joshuamdelozier',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create event');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event created successfully",
        description: "Your special event has been created and is now visible to all users.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/special-events"] });
      onOpenChange(false);
      // Reset form
      setFormData({
        company: "",
        event: "",
        details: "",
        time: "",
        date: "",
        address: "",
        location: "",
        rsvpRequired: false,
        ticketLink: "",
        logo: "",
      });
      setUploadedImagePreview("");
    },
    onError: (error) => {
      toast({
        title: "Failed to create event",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.company || !formData.event || !formData.details || !formData.date || !formData.time) {
      toast({
        title: "Please fill in all required fields",
        description: "Company, Event Name, Details, Date, and Time are required.",
        variant: "destructive",
      });
      return;
    }

    createEventMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Special Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange("company", e.target.value)}
              placeholder="Company or organization name"
              required
            />
          </div>

          <div>
            <Label htmlFor="event">Event Name *</Label>
            <Input
              id="event"
              value={formData.event}
              onChange={(e) => handleInputChange("event", e.target.value)}
              placeholder="Name of the event"
              required
            />
          </div>

          <div>
            <Label htmlFor="details">Event Details *</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => handleInputChange("details", e.target.value)}
              placeholder="Detailed description of the event"
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                value={formData.time}
                onChange={(e) => handleInputChange("time", e.target.value)}
                placeholder="e.g., 7:00 PM - 10:00 PM"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Full address"
              required
            />
          </div>

          <div>
            <Label htmlFor="location">Location (Leave blank if in your taproom)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="Specific location details (optional)"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rsvpRequired"
              checked={formData.rsvpRequired}
              onCheckedChange={(checked) => handleInputChange("rsvpRequired", checked as boolean)}
            />
            <Label htmlFor="rsvpRequired">RSVP Required</Label>
          </div>

          <div>
            <Label htmlFor="ticketLink">Ticket Link</Label>
            <Input
              id="ticketLink"
              value={formData.ticketLink}
              onChange={(e) => handleInputChange("ticketLink", e.target.value)}
              placeholder="Link to purchase tickets (optional)"
            />
          </div>

          <div>
            <Label>Event Image</Label>
            <div className="mt-2">
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="w-full bg-[#ff55e1] hover:bg-[#ff55e1]/90 text-white"
              >
                <span>Upload Event Image</span>
              </ObjectUploader>
              
              {uploadedImagePreview && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Image preview:</p>
                  <img 
                    src={uploadedImagePreview} 
                    alt="Event preview"
                    className="w-full h-32 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEventMutation.isPending}
              className="flex-1 bg-[#80bc04] hover:bg-[#80bc04]/90 text-white"
            >
              {createEventMutation.isPending ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}