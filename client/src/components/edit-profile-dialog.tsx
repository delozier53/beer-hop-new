import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Camera, Settings, ImageIcon } from "lucide-react";
import type { User } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import defaultHeaderImage from "@assets/BH Drip_1754199454816.png";

interface EditProfileDialogProps {
  user: User;
  userId: string;
}

export function EditProfileDialog({ user, userId }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(user.username || user.name);
  const [profileImage, setProfileImage] = useState(user.profileImage || "");
  const [headerImage, setHeaderImage] = useState(user.headerImage || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { username?: string; profileImage?: string; headerImage?: string }) => {
      const response = await apiRequest("PUT", `/api/users/${userId}`, updates);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: error.message.includes('too large') 
          ? "Image file is too large. Please choose a smaller image."
          : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: { username?: string; profileImage?: string; headerImage?: string } = {};
    
    if (username !== (user.username || user.name)) {
      updates.username = username;
    }
    
    if (profileImage !== user.profileImage) {
      updates.profileImage = profileImage || undefined;
    }
    
    if (headerImage !== user.headerImage) {
      updates.headerImage = headerImage || undefined;
    }
    
    if (Object.keys(updates).length > 0) {
      updateProfileMutation.mutate(updates);
    } else {
      setOpen(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to a file service
      // For now, we'll use a placeholder URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img 
                src={profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
              />
              <label 
                htmlFor="photo-upload" 
                className="absolute bottom-0 right-0 w-8 h-8 bg-hops hover:bg-hops-dark text-white rounded-full flex items-center justify-center cursor-pointer transition-colors"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Click the camera icon to change your photo
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              minLength={3}
              maxLength={20}
            />
          </div>

          {/* Header Image Upload */}
          <div className="space-y-2">
            <Label>Header Image</Label>
            <div className="flex flex-col space-y-3">
              <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={headerImage || defaultHeaderImage} 
                  alt="Header preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5242880} // 5MB
                onGetUploadParameters={async () => {
                  const response = await apiRequest("POST", "/api/objects/upload");
                  const data = await response.json();
                  return {
                    method: "PUT" as const,
                    url: data.uploadURL,
                  };
                }}
                onComplete={(result) => {
                  if (result.successful && result.successful.length > 0) {
                    const uploadedFile = result.successful[0];
                    if (uploadedFile.uploadURL) {
                      // Normalize the upload URL to object path
                      apiRequest("POST", "/api/objects/normalize", { url: uploadedFile.uploadURL })
                        .then(res => res.json())
                        .then(data => setHeaderImage(data.objectPath || uploadedFile.uploadURL))
                        .catch(err => {
                          console.error("Error normalizing path:", err);
                          setHeaderImage(uploadedFile.uploadURL);
                        });
                    }
                  }
                }}
                buttonClassName="w-full bg-[#ff55e1] hover:bg-[#ff55e1]/90 text-white"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>Upload Header Image</span>
                </div>
              </ObjectUploader>
            </div>
          </div>

          {/* Profile Image URL (Advanced) */}
          <div className="space-y-2">
            <Label htmlFor="profileImage">Profile Image URL (Optional)</Label>
            <Input
              id="profileImage"
              type="url"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              placeholder="https://example.com/your-photo.jpg"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateProfileMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-hops hover:bg-hops-dark text-white"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}