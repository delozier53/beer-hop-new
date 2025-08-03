import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { insertWeeklyEventSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";


const formSchema = insertWeeklyEventSchema.extend({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
}).transform((data) => ({
  ...data,
  event: data.title, // Use title as the event type
  eventPhoto: data.eventPhoto || undefined,
}));

interface WeeklyEventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDay?: string;
}

interface Brewery {
  id: string;
  name: string;
  address: string;
}

export default function WeeklyEventCreateModal({
  isOpen,
  onClose,
  defaultDay,
}: WeeklyEventCreateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: breweries = [] } = useQuery<Brewery[]>({
    queryKey: ['/api/breweries'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      day: defaultDay as any || 'monday',
      brewery: '',
      event: '',
      title: '',
      details: '',
      time: '',
      eventPhoto: undefined,
      address: '',
    },
  });

  // Auto-populate address when brewery changes
  const handleBreweryChange = (breweryName: string) => {
    const selectedBrewery = breweries.find(b => b.name === breweryName);
    if (selectedBrewery) {
      form.setValue('address', selectedBrewery.address);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10485760) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Get upload URL
      const uploadResponse = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { uploadURL } = await uploadResponse.json();

      // Upload file
      const fileUploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!fileUploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const objectPath = convertUploadUrlToObjectPath(uploadURL);
      setUploadedImageUrl(objectPath);
      
      toast({
        title: "Photo Uploaded",
        description: "Event photo uploaded successfully!",
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const createWeeklyEventMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Use uploaded image URL if available
      const finalData = {
        ...data,
        eventPhoto: uploadedImageUrl || data.eventPhoto,
      };

      const response = await fetch('/api/weekly-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'joshuamdelozier', // TODO: Make this dynamic based on actual user
        },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        throw new Error('Failed to create weekly event');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Weekly event created successfully!",
      });
      // Reset form and close modal first
      form.reset();
      setUploadedImageUrl('');
      onClose();
      
      // Force refresh the data immediately
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-events'] });
      queryClient.invalidateQueries({ queryKey: [`/api/weekly-events/${defaultDay}`] });
      
      // Force refetch to get the latest data
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [`/api/weekly-events/${defaultDay}`] });
      }, 200);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create weekly event. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating weekly event:', error);
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createWeeklyEventMutation.mutate(data);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Weekly Event</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                        <SelectItem value="sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brewery"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brewery</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      handleBreweryChange(value);
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brewery" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {breweries.map((brewery) => (
                          <SelectItem key={brewery.id} value={brewery.name}>
                            {brewery.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter event details..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 7:00 PM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto-populated from brewery" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Event Photo (Optional)</label>
                <div className="mt-2">
                  <input
                    type="file"
                    id="eventPhoto"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-dashed border-gray-300"
                    onClick={() => document.getElementById('eventPhoto')?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>⏳ Uploading...</>
                    ) : uploadedImageUrl ? (
                      <>📷 Change Event Photo</>
                    ) : (
                      <>📷 Upload Event Photo</>
                    )}
                  </Button>
                  {uploadedImageUrl && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-700">✓ Photo uploaded successfully</p>
                      <button 
                        type="button"
                        onClick={() => setUploadedImageUrl('')}
                        className="text-xs text-red-600 hover:text-red-800 mt-1"
                      >
                        Remove photo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#1a5632] hover:bg-[#1a5632]/90"
                disabled={createWeeklyEventMutation.isPending}
              >
                {createWeeklyEventMutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}