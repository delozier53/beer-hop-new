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
import { ObjectUploader } from "./ObjectUploader";
import type { UploadResult } from "@uppy/core";

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
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-events'] });
      queryClient.invalidateQueries({ queryKey: [`/api/weekly-events/${defaultDay}`] });
      onClose();
      form.reset();
      setUploadedImageUrl('');
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
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760} // 10MB
                    onGetUploadParameters={async () => {
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
                    }}
                    onComplete={(result) => {
                      if (result.successful && result.successful.length > 0) {
                        const uploadedFile = result.successful[0];
                        if (uploadedFile.uploadURL) {
                          const objectPath = convertUploadUrlToObjectPath(uploadedFile.uploadURL);
                          setUploadedImageUrl(objectPath);
                          toast({
                            title: "Photo Uploaded",
                            description: "Event photo uploaded successfully! You can now create the event.",
                          });
                        }
                      }
                    }}
                    buttonClassName="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-dashed border-gray-300 h-12"
                  >
                    📷 {uploadedImageUrl ? 'Change Event Photo' : 'Upload Event Photo'}
                  </ObjectUploader>
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