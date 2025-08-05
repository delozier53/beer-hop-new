import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { useLocationPermission } from '@/hooks/useLocationPermission';

interface LocationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionGranted?: () => void;
}

export function LocationPermissionDialog({ 
  open, 
  onOpenChange, 
  onPermissionGranted 
}: LocationPermissionDialogProps) {
  const { permission, requestPermission, error, hasUserPermanentlyDenied } = useLocationPermission();
  const [isRequesting, setIsRequesting] = useState(false);

  // Don't show dialog if user has permanently denied
  if (hasUserPermanentlyDenied()) {
    return null;
  }

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    const granted = await requestPermission();
    setIsRequesting(false);
    
    if (granted) {
      onPermissionGranted?.();
      onOpenChange(false);
    }
  };

  const getIcon = () => {
    switch (permission) {
      case 'granted':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'denied':
        return <AlertCircle className="w-12 h-12 text-red-500" />;
      default:
        return <MapPin className="w-12 h-12 text-[#80bc04]" />;
    }
  };

  const getTitle = () => {
    switch (permission) {
      case 'granted':
        return 'Location Access Granted';
      case 'denied':
        return 'Location Access Denied';
      default:
        return 'Enable Location Access';
    }
  };

  const getDescription = () => {
    switch (permission) {
      case 'granted':
        return 'Great! You can now check in at breweries when you visit them.';
      case 'denied':
        return 'To check in at breweries, please enable location access in your browser settings and refresh the page.';
      default:
        return 'Beer Hop would like to use your current location. This app will use your precise location because Beer Hop currently has access to your precise location.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <DialogTitle className="text-xl font-bold">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 leading-relaxed">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 mt-6">
          {permission === 'granted' ? (
            <Button 
              onClick={() => onOpenChange(false)}
              className="bg-[#80bc04] hover:bg-[#80bc04]/90 text-white"
            >
              Continue
            </Button>
          ) : permission === 'denied' ? (
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()}
                className="bg-[#80bc04] hover:bg-[#80bc04]/90 text-white"
              >
                Refresh Page
              </Button>
              <Button 
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Continue Without Location
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button 
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="bg-[#80bc04] hover:bg-[#80bc04]/90 text-white"
              >
                {isRequesting ? 'Requesting Access...' : 'Allow Location Access'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Maybe Later
              </Button>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center mt-4">
          <p className="flex items-center gap-1 justify-center">
            <MapPin className="w-3 h-3" />
            Your location is only used for check-in verification
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}