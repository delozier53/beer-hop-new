import { useState, useEffect } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    // Check for cached location first (valid for 10 minutes)
    const cachedLocation = localStorage.getItem('beer-hop-location');
    const cacheTimestamp = localStorage.getItem('beer-hop-location-timestamp');
    
    if (cachedLocation && cacheTimestamp) {
      const cacheAge = Date.now() - parseInt(cacheTimestamp);
      if (cacheAge < 10 * 60 * 1000) { // 10 minutes
        try {
          const parsedLocation = JSON.parse(cachedLocation);
          setLocation({
            ...parsedLocation,
            loading: false,
          });
          return;
        } catch (error) {
          console.error('Error parsing cached location:', error);
          localStorage.removeItem('beer-hop-location');
          localStorage.removeItem('beer-hop-location-timestamp');
        }
      }
    }

    if (!navigator.geolocation) {
      setLocation({
        latitude: null,
        longitude: null,
        error: 'Geolocation is not supported by this browser.',
        loading: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
        };
        
        setLocation({
          ...newLocation,
          loading: false,
        });
        
        // Cache the location
        localStorage.setItem('beer-hop-location', JSON.stringify(newLocation));
        localStorage.setItem('beer-hop-location-timestamp', Date.now().toString());
      },
      (error) => {
        let errorMessage = 'An unknown error occurred.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'User denied the request for Geolocation.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
        }
        setLocation({
          latitude: null,
          longitude: null,
          error: errorMessage,
          loading: false,
        });
      },
      {
        enableHighAccuracy: false, // Changed to false for faster response
        timeout: 10000, // Increased timeout to 10 seconds
        maximumAge: 10 * 60 * 1000, // Allow cached position up to 10 minutes old
      }
    );
  }, []);

  return location;
}
