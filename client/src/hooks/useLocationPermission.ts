import { useState, useEffect } from 'react';

export interface LocationPermissionState {
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  isLoading: boolean;
  error: string | null;
}

export function useLocationPermission() {
  const [state, setState] = useState<LocationPermissionState>({
    permission: 'unknown',
    isLoading: true,
    error: null
  });

  // Check if user has previously denied permission permanently
  const hasUserPermanentlyDenied = () => {
    return localStorage.getItem('location-permission-denied') === 'true';
  };

  const checkPermission = async () => {
    try {
      if (!navigator.geolocation) {
        setState({
          permission: 'denied',
          isLoading: false,
          error: 'Geolocation is not supported by this browser'
        });
        return;
      }

      // Check if permissions API is available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setState({
          permission: permission.state,
          isLoading: false,
          error: null
        });

        // Listen for permission changes
        permission.addEventListener('change', () => {
          setState(prev => ({
            ...prev,
            permission: permission.state
          }));
        });
      } else {
        // Fallback for browsers without permissions API
        setState({
          permission: 'prompt',
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      setState({
        permission: 'unknown',
        isLoading: false,
        error: 'Failed to check location permission'
      });
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setState(prev => ({
          ...prev,
          permission: 'denied',
          error: 'Geolocation is not supported'
        }));
        resolve(false);
        return;
      }

      // Request location to trigger permission prompt
      navigator.geolocation.getCurrentPosition(
        () => {
          setState(prev => ({
            ...prev,
            permission: 'granted',
            error: null
          }));
          // Clear any previous denial since user has now granted permission
          localStorage.removeItem('location-permission-denied');
          resolve(true);
        },
        (error) => {
          let errorMessage = 'Location access denied';
          let permission: 'denied' | 'unknown' = 'denied';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              permission = 'denied';
              // Store permanent denial in localStorage
              localStorage.setItem('location-permission-denied', 'true');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              permission = 'unknown';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              permission = 'unknown';
              break;
          }

          setState(prev => ({
            ...prev,
            permission,
            error: errorMessage
          }));
          resolve(false);
        },
        {
          timeout: 10000,
          enableHighAccuracy: false
        }
      );
    });
  };

  useEffect(() => {
    checkPermission();
  }, []);

  return {
    ...state,
    requestPermission,
    checkPermission,
    hasUserPermanentlyDenied
  };
}